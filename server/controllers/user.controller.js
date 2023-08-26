const asyncHandler = require("express-async-handler");
const { isObjectIdOrHexString } = require("mongoose");
const jwt = require("jsonwebtoken");
const User = require("../models/user.model");
const { VARIABLE_NAME } = require("../utils/variables");
const { generateAccessToken, generateRefreshToken } = require("../middlewares/jwt.middleware");
const { sendMail } = require("../services/sendMail.services");
const crypto = require("crypto");

const register = asyncHandler(async (req, res) => {
  const { email, phone } = req.body;

  const user = await User.findOne({ $or: [{ email }, { phone }] });
  if (user) throw new Error("Email or phone already used in another account.");

  const newUser = await User.create(req.body);

  res.status(200).json({
    success: newUser ? true : false,
    message: newUser ? "Register is successfully." : "Cant not create new user.",
  });
});

const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email }).select("-refreshToken");
  if (!user) throw new Error("User not found.");

  const isMatchedPassword = await user.isMatchedPassword(password);

  if (!isMatchedPassword) throw new Error("Password is incorrect.");

  // remove password and role fields from response
  const { _id, password: dbPassword, role, refreshToken, ...userData } = user.toObject();

  // create authentication tokens
  const accessToken = generateAccessToken(_id, role);
  const newRefreshToken = generateRefreshToken(_id);

  // save refresh token
  const isSavedToken = await User.findByIdAndUpdate(_id, { refreshToken: newRefreshToken }, { new: true });
  if (!isSavedToken) throw new Error("Can not update refreshToken for user.");

  // send cookie to client
  res.cookie(VARIABLE_NAME.refreshToken, newRefreshToken, { httpOnly: true, maxAge: 1000 * 60 * 60 * 24 * 7 });

  res.status(200).json({ success: true, accessToken, user: { _id, ...userData } });
});

const getCurrentUser = asyncHandler(async (req, res) => {
  const { _id } = req.user;

  const user = await User.findById(_id).select("-role -password -refreshToken");
  if (!user) throw new Error("User not found.");

  res.status(200).json({ success: true, user });
});

// Defect -> no catch server error with status 5xx
const refreshToken = asyncHandler(async (req, res) => {
  try {
    const cookie = req.cookies;

    if (!cookie && cookie[VARIABLE_NAME.refreshToken]) throw new Error("No refresh token in cookies.");

    const refreshToken = cookie[VARIABLE_NAME.refreshToken];
    const userDecode = jwt.verify(refreshToken, process.env.JWT_SECRET);

    if (!userDecode._id) throw new Error("Invalid refreshToken.");
    if (!isObjectIdOrHexString(userDecode._id)) throw new Error("User ID is invalid.");

    const user = await User.findOne({ _id: userDecode._id, refreshToken });
    if (!user) throw new Error("No user found with refreshToken.");

    const newAccessToken = generateAccessToken(user._id, user.role);

    res.status(200).json({ success: true, accessToken: newAccessToken });
  } catch (error) {
    res.status(401).json({ success: false, message: error.message || "Invalid credential." });
  }
});

// Defect -> long response code, hard to read.
const refreshTokenV2 = asyncHandler(async (req, res) => {
  const cookie = req.cookies;

  if (!cookie && cookie[VARIABLE_NAME.refreshToken]) throw new Error("No refresh token in cookies.");

  const refreshToken = cookie[VARIABLE_NAME.refreshToken];

  jwt.verify(refreshToken, process.env.JWT_SECRET, async (error, userDecode) => {
    if (error) {
      return res.status(401).json({ success: false, accessToken: error.message });
    }

    if (!userDecode._id) {
      return res.status(401).json({ success: false, accessToken: "Invalid refreshToken." });
    }

    if (!isObjectIdOrHexString(userDecode._id)) {
      return res.status(401).json({ success: false, accessToken: "User ID is invalid" });
    }

    const user = await User.findOne({ _id: userDecode._id, refreshToken });

    if (!user) {
      return res.status(401).json({ success: false, accessToken: "No user found with refreshToken" });
    }

    const newAccessToken = generateAccessToken(user._id, user.role);

    res.status(200).json({ success: true, accessToken: newAccessToken });
  });
});

const logout = asyncHandler(async (req, res) => {
  const cookie = req.cookies;

  if (!cookie || !cookie.refreshToken) throw new Error("No refresh token in cookies");

  const user = await User.findOneAndUpdate({ refreshToken: cookie.refreshToken }, { refreshToken: "" }, { new: true });
  if (!user) throw new Error("Can not clear refresh token.");

  res.clearCookie(VARIABLE_NAME.refreshToken, { httpOnly: true, secure: true });

  res.status(200).json({ success: true, message: "User is logout." });
});

const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.query;

  const user = await User.findOne({ email });
  if (!user) throw new Error(`User was not found with email ${email}`);

  const resetToken = user.createPasswordChangedToken();
  await user.save();

  // config email
  const html = `Please click to this link to reset your password. This link will be expired in 15 minutes from now. <a href="${process.env.URL_SERVER}/api/user/reset_password/${resetToken}">Click here</a>`;
  const rs = await sendMail(email, "Forgot Password", html);

  return res.status(200).json({ success: true, rs });
});

const resetPassword = asyncHandler(async (req, res) => {
  const { password, token } = req.body;

  const passwordResetToken = crypto.createHash("sha256").update(token).digest("hex");
  const user = await User.findOne({ passwordResetToken, passwordResetExpires: { $gt: Date.now() } });
  if (!user) throw new Error("Invalid reset token");

  user.password = password;
  user.passwordResetToken = undefined;
  user.passwordChangedAt = Date.now();
  user.passwordResetExpires = undefined;

  await user.save();

  res.status(200).json({ success: user ? true : false, mes: user ? "Updated password" : "Something went wrong" });
});

const getUsers = asyncHandler(async (req, res) => {
  const users = await User.find({}).select("-password -role -refreshToken");

  res.status(200).json({ success: true, users });
});

const deleteUser = asyncHandler(async (req, res) => {
  const { _id } = req.params;

  const deletedUser = await User.findByIdAndDelete(_id);

  res.status(200).json({
    success: deletedUser ? true : false,
    message: deletedUser ? "User was deleted." : "User not found or not deleted.",
  });
});

const updateUser = asyncHandler(async (req, res) => {
  const { _id } = req.user;

  const updatedUser = await User.findByIdAndUpdate(_id, req.body, { new: true }).select("-password -role");

  res.status(200).json({
    success: updatedUser ? true : false,
    ...(updateUser && { user: updateUser }),
    ...(!updateUser && { message: "Can not update user." }),
  });
});

module.exports = {
  register,
  login,
  getCurrentUser,
  refreshToken,
  refreshTokenV2,
  logout,
  forgotPassword,
  resetPassword,
  getUsers,
  deleteUser,
  updateUser,
};

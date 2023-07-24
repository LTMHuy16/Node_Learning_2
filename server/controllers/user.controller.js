const asyncHandler = require("express-async-handler");
const { isObjectIdOrHexString } = require("mongoose");
const jwt = require("jsonwebtoken");
const User = require("../models/user.model");
const { VARIABLE_NAME } = require("../utils/variables");
const { generateAccessToken, generateRefreshToken } = require("../middlewares/jwt");

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
  const { _id, password: dbPassword, role, ...userData } = user.toObject();

  // create authentication tokens
  const accessToken = generateAccessToken(_id, role);
  const refreshToken = generateRefreshToken(_id);

  // save refresh token
  const isSavedToken = await User.findByIdAndUpdate(_id, { refreshToken }, { new: true });
  if (!isSavedToken) throw new Error("Cant not update refreshToken for user.");

  // send cookie to client
  res.cookie(VARIABLE_NAME.refreshToken, refreshToken, { httpOnly: true, maxAge: 1000 * 60 * 60 * 24 * 7 });

  res.status(200).json({ success: true, accessToken, user: userData });
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

});

module.exports = {
  register,
  login,
  getCurrentUser,
  refreshToken,
  refreshTokenV2,
  logout,
};

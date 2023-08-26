const jwt = require("jsonwebtoken");
const asyncHandler = require("express-async-handler");

const verifyAccessToken = asyncHandler(async (req, res, next) => {
  if (!req?.headers?.authorization?.startsWith("Bearer")) return res.status(401).json({ success: false, message: "Require authentication." });

  const token = req.headers.authorization.split(" ")[1];

  jwt.verify(token, process.env.JWT_SECRET, (error, decoded) => {
    if (error)
      return res.status(401).json({
        success: false,
        message: "Invalid access token",
      });

    req.user = decoded;
    next();
  });
});

const isAdmin = asyncHandler(async (req, res, next) => {
  const { role } = req.user;

  if (role != "admin") return res.status(401).json({ success: false, message: "This router required admin role." });

  next();
});

module.exports = { verifyAccessToken, isAdmin };

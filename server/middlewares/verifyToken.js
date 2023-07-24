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

module.exports = { verifyAccessToken };

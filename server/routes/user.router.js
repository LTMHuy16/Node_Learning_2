const router = require("express").Router();
const controller = require("../controllers/user.controller");
const { userRegisterValidator, userLoinValidator } = require("../validators/user.validator");
const { errorValidation } = require("../validators/errorHandler.validator");
const { verifyAccessToken } = require("../middlewares/verifyToken");

router.post("/register", userRegisterValidator, errorValidation, controller.register);

router.post("/login", userLoinValidator, errorValidation, controller.login);

router.get("/current", verifyAccessToken, controller.getCurrentUser);

router.get("/refresh_token", controller.refreshTokenV2);

router.get("/logout", controller.logout);

module.exports = router;

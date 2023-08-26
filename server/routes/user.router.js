const router = require("express").Router();
const controller = require("../controllers/user.controller");
const validator = require("../validators/user.validator");
const { errorValidation } = require("../validators/errorHandler.validator");
const { verifyAccessToken, isAdmin } = require("../middlewares/verifyToken.middleware");

router.get("/", [verifyAccessToken, isAdmin], controller.getUsers);

router.post("/register", [validator.register, errorValidation], controller.register);

router.post("/login", [validator.login, errorValidation], controller.login);

router.get("/current", verifyAccessToken, controller.getCurrentUser);

router.post("/refresh_token", controller.refreshTokenV2);

router.post("/logout", controller.logout);

router.post("/forgot_password", [validator.forgotPassword, errorValidation], controller.forgotPassword);

router.put("/reset_password", [validator.resetPassword, errorValidation], controller.resetPassword);

router.delete("/:_id", [verifyAccessToken, isAdmin, validator.deleteUser, errorValidation], controller.deleteUser);

router.put("/current", [verifyAccessToken, validator.update, errorValidation], controller.updateUser);

module.exports = router;

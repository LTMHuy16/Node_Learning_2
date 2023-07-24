const { validationResult } = require("express-validator");

const errorValidation = (req, res, next) => {
  const errors = validationResult(req).array();

  if (errors && errors.length > 0) res.status(400).json({ success: false, message: "Fields are empty or invalid.", errors });
  else next();
};

module.exports = { errorValidation };

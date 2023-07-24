const { checkSchema } = require("express-validator");

const userRegisterValidator = [
  checkSchema(
    {
      email: {
        notEmpty: { errorMessage: "Email must be required.", bail: true },
        isEmail: { errorMessage: "Email is invalid." },
      },
      password: {
        notEmpty: { errorMessage: "Password must be required.", bail: true },
      },
      lastname: {
        notEmpty: { errorMessage: "Last name must be required.", bail: true },
      },
      firstname: {
        notEmpty: { errorMessage: "First name must be required.", bail: true },
      },
      phone: {
        notEmpty: { errorMessage: "Phone must be required." },
        isMobilePhone: {
          options: ["vi-VN"],
          errorMessage: "Phone is invalid.",
        },
        errorMessage: "Must provide a valid US phone number.",
      },
    },
    ["body"]
  ),
];

const userLoinValidator = [
  checkSchema(
    {
      email: {
        notEmpty: { errorMessage: "Email must be required.", bail: true },
        isEmail: { errorMessage: "Email is invalid." },
      },
      password: {
        notEmpty: { errorMessage: "Password must be required.", bail: true },
      },
    },
    ["body"]
  ),
];

module.exports = { userRegisterValidator, userLoinValidator };

const { checkSchema } = require("express-validator");

const register = [
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

const login = [
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

const forgotPassword = [
  checkSchema(
    {
      email: {
        notEmpty: { errorMessage: "Email must be required.", bail: true },
        isEmail: { errorMessage: "Email is invalid." },
      },
    },
    ["query"]
  ),
];

const resetPassword = [
  checkSchema(
    {
      token: {
        notEmpty: { errorMessage: "Token must be required.", bail: true },
      },
      password: {
        notEmpty: { errorMessage: "Password must be required.", bail: true },
      },
    },
    ["body"]
  ),
];

const deleteUser = [
  checkSchema(
    {
      _id: {
        notEmpty: { errorMessage: "_id must be required.", bail: true },
        isMongoId: { errorMessage: "_id must be mongoose id." },
      },
    },
    ["params"]
  ),
];

const update = [
  checkSchema(
    {
      
      _id: {
        notEmpty: { errorMessage: "_id must be required.", bail: true },
        isMongoId: { errorMessage: "_id must be mongoose id." },
      },
    },
    ["body"]
  ),
];

module.exports = { register, login, forgotPassword, resetPassword, deleteUser, update };

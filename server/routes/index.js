const userRouter = require("./user.router");
const productRouter = require("./product.router");
const { notFound, errHandler } = require("../middlewares/errHandler.middleware");

const initRoutes = (app) => {
  app.use("/api/user", userRouter);
  // app.use("/api/product", productRouter);

  app.use(notFound);
  app.use(errHandler);
};

module.exports = initRoutes;
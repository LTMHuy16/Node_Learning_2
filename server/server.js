require("dotenv").config();
const express = require("express");
const dbConnect = require("./config/dbconnect.config");
const initRoutes = require("./routes");
const cookieParser = require("cookie-parser");
const port = process.env.PORT || 3000;

const app = express();

// CONFIG MIDDLEWARE
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// START SERVICES
dbConnect();
initRoutes(app);

// START SERVER
app.listen(port, () => {
  console.log("Server running on the port: " + port);
});

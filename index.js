const dbConnect = require("./app/configs/dbConfig");
const bodyParser = require("body-parser");
const express = require("express");
const seedRoles = require("./app/helpers/utils/seedRole");
const userRouter = require("./app/routers/user.router");
const blogRouter = require("./app/routers/blog.router");

const userPageRouter = require("./app/routers/userPage.router");
const blogPageRouter = require("./app/routers/blogPage.router");

const cookieParser = require("cookie-parser");
const globalCheckuser = require("./app/helpers/utils/global.checkuser");
require("dotenv").config();
const app = express();

const port = 8300;

dbConnect();
seedRoles();
app.use(bodyParser.json());
app.use(cookieParser());

// --- JWT decode middleware (global) ---
app.use(globalCheckuser);

app.use((req, res, next) => {
  console.log("middleware set user =>", req.user);
  res.locals.user = req.user || null;
  next();
});

//view
app.set("view engine", "ejs");
app.set("views", "views");
//
app.use(express.json());
app.use(express.urlencoded());

//route - api
app.use("/api/user", userRouter);
app.use("/api/blog", blogRouter);
//page
app.use(userPageRouter);
app.use(blogPageRouter);

app.listen(port, () => {
  console.log(`running on ${port}`);
});

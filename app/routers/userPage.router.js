const express = require("express");
const router = express.Router();

const UserPageController = require("../controllers/user_page.controller");
const checkPermission = require("../helpers/middlewares/checkPermission");
// Pages
router.get("/register", UserPageController.registerPage);
router.get("/login", UserPageController.loginPage);
router.get("/dashboard", checkPermission(), UserPageController.dashboardPage);
//action
router.post("/register", UserPageController.register);
router.post("/login", UserPageController.login);
router.get("/logout", UserPageController.logout);

module.exports = router;

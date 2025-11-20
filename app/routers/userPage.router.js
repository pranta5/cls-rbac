const express = require("express");
const router = express.Router();

const UserPageController = require("../controllers/user_page.controller");
// Pages
router.get("/register", UserPageController.registerPage);
router.get("/login", UserPageController.loginPage);
router.get("/dashboard", UserPageController.dashboardPage);
//action
router.post("/register", UserPageController.register);
router.post("/login", UserPageController.login);

module.exports = router;

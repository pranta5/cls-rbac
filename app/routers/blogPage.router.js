const express = require("express");
const router = express.Router();

const BlogPageController = require("../controllers/blog_page.controller");

const checkPermission = require("../helpers/middlewares/checkPermission");
const blog_pageController = require("../controllers/blog_page.controller");
//pages
router.get("/", blog_pageController.home);

router.get(
  "/blog/create",
  checkPermission("create_record"),
  BlogPageController.createPage
);

router.post(
  "/blog/create",
  checkPermission("create_record"),
  BlogPageController.create
);
router.get(
  "/blog/edit/:id",
  checkPermission("update_record"),
  BlogPageController.editPage
);

router.post(
  "/update/:id",
  checkPermission("update_record"),
  BlogPageController.edit
);
router.post(
  "/blog/delete/:id",
  checkPermission(),
  BlogPageController.deletePage
);

module.exports = router;

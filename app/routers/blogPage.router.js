const express = require("express");
const router = express.Router();

const BlogPageController = require("../controllers/blog_page.controller");
const BlogController = require("../controllers/blog.controller");

const checkPermission = require("../helpers/middlewares/checkPermission");

router.get(
  "/blog/create",
  checkPermission("create_record"),
  BlogPageController.createPage
);

router.get(
  "/blog/edit/:id",
  checkPermission("update_record"),
  BlogPageController.editPage
);

router.post(
  "/blog/create",
  checkPermission("create_record"),
  BlogPageController.createPage
);

router.post(
  "/update/:id",
  checkPermission("update_record"),
  BlogPageController.editPage
);
router.post(
  "blog/delete/:id",
  checkPermission("delete_record"),
  BlogPageController.deletePage
);

module.exports = router;

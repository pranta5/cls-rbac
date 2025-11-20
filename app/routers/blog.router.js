const express = require("express");
const router = express.Router();

const BlogController = require("../controllers/blog.controller");
const checkPermission = require("../helpers/middlewares/checkPermission");

router.post("/create", checkPermission("create_record"), BlogController.create);

router.get("/", checkPermission("read_record"), BlogController.list);

router.get("/:id", checkPermission("read_record"), BlogController.getById);

router.put(
  "/update/:id",
  checkPermission("update_record"),
  BlogController.update
);

router.delete(
  "/delete/:id",
  checkPermission("delete_record"),
  BlogController.delete
);

module.exports = router;

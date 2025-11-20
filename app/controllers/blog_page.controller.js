const blogModel = require("../models/blog.model");

class BlogPageController {
  // Render CREATE page
  async createPage(req, res) {
    try {
      const { title, des } = req.body;
      const writerId = req.user.id;

      if (!title || !des) {
        return res.render("blog/create", {
          title: "Create Blog",
          error: "All fields are required",
        });
      }

      await blogModel.create({
        title,
        des,
        writer: writerId,
      });

      return res.redirect("/dashboard?success=Blog created successfully");
    } catch (error) {
      console.log("Create blog error:", error);
      return res.render("blog/create", {
        title: "Create Blog",
        error: "Server error",
      });
    }
  }

  // Render EDIT page
  async editPage(req, res) {
    try {
      const { id } = req.params;
      const blog = await blogModel.findById(id).lean();

      if (!blog) {
        return res.redirect("/dashboard?error=Blog not found");
      }

      res.render("blog/edit", {
        title: "Edit Blog",
        blog,
        error: null,
      });
    } catch (error) {
      console.log("Edit page error:", error);
      res.redirect("/dashboard?error=Server error");
    }
  }
  async deletePage(req, res) {
    try {
      const { id } = req.params;

      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.redirect("/dashboard?error=Invalid blog id");
      }

      const blog = await blogModel.findById(id).lean();
      if (!blog) {
        return res.redirect("/dashboard?error=Blog not found");
      }

      // Authorization: allow if admin OR writer of blog
      const userId = req.user && req.user.id ? String(req.user.id) : null;
      const userRole = req.user && req.user.role ? req.user.role : null; // checkPermission usually sets this

      if (userRole !== "admin" && String(blog.writer) !== String(userId)) {
        return res.redirect(
          "/dashboard?error=You are not allowed to delete this blog"
        );
      }

      await blogModel.findByIdAndDelete(id);

      return res.redirect("/dashboard?success=Blog deleted successfully");
    } catch (error) {
      console.log("Delete blog error:", error);
      return res.redirect("/dashboard?error=Server error");
    }
  }
}

module.exports = new BlogPageController();

const { default: mongoose } = require("mongoose");
const blogModel = require("../models/blog.model");

class BlogPageController {
  async home(req, res) {
    try {
      const user = res.locals.user || req.user || null;
      const blogs = await blogModel.aggregate([
        {
          $lookup: {
            from: "users",
            localField: "writer",
            foreignField: "_id",
            as: "userDetails",
          },
        },
        { $unwind: "$userDetails" },
        {
          $project: {
            title: 1,
            des: 1,
            writer: "$userDetails.name",
            writerId: "$userDetails._id",
          },
        },
      ]);
      console.log("blogs", blogs);

      // console.log("rendering home user=", user);
      res.render("home", { user, blogs });
    } catch (error) {
      console.log(error);
    }
  }

  // Render CREATE page
  async createPage(req, res) {
    try {
      res.render("blog/create");
    } catch (error) {
      console.log(" error:", error);
    }
  }
  async create(req, res) {
    try {
      const { title, des } = req.body;
      const writerId = req.user.id;

      if (!title || !des) {
        return res.render("/blog/create", {
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

  async edit(req, res) {
    try {
      const { id } = req.params;
      const blog = await blogModel.findById(id).lean();
      if (!blog) {
        return res.redirect("/dashboard?error=Blog not found");
      }
      const { title, des } = req.body;

      const writerId = req.user.id;
      const updateObj = {};
      if (title) updateObj.title = title;
      if (des) updateObj.des = des;

      updateObj.writer = writerId;

      const updated = await blogModel.findByIdAndUpdate(id, updateObj, {
        new: true,
      });
      if (!updated) {
        return res.redirect("/dashboard?error=update failed");
      }
      return res.redirect("/dashboard?success=update successfull");
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
  async singleBlogPage(req, res) {
    try {
    } catch (error) {
      const { id } = req.params;
      const user = res.locals.user || req.user || null;
      const blog = await blogModel.aggregate([
        { $match: { _id: id } },
        {
          $lookup: {
            from: "users",
            localField: "writer",
            foreignField: "_id",
            as: "userDetails",
          },
        },
        { $unwind: "$userDetails" },
        {
          $project: {
            title: 1,
            des: 1,
            writer: "$userDetails.name",
            writerId: "$userDetails._id",
          },
        },
      ]);
      console.log("blog", blog);

      res.render("/blog/singleblog", { user, blog });
      console.log(error);
    }
  }
}

module.exports = new BlogPageController();

const blogModel = require("../models/blog.model");
const roleModel = require("../models/role.model");
const userModel = require("../models/user.model");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

class UserPageController {
  async registerPage(req, res) {
    res.render("user/register", {
      user: req.user,
      title: "Register",
      error: null,
      success: null,
    });
  }

  async loginPage(req, res) {
    res.render("user/login", { user: req.user, title: "Login", error: null });
  }

  async register(req, res) {
    try {
      const { name, email, password } = req.body;

      if (!name || !email || !password) {
        return res.render("user/register", {
          title: "Register",
          error: "All fields are required",
          success: null,
        });
      }

      const exist = await userModel.findOne({ email });
      if (exist) {
        return res.render("user/register", {
          title: "Register",
          error: "Email already exists",
          success: null,
        });
      }

      const hashed = await bcrypt.hash(password, 10);

      // assign employee role by default
      const employeeRole = await roleModel.findOne({ name: "employee" });

      await userModel.create({
        name,
        email,
        password: hashed,
        role: employeeRole._id,
      });

      // Redirect with success message
      return res.render("user/login", {
        title: "Login",
        error: null,
        success: "Registration successful. Please log in.",
      });
    } catch (error) {
      console.log(error);
      return res.render("user/register", {
        title: "Register",
        error: "Server error",
        success: null,
      });
    }
  }

  async login(req, res) {
    try {
      const { email, password } = req.body;

      const user = await userModel.findOne({ email }).populate("role");
      if (!user) {
        return res.render("user/login", {
          title: "Login",
          error: "Invalid email or password",
        });
      }

      const match = await bcrypt.compare(password, user.password);
      if (!match) {
        return res.render("user/login", {
          title: "Login",
          error: "Invalid email or password",
        });
      }

      const token = jwt.sign(
        { id: user._id, name: user.name, role: user.role.name },
        process.env.JWT_SECRET,
        { expiresIn: "7d" }
      );

      res.cookie("token", token, {
        httpOnly: true,
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });

      return res.redirect("/dashboard");
    } catch (error) {
      console.log(error);
      return res.render("user/login", {
        title: "Login",
        error: "Server error",
      });
    }
  }
  async dashboardPage(req, res) {
    try {
      const blogs = await blogModel
        .find()
        .populate("writer", "name email")
        .lean();

      res.render("user/dashboard", {
        user: req.user,
        title: "Dashboard",
        blogs,
        success: req.query.success ? String(req.query.success) : null,
        error: req.query.error ? String(req.query.error) : null,
      });
    } catch (error) {
      console.log(error);
      res.render("user/dashboard", {
        user: req.user,
        title: "Dashboard",
        blogs: [],
        error: "Error loading blogs",
      });
    }
  }
  async logout(req, res) {
    try {
      res.clearCookie("token");
      return res.redirect("/login");
    } catch (error) {
      console.error("logout error:", error);
      return res.redirect("/login");
    }
  }
}

module.exports = new UserPageController();

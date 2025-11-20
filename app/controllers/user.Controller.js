// controllers/UserController.js
const userModel = require("../models/user.model");
const roleModel = require("../models/role.model");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
require("dotenv").config();
const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN;

class UserController {
  // ================= REGISTER =================
  async register(req, res) {
    try {
      const { name, email, password, role } = req.body;

      if (!name || !email || !password || !role) {
        return res
          .status(400)
          .json({ success: false, message: "All fields required" });
      }

      // check existing user
      const exist = await userModel.findOne({ email: email.toLowerCase() });
      if (exist) {
        return res
          .status(409)
          .json({ success: false, message: "Email already exists" });
      }

      // hash password
      const hashed = await bcrypt.hash(password, 10);

      // If client sent role as name, find its _id. If they sent an ObjectId, use it.
      let roleId = role;
      if (typeof role === "string" && !/^[0-9a-fA-F]{24}$/.test(role)) {
        const r = await roleModel.findOne({ name: role });
        if (!r)
          return res
            .status(400)
            .json({ success: false, message: "Invalid role name" });
        roleId = r._id;
      }

      // create user
      const newUser = await userModel.create({
        name,
        email: email.toLowerCase(),
        password: hashed,
        role: roleId,
      });

      const pipeline = [
        { $match: { _id: newUser._id } },
        {
          $lookup: {
            from: "roles",
            localField: "role",
            foreignField: "_id",
            as: "role",
          },
        },
        { $unwind: { path: "$role", preserveNullAndEmptyArrays: true } },
        {
          $project: {
            password: 0,
            __v: 0,
          },
        },
      ];

      const [userWithRole] = await userModel.aggregate(pipeline);

      return res.status(201).json({
        success: true,
        message: "User registered",
        data: userWithRole,
      });
    } catch (error) {
      console.error("Register error:", error);
      return res.status(500).json({ success: false, message: "Server error" });
    }
  }

  // ================= LOGIN =================
  async login(req, res) {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res
          .status(400)
          .json({ success: false, message: "Email & password required" });
      }

      // Aggregate to find user by email and join role
      const pipeline = [
        { $match: { email: email.toLowerCase() } },
        {
          $lookup: {
            from: "roles",
            localField: "role",
            foreignField: "_id",
            as: "role",
          },
        },
        { $unwind: { path: "$role", preserveNullAndEmptyArrays: true } },
      ];

      const [user] = await userModel.aggregate(pipeline);

      if (!user) {
        return res
          .status(401)
          .json({ success: false, message: "Invalid credentials" });
      }

      // compare password (user.password is hashed)
      const match = await bcrypt.compare(password, user.password);
      if (!match) {
        return res
          .status(401)
          .json({ success: false, message: "Invalid credentials" });
      }

      // build token payload
      const payload = {
        id: user._id,
        role: user.role ? user.role.name : null,
      };

      const token = jwt.sign(payload, JWT_SECRET, {
        expiresIn: JWT_EXPIRES_IN,
      });

      res.cookie("token", token, {
        httpOnly: true,
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });

      // remove password before sending
      delete user.password;
      delete user.__v;

      return res.status(200).json({
        success: true,
        message: "Login successful",
        data: {
          user,
          token,
        },
      });
    } catch (error) {
      console.error("Login error:", error);
      return res.status(500).json({ success: false, message: "Server error" });
    }
  }
  async logout(req, res) {
    try {
      res.clearCookie("token");
      return res.status(200).json({
        success: true,
        message: "logout successful",
      });
    } catch (error) {
      console.error("logout error:", error);
      return res.status(500).json({ success: false, message: "Server error" });
    }
  }
}

module.exports = new UserController();

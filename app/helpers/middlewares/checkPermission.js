const jwt = require("jsonwebtoken");
const userModel = require("../../models/user.model");
const { ObjectId } = require("bson");
const JWT_SECRET = process.env.JWT_SECRET;

const checkPermission = (permission) => {
  return async (req, res, next) => {
    try {
      const token = req.cookies?.token;
      if (!token) {
        // For web pages you might want to redirect instead of json
        if (req.headers.accept?.includes("text/html")) {
          return res.redirect("/login");
        }
        return res
          .status(401)
          .json({ success: false, message: "No token, unauthorized" });
      }

      let decoded;
      try {
        decoded = jwt.verify(token, JWT_SECRET);
      } catch (e) {
        if (req.headers.accept?.includes("text/html")) {
          return res.redirect("/login");
        }
        return res
          .status(401)
          .json({ success: false, message: "Invalid or expired token" });
      }

      // Attach decoded to req (so you always have something)
      req.user = decoded;
      res.locals.user = decoded;

      // Load user with role & permissions
      const pipeline = [
        { $match: { _id: new ObjectId(decoded.id) } },
        {
          $lookup: {
            from: "roles",
            localField: "role",
            foreignField: "_id",
            as: "role",
          },
        },
        { $unwind: "$role" },
        {
          $project: {
            name: 1,
            email: 1,
            role: 1,
          },
        },
      ];

      const [user] = await userModel.aggregate(pipeline);

      if (!user) {
        if (req.headers.accept?.includes("text/html")) {
          return res.redirect("/login");
        }
        return res
          .status(401)
          .json({ success: false, message: "User not found" });
      }

      if (!req.user) {
        // no logged-in user
        if (req.headers.accept?.includes("text/html"))
          return res.redirect("/login");
        return res
          .status(401)
          .json({ success: false, message: "No token, unauthorized" });
      }

      // If no permission required, we're done (just authenticated)
      if (!permission) {
        return next();
      }

      // Ensure permissions is an array
      const perms = Array.isArray(user.role?.permission)
        ? user.role.permission
        : [];

      if (!perms.includes(permission)) {
        if (req.headers.accept?.includes("text/html")) {
          // if it's a page request, render or redirect with a message
          return res.status(403).redirect("/dashboard?error=Access Denied");
        }
        return res
          .status(403)
          .json({ success: false, message: "Access Denied" });
      }

      next();
    } catch (err) {
      console.error("Permission error:", err);
      if (req.headers.accept?.includes("text/html")) {
        return res.status(500).redirect("/dashboard?error=Server error");
      }
      return res.status(500).json({ success: false, message: "Server error" });
    }
  };
};

module.exports = checkPermission;

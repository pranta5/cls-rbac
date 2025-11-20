const jwt = require("jsonwebtoken");
const userModel = require("../../models/user.model");
const { ObjectId } = require("bson");
const JWT_SECRET = process.env.JWT_SECRET;

const checkPermission = (permission) => {
  return async (req, res, next) => {
    try {
      // 1. Read JWT token from cookie
      const token = req.cookies?.token;

      if (!token) {
        return res
          .status(401)
          .json({ success: false, message: "No token, unauthorized" });
      }

      // 2. Verify token
      let decoded;
      try {
        decoded = jwt.verify(token, JWT_SECRET);
      } catch (e) {
        return res
          .status(401)
          .json({ success: false, message: "Invalid or expired token" });
      }

      // Attach decoded user info to req
      req.user = decoded;
      //   console.log("decoded", decoded);
      // 3. Load user using aggregation
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
            "role.name": 1,
            "role.permission": 1,
          },
        },
      ];

      const [user] = await userModel.aggregate(pipeline);

      if (!user) {
        return res
          .status(401)
          .json({ success: false, message: "User not found" });
      }

      // 4. Permission check
      if (!user.role.permission.includes(permission)) {
        return res
          .status(403)
          .json({ success: false, message: "Access Denied" });
      }

      next();
    } catch (err) {
      console.error("Permission error:", err);
      return res.status(500).json({ success: false, message: "Server error" });
    }
  };
};

module.exports = checkPermission;

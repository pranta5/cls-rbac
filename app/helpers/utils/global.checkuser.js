const jwt = require("jsonwebtoken");
const userModel = require("../../models/user.model");
const {
  Types: { ObjectId },
} = require("mongoose"); // or require('bson').ObjectId
const JWT_SECRET = process.env.JWT_SECRET;

module.exports = async function globalUserCheck(req, res, next) {
  try {
    const token = req.cookies?.token;
    if (!token) {
      req.user = null;
      res.locals.user = null;
      return next();
    }

    let decoded;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch (err) {
      console.warn("Invalid JWT:", err.message);
      req.user = null;
      res.locals.user = null;
      return next();
    }

    const pipeline = [
      { $match: { _id: new ObjectId(decoded.id) } },

      {
        $lookup: {
          from: "roles",
          localField: "role",
          foreignField: "_id",
          as: "roleDetails",
        },
      },

      { $unwind: "$roleDetails" },

      {
        $project: {
          name: 1,
          email: 1,
          role: {
            name: "$roleDetails.name",
            permission: "$roleDetails.permission",
          },
        },
      },
    ];

    const [user] = await userModel.aggregate(pipeline);
    // const user = await userModel
    //   .findById(decoded.id)
    //   .select("-password -__v")
    //   .populate("role", "name permission")
    //   .lean();

    req.user = user || null;
    res.locals.user = user || null;
    return next();
  } catch (error) {
    console.error("globalUserCheck error:", error);
    req.user = null;
    res.locals.user = null;
    return next();
  }
};

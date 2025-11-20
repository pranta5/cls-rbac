// controllers/BlogController.js
const blogModel = require("../models/blog.model");
const { ObjectId } = require("bson");
const { Types } = require("mongoose");
class BlogController {
  // Create blog
  async create(req, res) {
    try {
      const { title, des } = req.body;

      if (!title || !des) {
        return res.status(400).json({
          success: false,
          message: "title, des are required",
        });
      }

      const writerId = req.user.id;

      const blog = await blogModel.create({ title, des, writer: writerId });

      // return created blog with writer data via aggregate
      const pipeline = [
        { $match: { _id: blog._id } },
        {
          $lookup: {
            from: "users",
            localField: "writer",
            foreignField: "_id",
            as: "writer",
          },
        },
        { $unwind: { path: "$writer", preserveNullAndEmptyArrays: true } },

        {
          $project: {
            "writer.password": 0,
            __v: 0,
          },
        },
      ];

      const [result] = await blogModel.aggregate(pipeline);

      return res
        .status(201)
        .json({ success: true, message: "Blog created", data: result });
    } catch (error) {
      console.error("Blog create error:", error);
      return res.status(500).json({ success: false, message: "Server error" });
    }
  }

  // List blogs (with optional pagination & search)
  async list(req, res) {
    try {
      const { page = 1, limit = 10, q } = req.query;
      const pageNum = Math.max(1, parseInt(page, 10));
      const lim = Math.max(1, parseInt(limit, 10));

      const match = {};
      if (q) {
        // simple text search on title and des
        match.$or = [
          { title: { $regex: q, $options: "i" } },
          { des: { $regex: q, $options: "i" } },
        ];
      }

      const pipeline = [
        { $match: match },
        { $sort: { _id: -1 } },
        {
          $lookup: {
            from: "users",
            localField: "writer",
            foreignField: "_id",
            as: "writer",
          },
        },
        { $unwind: { path: "$writer", preserveNullAndEmptyArrays: true } },
        { $project: { "writer.password": 0, __v: 0 } },
        { $skip: (pageNum - 1) * lim },
        { $limit: lim },
      ];

      const data = await blogModel.aggregate(pipeline);

      // total count for pagination
      const totalMatch = Object.keys(match).length
        ? await blogModel.countDocuments(match)
        : await blogModel.estimatedDocumentCount();

      return res.json({
        success: true,
        data,
        meta: {
          total: totalMatch,
          page: pageNum,
          limit: lim,
          pages: Math.ceil(totalMatch / lim),
        },
      });
    } catch (error) {
      console.error("Blog list error:", error);
      return res.status(500).json({ success: false, message: "Server error" });
    }
  }

  // Get single blog by id
  async getById(req, res) {
    try {
      const { id } = req.params;

      const pipeline = [
        { $match: { _id: new ObjectId(id) } },
        {
          $lookup: {
            from: "users",
            localField: "writer",
            foreignField: "_id",
            as: "writer",
          },
        },
        { $unwind: { path: "$writer", preserveNullAndEmptyArrays: true } },
        { $project: { "writer.password": 0, __v: 0 } },
      ];

      const [blog] = await blogModel.aggregate(pipeline);

      if (!blog) {
        return res
          .status(404)
          .json({ success: false, message: "Blog not found" });
      }

      return res.json({ success: true, data: blog });
    } catch (error) {
      console.error("Get blog error:", error);
      return res.status(500).json({ success: false, message: "Server error" });
    }
  }

  // Update blog
  async update(req, res) {
    try {
      const { id } = req.params;
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
        return res
          .status(404)
          .json({ success: false, message: "Blog not found" });
      }

      // return updated doc with writer populated via aggregate
      const pipeline = [
        { $match: { _id: updated._id } },
        {
          $lookup: {
            from: "users",
            localField: "writer",
            foreignField: "_id",
            as: "writer",
          },
        },
        { $unwind: { path: "$writer", preserveNullAndEmptyArrays: true } },
        { $project: { "writer.password": 0, __v: 0 } },
      ];
      const [result] = await blogModel.aggregate(pipeline);

      return res.json({ success: true, message: "Blog updated", data: result });
    } catch (error) {
      console.error("Update blog error:", error);
      return res.status(500).json({ success: false, message: "Server error" });
    }
  }

  // Delete blog
  async delete(req, res) {
    try {
      const { id } = req.params;
      if (!Types.ObjectId.isValid(id)) {
        return res.status(400).json({ success: false, message: "Invalid id" });
      }

      const deleted = await blogModel.findByIdAndDelete(id);
      if (!deleted) {
        return res
          .status(404)
          .json({ success: false, message: "Blog not found" });
      }

      return res.json({ success: true, message: "Blog deleted" });
    } catch (error) {
      console.error("Delete blog error:", error);
      return res.status(500).json({ success: false, message: "Server error" });
    }
  }
}

module.exports = new BlogController();

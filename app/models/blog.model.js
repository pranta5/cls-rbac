const mongoose = require("mongoose");

const blogSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  des: {
    type: String,
    required: true,
  },
  writer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "user",
    required: true,
  },
});
const blogModel = mongoose.model("blog", blogSchema);
module.exports = blogModel;

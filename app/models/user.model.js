const mongoose = require("mongoose");
const schema = mongoose.Schema;

const userSchema = new schema({
  name: String,
  email: String,
  password: String,
  role: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "role",
    required: true,
  },
});
const userModel = mongoose.model("user", userSchema);
module.exports = userModel;

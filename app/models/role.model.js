const mongoose = require("mongoose");
const schema = mongoose.Schema;

const roleSchema = new schema({
  name: {
    type: String,
    enum: ["admin", "manager", "employee"],
    required: true,
    unique: true,
  },
  permission: [
    {
      type: String,
    },
  ],
});

const roleModel = mongoose.model("role", roleSchema);
module.exports = roleModel;

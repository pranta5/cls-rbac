require("dotenv").config();
const mongoose = require("mongoose");

const dbConnect = async () => {
  try {
    const connect = await mongoose.connect(process.env.MONGODB_URL);
    if (connect) {
      console.log("db connect successfully");
    }
  } catch (error) {
    console.log("db connect failed", error);
  }
};
module.exports = dbConnect;

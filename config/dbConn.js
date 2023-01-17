const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    //line removes mongo error
    mongoose.set("strictQuery", true);

    await mongoose.connect(process.env.DATABASE_URI);
  } catch (err) {
    console.error(err);
  }
};

module.exports = connectDB;

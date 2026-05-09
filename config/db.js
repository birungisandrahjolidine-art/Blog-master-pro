const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.DATABASE);
    console.log(" congs Sandie mongoose has successfully connected & opened");
  } catch (error) {
    console.log(`Connection error: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;

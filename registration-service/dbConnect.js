const dns = require("dns");
dns.setServers(["8.8.8.8", "1.1.1.1"]);
// Task 2: DB connection file
const mongoose = require("mongoose");
require("dotenv").config();

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log(
      `[${process.env.SERVICE_NAME || "Service"}] MongoDB connected: ${mongoose.connection.host}/${mongoose.connection.name}`,
    );
  } catch (err) {
    console.error(
      `[${process.env.SERVICE_NAME || "Service"}] MongoDB connection error:`,
      err.message,
    );
    process.exit(1);
  }
};

module.exports = connectDB;

// Task 8: Admin Microservice
// Note: identity is trusted here because the API Gateway has already
// verified the JWT and role before proxying the request to this service.
require("dotenv").config();
const express = require("express");
const connectDB = require("./dbConnect");
const User = require("./models/User");

const app = express();
app.use(express.json());

connectDB();

// GET /admin/searchuser?query=<name or email>
app.get("/admin/searchuser", async (req, res) => {
  try {
    const { query } = req.query;
    if (!query) {
      return res
        .status(400)
        .json({ message: "query parameter is required, e.g. ?query=alice" });
    }

    const users = await User.find({
      $or: [
        { name: { $regex: query, $options: "i" } },
        { email: { $regex: query, $options: "i" } },
      ],
    }).select("-password");

    if (!users.length) {
      return res.status(404).json({ message: "No user found" });
    }

    return res.status(200).json({ count: users.length, users });
  } catch (err) {
    console.error("[Admin Service] Error:", err.message);
    return res
      .status(500)
      .json({ message: "Server error", error: err.message });
  }
});

// GET /admin/viewalluser
app.get("/admin/viewalluser", async (req, res) => {
  try {
    const users = await User.find().select("-password");
    return res.status(200).json({ count: users.length, users });
  } catch (err) {
    console.error("[Admin Service] Error:", err.message);
    return res
      .status(500)
      .json({ message: "Server error", error: err.message });
  }
});

// DELETE /admin/deluser  { "email": "..." }
app.delete("/admin/deluser", async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res
        .status(400)
        .json({ message: "email is required in the request body" });
    }

    const deletedUser = await User.findOneAndDelete({
      email: email.toLowerCase(),
    });
    if (!deletedUser) {
      return res.status(404).json({ message: "User not found" });
    }

    return res
      .status(200)
      .json({ message: "User deleted successfully", email: deletedUser.email });
  } catch (err) {
    console.error("[Admin Service] Error:", err.message);
    return res
      .status(500)
      .json({ message: "Server error", error: err.message });
  }
});

app.get("/health", (req, res) =>
  res.json({ status: "Admin Service is running" }),
);

const PORT = process.env.PORT || 4003;
app.listen(PORT, () => console.log(`Admin Service running on port ${PORT}`));

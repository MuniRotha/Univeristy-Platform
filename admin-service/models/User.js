// Task 3: MongoDB User Model (shared shape across services)
const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true }, // always stored as a bcrypt hash, never plain text
    role: { type: String, enum: ['user', 'admin'], default: 'user' },
    phone: { type: String, trim: true },
  },
  { timestamps: true } // automatically adds createdAt and updatedAt
);

module.exports = mongoose.model('User', userSchema);

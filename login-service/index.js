// Task 6: Login Microservice
require('dotenv').config();
const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const connectDB = require('./dbConnect');
const User = require('./models/User');

const app = express();
app.use(express.json());

connectDB();

// POST /auth/login
app.post('/auth/login', async (req, res) => {
  try {
    const { email, password, role } = req.body;

    if (!email || !password || !role) {
      return res.status(400).json({ message: 'email, password and role are required' });
    }
    if (!['user', 'admin'].includes(role)) {
      return res.status(400).json({ message: 'role must be either "user" or "admin"' });
    }

    const user = await User.findOne({ email: email.toLowerCase() });

    // Generic message so we never leak which field was wrong
    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password or role' });
    }

    const passwordMatches = await bcrypt.compare(password, user.password);
    if (!passwordMatches || user.role !== role) {
      return res.status(401).json({ message: 'Invalid email or password or role' });
    }

    const token = jwt.sign(
      { id: user._id, email: user.email, role: user.role, name: user.name },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '1h' }
    );

    return res.status(200).json({ message: 'Login successful', token });
  } catch (err) {
    console.error('[Login Service] Error:', err.message);
    return res.status(500).json({ message: 'Server error', error: err.message });
  }
});

app.get('/health', (req, res) => res.json({ status: 'Login Service is running' }));

const PORT = process.env.PORT || 4002;
app.listen(PORT, () => console.log(`Login Service running on port ${PORT}`));

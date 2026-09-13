// Task 5: Registration Microservice
require('dotenv').config();
const express = require('express');
const bcrypt = require('bcryptjs');
const connectDB = require('./dbConnect');
const User = require('./models/User');

const app = express();
app.use(express.json());

connectDB();

// POST /register/userregister
app.post('/register/userregister', async (req, res) => {
  try {
    const { name, email, password, role, phone } = req.body;

    // Validate input
    if (!name || !email || !password) {
      return res.status(400).json({ message: 'name, email and password are required' });
    }
    if (password.length < 6) {
      return res.status(400).json({ message: 'password must be at least 6 characters' });
    }

    // Check email uniqueness
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(409).json({ message: 'Email already registered' });
    }

    // Hash password before storing
    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await User.create({
      name,
      email: email.toLowerCase(),
      password: hashedPassword,
      role: role === 'admin' ? 'admin' : 'user',
      phone,
    });

    return res.status(201).json({
      message: 'User registered successfully',
      user: {
        id: newUser._id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
      },
    });
  } catch (err) {
    console.error('[Registration Service] Error:', err.message);
    return res.status(500).json({ message: 'Server error', error: err.message });
  }
});

app.get('/health', (req, res) => res.json({ status: 'Registration Service is running' }));

const PORT = process.env.PORT || 4001;
app.listen(PORT, () => console.log(`Registration Service running on port ${PORT}`));

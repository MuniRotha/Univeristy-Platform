// Task 9: User Microservice
// Note: identity is trusted here because the API Gateway has already
// verified the JWT and role, forwarding the caller's id via x-user-id.
require('dotenv').config();
const express = require('express');
const connectDB = require('./dbConnect');
const User = require('./models/User');

const app = express();
app.use(express.json());

connectDB();

// GET /user/viewprofile
app.get('/user/viewprofile', async (req, res) => {
  try {
    const userId = req.headers['x-user-id'];
    if (!userId) {
      return res.status(401).json({ message: 'Missing user identity' });
    }

    const user = await User.findById(userId).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    return res.status(200).json({ user });
  } catch (err) {
    console.error('[User Service] Error:', err.message);
    return res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// PUT /user/updateprofile  { "name": "...", "phone": "..." }
app.put('/user/updateprofile', async (req, res) => {
  try {
    const userId = req.headers['x-user-id'];
    if (!userId) {
      return res.status(401).json({ message: 'Missing user identity' });
    }

    const { name, phone } = req.body;
    if (!name && !phone) {
      return res.status(400).json({ message: 'Provide at least name or phone to update' });
    }

    const updates = {};
    if (name) updates.name = name;
    if (phone) updates.phone = phone;

    const updatedUser = await User.findByIdAndUpdate(userId, updates, {
      new: true,
      runValidators: true,
    }).select('-password');

    if (!updatedUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    return res.status(200).json({ message: 'Profile updated successfully', user: updatedUser });
  } catch (err) {
    console.error('[User Service] Error:', err.message);
    return res.status(500).json({ message: 'Server error', error: err.message });
  }
});

app.get('/health', (req, res) => res.json({ status: 'User Service is running' }));

const PORT = process.env.PORT || 4004;
app.listen(PORT, () => console.log(`User Service running on port ${PORT}`));

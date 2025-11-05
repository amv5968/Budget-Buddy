// budget-buddy-backend/routes/users.js
const express = require('express');
const router = express.Router();

const auth = require('../middleware/auth');     // must set req.userId from JWT
const User = require('../models/User');         // Mongoose model

// GET /api/users/me  -> current user (no password)
router.get('/me', auth, async (req, res) => {
  try {
    const user = await User.findById(req.userId).select('_id username email');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  } catch (err) {
    console.error('GET /users/me:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// PUT /api/users/me  -> update username only
router.put('/me', auth, async (req, res) => {
  try {
    const { username } = req.body;
    if (!username || !username.trim()) {
      return res.status(400).json({ message: 'Username is required' });
    }

    const updated = await User.findByIdAndUpdate(
      req.userId,
      { $set: { username: username.trim() } },
      { new: true, runValidators: true, select: '_id username email' }
    );

    if (!updated) return res.status(404).json({ message: 'User not found' });
    res.json(updated);
  } catch (err) {
    console.error('PUT /users/me:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;

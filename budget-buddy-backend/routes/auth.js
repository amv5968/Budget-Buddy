const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const auth = require('../middleware/auth');

const router = express.Router();

router.post('/signup', async (req, res) => {
  try {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    const existingUser = await User.findOne({ 
      $or: [{ email }, { username }] 
    });

    if (existingUser) {
      return res.status(400).json({ error: 'Username or email already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = new User({
      username,
      email,
      password: hashedPassword
    });

    await user.save();

    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET,
      { expiresIn: '30d' }
    );

    res.status(201).json({
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        monthlyAllowance: user.monthlyAllowance || 1000
      }
    });
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ error: 'Server error during signup' });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { emailOrUsername, password } = req.body;

    if (!emailOrUsername || !password) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    const user = await User.findOne({
      $or: [{ email: emailOrUsername }, { username: emailOrUsername }]
    });

    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const isValidPassword = await bcrypt.compare(password, user.password);

    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET,
      { expiresIn: '30d' }
    );

    res.json({
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        monthlyAllowance: user.monthlyAllowance || 1000
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Server error during login' });
  }
});

// Get user profile with monthly allowance
router.get('/profile', auth, async (req, res) => {
  try {
    const user = await User.findById(req.userId).select('-password');
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      id: user._id,
      username: user.username,
      email: user.email,
      monthlyAllowance: user.monthlyAllowance || 1000
    });
  } catch (error) {
    console.error('Profile error:', error);
    res.status(500).json({ error: 'Server error fetching profile' });
  }
});

// Update monthly allowance
router.patch('/monthly-allowance', auth, async (req, res) => {
  try {
    const { monthlyAllowance } = req.body;

    if (typeof monthlyAllowance !== 'number' || monthlyAllowance <= 0) {
      return res.status(400).json({ error: 'Invalid monthly allowance amount' });
    }

    const user = await User.findByIdAndUpdate(
      req.userId,
      { monthlyAllowance },
      { new: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      id: user._id,
      username: user.username,
      email: user.email,
      monthlyAllowance: user.monthlyAllowance
    });
  } catch (error) {
    console.error('Update allowance error:', error);
    res.status(500).json({ error: 'Server error updating allowance' });
  }
});
// PUT /api/auth/update-profile
router.put('/update-profile', auth, async (req, res) => {
  try {
    const { username, email, monthlyAllowance } = req.body;

    // Build update object with only provided fields
    const updateData = {};
    if (username !== undefined) updateData.username = username;
    if (email !== undefined) updateData.email = email;
    if (monthlyAllowance !== undefined) updateData.monthlyAllowance = monthlyAllowance;

    // Check if email is already taken by another user
    if (email) {
      const existingUser = await User.findOne({ email, _id: { $ne: req.userId } });
      if (existingUser) {
        return res.status(400).json({ error: 'Email already in use' });
      }
    }

    // Check if username is already taken by another user
    if (username) {
      const existingUser = await User.findOne({ username, _id: { $ne: req.userId } });
      if (existingUser) {
        return res.status(400).json({ error: 'Username already in use' });
      }
    }

    const user = await User.findByIdAndUpdate(
      req.userId,
      updateData,
      { new: true, runValidators: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      id: user._id,
      username: user.username,
      email: user.email,
      monthlyAllowance: user.monthlyAllowance || 0,
    });
  } catch (err) {
    console.error('Error updating profile:', err);
    res.status(500).json({ error: err.message || 'Server error updating profile' });
  }
});

// POST /api/auth/change-password
router.post('/change-password', auth, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Current password and new password are required' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'New password must be at least 6 characters' });
    }

    // Find user and include password for verification
    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Verify current password
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ error: 'Current password is incorrect' });
    }

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    // Update password
    user.password = hashedPassword;
    await user.save();

    res.json({ message: 'Password changed successfully' });
  } catch (err) {
    console.error('Error changing password:', err);
    res.status(500).json({ error: 'Server error changing password' });
  }
});

module.exports = router;
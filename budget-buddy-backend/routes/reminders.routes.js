// routes/reminders.routes.js
const express = require('express');
const router = express.Router();
const Reminder = require('../models/Reminder');

// ✅ GET all reminders
router.get('/', async (req, res) => {
  try {
    const reminders = await Reminder.find();
    res.json(reminders);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ✅ GET reminders for a specific date (YYYY-MM-DD)
router.get('/:date', async (req, res) => {
  try {
    const reminders = await Reminder.find({ date: req.params.date });
    res.json(reminders);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ✅ POST a new reminder
router.post('/', async (req, res) => {
  try {
    const { date, time, message } = req.body;
    if (!date || !time || !message)
      return res.status(400).json({ message: 'Missing fields' });

    const newReminder = new Reminder({ date, time, message });
    const saved = await newReminder.save();
    res.status(201).json(saved);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ✅ DELETE a reminder (optional)
router.delete('/:id', async (req, res) => {
  try {
    const result = await Reminder.findByIdAndDelete(req.params.id);
    if (!result) return res.status(404).json({ message: 'Reminder not found' });
    res.json({ message: 'Deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;

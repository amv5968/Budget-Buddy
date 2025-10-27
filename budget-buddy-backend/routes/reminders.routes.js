const express = require('express');
const { v4: uuidv4 } = require('uuid');

const reminders = []; // in-memory for now

const router = express.Router();

// GET /api/reminders
router.get('/', (req, res) => {
  res.json(reminders);
});

// GET /api/reminders/:date
router.get('/:date', (req, res) => {
  const { date } = req.params;
  const dayReminders = reminders.filter(r => r.date === date);
  res.json(dayReminders);
});

// POST /api/reminders
router.post('/', (req, res) => {
  const { date, time, message } = req.body;

  if (!date || !time || !message) {
    return res
      .status(400)
      .json({ error: 'date, time, and message are required' });
  }

  const newReminder = {
    id: uuidv4(),
    date,
    time,
    message,
  };

  reminders.push(newReminder);

  res.status(201).json(newReminder);
});

module.exports = router;

const express = require('express');
const router = express.Router();
const Subscription = require('../models/Subscription');

// GET all subscriptions
router.get('/', async (req, res) => {
  try {
    const subs = await Subscription.find().sort({ createdAt: -1 });
    res.json(subs);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch subscriptions' });
  }
});

// POST create a new subscription
router.post('/', async (req, res) => {
  try {
    const { name, amount, renewalDate, category } = req.body;
    const sub = new Subscription({ name, amount, renewalDate, category });
    await sub.save();
    res.json(sub);
  } catch (err) {
    res.status(500).json({ error: 'Failed to create subscription' });
  }
});

// DELETE a subscription
router.delete('/:id', async (req, res) => {
  try {
    await Subscription.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete subscription' });
  }
});

module.exports = router;

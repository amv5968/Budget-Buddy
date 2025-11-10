const express = require('express');
const router = express.Router();
const Subscription = require('../models/Subscription');
const auth = require('../middleware/auth');
const { createRecurringTransaction } = require('../services/recurringTransactionService');

// GET all subscriptions for the authenticated user
router.get('/', auth, async (req, res) => {
  try {
    const subs = await Subscription.find({ userId: req.userId }).sort({ createdAt: -1 });
    res.json(subs);
  } catch (err) {
    console.error('Get subscriptions error:', err);
    res.status(500).json({ error: 'Failed to fetch subscriptions' });
  }
});

// POST create a new subscription
router.post('/', auth, async (req, res) => {
  try {
    const { name, amount, renewalDate, category, autoCreateTransaction } = req.body;
    
    const sub = new Subscription({ 
      userId: req.userId,
      name, 
      amount, 
      renewalDate, 
      category,
      autoCreateTransaction: autoCreateTransaction !== undefined ? autoCreateTransaction : true
    });
    
    await sub.save();

    // If autoCreateTransaction is enabled, create a recurring transaction
    if (sub.autoCreateTransaction) {
      try {
        const { recurringTransaction } = await createRecurringTransaction(req.userId, {
          type: 'Expense',
          category: category || 'Subscription',
          amount,
          description: `Subscription: ${name}`,
          frequency: 'monthly',
          startDate: renewalDate,
          endDate: null
        });

        sub.linkedRecurringTransactionId = recurringTransaction._id;
        await sub.save();
      } catch (error) {
        console.error('Error creating linked recurring transaction:', error);
        // Continue anyway, subscription is created
      }
    }

    res.json(sub);
  } catch (err) {
    console.error('Create subscription error:', err);
    res.status(500).json({ error: 'Failed to create subscription' });
  }
});

// DELETE a subscription
router.delete('/:id', auth, async (req, res) => {
  try {
    const sub = await Subscription.findOne({ _id: req.params.id, userId: req.userId });
    
    if (!sub) {
      return res.status(404).json({ error: 'Subscription not found' });
    }

    // If there's a linked recurring transaction, stop it
    if (sub.linkedRecurringTransactionId) {
      const Transaction = require('../models/Transaction');
      await Transaction.findByIdAndUpdate(
        sub.linkedRecurringTransactionId,
        { isActive: false }
      );
    }

    await Subscription.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err) {
    console.error('Delete subscription error:', err);
    res.status(500).json({ error: 'Failed to delete subscription' });
  }
});

module.exports = router;

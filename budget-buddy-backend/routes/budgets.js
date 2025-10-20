const express = require('express');
const Budget = require('../models/Budget');
const auth = require('../middleware/auth');

const router = express.Router();

router.post('/', auth, async (req, res) => {
  try {
    const { category, totalAmount, icon } = req.body;

    const budget = new Budget({
      userId: req.userId,
      category,
      totalAmount,
      icon: icon || ''
    });

    await budget.save();
    res.status(201).json(budget);
  } catch (error) {
    console.error('Budget creation error:', error);
    res.status(500).json({ error: 'Server error creating budget' });
  }
});

router.get('/', auth, async (req, res) => {
  try {
    const budgets = await Budget.find({ userId: req.userId })
      .sort({ category: 1 });
    
    res.json(budgets);
  } catch (error) {
    console.error('Fetch budgets error:', error);
    res.status(500).json({ error: 'Server error fetching budgets' });
  }
});

router.put('/:id', auth, async (req, res) => {
  try {
    const { spentAmount } = req.body;

    const budget = await Budget.findOneAndUpdate(
      { _id: req.params.id, userId: req.userId },
      { spentAmount },
      { new: true, runValidators: true }
    );

    if (!budget) {
      return res.status(404).json({ error: 'Budget not found' });
    }

    res.json(budget);
  } catch (error) {
    console.error('Update budget error:', error);
    res.status(500).json({ error: 'Server error updating budget' });
  }
});

module.exports = router;
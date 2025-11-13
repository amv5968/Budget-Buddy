const express = require('express');
const Budget = require('../models/Budget');
const Transaction = require('../models/Transaction');
const auth = require('../middleware/auth');

const router = express.Router();

router.post('/', auth, async (req, res) => {
  try {
    const { type, category, totalAmount, icon } = req.body;

    const budget = new Budget({
      userId: req.userId,
      type: type || 'Expense', // Default to Expense if not specified
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
    
    // Calculate spent/earned amounts from transactions
    const budgetsWithSpent = await Promise.all(
      budgets.map(async (budget) => {
        // Get transactions matching budget type and category
        const transactions = await Transaction.find({
          userId: req.userId,
          category: budget.category,
          type: budget.type // Match budget type (Income or Expense)
        });
        
        // Calculate total spent/earned from matching transactions
        const spentAmount = transactions.reduce((sum, t) => sum + Math.abs(t.amount), 0);
        
        // Update budget if spent amount changed
        if (budget.spentAmount !== spentAmount) {
          budget.spentAmount = spentAmount;
          await budget.save();
        }
        
        return budget;
      })
    );
    
    res.json(budgetsWithSpent);
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

router.delete('/:id', auth, async (req, res) => {
  try {
    const budget = await Budget.findOneAndDelete({
      _id: req.params.id,
      userId: req.userId
    });
    
    if (!budget) {
      return res.status(404).json({ error: 'Budget not found' });
    }
    
    res.json({ message: 'Budget deleted successfully', budget });
  } catch (error) {
    console.error('Delete budget error:', error);
    res.status(500).json({ error: 'Server error deleting budget' });
  }
});

module.exports = router;
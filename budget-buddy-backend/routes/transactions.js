const express = require('express');
const Transaction = require('../models/Transaction');
const auth = require('../middleware/auth');

const router = express.Router();

router.post('/', auth, async (req, res) => {
  try {
    const { type, category, amount, description, date } = req.body;

    if (!type || !category || amount === undefined) {
      return res.status(400).json({ error: 'Required fields missing' });
    }

    const transaction = new Transaction({
      userId: req.userId,
      type,
      category,
      amount,
      description: description || '',
      date: date || new Date()
    });

    await transaction.save();
    res.status(201).json(transaction);
  } catch (error) {
    console.error('Transaction creation error:', error);
    res.status(500).json({ error: 'Server error creating transaction' });
  }
});

router.get('/', auth, async (req, res) => {
  try {
    const transactions = await Transaction.find({ userId: req.userId })
      .sort({ date: -1, createdAt: -1 });
    
    res.json(transactions);
  } catch (error) {
    console.error('Fetch transactions error:', error);
    res.status(500).json({ error: 'Server error fetching transactions' });
  }
});

router.get('/stats', auth, async (req, res) => {
  try {
    const incomeResult = await Transaction.aggregate([
      { $match: { userId: req.userId, type: 'Income' } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);

    const expenseResult = await Transaction.aggregate([
      { $match: { userId: req.userId, type: 'Expense' } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);

    const totalIncome = incomeResult.length > 0 ? incomeResult[0].total : 0;
    const totalExpense = expenseResult.length > 0 ? expenseResult[0].total : 0;

    res.json({
      totalIncome,
      totalExpense,
      balance: totalIncome - totalExpense
    });
  } catch (error) {
    console.error('Stats error:', error);
    res.status(500).json({ error: 'Server error fetching stats' });
  }
});

router.put('/:id', auth, async (req, res) => {
  try {
    const { type, category, amount, description, date } = req.body;

    const transaction = await Transaction.findOneAndUpdate(
      { _id: req.params.id, userId: req.userId },
      { type, category, amount, description, date },
      { new: true, runValidators: true }
    );

    if (!updated) {
      return res.status(404).json({ error: 'Transaction not found' });
    }

    res.json(updated);
  } catch (error) {
    console.error('Update transaction error:', error);
    res.status(500).json({ error: 'Server error updating transaction' });
  }
});

router.delete('/:id', auth, async (req, res) => {
  try {
    const transaction = await Transaction.findOneAndDelete({
      _id: req.params.id,
      userId: req.userId
    });

    if (!transaction) {
      return res.status(404).json({ error: 'Transaction not found' });
    }

    res.json({ message: 'Transaction deleted successfully' });
  } catch (error) {
    console.error('Delete transaction error:', error);
    res.status(500).json({ error: 'Server error deleting transaction' });
  }
});

module.exports = router;
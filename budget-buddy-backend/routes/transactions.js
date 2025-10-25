const express = require('express');
const mongoose = require('mongoose');
const Transaction = require('../models/Transaction');
const auth = require('../middleware/auth');

const router = express.Router();

router.post('/', auth, async (req, res) => {
  try {
    const { type, category, amount, description, date } = req.body;

    console.log('➕ Creating transaction:', { type, category, amount, userId: req.userId });

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
    console.log('✅ Transaction saved:', transaction);
    res.status(201).json(transaction);
  } catch (error) {
    console.error('❌ Transaction creation error:', error);
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
    console.log('📊 Fetching stats for userId:', req.userId);
    
    // Get all transactions for this user
    const allTransactions = await Transaction.find({ userId: req.userId });
    console.log('📝 Total transactions found:', allTransactions.length);
    
    // Calculate income and expense
    let totalIncome = 0;
    let totalExpense = 0;
    
    allTransactions.forEach(transaction => {
      console.log(`Transaction: ${transaction.type} - $${transaction.amount}`);
      if (transaction.type === 'Income') {
        totalIncome += transaction.amount;
      } else if (transaction.type === 'Expense') {
        totalExpense += Math.abs(transaction.amount);
      }
    });

    console.log('💰 Total Income:', totalIncome);
    console.log('💸 Total Expense:', totalExpense);

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

    if (!transaction) {
      return res.status(404).json({ error: 'Transaction not found' });
    }

    res.json(transaction);
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
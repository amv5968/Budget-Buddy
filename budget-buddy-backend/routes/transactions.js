const express = require('express');
const mongoose = require('mongoose');
const Transaction = require('../models/Transaction');
const auth = require('../middleware/auth');
const {
  processRecurringTransactions,
  processSubscriptions,
  createRecurringTransaction,
  stopRecurringTransaction,
  getActiveRecurringTransactions
} = require('../services/recurringTransactionService');
const { updateBudgetFromTransactions } = require('../services/budgetUpdateService');

const router = express.Router();

router.post('/', auth, async (req, res) => {
  try {
    const { type, category, amount, description, date } = req.body;

    console.log('Creating transaction:', { type, category, amount, userId: req.userId });

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
    console.log('Transaction saved:', transaction);
    
    // Update budget for this transaction's category and type
    await updateBudgetFromTransactions(req.userId, type, category);
    
    res.status(201).json(transaction);
  } catch (error) {
    console.error('Transaction creation error:', error);
    res.status(500).json({ error: 'Server error creating transaction' });
  }
});

router.get('/', auth, async (req, res) => {
  try {
    // Exclude recurring transaction templates (isRecurring: true)
    // Only return actual transactions (isRecurring: false or null)
    const transactions = await Transaction.find({ 
      userId: req.userId,
      isRecurring: { $ne: true } // Exclude recurring transaction templates
    })
      .sort({ date: -1, createdAt: -1 });
    
    res.json(transactions);
  } catch (error) {
    console.error('Fetch transactions error:', error);
    res.status(500).json({ error: 'Server error fetching transactions' });
  }
});

router.get('/stats', auth, async (req, res) => {
  try {
    console.log('Fetching stats for userId:', req.userId);
    
    // Exclude recurring transaction templates (isRecurring: true)
    const allTransactions = await Transaction.find({ 
      userId: req.userId,
      isRecurring: { $ne: true } // Exclude recurring transaction templates
    });
    console.log('Total transactions found:', allTransactions.length);
    
    let totalIncome = 0;
    let totalExpense = 0;
    
    allTransactions.forEach(transaction => {
      console.log(`Transaction: ${transaction.type} - $${transaction.amount}`);
      if (transaction.type === 'Income') {
        totalIncome += Math.abs(transaction.amount);
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

    // Get the old transaction to know which budget to update
    const oldTransaction = await Transaction.findOne({
      _id: req.params.id,
      userId: req.userId
    });

    if (!oldTransaction) {
      return res.status(404).json({ error: 'Transaction not found' });
    }

    const transaction = await Transaction.findOneAndUpdate(
      { _id: req.params.id, userId: req.userId },
      { type, category, amount, description, date },
      { new: true, runValidators: true }
    );

    // Update budgets for both old and new category/type
    // Update old budget (in case category or type changed)
    await updateBudgetFromTransactions(req.userId, oldTransaction.type, oldTransaction.category);
    
    // Update new budget (if category or type changed)
    if (oldTransaction.type !== type || oldTransaction.category !== category) {
      await updateBudgetFromTransactions(req.userId, type, category);
    }

    res.json(transaction);
  } catch (error) {
    console.error('Update transaction error:', error);
    res.status(500).json({ error: 'Server error updating transaction' });
  }
});

router.delete('/:id', auth, async (req, res) => {
  try {
    // Get transaction before deleting to know which budget to update
    const transaction = await Transaction.findOne({
      _id: req.params.id,
      userId: req.userId
    });

    if (!transaction) {
      return res.status(404).json({ error: 'Transaction not found' });
    }

    // Store category and type before deletion
    const { type, category } = transaction;

    await Transaction.findOneAndDelete({
      _id: req.params.id,
      userId: req.userId
    });

    // Update budget after deletion
    await updateBudgetFromTransactions(req.userId, type, category);

    res.json({ message: 'Transaction deleted successfully' });
  } catch (error) {
    console.error('Delete transaction error:', error);
    res.status(500).json({ error: 'Server error deleting transaction' });
  }
});

router.get('/recurring', auth, async (req, res) => {
  try {
    const recurringTransactions = await getActiveRecurringTransactions(req.userId);
    res.json(recurringTransactions);
  } catch (error) {
    console.error('Get recurring transactions error:', error);
    res.status(500).json({ error: 'Server error fetching recurring transactions' });
  }
});

router.post('/recurring', auth, async (req, res) => {
  try {
    const { type, category, amount, description, frequency, startDate, endDate } = req.body;

    if (!type || !category || !amount || !frequency) {
      return res.status(400).json({ error: 'Required fields missing' });
    }

    if (!['daily', 'weekly', 'monthly', 'yearly'].includes(frequency)) {
      return res.status(400).json({ error: 'Invalid frequency' });
    }

    const result = await createRecurringTransaction(req.userId, {
      type,
      category,
      amount,
      description: description || '',
      frequency,
      startDate,
      endDate
    });

    res.status(201).json(result);
  } catch (error) {
    console.error('Create recurring transaction error:', error);
    res.status(500).json({ error: 'Server error creating recurring transaction' });
  }
});

router.post('/recurring/:id/stop', auth, async (req, res) => {
  try {
    const transaction = await stopRecurringTransaction(req.params.id, req.userId);
    res.json({ message: 'Recurring transaction stopped', transaction });
  } catch (error) {
    console.error('Stop recurring transaction error:', error);
    res.status(500).json({ error: error.message || 'Server error stopping recurring transaction' });
  }
});

router.post('/recurring/process', auth, async (req, res) => {
  try {
    const results = await processRecurringTransactions();
    res.json(results);
  } catch (error) {
    console.error('Process recurring transactions error:', error);
    res.status(500).json({ error: 'Server error processing recurring transactions' });
  }
});

router.post('/subscriptions/process', auth, async (req, res) => {
  try {
    const results = await processSubscriptions();
    res.json(results);
  } catch (error) {
    console.error('Process subscriptions error:', error);
    res.status(500).json({ error: 'Server error processing subscriptions' });
  }
});

module.exports = router;
const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const auth = require('../middleware/auth');
const Transaction = require('../models/Transaction');

// Helper: normalize the user id and create a filter that matches both string and ObjectId
function getUserIdFilters(req) {
  const raw = req.userId || req.user?.id || req.user?._id || req.user;
  if (!raw) return null;

  const oid = mongoose.Types.ObjectId.isValid(raw)
    ? new mongoose.Types.ObjectId(raw)
    : null;

  // Match either string or ObjectId — whichever your schema stores
  return { $in: [String(raw), oid].filter(Boolean) };
}

// Helper: case-insensitive match for type
const typeIn = (t) => ({ $in: [t, t.toUpperCase(), t.toLowerCase()] });

//Create

router.post('/', auth, async (req, res) => {
  try {
    const userIdFilter = getUserIdFilters(req);
    if (!userIdFilter) return res.status(401).json({ error: 'Unauthorized' });

    const { type, category, amount, description, date } = req.body;
    if (!type || !category || amount === undefined) {
      return res.status(400).json({ error: 'Required fields missing' });
    }

    // Prefer storing the raw string id if that’s what your schema uses.
    const rawUserId = String(req.userId || req.user?.id || req.user?._id || req.user);

    const tx = new Transaction({
      userId: rawUserId,
      type,
      category,
      amount: Number(amount),
      description: description || '',
      date: date ? new Date(date) : new Date(),
    });

    await tx.save();
    res.status(201).json(tx);
  } catch (err) {
    console.error('Transaction creation error:', err);
    res.status(500).json({ error: 'Server error creating transaction' });
  }
});

//List
router.get('/', auth, async (req, res) => {
  try {
    const userIdFilter = getUserIdFilters(req);
    if (!userIdFilter) return res.status(401).json({ error: 'Unauthorized' });

    const transactions = await Transaction.find({ userId: userIdFilter })
      .sort({ date: -1, createdAt: -1 });

    res.json(transactions);
  } catch (err) {
    console.error('Fetch transactions error:', err);
    res.status(500).json({ error: 'Server error fetching transactions' });
  }
});


 //Stats (totals)
 
router.get('/stats', auth, async (req, res) => {
  try {
    const userIdFilter = getUserIdFilters(req);
    if (!userIdFilter) return res.status(401).json({ error: 'Unauthorized' });

    const [incomeAgg] = await Transaction.aggregate([
      { $match: { userId: userIdFilter, type: typeIn('Income') } },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]);

    const [expenseAgg] = await Transaction.aggregate([
      { $match: { userId: userIdFilter, type: typeIn('Expense') } },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]);

    const totalIncome = incomeAgg?.total || 0;
    const totalExpense = expenseAgg?.total || 0;

    res.json({
      totalIncome,
      totalExpense,
      balance: totalIncome - totalExpense,
    });
  } catch (err) {
    console.error('Stats error:', err);
    res.status(500).json({ error: 'Server error fetching stats' });
  }
});

//Update
router.put('/:id', auth, async (req, res) => {
  try {
    const userIdFilter = getUserIdFilters(req);
    if (!userIdFilter) return res.status(401).json({ error: 'Unauthorized' });

    const { type, category, amount, description, date } = req.body;

    const updated = await Transaction.findOneAndUpdate(
      { _id: req.params.id, userId: userIdFilter },
      {
        ...(type ? { type } : {}),
        ...(category ? { category } : {}),
        ...(amount !== undefined ? { amount: Number(amount) } : {}),
        ...(description !== undefined ? { description } : {}),
        ...(date ? { date: new Date(date) } : {}),
      },
      { new: true, runValidators: true }
    );

    if (!updated) return res.status(404).json({ error: 'Transaction not found' });
    res.json(updated);
  } catch (err) {
    console.error('Update transaction error:', err);
    res.status(500).json({ error: 'Server error updating transaction' });
  }
});

// Delete
router.delete('/:id', auth, async (req, res) => {
  try {
    const userIdFilter = getUserIdFilters(req);
    if (!userIdFilter) return res.status(401).json({ error: 'Unauthorized' });

    const deleted = await Transaction.findOneAndDelete({
      _id: req.params.id,
      userId: userIdFilter,
    });

    if (!deleted) return res.status(404).json({ error: 'Transaction not found' });
    res.json({ message: 'Transaction deleted successfully' });
  } catch (err) {
    console.error('Delete transaction error:', err);
    res.status(500).json({ error: 'Server error deleting transaction' });
  }
});

module.exports = router;
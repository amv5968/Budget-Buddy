const express = require('express');
const Goal = require('../models/Goal');
const auth = require('../middleware/auth');

const router = express.Router();

router.post('/', auth, async (req, res) => {
  try {
    const { name, targetAmount, icon } = req.body;

    const goal = new Goal({
      userId: req.userId,
      name,
      targetAmount,
      icon: icon || ''
    });

    await goal.save();
    res.status(201).json(goal);
  } catch (error) {
    console.error('Goal creation error:', error);
    res.status(500).json({ error: 'Server error creating goal' });
  }
});

router.get('/', auth, async (req, res) => {
  try {
    const goals = await Goal.find({ userId: req.userId })
      .sort({ createdAt: -1 });
    
    res.json(goals);
  } catch (error) {
    console.error('Fetch goals error:', error);
    res.status(500).json({ error: 'Server error fetching goals' });
  }
});

router.put('/:id', auth, async (req, res) => {
  try {
    const { savedAmount } = req.body;

    const goal = await Goal.findOneAndUpdate(
      { _id: req.params.id, userId: req.userId },
      { savedAmount },
      { new: true, runValidators: true }
    );

    if (!goal) {
      return res.status(404).json({ error: 'Goal not found' });
    }

    res.json(goal);
  } catch (error) {
    console.error('Update goal error:', error);
    res.status(500).json({ error: 'Server error updating goal' });
  }
});

router.delete('/:id', auth, async (req, res) => {
  try {
    const goal = await Goal.findOneAndDelete({
      _id: req.params.id,
      userId: req.userId
    });
    
    if (!goal) {
      return res.status(404).json({ error: 'Goal not found' });
    }
    
    res.json({ message: 'Goal deleted successfully', goal });
  } catch (error) {
    console.error('Delete goal error:', error);
    res.status(500).json({ error: 'Server error deleting goal' });
  }
});

module.exports = router;
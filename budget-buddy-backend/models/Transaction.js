const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  type: {
    type: String,
    enum: ['Income', 'Expense'],
    required: true
  },
  category: {
    type: String,
    required: true
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  description: {
    type: String,
    default: ''
  },
  date: {
    type: Date,
    default: Date.now
  },
  isRecurring: {
    type: Boolean,
    default: false
  },
  recurringFrequency: {
    type: String,
    enum: ['daily', 'weekly', 'monthly', 'yearly'],
    default: null
  },
  recurringEndDate: {
    type: Date,
    default: null
  },
  nextRecurringDate: {
    type: Date,
    default: null
  },
  lastProcessedDate: {
    type: Date,
    default: null
  },
  parentRecurringId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Transaction',
    default: null
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

transactionSchema.index({ userId: 1, date: -1 });
transactionSchema.index({ userId: 1, isRecurring: 1, isActive: 1 });
transactionSchema.index({ nextRecurringDate: 1, isRecurring: 1, isActive: 1 });

module.exports = mongoose.model('Transaction', transactionSchema);
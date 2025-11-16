const mongoose = require('mongoose');

const SubscriptionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  name: { type: String, required: true },
  amount: { type: Number, required: true },
  renewalDate: { type: String, required: true },
  category: { type: String, default: 'Other' },
  autoCreateTransaction: { type: Boolean, default: true },
  linkedRecurringTransactionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Transaction',
    default: null
  },
  lastTransactionDate: { type: Date, default: null },
  createdAt: { type: Date, default: Date.now },
});

SubscriptionSchema.index({ userId: 1 });

module.exports = mongoose.model('Subscription', SubscriptionSchema);

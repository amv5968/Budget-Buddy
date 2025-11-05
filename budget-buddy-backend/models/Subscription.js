const mongoose = require('mongoose');

const SubscriptionSchema = new mongoose.Schema({
  name: { type: String, required: true },
  amount: { type: Number, required: true },
  renewalDate: { type: String, required: true },
  category: { type: String, default: 'Other' },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Subscription', SubscriptionSchema);

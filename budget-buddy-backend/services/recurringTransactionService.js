const Transaction = require('../models/Transaction');
const Subscription = require('../models/Subscription');

function calculateNextDate(currentDate, frequency) {
  const date = new Date(currentDate);
  
  switch (frequency) {
    case 'daily':
      date.setDate(date.getDate() + 1);
      break;
    case 'weekly':
      date.setDate(date.getDate() + 7);
      break;
    case 'monthly':
      date.setMonth(date.getMonth() + 1);
      break;
    case 'yearly':
      date.setFullYear(date.getFullYear() + 1);
      break;
    default:
      throw new Error('Invalid frequency');
  }
  
  return date;
}


async function processRecurringTransactions() {
  try {
    const now = new Date();
    console.log('Processing recurring transactions at:', now);

    const dueTransactions = await Transaction.find({
      isRecurring: true,
      isActive: true,
      nextRecurringDate: { $lte: now }
    });

    console.log(`Found ${dueTransactions.length} due recurring transactions`);

    const results = [];

    for (const recurringTx of dueTransactions) {
      try {
        if (recurringTx.recurringEndDate && recurringTx.recurringEndDate < now) {
          recurringTx.isActive = false;
          await recurringTx.save();
          console.log(`Deactivated expired recurring transaction: ${recurringTx._id}`);
          continue;
        }

        const newTransaction = new Transaction({
          userId: recurringTx.userId,
          type: recurringTx.type,
          category: recurringTx.category,
          amount: recurringTx.amount,
          description: `${recurringTx.description} (Auto-generated from recurring transaction)`,
          date: now,
          isRecurring: false,
          parentRecurringId: recurringTx._id
        });

        await newTransaction.save();
        console.log(`Created new transaction from recurring: ${newTransaction._id}`);

        recurringTx.lastProcessedDate = now;
        recurringTx.nextRecurringDate = calculateNextDate(now, recurringTx.recurringFrequency);
        await recurringTx.save();

        results.push({
          recurringId: recurringTx._id,
          newTransactionId: newTransaction._id,
          success: true
        });
      } catch (error) {
        console.error(`Error processing recurring transaction ${recurringTx._id}:`, error);
        results.push({
          recurringId: recurringTx._id,
          success: false,
          error: error.message
        });
      }
    }

    return {
      processed: results.length,
      successful: results.filter(r => r.success).length,
      failed: results.filter(r => !r.success).length,
      results
    };
  } catch (error) {
    console.error('Error in processRecurringTransactions:', error);
    throw error;
  }
}


async function processSubscriptions() {
  try {
    const now = new Date();
    console.log('💳 Processing subscriptions at:', now);

    const subscriptions = await Subscription.find({
      autoCreateTransaction: true
    });

    console.log(`Found ${subscriptions.length} active subscriptions`);

    const results = [];

    for (const subscription of subscriptions) {
      try {
        const renewalDate = new Date(subscription.renewalDate);
        
        const lastProcessed = subscription.lastTransactionDate || new Date(0);
        const daysSinceProcessed = Math.floor((now - lastProcessed) / (1000 * 60 * 60 * 24));
        
        if (renewalDate <= now && daysSinceProcessed >= 1) {
          if (subscription.linkedRecurringTransactionId) {
            continue;
          }

          const newTransaction = new Transaction({
            userId: subscription.userId,
            type: 'Expense',
            category: subscription.category || 'Subscription',
            amount: subscription.amount,
            description: `Subscription: ${subscription.name}`,
            date: now,
            isRecurring: false
          });

          await newTransaction.save();
          console.log(`Created transaction from subscription: ${subscription.name}`);

          subscription.lastTransactionDate = now;
          
          const nextRenewal = new Date(renewalDate);
          nextRenewal.setMonth(nextRenewal.getMonth() + 1);
          subscription.renewalDate = nextRenewal.toISOString().split('T')[0];
          
          await subscription.save();

          results.push({
            subscriptionId: subscription._id,
            transactionId: newTransaction._id,
            success: true
          });
        }
      } catch (error) {
        console.error(`Error processing subscription ${subscription._id}:`, error);
        results.push({
          subscriptionId: subscription._id,
          success: false,
          error: error.message
        });
      }
    }

    return {
      processed: results.length,
      successful: results.filter(r => r.success).length,
      failed: results.filter(r => !r.success).length,
      results
    };
  } catch (error) {
    console.error('Error in processSubscriptions:', error);
    throw error;
  }
}


async function createRecurringTransaction(userId, transactionData) {
  const { type, category, amount, description, frequency, startDate, endDate } = transactionData;

  const start = startDate ? new Date(startDate) : new Date();
  const nextDate = calculateNextDate(start, frequency);

  const recurringTransaction = new Transaction({
    userId,
    type,
    category,
    amount,
    description,
    date: start,
    isRecurring: true,
    recurringFrequency: frequency,
    recurringEndDate: endDate ? new Date(endDate) : null,
    nextRecurringDate: nextDate,
    lastProcessedDate: null,
    isActive: true
  });

  await recurringTransaction.save();
  
  const firstTransaction = new Transaction({
    userId,
    type,
    category,
    amount,
    description: `${description} (Recurring - Initial)`,
    date: start,
    isRecurring: false,
    parentRecurringId: recurringTransaction._id
  });

  await firstTransaction.save();

  return { recurringTransaction, firstTransaction };
}

async function stopRecurringTransaction(transactionId, userId) {
  const transaction = await Transaction.findOne({
    _id: transactionId,
    userId,
    isRecurring: true
  });

  if (!transaction) {
    throw new Error('Recurring transaction not found');
  }

  transaction.isActive = false;
  await transaction.save();

  return transaction;
}


async function getActiveRecurringTransactions(userId) {
  return await Transaction.find({
    userId,
    isRecurring: true,
    isActive: true
  }).sort({ nextRecurringDate: 1 });
}

module.exports = {
  calculateNextDate,
  processRecurringTransactions,
  processSubscriptions,
  createRecurringTransaction,
  stopRecurringTransaction,
  getActiveRecurringTransactions
};


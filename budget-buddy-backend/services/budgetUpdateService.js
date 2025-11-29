const Budget = require('../models/Budget');
const Transaction = require('../models/Transaction');

/**
 * Updates the spentAmount for a budget based on matching transactions
 * @param {string} userId - The user ID
 * @param {string} type - Transaction type ('Income' or 'Expense')
 * @param {string} category - Transaction category
 */
async function updateBudgetFromTransactions(userId, type, category) {
  try {
    // Find the budget matching this transaction's type and category
    const budget = await Budget.findOne({
      userId,
      type,
      category
    });

    if (!budget) {
      // No budget exists for this category/type, which is fine
      return;
    }

    // Get all transactions matching this budget's type and category
    const transactions = await Transaction.find({
      userId,
      category: budget.category,
      type: budget.type
    });

    // Calculate total spent/earned from matching transactions
    const spentAmount = transactions.reduce((sum, t) => sum + Math.abs(t.amount), 0);

    // Update budget if spent amount changed
    if (budget.spentAmount !== spentAmount) {
      budget.spentAmount = spentAmount;
      await budget.save();
      console.log(`Updated budget ${budget._id} (${budget.category}): spentAmount = ${spentAmount}`);
    }
  } catch (error) {
    console.error(`Error updating budget for ${type}/${category}:`, error);
    // Don't throw - we don't want budget update failures to break transaction operations
  }
}

module.exports = {
  updateBudgetFromTransactions
};


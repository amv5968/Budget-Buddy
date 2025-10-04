// backend/controllers/transactionController.js
const getTransactions = (req, res) => {
    res.json([
      { id: 1, description: 'Grocery shopping', amount: -50 },
      { id: 2, description: 'Salary', amount: 1500 },
      { id: 3, description: 'Electric bill', amount: -100 }
    ]);
  };
  
  const addTransaction = (req, res) => {
    const { description, amount } = req.body;
    res.json({
      success: true,
      message: 'Transaction added!',
      data: { description, amount }
    });
  };
  
  // 👇 This is critical
  module.exports = { getTransactions, addTransaction };
  
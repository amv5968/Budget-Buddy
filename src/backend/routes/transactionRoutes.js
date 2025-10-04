// backend/routes/transactionRoutes.js
const express = require('express');
const router = express.Router();
const TransactionController = require('../controllers/transactionController');

// These must match the exported keys above
router.get('/', TransactionController.getTransactions);
router.post('/', TransactionController.addTransaction);

module.exports = router;

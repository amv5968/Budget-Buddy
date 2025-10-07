import express from 'express';
import cors from 'cors';

const app = express();
app.use(cors());
app.use(express.json());

// ✅ Example route for transactions
app.get('/api/transactions', (req, res) => {
  res.json([
    { id: 1, type: 'Income', amount: 2000, category: 'Salary' },
    { id: 2, type: 'Expense', amount: 500, category: 'Groceries' },
  ]);
});

// Start server
const PORT = 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

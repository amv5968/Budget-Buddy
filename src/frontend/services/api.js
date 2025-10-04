import axios from 'axios';

// 👇 replace with your backend server URL
const API = axios.create({
  baseURL: 'http://localhost:5000/api',
});

export default API;


app.get('/api/transactions', (req, res) => {
    res.json([
      { id: 1, type: 'Income', amount: 2000, category: 'Salary' },
      { id: 2, type: 'Expense', amount: 500, category: 'Groceries' }
    ]);
  });
  
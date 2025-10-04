// server.js
const express = require('express');
const cors = require('cors');

const transactionRoutes = require('./routes/transactionRoutes');

const app = express();
const PORT = 5000;

// middleware
app.use(cors());
app.use(express.json());

// routes
app.use('/api/transactions', transactionRoutes);

// test
app.get('/', (req, res) => {
  res.send('Backend is running 🚀');
});

app.listen(PORT, () => {
  console.log(` Server running on http://localhost:${PORT}`);
});

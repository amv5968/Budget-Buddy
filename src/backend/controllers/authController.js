const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const db = require("../models/userModel");

const SECRET = "budgetbuddysecret"; // later move to .env

// Register new user
exports.register = (req, res) => {
  const { name, email, password } = req.body;
  const hashedPassword = bcrypt.hashSync(password, 10);

  const query = "INSERT INTO users (name, email, password) VALUES (?, ?, ?)";
  db.run(query, [name, email, hashedPassword], function (err) {
    if (err) {
      if (err.message.includes("UNIQUE constraint failed")) {
        return res.status(400).json({ error: "Email already registered" });
      }
      return res.status(500).json({ error: err.message });
    }
    res.status(201).json({ message: "User registered successfully", userId: this.lastID });
  });
};

// Login user
// controllers/authController.js

// controllers/authController.js

exports.login = (req, res) => {
  const { username, password } = req.body;

  // Hardcoded credentials for now
  if (username === 'testuser' && password === '12345') {
    return res.json({
      success: true,
      message: 'Login successful',
      user: { id: 1, username: 'testuser' }
    });
  }

  res.status(401).json({
    success: false,
    message: 'Invalid username or password'
  });
};

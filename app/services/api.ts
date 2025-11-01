// app/services/api.ts
import axios from 'axios';

// IMPORTANT:
// - Android emulator uses 10.0.2.2 to talk to your PC
// - Your server.js is listening on PORT 3000
// - Your routes are mounted under /api
const api = axios.create({
  baseURL: 'http://10.0.2.2:3000/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

export default api;

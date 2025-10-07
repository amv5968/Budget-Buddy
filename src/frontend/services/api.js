import axios from 'axios';

// 👇 Use 10.0.2.2 for Android emulator to access your computer's localhost
const API = axios.create({
  baseURL: 'http://10.0.2.2:5000/api',
});

// Example function: get all transactions
export const getTransactions = async () => {
  try {
    const response = await API.get('/transactions');
    return response.data;
  } catch (error) {
    console.error('Error fetching transactions:', error);
    return [];
  }
};

export default API;

import api from '../../budget-buddy-backend/config/api';

export interface Transaction {
  _id: string;
  userId: string;
  type: 'Income' | 'Expense';
  category: string;
  amount: number;
  description?: string;
  date: string;
  createdAt: string;
}

export interface TransactionStats {
  totalIncome: number;
  totalExpense: number;
  balance: number;
}

export const getTransactions = async (): Promise<Transaction[]> => {
  const response = await api.get('/transactions');
  return response.data;
};

export const getTransactionStats = async (): Promise<TransactionStats> => {
  const response = await api.get('/transactions/stats');
  return response.data;
};

export const addTransaction = async (data: {
  type: string;
  category: string;
  amount: number;
  description?: string;
  date?: string;
}): Promise<Transaction> => {
  const response = await api.post('/transactions', data);
  return response.data;
};

export const updateTransaction = async (
  id: string,
  data: {
    type: string;
    category: string;
    amount: number;
    description?: string;
    date?: string;
  }
): Promise<Transaction> => {
  const response = await api.put(`/transactions/${id}`, data);
  return response.data;
};

export const deleteTransaction = async (id: string): Promise<void> => {
  await api.delete(`/transactions/${id}`);
};
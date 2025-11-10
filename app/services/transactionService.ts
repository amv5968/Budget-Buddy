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
  isRecurring?: boolean;
  recurringFrequency?: 'daily' | 'weekly' | 'monthly' | 'yearly';
  recurringEndDate?: string;
  nextRecurringDate?: string;
  lastProcessedDate?: string;
  parentRecurringId?: string;
  isActive?: boolean;
}

export interface TransactionStats {
  totalIncome: number;
  totalExpense: number;
  balance: number;
}

export interface RecurringTransactionData {
  type: string;
  category: string;
  amount: number;
  description?: string;
  frequency: 'daily' | 'weekly' | 'monthly' | 'yearly';
  startDate?: string;
  endDate?: string;
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


export const getRecurringTransactions = async (): Promise<Transaction[]> => {
  const response = await api.get('/transactions/recurring');
  return response.data;
};

export const createRecurringTransaction = async (data: RecurringTransactionData) => {
  const response = await api.post('/transactions/recurring', data);
  return response.data;
};

export const stopRecurringTransaction = async (id: string) => {
  const response = await api.post(`/transactions/recurring/${id}/stop`);
  return response.data;
};

export const processRecurringTransactions = async () => {
  const response = await api.post('/transactions/recurring/process');
  return response.data;
};

export const processSubscriptions = async () => {
  const response = await api.post('/transactions/subscriptions/process');
  return response.data;
};
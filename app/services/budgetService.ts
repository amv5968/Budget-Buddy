import api from '../../budget-buddy-backend/config/api';

export interface Budget {
  _id: string;
  userId: string;
  category: string;
  totalAmount: number;
  spentAmount: number;
  icon?: string;
  createdAt: string;
}

export const getBudgets = async (): Promise<Budget[]> => {
  const response = await api.get('/budgets');
  return response.data;
};

export const addBudget = async (data: {
  category: string;
  totalAmount: number;
  icon?: string;
}): Promise<Budget> => {
  const response = await api.post('/budgets', data);
  return response.data;
};

export const updateBudgetSpent = async (
  id: string,
  spentAmount: number
): Promise<Budget> => {
  const response = await api.put(`/budgets/${id}`, { spentAmount });
  return response.data;
};
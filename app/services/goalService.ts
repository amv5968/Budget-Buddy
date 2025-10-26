import api from '../../budget-buddy-backend/config/api';

export interface Goal {
  _id: string;
  userId: string;
  name: string;
  targetAmount: number;
  savedAmount: number;
  icon?: string;
  createdAt: string;
}

export const getGoals = async (): Promise<Goal[]> => {
  const response = await api.get('/goals');
  return response.data;
};

export const addGoal = async (data: {
  name: string;
  targetAmount: number;
  icon?: string;
}): Promise<Goal> => {
  const response = await api.post('/goals', data);
  return response.data;
};

export const updateGoalSaved = async (
  id: string,
  savedAmount: number
): Promise<Goal> => {
  const response = await api.put(`/goals/${id}`, { savedAmount });
  return response.data;
};
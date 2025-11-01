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

/**
 * Fetch all goals for the logged-in user
 */
export const getGoals = async (): Promise<Goal[]> => {
  const response = await api.get('/goals');
  return response.data;
};

/**
 * Create a new savings goal
 */
export const addGoal = async (data: {
  name: string;
  targetAmount: number;
  icon?: string;
}): Promise<Goal> => {
  const response = await api.post('/goals', data);
  return response.data;
};

/**
 * Update the saved amount for an existing goal
 */
export const updateGoalSaved = async (
  id: string,
  savedAmount: number
): Promise<Goal> => {
  const response = await api.put(`/goals/${id}`, { savedAmount });
  return response.data;
};

/**
 * Update goal details (name, targetAmount, icon, etc.)
 */
export const updateGoal = async (
  id: string,
  data: Partial<Pick<Goal, 'name' | 'targetAmount' | 'icon'>>
): Promise<Goal> => {
  const response = await api.put(`/goals/${id}`, data);
  return response.data;
};

/**
 * Delete an existing goal by ID
 */
export const deleteGoal = async (goalId: string): Promise<void> => {
  const response = await api.delete(`/goals/${goalId}`);
  return response.data;
};

import api from '../../budget-buddy-backend/config/api';

export interface SubscriptionData {
  name: string;
  amount: number;
  renewalDate: string;
  category?: string;
}

export const getSubscriptions = async () => {
  const res = await api.get('/subscriptions');
  return res.data;
};

export const addSubscription = async (data: SubscriptionData) => {
  const res = await api.post('/subscriptions', data);
  return res.data;
};

export const deleteSubscription = async (id: string) => {
  const res = await api.delete(`/subscriptions/${id}`);
  return res.data;
};

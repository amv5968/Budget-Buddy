import api from '../../budget-buddy-backend/config/api';

export interface LoginResponse {
  token: string;
  user: {
    id: string;
    username: string;
    email: string;
    monthlyAllowance?: number;
  };
}

export interface UserProfile {
  id: string;
  username: string;
  email: string;
  monthlyAllowance: number;
}

export const signup = async (
  username: string,
  email: string,
  password: string
): Promise<LoginResponse> => {
  const response = await api.post('/auth/signup', {
    username,
    email,
    password,
  });
  return response.data;
};

export const login = async (
  emailOrUsername: string,
  password: string
): Promise<LoginResponse> => {
  const response = await api.post('/auth/login', {
    emailOrUsername,
    password,
  });
  return response.data;
};

export const getUserProfile = async (): Promise<UserProfile> => {
  const response = await api.get('/auth/profile');
  return response.data;
};

export const updateMonthlyAllowance = async (
  monthlyAllowance: number
): Promise<UserProfile> => {
  const response = await api.patch('/auth/monthly-allowance', {
    monthlyAllowance,
  });
  return response.data;
};
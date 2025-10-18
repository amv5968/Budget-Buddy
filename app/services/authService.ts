import api from '../../budget-buddy-backend/config/api';

export interface LoginResponse {
  token: string;
  user: {
    id: string;
    username: string;
    email: string;
  };
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
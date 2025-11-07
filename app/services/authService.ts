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

// 🧩 SIGNUP
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

// 🔐 LOGIN
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

// 👤 GET USER PROFILE
export const getUserProfile = async (): Promise<UserProfile> => {
  const response = await api.get('/auth/profile');
  return response.data;
};

// 💰 UPDATE MONTHLY ALLOWANCE
export const updateMonthlyAllowance = async (
  monthlyAllowance: number
): Promise<UserProfile> => {
  const response = await api.patch('/auth/monthly-allowance', {
    monthlyAllowance,
  });
  return response.data;
};

// 🧾 UPDATE USER PROFILE (NEW)
export const updateUserProfile = async (
  profileData: {
    username?: string;
    email?: string;
    monthlyAllowance?: number;
  }
): Promise<UserProfile> => {
  try {
    console.log('[updateUserProfile] sending data:', profileData);
    const response = await api.put('/auth/update-profile', profileData);
    console.log('[updateUserProfile] response:', response.data);
    return response.data;
  } catch (error: any) {
    console.error('[updateUserProfile] error:', error.response?.data || error.message);
    throw error;
  }
};

export const changePassword = async (
  currentPassword: string,
  newPassword: string
): Promise<{ message: string }> => {
  try {
    const response = await api.post('/auth/change-password', {
      currentPassword,
      newPassword,
    });
    return response.data;
  } catch (error: any) {
    console.error('[changePassword] error:', error.response?.data || error.message);
    throw error;
  }
};

import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

const api = axios.create({
  baseURL: 'http://10.0.2.2:3000/api', // Android emulator -> your backend
  timeout: 10000,
});

// Attach Authorization header automatically if we have a token
api.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem('authToken');

    if (token) {
      // If headers exists and has a set() method (AxiosHeaders in Axios 1.x)
      if (config.headers && typeof (config.headers as any).set === 'function') {
        (config.headers as any).set('Authorization', `Bearer ${token}`);
      } else {
        // Fallback for plain object style headers
        (config.headers as any) = {
          ...(config.headers || {}),
          Authorization: `Bearer ${token}`,
        };
      }
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default api;

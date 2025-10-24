import axios from 'axios';

import AsyncStorage from '@react-native-async-storage/async-storage';

const API_URL =   'http://10.0.2.2:3001/api' 

const api = axios.create({

  baseURL: API_URL,

  timeout: 10000,

  headers: {

    'Content-Type': 'application/json',

  },

});

api.interceptors.request.use(

  async (config) => {

    const token = await AsyncStorage.getItem('authToken');

    if (token) {

      config.headers.Authorization = `Bearer ${token}`;

    }

    return config;

  },

  (error) => {

    return Promise.reject(error);

  }

);

api.interceptors.response.use(

  (response) => response,

  async (error) => {

    if (error.response?.status === 401) {

      await AsyncStorage.removeItem('authToken');

      await AsyncStorage.removeItem('user');

    }

    return Promise.reject(error);

  }

);

export default api;
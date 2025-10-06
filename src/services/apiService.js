import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const BASE_URL = 'http://192.168.168.106:8000/api'; // 👈 must match Laravel host

const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  timeout: 20000,
});

api.interceptors.request.use(
  async (config) => {
    console.log(`📤 ${config.method?.toUpperCase()} → ${config.baseURL}${config.url}`);
    const token = await AsyncStorage.getItem('userToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      console.log('🔐 Token attached');
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => {
    console.log(`✅ ${response.config.url} → ${response.status}`);
    return response;
  },
  async (error) => {
    console.log('❌ API Error:', {
      message: error.message,
      url: error.config?.url,
      status: error.response?.status,
      data: error.response?.data,
    });
    if (error.response?.status === 401) {
      await AsyncStorage.removeItem('userToken');
      console.log('🧹 Removed expired token');
    }
    return Promise.reject(error);
  }
);

// APIs
export const authAPI = {
  login: (login, password) => api.post('/login', { login, password }),
  logout: () => api.post('/logout'),
};

export const userAPI = {
  getDashboard: () => api.get('/user/dashboard'),
  getHistory: () => api.get('/user/history'),
  submitChangeRequest: (data) => api.post('/change-request', data),
};

export default api;

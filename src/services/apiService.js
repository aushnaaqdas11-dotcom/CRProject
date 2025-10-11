import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const BASE_URL = 'http://192.168.168.107:8000/api'; // Your local server

const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  timeout: 20000,
});

// Attach token automatically
api.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  response => response,
  async (error) => {
    if (error.response?.status === 401) {
      await AsyncStorage.removeItem('token');
    }
    return Promise.reject(error);
  }
);

export const authAPI = {
  login: (login, password) => api.post('/login', { login, password }),
  logout: () => api.post('/logout'),
};

export const userAPI = {
  getDashboard: () => api.get('/user/dashboard'),
  getHistory: () => api.get('/user/history'),
  submitChangeRequest: (data) => api.post('/change-request', data),
  getQueries: () => api.get('/queries'),
  getSubQueries: (queryId) => api.get(`/sub-queries/${queryId}`),
  getProjects: () => api.get('/projects'),
};

export default api;

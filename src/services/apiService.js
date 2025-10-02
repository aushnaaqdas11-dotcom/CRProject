import axios from 'axios';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Use your new ngrok URL
const NGROK_URL = 'http://10.50.206.54:8000'; // 👈 no /api here

const api = axios.create({
  baseURL: `${NGROK_URL}/api`,  // 👈 only one /api now
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  timeout: 30000,
});


// Request interceptor
api.interceptors.request.use(
  async (config) => {
    console.log(`📤 Making ${config.method?.toUpperCase()} request to: ${config.url}`);
    
    try {
      const token = await AsyncStorage.getItem('userToken');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
        console.log('🔐 Token attached to request');
      }
    } catch (error) {
      console.log('❌ Error getting token:', error);
    }
    return config;
  },
  (error) => {
    console.log('❌ Request setup failed:', error.message);
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => {
    console.log(`✅ Success: ${response.config.method?.toUpperCase()} ${response.config.url}`);
    return response;
  },
  async (error) => {
    console.log('❌ API Error:', error.message);
    return Promise.reject(error);
  }
);

// API endpoints
export const authAPI = {
  login: (login, password) => api.post('/login', { login, password }),
  logout: () => api.post('/logout'),
  getUser: () => api.get('/user'),
  submitChangeRequest: (data) => api.post('/change-request', data),
  getHistory: () => api.get('/user/history'),
};


export const userAPI = {
  getDashboard: () => api.get('/user/dashboard'),
  getProjects: () => api.get('/user/projects'),
};

export const adminAPI = {
  getDashboard: () => api.get('/admin/dashboard'),
  getUsers: () => api.get('/admin/users'),
};

export const resolverAPI = {
  getDashboard: () => api.get('/resolver/dashboard'),
  getRequest: (id) => api.get(`/resolver/request/${id}`),
  updateStatus: (id, data) => api.put(`/resolver/request/${id}`, data),
};

export const assignerAPI = {
  getDashboard: () => api.get('/assigner/dashboard'),
  getRequest: (id) => api.get(`/assigner/request/${id}`),
  getDevelopers: () => api.get('/assigner/developers'),
  assignDeveloper: (id, data) => api.post(`/assigner/assign/${id}`, data),
};

export default api;
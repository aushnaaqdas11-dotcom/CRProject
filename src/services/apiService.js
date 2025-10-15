import axios from 'axios';

const BASE_URL = 'http://10.50.206.72:8000/api'; // Replace with your actual backend URL

const apiService = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor to handle 401 errors
apiService.interceptors.response.use(
  response => response,
  error => {
    if (error.response?.status === 401) {
      return Promise.reject({ message: 'Session expired. Please log in again.' });
    }
    return Promise.reject(error);
  }
);

let authToken = null;

export default {
  setAuthToken(token) {
    authToken = token;
    if (token) {
      apiService.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    } else {
      delete apiService.defaults.headers.common['Authorization'];
    }
  },

  async login(login, password) {
    return apiService.post('/login', { login, password });
  },

  async logout() {
    return apiService.post('/logout');
  },

  async getUserDashboard() {
    return apiService.get('/user/dashboard');
  },

  async getUserHistory() {
    return apiService.get('/user/history');
  },

  async getServices() {
    return apiService.get('/services');
  },

  async getProjects(type) {
    return apiService.get(`/projects/${type}`);
  },

  async getRecentRequests() {
    return apiService.get('/user/requests/recent');
  },

  async submitChangeRequest(data) {
    return apiService.post('/change-request', data);
  },

  async getProjectRequests() {
    return apiService.get('/assigner/requests');
  },

  async assignToDeveloper(data) {
    return apiService.post('/assigner/assign', data);
  },

  async getDevelopers() {
    return apiService.get('/developers');
  },
};
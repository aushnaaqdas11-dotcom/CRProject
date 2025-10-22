// services/apiService.js
import axios from 'axios';

const BASE_URL = 'http://10.50.206.199:8000/api';

const apiService = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor to handle errors without automatic logout
apiService.interceptors.response.use(
  response => response,
  error => {
    // Don't automatically logout on 401, let components handle it
    return Promise.reject(error);
  }
);

let authToken = null;

// Admin API methods
export const adminAPI = {
  setAuthToken(token) {
    authToken = token;
    if (token) {
      apiService.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    } else {
      delete apiService.defaults.headers.common['Authorization'];
    }
  },

  // Dashboard
  async getDashboard() {
    return apiService.get('/admin/dashboard');
  },

  // Users Management
  async getUsers(params = {}) {
    return apiService.get('/admin/users', { params });
  },

  async getUser(id) {
    return apiService.get(`/admin/users/${id}`);
  },

  async createUser(userData) {
    return apiService.post('/admin/users', userData);
  },

  async updateUser(id, userData) {
    return apiService.put(`/admin/users/${id}`, userData);
  },

  async deleteUser(id) {
    return apiService.delete(`/admin/users/${id}`);
  },

  // Roles Management
  async getRoles(params = {}) {
    return apiService.get('/admin/roles', { params });
  },

  async createRole(roleData) {
    return apiService.post('/admin/roles', roleData);
  },

  async updateRole(id, roleData) {
    return apiService.put(`/admin/roles/${id}`, roleData);
  },

  async deleteRole(id) {
    return apiService.delete(`/admin/roles/${id}`);
  },

  // Project Assignment
  async getAssignableUsers(params = {}) {
    return apiService.get('/admin/assignable-users', { params });
  },

  async getProjectsForAssignment() {
    return apiService.get('/admin/projects');
  },

  async assignProjectsToUser(assignmentData) {
    return apiService.post('/admin/assign-projects', assignmentData);
  },

  async getUserAssignedProjects(userId) {
    return apiService.get(`/admin/users/${userId}/assigned-projects`);
  },

  async removeProjectAssignment(userId, projectId) {
    return apiService.delete(`/admin/users/${userId}/projects/${projectId}`);
  }
};

// Existing user APIs remain the same
export default {
  setAuthToken(token) {
    adminAPI.setAuthToken(token);
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

  async getSubQueries(queryId) {
    return apiService.get(`/sub-queries/${queryId}`);
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
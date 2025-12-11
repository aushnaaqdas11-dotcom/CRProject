// services/apiService.js
import axios from 'axios';

const BASE_URL = 'http://10.50.206.179:8000/api';

const apiService = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  timeout: 120000,
});

// Don't auto-handle 401 
apiService.interceptors.response.use(
  response => response,
  error => Promise.reject(error)
);

let authToken = null;

// ===============================================
// ASSIGNER API - FULLY UPDATED & PERFECT
// ===============================================
export const assignerAPI = {
  setAuthToken(token) {
    authToken = token;
    if (token) {
      apiService.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    } else {
      delete apiService.defaults.headers.common['Authorization'];
    }
  },

  // Get all requests (with optional filters)
  getRequests: (params = {}) => apiService.get('/assigner/requests', { params }),

  // Get requests by status (pending, inprogress, completed)
  getRequestsByStatus: (status, params = {}) =>
    apiService.get(`/assigner/requests/status/${status}`, { params }),

  // Get single request details
  getRequestDetails: (requestId) =>
    apiService.get(`/assigner/requests/${requestId}`),

  // Get all developers
  getDevelopers: () => apiService.get('/assigner/developers'),

  // Assign to developer (pending/inprogress/completed)
  assignToDeveloper: (data) =>
    apiService.post('/assigner/assign', data),

  // UPDATE PRICING ONLY
  updatePricingOnly: (requestId, pricing) =>
    apiService.post(`/assigner/requests/${requestId}/pricing-only`, { pricing }),

  // UPLOAD FILE + PRICING (React Native Base64)
  uploadFileAndPricing: async (requestId, fileData, fileName, fileType, pricing = null) => {
    const payload = {
      file_name: fileName,
      file_data: fileData,        // Full data:url;base64,... string
      file_type: fileType,
    };

    if (pricing !== null && pricing !== '') {
      payload.pricing = Number(pricing);
    }

    return apiService.post(`/assigner/upload-file/${requestId}`, payload);
  },

  // UPDATE PRICING + FILE (Web form ke liye - agar kabhi use karo)
  updatePricingAndFile: (requestId, formData) =>
    apiService.post(`/assigner/requests/${requestId}/update-pricing-file`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),

  // DOWNLOAD ATTACHMENT (PDF/Image)
  downloadAttachment: (requestId) =>
    apiService.get(`/assigner/requests/${requestId}/attachment`, {
      responseType: 'blob', // Important for file download
    }),

  // Debug routes (optional - production mein hata sakte ho)
  debugAttachments: () => apiService.get('/assigner/debug-attachments'),
  debugUploadIssue: (requestId) => apiService.get(`/assigner/debug-upload-issue/${requestId}`),
};

// ===============================================
// OTHER APIs (Already Perfect - Sirf chhota sa update)
// ===============================================

export const resolverAPI = {
  setAuthToken: assignerAPI.setAuthToken,
  getDashboard: () => apiService.get('/resolver/dashboard'),
  getAssignedRequests: () => apiService.get('/resolver/requests'),
  getRequestDetails: (id) => apiService.get(`/resolver/requests/${id}`),
  updateRequestStatus: (id, data) => apiService.put(`/resolver/requests/${id}/status`, data),
  getStatistics: () => apiService.get('/resolver/statistics'),
  getProfile: () => apiService.get('/resolver/profile'),
};

export const adminAPI = {
  setAuthToken: assignerAPI.setAuthToken,
  getDashboard: () => apiService.get('/admin/dashboard'),
  getUsers: (params = {}) => apiService.get('/admin/users', { params }),
  getUser: (id) => apiService.get(`/admin/users/${id}`),
  createUser: (data) => apiService.post('/admin/users', data),
  updateUser: (id, data) => apiService.put(`/admin/users/${id}`, data),
  deleteUser: (id) => apiService.delete(`/admin/users/${id}`),
  getRoles: () => apiService.get('/admin/roles'),
  getAssignableUsers: () => apiService.get('/admin/assignable-users'),
  getProjectsForAssignment: () => apiService.get('/admin/projects-for-assignment'),
  assignProjectsToUser: (data) => apiService.post('/admin/assign-projects', data),
  
  // NEW PROJECT MANAGEMENT APIs
  getProjects: (params = {}) => apiService.get('/admin/projects', { params }),
  getProject: (id) => apiService.get(`/admin/projects/${id}`),
  createProject: (data) => apiService.post('/admin/projects', data),
  updateProject: (id, data) => apiService.put(`/admin/projects/${id}`, data),
  deleteProject: (id) => apiService.delete(`/admin/projects/${id}`),
  getProjectStats: () => apiService.get('/admin/projects-stats'),
  searchProjects: (query) => apiService.get('/admin/projects-search', { params: { q: query } }),
  getProjectsByType: (type) => apiService.get(`/admin/projects-by-type/${type}`),
  bulkDeleteProjects: (projectIds) => apiService.post('/admin/projects/bulk-delete', { project_ids: projectIds }),
};

export const adgAPI = {
  setAuthToken: assignerAPI.setAuthToken,
  getDashboard: () => apiService.get('/adg/dashboard'),
};

// ===============================================
// MAIN EXPORT (Used in App.js) - FIXED
// ===============================================
export default {
  // Global token setter
  setAuthToken(token) {
    assignerAPI.setAuthToken(token);
    resolverAPI.setAuthToken(token);
    adminAPI.setAuthToken(token);
    adgAPI.setAuthToken(token);
  },

  // Auth
  login: (login, password) => apiService.post('/login', { login, password }),
  logout: () => apiService.post('/logout'),

  // User APIs - FIXED: All endpoints corrected
  getUserDashboard: () => apiService.get('/user/dashboard'),
  getUserHistory: () => apiService.get('/user/history'),
  getRecentRequests: () => apiService.get('/user/requests/recent'),
  getServices: () => apiService.get('/user/services'), // ← FIXED: Added /user prefix
  getProjects: (type) => apiService.get(`/user/projects/${type}`),
  submitChangeRequest: (data) => apiService.post('/user/change-request', data), // ← FIXED: Removed duplicate
  getSubQueries: (queryId) => apiService.get(`/user/sub-queries/${queryId}`),

  // Role-based APIs
  assigner: assignerAPI,
  resolver: resolverAPI,
  admin: adminAPI,
  adg: adgAPI,
};
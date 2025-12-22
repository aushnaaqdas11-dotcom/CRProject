import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const BASE_URL = 'http://10.50.206.55:8000/api';

// Create axios instance
const apiService = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  timeout: 120000,
});

// Global token variable - SIMPLIFIED
let authToken = null;
let tokenInitialized = false;

// ===============================================
// FIXED TOKEN MANAGEMENT - SIMPLIFIED
// ===============================================

// ✅ FIXED: Simple token setter without overcomplication
export const setAuthTokenGlobal = async (token) => {
  console.log('🔄 setAuthTokenGlobal called:', token ? 'Token set' : 'Token cleared');
  
  authToken = token;
  
  if (token) {
    // Remove any existing Bearer prefix
    const cleanToken = token.startsWith('Bearer ') ? token.substring(7) : token;
    
    // Set in axios headers
    apiService.defaults.headers.common['Authorization'] = `Bearer ${cleanToken}`;
    
    // Save to storage
    try {
      await AsyncStorage.setItem('api_token', cleanToken);
      console.log(`✅ Token saved to storage`);
    } catch (error) {
      console.error('❌ Error saving token:', error);
    }
  } else {
    // Clear token
    delete apiService.defaults.headers.common['Authorization'];
    
    // Remove from storage
    try {
      await AsyncStorage.multiRemove(['api_token', 'user_data']);
      console.log('✅ All tokens removed from storage');
    } catch (error) {
      console.error('❌ Error removing tokens:', error);
    }
    authToken = null;
  }
  
  tokenInitialized = true;
  return true;
};

// ✅ FIXED: Simple token getter
const getToken = async () => {
  // If we already have token in memory, use it
  if (authToken) {
    return authToken;
  }
  
  // If not initialized, get from storage
  if (!tokenInitialized) {
    try {
      console.log('🔍 Initializing token from storage...');
      const storedToken = await AsyncStorage.getItem('api_token');
      
      if (storedToken) {
        authToken = storedToken;
        apiService.defaults.headers.common['Authorization'] = `Bearer ${storedToken}`;
        console.log('✅ Token initialized from storage');
      } else {
        console.log('⚠️ No token found in storage');
      }
      
      tokenInitialized = true;
    } catch (error) {
      console.error('❌ Error initializing token:', error);
      tokenInitialized = true;
    }
  }
  
  return authToken;
};

// ✅ FIXED: Simple token check for API calls
const ensureTokenForRequest = async (config) => {
  // Skip token for auth endpoints
  const isAuthEndpoint = config.url.includes('/login') || 
                        config.url.includes('/captcha') || 
                        config.url.includes('/test/') ||
                        config.url.includes('/logout'); // ✅ ADDED: logout endpoint
  
  if (isAuthEndpoint) {
    console.log('✅ Auth endpoint, skipping token');
    delete config.headers.Authorization;
    return config;
  }
  
  // For other endpoints, ensure we have a token
  try {
    const token = await getToken();
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      console.log(`✅ Token attached: ${token.substring(0, 15)}...`);
    } else {
      console.log('⚠️ No token available');
      // Don't add Authorization header if no token
    }
  } catch (error) {
    console.error('❌ Error getting token for request:', error);
  }
  
  return config;
};

// ===============================================
// REQUEST INTERCEPTOR - SIMPLIFIED
// ===============================================

apiService.interceptors.request.use(
  async (config) => {
    console.log(`🚀 [${config.method?.toUpperCase()}] ${config.url}`);
    
    // Add token to request if needed
    const updatedConfig = await ensureTokenForRequest(config);
    
    return updatedConfig;
  },
  (error) => {
    console.error('❌ Request interceptor failed:', error);
    return Promise.reject(error);
  }
);

// ===============================================
// RESPONSE INTERCEPTOR - FIXED FOR LOGOUT
// ===============================================

// In apiService.js - Update the response interceptor:
apiService.interceptors.response.use(
  (response) => {
    console.log(`✅ [${response.status}] ${response.config.url}`);
    return response;
  },
  async (error) => {
    const status = error.response?.status;
    const url = error.config?.url;

    // ✅ FIX: Don't log 401 errors for logout (they're expected)
    if (url?.includes('/logout') && status === 401) {
      console.log('🔓 Logout completed (token invalidated)');
      // Re-throw with a cleaner message
      return Promise.reject({ 
        message: 'Logout completed', 
        isLogout: true 
      });
    }

    console.error('❌ API Error:', status, url, error.response?.data || error.message);

    // If 401 and not on login/logout, clear token and force re-login
    if (status === 401) {
      console.log('🔒 Token expired/invalid for non-logout endpoint');
      // Clear tokens and force re-login for other endpoints
      await setAuthTokenGlobal(null);
    }

    return Promise.reject(error);
  }
);

// ===============================================
// API ENDPOINTS - WITH FIXED LOGOUT
// ===============================================

export const authAPI = {
  // Get CAPTCHA
  getCaptcha: () => apiService.post('/captcha'),
  
  // Login with CAPTCHA
  login: (login, password, captcha, captchaKey) => 
    apiService.post('/login', { login, password, captcha, captcha_key: captchaKey }),
  
  // ✅ FIXED: Logout with proper error handling
  logout: async () => {
    try {
      // Try to call logout API
      const response = await apiService.post('/logout');
      console.log('✅ Logout API succeeded');
      return response;
    } catch (error) {
      // If logout API fails, still return success for local cleanup
      console.log('⚠️ Logout API failed, but continuing with local cleanup');
      return { data: { success: true, message: 'Local cleanup completed' } };
    }
  },
  
  // Get current user
  getUser: () => apiService.get('/auth/user'),
};

// ... rest of your API endpoints remain the same ...
export const userAPI = {
  getDashboard: () => apiService.get('/user/dashboard'),
  getHistory: () => apiService.get('/user/history'),
  getRecentRequests: () => apiService.get('/user/requests/recent'),
  getServices: () => apiService.get('/user/services'),
  getProjects: (type) => apiService.get(`/user/projects/${type}`),
  submitChangeRequest: (data) => apiService.post('/user/change-request', data),
  getSubQueries: (queryId) => apiService.get(`/user/sub-queries/${queryId}`),
};

export const assignerAPI = {
  getRequests: (params = {}) => apiService.get('/assigner/requests', { params }),
  getRequestsByStatus: (status, params = {}) => 
    apiService.get(`/assigner/requests/status/${status}`, { params }),
  getRequestDetails: (requestId) => 
    apiService.get(`/assigner/requests/${requestId}`),
  getDevelopers: () => apiService.get('/assigner/developers'),
  assignToDeveloper: (data) => apiService.post('/assigner/assign', data),
  updatePricingOnly: (requestId, pricing) => 
    apiService.post(`/assigner/requests/${requestId}/pricing-only`, { pricing }),
  uploadFileAndPricing: async (requestId, fileData, fileName, fileType, pricing = null) => {
    const payload = {
      file_name: fileName,
      file_data: fileData,
      file_type: fileType,
    };
    if (pricing !== null && pricing !== '') {
      payload.pricing = Number(pricing);
    }
    return apiService.post(`/assigner/upload-file/${requestId}`, payload);
  },
  updatePricingAndFile: (requestId, formData) =>
    apiService.post(`/assigner/requests/${requestId}/update-pricing-file`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  downloadAttachment: (requestId) =>
    apiService.get(`/assigner/requests/${requestId}/attachment`, {
      responseType: 'blob',
    }),
  debugAttachments: () => apiService.get('/assigner/debug-attachments'),
  debugUploadIssue: (requestId) => apiService.get(`/assigner/debug-upload-issue/${requestId}`),
};

export const resolverAPI = {
  getDashboard: () => apiService.get('/resolver/dashboard'),
  getAssignedRequests: () => apiService.get('/resolver/requests'),
  getRequestDetails: (id) => apiService.get(`/resolver/requests/${id}`),
  updateRequestStatus: (id, data) => apiService.put(`/resolver/requests/${id}/status`, data),
  getStatistics: () => apiService.get('/resolver/statistics'),
  getProfile: () => apiService.get('/resolver/profile'),
};

export const adminAPI = {
  setAuthToken: setAuthTokenGlobal,
  getCurrentToken: () => authToken,
  clearAuthToken: async () => {
    await setAuthTokenGlobal(null);
  },
  getDashboard: () => apiService.get('/admin/dashboard'),
  getUsers: (params = {}) => apiService.get('/admin/users', { params }),
  getUser: (id) => apiService.get(`/admin/users/${id}`),
  createUser: (data) => apiService.post('/admin/users', data),
  updateUser: (id, data) => apiService.put(`/admin/users/${id}`, data),
  deleteUser: (id) => apiService.delete(`/admin/users/${id}`),
  getProjects: (params = {}) => apiService.get('/admin/projects', { params }),
  getProject: (id) => apiService.get(`/admin/projects/${id}`),
  createProject: (data) => apiService.post('/admin/projects', data),
  updateProject: (id, data) => apiService.put(`/admin/projects/${id}`, data),
  deleteProject: (id) => apiService.delete(`/admin/projects/${id}`),
  getProjectStats: () => apiService.get('/admin/projects-stats'),
  searchProjects: (query) => apiService.get('/admin/projects-search', { params: { q: query } }),
  getProjectsByType: (type) => apiService.get(`/admin/projects-by-type/${type}`),
  bulkDeleteProjects: (projectIds) => apiService.post('/admin/projects/bulk-delete', { project_ids: projectIds }),
  getRoles: () => apiService.get('/admin/roles'),
  getAssignableUsers: () => apiService.get('/admin/assignable-users'),
  getProjectsForAssignment: () => apiService.get('/admin/projects-for-assignment'),
  assignProjectsToUser: (data) => apiService.post('/admin/assign-projects', data),
  getProjectsForUserAssignment: () => apiService.get('/admin/projects-for-user-assignment'),
  getUsersForAssignment: (search = '') => 
    apiService.get('/admin/users-for-assignment', { params: { search } }),
  assignUsersToProject: (data) => 
    apiService.post('/admin/assign-users-to-project', data),
  getAssignedUsersForProject: (projectId) => 
    apiService.get(`/admin/projects/${projectId}/assigned-users`),
  removeUserFromProject: (projectId, userId) => 
    apiService.delete(`/admin/projects/${projectId}/users/${userId}`),
};

export const adgAPI = {
  getDashboard: () => apiService.get('/adg/dashboard'),
};

export const deptHeadAPI = {
  getDashboard: () => apiService.get('/dept-head/dashboard'),
  getStatistics: () => apiService.get('/dept-head/statistics'),
  getPendingRequests: (params = {}) => apiService.get('/dept-head/pending-requests', { params }),
  getRequestHistory: (params = {}) => apiService.get('/dept-head/history', { params }),
  getRequestDetails: (id) => apiService.get(`/dept-head/requests/${id}`),
  approveRequest: (id) => apiService.post(`/dept-head/requests/${id}/approve`),
  rejectRequest: (id, reason) => apiService.post(`/dept-head/requests/${id}/reject`, {
    rejection_reason: reason
  }),
};

export const testAPI = {
  testLogin: (role) => apiService.get(`/test/auth/login/${role}`),
  testUsersList: () => apiService.get('/test/auth/users'),
  testUserDashboard: () => apiService.get('/test/user/dashboard'),
  testUserServices: () => apiService.get('/test/user/services'),
  testUserProjects: (type) => apiService.get(`/test/user/projects/${type}`),
  testAdminDashboard: () => apiService.get('/test/admin/dashboard'),
  testAdminUsers: () => apiService.get('/test/admin/users'),
  testAssignerRequests: () => apiService.get('/test/assigner/requests'),
  testAssignerDevelopers: () => apiService.get('/test/assigner/developers'),
  testResolverDashboard: () => apiService.get('/test/resolver/dashboard'),
  testAdgDashboard: () => apiService.get('/test/adg/dashboard'),
};

// ===============================================
// MAIN EXPORT - SIMPLIFIED
// ===============================================

export default {
  // Token management
  setAuthToken: setAuthTokenGlobal,
  getCurrentToken: () => authToken,
  
  // Initialize token from storage
  initializeToken: async () => {
    try {
      console.log('🚀 Initializing token...');
      
      const token = await AsyncStorage.getItem('api_token');
      if (token) {
        await setAuthTokenGlobal(token);
        console.log('✅ Token initialized');
        return true;
      }
      console.log('⚠️ No stored token');
      return false;
    } catch (error) {
      console.error('❌ Error initializing token:', error);
      return false;
    }
  },
  
  // Clear all tokens
  clearToken: async () => {
    console.log('🧹 Clearing tokens...');
    await setAuthTokenGlobal(null);
  },
  
  // Debug functions
  debugHeaders: () => {
    console.log('🔍 Current Authorization header:', apiService.defaults.headers.common['Authorization']);
    console.log('🔍 Token in memory:', authToken ? 'Yes' : 'No');
  },
  
  testToken: async () => {
    try {
      console.log('🧪 Testing token...');
      const response = await apiService.get('/user/dashboard');
      console.log('✅ Token test successful');
      return { success: true, status: response.status };
    } catch (error) {
      console.error('❌ Token test failed:', error.response?.status);
      return { success: false, error: error.response?.data || error.message };
    }
  },
  
  // API groups
  auth: authAPI,
  user: userAPI,
  assigner: assignerAPI,
  resolver: resolverAPI,
  admin: adminAPI,
  adg: adgAPI,
  test: testAPI,
  deptHead: deptHeadAPI,
  
  // Individual methods
  getUserDashboard: userAPI.getDashboard,
  getUserHistory: userAPI.getHistory,
  getRecentRequests: userAPI.getRecentRequests,
  getServices: userAPI.getServices,
  getProjects: userAPI.getProjects,
  submitChangeRequest: userAPI.submitChangeRequest,
  getSubQueries: userAPI.getSubQueries,
};
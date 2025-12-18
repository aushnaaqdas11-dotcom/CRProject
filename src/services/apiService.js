import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const BASE_URL = 'http://10.50.206.179:8000/api';

// Create axios instance
const apiService = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  timeout: 120000,
});

// Global token variable
let authToken = null;
let isTokenInitialized = false;
let tokenPromise = null;

// Token refresh state management
let isRefreshing = false;
let failedQueue = [];

// Process failed queue
const processQueue = (error, token = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

// ===============================================
// TOKEN MANAGEMENT - FIXED VERSION
// ===============================================

// Single global function to manage token
export const setAuthTokenGlobal = async (token) => {
  console.log('🔄 setAuthTokenGlobal called:', token ? `token length: ${token.length}` : 'NULL');
  
  authToken = token;
  
  if (token) {
    // Remove any existing Bearer prefix
    const cleanToken = token.startsWith('Bearer ') ? token.substring(7) : token;
    apiService.defaults.headers.common['Authorization'] = `Bearer ${cleanToken}`;
    
    try {
      await AsyncStorage.setItem('api_token', cleanToken);
      console.log(`✅ Token set in headers and storage: ${cleanToken.substring(0, 30)}...`);
    } catch (error) {
      console.error('❌ Error saving token to storage:', error);
    }
  } else {
    delete apiService.defaults.headers.common['Authorization'];
    try {
      await AsyncStorage.multiRemove(['api_token', 'refresh_token', 'user_data']);
      console.log('✅ All tokens removed from storage');
    } catch (error) {
      console.error('❌ Error removing tokens from storage:', error);
    }
    authToken = null;
  }
  
  isTokenInitialized = true;
  tokenPromise = null;
};

// Get token with promise caching
const getToken = async () => {
  if (authToken && isTokenInitialized) {
    return authToken;
  }
  
  if (tokenPromise) {
    console.log('⏳ Token fetch already in progress, waiting...');
    return await tokenPromise;
  }
  
  tokenPromise = (async () => {
    try {
      console.log('🔍 Fetching token from AsyncStorage...');
      const token = await AsyncStorage.getItem('api_token');
      
      if (token) {
        authToken = token;
        apiService.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        isTokenInitialized = true;
        console.log(`✅ Token loaded from storage: ${token.substring(0, 30)}...`);
        return token;
      }
      
      console.log('⚠️ No token found in storage');
      isTokenInitialized = true;
      return null;
    } catch (error) {
      console.error('❌ Error fetching token:', error);
      isTokenInitialized = true;
      return null;
    } finally {
      tokenPromise = null;
    }
  })();
  
  return await tokenPromise;
};

// ===============================================
// REQUEST INTERCEPTOR - FIXED VERSION
// ===============================================

apiService.interceptors.request.use(
  async (config) => {
    console.log(`🚀 [REQUEST] ${config.method?.toUpperCase()} ${config.url}`);
    
    const isAuthEndpoint = config.url.includes('/auth/login') || 
                          config.url.includes('/auth/captcha') || 
                          config.url.includes('/auth/logout') ||
                          config.url.includes('/test/');
    
    if (!isAuthEndpoint) {
      try {
        // Wait for token initialization if not done
        if (!isTokenInitialized) {
          console.log('⏳ Waiting for token initialization...');
          await getToken();
        }
        
        // Get fresh token
        const token = await getToken();
        
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
          console.log(`✅ Token attached to request: ${token.substring(0, 20)}...`);
        } else {
          console.log('⚠️ No token available for request');
          // Don't add Authorization header if no token
        }
      } catch (error) {
        console.error('❌ Error in token interceptor:', error);
        // Don't throw, just proceed without token
      }
    } else {
      console.log('✅ Auth endpoint, skipping token check');
      // Ensure no Authorization header for auth endpoints
      delete config.headers.Authorization;
    }
    
    return config;
  },
  (error) => {
    console.error('❌ Request interceptor failed:', error);
    return Promise.reject(error);
  }
);

// ===============================================
// ENHANCED RESPONSE INTERCEPTOR WITH TOKEN REFRESH - UPDATED
// ===============================================

apiService.interceptors.response.use(
  (response) => {
    console.log(`✅ [RESPONSE ${response.status}] ${response.config.url}`);
    return response;
  },
  async (error) => {
    const originalRequest = error.config;
    const url = error.config?.url;
    const status = error.response?.status;
    const data = error.response?.data;
    
    // ✅ SILENTLY IGNORE 401 for logout endpoint
    if (url && url.includes('/auth/logout') && status === 401) {
      console.log('🔐 Logout endpoint: Token already invalid (expected)');
      return Promise.reject(error);
    }
    
    console.error('❌ [API ERROR DETAILS] ======================');
    console.error('URL:', url);
    console.error('Status:', status);
    console.error('Message:', data?.message || error.message);
    console.error('=====================================');
    
    // ========== HANDLE 401 UNAUTHORIZED (TOKEN EXPIRED) ==========
    if (status === 401) {
      console.log('🔒 401 Unauthorized - Token expired or invalid');
      
      // Don't retry auth endpoints
      if (url && (url.includes('/auth/login') || url.includes('/auth/logout'))) {
        return Promise.reject(error);
      }
      
      // If already refreshing, add to queue
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then(token => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return apiService(originalRequest);
          })
          .catch(err => Promise.reject(err));
      }
      
      originalRequest._retry = true;
      isRefreshing = true;
      
      try {
        console.log('🔄 Attempting token refresh...');
        
        // ✅ FIXED: Get current token for refresh
        const currentToken = await getToken();
        
        if (!currentToken) {
          console.log('❌ No token available for refresh');
          throw new Error('No token available');
        }
        
        // ✅ FIXED: Call refresh token endpoint with current token
        // Note: This requires the backend to have a /auth/refresh-token endpoint
        const refreshResponse = await apiService.post('/auth/refresh-token', {}, {
          headers: {
            'Authorization': `Bearer ${currentToken}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          }
        });
        
        console.log('📡 Refresh response:', refreshResponse.data);
        
        if (refreshResponse.data.success) {
          const newToken = refreshResponse.data.data?.token;
          
          if (newToken) {
            console.log('✅ Token refreshed successfully');
            
            // Save new token
            await setAuthTokenGlobal(newToken);
            
            // Update original request with new token
            originalRequest.headers.Authorization = `Bearer ${newToken}`;
            
            // Process queued requests
            processQueue(null, newToken);
            isRefreshing = false;
            
            // Retry original request
            return apiService(originalRequest);
          }
        } else {
          throw new Error(refreshResponse.data.message || 'Token refresh failed');
        }
      } catch (refreshError) {
        console.log('❌ Token refresh failed:', refreshError.message);
        
        // If refresh endpoint doesn't exist (404), handle gracefully
        if (refreshError.response?.status === 404) {
          console.log('🔄 Refresh endpoint not found, clearing token...');
        }
        
        // Clear all tokens
        await setAuthTokenGlobal(null);
        
        // Process queue with error
        processQueue(refreshError, null);
        isRefreshing = false;
        
        // Create a global event for session expiration
        if (typeof window !== 'undefined') {
          const event = new CustomEvent('session-expired');
          window.dispatchEvent(event);
        }
        
        return Promise.reject(refreshError);
      }
    }
    
    // ========== HANDLE OTHER ERRORS ==========
    
    // Handle 419 CSRF Token Mismatch (Laravel specific)
    if (status === 419) {
      console.log('🛡️ 419 CSRF Token Mismatch');
    }
    
    // Handle 429 Too Many Requests
    if (status === 429) {
      console.log('⏱️ 429 Too Many Requests - Rate limited');
    }
    
    // Handle 403 Forbidden
    if (status === 403) {
      console.log('🚫 403 Forbidden - Insufficient permissions');
    }
    
    // Handle 404 Not Found
    if (status === 404) {
      console.log('🔍 404 Not Found - Endpoint does not exist');
    }
    
    // Handle 500 Server Error
    if (status >= 500) {
      console.log('💥 Server Error - Backend issue');
    }
    
    return Promise.reject(error);
  }
);
// ===============================================
// REST OF YOUR API FUNCTIONS
// ===============================================

export const authAPI = {
  // Get CAPTCHA
  getCaptcha: () => apiService.get('/auth/captcha'),
  
  // ✅ CORRECT: Login with CAPTCHA (4 parameters)
  login: (login, password, captcha, captchaKey) => 
    apiService.post('/auth/login', { login, password, captcha, captcha_key: captchaKey }),
  
  // Logout
  logout: () => apiService.post('/auth/logout'),
  
  // Get current user
  getUser: () => apiService.get('/auth/user'),
  
  // Refresh token
  refreshToken: () => apiService.post('/auth/refresh-token'),
};

export const userAPI = {
  getDashboard: () => apiService.get('/user/dashboard'),
  getHistory: () => apiService.get('/user/history'),
  getRecentRequests: () => apiService.get('/user/requests/recent'),
  getServices: () => apiService.get('/user/services'),
  getProjects: (type) => apiService.get(`/user/projects/${type}`),
  submitChangeRequest: (data) => apiService.post('/user/change-request', data),
  getSubQueries: (queryId) => apiService.get(`/user/sub-queries/${queryId}`),
};

// ===============================================
// ASSIGNER API
// ===============================================

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

// ===============================================
// RESOLVER API
// ===============================================

export const resolverAPI = {
  getDashboard: () => apiService.get('/resolver/dashboard'),
  getAssignedRequests: () => apiService.get('/resolver/requests'),
  getRequestDetails: (id) => apiService.get(`/resolver/requests/${id}`),
  updateRequestStatus: (id, data) => apiService.put(`/resolver/requests/${id}/status`, data),
  getStatistics: () => apiService.get('/resolver/statistics'),
  getProfile: () => apiService.get('/resolver/profile'),
};

// ===============================================
// ADMIN API
// ===============================================

export const adminAPI = {
  // Add token management methods to adminAPI
  setAuthToken: setAuthTokenGlobal, // ✅ Add this
  getCurrentToken: () => authToken, // ✅ Add this
  clearAuthToken: async () => {
    await setAuthTokenGlobal(null);
  },
  
  // Dashboard
  getDashboard: () => apiService.get('/admin/dashboard'),
  getUsers: (params = {}) => apiService.get('/admin/users', { params }),
  getUser: (id) => apiService.get(`/admin/users/${id}`),
  createUser: (data) => apiService.post('/admin/users', data),
  updateUser: (id, data) => apiService.put(`/admin/users/${id}`, data),
  deleteUser: (id) => apiService.delete(`/admin/users/${id}`),
  
  // Projects Management (CRUD operations)
  getProjects: (params = {}) => apiService.get('/admin/projects', { params }),
  getProject: (id) => apiService.get(`/admin/projects/${id}`),
  createProject: (data) => apiService.post('/admin/projects', data),
  updateProject: (id, data) => apiService.put(`/admin/projects/${id}`, data),
  deleteProject: (id) => apiService.delete(`/admin/projects/${id}`),
  
  // Project Statistics
  getProjectStats: () => apiService.get('/admin/projects-stats'),
  
  // Search and filtering
  searchProjects: (query) => apiService.get('/admin/projects-search', { params: { q: query } }),
  getProjectsByType: (type) => apiService.get(`/admin/projects-by-type/${type}`),
  
  // Bulk operations
  bulkDeleteProjects: (projectIds) => apiService.post('/admin/projects/bulk-delete', { project_ids: projectIds }),
  
  // Roles and Permissions
  getRoles: () => apiService.get('/admin/roles'),
  
  // Assignment related
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

// ===============================================
// ADG API
// ===============================================

export const adgAPI = {
  getDashboard: () => apiService.get('/adg/dashboard'),
};

// ===============================================
// TEST APIs (For Development)
// ===============================================

export const testAPI = {
  // Auth test
  testLogin: (role) => apiService.get(`/test/auth/login/${role}`),
  testUsersList: () => apiService.get('/test/auth/users'),
  
  // User test
  testUserDashboard: () => apiService.get('/test/user/dashboard'),
  testUserServices: () => apiService.get('/test/user/services'),
  testUserProjects: (type) => apiService.get(`/test/user/projects/${type}`),
  
  // Admin test
  testAdminDashboard: () => apiService.get('/test/admin/dashboard'),
  testAdminUsers: () => apiService.get('/test/admin/users'),
  
  // Assigner test
  testAssignerRequests: () => apiService.get('/test/assigner/requests'),
  testAssignerDevelopers: () => apiService.get('/test/assigner/developers'),
  
  // Resolver test
  testResolverDashboard: () => apiService.get('/test/resolver/dashboard'),
  
  // ADG test
  testAdgDashboard: () => apiService.get('/test/adg/dashboard'),
};

// ===============================================
// MAIN EXPORT
// ===============================================

export default {
  // Token management
  setAuthToken: setAuthTokenGlobal,
  getCurrentToken: () => authToken,
  
  // Initialize token from storage
  initializeToken: async () => {
    try {
      console.log('🚀 Initializing token system...');
      
      // Reset initialization state
      isTokenInitialized = false;
      
      const token = await AsyncStorage.getItem('api_token');
      if (token) {
        console.log(`✅ Pre-loaded token: ${token.substring(0, 30)}...`);
        // Use setAuthTokenGlobal to ensure consistency
        await setAuthTokenGlobal(token);
        return true;
      }
      console.log('🚀 No stored token found');
      isTokenInitialized = true;
      return false;
    } catch (error) {
      console.error('❌ Error initializing token:', error);
      isTokenInitialized = true;
      return false;
    }
  },
  
  // Clear all tokens
  clearToken: async () => {
    console.log('🧹 Clearing all tokens...');
    await setAuthTokenGlobal(null);
  },
  
  // Debug functions
  debugHeaders: () => {
    console.log('🔍 DEBUG: Current headers:', apiService.defaults.headers.common);
    console.log('🔍 DEBUG: Current token in memory:', authToken);
    console.log('🔍 DEBUG: Is token initialized:', isTokenInitialized);
  },
  
  testToken: async () => {
    try {
      console.log('🧪 Testing token...');
      const response = await apiService.get('/user/dashboard');
      console.log('✅ Token test successful - Status:', response.status);
      return { success: true, status: response.status };
    } catch (error) {
      console.error('❌ Token test failed:', error.response?.status, error.response?.data);
      return { success: false, error: error.response?.data || error.message };
    }
  },
  
  // ✅ REMOVED DUPLICATE LOGIN FUNCTION HERE (was causing the problem)
  // ❌ DELETED: login: (login, password, captcha) => apiService.post('/auth/login', { login, password, captcha }),
  
  // Logout
  logout: () => apiService.post('/auth/logout'),
  
  // Get CAPTCHA
  getCaptcha: () => apiService.get('/auth/captcha'),
  
  // API groups
  auth: authAPI,
  user: userAPI,
  assigner: assignerAPI,
  resolver: resolverAPI,
  admin: adminAPI,
  adg: adgAPI,
  test: testAPI,
  
  // Individual user methods (for backward compatibility)
  getUserDashboard: userAPI.getDashboard,
  getUserHistory: userAPI.getHistory,
  getRecentRequests: userAPI.getRecentRequests,
  getServices: userAPI.getServices,
  getProjects: userAPI.getProjects,
  submitChangeRequest: userAPI.submitChangeRequest,
  getSubQueries: userAPI.getSubQueries,
};
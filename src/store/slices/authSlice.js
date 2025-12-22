import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import AsyncStorage from '@react-native-async-storage/async-storage';
import apiService from '../../services/apiService';

// ===============================================
// ASYNC THUNKS - FIXED VERSION
// ===============================================

export const loginUser = createAsyncThunk(
  'auth/login',
  async ({ login, password, captcha, captchaKey }, { rejectWithValue }) => {
    try {
      console.log('🔐 authSlice: Attempting login...');
      
      // Make login API call
      const response = await apiService.auth.login(login, password, captcha, captchaKey);
      
      if (response.data?.success) {
        const { token, user } = response.data;
        
        console.log('✅ Login API successful');
        
        // ✅ FIXED: Use apiService to save token (it handles AsyncStorage AND headers)
        await apiService.setAuthToken(token);
        
        // ✅ FIXED: Save user data separately
        await AsyncStorage.setItem('user_data', JSON.stringify(user));
        
        console.log('✅ Token & user data saved');
        return { token, user };
      } else {
        // Handle API success: false
        return rejectWithValue({
          message: response.data?.message || 'Login failed',
          errors: response.data?.errors || {}
        });
      }
    } catch (error) {
      console.error('❌ Login failed:', error);
      
      // Extract error details
      const errorMessage = error.response?.data?.message || error.message || 'Network error';
      const errors = error.response?.data?.errors || {};
      
      return rejectWithValue({ 
        message: errorMessage, 
        errors,
        status: error.response?.status 
      });
    }
  }
);

// ✅ FIXED: Logout with proper error handling
export const logoutUser = createAsyncThunk(
  'auth/logout',
  async (_, { rejectWithValue }) => {
    console.log('🚪 authSlice: Starting logout...');
    
    try {
      // Try to call logout API (but don't fail if it doesn't work)
      try {
        await apiService.auth.logout();
        console.log('✅ Logout API call completed');
      } catch (apiError) {
        console.log('⚠️ Logout API call failed (expected if token expired):', apiError.message);
        // Continue with local cleanup even if API fails
      }
    } catch (error) {
      console.error('❌ Unexpected error during logout:', error);
    } finally {
      // ✅ CRITICAL FIX: ALWAYS clear local data
      try {
        // Clear AsyncStorage
        await AsyncStorage.multiRemove(['api_token', 'user_data']);
        console.log('✅ AsyncStorage cleared');
        
        // Clear apiService token
        if (apiService.setAuthToken) {
          await apiService.setAuthToken(null);
          console.log('✅ apiService token cleared');
        }
      } catch (storageError) {
        console.error('❌ Error clearing storage:', storageError);
      }
      
      return { success: true };
    }
  }
);

// ✅ FIXED: Load user from storage
export const loadUserFromStorage = createAsyncThunk(
  'auth/loadUser',
  async (_, { rejectWithValue }) => {
    try {
      console.log('🔐 authSlice: Loading user from storage...');
      
      // Get token and user data from storage
      const token = await AsyncStorage.getItem('api_token');
      const userData = await AsyncStorage.getItem('user_data');
      
      if (token && userData) {
        const user = JSON.parse(userData);
        
        console.log('✅ Found stored credentials');
        
        // ✅ FIXED: Always set token in apiService when loading
        if (apiService.setAuthToken) {
          await apiService.setAuthToken(token);
          console.log('✅ Token set in apiService');
        }
        
        return { token, user };
      }
      
      console.log('⚠️ No stored credentials found');
      return { token: null, user: null };
    } catch (error) {
      console.error('❌ Failed to load from storage:', error);
      
      // Even on error, return null values
      return { token: null, user: null };
    }
  }
);

// ===============================================
// SLICE - FIXED VERSION
// ===============================================

const authSlice = createSlice({
  name: 'auth',
  initialState: {
    user: null,
    token: null,
    loading: true,    // true initially so splash shows
    error: null,
    initialized: false, // ✅ ADDED: Track if auth is initialized
  },
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    
    quickLogout: (state) => {
      state.user = null;
      state.token = null;
      state.error = null;
      state.loading = false;
      state.initialized = true;
    },
    
    // ✅ ADDED: Manually set auth state (useful for debugging)
    setAuthState: (state, action) => {
      const { token, user } = action.payload;
      state.token = token;
      state.user = user;
      state.initialized = true;
    },
    
    // ✅ ADDED: Mark as initialized (for SplashScreen)
    markAsInitialized: (state) => {
      state.initialized = true;
      state.loading = false;
    },
  },
  extraReducers: (builder) => {
    builder
      // Login
      .addCase(loginUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload.user;
        state.token = action.payload.token;
        state.error = null;
        state.initialized = true;
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        state.initialized = true;
      })

      // Logout
      .addCase(logoutUser.pending, (state) => {
        state.loading = true;
      })
      .addCase(logoutUser.fulfilled, (state) => {
        state.user = null;
        state.token = null;
        state.error = null;
        state.loading = false;
        state.initialized = true;
      })
      .addCase(logoutUser.rejected, (state) => {
        // Even if logout fails, still clear local state
        state.user = null;
        state.token = null;
        state.error = null;
        state.loading = false;
        state.initialized = true;
      })

      // Load from storage
      .addCase(loadUserFromStorage.pending, (state) => {
        state.loading = true;
      })
      .addCase(loadUserFromStorage.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload.user;
        state.token = action.payload.token;
        state.initialized = true;
        state.error = null;
      })
      .addCase(loadUserFromStorage.rejected, (state) => {
        state.loading = false;
        state.user = null;
        state.token = null;
        state.initialized = true;
        state.error = null;
      });
  },
});

export const { clearError, quickLogout, setAuthState, markAsInitialized } = authSlice.actions;
export default authSlice.reducer;
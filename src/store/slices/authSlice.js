import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import AsyncStorage from '@react-native-async-storage/async-storage';
import apiService from '../../services/apiService';

// Async thunks for API calls
export const loginUser = createAsyncThunk(
  'auth/login',
  async ({ login, password, captcha, captchaKey }, { rejectWithValue }) => {
    try {
      console.log('🔐 authSlice: Starting login with CAPTCHA...');
      console.log('🔐 authSlice: Parameters:', { 
        login, 
        passwordLength: password?.length,
        captcha, 
        captchaKey 
      });
      
      const response = await apiService.auth.login(login, password, captcha, captchaKey);
      
      console.log('🔐 authSlice: API Response received');
      console.log('🔐 authSlice: Response data:', response.data);
      
      if (response.data && response.data.success) {
        const { token, user } = response.data;
        
        console.log('🔐 authSlice: Login successful!');
        console.log('🔐 authSlice: Token received:', token ? `length: ${token.length}` : 'NULL');
        console.log('🔐 authSlice: User received:', user);
        
        // Save to AsyncStorage
        try {
          await AsyncStorage.setItem('api_token', token);
          await AsyncStorage.setItem('user', JSON.stringify(user));
          await AsyncStorage.setItem('token', token);
          console.log('✅ authSlice: Saved to AsyncStorage successfully');
        } catch (storageError) {
          console.error('❌ authSlice: Error saving to AsyncStorage:', storageError);
        }
        
        // Update apiService
        try {
          await apiService.setAuthToken(token);
          console.log('✅ authSlice: Updated apiService with token');
        } catch (apiServiceError) {
          console.error('❌ authSlice: Error updating apiService:', apiServiceError);
        }
        
        // Verify storage
        try {
          const storedToken = await AsyncStorage.getItem('api_token');
          console.log('🔐 authSlice: Verification - Stored token:', storedToken ? `Exists (${storedToken.length} chars)` : 'NOT STORED!');
        } catch (verifyError) {
          console.error('❌ authSlice: Error verifying storage:', verifyError);
        }
        
        return { token, user };
      } else {
        console.log('🔐 authSlice: Login failed - no success in response');
        return rejectWithValue({
          message: response.data?.message || 'Login failed',
          errors: response.data?.errors || {},
        });
      }
    } catch (error) {
      console.error('🔐 authSlice: Login error caught:');
      console.error('🔐 authSlice: Error object:', error);
      console.error('🔐 authSlice: Error response:', error.response?.data);
      
      let errorMessage = 'Network error. Please try again.';
      let errors = {};
      
      if (error.response?.data) {
        errorMessage = error.response.data.message || errorMessage;
        errors = error.response.data.errors || {};
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      return rejectWithValue({
        message: errorMessage,
        errors: errors,
      });
    }
  }
);

// In authSlice.js - logoutUser thunk
export const logoutUser = createAsyncThunk(
  'auth/logout',
  async (_, { rejectWithValue }) => {
    try {
      // Clear tokens from storage
      await AsyncStorage.clear();
      await apiService.setAuthToken(null);
      
      // Return success - NO NAVIGATION
      return { success: true };
    } catch (error) {
      // Even on error, clear tokens
      await AsyncStorage.clear();
      await apiService.setAuthToken(null);
      
      return rejectWithValue({ message: 'Logout error' });
    }
  }
);

export const loadUserFromStorage = createAsyncThunk(
  'auth/loadUser',
  async (_, { rejectWithValue }) => {
    try {
      console.log('🔐 authSlice: Loading user from storage...');
      
      // Check for token in both possible locations
      let storedToken = await AsyncStorage.getItem('api_token');
      if (!storedToken) {
        storedToken = await AsyncStorage.getItem('token');
        console.log('🔐 authSlice: Fallback to token key');
      }
      
      const userData = await AsyncStorage.getItem('user');
      
      console.log('🔐 authSlice: Storage check - api_token exists:', !!storedToken);
      console.log('🔐 authSlice: Storage check - user exists:', !!userData);
      
      if (storedToken && userData) {
        console.log('✅ authSlice: Found user in storage');
        console.log(`✅ authSlice: Token length: ${storedToken.length}`);
        
        // Ensure api_token is set (in case we loaded from 'token')
        if (!await AsyncStorage.getItem('api_token')) {
          await AsyncStorage.setItem('api_token', storedToken);
        }
        
        // Initialize apiService with token
        await apiService.setAuthToken(storedToken);
        
        return { token: storedToken, user: JSON.parse(userData) };
      }
      
      console.log('⚠️ authSlice: No user found in storage');
      return { token: null, user: null };
    } catch (error) {
      console.error('❌ authSlice: Error loading user:', error);
      return rejectWithValue({
        message: 'Error loading user from storage',
      });
    }
  }
);

const authSlice = createSlice({
  name: 'auth',
  initialState: {
    user: null,
    token: null,
    loading: true,
    error: null,
  },
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    setLoading: (state, action) => {
      state.loading = action.payload;
    },
    // ✅ NEW: Manually set auth state (for debugging)
    setAuthState: (state, action) => {
      state.user = action.payload.user;
      state.token = action.payload.token;
    },
    // ✅ NEW: Quick logout without API call
    quickLogout: (state) => {
      state.user = null;
      state.token = null;
      state.error = null;
      state.loading = false;
    },
  },
  extraReducers: (builder) => {
    builder
      // Login cases
      .addCase(loginUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload.user;
        state.token = action.payload.token;
        state.error = null;
        console.log('✅ authSlice: Redux state updated with user:', action.payload.user?.email);
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        console.log('❌ authSlice: Login rejected:', action.payload?.message);
      })
      // Logout cases
      .addCase(logoutUser.pending, (state) => {
        state.loading = true;
      })
      .addCase(logoutUser.fulfilled, (state) => {
        state.user = null;
        state.token = null;
        state.error = null;
        state.loading = false;
        console.log('✅ authSlice: Logout successful - Redux state cleared');
      })
      .addCase(logoutUser.rejected, (state, action) => {
        // Even if API fails, clear local state
        state.user = null;
        state.token = null;
        state.loading = false;
        state.error = action.payload;
        console.log('⚠️ authSlice: Logout API failed but state cleared');
      })
      // Load user cases
      .addCase(loadUserFromStorage.pending, (state) => {
        state.loading = true;
      })
      .addCase(loadUserFromStorage.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload.user;
        state.token = action.payload.token;
        console.log('✅ authSlice: User loaded from storage:', action.payload.user ? 'YES' : 'NO');
      })
      .addCase(loadUserFromStorage.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { clearError, setLoading, setAuthState, quickLogout } = authSlice.actions;
export default authSlice.reducer;
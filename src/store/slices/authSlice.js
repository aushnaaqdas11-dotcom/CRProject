import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import AsyncStorage from '@react-native-async-storage/async-storage';
import apiService from '../../services/apiService';

// Async thunks for API calls
export const loginUser = createAsyncThunk(
  'auth/login',
  async ({ login, password }, { rejectWithValue }) => {
    try {
      const response = await apiService.login(login, password);
      if (response.data.success) {
        const { token, user } = response.data;
        await AsyncStorage.setItem('token', token);
        await AsyncStorage.setItem('user', JSON.stringify(user));
        apiService.setAuthToken(token);
        return { token, user };
      } else {
        return rejectWithValue({
          message: response.data.message || 'Login failed',
          errors: response.data.errors || {},
        });
      }
    } catch (error) {
      return rejectWithValue({
        message: error.response?.data?.message || 'Network error. Please try again.',
        errors: error.response?.data?.errors || {},
      });
    }
  }
);

export const logoutUser = createAsyncThunk(
  'auth/logout',
  async (_, { rejectWithValue }) => {
    try {
      await apiService.logout();
      await AsyncStorage.removeItem('token');
      await AsyncStorage.removeItem('user');
      apiService.setAuthToken(null);
      return { success: true };
    } catch (error) {
      return rejectWithValue({
        message: error.response?.data?.message || 'Failed to logout. Please try again.',
      });
    }
  }
);

export const loadUserFromStorage = createAsyncThunk(
  'auth/loadUser',
  async (_, { rejectWithValue }) => {
    try {
      const storedToken = await AsyncStorage.getItem('token');
      const userData = await AsyncStorage.getItem('user');
      if (storedToken && userData) {
        apiService.setAuthToken(storedToken);
        return { token: storedToken, user: JSON.parse(userData) };
      }
      return { token: null, user: null };
    } catch (error) {
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
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Logout cases
      .addCase(logoutUser.fulfilled, (state) => {
        state.user = null;
        state.token = null;
        state.error = null;
        state.loading = false;
      })
      .addCase(logoutUser.rejected, (state, action) => {
        state.error = action.payload;
      })
      // Load user cases
      .addCase(loadUserFromStorage.pending, (state) => {
        state.loading = true;
      })
      .addCase(loadUserFromStorage.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload.user;
        state.token = action.payload.token;
      })
      .addCase(loadUserFromStorage.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { clearError, setLoading } = authSlice.actions;
export default authSlice.reducer;
import React, { createContext, useState, useEffect, useContext } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import apiService from '../services/apiService';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadUser = async () => {
      try {
        const storedToken = await AsyncStorage.getItem('token');
        const userData = await AsyncStorage.getItem('user');
        if (storedToken && userData) {
          apiService.setAuthToken(storedToken);
          setUser(JSON.parse(userData));
          setToken(storedToken);
        }
      } catch (error) {
        console.log('Error loading user:', error.message);
      } finally {
        setLoading(false);
      }
    };
    loadUser();
  }, []);

  const login = async (login, password) => {
    try {
      const response = await apiService.login(login, password);
      if (response.data.success) {
        const { token, user } = response.data;
        await AsyncStorage.setItem('token', token);
        await AsyncStorage.setItem('user', JSON.stringify(user));
        apiService.setAuthToken(token);
        setUser(user);
        setToken(token);
        let redirectTo;
        switch (parseInt(user.role)) {
          case 1:
            redirectTo = 'AdminDashboard';
            break;
          case 2:
            redirectTo = 'UserDashboard';
            break;
          case 3:
            redirectTo = 'ResolverDashboard';
            break;
          case 4:
            redirectTo = 'AssignerDashboard';
            break;
          default:
            redirectTo = 'UserDashboard';
        }
        return { success: true, user, redirect_to: redirectTo };
      } else {
        return {
          success: false,
          message: response.data.message || 'Login failed',
          errors: response.data.errors || {},
        };
      }
    } catch (error) {
      console.log('Login error:', error.message);
      return {
        success: false,
        message: error.response?.data?.message || 'Network error. Please try again.',
        errors: error.response?.data?.errors || {},
      };
    }
  };

  const logout = async () => {
    try {
      await apiService.logout();
      await AsyncStorage.removeItem('token');
      await AsyncStorage.removeItem('user');
      apiService.setAuthToken(null);
      setUser(null);
      setToken(null);
      return { success: true };
    } catch (error) {
      console.log('Logout error:', error.message);
      return { success: false, message: error.response?.data?.message || 'Failed to logout. Please try again.' };
    }
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout, loading, userApi: apiService }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
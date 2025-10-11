import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);

  // Load token and user from storage on app start
  useEffect(() => {
    const loadAuth = async () => {
      const storedToken = await AsyncStorage.getItem('token');
      const storedUser = await AsyncStorage.getItem('user');
      if (storedToken && storedUser) {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
      }
    };
    loadAuth();
  }, []);

  const login = async (loginInput, password) => {
    try {
      const response = await axios.post('http://192.168.168.107:8000/api/login', {
        login: loginInput,
        password,
      });

      const data = response.data;

      if (data.success) {
        // Save token and user
        await AsyncStorage.setItem('token', data.token);
        await AsyncStorage.setItem('user', JSON.stringify(data.user));
        setToken(data.token);
        setUser(data.user);
      }

      return data;
    } catch (error) {
      console.error('Login API Error:', error);
      return {
        success: false,
        message: 'Login failed. Please try again.',
      };
    }
  };

  const logout = async () => {
    setUser(null);
    setToken(null);
    await AsyncStorage.removeItem('token');
    await AsyncStorage.removeItem('user');
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);

import React, { createContext, useContext, useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { logoutUser, loadUser } from '../store/slices/authSlice';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const dispatch = useDispatch();
  const auth = useSelector(state => state.auth);

  const logout = useCallback(async () => {
    await dispatch(logoutUser());
  }, [dispatch]);

  const loadUserData = useCallback(async () => {
    await dispatch(loadUser());
  }, [dispatch]);

  const value = {
    user: auth.user,
    token: auth.token,
    loading: auth.loading,
    logout,
    loadUser: loadUserData,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
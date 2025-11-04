import { useDispatch, useSelector } from 'react-redux';
import { useCallback } from 'react';
import { loginUser, logoutUser, loadUserFromStorage, clearError } from '../store/slices/authSlice';
import apiService from '../services/apiService';

export const useAuth = () => {
  const dispatch = useDispatch();
  const auth = useSelector((state) => state.auth);

  const login = useCallback((login, password) => {
    return dispatch(loginUser({ login, password }));
  }, [dispatch]);

  const logout = useCallback(() => {
    return dispatch(logoutUser());
  }, [dispatch]);

  const loadUser = useCallback(() => {
    return dispatch(loadUserFromStorage());
  }, [dispatch]);

  const clearAuthError = useCallback(() => {
    dispatch(clearError());
  }, [dispatch]);

  const getRedirectPath = useCallback(() => {
    if (!auth.user) return 'Login';
    
    switch (parseInt(auth.user.role)) {
      case 1:
        return 'AdminDashboard';
      case 2:
        return 'UserDashboard';
      case 3:
        return 'ResolverDashboard';
      case 4:
        return 'AssignerDashboard';
      default:
        return 'UserDashboard';
    }
  }, [auth.user]);

  return {
    user: auth.user,
    token: auth.token,
    loading: auth.loading,
    error: auth.error,
    login,
    logout,
    loadUser,
    clearError: clearAuthError,
    getRedirectPath,
    userApi: apiService,
  };
};
import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { useAuth } from '../hooks/redux';
import SplashScreen from '../screens/SplashScreen';
import LoginScreen from '../screens/auth/LoginScreen';
import UserDashboard from '../screens/UserDashboard';
import ResolverDashboard from '../screens/ResolverDashboard';
import ResolverRequestDetail from '../screens/ResolverRequestDetail';
import AssignerDashboardScreen from '../screens/AssignerDashboardScreen';
import RequestDetailScreen from '../screens/RequestDetailScreen';
import UserHistoryScreen from '../screens/UserHistoryScreen';
import DrawerNavigator from './DrawerNavigator';
import AdgDashboardScreen from '../screens/adg/AdgDashboardScreen';
import AsyncStorage from '@react-native-async-storage/async-storage';

const Stack = createStackNavigator();

const AppNavigator = () => {
  const { user, token, loading, loadUser } = useAuth();

  useEffect(() => {
    console.log('=== AppNavigator Effect ===');
    
    // Test AsyncStorage directly
    const testStorage = async () => {
      try {
        const apiToken = await AsyncStorage.getItem('api_token');
        const reduxToken = await AsyncStorage.getItem('token');
        console.log('🔍 AppNavigator - api_token from storage:', apiToken ? `EXISTS (${apiToken.length} chars)` : 'NULL');
        console.log('🔍 AppNavigator - token from storage:', reduxToken ? `EXISTS (${reduxToken.length} chars)` : 'NULL');
      } catch (error) {
        console.error('🔍 AppNavigator - Error checking storage:', error);
      }
    };
    
    testStorage();
    loadUser();
  }, [loadUser]);

  console.log('=== AppNavigator Render ===');
  console.log('Redux token:', token ? 'EXISTS' : 'NULL');
  console.log('Redux user:', user ? `Role: ${user.role}, Email: ${user.email}` : 'NULL');
  console.log('Loading:', loading);

  // Show splash screen while loading initial auth state
  if (loading) {
    return <SplashScreen />;
  }

  // Determine which screens to show based on auth state
  const getScreens = () => {
    if (!token || !user) {
      // No token or user - Auth screens
      return (
        <>
          <Stack.Screen name="Login" component={LoginScreen} />
        </>
      );
    }

    // User is authenticated - Show appropriate dashboard based on role
    const userRole = parseInt(user.role);
    
    switch (userRole) {
      case 1: // Admin - Use Drawer Navigator
        return (
          <>
            <Stack.Screen name="MainApp" component={DrawerNavigator} />
            <Stack.Screen name="UserHistory" component={UserHistoryScreen} />
            <Stack.Screen name="RequestDetail" component={RequestDetailScreen} />
          </>
        );
      case 2: // User
        return (
          <>
            <Stack.Screen name="UserDashboard" component={UserDashboard} />
            <Stack.Screen name="RequestDetail" component={RequestDetailScreen} />
            <Stack.Screen name="UserHistory" component={UserHistoryScreen} />
          </>
        );
      case 3: // Resolver
        return (
          <>
            <Stack.Screen name="ResolverDashboard" component={ResolverDashboard} />
            <Stack.Screen name="ResolverRequestDetail" component={ResolverRequestDetail} />
          </>
        );
      case 4: // Assigner
        return (
          <>
            <Stack.Screen name="AssignerDashboard" component={AssignerDashboardScreen} />
            <Stack.Screen name="RequestDetail" component={RequestDetailScreen} />
          </>
        );
      case 5: // ADG
        return (
          <>
            <Stack.Screen name="ADG Dashboard" component={AdgDashboardScreen} />
          </>
        );
      default:
        return (
          <>
            <Stack.Screen name="UserDashboard" component={UserDashboard} />
            <Stack.Screen name="RequestDetail" component={RequestDetailScreen} />
            <Stack.Screen name="UserHistory" component={UserHistoryScreen} />
          </>
        );
    }
  };

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {getScreens()}
        {/* Common screens accessible from anywhere */}
        <Stack.Screen name="Splash" component={SplashScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;
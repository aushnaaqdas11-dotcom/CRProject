import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { useAuth } from '../hooks/redux';
import SplashScreen from '../screens/SplashScreen';
import LoginScreen from '../screens/LoginScreen';
import UserDashboard from '../screens/UserDashboard';
import ResolverDashboard from '../screens/ResolverDashboard';
import ResolverRequestDetail from '../screens/ResolverRequestDetail';
import AssignerDashboardScreen from '../screens/AssignerDashboardScreen';
import RequestDetailScreen from '../screens/RequestDetailScreen';
import UserHistoryScreen from '../screens/UserHistoryScreen';
import AdgDashboardScreen from '../screens/AdgDashboardScreen';
import DrawerNavigator from './DrawerNavigator';

const Stack = createStackNavigator();

const AppNavigator = () => {
  const { user, token, loading, loadUser } = useAuth();

  useEffect(() => {
    loadUser();
  }, [loadUser]);

  if (loading) {
    return <SplashScreen />;
  }

  // Function to get screens based on auth
  const renderScreens = () => {
    if (!token || !user) {
      return [
        <Stack.Screen key="Login" name="Login" component={LoginScreen} />
      ];
    }

    const role = parseInt(user.role);
    
    switch (role) {
      case 1: // Admin
        return [
          <Stack.Screen key="MainApp" name="MainApp" component={DrawerNavigator} />,
          <Stack.Screen key="UserHistory" name="UserHistory" component={UserHistoryScreen} />,
          <Stack.Screen key="RequestDetail" name="RequestDetail" component={RequestDetailScreen} />
        ];
      case 2: // User
        return [
          <Stack.Screen key="UserDashboard" name="UserDashboard" component={UserDashboard} />,
          <Stack.Screen key="RequestDetail" name="RequestDetail" component={RequestDetailScreen} />,
          <Stack.Screen key="UserHistory" name="UserHistory" component={UserHistoryScreen} />
        ];
      case 3: // Resolver
        return [
          <Stack.Screen key="ResolverDashboard" name="ResolverDashboard" component={ResolverDashboard} />,
          <Stack.Screen key="ResolverRequestDetail" name="ResolverRequestDetail" component={ResolverRequestDetail} />
        ];
      case 4: // Assigner
        return [
          <Stack.Screen key="AssignerDashboard" name="AssignerDashboard" component={AssignerDashboardScreen} />,
          <Stack.Screen key="RequestDetail" name="RequestDetail" component={RequestDetailScreen} />
        ];
      case 5: // ADG
        return [
          <Stack.Screen key="ADGDashboard" name="ADG Dashboard" component={AdgDashboardScreen} />
        ];
      default:
        return [
          <Stack.Screen key="UserDashboard" name="UserDashboard" component={UserDashboard} />,
          <Stack.Screen key="RequestDetail" name="RequestDetail" component={RequestDetailScreen} />,
          <Stack.Screen key="UserHistory" name="UserHistory" component={UserHistoryScreen} />
        ];
    }
  };

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {renderScreens()}
        <Stack.Screen key="Splash" name="Splash" component={SplashScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;
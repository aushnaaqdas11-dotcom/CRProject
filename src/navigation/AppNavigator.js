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


// Import the Drawer Navigator
import DrawerNavigator from './DrawerNavigator';

import AdgDashboardScreen from '../screens/AdgDashboardScreen';


const Stack = createStackNavigator();

const AppNavigator = () => {
  const { user, token, loading, loadUser } = useAuth();

  useEffect(() => {
    loadUser();
  }, [loadUser]);

  // Show splash screen while loading initial auth state
  if (loading) {
    return <SplashScreen />;
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!token || !user ? (
          // No token or user - Auth screens
          <>
            <Stack.Screen name="Login" component={LoginScreen} />
          </>
        ) : (
          // User is authenticated - Show appropriate dashboard based on role
          (() => {
            switch (parseInt(user.role)) {
              case 1: // Admin - Use Drawer Navigator
                return (
                  <>
                    <Stack.Screen name="MainApp" component={DrawerNavigator} />
                    {/* Keep these as separate stack screens if they need to be outside drawer */}
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
                  case 5: // ADG - Add this new case
                return (
                  <>
<Stack.Screen name="ADG Dashboard" component={AdgDashboardScreen} />
                    {/* Add other screens ADG might need access to */}
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
          })()
        )}
        {/* Common screens accessible from anywhere */}
        <Stack.Screen name="Splash" component={SplashScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;
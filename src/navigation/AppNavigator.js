import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { useAuth } from '../hooks/redux'; // Updated import
import SplashScreen from '../screens/SplashScreen';
import WelcomeScreen from '../screens/WelcomeScreen';
import LoginScreen from '../screens/LoginScreen';
import UserDashboard from '../screens/UserDashboard';
import AdminDashboard from '../screens/AdminDashboard';
import ResolverDashboard from '../screens/ResolverDashboard';
import ResolverRequestDetail from '../screens/ResolverRequestDetail';
import AssignerDashboardScreen from '../screens/AssignerDashboardScreen';
import RequestDetailScreen from '../screens/RequestDetailScreen';
import UserHistoryScreen from '../screens/UserHistoryScreen';
 
// Admin Screens
import ManageUsers from '../screens/admin/ManageUsers';
import RolesManagement from '../screens/admin/RolesManagement';
import AssignProjects from '../screens/admin/AssignProjects';
import CreateUser from '../screens/admin/CreateUser';
import EditUser from '../screens/admin/EditUser';
import EditRole from '../screens/admin/EditRole';

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
      <Stack.Navigator
        screenOptions={{ headerShown: false }}
      >
        {!token || !user ? (
          // No token or user - Auth screens
          <>
            <Stack.Screen name="Welcome" component={WelcomeScreen} />
            <Stack.Screen name="Login" component={LoginScreen} />
          </>
        ) : (
          // User is authenticated - Show appropriate dashboard based on role
          (() => {
            switch (parseInt(user.role)) {
              case 1: // Admin
                return (
                  <>
                    <Stack.Screen name="AdminDashboard" component={AdminDashboard} />
                    <Stack.Screen name="ManageUsers" component={ManageUsers} />
                    <Stack.Screen name="RolesManagement" component={RolesManagement} />
                    <Stack.Screen name="AssignProjects" component={AssignProjects} />
                    <Stack.Screen name="CreateUser" component={CreateUser} />
                    <Stack.Screen name="EditUser" component={EditUser} />
                    <Stack.Screen name="EditRole" component={EditRole} />
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
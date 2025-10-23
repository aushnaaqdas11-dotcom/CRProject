// navigation/AppNavigator.js
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import SplashScreen from '../screens/SplashScreen';
import WelcomeScreen from '../screens/WelcomeScreen';
import LoginScreen from '../screens/LoginScreen';
import UserDashboard from '../screens/UserDashboard';
import AdminDashboard from '../screens/AdminDashboard';
import ResolverDashboard from '../screens/ResolverDashboard';
import ResolverRequestDetail from '../screens/ResolverRequestDetail'; // NEW
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
  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="Splash"
        screenOptions={{ headerShown: false }}
      >
        {/* Common Screens */}
        <Stack.Screen name="Splash" component={SplashScreen} />
        <Stack.Screen name="Welcome" component={WelcomeScreen} />
        <Stack.Screen name="Login" component={LoginScreen} />
        
        {/* User Screens */}
        <Stack.Screen name="UserDashboard" component={UserDashboard} />
        <Stack.Screen name="RequestDetail" component={RequestDetailScreen} />
        <Stack.Screen name="UserHistory" component={UserHistoryScreen} />
        
        {/* Admin Screens */}
        <Stack.Screen name="AdminDashboard" component={AdminDashboard} />
        <Stack.Screen name="ManageUsers" component={ManageUsers} />
        <Stack.Screen name="RolesManagement" component={RolesManagement} />
        <Stack.Screen name="AssignProjects" component={AssignProjects} />
        <Stack.Screen name="CreateUser" component={CreateUser} />
        <Stack.Screen name="EditUser" component={EditUser} />
        <Stack.Screen name="EditRole" component={EditRole} />
        
        {/* Resolver Screens - NEW */}
        <Stack.Screen name="ResolverDashboard" component={ResolverDashboard} />
        <Stack.Screen name="ResolverRequestDetail" component={ResolverRequestDetail} />
        
        {/* Other Role Screens */}
        <Stack.Screen name="AssignerDashboard" component={AssignerDashboardScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;
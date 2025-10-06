import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { AuthProvider } from '../context/AuthContext';
import SplashScreen from '../screens/SplashScreen';
import WelcomeScreen from '../screens/WelcomeScreen';
import LoginScreen from '../screens/LoginScreen';
import UserDashboard from '../screens/UserDashboard';
import AdminDashboard from '../screens/AdminDashboard';
import ResolverDashboard from '../screens/ResolverDashboard';
import AssignerDashboard from '../screens/AssignerDashboard';
import UserHistoryScreen from '../screens/UserHistoryScreen';

const Stack = createStackNavigator();

const AppNavigator = () => {
  return (
    <AuthProvider>
    <NavigationContainer>
      <Stack.Navigator 
        initialRouteName="Splash"
        screenOptions={{
          headerShown: false
        }}
      >
        <Stack.Screen name="Splash" component={SplashScreen} />
        <Stack.Screen name="Welcome" component={WelcomeScreen} />
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="UserDashboard" component={UserDashboard} />
        <Stack.Screen name="AdminDashboard" component={AdminDashboard} />
        <Stack.Screen name="ResolverDashboard" component={ResolverDashboard} />
        <Stack.Screen name="AssignerDashboard" component={AssignerDashboard} />
        <Stack.Screen name="UserHistory" component={UserHistoryScreen} />
      </Stack.Navigator>
    </NavigationContainer>
    </AuthProvider>
  );
};

export default AppNavigator;
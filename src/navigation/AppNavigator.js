import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import SplashScreen from '../screens/SplashScreen';
import WelcomeScreen from '../screens/WelcomeScreen';
import LoginScreen from '../screens/LoginScreen';
import UserDashboard from '../screens/UserDashboard';
import AdminDashboard from '../screens/AdminDashboard';
import ResolverDashboard from '../screens/ResolverDashboard';
import AssignerDashboardScreen from '../screens/AssignerDashboardScreen';
import RequestDetailScreen from '../screens/RequestDetailScreen';
import UserHistoryScreen from '../screens/UserHistoryScreen';

const Stack = createStackNavigator();

const AppNavigator = () => {
  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="Splash"
        screenOptions={{ headerShown: false }}
      >
        <Stack.Screen name="Splash" component={SplashScreen} />
        <Stack.Screen name="Welcome" component={WelcomeScreen} />
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="UserDashboard" component={UserDashboard} />
        <Stack.Screen name="AdminDashboard" component={AdminDashboard} />
        <Stack.Screen name="ResolverDashboard" component={ResolverDashboard} />
        <Stack.Screen name="AssignerDashboard" component={AssignerDashboardScreen} />
        <Stack.Screen name="RequestDetail" component={RequestDetailScreen} />
        <Stack.Screen name="UserHistory" component={UserHistoryScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;

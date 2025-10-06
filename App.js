import React from 'react';
import { StatusBar } from 'react-native';
import { AuthProvider } from './src/context/AuthContext'; // Adjust path based on your structure
import AppNavigator from './src/navigation/AppNavigator';

const App = () => {
  return (
    <>
      <StatusBar 
        barStyle="dark-content" 
        backgroundColor="#FFFFFF" 
        translucent 
      />
     <AuthProvider>
        <AppNavigator />
      </AuthProvider>
    </>
  );
};

export default App;
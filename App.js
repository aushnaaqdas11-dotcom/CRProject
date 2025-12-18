import React, { useEffect, useState } from 'react';
import { StatusBar, View, Text, StyleSheet } from 'react-native';
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import { store, persistor } from './src/store';
import apiService from './src/services/apiService';
import AppNavigator from './src/navigation/AppNavigator';

// PERMANENT FIX: App loader component
const AppLoader = ({ children }) => {
  const [initialized, setInitialized] = useState(false);
  const [initMessage, setInitMessage] = useState('Initializing app...');
  
  useEffect(() => {
    const init = async () => {
      try {
        console.log('🚀 AppLoader: Starting initialization...');
        setInitMessage('Loading authentication...');
        
        // PERMANENT FIX: Wait for token initialization
        const tokenReady = await apiService.initializeToken();
        
        if (tokenReady) {
          console.log('✅ AppLoader: Token initialized successfully');
          setInitMessage('Token loaded successfully');
        } else {
          console.log('ℹ️ AppLoader: No token found, user needs to login');
          setInitMessage('Ready to login');
        }
        
        // PERMANENT FIX: Small delay to ensure everything is ready
        await new Promise(resolve => setTimeout(resolve, 300));
        
        console.log('✅ AppLoader: Initialization complete');
        setInitialized(true);
      } catch (error) {
        console.error('❌ AppLoader: Initialization failed:', error);
        setInitMessage('Initialization failed, continuing...');
        // Still continue to app even if init fails
        setTimeout(() => setInitialized(true), 1000);
      }
    };
    
    init();
  }, []);
  
  if (!initialized) {
    return (
      <View style={styles.loaderContainer}>
        <Text style={styles.loaderText}>{initMessage}</Text>
        <View style={styles.loaderDots}>
          <Text style={styles.dot}>.</Text>
          <Text style={styles.dot}>.</Text>
          <Text style={styles.dot}>.</Text>
        </View>
      </View>
    );
  }
  
  return children;
};

const App = () => {
  return (
    <Provider store={store}>
      <PersistGate loading={null} persistor={persistor}>
        <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" translucent />
        <AppLoader>
          <AppNavigator />
        </AppLoader>
      </PersistGate>
    </Provider>
  );
};

const styles = StyleSheet.create({
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  loaderText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 10,
  },
  loaderDots: {
    flexDirection: 'row',
  },
  dot: {
    fontSize: 36,
    color: '#007AFF',
    marginHorizontal: 2,
  },
});

export default App;
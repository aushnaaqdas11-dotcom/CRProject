// components/Header.js
import React from 'react';
import { View, Text, TouchableOpacity, Image, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';

const Header = () => {
  const navigation = useNavigation();

  const handleServicesPress = () => {
    // Navigate to Welcome screen and scroll to services section
    navigation.navigate('Welcome', { scrollTo: 'services' });
  };

  const handleProjectsPress = () => {
    // Navigate to Welcome screen and scroll to projects section
    navigation.navigate('Welcome', { scrollTo: 'projects' });
  };

  const handleSignInPress = () => {
    // Navigate to Login screen
    navigation.navigate('Login');
  };

  return (
    <View style={styles.header}>
      {/* Left Side - Logos */}
      <View style={styles.logoContainer}>
        <Image 
          source={require('../assets/pitb-logo.png')} // Add your PITB logo
          style={styles.logo}
          resizeMode="contain"
        />
        <Image 
          source={require('../assets/crp-logo.png')} // Add your CRP logo
          style={styles.logo}
          resizeMode="contain"
        />
      </View>

      {/* Right Side - Navigation */}
      <View style={styles.navContainer}>
        <TouchableOpacity onPress={handleServicesPress} style={styles.navItem}>
          <Text style={styles.navText}>Services</Text>
        </TouchableOpacity>
        
        <TouchableOpacity onPress={handleProjectsPress} style={styles.navItem}>
          <Text style={styles.navText}>Projects</Text>
        </TouchableOpacity>
        
        <TouchableOpacity onPress={handleSignInPress} style={styles.navItem}>
          <Text style={styles.navText}>Sign In</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    height: 60,
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logo: {
    width: 40,
    height: 40,
    marginRight: 10,
  },
  navContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  navItem: {
    marginLeft: 20,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  navText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
});

export default Header;
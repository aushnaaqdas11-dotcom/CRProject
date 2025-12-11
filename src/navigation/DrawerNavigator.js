// navigation/DrawerNavigator.js
import React from 'react';
import { createDrawerNavigator } from '@react-navigation/drawer';
import AdminDashboard from '../screens/AdminDashboard';
import ManageUsers from '../screens/admin/ManageUsers';
import RolesManagement from '../screens/admin/RolesManagement';
import AssignProjects from '../screens/admin/AssignProjects';
import CreateUser from '../screens/admin/CreateUser';
import EditUser from '../screens/admin/EditUser';
import EditRole from '../screens/admin/EditRole';
import CustomDrawerContent from '../components/CustomDrawerContent';
import ProjectManagement from '../screens/admin/ProjectManagement'; // REAL COMPONENT


// Simple test component for React Native
import { View, Text, StyleSheet } from 'react-native';

const TestComponent = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Project Management Test</Text>
      <Text style={styles.subtitle}>This is a test component</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
  },
});

const Drawer = createDrawerNavigator();

const DrawerNavigator = () => {
  return (
    <Drawer.Navigator
      screenOptions={{
        headerShown: false,
        drawerStyle: {
          width: 300,
        },
      }}
      drawerContent={(props) => <CustomDrawerContent {...props} />}
    >
      <Drawer.Screen name="AdminDashboard" component={AdminDashboard} />
      <Drawer.Screen name="ManageUsers" component={ManageUsers} />
      <Drawer.Screen name="RolesManagement" component={RolesManagement} />
      <Drawer.Screen name="AssignProjects" component={AssignProjects} />
      <Drawer.Screen name="CreateUser" component={CreateUser} />
      <Drawer.Screen name="EditUser" component={EditUser} />
      <Drawer.Screen name="EditRole" component={EditRole} />
      <Drawer.Screen name="ProjectManagement" component={ProjectManagement} />
    </Drawer.Navigator>
  );
};

export default DrawerNavigator;
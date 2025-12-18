// navigation/AdminStackNavigator.js
import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import AdminDashboard from '../screens/admin/AdminDashboard';
import ManageUsers from '../screens/admin/ManageUsers';
import RolesManagement from '../screens/admin/RolesManagement';
import AssignProjects from '../screens/admin/AssignProjects';
import CreateUser from '../screens/admin/CreateUser';
import EditUser from '../screens/admin/EditUser';
import EditRole from '../screens/admin/EditRole';
import ProjectManagement from '../screens/admin/ProjectManagement'; // NEW IMPORT
import AssignProjectsToUsers from '../screens/admin/AssignProjectsToUsers';



const Stack = createStackNavigator();

const AdminStackNavigator = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="AdminDashboard" component={AdminDashboard} />
      <Stack.Screen name="ManageUsers" component={ManageUsers} />
      <Stack.Screen name="RolesManagement" component={RolesManagement} />
      <Stack.Screen name="ProjectManagement" component={ProjectManagement} />
      <Stack.Screen name="AssignProjectsToUsers" component={AssignProjectsToUsers} />
      <Stack.Screen name="AssignProjects" component={AssignProjects} />
      <Stack.Screen name="CreateUser" component={CreateUser} />
      <Stack.Screen name="EditUser" component={EditUser} />
      <Stack.Screen name="EditRole" component={EditRole} />
    </Stack.Navigator>
  );
};

export default AdminStackNavigator;
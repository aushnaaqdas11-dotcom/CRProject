// screens/AdminDashboard.js
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
  RefreshControl,
  ActivityIndicator,
  Dimensions,
  StatusBar
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/FontAwesome';
import { adminAPI } from '../services/apiService';
import { useAuth } from '../hooks/redux'; 

const { width } = Dimensions.get('window');

const AdminDashboard = ({ navigation }) => {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { user, logout } = useAuth();

 // In AdminDashboard.js - update loadDashboard function
const loadDashboard = async () => {
  try {
    setLoading(true);
    const response = await adminAPI.getDashboard();
    
    if (response.data.success) {
      setDashboardData(response.data.data);
    } else {
      Alert.alert('Error', response.data.message || 'Failed to load dashboard data');
    }
  } catch (error) {
    console.log('Admin dashboard error:', error);
    // Check if it's a network error or server error
    if (error.code === 'NETWORK_ERROR') {
      Alert.alert('Network Error', 'Please check your internet connection');
    } else {
      const errorMessage = error.response?.data?.message || 'Failed to load admin dashboard';
      Alert.alert('Error', errorMessage);
    }
  } finally {
    setLoading(false);
    setRefreshing(false);
  }
};

  const onRefresh = () => {
    setRefreshing(true);
    loadDashboard();
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  // Use React Navigation's drawer
  const openDrawer = () => {
    navigation.openDrawer();
  };

  const modules = [
    {
      id: 1,
      title: 'Manage Users',
      description: 'View, add, and manage user accounts',
      route: 'ManageUsers',
      icon: 'users',
      color: '#667eea',
      gradient: ['#667eea', '#764ba2']
    },
    {
      id: 2,
      title: 'Roles & Permissions',
      description: 'Configure user roles and access levels',
      route: 'RolesManagement',
      icon: 'id-badge',
      color: '#4ECDC4',
      gradient: ['#4ECDC4', '#48bb78']
    },
    {
      id: 3,
      title: 'Edit Users',
      description: 'Add new users to the system',
      route: 'EditUser',
      icon: 'edit',
      color: '#f5576c',
      gradient: ['#f093fb', '#f5576c']
    },
    {
      id: 4,
      title: 'Assign Projects',
      description: 'Manage and assign projects to users',
      route: 'AssignProjects',
      icon: 'tasks',
      color: '#ff6b6b',
      gradient: ['#ff9e44', '#ff6b6b']
    }
  ];

  const handleModulePress = (module) => {
    navigation.navigate(module.route);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2C3E50" />
        <Text style={styles.loadingText}>Loading Admin Dashboard...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar backgroundColor="#2C3E50" barStyle="light-content" />
      
      {/* Top Navbar */}
      <View style={styles.navbar}>
        <TouchableOpacity 
          style={styles.menuButton}
          onPress={openDrawer}
        >
          <Icon name="bars" size={24} color="#fff" />
        </TouchableOpacity>
        
        <View style={styles.navbarCenter}>
          <Text style={styles.navbarTitle}>Admin Dashboard</Text>
        </View>
        
        <View style={styles.navbarRight}>
          <TouchableOpacity style={styles.navbarIcon}>
            <Icon name="user" size={20} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView 
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Header */}
        <LinearGradient
          colors={['#2C3E50', '#4ECDC4']}
          style={styles.header}
        >
          <View style={styles.headerContent}>
            <View style={styles.headerText}>
              <Text style={styles.welcomeText}>
                Welcome, {user?.name || 'Admin'}
              </Text>
              <Text style={styles.roleText}>Manage your administration tasks</Text>
            </View>
          </View>
        </LinearGradient>

        {/* Stats Overview */}
        <View style={styles.statsContainer}>
          <View style={styles.statsRow}>
            <View style={styles.statCard}>
              <View style={[styles.statIcon, { backgroundColor: '#667eea' }]}>
                <Icon name="users" size={24} color="#fff" />
              </View>
              <Text style={styles.statNumber}>
                {dashboardData?.stats?.total_users || 0}
              </Text>
              <Text style={styles.statLabel}>Total Users</Text>
            </View>

            <View style={styles.statCard}>
              <View style={[styles.statIcon, { backgroundColor: '#4ECDC4' }]}>
                <Icon name="id-badge" size={24} color="#fff" />
              </View>
              <Text style={styles.statNumber}>
                {dashboardData?.stats?.total_roles || 0}
              </Text>
              <Text style={styles.statLabel}>Total Roles</Text>
            </View>
          </View>

          <View style={styles.statsRow}>
            <View style={styles.statCard}>
              <View style={[styles.statIcon, { backgroundColor: '#f5576c' }]}>
                <Icon name="tasks" size={24} color="#fff" />
              </View>
              <Text style={styles.statNumber}>
                {dashboardData?.stats?.total_projects || 0}
              </Text>
              <Text style={styles.statLabel}>Total Projects</Text>
            </View>

            <View style={styles.statCard}>
              <View style={[styles.statIcon, { backgroundColor: '#ff6b6b' }]}>
                <Icon name="user-plus" size={24} color="#fff" />
              </View>
              <Text style={styles.statNumber}>
                {dashboardData?.stats?.assigners_count || 0}
              </Text>
              <Text style={styles.statLabel}>Assigners</Text>
            </View>
          </View>
        </View>

        {/* Modules Grid */}
        <View style={styles.modulesSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Admin Modules</Text>
          </View>
          <View style={styles.modulesGrid}>
            {modules.map((module, index) => (
              <TouchableOpacity
                key={module.id}
                style={styles.moduleCard}
                onPress={() => handleModulePress(module)}
                activeOpacity={0.9}
              >
                <View style={styles.moduleContent}>
                  <LinearGradient
                    colors={module.gradient}
                    style={styles.moduleIcon}
                  >
                    <Icon name={module.icon} size={32} color="#fff" />
                  </LinearGradient>
                  <Text style={styles.moduleTitle}>{module.title}</Text>
                  <Text style={styles.moduleDescription}>{module.description}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
  },
  loadingText: {
    marginTop: 10,
    color: '#2C3E50',
    fontSize: 16,
  },
  scrollContent: {
    paddingTop: 0,
  },
  navbar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#2C3E50',
    paddingHorizontal: 16,
    paddingTop: 35,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#34495e',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  menuButton: {
    padding: 8,
  },
  navbarCenter: {
    flex: 1,
    alignItems: 'center',
  },
  navbarTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  navbarRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  navbarIcon: {
    padding: 8,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 30,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    marginTop: 0,
    marginBottom: 9,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerText: {
    flex: 1,
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 5,
  },
  roleText: {
    fontSize: 16,
    color: '#fff',
    opacity: 0.9,
  },
  statsContainer: {
    padding: 20,
    marginTop: -20,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  statCard: {
    width: (width - 50) / 2,
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  statIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2C3E50',
    marginBottom: 5,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  modulesSection: {
    padding: 20,
    paddingTop: 10,
  },
  sectionHeader: {
    alignItems: 'center',
    marginBottom: 25,
  },
  sectionTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#2C3E50',
  },
  modulesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  moduleCard: {
    width: (width - 50) / 2,
    height: 200,
    marginBottom: 20,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 5,
    borderWidth: 1,
    borderColor: 'rgba(76, 205, 196, 0.1)',
  },
  moduleContent: {
    flex: 1,
    padding: 25,
    alignItems: 'center',
    justifyContent: 'center',
  },
  moduleIcon: {
    width: 80,
    height: 80,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  moduleTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2C3E50',
    textAlign: 'center',
    marginBottom: 8,
  },
  moduleDescription: {
    fontSize: 14,
    color: '#2C3E50',
    opacity: 0.6,
    textAlign: 'center',
    lineHeight: 18,
  },
});

export default AdminDashboard;
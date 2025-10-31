import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  Alert,
  Dimensions,
  StatusBar,
  DrawerLayoutAndroid
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { useNavigation } from '@react-navigation/native';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/FontAwesome';

const { width } = Dimensions.get('window');

const UserHistoryScreen = () => {
  const { token, userApi, logout, user } = useAuth();
  const navigation = useNavigation();
  const drawerRef = useRef(null);

  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const intervalRef = useRef(null);

  const openDrawer = () => {
    drawerRef.current?.openDrawer();
  };

  const closeDrawer = () => {
    drawerRef.current?.closeDrawer();
  };

  const handleLogout = async () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            try {
              await logout();
              navigation.navigate('Login');
            } catch (error) {
              Alert.alert('Error', 'Failed to logout');
            }
          }
        }
      ]
    );
  };

  const navigationView = (
    <View style={styles.drawerContainer}>
      <LinearGradient
        colors={['#2C3E50', '#4ECDC4']}
        style={styles.drawerHeader}
      >
        <View style={styles.drawerHeaderContent}>
          <View style={styles.userAvatar}>
            <Icon name="user" size={40} color="#fff" />
          </View>
          <Text style={styles.drawerUserName}>
            {user?.name || 'User'}
          </Text>
          <Text style={styles.drawerUserRole}>User</Text>
        </View>
      </LinearGradient>

      <View style={styles.drawerMenu}>
        <TouchableOpacity 
          style={styles.drawerItem}
          onPress={() => {
            closeDrawer();
            navigation.navigate('UserDashboard');
          }}
        >
          <Icon name="home" size={20} color="#2C3E50" />
          <Text style={styles.drawerItemText}>Dashboard</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.drawerItem}
          onPress={() => {
            closeDrawer();
          }}
        >
          <Icon name="history" size={20} color="#2C3E50" />
          <Text style={styles.drawerItemText}>Request History</Text>
        </TouchableOpacity>

        <View style={styles.drawerDivider} />

        <TouchableOpacity 
          style={[styles.drawerItem, styles.logoutDrawerItem]}
          onPress={() => {
            closeDrawer();
            handleLogout();
          }}
        >
          <Icon name="sign-out" size={20} color="#e74c3c" />
          <Text style={[styles.drawerItemText, styles.logoutText]}>Logout</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  useEffect(() => {
    if (!token) {
      setError('Not authenticated. Please log in.');
      setLoading(false);
      return;
    }

    fetchAllRequests();
    intervalRef.current = setInterval(fetchAllRequests, 60000);
    return () => clearInterval(intervalRef.current);
  }, [token]);

  const fetchAllRequests = async () => {
    try {
      setLoading(true);
      const res = await userApi.getUserHistory();
      if (res.data.success) {
        setRequests(res.data.requests || []);
        setError(null);
      } else {
        setError(res.data.message || 'Failed to load history.');
        setRequests([]);
      }
    } catch (err) {
      console.error('History error:', err);
      setError(err.response?.data?.message || 'Failed to load history. Please check network.');
      setRequests([]);
    } finally {
      setLoading(false);
    }
  };

  const retryFetch = () => {
    setError(null);
    fetchAllRequests();
  };

  if (loading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color="#2C3E50" />
        <Text style={styles.loadingText}>Loading History...</Text>
      </View>
    );
  }

  return (
    <DrawerLayoutAndroid
      ref={drawerRef}
      drawerWidth={300}
      drawerPosition="left"
      renderNavigationView={() => navigationView}
    >
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
            <Text style={styles.navbarTitle}>Request History</Text>
          </View>
          
          <View style={styles.navbarRight}>
            <TouchableOpacity style={styles.navbarIcon}>
              <Icon name="user" size={20} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView 
          showsVerticalScrollIndicator={false} 
          contentContainerStyle={styles.scrollContent}
        >
          {error ? (
            <View style={styles.errorCard}>
              <Text style={styles.errorTitle}>Error Loading History</Text>
              <Text style={styles.errorText}>{error}</Text>
              <TouchableOpacity style={styles.retryButton} onPress={retryFetch}>
                <LinearGradient colors={['#2C3E50', '#4ECDC4']} style={styles.buttonGradient}>
                  <Text style={styles.buttonText}>Retry</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          ) : requests.length === 0 ? (
            <View style={styles.emptyCard}>
              <Icon name="history" size={50} color="#9CA3AF" />
              <Text style={styles.emptyTitle}>No Requests Found</Text>
              <Text style={styles.emptyText}>You haven't submitted any requests yet.</Text>
            </View>
          ) : (
            <View style={styles.requestsContainer}>
              {/* Section Header with Back Icon */}
              <View style={styles.sectionHeader}>
                <TouchableOpacity 
                  style={styles.backButton}
                  onPress={() => navigation.goBack()}
                >
                  <Icon name="arrow-left" size={20} color="#2C3E50" />
                </TouchableOpacity>
                <Text style={styles.sectionTitle}>All Requests ({requests.length})</Text>
                <View style={styles.backButtonPlaceholder} />
              </View>
              
              {requests.map(req => (
                <TouchableOpacity
                  key={req.id}
                  style={styles.requestCard}
                  onPress={() => navigation.navigate('RequestDetail', { requestId: req.id })}
                >
                  <View style={styles.requestHeader}>
                    <View style={styles.serviceInfo}>
                      <Text style={styles.serviceName}>{req.service?.name || 'No Service'}</Text>
                      <Text style={styles.projectName}>
                        {req.project?.type === 'app' ? 'App' : 'Web'} - {req.project?.name || 'N/A'}
                      </Text>
                    </View>
                    <View style={styles.statusBadges}>
                      <Text style={[
                        styles.priorityBadge,
                        req.priority === 'high' ? styles.priorityHigh :
                        req.priority === 'normal' ? styles.priorityNormal : styles.priorityLow
                      ]}>
                        {req.priority?.charAt(0).toUpperCase() + req.priority?.slice(1)}
                      </Text>
                      <Text style={[
                        styles.statusBadge,
                        req.status === 'pending' ? styles.statusPending :
                        req.status === 'inprogress' ? styles.statusInprogress : styles.statusCompleted
                      ]}>
                        {req.status?.charAt(0).toUpperCase() + req.status?.slice(1)}
                      </Text>
                    </View>
                  </View>

                  <Text style={styles.requestDate}>
                    {new Date(req.created_at).toLocaleDateString('en-US', {
                      month: 'long',
                      day: 'numeric',
                      year: 'numeric'
                    })}
                  </Text>

                  <Text style={styles.requestContent} numberOfLines={3}>
                    {req.request_details || 'No details provided'}
                  </Text>

                  <View style={styles.cardFooter}>
                    <Text style={styles.viewDetailsText}>Tap to view details →</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </ScrollView>
      </View>
    </DrawerLayoutAndroid>
  );
};

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#F8FAFC',
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 20,
  },
  loader: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#2C3E50',
  },
  
  // Navbar Styles
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

  // Requests Container
  requestsContainer: {
    padding: 20,
  },
  // Section Header with Back Icon
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  backButton: {
    padding: 8,
    backgroundColor: '#F1F5F9',
    borderRadius: 10,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backButtonPlaceholder: {
    width: 40,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2C3E50',
    textAlign: 'center',
    flex: 1,
  },

  // Request Card
  requestCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 25,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
    borderLeftWidth: 4,
    borderLeftColor: '#4ECDC4',
  },
  requestHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  serviceInfo: {
    flex: 1,
  },
  serviceName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2C3E50',
    marginBottom: 4,
  },
  projectName: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  statusBadges: {
    alignItems: 'flex-end',
    gap: 6,
  },
  priorityBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    fontSize: 12,
    fontWeight: '600',
    overflow: 'hidden',
  },
  priorityHigh: {
    backgroundColor: '#FEE2E2',
    color: '#DC2626',
  },
  priorityNormal: {
    backgroundColor: '#DBEAFE',
    color: '#1D4ED8',
  },
  priorityLow: {
    backgroundColor: '#FEF3C7',
    color: '#D97706',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    fontSize: 12,
    fontWeight: '600',
    overflow: 'hidden',
  },
  statusPending: {
    backgroundColor: '#FEF3C7',
    color: '#D97706',
  },
  statusInprogress: {
    backgroundColor: '#DBEAFE',
    color: '#1D4ED8',
  },
  statusCompleted: {
    backgroundColor: '#D1FAE5',
    color: '#065F46',
  },
  requestDate: {
    fontSize: 14,
    color: '#9CA3AF',
    marginBottom: 12,
    fontStyle: 'italic',
  },
  requestContent: {
    fontSize: 16,
    color: '#374151',
    lineHeight: 22,
    marginBottom: 15,
  },
  cardFooter: {
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    paddingTop: 12,
    alignItems: 'flex-end',
  },
  viewDetailsText: {
    fontSize: 14,
    color: '#4ECDC4',
    fontWeight: '600',
  },

  // Error Card
  errorCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 25,
    margin: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#DC2626',
    marginBottom: 10,
    textAlign: 'center',
  },
  errorText: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 22,
  },

  // Empty State
  emptyCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 40,
    margin: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2C3E50',
    marginTop: 15,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 22,
  },

  // Buttons
  buttonGradient: {
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    minWidth: 120,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  retryButton: {
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },

  // Drawer Styles
  drawerContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  drawerHeader: {
    padding: 20,
    paddingTop: 60,
    paddingBottom: 30,
  },
  drawerHeaderContent: {
    alignItems: 'center',
  },
  userAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
  },
  drawerUserName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 5,
  },
  drawerUserRole: {
    fontSize: 14,
    color: '#fff',
    opacity: 0.8,
  },
  drawerMenu: {
    flex: 1,
    padding: 20,
  },
  drawerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    paddingHorizontal: 10,
    borderRadius: 8,
    marginBottom: 5,
  },
  drawerItemText: {
    fontSize: 16,
    color: '#2C3E50',
    marginLeft: 15,
    fontWeight: '500',
  },
  drawerDivider: {
    height: 1,
    backgroundColor: '#ecf0f1',
    marginVertical: 15,
  },
  logoutDrawerItem: {
    marginTop: 'auto',
    marginBottom: 20,
  },
  logoutText: {
    color: '#e74c3c',
  },
});

export default UserHistoryScreen;
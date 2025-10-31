import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  TextInput,
  ScrollView,
  Dimensions,
  StatusBar,
  DrawerLayoutAndroid,
  RefreshControl,
  Alert
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { useNavigation } from '@react-navigation/native';
import * as Animatable from 'react-native-animatable';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/FontAwesome';
import { Colors } from '../styles/theme';

const { width } = Dimensions.get('window');

const AssignerDashboardScreen = () => {
  const { logout, userApi, user } = useAuth();
  const navigation = useNavigation();
  const drawerRef = React.useRef(null);

  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [error, setError] = useState(null);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const res = await userApi.getProjectRequests();
      if (res.data.success) {
        setRequests(res.data.requests || []);
        setError(null);
      } else {
        setError(res.data.message || 'Failed to load requests.');
        setRequests([]);
      }
    } catch (err) {
      console.error('Assigner requests error:', err);
      setError(err.response?.data?.message || 'Failed to load requests. Please check network.');
      setRequests([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchRequests();
  };

  useEffect(() => {
    fetchRequests();
  }, []);

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

  // Move navigationView outside of conditional returns
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
            {user?.name || 'Assigner'}
          </Text>
          <Text style={styles.drawerUserRole}>Assigner</Text>
        </View>
      </LinearGradient>

      <View style={styles.drawerMenu}>
        <TouchableOpacity 
          style={styles.drawerItem}
          onPress={() => {
            closeDrawer();
          }}
        >
          <Icon name="home" size={20} color="#2C3E50" />
          <Text style={styles.drawerItemText}>Dashboard</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.drawerItem}
          onPress={() => {
            closeDrawer();
            // Add navigation for assigner specific screens
          }}
        >
          <Icon name="tasks" size={20} color="#2C3E50" />
          <Text style={styles.drawerItemText}>My Projects</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.drawerItem}
          onPress={() => {
            closeDrawer();
            // Add navigation for assigner specific screens
          }}
        >
          <Icon name="list-alt" size={20} color="#2C3E50" />
          <Text style={styles.drawerItemText}>Requests</Text>
        </TouchableOpacity>

        <View style={styles.drawerDivider} />

        <TouchableOpacity 
          style={styles.drawerItem}
          onPress={() => {
            closeDrawer();
            // Add settings navigation here
          }}
        >
          
        </TouchableOpacity>

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

  const filteredRequests = requests.filter((item) => {
    const statusMatch =
      filter === 'all' ? true : item.status.toLowerCase() === filter;
    const searchMatch =
      item.user?.name?.toLowerCase().includes(search.toLowerCase()) ||
      item.project?.name?.toLowerCase().includes(search.toLowerCase()) ||
      item.request_details?.toLowerCase().includes(search.toLowerCase());
    return statusMatch && searchMatch;
  });

  const stats = {
    total: requests.length,
    pending: requests.filter(r => r.status.toLowerCase() === 'pending').length,
    inProgress: requests.filter(r => r.status.toLowerCase() === 'inprogress').length,
    completed: requests.filter(r => r.status.toLowerCase() === 'completed').length,
  };

  const retryFetch = () => {
    setError(null);
    fetchRequests();
  };

  const renderRequest = ({ item, index }) => (
    <Animatable.View 
      animation="fadeInUp" 
      duration={600} 
      delay={index * 100}
      style={styles.requestCard}
    >
      <LinearGradient colors={['#ffffff', '#f8f9fa', '#ffffff']} style={styles.cardGradient}>
        <View style={styles.requestHeader}>
          <Text style={styles.projectName}>{item.project?.name || 'N/A'}</Text>
          <Text style={styles.userName}>{item.user?.name || 'N/A'}</Text>
        </View>
        <Text style={styles.issue}>{item.request_details}</Text>
        <View style={styles.badgesRow}>
          <Text style={[styles.statusBadge, statusColors[item.status?.toLowerCase()]]}>
            {item.status}
          </Text>
          <Text style={[styles.priorityBadge, priorityColors[item.priority?.toLowerCase()]]}>
            {item.priority}
          </Text>
        </View>
        <TouchableOpacity
          style={styles.viewBtn}
          onPress={() => navigation.navigate('RequestDetail', { requestId: item.id })}
        >
          <LinearGradient colors={['#2C3E50', '#4ECDC4']} style={styles.viewBtnGradient}>
            <Text style={styles.viewBtnText}>View</Text>
          </LinearGradient>
        </TouchableOpacity>
      </LinearGradient>
    </Animatable.View>
  );

  const EmptyState = () => (
    <Animatable.View animation="fadeIn" style={styles.emptyState}>
      <Text style={styles.emptyStateTitle}>No Requests Found</Text>
      <Text style={styles.emptyStateText}>
        {filter === 'all' 
          ? 'There are no change requests available at the moment.'
          : `No ${filter} requests found. Try changing the filter.`
        }
      </Text>
      <TouchableOpacity style={styles.refreshButton} onPress={fetchRequests}>
        <LinearGradient colors={['#2C3E50', '#4ECDC4']} style={styles.refreshButtonGradient}>
          <Text style={styles.refreshButtonText}>Refresh</Text>
        </LinearGradient>
      </TouchableOpacity>
    </Animatable.View>
  );

  // Move the conditional return to the very end
  if (loading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2C3E50" />
        <Text style={styles.loadingText}>Loading Assigner Dashboard...</Text>
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
        
        {/* Top Navbar - Same as Admin Dashboard */}
        <View style={styles.navbar}>
          <TouchableOpacity 
            style={styles.menuButton}
            onPress={openDrawer}
          >
            <Icon name="bars" size={24} color="#fff" />
          </TouchableOpacity>
          
          <View style={styles.navbarCenter}>
            <Text style={styles.navbarTitle}>Assigner Dashboard</Text>
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
          {/* Header - Matching Admin Dashboard */}
          <LinearGradient
            colors={['#2C3E50', '#4ECDC4']}
            style={styles.header}
          >
            <View style={styles.headerContent}>
              <View style={styles.headerText}>
                <Text style={styles.welcomeText}>
                  Welcome, {user?.name || 'Assigner'}
                </Text>
                <Text style={styles.roleText}>Manage your project requests</Text>
              </View>
            </View>
          </LinearGradient>

          {error && (
            <Animatable.View animation="fadeIn" style={styles.errorContainer}>
              <Text style={styles.errorText}>{error}</Text>
              <TouchableOpacity style={styles.retryButton} onPress={retryFetch}>
                <LinearGradient colors={['#2C3E50', '#4ECDC4']} style={styles.retryButtonGradient}>
                  <Text style={styles.retryText}>Retry</Text>
                </LinearGradient>
              </TouchableOpacity>
            </Animatable.View>
          )}

          {/* Stats Section */}
          <View style={styles.statsContainer}>
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false} 
              contentContainerStyle={styles.statsScrollContent}
            >
              {Object.entries(stats).map(([key, value]) => (
                <View key={key} style={styles.statCard}>
                  <LinearGradient colors={['#ffffff', '#f8f9fa', '#ffffff']} style={styles.statCardGradient}>
                    <Text style={[styles.statValue, { color: statColors[key] }]}>
                      {value}
                    </Text>
                    <Text style={styles.statLabel}>
                      {key === 'total' ? 'Total Requests' : 
                       key === 'pending' ? 'Pending' : 
                       key === 'inProgress' ? 'In Progress' : 'Completed'}
                    </Text>
                  </LinearGradient>
                </View>
              ))}
            </ScrollView>
          </View>

          {/* Search and Filter Section */}
          <View style={styles.searchFilterContainer}>
            <View style={styles.searchWrapper}>
              <Icon name="search" size={16} color="#4ECDC4" style={styles.searchIcon} />
              <TextInput
                placeholder="Search requests..."
                value={search}
                onChangeText={setSearch}
                style={styles.searchInput}
                placeholderTextColor="#666"
              />
            </View>
            
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              style={styles.filterScroll}
            >
              <View style={styles.filterContainer}>
                {['all', 'pending', 'inprogress', 'completed'].map(f => (
                  <TouchableOpacity
                    key={f}
                    onPress={() => setFilter(f)}
                    style={[
                      styles.filterBtn, 
                      filter === f && styles.filterBtnActive
                    ]}
                  >
                    <Text style={[
                      styles.filterText,
                      filter === f && styles.filterTextActive
                    ]}>
                      {f === 'all' ? 'All Requests' : 
                       f === 'inprogress' ? 'In Progress' : 
                       f.charAt(0).toUpperCase() + f.slice(1)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
          </View>

          {/* Content Area */}
          <View style={styles.contentContainer}>
            {loading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#2C3E50" />
                <Text style={styles.loadingText}>Loading requests...</Text>
              </View>
            ) : (
              <FlatList
                data={filteredRequests}
                keyExtractor={item => item.id.toString()}
                renderItem={renderRequest}
                ListEmptyComponent={EmptyState}
                contentContainerStyle={[
                  styles.listContent,
                  filteredRequests.length === 0 && styles.emptyListContent
                ]}
                scrollEnabled={false}
                showsVerticalScrollIndicator={false}
              />
            )}
          </View>
        </ScrollView>
      </View>
    </DrawerLayoutAndroid>
  );
};


const statColors = {
  total: '#2C3E50',
  pending: '#F59E0B',
  inProgress: '#3B82F6',
  completed: '#10B981',
};

const statusColors = {
  pending: { backgroundColor: '#FEF3C7', color: '#92400E' },
  inprogress: { backgroundColor: '#DBEAFE', color: '#1E40AF' },
  completed: { backgroundColor: '#D1FAE5', color: '#065F46' },
};

const priorityColors = {
  high: { color: '#DC2626' },
  normal: { color: '#3B82F6' },
  low: { color: '#059669' },
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
    flexGrow: 1,
    paddingTop: 0,
  },
  
  // Top Navbar - Same as Admin Dashboard
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

  // Header - Matching Admin Dashboard
  header: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 30,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    marginTop: 0,
    marginBottom:9,
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
  
  // Drawer Styles - Same as Admin Dashboard
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
  
  // Rest of the existing styles remain the same
  statsContainer: {
    padding: 20,
    marginTop: -20,
  },
  statsScrollContent: {
    paddingHorizontal: 8,
    gap: 12,
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
    marginBottom:9,
  },
  statCardGradient: {
    paddingVertical: 25,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statValue: { 
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
  
  // Search and Filter Section
  searchFilterContainer: {
    padding: 20,
    paddingTop: 1,
  },
  searchWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    paddingHorizontal: 15,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#ddd',
    height: 50,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    color: '#333',
    fontSize: 16,
  },
  filterScroll: {
    marginBottom: 8,
  },
  filterContainer: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 4,
    marginBottom:2,
  },
  filterBtn: { 
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: 'white',
    minWidth: 110,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  filterBtnActive: { 
    backgroundColor: '#4ECDC4', 
    borderColor: '#4ECDC4',
  },
  filterText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748B',
  },
  filterTextActive: {
    color: 'white',
  },
  
  // Content Area
  contentContainer: {
    flex: 1,
    padding: 20,
    paddingTop: 0,
  },
  listContent: {
    paddingBottom: 20,
  },
  emptyListContent: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  
  // Request Cards
  requestCard: {
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 10,
  },
  cardGradient: {
    padding: 20,
  },
  requestHeader: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    marginBottom: 12,
    flexWrap: 'wrap',
  },
  projectName: { 
    fontSize: 18, 
    fontWeight: '700',
    color: '#2C3E50',
    flex: 1,
  },
  userName: { 
    fontSize: 14, 
    color: '#6B7280',
    fontWeight: '500',
  },
  issue: { 
    marginBottom: 12,
    fontSize: 15,
    color: '#374151',
    lineHeight: 22,
  },
  badgesRow: { 
    flexDirection: 'row', 
    gap: 8, 
    marginBottom: 16,
    flexWrap: 'wrap',
  },
  statusBadge: { 
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    fontWeight: '600',
    fontSize: 12,
    overflow: 'hidden',
  },
  priorityBadge: { 
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    fontWeight: '600',
    fontSize: 12,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  viewBtn: {
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#2C3E50',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 5,
  },
  viewBtnGradient: {
    padding: 12,
    alignItems: 'center',
  },
  viewBtnText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  
  // Empty State
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#2C3E50',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyStateText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 20,
  },
  refreshButton: {
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#2C3E50',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 5,
  },
  refreshButtonGradient: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    alignItems: 'center',
  },
  refreshButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 16,
  },
  
  // Error State
  errorContainer: { 
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    marginHorizontal: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  errorText: { 
    color: '#DC2626', 
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 16,
  },
  retryButton: {
    borderRadius: 8,
    overflow: 'hidden',
  },
  retryButtonGradient: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    alignItems: 'center',
  },
  retryText: { 
    color: 'white', 
    fontWeight: '600',
  },
});

export default AssignerDashboardScreen;
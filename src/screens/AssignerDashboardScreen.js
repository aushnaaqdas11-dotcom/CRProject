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
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { useNavigation } from '@react-navigation/native';
import * as Animatable from 'react-native-animatable';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/FontAwesome';
import { Colors } from '../styles/theme';

const { width } = Dimensions.get('window');

const AssignerDashboardScreen = () => {
  const { logout, userApi } = useAuth();
  const navigation = useNavigation();

  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
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
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

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

  const handleLogout = async () => {
    const result = await logout();
    if (result.success) {
      navigation.replace('Login');
    } else {
      setError(result.message);
    }
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
          <LinearGradient colors={[Colors.primary, Colors.secondary]} style={styles.viewBtnGradient}>
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
        <LinearGradient colors={[Colors.primary, Colors.secondary]} style={styles.refreshButtonGradient}>
          <Text style={styles.refreshButtonText}>Refresh</Text>
        </LinearGradient>
      </TouchableOpacity>
    </Animatable.View>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
      
      {/* Navbar */}
      <View style={styles.navbar}>
        <View style={styles.navbarContent}>
          <LinearGradient colors={[Colors.primary, Colors.secondary]} style={styles.logoContainer}>
            <Text style={styles.navbarTitle}>Assignment Dashboard</Text>
          </LinearGradient>
          <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
            <LinearGradient colors={['#EF4444', '#DC2626']} style={styles.logoutBtnGradient}>
              <Text style={styles.logoutBtnText}>Logout</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>

      {/* Main Content */}
      <LinearGradient colors={[Colors.dark, Colors.primary, Colors.dark]} style={styles.background}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {error && (
            <Animatable.View animation="fadeIn" style={styles.errorContainer}>
              <Text style={styles.errorText}>{error}</Text>
              <TouchableOpacity style={styles.retryButton} onPress={retryFetch}>
                <LinearGradient colors={[Colors.primary, Colors.secondary]} style={styles.retryButtonGradient}>
                  <Text style={styles.retryText}>Retry</Text>
                </LinearGradient>
              </TouchableOpacity>
            </Animatable.View>
          )}
          
          {/* Stats Section */}
          <Animatable.View animation="fadeInDown" duration={800} style={styles.statsContainer}>
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false} 
              contentContainerStyle={styles.statsScrollContent}
            >
              {Object.entries(stats).map(([key, value]) => (
                <Animatable.View 
                  key={key} 
                  animation="zoomIn" 
                  duration={600}
                  delay={key === 'total' ? 200 : key === 'pending' ? 300 : key === 'inProgress' ? 400 : 500}
                  style={styles.statCard}
                >
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
                </Animatable.View>
              ))}
            </ScrollView>
          </Animatable.View>

          {/* Search and Filter Section */}
          <Animatable.View animation="fadeInUp" duration={800} delay={200} style={styles.searchFilterContainer}>
            <View style={styles.searchWrapper}>
              <Icon name="search" size={16} color={Colors.secondary} style={styles.searchIcon} />
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
          </Animatable.View>

          {/* Content Area */}
          <View style={styles.contentContainer}>
            {loading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={Colors.accent} />
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
      </LinearGradient>
    </View>
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
  },
  background: { 
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    padding: 16,
  },
  
  // Navbar Styles
  navbar: {
    backgroundColor: Colors.white, 
    borderBottomWidth: 1, 
    borderBottomColor: '#e0e0e0', 
    paddingHorizontal: 16,
    paddingTop: 50,
    paddingBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  navbarContent: {
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center',
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  navbarTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
  },
  logoutBtn: {
    borderRadius: 8,
    overflow: 'hidden',
  },
  logoutBtnGradient: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    alignItems: 'center',
  },
  logoutBtnText: {
    color: 'white',
    fontWeight: '600',
  },
  
  // Stats Section
  statsContainer: {
    marginBottom: 20,
  },
  statsScrollContent: {
    paddingHorizontal: 8,
    gap: 12,
  },
  statCard: {
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 10,
    minWidth: width * 0.4,
  },
  statCardGradient: {
    paddingVertical: 25,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statValue: { 
    fontSize: 32, 
    fontWeight: '700', 
    marginBottom: 8,
  },
  statLabel: { 
    fontSize: 14, 
    color: '#64748B',
    fontWeight: '600',
    textAlign: 'center',
  },
  
  // Search and Filter Section
  searchFilterContainer: {
    marginBottom: 20,
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
    backgroundColor: Colors.primary, 
    borderColor: Colors.primary,
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
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: Colors.accent,
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
    color: '#2a5298',
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
    shadowColor: Colors.primary,
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
    color: Colors.accent,
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
    color: '#2a5298',
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
    shadowColor: Colors.primary,
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
    color: Colors.accent,
    fontWeight: '600',
    fontSize: 16,
  },
  
  // Error State
  errorContainer: { 
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
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
    color: Colors.accent, 
    fontWeight: '600',
  },
});

export default AssignerDashboardScreen;
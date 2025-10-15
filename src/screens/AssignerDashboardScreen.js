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
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { useNavigation } from '@react-navigation/native';
import * as Animatable from 'react-native-animatable';

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

  const renderRequest = ({ item }) => (
    <Animatable.View animation="fadeInUp" duration={600} style={styles.requestCard}>
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
        <Text style={{ color: 'white' }}>View</Text>
      </TouchableOpacity>
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
        <Text style={styles.refreshButtonText}>Refresh</Text>
      </TouchableOpacity>
    </Animatable.View>
  );

  return (
    <Animatable.View animation="fadeIn" style={styles.container}>
      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={retryFetch}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      )}
      
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Assignment Dashboard</Text>
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <Text style={{ color: 'white' }}>Logout</Text>
        </TouchableOpacity>
      </View>

      {/* Stats Section - Flexible Design */}
      <View style={styles.statsContainer}>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false} 
          contentContainerStyle={styles.statsScrollContent}
        >
          {Object.entries(stats).map(([key, value]) => (
            <View key={key} style={styles.statCard}>
              <Text style={[styles.statValue, { color: statColors[key] }]}>
                {value}
              </Text>
              <Text style={styles.statLabel}>
                {key === 'total' ? 'Total' : 
                 key === 'pending' ? 'Pending' : 
                 key === 'inProgress' ? 'In Progress' : 'Completed'}
              </Text>
            </View>
          ))}
        </ScrollView>
      </View>

      {/* Search and Filter Section */}
      <View style={styles.searchFilterContainer}>
        <TextInput
          placeholder="Search requests..."
          value={search}
          onChangeText={setSearch}
          style={styles.searchInput}
          placeholderTextColor="#666"
        />
        
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
                  {f === 'all' ? 'All' : 
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
            <ActivityIndicator size="large" color="#4ECDC4" />
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
            showsVerticalScrollIndicator={false}
          />
        )}
      </View>
    </Animatable.View>
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
    paddingHorizontal: 16,
    paddingTop: 10,
  },
  header: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    marginBottom: 20,
    paddingHorizontal: 8,
  },
  headerTitle: { 
    fontSize: 28, 
    fontWeight: '700', 
    color: '#1F2937',
    textAlign: 'center',
    flex: 1,
  },
  logoutBtn: { 
    backgroundColor: '#EF4444', 
    paddingHorizontal: 16,
    paddingVertical: 10, 
    borderRadius: 12,
    minWidth: 80,
    alignItems: 'center',
  },
  
  // Stats Section - Flexible Design
  statsContainer: {
    marginBottom: 20,
  },
  statsScrollContent: {
    paddingHorizontal: 8,
    gap: 12,
  },
  statCard: {
    backgroundColor: 'white',
    paddingVertical: 20,
    paddingHorizontal: 24,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: width * 0.4, // Flexible width based on screen
    maxWidth: width * 0.45,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  statValue: { 
    fontSize: 32, 
    fontWeight: '700', 
    marginBottom: 4,
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
  searchInput: { 
    backgroundColor: 'white', 
    padding: 16,
    borderRadius: 12,
    fontSize: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
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
    minWidth: 100,
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
    color: '#64748B',
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
    backgroundColor: 'white', 
    padding: 20, 
    borderRadius: 16, 
    marginBottom: 12, 
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  requestHeader: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    marginBottom: 8,
    flexWrap: 'wrap',
  },
  projectName: { 
    fontSize: 18, 
    fontWeight: '700',
    color: '#1F2937',
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
    marginBottom: 12,
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
    backgroundColor: '#4ECDC4', 
    padding: 12,
    borderRadius: 12, 
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
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
    color: '#1F2937',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyStateText: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 20,
  },
  refreshButton: {
    backgroundColor: '#4ECDC4',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  refreshButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 16,
  },
  
  // Error State
  errorContainer: { 
    padding: 16, 
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  errorText: { 
    color: '#DC2626', 
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 12,
  },
  retryButton: { 
    backgroundColor: '#DC2626', 
    paddingHorizontal: 20,
    paddingVertical: 10, 
    borderRadius: 8,
  },
  retryText: { 
    color: 'white', 
    fontWeight: '600',
  },
});

export default AssignerDashboardScreen;
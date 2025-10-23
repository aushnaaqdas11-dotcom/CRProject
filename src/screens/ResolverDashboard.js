// screens/ResolverDashboard.js
import React, { useState, useEffect, useContext } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
  FlatList,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import LinearGradient from 'react-native-linear-gradient';


const ResolverDashboard = ({ navigation }) => {
  const { user, userApi } = useAuth();
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const response = await userApi.resolver.getDashboard();
      if (response.data.success) {
        setDashboardData(response.data.data);
      } else {
        Alert.alert('Error', response.data.message || 'Failed to load dashboard');
      }
    } catch (error) {
      console.log('Dashboard error:', error);
      Alert.alert('Error', 'Failed to load dashboard data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchDashboardData();
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const StatCard = ({ title, value, icon, color }) => (
    <View style={[styles.statCard, { borderLeftColor: color }]}>
      <View style={styles.statContent}>
        <Text style={styles.statValue}>{value}</Text>
        <Text style={styles.statTitle}>{title}</Text>
      </View>
      <Icon name={icon} size={30} color={color} style={styles.statIcon} />
    </View>
  );

  const RequestItem = ({ request }) => (
    <TouchableOpacity 
      style={styles.requestItem}
      onPress={() => navigation.navigate('ResolverRequestDetail', { requestId: request.id })}
    >
      <View style={styles.requestHeader}>
        <Text style={styles.requestId}>#{request.id}</Text>
        <View style={[styles.statusBadge, styles[`status${request.status.charAt(0).toUpperCase() + request.status.slice(1)}`]]}>
          <Text style={styles.statusText}>{request.status}</Text>
        </View>
      </View>
      
      <Text style={styles.userName}>
        <Icon name="account" size={16} color="#666" /> {request.user.name}
      </Text>
      
      <Text style={styles.serviceText}>{request.service.name}</Text>
      
      <View style={styles.requestFooter}>
        <View style={[styles.priorityBadge, styles[`priority${request.priority.charAt(0).toUpperCase() + request.priority.slice(1)}`]]}>
          <Text style={styles.priorityText}>{request.priority}</Text>
        </View>
        <Text style={styles.dateText}>{request.created_formatted}</Text>
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#4ECDC4" />
        <Text style={styles.loadingText}>Loading Dashboard...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
       <LinearGradient
              colors={['#2C3E50', '#4ECDC4']}
              style={styles.header}
            >
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>
            <Icon name="account-tie" size={24} color="white" /> Resolver Dashboard
          </Text>
          <Text style={styles.headerSubtitle}>Manage your assigned requests efficiently</Text>
        </View>
        <TouchableOpacity style={styles.logoutButton}>
          <Icon name="logout" size={20} color="white" />
        </TouchableOpacity>
      </View>
      </LinearGradient>

      <ScrollView 
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Statistics Grid */}
        {dashboardData && (
          <>
            <View style={styles.statsGrid}>
              <StatCard 
                title="Total Requests" 
                value={dashboardData.stats.total} 
                icon="inbox" 
                color="#2C3E50" 
              />
              <StatCard 
                title="Pending" 
                value={dashboardData.stats.pending} 
                icon="clock" 
                color="#F59E0B" 
              />
              <StatCard 
                title="In Progress" 
                value={dashboardData.stats.in_progress} 
                icon="sync" 
                color="#3B82F6" 
              />
              <StatCard 
                title="Completed" 
                value={dashboardData.stats.completed} 
                icon="check-circle" 
                color="#10B981" 
              />
            </View>

            {/* Requests List */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>
                  <Icon name="format-list-bulleted" size={20} color="#2C3E50" /> Your Assigned Requests
                </Text>
              </View>

              {dashboardData.assigned_requests.length === 0 ? (
                <View style={styles.emptyState}>
                  <Icon name="inbox" size={50} color="#CBD5E1" />
                  <Text style={styles.emptyStateTitle}>No requests found!</Text>
                  <Text style={styles.emptyStateText}>
                    There are no requests assigned to you at the moment.
                  </Text>
                </View>
              ) : (
                <FlatList
                  data={dashboardData.assigned_requests}
                  renderItem={({ item }) => <RequestItem request={item} />}
                  keyExtractor={item => item.id.toString()}
                  scrollEnabled={false}
                />
              )}
            </View>
          </>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
  },
  loadingText: {
    marginTop: 10,
    color: '#64748B',
  },
  header: {
    
   paddingHorizontal: 10,
    paddingTop: 20,
    paddingBottom: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 5,
  },
  headerSubtitle: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.8)',
  },
  logoutButton: {
    padding: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.5)',
    borderRadius: 8,
    margin:30,
  },
  content: {
    flex: 1,
    padding: 15,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  statCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 15,
    marginBottom: 15,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    width: '48%',
  },
  statContent: {
    flex: 1,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1A252F',
    marginBottom: 5,
  },
  statTitle: {
    fontSize: 14,
    color: '#64748B',
  },
  statIcon: {
    opacity: 0.3,
  },
  section: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2C3E50',
  },
  requestItem: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 15,
    marginBottom: 10,
    borderLeftWidth: 4,
    borderLeftColor: '#4ECDC4',
  },
  requestHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  requestId: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2C3E50',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  statusPending: {
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    borderColor: 'rgba(245, 158, 11, 0.2)',
    borderWidth: 1,
  },
  statusInprogress: {
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    borderColor: 'rgba(59, 130, 246, 0.2)',
    borderWidth: 1,
  },
  statusCompleted: {
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    borderColor: 'rgba(16, 185, 129, 0.2)',
    borderWidth: 1,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  userName: {
    fontSize: 14,
    color: '#374151',
    marginBottom: 5,
  },
  serviceText: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 10,
  },
  requestFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  priorityBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  priorityHigh: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
  },
  priorityNormal: {
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
  },
  priorityLow: {
    backgroundColor: 'rgba(107, 114, 128, 0.1)',
  },
  priorityText: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  dateText: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  emptyState: {
    alignItems: 'center',
    padding: 40,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
    marginTop: 10,
    marginBottom: 5,
  },
  emptyStateText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
  },
});

export default ResolverDashboard;
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
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { useNavigation } from '@react-navigation/native';
import * as Animatable from 'react-native-animatable';

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
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Assigner Dashboard</Text>
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <Text style={{ color: 'white' }}>Logout</Text>
        </TouchableOpacity>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.statsScroll}>
        {Object.keys(stats).map((key) => (
          <View key={key} style={[styles.statCard, { borderColor: statColors[key] }]}>
            <Text style={[styles.statValue, { color: statColors[key] }]}>{stats[key]}</Text>
            <Text style={styles.statLabel}>{key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}</Text>
          </View>
        ))}
      </ScrollView>

      <View style={styles.searchContainer}>
        <TextInput
          placeholder="Search requests..."
          value={search}
          onChangeText={setSearch}
          style={styles.searchInput}
        />
      </View>
      <View style={styles.filterRow}>
        {['all','pending','inprogress','completed'].map(f => (
          <TouchableOpacity
            key={f}
            onPress={() => setFilter(f)}
            style={[styles.filterBtn, filter === f && styles.filterBtnActive]}
          >
            <Text style={filter === f ? {color:'white'} : {color:'#2C3E50'}}>
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#2C3E50" style={{ marginTop: 20 }} />
      ) : (
        <FlatList
          data={filteredRequests}
          keyExtractor={item => item.id.toString()}
          renderItem={renderRequest}
          contentContainerStyle={{ paddingBottom: 50 }}
        />
      )}
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
  pending: { backgroundColor:'#FEF3C7', color:'#92400E' },
  inprogress: { backgroundColor:'#DBEAFE', color:'#1E40AF' },
  completed: { backgroundColor:'#34D399', color:'#065F46' },
};

const priorityColors = {
  high: { color:'#DC2626' },
  normal: { color:'#3B82F6' },
  low: { color:'#059669' },
};

const styles = StyleSheet.create({
  container: { flex:1, backgroundColor:'#E6FFFA', padding:10 },
  header: { flexDirection:'row', justifyContent:'space-between', alignItems:'center', marginBottom:10 },
  headerTitle: { fontSize:24, fontWeight:'700' },
  logoutBtn: { backgroundColor:'#EF4444', padding:8, borderRadius:8 },
  statsScroll: { flexDirection:'row', marginBottom:10 },
  statCard: { minWidth:120, padding:15, borderRadius:16, borderWidth:2, marginRight:10, alignItems:'center' },
  statValue: { fontSize:22, fontWeight:'700' },
  statLabel: { fontSize:14, marginTop:5 },
  searchContainer: { marginVertical:10 },
  searchInput: { backgroundColor:'white', padding:10, borderRadius:12 },
  filterRow: { flexDirection:'row', marginBottom:10 },
  filterBtn: { padding:10, borderRadius:12, borderWidth:1, marginRight:5 },
  filterBtnActive: { backgroundColor:'#4ECDC4', borderColor:'#4ECDC4' },
  requestCard: { backgroundColor:'white', padding:15, borderRadius:16, marginBottom:10, shadowColor:'#000', shadowOpacity:0.1, shadowRadius:4 },
  requestHeader: { flexDirection:'row', justifyContent:'space-between', marginBottom:5 },
  projectName: { fontSize:16, fontWeight:'700' },
  userName: { fontSize:14, color:'#555' },
  issue: { marginBottom:5 },
  badgesRow: { flexDirection:'row', gap:10, marginTop:5 },
  statusBadge: { paddingHorizontal:10, paddingVertical:3, borderRadius:20, fontWeight:'600', marginRight:5 },
  priorityBadge: { paddingHorizontal:10, paddingVertical:3, borderRadius:20, fontWeight:'600' },
  viewBtn: { backgroundColor:'#4ECDC4', padding:8, borderRadius:12, marginTop:8, alignItems:'center' },
  errorContainer: { padding: 10, alignItems: 'center' },
  errorText: { color: '#ff6b6b', fontSize: 16 },
  retryButton: { marginTop: 10, backgroundColor: '#34d399', padding: 8, borderRadius: 6 },
  retryText: { color: 'white', fontWeight: '600' },
});

export default AssignerDashboardScreen;
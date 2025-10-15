import React, { useState, useEffect, useRef } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { useNavigation } from '@react-navigation/native';

const UserHistoryScreen = () => {
  const { token, userApi } = useAuth();
  const navigation = useNavigation();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const intervalRef = useRef(null);

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

  if (loading) return (
    <View style={styles.loader}>
      <ActivityIndicator size="large" color="#4e8cff" />
      <Text>Loading history...</Text>
    </View>
  );

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.historyTitle}>All Requests History</Text>

      {error ? (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={retryFetch}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : requests.length === 0 ? (
        <Text style={styles.noRequests}>No requests found.</Text>
      ) : (
        requests.map(req => (
          <TouchableOpacity
            key={req.id}
            style={[
              styles.requestCard,
              req.priority==='high' && styles.requestCardHigh,
              req.priority==='low' && styles.requestCardLow
            ]}
            onPress={() => navigation.navigate('RequestDetail', { requestId: req.id })}
          >
            <View style={styles.requestHeader}>
              <Text style={styles.serviceName}>{req.service?.name || 'No Service'}</Text>
              <Text style={[
                styles.priorityBadge,
                req.priority==='high'?styles.priorityBadgeHigh:
                req.priority==='normal'?styles.priorityBadgeNormal:styles.priorityBadgeLow
              ]}>
                {req.priority?.charAt(0).toUpperCase() + req.priority?.slice(1)}
              </Text>
            </View>
            <Text style={styles.projectName}>Source: {req.project?.type==='app'?'App':'Web'} - {req.project?.name || 'N/A'}</Text>
            <Text style={styles.requestDate}>{new Date(req.created_at).toLocaleDateString('en-US',{month:'long',day:'numeric',year:'numeric'})}</Text>
            <Text style={styles.requestContent}>{req.request_details || 'No details'}</Text>
            <Text style={[
              styles.statusBadge,
              req.status==='pending'?styles.statusPending:
              req.status==='inprogress'?styles.statusInprogress:styles.statusCompleted
            ]}>{req.status?.charAt(0).toUpperCase() + req.status?.slice(1)}</Text>
          </TouchableOpacity>
        ))
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#e6fffa', padding: 10 },
  historyTitle: { fontSize: 18, marginBottom: 15, color: '#2c3e50', textAlign: 'center' },
  requestCard: { borderLeftWidth: 3, borderLeftColor: '#4ecdc4', padding: 12, marginBottom: 12, backgroundColor: '#f8fafc', borderRadius: 6 },
  requestCardHigh: { borderLeftColor: '#ff6b6b' },
  requestCardLow: { borderLeftColor: '#ffd166' },
  requestHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8, flexWrap: 'wrap', gap: 8 },
  serviceName: { fontWeight: '600', color: '#2c3e50' },
  projectName: { fontWeight: '500', color: '#555' },
  priorityBadge: { padding: 3, borderRadius: 15 },
  priorityBadgeHigh: { backgroundColor: '#ff6b6b', color: 'white' },
  priorityBadgeNormal: { backgroundColor: '#4ecdc4', color: 'white' },
  priorityBadgeLow: { backgroundColor: '#ffd166', color: '#2c3e50' },
  requestDate: { fontSize: 12, color: '#7b8788' },
  requestContent: { lineHeight: 20 },
  statusBadge: { padding: 3, borderRadius: 15 },
  statusPending: { backgroundColor: '#ffe66d', color: '#2c3e50' },
  statusInprogress: { backgroundColor: '#4ecdc4', color: 'white' },
  statusCompleted: { backgroundColor: '#34d399', color: 'white' },
  noRequests: { textAlign: 'center', color: '#7b8788' },
  loader: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  errorContainer: { padding: 10, alignItems: 'center' },
  errorText: { color: '#ff6b6b', fontSize: 16 },
  retryButton: { marginTop: 10, backgroundColor: '#34d399', padding: 8, borderRadius: 6 },
  retryText: { color: 'white', fontWeight: '600' },
});

export default UserHistoryScreen;
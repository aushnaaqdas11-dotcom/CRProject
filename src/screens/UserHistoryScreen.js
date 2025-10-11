import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import api from '../services/apiService';
import { useAuth } from '../context/AuthContext';

const UserHistoryScreen = () => {
  const { token, logout } = useAuth();
  const [requests, setRequests] = useState([]);
  const [error, setError] = useState(null);
  const intervalRef = useRef(null);

  useEffect(() => {
    if (!token) return;
    fetchData();
    startAutoRefresh();

    return () => clearInterval(intervalRef.current);
  }, [token]);

  const startAutoRefresh = () => {
    intervalRef.current = setInterval(() => {
      fetchRecentRequests();
    }, 60000); // every 60 seconds
  };

  const fetchData = async () => {
    try {
      const headers = { Authorization: `Bearer ${token}` };
      const response = await api.get('/user/history', { headers });
      if (response.data.success) {
        setRequests(response.data.requests || []);
        setError(null);
        console.log('History requests:', response.data.requests);
      }
    } catch (err) {
      handleApiError(err);
    }
  };

  const fetchRecentRequests = async () => {
    try {
      const headers = { Authorization: `Bearer ${token}` };
      const response = await api.get('/user/history', { headers });
      if (response.data.success) setRequests(response.data.requests || []);
    } catch (err) {
      console.error('Auto-refresh error:', err.response ? err.response.data : err.message);
    }
  };

  const handleApiError = (err) => {
    console.error(
      'History fetch error:',
      err.response ? err.response.data : err.message
    );
    if (err.response && err.response.status === 401) {
      logout();
    } else {
      setError(
        'Failed to load history. Please try again or check server status.'
      );
    }
  };

  const retryFetch = () => {
    setError(null);
    fetchData();
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.historyTitle}>Request History</Text>
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
          <View
            key={req.id}
            style={[
              styles.requestCard,
              req.priority === 'high' && styles.requestCardHigh,
              req.priority === 'low' && styles.requestCardLow,
            ]}
          >
            <View style={styles.requestHeader}>
              <Text style={styles.serviceName}>{req.query?.name || 'N/A'}</Text>
              <Text
                style={[
                  styles.priorityBadge,
                  req.priority === 'high' && styles.priorityBadgeHigh,
                  req.priority === 'normal' && styles.priorityBadgeNormal,
                  req.priority === 'low' && styles.priorityBadgeLow,
                ]}
              >
                {req.priority.charAt(0).toUpperCase() + req.priority.slice(1)}
              </Text>
            </View>
            <Text style={styles.projectName}>
              Source: {req.project?.type === 'app' ? 'app' : 'web'} -{' '}
              {req.project?.name || 'N/A'}
            </Text>
            <Text style={styles.requestDate}>
              Submitted on:{' '}
              {new Date(req.created_at).toLocaleDateString('en-US', {
                month: 'long',
                day: 'numeric',
                year: 'numeric',
              })}
            </Text>
            <Text style={styles.requestContent}>{req.request_details}</Text>
            <Text
              style={[
                styles.statusBadge,
                req.status === 'pending' && styles.statusPending,
                req.status === 'inprogress' && styles.statusInprogress,
                req.status === 'completed' && styles.statusCompleted,
              ]}
            >
              {req.status.charAt(0).toUpperCase() + req.status.slice(1)}
            </Text>
          </View>
        ))
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#e6fffa', padding: 10 },
  historyTitle: {
    fontSize: 18,
    marginBottom: 15,
    color: '#2c3e50',
    textAlign: 'center',
  },
  requestCard: {
    borderLeftWidth: 3,
    borderLeftColor: '#4ecdc4',
    padding: 12,
    marginBottom: 12,
    backgroundColor: '#f8fafc',
    borderRadius: 6,
  },
  requestCardHigh: { borderLeftColor: '#ff6b6b' },
  requestCardLow: { borderLeftColor: '#ffd166' },
  requestHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
    flexWrap: 'wrap',
    gap: 8,
  },
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
  errorContainer: { padding: 10, alignItems: 'center' },
  errorText: { color: '#ff6b6b', fontSize: 16 },
  retryButton: {
    marginTop: 10,
    backgroundColor: '#34d399',
    padding: 8,
    borderRadius: 6,
  },
  retryText: { color: 'white', fontWeight: '600' },
});

export default UserHistoryScreen;

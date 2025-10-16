import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
  ScrollView,
  Alert,
} from 'react-native';
import * as Animatable from 'react-native-animatable';
import { useRoute, useNavigation } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import { Picker } from '@react-native-picker/picker';

const RequestDetailScreen = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const { userApi } = useAuth();
  const { requestId } = route.params;

  const [loading, setLoading] = useState(true);
  const [request, setRequest] = useState(null);
  const [developers, setDevelopers] = useState([]);
  const [assignedTo, setAssignedTo] = useState('');
  const [assignerComment, setAssignerComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const fetchRequestDetails = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await userApi.getProjectRequests();
      console.log('Request details response:', res.data);
      
      if (res.data.success) {
        const selected = res.data.requests.find(r => r.id === requestId);
        if (selected) {
          setRequest(selected);
          setAssignedTo(selected.assigned_to || '');
          setAssignerComment(selected.assigner_comment || '');
        } else {
          setRequest(null);
          setError('Request not found.');
          console.error('Request not found with ID:', requestId);
        }
      } else {
        const errorMsg = res.data.message || 'Failed to load request details.';
        setError(errorMsg);
        console.error('API Error:', errorMsg);
      }
    } catch (error) {
      console.error('Details fetch error:', error);
      const errorMsg = error.response?.data?.message || error.message || 'Failed to load request details.';
      setError(errorMsg);
      console.error('Full error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchDevelopers = async () => {
    try {
      setError(null);
      const res = await userApi.getDevelopers();
      console.log('Developers response:', res.data);
      
      if (res.data.success) {
        setDevelopers(res.data.developers || []);
      } else {
        const errorMsg = res.data.message || 'Failed to load developers.';
        setError(errorMsg);
        console.error('Developers API Error:', errorMsg);
      }
    } catch (err) {
      console.error('Developers fetch error:', err);
      const errorMsg = err.response?.data?.message || err.message || 'Failed to load developers.';
      setError(errorMsg);
      console.error('Full developers error:', {
        message: err.message,
        response: err.response?.data,
        status: err.response?.status
      });
    }
  };

  useEffect(() => {
    fetchRequestDetails();
    fetchDevelopers();
  }, []);

  const handleAssign = async () => {
    if (!assignedTo || !assignerComment) {
      Alert.alert('Missing Fields', 'Please select a developer and enter a comment.');
      return;
    }
    
    try {
      setSubmitting(true);
      setError(null);
      
      const data = {
        request_id: requestId,
        developer_id: assignedTo,
        assigner_comment: assignerComment,
      };
      
      console.log('Assigning request with data:', data);
      
      const res = await userApi.assignToDeveloper(data);
      console.log('Assign response:', res.data);
      
      if (res.data.success) {
        Alert.alert('Success', res.data.message || 'Request assigned successfully!', [
          {
            text: 'OK',
            onPress: () => navigation.goBack()
          }
        ]);
      } else {
        const errorMsg = res.data.message || 'Failed to assign request.';
        setError(errorMsg);
        Alert.alert('Assignment Failed', errorMsg);
        console.error('Assignment API Error:', errorMsg);
      }
    } catch (err) {
      console.error('Assign request error:', err);
      const errorMsg = err.response?.data?.message || err.message || 'Failed to assign request. Please try again.';
      setError(errorMsg);
      Alert.alert('Assignment Error', errorMsg);
      console.error('Full assignment error:', {
        message: err.message,
        response: err.response?.data,
        status: err.response?.status,
        stack: err.stack
      });
    } finally {
      setSubmitting(false);
    }
  };

  const retryFetch = () => {
    setError(null);
    fetchRequestDetails();
    fetchDevelopers();
  };

  if (loading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color="#4ECDC4" />
        <Text style={styles.loadingText}>Loading request details...</Text>
      </View>
    );
  }

  if (error && !request) {
    return (
      <View style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorTitle}>Error Loading Request</Text>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={retryFetch}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  if (!request) {
    return (
      <View style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorTitle}>Request Not Found</Text>
          <Text style={styles.errorText}>The requested change request could not be found.</Text>
          <TouchableOpacity style={styles.retryButton} onPress={retryFetch}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Text style={styles.backButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <Animatable.View animation="fadeIn" style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {error && (
          <View style={styles.inlineError}>
            <Text style={styles.inlineErrorText}>{error}</Text>
            <TouchableOpacity onPress={() => setError(null)}>
              <Text style={styles.dismissText}>Dismiss</Text>
            </TouchableOpacity>
          </View>
        )}

        <Text style={styles.headerTitle}>Request Details</Text>

        <View style={styles.detailBox}>
          <Text style={styles.label}>Project:</Text>
          <Text style={styles.value}>{request.project?.name || 'N/A'}</Text>

          <Text style={styles.label}>User:</Text>
          <Text style={styles.value}>{request.user?.name || 'N/A'}</Text>

          <Text style={styles.label}>Query:</Text>
          <Text style={styles.value}>{request.service?.name || 'N/A'}</Text>

          <Text style={styles.label}>Priority:</Text>
          <Text style={[styles.value, { color: priorityColor(request.priority) }]}>
            {request.priority}
          </Text>

          <Text style={styles.label}>Status:</Text>
          <Text style={[styles.value, { color: statusColor(request.status) }]}>
            {request.status}
          </Text>

          <Text style={styles.label}>Request Details:</Text>
          <Text style={styles.value}>{request.request_details}</Text>

          <Text style={styles.label}>Assigned To:</Text>
          <Picker
            selectedValue={assignedTo}
            onValueChange={setAssignedTo}
            style={styles.input}
          >
            <Picker.Item label="Select a developer" value="" />
            {developers.map(dev => (
              <Picker.Item key={dev.id} label={dev.name} value={dev.id} />
            ))}
          </Picker>

          <Text style={styles.label}>Assigner Comment:</Text>
          <TextInput
            value={assignerComment}
            onChangeText={setAssignerComment}
            placeholder="Enter your comment"
            multiline
            style={[styles.input, styles.textArea]}
            placeholderTextColor="#999"
          />
        </View>

        <TouchableOpacity
          style={[styles.assignBtn, submitting && styles.assignBtnDisabled]}
          disabled={submitting}
          onPress={handleAssign}
        >
          <Text style={styles.assignBtnText}>
            {submitting ? 'Assigning...' : 'Assign Request'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </ScrollView>
    </Animatable.View>
  );
};

const statusColor = (status) => {
  switch (status?.toLowerCase()) {
    case 'pending': return '#F59E0B';
    case 'inprogress': return '#3B82F6';
    case 'completed': return '#10B981';
    default: return '#6B7280';
  }
};

const priorityColor = (priority) => {
  switch (priority?.toLowerCase()) {
    case 'high': return '#DC2626';
    case 'normal': return '#3B82F6';
    case 'low': return '#059669';
    default: return '#374151';
  }
};

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#E6FFFA', 
    padding: 15 
  },
  scrollContent: {
    flexGrow: 1,
  },
  loader: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center',
    backgroundColor: '#E6FFFA',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#374151',
  },
  headerTitle: { 
    fontSize: 22, 
    fontWeight: '700', 
    marginBottom: 15, 
    textAlign: 'center',
    color: '#2C3E50',
  },
  detailBox: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    marginBottom: 20,
  },
  label: { 
    fontWeight: '600', 
    marginTop: 12, 
    color: '#374151',
    fontSize: 14,
  },
  value: { 
    fontSize: 16, 
    color: '#111827', 
    marginTop: 4,
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#F9FAFB',
    borderRadius: 10,
    padding: 12,
    marginTop: 6,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    fontSize: 16,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  assignBtn: {
    backgroundColor: '#4ECDC4',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  assignBtnDisabled: {
    opacity: 0.6,
  },
  assignBtnText: { 
    color: 'white', 
    fontSize: 16, 
    fontWeight: '700' 
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#DC2626',
    marginBottom: 10,
    textAlign: 'center',
  },
  errorText: {
    fontSize: 16,
    color: '#374151',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 22,
  },
  inlineError: {
    backgroundColor: '#FEE2E2',
    padding: 15,
    borderRadius: 10,
    marginBottom: 15,
    borderLeftWidth: 4,
    borderLeftColor: '#DC2626',
  },
  inlineErrorText: {
    color: '#DC2626',
    fontSize: 14,
    marginBottom: 8,
  },
  dismissText: {
    color: '#DC2626',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'right',
  },
  retryButton: {
    backgroundColor: '#4ECDC4',
    padding: 12,
    borderRadius: 8,
    marginBottom: 10,
    minWidth: 100,
    alignItems: 'center',
  },
  retryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  backButton: {
    backgroundColor: '#6B7280',
    padding: 12,
    borderRadius: 8,
    minWidth: 100,
    alignItems: 'center',
  },
  backButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default RequestDetailScreen;
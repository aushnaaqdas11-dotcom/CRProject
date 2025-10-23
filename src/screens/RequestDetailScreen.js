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
  const { userApi, logout } = useAuth();
  const { requestId } = route.params;

  const [loading, setLoading] = useState(true);
  const [request, setRequest] = useState(null);
  const [developers, setDevelopers] = useState([]);
  const [assignedTo, setAssignedTo] = useState('');
  const [assignerComment, setAssignerComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const fetchRequestDetails = async (signal) => {
    try {
      setError(null);
      const res = await userApi.getProjectRequests({ signal });
      
      console.log('Request details response:', {
        success: res.data?.success,
        requestCount: res.data?.requests?.length,
        status: res.status,
      });
      
      // Safe data access
      if (res.data?.success && Array.isArray(res.data.requests)) {
        const selected = res.data.requests.find(r => r.id === requestId);
        if (selected) {
          setRequest(selected);
          setAssignedTo(selected.assigned_to || '');
          setAssignerComment(selected.assigner_comment || '');
          return true; // Success
        } else {
          setRequest(null);
          setError('Request not found.');
          console.log('Request not found with ID:', requestId);
          return false;
        }
      } else {
        const errorMsg = res.data?.message || 'Failed to load request details.';
        setError(errorMsg);
        console.log('API Error:', errorMsg);
        return false;
      }
    } catch (error) {
      if (error.name !== 'AbortError') {
        console.log('Details fetch error:', error.message);
        const errorMsg = error.response?.data?.message || error.message || 'Failed to load request details.';
        
        // Handle specific errors without automatic logout
        if (error.response?.status === 401) {
          setError('Session expired. Please log in again.');
        } else if (error.response?.status === 404) {
          setError('API route not found. Please contact support.');
        } else if (error.message.includes('Network Error')) {
          setError('Network error. Please check your connection.');
        } else {
          setError(errorMsg);
        }
      }
      return false;
    }
  };

  const fetchDevelopers = async (signal) => {
    try {
      console.log('Starting fetchDevelopers');
      const res = await userApi.getDevelopers({ signal });
      
      console.log('Developers response:', {
        success: res.data?.success,
        developerCount: res.data?.developers?.length,
        status: res.status,
      });
      
      // Safe data access with multiple fallbacks
      if (res.data?.success && Array.isArray(res.data.developers)) {
        const mappedDevelopers = res.data.developers
          .map(dev => {
            // Try multiple possible ID fields
            const id = dev.id || dev.developer_id || dev.user_id;
            // Try multiple possible name fields
            const name = dev.name || dev.full_name || dev.username || 'Unnamed Developer';
            
            return id ? { id, name } : null;
          })
          .filter(dev => dev !== null); // Remove null entries
          
        console.log('Mapped developers:', mappedDevelopers);
        setDevelopers(mappedDevelopers);
      } else {
        setDevelopers([]);
        console.log('Invalid or empty developers data');
      }
    } catch (err) {
      if (err.name !== 'AbortError') {
        console.log('Developers fetch error:', err.message);
        // Don't set error for developers fetch - it shouldn't block the main request
      }
    }
  };

  useEffect(() => {
    const abortController = new AbortController();
    let isMounted = true;

    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // First fetch request details
        const requestSuccess = await fetchRequestDetails(abortController.signal);
        
        // Only fetch developers if request details were successful and component is still mounted
        if (requestSuccess && isMounted) {
          await fetchDevelopers(abortController.signal);
        }
      } catch (error) {
        console.log('Load data error:', error);
        if (isMounted) {
          setError('Failed to load data. Please try again.');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadData();

    return () => {
      isMounted = false;
      abortController.abort();
    };
  }, [requestId]);

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
      console.log('Assign response:', { success: res.data?.success, status: res.status });
      
      if (res.data?.success) {
        Alert.alert('Success', res.data.message || 'Request assigned successfully!', [
          {
            text: 'OK',
            onPress: () => {
              if (navigation.canGoBack()) {
                navigation.goBack();
              } else {
                navigation.navigate('AssignerDashboard');
              }
            }
          }
        ]);
      } else {
        const errorMsg = res.data?.message || 'Failed to assign request.';
        setError(errorMsg);
        Alert.alert('Assignment Failed', errorMsg);
      }
    } catch (err) {
      console.log('Assign request error:', err.message);
      const errorMsg = err.response?.data?.message || err.message || 'Failed to assign request. Please try again.';
      
      // Handle errors without automatic logout
      if (err.response?.status === 401) {
        setError('Session expired. Please log in again.');
      } else {
        setError(errorMsg);
        Alert.alert('Assignment Error', errorMsg);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const retryFetch = () => {
    if (!loading) {
      setError(null);
      setLoading(true);
      setRequest(null);
      setDevelopers([]);
      
      const abortController = new AbortController();
      const loadData = async () => {
        const requestSuccess = await fetchRequestDetails(abortController.signal);
        if (requestSuccess) {
          await fetchDevelopers(abortController.signal);
        }
        setLoading(false);
      };
      loadData();
    }
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
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.canGoBack() && navigation.goBack()}>
            <Text style={styles.backButtonText}>Go Back</Text>
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
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.canGoBack() && navigation.goBack()}>
            <Text style={styles.backButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // Safe data access for request object
  const safeRequest = {
    project: request.project || { name: 'N/A' },
    user: request.user || { name: 'N/A' },
    service: request.service || { name: 'N/A' },
    priority: request.priority || 'N/A',
    status: request.status || 'N/A',
    request_details: request.request_details || 'No details provided',
  };

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
          <Text style={styles.value}>{safeRequest.project.name}</Text>

          <Text style={styles.label}>User:</Text>
          <Text style={styles.value}>{safeRequest.user.name}</Text>

          <Text style={styles.label}>Query:</Text>
          <Text style={styles.value}>{safeRequest.service.name}</Text>

          <Text style={styles.label}>Priority:</Text>
          <Text style={[styles.value, { color: priorityColor(safeRequest.priority) }]}>
            {safeRequest.priority}
          </Text>

          <Text style={styles.label}>Status:</Text>
          <Text style={[styles.value, { color: statusColor(safeRequest.status) }]}>
            {safeRequest.status}
          </Text>

          <Text style={styles.label}>Request Details:</Text>
          <Text style={styles.value}>{safeRequest.request_details}</Text>

          <Text style={styles.label}>Assigned To:</Text>
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={assignedTo}
              onValueChange={setAssignedTo}
              style={styles.picker}
              dropdownIconColor="#FFFFFF"
              enabled={developers.length > 0}
            >
              <Picker.Item label="Select a developer" value="" color="#FFFFFF" />
              {developers.map(dev => (
                <Picker.Item 
                  key={dev.id} 
                  label={dev.name} 
                  value={dev.id} 
                  color="#FFFFFF" 
                />
              ))}
            </Picker>
          </View>
          {developers.length === 0 && (
            <Text style={styles.errorText}>No developers available. Please try again later.</Text>
          )}

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
          style={[styles.assignBtn, (submitting || developers.length === 0) && styles.assignBtnDisabled]}
          disabled={submitting || developers.length === 0}
          onPress={handleAssign}
        >
          <Text style={styles.assignBtnText}>
            {submitting ? 'Assigning...' : 'Assign Request'}
          </Text>
        </TouchableOpacity>

        {/* Space between buttons */}
        <View style={styles.buttonSpacer} />

        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.canGoBack() && navigation.goBack()}
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
    paddingBottom: 20,
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
    color: '#000000',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  // Picker styling with dark background for white text visibility
  pickerContainer: {
    backgroundColor: '#374151',
    borderRadius: 10,
    marginTop: 6,
    borderWidth: 1,
    borderColor: '#4B5563',
    overflow: 'hidden',
  },
  picker: {
    color: '#FFFFFF',
    height: 50,
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
  // Space between buttons
  buttonSpacer: {
    height: 20,
  },
  backButton: {
    backgroundColor: '#6B7280',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  backButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
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
    color: '#DC2626',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 22,
    fontStyle: 'italic',
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
});

export default RequestDetailScreen;
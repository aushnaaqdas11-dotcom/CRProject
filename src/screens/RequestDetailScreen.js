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

  const fetchRequestDetails = async () => {
    try {
      setLoading(true);
      const res = await userApi.getProjectRequests();
      if (res.data.success) {
        const selected = res.data.requests.find(r => r.id === requestId);
        if (selected) {
          setRequest(selected);
          setAssignedTo(selected.assigned_to || '');
          setAssignerComment(selected.assigner_comment || '');
        } else {
          setRequest(null);
          Alert.alert('Error', 'Request not found.');
        }
      } else {
        Alert.alert('Error', res.data.message || 'Failed to load request details.');
      }
    } catch (error) {
      console.error('Details error:', error);
      Alert.alert('Error', error.response?.data?.message || 'Failed to load request details.');
    } finally {
      setLoading(false);
    }
  };

  const fetchDevelopers = async () => {
    try {
      const res = await userApi.getDevelopers();
      if (res.data.success) {
        setDevelopers(res.data.developers || []);
      } else {
        Alert.alert('Error', res.data.message || 'Failed to load developers.');
      }
    } catch (err) {
      console.error('Developers error:', err);
      Alert.alert('Error', err.response?.data?.message || 'Failed to load developers.');
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
      const data = {
        request_id: requestId,
        developer_id: assignedTo,
        assigner_comment: assignerComment,
      };
      const res = await userApi.assignToDeveloper(data);
      if (res.data.success) {
        Alert.alert('Success', res.data.message || 'Request assigned successfully!');
        navigation.goBack();
      } else {
        Alert.alert('Error', res.data.message || 'Failed to assign request.');
      }
    } catch (err) {
      console.error('Assign error:', err);
      Alert.alert('Error', err.response?.data?.message || 'Failed to assign request.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color="#4ECDC4" />
      </View>
    );
  }

  if (!request) {
    return (
      <View style={styles.container}>
        <Text style={{ textAlign: 'center', color: 'red' }}>Request not found</Text>
      </View>
    );
  }

  return (
    <Animatable.View animation="fadeIn" style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
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
            style={[styles.input, { height: 80 }]}
          />
        </View>

        <TouchableOpacity
          style={[styles.assignBtn, submitting && { opacity: 0.7 }]}
          disabled={submitting}
          onPress={handleAssign}
        >
          <Text style={styles.assignBtnText}>
            {submitting ? 'Assigning...' : 'Assign Request'}
          </Text>
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
  container: { flex: 1, backgroundColor: '#E6FFFA', padding: 15 },
  loader: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: 22, fontWeight: '700', marginBottom: 15, textAlign: 'center' },
  detailBox: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 15,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  label: { fontWeight: '600', marginTop: 10, color: '#374151' },
  value: { fontSize: 16, color: '#111827', marginTop: 3 },
  input: {
    backgroundColor: '#F9FAFB',
    borderRadius: 10,
    padding: 10,
    marginTop: 5,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  assignBtn: {
    backgroundColor: '#4ECDC4',
    padding: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 20,
  },
  assignBtnText: { color: 'white', fontSize: 16, fontWeight: '700' },
});

export default RequestDetailScreen;
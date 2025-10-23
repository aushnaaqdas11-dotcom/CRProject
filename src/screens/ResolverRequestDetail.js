// screens/ResolverRequestDetail.js
import React, { useState, useEffect, useContext } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
  Alert,
  Modal,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

const ResolverRequestDetail = ({ route, navigation }) => {
  const { requestId } = route.params;
  const { user, userApi } = useAuth();
  const [requestData, setRequestData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const [formData, setFormData] = useState({
    status: '',
    working_hours: '',
    resolver_comment: ''
  });

  const fetchRequestDetails = async () => {
    try {
      setLoading(true);
      const response = await userApi.resolver.getRequestDetails(requestId);
      if (response.data.success) {
        const data = response.data.data;
        setRequestData(data);
        setFormData({
          status: data.request.status,
          working_hours: data.resolver_data?.working_hours?.toString() || '',
          resolver_comment: data.resolver_data?.resolver_comment || ''
        });
      } else {
        Alert.alert('Error', response.data.message || 'Failed to load request details');
        navigation.goBack();
      }
    } catch (error) {
      console.log('Request details error:', error);
      Alert.alert('Error', 'Failed to load request details');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async () => {
    if (!formData.status) {
      Alert.alert('Error', 'Please select a status');
      return;
    }

    try {
      setUpdating(true);
      const updateData = {
        status: formData.status,
        working_hours: parseFloat(formData.working_hours) || 0,
        resolver_comment: formData.resolver_comment
      };

      const response = await userApi.resolver.updateRequestStatus(requestId, updateData);
      if (response.data.success) {
        setShowSuccess(true);
        setRequestData(prev => ({
          ...prev,
          request: response.data.data.request,
          resolver_data: response.data.data.resolver_data
        }));
        setTimeout(() => setShowSuccess(false), 3000);
      } else {
        Alert.alert('Error', response.data.message || 'Failed to update status');
      }
    } catch (error) {
      console.log('Update error:', error);
      Alert.alert('Error', 'Failed to update request status');
    } finally {
      setUpdating(false);
    }
  };

  useEffect(() => {
    fetchRequestDetails();
  }, [requestId]);

  const InfoItem = ({ label, value, icon, isBadge = false, badgeType = '' }) => (
    <View style={styles.infoItem}>
      <Text style={styles.infoLabel}>
        <Icon name={icon} size={16} color="#2C3E50" /> {label}
      </Text>
      {isBadge ? (
        <View style={[styles.badge, styles[badgeType]]}>
          <Text style={styles.badgeText}>{value}</Text>
        </View>
      ) : (
        <View style={styles.infoValue}>
          <Text style={styles.infoValueText}>{value || 'N/A'}</Text>
        </View>
      )}
    </View>
  );

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#4ECDC4" />
        <Text style={styles.loadingText}>Loading Request Details...</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      {/* Success Modal */}
      <Modal
        visible={showSuccess}
        transparent
        animationType="fade"
      >
        <View style={styles.modalOverlay}>
          <View style={styles.successModal}>
            <Icon name="check-circle" size={40} color="#10B981" />
            <Text style={styles.successTitle}>Success!</Text>
            <Text style={styles.successMessage}>Status updated successfully</Text>
            <TouchableOpacity 
              style={styles.successClose}
              onPress={() => setShowSuccess(false)}
            >
              <Icon name="close" size={20} color="white" />
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Header with Back Button */}
      <TouchableOpacity 
        style={styles.backButton}
        onPress={() => navigation.goBack()}
      >
        <Icon name="arrow-left" size={24} color="#2C3E50" />
        <Text style={styles.backButtonText}>Back to Dashboard</Text>
      </TouchableOpacity>

      <ScrollView 
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {requestData && (
          <View style={styles.card}>
            {/* Card Header */}
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>
                <Icon name="file-document" size={24} color="white" /> Request Details
              </Text>
              <View style={styles.requestIdBadge}>
                <Text style={styles.requestIdText}>ID: #{requestData.request.id}</Text>
              </View>
            </View>

            <View style={styles.cardBody}>
              {/* Information Grid */}
              <View style={styles.infoGrid}>
                <InfoItem 
                  label="User" 
                  value={requestData.request.user?.name} 
                  icon="account" 
                />
                <InfoItem 
                  label="Status" 
                  value={requestData.request.status} 
                  icon="information" 
                  isBadge 
                  badgeType={`status${requestData.request.status.charAt(0).toUpperCase() + requestData.request.status.slice(1)}`}
                />
                <InfoItem 
                  label="Priority" 
                  value={requestData.request.priority} 
                  icon="alert-circle" 
                  isBadge 
                  badgeType={`priority${requestData.request.priority.charAt(0).toUpperCase() + requestData.request.priority.slice(1)}`}
                />
                <InfoItem 
                  label="Created" 
                  value={new Date(requestData.request.created_at).toLocaleDateString('en-US', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })} 
                  icon="calendar" 
                />
                <InfoItem 
                  label="Assigner Message" 
                  value={requestData.assigner_comment} 
                  icon="email" 
                />
              </View>

              {/* Request Details Section */}
              <View style={styles.detailsSection}>
                <Text style={styles.detailsLabel}>
                  <Icon name="format-align-left" size={16} color="#2C3E50" /> Request Details
                </Text>
                <View style={styles.detailsContent}>
                  <Text style={styles.detailsText}>{requestData.request.request_details}</Text>
                </View>
              </View>

              {/* Update Form */}
              <View style={styles.updateForm}>
                <Text style={styles.formTitle}>Update Request Status</Text>

                {/* Status Selector */}
                <View style={styles.formGroup}>
                  <Text style={styles.formLabel}>
                    <Icon name="sync" size={16} color="#2C3E50" /> Update Status
                  </Text>
                  <View style={styles.statusButtons}>
                    {['pending', 'inprogress', 'completed'].map(status => (
                      <TouchableOpacity
                        key={status}
                        style={[
                          styles.statusButton,
                          formData.status === status && styles.statusButtonActive,
                          styles[`statusButton${status.charAt(0).toUpperCase() + status.slice(1)}`]
                        ]}
                        onPress={() => setFormData(prev => ({ ...prev, status }))}
                      >
                        <Text style={[
                          styles.statusButtonText,
                          formData.status === status && styles.statusButtonTextActive
                        ]}>
                          {status === 'inprogress' ? 'In Progress' : status.charAt(0).toUpperCase() + status.slice(1)}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                {/* Working Hours */}
                <View style={styles.formGroup}>
                  <Text style={styles.formLabel}>
                    <Icon name="clock" size={16} color="#2C3E50" /> Working Hours
                  </Text>
                  <TextInput
                    style={styles.textInput}
                    value={formData.working_hours}
                    onChangeText={(text) => setFormData(prev => ({ ...prev, working_hours: text }))}
                    placeholder="Enter working hours"
                    keyboardType="numeric"
                    returnKeyType="done"
                  />
                </View>

                {/* Resolver Comment */}
                <View style={styles.formGroup}>
                  <Text style={styles.formLabel}>
                    <Icon name="comment" size={16} color="#2C3E50" /> Resolver Comment
                  </Text>
                  <TextInput
                    style={[styles.textInput, styles.textArea]}
                    value={formData.resolver_comment}
                    onChangeText={(text) => setFormData(prev => ({ ...prev, resolver_comment: text }))}
                    placeholder="Enter your comments..."
                    multiline
                    numberOfLines={4}
                    textAlignVertical="top"
                    returnKeyType="done"
                    blurOnSubmit={true}
                  />
                </View>

                {/* Update Button */}
                <TouchableOpacity 
                  style={[styles.updateButton, updating && styles.updateButtonDisabled]}
                  onPress={handleUpdateStatus}
                  disabled={updating}
                >
                  {updating ? (
                    <ActivityIndicator size="small" color="white" />
                  ) : (
                    <>
                      <Icon name="check" size={20} color="white" />
                      <Text style={styles.updateButtonText}>Update Status</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
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
    padding: 15,
  },
  loadingText: {
    marginTop: 10,
    color: '#64748B',
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    paddingTop: Platform.OS === 'ios' ? 50 : 20,
    backgroundColor: '#F8FAFC',
    marginTop:20,
  },
  backButtonText: {
    fontSize: 16,
    color: '#2C3E50',
    marginLeft: 8,
    fontWeight: '500',
    
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: 15,
    paddingBottom: 30, // Extra padding at bottom for keyboard
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
    marginBottom: 20,
  },
  cardHeader: {
    backgroundColor: '#2C3E50',
    padding: 25,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
  },
  requestIdBadge: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  requestIdText: {
    fontSize: 14,
    fontWeight: '600',
    color: 'white',
  },
  cardBody: {
    padding: 20,
  },
  infoGrid: {
    marginBottom: 25,
  },
  infoItem: {
    marginBottom: 20,
  },
  infoLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2C3E50',
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  infoValue: {
    backgroundColor: '#E6FFFA',
    padding: 15,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#4ECDC4',
  },
  infoValueText: {
    fontSize: 16,
    color: '#1A252F',
  },
  badge: {
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
    alignSelf: 'flex-start',
  },
  badgeText: {
    fontSize: 14,
    fontWeight: '600',
    textTransform: 'capitalize',
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
  priorityHigh: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
  },
  priorityNormal: {
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
  },
  priorityLow: {
    backgroundColor: 'rgba(107, 114, 128, 0.1)',
  },
  detailsSection: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 12,
    marginBottom: 25,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
    borderLeftWidth: 4,
    borderLeftColor: '#4ECDC4',
  },
  detailsLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2C3E50',
    marginBottom: 12,
    textTransform: 'uppercase',
  },
  detailsContent: {
    backgroundColor: '#F8FAFC',
    padding: 15,
    borderRadius: 8,
  },
  detailsText: {
    fontSize: 16,
    lineHeight: 24,
    color: '#374151',
  },
  updateForm: {
    backgroundColor: 'rgba(248, 250, 252, 0.8)',
    padding: 25,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.6)',
  },
  formTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2C3E50',
    marginBottom: 20,
  },
  formGroup: {
    marginBottom: 20,
  },
  formLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2C3E50',
    marginBottom: 10,
  },
  statusButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statusButton: {
    flex: 1,
    padding: 12,
    borderRadius: 12,
    alignItems: 'center',
    marginHorizontal: 4,
    borderWidth: 2,
    borderColor: '#E2E8F0',
  },
  statusButtonActive: {
    borderColor: '#4ECDC4',
    backgroundColor: 'rgba(78, 205, 196, 0.1)',
  },
  statusButtonPending: {},
  statusButtonInprogress: {},
  statusButtonCompleted: {},
  statusButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748B',
    textTransform: 'capitalize',
  },
  statusButtonTextActive: {
    color: '#2C3E50',
  },
  textInput: {
    backgroundColor: 'white',
    borderWidth: 2,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    padding: 15,
    fontSize: 16,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  updateButton: {
    backgroundColor: '#10B981',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  updateButtonDisabled: {
    opacity: 0.7,
  },
  updateButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  successModal: {
    backgroundColor: '#10B981',
    padding: 30,
    borderRadius: 16,
    alignItems: 'center',
    margin: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  successTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
    marginTop: 10,
    marginBottom: 5,
  },
  successMessage: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.9)',
    textAlign: 'center',
  },
  successClose: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 15,
    padding: 5,
  },
});

export default ResolverRequestDetail;
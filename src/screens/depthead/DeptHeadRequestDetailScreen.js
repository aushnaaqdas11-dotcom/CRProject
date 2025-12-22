import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Image,
  Alert,
  Modal,
  ActivityIndicator,
  Dimensions,
  TextInput,
  StatusBar,
} from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome';
import LinearGradient from 'react-native-linear-gradient';
import Sound from 'react-native-sound';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../../services/apiService';

const { width: screenWidth } = Dimensions.get('window');

const DeptHeadRequestDetailsScreen = ({ route, navigation }) => {
  const { requestId } = route.params;
  const [request, setRequest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [imageModalVisible, setImageModalVisible] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [sound, setSound] = useState();
  const [isPlaying, setIsPlaying] = useState(false);
  const [rejectModalVisible, setRejectModalVisible] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');

  // Color scheme
  const statusColors = {
    pending: { backgroundColor: '#FEF3C7', color: '#92400E' },
    inprogress: { backgroundColor: '#DBEAFE', color: '#1E40AF' },
    completed: { backgroundColor: '#D1FAE5', color: '#065F46' },
    approved: { backgroundColor: '#D1FAE5', color: '#065F46' },
    rejected: { backgroundColor: '#FEE2E2', color: '#991B1B' },
  };

  const priorityColors = {
    high: { backgroundColor: '#FEE2E2', color: '#991B1B' },
    normal: { backgroundColor: '#FEF3C7', color: '#92400E' },
    low: { backgroundColor: '#DBEAFE', color: '#1E40AF' },
  };

  // ✅ Added: Check token before API calls
  const checkTokenAndNavigate = useCallback(async () => {
    try {
      const token = await AsyncStorage.getItem('api_token');
      if (!token) {
        navigation.reset({
          index: 0,
          routes: [{ name: 'Login' }],
        });
        return false;
      }
      return true;
    } catch (error) {
      return false;
    }
  }, [navigation]);

  const fetchRequestDetails = useCallback(async () => {
    try {
      // Check token first
      const hasToken = await checkTokenAndNavigate();
      if (!hasToken) {
        setLoading(false);
        return;
      }

      setLoading(true);
      console.log('🔄 Fetching request details for ID:', requestId);
      
      const response = await api.deptHead.getRequestDetails(requestId);
      
      console.log('📱 API Response:', response.data);
      
      if (response.data.success && response.data.request) {
        const requestData = response.data.request;
        
        console.log('📊 Request data loaded:', {
          id: requestData.id,
          dept_head_status: requestData.dept_head_status,
          attachments: requestData.attachments,
          project: requestData.project?.name,
          user: requestData.user?.name
        });
        
        // Use the transformed data directly from backend
        setRequest(requestData);
      } else {
        console.error('❌ API returned unsuccessful:', response.data);
        Alert.alert('Error', response.data.message || 'Failed to load request');
      }
    } catch (error) {
      console.error('❌ Network/API Error:', {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data,
        url: error.config?.url
      });
      
      if (error.response?.status === 404) {
        Alert.alert('Error', 'Request not found or endpoint does not exist');
      } else if (error.response?.status === 401) {
        Alert.alert('Session Expired', 'Please login again');
        await api.clearToken();
        navigation.reset({
          index: 0,
          routes: [{ name: 'Login' }],
        });
      } else if (error.response?.status === 403) {
        Alert.alert('Access Denied', 'You do not have permission to view this request');
      } else {
        Alert.alert('Error', 'Failed to load request details: ' + (error.message || 'Unknown error'));
      }
    } finally {
      setLoading(false);
    }
  }, [checkTokenAndNavigate, navigation, requestId]);

  useEffect(() => {
    fetchRequestDetails();
    
    return () => {
      if (sound) {
        sound.stop();
        sound.release();
      }
    };
  }, [fetchRequestDetails, sound]);

  const handleApprove = useCallback(async () => {
    Alert.alert(
      'Approve Request',
      'Are you sure you want to approve this request?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Approve',
          onPress: async () => {
            try {
              await api.deptHead.approveRequest(requestId);
              Alert.alert('Success', 'Request approved successfully!');
              navigation.goBack();
            } catch (error) {
              Alert.alert('Error', error.message || 'Failed to approve request');
            }
          },
        },
      ]
    );
  }, [requestId, navigation]);

  const handleReject = useCallback(() => {
    setRejectModalVisible(true);
  }, []);

  const confirmReject = useCallback(async () => {
    if (!rejectionReason.trim()) {
      Alert.alert('Error', 'Please provide a rejection reason');
      return;
    }

    try {
      await api.deptHead.rejectRequest(requestId, rejectionReason);
      Alert.alert('Success', 'Request rejected successfully!');
      setRejectModalVisible(false);
      setRejectionReason('');
      navigation.goBack();
    } catch (error) {
      Alert.alert('Error', error.message || 'Failed to reject request');
    }
  }, [requestId, rejectionReason, navigation]);

  const playVoiceNote = useCallback((audioUrl) => {
    try {
      if (sound) {
        sound.stop();
        sound.release();
      }

      // Check if audioUrl is valid
      if (!audioUrl || typeof audioUrl !== 'string') {
        Alert.alert('Error', 'Audio URL is invalid');
        return;
      }

      // Try different Sound initialization methods
      const newSound = new Sound(audioUrl, Sound.MAIN_BUNDLE, (error) => {
        if (error) {
          console.error('Error loading sound:', error);
          Alert.alert('Error', 'Could not load audio file');
          return;
        }
        
        // Play the sound
        newSound.play((success) => {
          if (success) {
            console.log('Audio finished playing');
          } else {
            console.log('Audio playback failed');
          }
          newSound.release();
          setIsPlaying(false);
        });
        setIsPlaying(true);
      });

      setSound(newSound);
    } catch (error) {
      console.error('Error playing voice note:', error);
      Alert.alert('Error', 'Could not play audio');
    }
  }, [sound]);

  const stopVoiceNote = useCallback(() => {
    if (sound) {
      sound.stop();
      sound.release();
      setSound(null);
      setIsPlaying(false);
    }
  }, [sound]);

  const openImageModal = useCallback((imageUrl) => {
    setSelectedImage(imageUrl);
    setImageModalVisible(true);
  }, []);

  // ✅ Component functions wrapped in useCallback
  const InfoCard = useCallback(({ label, value, icon, children }) => (
    <View style={styles.infoCard}>
      <View style={styles.infoHeader}>
        <Icon name={icon} size={16} color="#3B82F6" />
        <Text style={styles.infoLabel}>{label}</Text>
      </View>
      {children || <Text style={styles.infoValue}>{value}</Text>}
    </View>
  ), []);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3B82F6" />
        <Text style={styles.loadingText}>Loading request details...</Text>
      </View>
    );
  }

  if (!request) {
    return (
      <View style={styles.errorContainer}>
        <Icon name="exclamation-triangle" size={48} color="#EF4444" />
        <Text style={styles.errorText}>Request not found</Text>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const statusConfig = statusColors[request.dept_head_status] || statusColors.pending;
  const priorityConfig = priorityColors[request.priority] || priorityColors.normal;

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar backgroundColor="#1A252F" barStyle="light-content" />
      
      {/* Header */}
     <LinearGradient
       colors={['#2C3E50', '#4ECDC4']}
       start={{ x: 0, y: 0 }}
       end={{ x: 1, y: 0 }}
       style={styles.header}
     >
        <View style={styles.headerTop}>
          
          
          <View style={styles.statusBadgeContainer}>
            <View style={[styles.statusBadge, { backgroundColor: statusConfig.backgroundColor }]}>
              <Icon
                name={
                  request.dept_head_status === 'approved' ? 'check-circle' :
                  request.dept_head_status === 'rejected' ? 'times-circle' : 'clock'
                }
                size={14}
                color={statusConfig.color}
              />
              <Text style={[styles.statusBadgeText, { color: statusConfig.color }]}>
                {request.dept_head_status?.toUpperCase()}
              </Text>
            </View>
          </View>
        </View>
        
        <Text style={styles.headerTitle}>Request #{request.id}</Text>
        <Text style={styles.headerSubtitle}>View and manage request details</Text>
      </LinearGradient>

      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Main Content */}
        <View style={styles.mainCard}>
          {/* Request Information */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Icon name="info-circle" size={20} color="#3B82F6" />
              <Text style={styles.sectionTitle}>Request Information</Text>
            </View>
            
            <View style={styles.infoGrid}>
              <InfoCard
                label="Project"
                value={request.project?.name || '—'}
                icon="folder"
              />
              
              <InfoCard
                label="Submitted By"
                value={request.user?.name || '—'}
                icon="user"
              />
              
              <InfoCard
                label="Priority"
                icon="flag"
              >
                <View style={[styles.priorityBadge, { backgroundColor: priorityConfig.backgroundColor }]}>
                  <Text style={[styles.priorityText, { color: priorityConfig.color }]}>
                    {request.priority?.toUpperCase() || 'NORMAL'}
                  </Text>
                </View>
              </InfoCard>
              
              <InfoCard
                label="Submitted Date"
                value={new Date(request.created_at).toLocaleString('en-US', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
                icon="calendar"
              />
            </View>
          </View>

          {/* Request Details */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Icon name="align-left" size={20} color="#3B82F6" />
              <Text style={styles.sectionTitle}>Request Details</Text>
            </View>
            <View style={styles.detailsBox}>
              <Text style={styles.detailsText}>{request.details}</Text>
            </View>
          </View>

          {/* Rejection Reason */}
          {request.rejection_reason && (
            <View style={styles.section}>
              <View style={styles.rejectionBox}>
                <View style={styles.rejectionHeader}>
                  <Icon name="exclamation-triangle" size={18} color="#DC2626" />
                  <Text style={styles.rejectionTitle}>Rejection Reason</Text>
                </View>
                <Text style={styles.rejectionText}>{request.rejection_reason}</Text>
              </View>
            </View>
          )}

          {/* Attachments */}
          {request.attachments_array && request.attachments_array.length > 0 && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Icon name="paperclip" size={20} color="#3B82F6" />
                <Text style={styles.sectionTitle}>Attachments</Text>
              </View>
              <ScrollView 
                horizontal 
                showsHorizontalScrollIndicator={false} 
                contentContainerStyle={styles.attachmentsScroll}
              >
                {request.attachments_array.map((attachment, index) => (
                  <TouchableOpacity
                    key={index}
                    style={styles.attachmentItem}
                    onPress={() => openImageModal(attachment)}
                    activeOpacity={0.8}
                  >
                    <Image
                      source={{ uri: attachment }}
                      style={styles.attachmentImage}
                      resizeMode="cover"
                    />
                    <View style={styles.attachmentOverlay}>
                      <Icon name="search-plus" size={20} color="#fff" />
                    </View>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}

          {/* Voice Note */}
          {request.voice_note_path && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Icon name="microphone" size={20} color="#3B82F6" />
                <Text style={styles.sectionTitle}>Voice Note</Text>
              </View>
              <View style={styles.voiceNoteContainer}>
                <TouchableOpacity
                  style={styles.playButton}
                  onPress={() => 
                    isPlaying 
                      ? stopVoiceNote() 
                      : playVoiceNote(request.voice_note_path)
                  }
                  activeOpacity={0.7}
                >
                  <Icon
                    name={isPlaying ? 'stop-circle' : 'play-circle'}
                    size={36}
                    color="#3B82F6"
                  />
                  <Text style={styles.playButtonText}>
                    {isPlaying ? 'Stop' : 'Play'} Voice Note
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Action Buttons (Only for pending requests) */}
      {request.dept_head_status === 'pending' && (
        <View style={styles.footerActions}>
          <TouchableOpacity
            style={styles.approveButton}
            onPress={handleApprove}
            activeOpacity={0.8}
          >
            <Icon name="check" size={20} color="#fff" />
            <Text style={styles.approveButtonText}>Approve</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.rejectButton}
            onPress={handleReject}
            activeOpacity={0.8}
          >
            <Icon name="times" size={20} color="#fff" />
            <Text style={styles.rejectButtonText}>Reject</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Image Preview Modal */}
      <Modal
        visible={imageModalVisible}
        transparent={true}
        animationType="fade"
        statusBarTranslucent={true}
      >
        <View style={styles.imageModalContainer}>
          <TouchableOpacity
            style={styles.modalCloseButton}
            onPress={() => setImageModalVisible(false)}
            activeOpacity={0.7}
          >
            <Icon name="times" size={24} color="#fff" />
          </TouchableOpacity>
          <Image
            source={{ uri: selectedImage }}
            style={styles.modalImage}
            resizeMode="contain"
          />
        </View>
      </Modal>

      {/* Reject Modal */}
      <Modal
        visible={rejectModalVisible}
        transparent={true}
        animationType="slide"
        statusBarTranslucent={true}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.rejectModalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.rejectModalTitle}>Reject Request</Text>
              <TouchableOpacity
                onPress={() => {
                  setRejectModalVisible(false);
                  setRejectionReason('');
                }}
              >
                <Icon name="times" size={20} color="#64748B" />
              </TouchableOpacity>
            </View>
            
            <Text style={styles.rejectModalSubtitle}>
              Please provide a reason for rejection:
            </Text>
            
            <TextInput
              style={styles.reasonInput}
              placeholder="Enter detailed reason for rejection..."
              value={rejectionReason}
              onChangeText={setRejectionReason}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
              placeholderTextColor="#94A3B8"
            />
            
            <View style={styles.rejectModalButtons}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => {
                  setRejectModalVisible(false);
                  setRejectionReason('');
                }}
                activeOpacity={0.7}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[
                  styles.confirmRejectButton,
                  !rejectionReason.trim() && styles.confirmRejectButtonDisabled
                ]}
                onPress={confirmReject}
                disabled={!rejectionReason.trim()}
                activeOpacity={0.7}
              >
                <Text style={styles.confirmRejectButtonText}>Confirm Rejection</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#64748B',
    fontWeight: '500',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#F8FAFC',
  },
  errorText: {
    fontSize: 18,
    color: '#1A252F',
    marginTop: 16,
    marginBottom: 24,
    fontWeight: '500',
  },
  backButton: {
    backgroundColor: '#3B82F6',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 10,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  backButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 15,
  },
  // Header Styles
  header: {
    paddingTop: StatusBar.currentHeight + 12,
    paddingHorizontal: 16,
    paddingBottom: 20,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    lineHeight: 20,
  },
  statusBadgeContainer: {
    alignItems: 'flex-end',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    gap: 6,
  },
  statusBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 100,
  },
  mainCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1A252F',
  },
  infoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
  },
  infoCard: {
    width: '48%',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  infoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  infoLabel: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  infoValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A252F',
  },
  priorityBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  priorityText: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  detailsBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  detailsText: {
    fontSize: 15,
    color: '#1A252F',
    lineHeight: 24,
  },
  rejectionBox: {
    backgroundColor: 'rgba(254, 226, 226, 0.3)',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: 12,
    padding: 16,
  },
  rejectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  rejectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#DC2626',
  },
  rejectionText: {
    fontSize: 14,
    color: '#1A252F',
    lineHeight: 22,
  },
  attachmentsScroll: {
    gap: 12,
  },
  attachmentItem: {
    width: 140,
    height: 140,
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    position: 'relative',
  },
  attachmentImage: {
    width: '100%',
    height: '100%',
  },
  attachmentOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  voiceNoteContainer: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 24,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
  },
  playButton: {
    alignItems: 'center',
    gap: 12,
  },
  playButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#3B82F6',
  },
  // Footer Action Buttons
  footerActions: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    flexDirection: 'row',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    gap: 12,
  },
  approveButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#10B981',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  approveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  rejectButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EF4444',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  rejectButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  // Image Modal Styles
  imageModalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.95)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalCloseButton: {
    position: 'absolute',
    top: StatusBar.currentHeight + 16,
    right: 16,
    zIndex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  modalImage: {
    width: screenWidth - 32,
    height: screenWidth - 32,
    borderRadius: 8,
  },
  // Reject Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  rejectModalContainer: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  rejectModalTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1A252F',
  },
  rejectModalSubtitle: {
    fontSize: 15,
    color: '#64748B',
    marginBottom: 20,
    lineHeight: 22,
  },
  reasonInput: {
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    padding: 16,
    fontSize: 15,
    color: '#1A252F',
    minHeight: 120,
    marginBottom: 24,
    textAlignVertical: 'top',
    backgroundColor: '#F8FAFC',
    lineHeight: 22,
  },
  rejectModalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 14,
    alignItems: 'center',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#fff',
  },
  cancelButtonText: {
    color: '#64748B',
    fontWeight: '600',
    fontSize: 15,
  },
  confirmRejectButton: {
    flex: 1,
    paddingVertical: 14,
    alignItems: 'center',
    borderRadius: 10,
    backgroundColor: '#EF4444',
  },
  confirmRejectButtonDisabled: {
    backgroundColor: '#FECACA',
    opacity: 0.7,
  },
  confirmRejectButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 15,
  },
});

export default DeptHeadRequestDetailsScreen;
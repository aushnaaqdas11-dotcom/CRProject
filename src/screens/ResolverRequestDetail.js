// screens/ResolverRequestDetail.js
import React, { useState, useEffect, useRef } from 'react';
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
  Platform,
  Dimensions,
  StatusBar,
  DrawerLayoutAndroid
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import LinearGradient from 'react-native-linear-gradient';

const { width } = Dimensions.get('window');

const ResolverRequestDetail = ({ route, navigation }) => {
  // ALL HOOKS MUST BE CALLED AT THE TOP LEVEL, IN THE SAME ORDER
  const { requestId } = route.params;
  const { user, userApi, logout } = useAuth();
  const [requestData, setRequestData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const drawerRef = useRef(null); // useRef MUST be called here, not conditionally

  const [formData, setFormData] = useState({
    status: '',
    working_hours: '',
    resolver_comment: ''
  });

  // Rest of the component logic...
  const openDrawer = () => {
    if (drawerRef.current) {
      drawerRef.current.openDrawer();
    }
  };

  const closeDrawer = () => {
    if (drawerRef.current) {
      drawerRef.current.closeDrawer();
    }
  };

  const handleLogout = async () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            try {
              await logout();
              navigation.navigate('Login');
            } catch (error) {
              Alert.alert('Error', 'Failed to logout');
            }
          }
        }
      ]
    );
  };

  const navigationView = () => (
    <View style={styles.drawerContainer}>
      <LinearGradient
        colors={['#2C3E50', '#4ECDC4']}
        style={styles.drawerHeader}
      >
        <View style={styles.drawerHeaderContent}>
          <View style={styles.userAvatar}>
            <Icon name="account-tie" size={40} color="#fff" />
          </View>
          <Text style={styles.drawerUserName}>
            {user?.name || 'Resolver'}
          </Text>
          <Text style={styles.drawerUserRole}>Resolver</Text>
        </View>
      </LinearGradient>

      <View style={styles.drawerMenu}>
        <TouchableOpacity 
          style={styles.drawerItem}
          onPress={() => {
            closeDrawer();
            navigation.navigate('ResolverDashboard');
          }}
        >
          <Icon name="home" size={20} color="#2C3E50" />
          <Text style={styles.drawerItemText}>Dashboard</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.drawerItem}
          onPress={() => {
            closeDrawer();
          }}
        >
          <Icon name="format-list-bulleted" size={20} color="#2C3E50" />
          <Text style={styles.drawerItemText}>My Requests</Text>
        </TouchableOpacity>

        <View style={styles.drawerDivider} />

        <TouchableOpacity 
          style={[styles.drawerItem, styles.logoutDrawerItem]}
          onPress={() => {
            closeDrawer();
            handleLogout();
          }}
        >
          <Icon name="logout" size={20} color="#e74c3c" />
          <Text style={[styles.drawerItemText, styles.logoutText]}>Logout</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

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
    <View style={styles.detailRow}>
      <Text style={styles.label}>
        <Icon name={icon} size={16} color="#2C3E50" /> {label}
      </Text>
      {isBadge ? (
        <Text style={[styles.value, { color: badgeType.includes('status') ? statusColor(value) : priorityColor(value) }]}>
          {value}
        </Text>
      ) : (
        <Text style={styles.value}>{value || 'N/A'}</Text>
      )}
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color="#2C3E50" />
        <Text style={styles.loadingText}>Loading Request Details...</Text>
      </View>
    );
  }

  return (
    <DrawerLayoutAndroid
      ref={drawerRef}
      drawerWidth={300}
      drawerPosition="left"
      renderNavigationView={navigationView}
    >
      <View style={styles.container}>
        <StatusBar backgroundColor="#2C3E50" barStyle="light-content" />
        
        {/* Top Navbar */}
        <View style={styles.navbar}>
          <TouchableOpacity 
            style={styles.menuButton}
            onPress={openDrawer}
          >
            <Icon name="menu" size={24} color="#fff" />
          </TouchableOpacity>
          
          <View style={styles.navbarCenter}>
            <Text style={styles.navbarTitle}>Request Details</Text>
          </View>
          
          <View style={styles.navbarRight}>
            <TouchableOpacity style={styles.navbarIcon}>
              <Icon name="account" size={20} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>

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

          <ScrollView 
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
          >
            {requestData && (
              <>
                {/* Request Details Card */}
                <View style={styles.detailCard}>
                  <Text style={styles.cardTitle}>Request Information</Text>
                  
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

                  <View style={styles.detailSection}>
                    <Text style={styles.label}>Request Details:</Text>
                    <Text style={styles.detailsText}>{requestData.request.request_details}</Text>
                  </View>
                </View>

                {/* Update Form Card */}
                <View style={styles.detailCard}>
                  <Text style={styles.cardTitle}>Update Request Status</Text>

                  {/* Status Selector */}
                  <View style={styles.detailSection}>
                    <Text style={styles.label}>
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
                  <View style={styles.detailSection}>
                    <Text style={styles.label}>
                      <Icon name="clock" size={16} color="#2C3E50" /> Working Hours
                    </Text>
                    <TextInput
                      style={styles.textArea}
                      value={formData.working_hours}
                      onChangeText={(text) => setFormData(prev => ({ ...prev, working_hours: text }))}
                      placeholder="Enter working hours"
                      keyboardType="numeric"
                      returnKeyType="done"
                    />
                  </View>

                  {/* Resolver Comment */}
                  <View style={styles.detailSection}>
                    <Text style={styles.label}>
                      <Icon name="comment" size={16} color="#2C3E50" /> Resolver Comment
                    </Text>
                    <TextInput
                      style={[styles.textArea, { height: 100 }]}
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
                </View>

                {/* Action Buttons */}
                <TouchableOpacity
                  style={[styles.assignBtn, (updating || !formData.status) && styles.assignBtnDisabled]}
                  disabled={updating || !formData.status}
                  onPress={handleUpdateStatus}
                >
                  <LinearGradient colors={['#2C3E50', '#4ECDC4']} style={styles.buttonGradient}>
                    {updating ? (
                      <ActivityIndicator size="small" color="white" />
                    ) : (
                      <Text style={styles.buttonText}>
                        Update Status
                      </Text>
                    )}
                  </LinearGradient>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.backButton}
                  onPress={() => navigation.goBack()}
                >
                  <LinearGradient colors={['#6B7280', '#9CA3AF']} style={styles.buttonGradient}>
                    <Text style={styles.buttonText}>Go Back</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </>
            )}
          </ScrollView>
        </KeyboardAvoidingView>
      </View>
    </DrawerLayoutAndroid>
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
    backgroundColor: '#F8FAFC',
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 20,
  },
  loader: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#2C3E50',
  },
  
  // Navbar Styles
  navbar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#2C3E50',
    paddingHorizontal: 16,
    paddingTop: 35,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#34495e',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  menuButton: {
    padding: 8,
  },
  navbarCenter: {
    flex: 1,
    alignItems: 'center',
  },
  navbarTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  navbarRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  navbarIcon: {
    padding: 8,
  },

  // Detail Card
  detailCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 25,
    margin: 20,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2C3E50',
    marginBottom: 20,
    textAlign: 'center',
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  detailSection: {
    marginBottom: 20,
  },
  label: { 
    fontWeight: '600', 
    color: '#374151',
    fontSize: 14,
    flex: 1,
  },
  value: { 
    fontSize: 16, 
    color: '#111827', 
    fontWeight: '500',
    flex: 1,
    textAlign: 'right',
  },
  detailsText: {
    fontSize: 16,
    color: '#374151',
    lineHeight: 24,
    marginTop: 8,
    backgroundColor: '#f8fafc',
    padding: 15,
    borderRadius: 10,
    borderLeftWidth: 4,
    borderLeftColor: '#4ECDC4',
  },

  // Status Buttons
  statusButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
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

  // Input and TextArea
  textArea: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 15,
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    fontSize: 16,
    color: '#000000',
    textAlignVertical: 'top',
  },

  // Buttons
  buttonGradient: {
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  assignBtn: {
    marginHorizontal: 20,
    marginBottom: 12,
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  assignBtnDisabled: {
    opacity: 0.6,
  },
  backButton: {
    marginHorizontal: 20,
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },

  // Modal Styles
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

  // Drawer Styles
  drawerContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  drawerHeader: {
    padding: 20,
    paddingTop: 60,
    paddingBottom: 30,
  },
  drawerHeaderContent: {
    alignItems: 'center',
  },
  userAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
  },
  drawerUserName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 5,
  },
  drawerUserRole: {
    fontSize: 14,
    color: '#fff',
    opacity: 0.8,
  },
  drawerMenu: {
    flex: 1,
    padding: 20,
  },
  drawerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    paddingHorizontal: 10,
    borderRadius: 8,
    marginBottom: 5,
  },
  drawerItemText: {
    fontSize: 16,
    color: '#2C3E50',
    marginLeft: 15,
    fontWeight: '500',
  },
  drawerDivider: {
    height: 1,
    backgroundColor: '#ecf0f1',
    marginVertical: 15,
  },
  logoutDrawerItem: {
    marginTop: 'auto',
    marginBottom: 20,
  },
  logoutText: {
    color: '#e74c3c',
  },
});

export default ResolverRequestDetail;
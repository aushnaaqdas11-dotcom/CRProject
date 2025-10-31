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
  Dimensions,
  StatusBar,
  DrawerLayoutAndroid
} from 'react-native';
import * as Animatable from 'react-native-animatable';
import { useRoute, useNavigation } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import { Picker } from '@react-native-picker/picker';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/FontAwesome';

const { width } = Dimensions.get('window');

const RequestDetailScreen = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const { userApi, logout, user } = useAuth();
  const { requestId } = route.params;
  const drawerRef = React.useRef(null);

  const [loading, setLoading] = useState(true);
  const [request, setRequest] = useState(null);
  const [developers, setDevelopers] = useState([]);
  const [assignedTo, setAssignedTo] = useState('');
  const [assignerComment, setAssignerComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const openDrawer = () => {
    drawerRef.current?.openDrawer();
  };

  const closeDrawer = () => {
    drawerRef.current?.closeDrawer();
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

  const navigationView = (
    <View style={styles.drawerContainer}>
      <LinearGradient
        colors={['#2C3E50', '#4ECDC4']}
        style={styles.drawerHeader}
      >
        <View style={styles.drawerHeaderContent}>
          <View style={styles.userAvatar}>
            <Icon name="user" size={40} color="#fff" />
          </View>
          <Text style={styles.drawerUserName}>
            {user?.name || 'User'}
          </Text>
          <Text style={styles.drawerUserRole}>Assigner</Text>
        </View>
      </LinearGradient>

      <View style={styles.drawerMenu}>
        <TouchableOpacity 
          style={styles.drawerItem}
          onPress={() => {
            closeDrawer();
            navigation.navigate('AssignerDashboard');
          }}
        >
          <Icon name="home" size={20} color="#2C3E50" />
          <Text style={styles.drawerItemText}>Dashboard</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.drawerItem}
          onPress={() => {
            closeDrawer();
            // Add navigation for other screens
          }}
        >
          <Icon name="list-alt" size={20} color="#2C3E50" />
          <Text style={styles.drawerItemText}>Requests</Text>
        </TouchableOpacity>

        <View style={styles.drawerDivider} />

        <TouchableOpacity 
          style={styles.drawerItem}
          onPress={() => {
            closeDrawer();
            // Add settings navigation here
          }}
        >
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.drawerItem, styles.logoutDrawerItem]}
          onPress={() => {
            closeDrawer();
            handleLogout();
          }}
        >
          <Icon name="sign-out" size={20} color="#e74c3c" />
          <Text style={[styles.drawerItemText, styles.logoutText]}>Logout</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const fetchRequestDetails = async (signal) => {
    try {
      setError(null);
      const res = await userApi.getProjectRequests({ signal });
      
      console.log('Request details response:', {
        success: res.data?.success,
        requestCount: res.data?.requests?.length,
        status: res.status,
      });
      
      if (res.data?.success && Array.isArray(res.data.requests)) {
        const selected = res.data.requests.find(r => r.id === requestId);
        if (selected) {
          setRequest(selected);
          setAssignedTo(selected.assigned_to || '');
          setAssignerComment(selected.assigner_comment || '');
          return true;
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
      
      if (res.data?.success && Array.isArray(res.data.developers)) {
        const mappedDevelopers = res.data.developers
          .map(dev => {
            const id = dev.id || dev.developer_id || dev.user_id;
            const name = dev.name || dev.full_name || dev.username || 'Unnamed Developer';
            return id ? { id, name } : null;
          })
          .filter(dev => dev !== null);
          
        console.log('Mapped developers:', mappedDevelopers);
        setDevelopers(mappedDevelopers);
      } else {
        setDevelopers([]);
        console.log('Invalid or empty developers data');
      }
    } catch (err) {
      if (err.name !== 'AbortError') {
        console.log('Developers fetch error:', err.message);
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
        
        const requestSuccess = await fetchRequestDetails(abortController.signal);
        
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
        <ActivityIndicator size="large" color="#2C3E50" />
        <Text style={styles.loadingText}>Loading Request Details...</Text>
      </View>
    );
  }

  if (error && !request) {
    return (
      <View style={styles.container}>
        <StatusBar backgroundColor="#2C3E50" barStyle="light-content" />
        <View style={styles.navbar}>
          <TouchableOpacity 
            style={styles.menuButton}
            onPress={() => navigation.goBack()}
          >
            <Icon name="arrow-left" size={24} color="#fff" />
          </TouchableOpacity>
          
          <View style={styles.navbarCenter}>
            <Text style={styles.navbarTitle}>Request Details</Text>
          </View>
          
          <View style={styles.navbarRight}>
            <TouchableOpacity style={styles.navbarIcon}>
              <Icon name="user" size={20} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.errorContainer}>
          <Text style={styles.errorTitle}>Error Loading Request</Text>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={retryFetch}>
            <LinearGradient colors={['#2C3E50', '#4ECDC4']} style={styles.buttonGradient}>
              <Text style={styles.buttonText}>Retry</Text>
            </LinearGradient>
          </TouchableOpacity>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.canGoBack() && navigation.goBack()}>
            <LinearGradient colors={['#6B7280', '#9CA3AF']} style={styles.buttonGradient}>
              <Text style={styles.buttonText}>Go Back</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  if (!request) {
    return (
      <View style={styles.container}>
        <StatusBar backgroundColor="#2C3E50" barStyle="light-content" />
        <View style={styles.navbar}>
          <TouchableOpacity 
            style={styles.menuButton}
            onPress={() => navigation.goBack()}
          >
            <Icon name="arrow-left" size={24} color="#fff" />
          </TouchableOpacity>
          
          <View style={styles.navbarCenter}>
            <Text style={styles.navbarTitle}>Request Details</Text>
          </View>
          
          <View style={styles.navbarRight}>
            <TouchableOpacity style={styles.navbarIcon}>
              <Icon name="user" size={20} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.errorContainer}>
          <Text style={styles.errorTitle}>Request Not Found</Text>
          <Text style={styles.errorText}>The requested change request could not be found.</Text>
          <TouchableOpacity style={styles.retryButton} onPress={retryFetch}>
            <LinearGradient colors={['#2C3E50', '#4ECDC4']} style={styles.buttonGradient}>
              <Text style={styles.buttonText}>Retry</Text>
            </LinearGradient>
          </TouchableOpacity>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.canGoBack() && navigation.goBack()}>
            <LinearGradient colors={['#6B7280', '#9CA3AF']} style={styles.buttonGradient}>
              <Text style={styles.buttonText}>Go Back</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const safeRequest = {
    project: request.project || { name: 'N/A' },
    user: request.user || { name: 'N/A' },
    service: request.service || { name: 'N/A' },
    priority: request.priority || 'N/A',
    status: request.status || 'N/A',
    request_details: request.request_details || 'No details provided',
  };

  return (
    <DrawerLayoutAndroid
      ref={drawerRef}
      drawerWidth={300}
      drawerPosition="left"
      renderNavigationView={() => navigationView}
    >
      <View style={styles.container}>
        <StatusBar backgroundColor="#2C3E50" barStyle="light-content" />
        
        {/* Top Navbar */}
        <View style={styles.navbar}>
          <TouchableOpacity 
            style={styles.menuButton}
            onPress={openDrawer}
          >
            <Icon name="bars" size={24} color="#fff" />
          </TouchableOpacity>
          
          <View style={styles.navbarCenter}>
            <Text style={styles.navbarTitle}>Request Details</Text>
          </View>
          
          <View style={styles.navbarRight}>
            <TouchableOpacity style={styles.navbarIcon}>
              <Icon name="user" size={20} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
         

          {/* Request Details Card */}
          <View style={styles.detailCard}>
            <Text style={styles.cardTitle}>Request Information</Text>
            
            <View style={styles.detailRow}>
              <Text style={styles.label}>Project:</Text>
              <Text style={styles.value}>{safeRequest.project.name}</Text>
            </View>

            <View style={styles.detailRow}>
              <Text style={styles.label}>User:</Text>
              <Text style={styles.value}>{safeRequest.user.name}</Text>
            </View>

            <View style={styles.detailRow}>
              <Text style={styles.label}>Service:</Text>
              <Text style={styles.value}>{safeRequest.service.name}</Text>
            </View>

            <View style={styles.detailRow}>
              <Text style={styles.label}>Priority:</Text>
              <Text style={[styles.value, { color: priorityColor(safeRequest.priority) }]}>
                {safeRequest.priority}
              </Text>
            </View>

            <View style={styles.detailRow}>
              <Text style={styles.label}>Status:</Text>
              <Text style={[styles.value, { color: statusColor(safeRequest.status) }]}>
                {safeRequest.status}
              </Text>
            </View>

            <View style={styles.detailSection}>
              <Text style={styles.label}>Request Details:</Text>
              <Text style={styles.detailsText}>{safeRequest.request_details}</Text>
            </View>
          </View>

          {/* Assignment Section */}
          <View style={styles.detailCard}>
            <Text style={styles.cardTitle}>Assignment</Text>

            <View style={styles.detailSection}>
              <Text style={styles.label}>Assign To Developer:</Text>
              <View style={styles.pickerContainer}>
                <Picker
                  selectedValue={assignedTo}
                  onValueChange={setAssignedTo}
                  style={styles.picker}
                  dropdownIconColor="#2C3E50"
                  enabled={developers.length > 0}
                >
                  <Picker.Item label="Select a developer" value="" />
                  {developers.map(dev => (
                    <Picker.Item 
                      key={dev.id} 
                      label={dev.name} 
                      value={dev.id} 
                    />
                  ))}
                </Picker>
              </View>
              {developers.length === 0 && (
                <Text style={styles.errorText}>No developers available. Please try again later.</Text>
              )}
            </View>

            <View style={styles.detailSection}>
              <Text style={styles.label}>Assigner Comment:</Text>
              <TextInput
                value={assignerComment}
                onChangeText={setAssignerComment}
                placeholder="Enter your comments for the developer..."
                multiline
                style={styles.textArea}
                placeholderTextColor="#999"
              />
            </View>
          </View>

          {/* Action Buttons */}
          <TouchableOpacity
            style={[styles.assignBtn, (submitting || developers.length === 0) && styles.assignBtnDisabled]}
            disabled={submitting || developers.length === 0}
            onPress={handleAssign}
          >
            <LinearGradient colors={['#2C3E50', '#4ECDC4']} style={styles.buttonGradient}>
              <Text style={styles.buttonText}>
                {submitting ? 'Assigning...' : 'Assign Request'}
              </Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.canGoBack() && navigation.goBack()}
          >
            <LinearGradient colors={['#6B7280', '#9CA3AF']} style={styles.buttonGradient}>
              <Text style={styles.buttonText}>Go Back</Text>
            </LinearGradient>
          </TouchableOpacity>
        </ScrollView>
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

  // Input and Picker
  textArea: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 15,
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    fontSize: 16,
    color: '#000000',
    height: 100,
    textAlignVertical: 'top',
  },
  pickerContainer: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    overflow: 'hidden',
  },
  picker: {
    height: 50,
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

  // Error States
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
    fontSize: 14,
    color: '#DC2626',
    textAlign: 'center',
    marginTop: 5,
    fontStyle: 'italic',
  },
  inlineError: {
    backgroundColor: '#FEE2E2',
    padding: 15,
    borderRadius: 10,
    margin: 20,
    marginBottom: 10,
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

export default RequestDetailScreen;
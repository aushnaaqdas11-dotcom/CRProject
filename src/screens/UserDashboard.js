import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  TextInput, ActivityIndicator, StatusBar
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { useNavigation } from '@react-navigation/native';
import { Dropdown } from 'react-native-element-dropdown';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/FontAwesome';
import { Colors } from '../styles/theme';
import * as Animatable from 'react-native-animatable';

const UserDashboard = () => {
  const { user, userApi, logout } = useAuth();
  const navigation = useNavigation();

  const [services, setServices] = useState([]);
  const [webProjects, setWebProjects] = useState([]);
  const [appProjects, setAppProjects] = useState([]);
  const [selectedService, setSelectedService] = useState('');
  const [targetType, setTargetType] = useState('web');
  const [selectedProject, setSelectedProject] = useState('');
  const [priority, setPriority] = useState('normal');
  const [requestDetails, setRequestDetails] = useState('');
  const [recentRequests, setRecentRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState({ message: '', type: '' });
  const intervalRef = useRef(null);

  useEffect(() => {
    fetchDashboardData();
    intervalRef.current = setInterval(fetchDashboardData, 60000);
    return () => clearInterval(intervalRef.current);
  }, []);

  useEffect(() => setSelectedProject(''), [targetType]);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const [servicesRes, webRes, appRes, recentRes] = await Promise.allSettled([
        userApi.getServices(),
        userApi.getProjects('web'),
        userApi.getProjects('app'),
        userApi.getRecentRequests(),
      ]);

      setServices(servicesRes.status === 'fulfilled' ? servicesRes.value.data.services || [] : []);
      setWebProjects(webRes.status === 'fulfilled' ? webRes.value.data.projects || [] : []);
      setAppProjects(appRes.status === 'fulfilled' ? appRes.value.data.projects || [] : []);
      setRecentRequests(recentRes.status === 'fulfilled' ? recentRes.value.data.requests || [] : []);

      if (servicesRes.status === 'rejected') showNotification('Failed to load services', 'error');
      if (webRes.status === 'rejected') showNotification('Failed to load web projects', 'error');
      if (appRes.status === 'rejected') showNotification('Failed to load app projects', 'error');
      if (recentRes.status === 'rejected') showNotification('Failed to load recent requests', 'error');
    } catch (err) {
      console.error('Dashboard error:', err);
      showNotification('Failed to load dashboard data', 'error');
    } finally {
      setLoading(false);
    }
  };

  const showNotification = (message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification({ message: '', type: '' }), 4000);
  };

  const handleSubmit = async () => {
    if (!selectedService || !selectedProject || !requestDetails.trim()) {
      showNotification('Please fill all fields', 'error');
      return;
    }

    try {
      const payload = {
        query_id: selectedService,
        project_id: selectedProject,
        priority,
        request_details: requestDetails
      };
      const res = await userApi.submitChangeRequest(payload);

      if (!res.data.success) {
        const messages = res.data.errors ? Object.values(res.data.errors).flat().join('\n') : res.data.message;
        showNotification(messages || 'Request failed', 'error');
      } else {
        showNotification(res.data.message || 'Request submitted successfully', 'success');
        setSelectedService('');
        setSelectedProject('');
        setRequestDetails('');
        fetchDashboardData();
      }
    } catch (err) {
      console.error('Submit error:', err);
      showNotification(err.response?.data?.message || 'Error submitting request', 'error');
    }
  };

  const handleLogout = async () => {
    const result = await logout();
    if (result.success) {
      navigation.navigate('Login');
    } else {
      showNotification(result.message, 'error');
    }
  };

  if (loading) return (
    <View style={styles.loader}>
      <ActivityIndicator size="large" color={Colors.accent} />
      <Text style={styles.loadingText}>Loading dashboard...</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
      
      {/* Navbar */}
      <View style={styles.navbar}>
        <View style={styles.navbarContent}>
          <LinearGradient colors={[Colors.primary, Colors.secondary]} style={styles.logoContainer}>
            <Text style={styles.navbarTitle}>Change Request Portal</Text>
          </LinearGradient>
          <View style={styles.actionButtons}>
            <TouchableOpacity style={styles.viewHistoryBtn} onPress={() => navigation.navigate('UserHistory')}>
              <LinearGradient colors={[Colors.primary, Colors.secondary]} style={styles.btnGradient}>
                <Text style={styles.btnText}>View All History</Text>
              </LinearGradient>
            </TouchableOpacity>
            <TouchableOpacity style={styles.viewHistoryBtn} onPress={handleLogout}>
              <LinearGradient colors={['#EF4444', '#DC2626']} style={styles.btnGradient}>
                <Text style={styles.btnText}>Logout</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Main Content */}
      <LinearGradient colors={[Colors.dark, Colors.primary, Colors.dark]} style={styles.background}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {notification.message && (
            <Animatable.View 
              animation="fadeInDown"
              style={[
                styles.notification, 
                notification.type === 'error' ? styles.error : styles.success
              ]}
            >
              <Text style={{ color: 'white' }}>{notification.message}</Text>
            </Animatable.View>
          )}

          <View style={styles.userInfo}>
            <View style={styles.userAvatar}>
              <Text style={styles.avatarText}>{user?.name?.substring(0,2).toUpperCase() || 'SU'}</Text>
            </View>
            <View>
              <Text style={styles.userName}>{user?.name || 'Super User'}</Text>
              <Text style={styles.userEmail}>{user?.email || 'user@example.com'}</Text>
            </View>
          </View>

          <Animatable.View animation="fadeInDown" duration={800}>
            <Text style={styles.dashboardTitle}>Project Enhancement Portal</Text>
          </Animatable.View>
          
          <Animatable.View animation="fadeInUp" duration={800} delay={200} style={styles.requestForm}>
            <LinearGradient colors={['#ffffff', '#f8f9fa', '#ffffff']} style={styles.cardGradient}>
              <View style={styles.header}>
                <Text style={styles.formTitle}>Submit Change Request</Text>
                <Text style={styles.subtitle}>Streamline and manage your requests with ease</Text>
              </View>

              {/* Service Dropdown */}
              <View style={styles.formSection}>
                <Text style={styles.label}>Service Needed</Text>
                <View style={styles.spacing} />
                <View style={styles.inputWrapper}>
                  <Icon name="cogs" size={20} color={Colors.secondary} style={styles.inputIcon} />
                  <Dropdown
                    style={styles.dropdown}
                    placeholderStyle={styles.placeholderStyle}
                    selectedTextStyle={styles.selectedTextStyle}
                    inputSearchStyle={styles.inputSearchStyle}
                    data={services.map(s => ({ label: s.name, value: s.id }))}
                    search
                    maxHeight={200}
                    labelField="label"
                    valueField="value"
                    placeholder="Select a service"
                    searchPlaceholder="Search..."
                    value={selectedService}
                    onChange={item => setSelectedService(item.value)}
                  />
                </View>
              </View>

              {/* Project Type Selection */}
              <View style={styles.formSection}>
                <Text style={styles.label}>Project Type</Text>
                <View style={styles.spacing} />
                <View style={styles.radioGroup}>
                  {['web', 'app'].map((type) => (
                    <TouchableOpacity
                      key={type}
                      style={[
                        styles.radioOption,
                        targetType === type && styles.radioSelected,
                      ]}
                      onPress={() => setTargetType(type)}
                    >
                      <Text style={[
                        styles.radioText,
                        targetType === type && styles.radioTextSelected
                      ]}>
                        {type === 'web' ? 'Web Project' : 'App Project'}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Project Dropdown */}
              <View style={styles.formSection}>
                <Text style={styles.label}>
                  {targetType === 'web' ? 'Select Web Project' : 'Select App Project'}
                </Text>
                <View style={styles.spacing} />
                <View style={styles.inputWrapper}>
                  <Icon name="folder" size={20} color={Colors.secondary} style={styles.inputIcon} />
                  <Dropdown
                    style={styles.dropdown}
                    placeholderStyle={styles.placeholderStyle}
                    selectedTextStyle={styles.selectedTextStyle}
                    inputSearchStyle={styles.inputSearchStyle}
                    data={(targetType === 'web' ? webProjects : appProjects).map(p => ({
                      label: p.name,
                      value: p.id,
                    }))}
                    search
                    maxHeight={200}
                    labelField="label"
                    valueField="value"
                    placeholder={`Select ${targetType === 'web' ? 'Web' : 'App'} Project`}
                    searchPlaceholder="Search..."
                    value={selectedProject}
                    onChange={item => setSelectedProject(item.value)}
                  />
                </View>
              </View>

              {/* Priority Level */}
              <View style={styles.formSection}>
                <Text style={styles.label}>Select Priority Level</Text>
                <View style={styles.spacing} />
                <View style={styles.priorityGroup}>
                  {['high', 'normal', 'low'].map((lvl) => (
                    <TouchableOpacity
                      key={lvl}
                      style={[
                        styles.priorityOption,
                        priority === lvl &&
                          (lvl === 'high'
                            ? styles.priorityHighSelected
                            : lvl === 'normal'
                            ? styles.priorityNormalSelected
                            : styles.priorityLowSelected),
                      ]}
                      onPress={() => setPriority(lvl)}
                    >
                      <Text
                        style={[
                          styles.priorityText,
                          priority === lvl && styles.priorityTextSelected,
                        ]}
                      >
                        {lvl === 'low'
                          ? 'Anytime'
                          : lvl.charAt(0).toUpperCase() + lvl.slice(1)}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Change Request Details */}
              <View style={styles.formSection}>
                <Text style={styles.sectionTitle}>Change Request Details</Text>
                <View style={styles.divider} />
                <View style={styles.spacing} />
                <View style={styles.crdinputWrapper}>
                  <Icon name="edit" size={20} color={Colors.secondary} style={styles.inputIcon} />
                  <TextInput
                    style={styles.textarea}
                    multiline
                    placeholder="Describe the changes you need..."
                    value={requestDetails}
                    onChangeText={setRequestDetails}
                  />
                </View>
              </View>

              <View style={styles.spacingLarge} />
              <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit}>
                <LinearGradient colors={[Colors.primary, Colors.secondary]} style={styles.submitBtnGradient}>
                  <Text style={styles.submitBtnText}>Submit Request</Text>
                </LinearGradient>
              </TouchableOpacity>
            </LinearGradient>
          </Animatable.View>

          <Animatable.View animation="fadeInUp" duration={800} delay={400} style={styles.requestsHistory}>
            <LinearGradient colors={['#ffffff', '#f8f9fa', '#ffffff']} style={styles.cardGradient}>
              <Text style={styles.historyTitle}>Recent Requests</Text>
              {recentRequests.length === 0 ? (
                <Text style={styles.noRequests}>No recent requests found.</Text>
              ) : (
                recentRequests.map((req, index) => (
                  <Animatable.View 
                    key={req.id} 
                    animation="fadeInRight" 
                    duration={600}
                    delay={index * 100}
                    style={styles.requestCard}
                  >
                    <Text style={styles.serviceName}>{req.service?.name || 'No Service'}</Text>
                    <Text style={styles.projectName}>Source: {req.project?.type === 'app' ? 'App' : 'Web'} - {req.project?.name || 'N/A'}</Text>
                    <Text style={styles.requestDate}>{new Date(req.created_at).toLocaleDateString()}</Text>
                    <Text style={styles.requestContent}>{req.request_details || 'No details'}</Text>
                    <Text style={[
                      styles.statusBadge,
                      req.status === 'pending' ? styles.statusPending :
                      req.status === 'inprogress' ? styles.statusInprogress : styles.statusCompleted
                    ]}>
                      {req.status?.charAt(0).toUpperCase() + req.status?.slice(1)}
                    </Text>
                  </Animatable.View>
                ))
              )}
            </LinearGradient>
          </Animatable.View>
        </ScrollView>
      </LinearGradient>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  background: { flex: 1 },
  scrollContent: {
    flexGrow: 1,
    padding: 16,
  },
  
  // Navbar Styles
  navbar: {
    backgroundColor: Colors.white, 
    borderBottomWidth: 1, 
    borderBottomColor: '#e0e0e0', 
    paddingHorizontal: 16,
    paddingTop: 50,
    paddingBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  navbarContent: {
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center',
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  navbarTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'white',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 10,
  },
  viewHistoryBtn: {
    borderRadius: 8,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  btnGradient: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    alignItems: 'center',
  },
  btnText: {
    color: Colors.accent,
    fontWeight: '600',
    fontSize: 14,
  },
  
  // User Info
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    padding: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
  },
  userAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: Colors.secondary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 18,
  },
  userName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.accent,
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    color: Colors.accent,
    opacity: 0.8,
  },
  
  dashboardTitle: {
    fontSize: 28,
    marginBottom: 25,
    color: Colors.accent,
    textAlign: 'center',
    fontWeight: 'bold'
  },
  
  // Form Styles
  requestForm: {
    borderRadius: 20,
    overflow: 'hidden',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 10,
  },
  cardGradient: {
    padding: 25,
  },
  header: {
    alignItems: 'center',
    marginBottom: 25,
  },
  formTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2a5298',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  formSection: {
    marginBottom: 20,
  },
  label: {
    marginBottom: 8,
    fontWeight: '600',
    fontSize: 16,
    color: '#2c3e50'
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 10,
  },
  spacing: {
    height: 8,
  },
  spacingLarge: {
    height: 20,
  },
  crdinputWrapper:{ flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    paddingHorizontal: 15,
    borderWidth: 1,
    borderColor: '#ddd',
    height: 90,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,},
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    paddingHorizontal: 15,
    borderWidth: 1,
    borderColor: '#ddd',
    height: 50,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  inputIcon: {
    marginRight: 10,
  },
  dropdown: {
    flex: 1,
    color: '#000',
  },
  placeholderStyle: {
    fontSize: 16,
    color: '#666',
  },
  selectedTextStyle: {
    fontSize: 16,
    color: '#000',
  },
  inputSearchStyle: {
    height: 40,
    fontSize: 16,
  },
  radioGroup: {
    flexDirection: 'row',
    gap: 12,
  },
  radioOption: {
    flex: 1,
    padding: 12,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    backgroundColor: '#f8fafc',
    alignItems: 'center',
  },
  radioSelected: {
    backgroundColor: '#e0f2f1',
    borderColor: '#4ecdc4',
  },
  radioText: {
    textAlign: 'center',
    color: '#666',
    fontWeight: '500',
  },
  radioTextSelected: {
    color: '#2c3e50',
    fontWeight: '600'
  },
  priorityGroup: {
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'space-between',
  },
  priorityOption: {
    flex: 1,
    padding: 12,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    backgroundColor: '#f8fafc',
    alignItems: 'center',
  },
  priorityHighSelected: {
    backgroundColor: '#ff6b6b',
    borderColor: '#ff6b6b'
  },
  priorityNormalSelected: {
    backgroundColor: '#4ecdc4',
    borderColor: '#4ecdc4'
  },
  priorityLowSelected: {
    backgroundColor: '#ffd166',
    borderColor: '#ffd166'
  },
  priorityText: {
    textAlign: 'center',
    fontWeight: '500',
    color: '#666',
  },
  priorityTextSelected: {
    color: 'white',
    fontWeight: '600'
  },
  divider: {
    height: 1,
    backgroundColor: '#e0e0e0',
    marginVertical: 5,
  },
  textarea: {
    flex: 1,
    color: '#333',
    fontSize: 16,
    paddingVertical: 12,
    textAlignVertical: 'top',
    minHeight: 100,
  },
  submitBtn: {
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 5,
  },
  submitBtnGradient: {
    padding: 16,
    alignItems: 'center',
  },
  submitBtnText: {
    color: Colors.accent,
    fontSize: 18,
    fontWeight: '600'
  },
  
  // Requests History
  requestsHistory: {
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 10,
  },
  historyTitle: {
    fontSize: 20,
    marginBottom: 20,
    color: '#2c3e50',
    fontWeight: 'bold',
    textAlign: 'center',
  },
  requestCard: {
    borderLeftWidth: 4,
    borderLeftColor: '#4ecdc4',
    padding: 16,
    marginBottom: 12,
    backgroundColor: '#f8fafc',
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  serviceName: {
    fontWeight: '600',
    color: '#2c3e50',
    fontSize: 16,
    marginBottom: 4,
  },
  projectName: {
    fontWeight: '500',
    color: '#555',
    fontSize: 14,
    marginBottom: 4,
  },
  requestDate: {
    fontSize: 12,
    color: '#7b8788',
    marginBottom: 8,
  },
  requestContent: {
    lineHeight: 20,
    color: '#555',
    marginBottom: 8,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    fontSize: 12,
    fontWeight: '600',
    alignSelf: 'flex-start',
  },
  statusPending: {
    backgroundColor: '#ffe66d',
    color: '#2c3e50'
  },
  statusInprogress: {
    backgroundColor: '#4ecdc4',
    color: 'white'
  },
  statusCompleted: {
    backgroundColor: '#34d399',
    color: 'white'
  },
  notification: {
    padding: 15,
    borderRadius: 8,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
  },
  error: {
    backgroundColor: '#ff6b6b'
  },
  success: {
    backgroundColor: '#34d399'
  },
  noRequests: {
    textAlign: 'center',
    color: '#7b8788',
    fontSize: 16,
    padding: 20,
  },
  loader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.dark,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: Colors.accent,
  },
});

export default UserDashboard;
import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  TextInput, ActivityIndicator, StatusBar, Alert,
  RefreshControl, Dimensions, Animated, PanResponder
} from 'react-native';
import { useAuth } from '../hooks/redux';
import { useNavigation } from '@react-navigation/native';
import { Dropdown } from 'react-native-element-dropdown';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/FontAwesome';
import { Colors } from '../styles/theme';
import * as Animatable from 'react-native-animatable';

const { width, height } = Dimensions.get('window');

const UserDashboard = () => {
  const { user, userApi, logout } = useAuth();
  const navigation = useNavigation();
  
  const [drawerOpen, setDrawerOpen] = useState(false);
  const slideAnim = useRef(new Animated.Value(-width)).current;
  const overlayAnim = useRef(new Animated.Value(0)).current;

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
  const [refreshing, setRefreshing] = useState(false);
  const [notification, setNotification] = useState({ message: '', type: '' });
  const intervalRef = useRef(null);

  // New states for subquery
  const [subQueries, setSubQueries] = useState([]);
  const [selectedSubQuery, setSelectedSubQuery] = useState('');
  const [source, setSource] = useState('web');
  const [loadingSubQueries, setLoadingSubQueries] = useState(false);

  // PanResponder for swipe gestures
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => drawerOpen,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return drawerOpen && Math.abs(gestureState.dx) > 10;
      },
      onPanResponderMove: (_, gestureState) => {
        if (gestureState.dx < 0) {
          slideAnim.setValue(gestureState.dx);
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dx < -100) {
          closeDrawer();
        } else {
          openDrawer();
        }
      },
    })
  ).current;

  useEffect(() => {
    fetchDashboardData();
    intervalRef.current = setInterval(fetchDashboardData, 620000);
    return () => clearInterval(intervalRef.current);
  }, []);

  useEffect(() => setSelectedProject(''), [targetType]);

  // Fetch subqueries when service is selected
  useEffect(() => {
    if (selectedService) {
      fetchSubQueries(selectedService);
    } else {
      setSubQueries([]);
      setSelectedSubQuery('');
    }
  }, [selectedService]);

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
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchDashboardData();
  };

  const fetchSubQueries = async (queryId) => {
    setLoadingSubQueries(true);
    try {
      console.log('Fetching subqueries for query:', queryId);
      const res = await userApi.getSubQueries(queryId);
      console.log('Subqueries API response:', res.data);
      
      if (res.data.success) {
        const subQueriesData = res.data.sub_queries || [];
        console.log('Subqueries data received:', subQueriesData);
        setSubQueries(subQueriesData);
        
        if (subQueriesData.length === 0) {
          console.log('No subqueries found for this service');
        }
      } else {
        console.log('Subqueries API returned success: false');
        setSubQueries([]);
      }
    } catch (err) {
      console.error('Failed to fetch subqueries:', err);
      console.error('Error details:', err.response?.data);
      showNotification('Failed to load subqueries', 'error');
      setSubQueries([]);
    } finally {
      setLoadingSubQueries(false);
    }
  };

  const showNotification = (message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification({ message: '', type: '' }), 4000);
  };

  const handleSubmit = async () => {
    if (!selectedService || !selectedProject || !requestDetails.trim()) {
      showNotification('Please fill all required fields', 'error');
      return;
    }

    try {
      const payload = {
        query_id: selectedService,
        project_id: selectedProject,
        priority,
        request_details: requestDetails,
        sub_query: selectedSubQuery,
        source: source,
      };
      
      console.log('Submitting payload:', payload);
      
      const res = await userApi.submitChangeRequest(payload);

      if (!res.data.success) {
        const messages = res.data.errors ? Object.values(res.data.errors).flat().join('\n') : res.data.message;
        showNotification(messages || 'Request failed', 'error');
      } else {
        showNotification(res.data.message || 'Request submitted successfully', 'success');
        setSelectedService('');
        setSelectedSubQuery('');
        setSelectedProject('');
        setRequestDetails('');
        setSource('web');
        fetchDashboardData();
      }
    } catch (err) {
      console.error('Submit error:', err);
      showNotification(err.response?.data?.message || 'Error submitting request', 'error');
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
              const result = await logout();
              if (result.success) {
                navigation.navigate('Login');
              } else {
                showNotification(result.message, 'error');
              }
            } catch (error) {
              Alert.alert('Error', 'Failed to logout');
            }
          }
        }
      ]
    );
  };

  const openDrawer = () => {
    setDrawerOpen(true);
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(overlayAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const closeDrawer = () => {
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: -width,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(overlayAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setDrawerOpen(false);
    });
  };

  const navigationView = () => (
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
          <Text style={styles.drawerUserRole}>User</Text>
        </View>
      </LinearGradient>

      <View style={styles.drawerMenu}>
        <TouchableOpacity 
          style={styles.drawerItem}
          onPress={() => {
            closeDrawer();
          }}
        >
          <Icon name="home" size={20} color="#2C3E50" />
          <Text style={styles.drawerItemText}>Dashboard</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.drawerItem}
          onPress={() => {
            closeDrawer();
            navigation.navigate('UserHistory');
          }}
        >
          <Icon name="history" size={20} color="#2C3E50" />
          <Text style={styles.drawerItemText}>View History</Text>
        </TouchableOpacity>

        <View style={styles.drawerDivider} />

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

  if (loading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color="#2C3E50" />
        <Text style={styles.loadingText}>Loading dashboard...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar backgroundColor="#2C3E50" barStyle="light-content" />
      
      {/* Overlay */}
      {drawerOpen && (
        <Animated.View 
          style={[
            styles.overlay,
            {
              opacity: overlayAnim,
            }
          ]}
        >
          <TouchableOpacity 
            style={styles.overlayTouchable}
            onPress={closeDrawer}
            activeOpacity={1}
          />
        </Animated.View>
      )}
      
      {/* Drawer */}
      <Animated.View 
        style={[
          styles.drawer,
          {
            transform: [{ translateX: slideAnim }],
          }
        ]}
      >
        {navigationView()}
      </Animated.View>

      {/* Main Content */}
      <Animated.View 
        style={[
          styles.mainContent,
          {
            transform: [
              {
                translateX: drawerOpen ? 
                  slideAnim.interpolate({
                    inputRange: [-width, 0],
                    outputRange: [0, width * 0.7],
                    extrapolate: 'clamp',
                  }) : 0
              }
            ]
          }
        ]}
        {...panResponder.panHandlers}
      >
        {/* Top Navbar */}
        <View style={styles.navbar}>
          <TouchableOpacity 
            style={styles.menuButton}
            onPress={openDrawer}
          >
            <Icon name="bars" size={24} color="#fff" />
          </TouchableOpacity>
          
          <View style={styles.navbarCenter}>
            <Text style={styles.navbarTitle}>User Dashboard</Text>
          </View>
          
          <View style={styles.navbarRight}>
            <TouchableOpacity style={styles.navbarIcon}>
              <Icon name="user" size={20} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView 
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Header - Matching Admin Dashboard */}
          <LinearGradient
            colors={['#2C3E50', '#4ECDC4']}
            style={styles.header}
          >
            <View style={styles.headerContent}>
              <View style={styles.headerText}>
                <Text style={styles.welcomeText}>
                  Welcome, {user?.name || 'User'}
                </Text>
                <Text style={styles.roleText}>User Dashboard</Text>
              </View>
             
            </View>
          </LinearGradient>

          {/* Main Content */}
          {notification.message && (
            <Animatable.View 
              animation="fadeInDown"
              style={[
                styles.notification, 
                notification.type === 'error' ? styles.error : styles.success
              ]}
            >
              <Text style={styles.notificationText}>{notification.message}</Text>
            </Animatable.View>
          )}

          {/* Dashboard Title */}
          <Animatable.View animation="fadeInDown" duration={800} style={styles.titleSection}>
            <Text style={styles.dashboardTitle}>Project Enhancement Portal</Text>
            <Text style={styles.dashboardSubtitle}>Submit Change Request</Text>
            <Text style={styles.dashboardDescription}>Streamline and manage your requests with ease</Text>
          </Animatable.View>

          {/* Request Form */}
          <Animatable.View animation="fadeInUp" duration={800} delay={200} style={styles.requestForm}>
            <LinearGradient colors={['#ffffff', '#f8f9fa', '#ffffff']} style={styles.cardGradient}>
              
              {/* Project Type Selection */}
              <View style={styles.formSection}>
                <Text style={styles.label}>Select Project Type</Text>
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
                        {type === 'web' ? 'Web' : 'App'}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Project Dropdown */}
              <View style={styles.formSection}>
                <Text style={styles.label}>Select Project</Text>
                <View style={styles.inputWrapper}>
                  <Icon name="folder" size={20} color="#4ECDC4" style={styles.inputIcon} />
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
                    placeholder="Select Project"
                    searchPlaceholder="Search..."
                    value={selectedProject}
                    onChange={item => setSelectedProject(item.value)}
                  />
                </View>
              </View>

              {/* Service Dropdown */}
              <View style={styles.formSection}>
                <Text style={styles.label}>Change Request For</Text>
                <View style={styles.inputWrapper}>
                  <Icon name="cogs" size={20} color="#4ECDC4" style={styles.inputIcon} />
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
                    placeholder="Select a request"
                    searchPlaceholder="Search..."
                    value={selectedService}
                    onChange={item => setSelectedService(item.value)}
                  />
                </View>
              </View>

              {/* SubQuery Dropdown */}
              <View style={styles.formSection}>
                <Text style={styles.label}>Select Sub Query</Text>
                <View style={styles.inputWrapper}>
                  <Icon name="list-alt" size={20} color="#4ECDC4" style={styles.inputIcon} />
                  <Dropdown
                    style={[styles.dropdown, !selectedService && styles.dropdownDisabled]}
                    placeholderStyle={styles.placeholderStyle}
                    selectedTextStyle={styles.selectedTextStyle}
                    inputSearchStyle={styles.inputSearchStyle}
                    data={subQueries.map(sq => ({ label: sq.name, value: sq.id }))}
                    search
                    maxHeight={200}
                    labelField="label"
                    valueField="value"
                    placeholder={
                      loadingSubQueries 
                        ? "Loading subqueries..." 
                        : !selectedService 
                        ? "Select a request first" 
                        : subQueries.length === 0 
                        ? "No subqueries available" 
                        : "Select Sub Query"
                    }
                    searchPlaceholder="Search..."
                    value={selectedSubQuery}
                    onChange={item => setSelectedSubQuery(item.value)}
                    disabled={!selectedService || loadingSubQueries}
                  />
                  {loadingSubQueries && (
                    <ActivityIndicator size="small" color="#4ECDC4" style={styles.loadingIndicator} />
                  )}
                </View>
              </View>

              {/* Priority Level */}
              <View style={styles.formSection}>
                <Text style={styles.label}>Priority Level</Text>
                <View style={styles.priorityGroup}>
                  {[
                    { key: 'high', label: 'High' },
                    { key: 'normal', label: 'Normal' }, 
                    { key: 'low', label: 'Anytime' }
                  ].map((lvl) => (
                    <TouchableOpacity
                      key={lvl.key}
                      style={[
                        styles.priorityOption,
                        priority === lvl.key &&
                          (lvl.key === 'high'
                            ? styles.priorityHighSelected
                            : lvl.key === 'normal'
                            ? styles.priorityNormalSelected
                            : styles.priorityLowSelected),
                      ]}
                      onPress={() => setPriority(lvl.key)}
                    >
                      <Text
                        style={[
                          styles.priorityText,
                          priority === lvl.key && styles.priorityTextSelected,
                        ]}
                      >
                        {lvl.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Change Request Details */}
              <View style={styles.formSection}>
                <Text style={styles.label}>Change Request Details</Text>
                <View style={styles.textareaWrapper}>
                  <Icon name="edit" size={20} color="#4ECDC4" style={styles.textareaIcon} />
                  <TextInput
                    style={styles.textarea}
                    multiline
                    placeholder="Please describe the changes you need in detail..."
                    value={requestDetails}
                    placeholderTextColor="#999"
                    onChangeText={setRequestDetails}
                    textAlignVertical="top"
                  />
                </View>
              </View>

              {/* Submit Button */}
              <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit}>
                <LinearGradient colors={['#2C3E50', '#4ECDC4']} style={styles.submitBtnGradient}>
                  <Text style={styles.submitBtnText}>Submit Request</Text>
                </LinearGradient>
              </TouchableOpacity>
            </LinearGradient>
          </Animatable.View>

          {/* Recent Requests */}
          <Animatable.View animation="fadeInUp" duration={800} delay={400} style={styles.requestsHistory}>
            <LinearGradient colors={['#ffffff', '#f8f9fa', '#ffffff']} style={styles.cardGradient}>
              <Text style={styles.historyTitle}>Recent Requests</Text>
              {recentRequests.length === 0 ? (
                <Text style={styles.noRequests}>No active requests found.</Text>
              ) : (
                recentRequests.map((req, index) => (
                  <Animatable.View 
                    key={req.id} 
                    animation="fadeInRight" 
                    duration={600}
                    delay={index * 100}
                    style={styles.requestCard}
                  >
                    <View style={styles.requestHeader}>
                      <Text style={styles.serviceName}>{req.service?.name || 'No Service'}</Text>
                      <Text style={[
                        styles.statusBadge,
                        req.status === 'pending' ? styles.statusPending :
                        req.status === 'inprogress' ? styles.statusInprogress : styles.statusCompleted
                      ]}>
                        {req.status?.charAt(0).toUpperCase() + req.status?.slice(1)}
                      </Text>
                    </View>
                    <Text style={styles.projectName}>Source: {req.project?.type === 'app' ? 'App' : 'Web'} - {req.project?.name || 'N/A'}</Text>
                    <Text style={styles.requestDate}>{new Date(req.created_at).toLocaleDateString()}</Text>
                    <Text style={styles.requestContent}>{req.request_details || 'No details'}</Text>
                  </Animatable.View>
                ))
              )}
            </LinearGradient>
          </Animatable.View>
        </ScrollView>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { 
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  // Overlay styles
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    zIndex: 999,
  },
  overlayTouchable: {
    flex: 1,
  },
  // Drawer styles
  drawer: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    width: width * 0.8,
    zIndex: 1000,
    elevation: 1000,
  },
  mainContent: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    zIndex: 1,
  },
  scrollContent: {
    padding: 0,
    paddingTop: 1,
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
    shadowColor: '#000000ff',
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
  
  // Drawer Styles
  drawerContainer: {
    flex: 1,
    backgroundColor: '#fff',
    width: '100%',
    height: '100%',
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
  
  // Header - Matching Admin Dashboard
  header: {
    paddingHorizontal: 20,
    paddingTop: 25,
    paddingBottom: 30,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    marginBottom: 9,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerText: {
    flex: 1,
  },
  welcomeText: {
    fontSize: 23,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 5,
  },
  roleText: {
    fontSize: 16,
    color: '#fff',
    opacity: 0.9,
  },
  // View History Button
  viewHistoryBtn: {
    borderRadius: 10,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  viewHistoryBtnGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
  },
  viewHistoryIcon: {
    marginRight: 6,
  },
  viewHistoryText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  
  // Title Section
  titleSection: {
    marginBottom: 25,
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  dashboardTitle: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#2C3E50',
    textAlign: 'center',
    marginBottom: 8,
  },
  dashboardSubtitle: {
    fontSize: 20,
    color: '#2C3E50',
    textAlign: 'center',
    marginBottom: 4,
    opacity: 0.9,
  },
  dashboardDescription: {
    fontSize: 14,
    color: '#2C3E50',
    textAlign: 'center',
    opacity: 0.8,
  },
  
  // Form Styles
  requestForm: {
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 25,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
    marginHorizontal: 20,
  },
  cardGradient: {
    padding: 20,
  },
  formSection: {
    marginBottom: 20,
  },
  label: {
    marginBottom: 10,
    fontWeight: '600',
    fontSize: 16,
    color: '#2C3E50'
  },
  
  // Input Wrappers
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    paddingHorizontal: 15,
    borderWidth: 1,
    borderColor: '#e1e5e9',
    height: 50,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  textareaWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#e1e5e9',
    minHeight: 120,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  inputIcon: {
    marginRight: 12,
    width: 20,
  },
  textareaIcon: {
    marginRight: 12,
    marginTop: 4,
    width: 20,
  },
  dropdown: {
    flex: 1,
  },
  dropdownDisabled: {
    opacity: 0.5,
  },
  placeholderStyle: {
    fontSize: 16,
    color: '#999',
  },
  selectedTextStyle: {
    fontSize: 16,
    color: '#2C3E50',
    fontWeight: '500',
  },
  inputSearchStyle: {
    height: 40,
    fontSize: 16,
  },
  loadingIndicator: {
    position: 'absolute',
    right: 15,
  },
  
  // Radio Group
  radioGroup: {
    flexDirection: 'row',
    gap: 12,
  },
  radioOption: {
    flex: 1,
    padding: 14,
    borderWidth: 1,
    borderColor: '#e1e5e9',
    borderRadius: 10,
    backgroundColor: '#f8fafc',
    alignItems: 'center',
  },
  radioSelected: {
    backgroundColor: '#e0f2f1',
    borderColor: '#4ECDC4',
  },
  radioText: {
    textAlign: 'center',
    color: '#666',
    fontWeight: '500',
    fontSize: 14,
  },
  radioTextSelected: {
    color: '#2C3E50',
    fontWeight: '600'
  },
  
  // Priority Group
  priorityGroup: {
    flexDirection: 'row',
    gap: 10,
    justifyContent: 'space-between',
  },
  priorityOption: {
    flex: 1,
    padding: 14,
    borderWidth: 1,
    borderColor: '#e1e5e9',
    borderRadius: 10,
    backgroundColor: '#f8fafc',
    alignItems: 'center',
  },
  priorityHighSelected: {
    backgroundColor: '#ff6b6b',
    borderColor: '#ff6b6b'
  },
  priorityNormalSelected: {
    backgroundColor: '#4ECDC4',
    borderColor: '#4ECDC4'
  },
  priorityLowSelected: {
    backgroundColor: '#ffd166',
    borderColor: '#ffd166'
  },
  priorityText: {
    textAlign: 'center',
    fontWeight: '500',
    color: '#666',
    fontSize: 14,
  },
  priorityTextSelected: {
    color: 'white',
    fontWeight: '600'
  },
  
  // Textarea
  textarea: {
    flex: 1,
    color: '#2C3E50',
    fontSize: 16,
    lineHeight: 22,
    textAlignVertical: 'top',
    minHeight: 80,
  },
  
  // Submit Button
  submitBtn: {
    borderRadius: 12,
    overflow: 'hidden',
    marginTop: 10,
    shadowColor: '#2C3E50',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  submitBtnGradient: {
    padding: 16,
    alignItems: 'center',
  },
  submitBtnText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600'
  },
  
  // Requests History
  requestsHistory: {
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
    marginHorizontal: 20,
  },
  historyTitle: {
    fontSize: 20,
    marginBottom: 20,
    color: '#2C3E50',
    fontWeight: 'bold',
    textAlign: 'center',
  },
  requestCard: {
    borderLeftWidth: 4,
    borderLeftColor: '#4ECDC4',
    padding: 16,
    marginBottom: 12,
    backgroundColor: '#f8fafc',
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  requestHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 6,
  },
  serviceName: {
    fontWeight: '600',
    color: '#2C3E50',
    fontSize: 16,
    flex: 1,
    marginRight: 10,
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
    fontSize: 14,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    fontSize: 12,
    fontWeight: '600',
    overflow: 'hidden',
  },
  statusPending: {
    backgroundColor: '#ffe66d',
    color: '#2C3E50'
  },
  statusInprogress: {
    backgroundColor: '#4ECDC4',
    color: 'white'
  },
  statusCompleted: {
    backgroundColor: '#34d399',
    color: 'white'
  },
  
  // Notification
  notification: {
    padding: 16,
    borderRadius: 10,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 5,
    marginHorizontal: 20,
  },
  notificationText: {
    color: 'white',
    fontWeight: '500',
    textAlign: 'center',
  },
  error: {
    backgroundColor: '#ff6b6b'
  },
  success: {
    backgroundColor: '#34d399'
  },
  
  // Empty State
  noRequests: {
    textAlign: 'center',
    color: '#7b8788',
    fontSize: 16,
    padding: 30,
    fontStyle: 'italic',
  },
  
  // Loader
  loader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#2C3E50',
  },
});

export default UserDashboard;
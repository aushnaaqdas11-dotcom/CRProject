import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  TextInput, ActivityIndicator
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { useAuth } from '../context/AuthContext';
import { useNavigation } from '@react-navigation/native';
import { Dropdown } from 'react-native-element-dropdown';

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
      <ActivityIndicator size="large" color="#4e8cff" />
      <Text>Loading dashboard...</Text>
    </View>
  );

  return (
    <ScrollView style={styles.container}>
      {notification.message && (
        <View style={[styles.notification, notification.type === 'error' ? styles.error : styles.success]}>
          <Text style={{ color: 'white' }}>{notification.message}</Text>
        </View>
      )}

      <View style={styles.header}>
        <Text style={styles.logo}>SU<Text style={styles.logoSpan}>per</Text></Text>
        <View style={styles.userInfo}>
          <View style={styles.userAvatar}>
            <Text style={styles.avatarText}>{user?.name?.substring(0,2).toUpperCase() || 'SU'}</Text>
          </View>
          <View>
            <Text style={styles.userName}>{user?.name || 'Super User'}</Text>
            <Text style={styles.userEmail}>{user?.email || 'user@example.com'}</Text>
            <Text style={styles.userEmail}>Role: {user?.role || 'N/A'}</Text>
          </View>
        </View>
        <View style={styles.actionButtons}>
          <TouchableOpacity style={styles.viewHistoryBtn} onPress={() => navigation.navigate('UserHistory')}>
            <Text style={styles.btnText}>View All History</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.viewHistoryBtn} onPress={handleLogout}>
            <Text style={styles.btnText}>Logout</Text>
          </TouchableOpacity>
        </View>
      </View>

      <Text style={styles.dashboardTitle}>Project Enhancement Portal</Text>
      
      <View style={styles.requestForm}>
        <Text style={styles.formTitle}>Submit Change Request</Text>

        {/* Service Dropdown */}
        <View style={styles.formSection}>
          <Text style={styles.label}>Service Needed</Text>
          <View style={styles.spacing} />
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

        {/* Priority Level */}
        <View style={styles.formSection}>
          <Text style={styles.label}>Select Web Project Priority Level</Text>
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
          <TextInput
            style={styles.textarea}
            multiline
            placeholder="Describe the changes you need..."
            value={requestDetails}
            onChangeText={setRequestDetails}
          />
        </View>

        <View style={styles.spacingLarge} />
        <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit}>
          <Text style={styles.btnText}>Submit Request</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.requestsHistory}>
        <Text style={styles.historyTitle}>Recent Requests</Text>
        {recentRequests.length === 0 ? (
          <Text style={styles.noRequests}>No recent requests found.</Text>
        ) : (
          recentRequests.map(req => (
            <View key={req.id} style={styles.requestCard}>
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
            </View>
          ))
        )}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#e6fffa' },
  header: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    padding: 15, 
    flexWrap: 'wrap', 
    gap: 10 
  },
  logo: { fontSize: 22, fontWeight: '700', color: '#2c3e50' },
  logoSpan: { color: '#4ecdc4' },
  userInfo: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  userAvatar: { 
    width: 40, 
    height: 40, 
    borderRadius: 20, 
    backgroundColor: '#4ecdc4', 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  avatarText: { color: 'white', fontWeight: 'bold', fontSize: 16 },
  userName: { fontSize: 14 },
  userEmail: { fontSize: 12, color: '#7b8788' },
  actionButtons: { flexDirection: 'row', gap: 10, flexWrap: 'wrap' },
  viewHistoryBtn: { 
    backgroundColor: '#34d399', 
    padding: 10, 
    borderRadius: 6, 
    alignItems: 'center' 
  },
  btnText: { color: 'white', fontWeight: '600' },
  dashboardTitle: { 
    fontSize: 26, 
    margin: 20, 
    color: '#2c3e50', 
    textAlign: 'center',
    fontWeight: 'bold'
  },
  requestForm: { 
    backgroundColor: 'white', 
    borderRadius: 10, 
    padding: 25, 
    margin: 15,
    shadowColor: '#000', 
    shadowOpacity: 0.08, 
    shadowRadius: 25, 
    elevation: 5 
  },
  formTitle: { 
    fontSize: 20, 
    marginBottom: 25, 
    color: '#2c3e50',
    fontWeight: 'bold',
    textAlign: 'center'
  },
  formSection: {
    marginBottom: 25, // Increased spacing between sections
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
    height: 8, // Space between label and dropdown
  },
  spacingLarge: {
    height: 20, // Larger space before submit button
  },
  dropdown: {
    height: 50,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    backgroundColor: '#fff',
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
    gap: 15,
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
    gap: 12,
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
    height: 120, 
    borderWidth: 1, 
    borderColor: '#ddd', 
    borderRadius: 8, 
    padding: 12, 
    textAlignVertical: 'top', 
    backgroundColor: '#f8fafc',
    fontSize: 16,
    lineHeight: 20,
  },
  submitBtn: { 
    backgroundColor: '#2c3e50', 
    padding: 15, 
    borderRadius: 8, 
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  requestsHistory: { 
    backgroundColor: 'white', 
    borderRadius: 10, 
    padding: 25, 
    margin: 15,
    shadowColor: '#000', 
    shadowOpacity: 0.08, 
    shadowRadius: 25, 
    elevation: 5 
  },
  historyTitle: { 
    fontSize: 20, 
    marginBottom: 20, 
    color: '#2c3e50',
    fontWeight: 'bold'
  },
  requestCard: { 
    borderLeftWidth: 4, 
    borderLeftColor: '#4ecdc4', 
    padding: 16, 
    marginBottom: 16, 
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
    position: 'absolute', 
    top: 10, 
    right: 10, 
    zIndex: 1000,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
  },
  error: { backgroundColor: '#ff6b6b' },
  success: { backgroundColor: '#34d399' },
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
    backgroundColor: '#e6fffa',
  },
});

export default UserDashboard;
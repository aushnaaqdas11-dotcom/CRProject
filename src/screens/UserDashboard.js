import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Dimensions, TextInput } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import apiService from '../services/apiService';
import { useAuth } from '../context/AuthContext';
import { useNavigation } from '@react-navigation/native';

class ErrorBoundary extends React.Component {
  state = { hasError: false };

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return <Text>Something went wrong. Please restart the app.</Text>;
    }
    return this.props.children;
  }
}

const { width } = Dimensions.get('window');
const isWide = width > 600;

const UserDashboard = () => {
  const { token, user, logout } = useAuth();
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
  const [notification, setNotification] = useState({ message: '', type: '' });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const headers = { Authorization: `Bearer ${token}` };
      const [servicesRes, webRes, appRes, recentRes] = await Promise.all([
        apiService.get('/services', { headers }),
        apiService.get('/projects/web', { headers }),
        apiService.get('/projects/app', { headers }),
        apiService.get('/user/requests/recent', { headers }),
      ]);
      if (servicesRes.data.success) setServices(servicesRes.data.services || []);
      if (webRes.data.success) setWebProjects(webRes.data.projects || []);
      if (appRes.data.success) setAppProjects(appRes.data.projects || []);
      if (recentRes.data.success) setRecentRequests(recentRes.data.requests || []);
      console.log('Services:', servicesRes.data.services);
      console.log('Web Projects:', webRes.data.projects);
      console.log('App Projects:', appRes.data.projects);
      console.log('Recent Requests:', recentRes.data.requests);
    } catch (error) {
      console.error('Fetch error:', error.response ? error.response.data : error.message);
      setNotification({ message: 'Failed to load data', type: 'error' });
      setTimeout(() => setNotification({ message: '', type: '' }), 5000);
    }
  };

  const handleSubmit = async () => {
    if (!selectedService || !selectedProject || !requestDetails) {
      setNotification({ message: 'Please fill all fields', type: 'error' });
      setTimeout(() => setNotification({ message: '', type: '' }), 5000);
      return;
    }

    try {
      const headers = { Authorization: `Bearer ${token}` };
      const data = {
        query_id: selectedService,
        project_id: selectedProject,
        priority,
        request_details: requestDetails,
      };
      const response = await apiService.post('/change-request', data, { headers });
      if (response.data.success) {
        setNotification({ message: 'Request submitted', type: 'success' });
        setTimeout(() => setNotification({ message: '', type: '' }), 5000);
        setRequestDetails('');
        fetchData();
      }
    } catch (error) {
      console.error('Submit error:', error.response ? error.response.data : error.message);
      setNotification({ message: 'Failed to submit', type: 'error' });
      setTimeout(() => setNotification({ message: '', type: '' }), 5000);
    }
  };

  const handleLogout = async () => {
    try {
      const headers = { Authorization: `Bearer ${token}` };
      await apiService.post('/logout', {}, { headers });
      logout();
      navigation.navigate('Login');
    } catch (error) {
      console.error('Logout error:', error.response ? error.response.data : error.message);
      setNotification({ message: 'Logout failed', type: 'error' });
      setTimeout(() => setNotification({ message: '', type: '' }), 5000);
    }
  };

  return (
    <ErrorBoundary>
      <ScrollView style={styles.container}>
        {notification.message && (
          <View style={[styles.notification, notification.type === 'error' ? styles.error : styles.success]}>
            <Text>{notification.message}</Text>
          </View>
        )}
        <View style={styles.header}>
          <Text style={styles.logo}>
            SU<Text style={styles.logoSpan}>per</Text>
          </Text>
          <View style={styles.userInfo}>
            <View style={styles.userAvatar}>
              <Text style={styles.avatarText}>{user?.name ? user.name.substring(0, 2).toUpperCase() : 'SU'}</Text>
            </View>
            <View>
              <Text style={styles.userName}>{user?.name || 'Super Admin'}</Text>
              <Text style={styles.userEmail}>{user?.email || 'user@example.com'}</Text>
            </View>
          </View>
          <View style={styles.actionButtons}>
            <TouchableOpacity style={styles.viewHistoryBtn} onPress={() => navigation.navigate('UserHistory')}>
              <Text style={styles.btnText}>View All History</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
              <Text style={styles.btnText}>Logout</Text>
            </TouchableOpacity>
          </View>
        </View>

        <Text style={styles.dashboardTitle}>Project Enhancement Portal</Text>

        <View style={[styles.dashboardGrid, isWide && { flexDirection: 'row' }]}>
          <View style={styles.requestForm}>
            <Text style={styles.formTitle}>Submit Change Request</Text>
            <View style={styles.formGroup}>
              <Text style={styles.label}>Services Count: {services.length}</Text>
              <Text style={styles.label}>Web Projects Count: {webProjects.length}</Text>
              <Text style={styles.label}>App Projects Count: {appProjects.length}</Text>
            </View>
            <View style={styles.formGroup}>
              <Text style={styles.label}>Service Needed</Text>
              <Picker
                selectedValue={selectedService}
                onValueChange={(value) => setSelectedService(value)}
                style={styles.select}
              >
                <Picker.Item label="Select a service" value="" />
                {services.map((s) => (
                  <Picker.Item key={s.id} label={s.name} value={s.id} />
                ))}
              </Picker>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Select Project Type</Text>
              <View style={styles.radioGroup}>
                <TouchableOpacity
                  style={[styles.radioOption, targetType === 'web' && styles.radioSelected]}
                  onPress={() => setTargetType('web')}
                >
                  <Text style={[styles.radioText, targetType === 'web' && styles.radioTextSelected]}>Web</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.radioOption, targetType === 'app' && styles.radioSelected]}
                  onPress={() => setTargetType('app')}
                >
                  <Text style={[styles.radioText, targetType === 'app' && styles.radioTextSelected]}>App</Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>{targetType === 'web' ? 'Select Web Project' : 'Select App Project'}</Text>
              <Picker
                selectedValue={selectedProject}
                onValueChange={(value) => setSelectedProject(value)}
                style={styles.select}
                enabled={!!targetType}
              >
                <Picker.Item label={`Select ${targetType === 'web' ? 'Web Project' : 'App Project'}`} value="" />
                {(targetType === 'web' ? webProjects : appProjects).map((p) => (
                  <Picker.Item key={p.id} label={p.name} value={p.id} />
                ))}
              </Picker>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Priority Level</Text>
              <View style={styles.priorityGroup}>
                <TouchableOpacity
                  style={[styles.priorityOption, priority === 'high' && styles.priorityHighSelected]}
                  onPress={() => setPriority('high')}
                >
                  <Text style={[styles.priorityText, priority === 'high' && styles.priorityTextSelected]}>High</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.priorityOption, priority === 'normal' && styles.priorityNormalSelected]}
                  onPress={() => setPriority('normal')}
                >
                  <Text style={[styles.priorityText, priority === 'normal' && styles.priorityTextSelected]}>Normal</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.priorityOption, priority === 'low' && styles.priorityLowSelected]}
                  onPress={() => setPriority('low')}
                >
                  <Text style={[styles.priorityText, priority === 'low' && styles.priorityTextSelected]}>Anytime</Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Change Request Details</Text>
              <TextInput
                style={styles.textarea}
                multiline
                placeholder="Please describe the changes you need in detail..."
                value={requestDetails}
                onChangeText={setRequestDetails}
              />
            </View>

            <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit}>
              <Text style={styles.btnText}>Submit Request</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.requestsHistory}>
            <Text style={styles.historyTitle}>Recent Requests</Text>
            {recentRequests.length === 0 ? (
              <Text style={styles.noRequests}>No active requests found.</Text>
            ) : (
              recentRequests.map((req) => (
                <View
                  key={req.id}
                  style={[
                    styles.requestCard,
                    req.priority === 'high' && styles.requestCardHigh,
                    req.priority === 'low' && styles.requestCardLow,
                  ]}
                >
                  <View style={styles.requestHeader}>
                    <Text style={styles.serviceName}>{req.related_query?.name || 'No Service'}</Text> {/* Updated to related_query */}
                    <Text
                      style={[
                        styles.priorityBadge,
                        req.priority === 'high' && styles.priorityBadgeHigh,
                        req.priority === 'normal' && styles.priorityBadgeNormal,
                        req.priority === 'low' && styles.priorityBadgeLow,
                      ]}
                    >
                      {req.priority.charAt(0).toUpperCase() + req.priority.slice(1)}
                    </Text>
                  </View>
                  <Text style={styles.projectName}>
                    Source: {req.project?.type === 'app' ? 'app' : 'web'} - {req.project?.name || 'N/A'}
                  </Text>
                  <Text style={styles.requestDate}>
                    Submitted on: {new Date(req.created_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                  </Text>
                  <Text style={styles.requestContent}>{req.request_details || 'No details'}</Text>
                  <Text
                    style={[
                      styles.statusBadge,
                      req.status === 'pending' && styles.statusPending,
                      req.status === 'inprogress' && styles.statusInprogress,
                      req.status === 'completed' && styles.statusCompleted,
                    ]}
                  >
                    {req.status.charAt(0).toUpperCase() + req.status.slice(1)}
                  </Text>
                </View>
              ))
            )}
          </View>
        </View>
      </ScrollView>
    </ErrorBoundary>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#e6fffa' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 15, flexWrap: 'wrap', gap: 10 },
  logo: { fontSize: 22, fontWeight: '700', color: '#2c3e50' },
  logoSpan: { color: '#4ecdc4' },
  userInfo: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  userAvatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#4ecdc4', justifyContent: 'center', alignItems: 'center' },
  avatarText: { color: 'white', fontWeight: 'bold', fontSize: 16 },
  userName: { fontSize: 14 },
  userEmail: { fontSize: 12, color: '#7b8788' },
  actionButtons: { flexDirection: 'row', gap: 10, flexWrap: 'wrap' },
  viewHistoryBtn: { backgroundColor: '#34d399', padding: 10, borderRadius: 6, alignItems: 'center' },
  logoutBtn: { backgroundColor: '#ff6b6b', padding: 10, borderRadius: 6, alignItems: 'center' },
  btnText: { color: 'white', fontWeight: '600' },
  dashboardTitle: { fontSize: 26, margin: 20, color: '#2c3e50', textAlign: 'center' },
  dashboardGrid: { flexDirection: 'column', padding: 10, gap: 20 },
  requestForm: { backgroundColor: 'white', borderRadius: 10, padding: 20, shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 25, elevation: 5 },
  formTitle: { fontSize: 18, marginBottom: 15, color: '#2c3e50' },
  formGroup: { marginBottom: 15 },
  label: { marginBottom: 6, fontWeight: '500' },
  select: { height: 50, borderWidth: 1, borderColor: '#ddd', borderRadius: 6, backgroundColor: '#f8fafc' },
  radioGroup: { flexDirection: 'row', gap: 10 },
  radioOption: { padding: 10, borderWidth: 1, borderColor: '#ddd', borderRadius: 6, backgroundColor: '#f8fafc' },
  radioSelected: { backgroundColor: '#e0f2f1', borderColor: '#4ecdc4' },
  radioText: { textAlign: 'center' },
  radioTextSelected: { color: '#2c3e50', fontWeight: '600' },
  priorityGroup: { flexDirection: 'row', gap: 10, flexWrap: 'wrap' },
  priorityOption: { flex: 1, minWidth: 80, padding: 10, borderWidth: 1, borderColor: '#ddd', borderRadius: 6, backgroundColor: '#f8fafc' },
  priorityHighSelected: { backgroundColor: '#ff6b6b', borderColor: '#ff6b6b' },
  priorityNormalSelected: { backgroundColor: '#4ecdc4', borderColor: '#4ecdc4' },
  priorityLowSelected: { backgroundColor: '#ffd166', borderColor: '#ffd166' },
  priorityText: { textAlign: 'center' },
  priorityTextSelected: { color: 'white', fontWeight: '600' },
  textarea: { height: 100, borderWidth: 1, borderColor: '#ddd', borderRadius: 6, padding: 10, textAlignVertical: 'top', backgroundColor: '#f8fafc' },
  submitBtn: { backgroundColor: '#2c3e50', padding: 12, borderRadius: 6, alignItems: 'center', marginTop: 8 },
  requestsHistory: { backgroundColor: 'white', borderRadius: 10, padding: 20, shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 25, elevation: 5 },
  historyTitle: { fontSize: 18, marginBottom: 15, color: '#2c3e50' },
  requestCard: { borderLeftWidth: 3, borderLeftColor: '#4ecdc4', padding: 12, marginBottom: 12, backgroundColor: '#f8fafc', borderRadius: 6 },
  requestCardHigh: { borderLeftColor: '#ff6b6b' },
  requestCardLow: { borderLeftColor: '#ffd166' },
  requestHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8, flexWrap: 'wrap', gap: 8 },
  serviceName: { fontWeight: '600', color: '#2c3e50' },
  projectName: { fontWeight: '500', color: '#555' },
  priorityBadge: { padding: 3, borderRadius: 15 },
  priorityBadgeHigh: { backgroundColor: '#ff6b6b', color: 'white' },
  priorityBadgeNormal: { backgroundColor: '#4ecdc4', color: 'white' },
  priorityBadgeLow: { backgroundColor: '#ffd166', color: '#2c3e50' },
  requestDate: { fontSize: 12, color: '#7b8788' },
  requestContent: { lineHeight: 20 },
  statusBadge: { padding: 3, borderRadius: 15 },
  statusPending: { backgroundColor: '#ffe66d', color: '#2c3e50' },
  statusInprogress: { backgroundColor: '#4ecdc4', color: 'white' },
  statusCompleted: { backgroundColor: '#34d399', color: 'white' },
  notification: { padding: 15, borderRadius: 6, position: 'absolute', top: 10, right: 10, zIndex: 1000 },
  error: { backgroundColor: '#ff6b6b', color: 'white' },
  success: { backgroundColor: '#34d399', color: 'white' },
  noRequests: { textAlign: 'center', color: '#7b8788' },
});

export default UserDashboard;
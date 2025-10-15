import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  TextInput, ActivityIndicator
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { useAuth } from '../context/AuthContext';
import { useNavigation } from '@react-navigation/native';

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

        <Text style={styles.label}>Service Needed</Text>
        <Picker selectedValue={selectedService} onValueChange={setSelectedService} style={styles.select}>
          <Picker.Item label="Select a service" value="" />
          {services.map(s => <Picker.Item key={s.id} label={s.name} value={s.id} />)}
        </Picker>

        <Text style={styles.label}>Select Project Type</Text>
        <View style={styles.radioGroup}>
          {['web','app'].map(type => (
            <TouchableOpacity
              key={type}
              style={[styles.radioOption, targetType===type && styles.radioSelected]}
              onPress={() => setTargetType(type)}
            >
              <Text style={[styles.radioText, targetType===type && styles.radioTextSelected]}>
                {type === 'web' ? 'Web' : 'App'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.label}>{targetType==='web' ? 'Select Web Project' : 'Select App Project'}</Text>
        <Picker selectedValue={selectedProject} onValueChange={setSelectedProject} style={styles.select}>
          <Picker.Item label={`Select ${targetType==='web'?'Web':'App'} Project`} value="" />
          {(targetType==='web'?webProjects:appProjects).map(p =>
            <Picker.Item key={p.id} label={p.name} value={p.id} />
          )}
        </Picker>

        <Text style={styles.label}>Priority Level</Text>
        <View style={styles.priorityGroup}>
          {['high','normal','low'].map(lvl => (
            <TouchableOpacity
              key={lvl}
              style={[styles.priorityOption, priority===lvl &&
                (lvl==='high'?styles.priorityHighSelected: lvl==='normal'?styles.priorityNormalSelected:styles.priorityLowSelected)]}
              onPress={()=>setPriority(lvl)}
            >
              <Text style={[styles.priorityText, priority===lvl && styles.priorityTextSelected]}>
                {lvl==='low'?'Anytime':lvl.charAt(0).toUpperCase()+lvl.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.label}>Change Request Details</Text>
        <TextInput
          style={styles.textarea}
          multiline
          placeholder="Describe the changes you need..."
          value={requestDetails}
          onChangeText={setRequestDetails}
        />

        <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit}>
          <Text style={styles.btnText}>Submit Request</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.requestsHistory}>
        <Text style={styles.historyTitle}>Recent Requests</Text>
        {recentRequests.length===0 ? <Text style={styles.noRequests}>No recent requests found.</Text> :
          recentRequests.map(req => (
            <View key={req.id} style={styles.requestCard}>
              <Text style={styles.serviceName}>{req.service?.name || 'No Service'}</Text>
              <Text style={styles.projectName}>Source: {req.project?.type==='app'?'App':'Web'} - {req.project?.name||'N/A'}</Text>
              <Text style={styles.requestDate}>{new Date(req.created_at).toLocaleDateString()}</Text>
              <Text style={styles.requestContent}>{req.request_details || 'No details'}</Text>
              <Text style={[styles.statusBadge,
                req.status==='pending'?styles.statusPending:
                req.status==='inprogress'?styles.statusInprogress:styles.statusCompleted]}>
                {req.status?.charAt(0).toUpperCase()+req.status?.slice(1)}
              </Text>
            </View>
          ))
        }
      </View>
    </ScrollView>
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
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Alert,
  ActivityIndicator,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  StatusBar,
  Dimensions,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/FontAwesome';
import { Picker } from '@react-native-picker/picker';
import { MultiSelect } from 'react-native-element-dropdown';
import api from '../../services/apiService';
import Footer from '../../components/Footer'; // Add this import


const { width } = Dimensions.get('window');

// ✅ Use the same color scheme as ProjectManagement
const statColors = {
  total: '#2C3E50',
  web: '#3B82F6',
  mobile: '#10B981',
  pending: '#F59E0B',
  inprogress: '#3B82F6',
  completed: '#10B981',
  accent: '#6a11cb',
};

// ✅ Define getRoleName function
const getRoleName = (roleId) => {
  const roleMap = {
    1: 'Admin',
    2: 'User', 
    3: 'Resolver',
    4: 'Assigner',
    5: 'ADG',
    6: 'Dept Head'
  };
  return roleMap[roleId] || `Role ${roleId}`;
};

const AssignProjectsToUsers = ({ navigation }) => {
  const [projects, setProjects] = useState([]);
  const [users, setUsers] = useState([]);
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [selectedUserIds, setSelectedUserIds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [searchText, setSearchText] = useState('');

  // Load initial data
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [projectsRes, usersRes] = await Promise.all([
        api.admin.getProjectsForUserAssignment(),
        api.admin.getUsersForAssignment(),
      ]);

      console.log('📊 Users API Response:', usersRes.data);
      
      setProjects(projectsRes.data?.data?.projects || []);
      setUsers(usersRes.data?.data?.users || []);
    } catch (error) {
      console.error('Load data error:', error);
      Alert.alert('Error', 'Failed to load data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Format users for MultiSelect
  const userOptions = users.map(user => {
    const roleName = getRoleName(user.role);
    const userName = user.name || 'No Name';
    const userEmail = user.email || 'No Email';
    
    return {
      label: `${userName} (${userEmail}) - ${roleName}`,
      value: user.id?.toString() || '',
    };
  });

  // When project changes, load already assigned users
  const onProjectChange = async (projectId) => {
    setSelectedProjectId(projectId);
    setSelectedUserIds([]);

    if (!projectId) return;

    try {
      const res = await api.admin.getAssignedUsersForProject(projectId);
      const assignedIds = res.data?.data?.assigned_users?.map(u => u.id.toString()) || [];
      setSelectedUserIds(assignedIds);
    } catch (error) {
      console.log('No assigned users yet or error:', error);
      setSelectedUserIds([]);
    }
  };

  // Submit assignment
  const handleAssign = async () => {
    if (!selectedProjectId) {
      Alert.alert('Required', 'Please select a project');
      return;
    }
    if (selectedUserIds.length === 0) {
      Alert.alert('Required', 'Please select at least one user');
      return;
    }

    setSubmitting(true);
    try {
      await api.admin.assignUsersToProject({
        project_id: parseInt(selectedProjectId),
        user_ids: selectedUserIds.map(id => parseInt(id)),
      });

      Alert.alert('Success', 'Users assigned successfully!', [
        { text: 'OK', onPress: () => {
          // Reset after success
          setSelectedProjectId('');
          setSelectedUserIds([]);
          loadData(); // Refresh data
        }},
      ]);
      
    } catch (error) {
      console.error('Assign error:', error);
      const msg = error.response?.data?.message || 'Failed to assign users';
      Alert.alert('Error', msg);
    } finally {
      setSubmitting(false);
    }
  };

  // ========== RENDER CONTENT ==========
  
  // Show loading state
  if (loading && projects.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar backgroundColor={statColors.total} barStyle="light-content" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={statColors.total} />
          <Text style={styles.loadingText}>Loading projects...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Show empty state if no projects
  if (projects.length === 0 && !loading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar backgroundColor={statColors.total} barStyle="light-content" />
        {/* Same Header as ProjectManagement */}
        <LinearGradient
          colors={['#2C3E50', '#4ECDC4']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.header}
        >
          <View style={styles.headerContent}>
            <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
              <Icon name="arrow-left" size={20} color="#fff" />
            </TouchableOpacity>
            <View style={styles.headerCenter}>
              <Text style={styles.headerTitle}>Assign Projects to Users</Text>
            </View>
            <View style={styles.addButtonPlaceholder} />
          </View>
        </LinearGradient>
        
        <View style={styles.emptyContainer}>
          <Icon name="users" size={60} color="#ddd" />
          <Text style={styles.emptyTitle}>No Projects Available</Text>
          <Text style={styles.emptyText}>
            There are no projects available for assignment. Please create projects first.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  // Main content
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar backgroundColor={statColors.total} barStyle="light-content" />

      {/* Same Header as ProjectManagement */}
      <LinearGradient
        colors={['#2C3E50', '#4ECDC4']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Icon name="arrow-left" size={20} color="#fff" />
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle}>Assign Projects to Users</Text>
            <Text style={styles.headerSubtitle}>Assign multiple users to a project</Text>
          </View>
          <View style={styles.addButtonPlaceholder} />
        </View>
      </LinearGradient>

      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Project Dropdown */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={[styles.cardIcon, { backgroundColor: statColors.total + '20' }]}>
              <Icon name="folder-open" size={20} color={statColors.total} />
            </View>
            <Text style={styles.cardTitle}>1. Select Project</Text>
          </View>
          
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={selectedProjectId}
              onValueChange={onProjectChange}
              style={styles.picker}
              dropdownIconColor={statColors.total}
            >
              <Picker.Item label="— Choose a project —" value="" color="#6c757d" />
              {projects.map(project => (
                <Picker.Item
                  key={project.id}
                  label={project.name || `Project ${project.id}`}
                  value={project.id.toString()}
                  color="#212529"
                />
              ))}
            </Picker>
          </View>
          
          {selectedProjectId && (
            <View style={styles.selectedProjectContainer}>
              <Icon name="check-circle" size={16} color={statColors.mobile} />
              <Text style={styles.selectedProject}>
                Selected: {projects.find(p => p.id.toString() === selectedProjectId)?.name}
              </Text>
            </View>
          )}
        </View>

        {/* Users Multi Select */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={[styles.cardIcon, { backgroundColor: statColors.accent + '20' }]}>
              <Icon name="users" size={20} color={statColors.accent} />
            </View>
            <Text style={styles.cardTitle}>
              2. Select Users {selectedUserIds.length > 0 && `(${selectedUserIds.length} selected)`}
            </Text>
          </View>
          
          <MultiSelect
            style={styles.dropdown}
            placeholderStyle={styles.placeholderStyle}
            selectedTextStyle={styles.selectedTextStyle}
            inputSearchStyle={styles.inputSearchStyle}
            iconStyle={styles.iconStyle}
            search
            data={userOptions}
            labelField="label"
            valueField="value"
            placeholder="Start typing to search users..."
            searchPlaceholder="Search by name or email..."
            value={selectedUserIds}
            onChange={setSelectedUserIds}
            onChangeText={setSearchText}
            selectedStyle={styles.selectedStyle}
            containerStyle={styles.dropdownContainer}
          />
          
          <Text style={styles.hint}>
            <Icon name="info-circle" size={12} color="#6c757d" /> 
            Tap to select/deselect • Search to filter users
          </Text>
        </View>

        {/* Stats Card */}
        <View style={styles.statsCard}>
          <View style={styles.statItem}>
            <Icon name="folder-open" size={24} color={statColors.total} />
            <Text style={styles.statNumber}>{projects.length}</Text>
            <Text style={styles.statLabel}>Projects</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Icon name="users" size={24} color={statColors.accent} />
            <Text style={styles.statNumber}>{users.length}</Text>
            <Text style={styles.statLabel}>Users</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Icon name="check-circle" size={24} color={statColors.mobile} />
            <Text style={styles.statNumber}>{selectedUserIds.length}</Text>
            <Text style={styles.statLabel}>Selected</Text>
          </View>
        </View>

        {/* Submit Button */}
        <TouchableOpacity
          style={[
            styles.submitButton,
            (!selectedProjectId || selectedUserIds.length === 0 || submitting) && styles.disabledButton
          ]}
          onPress={handleAssign}
          disabled={!selectedProjectId || selectedUserIds.length === 0 || submitting}
          activeOpacity={0.8}
        >
          {submitting ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <>
              <Icon name="user-plus" size={20} color="#fff" style={styles.submitIcon} />
              <Text style={styles.submitText}>
                {selectedUserIds.length > 0 
                  ? `Assign ${selectedUserIds.length} User${selectedUserIds.length > 1 ? 's' : ''}`
                  : 'Assign Users'
                }
              </Text>
            </>
          )}
        </TouchableOpacity>
        
        {/* Info Card */}
        <View style={styles.infoCard}>
          <View style={styles.infoHeader}>
            <Icon name="lightbulb-o" size={18} color={statColors.pending} />
            <Text style={styles.infoTitle}>How to use</Text>
          </View>
          <View style={styles.infoItem}>
            <Icon name="check-circle" size={14} color={statColors.mobile} style={styles.infoIcon} />
            <Text style={styles.infoText}>1. Select a project from the dropdown</Text>
          </View>
          <View style={styles.infoItem}>
            <Icon name="check-circle" size={14} color={statColors.mobile} style={styles.infoIcon} />
            <Text style={styles.infoText}>2. Search and select users from the multi-select</Text>
          </View>
          <View style={styles.infoItem}>
            <Icon name="check-circle" size={14} color={statColors.mobile} style={styles.infoIcon} />
            <Text style={styles.infoText}>3. Click "Assign Users" when ready</Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f7fb',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f7fb',
  },
  loadingText: {
    marginTop: 10,
    color: statColors.total,
    fontSize: 16,
  },
  // Header Styles (same as ProjectManagement)
  header: {
    paddingHorizontal: 20,
    paddingTop: 40,
    paddingBottom: 20,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    padding: 8,
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  headerSubtitle: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 4,
  },
  addButtonPlaceholder: {
    width: 36,
  },
  // Content Styles
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyTitle: {
    fontSize: 20,
    color: '#6c757d',
    marginTop: 15,
    marginBottom: 5,
    fontWeight: '600',
  },
  emptyText: {
    fontSize: 14,
    color: '#adb5bd',
    textAlign: 'center',
    marginBottom: 20,
  },
  // Card Styles
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  cardIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#212529',
  },
  // Picker Styles
  pickerContainer: {
    borderWidth: 1,
    borderColor: '#dee2e6',
    borderRadius: 8,
    backgroundColor: '#fff',
    overflow: 'hidden',
  },
  picker: {
    height: 50,
  },
  selectedProjectContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#f8f9fa',
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  selectedProject: {
    marginLeft: 8,
    fontSize: 14,
    color: '#495057',
    fontWeight: '500',
  },
  // Dropdown Styles
  dropdown: {
    height: 50,
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#dee2e6',
    borderRadius: 8,
    paddingHorizontal: 15,
  },
  dropdownContainer: {
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#dee2e6',
    marginTop: 5,
  },
  placeholderStyle: {
    fontSize: 16,
    color: '#6c757d',
  },
  selectedTextStyle: {
    fontSize: 16,
    color: '#212529',
    fontWeight: '500',
  },
  iconStyle: {
    width: 24,
    height: 24,
  },
  inputSearchStyle: {
    height: 40,
    fontSize: 16,
    borderRadius: 6,
    borderWidth: 0,
    backgroundColor: '#f8f9fa',
  },
  selectedStyle: {
    borderRadius: 20,
    backgroundColor: '#e9ecef',
    borderWidth: 0,
  },
  hint: {
    marginTop: 12,
    fontSize: 12,
    color: '#6c757d',
    fontStyle: 'italic',
    lineHeight: 18,
  },
  // Stats Card
  statsCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#212529',
    marginTop: 8,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#6c757d',
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: '#e9ecef',
  },
  // Submit Button
  submitButton: {
    backgroundColor: statColors.accent,
    paddingVertical: 18,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    marginBottom: 20,
    shadowColor: statColors.accent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  disabledButton: {
    backgroundColor: '#adb5bd',
    shadowOpacity: 0,
  },
  submitIcon: {
    marginRight: 10,
  },
  submitText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  // Info Card
  infoCard: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: '#dee2e6',
  },
  infoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#495057',
    marginLeft: 10,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  infoIcon: {
    marginTop: 2,
    marginRight: 10,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: '#495057',
    lineHeight: 20,
  },
});

export default AssignProjectsToUsers;
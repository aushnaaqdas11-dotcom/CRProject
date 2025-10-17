// screens/admin/AssignProjects.js
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  TextInput,
  ActivityIndicator,
  RefreshControl,
  Modal,
  ScrollView
} from 'react-native';
import { adminAPI } from '../../services/apiService';
import Icon from 'react-native-vector-icons/FontAwesome';

const AssignProjects = ({ navigation }) => {
  const [users, setUsers] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedProjects, setSelectedProjects] = useState([]);
  const [assigning, setAssigning] = useState(false);

  const loadData = async (search = '') => {
    try {
      setLoading(true);
      
      // Load assignable users
      const usersResponse = await adminAPI.getAssignableUsers({ search });
      if (usersResponse.data.success) {
        setUsers(usersResponse.data.data.users);
      }

      // Load projects
      const projectsResponse = await adminAPI.getProjectsForAssignment();
      if (projectsResponse.data.success) {
        setProjects(projectsResponse.data.data.projects);
      }

    } catch (error) {
      console.log('Load data error:', error);
      const errorMessage = error.response?.data?.message || 'Failed to load data';
      Alert.alert('Error', errorMessage);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadData(searchQuery);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSearch = (text) => {
    setSearchQuery(text);
    const timeoutId = setTimeout(() => {
      loadData(text);
    }, 500);
    return () => clearTimeout(timeoutId);
  };

  const handleAssignPress = (user) => {
    setSelectedUser(user);
    setSelectedProjects([]);
    setModalVisible(true);
  };

  const toggleProjectSelection = (projectId) => {
    setSelectedProjects(prev => {
      if (prev.includes(projectId)) {
        return prev.filter(id => id !== projectId);
      } else {
        return [...prev, projectId];
      }
    });
  };

  const handleAssignProjects = async () => {
    if (!selectedUser || selectedProjects.length === 0) {
      Alert.alert('Error', 'Please select at least one project');
      return;
    }

    setAssigning(true);
    try {
      const assignmentData = {
        user_id: selectedUser.id,
        project_ids: selectedProjects
      };

      const response = await adminAPI.assignProjectsToUser(assignmentData);
      
      if (response.data.success) {
        Alert.alert('Success', `Projects assigned successfully to ${selectedUser.name}`);
        setModalVisible(false);
        setSelectedUser(null);
        setSelectedProjects([]);
        loadData(searchQuery);
      } else {
        Alert.alert('Error', response.data.message || 'Failed to assign projects');
      }
    } catch (error) {
      console.log('Assign projects error:', error);
      const errorMessage = error.response?.data?.message || 'Failed to assign projects';
      Alert.alert('Error', errorMessage);
    } finally {
      setAssigning(false);
    }
  };

  const renderUserItem = ({ item, index }) => (
    <View style={styles.userCard}>
      <View style={styles.userSerial}>
        <Text style={styles.serialText}>{index + 1}</Text>
      </View>
      
      <View style={styles.userInfo}>
        <Text style={styles.userName}>{item.name}</Text>
        <Text style={styles.userDetail}>CNIC: {item.cnic}</Text>
        <Text style={styles.userDetail}>Email: {item.email}</Text>
        <Text style={styles.userDetail}>Phone: {item.phone}</Text>
      </View>

      <TouchableOpacity 
        style={styles.assignButton}
        onPress={() => handleAssignPress(item)}
      >
        <Icon name="link" size={16} color="#fff" />
        <Text style={styles.assignButtonText}>Assign</Text>
      </TouchableOpacity>
    </View>
  );

  if (loading && users.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2C3E50" />
        <Text style={styles.loadingText}>Loading users...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Icon name="arrow-left" size={20} color="#2C3E50" />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Assign Projects</Text>
          <Text style={styles.headerSubtitle}>
            View and manage all users eligible for project assignments
          </Text>
        </View>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Icon name="search" size={20} color="#666" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search users..."
          value={searchQuery}
          onChangeText={handleSearch}
        />
      </View>

      {/* List Header */}
      <View style={styles.listHeader}>
        <Text style={styles.listHeaderTitle}>Eligible Users (Assigners)</Text>
      </View>

      {/* Users List */}
      <FlatList
        data={users}
        renderItem={renderUserItem}
        keyExtractor={(item) => item.id.toString()}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Icon name="users" size={50} color="#ccc" />
            <Text style={styles.emptyText}>No eligible users found</Text>
            <Text style={styles.emptySubtext}>
              Users with role "Assigner" will appear here
            </Text>
          </View>
        }
        contentContainerStyle={styles.listContent}
      />

      {/* Assign Projects Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              Assign Projects to {selectedUser?.name}
            </Text>

            <Text style={styles.modalSubtitle}>
              Select projects to assign:
            </Text>

            <ScrollView style={styles.projectsList}>
              {projects.map((project) => (
                <TouchableOpacity
                  key={project.id}
                  style={[
                    styles.projectItem,
                    selectedProjects.includes(project.id) && styles.projectItemSelected
                  ]}
                  onPress={() => toggleProjectSelection(project.id)}
                >
                  <View style={styles.projectCheckbox}>
                    {selectedProjects.includes(project.id) && (
                      <Icon name="check" size={16} color="#fff" />
                    )}
                  </View>
                  <Text style={styles.projectName}>{project.name}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <View style={styles.modalActions}>
              <TouchableOpacity 
                style={styles.modalCancel}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.modalConfirm, assigning && styles.modalConfirmDisabled]}
                onPress={handleAssignProjects}
                disabled={assigning}
              >
                {assigning ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.modalConfirmText}>
                    Assign ({selectedProjects.length})
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    paddingTop: 60,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
  },
  loadingText: {
    marginTop: 10,
    color: '#2C3E50',
    fontSize: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  backButton: {
    padding: 5,
    marginRight: 15,
  },
  headerContent: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2C3E50',
    marginBottom: 5,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#666',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    margin: 20,
    marginBottom: 10,
    paddingHorizontal: 15,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 16,
  },
  listHeader: {
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: '#E6FFFA',
  },
  listHeaderTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2C3E50',
    textAlign: 'center',
  },
  listContent: {
    padding: 20,
    paddingTop: 10,
  },
  userCard: {
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 20,
    marginBottom: 15,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  userSerial: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#4ECDC4',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  serialText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2C3E50',
    marginBottom: 5,
  },
  userDetail: {
    fontSize: 12,
    color: '#666',
    marginBottom: 2,
  },
  assignButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2C3E50',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 8,
  },
  assignButtonText: {
    color: '#fff',
    fontWeight: '600',
    marginLeft: 5,
    fontSize: 14,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 50,
  },
  emptyText: {
    marginTop: 10,
    color: '#666',
    fontSize: 16,
  },
  emptySubtext: {
    marginTop: 5,
    color: '#999',
    fontSize: 14,
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 25,
    width: '100%',
    maxWidth: 400,
    maxHeight: '80%',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 10,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2C3E50',
    marginBottom: 10,
    textAlign: 'center',
  },
  modalSubtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 20,
    textAlign: 'center',
  },
  projectsList: {
    maxHeight: 300,
    marginBottom: 20,
  },
  projectItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 10,
    marginBottom: 10,
  },
  projectItemSelected: {
    backgroundColor: '#E6FFFA',
    borderColor: '#4ECDC4',
  },
  projectCheckbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: '#4ECDC4',
    marginRight: 15,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  projectItemSelected: {
    backgroundColor: '#4ECDC4',
  },
  projectName: {
    fontSize: 16,
    color: '#2C3E50',
    flex: 1,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  modalCancel: {
    flex: 1,
    backgroundColor: '#e2e8f0',
    padding: 15,
    borderRadius: 10,
    marginRight: 10,
    alignItems: 'center',
  },
  modalCancelText: {
    color: '#666',
    fontWeight: '600',
  },
  modalConfirm: {
    flex: 1,
    backgroundColor: '#4ECDC4',
    padding: 15,
    borderRadius: 10,
    marginLeft: 10,
    alignItems: 'center',
  },
  modalConfirmDisabled: {
    opacity: 0.6,
  },
  modalConfirmText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});

export default AssignProjects;
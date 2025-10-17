// screens/admin/RolesManagement.js
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
  Modal
} from 'react-native';
import { adminAPI } from '../../services/apiService';
import Icon from 'react-native-vector-icons/FontAwesome';

const RolesManagement = ({ navigation }) => {
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [newRoleName, setNewRoleName] = useState('');
  const [creating, setCreating] = useState(false);

  const loadRoles = async (search = '') => {
    try {
      setLoading(true);
      const params = {
        search: search
      };

      const response = await adminAPI.getRoles(params);
      
      if (response.data.success) {
        setRoles(response.data.data.roles);
      } else {
        Alert.alert('Error', response.data.message || 'Failed to load roles');
      }
    } catch (error) {
      console.log('Load roles error:', error);
      const errorMessage = error.response?.data?.message || 'Failed to load roles';
      Alert.alert('Error', errorMessage);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadRoles(searchQuery);
  };

  useEffect(() => {
    loadRoles();
  }, []);

  const handleSearch = (text) => {
    setSearchQuery(text);
    const timeoutId = setTimeout(() => {
      loadRoles(text);
    }, 500);
    return () => clearTimeout(timeoutId);
  };

  const handleCreateRole = async () => {
    if (!newRoleName.trim()) {
      Alert.alert('Error', 'Please enter role name');
      return;
    }

    setCreating(true);
    try {
      const response = await adminAPI.createRole({ name: newRoleName });
      
      if (response.data.success) {
        Alert.alert('Success', 'Role created successfully');
        setModalVisible(false);
        setNewRoleName('');
        loadRoles(searchQuery);
      } else {
        Alert.alert('Error', response.data.message || 'Failed to create role');
      }
    } catch (error) {
      console.log('Create role error:', error);
      const errorMessage = error.response?.data?.message || 'Failed to create role';
      Alert.alert('Error', errorMessage);
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteRole = (roleId, roleName) => {
    Alert.alert(
      'Delete Role',
      `Are you sure you want to delete "${roleName}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => deleteRole(roleId)
        }
      ]
    );
  };

  const deleteRole = async (roleId) => {
    try {
      const response = await adminAPI.deleteRole(roleId);
      if (response.data.success) {
        Alert.alert('Success', 'Role deleted successfully');
        loadRoles(searchQuery);
      } else {
        Alert.alert('Error', response.data.message || 'Failed to delete role');
      }
    } catch (error) {
      console.log('Delete role error:', error);
      const errorMessage = error.response?.data?.message || 'Failed to delete role';
      Alert.alert('Error', errorMessage);
    }
  };

  const renderRoleItem = ({ item, index }) => (
    <View style={styles.roleCard}>
      <View style={styles.roleHeader}>
        <Text style={styles.roleSerial}>{index + 1}</Text>
        <View style={styles.roleInfo}>
          <Text style={styles.roleName}>{item.name}</Text>
          <Text style={styles.roleId}>ID: {item.id}</Text>
        </View>
      </View>
      
      <View style={styles.actions}>
        <TouchableOpacity 
          style={styles.editBtn}
          onPress={() => navigation.navigate('EditRole', { roleId: item.id })}
        >
          <Icon name="edit" size={14} color="#fff" />
          <Text style={styles.actionText}>Edit</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.deleteBtn}
          onPress={() => handleDeleteRole(item.id, item.name)}
        >
          <Icon name="trash" size={14} color="#fff" />
          <Text style={styles.actionText}>Delete</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  if (loading && roles.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2C3E50" />
        <Text style={styles.loadingText}>Loading roles...</Text>
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
        <Text style={styles.headerTitle}>Roles Management</Text>
        <TouchableOpacity 
          style={styles.addButton}
          onPress={() => setModalVisible(true)}
        >
          <Icon name="plus" size={16} color="#fff" />
          <Text style={styles.addButtonText}>Create</Text>
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Icon name="search" size={20} color="#666" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search for roles..."
          value={searchQuery}
          onChangeText={handleSearch}
        />
      </View>

      {/* List Header */}
      <View style={styles.listHeader}>
        <Text style={styles.listHeaderTitle}>
          Create, update, and manage user roles
        </Text>
      </View>

      {/* Roles List */}
      <FlatList
        data={roles}
        renderItem={renderRoleItem}
        keyExtractor={(item) => item.id.toString()}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Icon name="id-badge" size={50} color="#ccc" />
            <Text style={styles.emptyText}>No roles found</Text>
          </View>
        }
        contentContainerStyle={styles.listContent}
      />

      {/* Create Role Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Create New Role</Text>
            
            <TextInput
              style={styles.modalInput}
              placeholder="Enter role name"
              value={newRoleName}
              onChangeText={setNewRoleName}
            />

            <View style={styles.modalActions}>
              <TouchableOpacity 
                style={styles.modalCancel}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.modalConfirm, creating && styles.modalConfirmDisabled]}
                onPress={handleCreateRole}
                disabled={creating}
              >
                {creating ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.modalConfirmText}>Create Role</Text>
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
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  backButton: {
    padding: 5,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2C3E50',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4ECDC4',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 8,
  },
  addButtonText: {
    color: '#fff',
    fontWeight: '600',
    marginLeft: 5,
    fontSize: 14,
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
    paddingVertical: 10,
  },
  listHeaderTitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  listContent: {
    padding: 20,
    paddingTop: 10,
  },
  roleCard: {
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 20,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  roleHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  roleSerial: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2C3E50',
    marginRight: 15,
    minWidth: 30,
  },
  roleInfo: {
    flex: 1,
  },
  roleName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2C3E50',
    marginBottom: 5,
  },
  roleId: {
    fontSize: 14,
    color: '#666',
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  editBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#667eea',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    marginRight: 10,
  },
  deleteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5576c',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  actionText: {
    color: '#fff',
    fontWeight: '600',
    marginLeft: 5,
    fontSize: 12,
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
    marginBottom: 20,
    textAlign: 'center',
  },
  modalInput: {
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 10,
    padding: 15,
    fontSize: 16,
    marginBottom: 20,
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

export default RolesManagement;
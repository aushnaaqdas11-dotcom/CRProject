// screens/admin/EditUser.js
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
  Dimensions,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Modal
} from 'react-native';
import { adminAPI } from '../../services/apiService';
import Icon from 'react-native-vector-icons/FontAwesome';
import { useAuth } from '../../hooks/redux';

const { width } = Dimensions.get('window');

const EditUser = ({ navigation }) => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [pagination, setPagination] = useState({});
  
  // Edit form states
  const [editingUser, setEditingUser] = useState(null);
  const [showEditForm, setShowEditForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [roles, setRoles] = useState([]);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    cnic: '',
    phone: '',
    role: '',
    password: '',
    confirmPassword: ''
  });

  // Load users list
  const loadUsers = async (page = 1, search = '') => {
    try {
      setLoading(true);
      const params = {
        page,
        per_page: 10,
        search: search
      };

      const response = await adminAPI.getUsers(params);
      
      if (response.data.success) {
        setUsers(response.data.data.users);
        setPagination(response.data.data.pagination);
      } else {
        Alert.alert('Error', response.data.message || 'Failed to load users');
      }
    } catch (error) {
      console.log('Load users error:', error);
      const errorMessage = error.response?.data?.message || 'Failed to load users';
      Alert.alert('Error', errorMessage);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadUsers(1, searchQuery);
  };

  useEffect(() => {
    loadUsers();
    loadRoles();
  }, []);

  // Load roles for dropdown
  const loadRoles = async () => {
    try {
      const response = await adminAPI.getRoles();
      if (response.data.success) {
        setRoles(response.data.data.roles);
      }
    } catch (error) {
      console.log('Load roles error:', error);
    }
  };

  const handleSearch = (text) => {
    setSearchQuery(text);
    const timeoutId = setTimeout(() => {
      loadUsers(1, text);
    }, 500);
    return () => clearTimeout(timeoutId);
  };

  const handleDeleteUser = (userId, userName) => {
    Alert.alert(
      'Delete User',
      `Are you sure you want to delete ${userName}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => deleteUser(userId)
        }
      ]
    );
  };

  const deleteUser = async (userId) => {
    try {
      const response = await adminAPI.deleteUser(userId);
      if (response.data.success) {
        Alert.alert('Success', 'User deleted successfully');
        loadUsers(pagination.current_page, searchQuery);
      } else {
        Alert.alert('Error', response.data.message || 'Failed to delete user');
      }
    } catch (error) {
      console.log('Delete user error:', error);
      const errorMessage = error.response?.data?.message || 'Failed to delete user';
      Alert.alert('Error', errorMessage);
    }
  };

  // Edit User Functions
  const openEditForm = (user) => {
    setEditingUser(user);
    
    // Extract role ID from the role object
    let userRole = '';
    if (user.role && user.role.id) {
      userRole = user.role.id.toString();
    }
    
    setFormData({
      name: user.name || '',
      email: user.email || '',
      cnic: user.cnic || '',
      phone: user.phone || '',
      role: userRole,
      password: '',
      confirmPassword: ''
    });
    setShowEditForm(true);
  };

  const closeEditForm = () => {
    setShowEditForm(false);
    setEditingUser(null);
    setFormData({
      name: '',
      email: '',
      cnic: '',
      phone: '',
      role: '',
      password: '',
      confirmPassword: ''
    });
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const validateForm = () => {
    if (!formData.name.trim()) {
      Alert.alert('Error', 'Please enter name');
      return false;
    }
    if (!formData.email.trim()) {
      Alert.alert('Error', 'Please enter email');
      return false;
    }
    if (!formData.cnic.trim()) {
      Alert.alert('Error', 'Please enter CNIC');
      return false;
    }
    if (!formData.phone.trim()) {
      Alert.alert('Error', 'Please enter phone number');
      return false;
    }
    if (!formData.role) {
      Alert.alert('Error', 'Please select role');
      return false;
    }
    if (formData.password && formData.password.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters');
      return false;
    }
    if (formData.password !== formData.confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setSaving(true);
    try {
      const submitData = {
        name: formData.name,
        email: formData.email,
        cnic: formData.cnic,
        phone: formData.phone,
        role: parseInt(formData.role)
      };

      // Only include password if provided
      if (formData.password) {
        submitData.password = formData.password;
      }

      const response = await adminAPI.updateUser(editingUser.id, submitData);
      
      if (response.data.success) {
        Alert.alert('Success', 'User updated successfully', [
          { 
            text: 'OK', 
            onPress: () => {
              closeEditForm();
              loadUsers(pagination.current_page, searchQuery);
            }
          }
        ]);
      } else {
        Alert.alert('Error', response.data.message || 'Failed to update user');
      }
    } catch (error) {
      console.log('Update user error:', error);
      const errorMessage = error.response?.data?.message || 'Failed to update user';
      const errors = error.response?.data?.errors;
      
      if (errors) {
        const errorText = Object.values(errors).flat().join('\n');
        Alert.alert('Validation Error', errorText);
      } else {
        Alert.alert('Error', errorMessage);
      }
    } finally {
      setSaving(false);
    }
  };

  // Function to get role name
  const getRoleName = (user) => {
    if (user.role && user.role.name) {
      return user.role.name;
    }
    return 'No Role Assigned';
  };

  // Pagination handlers
  const goToFirstPage = () => {
    if (pagination.current_page > 1) {
      loadUsers(1, searchQuery);
    }
  };

  const goToPreviousPage = () => {
    if (pagination.current_page > 1) {
      loadUsers(pagination.current_page - 1, searchQuery);
    }
  };

  const goToNextPage = () => {
    if (pagination.current_page < pagination.last_page) {
      loadUsers(pagination.current_page + 1, searchQuery);
    }
  };

  const goToLastPage = () => {
    if (pagination.current_page < pagination.last_page) {
      loadUsers(pagination.last_page, searchQuery);
    }
  };

  const renderUserItem = ({ item, index }) => (
    <View style={styles.userCard}>
      <View style={styles.userHeader}>
        <Text style={styles.userSerial}>{(pagination.current_page - 1) * 10 + index + 1}</Text>
        <Text style={styles.userName}>{item.name}</Text>
      </View>
      
      <View style={styles.userDetails}>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>CNIC:</Text>
          <Text style={styles.detailValue}>{item.cnic}</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Phone:</Text>
          <Text style={styles.detailValue}>{item.phone}</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Email:</Text>
          <Text style={styles.detailValue}>{item.email}</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Role:</Text>
          <Text style={[styles.detailValue, styles.roleText]}>
            {getRoleName(item)}
          </Text>
        </View>
      </View>

      <View style={styles.actions}>
        <TouchableOpacity 
          style={styles.editBtn}
          onPress={() => openEditForm(item)}
        >
          <Icon name="edit" size={16} color="#fff" />
          <Text style={styles.actionText}>Edit</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.deleteBtn}
          onPress={() => handleDeleteUser(item.id, item.name)}
        >
          <Icon name="trash" size={16} color="#fff" />
          <Text style={styles.actionText}>Delete</Text>
        </TouchableOpacity>
      </View>
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
        <Text style={styles.headerTitle}>Edit Users</Text>
        <TouchableOpacity 
          style={styles.addButton}
          onPress={() => navigation.navigate('CreateUser')}
        >
          <Icon name="plus" size={16} color="#fff" />
          <Text style={styles.addButtonText}>Add User</Text>
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Icon name="search" size={20} color="#666" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search users by name, email, CNIC..."
          placeholderTextColor='#858181ff'
          value={searchQuery}
          onChangeText={handleSearch}
        />
      </View>

      {/* Users List Header */}
      <View style={styles.listHeader}>
        <Text style={styles.listHeaderTitle}>
          Click Edit to modify user details and roles
        </Text>
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
            <Text style={styles.emptyText}>No users found</Text>
          </View>
        }
        contentContainerStyle={styles.listContent}
      />

      {/* Pagination Controls */}
      {pagination && pagination.total > 0 && (
        <View style={styles.paginationContainer}>
          <Text style={styles.paginationText}>
            Showing {pagination.from}-{pagination.to} of {pagination.total} users
          </Text>
          
          <View style={styles.paginationControls}>
            <TouchableOpacity 
              style={[
                styles.paginationButton,
                pagination.current_page === 1 && styles.paginationButtonDisabled
              ]}
              onPress={goToFirstPage}
              disabled={pagination.current_page === 1}
            >
              <Icon name="step-backward" size={14} color={pagination.current_page === 1 ? "#ccc" : "#2C3E50"} />
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[
                styles.paginationButton,
                pagination.current_page === 1 && styles.paginationButtonDisabled
              ]}
              onPress={goToPreviousPage}
              disabled={pagination.current_page === 1}
            >
              <Icon name="chevron-left" size={14} color={pagination.current_page === 1 ? "#ccc" : "#2C3E50"} />
            </TouchableOpacity>
            
            <Text style={styles.pageIndicator}>
              Page {pagination.current_page} of {pagination.last_page}
            </Text>
            
            <TouchableOpacity 
              style={[
                styles.paginationButton,
                pagination.current_page === pagination.last_page && styles.paginationButtonDisabled
              ]}
              onPress={goToNextPage}
              disabled={pagination.current_page === pagination.last_page}
            >
              <Icon name="chevron-right" size={14} color={pagination.current_page === pagination.last_page ? "#ccc" : "#2C3E50"} />
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[
                styles.paginationButton,
                pagination.current_page === pagination.last_page && styles.paginationButtonDisabled
              ]}
              onPress={goToLastPage}
              disabled={pagination.current_page === pagination.last_page}
            >
              <Icon name="step-forward" size={14} color={pagination.current_page === pagination.last_page ? "#ccc" : "#2C3E50"} />
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Edit User Modal */}
      <Modal
        visible={showEditForm}
        animationType="slide"
        presentationStyle="formSheet"
      >
        <KeyboardAvoidingView 
          style={styles.modalContainer}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          {/* Modal Header */}
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={closeEditForm} style={styles.modalBackButton}>
              <Icon name="arrow-left" size={20} color="#2C3E50" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Edit User</Text>
            <View style={styles.placeholder} />
          </View>

          <ScrollView 
            style={styles.modalScrollView}
            contentContainerStyle={styles.modalScrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <View style={styles.formContainer}>
              <View style={styles.formGroup}>
                <Text style={styles.label}>Full Name</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter full name"
                  value={formData.name}
                  placeholderTextColor={"#bbb8b8ff"}
                  onChangeText={(text) => handleInputChange('name', text)}
                  returnKeyType="next"
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Email Address</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter email address"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  placeholderTextColor={"#bbb8b8ff"}
                  value={formData.email}
                  onChangeText={(text) => handleInputChange('email', text)}
                  returnKeyType="next"
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>CNIC</Text>
                <TextInput
                  style={styles.input}
                  placeholderTextColor={"#bbb8b8ff"}
                  placeholder="Enter CNIC"
                  value={formData.cnic}
                  onChangeText={(text) => handleInputChange('cnic', text)}
                  returnKeyType="next"
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Phone Number</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter phone number"
                  keyboardType="phone-pad"
                  placeholderTextColor={"#bbb8b8ff"}
                  value={formData.phone}
                  onChangeText={(text) => handleInputChange('phone', text)}
                  returnKeyType="next"
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Role</Text>
                <View style={styles.roleContainer}>
                  {roles.map((role) => (
                    <TouchableOpacity
                      key={role.id}
                      style={[
                        styles.roleOption,
                        formData.role === role.id.toString() && styles.roleOptionSelected
                      ]}
                      onPress={() => handleInputChange('role', role.id.toString())}
                    >
                      <Text style={[
                        styles.roleText,
                        formData.role === role.id.toString() && styles.roleTextSelected
                      ]}>
                        {role.name}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
                
                {formData.role && (
                  <Text style={styles.currentRoleText}>
                    Current Role: {roles.find(r => r.id.toString() === formData.role)?.name || 'Unknown'}
                  </Text>
                )}
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>New Password (leave blank to keep current)</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter new password"
                  placeholderTextColor={"#bbb8b8ff"}
                  secureTextEntry
                  value={formData.password}
                  onChangeText={(text) => handleInputChange('password', text)}
                  returnKeyType="next"
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Confirm New Password</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Confirm new password"
                  secureTextEntry
                  value={formData.confirmPassword}
                  placeholderTextColor={"#bbb8b8ff"}
                  onChangeText={(text) => handleInputChange('confirmPassword', text)}
                  returnKeyType="done"
                  onSubmitEditing={handleSubmit}
                />
              </View>

              <TouchableOpacity
                style={[styles.submitButton, saving && styles.submitButtonDisabled]}
                onPress={handleSubmit}
                disabled={saving}
              >
                {saving ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <>
                    <Icon name="save" size={20} color="#fff" />
                    <Text style={styles.submitButtonText}>Update User</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
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
  userCard: {
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
  userHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  userSerial: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2C3E50',
    marginRight: 15,
    minWidth: 30,
  },
  userName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2C3E50',
    flex: 1,
  },
  userDetails: {
    marginBottom: 15,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  detailLabel: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  detailValue: {
    fontSize: 14,
    color: '#2C3E50',
    flex: 1,
    textAlign: 'right',
    marginLeft: 10,
  },
  roleText: {
    color: '#4ECDC4',
    fontWeight: '600',
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  editBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#667eea',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 8,
    marginRight: 10,
  },
  deleteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5576c',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 8,
  },
  actionText: {
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
  paginationContainer: {
    padding: 15,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
  },
  paginationText: {
    textAlign: 'center',
    color: '#666',
    fontSize: 14,
    marginBottom: 10,
  },
  paginationControls: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  paginationButton: {
    padding: 8,
    marginHorizontal: 5,
    borderRadius: 6,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  paginationButtonDisabled: {
    opacity: 0.5,
  },
  pageIndicator: {
    marginHorizontal: 15,
    color: '#2C3E50',
    fontWeight: '600',
    fontSize: 14,
  },
  // Modal Styles
  modalContainer: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    paddingTop: Platform.OS === 'ios' ? 50 : 20,
  },
  modalBackButton: {
    padding: 5,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2C3E50',
  },
  modalScrollView: {
    flex: 1,
  },
  modalScrollContent: {
    flexGrow: 1,
  },
  formContainer: {
    padding: 20,
    paddingBottom: 40,
  },
  formGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2C3E50',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 10,
    padding: 15,
    fontSize: 16,
    color: 'black',
  },
  roleContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  roleOption: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 8,
    paddingHorizontal: 15,
    paddingVertical: 10,
    marginRight: 10,
    marginBottom: 10,
  },
  roleOptionSelected: {
    backgroundColor: '#4ECDC4',
    borderColor: '#4ECDC4',
  },
  roleTextSelected: {
    color: '#fff',
  },
  currentRoleText: {
    marginTop: 10,
    fontSize: 14,
    color: '#4ECDC4',
    fontWeight: '600',
    textAlign: 'center',
  },
  submitButton: {
    backgroundColor: '#4ECDC4',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 15,
    borderRadius: 10,
    marginTop: 20,
    marginBottom: 20,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 10,
  },
  placeholder: {
    width: 30,
  },
});

export default EditUser;
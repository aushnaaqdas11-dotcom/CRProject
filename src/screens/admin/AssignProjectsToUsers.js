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
  Modal,
  Platform,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/FontAwesome';
import { Picker } from '@react-native-picker/picker';
import api from '../../services/apiService';
import Footer from '../../components/Footer';

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
  success: '#10B981',
  danger: '#EF4444',
  info: '#3B82F6',
};

// ✅ Custom Dropdown Component (like in RequestDetailScreen)
const CustomDropdown = ({
  label,
  options,
  selectedValue,
  onSelect,
  placeholder,
  searchable = false,
  multiple = false,
  selectedValues = [],
  onMultipleSelect = () => {},
}) => {
  const [showModal, setShowModal] = useState(false);
  const [searchText, setSearchText] = useState('');

  const filteredOptions = searchable
    ? options.filter(option => 
        option.label.toLowerCase().includes(searchText.toLowerCase()) ||
        option.value.toLowerCase().includes(searchText.toLowerCase())
      )
    : options;

  const selectedOption = options.find(opt => opt.value === selectedValue);
  const selectedLabel = selectedOption?.label || placeholder;

  // For multi-select display
  const selectedMultipleLabels = multiple
    ? options
        .filter(opt => selectedValues.includes(opt.value))
        .map(opt => opt.label)
    : [];

  const renderMultipleSelection = () => {
    if (selectedMultipleLabels.length === 0) {
      return <Text style={styles.dropdownTriggerPlaceholder}>{placeholder}</Text>;
    }

    return (
      <View style={styles.multipleSelectionContainer}>
        {selectedMultipleLabels.slice(0, 2).map((label, index) => (
          <View key={index} style={styles.selectedBadge}>
            <Text style={styles.selectedBadgeText} numberOfLines={1}>
              {label.split(' - ')[0]}
            </Text>
          </View>
        ))}
        {selectedMultipleLabels.length > 2 && (
          <View style={styles.moreBadge}>
            <Text style={styles.moreBadgeText}>+{selectedMultipleLabels.length - 2}</Text>
          </View>
        )}
      </View>
    );
  };

  return (
    <View style={styles.dropdownContainer}>
      <Text style={styles.dropdownLabel}>{label}:</Text>

      <TouchableOpacity
        style={[
          styles.dropdownTrigger,
          !selectedValue && selectedMultipleLabels.length === 0 && styles.dropdownTriggerEmpty,
        ]}
        onPress={() => setShowModal(true)}
      >
        {multiple ? (
          renderMultipleSelection()
        ) : (
          <Text style={[
            styles.dropdownTriggerText,
            !selectedValue && styles.dropdownTriggerPlaceholder,
          ]}>
            {selectedLabel}
          </Text>
        )}
        <Icon
          name={showModal ? 'chevron-up' : 'chevron-down'}
          size={16}
          color={statColors.total}
        />
      </TouchableOpacity>

      {/* Modal for dropdown options */}
      <Modal
        visible={showModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{label}</Text>
              <TouchableOpacity
                onPress={() => setShowModal(false)}
                style={styles.modalCloseButton}
              >
                <Icon name="times" size={20} color={statColors.total} />
              </TouchableOpacity>
            </View>

            {searchable && (
              <View style={styles.searchContainer}>
                <Icon name="search" size={16} color="#9CA3AF" style={styles.searchIcon} />
                <TextInput
                  style={styles.searchInput}
                  placeholder="Search..."
                  placeholderTextColor="#9CA3AF"
                  value={searchText}
                  onChangeText={setSearchText}
                />
              </View>
            )}

            <ScrollView style={styles.optionsList}>
              {filteredOptions.length === 0 ? (
                <View style={styles.emptyState}>
                  <Icon name="search" size={30} color="#D1D5DB" />
                  <Text style={styles.emptyStateText}>No results found</Text>
                </View>
              ) : (
                filteredOptions.map((option, index) => (
                  <TouchableOpacity
                    key={option.value}
                    style={[
                      styles.optionItem,
                      (multiple ? selectedValues.includes(option.value) : selectedValue === option.value) && 
                        styles.optionItemSelected,
                      index === filteredOptions.length - 1 && styles.lastOptionItem,
                    ]}
                    onPress={() => {
                      if (multiple) {
                        const newValues = selectedValues.includes(option.value)
                          ? selectedValues.filter(v => v !== option.value)
                          : [...selectedValues, option.value];
                        onMultipleSelect(newValues);
                      } else {
                        onSelect(option.value);
                        setShowModal(false);
                      }
                    }}
                  >
                    <View style={styles.optionContent}>
                      <View style={[
                        styles.optionIcon,
                        (multiple ? selectedValues.includes(option.value) : selectedValue === option.value) && 
                          styles.optionIconSelected,
                      ]}>
                        {multiple ? (
                          selectedValues.includes(option.value) ? (
                            <Icon name="check-square" size={16} color="#fff" />
                          ) : (
                            <Icon name="square-o" size={16} color="#9CA3AF" />
                          )
                        ) : selectedValue === option.value ? (
                          <Icon name="check-circle" size={16} color="#fff" />
                        ) : (
                          <Icon name="circle-o" size={16} color="#9CA3AF" />
                        )}
                      </View>
                      <Text style={[
                        styles.optionLabel,
                        (multiple ? selectedValues.includes(option.value) : selectedValue === option.value) && 
                          styles.optionLabelSelected,
                      ]}>
                        {option.label}
                      </Text>
                    </View>
                    {(multiple ? selectedValues.includes(option.value) : selectedValue === option.value) && (
                      <Icon name="check" size={16} color={statColors.success} />
                    )}
                  </TouchableOpacity>
                ))
              )}
            </ScrollView>

            <View style={styles.modalFooter}>
              {multiple && (
                <TouchableOpacity
                  style={styles.doneButton}
                  onPress={() => setShowModal(false)}
                >
                  <LinearGradient
                    colors={[statColors.accent, '#764ba2']}
                    style={styles.doneButtonGradient}
                  >
                    <Text style={styles.doneButtonText}>
                      Done ({selectedValues.length} selected)
                    </Text>
                  </LinearGradient>
                </TouchableOpacity>
              )}
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setShowModal(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Selected items preview for multi-select */}
      {multiple && selectedValues.length > 0 && (
        <View style={styles.selectedPreview}>
          <Text style={styles.selectedCount}>
            {selectedValues.length} user{selectedValues.length !== 1 ? 's' : ''} selected
          </Text>
          <TouchableOpacity
            onPress={() => onMultipleSelect([])}
            style={styles.clearAllButton}
          >
            <Icon name="times-circle" size={16} color={statColors.danger} />
            <Text style={styles.clearAllText}>Clear all</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
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
  const [showProjectDropdown, setShowProjectDropdown] = useState(false);
  const [showUsersDropdown, setShowUsersDropdown] = useState(false);

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

  // Format options for dropdowns
  const projectOptions = projects.map(project => ({
    label: project.name || `Project ${project.id}`,
    value: project.id?.toString() || '',
  }));

  const userOptions = users.map(user => {
    const roleName = getRoleName(user.role);
    const userName = user.name || 'No Name';
    const userEmail = user.email || 'No Email';
    
    return {
      label: `${userName} (${userEmail}) - ${roleName}`,
      value: user.id?.toString() || '',
      original: user,
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

  // Handle user selection for multi-select
  const handleUserSelect = (userIds) => {
    setSelectedUserIds(userIds);
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
          
          <CustomDropdown
            label="Project"
            options={projectOptions}
            selectedValue={selectedProjectId}
            onSelect={onProjectChange}
            placeholder="— Choose a project —"
          />
          
          {selectedProjectId && (
            <View style={styles.selectedProjectContainer}>
              <Icon name="check-circle" size={16} color={statColors.success} />
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
          
          <CustomDropdown
            label="Users"
            options={userOptions}
            selectedValue={selectedUserIds[0]} // Not used for multi-select
            onSelect={() => {}}
            onMultipleSelect={handleUserSelect}
            selectedValues={selectedUserIds}
            placeholder="Start typing to search users..."
            searchable={true}
            multiple={true}
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
            <Icon name="check-circle" size={24} color={statColors.success} />
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
            <Icon name="check-circle" size={14} color={statColors.success} style={styles.infoIcon} />
            <Text style={styles.infoText}>1. Select a project from the dropdown</Text>
          </View>
          <View style={styles.infoItem}>
            <Icon name="check-circle" size={14} color={statColors.success} style={styles.infoIcon} />
            <Text style={styles.infoText}>2. Search and select users from the multi-select</Text>
          </View>
          <View style={styles.infoItem}>
            <Icon name="check-circle" size={14} color={statColors.success} style={styles.infoIcon} />
            <Text style={styles.infoText}>3. Click "Assign Users" when ready</Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

// Import TextInput for search
import { TextInput } from 'react-native';

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
  // Dropdown Styles
  dropdownContainer: {
    marginBottom: 10,
  },
  dropdownLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  dropdownTrigger: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 16,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    minHeight: 50,
  },
  dropdownTriggerEmpty: {
    borderColor: '#D1D5DB',
  },
  dropdownTriggerText: {
    fontSize: 16,
    color: '#2C3E50',
    fontWeight: '500',
    flex: 1,
  },
  dropdownTriggerPlaceholder: {
    color: '#9CA3AF',
    fontSize: 16,
  },
  selectedProjectContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#f0f9ff',
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  selectedProject: {
    marginLeft: 8,
    fontSize: 14,
    color: '#0c4a6e',
    fontWeight: '500',
  },
  // Multiple Selection Styles
  multipleSelectionContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    flex: 1,
    alignItems: 'center',
    gap: 6,
  },
  selectedBadge: {
    backgroundColor: '#e0f2fe',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    maxWidth: 100,
  },
  selectedBadgeText: {
    color: '#0369a1',
    fontSize: 12,
    fontWeight: '500',
  },
  moreBadge: {
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 20,
  },
  moreBadgeText: {
    color: '#64748b',
    fontSize: 12,
    fontWeight: '500',
  },
  selectedPreview: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#f8fafc',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  selectedCount: {
    fontSize: 14,
    color: '#475569',
    fontWeight: '500',
  },
  clearAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  clearAllText: {
    color: statColors.danger,
    fontSize: 12,
    fontWeight: '500',
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -3 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
      },
      android: {
        elevation: 20,
      },
    }),
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: statColors.total,
  },
  modalCloseButton: {
    padding: 4,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#374151',
    paddingVertical: 8,
  },
  optionsList: {
    maxHeight: 400,
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  optionItemSelected: {
    backgroundColor: '#f0f9ff',
    borderLeftWidth: 4,
    borderLeftColor: statColors.accent,
  },
  lastOptionItem: {
    borderBottomWidth: 0,
  },
  optionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  optionIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  optionIconSelected: {
    backgroundColor: statColors.accent,
  },
  optionLabel: {
    fontSize: 16,
    color: '#374151',
    flex: 1,
  },
  optionLabelSelected: {
    color: statColors.total,
    fontWeight: '600',
  },
  emptyState: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyStateText: {
    fontSize: 16,
    color: '#6B7280',
    marginTop: 12,
    fontWeight: '500',
  },
  modalFooter: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    gap: 10,
  },
  doneButton: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  doneButtonGradient: {
    padding: 16,
    alignItems: 'center',
  },
  doneButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  cancelButton: {
    padding: 16,
    alignItems: 'center',
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6B7280',
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
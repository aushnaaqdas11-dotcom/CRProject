// screens/admin/EditRole.js
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator
} from 'react-native';
import { adminAPI } from '../../services/apiService';
import Icon from 'react-native-vector-icons/FontAwesome';

const EditRole = ({ route, navigation }) => {
  const { roleId } = route.params;
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [roleName, setRoleName] = useState('');

  useEffect(() => {
    loadRoleData();
  }, []);

  const loadRoleData = async () => {
    try {
      const response = await adminAPI.getRoles();
      if (response.data.success) {
        const role = response.data.data.roles.find(r => r.id === parseInt(roleId));
        if (role) {
          setRoleName(role.name);
        } else {
          Alert.alert('Error', 'Role not found');
          navigation.goBack();
        }
      } else {
        Alert.alert('Error', response.data.message || 'Failed to load role data');
      }
    } catch (error) {
      console.log('Load role error:', error);
      const errorMessage = error.response?.data?.message || 'Failed to load role data';
      Alert.alert('Error', errorMessage);
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!roleName.trim()) {
      Alert.alert('Error', 'Please enter role name');
      return;
    }

    setSaving(true);
    try {
      const response = await adminAPI.updateRole(roleId, { name: roleName });
      
      if (response.data.success) {
        Alert.alert('Success', 'Role updated successfully', [
          { text: 'OK', onPress: () => navigation.goBack() }
        ]);
      } else {
        Alert.alert('Error', response.data.message || 'Failed to update role');
      }
    } catch (error) {
      console.log('Update role error:', error);
      const errorMessage = error.response?.data?.message || 'Failed to update role';
      Alert.alert('Error', errorMessage);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2C3E50" />
        <Text style={styles.loadingText}>Loading role data...</Text>
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
        <Text style={styles.headerTitle}>Edit Role</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.formContainer}>
        <View style={styles.formGroup}>
          <Text style={styles.label}>Role Name</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter role name"
                          placeholderTextColor={"#bbb8b8ff"}

            value={roleName}
            onChangeText={setRoleName}
          />
        </View>

        <View style={styles.infoBox}>
          <Icon name="info-circle" size={20} color="#4ECDC4" />
          <Text style={styles.infoText}>
            Editing this role will affect all users assigned to it.
          </Text>
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
              <Text style={styles.submitButtonText}>Update Role</Text>
            </>
          )}
        </TouchableOpacity>
      </ScrollView>
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
  placeholder: {
    width: 30,
  },
  formContainer: {
    flex: 1,
    padding: 20,
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
    color:'black',
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E6FFFA',
    padding: 15,
    borderRadius: 10,
    marginBottom: 20,
  },
  infoText: {
    marginLeft: 10,
    color: '#2C3E50',
    fontSize: 14,
    flex: 1,
  },
  submitButton: {
    backgroundColor: '#4ECDC4',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 15,
    borderRadius: 10,
    marginTop: 10,
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
});

export default EditRole;
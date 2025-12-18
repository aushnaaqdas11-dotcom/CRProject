// screens/admin/CreateUser.js
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import { adminAPI } from '../../services/apiService';
import Icon from 'react-native-vector-icons/FontAwesome';
import LinearGradient from 'react-native-linear-gradient';
import Footer from '../../components/Footer'; // Add this import


const CreateUser = ({ navigation }) => {
  const [loading, setLoading] = useState(false);
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

  useEffect(() => {
    loadRoles();
  }, []);

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
    if (!formData.password) {
      Alert.alert('Error', 'Please enter password');
      return false;
    }
    if (formData.password !== formData.confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return false;
    }
    if (formData.password.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters');
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      const submitData = {
        name: formData.name,
        email: formData.email,
        cnic: formData.cnic,
        phone: formData.phone,
        role: parseInt(formData.role),
        password: formData.password
      };

      const response = await adminAPI.createUser(submitData);
      
      if (response.data.success) {
        Alert.alert('Success', 'User created successfully', [
          { text: 'OK', onPress: () => navigation.goBack() }
        ]);
      } else {
        Alert.alert('Error', response.data.message || 'Failed to create user');
      }
    } catch (error) {
      console.log('Create user error:', error);
      const errorMessage = error.response?.data?.message || 'Failed to create user';
      const errors = error.response?.data?.errors;
      
      if (errors) {
        const errorText = Object.values(errors).flat().join('\n');
        Alert.alert('Validation Error', errorText);
      } else {
        Alert.alert('Error', errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      {/* Header */}
      <LinearGradient
        colors={['#2C3E50', '#4ECDC4']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.header}
      >
      <View style={styles.headerContent}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Icon name="arrow-left" size={20} color="#ffffffff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Create New User</Text>
        <View style={styles.placeholder} />
      </View>
      </LinearGradient>

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.formContainer}>
          <View style={styles.formGroup}>
            <Text style={styles.label}>Full Name</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter full name"
                            placeholderTextColor={"#bbb8b8ff"}

              value={formData.name}
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
                            placeholderTextColor={"#bbb8b8ff"}

              autoCapitalize="none"
              value={formData.email}
              onChangeText={(text) => handleInputChange('email', text)}
              returnKeyType="next"
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>CNIC</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter CNIC"
              value={formData.cnic}
                            placeholderTextColor={"#bbb8b8ff"}

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
              value={formData.phone}
                            placeholderTextColor={"#bbb8b8ff"}

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
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Password</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter password"
              secureTextEntry
                            placeholderTextColor={"#bbb8b8ff"}

              value={formData.password}
              onChangeText={(text) => handleInputChange('password', text)}
              returnKeyType="next"
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Confirm Password</Text>
            <TextInput
              style={styles.input}
              placeholder="Confirm password"
              secureTextEntry
              value={formData.confirmPassword}
              onChangeText={(text) => handleInputChange('confirmPassword', text)}
              returnKeyType="done"
                            placeholderTextColor={"#bbb8b8ff"}

              onSubmitEditing={handleSubmit}
            />
          </View>

          <TouchableOpacity
            style={[styles.submitButton, loading && styles.submitButtonDisabled]}
            onPress={handleSubmit}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Icon name="user-plus" size={20} color="#fff" />
                <Text style={styles.submitButtonText}>Create User</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
              <Footer />

      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f5f7fb' },
   headerContent : {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
 header: {
    paddingHorizontal: 20,
    paddingTop: 45,
    paddingBottom: 20,
  },
  backButton: {
    padding: 5,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffffff',
  },
  placeholder: {
    width: 30,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  formContainer: {
    padding: 20,
    paddingBottom: 40, // Extra padding at bottom for keyboard
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
  roleText: {
    color: '#666',
    fontWeight: '500',
  },
  roleTextSelected: {
    color: '#fff',
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
});

export default CreateUser;
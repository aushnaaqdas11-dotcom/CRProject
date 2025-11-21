import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
  ScrollView,
  Alert,
  Dimensions,
  StatusBar,
  DrawerLayoutAndroid,
  Modal,
  Linking,
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { useAuth } from '../hooks/redux';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/FontAwesome';
import DocumentPicker from 'react-native-document-picker';
import ReactNativeBlobUtil from 'react-native-blob-util';

const { width } = Dimensions.get('window');

// DeveloperDropdown Component
const DeveloperDropdown = ({
  developers,
  assignedTo,
  onSelectDeveloper,
  onClearSelection,
  disabled = false,
}) => {
  const [showDeveloperModal, setShowDeveloperModal] = useState(false);

  const assignedDeveloper = developers.find((d) => d.id === assignedTo);
  const assignedDeveloperName = assignedDeveloper?.name || 'Unknown Developer';
  const assignedDeveloperInitial = assignedDeveloperName.charAt(0).toUpperCase();

  return (
    <View style={styles.dropdownContainer}>
      <Text style={styles.dropdownLabel}>
        {disabled ? 'Completed By Developer:' : 'Assign To Developer:'}
      </Text>

      {disabled ? (
        <View style={styles.disabledDeveloperDisplay}>
          <View style={styles.developerAvatar}>
            <Text style={styles.developerAvatarText}>
              {assignedDeveloperInitial}
            </Text>
          </View>
          <View style={styles.developerInfoStatic}>
            <Text style={styles.developerNameStatic}>{assignedDeveloperName}</Text>
            <Text style={styles.developerIdStatic}>ID: {assignedTo}</Text>
          </View>
          <Icon name="lock" size={16} color="#9CA3AF" style={styles.lockIcon} />
        </View>
      ) : (
        <>
          <TouchableOpacity
            style={[
              styles.dropdownTrigger,
              !assignedTo && styles.dropdownTriggerEmpty,
            ]}
            onPress={() => setShowDeveloperModal(true)}
          >
            <Text
              style={[
                styles.dropdownTriggerText,
                !assignedTo && styles.dropdownTriggerPlaceholder,
              ]}
            >
              {assignedTo ? assignedDeveloperName : 'Select a developer'}
            </Text>
            <Icon
              name={showDeveloperModal ? 'chevron-up' : 'chevron-down'}
              size={16}
              color="#2C3E50"
            />
          </TouchableOpacity>

          <Modal
            visible={showDeveloperModal}
            transparent={true}
            animationType="slide"
            onRequestClose={() => setShowDeveloperModal(false)}
          >
            <View style={styles.modalOverlay}>
              <View style={styles.modalContent}>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>Select Developer</Text>
                  <TouchableOpacity
                    onPress={() => setShowDeveloperModal(false)}
                    style={styles.modalCloseButton}
                  >
                    <Icon name="times" size={20} color="#2C3E50" />
                  </TouchableOpacity>
                </View>

                <ScrollView style={styles.developersList}>
                  {developers.length === 0 ? (
                    <View style={styles.emptyState}>
                      <Icon name="users" size={40} color="#D1D5DB" />
                      <Text style={styles.emptyStateText}>No developers available</Text>
                    </View>
                  ) : (
                    developers.map((developer, index) => (
                      <TouchableOpacity
                        key={developer.id}
                        style={[
                          styles.developerItem,
                          assignedTo === developer.id && styles.developerItemSelected,
                          index === developers.length - 1 && styles.lastDeveloperItem,
                        ]}
                        onPress={() => {
                          onSelectDeveloper(developer.id);
                          setShowDeveloperModal(false);
                        }}
                      >
                        <View style={styles.developerInfo}>
                          <View
                            style={[
                              styles.developerAvatar,
                              assignedTo === developer.id && styles.developerAvatarSelected,
                            ]}
                          >
                            <Text
                              style={[
                                styles.developerAvatarText,
                                assignedTo === developer.id && styles.developerAvatarTextSelected,
                              ]}
                            >
                              {developer.name.charAt(0).toUpperCase()}
                            </Text>
                          </View>
                          <View style={styles.developerDetails}>
                            <Text
                              style={[
                                styles.developerName,
                                assignedTo === developer.id && styles.developerNameSelected,
                              ]}
                            >
                              {developer.name}
                            </Text>
                            <Text style={styles.developerId}>ID: {developer.id}</Text>
                          </View>
                        </View>
                        {assignedTo === developer.id && (
                          <Icon name="check" size={16} color="#4ECDC4" />
                        )}
                      </TouchableOpacity>
                    ))
                  )}
                </ScrollView>

                <View style={styles.modalFooter}>
                  <TouchableOpacity
                    style={styles.cancelButton}
                    onPress={() => setShowDeveloperModal(false)}
                  >
                    <Text style={styles.cancelButtonText}>Cancel</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </Modal>

          {assignedTo && (
            <View style={styles.selectedDeveloperPreview}>
              <View style={styles.selectedDeveloperBadge}>
                <View style={styles.selectedDeveloperAvatar}>
                  <Text style={styles.selectedDeveloperAvatarText}>
                    {assignedDeveloperInitial}
                  </Text>
                </View>
                <Text style={styles.selectedDeveloperName}>
                  {assignedDeveloperName}
                </Text>
                <TouchableOpacity
                  onPress={onClearSelection}
                  style={styles.clearSelectionButton}
                >
                  <Icon name="times" size={12} color="#6B7280" />
                </TouchableOpacity>
              </View>
            </View>
          )}
        </>
      )}
    </View>
  );
};

// Attachment & Pricing Section (Only visible to Assigner when request is completed)
const AttachmentSection = ({ request, onFileUpload, userRole }) => {
  const [uploading, setUploading] = useState(false);
  const [pricing, setPricing] = useState(request.pricing?.toString() || '');

  if (request.status !== 'completed' || userRole !== 4) return null;

  const pickAndUploadFile = async () => {
    try {
      const res = await DocumentPicker.pickSingle({
        type: [
          DocumentPicker.types.images,
          DocumentPicker.types.pdf,
          DocumentPicker.types.plainText,
          'application/msword',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        ],
        copyTo: 'cachesDirectory',
      });

      if (res.size > 5 * 1024 * 1024) {
        Alert.alert('Error', 'File must be smaller than 5MB');
        return;
      }

      const sizeMB = (res.size / (1024 * 1024)).toFixed(2);
      Alert.alert('Upload File', `Upload "${res.name}" (${sizeMB} MB)?`, [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Upload', onPress: () => uploadFile(res) },
      ]);
    } catch (err) {
      if (!DocumentPicker.isCancel(err)) {
        Alert.alert('Error', 'Could not pick file');
      }
    }
  };

  const uploadFile = async (file) => {
    try {
      setUploading(true);

      let base64 = '';
      let fileName = 'attachment';
      let fileType = 'application/octet-stream';

      if (file) {
        const path = file.fileCopyUri.replace('file://', '');
        base64 = await ReactNativeBlobUtil.fs.readFile(path, 'base64');
        fileName = file.name || file.uri?.split('/').pop() || `file_${Date.now()}`;
        fileType = file.type || 'application/octet-stream';

        if (!fileName.includes('.')) {
          const ext = fileType.includes('pdf')
            ? '.pdf'
            : fileType.includes('word')
            ? '.docx'
            : fileType.includes('image')
            ? '.jpg'
            : '.bin';
          fileName += ext;
        }
      }

      const fileData = {
        file_name: file ? fileName : 'pricing_only.txt',
        file_data: file
          ? `data:${fileType};base64,${base64}`
          : 'data:text/plain;base64,',
        file_type: file ? fileType : 'text/plain',
        pricing: pricing ? parseFloat(pricing) : null,
      };

      await onFileUpload(fileData);
      Alert.alert('Success', file ? 'Attachment uploaded successfully!' : 'Pricing updated successfully!');
    } catch (error) {
      console.error('Upload error:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Upload failed';
      Alert.alert('Upload Failed', errorMessage);
    } finally {
      setUploading(false);
    }
  };

  const downloadAttachment = async () => {
    if (!request.attachment) return;

    const BASE_URL = 'http://10.50.206.142:8000';
    let url = request.attachment.startsWith('http')
      ? request.attachment
      : `${BASE_URL}/${request.attachment}`;

    try {
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
      } else {
        Alert.alert('Open File', 'Download and open this file?', [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Download', onPress: () => downloadAndOpenFile(url, request.attachment) },
        ]);
      }
    } catch (err) {
      console.error('Linking error:', err);
      Alert.alert('Error', 'Could not open file directly. Downloading...');
      downloadAndOpenFile(url, request.attachment);
    }
  };

  const downloadAndOpenFile = async (url, attachmentPath) => {
    try {
      const fileName = attachmentPath.split('/').pop() || 'download';
      const downloadDir = ReactNativeBlobUtil.fs.dirs.DownloadDir;
      const filePath = `${downloadDir}/${fileName}`;

      const res = await ReactNativeBlobUtil.config({
        fileCache: true,
        path: filePath,
        addAndroidDownloads: {
          useDownloadManager: true,
          notification: true,
          title: fileName,
          description: 'Downloading attachment',
          mime: getMimeType(fileName),
        },
      }).fetch('GET', url);

      ReactNativeBlobUtil.android.actionViewIntent(res.path(), getMimeType(fileName));
    } catch (error) {
      console.error('Download failed:', error);
      Alert.alert('Error', 'Could not download or open the file');
    }
  };

  const getMimeType = (filename) => {
    const ext = filename.split('.').pop().toLowerCase();
    const mimeTypes = {
      jpg: 'image/jpeg',
      jpeg: 'image/jpeg',
      png: 'image/png',
      pdf: 'application/pdf',
      doc: 'application/msword',
      docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      txt: 'text/plain',
    };
    return mimeTypes[ext] || 'application/octet-stream';
  };

  return (
    <View style={styles.detailCard}>
      <Text style={styles.cardTitle}>Attachment & Pricing</Text>

      <View style={styles.pricingSection}>
        <Text style={styles.label}>Pricing ($):</Text>
        <TextInput
          value={pricing}
          onChangeText={setPricing}
          placeholder="Enter amount"
          placeholderTextColor="#9CA3AF"
          keyboardType="numeric"
          style={styles.pricingInput}
        />
      </View>

      {request.attachment && (
        <View style={styles.attachmentSection}>
          <Text style={styles.label}>Current Attachment:</Text>
          <TouchableOpacity style={styles.attachmentButton} onPress={downloadAttachment}>
            <View style={styles.attachmentInfo}>
              <Icon name="paperclip" size={16} color="#4ECDC4" />
              <Text style={styles.attachmentText} numberOfLines={1}>
                {request.attachment.split('/').pop() || 'Download File'}
              </Text>
            </View>
            <Icon name="download" size={16} color="#2C3E50" />
          </TouchableOpacity>
        </View>
      )}

      <View style={styles.uploadSection}>
        <Text style={styles.label}>
          {request.attachment ? 'Replace Attachment:' : 'Upload Attachment:'}
        </Text>
        <TouchableOpacity
          style={[styles.uploadButton, uploading && styles.uploadButtonDisabled]}
          onPress={pickAndUploadFile}
          disabled={uploading}
        >
          <LinearGradient colors={['#667eea', '#764ba2']} style={styles.uploadButtonGradient}>
            <View style={styles.uploadButtonContent}>
              {uploading ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <>
                  <Icon name="cloud-upload" size={16} color="#fff" />
                  <Text style={styles.uploadButtonText}>
                    {request.attachment ? 'Replace File' : 'Choose File'}
                  </Text>
                </>
              )}
            </View>
          </LinearGradient>
        </TouchableOpacity>
        <Text style={styles.uploadHint}>PDF, DOC, DOCX, JPG, PNG • Max 5MB</Text>
      </View>

      <View style={styles.saveButtonsContainer}>
        <TouchableOpacity
          style={[
            styles.saveButton,
            styles.savePricingOnlyButton,
            (uploading || !pricing) && styles.saveButtonDisabled,
          ]}
          onPress={() => uploadFile(null)}
          disabled={uploading || !pricing}
        >
          <LinearGradient colors={['#6B7280', '#4B5563']} style={styles.saveButtonGradient}>
            <Text style={styles.saveButtonText}>
              {uploading ? 'Saving...' : 'Save Pricing Only'}
            </Text>
          </LinearGradient>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.saveButton, uploading && styles.saveButtonDisabled]}
          onPress={() => uploadFile(null)}
          disabled={uploading}
        >
          <LinearGradient colors={['#10B981', '#059669']} style={styles.saveButtonGradient}>
            <Text style={styles.saveButtonText}>
              {uploading ? 'Saving...' : 'Save All Changes'}
            </Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const RequestDetailScreen = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const { userApi, logout, user } = useAuth();
  const { requestId } = route.params;
  const drawerRef = useRef(null);

  const [loading, setLoading] = useState(true);
  const [request, setRequest] = useState(null);
  const [developers, setDevelopers] = useState([]);
  const [assignedTo, setAssignedTo] = useState('');
  const [assignerComment, setAssignerComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const fetchRequestDetails = async (signal) => {
    try {
      setError(null);
      const res = await userApi.assigner.getRequestDetails(requestId, { signal });

      if (res.data?.success) {
        const selected = res.data.request;
        if (selected) {
          setRequest(selected);
          const developerId = selected.assigner?.developer_id;
          setAssignedTo(developerId || '');
          setAssignerComment(selected.assigner?.assigner_comment || '');
          return true;
        } else {
          setRequest(null);
          setError('Request not found.');
          return false;
        }
      } else {
        setError(res.data?.message || 'Failed to load request details.');
        return false;
      }
    } catch (error) {
      if (error.name !== 'AbortError') {
        const errorMsg = error.response?.data?.message || error.message || 'Failed to load request details.';
        setError(errorMsg);
      }
      return false;
    }
  };

  const fetchDevelopers = async (signal) => {
    try {
      const res = await userApi.assigner.getDevelopers({ signal });
      if (res.data?.success && Array.isArray(res.data.developers)) {
        const mapped = res.data.developers
          .map((dev) => ({ id: dev.id, name: dev.name }))
          .filter((dev) => dev.id);
        setDevelopers(mapped);
      } else {
        setDevelopers([]);
      }
    } catch (err) {
      if (err.name !== 'AbortError') {
        console.log('Developers fetch error:', err.message);
      }
    }
  };

  const handleFileUpload = async (fileData) => {
    try {
      const response = await userApi.assigner.uploadFileAndPricing(
        requestId,
        fileData.file_data,
        fileData.file_name,
        fileData.file_type,
        fileData.pricing
      );

      if (response.data?.success) {
        await fetchRequestDetails();
      } else {
        throw new Error(response.data?.message || 'Upload failed');
      }
    } catch (error) {
      console.error('File upload error:', error);
      throw error;
    }
  };

  useEffect(() => {
    const abortController = new AbortController();
    let isMounted = true;

    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);
        const success = await fetchRequestDetails(abortController.signal);
        if (success && isMounted) {
          await fetchDevelopers(abortController.signal);
        }
      } catch (error) {
        if (isMounted) setError('Failed to load data.');
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadData();

    return () => {
      isMounted = false;
      abortController.abort();
    };
  }, [requestId]);

  const handleAssign = async (newStatus) => {
    if (!assignedTo || !assignerComment) {
      Alert.alert('Missing Fields', 'Please select a developer and enter a comment.');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);

      const data = {
        request_id: requestId,
        developer_id: assignedTo,
        assigner_comment: assignerComment,
        status: newStatus,
      };

      const res = await userApi.assigner.assignToDeveloper(data);

      if (res.data?.success) {
        Alert.alert('Success', 'Request updated successfully!', [
          { text: 'OK', onPress: () => fetchRequestDetails() },
        ]);
      } else {
        Alert.alert('Failed', res.data?.message || 'Action failed');
      }
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Network error';
      Alert.alert('Error', msg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleSelectDeveloper = (developerId) => setAssignedTo(developerId);
  const handleClearSelection = () => setAssignedTo('');

  if (loading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color="#2C3E50" />
        <Text style={styles.loadingText}>Loading Request Details...</Text>
      </View>
    );
  }

  if (error && !request) {
    return (
      <View style={styles.container}>
        <StatusBar backgroundColor="#2C3E50" barStyle="light-content" />
        <View style={styles.navbar}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Icon name="arrow-left" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.navbarTitle}>Request Details</Text>
          <View style={{ width: 24 }} />
        </View>
        <View style={styles.errorContainer}>
          <Text style={styles.errorTitle}>Error Loading Request</Text>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      </View>
    );
  }

  if (!request) {
    return (
      <View style={styles.container}>
        <StatusBar backgroundColor="#2C3E50" barStyle="light-content" />
        <View style={styles.navbar}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Icon name="arrow-left" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.navbarTitle}>Request Details</Text>
          <View style={{ width: 24 }} />
        </View>
        <View style={styles.errorContainer}>
          <Text style={styles.errorTitle}>Request Not Found</Text>
        </View>
      </View>
    );
  }

  const safeRequest = {
    id: request.id,
    project: request.project || { name: 'N/A' },
    user: request.user || { name: 'N/A' },
    service: request.service || { name: 'N/A' },
    priority: request.priority || 'N/A',
    status: request.status || 'N/A',
    request_details: request.request_details || 'No details provided',
    attachment: request.attachment || null,
    pricing: request.pricing || null,
    assigner: request.assigner || null,
  };

  const assignedDeveloperId = safeRequest.assigner?.developer_id;
  const assignedDeveloper = developers.find((d) => d.id === assignedDeveloperId);
  const assignedDeveloperName = assignedDeveloper?.name || 'Not Assigned';

  return (
    <DrawerLayoutAndroid
      ref={drawerRef}
      drawerWidth={300}
      drawerPosition="left"
      renderNavigationView={() => (
        <View style={styles.drawerContainer}>
          <LinearGradient colors={['#2C3E50', '#4ECDC4']} style={styles.drawerHeader}>
            <View style={styles.drawerHeaderContent}>
              <View style={styles.userAvatar}>
                <Icon name="user" size={40} color="#fff" />
              </View>
              <Text style={styles.drawerUserName}>{user?.name || 'User'}</Text>
              <Text style={styles.drawerUserRole}>Assigner</Text>
            </View>
          </LinearGradient>
          <View style={styles.drawerMenu}>
            <TouchableOpacity style={styles.drawerItem} onPress={() => navigation.navigate('AssignerDashboard')}>
              <Icon name="home" size={20} color="#2C3E50" />
              <Text style={styles.drawerItemText}>Dashboard</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.drawerItem, styles.logoutDrawerItem]} onPress={logout}>
              <Icon name="sign-out" size={20} color="#e74c3c" />
              <Text style={[styles.drawerItemText, styles.logoutText]}>Logout</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    >
      <View style={styles.container}>
        <StatusBar backgroundColor="#2C3E50" barStyle="light-content" />

        <View style={styles.navbar}>
          <TouchableOpacity onPress={() => drawerRef.current?.openDrawer()}>
            <Icon name="bars" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.navbarTitle}>Request Details</Text>
          <Text style={styles.navbarSubtitle}>Status: {safeRequest.status.toUpperCase()}</Text>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.detailCard}>
            <Text style={styles.cardTitle}>Request Information</Text>

            <View style={styles.detailRow}>
              <Text style={styles.label}>Project:</Text>
              <Text style={styles.value}>{safeRequest.project.name}</Text>
            </View>

            <View style={styles.detailRow}>
              <Text style={styles.label}>User:</Text>
              <Text style={styles.value}>{safeRequest.user.name}</Text>
            </View>

            <View style={styles.detailRow}>
              <Text style={styles.label}>Service:</Text>
              <Text style={styles.value}>{safeRequest.service.name}</Text>
            </View>

            <View style={styles.detailRow}>
              <Text style={styles.label}>Priority:</Text>
              <Text style={[styles.value, { color: priorityColor(safeRequest.priority) }]}>
                {safeRequest.priority}
              </Text>
            </View>

            <View style={styles.detailRow}>
              <Text style={styles.label}>Status:</Text>
              <Text style={[styles.value, { color: statusColor(safeRequest.status) }]}>
                {safeRequest.status.toUpperCase()}
              </Text>
            </View>

            <View style={styles.detailRow}>
              <Text style={styles.label}>Assigned Developer:</Text>
              <View style={styles.assignedDeveloperValue}>
                <View style={styles.developerAvatarSmall}>
                  <Text style={styles.developerAvatarSmallText}>
                    {assignedDeveloperName.charAt(0).toUpperCase()}
                  </Text>
                </View>
                <Text style={styles.assignedDeveloperName}>{assignedDeveloperName}</Text>
              </View>
            </View>

            <View style={styles.detailSection}>
              <Text style={styles.label}>Request Details:</Text>
              <Text style={styles.detailsText}>{safeRequest.request_details}</Text>
            </View>
          </View>

          <AttachmentSection request={safeRequest} onFileUpload={handleFileUpload} userRole={user?.role} />

          <View style={styles.detailCard}>
            <Text style={styles.cardTitle}>
              {safeRequest.status === 'completed' ? 'Completed Request' : 'Assignment'}
            </Text>

            {(safeRequest.status === 'pending' || safeRequest.status === 'inprogress') && (
              <>
                <DeveloperDropdown
                  developers={developers}
                  assignedTo={assignedTo}
                  onSelectDeveloper={handleSelectDeveloper}
                  onClearSelection={handleClearSelection}
                  disabled={false}
                />

                <View style={styles.detailSection}>
                  <Text style={styles.label}>Assigner Comment:</Text>
                  <TextInput
                    value={assignerComment}
                    onChangeText={setAssignerComment}
                    placeholder="Enter your comments for the developer..."
                    placeholderTextColor="#9CA3AF"
                    multiline
                    style={styles.textArea}
                  />
                </View>

                <View style={styles.actionButtons}>
                  <TouchableOpacity
                    style={[
                      styles.assignBtn,
                      (submitting || !assignedTo || !assignerComment) && styles.assignBtnDisabled,
                    ]}
                    disabled={submitting || !assignedTo || !assignerComment}
                    onPress={() => handleAssign('inprogress')}
                  >
                    <LinearGradient colors={['#2C3E50', '#4ECDC4']} style={styles.buttonGradient}>
                      <View style={styles.buttonContent}>
                        {submitting && <ActivityIndicator size="small" color="#fff" style={styles.buttonSpinner} />}
                        <Text style={styles.buttonText}>
                          {submitting
                            ? 'Assigning...'
                            : safeRequest.assigner
                            ? 'Reassign Developer'
                            : 'Assign Request'}
                        </Text>
                      </View>
                    </LinearGradient>
                  </TouchableOpacity>

                  {safeRequest.status === 'inprogress' && (
                    <TouchableOpacity
                      style={[styles.completeBtn, submitting && styles.assignBtnDisabled]}
                      disabled={submitting}
                      onPress={() => handleAssign('completed')}
                    >
                      <LinearGradient colors={['#10B981', '#059669']} style={styles.buttonGradient}>
                        <View style={styles.buttonContent}>
                          {submitting && <ActivityIndicator size="small" color="#fff" style={styles.buttonSpinner} />}
                          <Text style={styles.buttonText}>
                            {submitting ? 'Completing...' : 'Mark as Completed'}
                          </Text>
                        </View>
                      </LinearGradient>
                    </TouchableOpacity>
                  )}
                </View>
              </>
            )}

            {safeRequest.status === 'completed' && (
              <View style={styles.completedAssignment}>
                <Text style={styles.label}>Completed By Developer:</Text>
                <DeveloperDropdown
                  developers={developers}
                  assignedTo={safeRequest.assigner?.developer_id}
                  onSelectDeveloper={() => {}}
                  onClearSelection={() => {}}
                  disabled={true}
                />
                <View style={styles.completedInfo}>
                  <Icon name="check-circle" size={40} color="#10B981" />
                  <Text style={styles.completedText}>
                    This request has been completed by {assignedDeveloperName}.
                  </Text>
                </View>
              </View>
            )}
          </View>
        </ScrollView>
      </View>
    </DrawerLayoutAndroid>
  );
};

const statusColor = (status) => {
  switch (status?.toLowerCase()) {
    case 'pending': return '#F59E0B';
    case 'inprogress': return '#3B82F6';
    case 'completed': return '#10B981';
    default: return '#6B7280';
  }
};

const priorityColor = (priority) => {
  switch (priority?.toLowerCase()) {
    case 'high': return '#DC2626';
    case 'normal': return '#3B82F6';
    case 'low': return '#059669';
    default: return '#374151';
  }
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  scrollContent: { flexGrow: 1, paddingBottom: 20 },
  loader: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F8FAFC' },
  loadingText: { marginTop: 10, fontSize: 16, color: '#2C3E50' },
  navbar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#2C3E50',
    paddingHorizontal: 16,
    paddingTop: 35,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#34495e',
  },
  navbarTitle: { fontSize: 18, fontWeight: 'bold', color: '#fff' },
  navbarSubtitle: { fontSize: 12, color: '#fff', opacity: 0.8, marginTop: 2 },
  detailCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 25,
    margin: 20,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2C3E50',
    marginBottom: 20,
    textAlign: 'center',
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  detailSection: { marginBottom: 20 },
  label: { fontWeight: '600', color: '#374151', fontSize: 14, flex: 1 },
  value: { fontSize: 16, color: '#111827', fontWeight: '500', flex: 1, textAlign: 'right' },
  detailsText: {
    fontSize: 16,
    color: '#374151',
    lineHeight: 24,
    marginTop: 8,
    backgroundColor: '#f8fafc',
    padding: 15,
    borderRadius: 10,
    borderLeftWidth: 4,
    borderLeftColor: '#4ECDC4',
  },
  assignedDeveloperValue: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    flex: 1,
  },
  developerAvatarSmall: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#4ECDC4',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  developerAvatarSmallText: { color: '#fff', fontSize: 12, fontWeight: 'bold' },
  assignedDeveloperName: { fontSize: 14, fontWeight: '600', color: '#2C3E50' },
  textArea: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 15,
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    fontSize: 16,
    color: '#000000',
    height: 100,
    textAlignVertical: 'top',
  },
  buttonGradient: { padding: 16, borderRadius: 12, alignItems: 'center' },
  buttonText: { color: 'white', fontSize: 16, fontWeight: '600' },
  assignBtn: {
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  assignBtnDisabled: { opacity: 0.6 },
  completeBtn: {
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
    marginTop: 12,
  },
  actionButtons: { gap: 12 },
  errorContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  errorTitle: { fontSize: 20, fontWeight: '700', color: '#DC2626', marginBottom: 10 },
  errorText: { fontSize: 14, color: '#DC2626', textAlign: 'center' },
  drawerContainer: { flex: 1, backgroundColor: '#fff' },
  drawerHeader: { padding: 20, paddingTop: 60, paddingBottom: 30 },
  drawerHeaderContent: { alignItems: 'center' },
  userAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
  },
  drawerUserName: { fontSize: 20, fontWeight: 'bold', color: '#fff', marginBottom: 5 },
  drawerUserRole: { fontSize: 14, color: '#fff', opacity: 0.8 },
  drawerMenu: { flex: 1, padding: 20 },
  drawerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    paddingHorizontal: 10,
    borderRadius: 8,
    marginBottom: 5,
  },
  drawerItemText: { fontSize: 16, color: '#2C3E50', marginLeft: 15, fontWeight: '500' },
  logoutDrawerItem: { marginTop: 'auto', marginBottom: 20 },
  logoutText: { color: '#e74c3c' },
  dropdownContainer: { marginBottom: 20 },
  dropdownLabel: { fontWeight: '600', color: '#374151', fontSize: 14, marginBottom: 8 },
  dropdownTrigger: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 16,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dropdownTriggerEmpty: { borderColor: '#D1D5DB' },
  dropdownTriggerText: { fontSize: 16, color: '#2C3E50', fontWeight: '500' },
  dropdownTriggerPlaceholder: { color: '#9CA3AF' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20, maxHeight: '80%' },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  modalTitle: { fontSize: 18, fontWeight: 'bold', color: '#2C3E50' },
  modalCloseButton: { padding: 4 },
  developersList: { maxHeight: 400 },
  developerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  developerItemSelected: { backgroundColor: '#F0F9FF', borderLeftWidth: 4, borderLeftColor: '#4ECDC4' },
  lastDeveloperItem: { borderBottomWidth: 0 },
  developerInfo: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  developerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E5E7EB',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  developerAvatarSelected: { backgroundColor: '#4ECDC4' },
  developerAvatarText: { color: '#6B7280', fontSize: 16, fontWeight: 'bold' },
  developerAvatarTextSelected: { color: '#fff' },
  developerDetails: { flex: 1 },
  developerName: { fontSize: 16, fontWeight: '600', color: '#2C3E50', marginBottom: 2 },
  developerNameSelected: { color: '#4ECDC4' },
  developerId: { fontSize: 12, color: '#6B7280' },
  selectedDeveloperPreview: { marginTop: 12 },
  selectedDeveloperBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0F9FF',
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#4ECDC4',
    alignSelf: 'flex-start',
  },
  selectedDeveloperAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#4ECDC4',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  selectedDeveloperAvatarText: { color: '#fff', fontSize: 14, fontWeight: 'bold' },
  selectedDeveloperName: { fontSize: 14, fontWeight: '600', color: '#2C3E50', marginRight: 8 },
  clearSelectionButton: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyState: { padding: 40, alignItems: 'center', justifyContent: 'center' },
  emptyStateText: { fontSize: 16, color: '#6B7280', marginTop: 12, fontWeight: '500' },
  modalFooter: { padding: 20, borderTopWidth: 1, borderTopColor: '#F3F4F6' },
  cancelButton: { padding: 16, alignItems: 'center', borderRadius: 12, backgroundColor: '#F3F4F6' },
  cancelButtonText: { fontSize: 16, fontWeight: '600', color: '#6B7280' },
  buttonContent: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  buttonSpinner: { marginRight: 8 },
  attachmentSection: { marginBottom: 20 },
  attachmentButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    padding: 15,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginTop: 8,
  },
  attachmentInfo: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  attachmentText: { marginLeft: 10, color: '#2C3E50', fontWeight: '500', flex: 1 },
  uploadSection: { marginBottom: 20 },
  uploadButton: {
    borderRadius: 12,
    overflow: 'hidden',
    marginTop: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  uploadButtonDisabled: { opacity: 0.6 },
  uploadButtonGradient: { padding: 16, alignItems: 'center' },
  uploadButtonContent: { flexDirection: 'row', alignItems: 'center' },
  uploadButtonText: { color: 'white', fontSize: 16, fontWeight: '600', marginLeft: 8 },
  uploadHint: { fontSize: 12, color: '#6B7280', marginTop: 8, fontStyle: 'italic' },
  pricingSection: { marginBottom: 20 },
  pricingInput: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 15,
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    fontSize: 16,
    color: '#000000',
  },
  saveButtonsContainer: { flexDirection: 'row', gap: 10, marginTop: 15 },
  saveButton: { flex: 1, borderRadius: 12, overflow: 'hidden' },
  saveButtonDisabled: { opacity: 0.6 },
  saveButtonGradient: { padding: 16, alignItems: 'center' },
  saveButtonText: { color: 'white', fontSize: 14, fontWeight: '600' },
  savePricingOnlyButton: { flex: 1 },
  completedAssignment: { marginBottom: 10 },
  completedInfo: {
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#F0FDF4',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#BBF7D0',
    marginTop: 15,
  },
  completedText: {
    fontSize: 16,
    color: '#374151',
    textAlign: 'center',
    marginTop: 10,
    lineHeight: 24,
    fontWeight: '500',
  },
  disabledDeveloperDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    padding: 16,
    borderWidth: 2,
    borderColor: '#D1D5DB',
  },
  developerInfoStatic: { flex: 1, marginLeft: 12 },
  developerNameStatic: { fontSize: 16, fontWeight: '600', color: '#374151', marginBottom: 2 },
  developerIdStatic: { fontSize: 12, color: '#6B7280' },
  lockIcon: { marginLeft: 'auto' },
});

export default RequestDetailScreen;
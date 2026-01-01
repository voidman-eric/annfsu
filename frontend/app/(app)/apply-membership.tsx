import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
  ActivityIndicator,
  Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import api from '../../utils/api';
import { useAuth } from '../../contexts/AuthContext';

export default function MembershipApplicationScreen() {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    full_name: '',
    address: '',
    institution: '',
    committee: 'central',
    position: '',
    phone: '',
    blood_group: '',
    photo: null as string | null,
  });
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const updateField = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Camera roll permissions are required');
      return;
    }

    const result = await ImagePicker.launchImagePickerAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [3, 4],
      quality: 0.5,
      base64: true,
    });

    if (!result.canceled && result.assets[0].base64) {
      setFormData(prev => ({ ...prev, photo: `data:image/jpeg;base64,${result.assets[0].base64}` }));
    }
  };

  const validateForm = () => {
    if (!formData.full_name || !formData.address || !formData.institution || !formData.phone) {
      Alert.alert('Error', 'Please fill all required fields');
      return false;
    }

    if (formData.phone.length !== 10) {
      Alert.alert('Error', 'Phone number must be 10 digits');
      return false;
    }

    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      // Update user profile with membership details
      await api.put(`/api/members/${user?.id}`, formData);
      
      // Apply for membership (changes role to member, status to pending)
      await api.post('/api/membership/apply');

      Alert.alert(
        'Success!',
        'तपाईंको सदस्यता आवेदन समीक्षामा छ। (Your membership application is under review)',
        [{ text: 'OK', onPress: () => router.back() }]
      );
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.detail || error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color="#DC143C" />
          </TouchableOpacity>
          <Text style={styles.title}>सदस्यता आवेदन फारम</Text>
          <Text style={styles.subtitle}>Membership Application Form</Text>
        </View>

        <View style={styles.form}>
          <Text style={styles.sectionTitle}>Personal Information</Text>

          <TextInput
            style={styles.input}
            placeholder="Full Name *"
            placeholderTextColor="#999"
            value={formData.full_name}
            onChangeText={(value) => updateField('full_name', value)}
            editable={!loading}
          />

          <TextInput
            style={styles.input}
            placeholder="Address *"
            placeholderTextColor="#999"
            value={formData.address}
            onChangeText={(value) => updateField('address', value)}
            editable={!loading}
          />

          <TextInput
            style={styles.input}
            placeholder="Educational Institution *"
            placeholderTextColor="#999"
            value={formData.institution}
            onChangeText={(value) => updateField('institution', value)}
            editable={!loading}
          />

          <TextInput
            style={styles.input}
            placeholder="Phone Number (10 digits) *"
            placeholderTextColor="#999"
            value={formData.phone}
            onChangeText={(value) => updateField('phone', value)}
            keyboardType="phone-pad"
            maxLength={10}
            editable={!loading}
          />

          <TextInput
            style={styles.input}
            placeholder="Blood Group (Optional)"
            placeholderTextColor="#999"
            value={formData.blood_group}
            onChangeText={(value) => updateField('blood_group', value)}
            editable={!loading}
          />

          <Text style={styles.sectionTitle}>Organization Information</Text>

          <View style={styles.pickerContainer}>
            <Text style={styles.pickerLabel}>Committee *</Text>
            <View style={styles.pickerButtons}>
              {['central', 'provincial', 'district', 'campus'].map((comm) => (
                <TouchableOpacity
                  key={comm}
                  style={[
                    styles.pickerButton,
                    formData.committee === comm && styles.pickerButtonActive
                  ]}
                  onPress={() => updateField('committee', comm)}
                  disabled={loading}
                >
                  <Text style={[
                    styles.pickerButtonText,
                    formData.committee === comm && styles.pickerButtonTextActive
                  ]}>
                    {comm.charAt(0).toUpperCase() + comm.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <TextInput
            style={styles.input}
            placeholder="Position (Optional)"
            placeholderTextColor="#999"
            value={formData.position}
            onChangeText={(value) => updateField('position', value)}
            editable={!loading}
          />

          <View style={styles.photoSection}>
            <Text style={styles.photoLabel}>Upload Photo (Optional)</Text>
            {formData.photo ? (
              <View style={styles.photoPreview}>
                <Image source={{ uri: formData.photo }} style={styles.photoImage} />
                <TouchableOpacity
                  style={styles.changePhotoButton}
                  onPress={pickImage}
                  disabled={loading}
                >
                  <Text style={styles.changePhotoText}>Change Photo</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity
                style={styles.uploadButton}
                onPress={pickImage}
                disabled={loading}
              >
                <Ionicons name="camera" size={32} color="#DC143C" />
                <Text style={styles.uploadText}>Tap to upload photo</Text>
              </TouchableOpacity>
            )}
          </View>

          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleSubmit}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.buttonText}>आवेदन पेश गर्नुहोस्</Text>
            )}
          </TouchableOpacity>

          <Text style={styles.infoText}>
            * Required fields{'\n'}
            Your application will be reviewed by admin
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  scrollContent: {
    flexGrow: 1,
    padding: 24,
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
    marginTop: 40,
  },
  backButton: {
    position: 'absolute',
    left: 0,
    top: 0,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#DC143C',
    textAlign: 'center',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  form: {
    width: '100%',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
    marginTop: 8,
  },
  input: {
    height: 50,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 16,
    marginBottom: 16,
    fontSize: 14,
    backgroundColor: '#f9f9f9',
  },
  pickerContainer: {
    marginBottom: 16,
  },
  pickerLabel: {
    fontSize: 14,
    color: '#333',
    marginBottom: 8,
    fontWeight: '600',
  },
  pickerButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  pickerButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    backgroundColor: '#f9f9f9',
  },
  pickerButtonActive: {
    backgroundColor: '#DC143C',
    borderColor: '#DC143C',
  },
  pickerButtonText: {
    fontSize: 12,
    color: '#666',
  },
  pickerButtonTextActive: {
    color: '#fff',
    fontWeight: 'bold',
  },
  photoSection: {
    marginBottom: 24,
  },
  photoLabel: {
    fontSize: 14,
    color: '#333',
    marginBottom: 12,
    fontWeight: '600',
  },
  uploadButton: {
    height: 150,
    borderWidth: 2,
    borderColor: '#DC143C',
    borderStyle: 'dashed',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFF5F5',
  },
  uploadText: {
    marginTop: 8,
    fontSize: 14,
    color: '#DC143C',
  },
  photoPreview: {
    alignItems: 'center',
  },
  photoImage: {
    width: 150,
    height: 180,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#DC143C',
  },
  changePhotoButton: {
    marginTop: 12,
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
  },
  changePhotoText: {
    fontSize: 14,
    color: '#DC143C',
    fontWeight: '600',
  },
  button: {
    backgroundColor: '#DC143C',
    height: 50,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
  },
  buttonDisabled: {
    backgroundColor: '#999',
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  infoText: {
    marginTop: 16,
    textAlign: 'center',
    color: '#666',
    fontSize: 12,
    lineHeight: 18,
  },
});

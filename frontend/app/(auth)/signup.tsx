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
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import api from '../../utils/api';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function SignUpScreen() {
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    address: '',
    institution: '',
    committee: 'central',
    position: '',
    blood_group: '',
  });
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const updateField = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const validateForm = () => {
    if (!formData.full_name || !formData.email || !formData.password || !formData.phone || !formData.address || !formData.institution) {
      Alert.alert('त्रुटि', 'कृपया सबै आवश्यक फिल्डहरू भर्नुहोस्');
      return false;
    }

    if (formData.password !== formData.confirmPassword) {
      Alert.alert('त्रुटि', 'पासवर्ड मेल खाएन');
      return false;
    }

    if (formData.password.length < 6) {
      Alert.alert('त्रुटि', 'पासवर्ड कम्तिमा ६ अक्षरको हुनुपर्छ');
      return false;
    }

    if (formData.phone.length !== 10) {
      Alert.alert('त्रुटि', 'फोन नम्बर १० अंकको हुनुपर्छ');
      return false;
    }

    return true;
  };

  const handleSignUp = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      const response = await api.post('/api/auth/signup', {
        full_name: formData.full_name,
        email: formData.email,
        password: formData.password,
        phone: formData.phone,
        address: formData.address,
        institution: formData.institution,
        committee: formData.committee,
        position: formData.position || null,
        blood_group: formData.blood_group || null,
        photo: null,
      });

      // Save token and user data
      const { access_token, user } = response.data;
      await AsyncStorage.setItem('auth_token', access_token);
      await AsyncStorage.setItem('user_data', JSON.stringify(user));

      Alert.alert(
        'सफल!',
        'तपाईंको खाता सफलतापूर्वक सिर्जना भयो। सदस्यता प्राप्त गर्न आवेदन दिनुहोस्।',
        [{ text: 'ठीक छ', onPress: () => router.replace('/(app)/home') }]
      );
    } catch (error: any) {
      Alert.alert('साइन अप असफल', error.response?.data?.detail || error.message);
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
          <Text style={styles.title}>नयाँ खाता बनाउनुहोस्</Text>
          <Text style={styles.subtitle}>Sign Up</Text>
        </View>

        <View style={styles.form}>
          <Text style={styles.sectionTitle}>व्यक्तिगत जानकारी</Text>

          <TextInput
            style={styles.input}
            placeholder="पूरा नाम *"
            placeholderTextColor="#999"
            value={formData.full_name}
            onChangeText={(value) => updateField('full_name', value)}
            editable={!loading}
          />

          <TextInput
            style={styles.input}
            placeholder="इमेल *"
            placeholderTextColor="#999"
            value={formData.email}
            onChangeText={(value) => updateField('email', value)}
            keyboardType="email-address"
            autoCapitalize="none"
            editable={!loading}
          />

          <TextInput
            style={styles.input}
            placeholder="पासवर्ड (कम्तिमा ६ अक्षर) *"
            placeholderTextColor="#999"
            value={formData.password}
            onChangeText={(value) => updateField('password', value)}
            secureTextEntry
            editable={!loading}
          />

          <TextInput
            style={styles.input}
            placeholder="पासवर्ड पुष्टि गर्नुहोस् *"
            placeholderTextColor="#999"
            value={formData.confirmPassword}
            onChangeText={(value) => updateField('confirmPassword', value)}
            secureTextEntry
            editable={!loading}
          />

          <TextInput
            style={styles.input}
            placeholder="फोन नम्बर (१० अंक) *"
            placeholderTextColor="#999"
            value={formData.phone}
            onChangeText={(value) => updateField('phone', value)}
            keyboardType="phone-pad"
            maxLength={10}
            editable={!loading}
          />

          <TextInput
            style={styles.input}
            placeholder="ठेगाना *"
            placeholderTextColor="#999"
            value={formData.address}
            onChangeText={(value) => updateField('address', value)}
            editable={!loading}
          />

          <TextInput
            style={styles.input}
            placeholder="शैक्षिक संस्था *"
            placeholderTextColor="#999"}
            value={formData.institution}
            onChangeText={(value) => updateField('institution', value)}
            editable={!loading}
          />

          <Text style={styles.sectionTitle}>संगठन जानकारी</Text>

          <View style={styles.pickerContainer}>
            <Text style={styles.pickerLabel}>समिति *</Text>
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
                    {comm === 'central' ? 'केन्द्रीय' : 
                     comm === 'provincial' ? 'प्रादेशिक' : 
                     comm === 'district' ? 'जिल्ला' : 'क्याम्पस'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <TextInput
            style={styles.input}
            placeholder="पद (वैकल्पिक)"
            placeholderTextColor="#999"
            value={formData.position}
            onChangeText={(value) => updateField('position', value)}
            editable={!loading}
          />

          <TextInput
            style={styles.input}
            placeholder="रगत समूह (वैकल्पिक)"
            placeholderTextColor="#999"
            value={formData.blood_group}
            onChangeText={(value) => updateField('blood_group', value)}
            editable={!loading}
          />

          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleSignUp}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.buttonText}>साइन अप गर्नुहोस्</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.linkButton}
            onPress={() => router.back()}
            disabled={loading}
          >
            <Text style={styles.linkText}>पहिले नै खाता छ? लग इन गर्नुहोस्</Text>
          </TouchableOpacity>
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
    fontSize: 24,
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
    fontSize: 18,
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
  linkButton: {
    marginTop: 16,
    alignItems: 'center',
  },
  linkText: {
    color: '#DC143C',
    fontSize: 14,
    textDecorationLine: 'underline',
  },
});

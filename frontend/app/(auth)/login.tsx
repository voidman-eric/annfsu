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
import { useAuth } from '../../contexts/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import api from '../../utils/api';

type LoginMethod = 'email' | 'phone';

export default function LoginScreen() {
  const [loginMethod, setLoginMethod] = useState<LoginMethod>('email');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const { loginWithEmail, loginWithOTP } = useAuth();
  const router = useRouter();

  const handleEmailLogin = async () => {
    if (!email || !password) {
      Alert.alert('त्रुटि', 'कृपया इमेल र पासवर्ड प्रविष्ट गर्नुहोस्');
      return;
    }

    setLoading(true);
    try {
      await loginWithEmail(email, password);
      router.replace('/(app)/home');
    } catch (error: any) {
      Alert.alert('लग इन असफल', error.response?.data?.detail || error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRequestOTP = async () => {
    if (!phone || phone.length !== 10) {
      Alert.alert('त्रुटि', 'कृपया मान्य फोन नम्बर प्रविष्ट गर्नुहोस्');
      return;
    }

    setLoading(true);
    try {
      await api.post('/api/auth/request-otp', { phone });
      setOtpSent(true);
      Alert.alert('सफल', 'OTP तपाईंको फोनमा पठाइएको छ');
    } catch (error: any) {
      Alert.alert('त्रुटि', error.response?.data?.detail || 'OTP पठाउन असफल');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async () => {
    if (!otp || otp.length !== 6) {
      Alert.alert('त्रुटि', 'कृपया 6 अंकको OTP प्रविष्ट गर्नुहोस्');
      return;
    }

    setLoading(true);
    try {
      await loginWithOTP(phone, otp);
      router.replace('/(app)/home');
    } catch (error: any) {
      Alert.alert('त्रुटि', error.response?.data?.detail || 'अवैध OTP');
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
          <View style={styles.logoContainer}>
            <View style={styles.logoPlaceholder}>
              <Text style={styles.logoText}>ANNFSU</Text>
            </View>
          </View>
          <Text style={styles.title}>अखिल नेपाल राष्ट्रिय स्वतन्त्र विद्यार्थी युनियन</Text>
          <Text style={styles.subtitle}>All Nepal National Free Students Union</Text>
        </View>

        <View style={styles.form}>
          <Text style={styles.formTitle}>लग इन गर्नुहोस्</Text>
          
          <TextInput
            style={styles.input}
            placeholder="इमेल"
            placeholderTextColor="#999"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />

          <TextInput
            style={styles.input}
            placeholder="पासवर्ड"
            placeholderTextColor="#999"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />

          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleLogin}
            disabled={loading}
          >
            <Text style={styles.buttonText}>
              {loading ? 'लोड हुँदैछ...' : 'लग इन'}
            </Text>
          </TouchableOpacity>

          <Text style={styles.infoText}>
            परीक्षणको लागि: admin@annfsu.org / admin123
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
    justifyContent: 'center',
    padding: 24,
  },
  header: {
    alignItems: 'center',
    marginBottom: 48,
  },
  logoContainer: {
    marginBottom: 16,
  },
  logoPlaceholder: {
    width: 100,
    height: 100,
    backgroundColor: '#DC143C',
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoText: {
    color: '#ffffff',
    fontSize: 24,
    fontWeight: 'bold',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#DC143C',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  form: {
    width: '100%',
  },
  formTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 24,
    textAlign: 'center',
  },
  input: {
    height: 50,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 16,
    marginBottom: 16,
    fontSize: 16,
    backgroundColor: '#f9f9f9',
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
  },
});

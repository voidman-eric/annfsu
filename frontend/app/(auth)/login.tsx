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

type LoginMethod = 'credentials' | 'phone';

export default function LoginScreen() {
  const [loginMethod, setLoginMethod] = useState<LoginMethod>('credentials');
  const [identifier, setIdentifier] = useState(''); // email or username
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const { login, loginWithOTP } = useAuth();
  const router = useRouter();

  const handleCredentialsLogin = async () => {
    if (!identifier || !password) {
      Alert.alert('त्रुटि', 'कृपया युजरनेम/इमेल र पासवर्ड प्रविष्ट गर्नुहोस्');
      return;
    }

    setLoading(true);
    try {
      await login(identifier.trim(), password);
      router.replace('/(app)/home');
    } catch (error: any) {
      Alert.alert('लग इन असफल', error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRequestOTP = async () => {
    if (!phone || phone.length !== 10) {
      Alert.alert('त्रुटि', 'कृपया मान्य १० अंकको फोन नम्बर प्रविष्ट गर्नुहोस्');
      return;
    }

    setLoading(true);
    try {
      await api.post('/api/auth/request-otp', { phone });
      setOtpSent(true);
      Alert.alert('सफल', 'OTP तपाईंको फोनमा पठाइएको छ (१० मिनेटको लागि मान्य)');
    } catch (error: any) {
      Alert.alert('त्रुटि', error.response?.data?.detail || 'OTP पठाउन असफल');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async () => {
    if (!otp || otp.length !== 6) {
      Alert.alert('त्रुटि', 'कृपया ६ अंकको OTP प्रविष्ट गर्नुहोस्');
      return;
    }

    setLoading(true);
    try {
      await loginWithOTP(phone, otp);
      router.replace('/(app)/home');
    } catch (error: any) {
      Alert.alert('त्रुटि', error.message || 'अवैध OTP');
    } finally {
      setLoading(false);
    }
  };

  const resetOTPForm = () => {
    setOtpSent(false);
    setOtp('');
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
          
          {/* Login Method Tabs */}
          <View style={styles.tabContainer}>
            <TouchableOpacity
              style={[styles.tab, loginMethod === 'credentials' && styles.activeTab]}
              onPress={() => {
                setLoginMethod('credentials');
                resetOTPForm();
              }}
            >
              <Ionicons 
                name="person" 
                size={20} 
                color={loginMethod === 'credentials' ? '#FFFFFF' : '#666'} 
              />
              <Text style={[styles.tabText, loginMethod === 'credentials' && styles.activeTabText]}>
                युजरनेम / इमेल
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.tab, loginMethod === 'phone' && styles.activeTab]}
              onPress={() => {
                setLoginMethod('phone');
                setIdentifier('');
                setPassword('');
              }}
            >
              <Ionicons 
                name="call" 
                size={20} 
                color={loginMethod === 'phone' ? '#FFFFFF' : '#666'} 
              />
              <Text style={[styles.tabText, loginMethod === 'phone' && styles.activeTabText]}>
                फोन / OTP
              </Text>
            </TouchableOpacity>
          </View>

          {/* Username/Email Login Form */}
          {loginMethod === 'credentials' && (
            <>
              <TextInput
                style={styles.input}
                placeholder="Username or Email"
                placeholderTextColor="#999"
                value={identifier}
                onChangeText={setIdentifier}
                autoCapitalize="none"
                editable={!loading}
              />

              <TextInput
                style={styles.input}
                placeholder="Password"
                placeholderTextColor="#999"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                editable={!loading}
              />

              <TouchableOpacity
                style={[styles.button, loading && styles.buttonDisabled]}
                onPress={handleCredentialsLogin}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.buttonText}>लग इन</Text>
                )}
              </TouchableOpacity>
            </>
          )}

          {/* Phone OTP Login Form */}
          {loginMethod === 'phone' && (
            <>
              <TextInput
                style={styles.input}
                placeholder="Phone Number (10 digits)"
                placeholderTextColor="#999"
                value={phone}
                onChangeText={setPhone}
                keyboardType="phone-pad"
                maxLength={10}
                editable={!loading && !otpSent}
              />

              {!otpSent ? (
                <TouchableOpacity
                  style={[styles.button, loading && styles.buttonDisabled]}
                  onPress={handleRequestOTP}
                  disabled={loading}
                >
                  {loading ? (
                    <ActivityIndicator color="#FFFFFF" />
                  ) : (
                    <Text style={styles.buttonText}>OTP पठाउनुहोस्</Text>
                  )}
                </TouchableOpacity>
              ) : (
                <>
                  <TextInput
                    style={styles.input}
                    placeholder="6-digit OTP"
                    placeholderTextColor="#999"
                    value={otp}
                    onChangeText={setOtp}
                    keyboardType="number-pad"
                    maxLength={6}
                    editable={!loading}
                  />

                  <TouchableOpacity
                    style={[styles.button, loading && styles.buttonDisabled]}
                    onPress={handleVerifyOTP}
                    disabled={loading}
                  >
                    {loading ? (
                      <ActivityIndicator color="#FFFFFF" />
                    ) : (
                      <Text style={styles.buttonText}>OTP प्रमाणित गर्नुहोस्</Text>
                    )}
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.linkButton}
                    onPress={resetOTPForm}
                    disabled={loading}
                  >
                    <Text style={styles.linkText}>फेरि OTP पठाउनुहोस्</Text>
                  </TouchableOpacity>
                </>
              )}
            </>
          )}

          <View style={styles.infoBox}>
            <Text style={styles.infoTitle}>परीक्षणको लागि:</Text>
            <Text style={styles.infoText}>
              युजरनेम: gopalnepal{'\n'}
              पासवर्ड: comrade123
            </Text>
          </View>

          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>वा</Text>
            <View style={styles.dividerLine} />
          </View>

          <TouchableOpacity
            style={styles.signUpButton}
            onPress={() => router.push('/(auth)/signup')}
            disabled={loading}
          >
            <Text style={styles.signUpButtonText}>नयाँ खाता बनाउनुहोस्</Text>
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
    justifyContent: 'center',
    padding: 24,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
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
    fontSize: 16,
    fontWeight: 'bold',
    color: '#DC143C',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 11,
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
  tabContainer: {
    flexDirection: 'row',
    marginBottom: 24,
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#DC143C',
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
  },
  activeTab: {
    backgroundColor: '#DC143C',
  },
  tabText: {
    fontSize: 13,
    color: '#666',
    marginLeft: 8,
    fontWeight: '600',
  },
  activeTabText: {
    color: '#FFFFFF',
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
  linkButton: {
    marginTop: 12,
    alignItems: 'center',
  },
  linkText: {
    color: '#DC143C',
    fontSize: 14,
    textDecorationLine: 'underline',
  },
  infoBox: {
    marginTop: 20,
    padding: 12,
    backgroundColor: '#FFF8E1',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FFB74D',
  },
  infoTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#E65100',
    marginBottom: 4,
  },
  infoText: {
    fontSize: 12,
    color: '#666',
    lineHeight: 18,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 24,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#ddd',
  },
  dividerText: {
    marginHorizontal: 16,
    color: '#999',
    fontSize: 14,
    fontWeight: '600',
  },
  signUpButton: {
    backgroundColor: '#FFFFFF',
    height: 50,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#DC143C',
  },
  signUpButtonText: {
    color: '#DC143C',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

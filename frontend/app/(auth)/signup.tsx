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
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const validateUsername = (value: string): string | null => {
    if (value.length < 3) return 'Username must be at least 3 characters';
    if (value.length > 20) return 'Username must be at most 20 characters';
    if (!/^[a-zA-Z0-9_]+$/.test(value)) return 'Username can only contain letters, numbers, and underscores';
    return null;
  };

  const validateEmail = (value: string): string | null => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(value)) return 'Please enter a valid email address';
    return null;
  };

  const validateForm = () => {
    // Check all required fields
    if (!username.trim()) {
      Alert.alert('Error', 'Username is required');
      return false;
    }

    if (!email.trim()) {
      Alert.alert('Error', 'Email is required');
      return false;
    }

    if (!password) {
      Alert.alert('Error', 'Password is required');
      return false;
    }

    // Validate username
    const usernameError = validateUsername(username);
    if (usernameError) {
      Alert.alert('Invalid Username', usernameError);
      return false;
    }

    // Validate email
    const emailError = validateEmail(email);
    if (emailError) {
      Alert.alert('Invalid Email', emailError);
      return false;
    }

    // Validate password
    if (password.length < 6) {
      Alert.alert('Weak Password', 'Password must be at least 6 characters');
      return false;
    }

    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return false;
    }

    return true;
  };

  const handleSignUp = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      const response = await api.post('/api/auth/signup', {
        username: username.toLowerCase().trim(),
        email: email.trim(),
        password,
        full_name: username.trim(),
        phone: '0000000000',
        address: 'Not provided',
        institution: 'Not provided',
        committee: 'central',
      });

      const { access_token, user } = response.data;
      await AsyncStorage.setItem('auth_token', access_token);
      await AsyncStorage.setItem('user_data', JSON.stringify(user));

      Alert.alert(
        'Success!',
        'Your account has been created successfully.',
        [{ text: 'OK', onPress: () => router.replace('/(app)/home') }]
      );
    } catch (error: any) {
      const detail = error.response?.data?.detail;
      if (typeof detail === 'string') {
        Alert.alert('Sign Up Failed', detail);
      } else if (Array.isArray(detail)) {
        const messages = detail.map((d: any) => d.msg || d.message).join('\n');
        Alert.alert('Validation Error', messages);
      } else {
        Alert.alert('Sign Up Failed', error.message);
      }
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
          <View style={styles.logoContainer}>
            <View style={styles.logo}>
              <Text style={styles.logoText}>ANNFSU</Text>
            </View>
          </View>
          <Text style={styles.title}>नयाँ खाता बनाउनुहोस्</Text>
          <Text style={styles.subtitle}>Create New Account</Text>
        </View>

        <View style={styles.form}>
          <View style={styles.infoBox}>
            <Ionicons name="information-circle" size={20} color="#DC143C" />
            <Text style={styles.infoText}>
              All three fields (Username, Email, Password) are required to create an account.
            </Text>
          </View>

          <View style={styles.inputContainer}>
            <Ionicons name="person-outline" size={20} color="#666" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Username (letters, numbers, _ only)"
              placeholderTextColor="#999"
              value={username}
              onChangeText={setUsername}
              autoCapitalize="none"
              editable={!loading}
            />
          </View>

          <View style={styles.inputContainer}>
            <Ionicons name="mail-outline" size={20} color="#666" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Email Address"
              placeholderTextColor="#999"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              editable={!loading}
            />
          </View>

          <View style={styles.inputContainer}>
            <Ionicons name="lock-closed-outline" size={20} color="#666" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Password (min 6 characters)"
              placeholderTextColor="#999"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              editable={!loading}
            />
          </View>

          <View style={styles.inputContainer}>
            <Ionicons name="lock-closed-outline" size={20} color="#666" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Confirm Password"
              placeholderTextColor="#999"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry
              editable={!loading}
            />
          </View>

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
            <Text style={styles.linkText}>Already have an account? Log In</Text>
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
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  backButton: {
    position: 'absolute',
    left: 0,
    top: 0,
    zIndex: 1,
  },
  logoContainer: {
    marginBottom: 16,
  },
  logo: {
    width: 80,
    height: 80,
    backgroundColor: '#DC143C',
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  title: {
    fontSize: 22,
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
  infoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF0F0',
    padding: 12,
    borderRadius: 8,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#FFCDD2',
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    color: '#666',
    marginLeft: 10,
    lineHeight: 18,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    marginBottom: 16,
    backgroundColor: '#f9f9f9',
    paddingHorizontal: 12,
  },
  inputIcon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    height: 50,
    fontSize: 15,
    color: '#333',
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

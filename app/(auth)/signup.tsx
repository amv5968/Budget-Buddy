import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { signup as apiSignup } from '../services/authService';

// Password validation helper
const validatePassword = (password: string): { valid: boolean; message: string } => {
  if (password.length < 6) {
    return { valid: false, message: 'Password must be at least 6 characters' };
  }
  if (password.length > 32) {
    return { valid: false, message: 'Password must be at most 32 characters' };
  }
  if (!/[a-z]/.test(password)) {
    return { valid: false, message: 'Password must contain at least one lowercase letter' };
  }
  if (!/[A-Z]/.test(password)) {
    return { valid: false, message: 'Password must contain at least one uppercase letter' };
  }
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    return {
      valid: false,
      message:
        'Password must contain at least one special character (!@#$%^&*()_+-=[]{}|;:,.<>?)',
    };
  }
  return { valid: true, message: '' };
};

export default function SignUpScreen() {
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  // 👁️ show/hide states (same idea as login)
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const router = useRouter();
  const { login } = useAuth();

  const handleSignUp = async () => {
    if (!email.trim() || !username.trim() || !password.trim() || !confirmPassword.trim()) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    if (username.trim().length < 3) {
      Alert.alert('Error', 'Username must be at least 3 characters');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }

    // Validate password requirements
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.valid) {
      Alert.alert('Password Requirements', passwordValidation.message);
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      Alert.alert('Error', 'Please enter a valid email address');
      return;
    }

    setLoading(true);
    try {
      const response = await apiSignup(username.trim(), email.trim(), password);
      await login(response.user, response.token);
      Alert.alert('Success', 'Account created successfully!');
      router.replace('/(tabs)');
    } catch (error: any) {
      console.error('Signup error:', error);
      const errorMessage = error.response?.data?.error || 'Signup failed. Please try again.';
      Alert.alert('Signup Failed', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <LinearGradient
      colors={['#66BB6A', '#42A5F5']}
      style={styles.gradient}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.formContainer}>
            <View style={styles.logoContainer}>
              <View className="logoCircle" style={styles.logoCircle}>
                <Text style={styles.logoEmoji}>💰</Text>
              </View>
              <Text style={styles.appTitle}>Create Account</Text>
              <Text style={styles.subtitle}>Join Budget Buddy today</Text>
            </View>

            <View style={styles.inputSection}>
              {/* Email */}
              <View style={styles.inputContainer}>
                <TextInput
                  placeholder="Email (max 100 characters)"
                  value={email}
                  onChangeText={(text) => {
                    if (text.length <= 100) {
                      setEmail(text);
                      if (text.length === 100) {
                        Alert.alert(
                          'Character Limit Reached',
                          'Email cannot exceed 100 characters'
                        );
                      }
                    } else {
                      Alert.alert('Email Too Long', 'Email must be 100 characters or less');
                    }
                  }}
                  style={styles.input}
                  placeholderTextColor="#999"
                  autoCapitalize="none"
                  keyboardType="email-address"
                  editable={!loading}
                  maxLength={100}
                />
              </View>

              {/* Username */}
              <View style={styles.inputContainer}>
                <TextInput
                  placeholder="Username (3-30 characters)"
                  value={username}
                  onChangeText={(text) => {
                    if (text.length <= 30) {
                      setUsername(text);
                      if (text.length === 30) {
                        Alert.alert(
                          'Character Limit Reached',
                          'Username cannot exceed 30 characters'
                        );
                      }
                    } else {
                      Alert.alert('Username Too Long', 'Username must be 30 characters or less');
                    }
                  }}
                  style={styles.input}
                  placeholderTextColor="#999"
                  autoCapitalize="none"
                  editable={!loading}
                  maxLength={30}
                />
              </View>

              {/* Password with eye icon (same pattern as login) */}
              <View style={styles.inputContainer}>
                <View style={styles.passwordRow}>
                  <TextInput
                    placeholder="Password (6-32 chars, requires: A-Z, a-z, special)"
                    value={password}
                    onChangeText={(text) => {
                      if (text.length <= 32) {
                        setPassword(text);
                        if (text.length === 32) {
                          Alert.alert(
                            'Character Limit Reached',
                            'Password cannot exceed 32 characters'
                          );
                        }
                      } else {
                        Alert.alert(
                          'Password Too Long',
                          'Password must be 32 characters or less'
                        );
                      }
                    }}
                    secureTextEntry={!showPassword}
                    style={[styles.input, { paddingRight: 45 }]}
                    placeholderTextColor="#999"
                    editable={!loading}
                    maxLength={32}
                  />

                  <TouchableOpacity
                    onPress={() => setShowPassword((prev) => !prev)}
                    style={styles.eyeButton}
                    disabled={loading}
                  >
                    <Ionicons
                      name={showPassword ? 'eye' : 'eye-off'}
                      size={22}
                      color="#555"
                    />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Confirm Password with eye icon */}
              <View style={styles.inputContainer}>
                <View style={styles.passwordRow}>
                  <TextInput
                    placeholder="Confirm Password (max 32 characters)"
                    value={confirmPassword}
                    onChangeText={(text) => {
                      if (text.length <= 32) {
                        setConfirmPassword(text);
                        if (text.length === 32) {
                          Alert.alert(
                            'Character Limit Reached',
                            'Password cannot exceed 32 characters'
                          );
                        }
                      } else {
                        Alert.alert(
                          'Password Too Long',
                          'Password must be 32 characters or less'
                        );
                      }
                    }}
                    secureTextEntry={!showConfirmPassword}
                    style={[styles.input, { paddingRight: 45 }]}
                    placeholderTextColor="#999"
                    editable={!loading}
                    maxLength={32}
                  />

                  <TouchableOpacity
                    onPress={() => setShowConfirmPassword((prev) => !prev)}
                    style={styles.eyeButton}
                    disabled={loading}
                  >
                    <Ionicons
                      name={showConfirmPassword ? 'eye' : 'eye-off'}
                      size={22}
                      color="#555"
                    />
                  </TouchableOpacity>
                </View>
              </View>

              <TouchableOpacity
                style={[styles.signupButton, loading && styles.signupButtonDisabled]}
                onPress={handleSignUp}
                activeOpacity={0.8}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <Text style={styles.signupButtonText}>Sign Up</Text>
                )}
              </TouchableOpacity>

              <View style={styles.loginContainer}>
                <Text style={styles.loginText}>Already have an account? </Text>
                <TouchableOpacity onPress={() => router.back()}>
                  <Text style={styles.loginLink}>Login</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
  },
  formContainer: {
    backgroundColor: 'white',
    borderRadius: 24,
    padding: 32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 10,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logoCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#FFF9C4',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  logoEmoji: {
    fontSize: 50,
  },
  appTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#2196F3',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
  },
  inputSection: {
    width: '100%',
  },
  inputContainer: {
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    marginBottom: 16,
    overflow: 'hidden',
  },
  input: {
    padding: 18,
    fontSize: 16,
    color: '#333',
  },
  passwordRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  eyeButton: {
    position: 'absolute',
    right: 12,
    padding: 6,
  },
  signupButton: {
    backgroundColor: '#66BB6A',
    borderRadius: 12,
    padding: 18,
    alignItems: 'center',
    shadowColor: '#66BB6A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
    marginTop: 8,
  },
  signupButtonDisabled: {
    opacity: 0.7,
  },
  signupButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 24,
  },
  loginText: {
    color: '#666',
    fontSize: 14,
  },
  loginLink: {
    color: '#2196F3',
    fontSize: 14,
    fontWeight: '600',
  },
});

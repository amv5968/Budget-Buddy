import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Modal,
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

// Password validation helper - returns all unmet requirements
const validatePassword = (password: string): { valid: boolean; issues: string[] } => {
  const issues: string[] = [];
  
  if (password.length < 6) {
    issues.push('At least 6 characters');
  }
  if (password.length > 32) {
    issues.push('Maximum 32 characters');
  }
  if (!/[a-z]/.test(password)) {
    issues.push('One lowercase letter (a-z)');
  }
  if (!/[A-Z]/.test(password)) {
    issues.push('One uppercase letter (A-Z)');
  }
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    issues.push('One special character (!@#$%^&*()_+-=[]{}|;:,.<>?)');
  }
  
  return { valid: issues.length === 0, issues };
};

// Get password strength and color
const getPasswordStrength = (password: string): { strength: string; color: string; percentage: number } => {
  if (!password) return { strength: '', color: '#E0E0E0', percentage: 0 };
  
  const validation = validatePassword(password);
  const metRequirements = 5 - validation.issues.length;
  
  if (metRequirements <= 2) {
    return { strength: 'Weak', color: '#F44336', percentage: 33 };
  } else if (metRequirements <= 3) {
    return { strength: 'Fair', color: '#FF9800', percentage: 50 };
  } else if (metRequirements <= 4) {
    return { strength: 'Good', color: '#FFC107', percentage: 75 };
  } else {
    return { strength: 'Strong', color: '#66BB6A', percentage: 100 };
  }
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
  
  // Info modal state
  const [showPasswordInfo, setShowPasswordInfo] = useState(false);

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
      Alert.alert(
        'Password Requirements Not Met',
        'Your password is missing:\n\n' + passwordValidation.issues.map(issue => `• ${issue}`).join('\n'),
        [{ text: 'OK' }]
      );
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
      // Redirect new users to onboarding
      router.push({
        pathname: '/(onboarding)/onboarding' as any,
      });
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
                <View style={styles.inputLabelRow}>
                  <Text style={styles.inputLabel}>Password</Text>
                  <TouchableOpacity 
                    onPress={() => setShowPasswordInfo(true)}
                    style={styles.infoButton}
                  >
                    <Ionicons name="information-circle-outline" size={20} color="#2196F3" />
                  </TouchableOpacity>
                </View>
                <View style={styles.passwordRow}>
                  <TextInput
                    placeholder="Enter your password"
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
                
                {/* Password Strength Indicator */}
                {password.length > 0 && (
                  <View style={styles.strengthContainer}>
                    <View style={styles.strengthBarBackground}>
                      <View 
                        style={[
                          styles.strengthBarFill, 
                          { 
                            width: `${getPasswordStrength(password).percentage}%`,
                            backgroundColor: getPasswordStrength(password).color
                          }
                        ]} 
                      />
                    </View>
                    <Text style={[styles.strengthText, { color: getPasswordStrength(password).color }]}>
                      {getPasswordStrength(password).strength}
                    </Text>
                  </View>
                )}
                
                {/* Show unmet requirements */}
                {password.length > 0 && validatePassword(password).issues.length > 0 && (
                  <View style={styles.requirementsContainer}>
                    <Text style={styles.requirementsTitle}>Missing:</Text>
                    {validatePassword(password).issues.map((issue, index) => (
                      <Text key={index} style={styles.requirementText}>• {issue}</Text>
                    ))}
                  </View>
                )}
              </View>

              {/* Confirm Password with eye icon */}
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Confirm Password</Text>
                <View style={styles.passwordRow}>
                  <TextInput
                    placeholder="Re-enter your password"
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

      {/* Password Info Modal */}
      <Modal
        visible={showPasswordInfo}
        transparent
        animationType="fade"
        onRequestClose={() => setShowPasswordInfo(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Password Requirements</Text>
              <TouchableOpacity onPress={() => setShowPasswordInfo(false)}>
                <Ionicons name="close-circle" size={28} color="#999" />
              </TouchableOpacity>
            </View>
            
            <View style={styles.modalBody}>
              <View style={styles.requirementRow}>
                <Ionicons name="checkmark-circle" size={20} color="#66BB6A" />
                <Text style={styles.requirementItem}>Between 6-32 characters long</Text>
              </View>
              <View style={styles.requirementRow}>
                <Ionicons name="checkmark-circle" size={20} color="#66BB6A" />
                <Text style={styles.requirementItem}>At least one lowercase letter (a-z)</Text>
              </View>
              <View style={styles.requirementRow}>
                <Ionicons name="checkmark-circle" size={20} color="#66BB6A" />
                <Text style={styles.requirementItem}>At least one uppercase letter (A-Z)</Text>
              </View>
              <View style={styles.requirementRow}>
                <Ionicons name="checkmark-circle" size={20} color="#66BB6A" />
                <Text style={styles.requirementItem}>At least one special character</Text>
              </View>
              <Text style={styles.specialCharsText}>
                {'(!@#$%^&*()_+-=[]{}|;:,.<>?)'}
              </Text>
            </View>

            <TouchableOpacity 
              style={styles.modalButton}
              onPress={() => setShowPasswordInfo(false)}
            >
              <Text style={styles.modalButtonText}>Got it</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
  inputLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingTop: 12,
    paddingBottom: 4,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  infoButton: {
    padding: 4,
  },
  strengthContainer: {
    paddingHorizontal: 18,
    paddingBottom: 12,
    paddingTop: 8,
  },
  strengthBarBackground: {
    height: 6,
    backgroundColor: '#E0E0E0',
    borderRadius: 3,
    marginBottom: 6,
    overflow: 'hidden',
  },
  strengthBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  strengthText: {
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'right',
  },
  requirementsContainer: {
    paddingHorizontal: 18,
    paddingBottom: 12,
    paddingTop: 4,
  },
  requirementsTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#F44336',
    marginBottom: 4,
  },
  requirementText: {
    fontSize: 11,
    color: '#666',
    marginBottom: 2,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  modalBody: {
    marginBottom: 20,
  },
  requirementRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  requirementItem: {
    fontSize: 14,
    color: '#333',
    marginLeft: 10,
    flex: 1,
  },
  specialCharsText: {
    fontSize: 12,
    color: '#666',
    marginLeft: 30,
    marginTop: -4,
  },
  modalButton: {
    backgroundColor: '#2196F3',
    borderRadius: 10,
    padding: 14,
    alignItems: 'center',
  },
  modalButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});

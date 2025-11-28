import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
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
import { resetPassword } from '../services/authService';

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

export default function ResetPasswordScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const tokenFromUrl = params.token as string;

  const [token, setToken] = useState(tokenFromUrl || '');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  // 👁️ show/hide toggles (same pattern as login/signup)
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  // Info modal state
  const [showPasswordInfo, setShowPasswordInfo] = useState(false);

  const handleResetPassword = async () => {
    if (!token.trim()) {
      Alert.alert('Error', 'Please enter the reset token');
      return;
    }

    if (!newPassword.trim() || !confirmPassword.trim()) {
      Alert.alert('Error', 'Please fill in all password fields');
      return;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }

    // Validate password requirements
    const passwordValidation = validatePassword(newPassword);
    if (!passwordValidation.valid) {
      Alert.alert(
        'Password Requirements Not Met',
        'Your password is missing:\n\n' + passwordValidation.issues.map(issue => `• ${issue}`).join('\n'),
        [{ text: 'OK' }]
      );
      return;
    }

    setLoading(true);
    try {
      await resetPassword(token.trim(), newPassword);

      Alert.alert(
        '✅ Password Reset Successful',
        'Your password has been reset successfully. You can now login with your new password.',
        [
          {
            text: 'Go to Login',
            onPress: () => router.replace('/(auth)/login'),
          },
        ]
      );
    } catch (error: any) {
      console.error('Password reset error:', error);
      const errorMessage =
        error.response?.data?.error ||
        'Failed to reset password. Please check your token and try again.';
      Alert.alert('Error', errorMessage);
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
              <View style={styles.logoCircle}>
                <Text style={styles.logoEmoji}>🔑</Text>
              </View>
              <Text style={styles.appTitle}>Reset Password</Text>
              <Text style={styles.subtitle}>
                Enter your reset token and new password
              </Text>
            </View>

            <View style={styles.inputSection}>
              {/* Reset token */}
              <View style={styles.inputContainer}>
                <TextInput
                  placeholder="Reset Token"
                  value={token}
                  onChangeText={setToken}
                  style={styles.input}
                  placeholderTextColor="#999"
                  autoCapitalize="none"
                  autoCorrect={false}
                  editable={!loading}
                />
              </View>

              {/* New password with eye icon */}
              <View style={styles.inputContainer}>
                <View style={styles.inputLabelRow}>
                  <Text style={styles.inputLabel}>New Password</Text>
                  <TouchableOpacity 
                    onPress={() => setShowPasswordInfo(true)}
                    style={styles.infoButton}
                  >
                    <Ionicons name="information-circle-outline" size={20} color="#2196F3" />
                  </TouchableOpacity>
                </View>
                <View style={styles.passwordRow}>
                  <TextInput
                    placeholder="Enter your new password"
                    value={newPassword}
                    onChangeText={(text) => {
                      if (text.length <= 32) {
                        setNewPassword(text);
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
                    secureTextEntry={!showNewPassword}
                    style={[styles.input, { paddingRight: 45 }]}
                    placeholderTextColor="#999"
                    editable={!loading}
                    maxLength={32}
                  />

                  <TouchableOpacity
                    onPress={() => setShowNewPassword((prev) => !prev)}
                    style={styles.eyeButton}
                    disabled={loading}
                  >
                    <Ionicons
                      name={showNewPassword ? 'eye' : 'eye-off'}
                      size={22}
                      color="#555"
                    />
                  </TouchableOpacity>
                </View>
                
                {/* Password Strength Indicator */}
                {newPassword.length > 0 && (
                  <View style={styles.strengthContainer}>
                    <View style={styles.strengthBarBackground}>
                      <View 
                        style={[
                          styles.strengthBarFill, 
                          { 
                            width: `${getPasswordStrength(newPassword).percentage}%`,
                            backgroundColor: getPasswordStrength(newPassword).color
                          }
                        ]} 
                      />
                    </View>
                    <Text style={[styles.strengthText, { color: getPasswordStrength(newPassword).color }]}>
                      {getPasswordStrength(newPassword).strength}
                    </Text>
                  </View>
                )}
                
                {/* Show unmet requirements */}
                {newPassword.length > 0 && validatePassword(newPassword).issues.length > 0 && (
                  <View style={styles.requirementsContainer}>
                    <Text style={styles.requirementsTitle}>Missing:</Text>
                    {validatePassword(newPassword).issues.map((issue, index) => (
                      <Text key={index} style={styles.requirementText}>• {issue}</Text>
                    ))}
                  </View>
                )}
              </View>

              {/* Confirm password with eye icon */}
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Confirm New Password</Text>
                <View style={styles.passwordRow}>
                  <TextInput
                    placeholder="Re-enter your new password"
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
                style={[styles.resetButton, loading && styles.resetButtonDisabled]}
                onPress={handleResetPassword}
                activeOpacity={0.8}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <Text style={styles.resetButtonText}>Reset Password</Text>
                )}
              </TouchableOpacity>

              <View style={styles.backContainer}>
                <TouchableOpacity onPress={() => router.back()}>
                  <Text style={styles.backLink}>← Back</Text>
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
    textAlign: 'center',
    marginTop: 8,
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
  backLink: {
    color: '#2196F3',
    fontSize: 14,
    fontWeight: '600',
  },
  resetButton: {
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
  resetButtonDisabled: {
    opacity: 0.7,
  },
  resetButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  backContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 24,
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


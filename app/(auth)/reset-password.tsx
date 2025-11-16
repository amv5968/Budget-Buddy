import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
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
import { resetPassword } from '../services/authService';

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

export default function ResetPasswordScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const tokenFromUrl = params.token as string;

  const [token, setToken] = useState(tokenFromUrl || '');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  // live rule UI
  const [newPasswordFocused, setNewPasswordFocused] = useState(false);
  const [confirmPasswordFocused, setConfirmPasswordFocused] = useState(false);

  const newPass = newPassword;
  const confirmPass = confirmPassword;
  const hasLower = /[a-z]/.test(newPass);
  const hasUpper = /[A-Z]/.test(newPass);
  const hasSpecial = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(newPass);
  const lengthOk = newPass.length >= 6 && newPass.length <= 32;
  const confirmMatchOk = confirmPass.length > 0 && confirmPass === newPass;

  const getRuleColor = (value: string, ok: boolean) => {
    if (!value || value.length === 0) return '#777'; // neutral gray before typing
    return ok ? '#4CAF50' : '#E53935'; // green if satisfied, red if not
  };

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
      Alert.alert('Password Requirements', passwordValidation.message);
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
              <Text style={styles.subtitle}>Enter your reset token and new password</Text>
            </View>

            <View style={styles.inputSection}>
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

              {/* New Password */}
              <View style={styles.inputContainer}>
                <TextInput
                  placeholder="New Password"
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
                  secureTextEntry
                  style={styles.input}
                  placeholderTextColor="#999"
                  editable={!loading}
                  maxLength={32}
                  onFocus={() => setNewPasswordFocused(true)}
                  onBlur={() => setNewPasswordFocused(false)}
                />
              </View>

              {newPasswordFocused && (
                <View style={styles.passwordRulesBox}>
                  <Text
                    style={[
                      styles.passwordRuleText,
                      { color: getRuleColor(newPass, hasLower) },
                    ]}
                  >
                    • Must include at least one lowercase letter
                  </Text>
                  <Text
                    style={[
                      styles.passwordRuleText,
                      { color: getRuleColor(newPass, hasUpper) },
                    ]}
                  >
                    • Must include at least one uppercase letter
                  </Text>
                  <Text
                    style={[
                      styles.passwordRuleText,
                      { color: getRuleColor(newPass, hasSpecial) },
                    ]}
                  >
                    • Must include at least one special character
                  </Text>
                  <Text
                    style={[
                      styles.passwordRuleText,
                      { color: getRuleColor(newPass, lengthOk) },
                    ]}
                  >
                    • Between 6 and 32 characters
                  </Text>
                </View>
              )}

              {/* Confirm New Password */}
              <View style={styles.inputContainer}>
                <TextInput
                  placeholder="Confirm New Password"
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
                  secureTextEntry
                  style={styles.input}
                  placeholderTextColor="#999"
                  editable={!loading}
                  maxLength={32}
                  onFocus={() => setConfirmPasswordFocused(true)}
                  onBlur={() => setConfirmPasswordFocused(false)}
                />
              </View>

              {confirmPasswordFocused && (
                <View style={styles.passwordRulesBox}>
                  <Text
                    style={[
                      styles.passwordRuleText,
                      { color: getRuleColor(confirmPass, confirmMatchOk) },
                    ]}
                  >
                    • Must match the new password exactly
                  </Text>
                </View>
              )}

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
  backLink: {
    color: '#2196F3',
    fontSize: 14,
    fontWeight: '600',
  },
  // live rules
  passwordRulesBox: {
    marginTop: 4,
    marginBottom: 12,
    paddingVertical: 6,
    paddingHorizontal: 10,
    backgroundColor: '#F0F0F0',
    borderRadius: 8,
  },
  passwordRuleText: {
    fontSize: 12,
    color: '#666',
    marginBottom: 2,
  },
});

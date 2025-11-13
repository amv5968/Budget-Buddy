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
import { forgotPassword } from '../services/authService';

export default function ForgotPasswordScreen() {
  const [emailOrUsername, setEmailOrUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const [resetToken, setResetToken] = useState<string | null>(null);
  const router = useRouter();

  const handleResetPassword = async () => {
    if (!emailOrUsername.trim()) {
      Alert.alert('Error', 'Please enter your email or username');
      return;
    }

    setLoading(true);
    try {
      const response = await forgotPassword(emailOrUsername.trim());
      
      // Log token to console
      if (response.resetToken) {
        console.log('═══════════════════════════════════════════════════════');
        console.log('🔐 PASSWORD RESET TOKEN (DEMO MODE)');
        console.log('═══════════════════════════════════════════════════════');
        console.log(`Reset Token: ${response.resetToken}`);
        console.log(`Expires: ${response.expiresAt || '1 hour from now'}`);
        console.log('═══════════════════════════════════════════════════════');
      }
      
      if (response.resetToken) {
        // Show token on screen for demo
        setResetToken(response.resetToken);
      } else {
        Alert.alert(
          'Password Reset Request Sent',
          response.message || 'If an account exists with that email or username, you will receive password reset instructions shortly.',
          [
            {
              text: 'OK',
              onPress: () => router.back()
            }
          ]
        );
      }
    } catch (error: any) {
      console.error('Password reset error:', error);
      const errorMessage = error.response?.data?.error || 'Failed to send reset request. Please try again.';
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
                <Text style={styles.logoEmoji}>🔐</Text>
              </View>
              <Text style={styles.appTitle}>Reset Password</Text>
              <Text style={styles.subtitle}>
                {resetToken ? 'Your reset token has been generated!' : 'Enter your email or username to generate a reset token'}
              </Text>
            </View>

            {resetToken ? (
              <View style={styles.tokenSection}>
                <View style={styles.tokenContainer}>
                  <Text style={styles.tokenLabel}>🔐 Your Reset Token (Demo Mode)</Text>
                  <View style={styles.tokenBox}>
                    <Text style={styles.tokenText} selectable>{resetToken}</Text>
                  </View>
                  <Text style={styles.tokenHint}>
                    Copy this token and use it to reset your password. Token expires in 1 hour.
                  </Text>
                  <Text style={styles.consoleHint}>
                    💡 Token also logged to console/logs
                  </Text>
                </View>

                <TouchableOpacity 
                  style={[styles.resetButton, { backgroundColor: '#2196F3' }]} 
                  onPress={() => router.push(`/(auth)/reset-password?token=${encodeURIComponent(resetToken)}`)}
                  activeOpacity={0.8}
                >
                  <Text style={styles.resetButtonText}>Continue to Reset Password</Text>
                </TouchableOpacity>

                <TouchableOpacity 
                  style={[styles.resetButton, { backgroundColor: '#999', marginTop: 12 }]} 
                  onPress={() => {
                    setResetToken(null);
                    setEmailOrUsername('');
                  }}
                  activeOpacity={0.8}
                >
                  <Text style={styles.resetButtonText}>Request New Token</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.inputSection}>
              <View style={styles.inputContainer}>
                <TextInput
                  placeholder="Email or Username"
                  value={emailOrUsername}
                  onChangeText={(text) => {
                    if (text.length <= 100) {
                      setEmailOrUsername(text);
                      if (text.length === 100) {
                        Alert.alert('Character Limit Reached', 'Email or username cannot exceed 100 characters');
                      }
                    } else {
                      Alert.alert('Input Too Long', 'Email or username must be 100 characters or less');
                    }
                  }}
                  style={styles.input}
                  placeholderTextColor="#999"
                  autoCapitalize="none"
                  autoCorrect={false}
                  editable={!loading}
                  maxLength={100}
                />
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
                  <Text style={styles.resetButtonText}>Generate Reset Token</Text>
                )}
              </TouchableOpacity>

              <View style={styles.backContainer}>
                <TouchableOpacity onPress={() => router.back()}>
                  <Text style={styles.backLink}>← Back to Login</Text>
                </TouchableOpacity>
              </View>
            </View>
            )}
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
  tokenSection: {
    width: '100%',
  },
  tokenContainer: {
    marginBottom: 20,
  },
  tokenLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
    textAlign: 'center',
  },
  tokenBox: {
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    padding: 16,
    borderWidth: 2,
    borderColor: '#2196F3',
    borderStyle: 'dashed',
    marginBottom: 12,
  },
  tokenText: {
    fontSize: 14,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    color: '#2196F3',
    textAlign: 'center',
    fontWeight: '600',
  },
  tokenHint: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    marginBottom: 8,
  },
  consoleHint: {
    fontSize: 11,
    color: '#999',
    textAlign: 'center',
    fontStyle: 'italic',
  },
});


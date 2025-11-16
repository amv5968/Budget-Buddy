import { Ionicons } from '@expo/vector-icons';
import * as FileSystem from 'expo-file-system';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as Sharing from 'expo-sharing';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Image,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { BarChart, LineChart } from 'react-native-chart-kit';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { changePassword, deleteAccount, getUserProfile, updateUserProfile } from '../services/authService';
import { getTransactionStats, getTransactions } from '../services/transactionService';

const screenWidth = Dimensions.get('window').width;

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
    return { valid: false, message: 'Password must contain at least one special character (!@#$%^&*()_+-=[]{}|;:,.<>?)' };
  }
  return { valid: true, message: '' };
};

export default function ProfileScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const returnTo = (params.returnTo as string) || '/(tabs)';
  const { colors } = useTheme();
  const { user, logout } = useAuth();

  const [stats, setStats] = useState({ totalIncome: 0, totalExpense: 0 });
  const [profile, setProfile] = useState({
    username: user?.username || '',
    email: user?.email || '',
    monthlyAllowance: 0,
  });
  const [editing, setEditing] = useState(false);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [spendingTrend, setSpendingTrend] = useState<number[]>([0, 0, 0, 0, 0, 0, 0]);
  const [categoryBreakdown, setCategoryBreakdown] = useState<{ [key: string]: number }>({});
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [savingProfile, setSavingProfile] = useState(false);
  const [newPasswordFocused, setNewPasswordFocused] = useState(false);
  const [confirmPasswordFocused, setConfirmPasswordFocused] = useState(false);
  const newPass = passwordData.newPassword;
  const confirmPass = passwordData.confirmPassword;
  const hasLower = /[a-z]/.test(newPass);
  const hasUpper = /[A-Z]/.test(newPass);
  const hasSpecial = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(newPass);
  const lengthOk = newPass.length >= 6 && newPass.length <= 32;
  const confirmMatchOk = confirmPass.length > 0 && confirmPass === newPass;
  const getRuleColor = (value: string, ok: boolean) => {
    if (!value || value.length === 0) return '#777';
    return ok ? '#4CAF50' : '#E53935';};
  const [changingPassword, setChangingPassword] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [deletingAccount, setDeletingAccount] = useState(false);

  const fallbackAvatar = 'https://cdn-icons-png.flaticon.com/512/149/149071.png';

  // Load profile and stats
  useEffect(() => {
    const loadProfile = async () => {
      try {
        const profileData = await getUserProfile();
        const data = await getTransactionStats();
        const transData = await getTransactions();
        
        setStats(data);
        setTransactions(transData);
        setProfile({
          username: profileData.username || '',
          email: profileData.email || '',
          monthlyAllowance: profileData.monthlyAllowance || 0,
        });

        // Calculate spending trend for last 7 days
        const last7Days = Array(7).fill(0);
        const today = new Date();
        
        transData.forEach((t: any) => {
          if (t.type === 'Expense') {
            const transDate = new Date(t.date);
            const diffTime = today.getTime() - transDate.getTime();
            const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
            
            if (diffDays >= 0 && diffDays < 7) {
              last7Days[6 - diffDays] += t.amount;
            }
          }
        });
        setSpendingTrend(last7Days);

        // Calculate category breakdown
        const categories: { [key: string]: number } = {};
        transData.forEach((t: any) => {
          if (t.type === 'Expense') {
            categories[t.category] = (categories[t.category] || 0) + t.amount;
          }
        });
        setCategoryBreakdown(categories);
      } catch (err) {
        console.error('Error loading profile:', err);
      }
    };
    loadProfile();
  }, []);

  // Export Data
  const exportData = async () => {
    try {
      const content = JSON.stringify({ user, stats, profile }, null, 2);
      const docDir =
        (FileSystem as any).documentDirectory ??
        (FileSystem as any).cacheDirectory ??
        null;

      if (!docDir) {
        Alert.alert('Error', 'No writable directory available.');
        return;
      }

      const fileUri = `${docDir}budgetbuddy-profile.json`;
      await FileSystem.writeAsStringAsync(fileUri, content);

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(fileUri);
      } else {
        Alert.alert(
          'Sharing not available',
          'File saved locally but sharing is not supported.'
        );
      }
    } catch (err) {
      console.error('Export failed', err);
      Alert.alert('Error', 'Unable to export data.');
    }
  };

  // Save Profile
  const handleSave = async () => {
    // Validation
    if (!profile.username.trim()) {
      Alert.alert('Error', 'Username cannot be empty');
      return;
    }

    if (profile.username.trim().length < 3) {
      Alert.alert('Error', 'Username must be at least 3 characters');
      return;
    }

    if (profile.username.trim().length > 30) {
      Alert.alert('Error', 'Username must be 30 characters or less');
      return;
    }
    
    if (!profile.email.trim() || !profile.email.includes('@')) {
      Alert.alert('Error', 'Please enter a valid email address');
      return;
    }

    if (profile.email.trim().length > 100) {
      Alert.alert('Error', 'Email must be 100 characters or less');
      return;
    }

    if (profile.monthlyAllowance < 0) {
      Alert.alert('Error', 'Monthly allowance cannot be negative');
      return;
    }

    if (profile.monthlyAllowance > 1000000) {
      Alert.alert('Error', 'Monthly allowance cannot exceed $1,000,000.00');
      return;
    }

    setSavingProfile(true);
    try {
      const updatedProfile = await updateUserProfile({
        username: profile.username,
        email: profile.email,
        monthlyAllowance: profile.monthlyAllowance,
      });
      
      setProfile(updatedProfile);
      setEditing(false);
      Alert.alert('Success', 'Profile updated successfully!');
    } catch (err: any) {
      console.error('Error saving profile:', err);
      const errorMessage = err.response?.data?.error || 'Unable to save profile changes.';
      Alert.alert('Error', errorMessage);
    } finally {
      setSavingProfile(false);
    }
  };

  // Change Password
  const handleChangePassword = async () => {
    if (!passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword) {
      Alert.alert('Error', 'Please fill in all password fields');
      return;
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      Alert.alert('Error', 'New passwords do not match');
      return;
    }

    // Validate password requirements
    const passwordValidation = validatePassword(passwordData.newPassword);
    if (!passwordValidation.valid) {
      Alert.alert('Password Requirements', passwordValidation.message);
      return;
    }

    setChangingPassword(true);
    try {
      await changePassword(passwordData.currentPassword, passwordData.newPassword);
      setShowPasswordModal(false);
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      Alert.alert('Success', 'Password changed successfully!');
    } catch (err: any) {
      console.error('Error changing password:', err);
      const errorMessage = err.response?.data?.error || 'Unable to change password.';
      Alert.alert('Error', errorMessage);
    } finally {
      setChangingPassword(false);
    }
  };

  // Delete Account
  const handleDeleteAccount = async () => {
    if (!deletePassword.trim()) {
      Alert.alert('Error', 'Please enter your password to confirm account deletion');
      return;
    }

    setDeletingAccount(true);
    try {
      await deleteAccount(deletePassword);
      setShowDeleteModal(false);
      setDeletePassword('');
      Alert.alert(
        'Account Deleted',
        'Your account has been permanently deleted.',
        [
          {
            text: 'OK',
            onPress: async () => {
              await logout();
              router.replace('/(auth)/login');
            }
          }
        ]
      );
    } catch (err: any) {
      console.error('Error deleting account:', err);
      const errorMessage = err.response?.data?.error || 'Unable to delete account.';
      Alert.alert('Error', errorMessage);
    } finally {
      setDeletingAccount(false);
    }
  };

  // Logout
  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      { 
        text: 'Logout', 
        style: 'destructive', 
        onPress: async () => {
          await logout();
          // Navigate to login screen
          router.replace('/(auth)/login');
        }
      },
    ]);
  };

  const handleGoBack = () => {
    router.navigate(returnTo as any);
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Back Button */}
      <View style={styles.backButtonContainer}>
        <TouchableOpacity onPress={handleGoBack} style={styles.backButton}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
      </View>

      {/* HEADER */}
      <View style={styles.header}>
        <Image
          source={
            (() => {
              try {
                return require('../../assets/avatar.png');
              } catch {
                return { uri: fallbackAvatar };
              }
            })()
          }
          style={styles.avatar}
        />
        <View>
          <Text style={[styles.name, { color: colors.text }]}>{profile.username}</Text>
          <Text style={[styles.email, { color: colors.textSecondary }]}>
            {profile.email}
          </Text>
        </View>
      </View>

      {/* ACCOUNT OVERVIEW */}
      <View style={[styles.card, { backgroundColor: colors.cardBackground }]}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Account Overview</Text>
        <View style={styles.statsRow}>
          <View style={styles.statBox}>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
              Allowance
            </Text>
            <Text style={[styles.statValue, { color: colors.income }]}>
              ${profile.monthlyAllowance.toFixed(2)}
            </Text>
          </View>
          <View style={styles.statBox}>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Income</Text>
            <Text style={[styles.statValue, { color: colors.income }]}>
              ${stats.totalIncome.toFixed(2)}
            </Text>
          </View>
          <View style={styles.statBox}>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Expenses</Text>
            <Text style={[styles.statValue, { color: colors.expense }]}>
              ${stats.totalExpense.toFixed(2)}
            </Text>
          </View>
        </View>

        {/* Net Balance */}
        <View style={styles.balanceCard}>
          <Text style={[styles.balanceLabel, { color: colors.textSecondary }]}>Net Balance</Text>
          <Text style={[
            styles.balanceValue, 
            { color: (stats.totalIncome - stats.totalExpense) >= 0 ? colors.income : colors.expense }
          ]}>
            ${(stats.totalIncome - stats.totalExpense).toFixed(2)}
          </Text>
        </View>
      </View>

      {/* SPENDING TREND CHART */}
      {spendingTrend.some(v => v > 0) && (
        <View style={[styles.card, { backgroundColor: colors.cardBackground }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>📈 Spending Trend (Last 7 Days)</Text>
          <LineChart
            data={{
              labels: ['6d', '5d', '4d', '3d', '2d', '1d', 'Today'],
              datasets: [{
                data: spendingTrend.map(v => v || 0.1), // Prevent zero values
              }],
            }}
            width={screenWidth - 72}
            height={200}
            yAxisLabel="$"
            yAxisSuffix=""
            chartConfig={{
              backgroundColor: colors.cardBackground,
              backgroundGradientFrom: colors.cardBackground,
              backgroundGradientTo: colors.cardBackground,
              decimalPlaces: 0,
              color: (opacity = 1) => colors.expense,
              labelColor: (opacity = 1) => colors.textSecondary,
              style: {
                borderRadius: 16,
              },
              propsForDots: {
                r: '4',
                strokeWidth: '2',
                stroke: colors.expense,
              },
            }}
            bezier
            style={{
              marginVertical: 8,
              borderRadius: 16,
            }}
          />
        </View>
      )}

      {/* CATEGORY BREAKDOWN CHART */}
      {Object.keys(categoryBreakdown).length > 0 && (
        <View style={[styles.card, { backgroundColor: colors.cardBackground }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>📊 Top Spending Categories</Text>
          <BarChart
            data={{
              labels: Object.keys(categoryBreakdown).slice(0, 5).map(c => c.substring(0, 8)),
              datasets: [{
                data: Object.values(categoryBreakdown).slice(0, 5),
              }],
            }}
            width={screenWidth - 72}
            height={220}
            yAxisLabel="$"
            yAxisSuffix=""
            chartConfig={{
              backgroundColor: colors.cardBackground,
              backgroundGradientFrom: colors.cardBackground,
              backgroundGradientTo: colors.cardBackground,
              decimalPlaces: 0,
              color: (opacity = 1) => colors.primary,
              labelColor: (opacity = 1) => colors.textSecondary,
              style: {
                borderRadius: 16,
              },
            }}
            style={{
              marginVertical: 8,
              borderRadius: 16,
            }}
          />
        </View>
      )}

      {/* INSIGHTS */}
      <View style={[styles.card, { backgroundColor: colors.cardBackground }]}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>💡 Financial Insights</Text>
        
        <View style={styles.insightRow}>
          <Text style={{ fontSize: 28 }}>📅</Text>
          <View style={styles.insightContent}>
            <Text style={[styles.insightLabel, { color: colors.textSecondary }]}>
              Total Transactions
            </Text>
            <Text style={[styles.insightValue, { color: colors.text }]}>
              {transactions.length} transactions
            </Text>
          </View>
        </View>

        <View style={styles.insightRow}>
          <Text style={{ fontSize: 28 }}>💰</Text>
          <View style={styles.insightContent}>
            <Text style={[styles.insightLabel, { color: colors.textSecondary }]}>
              Savings Rate
            </Text>
            <Text style={[styles.insightValue, { color: colors.text }]}>
              {stats.totalIncome > 0 
                ? `${(((stats.totalIncome - stats.totalExpense) / stats.totalIncome) * 100).toFixed(1)}%`
                : '0%'
              }
            </Text>
          </View>
        </View>

        <View style={styles.insightRow}>
          <Text style={{ fontSize: 28 }}>📊</Text>
          <View style={styles.insightContent}>
            <Text style={[styles.insightLabel, { color: colors.textSecondary }]}>
              Avg Transaction
            </Text>
            <Text style={[styles.insightValue, { color: colors.text }]}>
              ${transactions.length > 0 
                ? (stats.totalExpense / transactions.filter(t => t.type === 'Expense').length || 0).toFixed(2)
                : '0.00'
              }
            </Text>
          </View>
        </View>
      </View>

      {/* EDIT PROFILE */}
      <View style={[styles.card, { backgroundColor: colors.cardBackground }]}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Edit Profile</Text>

        <View style={{ marginBottom: 16 }}>
          <Text style={[styles.inputLabel, { color: colors.text }]}>Username</Text>
          <TextInput
            style={[styles.input, { borderColor: colors.border, color: colors.text }]}
            placeholder="Username (3-30 characters)"
            value={profile.username}
            onChangeText={(text) => {
              if (text.length <= 30) {
                setProfile({ ...profile, username: text });
                if (text.length === 30) {
                  Alert.alert('Character Limit Reached', 'Username cannot exceed 30 characters');
                }
              } else {
                Alert.alert('Username Too Long', 'Username must be 30 characters or less');
              }
            }}
            editable={editing}
            maxLength={30}
          />
        </View>
        
        <View style={{ marginBottom: 16 }}>
          <Text style={[styles.inputLabel, { color: colors.text }]}>Email</Text>
          <TextInput
            style={[styles.input, { borderColor: colors.border, color: colors.text }]}
            placeholder="Email (max 100 characters)"
            value={profile.email}
            onChangeText={(text) => {
              if (text.length <= 100) {
                setProfile({ ...profile, email: text });
                if (text.length === 100) {
                  Alert.alert('Character Limit Reached', 'Email cannot exceed 100 characters');
                }
              } else {
                Alert.alert('Email Too Long', 'Email must be 100 characters or less');
              }
            }}
            editable={editing}
            maxLength={100}
          />
        </View>
        
        <View style={{ marginBottom: 16 }}>
          <Text style={[styles.inputLabel, { color: colors.text }]}>Monthly Allowance</Text>
          <TextInput
            style={[styles.input, { borderColor: colors.border, color: colors.text }]}
            placeholder="Enter monthly allowance ($)"
            keyboardType="decimal-pad"
            value={String(profile.monthlyAllowance)}
            onChangeText={(text) => {
              // Remove non-numeric characters except decimal point
              const cleaned = text.replace(/[^0-9.]/g, '');
              // Ensure only one decimal point
              const parts = cleaned.split('.');
              let formatted = parts[0];
              if (parts.length > 1) {
                formatted += '.' + parts.slice(1).join('').substring(0, 2);
              }
              // Cap at $1,000,000.00
              const numValue = parseFloat(formatted) || 0;
              if (numValue <= 1000000.00) {
                setProfile({ ...profile, monthlyAllowance: numValue });
              } else {
                Alert.alert(
                  'Maximum Limit Reached',
                  'Monthly allowance cannot exceed $1,000,000.00'
                );
              }
            }}
            editable={editing}
          />
        </View>

        {editing ? (
          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={[styles.cancelButton, { borderColor: colors.border }]}
              onPress={() => setEditing(false)}
              disabled={savingProfile}
            >
              <Text style={[styles.cancelButtonText, { color: colors.text }]}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.saveButton, { backgroundColor: colors.primary }]}
              onPress={handleSave}
              disabled={savingProfile}
            >
              {savingProfile ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text style={styles.saveButtonText}>Save Changes</Text>
              )}
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity
            style={[styles.editButton, { borderColor: colors.primary }]}
            onPress={() => setEditing(true)}
          >
            <Ionicons name="create-outline" size={20} color={colors.primary} />
            <Text style={[styles.editButtonText, { color: colors.primary }]}>
              Edit Profile
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {/* SECURITY */}
      <View style={[styles.card, { backgroundColor: colors.cardBackground }]}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Security</Text>
        
        <TouchableOpacity
          style={[styles.passwordButton, { borderColor: colors.border }]}
          onPress={() => setShowPasswordModal(true)}
        >
          <Ionicons name="lock-closed-outline" size={20} color={colors.primary} />
          <Text style={[styles.passwordButtonText, { color: colors.text }]}>
            Change Password
          </Text>
          <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
        </TouchableOpacity>
      </View>

      {/* ACTIONS */}
      <View style={[styles.card, { backgroundColor: colors.cardBackground }]}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Data & Account</Text>

        <TouchableOpacity style={styles.option} onPress={exportData}>
          <Ionicons name="share-outline" size={22} color={colors.text} />
          <Text style={[styles.optionText, { color: colors.text }]}>Export My Data</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.option} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={22} color={'red'} />
          <Text style={[styles.optionText, { color: 'red' }]}>Logout</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.option} onPress={() => setShowDeleteModal(true)}>
          <Ionicons name="trash-outline" size={22} color={'red'} />
          <Text style={[styles.optionText, { color: 'red' }]}>Delete Account</Text>
        </TouchableOpacity>
      </View>

      {/* DELETE ACCOUNT MODAL */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={showDeleteModal}
        onRequestClose={() => setShowDeleteModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.background }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>Delete Account</Text>
              <TouchableOpacity onPress={() => setShowDeleteModal(false)}>
                <Ionicons name="close" size={28} color={colors.text} />
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              <Text style={[styles.inputLabel, { color: colors.text, fontSize: 16, marginBottom: 16 }]}>
                ⚠️ Warning: This action cannot be undone!
              </Text>
              <Text style={[styles.tipsText, { color: colors.textSecondary, marginBottom: 20 }]}>
                Deleting your account will permanently remove all your data including:
                {'\n'}• Transactions
                {'\n'}• Budgets
                {'\n'}• Goals
                {'\n'}• Subscriptions
                {'\n'}• All other account data
              </Text>

              <Text style={[styles.inputLabel, { color: colors.text }]}>Enter Password to Confirm</Text>
              <TextInput
                style={[styles.input, { borderColor: colors.border, color: colors.text }]}
                placeholder="Enter your password"
                placeholderTextColor={colors.textSecondary}
                secureTextEntry
                value={deletePassword}
                onChangeText={setDeletePassword}
              />
            </View>

            <View style={{ flexDirection: 'row', padding: 20, gap: 12 }}>
              <TouchableOpacity
                style={[styles.modalCancelButton, { borderColor: colors.border }]}
                onPress={() => {
                  setShowDeleteModal(false);
                  setDeletePassword('');
                }}
                disabled={deletingAccount}
              >
                <Text style={[styles.modalCancelText, { color: colors.text }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalDeleteButton, { backgroundColor: colors.expense }]}
                onPress={handleDeleteAccount}
                disabled={deletingAccount}
              >
                {deletingAccount ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={styles.modalDeleteText}>Delete Account</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* PASSWORD CHANGE MODAL */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={showPasswordModal}
        onRequestClose={() => setShowPasswordModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.background }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>Change Password</Text>
              <TouchableOpacity onPress={() => setShowPasswordModal(false)}>
                <Ionicons name="close" size={28} color={colors.text} />
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              <Text style={[styles.inputLabel, { color: colors.text }]}>Current Password</Text>
              <TextInput
                style={[styles.input, { borderColor: colors.border, color: colors.text }]}
                placeholder="Enter current password"
                placeholderTextColor={colors.textSecondary}
                secureTextEntry
                value={passwordData.currentPassword}
                onChangeText={(text) => setPasswordData({ ...passwordData, currentPassword: text })}
              />

                            {/* New Password */}
              <Text style={[styles.inputLabel, { color: colors.text }]}>New Password</Text>
              <TextInput
                style={[styles.input, { borderColor: colors.border, color: colors.text }]}
                placeholder="Enter new password"
                placeholderTextColor={colors.textSecondary}
                secureTextEntry
                value={passwordData.newPassword}
                onChangeText={(text) => {
                  if (text.length <= 32) {
                    setPasswordData({ ...passwordData, newPassword: text });
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
                maxLength={32}
                onFocus={() => setNewPasswordFocused(true)}
                onBlur={() => setNewPasswordFocused(false)}
              />

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
              <Text style={[styles.inputLabel, { color: colors.text }]}>Confirm New Password</Text>
              <TextInput
                style={[styles.input, { borderColor: colors.border, color: colors.text }]}
                placeholder="Re-enter new password"
                placeholderTextColor={colors.textSecondary}
                secureTextEntry
                value={passwordData.confirmPassword}
                onChangeText={(text) => {
                  if (text.length <= 32) {
                    setPasswordData({ ...passwordData, confirmPassword: text });
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
                maxLength={32}
                onFocus={() => setConfirmPasswordFocused(true)}
                onBlur={() => setConfirmPasswordFocused(false)}
              />

              {confirmPasswordFocused && (
                <View style={styles.passwordRulesBox}>
                  <Text
                    style={[
                      styles.passwordRuleText,
                      {
                        color: getRuleColor(
                          confirmPass,
                          confirmMatchOk
                        ),
                      },
                    ]}
                  >
                    • Must match the new password exactly
                  </Text>
                </View>
              )}


             <TouchableOpacity
              style={[styles.modalSaveButton, { backgroundColor: colors.primary }]}
              onPress={handleChangePassword}
              disabled={changingPassword}
            >
              {changingPassword ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text style={styles.modalSaveText}>Change Password</Text>
              )}
            </TouchableOpacity>
            </View>  
          </View>       
        </View>            
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 20, paddingTop: 20, paddingBottom: 20 },
  backButtonContainer: { marginBottom: 10 },
  backButton: { padding: 8, alignSelf: 'flex-start' },
  backText: { fontSize: 16, color: '#2196F3', fontWeight: '600' },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: 25 },
  avatar: { width: 70, height: 70, borderRadius: 35, marginRight: 16 },
  name: { fontSize: 22, fontWeight: 'bold' },
  email: { fontSize: 14 },
  card: { borderRadius: 16, padding: 16, marginBottom: 20, elevation: 2 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 10 },
  statsRow: { flexDirection: 'row', justifyContent: 'space-between' },
  statBox: { alignItems: 'center', flex: 1 },
  statLabel: { fontSize: 13, marginBottom: 4 },
  statValue: { fontSize: 16, fontWeight: 'bold' },
  balanceCard: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(128, 128, 128, 0.2)',
    alignItems: 'center',
  },
  balanceLabel: {
    fontSize: 14,
    marginBottom: 8,
    fontWeight: '600',
  },
  balanceValue: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  insightRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(128, 128, 128, 0.1)',
  },
  insightContent: {
    marginLeft: 12,
    flex: 1,
  },
  insightLabel: {
    fontSize: 13,
    marginBottom: 4,
  },
  insightValue: {
    fontSize: 16,
    fontWeight: '600',
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 10,
    marginBottom: 10,
    fontSize: 15,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  cancelButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    paddingVertical: 12,
    borderRadius: 8,
  },
  cancelButtonText: {
    fontWeight: '600',
    fontSize: 15,
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    paddingVertical: 10,
    borderRadius: 8,
  },
  editButtonText: { marginLeft: 8, fontWeight: '600', fontSize: 15 },
  saveButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveButtonText: { color: '#fff', fontWeight: 'bold', fontSize: 15 },
  passwordButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 8,
    borderWidth: 1,
  },
  passwordButtonText: {
    flex: 1,
    fontSize: 15,
    fontWeight: '500',
    marginLeft: 12,
  },
  option: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10 },
  optionText: { fontSize: 15, marginLeft: 12, fontWeight: '500' },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingBottom: 40,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(128, 128, 128, 0.2)',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  modalBody: {
    padding: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    marginTop: 12,
  },
  passwordTips: {
    marginTop: 16,
    padding: 12,
    backgroundColor: 'rgba(100, 100, 100, 0.1)',
    borderRadius: 8,
  },
  tipsTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  tipsText: {
    fontSize: 13,
    marginBottom: 4,
  },
  modalSaveButton: {
    margin: 20,
    marginTop: 0,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  modalSaveText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  modalCancelButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCancelText: {
    fontWeight: '600',
    fontSize: 15,
  },
  modalDeleteButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalDeleteText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 15,
  },
    passwordRulesBox: {
    marginTop: 4,
    paddingVertical: 6,
    paddingHorizontal: 10,
    backgroundColor: 'rgba(100, 100, 100, 0.06)',
    borderRadius: 8,
  },
  passwordRuleText: {
    fontSize: 13,
    marginBottom: 2,
  },
});

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  Alert,
  ScrollView,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { getUserProfile, updateUserProfile } from '../services/authService';
import { getTransactionStats } from '../services/transactionService';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system';

export default function ProfileScreen() {
  const { colors } = useTheme();
  const { user, logout } = useAuth();

  const [stats, setStats] = useState({ totalIncome: 0, totalExpense: 0 });
  const [profile, setProfile] = useState({
    username: user?.username || '',
    email: user?.email || '',
    monthlyAllowance: 0,
  });
  const [editing, setEditing] = useState(false);

  const fallbackAvatar = 'https://cdn-icons-png.flaticon.com/512/149/149071.png';

  // Load profile and stats
  useEffect(() => {
    const loadProfile = async () => {
      try {
        const profileData = await getUserProfile();
        const data = await getTransactionStats();
        setStats(data);
        setProfile((prev) => ({
          ...prev,
          monthlyAllowance: profileData.monthlyAllowance || 0,
        }));
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
    try {
      await updateUserProfile(profile);
      setEditing(false);
      Alert.alert('Success', 'Profile updated successfully!');
    } catch (err) {
      console.error('Error saving profile:', err);
      Alert.alert('Error', 'Unable to save profile changes.');
    }
  };

  // Logout
  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Logout', style: 'destructive', onPress: logout },
    ]);
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
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
      </View>

      {/* EDIT PROFILE */}
      <View style={[styles.card, { backgroundColor: colors.cardBackground }]}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Edit Profile</Text>

        <TextInput
          style={[styles.input, { borderColor: colors.border, color: colors.text }]}
          placeholder="Username"
          value={profile.username}
          onChangeText={(text) => setProfile({ ...profile, username: text })}
          editable={editing}
        />
        <TextInput
          style={[styles.input, { borderColor: colors.border, color: colors.text }]}
          placeholder="Email"
          value={profile.email}
          onChangeText={(text) => setProfile({ ...profile, email: text })}
          editable={editing}
        />
        <TextInput
          style={[styles.input, { borderColor: colors.border, color: colors.text }]}
          placeholder="Monthly Allowance"
          keyboardType="numeric"
          value={String(profile.monthlyAllowance)}
          onChangeText={(text) =>
            setProfile({ ...profile, monthlyAllowance: parseFloat(text) || 0 })
          }
          editable={editing}
        />

        {editing ? (
          <TouchableOpacity
            style={[styles.saveButton, { backgroundColor: colors.primary }]}
            onPress={handleSave}
          >
            <Text style={styles.saveButtonText}>Save Changes</Text>
          </TouchableOpacity>
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
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 20, paddingTop: 50 },
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
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 10,
    marginBottom: 10,
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
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  saveButtonText: { color: '#fff', fontWeight: 'bold', fontSize: 15 },
  option: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10 },
  optionText: { fontSize: 15, marginLeft: 12, fontWeight: '500' },
});

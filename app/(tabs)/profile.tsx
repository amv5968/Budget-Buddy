import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import { Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';

export default function ProfileScreen() {
  const { user, logout } = useAuth();
  const { colors } = useTheme();
  const router = useRouter();

  const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background, padding: 20 },
    card: {
      backgroundColor: colors.cardBackground,
      borderRadius: 14,
      padding: 16,
      alignItems: 'center',
      gap: 8,
    },
    avatar: {
      width: 72,
      height: 72,
      borderRadius: 36,
      backgroundColor: colors.primary + '22',
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 8,
    },
    initial: { fontSize: 28, fontWeight: '700', color: colors.primary },
    name: { fontSize: 18, fontWeight: '700', color: colors.text },
    email: { fontSize: 14, color: colors.textSecondary },
    section: { marginTop: 20, backgroundColor: colors.cardBackground, borderRadius: 14, padding: 16, gap: 14 },
    row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    rowLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    rowText: { color: colors.text },
    logoutBtn: {
      marginTop: 'auto',
      backgroundColor: colors.danger ?? '#E53935',
      paddingVertical: 14,
      borderRadius: 12,
      alignItems: 'center',
    },
    logoutText: { color: 'white', fontWeight: '700', fontSize: 16 },
  });

  const initial = (user?.username || user?.email || 'U')[0]?.toUpperCase();

  const confirmLogout = () =>
    Alert.alert('Log out', 'Are you sure you want to log out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Log out',
        style: 'destructive',
        onPress: async () => {
          await logout();
          router.replace('/(auth)/login');
        },
      },
    ]);

  return (
    <View style={styles.container}>
      {/* Top card: avatar + identity */}
      <View style={styles.card}>
        <View style={styles.avatar}>
          <Text style={styles.initial}>{initial}</Text>
        </View>
        <Text style={styles.name}>{user?.username ?? 'User'}</Text>
        <Text style={styles.email}>{user?.email ?? '—'}</Text>
        <Text style={{ color: colors.textSecondary, marginTop: 2 }}>Signed in</Text>
      </View>

 {/* Simple profile items (no Settings here) */}
<View style={styles.section}>
  {/* View / Edit Profile */}
  <TouchableOpacity
    style={styles.row}
    onPress={() => router.push('/(tabs)/profile-edit')}
  >
    <View style={styles.rowLeft}>
      <Ionicons name="person-circle-outline" size={22} color={colors.text} />
      <Text style={styles.rowText}>View / Edit Profile</Text>
    </View>
    <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />
  </TouchableOpacity>

  {/* Privacy & Security */}
  <TouchableOpacity
    style={styles.row}
    onPress={() => router.push('/(tabs)/privacy')}
  >
    <View style={styles.rowLeft}>
      <Ionicons name="shield-checkmark-outline" size={22} color={colors.text} />
      <Text style={styles.rowText}>Privacy & Security</Text>
    </View>
    <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />
  </TouchableOpacity>

  {/* Help & Support */}
  <TouchableOpacity
    style={styles.row}
    onPress={() => router.push('/(tabs)/help')}
  >
    <View style={styles.rowLeft}>
      <Ionicons name="help-circle-outline" size={22} color={colors.text} />
      <Text style={styles.rowText}>Help & Support</Text>
    </View>
    <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />
  </TouchableOpacity>

  {/* About */}
  <TouchableOpacity
    style={styles.row}
    onPress={() => router.push('/(tabs)/about')}
  >
    <View style={styles.rowLeft}>
      <Ionicons
        name="information-circle-outline"
        size={22}
        color={colors.text}
      />
      <Text style={styles.rowText}>About</Text>
    </View>
    <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />
  </TouchableOpacity>
</View>


      {/* Logout lives only here */}
      <TouchableOpacity style={styles.logoutBtn} onPress={confirmLogout}>
        <Text style={styles.logoutText}>Log out</Text>
      </TouchableOpacity>
    </View>
  );
}
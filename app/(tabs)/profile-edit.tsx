// app/(tabs)/profile-edit.tsx
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { updateMe } from '../services/userService';

/**
 * Edit Profile screen
 * - Lets the user change display name (username)
 * - Calls PUT /api/users/me and updates local auth state
 */
export default function ProfileEditScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { user, token: ctxToken, setUser } = useAuth() as any;
  const [username, setUsername] = useState<string>(user?.username ?? '');
  const [saving, setSaving] = useState(false);

  const styles = useMemo(
    () =>
      StyleSheet.create({
        // Used by KeyboardAvoidingView
        wrap: {
          flex: 1,
          backgroundColor: colors.background,
          padding: 16,
        },
        header: {
          fontSize: 20,
          fontWeight: '700',
          color: colors.text,
          marginBottom: 12,
        },
        body: { paddingTop: 4 },
        label: { color: colors.textSecondary, marginBottom: 6, fontWeight: '600' },
        input: {
          backgroundColor: colors.cardBackground,
          borderColor: colors.border,
          borderWidth: 1,
          borderRadius: 10,
          paddingHorizontal: 12,
          paddingVertical: 12,
          color: colors.text,
          marginBottom: 12,
        },
        hint: { color: colors.textTertiary, marginTop: -4, marginBottom: 16, fontSize: 12 },
        button: {
          backgroundColor: colors.primary,
          paddingVertical: 14,
          borderRadius: 12,
          alignItems: 'center',
          opacity: saving ? 0.6 : 1,
        },
        buttonText: { color: 'white', fontWeight: '700', fontSize: 16 },
      }),
    [colors, saving]
  );

  async function getToken(): Promise<string | null> {
    if (ctxToken) return ctxToken as string;
    try {
      const t = await AsyncStorage.getItem('authtoken');
      return t;
    } catch {
      return null;
    }
  }

  const onSave = async () => {
    const trimmed = username.trim();
    if (!trimmed) {
      Alert.alert('Name required', 'Please enter a display name.');
      return;
    }

    setSaving(true);
    try {
      const token = await getToken();
      if (!token) throw new Error('Not authenticated (no token). Please log in again.');

      const updated = await updateMe(token, { username: trimmed });

      // Update local auth state so Profile reflects immediately
      if (setUser) setUser((prev: any) => ({ ...(prev ?? {}), ...updated }));

      Alert.alert('Saved', 'Your profile has been updated.', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (e: any) {
      Alert.alert('Update failed', e?.message ?? 'Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.wrap}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {/* 🔙 Back Button */}
      <TouchableOpacity
        onPress={() => router.back()}
        style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}
      >
        <Ionicons name="arrow-back" size={24} color={colors.text} />
        <Text style={{ color: colors.text, fontSize: 16, marginLeft: 6 }}>Back</Text>
      </TouchableOpacity>

      {/* Header */}
      <Text style={styles.header}>Edit Profile</Text>

      <View style={styles.body}>
        <Text style={styles.label}>Display name</Text>
        <TextInput
          value={username}
          onChangeText={setUsername}
          placeholder="Your name"
          placeholderTextColor={colors.textTertiary}
          autoCapitalize="words"
          style={styles.input}
        />

        <Text style={styles.label}>Email</Text>
        <TextInput value={user?.email ?? ''} editable={false} style={[styles.input, { opacity: 0.7 }]} />
        <Text style={styles.hint}>Email is tied to your account and can’t be changed here.</Text>

        <TouchableOpacity disabled={saving} style={styles.button} onPress={onSave}>
          <Text style={styles.buttonText}>{saving ? 'Saving…' : 'Save changes'}</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

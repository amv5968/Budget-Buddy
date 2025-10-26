import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
    KeyboardAvoidingView,
    Platform,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity
} from 'react-native';
import { useTheme } from '../../context/ThemeContext';

export default function EditUsernameScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const [username, setUsername] = useState('');

  const handleSave = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    console.log('Username updated:', username);
    router.back();
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
        <Text style={[styles.backText, { color: colors.primary }]}>← Back</Text>
      </TouchableOpacity>

      <Text style={[styles.title, { color: colors.text }]}>Edit Username</Text>

      <TextInput
        style={[styles.input, { backgroundColor: colors.cardBackground, color: colors.text }]}
        placeholder="Enter new username"
        placeholderTextColor={colors.textSecondary}
        value={username}
        onChangeText={setUsername}
      />

      <TouchableOpacity
        style={[styles.saveButton, { backgroundColor: colors.primary }]}
        onPress={handleSave}
      >
        <Text style={styles.saveText}>Save</Text>
      </TouchableOpacity>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  backButton: { marginTop: 60, marginBottom: 20 },
  backText: { fontSize: 16, fontWeight: '600' },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 20 },
  input: {
    borderRadius: 10,
    padding: 15,
    fontSize: 16,
    marginBottom: 30,
  },
  saveButton: {
    paddingVertical: 16,
    borderRadius: 10,
    alignItems: 'center',
  },
  saveText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
});

import { useRouter } from 'expo-router';
import { Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useTheme } from '../context/ThemeContext';

export default function ProfileScreen() {
  const { colors, theme } = useTheme();
  const router = useRouter();

  return (
    <ScrollView
      contentContainerStyle={[styles.container, { backgroundColor: colors.background }]}
    >
      {/* 👤 Profile Header */}
      <View style={styles.header}>
        <Image
          source={{ uri: 'https://i.pravatar.cc/200' }}
          style={[styles.avatar, { borderColor: colors.border }]}
        />
        <Text style={[styles.name, { color: colors.text }]}>John Doe</Text>
        <Text style={[styles.email, { color: colors.textSecondary }]}>john.doe@email.com</Text>
      </View>

      {/* ⚙️ Options Section */}
      <View style={styles.section}>
        <TouchableOpacity
          style={[styles.option, { borderBottomColor: colors.border }]}
          onPress={() => router.push('/edit-profile')}
        >
          <Text style={[styles.optionText, { color: colors.text }]}>Edit Profile</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.option, { borderBottomColor: colors.border }]}
          onPress={() => router.push('/settings')}
        >
          <Text style={[styles.optionText, { color: colors.text }]}>Settings</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.option, { borderBottomColor: colors.border }]}
          onPress={() => router.push('/help')}
        >
          <Text style={[styles.optionText, { color: colors.text }]}>Help & Support</Text>
        </TouchableOpacity>
      </View>

      {/* 🚪 Logout */}
      <TouchableOpacity
        style={[styles.logoutButton, { backgroundColor: colors.primary }]}
        onPress={() => alert('Logging out...')}
      >
        <Text style={[styles.logoutText, { color: colors.buttonText }]}>Log Out</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingTop: 40,
    alignItems: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 2,
    marginBottom: 12,
  },
  name: {
    fontSize: 22,
    fontWeight: '600',
  },
  email: {
    fontSize: 14,
    marginTop: 4,
  },
  section: {
    width: '100%',
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 40,
  },
  option: {
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
  },
  optionText: {
    fontSize: 16,
  },
  logoutButton: {
    width: '80%',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  logoutText: {
    fontSize: 16,
    fontWeight: '600',
  },
});
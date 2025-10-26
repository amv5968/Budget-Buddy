import { useRouter } from 'expo-router';
import {
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useTheme } from '../context/ThemeContext';

export default function ProfileScreen() {
  const { colors, theme } = useTheme();
  const router = useRouter();

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={{ paddingBottom: 40 }}
    >
      {/* 🔙 Header */}
      <View style={[styles.header, { backgroundColor: colors.card }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Text style={[styles.backText, { color: colors.primary }]}>← Back</Text>
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.text }]}>Profile</Text>
      </View>

      {/* 👤 Profile Info */}
      <View style={styles.profileSection}>
        <Image
          source={{ uri: 'https://i.pravatar.cc/200' }}
          style={[styles.avatar, { borderColor: colors.border }]}
        />
        <Text style={[styles.name, { color: colors.text }]}>John Doe</Text>
        <Text style={[styles.email, { color: colors.textSecondary }]}>
          john.doe@email.com
        </Text>
      </View>

      {/* ✏️ Account Settings */}
      <View style={styles.section}>
        <Text style={[styles.label, { color: colors.text }]}>Account Settings</Text>

        <TouchableOpacity
          style={[styles.option, { borderColor: colors.border }]}
          onPress={() => router.push('/edit-username')}
        >
          <Text style={[styles.optionText, { color: colors.text }]}>
            Edit Username
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.option, { borderColor: colors.border }]}
          onPress={() => router.push('/edit-password')}
        >
          <Text style={[styles.optionText, { color: colors.text }]}>
            Change Password
          </Text>
        </TouchableOpacity>
      </View>

      {/* ⚙️ Other Options */}
      <View style={styles.section}>
        <Text style={[styles.label, { color: colors.text }]}>More Options</Text>

        <TouchableOpacity
          style={[styles.option, { borderColor: colors.border }]}
          onPress={() => router.push('/settings')}
        >
          <Text style={[styles.optionText, { color: colors.text }]}>Settings</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.option, { borderColor: colors.border }]}
          onPress={() => router.push('/help')}
        >
          <Text style={[styles.optionText, { color: colors.text }]}>
            Help & Support
          </Text>
        </TouchableOpacity>
      </View>

      {/* 🚪 Logout */}
      <TouchableOpacity
        style={[styles.logoutButton, { backgroundColor: colors.primary }]}
        onPress={() => alert('Logging out...')}
      >
        <Text style={[styles.logoutText, { color: colors.buttonText }]}>
          Log Out
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  backButton: {
    marginBottom: 12,
  },
  backText: {
    fontSize: 16,
    fontWeight: '600',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  profileSection: {
    alignItems: 'center',
    marginVertical: 30,
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
    marginHorizontal: 20,
    marginBottom: 30,
    backgroundColor: 'white',
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  option: {
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderTopWidth: 1,
  },
  optionText: {
    fontSize: 16,
    fontWeight: '500',
  },
  logoutButton: {
    marginHorizontal: 20,
    marginTop: 10,
    paddingVertical: 16,
    borderRadius: 10,
    alignItems: 'center',
    shadowColor: '#66BB6A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  logoutText: {
    fontSize: 16,
    fontWeight: '600',
  },
});
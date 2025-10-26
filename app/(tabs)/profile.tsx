import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import {
  Alert,
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

  const handleNavigate = (path: string) => {
    Haptics.selectionAsync();
    router.push(path);
  };

  const handleLogout = () => {
    Haptics.selectionAsync();
    Alert.alert('Confirm Logout', 'Are you sure you want to log out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Log Out',
        style: 'destructive',
        onPress: () => console.log('User logged out'),
      },
    ]);
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={{ paddingBottom: 40 }}
    >
      {/* 🔙 Header */}
      <View style={[styles.header, { backgroundColor: colors.cardBackground }]}>
        <TouchableOpacity onPress={() => router.push('/home')} style={styles.backButton}>
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
      <View
        style={[
          styles.section,
          { backgroundColor: colors.cardBackground, borderColor: colors.border },
        ]}
      >
        <Text style={[styles.label, { color: colors.text }]}>Account Settings</Text>

        <TouchableOpacity
          style={[styles.option, { borderColor: colors.border }]}
          onPress={() => router.push('/profile-tabs/edit-username')}
        >
          <Text style={[styles.optionText, { color: colors.text }]}>
            Edit Username
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.option, { borderColor: colors.border }]}
          onPress={() => router.push('/profile-tabs/edit-password')}
        >
          <Text style={[styles.optionText, { color: colors.text }]}>
            Change Password
          </Text>
        </TouchableOpacity>

      </View>

      {/* ⚙️ More Options */}
      <View
        style={[
          styles.section,
          { backgroundColor: colors.cardBackground, borderColor: colors.border },
        ]}
      >
        <Text style={[styles.label, { color: colors.text }]}>More Options</Text>

        <TouchableOpacity
          style={[styles.option, { borderColor: colors.border }]}
          onPress={() => handleNavigate('/settings')}
        >
          <Text style={[styles.optionText, { color: colors.text }]}>Settings</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.option, { borderColor: colors.border }]}
          onPress={() => handleNavigate('/help')}
        >
          <Text style={[styles.optionText, { color: colors.text }]}>Help & Support</Text>
        </TouchableOpacity>
      </View>

      {/* 🚪 Logout */}
      <TouchableOpacity
        style={[styles.logoutButton, { backgroundColor: colors.primary }]}
        onPress={handleLogout}
      >
        <Text style={[styles.logoutText, { color: '#fff' }]}>Log Out</Text>
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
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
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
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

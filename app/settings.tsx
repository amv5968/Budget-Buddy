import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { useTheme } from '../context/ThemeContext';

export default function SettingsScreen() {
  const router = useRouter();
  const { theme, themeMode, setThemeMode, colors } = useTheme();

    const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [weeklySummary, setWeeklySummary] = useState(true);
  const [budgetAlerts, setBudgetAlerts] = useState(true);
  const [goalUpdates, setGoalUpdates] = useState(true);
  const [lowBalanceAlert, setLowBalanceAlert] = useState(true);
  const [largeTransactionAlert, setLargeTransactionAlert] = useState(true);
  const [lowBalanceThreshold, setLowBalanceThreshold] = useState('50');
  const [largeTransactionThreshold, setLargeTransactionThreshold] = useState('100');
  const [currency, setCurrency] = useState('USD');
  
  const [notifications, setNotifications] = useState([
    {
      id: '1',
      type: 'warning',
      title: 'Budget Alert',
      message: "You've spent 85% of your Food budget this month. Consider reducing dining out.",
      date: new Date().toISOString(),
      read: false,
      icon: '🍔',
    },
    {
      id: '2',
      type: 'success',
      title: 'Goal Milestone',
      message: "Great job! You're 50% of the way to your 'Emergency Fund' goal. Keep saving!",
      date: new Date(Date.now() - 86400000).toISOString(),
      read: false,
      icon: '🎯',
    },
  ]);

  const handleSave = () => {
    Alert.alert('✅ Settings Saved', 'Your preferences have been updated.');
  };

  const dynamicStyles = StyleSheet.create({
    container: {
      flexGrow: 1,
      backgroundColor: colors.background,
      paddingTop: 60,
      paddingHorizontal: 20,
      paddingBottom: 50,
    },
    headerRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 25,
    },
    backButton: {
      marginRight: 12,
      backgroundColor: colors.border,
      padding: 8,
      borderRadius: 8,
    },
    header: {
      fontSize: 26,
      fontWeight: 'bold',
      color: colors.text,
    },
    section: {
      backgroundColor: colors.cardBackground,
      borderRadius: 12,
      padding: 20,
      marginBottom: 20,
    },
    sectionHeader: {
      fontSize: 18,
      fontWeight: 'bold',
      marginBottom: 15,
      color: colors.text,
    },
    row: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 15,
    },
    label: {
      fontSize: 16,
      color: colors.text,
    },
    subLabel: {
      fontSize: 14,
      marginTop: 10,
      color: colors.textSecondary,
    },
    input: {
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 10,
      padding: 10,
      marginTop: 5,
      color: colors.text,
      backgroundColor: colors.background,
    },
    saveButton: {
      backgroundColor: colors.primary,
      paddingVertical: 15,
      borderRadius: 12,
      alignItems: 'center',
      elevation: 3,
    },
    saveButtonText: {
      color: '#fff',
      fontWeight: 'bold',
      fontSize: 16,
    },
    themeOption: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 12,
      borderRadius: 8,
      marginBottom: 10,
      borderWidth: 2,
    },
    themeOptionSelected: {
      borderColor: colors.primary,
      backgroundColor: colors.primary + '20',
    },
    themeOptionUnselected: {
      borderColor: colors.border,
      backgroundColor: 'transparent',
    },
    themeOptionText: {
      fontSize: 16,
      marginLeft: 10,
      color: colors.text,
    },
  });

  return (
    <ScrollView contentContainerStyle={dynamicStyles.container}>
      {/* 🔙 Header with Back Button */}
      <View style={dynamicStyles.headerRow}>
        <TouchableOpacity onPress={() => router.back()} style={dynamicStyles.backButton}>
          <Ionicons name="arrow-back" size={26} color={colors.text} />
        </TouchableOpacity>
        <Text style={dynamicStyles.header}>Settings</Text>
      </View>

      {/* Appearance Section */}
      <View style={dynamicStyles.section}>
        <Text style={dynamicStyles.sectionHeader}>Appearance</Text>
        
        <TouchableOpacity
          style={[
            dynamicStyles.themeOption,
            themeMode === 'light' ? dynamicStyles.themeOptionSelected : dynamicStyles.themeOptionUnselected
          ]}
          onPress={() => setThemeMode('light')}
        >
          <Text style={{ fontSize: 24 }}>☀️</Text>
          <Text style={dynamicStyles.themeOptionText}>Light Mode</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            dynamicStyles.themeOption,
            themeMode === 'dark' ? dynamicStyles.themeOptionSelected : dynamicStyles.themeOptionUnselected
          ]}
          onPress={() => setThemeMode('dark')}
        >
          <Text style={{ fontSize: 24 }}>🌙</Text>
          <Text style={dynamicStyles.themeOptionText}>Dark Mode</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            dynamicStyles.themeOption,
            themeMode === 'auto' ? dynamicStyles.themeOptionSelected : dynamicStyles.themeOptionUnselected
          ]}
          onPress={() => setThemeMode('auto')}
        >
          <Text style={{ fontSize: 24 }}>🔄</Text>
          <Text style={dynamicStyles.themeOptionText}>Auto (System)</Text>
        </TouchableOpacity>
      </View>

      {/* Notifications Section */}
      <View style={dynamicStyles.section}>
        <Text style={dynamicStyles.sectionHeader}>Notifications</Text>

        <View style={dynamicStyles.row}>
          <Text style={dynamicStyles.label}>Enable Notifications</Text>
          <Switch 
            value={notificationsEnabled} 
            onValueChange={setNotificationsEnabled} 
            trackColor={{ true: colors.primary }}
          />
        </View>

        <View style={dynamicStyles.row}>
          <Text style={dynamicStyles.label}>Weekly Summary</Text>
          <Switch 
            value={weeklySummary} 
            onValueChange={setWeeklySummary} 
            trackColor={{ true: colors.primary }}
            disabled={!notificationsEnabled}
          />
        </View>

        <View style={dynamicStyles.row}>
          <Text style={dynamicStyles.label}>Budget Alerts</Text>
          <Switch 
            value={budgetAlerts} 
            onValueChange={setBudgetAlerts} 
            trackColor={{ true: colors.primary }}
            disabled={!notificationsEnabled}
          />
        </View>

        <View style={dynamicStyles.row}>
          <Text style={dynamicStyles.label}>Goal Updates</Text>
          <Switch 
            value={goalUpdates} 
            onValueChange={setGoalUpdates} 
            trackColor={{ true: colors.primary }}
            disabled={!notificationsEnabled}
          />
        </View>

        <View style={dynamicStyles.row}>
          <Text style={dynamicStyles.label}>Low Balance Alerts</Text>
          <Switch 
            value={lowBalanceAlert} 
            onValueChange={setLowBalanceAlert} 
            trackColor={{ true: colors.primary }}
            disabled={!notificationsEnabled}
          />
        </View>

        <View style={dynamicStyles.row}>
          <Text style={dynamicStyles.label}>Large Transaction Alerts</Text>
          <Switch 
            value={largeTransactionAlert} 
            onValueChange={setLargeTransactionAlert} 
            trackColor={{ true: colors.primary }}
            disabled={!notificationsEnabled}
          />
        </View>

        <Text style={dynamicStyles.subLabel}>Low Balance Threshold ($)</Text>
        <TextInput
          style={dynamicStyles.input}
          value={lowBalanceThreshold}
          keyboardType="numeric"
          onChangeText={setLowBalanceThreshold}
          placeholderTextColor={colors.textTertiary}
        />

        <Text style={dynamicStyles.subLabel}>Large Transaction Threshold ($)</Text>
        <TextInput
          style={dynamicStyles.input}
          value={largeTransactionThreshold}
          keyboardType="numeric"
          onChangeText={setLargeTransactionThreshold}
          placeholderTextColor={colors.textTertiary}
        />

        <Text style={[dynamicStyles.sectionHeader, { marginTop: 20 }]}>Recent Notifications</Text>
        {notifications.map(notification => (
          <View
            key={notification.id}
            style={[
              {
                backgroundColor: colors.background,
                padding: 15,
                borderRadius: 10,
                marginBottom: 10,
                borderLeftWidth: 4,
                borderLeftColor: notification.type === 'warning' ? colors.warning : 
                               notification.type === 'success' ? colors.success : 
                               notification.type === 'danger' ? colors.danger : colors.info
              },
              !notification.read && { backgroundColor: colors.primary + '10' }
            ]}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 5 }}>
              <Text style={{ fontSize: 20, marginRight: 8 }}>{notification.icon}</Text>
              <Text style={{ flex: 1, fontSize: 16, fontWeight: 'bold', color: colors.text }}>
                {notification.title}
              </Text>
              <Text style={{ fontSize: 12, color: colors.textSecondary }}>
                {new Date(notification.date).toLocaleDateString()}
              </Text>
            </View>
            <Text style={{ fontSize: 14, color: colors.textSecondary }}>
              {notification.message}
            </Text>
          </View>
        ))}
      </View>

      {/* Preferences Section */}
      <View style={dynamicStyles.section}>
        <Text style={dynamicStyles.sectionHeader}>Preferences</Text>
        <Text style={dynamicStyles.subLabel}>Currency</Text>
        <TextInput
          style={dynamicStyles.input}
          value={currency}
          onChangeText={setCurrency}
          placeholderTextColor={colors.textTertiary}
        />
      </View>

      {/* Save Button */}
      <TouchableOpacity style={dynamicStyles.saveButton} onPress={handleSave}>
        <Text style={dynamicStyles.saveButtonText}>Save Settings</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

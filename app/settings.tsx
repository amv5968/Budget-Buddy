import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState, useEffect } from 'react';
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
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '../context/ThemeContext';
import { scheduleWeeklySummary, scheduleDailyTransactionReminder } from './services/notificationService';

const SETTINGS_KEY = 'bb.settings.v1';

export default function SettingsScreen() {
  const router = useRouter();
  const { theme, themeMode, setThemeMode, colors } = useTheme();

  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [weeklySummary, setWeeklySummary] = useState(true);
  const [budgetAlerts, setBudgetAlerts] = useState(true);
  const [goalUpdates, setGoalUpdates] = useState(true);
  const [lowBalanceAlert, setLowBalanceAlert] = useState(true);
  const [largeTransactionAlert, setLargeTransactionAlert] = useState(true);
  const [transactionAlerts, setTransactionAlerts] = useState(true);
  const [dailySummaryAlert, setDailySummaryAlert] = useState(true);
  
  const [lowBalanceThreshold, setLowBalanceThreshold] = useState('50');
  const [largeTransactionThreshold, setLargeTransactionThreshold] = useState('100');
  
  // Time settings
  const [dailySummaryHour, setDailySummaryHour] = useState('20');
  const [dailySummaryMinute, setDailySummaryMinute] = useState('0');
  const [weeklySummaryHour, setWeeklySummaryHour] = useState('9');
  const [weeklySummaryMinute, setWeeklySummaryMinute] = useState('0');
  
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

  // Load settings on mount
  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const raw = await AsyncStorage.getItem(SETTINGS_KEY);
      if (raw) {
        const settings = JSON.parse(raw);
        setNotificationsEnabled(settings.notificationsEnabled ?? true);
        setWeeklySummary(settings.weeklySummary ?? true);
        setBudgetAlerts(settings.budgetAlerts ?? true);
        setGoalUpdates(settings.goalUpdates ?? true);
        setLowBalanceAlert(settings.lowBalance ?? true);
        setLargeTransactionAlert(settings.largeTx ?? true);
        setTransactionAlerts(settings.transactionAlerts ?? true);
        setDailySummaryAlert(settings.dailySummaryAlert ?? true);
        setLowBalanceThreshold(settings.lowBalanceThreshold?.toString() ?? '50');
        setLargeTransactionThreshold(settings.largeTxThreshold?.toString() ?? '100');
        setDailySummaryHour(settings.dailySummaryHour?.toString() ?? '20');
        setDailySummaryMinute(settings.dailySummaryMinute?.toString() ?? '0');
        setWeeklySummaryHour(settings.weeklySummaryHour?.toString() ?? '9');
        setWeeklySummaryMinute(settings.weeklySummaryMinute?.toString() ?? '0');
        setCurrency(settings.currency ?? 'USD');
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  };

  const validateTimeInput = (value: string, max: number): string => {
    const num = parseInt(value) || 0;
    return Math.min(Math.max(0, num), max).toString();
  };

const handleSave = async () => {
  try {
    const settings = {
      notificationsEnabled,
      weeklySummary,
      budgetAlerts,
      goalUpdates,
      lowBalance: lowBalanceAlert,
      largeTx: largeTransactionAlert,
      transactionAlerts,
      dailySummaryAlert,
      lowBalanceThreshold: parseFloat(lowBalanceThreshold) || 50,
      largeTxThreshold: parseFloat(largeTransactionThreshold) || 100,
      dailySummaryHour: parseInt(dailySummaryHour) || 20,
      dailySummaryMinute: parseInt(dailySummaryMinute) || 0,
      weeklySummaryHour: parseInt(weeklySummaryHour) || 9,
      weeklySummaryMinute: parseInt(weeklySummaryMinute) || 0,
      currency,
    };

    await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));

    // Update notification schedules with custom times
    if (notificationsEnabled && weeklySummary) {
      await scheduleWeeklySummary(
        true, 
        settings.weeklySummaryHour, 
        settings.weeklySummaryMinute
      );
    } else {
      await scheduleWeeklySummary(false);
    }

    if (notificationsEnabled && dailySummaryAlert) {
      await scheduleDailyTransactionReminder(
        true,
        settings.dailySummaryHour,
        settings.dailySummaryMinute
      );
    } else {
      await scheduleDailyTransactionReminder(false);
    }

    Alert.alert('✅ Settings Saved', 'Your preferences have been updated and notifications have been rescheduled.');
  } catch (error) {
    console.error('Error saving settings:', error);
    Alert.alert('Error', 'Failed to save settings');
  }
};

  const formatTime = (hour: string, minute: string): string => {
    const h = parseInt(hour) || 0;
    const m = parseInt(minute) || 0;
    const period = h >= 12 ? 'PM' : 'AM';
    const displayHour = h === 0 ? 12 : h > 12 ? h - 12 : h;
    return `${displayHour}:${m.toString().padStart(2, '0')} ${period}`;
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
      marginBottom: 5,
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
    timeInputContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: 5,
      marginBottom: 15,
    },
    timeInput: {
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 10,
      padding: 10,
      color: colors.text,
      backgroundColor: colors.background,
      width: 60,
      textAlign: 'center',
      fontSize: 16,
      fontWeight: '600',
    },
    timeSeparator: {
      fontSize: 20,
      fontWeight: 'bold',
      color: colors.text,
      marginHorizontal: 8,
    },
    timePreview: {
      marginLeft: 12,
      fontSize: 14,
      color: colors.primary,
      fontWeight: '600',
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
      {/* Header with Back Button */}
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
          <Text style={dynamicStyles.label}>Transaction Alerts</Text>
          <Switch 
            value={transactionAlerts} 
            onValueChange={setTransactionAlerts} 
            trackColor={{ true: colors.primary }}
            disabled={!notificationsEnabled}
          />
        </View>

        <View style={dynamicStyles.row}>
          <Text style={dynamicStyles.label}>Daily Summary</Text>
          <Switch 
            value={dailySummaryAlert} 
            onValueChange={setDailySummaryAlert} 
            trackColor={{ true: colors.primary }}
            disabled={!notificationsEnabled}
          />
        </View>

        {dailySummaryAlert && notificationsEnabled && (
          <>
            <Text style={dynamicStyles.subLabel}>Daily Summary Time</Text>
            <View style={dynamicStyles.timeInputContainer}>
              <TextInput
                style={dynamicStyles.timeInput}
                value={dailySummaryHour}
                keyboardType="numeric"
                onChangeText={(text) => setDailySummaryHour(validateTimeInput(text, 23))}
                placeholder="HH"
                maxLength={2}
              />
              <Text style={dynamicStyles.timeSeparator}>:</Text>
              <TextInput
                style={dynamicStyles.timeInput}
                value={dailySummaryMinute}
                keyboardType="numeric"
                onChangeText={(text) => setDailySummaryMinute(validateTimeInput(text, 59))}
                placeholder="MM"
                maxLength={2}
              />
              <Text style={dynamicStyles.timePreview}>
                {formatTime(dailySummaryHour, dailySummaryMinute)}
              </Text>
            </View>
          </>
        )}

        <View style={dynamicStyles.row}>
          <Text style={dynamicStyles.label}>Weekly Summary</Text>
          <Switch 
            value={weeklySummary} 
            onValueChange={setWeeklySummary} 
            trackColor={{ true: colors.primary }}
            disabled={!notificationsEnabled}
          />
        </View>

        {weeklySummary && notificationsEnabled && (
          <>
            <Text style={dynamicStyles.subLabel}>Weekly Summary Time (Mondays)</Text>
            <View style={dynamicStyles.timeInputContainer}>
              <TextInput
                style={dynamicStyles.timeInput}
                value={weeklySummaryHour}
                keyboardType="numeric"
                onChangeText={(text) => setWeeklySummaryHour(validateTimeInput(text, 23))}
                placeholder="HH"
                maxLength={2}
              />
              <Text style={dynamicStyles.timeSeparator}>:</Text>
              <TextInput
                style={dynamicStyles.timeInput}
                value={weeklySummaryMinute}
                keyboardType="numeric"
                onChangeText={(text) => setWeeklySummaryMinute(validateTimeInput(text, 59))}
                placeholder="MM"
                maxLength={2}
              />
              <Text style={dynamicStyles.timePreview}>
                {formatTime(weeklySummaryHour, weeklySummaryMinute)}
              </Text>
            </View>
          </>
        )}

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
          placeholderTextColor={colors.textSecondary}
        />

        <Text style={dynamicStyles.subLabel}>Large Transaction Threshold ($)</Text>
        <TextInput
          style={dynamicStyles.input}
          value={largeTransactionThreshold}
          keyboardType="numeric"
          onChangeText={setLargeTransactionThreshold}
          placeholderTextColor={colors.textSecondary}
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
          placeholderTextColor={colors.textSecondary}
        />
      </View>

      {/* Save Button */}
      <TouchableOpacity style={dynamicStyles.saveButton} onPress={handleSave}>
        <Text style={dynamicStyles.saveButtonText}>Save Settings</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}
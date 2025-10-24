import React, { useState } from 'react';
import {
    Alert,
    ScrollView,
    StyleSheet,
    Switch,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { useTheme } from '../../context/ThemeContext';

interface Notification {
  id: string;
  type: 'success' | 'warning' | 'info' | 'danger';
  title: string;
  message: string;
  date: string;
  read: boolean;
  icon: string;
}

const NotificationsScreen: React.FC = () => {
  const { colors } = useTheme();
  const [notifications, setNotifications] = useState<Notification[]>([
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
    {
      id: '3',
      type: 'info',
      title: 'Weekly Summary',
      message: 'This week you spent $245 and earned $450. Your savings rate: 45.5%',
      date: new Date(Date.now() - 86400000 * 2).toISOString(),
      read: true,
      icon: '📊',
    },
    {
      id: '4',
      type: 'danger',
      title: 'Low Balance Alert',
      message: 'Your account balance is below $50. Consider reviewing your expenses.',
      date: new Date(Date.now() - 86400000 * 3).toISOString(),
      read: true,
      icon: '⚠️',
    },
    {
      id: '5',
      type: 'info',
      title: 'New Resource Available',
      message: 'Check out the new Penn State Student Financial Workshop this Friday at 2 PM.',
      date: new Date(Date.now() - 86400000 * 5).toISOString(),
      read: true,
      icon: '📚',
    },
    {
      id: '6',
      type: 'success',
      title: 'Income Received',
      message: 'Your paycheck of $500 has been added to your account.',
      date: new Date(Date.now() - 86400000 * 7).toISOString(),
      read: true,
      icon: '💰',
    },
  ]);

  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [budgetAlerts, setBudgetAlerts] = useState(true);
  const [goalUpdates, setGoalUpdates] = useState(true);
  const [weeklySummary, setWeeklySummary] = useState(true);

  const unreadCount = notifications.filter(n => !n.read).length;

  const markAsRead = (id: string) => {
    setNotifications(prev =>
      prev.map(n => (n.id === id ? { ...n, read: true } : n))
    );
  };

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    Alert.alert('✅ Success', 'All notifications marked as read');
  };

  const clearAll = () => {
    Alert.alert(
      'Clear All Notifications',
      'Are you sure you want to clear all notifications?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: () => {
            setNotifications([]);
            Alert.alert('✅ Success', 'All notifications cleared');
          },
        },
      ]
    );
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'success':
        return colors.success;
      case 'warning':
        return colors.warning;
      case 'danger':
        return colors.danger;
      case 'info':
        return colors.info;
      default:
        return colors.textSecondary;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const dynamicStyles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    headerSection: {
      backgroundColor: colors.cardBackground,
      paddingTop: 60,
      paddingBottom: 20,
      paddingHorizontal: 20,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    headerRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    title: {
      fontSize: 24,
      fontWeight: '700',
      color: colors.text,
      marginBottom: 8,
    },
    badge: {
      backgroundColor: colors.danger,
      borderRadius: 12,
      paddingHorizontal: 8,
      paddingVertical: 4,
      minWidth: 24,
      alignItems: 'center',
    },
    badgeText: {
      color: '#fff',
      fontSize: 12,
      fontWeight: '700',
    },
    subtitle: {
      fontSize: 14,
      color: colors.textSecondary,
    },
    actionButtons: {
      flexDirection: 'row',
      paddingHorizontal: 20,
      paddingVertical: 12,
      backgroundColor: colors.cardBackground,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    actionButton: {
      flex: 1,
      paddingVertical: 8,
      paddingHorizontal: 12,
      marginHorizontal: 4,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: colors.border,
      alignItems: 'center',
    },
    actionButtonText: {
      fontSize: 13,
      fontWeight: '600',
      color: colors.text,
    },
    content: {
      padding: 20,
    },
    settingsSection: {
      backgroundColor: colors.cardBackground,
      borderRadius: 12,
      padding: 16,
      marginBottom: 20,
      borderWidth: 1,
      borderColor: colors.border,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: '700',
      color: colors.text,
      marginBottom: 16,
    },
    settingRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 12,
    },
    settingLabel: {
      fontSize: 15,
      color: colors.text,
    },
    notificationCard: {
      backgroundColor: colors.cardBackground,
      borderRadius: 12,
      padding: 16,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: colors.border,
      borderLeftWidth: 4,
    },
    notificationUnread: {
      backgroundColor: colors.primary + '10',
    },
    notificationHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 8,
    },
    notificationIcon: {
      fontSize: 24,
      marginRight: 10,
    },
    notificationTitle: {
      fontSize: 16,
      fontWeight: '700',
      color: colors.text,
      flex: 1,
    },
    notificationDate: {
      fontSize: 11,
      color: colors.textSecondary,
    },
    notificationMessage: {
      fontSize: 14,
      color: colors.textSecondary,
      lineHeight: 20,
      marginBottom: 8,
    },
    readButton: {
      alignSelf: 'flex-start',
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 6,
      backgroundColor: colors.border,
    },
    readButtonText: {
      fontSize: 12,
      color: colors.textSecondary,
      fontWeight: '600',
    },
    emptyState: {
      padding: 40,
      alignItems: 'center',
    },
    emptyIcon: {
      fontSize: 64,
      marginBottom: 16,
    },
    emptyText: {
      fontSize: 18,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 8,
    },
    emptySubtext: {
      fontSize: 14,
      color: colors.textSecondary,
      textAlign: 'center',
    },
  });

  return (
    <View style={dynamicStyles.container}>
      {/* Header */}
      <View style={dynamicStyles.headerSection}>
        <View style={dynamicStyles.headerRow}>
          <Text style={dynamicStyles.title}>🔔 Notifications</Text>
          {unreadCount > 0 && (
            <View style={dynamicStyles.badge}>
              <Text style={dynamicStyles.badgeText}>{unreadCount}</Text>
            </View>
          )}
        </View>
        <Text style={dynamicStyles.subtitle}>
          {unreadCount > 0
            ? `You have ${unreadCount} unread notification${unreadCount > 1 ? 's' : ''}`
            : 'All caught up!'}
        </Text>
      </View>

      {/* Action Buttons */}
      {notifications.length > 0 && (
        <View style={dynamicStyles.actionButtons}>
          <TouchableOpacity style={dynamicStyles.actionButton} onPress={markAllAsRead}>
            <Text style={dynamicStyles.actionButtonText}>Mark All Read</Text>
          </TouchableOpacity>
          <TouchableOpacity style={dynamicStyles.actionButton} onPress={clearAll}>
            <Text style={[dynamicStyles.actionButtonText, { color: colors.danger }]}>
              Clear All
            </Text>
          </TouchableOpacity>
        </View>
      )}

      <ScrollView style={dynamicStyles.content}>
        {/* Notification Settings */}
        <View style={dynamicStyles.settingsSection}>
          <Text style={dynamicStyles.sectionTitle}>Notification Settings</Text>

          <View style={dynamicStyles.settingRow}>
            <Text style={dynamicStyles.settingLabel}>Enable Notifications</Text>
            <Switch
              value={notificationsEnabled}
              onValueChange={setNotificationsEnabled}
              trackColor={{ true: colors.primary }}
            />
          </View>

          <View style={dynamicStyles.settingRow}>
            <Text style={dynamicStyles.settingLabel}>Budget Alerts</Text>
            <Switch
              value={budgetAlerts}
              onValueChange={setBudgetAlerts}
              trackColor={{ true: colors.primary }}
              disabled={!notificationsEnabled}
            />
          </View>

          <View style={dynamicStyles.settingRow}>
            <Text style={dynamicStyles.settingLabel}>Goal Updates</Text>
            <Switch
              value={goalUpdates}
              onValueChange={setGoalUpdates}
              trackColor={{ true: colors.primary }}
              disabled={!notificationsEnabled}
            />
          </View>

          <View style={dynamicStyles.settingRow}>
            <Text style={dynamicStyles.settingLabel}>Weekly Summary</Text>
            <Switch
              value={weeklySummary}
              onValueChange={setWeeklySummary}
              trackColor={{ true: colors.primary }}
              disabled={!notificationsEnabled}
            />
          </View>
        </View>

        {/* Notifications List */}
        <Text style={dynamicStyles.sectionTitle}>Recent Notifications</Text>
        {notifications.length === 0 ? (
          <View style={dynamicStyles.emptyState}>
            <Text style={dynamicStyles.emptyIcon}>🔕</Text>
            <Text style={dynamicStyles.emptyText}>No notifications</Text>
            <Text style={dynamicStyles.emptySubtext}>
              You're all caught up! We'll notify you when there's something new.
            </Text>
          </View>
        ) : (
          notifications.map(notification => (
            <TouchableOpacity
              key={notification.id}
              style={[
                dynamicStyles.notificationCard,
                !notification.read && dynamicStyles.notificationUnread,
                { borderLeftColor: getTypeColor(notification.type) },
              ]}
              onPress={() => markAsRead(notification.id)}
            >
              <View style={dynamicStyles.notificationHeader}>
                <Text style={dynamicStyles.notificationIcon}>{notification.icon}</Text>
                <Text style={dynamicStyles.notificationTitle}>{notification.title}</Text>
                <Text style={dynamicStyles.notificationDate}>
                  {formatDate(notification.date)}
                </Text>
              </View>
              <Text style={dynamicStyles.notificationMessage}>{notification.message}</Text>
              {!notification.read && (
                <TouchableOpacity
                  style={dynamicStyles.readButton}
                  onPress={() => markAsRead(notification.id)}
                >
                  <Text style={dynamicStyles.readButtonText}>Mark as Read</Text>
                </TouchableOpacity>
              )}
            </TouchableOpacity>
          ))
        )}
      </ScrollView>
    </View>
  );
};

export default NotificationsScreen;


import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

// How notifications behave when they fire while the app is foregrounded
Notifications.setNotificationHandler({
  // We widen the return type to avoid TS complaining about platform-specific fields
  handleNotification: async (): Promise<any> => {
    return {
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
      shouldShowBanner: true, // iOS style
      shouldShowList: true,   // iOS style
    };
  },
});

// Ask user for notification permissions (mainly iOS)
export async function requestNotificationPermission() {
  const settings = await Notifications.getPermissionsAsync();

  if (settings.status !== 'granted') {
    const req = await Notifications.requestPermissionsAsync();
    return req.status === 'granted';
  }

  return true;
}

/**
 * Schedule a one-time local reminder notification for a specific Date.
 * @param dateObj JS Date in the FUTURE (local time)
 * @param message Body text to show in the notification
 */
export async function scheduleReminderNotification(dateObj: Date, message: string) {
  // Android requires a channel for notifications with sound/importance
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('reminders', {
      name: 'Budget Buddy Reminders',
      importance: Notifications.AndroidImportance.HIGH,
    });
  }

  // Newer Expo SDKs want an explicit trigger object with type: DATE
  const trigger: Notifications.NotificationTriggerInput = {
    type: Notifications.SchedulableTriggerInputTypes.DATE,
    date: dateObj,
  };

  return Notifications.scheduleNotificationAsync({
    content: {
      title: 'Budget Buddy 💸',
      body: message,
      sound: true,
      priority: Notifications.AndroidNotificationPriority.HIGH,
    },
    trigger,
  });
}

// app/services/notificationService.ts

import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getTransactionStats, type Transaction } from '../services/transactionService';

// key used to store user alert preferences
const SETTINGS_KEY = 'bb.settings.v1';

/**
 * Make sure Android has a notification channel.
 * On Android 8+, you MUST register a channel before scheduling notifications,
 * or they silently won't show.
 */
async function ensureAndroidChannel() {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'Default',
      importance: Notifications.AndroidImportance.DEFAULT,
    });
  }
}

/**
 * Ask the OS for notification permission.
 * Returns true if we are allowed to show notifications.
 */
export async function requestNotificationPermission(): Promise<boolean> {
  // check current status
  let { status } = await Notifications.getPermissionsAsync();

  // if not granted, ask
  if (status !== 'granted') {
    const req = await Notifications.requestPermissionsAsync();
    status = req.status;
  }

  // make sure Android has a channel
  await ensureAndroidChannel();

  return status === 'granted';
}

/**
 * Schedule a single reminder notification at a specific date/time.
 * `date` should be a JS Date for when you want it to fire.
 * `body` is the message to show in the notification.
 */
export async function scheduleReminder(date: Date, body: string) {
  await ensureAndroidChannel();

  // Android will reject triggers in the past or basically "now",
  // so we force it to be at least ~1.5s in the future.
  const triggerDate = new Date(
    Math.max(date.getTime(), Date.now() + 1500)
  );

  return Notifications.scheduleNotificationAsync({
    content: {
      title: 'Reminder',
      body,
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DATE,
      date: triggerDate,
    },
  });
}

/**
 * Turn on/off a repeating weekly summary notification.
 * - If enabled = false: cancel everything so we don't duplicate.
 * - If enabled = true: schedule "every Monday 9:00 AM, repeats".
 */
export async function scheduleWeeklySummary(enabled: boolean) {
  // Clear out any old scheduled notifications so we don't stack them.
  await Notifications.cancelAllScheduledNotificationsAsync();

  if (!enabled) return;

  await ensureAndroidChannel();

  await Notifications.scheduleNotificationAsync({
    content: {
      title: 'Weekly Summary',
      body: 'Check your spending summary in Budget Buddy!',
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.CALENDAR,
      weekday: 1, // Monday (1 = Monday in Expo's calendar trigger)
      hour: 9,    // 9 AM
      minute: 0,
      repeats: true,
    } as Notifications.CalendarTriggerInput,
  });
}

/**
 * Fire immediate alerts under certain conditions:
 * - Low balance alert (if user's balance drops under their threshold)
 * - Large transaction alert (if a new transaction exceeds a threshold)
 *
 * You call this after creating/saving a transaction.
 */
export async function maybeTriggerThresholdAlerts(newTx?: Transaction) {
  const raw = await AsyncStorage.getItem(SETTINGS_KEY);
  if (!raw) return; // no settings saved, nothing to check

  const settings = JSON.parse(raw);

  // LOW BALANCE ALERT
  // -----------------
  // settings.lowBalance: boolean flag "do low balance alerts?"
  // settings.lowBalanceThreshold: number (like 100)
  if (settings.lowBalance) {
    const stats = await getTransactionStats(); // assumes this returns { totalIncome, totalExpense }
    const balance = stats.totalIncome - stats.totalExpense;

    if (balance < settings.lowBalanceThreshold) {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: '⚠️ Low Balance Alert',
          body: `Your balance is below $${settings.lowBalanceThreshold}.`,
        },
        trigger: null, // null = fire immediately
      });
    }
  }

  // LARGE TRANSACTION ALERT
  // -----------------------
  // settings.largeTx: boolean "do large tx alerts?"
  // settings.largeTxThreshold: number like 200
  if (
    settings.largeTx &&
    newTx &&
    newTx.amount >= settings.largeTxThreshold
  ) {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: '💸 Large Transaction',
        body: `${newTx.category}: $${newTx.amount.toFixed(2)}`,
      },
      trigger: null, // fire immediately
    });
  }
}

/**
 * We also provide a default export object so you can do:
 *   import notificationService from '../services/notificationService';
 *   await notificationService.requestNotificationPermission();
 *   await notificationService.scheduleReminder(...);
 */
const notificationService = {
  requestNotificationPermission,
  scheduleReminder,
  scheduleWeeklySummary,
  maybeTriggerThresholdAlerts,
};

export default notificationService;

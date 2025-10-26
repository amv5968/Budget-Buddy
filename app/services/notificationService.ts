// app/services/notificationService.ts
import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getTransactionStats, type Transaction } from '../services/transactionService';

const SETTINGS_KEY = 'bb.settings.v1';

// Schedule weekly summary notification
export async function scheduleWeeklySummary(enabled: boolean) {
  await Notifications.cancelAllScheduledNotificationsAsync();
  if (!enabled) return;

  await Notifications.scheduleNotificationAsync({
    content: {
      title: 'Weekly Summary',
      body: 'Check your spending summary in Budget Buddy!',
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.CALENDAR,
      weekday: 1, // Monday
      hour: 9, // 9 AM
      minute: 0,
      repeats: true,
    } as Notifications.CalendarTriggerInput,
  });
}

// Trigger balance or transaction alerts
export async function maybeTriggerThresholdAlerts(newTx?: Transaction) {
  const raw = await AsyncStorage.getItem(SETTINGS_KEY);
  if (!raw) return;
  const settings = JSON.parse(raw);

  // Low balance alert
  if (settings.lowBalance) {
    const stats = await getTransactionStats();
    const balance = stats.totalIncome - stats.totalExpense;
    if (balance < settings.lowBalanceThreshold) {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: '⚠️ Low Balance Alert',
          body: `Your balance is below $${settings.lowBalanceThreshold}.`,
        },
        trigger: null,
      });
    }
  }

  // Large transaction alert
  if (settings.largeTx && newTx && newTx.amount >= settings.largeTxThreshold) {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: '💸 Large Transaction',
        body: `${newTx.category}: $${newTx.amount.toFixed(2)}`,
      },
      trigger: null,
    });
  }
}

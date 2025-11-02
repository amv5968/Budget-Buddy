
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { getTransactionStats, type Transaction } from '../services/transactionService';

// 🔑 AsyncStorage key for notification settings
const SETTINGS_KEY = 'bb_notification_settings';

// ===== Default foreground behavior (ONE handler only) =====
Notifications.setNotificationHandler({
  // widen type to avoid TS complaining about iOS-only fields
  handleNotification: async (): Promise<any> => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true, // iOS
    shouldShowList: true,   // iOS
  }),
});

// ===== Permissions =====
export async function requestNotificationPermissions() {
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    console.log('🔕 Notification permissions not granted');
    return false;
  }
  return true;
}

// ===== Simple one-off reminder used by HomeScreen =====
// 👉 This is the function your Home screen imports.
export async function scheduleReminderNotification(fireDate: Date, body: string) {
  const trigger: Notifications.DateTriggerInput = {
    type: Notifications.SchedulableTriggerInputTypes.DATE,
    date: fireDate,
  };

  await Notifications.scheduleNotificationAsync({
    content: { title: '💡 Reminder', body },
    trigger, // ✅ typed trigger object
  });
}

// ===== Helpers for repeating triggers (Android timing helpers) =====
function getSecondsUntilTime(hour: number, minute: number): number {
  const now = new Date();
  const target = new Date();
  target.setHours(hour, minute, 0, 0);
  if (target <= now) target.setDate(target.getDate() + 1);
  return Math.floor((target.getTime() - now.getTime()) / 1000);
}

function getSecondsUntilMonday(hour: number, minute: number): number {
  const now = new Date();
  const target = new Date();
  target.setHours(hour, minute, 0, 0);
  const daysUntilMonday = (1 + 7 - now.getDay()) % 7 || 7; // 1 = Monday
  target.setDate(now.getDate() + daysUntilMonday);
  if (target <= now) target.setDate(target.getDate() + 7);
  return Math.floor((target.getTime() - now.getTime()) / 1000);
}

// ===== Daily summary (settings screen toggle) =====
export async function scheduleDailyTransactionReminder(
  enabled: boolean,
  hour: number = 20,
  minute: number = 0
) {
  // cancel previous daily summaries
  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  for (const n of scheduled) {
    if (n.content.title?.includes('Daily Summary')) {
      await Notifications.cancelScheduledNotificationAsync(n.identifier);
    }
  }
  if (!enabled) return;

  const hasPermission = await requestNotificationPermissions();
  if (!hasPermission) return;

  if (Platform.OS === 'ios') {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: '📊 Daily Summary',
        body: 'Check your spending for today in Budget Buddy!',
        data: { type: 'daily_summary' },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.CALENDAR,
        hour,
        minute,
        repeats: true,
      } as Notifications.CalendarTriggerInput,
    });
  } else {
    // first fire at the next occurrence today/tomorrow
    const secondsUntilTime = getSecondsUntilTime(hour, minute);
    await Notifications.scheduleNotificationAsync({
      content: {
        title: '📊 Daily Summary',
        body: 'Check your spending for today in Budget Buddy!',
        data: { type: 'daily_summary' },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
        seconds: secondsUntilTime,
        repeats: false,
      },
    });

    // then repeat daily
    await Notifications.scheduleNotificationAsync({
      content: {
        title: '📊 Daily Summary',
        body: 'Check your spending for today in Budget Buddy!',
        data: { type: 'daily_summary' },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour,
        minute,
        repeats: true,
      } as Notifications.DailyTriggerInput,
    });
  }
}

// ===== Instant alert when a transaction is added =====
export async function notifyNewTransaction(transaction: Transaction) {
  const hasPermission = await requestNotificationPermissions();
  if (!hasPermission) return;

  const raw = await AsyncStorage.getItem(SETTINGS_KEY);
  const settings = raw ? JSON.parse(raw) : { transactionAlerts: true };
  if (!settings.transactionAlerts) return;

  const emoji = transaction.type === 'Income' ? '💰' : '💸';
  const sign = transaction.type === 'Income' ? '+' : '-';

  await Notifications.scheduleNotificationAsync({
    content: {
      title: `${emoji} ${transaction.type} Added`,
      body: `${transaction.category}: ${sign}$${Math.abs(transaction.amount).toFixed(2)}`,
      data: { type: 'transaction', transactionId: transaction._id, date: transaction.date },
    },
    trigger: null, // immediate
  });
}

// ===== “Tap a date” summary =====
export async function notifyDateTransactions(date: string, transactions: Transaction[]) {
  const hasPermission = await requestNotificationPermissions();
  if (!hasPermission) return;

  const d = new Date(date);
  const pretty = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

  if (transactions.length === 0) {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: `📅 ${pretty}`,
        body: 'No transactions on this date. Tap to add one!',
        data: { type: 'date_summary', date, hasTransactions: false },
      },
      trigger: null,
    });
    return;
  }

  const income = transactions.filter(t => t.type === 'Income').reduce((s, t) => s + t.amount, 0);
  const expense = transactions.filter(t => t.type === 'Expense').reduce((s, t) => s + Math.abs(t.amount), 0);

  await Notifications.scheduleNotificationAsync({
    content: {
      title: `📅 ${pretty} - ${transactions.length} Transaction${transactions.length !== 1 ? 's' : ''}`,
      body: `Income: $${income.toFixed(2)} | Expenses: $${expense.toFixed(2)}`,
      data: { type: 'date_summary', date, hasTransactions: true },
    },
    trigger: null,
  });
}

// ===== Weekly summary =====
export async function scheduleWeeklySummary(enabled: boolean, hour: number = 9, minute: number = 0) {
  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  for (const n of scheduled) {
    if (n.content.title?.includes('Weekly Summary')) {
      await Notifications.cancelScheduledNotificationAsync(n.identifier);
    }
  }
  if (!enabled) return;

  const hasPermission = await requestNotificationPermissions();
  if (!hasPermission) return;

  if (Platform.OS === 'ios') {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: '📊 Weekly Summary',
        body: 'Check your spending summary in Budget Buddy!',
        data: { type: 'weekly_summary' },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.CALENDAR,
        weekday: 2, // Monday (iOS: 1=Sun)
        hour,
        minute,
        repeats: true,
      } as Notifications.CalendarTriggerInput,
    });
  } else {
    // first fire next Monday
    const secondsUntilMonday = getSecondsUntilMonday(hour, minute);
    await Notifications.scheduleNotificationAsync({
      content: {
        title: '📊 Weekly Summary',
        body: 'Check your spending summary in Budget Buddy!',
        data: { type: 'weekly_summary' },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
        seconds: secondsUntilMonday,
        repeats: false,
      },
    });

    // then repeat weekly
    await Notifications.scheduleNotificationAsync({
      content: {
        title: '📊 Weekly Summary',
        body: 'Check your spending summary in Budget Buddy!',
        data: { type: 'weekly_summary' },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
        weekday: 2, // Monday
        hour,
        minute,
        repeats: true,
      } as Notifications.WeeklyTriggerInput,
    });
  }
}

// ===== Conditional alerts (low balance / large tx) =====
export async function maybeTriggerThresholdAlerts(newTx?: Transaction) {
  const hasPermission = await requestNotificationPermissions();
  if (!hasPermission) return;

  const raw = await AsyncStorage.getItem(SETTINGS_KEY);
  if (!raw) return;
  const settings = JSON.parse(raw);

  // Low balance
  if (settings.lowBalance) {
    const stats = await getTransactionStats();
    const balance = stats.totalIncome - stats.totalExpense;
    if (balance < settings.lowBalanceThreshold) {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: '⚠️ Low Balance Alert',
          body: `Your balance is below $${settings.lowBalanceThreshold}.`,
          data: { type: 'low_balance' },
        },
        trigger: null,
      });
    }
  }

  // Large transaction
  if (settings.largeTx && newTx && newTx.amount >= settings.largeTxThreshold) {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: '💸 Large Transaction',
        body: `${newTx.category}: $${newTx.amount.toFixed(2)}`,
        data: { type: 'large_transaction' },
      },
      trigger: null,
    });
  }
}

// ===== Budget threshold crossings (75/90/100%) =====
export async function notifyBudgetThreshold(percentage: number, spent: number, total: number) {
  const hasPermission = await requestNotificationPermissions();
  if (!hasPermission) return;

  if (percentage < 75) return;

  const meta =
    percentage >= 100
      ? { emoji: '🚨', title: 'Budget Exceeded!' }
      : percentage >= 90
      ? { emoji: '⚠️', title: 'Nearly at Limit!' }
      : { emoji: '💡', title: 'Spending Alert' };

  await Notifications.scheduleNotificationAsync({
    content: {
      title: `${meta.emoji} ${meta.title}`,
      body: `You've spent ${percentage.toFixed(0)}% of your monthly allowance ($${spent.toFixed(
        2
      )} / $${total.toFixed(2)})`,
      data: { type: 'budget_alert', percentage },
    },
    trigger: null,
  });
}

// ===== Utilities =====
export async function getAllNotifications() {
  const delivered = await Notifications.getPresentedNotificationsAsync();
  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  return { delivered, scheduled };
}

export async function clearAllNotifications() {
  await Notifications.dismissAllNotificationsAsync();
}

export async function cancelAllScheduledNotifications() {
  await Notifications.cancelAllScheduledNotificationsAsync();
}

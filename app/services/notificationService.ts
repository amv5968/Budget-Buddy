// app/services/notificationService.ts
import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { getTransactionStats, type Transaction } from '../services/transactionService';

const SETTINGS_KEY = 'bb.settings.v1';

// Configure notification handler
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

// Request permissions
export async function requestNotificationPermissions() {
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;
  
  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }
  
  if (finalStatus !== 'granted') {
    console.log('Notification permissions not granted');
    return false;
  }
  
  return true;
}

// Calculate seconds until next occurrence of a specific time
function getSecondsUntilTime(hour: number, minute: number): number {
  const now = new Date();
  const target = new Date();
  target.setHours(hour, minute, 0, 0);
  
  if (target <= now) {
    target.setDate(target.getDate() + 1);
  }
  
  return Math.floor((target.getTime() - now.getTime()) / 1000);
}

// Calculate seconds until next Monday at specific time
function getSecondsUntilMonday(hour: number, minute: number): number {
  const now = new Date();
  const target = new Date();
  target.setHours(hour, minute, 0, 0);
  
  const daysUntilMonday = (1 + 7 - now.getDay()) % 7 || 7;
  target.setDate(now.getDate() + daysUntilMonday);
  
  if (target <= now) {
    target.setDate(target.getDate() + 7);
  }
  
  return Math.floor((target.getTime() - now.getTime()) / 1000);
}

// Schedule daily transaction summary notification
export async function scheduleDailyTransactionReminder(enabled: boolean, hour: number = 20, minute: number = 0) {
  // Cancel existing daily reminders
  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  for (const notif of scheduled) {
    if (notif.content.title?.includes('Daily Summary')) {
      await Notifications.cancelScheduledNotificationAsync(notif.identifier);
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
    // Android: Use daily repeating trigger
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
    
    // Schedule repeating daily notification
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

// Send immediate notification for new transaction
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
      data: { 
        type: 'transaction', 
        transactionId: transaction._id,
        date: transaction.date 
      },
    },
    trigger: null, // Immediate
  });
}

// Send notification for transactions on selected calendar date
export async function notifyDateTransactions(date: string, transactions: Transaction[]) {
  const hasPermission = await requestNotificationPermissions();
  if (!hasPermission) return;

  const dateObj = new Date(date);
  const formattedDate = dateObj.toLocaleDateString('en-US', { 
    month: 'short', 
    day: 'numeric',
    year: 'numeric'
  });

  // If no transactions, still send notification
  if (transactions.length === 0) {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: `📅 ${formattedDate}`,
        body: 'No transactions on this date. Tap to add one!',
        data: { type: 'date_summary', date, hasTransactions: false },
      },
      trigger: null,
    });
    return;
  }

  // Calculate totals
  const income = transactions
    .filter(t => t.type === 'Income')
    .reduce((sum, t) => sum + t.amount, 0);
  
  const expense = transactions
    .filter(t => t.type === 'Expense')
    .reduce((sum, t) => sum + Math.abs(t.amount), 0);

  await Notifications.scheduleNotificationAsync({
    content: {
      title: `📅 ${formattedDate} - ${transactions.length} Transaction${transactions.length !== 1 ? 's' : ''}`,
      body: `Income: $${income.toFixed(2)} | Expenses: $${expense.toFixed(2)}`,
      data: { type: 'date_summary', date, hasTransactions: true },
    },
    trigger: null,
  });
}

// Schedule weekly summary notification
export async function scheduleWeeklySummary(enabled: boolean, hour: number = 9, minute: number = 0) {
  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  for (const notif of scheduled) {
    if (notif.content.title?.includes('Weekly Summary')) {
      await Notifications.cancelScheduledNotificationAsync(notif.identifier);
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
        weekday: 2, // Monday (iOS uses 1=Sunday)
        hour,
        minute,
        repeats: true,
      } as Notifications.CalendarTriggerInput,
    });
  } else {
    // Android: Schedule for next Monday
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
    
    // Schedule repeating weekly notification
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

// Trigger balance or transaction alerts
export async function maybeTriggerThresholdAlerts(newTx?: Transaction) {
  const hasPermission = await requestNotificationPermissions();
  if (!hasPermission) return;

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
          data: { type: 'low_balance' },
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
        data: { type: 'large_transaction' },
      },
      trigger: null,
    });
  }
}

// Budget threshold alerts
export async function notifyBudgetThreshold(percentage: number, spent: number, total: number) {
  const hasPermission = await requestNotificationPermissions();
  if (!hasPermission) return;

  let title = '';
  let emoji = '';
  
  if (percentage >= 100) {
    emoji = '🚨';
    title = 'Budget Exceeded!';
  } else if (percentage >= 90) {
    emoji = '⚠️';
    title = 'Nearly at Limit!';
  } else if (percentage >= 75) {
    emoji = '💡';
    title = 'Spending Alert';
  } else {
    return; // Don't notify below 75%
  }

  await Notifications.scheduleNotificationAsync({
    content: {
      title: `${emoji} ${title}`,
      body: `You've spent ${percentage.toFixed(0)}% of your monthly allowance ($${spent.toFixed(2)} / $${total.toFixed(2)})`,
      data: { type: 'budget_alert', percentage },
    },
    trigger: null,
  });
}

// Get all scheduled and delivered notifications
export async function getAllNotifications() {
  const delivered = await Notifications.getPresentedNotificationsAsync();
  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  return { delivered, scheduled };
}

// Clear all notifications
export async function clearAllNotifications() {
  await Notifications.dismissAllNotificationsAsync();
}

// Cancel all scheduled notifications
export async function cancelAllScheduledNotifications() {
  await Notifications.cancelAllScheduledNotificationsAsync();
}
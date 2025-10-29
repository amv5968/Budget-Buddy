// app/(tabs)/index.tsx

import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Modal,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import { Calendar } from 'react-native-calendars';
import { PieChart } from 'react-native-chart-kit';

import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';

// backend / services
import {
  getUserProfile,
  updateMonthlyAllowance,
} from '../services/authService';

import type { Reminder } from '../services/reminderStore';
import {
  addReminder,
  getReminders,
  getRemindersForDate,
} from '../services/reminderStore';

import {
  getTransactions,
  getTransactionStats,
  Transaction,
} from '../services/transactionService';

// notifications service (default export object with the functions)
import notificationService from '../services/notificationService';

const screenWidth = Dimensions.get('window').width;

export default function HomeScreen() {
  const { user, logout } = useAuth();
  const { colors } = useTheme();
  const router = useRouter();

  // --- dashboard data ---
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [allTransactions, setAllTransactions] = useState<Transaction[]>([]);
  const [totalIncome, setTotalIncome] = useState(0);
  const [totalExpense, setTotalExpense] = useState(0);

  // --- ui / fetch state ---
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // --- calendar state ---
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedDateTransactions, setSelectedDateTransactions] = useState<
    Transaction[]
  >([]);
  const [isDateDetailVisible, setIsDateDetailVisible] = useState(false);

  // --- reminders state ---
  const [dayReminders, setDayReminders] = useState<Reminder[]>([]);
  const [allRemindersByDate, setAllRemindersByDate] = useState<{
    [date: string]: number;
  }>({});
  const [isAddReminderVisible, setIsAddReminderVisible] = useState(false);
  const [newReminderTime, setNewReminderTime] = useState('09:00'); // HH:MM
  const [newReminderMessage, setNewReminderMessage] = useState('');

  // --- allowance / budget ---
  const [monthlyAllowance, setMonthlyAllowance] = useState(1000);
  const [isAllowanceModalVisible, setIsAllowanceModalVisible] = useState(false);
  const [tempAllowance, setTempAllowance] = useState('1000');

  // derived values
  const remaining = monthlyAllowance - totalExpense;
  const spentPercentage =
    monthlyAllowance > 0 ? (totalExpense / monthlyAllowance) * 100 : 0;

  // --- overspend alert throttling ---
  const [lastAlertPercentage, setLastAlertPercentage] = useState(0);

  // refresh data whenever screen focuses
  useFocusEffect(
    useCallback(() => {
      const refreshDashboard = async () => {
        await loadAllowance();
        await loadData();
        await loadAllRemindersForCalendar();

        // After loading reminders from backend
        const allReminders = await getReminders();

        // Ask permission ONCE before trying to schedule local notifications
        const granted =
          await notificationService.requestNotificationPermission();

        // Re-schedule local notifications for all upcoming reminders
        if (granted) {
          for (const r of allReminders) {
            const [hh, mm] = r.time.split(':'); // "HH:MM"
            const [yyyy, mon, dd] = r.date.split('-'); // "YYYY-MM-DD"

            const fireDate = new Date(
              Number(yyyy),
              Number(mon) - 1,
              Number(dd),
              Number(hh),
              Number(mm),
              0,
              0
            );

            // only schedule if it's still in the future
            if (fireDate.getTime() > Date.now()) {
              await notificationService.scheduleReminder(
                fireDate,
                r.message
              );
            }
          }
        }
      };

      refreshDashboard();
      setLastAlertPercentage(0);
    }, [])
  );

  // --- load allowance from backend ---
  const loadAllowance = async () => {
    try {
      const profile = await getUserProfile();
      const dbAllowance = profile.monthlyAllowance ?? 1000;

      setMonthlyAllowance(dbAllowance);
      setTempAllowance(dbAllowance.toString());
    } catch (error) {
      console.error('Error loading allowance:', error);
      Alert.alert(
        'Connection Error',
        'Unable to load allowance from server. Please check your backend connection.',
        [{ text: 'OK' }]
      );
      // fallback
      setMonthlyAllowance(1000);
      setTempAllowance('1000');
    }
  };

  // --- save allowance to backend ---
  const saveAllowance = async () => {
    try {
      const amount = parseFloat(tempAllowance);
      if (isNaN(amount) || amount <= 0) {
        Alert.alert('Invalid Amount', 'Please enter a valid amount');
        return;
      }

      await updateMonthlyAllowance(amount);
      setMonthlyAllowance(amount);
      setIsAllowanceModalVisible(false);
      Alert.alert('✅ Success', 'Monthly allowance updated!');
    } catch (error) {
      console.error('Error saving allowance:', error);
      Alert.alert(
        'Save Failed',
        'Unable to save to database. Please check your backend connection.',
        [{ text: 'OK' }]
      );
    }
  };

  // --- load dashboard data: transactions + stats ---
  const loadData = async () => {
    try {
      const [transData, statsData] = await Promise.all([
        getTransactions(),
        getTransactionStats(),
      ]);

      setAllTransactions(transData);
      setTransactions(transData.slice(0, 5));
      setTotalIncome(statsData.totalIncome);
      setTotalExpense(statsData.totalExpense);

      // alert logic after fresh totals
      checkSpendingAlerts(statsData.totalExpense);
    } catch (error: any) {
      console.error('Error loading data:', error);
      if (error.response?.status === 401) {
        Alert.alert('Session Expired', 'Please login again');
        await logout();
        router.replace('/(auth)/login');
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // --- build reminder map for calendar dots ---
  const loadAllRemindersForCalendar = async () => {
    try {
      const all = await getReminders(); // Reminder[]
      const map: { [date: string]: number } = {};

      all.forEach(r => {
        if (!map[r.date]) {
          map[r.date] = 1;
        } else {
          map[r.date] += 1;
        }
      });

      setAllRemindersByDate(map);
    } catch (err) {
      console.error('Failed to load reminders for calendar', err);
    }
  };

  // --- budget alert thresholds ---
  const checkSpendingAlerts = (expense: number) => {
    const percentage =
      monthlyAllowance > 0 ? (expense / monthlyAllowance) * 100 : 0;

    if (percentage >= 100 && lastAlertPercentage < 100 && expense > 0) {
      setLastAlertPercentage(100);
      Alert.alert(
        '🚨 Budget Exceeded!',
        `You've spent $${expense.toFixed(
          2
        )} out of your $${monthlyAllowance.toFixed(
          2
        )} monthly allowance.\n\nYou're over budget by $${(
          expense - monthlyAllowance
        ).toFixed(2)}!`,
        [{ text: 'Got it', style: 'default' }]
      );
    } else if (
      percentage >= 90 &&
      lastAlertPercentage < 90 &&
      percentage < 100
    ) {
      setLastAlertPercentage(90);
      Alert.alert(
        '⚠️ Nearly at Limit!',
        `You've spent ${percentage.toFixed(
          0
        )}% of your monthly allowance.\n\nOnly $${(
          monthlyAllowance - expense
        ).toFixed(2)} remaining!`,
        [{ text: 'Okay', style: 'default' }]
      );
    } else if (
      percentage >= 75 &&
      lastAlertPercentage < 75 &&
      percentage < 90
    ) {
      setLastAlertPercentage(75);
      Alert.alert(
        '💡 Spending Alert',
        `You've used ${percentage.toFixed(
          0
        )}% of your monthly allowance.\n\n$${(
          monthlyAllowance - expense
        ).toFixed(2)} left to spend.`,
        [{ text: 'Thanks', style: 'default' }]
      );
    }
  };

  // --- handle calendar day tap ---
  const handleDateSelect = async (day: { dateString: string }) => {
    setSelectedDate(day.dateString);

    // filter transactions for that date
    const filtered = allTransactions.filter(transaction => {
      const transDate = new Date(transaction.date)
        .toISOString()
        .split('T')[0];
      return transDate === day.dateString;
    });
    setSelectedDateTransactions(filtered);

    // load reminders for that date
    const reminders = await getRemindersForDate(day.dateString);
    setDayReminders(reminders);

    // open the "day details" modal
    setIsDateDetailVisible(true);

    // optional polish: prefill reminder time if today
    const todayISO = new Date().toISOString().split('T')[0];
    if (day.dateString === todayISO) {
      const now = new Date();
      now.setHours(now.getHours() + 1);
      now.setMinutes(0);
      const hh = now.getHours().toString().padStart(2, '0');
      const mm = now.getMinutes().toString().padStart(2, '0');
      setNewReminderTime(`${hh}:${mm}`);
    } else {
      setNewReminderTime('09:00');
    }
  };

  // --- save a new reminder + schedule local notification ---
  const handleSaveReminder = async () => {
    if (!selectedDate) {
      Alert.alert('No date selected', 'Please pick a date first.');
      return;
    }
    if (!newReminderTime.trim() || !newReminderMessage.trim()) {
      Alert.alert('Missing info', 'Please enter time and message.');
      return;
    }

    try {
      // Build a JS Date from (selectedDate + time)
      // selectedDate = 'YYYY-MM-DD'
      // newReminderTime = 'HH:MM'
      const [hh, mm] = newReminderTime.split(':');
      const [yyyy, mon, dd] = selectedDate.split('-');

      const fireDate = new Date(
        Number(yyyy),
        Number(mon) - 1,
        Number(dd),
        Number(hh),
        Number(mm),
        0,
        0
      );

      // Guard against scheduling in the past
      if (fireDate.getTime() < Date.now()) {
        Alert.alert('Time already passed', 'Pick a future time.');
        return;
      }

      // 1. Save reminder (this is your own storage / backend logic)
      const saved = await addReminder(
        selectedDate,
        newReminderTime,
        newReminderMessage
      );

      // 2. Refresh the reminder list for that day
      const updatedList = await getRemindersForDate(selectedDate);
      setDayReminders(updatedList);

      // 3. Request OS permission & schedule local notification
      const granted =
        await notificationService.requestNotificationPermission();
      if (!granted) {
        Alert.alert(
          'Notifications blocked',
          'Reminder saved, but notifications are disabled in system settings.'
        );
      } else {
        await notificationService.scheduleReminder(
          fireDate,
          newReminderMessage
        );
      }

      // 4. Reset modal state and close the Add Reminder modal
      setNewReminderTime('09:00');
      setNewReminderMessage('');
      setIsAddReminderVisible(false);

      // 5. Rebuild reminder dots on calendar
      await loadAllRemindersForCalendar();

      Alert.alert('✅ Reminder added', `Reminder set for ${saved.time}`);
    } catch (err) {
      console.error('Error saving reminder', err);
      Alert.alert('Error', 'Could not save reminder.');
    }
  };

  // --- build markedDates object for <Calendar /> using multi-dot ---
  const getMarkedDates = () => {
    // {
    //   '2025-10-28': {
    //     dots: [{ color: colors.primary }, { color: '#FF9800' }],
    //     selected: true,
    //     selectedColor: colors.primary,
    //   },
    // }

    const marked: Record<
      string,
      {
        dots: { color: string }[];
        selected?: boolean;
        selectedColor?: string;
      }
    > = {};

    // 1) Add a spending dot (colors.primary) for any day with transactions
    allTransactions.forEach(transaction => {
      const date = new Date(transaction.date).toISOString().split('T')[0];
      if (!marked[date]) marked[date] = { dots: [] };
      if (!marked[date].dots.some(d => d.color === colors.primary)) {
        marked[date].dots.push({ color: colors.primary });
      }
    });

    // 2) Add a reminder dot (orange) for any day with reminders
    Object.keys(allRemindersByDate).forEach(date => {
      if (!marked[date]) marked[date] = { dots: [] };
      if (!marked[date].dots.some(d => d.color === '#FF9800')) {
        marked[date].dots.push({ color: '#FF9800' });
      }
    });

    // 3) Highlight the selected day
    if (selectedDate) {
      if (!marked[selectedDate]) marked[selectedDate] = { dots: [] };
      marked[selectedDate].selected = true;
      marked[selectedDate].selectedColor = colors.primary;
    }

    return marked;
  };

  const getDayStats = () => {
    const income = selectedDateTransactions
      .filter(t => t.type === 'Income')
      .reduce((sum, t) => sum + t.amount, 0);

    const expense = selectedDateTransactions
      .filter(t => t.type === 'Expense')
      .reduce((sum, t) => sum + Math.abs(t.amount), 0);

    return { income, expense };
  };

  const getProgressBarColor = () => {
    if (spentPercentage >= 100) return '#F44336'; // red
    if (spentPercentage >= 90) return '#FF9800'; // orange
    if (spentPercentage >= 75) return '#FFC107'; // yellow
    return '#66BB6A'; // green
  };

  const getAllowanceStatus = () => {
    if (spentPercentage >= 100)
      return { emoji: '🚨', text: 'Over Budget!', color: colors.danger };
    if (spentPercentage >= 90)
      return { emoji: '⚠️', text: 'Nearly at Limit', color: '#FF9800' };
    if (spentPercentage >= 75)
      return { emoji: '💡', text: 'Watch Spending', color: '#FFC107' };
    return { emoji: '✅', text: 'On Track', color: colors.income };
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadAllowance();
    await loadData();
    await loadAllRemindersForCalendar();
  };

  const handleLogout = async () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout',
        style: 'destructive',
        onPress: async () => {
          await logout();
          router.replace('/(auth)/login');
        },
      },
    ]);
  };

  const getIconForCategory = (category: string) => {
    const icons: { [key: string]: string } = {
      Salary: '💰',
      Freelance: '💼',
      Investment: '📈',
      Business: '🏢',
      Groceries: '🛒',
      Transport: '🚗',
      Food: '🍔',
      Entertainment: '🎬',
      Shopping: '🛍️',
      Healthcare: '🏥',
      Education: '📚',
      Utilities: '💡',
      Rent: '🏠',
      Other: '💵',
    };
    return icons[category] || '💵';
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  };

  const calculateExpenseBreakdown = () => {
    const expenseTransactions = transactions.filter(
      t => t.type === 'Expense'
    );
    const categoryTotals: { [key: string]: number } = {};

    expenseTransactions.forEach(transaction => {
      if (categoryTotals[transaction.category]) {
        categoryTotals[transaction.category] += transaction.amount;
      } else {
        categoryTotals[transaction.category] = transaction.amount;
      }
    });

    const pieColors = [
      '#4CAF50',
      '#2196F3',
      '#FF9800',
      '#E91E63',
      '#9C27B0',
      '#FFC107',
      '#00BCD4',
    ];

    const chartData = Object.entries(categoryTotals)
      .map(([name, amount], index) => ({
        name,
        amount: Math.abs(amount),
        color: pieColors[index % pieColors.length],
        legendFontColor: colors.text,
        legendFontSize: 13,
      }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 5);

    return chartData.length > 0
      ? chartData
      : [
          {
            name: 'No Data',
            amount: 1,
            color: '#E0E0E0',
            legendFontColor: colors.textSecondary,
            legendFontSize: 13,
          },
        ];
  };

  const chartData = calculateExpenseBreakdown();

  // --- styles depend on theme colors ---
  const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    centerContent: { justifyContent: 'center', alignItems: 'center' },

    headerSection: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 20,
      paddingTop: 60,
      paddingBottom: 20,
      backgroundColor: colors.cardBackground,
    },
    title: { fontSize: 28, fontWeight: 'bold', color: colors.text },
    welcomeText: {
      fontSize: 14,
      color: colors.textSecondary,
      marginTop: 4,
    },
    headerButtons: { flexDirection: 'row', alignItems: 'center' },

    summaryContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      paddingHorizontal: 20,
      paddingVertical: 20,
      backgroundColor: colors.cardBackground,
      marginBottom: 10,
    },
    summaryBox: {
      backgroundColor: colors.background,
      padding: 15,
      borderRadius: 12,
      flex: 1,
      marginHorizontal: 5,
      alignItems: 'center',
      elevation: 2,
    },
    incomeBox: { backgroundColor: colors.income + '20' },
    expenseBox: { backgroundColor: colors.expense + '20' },
    balanceBox: { backgroundColor: colors.primary + '20' },
    summaryLabel: {
      fontSize: 11,
      color: colors.textSecondary,
      marginBottom: 6,
      fontWeight: '500',
    },
    incomeText: {
      fontSize: 16,
      fontWeight: 'bold',
      color: colors.income,
    },
    expenseText: {
      fontSize: 16,
      fontWeight: 'bold',
      color: colors.expense,
    },
    balanceText: { fontSize: 16, fontWeight: 'bold' },

    allowanceCard: {
      backgroundColor: colors.cardBackground,
      marginHorizontal: 20,
      marginBottom: 15,
      borderRadius: 12,
      padding: 16,
      elevation: 3,
    },
    allowanceHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: 16,
    },
    statusBadge: {
      marginTop: 4,
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 6,
      alignSelf: 'flex-start',
    },
    statusBadgeText: {
      fontSize: 12,
      fontWeight: '600',
    },
    allowanceRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: 16,
    },
    allowanceColumn: {
      flex: 1,
      alignItems: 'center',
    },
    allowanceAmount: {
      fontSize: 18,
      fontWeight: 'bold',
    },
    fieldLabel: {
      fontSize: 12,
      color: colors.textSecondary,
      marginBottom: 4,
      fontWeight: '500',
    },
    progressBarBackground: {
      width: '100%',
      height: 10,
      backgroundColor: colors.border,
      borderRadius: 5,
      marginBottom: 8,
    },
    progressBarFill: {
      height: 10,
      borderRadius: 5,
    },
    percentageText: {
      fontSize: 12,
      textAlign: 'center',
      fontWeight: '500',
    },

    chartCard: {
      backgroundColor: colors.cardBackground,
      marginHorizontal: 20,
      marginBottom: 20,
      borderRadius: 12,
      padding: 16,
      elevation: 3,
    },

    calendarSection: {
      backgroundColor: colors.cardBackground,
      marginHorizontal: 20,
      borderRadius: 12,
      padding: 15,
      marginBottom: 20,
      elevation: 2,
    },
    calendarSubtitle: {
      fontSize: 12,
      color: colors.textSecondary,
      marginBottom: 10,
      textAlign: 'center',
    },

    headerRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 20,
      paddingTop: 10,
      paddingBottom: 15,
    },
    sectionTitle: {
      fontSize: 20,
      fontWeight: 'bold',
      color: colors.text,
    },
    addButton: {
      backgroundColor: '#66BB6A',
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 8,
      elevation: 3,
    },
    addButtonText: {
      color: 'white',
      fontWeight: 'bold',
      fontSize: 14,
    },

    emptyState: {
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: 40,
    },
    emptyIcon: { fontSize: 64, marginBottom: 16 },
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
      marginBottom: 24,
    },
    emptyButton: {
      backgroundColor: '#66BB6A',
      paddingHorizontal: 24,
      paddingVertical: 12,
      borderRadius: 8,
    },
    emptyButtonText: {
      color: 'white',
      fontWeight: 'bold',
      fontSize: 16,
    },

    listContent: { paddingHorizontal: 20, paddingBottom: 20 },

    transactionItem: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      backgroundColor: colors.cardBackground,
      padding: 16,
      borderRadius: 12,
      marginBottom: 10,
      elevation: 2,
    },
    transactionLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
    iconContainer: {
      width: 45,
      height: 45,
      borderRadius: 10,
      backgroundColor: colors.background,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 12,
    },
    transactionIcon: { fontSize: 24 },
    transactionInfo: { flex: 1 },
    transactionCategory: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 2,
    },
    transactionDate: {
      fontSize: 12,
      color: colors.textSecondary,
    },
    transactionRight: { alignItems: 'flex-end' },
    transactionAmount: {
      fontSize: 16,
      fontWeight: 'bold',
      marginBottom: 2,
    },
    transactionType: {
      fontSize: 11,
      color: colors.textSecondary,
      textTransform: 'uppercase',
    },

    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'center',
      alignItems: 'center',
    },

    modalContent: {
      width: '85%',
      borderRadius: 16,
      padding: 24,
      elevation: 5,
      backgroundColor: colors.cardBackground,
    },
    modalTitle: {
      fontSize: 22,
      fontWeight: 'bold',
      marginBottom: 8,
      color: colors.text,
    },
    modalSubtitle: {
      fontSize: 14,
      marginBottom: 20,
      color: colors.textSecondary,
    },
    modalInput: {
      borderRadius: 10,
      padding: 16,
      fontSize: 24,
      fontWeight: 'bold',
      textAlign: 'center',
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.background,
      color: colors.text,
      marginBottom: 24,
    },
    modalButtons: {
      flexDirection: 'row',
      gap: 12,
    },
    modalButton: {
      flex: 1,
      paddingVertical: 14,
      borderRadius: 10,
      alignItems: 'center',
    },
    cancelButton: {
      backgroundColor: 'transparent',
      borderWidth: 1,
      borderColor: colors.border,
    },
    saveButton: {
      backgroundColor: '#66BB6A',
    },
    cancelButtonText: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.text,
    },
    saveButtonText: {
      color: 'white',
      fontSize: 16,
      fontWeight: 'bold',
    },

    dateModalContent: {
      width: '90%',
      maxHeight: '80%',
      borderRadius: 20,
      padding: 20,
      elevation: 5,
      backgroundColor: colors.cardBackground,
    },
    dateModalHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: 20,
    },
    daySummaryContainer: {
      flexDirection: 'row',
      gap: 12,
      marginBottom: 20,
    },
    daySummaryBox: {
      flex: 1,
      padding: 16,
      borderRadius: 12,
      alignItems: 'center',
      backgroundColor: colors.background,
    },
    daySummaryLabel: {
      fontSize: 12,
      fontWeight: '500',
      marginBottom: 4,
      color: colors.textSecondary,
    },
    daySummaryAmount: {
      fontSize: 20,
      fontWeight: 'bold',
      color: colors.text,
    },
    dateTransactionsList: {
      maxHeight: 300,
      marginBottom: 16,
    },
    dateTransactionItem: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: 12,
      borderRadius: 10,
      marginBottom: 8,
      elevation: 1,
      backgroundColor: colors.background,
    },

    emptyDateState: {
      alignItems: 'center',
      paddingVertical: 40,
    },

    quickAddButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 16,
      borderRadius: 12,
      gap: 8,
      backgroundColor: colors.primary,
      marginTop: 8,
    },
    quickAddText: {
      color: '#fff',
      fontSize: 16,
      fontWeight: 'bold',
      marginLeft: 8,
    },
  });

  if (loading) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {/* Header */}
      <View style={styles.headerSection}>
        <View>
          <Text style={styles.title}>💰 Budget Buddy</Text>
          <Text style={styles.welcomeText}>Welcome back, {user?.username}!</Text>
        </View>

        <View style={styles.headerButtons}>
          <TouchableOpacity onPress={() => router.push('/notifications')}>
            <Ionicons
              name="notifications-outline"
              size={26}
              color={colors.text}
            />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => router.push('/settings')}
            style={{ marginLeft: 16 }}
          >
            <Ionicons name="settings-outline" size={26} color={colors.text} />
          </TouchableOpacity>
          <TouchableOpacity onPress={handleLogout}>
            <Ionicons
              name="log-out-outline"
              size={26}
              color={colors.danger}
              style={{ marginLeft: 16 }}
            />
          </TouchableOpacity>
        </View>
      </View>

      {/* Summary */}
      <View style={styles.summaryContainer}>
        <View style={[styles.summaryBox, styles.incomeBox]}>
          <Text style={styles.summaryLabel}>Income</Text>
          <Text style={styles.incomeText}>${totalIncome.toFixed(2)}</Text>
        </View>
        <View style={[styles.summaryBox, styles.expenseBox]}>
          <Text style={styles.summaryLabel}>Expenses</Text>
          <Text style={styles.expenseText}>${totalExpense.toFixed(2)}</Text>
        </View>
        <View style={[styles.summaryBox, styles.balanceBox]}>
          <Text style={styles.summaryLabel}>Balance</Text>
          <Text
            style={[
              styles.balanceText,
              {
                color:
                  totalIncome - totalExpense >= 0 ? '#4CAF50' : '#F44336',
              },
            ]}
          >
            ${(totalIncome - totalExpense).toFixed(2)}
          </Text>
        </View>
      </View>

      {/* Monthly Allowance */}
      <TouchableOpacity
        style={styles.allowanceCard}
        onPress={() => {
          setTempAllowance(monthlyAllowance.toString());
          setIsAllowanceModalVisible(true);
        }}
      >
        <View style={styles.allowanceHeader}>
          <View>
            <Text style={styles.sectionTitle}>🎓 Monthly Allowance</Text>
            <View style={styles.statusBadge}>
              <Text
                style={[
                  styles.statusBadgeText,
                  { color: getAllowanceStatus().color },
                ]}
              >
                {getAllowanceStatus().emoji} {getAllowanceStatus().text}
              </Text>
            </View>
          </View>
          <Ionicons name="pencil" size={20} color={colors.primary} />
        </View>

        <View style={styles.allowanceRow}>
          <View style={styles.allowanceColumn}>
            <Text style={styles.fieldLabel}>Budget</Text>
            <Text style={[styles.allowanceAmount, { color: colors.text }]}>
              ${monthlyAllowance.toFixed(2)}
            </Text>
          </View>
          <View style={styles.allowanceColumn}>
            <Text style={styles.fieldLabel}>Spent</Text>
            <Text style={[styles.allowanceAmount, { color: colors.expense }]}>
              ${totalExpense.toFixed(2)}
            </Text>
          </View>
          <View style={styles.allowanceColumn}>
            <Text style={styles.fieldLabel}>Remaining</Text>
            <Text
              style={[
                styles.allowanceAmount,
                {
                  color: remaining >= 0 ? colors.income : colors.danger,
                  fontWeight: 'bold',
                },
              ]}
            >
              ${remaining >= 0 ? remaining.toFixed(2) : '0.00'}
            </Text>
          </View>
        </View>

        <View style={styles.progressBarBackground}>
          <View
            style={[
              styles.progressBarFill,
              {
                width: `${Math.min(spentPercentage, 100)}%`,
                backgroundColor: getProgressBarColor(),
              },
            ]}
          />
        </View>

        <Text style={[styles.percentageText, { color: colors.textSecondary }]}>
          {spentPercentage.toFixed(1)}% of budget used
        </Text>
      </TouchableOpacity>

      {/* Expense Breakdown */}
      <View style={styles.chartCard}>
        <Text style={styles.sectionTitle}>Expense Breakdown</Text>
        <PieChart
          data={chartData}
          width={screenWidth - 40}
          height={220}
          chartConfig={{
            backgroundGradientFrom: colors.cardBackground,
            backgroundGradientTo: colors.cardBackground,
            color: (opacity = 1) =>
              colors.text + Math.round(opacity * 255).toString(16),
            strokeWidth: 2,
          }}
          accessor="amount"
          backgroundColor="transparent"
          paddingLeft="15"
          absolute
        />
      </View>

      {/* Calendar */}
      <View style={styles.calendarSection}>
        <Text style={styles.sectionTitle}>📅 Calendar</Text>
        <Text style={styles.calendarSubtitle}>
          Tap a date to view transactions • Dots indicate activity
        </Text>

        <Calendar
          onDayPress={handleDateSelect}
          markedDates={getMarkedDates()}
          markingType="multi-dot"
          theme={{
            selectedDayBackgroundColor: colors.primary,
            todayTextColor: colors.income,
            backgroundColor: colors.cardBackground,
            calendarBackground: colors.cardBackground,
            textSectionTitleColor: colors.text,
            dayTextColor: colors.text,
            monthTextColor: colors.text,
            textDisabledColor: colors.textSecondary,
            dotColor: colors.primary,
            selectedDotColor: '#fff',
          }}
        />

        {/* Legend under calendar */}
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'center',
            marginTop: 8,
            gap: 16,
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <View
              style={{
                width: 8,
                height: 8,
                borderRadius: 4,
                backgroundColor: colors.primary, // Spending
                marginRight: 6,
              }}
            />
            <Text
              style={{
                color: colors.textSecondary,
                fontSize: 12,
              }}
            >
              Spending
            </Text>
          </View>

          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <View
              style={{
                width: 8,
                height: 8,
                borderRadius: 4,
                backgroundColor: '#FF9800', // Reminder
                marginRight: 6,
              }}
            />
            <Text
              style={{
                color: colors.textSecondary,
                fontSize: 12,
              }}
            >
              Reminder
            </Text>
          </View>
        </View>
      </View>

      {/* Recent Transactions */}
      <View style={styles.headerRow}>
        <Text style={styles.sectionTitle}>Recent Transactions</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => router.push('/(tabs)/add-transaction')}
        >
          <Text style={styles.addButtonText}>+ Add</Text>
        </TouchableOpacity>
      </View>

      {transactions.length === 0 ? (
        <View style={styles.emptyState}>
          {/* Optional themed icon instead of emoji calendar */}
          <Ionicons
            name="calendar-outline"
            size={48}
            color={colors.textSecondary}
            style={{ marginBottom: 12 }}
          />
          <Text style={styles.emptyText}>No transactions</Text>
          <Text style={styles.emptySubtext}>
            Add your first transaction to get started!
          </Text>
          <TouchableOpacity
            style={styles.emptyButton}
            onPress={() => router.push('/(tabs)/add-transaction')}
          >
            <Text style={styles.emptyButtonText}>Add Transaction</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.listContent}>
          {transactions.map(item => (
            <TouchableOpacity
              key={item._id}
              style={styles.transactionItem}
              onPress={() => router.push('/(tabs)/transactions')}
            >
              <View style={styles.transactionLeft}>
                <View style={styles.iconContainer}>
                  <Text style={styles.transactionIcon}>
                    {getIconForCategory(item.category)}
                  </Text>
                </View>
                <View style={styles.transactionInfo}>
                  <Text style={styles.transactionCategory}>
                    {item.category}
                  </Text>
                  <Text style={styles.transactionDate}>
                    {formatDate(item.date)}
                  </Text>
                </View>
              </View>
              <View style={styles.transactionRight}>
                <Text
                  style={[
                    styles.transactionAmount,
                    {
                      color:
                        item.type === 'Income'
                          ? colors.income
                          : colors.expense,
                    },
                  ]}
                >
                  {item.type === 'Income' ? '+' : '-'}$
                  {Math.abs(item.amount).toFixed(2)}
                </Text>
                <Text
                  style={[
                    styles.transactionType,
                    { color: colors.textSecondary },
                  ]}
                >
                  {item.type}
                </Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Allowance Edit Modal */}
      <Modal
        visible={isAllowanceModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setIsAllowanceModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Edit Monthly Allowance</Text>
            <Text style={styles.modalSubtitle}>
              Set your monthly budget limit
            </Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Enter amount"
              placeholderTextColor={colors.textSecondary}
              keyboardType="decimal-pad"
              value={tempAllowance}
              onChangeText={setTempAllowance}
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setIsAllowanceModalVisible(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.saveButton]}
                onPress={saveAllowance}
              >
                <Text style={styles.saveButtonText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Date Details Modal */}
      <Modal
        visible={isDateDetailVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setIsDateDetailVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.dateModalContent}>
            {/* header */}
            <View style={styles.dateModalHeader}>
              <View>
                <Text style={styles.modalTitle}>
                  {selectedDate &&
                    new Date(selectedDate).toLocaleDateString('en-US', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                </Text>

                <Text style={styles.modalSubtitle}>
                  {selectedDateTransactions.length} transaction
                  {selectedDateTransactions.length !== 1 ? 's' : ''} ·{' '}
                  {dayReminders.length} reminder
                  {dayReminders.length !== 1 ? 's' : ''}
                </Text>
              </View>

              <TouchableOpacity
                onPress={() => setIsDateDetailVisible(false)}
              >
                <Ionicons
                  name="close-circle"
                  size={32}
                  color={colors.textSecondary}
                />
              </TouchableOpacity>
            </View>

            {/* mini summary */}
            {selectedDateTransactions.length > 0 && (
              <View style={styles.daySummaryContainer}>
                <View
                  style={[
                    styles.daySummaryBox,
                    { backgroundColor: colors.income + '20' },
                  ]}
                >
                  <Text style={styles.daySummaryLabel}>Income</Text>
                  <Text
                    style={[
                      styles.daySummaryAmount,
                      { color: colors.income },
                    ]}
                  >
                    +${getDayStats().income.toFixed(2)}
                  </Text>
                </View>
                <View
                  style={[
                    styles.daySummaryBox,
                    { backgroundColor: colors.expense + '20' },
                  ]}
                >
                  <Text style={styles.daySummaryLabel}>Expenses</Text>
                  <Text
                    style={[
                      styles.daySummaryAmount,
                      { color: colors.expense },
                    ]}
                  >
                    -${getDayStats().expense.toFixed(2)}
                  </Text>
                </View>
              </View>
            )}

            {/* transactions list */}
            <ScrollView style={styles.dateTransactionsList}>
              {selectedDateTransactions.length === 0 ? (
                <View style={styles.emptyDateState}>
                  <Ionicons
                    name="calendar-outline"
                    size={48}
                    color={colors.textSecondary}
                    style={{ marginBottom: 12 }}
                  />
                  <Text style={styles.emptyText}>No transactions</Text>
                  <Text style={styles.emptySubtext}>
                    Add a transaction for this date
                  </Text>
                </View>
              ) : (
                selectedDateTransactions.map(item => (
                  <TouchableOpacity
                    key={item._id}
                    style={styles.dateTransactionItem}
                    onPress={() => {
                      setIsDateDetailVisible(false);
                      router.push('/(tabs)/transactions');
                    }}
                  >
                    <View style={styles.transactionLeft}>
                      <View
                        style={[
                          styles.iconContainer,
                          { backgroundColor: colors.cardBackground },
                        ]}
                      >
                        <Text style={styles.transactionIcon}>
                          {getIconForCategory(item.category)}
                        </Text>
                      </View>
                      <View style={styles.transactionInfo}>
                        <Text style={styles.transactionCategory}>
                          {item.category}
                        </Text>
                        <Text style={styles.transactionDate}>
                          {item.description || 'No description'}
                        </Text>
                      </View>
                    </View>
                    <View style={styles.transactionRight}>
                      <Text
                        style={[
                          styles.transactionAmount,
                          {
                            color:
                              item.type === 'Income'
                                ? colors.income
                                : colors.expense,
                          },
                        ]}
                      >
                        {item.type === 'Income' ? '+' : '-'}$
                        {Math.abs(item.amount).toFixed(2)}
                      </Text>
                      <Text
                        style={[
                          styles.transactionType,
                          { color: colors.textSecondary },
                        ]}
                      >
                        {item.type}
                      </Text>
                    </View>
                  </TouchableOpacity>
                ))
              )}
            </ScrollView>

            {/* reminders list */}
            <View style={{ marginTop: 16, marginBottom: 12 }}>
              <Text
                style={[
                  styles.sectionTitle,
                  { fontSize: 18, color: colors.text },
                ]}
              >
                Reminders
              </Text>

              {dayReminders.length === 0 ? (
                <Text
                  style={[
                    styles.modalSubtitle,
                    { marginTop: 8, color: colors.textSecondary },
                  ]}
                >
                  No reminders for this day.
                </Text>
              ) : (
                dayReminders.map(r => (
                  <View
                    key={r.id}
                    style={{
                      flexDirection: 'row',
                      justifyContent: 'space-between',
                      paddingVertical: 8,
                      borderBottomWidth: 1,
                      borderColor: colors.border,
                    }}
                  >
                    <Text
                      style={{
                        color: colors.text,
                        fontSize: 15,
                        fontWeight: '500',
                      }}
                    >
                      {r.time} – {r.message}
                    </Text>
                  </View>
                ))
              )}
            </View>

            {/* add reminder button */}
            <TouchableOpacity
              style={styles.quickAddButton}
              onPress={() => {
                setIsAddReminderVisible(true);
              }}
            >
              <Ionicons name="alarm-outline" size={24} color="#fff" />
              <Text style={styles.quickAddText}>
                Add Reminder for This Date
              </Text>
            </TouchableOpacity>

            {/* add transaction button */}
            <TouchableOpacity
              style={styles.quickAddButton}
              onPress={() => {
                setIsDateDetailVisible(false);
                router.push('/(tabs)/add-transaction');
              }}
            >
              <Ionicons
                name="add-circle-outline"
                size={24}
                color="#fff"
              />
              <Text style={styles.quickAddText}>
                Add Transaction for This Date
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Add Reminder Modal */}
      <Modal
        visible={isAddReminderVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setIsAddReminderVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { width: '85%' }]}>
            <Text style={styles.modalTitle}>New Reminder</Text>

            <Text style={styles.modalSubtitle}>
              {selectedDate &&
                new Date(selectedDate).toLocaleDateString('en-US', {
                  weekday: 'long',
                  month: 'long',
                  day: 'numeric',
                })}
            </Text>

            {/* Time input */}
            <Text style={styles.fieldLabel}>Time (HH:MM)</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="09:00"
              placeholderTextColor={colors.textSecondary}
              value={newReminderTime}
              onChangeText={setNewReminderTime}
            />

            {/* Message input */}
            <Text style={styles.fieldLabel}>Reminder message</Text>
            <TextInput
              style={[
                styles.modalInput,
                {
                  fontSize: 18,
                  textAlign: 'left',
                  fontWeight: '400',
                  minHeight: 70,
                },
              ]}
              placeholder="Pay rent / Check budget / etc."
              placeholderTextColor={colors.textSecondary}
              value={newReminderMessage}
              onChangeText={setNewReminderMessage}
              multiline
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => {
                  setIsAddReminderVisible(false);
                }}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalButton, styles.saveButton]}
                onPress={handleSaveReminder}
              >
                <Text style={styles.saveButtonText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

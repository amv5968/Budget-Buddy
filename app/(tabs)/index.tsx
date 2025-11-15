import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
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
import { BarChart, LineChart, PieChart } from 'react-native-chart-kit';
import Sidebar from '../../components/Sidebar';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { getUserProfile, updateMonthlyAllowance } from '../services/authService';
import {
  notifyBudgetThreshold,
  notifyDateTransactions,
  requestNotificationPermissions,
  scheduleReminderNotification,
} from '../services/notificationService';
import { addReminder, getReminders, getRemindersForDate } from '../services/reminderService';

import { Budget, getBudgets } from '../services/budgetService';
import { getGoals, Goal } from '../services/goalService';
import {
  getTransactions,
  getTransactionStats,
  Transaction,
} from '../services/transactionService';

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
  const [goals, setGoals] = useState<Goal[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);

  // --- ui / fetch state ---
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedChartType, setSelectedChartType] = useState<'pie' | 'line' | 'bar'>('pie');

  // --- calendar state ---
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedDateTransactions, setSelectedDateTransactions] = useState<Transaction[]>([]);
  const [isDateDetailVisible, setIsDateDetailVisible] = useState(false);

  // --- allowance state ---
  const [monthlyAllowance, setMonthlyAllowance] = useState(0);
  const [isAllowanceModalVisible, setIsAllowanceModalVisible] = useState(false);
  const [tempAllowance, setTempAllowance] = useState('0');

  // --- sidebar ---
  const [isSidebarVisible, setIsSidebarVisible] = useState(false);

  // --- reminders UI state ---
  const [isAddReminderVisible, setIsAddReminderVisible] = useState(false);
  const [newReminderTime, setNewReminderTime] = useState('09:00'); // 'HH:MM'
  const [newReminderMessage, setNewReminderMessage] = useState('');
  const [dayReminders, setDayReminders] = useState<{ time: string; message: string }[]>([]);
  const [allRemindersByDate, setAllRemindersByDate] = useState<
    Record<string, { time: string; message: string }[]>
  >({});

  // --- pie chart interactivity ---
  const [selectedCategory, setSelectedCategory] = useState<{ name: string; amount: number; percentage: number } | null>(null);
  const [isCategoryModalVisible, setIsCategoryModalVisible] = useState(false);

  // --- derived allowance stats (used in UI) ---
  const remaining = monthlyAllowance - totalExpense;
  const spentPercentage = monthlyAllowance > 0 ? (totalExpense / monthlyAllowance) * 100 : 0;

  // Request OS notification permission on mount
  useEffect(() => {
    requestNotificationPermissions();
  }, []);

  // Track last alert threshold to avoid duplicate alerts
  const lastAlertPercentage = useRef(0);

  // --- helper: load all reminders and index by date ---
  const loadAllRemindersForCalendar = async () => {
    try {
      const list: { date: string; time: string; message: string }[] = await getReminders();

      const byDate: Record<string, { time: string; message: string }[]> = {};
      for (const r of list) {
        if (!byDate[r.date]) byDate[r.date] = [];
        byDate[r.date].push({ time: r.time, message: r.message });
      }

      setAllRemindersByDate(byDate);
      if (selectedDate) {
        setDayReminders(byDate[selectedDate] ?? []);
      }
    } catch (e) {
      console.error('loadAllRemindersForCalendar failed', e);
    }
  };

  // refresh data whenever screen focuses
  useFocusEffect(
    useCallback(() => {
      const refreshDashboard = async () => {
        await loadAllowance();
        await loadData();
        await loadAllRemindersForCalendar();

        // Re-schedule local notifications for all upcoming reminders
        try {
          const all = await getReminders();
          for (const r of all) {
            const [hh, mm] = r.time.split(':');
            const [yyyy, mon, dd] = r.date.split('-');
            const fireDate = new Date(
              Number(yyyy),
              Number(mon) - 1,
              Number(dd),
              Number(hh),
              Number(mm)
            );
            if (fireDate.getTime() > Date.now()) {
              await scheduleReminderNotification(fireDate, r.message);
            }
          }
        } catch (e) {
          console.error('Reschedule notifications failed', e);
        }
      };

      refreshDashboard();
    }, [])
  );

  // --- load allowance from backend ---
  const loadAllowance = async () => {
    try {
      const profile = await getUserProfile();
      const dbAllowance = profile.monthlyAllowance ?? 0;
      setMonthlyAllowance(dbAllowance);
      setTempAllowance(dbAllowance.toString());
    } catch (error) {
      console.error('Error loading allowance:', error);
      Alert.alert(
        'Connection Error',
        'Unable to load allowance from server. Please check your backend connection.',
        [{ text: 'OK' }]
      );
      setMonthlyAllowance(0);
      setTempAllowance('0');
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
      else if (amount > totalIncome) {
        Alert.alert('Allowance cannot be higher than your income', 'Please enter a valid amount');
        return;
      }

      await updateMonthlyAllowance(amount);
      setMonthlyAllowance(amount);
      setIsAllowanceModalVisible(false);

      // Reset alert tracking when allowance changes
      lastAlertPercentage.current = 0;

      Alert.alert('✅ Success', 'Monthly allowance updated!');
    } catch (error) {
      console.error('Error saving allowance:', error);
      Alert.alert('Save Failed', 'Unable to save to database. Please check your backend connection.', [
        { text: 'OK' },
      ]);
    }
  };

  // --- load dashboard data: transactions + stats ---
  const loadData = async () => {
    try {
      const [transData, statsData, profile, goalsData, budgetsData] = await Promise.all([
        getTransactions(),
        getTransactionStats(),
        getUserProfile(), // refresh allowance from backend too
        getGoals(),
        getBudgets(),
      ]);

      setMonthlyAllowance(profile.monthlyAllowance);
      setTempAllowance(profile.monthlyAllowance.toString());

      setAllTransactions(transData);
      setTransactions(transData.slice(0, 4));
      setTotalIncome(statsData.totalIncome);
      setTotalExpense(statsData.totalExpense);
      
      // Sort by createdAt descending and take last 4
      setGoals(goalsData.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 4));
      setBudgets(budgetsData.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 4));

      checkSpendingAlerts(statsData.totalExpense, profile.monthlyAllowance);
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

  const checkSpendingAlerts = async (expense: number, allowance: number) => {
    const percentage = allowance > 0 ? (expense / allowance) * 100 : 0;

    if (percentage >= 100 && lastAlertPercentage.current < 100 && expense > 0) {
      lastAlertPercentage.current = 100;
      await notifyBudgetThreshold(percentage, expense, allowance);
      Alert.alert(
        '🚨 Budget Exceeded!',
        `You've spent $${expense.toFixed(2)} out of your $${allowance.toFixed(2)} monthly allowance.\n\nYou're over budget by $${(expense - allowance).toFixed(2)}!`,
        [{ text: 'Got it', style: 'default' }]
      );
    } else if (percentage >= 90 && lastAlertPercentage.current < 90 && percentage < 100) {
      lastAlertPercentage.current = 90;
      await notifyBudgetThreshold(percentage, expense, allowance);
      Alert.alert(
        '⚠️ Nearly at Limit!',
        `You've spent ${percentage.toFixed(0)}% of your monthly allowance.\n\nOnly $${(allowance - expense).toFixed(2)} remaining!`,
        [{ text: 'Okay', style: 'default' }]
      );
    } else if (percentage >= 75 && lastAlertPercentage.current < 75 && percentage < 90) {
      lastAlertPercentage.current = 75;
      await notifyBudgetThreshold(percentage, expense, allowance);
      Alert.alert(
        '💡 Spending Alert',
        `You've used ${percentage.toFixed(0)}% of your monthly allowance.\n\n$${(allowance - expense).toFixed(2)} left to spend.`,
        [{ text: 'Thanks', style: 'default' }]
      );
    }
  };

  const handleDateSelect = async (day: { dateString: string }) => {
    setSelectedDate(day.dateString);

    const filtered = allTransactions.filter((transaction) => {
      const transDate = new Date(transaction.date).toISOString().split('T')[0];
      return transDate === day.dateString;
    });

    setSelectedDateTransactions(filtered);
    setIsDateDetailVisible(true);

    // show a notification summary for the selected day
    await notifyDateTransactions(day.dateString, filtered);

    // show reminders for the selected day
    setDayReminders(allRemindersByDate[day.dateString] ?? []);
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
      const [hh, mm] = newReminderTime.split(':');
      const [yyyy, mon, dd] = selectedDate.split('-');
      const fireDate = new Date(Number(yyyy), Number(mon) - 1, Number(dd), Number(hh), Number(mm), 0, 0);

      if (fireDate.getTime() < Date.now()) {
        Alert.alert('Time already passed', 'Pick a future time.');
        return;
      }

      // 1) Save reminder (local/db depending on your service)
      const saved = await addReminder(selectedDate, newReminderTime, newReminderMessage);

      // 2) Refresh the reminder list for that day
      const updatedList = await getRemindersForDate(selectedDate);
      setDayReminders(updatedList);

      // 3) OS permission & local notification
      const granted = await requestNotificationPermissions();
      if (!granted) {
        Alert.alert('Notifications blocked', 'Reminder saved, but notifications are disabled in system settings.');
      } else {
        await scheduleReminderNotification(fireDate, newReminderMessage);
      }

      // 4) Reset modal state
      setNewReminderTime('09:00');
      setNewReminderMessage('');
      setIsAddReminderVisible(false);

      // 5) Re-index reminders for calendar dots
      await loadAllRemindersForCalendar();

      Alert.alert('✅ Reminder added', `Reminder set for ${saved.time}`);
    } catch (err) {
      console.error('Error saving reminder', err);
      Alert.alert('Error', 'Could not save reminder.');
    }
  };

  // --- build markedDates object for <Calendar /> using multi-dot ---
  const getMarkedDates = () => {
    const marked: any = {};

    // 1) spending dots (primary color)
    allTransactions.forEach((transaction) => {
      const date = new Date(transaction.date).toISOString().split('T')[0];
      if (!marked[date]) marked[date] = { dots: [] };
      if (!marked[date].dots.some((d: any) => d.color === colors.primary)) {
        marked[date].dots.push({ color: colors.primary });
      }
    });

    // 2) reminder dots (orange)
    Object.keys(allRemindersByDate).forEach((date) => {
      if (!marked[date]) marked[date] = { dots: [] };
      if (!marked[date].dots.some((d: any) => d.color === '#FF9800')) {
        marked[date].dots.push({ color: '#FF9800' });
      }
    });

    if (selectedDate) {
      if (!marked[selectedDate]) marked[selectedDate] = { dots: [] };
      marked[selectedDate].selected = true;
      marked[selectedDate].selectedColor = colors.primary;
    }

    return marked;
  };

  const getDayStats = () => {
    const income = selectedDateTransactions
      .filter((t) => t.type === 'Income')
      .reduce((sum, t) => sum + t.amount, 0);

    const expense = selectedDateTransactions
      .filter((t) => t.type === 'Expense')
      .reduce((sum, t) => sum + Math.abs(t.amount), 0);

    return { income, expense };
  };

  const getProgressBarColor = () => {
    if (spentPercentage >= 100) return '#F44336';
    if (spentPercentage >= 90) return '#FF9800';
    if (spentPercentage >= 75) return '#FFC107';
    return '#66BB6A';
  };

  const getAllowanceStatus = () => {
    if (spentPercentage >= 100) return { emoji: '🚨', text: 'Over Budget!', color: colors.danger };
    if (spentPercentage >= 90) return { emoji: '⚠️', text: 'Nearly at Limit', color: '#FF9800' };
    if (spentPercentage >= 75) return { emoji: '💡', text: 'Watch Spending', color: '#FFC107' };
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
    const expenseTransactions = transactions.filter((t) => t.type === 'Expense');
    const categoryTotals: { [key: string]: number } = {};

    expenseTransactions.forEach((transaction) => {
      if (categoryTotals[transaction.category]) {
        categoryTotals[transaction.category] += transaction.amount;
      } else {
        categoryTotals[transaction.category] = transaction.amount;
      }
    });

    const totalExpense = Object.values(categoryTotals).reduce((sum, val) => sum + Math.abs(val), 0);
    const pieColors = ['#4CAF50', '#2196F3', '#FF9800', '#E91E63', '#9C27B0', '#FFC107', '#00BCD4'];

    const chartData = Object.entries(categoryTotals)
      .map(([name, amount], index) => {
        const absAmount = Math.abs(amount);
        const percentage = totalExpense > 0 ? (absAmount / totalExpense) * 100 : 0;
        // Truncate long names for display but keep full name for tooltip
        const displayName = name.length > 12 ? name.substring(0, 10) + '...' : name;
        return {
          name: displayName,
          fullName: name,
          amount: absAmount,
          percentage: percentage,
          color: pieColors[index % pieColors.length],
          legendFontColor: colors.text,
        };
      })
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 5);

    return chartData.length > 0
      ? chartData
      : [
          {
            name: 'No Data',
            fullName: 'No Data',
            amount: 1,
            percentage: 0,
            color: '#E0E0E0',
            legendFontColor: colors.textSecondary,
          },
        ];
  };

  const chartData = calculateExpenseBreakdown();

  // Calculate 7-day spending trend
  const calculateSpendingTrend = () => {
    const last7Days = Array(7).fill(0);
    const labels = [];
    const today = new Date();
    
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      labels.push(date.toLocaleDateString('en-US', { weekday: 'short' }));
    }
    
    allTransactions.forEach((t) => {
      if (t.type === 'Expense') {
        const transDate = new Date(t.date);
        const diffTime = today.getTime() - transDate.getTime();
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
        
        if (diffDays >= 0 && diffDays < 7) {
          last7Days[6 - diffDays] += Math.abs(t.amount);
        }
      }
    });
    
    return { labels, data: last7Days };
  };

  // Calculate Income vs Expenses for current month
  const calculateIncomeVsExpenses = () => {
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    
    let monthIncome = 0;
    let monthExpense = 0;
    
    allTransactions.forEach((t) => {
      const transDate = new Date(t.date);
      if (transDate.getMonth() === currentMonth && transDate.getFullYear() === currentYear) {
        if (t.type === 'Income') {
          monthIncome += t.amount;
        } else {
          monthExpense += Math.abs(t.amount);
        }
      }
    });
    
    return {
      labels: ['Income', 'Expenses'],
      data: [monthIncome, monthExpense],
    };
  };

  const spendingTrendData = calculateSpendingTrend();
  const incomeVsExpensesData = calculateIncomeVsExpenses();

  // --- styles ---
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
    hamburgerButton: {
      padding: 8,
      marginRight: 12,
    },
    headerCenter: {
      flex: 1,
    },
    title: { fontSize: 24, fontWeight: 'bold', color: colors.text },
    welcomeText: { fontSize: 13, color: colors.textSecondary, marginTop: 2 },
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
      padding: 12,
      borderRadius: 12,
      flex: 1,
      marginHorizontal: 5,
      alignItems: 'center',
      elevation: 2,
      overflow: 'hidden',
    },
    incomeBox: { backgroundColor: colors.income + '20' },
    expenseBox: { backgroundColor: colors.expense + '20' },
    balanceBox: { backgroundColor: colors.primary + '20' },
    summaryLabel: {
      fontSize: 11,
      color: colors.textSecondary,
      marginBottom: 6,
      fontWeight: '500',
      textAlign: 'center',
      width: '100%',
    },
    incomeText: {
      fontSize: 14,
      fontWeight: 'bold',
      color: colors.income,
      textAlign: 'center',
      width: '100%',
      paddingHorizontal: 2,
    },
    expenseText: {
      fontSize: 14,
      fontWeight: 'bold',
      color: colors.expense,
      textAlign: 'center',
      width: '100%',
      paddingHorizontal: 2,
    },
    balanceText: { 
      fontSize: 14, 
      fontWeight: 'bold',
      textAlign: 'center',
      width: '100%',
      paddingHorizontal: 2,
    },

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
    chartHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 16,
      flexWrap: 'wrap',
      gap: 8,
    },
    chartSelector: {
      flexDirection: 'row',
      backgroundColor: colors.border,
      borderRadius: 8,
      padding: 3,
    },
    chartTypeButton: {
      paddingVertical: 8,
      paddingHorizontal: 14,
      borderRadius: 6,
    },
    chartTypeButtonActive: {
      backgroundColor: colors.primary,
    },
    chartTypeText: {
      fontSize: 13,
      fontWeight: '600',
      color: colors.textSecondary,
    },
    chartTypeTextActive: {
      color: '#fff',
    },
    pieLegendContainer: {
      marginTop: 12,
      paddingHorizontal: 8,
    },
    pieLegendItem: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 10,
      paddingHorizontal: 12,
      borderRadius: 8,
      marginBottom: 6,
    },
    pieLegendColor: {
      width: 16,
      height: 16,
      borderRadius: 8,
      marginRight: 12,
    },
    pieLegendTextContainer: {
      flex: 1,
    },
    pieLegendName: {
      fontSize: 14,
      fontWeight: '600',
      marginBottom: 2,
    },
    pieLegendAmount: {
      fontSize: 12,
    },
    modalHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 20,
    },
    categoryModalBody: {
      alignItems: 'center',
    },
    categoryModalIcon: {
      width: 80,
      height: 80,
      borderRadius: 40,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 16,
    },
    categoryModalEmoji: {
      fontSize: 40,
    },
    categoryModalName: {
      fontSize: 24,
      fontWeight: 'bold',
      marginBottom: 24,
      textAlign: 'center',
    },
    categoryModalStats: {
      flexDirection: 'row',
      width: '100%',
      marginBottom: 24,
      paddingVertical: 16,
      borderTopWidth: 1,
      borderBottomWidth: 1,
      borderColor: colors.border,
    },
    categoryStatItem: {
      flex: 1,
      alignItems: 'center',
    },
    categoryStatDivider: {
      width: 1,
      backgroundColor: colors.border,
    },
    categoryStatLabel: {
      fontSize: 12,
      marginBottom: 8,
      textTransform: 'uppercase',
    },
    categoryStatValue: {
      fontSize: 20,
      fontWeight: 'bold',
    },
    viewTransactionsButton: {
      width: '100%',
      paddingVertical: 14,
      borderRadius: 10,
      alignItems: 'center',
    },
    viewTransactionsText: {
      color: '#fff',
      fontSize: 16,
      fontWeight: 'bold',
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
    goalItem: {
      backgroundColor: colors.cardBackground,
      padding: 15,
      borderRadius: 12,
      marginBottom: 10,
      flexDirection: 'row',
      alignItems: 'center',
      shadowColor: '#000',
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
    },
    goalLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
    },
    goalIcon: {
      fontSize: 24,
    },
    goalInfo: {
      flex: 1,
      marginLeft: 12,
    },
    goalName: {
      fontSize: 16,
      fontWeight: '600',
      marginBottom: 4,
      color: colors.text,
    },
    goalProgress: {
      fontSize: 13,
      color: colors.textSecondary,
    },
    goalRight: {
      alignItems: 'flex-end',
    },
    goalPercentage: {
      fontSize: 16,
      fontWeight: 'bold',
    },
    budgetItem: {
      backgroundColor: colors.cardBackground,
      padding: 15,
      borderRadius: 12,
      marginBottom: 10,
      flexDirection: 'row',
      alignItems: 'center',
      shadowColor: '#000',
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
    },
    budgetLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
    },
    budgetIcon: {
      fontSize: 24,
    },
    budgetInfo: {
      flex: 1,
      marginLeft: 12,
    },
    budgetCategory: {
      fontSize: 16,
      fontWeight: '600',
      marginBottom: 4,
      color: colors.text,
    },
    budgetProgress: {
      fontSize: 13,
      color: colors.textSecondary,
    },
    budgetRight: {
      alignItems: 'flex-end',
    },
    budgetPercentage: {
      fontSize: 16,
      fontWeight: 'bold',
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
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <View style={styles.headerSection}>
        <TouchableOpacity style={styles.hamburgerButton} onPress={() => setIsSidebarVisible(true)}>
          <Ionicons name="menu" size={24} color={colors.text} />
        </TouchableOpacity>

        <View style={styles.headerCenter}>
          <Text style={styles.title}>💰 Budget Buddy</Text>
          <Text style={styles.welcomeText}>Welcome back, {user?.username}!</Text>
        </View>

        <View style={styles.headerButtons}>
          <TouchableOpacity onPress={() => router.push('/notifications?returnTo=/(tabs)')}>
            <Ionicons name="notifications-outline" size={24} color={colors.text} />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => router.push('/settings?returnTo=/(tabs)')} style={{ marginLeft: 16 }}>
            <Ionicons name="settings-outline" size={24} color={colors.text} />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => router.push('/(tabs)/profile?returnTo=/(tabs)')} style={{ marginLeft: 16 }}>
           <Ionicons name="person-circle-outline" size={24} color={colors.text} />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.summaryContainer}>
        <View style={[styles.summaryBox, styles.incomeBox]}>
          <Text style={styles.summaryLabel}>Income</Text>
          <Text style={styles.incomeText} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.6}>
            ${totalIncome.toFixed(2)}
          </Text>
        </View>
        <View style={[styles.summaryBox, styles.expenseBox]}>
          <Text style={styles.summaryLabel}>Expenses</Text>
          <Text style={styles.expenseText} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.6}>
            ${totalExpense.toFixed(2)}
          </Text>
        </View>
        <View style={[styles.summaryBox, styles.balanceBox]}>
          <Text style={styles.summaryLabel}>Balance</Text>
          <Text
            style={[
              styles.balanceText,
              {
                color: totalIncome - totalExpense >= 0 ? '#4CAF50' : '#F44336',
              },
            ]}
            numberOfLines={1}
            adjustsFontSizeToFit
            minimumFontScale={0.6}
          >
            ${(totalIncome - totalExpense).toFixed(2)}
          </Text>
        </View>
      </View>

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
            <View className="status-badge" style={styles.statusBadge}>
              <Text style={[styles.statusBadgeText, { color: getAllowanceStatus().color }]}>
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
                { color: remaining >= 0 ? colors.income : colors.danger, fontWeight: 'bold' },
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

      {/* Charts Section with Type Selector */}
      <View style={styles.chartCard}>
        <View style={styles.chartHeader}>
          <Text style={[styles.sectionTitle, { flex: 1, flexShrink: 1 }]}>
            {selectedChartType === 'pie' && '📊 Expense Breakdown'}
            {selectedChartType === 'line' && '📈 7-Day Trend'}
            {selectedChartType === 'bar' && '💰 Income vs Expenses'}
          </Text>
          <View style={styles.chartSelector}>
            <TouchableOpacity
              style={[styles.chartTypeButton, selectedChartType === 'pie' && styles.chartTypeButtonActive]}
              onPress={() => setSelectedChartType('pie')}
            >
              <Text style={[styles.chartTypeText, selectedChartType === 'pie' && styles.chartTypeTextActive]}>
                Pie
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.chartTypeButton, selectedChartType === 'line' && styles.chartTypeButtonActive]}
              onPress={() => setSelectedChartType('line')}
            >
              <Text style={[styles.chartTypeText, selectedChartType === 'line' && styles.chartTypeTextActive]}>
                Line
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.chartTypeButton, selectedChartType === 'bar' && styles.chartTypeButtonActive]}
              onPress={() => setSelectedChartType('bar')}
            >
              <Text style={[styles.chartTypeText, selectedChartType === 'bar' && styles.chartTypeTextActive]}>
                Bar
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Pie Chart - Expense Breakdown */}
        {selectedChartType === 'pie' && (
          <View>
            <TouchableOpacity
              activeOpacity={0.9}
              onPress={() => {
                // Find the largest slice as default selection
                const largestSlice = chartData[0];
                if (largestSlice && largestSlice.fullName !== 'No Data') {
                  setSelectedCategory({
                    name: largestSlice.fullName,
                    amount: largestSlice.amount,
                    percentage: largestSlice.percentage,
                  });
                  setIsCategoryModalVisible(true);
                }
              }}
            >
              <PieChart
                data={chartData}
                width={screenWidth - 72}
                height={220}
                chartConfig={{
                  backgroundGradientFrom: colors.cardBackground,
                  backgroundGradientTo: colors.cardBackground,
                  color: (opacity = 1) => colors.text + Math.round(opacity * 255).toString(16),
                  strokeWidth: 2,
                }}
                accessor="amount"
                backgroundColor="transparent"
                paddingLeft="15"
                hasLegend={false}
              />
            </TouchableOpacity>
            
            {/* Custom Interactive Legend */}
            <View style={styles.pieLegendContainer}>
              {chartData.map((item, index) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.pieLegendItem,
                    { backgroundColor: colors.cardBackground },
                  ]}
                  onPress={() => {
                    if (item.fullName !== 'No Data') {
                      setSelectedCategory({
                        name: item.fullName,
                        amount: item.amount,
                        percentage: item.percentage,
                      });
                      setIsCategoryModalVisible(true);
                    }
                  }}
                  activeOpacity={0.7}
                >
                  <View style={[styles.pieLegendColor, { backgroundColor: item.color }]} />
                  <View style={styles.pieLegendTextContainer}>
                    <Text style={[styles.pieLegendName, { color: colors.text }]} numberOfLines={1}>
                      {item.fullName}
                    </Text>
                    <Text style={[styles.pieLegendAmount, { color: colors.textSecondary }]}>
                      ${item.amount.toFixed(2)} ({item.percentage.toFixed(1)}%)
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* Line Chart - 7-Day Spending Trend */}
        {selectedChartType === 'line' && (
          <LineChart
            data={{
              labels: spendingTrendData.labels,
              datasets: [{ data: spendingTrendData.data.length > 0 ? spendingTrendData.data : [0] }],
            }}
            width={screenWidth - 72}
            height={220}
            yAxisLabel="$"
            yAxisSuffix=""
            chartConfig={{
              backgroundColor: colors.cardBackground,
              backgroundGradientFrom: colors.cardBackground,
              backgroundGradientTo: colors.cardBackground,
              decimalPlaces: 0,
              color: (opacity = 1) => `rgba(66, 165, 245, ${opacity})`,
              labelColor: (opacity = 1) => colors.text,
              style: { borderRadius: 16 },
              propsForDots: {
                r: '6',
                strokeWidth: '2',
                stroke: '#42A5F5',
              },
            }}
            bezier
            style={{
              marginVertical: 8,
              borderRadius: 16,
            }}
          />
        )}

        {/* Bar Chart - Income vs Expenses */}
        {selectedChartType === 'bar' && (
          <BarChart
            data={{
              labels: incomeVsExpensesData.labels,
              datasets: [{ data: incomeVsExpensesData.data.length > 0 ? incomeVsExpensesData.data : [0, 0] }],
            }}
            width={screenWidth - 72}
            height={220}
            yAxisLabel="$"
            yAxisSuffix=""
            chartConfig={{
              backgroundColor: colors.cardBackground,
              backgroundGradientFrom: colors.cardBackground,
              backgroundGradientTo: colors.cardBackground,
              decimalPlaces: 0,
              color: (opacity = 1) => `rgba(102, 187, 106, ${opacity})`,
              labelColor: (opacity = 1) => colors.text,
              style: { borderRadius: 16 },
              barPercentage: 0.7,
            }}
            style={{
              marginVertical: 8,
              borderRadius: 16,
            }}
            showValuesOnTopOfBars
            fromZero
          />
        )}
      </View>

      <View style={styles.calendarSection}>
        <Text style={styles.sectionTitle}>📅 Calendar</Text>
        <Text style={styles.calendarSubtitle}>Tap a date to view transactions • Dots indicate activity</Text>

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

        {/* Legend */}
        <View style={{ flexDirection: 'row', justifyContent: 'center', marginTop: 8, gap: 16 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: colors.primary, marginRight: 6 }} />
            <Text style={{ color: colors.textSecondary, fontSize: 12 }}>Spending</Text>
          </View>

          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: '#FF9800', marginRight: 6 }} />
            <Text style={{ color: colors.textSecondary, fontSize: 12 }}>Reminder</Text>
          </View>
        </View>
      </View>

      <View style={styles.headerRow}>
        <Text style={styles.sectionTitle}>Recent Transactions</Text>
      </View>

      {transactions.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="calendar-outline" size={48} color={colors.textSecondary} style={{ marginBottom: 12 }} />
          <Text style={styles.emptyText}>No transactions</Text>
          <Text style={styles.emptySubtext}>Add your first transaction to get started!</Text>
          <TouchableOpacity style={styles.emptyButton} onPress={() => router.push('/(tabs)/add-transaction?returnTo=/(tabs)')}>
            <Text style={styles.emptyButtonText}>Add Transaction</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.listContent}>
          {transactions.map((item) => (
            <TouchableOpacity
              key={item._id}
              style={styles.transactionItem}
              onPress={() => router.push('/(tabs)/transactions')}
            >
              <View style={styles.transactionLeft}>
                <View style={styles.iconContainer}>
                  <Text style={styles.transactionIcon}>{getIconForCategory(item.category)}</Text>
                </View>
                <View style={styles.transactionInfo}>
                  <Text style={styles.transactionCategory}>{item.category}</Text>
                  <Text style={styles.transactionDate}>{formatDate(item.date)}</Text>
                </View>
              </View>
              <View style={styles.transactionRight}>
                <Text
                  style={[
                    styles.transactionAmount,
                    { color: item.type === 'Income' ? colors.income : colors.expense },
                  ]}
                >
                  {item.type === 'Income' ? '+' : '-'}${Math.abs(item.amount).toFixed(2)}
                </Text>
                <Text style={[styles.transactionType, { color: colors.textSecondary }]}>{item.type}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Recent Goals Section */}
      <View style={styles.headerRow}>
        <Text style={styles.sectionTitle}>Recent Goals</Text>
      </View>

      {goals.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="flag-outline" size={48} color={colors.textSecondary} style={{ marginBottom: 12 }} />
          <Text style={styles.emptyText}>No goals</Text>
          <Text style={styles.emptySubtext}>Create your first savings goal!</Text>
          <TouchableOpacity style={styles.emptyButton} onPress={() => router.push('/(tabs)/add-goal?returnTo=/(tabs)')}>
            <Text style={styles.emptyButtonText}>Add Goal</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.listContent}>
          {goals.map((item) => {
            const percentage = Math.min((item.savedAmount / item.targetAmount) * 100, 100);
            return (
              <TouchableOpacity
                key={item._id}
                style={styles.goalItem}
                onPress={() => router.push(`/(tabs)/edit-goal?id=${item._id}&returnTo=/(tabs)`)}
              >
                <View style={styles.goalLeft}>
                  <View style={styles.iconContainer}>
                    <Text style={styles.goalIcon}>{item.icon || '🎯'}</Text>
                  </View>
                  <View style={styles.goalInfo}>
                    <Text style={styles.goalName}>{item.name}</Text>
                    <Text style={styles.goalProgress}>
                      ${item.savedAmount.toFixed(2)} / ${item.targetAmount.toFixed(2)}
                    </Text>
                  </View>
                </View>
                <View style={styles.goalRight}>
                  <Text style={[styles.goalPercentage, { color: percentage >= 100 ? colors.income : colors.primary }]}>
                    {percentage.toFixed(0)}%
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      )}

      {/* Recent Budgets Section */}
      <View style={styles.headerRow}>
        <Text style={styles.sectionTitle}>Recent Budgets</Text>
      </View>

      {budgets.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="wallet-outline" size={48} color={colors.textSecondary} style={{ marginBottom: 12 }} />
          <Text style={styles.emptyText}>No budgets</Text>
          <Text style={styles.emptySubtext}>Create your first budget!</Text>
          <TouchableOpacity style={styles.emptyButton} onPress={() => router.push('/(tabs)/add-budget?returnTo=/(tabs)')}>
            <Text style={styles.emptyButtonText}>Add Budget</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.listContent}>
          {budgets.map((item) => {
            const percentage = Math.min((item.spentAmount / item.totalAmount) * 100, 100);
            const progressColor = percentage >= 90 ? colors.danger : percentage >= 70 ? colors.warning : colors.income;
            return (
              <TouchableOpacity
                key={item._id}
                style={styles.budgetItem}
                onPress={() => router.push(`/(tabs)/edit-budget?id=${item._id}&returnTo=/(tabs)`)}
              >
                <View style={styles.budgetLeft}>
                  <View style={styles.iconContainer}>
                    <Text style={styles.budgetIcon}>{item.icon || '💵'}</Text>
                  </View>
                  <View style={styles.budgetInfo}>
                    <Text style={styles.budgetCategory}>{item.category}</Text>
                    <Text style={styles.budgetProgress}>
                      ${item.spentAmount.toFixed(2)} / ${item.totalAmount.toFixed(2)}
                    </Text>
                  </View>
                </View>
                <View style={styles.budgetRight}>
                  <Text style={[styles.budgetPercentage, { color: progressColor }]}>
                    {percentage.toFixed(0)}%
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      )}

      {/* Allowance modal */}
      <Modal
        visible={isAllowanceModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setIsAllowanceModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Edit Monthly Allowance</Text>
            <Text style={styles.modalSubtitle}>Set your monthly budget limit</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="$0.00"
              placeholderTextColor={colors.textSecondary}
              keyboardType="decimal-pad"
              value={tempAllowance}
              onChangeText={(text) => {
                // Remove non-numeric characters except decimal point
                const cleaned = text.replace(/[^0-9.]/g, '');
                // Ensure only one decimal point
                const parts = cleaned.split('.');
                let formatted = parts[0];
                if (parts.length > 1) {
                  formatted += '.' + parts.slice(1).join('').substring(0, 2);
                }
                // Cap at $1,000,000.00
                const numValue = parseFloat(formatted) || 0;
                if (numValue <= 1000000.00) {
                  setTempAllowance(formatted);
                } else {
                  Alert.alert(
                    'Maximum Limit Reached',
                    'Monthly allowance cannot exceed $1,000,000.00'
                  );
                }
              }}
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setIsAllowanceModalVisible(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalButton, styles.saveButton]} onPress={saveAllowance}>
                <Text style={styles.saveButtonText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Date details modal */}
      <Modal
        visible={isDateDetailVisible}
        transparent
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
                  {selectedDateTransactions.length !== 1 ? 's' : ''} · {dayReminders.length} reminder
                  {dayReminders.length !== 1 ? 's' : ''}
                </Text>
              </View>

              <TouchableOpacity onPress={() => setIsDateDetailVisible(false)}>
                <Ionicons name="close-circle" size={32} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            {selectedDateTransactions.length > 0 && (
              <View style={styles.daySummaryContainer}>
                <View style={[styles.daySummaryBox, { backgroundColor: colors.income + '20' }]}>
                  <Text style={styles.daySummaryLabel}>Income</Text>
                  <Text style={[styles.daySummaryAmount, { color: colors.income }]}>
                    +${getDayStats().income.toFixed(2)}
                  </Text>
                </View>
                <View style={[styles.daySummaryBox, { backgroundColor: colors.expense + '20' }]}>
                  <Text style={styles.daySummaryLabel}>Expenses</Text>
                  <Text style={[styles.daySummaryAmount, { color: colors.expense }]}>
                    -${getDayStats().expense.toFixed(2)}
                  </Text>
                </View>
              </View>
            )}

            <ScrollView style={styles.dateTransactionsList}>
              {selectedDateTransactions.length === 0 ? (
                <View style={styles.emptyDateState}>
                  <Ionicons name="calendar-outline" size={48} color={colors.textSecondary} style={{ marginBottom: 12 }} />
                  <Text style={styles.emptyText}>No transactions</Text>
                  <Text style={styles.emptySubtext}>Add a transaction for this date</Text>
                </View>
              ) : (
                selectedDateTransactions.map((item) => (
                  <TouchableOpacity
                    key={item._id}
                    style={styles.dateTransactionItem}
                    onPress={() => {
                      setIsDateDetailVisible(false);
                      router.push('/(tabs)/transactions');
                    }}
                  >
                    <View style={styles.transactionLeft}>
                      <View style={[styles.iconContainer, { backgroundColor: colors.cardBackground }]}>
                        <Text style={styles.transactionIcon}>{getIconForCategory(item.category)}</Text>
                      </View>
                      <View style={styles.transactionInfo}>
                        <Text style={styles.transactionCategory}>{item.category}</Text>
                        <Text style={styles.transactionDate}>{item.description || 'No description'}</Text>
                      </View>
                    </View>
                    <View style={styles.transactionRight}>
                      <Text
                        style={[
                          styles.transactionAmount,
                          { color: item.type === 'Income' ? colors.income : colors.expense },
                        ]}
                      >
                        {item.type === 'Income' ? '+' : '-'}${Math.abs(item.amount).toFixed(2)}
                      </Text>
                      <Text style={[styles.transactionType, { color: colors.textSecondary }]}>{item.type}</Text>
                    </View>
                  </TouchableOpacity>
                ))
              )}
            </ScrollView>

            <TouchableOpacity
              style={styles.quickAddButton}
              onPress={() => {
                setIsDateDetailVisible(false);
                router.push('/(tabs)/add-transaction?returnTo=/(tabs)');
              }}
            >
              <Ionicons name="add-circle-outline" size={24} color="#fff" />
              <Text style={styles.quickAddText}>Add Transaction for This Date</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Category Details Modal */}
      <Modal
        visible={isCategoryModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setIsCategoryModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Category Details</Text>
              <TouchableOpacity onPress={() => setIsCategoryModalVisible(false)}>
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>
            {selectedCategory && (
              <View style={styles.categoryModalBody}>
                <View style={[styles.categoryModalIcon, { backgroundColor: chartData.find(c => c.fullName === selectedCategory.name)?.color + '20' }]}>
                  <Text style={styles.categoryModalEmoji}>
                    {getIconForCategory(selectedCategory.name)}
                  </Text>
                </View>
                <Text style={[styles.categoryModalName, { color: colors.text }]}>
                  {selectedCategory.name}
                </Text>
                <View style={styles.categoryModalStats}>
                  <View style={styles.categoryStatItem}>
                    <Text style={[styles.categoryStatLabel, { color: colors.textSecondary }]}>Amount</Text>
                    <Text style={[styles.categoryStatValue, { color: colors.expense }]}>
                      ${selectedCategory.amount.toFixed(2)}
                    </Text>
                  </View>
                  <View style={styles.categoryStatDivider} />
                  <View style={styles.categoryStatItem}>
                    <Text style={[styles.categoryStatLabel, { color: colors.textSecondary }]}>Percentage</Text>
                    <Text style={[styles.categoryStatValue, { color: colors.text }]}>
                      {selectedCategory.percentage.toFixed(1)}%
                    </Text>
                  </View>
                </View>
                <TouchableOpacity
                  style={[styles.viewTransactionsButton, { backgroundColor: colors.primary }]}
                  onPress={() => {
                    setIsCategoryModalVisible(false);
                    router.push('/(tabs)/transactions');
                  }}
                >
                  <Text style={styles.viewTransactionsText}>View Transactions</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      </Modal>

      {/* Sidebar */}
      <Sidebar visible={isSidebarVisible} onClose={() => setIsSidebarVisible(false)} />
    </ScrollView>
  );
}

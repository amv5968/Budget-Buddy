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
import { getUserProfile, updateMonthlyAllowance } from '../services/authService';
import {
  getTransactions,
  getTransactionStats,
  Transaction
} from '../services/transactionService';

const screenWidth = Dimensions.get('window').width;

export default function HomeScreen() {
  const { user, logout } = useAuth();
  const { colors } = useTheme();
  const router = useRouter();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [totalIncome, setTotalIncome] = useState(0);
  const [totalExpense, setTotalExpense] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedDate, setSelectedDate] = useState('');

  // Allowance states
  const [monthlyAllowance, setMonthlyAllowance] = useState(1000);
  const [isAllowanceModalVisible, setIsAllowanceModalVisible] = useState(false);
  const [tempAllowance, setTempAllowance] = useState('1000');
  const remaining = monthlyAllowance - totalExpense;
  const spentPercentage = monthlyAllowance > 0 ? (totalExpense / monthlyAllowance) * 100 : 0;

  // Calendar states
  const [allTransactions, setAllTransactions] = useState<Transaction[]>([]);
  const [selectedDateTransactions, setSelectedDateTransactions] = useState<Transaction[]>([]);
  const [isDateDetailVisible, setIsDateDetailVisible] = useState(false);

  // Alert tracking
  const [lastAlertPercentage, setLastAlertPercentage] = useState(0);

  useFocusEffect(
    useCallback(() => {
      console.log('📱 Dashboard focused - Refreshing data...');
      const refreshDashboard = async () => {
        // Load allowance first, then transactions
        await loadAllowance();
        await loadData();
      };
      refreshDashboard();
      // Reset alert tracking when screen is focused
      setLastAlertPercentage(0);
    }, [])
  );

  const loadAllowance = async () => {
    try {
      console.log('🔄 Loading allowance from database...');
      const profile = await getUserProfile();
      const dbAllowance = profile.monthlyAllowance;
      console.log('✅ Database allowance:', dbAllowance);
      
      setMonthlyAllowance(dbAllowance);
      setTempAllowance(dbAllowance.toString());
    } catch (error) {
      console.error('❌ Error loading from database:', error);
      Alert.alert(
        'Connection Error',
        'Unable to load allowance from server. Please check your backend connection.',
        [{ text: 'OK' }]
      );
      // Use default as fallback
      setMonthlyAllowance(1000);
      setTempAllowance('1000');
    }
  };

  const saveAllowance = async () => {
    try {
      const amount = parseFloat(tempAllowance);
      if (isNaN(amount) || amount <= 0) {
        Alert.alert('Invalid Amount', 'Please enter a valid amount');
        return;
      }

      console.log('💾 Saving allowance to database:', amount);
      await updateMonthlyAllowance(amount);
      console.log('✅ Saved to database successfully');

      setMonthlyAllowance(amount);
      setIsAllowanceModalVisible(false);
      Alert.alert('✅ Success', 'Monthly allowance updated!');
    } catch (error) {
      console.error('❌ Error saving allowance:', error);
      Alert.alert(
        'Save Failed', 
        'Unable to save to database. Please check your backend connection.',
        [{ text: 'OK' }]
      );
    }
  };

  const loadData = async () => {
    try {
      console.log('🔄 Loading transactions and stats...');
      const [transData, statsData] = await Promise.all([
        getTransactions(),
        getTransactionStats(),
      ]);

      console.log('✅ Transactions loaded:', transData.length);
      console.log('💰 Total Income:', statsData.totalIncome);
      console.log('💸 Total Expense:', statsData.totalExpense);

      setAllTransactions(transData);
      setTransactions(transData.slice(0, 5));
      setTotalIncome(statsData.totalIncome);
      setTotalExpense(statsData.totalExpense);

      // Log allowance info for debugging
      const remaining = monthlyAllowance - statsData.totalExpense;
      const percentage = monthlyAllowance > 0 ? (statsData.totalExpense / monthlyAllowance) * 100 : 0;
      console.log('🎓 Allowance:', monthlyAllowance, '| Remaining:', remaining, '| Used:', percentage.toFixed(1) + '%');

      // Check spending alerts after data is loaded
      checkSpendingAlerts(statsData.totalExpense);
    } catch (error: any) {
      console.error('❌ Error loading data:', error);
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

  const checkSpendingAlerts = (expense: number) => {
    const percentage = monthlyAllowance > 0 ? (expense / monthlyAllowance) * 100 : 0;
    
    // Only show alerts when crossing thresholds (not on every refresh)
    if (percentage >= 100 && lastAlertPercentage < 100 && expense > 0) {
      setLastAlertPercentage(100);
      Alert.alert(
        '🚨 Budget Exceeded!',
        `You've spent $${expense.toFixed(2)} out of your $${monthlyAllowance.toFixed(2)} monthly allowance.\n\nYou're over budget by $${(expense - monthlyAllowance).toFixed(2)}!`,
        [{ text: 'Got it', style: 'default' }]
      );
    } else if (percentage >= 90 && lastAlertPercentage < 90 && percentage < 100) {
      setLastAlertPercentage(90);
      Alert.alert(
        '⚠️ Nearly at Limit!',
        `You've spent ${percentage.toFixed(0)}% of your monthly allowance.\n\nOnly $${(monthlyAllowance - expense).toFixed(2)} remaining!`,
        [{ text: 'Okay', style: 'default' }]
      );
    } else if (percentage >= 75 && lastAlertPercentage < 75 && percentage < 90) {
      setLastAlertPercentage(75);
      Alert.alert(
        '💡 Spending Alert',
        `You've used ${percentage.toFixed(0)}% of your monthly allowance.\n\n$${(monthlyAllowance - expense).toFixed(2)} left to spend.`,
        [{ text: 'Thanks', style: 'default' }]
      );
    }
  };

  const handleDateSelect = (day: { dateString: string }) => {
    setSelectedDate(day.dateString);
    
    // Filter transactions for selected date
    const filtered = allTransactions.filter(transaction => {
      const transDate = new Date(transaction.date).toISOString().split('T')[0];
      return transDate === day.dateString;
    });
    
    setSelectedDateTransactions(filtered);
    setIsDateDetailVisible(true);
  };

  const getMarkedDates = () => {
    const marked: any = {};
    
    // Mark dates that have transactions
    allTransactions.forEach(transaction => {
      const date = new Date(transaction.date).toISOString().split('T')[0];
      if (!marked[date]) {
        marked[date] = { marked: true, dotColor: colors.primary };
      }
    });

    // Highlight selected date
    if (selectedDate) {
      marked[selectedDate] = {
        ...marked[selectedDate],
        selected: true,
        selectedColor: colors.primary,
      };
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
    if (spentPercentage >= 100) return '#F44336'; // Red - over budget
    if (spentPercentage >= 90) return '#FF9800'; // Orange - warning
    if (spentPercentage >= 75) return '#FFC107'; // Yellow - caution
    return '#66BB6A'; // Green - safe
  };

  const getAllowanceStatus = () => {
    if (spentPercentage >= 100) return { emoji: '🚨', text: 'Over Budget!', color: colors.danger };
    if (spentPercentage >= 90) return { emoji: '⚠️', text: 'Nearly at Limit', color: '#FF9800' };
    if (spentPercentage >= 75) return { emoji: '💡', text: 'Watch Spending', color: '#FFC107' };
    return { emoji: '✅', text: 'On Track', color: colors.income };
  };

  const onRefresh = async () => {
    setRefreshing(true);
    console.log('🔄 Manual refresh triggered...');
    await loadAllowance();
    await loadData();
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
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  // Calculate expense breakdown from actual transactions
  const calculateExpenseBreakdown = () => {
    const expenseTransactions = transactions.filter(t => t.type === 'Expense');
    const categoryTotals: { [key: string]: number } = {};
    
    expenseTransactions.forEach(transaction => {
      if (categoryTotals[transaction.category]) {
        categoryTotals[transaction.category] += transaction.amount;
      } else {
        categoryTotals[transaction.category] = transaction.amount;
      }
    });

    const pieColors = ['#4CAF50', '#2196F3', '#FF9800', '#E91E63', '#9C27B0', '#FFC107', '#00BCD4'];
    const chartData = Object.entries(categoryTotals)
      .map(([name, amount], index) => ({
        name,
        amount: Math.abs(amount),
        color: pieColors[index % pieColors.length],
        legendFontColor: colors.text,
        legendFontSize: 13,
      }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 5); // Top 5 categories

    return chartData.length > 0 ? chartData : [{
      name: 'No Data',
      amount: 1,
      color: '#E0E0E0',
      legendFontColor: colors.textSecondary,
      legendFontSize: 13,
    }];
  };

  const chartData = calculateExpenseBreakdown();

  const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    centerContent: { justifyContent: 'center', alignItems: 'center' },
    modalContainer: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: colors.cardBackground,
      zIndex: 1000,
    },
    closeButton: {
      position: 'absolute',
      top: 50,
      right: 20,
      zIndex: 1001,
    },
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
    welcomeText: { fontSize: 14, color: colors.textSecondary, marginTop: 4 },
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
    summaryLabel: { fontSize: 11, color: colors.textSecondary, marginBottom: 6, fontWeight: '500' },
    incomeText: { fontSize: 16, fontWeight: 'bold', color: colors.income },
    expenseText: { fontSize: 16, fontWeight: 'bold', color: colors.expense },
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
    allowanceLabel: {
      fontSize: 12,
      color: colors.textSecondary,
      marginBottom: 4,
      fontWeight: '500',
    },
    allowanceAmount: {
      fontSize: 18,
      fontWeight: 'bold',
    },
    allowanceText: { fontSize: 16, color: colors.text, marginBottom: 4 },
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
    sectionTitle: { fontSize: 20, fontWeight: 'bold', color: colors.text },
    addButton: {
      backgroundColor: '#66BB6A',
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 8,
      elevation: 3,
    },
    addButtonText: { color: 'white', fontWeight: 'bold', fontSize: 14 },
    emptyState: { justifyContent: 'center', alignItems: 'center', paddingHorizontal: 40 },
    emptyIcon: { fontSize: 64, marginBottom: 16 },
    emptyText: { fontSize: 18, fontWeight: '600', color: colors.text, marginBottom: 8 },
    emptySubtext: { fontSize: 14, color: colors.textSecondary, textAlign: 'center', marginBottom: 24 },
    emptyButton: {
      backgroundColor: '#66BB6A',
      paddingHorizontal: 24,
      paddingVertical: 12,
      borderRadius: 8,
    },
    emptyButtonText: { color: 'white', fontWeight: 'bold', fontSize: 16 },
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
    transactionCategory: { fontSize: 16, fontWeight: '600', color: colors.text, marginBottom: 2 },
    transactionDate: { fontSize: 12, color: colors.textSecondary },
    transactionRight: { alignItems: 'flex-end' },
    transactionAmount: { fontSize: 16, fontWeight: 'bold', marginBottom: 2 },
    transactionType: { fontSize: 11, color: colors.textSecondary, textTransform: 'uppercase' },
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
    },
    modalTitle: {
      fontSize: 22,
      fontWeight: 'bold',
      marginBottom: 8,
    },
    modalSubtitle: {
      fontSize: 14,
      marginBottom: 20,
    },
    modalInput: {
      borderRadius: 10,
      padding: 16,
      fontSize: 24,
      fontWeight: 'bold',
      textAlign: 'center',
      borderWidth: 1,
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
    },
    saveButton: {
      backgroundColor: '#66BB6A',
    },
    cancelButtonText: {
      fontSize: 16,
      fontWeight: '600',
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
    },
    daySummaryLabel: {
      fontSize: 12,
      fontWeight: '500',
      marginBottom: 4,
    },
    daySummaryAmount: {
      fontSize: 20,
      fontWeight: 'bold',
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
    },
    quickAddText: {
      color: '#fff',
      fontSize: 16,
      fontWeight: 'bold',
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
      {/* Header */}
      <View style={styles.headerSection}>
        <View>
          <Text style={styles.title}>💰 Budget Buddy</Text>
          <Text style={styles.welcomeText}>Welcome back, {user?.username}!</Text>
        </View>

        <View style={styles.headerButtons}>
          <TouchableOpacity onPress={() => router.push('/notifications')}>
            <Ionicons name="notifications-outline" size={26} color={colors.text} />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => router.push('/settings')} style={{ marginLeft: 16 }}>
            <Ionicons name="settings-outline" size={26} color={colors.text} />
          </TouchableOpacity>
          <TouchableOpacity onPress={handleLogout}>
            <Ionicons name="log-out-outline" size={26} color={colors.danger} style={{ marginLeft: 16 }} />
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
              { color: totalIncome - totalExpense >= 0 ? '#4CAF50' : '#F44336' },
            ]}
          >
            ${(totalIncome - totalExpense).toFixed(2)}
          </Text>
        </View>
      </View>

      {/* 🧮 Allowance Tracker */}
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
              <Text style={[styles.statusBadgeText, { color: getAllowanceStatus().color }]}>
                {getAllowanceStatus().emoji} {getAllowanceStatus().text}
              </Text>
            </View>
          </View>
          <Ionicons name="pencil" size={20} color={colors.primary} />
        </View>
        
        <View style={styles.allowanceRow}>
          <View style={styles.allowanceColumn}>
            <Text style={styles.allowanceLabel}>Budget</Text>
            <Text style={[styles.allowanceAmount, { color: colors.text }]}>
              ${monthlyAllowance.toFixed(2)}
            </Text>
          </View>
          <View style={styles.allowanceColumn}>
            <Text style={styles.allowanceLabel}>Spent</Text>
            <Text style={[styles.allowanceAmount, { color: colors.expense }]}>
              ${totalExpense.toFixed(2)}
            </Text>
          </View>
          <View style={styles.allowanceColumn}>
            <Text style={styles.allowanceLabel}>Remaining</Text>
            <Text style={[styles.allowanceAmount, { 
              color: remaining >= 0 ? colors.income : colors.danger,
              fontWeight: 'bold' 
            }]}>
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
                backgroundColor: getProgressBarColor()
              },
            ]}
          />
        </View>
        <Text style={[styles.percentageText, { color: colors.textSecondary }]}>
          {spentPercentage.toFixed(1)}% of budget used
        </Text>
      </TouchableOpacity>

      {/* 🥧 Expense Breakdown */}
      <View style={styles.chartCard}>
        <Text style={styles.sectionTitle}>Expense Breakdown</Text>
        <PieChart
          data={chartData}
          width={screenWidth - 40}
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
          absolute
        />
      </View>

      {/* 📅 Calendar */}
      <View style={styles.calendarSection}>
        <Text style={styles.sectionTitle}>📅 Calendar</Text>
        <Text style={styles.calendarSubtitle}>
          Tap a date to view transactions • Dots indicate activity
        </Text>
        <Calendar
          onDayPress={handleDateSelect}
          markedDates={getMarkedDates()}
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
          <Text style={styles.emptyIcon}>📊</Text>
          <Text style={styles.emptyText}>No transactions yet</Text>
          <Text style={styles.emptySubtext}>Add your first transaction to get started!</Text>
          <TouchableOpacity
            style={styles.emptyButton}
            onPress={() => router.push('/(tabs)/add-transaction')}
          >
            <Text style={styles.emptyButtonText}>Add Transaction</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.listContent}>
          {transactions.map((item) => (
            <TouchableOpacity
              key={item._id}
              style={styles.transactionItem}
              onPress={() => router.push(`/(tabs)/transactions`)}
            >
              <View style={styles.transactionLeft}>
                <View style={styles.iconContainer}>
                  <Text style={styles.transactionIcon}>
                    {getIconForCategory(item.category)}
                  </Text>
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
                  {item.type === 'Income' ? '+' : '-'}$
                  {Math.abs(item.amount).toFixed(2)}
                </Text>
                <Text style={styles.transactionType}>{item.type}</Text>
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
          <View style={[styles.modalContent, { backgroundColor: colors.cardBackground }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Edit Monthly Allowance</Text>
            <Text style={[styles.modalSubtitle, { color: colors.textSecondary }]}>
              Set your monthly budget limit
            </Text>
            <TextInput
              style={[styles.modalInput, { 
                backgroundColor: colors.background, 
                color: colors.text,
                borderColor: colors.border 
              }]}
              placeholder="Enter amount"
              placeholderTextColor={colors.textSecondary}
              keyboardType="decimal-pad"
              value={tempAllowance}
              onChangeText={setTempAllowance}
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton, { borderColor: colors.border }]}
                onPress={() => setIsAllowanceModalVisible(false)}
              >
                <Text style={[styles.cancelButtonText, { color: colors.text }]}>Cancel</Text>
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
          <View style={[styles.dateModalContent, { backgroundColor: colors.cardBackground }]}>
            <View style={styles.dateModalHeader}>
              <View>
                <Text style={[styles.modalTitle, { color: colors.text }]}>
                  {selectedDate && new Date(selectedDate).toLocaleDateString('en-US', { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}
                </Text>
                <Text style={[styles.modalSubtitle, { color: colors.textSecondary }]}>
                  {selectedDateTransactions.length} transaction{selectedDateTransactions.length !== 1 ? 's' : ''}
                </Text>
              </View>
              <TouchableOpacity onPress={() => setIsDateDetailVisible(false)}>
                <Ionicons name="close-circle" size={32} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            {/* Day Summary */}
            {selectedDateTransactions.length > 0 && (
              <View style={styles.daySummaryContainer}>
                <View style={[styles.daySummaryBox, { backgroundColor: colors.income + '20' }]}>
                  <Text style={[styles.daySummaryLabel, { color: colors.textSecondary }]}>Income</Text>
                  <Text style={[styles.daySummaryAmount, { color: colors.income }]}>
                    +${getDayStats().income.toFixed(2)}
                  </Text>
                </View>
                <View style={[styles.daySummaryBox, { backgroundColor: colors.expense + '20' }]}>
                  <Text style={[styles.daySummaryLabel, { color: colors.textSecondary }]}>Expenses</Text>
                  <Text style={[styles.daySummaryAmount, { color: colors.expense }]}>
                    -${getDayStats().expense.toFixed(2)}
                  </Text>
                </View>
              </View>
            )}

            {/* Transactions List */}
            <ScrollView style={styles.dateTransactionsList}>
              {selectedDateTransactions.length === 0 ? (
                <View style={styles.emptyDateState}>
                  <Text style={styles.emptyIcon}>📅</Text>
                  <Text style={[styles.emptyText, { color: colors.text }]}>No transactions</Text>
                  <Text style={[styles.emptySubtext, { color: colors.textSecondary }]}>
                    Add a transaction for this date
                  </Text>
                </View>
              ) : (
                selectedDateTransactions.map((item) => (
                  <TouchableOpacity
                    key={item._id}
                    style={[styles.dateTransactionItem, { backgroundColor: colors.background }]}
                    onPress={() => {
                      setIsDateDetailVisible(false);
                      router.push('/(tabs)/transactions');
                    }}
                  >
                    <View style={styles.transactionLeft}>
                      <View style={[styles.iconContainer, { backgroundColor: colors.cardBackground }]}>
                        <Text style={styles.transactionIcon}>
                          {getIconForCategory(item.category)}
                        </Text>
                      </View>
                      <View style={styles.transactionInfo}>
                        <Text style={[styles.transactionCategory, { color: colors.text }]}>
                          {item.category}
                        </Text>
                        <Text style={[styles.transactionDate, { color: colors.textSecondary }]}>
                          {item.description || 'No description'}
                        </Text>
                      </View>
                    </View>
                    <View style={styles.transactionRight}>
                      <Text
                        style={[
                          styles.transactionAmount,
                          { color: item.type === 'Income' ? colors.income : colors.expense },
                        ]}
                      >
                        {item.type === 'Income' ? '+' : '-'}$
                        {Math.abs(item.amount).toFixed(2)}
                      </Text>
                      <Text style={[styles.transactionType, { color: colors.textSecondary }]}>
                        {item.type}
                      </Text>
                    </View>
                  </TouchableOpacity>
                ))
              )}
            </ScrollView>

            {/* Quick Add Button */}
            <TouchableOpacity
              style={[styles.quickAddButton, { backgroundColor: colors.primary }]}
              onPress={() => {
                setIsDateDetailVisible(false);
                router.push('/(tabs)/add-transaction');
              }}
            >
              <Ionicons name="add-circle-outline" size={24} color="#fff" />
              <Text style={styles.quickAddText}>Add Transaction for This Date</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}
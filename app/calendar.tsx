import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Dimensions,
    Modal,
    Platform,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { Calendar } from 'react-native-calendars';
import { useTheme } from '../context/ThemeContext';
import { getGoals, Goal } from './services/goalService';
import { requestNotificationPermissions, scheduleReminderNotification } from './services/notificationService';
import { addReminder, getReminders, getRemindersForDate } from './services/reminderService';
import { getTransactions, Transaction } from './services/transactionService';

const screenWidth = Dimensions.get('window').width;

export default function CalendarScreen() {
  const { colors } = useTheme();
  const router = useRouter();

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedDateTransactions, setSelectedDateTransactions] = useState<Transaction[]>([]);
  const [selectedDateGoals, setSelectedDateGoals] = useState<Goal[]>([]);

  // Reminders
  const [allRemindersByDate, setAllRemindersByDate] = useState<Record<string, { time: string; message: string }[]>>({});
  const [dayReminders, setDayReminders] = useState<{ time: string; message: string }[]>([]);
  const [isAddReminderVisible, setIsAddReminderVisible] = useState(false);
  const [reminderTime, setReminderTime] = useState(new Date());
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [newReminderMessage, setNewReminderMessage] = useState('');

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [])
  );

  const loadData = async () => {
    try {
      const [transData, reminders, goalsData] = await Promise.all([
        getTransactions(),
        getReminders(),
        getGoals()
      ]);
      setTransactions(transData);
      setGoals(goalsData);

      const byDate: Record<string, { time: string; message: string }[]> = {};
      reminders.forEach((r: any) => {
        if (!byDate[r.date]) byDate[r.date] = [];
        byDate[r.date].push({ time: r.time, message: r.message });
      });
      setAllRemindersByDate(byDate);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const handleDateSelect = (day: { dateString: string }) => {
    setSelectedDate(day.dateString);

    const filtered = transactions.filter((transaction) => {
      const transDate = new Date(transaction.date).toISOString().split('T')[0];
      return transDate === day.dateString;
    });

    const filteredGoals = goals.filter((goal) => {
      if (!goal.targetDate) return false;
      const goalDate = new Date(goal.targetDate).toISOString().split('T')[0];
      return goalDate === day.dateString;
    });

    setSelectedDateTransactions(filtered);
    setSelectedDateGoals(filteredGoals);
    setDayReminders(allRemindersByDate[day.dateString] ?? []);
  };

  const handleSaveReminder = async () => {
    if (!selectedDate) {
      Alert.alert('No date selected', 'Please pick a date first.');
      return;
    }
    if (!newReminderMessage.trim()) {
      Alert.alert('Missing info', 'Please enter a message.');
      return;
    }

    try {
      const hh = reminderTime.getHours();
      const mm = reminderTime.getMinutes();
      const timeString = `${hh.toString().padStart(2, '0')}:${mm.toString().padStart(2, '0')}`;
      
      const [yyyy, mon, dd] = selectedDate.split('-');
      const fireDate = new Date(Number(yyyy), Number(mon) - 1, Number(dd), hh, mm, 0, 0);

      if (fireDate.getTime() < Date.now()) {
        Alert.alert('Time already passed', 'Pick a future time.');
        return;
      }

      await addReminder(selectedDate, timeString, newReminderMessage);
      const updatedList = await getRemindersForDate(selectedDate);
      setDayReminders(updatedList);

      const granted = await requestNotificationPermissions();
      if (granted) {
        await scheduleReminderNotification(fireDate, newReminderMessage);
      }

      setReminderTime(new Date());
      setNewReminderMessage('');
      setIsAddReminderVisible(false);
      await loadData();

      Alert.alert('Reminder added', `Reminder set for ${timeString}`);
    } catch (err) {
      console.error('Error saving reminder', err);
      Alert.alert('Error', 'Could not save reminder.');
    }
  };

  const handleAddTransaction = () => {
    if (selectedDate) {
      router.push({
        pathname: '/(tabs)/add-transaction',
        params: { 
          returnTo: '/calendar',
          presetDate: selectedDate 
        }
      });
    }
  };

  const handleAddGoal = () => {
    if (selectedDate) {
      router.push({
        pathname: '/(tabs)/add-goal',
        params: { 
          returnTo: '/calendar',
          presetDate: selectedDate 
        }
      });
    }
  };

  const getMarkedDates = () => {
    const marked: any = {};

    transactions.forEach((transaction) => {
      const date = new Date(transaction.date).toISOString().split('T')[0];
      if (!marked[date]) marked[date] = { dots: [] };
      const dotColor = transaction.type === 'Income' ? colors.income : colors.expense;
      if (!marked[date].dots.some((d: any) => d.color === dotColor)) {
        marked[date].dots.push({ color: dotColor });
      }
    });

    goals.forEach((goal) => {
      if (goal.targetDate) {
        const date = new Date(goal.targetDate).toISOString().split('T')[0];
        if (!marked[date]) marked[date] = { dots: [] };
        if (!marked[date].dots.some((d: any) => d.color === '#9C27B0')) {
          marked[date].dots.push({ color: '#9C27B0' });
        }
      }
    });

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
      .reduce((sum, t) => sum + Math.abs(t.amount), 0);

    const expense = selectedDateTransactions
      .filter((t) => t.type === 'Expense')
      .reduce((sum, t) => sum + Math.abs(t.amount), 0);

    return { income, expense };
  };

  const getMonthlyStats = () => {
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();

    let income = 0;
    let expense = 0;
    let count = 0;

    transactions.forEach((t) => {
      const transDate = new Date(t.date);
      if (transDate.getMonth() === currentMonth && transDate.getFullYear() === currentYear) {
        count++;
        if (t.type === 'Income') {
          income += Math.abs(t.amount);
        } else {
          expense += Math.abs(t.amount);
        }
      }
    });

    return { income, expense, count, balance: income - expense };
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

  const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    header: {
      backgroundColor: colors.cardBackground,
      paddingTop: 60,
      paddingBottom: 20,
      paddingHorizontal: 20,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    headerRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 10,
    },
    backButton: {
      padding: 8,
      marginRight: 12,
    },
    headerTitle: {
      fontSize: 24,
      fontWeight: 'bold',
      color: colors.text,
      flex: 1,
    },
    headerSubtitle: {
      fontSize: 14,
      color: colors.textSecondary,
      marginTop: 4,
    },
    statsCard: {
      backgroundColor: colors.cardBackground,
      marginHorizontal: 20,
      marginTop: 20,
      marginBottom: 10,
      borderRadius: 12,
      padding: 16,
      elevation: 3,
    },
    statsTitle: {
      fontSize: 16,
      fontWeight: 'bold',
      color: colors.text,
      marginBottom: 12,
    },
    statsRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
    },
    statItem: {
      flex: 1,
      alignItems: 'center',
    },
    statLabel: {
      fontSize: 12,
      color: colors.textSecondary,
      marginBottom: 4,
    },
    statValue: {
      fontSize: 18,
      fontWeight: 'bold',
    },
    calendarCard: {
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
    legend: {
      flexDirection: 'row',
      justifyContent: 'center',
      marginTop: 12,
      gap: 16,
    },
    legendItem: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    legendDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
      marginRight: 6,
    },
    legendText: {
      color: colors.textSecondary,
      fontSize: 12,
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    addReminderModalContent: {
      width: '90%',
      maxHeight: 400,
      borderRadius: 20,
      padding: 20,
      elevation: 5,
      backgroundColor: colors.cardBackground,
    },
    modalContent: {
      width: '90%',
      maxHeight: '80%',
      borderRadius: 20,
      padding: 20,
      elevation: 5,
      backgroundColor: colors.cardBackground,
    },
    modalHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: 20,
    },
    modalTitle: {
      fontSize: 22,
      fontWeight: 'bold',
      color: colors.text,
    },
    modalSubtitle: {
      fontSize: 14,
      color: colors.textSecondary,
      marginTop: 4,
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
    transactionItem: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: 12,
      borderRadius: 10,
      marginBottom: 8,
      elevation: 1,
      backgroundColor: colors.background,
    },
    transactionLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
    },
    iconContainer: {
      width: 40,
      height: 40,
      borderRadius: 10,
      backgroundColor: colors.cardBackground,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 12,
    },
    transactionIcon: {
      fontSize: 20,
    },
    transactionInfo: {
      flex: 1,
    },
    transactionCategory: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 2,
    },
    transactionDescription: {
      fontSize: 12,
      color: colors.textSecondary,
    },
    transactionRight: {
      alignItems: 'flex-end',
    },
    transactionAmount: {
      fontSize: 16,
      fontWeight: 'bold',
      marginBottom: 2,
    },
    reminderSection: {
      marginTop: 8,
    },
    sectionTitle: {
      fontSize: 16,
      fontWeight: 'bold',
      color: colors.text,
      marginBottom: 12,
    },
    reminderItem: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 12,
      borderRadius: 10,
      marginBottom: 8,
      backgroundColor: colors.background,
    },
    reminderTime: {
      fontSize: 14,
      fontWeight: 'bold',
      color: colors.primary,
      marginRight: 12,
    },
    reminderMessage: {
      fontSize: 14,
      color: colors.text,
      flex: 1,
    },
    addButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 14,
      borderRadius: 10,
      backgroundColor: colors.primary,
      marginTop: 8,
    },
    addButtonText: {
      color: '#fff',
      fontSize: 14,
      fontWeight: 'bold',
      marginLeft: 8,
    },
    input: {
      borderRadius: 10,
      padding: 14,
      fontSize: 16,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.background,
      color: colors.text,
      marginBottom: 12,
    },
    modalButtons: {
      flexDirection: 'row',
      gap: 12,
      marginTop: 16,
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
    buttonText: {
      fontSize: 16,
      fontWeight: '600',
    },
    emptyState: {
      alignItems: 'center',
      paddingVertical: 40,
    },
    emptyText: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.text,
      marginTop: 12,
      marginBottom: 8,
    },
    emptySubtext: {
      fontSize: 14,
      color: colors.textSecondary,
      textAlign: 'center',
    },
    detailsSection: {
      backgroundColor: colors.cardBackground,
      marginHorizontal: 20,
      borderRadius: 12,
      padding: 16,
      marginBottom: 20,
      elevation: 3,
    },
    detailsHeader: {
      marginBottom: 16,
    },
    detailsTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      color: colors.text,
      marginBottom: 4,
    },
    detailsSubtitle: {
      fontSize: 14,
      color: colors.textSecondary,
    },
    sectionHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 12,
    },
    quickAddButton: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 8,
      backgroundColor: colors.primary + '15',
    },
    quickAddText: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.primary,
    },
    timePickerButton: {
      backgroundColor: colors.background,
      borderRadius: 10,
      padding: 16,
      borderWidth: 1,
      borderColor: colors.border,
      marginBottom: 12,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    timePickerText: {
      fontSize: 16,
      color: colors.text,
      fontWeight: '500',
    },
    goalItem: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: 12,
      borderRadius: 10,
      marginBottom: 8,
      elevation: 1,
      backgroundColor: colors.background,
      borderLeftWidth: 3,
      borderLeftColor: '#9C27B0',
    },
    goalProgress: {
      fontSize: 16,
      fontWeight: 'bold',
    },
  });

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  const monthlyStats = getMonthlyStats();

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>📅 Calendar</Text>
        </View>
        <Text style={styles.headerSubtitle}>Track your transactions and set reminders</Text>
      </View>

      {/* Monthly Stats */}
      <View style={styles.statsCard}>
        <Text style={styles.statsTitle}>This Month</Text>
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>Income</Text>
            <Text style={[styles.statValue, { color: colors.income }]}>
              ${monthlyStats.income.toFixed(2)}
            </Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>Expenses</Text>
            <Text style={[styles.statValue, { color: colors.expense }]}>
              ${monthlyStats.expense.toFixed(2)}
            </Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>Balance</Text>
            <Text
              style={[
                styles.statValue,
                { color: monthlyStats.balance >= 0 ? colors.income : colors.expense },
              ]}
            >
              ${monthlyStats.balance.toFixed(2)}
            </Text>
          </View>
        </View>
      </View>

      {/* Calendar */}
      <View style={styles.calendarCard}>
        <Text style={styles.calendarSubtitle}>
          Tap a date to view transactions • Dots indicate activity
        </Text>

        <Calendar
          onDayPress={handleDateSelect}
          markedDates={getMarkedDates()}
          markingType="multi-dot"
          theme={{
            selectedDayBackgroundColor: colors.primary,
            todayTextColor: colors.primary,
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
        <View style={styles.legend}>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: colors.income }]} />
            <Text style={styles.legendText}>Income</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: colors.expense }]} />
            <Text style={styles.legendText}>Expense</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: '#9C27B0' }]} />
            <Text style={styles.legendText}>Goal</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: '#FF9800' }]} />
            <Text style={styles.legendText}>Reminder</Text>
          </View>
        </View>
      </View>

      {/* Date Details - Displayed Below Calendar */}
      {selectedDate && (
        <View style={styles.detailsSection}>
          <View style={styles.detailsHeader}>
            <Text style={styles.detailsTitle}>
              {new Date(selectedDate).toLocaleDateString('en-US', {
                weekday: 'long',
                month: 'long',
                day: 'numeric',
                year: 'numeric',
              })}
            </Text>
            <Text style={styles.detailsSubtitle}>
              {selectedDateTransactions.length} transaction
              {selectedDateTransactions.length !== 1 ? 's' : ''} · {selectedDateGoals.length} goal
              {selectedDateGoals.length !== 1 ? 's' : ''} · {dayReminders.length} reminder
              {dayReminders.length !== 1 ? 's' : ''}
            </Text>
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

          {/* Transactions for Selected Date */}
          <View style={{ marginBottom: 16 }}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Transactions</Text>
              <TouchableOpacity 
                style={styles.quickAddButton}
                onPress={handleAddTransaction}
              >
                <Ionicons name="add-circle" size={20} color={colors.primary} />
                <Text style={styles.quickAddText}>Add</Text>
              </TouchableOpacity>
            </View>
            {selectedDateTransactions.length === 0 ? (
              <View style={[styles.emptyState, { paddingVertical: 20 }]}>
                <Ionicons name="calendar-outline" size={40} color={colors.textSecondary} />
                <Text style={[styles.emptyText, { fontSize: 14 }]}>No transactions</Text>
                <Text style={[styles.emptySubtext, { fontSize: 12 }]}>Add a transaction for this date</Text>
              </View>
            ) : (
              selectedDateTransactions.map((item) => (
                <View key={item._id} style={styles.transactionItem}>
                  <View style={styles.transactionLeft}>
                    <View style={styles.iconContainer}>
                      <Text style={styles.transactionIcon}>{getIconForCategory(item.category)}</Text>
                    </View>
                    <View style={styles.transactionInfo}>
                      <Text style={styles.transactionCategory}>{item.category}</Text>
                      <Text style={styles.transactionDescription}>
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
                      {item.type === 'Income' ? '+' : '-'}${Math.abs(item.amount).toFixed(2)}
                    </Text>
                  </View>
                </View>
              ))
            )}
          </View>

          {/* Goals Section */}
          <View style={{ marginBottom: 16 }}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Goals</Text>
              <TouchableOpacity 
                style={styles.quickAddButton}
                onPress={handleAddGoal}
              >
                <Ionicons name="add-circle" size={20} color="#9C27B0" />
                <Text style={[styles.quickAddText, { color: '#9C27B0' }]}>Add</Text>
              </TouchableOpacity>
            </View>
            {selectedDateGoals.length === 0 ? (
              <View style={[styles.emptyState, { paddingVertical: 20 }]}>
                <Ionicons name="flag-outline" size={40} color={colors.textSecondary} />
                <Text style={[styles.emptyText, { fontSize: 14 }]}>No goals</Text>
                <Text style={[styles.emptySubtext, { fontSize: 12 }]}>Set a goal deadline for this date</Text>
              </View>
            ) : (
              selectedDateGoals.map((goal) => (
                <View key={goal._id} style={styles.goalItem}>
                  <View style={styles.transactionLeft}>
                    <View style={[styles.iconContainer, { backgroundColor: '#9C27B015' }]}>
                      <Text style={styles.transactionIcon}>{goal.icon || '🎯'}</Text>
                    </View>
                    <View style={styles.transactionInfo}>
                      <Text style={styles.transactionCategory}>{goal.name}</Text>
                      <Text style={styles.transactionDescription}>
                        ${goal.savedAmount.toFixed(2)} / ${goal.targetAmount.toFixed(2)}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.transactionRight}>
                    <Text style={[styles.goalProgress, { color: '#9C27B0' }]}>
                      {((goal.savedAmount / goal.targetAmount) * 100).toFixed(0)}%
                    </Text>
                  </View>
                </View>
              ))
            )}
          </View>

          {/* Reminders Section */}
          <View style={styles.reminderSection}>
            <Text style={styles.sectionTitle}>Reminders</Text>
            {dayReminders.length === 0 ? (
              <Text style={[styles.emptySubtext, { textAlign: 'left', marginBottom: 12 }]}>
                No reminders for this date
              </Text>
            ) : (
              dayReminders.map((reminder, index) => (
                <View key={index} style={styles.reminderItem}>
                  <Ionicons name="alarm-outline" size={20} color={colors.primary} />
                  <Text style={styles.reminderTime}>{reminder.time}</Text>
                  <Text style={styles.reminderMessage}>{reminder.message}</Text>
                </View>
              ))
            )}
            <TouchableOpacity
              style={styles.addButton}
              onPress={() => setIsAddReminderVisible(true)}
            >
              <Ionicons name="add-circle-outline" size={20} color="#fff" />
              <Text style={styles.addButtonText}>Add Reminder</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Add Reminder Modal */}
      <Modal
        visible={isAddReminderVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setIsAddReminderVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.addReminderModalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add Reminder</Text>
              <TouchableOpacity onPress={() => setIsAddReminderVisible(false)}>
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            <Text style={[styles.modalSubtitle, { marginBottom: 16 }]}>
              Set a reminder for {selectedDate}
            </Text>

            <Text style={[styles.sectionTitle, { fontSize: 14, marginBottom: 8 }]}>Time</Text>
            <TouchableOpacity
              style={styles.timePickerButton}
              onPress={() => setShowTimePicker(true)}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Ionicons name="time-outline" size={20} color={colors.primary} />
                <Text style={styles.timePickerText}>
                  {reminderTime.toLocaleTimeString('en-US', { 
                    hour: '2-digit', 
                    minute: '2-digit',
                    hour12: true 
                  })}
                </Text>
              </View>
              <Ionicons name="chevron-down" size={20} color={colors.textSecondary} />
            </TouchableOpacity>

            {showTimePicker && (
              <DateTimePicker
                value={reminderTime}
                mode="time"
                is24Hour={false}
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                onChange={(event: any, selectedTime?: Date) => {
                  setShowTimePicker(Platform.OS === 'ios');
                  if (selectedTime) {
                    setReminderTime(selectedTime);
                  }
                }}
              />
            )}

            <TextInput
              style={[styles.input, { height: 80 }]}
              placeholder="Message"
              value={newReminderMessage}
              onChangeText={setNewReminderMessage}
              placeholderTextColor={colors.textSecondary}
              multiline
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setIsAddReminderVisible(false)}
              >
                <Text style={[styles.buttonText, { color: colors.text }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.saveButton]}
                onPress={handleSaveReminder}
              >
                <Text style={[styles.buttonText, { color: '#fff' }]}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}


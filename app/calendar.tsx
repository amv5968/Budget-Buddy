import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Calendar } from 'react-native-calendars';
import { useTheme } from '../context/ThemeContext';
import {
  notifyDateTransactions,
} from './services/notificationService';
import { getReminders } from './services/reminderService';
import {
  getTransactions,
  Transaction,
} from './services/transactionService';

export default function CalendarScreen() {
  const { colors } = useTheme();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // calendar state
  const [allTransactions, setAllTransactions] = useState<Transaction[]>([]);
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedDateTransactions, setSelectedDateTransactions] = useState<Transaction[]>([]);
  const [isDateDetailVisible, setIsDateDetailVisible] = useState(false);

  const [dayReminders, setDayReminders] = useState<{ time: string; message: string }[]>([]);
  const [allRemindersByDate, setAllRemindersByDate] = useState<
    Record<string, { time: string; message: string }[]>
  >({});

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [transData, reminders] = await Promise.all([
        getTransactions(),
        getReminders(),
      ]);

      setAllTransactions(transData);

      const byDate: Record<string, { time: string; message: string }[]> = {};
      for (const r of reminders) {
        if (!byDate[r.date]) byDate[r.date] = [];
        byDate[r.date].push({ time: r.time, message: r.message });
      }
      setAllRemindersByDate(byDate);

      if (selectedDate) {
        setDayReminders(byDate[selectedDate] ?? []);
      }
    } catch (e) {
      console.error('Error loading calendar data:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [selectedDate]);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
  };

  const handleDateSelect = async (day: { dateString: string }) => {
    const dateString = day.dateString;
    setSelectedDate(dateString);

    const filtered = allTransactions.filter((transaction) => {
      const transDate = new Date(transaction.date).toISOString().split('T')[0];
      return transDate === dateString;
    });

    setSelectedDateTransactions(filtered);
    setIsDateDetailVisible(true);

    await notifyDateTransactions(dateString, filtered);
    setDayReminders(allRemindersByDate[dateString] ?? []);
  };

  const getMarkedDates = () => {
    const marked: any = {};

    // spending dots
    allTransactions.forEach((transaction) => {
      const date = new Date(transaction.date).toISOString().split('T')[0];
      if (!marked[date]) marked[date] = { dots: [] };
      if (!marked[date].dots.some((d: any) => d.color === colors.primary)) {
        marked[date].dots.push({ color: colors.primary });
      }
    });

    // reminder dots
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

  if (loading) {
    return (
      <View style={[styles(colors).container, styles(colors).centerContent]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles(colors).container}
      contentContainerStyle={{ paddingBottom: 24 }}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <View style={styles(colors).headerRow}>
  <TouchableOpacity onPress={() => router.back()} style={styles(colors).backButton}>
    <Ionicons name="arrow-back" size={24} color={colors.text} />
  </TouchableOpacity>

  <Text style={styles(colors).sectionTitle}>Calendar</Text>

  {/* Spacer to balance layout */}
  <View style={{ width: 24 }} />
</View>


      <View style={styles(colors).calendarSection}>
        <Text style={styles(colors).calendarSubtitle}>
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

      {/* Date details modal */}
      <Modal
        visible={isDateDetailVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setIsDateDetailVisible(false)}
      >
        <View style={styles(colors).modalOverlay}>
          <View style={styles(colors).dateModalContent}>
            <View style={styles(colors).dateModalHeader}>
              <View>
                <Text style={styles(colors).modalTitle}>
                  {selectedDate &&
                    new Date(selectedDate).toLocaleDateString('en-US', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                </Text>

                <Text style={styles(colors).modalSubtitle}>
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
              <View style={styles(colors).daySummaryContainer}>
                <View style={[styles(colors).daySummaryBox, { backgroundColor: colors.income + '20' }]}>
                  <Text style={styles(colors).daySummaryLabel}>Income</Text>
                  <Text style={[styles(colors).daySummaryAmount, { color: colors.income }]}>
                    +${getDayStats().income.toFixed(2)}
                  </Text>
                </View>
                <View style={[styles(colors).daySummaryBox, { backgroundColor: colors.expense + '20' }]}>
                  <Text style={styles(colors).daySummaryLabel}>Expenses</Text>
                  <Text style={[styles(colors).daySummaryAmount, { color: colors.expense }]}>
                    -${getDayStats().expense.toFixed(2)}
                  </Text>
                </View>
              </View>
            )}

            <ScrollView style={styles(colors).dateTransactionsList}>
              {selectedDateTransactions.length === 0 ? (
                <View style={styles(colors).emptyDateState}>
                  <Ionicons
                    name="calendar-outline"
                    size={48}
                    color={colors.textSecondary}
                    style={{ marginBottom: 12 }}
                  />
                  <Text style={styles(colors).emptyText}>No transactions</Text>
                  <Text style={styles(colors).emptySubtext}>Add a transaction for this date</Text>
                </View>
              ) : (
                selectedDateTransactions.map((item) => (
                  <TouchableOpacity
                    key={item._id}
                    style={styles(colors).dateTransactionItem}
                    onPress={() => {
                      setIsDateDetailVisible(false);
                      router.push('/(tabs)/transactions');
                    }}
                  >
                    <View style={styles(colors).transactionLeft}>
                      <View
                        style={[styles(colors).iconContainer, { backgroundColor: colors.cardBackground }]}
                      >
                        <Text style={styles(colors).transactionIcon}>{getIconForCategory(item.category)}</Text>
                      </View>
                      <View style={styles(colors).transactionInfo}>
                        <Text style={styles(colors).transactionCategory}>{item.category}</Text>
                        <Text style={styles(colors).transactionDate}>
                          {item.description || 'No description'}
                        </Text>
                      </View>
                    </View>
                    <View style={styles(colors).transactionRight}>
                      <Text
                        style={[
                          styles(colors).transactionAmount,
                          { color: item.type === 'Income' ? colors.income : colors.expense },
                        ]}
                      >
                        {item.type === 'Income' ? '+' : '-'}${Math.abs(item.amount).toFixed(2)}
                      </Text>
                      <Text style={[styles(colors).transactionType, { color: colors.textSecondary }]}>
                        {item.type}
                      </Text>
                    </View>
                  </TouchableOpacity>
                ))
              )}
            </ScrollView>

            <TouchableOpacity
              style={styles(colors).quickAddButton}
              onPress={() => {
                setIsDateDetailVisible(false);
                router.push('/(tabs)/add-transaction?returnTo=/(tabs)');
              }}
            >
              <Ionicons name="add-circle-outline" size={24} color="#fff" />
              <Text style={styles(colors).quickAddText}>Add Transaction for This Date</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = (colors: any) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    centerContent: { justifyContent: 'center', alignItems: 'center' },

    headerRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 20,
      paddingTop: 20,
      paddingBottom: 10,
    },
    sectionTitle: {
      fontSize: 20,
      fontWeight: 'bold',
      color: colors.text,
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

    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'center',
      alignItems: 'center',
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
    emptyDateState: {
      alignItems: 'center',
      paddingVertical: 40,
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
      marginBottom: 24,
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
    backButton: {
  padding: 4,
  marginRight: 8,
},
  });

import React, { useState, useEffect, useCallback } from 'react';
import { 
  View, 
  Text, 
  FlatList, 
  StyleSheet, 
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Alert,
  ScrollView,
  Dimensions,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Calendar } from 'react-native-calendars';
import { PieChart } from 'react-native-chart-kit';
import { useAuth } from '../../context/AuthContext';
import { 
  getTransactions, 
  getTransactionStats,
  type Transaction 
} from '../services/transactionService';

const screenWidth = Dimensions.get('window').width;

export default function HomeScreen() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [totalIncome, setTotalIncome] = useState(0);
  const [totalExpense, setTotalExpense] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedDate, setSelectedDate] = useState('');

  // New: Allowance
  const monthlyAllowance = 1000; // You can make this editable later
  const remaining = monthlyAllowance - totalExpense;

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [])
  );

  const loadData = async () => {
    try {
      const [transData, statsData] = await Promise.all([
        getTransactions(),
        getTransactionStats(),
      ]);

      setTransactions(transData.slice(0, 5));
      setTotalIncome(statsData.totalIncome);
      setTotalExpense(statsData.totalExpense);
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

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
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

  // New: Pie chart data (Expense breakdown)
  const chartData = [
    {
      name: 'Food',
      amount: 150,
      color: '#4CAF50',
      legendFontColor: '#333',
      legendFontSize: 13,
    },
    {
      name: 'Transport',
      amount: 60,
      color: '#2196F3',
      legendFontColor: '#333',
      legendFontSize: 13,
    },
    {
      name: 'Rent',
      amount: 400,
      color: '#FF9800',
      legendFontColor: '#333',
      legendFontSize: 13,
    },
    {
      name: 'Education',
      amount: 200,
      color: '#E91E63',
      legendFontColor: '#333',
      legendFontSize: 13,
    },
    {
      name: 'Other',
      amount: 50,
      color: '#9C27B0',
      legendFontColor: '#333',
      legendFontSize: 13,
    },
  ];

  if (loading) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color="#66BB6A" />
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
          <TouchableOpacity onPress={() => router.push('/settings')}>
            <Ionicons name="settings-outline" size={26} color="#333" />
          </TouchableOpacity>
          <TouchableOpacity onPress={handleLogout}>
            <Ionicons name="log-out-outline" size={26} color="#F44336" style={{ marginLeft: 16 }} />
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
      <View style={styles.allowanceCard}>
        <Text style={styles.sectionTitle}>🎓 Monthly Allowance</Text>
        <Text style={styles.allowanceText}>Allowance: ${monthlyAllowance}</Text>
        <Text style={styles.allowanceText}>Spent: ${totalExpense.toFixed(2)}</Text>
        <Text
          style={[
            styles.allowanceText,
            { color: remaining >= 0 ? '#4CAF50' : '#F44336', fontWeight: 'bold' },
          ]}
        >
          Remaining: ${remaining >= 0 ? remaining.toFixed(2) : 0}
        </Text>
        <View style={styles.progressBarBackground}>
          <View
            style={[
              styles.progressBarFill,
              { width: `${Math.min((totalExpense / monthlyAllowance) * 100, 100)}%` },
            ]}
          />
        </View>
      </View>

      {/* 🥧 Expense Breakdown */}
      <View style={styles.chartCard}>
        <Text style={styles.sectionTitle}>Expense Breakdown</Text>
        <PieChart
          data={chartData}
          width={screenWidth - 40}
          height={220}
          chartConfig={{
            backgroundGradientFrom: '#fff',
            backgroundGradientTo: '#fff',
            color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
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
        <Calendar
          onDayPress={(day) => setSelectedDate(day.dateString)}
          markedDates={{
            [selectedDate]: {
              selected: true,
              selectedColor: '#42A5F5',
            },
          }}
          theme={{
            selectedDayBackgroundColor: '#42A5F5',
            todayTextColor: '#4CAF50',
          }}
        />
        {selectedDate ? (
          <Text style={styles.selectedDateText}>
            Selected Date: {selectedDate}
          </Text>
        ) : null}
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
        <FlatList
          data={transactions}
          keyExtractor={(item) => item._id}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.transactionItem}
              onPress={() => router.push(`../(tabs)/edit-transaction?id=${item._id}`)}
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
                    { color: item.type === 'Income' ? '#4CAF50' : '#F44336' },
                  ]}
                >
                  {item.type === 'Income' ? '+' : '-'}$
                  {Math.abs(item.amount).toFixed(2)}
                </Text>
                <Text style={styles.transactionType}>{item.type}</Text>
              </View>
            </TouchableOpacity>
          )}
          contentContainerStyle={styles.listContent}
        />
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  centerContent: { justifyContent: 'center', alignItems: 'center' },
  headerSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    backgroundColor: 'white',
  },
  title: { fontSize: 28, fontWeight: 'bold' },
  welcomeText: { fontSize: 14, color: '#666', marginTop: 4 },
  headerButtons: { flexDirection: 'row', alignItems: 'center' },
  summaryContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 20,
    backgroundColor: 'white',
    marginBottom: 10,
  },
  summaryBox: {
    backgroundColor: '#f8f9fa',
    padding: 15,
    borderRadius: 12,
    flex: 1,
    marginHorizontal: 5,
    alignItems: 'center',
    elevation: 2,
  },
  incomeBox: { backgroundColor: '#E8F5E9' },
  expenseBox: { backgroundColor: '#FFEBEE' },
  balanceBox: { backgroundColor: '#E3F2FD' },
  summaryLabel: { fontSize: 11, color: '#666', marginBottom: 6, fontWeight: '500' },
  incomeText: { fontSize: 16, fontWeight: 'bold', color: '#4CAF50' },
  expenseText: { fontSize: 16, fontWeight: 'bold', color: '#F44336' },
  balanceText: { fontSize: 16, fontWeight: 'bold' },

  // New Styles
  allowanceCard: {
    backgroundColor: 'white',
    marginHorizontal: 20,
    marginBottom: 15,
    borderRadius: 12,
    padding: 16,
    elevation: 3,
  },
  allowanceText: { fontSize: 16, color: '#333', marginBottom: 4 },
  progressBarBackground: {
    width: '100%',
    height: 10,
    backgroundColor: '#e0e0e0',
    borderRadius: 5,
  },
  progressBarFill: {
    height: 10,
    backgroundColor: '#66BB6A',
    borderRadius: 5,
  },
  chartCard: {
    backgroundColor: 'white',
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 12,
    padding: 16,
    elevation: 3,
  },

  calendarSection: {
    backgroundColor: 'white',
    marginHorizontal: 20,
    borderRadius: 12,
    padding: 15,
    marginBottom: 20,
    elevation: 2,
  },
  selectedDateText: {
    textAlign: 'center',
    marginTop: 10,
    color: '#333',
    fontWeight: '500',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 15,
  },
  sectionTitle: { fontSize: 20, fontWeight: 'bold', color: '#333' },
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
  emptyText: { fontSize: 18, fontWeight: '600', color: '#333', marginBottom: 8 },
  emptySubtext: { fontSize: 14, color: '#666', textAlign: 'center', marginBottom: 24 },
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
    backgroundColor: 'white',
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
    backgroundColor: '#f8f9fa',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  transactionIcon: { fontSize: 24 },
  transactionInfo: { flex: 1 },
  transactionCategory: { fontSize: 16, fontWeight: '600', color: '#333', marginBottom: 2 },
  transactionDate: { fontSize: 12, color: '#999' },
  transactionRight: { alignItems: 'flex-end' },
  transactionAmount: { fontSize: 16, fontWeight: 'bold', marginBottom: 2 },
  transactionType: { fontSize: 11, color: '#999', textTransform: 'uppercase' },
});

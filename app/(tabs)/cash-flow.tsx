import { useFocusEffect } from 'expo-router';
import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { getTransactions, getTransactionStats, type Transaction } from '../services/transactionService';

const screenWidth = Dimensions.get('window').width;

type TimeFilter = 'week' | 'month' | 'year';

const CashFlowScreen: React.FC = () => {
  const { colors } = useTheme();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('month');

  const [totalIncome, setTotalIncome] = useState(0);
  const [totalExpenses, setTotalExpenses] = useState(0);
  const [netFlow, setNetFlow] = useState(0);

  useFocusEffect(
    useCallback(() => {
      fetchTransactions();
    }, [timeFilter])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchTransactions();
  };

  const fetchTransactions = async () => {
    try {
      const [transData, statsData] = await Promise.all([
        getTransactions(),
        getTransactionStats(),
      ]);

      setTransactions(transData);

      // Filter by time period
      const now = new Date();
      const filteredTransactions = transData.filter((t: Transaction) => {
        const transDate = new Date(t.date);
        const diffTime = Math.abs(now.getTime() - transDate.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        if (timeFilter === 'week') return diffDays <= 7;
        if (timeFilter === 'month') return diffDays <= 30;
        if (timeFilter === 'year') return diffDays <= 365;
        return true;
      });

      const income = filteredTransactions
        .filter((t: Transaction) => t.type === 'Income')
        .reduce((sum: number, t: Transaction) => sum + t.amount, 0);

      const expenses = filteredTransactions
        .filter((t: Transaction) => t.type === 'Expense')
        .reduce((sum: number, t: Transaction) => sum + t.amount, 0);

      setTotalIncome(income);
      setTotalExpenses(expenses);
      setNetFlow(income - expenses);
    } catch (error) {
      console.error('Error fetching transactions:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Calculate expense breakdown by category
  const expensesByCategory = transactions
    .filter((t: Transaction) => t.type === 'Expense')
    .reduce((acc: { [key: string]: number }, t: Transaction) => {
      acc[t.category] = (acc[t.category] || 0) + t.amount;
      return acc;
    }, {});

  const topExpenseCategories = Object.entries(expensesByCategory)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5);

  // Calculate daily average
  const days = timeFilter === 'week' ? 7 : timeFilter === 'month' ? 30 : 365;
  const dailyAvgIncome = totalIncome / days;
  const dailyAvgExpenses = totalExpenses / days;

  // Insights
  const savingsRate = totalIncome > 0 ? ((totalIncome - totalExpenses) / totalIncome * 100) : 0;
  const spendingRatio = totalIncome > 0 ? (totalExpenses / totalIncome * 100) : 0;

  const dynamicStyles = StyleSheet.create({
    container: { 
      flex: 1, 
      backgroundColor: colors.background,
    },
    headerSection: {
      backgroundColor: colors.cardBackground,
      paddingTop: 60,
      paddingBottom: 20,
      paddingHorizontal: 20,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    title: { 
      fontSize: 24, 
      fontWeight: '700', 
      color: colors.text,
      marginBottom: 8,
    },
    subtitle: {
      fontSize: 14,
      color: colors.textSecondary,
    },
    filterContainer: {
      flexDirection: 'row',
      paddingHorizontal: 20,
      paddingVertical: 16,
      backgroundColor: colors.cardBackground,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    filterButton: {
      flex: 1,
      paddingVertical: 10,
      marginHorizontal: 4,
      borderRadius: 8,
      alignItems: 'center',
      borderWidth: 2,
    },
    filterButtonActive: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },
    filterButtonInactive: {
      backgroundColor: 'transparent',
      borderColor: colors.border,
    },
    filterText: {
      fontSize: 14,
      fontWeight: '600',
    },
    filterTextActive: {
      color: '#fff',
    },
    filterTextInactive: {
      color: colors.textSecondary,
    },
    content: {
      padding: 20,
    },
    summaryContainer: { 
      marginBottom: 20,
    },
    card: {
      backgroundColor: colors.cardBackground,
      padding: 16,
      borderRadius: 12,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: colors.border,
      elevation: 2,
    },
    cardRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    label: { 
      fontSize: 16, 
      color: colors.textSecondary,
      marginBottom: 8,
    },
    amount: { 
      fontSize: 24, 
      fontWeight: '700',
    },
    sectionTitle: {
      fontSize: 20,
      fontWeight: '700',
      color: colors.text,
      marginBottom: 12,
      marginTop: 8,
    },
    chartContainer: {
      backgroundColor: colors.cardBackground,
      borderRadius: 12,
      padding: 16,
      marginBottom: 20,
      borderWidth: 1,
      borderColor: colors.border,
      elevation: 2,
    },
    chartTitle: { 
      fontSize: 18, 
      fontWeight: '600', 
      marginBottom: 12,
      color: colors.text,
    },
    barContainer: {
      flexDirection: 'row',
      height: 24,
      borderRadius: 12,
      overflow: 'hidden',
      backgroundColor: colors.border,
    },
    incomeBar: {
      backgroundColor: colors.income,
      height: '100%',
    },
    expenseBar: {
      backgroundColor: colors.expense,
      height: '100%',
    },
    chartLegend: {
      textAlign: 'center',
      color: colors.textSecondary,
      marginTop: 12,
      fontSize: 13,
    },
    insightCard: {
      backgroundColor: colors.cardBackground,
      borderRadius: 12,
      padding: 16,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: colors.border,
      flexDirection: 'row',
      alignItems: 'center',
    },
    insightIcon: {
      fontSize: 32,
      marginRight: 12,
    },
    insightContent: {
      flex: 1,
    },
    insightTitle: {
      fontSize: 14,
      color: colors.textSecondary,
      marginBottom: 4,
    },
    insightValue: {
      fontSize: 18,
      fontWeight: '700',
      color: colors.text,
    },
    categoryItem: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    categoryLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
    },
    categoryName: {
      fontSize: 16,
      color: colors.text,
      marginLeft: 8,
    },
    categoryAmount: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.text,
    },
    categoryPercentage: {
      fontSize: 12,
      color: colors.textSecondary,
      marginLeft: 8,
    },
    studentTip: {
      backgroundColor: colors.primary + '20',
      borderRadius: 12,
      padding: 16,
      marginBottom: 20,
      borderLeftWidth: 4,
      borderLeftColor: colors.primary,
    },
    tipTitle: {
      fontSize: 16,
      fontWeight: '700',
      color: colors.text,
      marginBottom: 8,
    },
    tipText: {
      fontSize: 14,
      color: colors.textSecondary,
      lineHeight: 20,
    },
  });

  const getInsight = () => {
    if (netFlow > 0) {
      return {
        icon: '🎉',
        text: `Great job! You're saving ${savingsRate.toFixed(0)}% this ${timeFilter}. Keep it up!`,
      };
    } else if (spendingRatio > 100) {
      return {
        icon: '⚠️',
        text: `You're spending ${(spendingRatio - 100).toFixed(0)}% more than you earn. Consider cutting back on expenses.`,
      };
    } else {
      return {
        icon: '💡',
        text: `You're spending ${spendingRatio.toFixed(0)}% of your income. Try to aim for 80% or less to build savings.`,
      };
    }
  };

  const insight = getInsight();

  if (loading) {
    return (
      <View style={[dynamicStyles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={dynamicStyles.container}>
      {/* Header */}
      <View style={dynamicStyles.headerSection}>
        <Text style={dynamicStyles.title}>💵 Cash Flow</Text>
        <Text style={dynamicStyles.subtitle}>Track your income and expenses</Text>
      </View>

      {/* Time Filter */}
      <View style={dynamicStyles.filterContainer}>
        <TouchableOpacity
          style={[
            dynamicStyles.filterButton,
            timeFilter === 'week' ? dynamicStyles.filterButtonActive : dynamicStyles.filterButtonInactive
          ]}
          onPress={() => setTimeFilter('week')}
        >
          <Text style={[
            dynamicStyles.filterText,
            timeFilter === 'week' ? dynamicStyles.filterTextActive : dynamicStyles.filterTextInactive
          ]}>Week</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            dynamicStyles.filterButton,
            timeFilter === 'month' ? dynamicStyles.filterButtonActive : dynamicStyles.filterButtonInactive
          ]}
          onPress={() => setTimeFilter('month')}
        >
          <Text style={[
            dynamicStyles.filterText,
            timeFilter === 'month' ? dynamicStyles.filterTextActive : dynamicStyles.filterTextInactive
          ]}>Month</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            dynamicStyles.filterButton,
            timeFilter === 'year' ? dynamicStyles.filterButtonActive : dynamicStyles.filterButtonInactive
          ]}
          onPress={() => setTimeFilter('year')}
        >
          <Text style={[
            dynamicStyles.filterText,
            timeFilter === 'year' ? dynamicStyles.filterTextActive : dynamicStyles.filterTextInactive
          ]}>Year</Text>
        </TouchableOpacity>
      </View>

      <ScrollView 
        style={dynamicStyles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* Student Insight */}
        <View style={dynamicStyles.studentTip}>
          <Text style={dynamicStyles.tipTitle}>{insight.icon} Student Insight</Text>
          <Text style={dynamicStyles.tipText}>{insight.text}</Text>
        </View>

        {/* Summary Cards */}
        <View style={dynamicStyles.summaryContainer}>
          <View style={dynamicStyles.card}>
            <Text style={dynamicStyles.label}>Total Income</Text>
            <Text style={[dynamicStyles.amount, { color: colors.income }]}>
              +${totalIncome.toFixed(2)}
            </Text>
          </View>

          <View style={dynamicStyles.card}>
            <Text style={dynamicStyles.label}>Total Expenses</Text>
            <Text style={[dynamicStyles.amount, { color: colors.expense }]}>
              -${totalExpenses.toFixed(2)}
            </Text>
          </View>

          <View style={dynamicStyles.card}>
            <Text style={dynamicStyles.label}>Net Cash Flow</Text>
            <Text
              style={[
                dynamicStyles.amount,
                { color: netFlow >= 0 ? colors.income : colors.expense },
              ]}
            >
              {netFlow >= 0 ? '+' : ''}${netFlow.toFixed(2)}
            </Text>
          </View>
        </View>

        {/* Visual Cash Flow Bar */}
        <View style={dynamicStyles.chartContainer}>
          <Text style={dynamicStyles.chartTitle}>Income vs Expenses</Text>
          <View style={dynamicStyles.barContainer}>
            <View
              style={[
                dynamicStyles.incomeBar,
                { width: `${(totalIncome / (totalIncome + totalExpenses || 1)) * 100}%` },
              ]}
            />
            <View
              style={[
                dynamicStyles.expenseBar,
                { width: `${(totalExpenses / (totalIncome + totalExpenses || 1)) * 100}%` },
              ]}
            />
          </View>
          <Text style={dynamicStyles.chartLegend}>
            Green: ${totalIncome.toFixed(0)} | Red: ${totalExpenses.toFixed(0)}
          </Text>
        </View>

        {/* Key Metrics */}
        <Text style={dynamicStyles.sectionTitle}>📊 Key Metrics</Text>
        <View style={dynamicStyles.insightCard}>
          <Text style={dynamicStyles.insightIcon}>📈</Text>
          <View style={dynamicStyles.insightContent}>
            <Text style={dynamicStyles.insightTitle}>Daily Avg Income</Text>
            <Text style={dynamicStyles.insightValue}>${dailyAvgIncome.toFixed(2)}/day</Text>
          </View>
        </View>

        <View style={dynamicStyles.insightCard}>
          <Text style={dynamicStyles.insightIcon}>📉</Text>
          <View style={dynamicStyles.insightContent}>
            <Text style={dynamicStyles.insightTitle}>Daily Avg Expenses</Text>
            <Text style={dynamicStyles.insightValue}>${dailyAvgExpenses.toFixed(2)}/day</Text>
          </View>
        </View>

        <View style={dynamicStyles.insightCard}>
          <Text style={dynamicStyles.insightIcon}>💰</Text>
          <View style={dynamicStyles.insightContent}>
            <Text style={dynamicStyles.insightTitle}>Savings Rate</Text>
            <Text style={[
              dynamicStyles.insightValue,
              { color: savingsRate >= 20 ? colors.income : colors.warning }
            ]}>
              {savingsRate.toFixed(1)}%
            </Text>
          </View>
        </View>

        {/* Top Spending Categories */}
        {topExpenseCategories.length > 0 && (
          <>
            <Text style={dynamicStyles.sectionTitle}>🏆 Top Spending Categories</Text>
            <View style={dynamicStyles.card}>
              {topExpenseCategories.map(([category, amount], index) => (
                <View key={index} style={dynamicStyles.categoryItem}>
                  <View style={dynamicStyles.categoryLeft}>
                    <Text style={{ fontSize: 20 }}>
                      {category === 'Food' ? '🍔' : 
                       category === 'Transport' ? '🚗' :
                       category === 'Rent' ? '🏠' :
                       category === 'Education' ? '📚' :
                       category === 'Entertainment' ? '🎬' :
                       category === 'Shopping' ? '🛍️' :
                       category === 'Healthcare' ? '🏥' : '💵'}
                    </Text>
                    <Text style={dynamicStyles.categoryName}>{category}</Text>
                  </View>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Text style={dynamicStyles.categoryAmount}>${amount.toFixed(2)}</Text>
                    <Text style={dynamicStyles.categoryPercentage}>
                      ({((amount / totalExpenses) * 100).toFixed(0)}%)
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          </>
        )}
      </ScrollView>
    </View>
  );
};

export default CashFlowScreen;

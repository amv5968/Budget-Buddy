import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
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
import { BarChart, LineChart, PieChart } from 'react-native-chart-kit';
import { useTheme } from '../context/ThemeContext';
import {
  getTransactions,
  getTransactionStats,
  Transaction,
} from './services/transactionService';

const screenWidth = Dimensions.get('window').width;

export default function ExpenseBreakdownScreen() {
  const { colors } = useTheme();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // chart state (same idea as Home)
  const [selectedChartType, setSelectedChartType] = useState<'pie' | 'line' | 'bar'>('pie');
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [allTransactions, setAllTransactions] = useState<Transaction[]>([]);
  const [totalIncome, setTotalIncome] = useState(0);
  const [totalExpense, setTotalExpense] = useState(0);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [transData, statsData] = await Promise.all([
        getTransactions(),
        getTransactionStats(),
      ]);

      // same pattern as Home: keep full list + “recent” list
      setAllTransactions(transData);
      setTransactions(transData.slice(0, 4));
      setTotalIncome(statsData.totalIncome);
      setTotalExpense(statsData.totalExpense);
    } catch (e) {
      console.error('Error loading analytics data:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
  };

  // ---- SAME CALC HELPERS AS IN HOME ----

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

    const total = Object.values(categoryTotals).reduce(
      (sum, val) => sum + Math.abs(val),
      0
    );
    const pieColors = ['#4CAF50', '#2196F3', '#FF9800', '#E91E63', '#9C27B0', '#FFC107', '#00BCD4'];

    const chartData = Object.entries(categoryTotals)
      .map(([name, amount], index) => {
        const absAmount = Math.abs(amount);
        const percentage = total > 0 ? (absAmount / total) * 100 : 0;
        const displayName = name.length > 12 ? name.substring(0, 10) + '...' : name;
        return {
          name: displayName,
          fullName: name,
          amount: absAmount,
          percentage,
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

  const calculateSpendingTrend = () => {
    const last7Days = Array(7).fill(0);
    const labels: string[] = [];
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

  const calculateIncomeVsExpenses = () => {
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();

    let monthIncome = 0;
    let monthExpense = 0;

    allTransactions.forEach((t) => {
      const transDate = new Date(t.date);
      if (
        transDate.getMonth() === currentMonth &&
        transDate.getFullYear() === currentYear
      ) {
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

  const chartData = calculateExpenseBreakdown();
  const spendingTrendData = calculateSpendingTrend();
  const incomeVsExpensesData = calculateIncomeVsExpenses();

  // -------- UI --------

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
      {/* Header with back button */}
      <View style={styles(colors).headerRow}>
        <TouchableOpacity onPress={() => router.back()} style={{ paddingRight: 8 }}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles(colors).sectionTitle}>Expense Breakdown</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Chart card */}
      <View style={styles(colors).chartCard}>
        <View style={styles(colors).chartHeader}>
          <Text style={[styles(colors).sectionTitle, { flex: 1, flexShrink: 1 }]}>
            {selectedChartType === 'pie' && '📊 Expense Breakdown'}
            {selectedChartType === 'line' && '📈 7-Day Trend'}
            {selectedChartType === 'bar' && '💰 Income vs Expenses'}
          </Text>
          <View style={styles(colors).chartSelector}>
            <TouchableOpacity
              style={[
                styles(colors).chartTypeButton,
                selectedChartType === 'pie' && styles(colors).chartTypeButtonActive,
              ]}
              onPress={() => setSelectedChartType('pie')}
            >
              <Text
                style={[
                  styles(colors).chartTypeText,
                  selectedChartType === 'pie' && styles(colors).chartTypeTextActive,
                ]}
              >
                Pie
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles(colors).chartTypeButton,
                selectedChartType === 'line' && styles(colors).chartTypeButtonActive,
              ]}
              onPress={() => setSelectedChartType('line')}
            >
              <Text
                style={[
                  styles(colors).chartTypeText,
                  selectedChartType === 'line' && styles(colors).chartTypeTextActive,
                ]}
              >
                Line
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles(colors).chartTypeButton,
                selectedChartType === 'bar' && styles(colors).chartTypeButtonActive,
              ]}
              onPress={() => setSelectedChartType('bar')}
            >
              <Text
                style={[
                  styles(colors).chartTypeText,
                  selectedChartType === 'bar' && styles(colors).chartTypeTextActive,
                ]}
              >
                Bar
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Pie Chart */}
        {selectedChartType === 'pie' && (
          <View>
            <PieChart
              data={chartData}
              width={screenWidth - 72}
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
              hasLegend={false}
            />

            {/* Legend */}
            <View style={styles(colors).pieLegendContainer}>
              {chartData.map((item, index) => (
                <View
                  key={index}
                  style={[
                    styles(colors).pieLegendItem,
                    { backgroundColor: colors.cardBackground },
                  ]}
                >
                  <View
                    style={[
                      styles(colors).pieLegendColor,
                      { backgroundColor: item.color },
                    ]}
                  />
                  <View style={styles(colors).pieLegendTextContainer}>
                    <Text
                      style={[styles(colors).pieLegendName, { color: colors.text }]}
                      numberOfLines={1}
                    >
                      {item.fullName}
                    </Text>
                    <Text
                      style={[
                        styles(colors).pieLegendAmount,
                        { color: colors.textSecondary },
                      ]}
                    >
                      ${item.amount.toFixed(2)} ({item.percentage.toFixed(1)}%)
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Line Chart */}
        {selectedChartType === 'line' && (
          <LineChart
            data={{
              labels: spendingTrendData.labels,
              datasets: [
                { data: spendingTrendData.data.length ? spendingTrendData.data : [0] },
              ],
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
              labelColor: () => colors.text,
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

        {/* Bar Chart */}
        {selectedChartType === 'bar' && (
          <BarChart
            data={{
              labels: incomeVsExpensesData.labels,
              datasets: [
                {
                  data: incomeVsExpensesData.data.length
                    ? incomeVsExpensesData.data
                    : [0, 0],
                },
              ],
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
              labelColor: () => colors.text,
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
    </ScrollView>
  );
}

const styles = (colors: any) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    centerContent: { justifyContent: 'center', alignItems: 'center' },

    headerRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 20,
      paddingTop: 20,
      paddingBottom: 10,
      justifyContent: 'space-between',
    },
    sectionTitle: {
      fontSize: 20,
      fontWeight: 'bold',
      color: colors.text,
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
  });

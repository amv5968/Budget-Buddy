import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
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
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { getTransactions, Transaction } from './services/transactionService';

const screenWidth = Dimensions.get('window').width;

export default function ExpenseBreakdownScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const { user } = useAuth();

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState<'week' | 'month' | 'year' | 'all'>('month');
  const [selectedChartType, setSelectedChartType] = useState<'pie' | 'bar' | 'line'>('pie');

  useFocusEffect(
    useCallback(() => {
      loadTransactions();
    }, [])
  );

  const loadTransactions = async () => {
    try {
      const data = await getTransactions();
      setTransactions(data);
    } catch (error) {
      console.error('Error loading transactions:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadTransactions();
  };

  const getFilteredTransactions = () => {
    const now = new Date();
    return transactions.filter((t) => {
      if (t.type !== 'Expense') return false;
      const transDate = new Date(t.date);
      const diffTime = now.getTime() - transDate.getTime();
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

      switch (selectedPeriod) {
        case 'week':
          return diffDays <= 7;
        case 'month':
          return diffDays <= 30;
        case 'year':
          return diffDays <= 365;
        default:
          return true;
      }
    });
  };

  const calculateCategoryBreakdown = () => {
    const filtered = getFilteredTransactions();
    const categoryTotals: { [key: string]: number } = {};

    filtered.forEach((transaction) => {
      const absAmount = Math.abs(transaction.amount);
      if (categoryTotals[transaction.category]) {
        categoryTotals[transaction.category] += absAmount;
      } else {
        categoryTotals[transaction.category] = absAmount;
      }
    });

    const totalExpense = Object.values(categoryTotals).reduce((sum, val) => sum + val, 0);
    const pieColors = ['#4CAF50', '#2196F3', '#FF9800', '#E91E63', '#9C27B0', '#FFC107', '#00BCD4', '#795548', '#607D8B'];

    return Object.entries(categoryTotals)
      .map(([name, amount], index) => ({
        name,
        amount,
        percentage: totalExpense > 0 ? (amount / totalExpense) * 100 : 0,
        color: pieColors[index % pieColors.length],
        legendFontColor: colors.text,
      }))
      .sort((a, b) => b.amount - a.amount);
  };

  const calculateMonthlyTrend = () => {
    const monthlyData: { [key: string]: number } = {};
    const allExpenses = transactions.filter((t) => t.type === 'Expense');

    allExpenses.forEach((t) => {
      const date = new Date(t.date);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      monthlyData[monthKey] = (monthlyData[monthKey] || 0) + Math.abs(t.amount);
    });

    const sorted = Object.entries(monthlyData)
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-6);

    return {
      labels: sorted.map(([key]) => {
        const [, month] = key.split('-');
        return ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][parseInt(month) - 1];
      }),
      data: sorted.map(([, value]) => value),
    };
  };

  const getTopCategories = () => {
    const breakdown = calculateCategoryBreakdown();
    return breakdown.slice(0, 5);
  };

  const getTotalExpenses = () => {
    return getFilteredTransactions().reduce((sum, t) => sum + Math.abs(t.amount), 0);
  };

  const getIconForCategory = (category: string) => {
    const icons: { [key: string]: string } = {
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
    periodSelector: {
      flexDirection: 'row',
      backgroundColor: colors.background,
      borderRadius: 12,
      padding: 4,
      marginHorizontal: 20,
      marginTop: 20,
      marginBottom: 10,
    },
    periodButton: {
      flex: 1,
      paddingVertical: 10,
      paddingHorizontal: 12,
      borderRadius: 8,
      alignItems: 'center',
    },
    periodButtonActive: {
      backgroundColor: colors.primary,
    },
    periodButtonText: {
      fontSize: 13,
      fontWeight: '600',
      color: colors.textSecondary,
    },
    periodButtonTextActive: {
      color: '#fff',
    },
    summaryCard: {
      backgroundColor: colors.cardBackground,
      marginHorizontal: 20,
      marginTop: 10,
      marginBottom: 20,
      borderRadius: 12,
      padding: 20,
      elevation: 3,
    },
    summaryTitle: {
      fontSize: 14,
      color: colors.textSecondary,
      marginBottom: 8,
    },
    summaryAmount: {
      fontSize: 32,
      fontWeight: 'bold',
      color: colors.expense,
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
    },
    chartTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      color: colors.text,
    },
    chartSelector: {
      flexDirection: 'row',
      backgroundColor: colors.border,
      borderRadius: 8,
      padding: 3,
    },
    chartTypeButton: {
      paddingVertical: 6,
      paddingHorizontal: 12,
      borderRadius: 6,
    },
    chartTypeButtonActive: {
      backgroundColor: colors.primary,
    },
    chartTypeText: {
      fontSize: 12,
      fontWeight: '600',
      color: colors.textSecondary,
    },
    chartTypeTextActive: {
      color: '#fff',
    },
    categoryList: {
      backgroundColor: colors.cardBackground,
      marginHorizontal: 20,
      marginBottom: 20,
      borderRadius: 12,
      padding: 16,
      elevation: 3,
    },
    categoryItem: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    categoryIcon: {
      fontSize: 28,
      marginRight: 12,
    },
    categoryInfo: {
      flex: 1,
    },
    categoryName: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 4,
    },
    categoryPercentage: {
      fontSize: 12,
      color: colors.textSecondary,
    },
    categoryAmount: {
      fontSize: 18,
      fontWeight: 'bold',
      color: colors.expense,
    },
    emptyState: {
      alignItems: 'center',
      paddingVertical: 60,
      paddingHorizontal: 40,
    },
    emptyText: {
      fontSize: 18,
      fontWeight: '600',
      color: colors.text,
      marginTop: 16,
      marginBottom: 8,
    },
    emptySubtext: {
      fontSize: 14,
      color: colors.textSecondary,
      textAlign: 'center',
    },
  });

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  const categoryBreakdown = calculateCategoryBreakdown();
  const monthlyTrend = calculateMonthlyTrend();
  const topCategories = getTopCategories();
  const totalExpenses = getTotalExpenses();

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
          <Text style={styles.headerTitle}>📊 Expense Breakdown</Text>
        </View>
        <Text style={styles.headerSubtitle}>
          Analyze your spending patterns and categories
        </Text>
      </View>

      {/* Period Selector */}
      <View style={styles.periodSelector}>
        <TouchableOpacity
          style={[styles.periodButton, selectedPeriod === 'week' && styles.periodButtonActive]}
          onPress={() => setSelectedPeriod('week')}
        >
          <Text style={[styles.periodButtonText, selectedPeriod === 'week' && styles.periodButtonTextActive]}>
            Week
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.periodButton, selectedPeriod === 'month' && styles.periodButtonActive]}
          onPress={() => setSelectedPeriod('month')}
        >
          <Text style={[styles.periodButtonText, selectedPeriod === 'month' && styles.periodButtonTextActive]}>
            Month
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.periodButton, selectedPeriod === 'year' && styles.periodButtonActive]}
          onPress={() => setSelectedPeriod('year')}
        >
          <Text style={[styles.periodButtonText, selectedPeriod === 'year' && styles.periodButtonTextActive]}>
            Year
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.periodButton, selectedPeriod === 'all' && styles.periodButtonActive]}
          onPress={() => setSelectedPeriod('all')}
        >
          <Text style={[styles.periodButtonText, selectedPeriod === 'all' && styles.periodButtonTextActive]}>
            All Time
          </Text>
        </TouchableOpacity>
      </View>

      {/* Total Expenses Summary */}
      <View style={styles.summaryCard}>
        <Text style={styles.summaryTitle}>Total Expenses</Text>
        <Text style={styles.summaryAmount}>${totalExpenses.toFixed(2)}</Text>
        <Text style={styles.headerSubtitle}>
          {selectedPeriod === 'week'
            ? 'Last 7 days'
            : selectedPeriod === 'month'
            ? 'Last 30 days'
            : selectedPeriod === 'year'
            ? 'Last 365 days'
            : 'All time'}
        </Text>
      </View>

      {categoryBreakdown.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="pie-chart-outline" size={64} color={colors.textSecondary} />
          <Text style={styles.emptyText}>No expenses yet</Text>
          <Text style={styles.emptySubtext}>Start tracking your expenses to see breakdowns</Text>
        </View>
      ) : (
        <>
          {/* Chart Visualization */}
          <View style={styles.chartCard}>
            <View style={styles.chartHeader}>
              <Text style={styles.chartTitle}>Visualization</Text>
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
                  style={[styles.chartTypeButton, selectedChartType === 'bar' && styles.chartTypeButtonActive]}
                  onPress={() => setSelectedChartType('bar')}
                >
                  <Text style={[styles.chartTypeText, selectedChartType === 'bar' && styles.chartTypeTextActive]}>
                    Bar
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.chartTypeButton, selectedChartType === 'line' && styles.chartTypeButtonActive]}
                  onPress={() => setSelectedChartType('line')}
                >
                  <Text style={[styles.chartTypeText, selectedChartType === 'line' && styles.chartTypeTextActive]}>
                    Trend
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {selectedChartType === 'pie' && (
              <PieChart
                data={categoryBreakdown}
                width={screenWidth - 72}
                height={220}
                chartConfig={{
                  backgroundGradientFrom: colors.cardBackground,
                  backgroundGradientTo: colors.cardBackground,
                  color: (opacity = 1) => colors.text + Math.round(opacity * 255).toString(16),
                }}
                accessor="amount"
                backgroundColor="transparent"
                paddingLeft="15"
                hasLegend={true}
              />
            )}

            {selectedChartType === 'bar' && categoryBreakdown.length > 0 && (
              <BarChart
                data={{
                  labels: categoryBreakdown.slice(0, 5).map((c) => c.name.substring(0, 8)),
                  datasets: [{ data: categoryBreakdown.slice(0, 5).map((c) => c.amount) }],
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
                  color: (opacity = 1) => colors.primary,
                  labelColor: (opacity = 1) => colors.text,
                }}
                style={{ borderRadius: 16 }}
                fromZero
              />
            )}

            {selectedChartType === 'line' && monthlyTrend.data.length > 0 && (
              <LineChart
                data={{
                  labels: monthlyTrend.labels,
                  datasets: [{ data: monthlyTrend.data }],
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
                  color: (opacity = 1) => colors.primary,
                  labelColor: (opacity = 1) => colors.text,
                }}
                bezier
                style={{ borderRadius: 16 }}
              />
            )}
          </View>

          {/* Category Details */}
          <View style={styles.categoryList}>
            <Text style={[styles.chartTitle, { marginBottom: 16 }]}>Top Categories</Text>
            {topCategories.map((category, index) => (
              <View key={index} style={styles.categoryItem}>
                <Text style={styles.categoryIcon}>{getIconForCategory(category.name)}</Text>
                <View style={styles.categoryInfo}>
                  <Text style={styles.categoryName}>{category.name}</Text>
                  <Text style={styles.categoryPercentage}>
                    {category.percentage.toFixed(1)}% of total
                  </Text>
                </View>
                <Text style={styles.categoryAmount}>${category.amount.toFixed(2)}</Text>
              </View>
            ))}
          </View>
        </>
      )}
    </ScrollView>
  );
}


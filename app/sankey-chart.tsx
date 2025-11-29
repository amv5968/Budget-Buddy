import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import SankeyChart from '../components/SankeyChart';
import { useTheme } from '../context/ThemeContext';
import { getTransactions, Transaction } from './services/transactionService';

const screenWidth = Dimensions.get('window').width;
const screenHeight = Dimensions.get('window').height;

export default function SankeyChartScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const params = useLocalSearchParams();
  const period = (params.period as 'week' | 'month' | 'year' | 'all') || 'month';

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

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
    }
  };

  const getFilteredTransactions = () => {
    const now = new Date();
    return transactions.filter((t) => {
      if (t.type !== 'Expense') return false;
      const transDate = new Date(t.date);
      const diffTime = now.getTime() - transDate.getTime();
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

      switch (period) {
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

  const calculateSankeyData = () => {
    const breakdown = calculateCategoryBreakdown();
    const totalExpense = getFilteredTransactions().reduce((sum, t) => sum + Math.abs(t.amount), 0);
    const pieColors = ['#4CAF50', '#2196F3', '#FF9800', '#E91E63', '#9C27B0', '#FFC107', '#00BCD4', '#795548', '#607D8B'];

    // Limit to top 10 categories for better visualization
    const topCategories = breakdown.slice(0, 10);

    const nodes = [
      {
        id: 'total',
        label: 'Total Expenses',
        value: totalExpense,
        color: '#2196F3',
      },
      ...topCategories.map((cat, index) => ({
        id: cat.name,
        label: cat.name,
        value: cat.amount,
        color: pieColors[index % pieColors.length],
      })),
    ];

    const links = topCategories.map((cat, index) => ({
      source: 0,
      target: index + 1,
      value: cat.amount,
      color: pieColors[index % pieColors.length],
    }));

    return { nodes, links };
  };

  const getTotalExpenses = () => {
    return getFilteredTransactions().reduce((sum, t) => sum + Math.abs(t.amount), 0);
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
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
    summaryCard: {
      backgroundColor: colors.cardBackground,
      marginHorizontal: 20,
      marginTop: 20,
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
    chartContainer: {
      backgroundColor: colors.cardBackground,
      marginHorizontal: 20,
      marginBottom: 20,
      borderRadius: 12,
      padding: 20,
      elevation: 3,
      minHeight: screenHeight * 0.6,
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
  const sankeyData = calculateSankeyData();
  const totalExpenses = getTotalExpenses();

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>📊 Sankey Flow Chart</Text>
        </View>
        <Text style={styles.headerSubtitle}>
          Visualize expense flow from total to categories
        </Text>
      </View>

      {/* Total Expenses Summary */}
      <View style={styles.summaryCard}>
        <Text style={styles.summaryTitle}>Total Expenses</Text>
        <Text style={styles.summaryAmount}>${totalExpenses.toFixed(2)}</Text>
        <Text style={styles.headerSubtitle}>
          {period === 'week'
            ? 'Last 7 days'
            : period === 'month'
            ? 'Last 30 days'
            : period === 'year'
            ? 'Last 365 days'
            : 'All time'}
        </Text>
      </View>

      {categoryBreakdown.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="pie-chart-outline" size={64} color={colors.textSecondary} />
          <Text style={styles.emptyText}>No expenses yet</Text>
          <Text style={styles.emptySubtext}>Start tracking your expenses to see the flow chart</Text>
        </View>
      ) : (
        <View style={styles.chartContainer}>
          <SankeyChart
            nodes={sankeyData.nodes}
            links={sankeyData.links}
            width={screenWidth - 80}
            height={screenHeight * 0.65}
            colors={colors}
          />
        </View>
      )}
    </ScrollView>
  );
}


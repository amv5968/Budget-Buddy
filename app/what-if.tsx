import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { getTransactions, Transaction } from './services/transactionService';

const screenWidth = Dimensions.get('window').width;

// High-yield savings account rate (APY) - typically 4-5% annually
const HIGH_YIELD_SAVINGS_RATE = 0.045; // 4.5% APY

interface WhatIfScenario {
  id: string;
  category: string;
  monthlyAmount: number;
  description: string;
}

export default function WhatIfScreen() {
  const { colors } = useTheme();
  const router = useRouter();

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [scenarios, setScenarios] = useState<WhatIfScenario[]>([]);
  const [newCategory, setNewCategory] = useState('');
  const [newAmount, setNewAmount] = useState('');
  const [newDescription, setNewDescription] = useState('');

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

  const getExpenseCategories = () => {
    const expenseTransactions = transactions.filter((t) => t.type === 'Expense');
    const categories: { [key: string]: number } = {};

    expenseTransactions.forEach((t) => {
      const amount = Math.abs(t.amount);
      if (categories[t.category]) {
        categories[t.category] += amount;
      } else {
        categories[t.category] = amount;
      }
    });

    return Object.entries(categories)
      .map(([name, total]) => ({
        name,
        total,
        monthlyAverage: total / 12, // Rough estimate
      }))
      .sort((a, b) => b.total - a.total);
  };

  const addScenario = () => {
    if (!newCategory.trim() || !newAmount.trim()) {
      Alert.alert('Missing Information', 'Please enter a category and amount.');
      return;
    }

    const amount = parseFloat(newAmount);
    if (isNaN(amount) || amount <= 0) {
      Alert.alert('Invalid Amount', 'Please enter a valid positive number.');
      return;
    }

    const scenario: WhatIfScenario = {
      id: Date.now().toString(),
      category: newCategory.trim(),
      monthlyAmount: amount,
      description: newDescription.trim() || `Reduce spending on ${newCategory.trim()}`,
    };

    setScenarios([...scenarios, scenario]);
    setNewCategory('');
    setNewAmount('');
    setNewDescription('');
  };

  const removeScenario = (id: string) => {
    setScenarios(scenarios.filter((s) => s.id !== id));
  };

  const calculateSavings = () => {
    const totalMonthlySavings = scenarios.reduce((sum, s) => sum + s.monthlyAmount, 0);
    return totalMonthlySavings;
  };

  const calculateInvestmentReturns = (years: number) => {
    const monthlySavings = calculateSavings();
    const annualSavings = monthlySavings * 12;
    
    // More accurate compound interest calculation with monthly contributions
    // Future Value = PMT * [((1 + r/12)^(12*n) - 1) / (r/12)]
    // Where PMT = monthly payment, r = annual rate, n = years
    const monthlyRate = HIGH_YIELD_SAVINGS_RATE / 12;
    const totalMonths = years * 12;
    
    // Future value of annuity formula
    const futureValue = monthlySavings * ((Math.pow(1 + monthlyRate, totalMonths) - 1) / monthlyRate);
    
    const totalInvested = monthlySavings * totalMonths;
    const interestEarned = futureValue - totalInvested;
    
    return {
      totalInvested,
      totalValue: futureValue,
      interestEarned,
    };
  };

  const categories = getExpenseCategories();
  const totalMonthlySavings = calculateSavings();
  const oneYearReturns = calculateInvestmentReturns(1);
  const fiveYearReturns = calculateInvestmentReturns(5);
  const tenYearReturns = calculateInvestmentReturns(10);

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
    card: {
      backgroundColor: colors.cardBackground,
      marginHorizontal: 20,
      marginTop: 20,
      borderRadius: 12,
      padding: 20,
      elevation: 3,
    },
    cardTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      color: colors.text,
      marginBottom: 15,
    },
    inputContainer: {
      marginBottom: 15,
    },
    label: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 8,
    },
    input: {
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 10,
      padding: 12,
      fontSize: 16,
      color: colors.text,
      backgroundColor: colors.background,
    },
    addButton: {
      backgroundColor: colors.primary,
      paddingVertical: 14,
      borderRadius: 10,
      alignItems: 'center',
      marginTop: 10,
    },
    addButtonText: {
      color: '#fff',
      fontSize: 16,
      fontWeight: 'bold',
    },
    scenarioItem: {
      backgroundColor: colors.background,
      borderRadius: 10,
      padding: 15,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: colors.border,
    },
    scenarioHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 8,
    },
    scenarioCategory: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.text,
      flex: 1,
    },
    deleteButton: {
      padding: 4,
    },
    scenarioAmount: {
      fontSize: 18,
      fontWeight: 'bold',
      color: colors.expense,
      marginBottom: 4,
    },
    scenarioDescription: {
      fontSize: 13,
      color: colors.textSecondary,
    },
    resultsCard: {
      backgroundColor: colors.primary + '15',
      borderRadius: 12,
      padding: 20,
      marginTop: 10,
      borderWidth: 2,
      borderColor: colors.primary,
    },
    resultsTitle: {
      fontSize: 20,
      fontWeight: 'bold',
      color: colors.text,
      marginBottom: 15,
      textAlign: 'center',
    },
    savingsRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: 12,
      paddingBottom: 12,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    savingsLabel: {
      fontSize: 15,
      color: colors.textSecondary,
    },
    savingsValue: {
      fontSize: 18,
      fontWeight: 'bold',
      color: colors.text,
    },
    returnsSection: {
      marginTop: 15,
    },
    returnsTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 10,
    },
    returnsRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: 8,
    },
    returnsLabel: {
      fontSize: 14,
      color: colors.textSecondary,
    },
    returnsValue: {
      fontSize: 15,
      fontWeight: '600',
      color: colors.success || colors.primary,
    },
    emptyState: {
      alignItems: 'center',
      paddingVertical: 40,
    },
    emptyText: {
      fontSize: 16,
      color: colors.textSecondary,
      textAlign: 'center',
      marginTop: 10,
    },
    categorySuggestion: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 10,
      backgroundColor: colors.background,
      borderRadius: 8,
      marginBottom: 8,
    },
    categorySuggestionText: {
      fontSize: 14,
      color: colors.text,
      flex: 1,
    },
    categorySuggestionAmount: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.expense,
      marginLeft: 10,
    },
  });

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>💡 What If Calculator</Text>
        </View>
        <Text style={styles.headerSubtitle}>
          See how much you could save by reducing non-essential expenses
        </Text>
      </View>

      {/* Add Scenario Card */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Add Expense Reduction</Text>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Category</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g., Smoking, Fast Food, Entertainment"
            placeholderTextColor={colors.textSecondary}
            value={newCategory}
            onChangeText={setNewCategory}
          />
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Monthly Amount ($)</Text>
          <TextInput
            style={styles.input}
            placeholder="50"
            placeholderTextColor={colors.textSecondary}
            value={newAmount}
            onChangeText={setNewAmount}
            keyboardType="numeric"
          />
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Description (Optional)</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g., Stop smoking, reduce takeout"
            placeholderTextColor={colors.textSecondary}
            value={newDescription}
            onChangeText={setNewDescription}
          />
        </View>

        <TouchableOpacity style={styles.addButton} onPress={addScenario}>
          <Text style={styles.addButtonText}>+ Add Scenario</Text>
        </TouchableOpacity>
      </View>

      {/* Category Suggestions */}
      {categories.length > 0 && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>💡 Suggestions from Your Expenses</Text>
          {categories.slice(0, 5).map((cat, index) => (
            <TouchableOpacity
              key={index}
              style={styles.categorySuggestion}
              onPress={() => {
                setNewCategory(cat.name);
                setNewAmount(cat.monthlyAverage.toFixed(0));
              }}
            >
              <Text style={styles.categorySuggestionText}>{cat.name}</Text>
              <Text style={styles.categorySuggestionAmount}>
                ~${cat.monthlyAverage.toFixed(0)}/month
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Scenarios List */}
      {scenarios.length > 0 && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Your Scenarios</Text>
          {scenarios.map((scenario) => (
            <View key={scenario.id} style={styles.scenarioItem}>
              <View style={styles.scenarioHeader}>
                <Text style={styles.scenarioCategory}>{scenario.category}</Text>
                <TouchableOpacity
                  style={styles.deleteButton}
                  onPress={() => removeScenario(scenario.id)}
                >
                  <Ionicons name="close-circle" size={24} color={colors.danger} />
                </TouchableOpacity>
              </View>
              <Text style={styles.scenarioAmount}>${scenario.monthlyAmount.toFixed(2)}/month</Text>
              <Text style={styles.scenarioDescription}>{scenario.description}</Text>
            </View>
          ))}
        </View>
      )}

      {/* Results Card */}
      {scenarios.length > 0 && (
        <View style={styles.resultsCard}>
          <Text style={styles.resultsTitle}>💰 Investment Potential</Text>

          <View style={styles.savingsRow}>
            <Text style={styles.savingsLabel}>Monthly Savings:</Text>
            <Text style={styles.savingsValue}>${totalMonthlySavings.toFixed(2)}</Text>
          </View>

          <View style={styles.savingsRow}>
            <Text style={styles.savingsLabel}>Annual Savings:</Text>
            <Text style={styles.savingsValue}>${(totalMonthlySavings * 12).toFixed(2)}</Text>
          </View>

          <View style={styles.savingsRow}>
            <Text style={styles.savingsLabel}>High-Yield Rate:</Text>
            <Text style={styles.savingsValue}>{(HIGH_YIELD_SAVINGS_RATE * 100).toFixed(1)}% APY</Text>
          </View>

          {/* 1 Year Returns */}
          <View style={styles.returnsSection}>
            <Text style={styles.returnsTitle}>📈 After 1 Year:</Text>
            <View style={styles.returnsRow}>
              <Text style={styles.returnsLabel}>Total Invested:</Text>
              <Text style={styles.returnsValue}>${oneYearReturns.totalInvested.toFixed(2)}</Text>
            </View>
            <View style={styles.returnsRow}>
              <Text style={styles.returnsLabel}>Interest Earned:</Text>
              <Text style={styles.returnsValue}>${oneYearReturns.interestEarned.toFixed(2)}</Text>
            </View>
            <View style={styles.returnsRow}>
              <Text style={styles.returnsLabel}>Total Value:</Text>
              <Text style={styles.returnsValue}>${oneYearReturns.totalValue.toFixed(2)}</Text>
            </View>
          </View>

          {/* 5 Year Returns */}
          <View style={styles.returnsSection}>
            <Text style={styles.returnsTitle}>📈 After 5 Years:</Text>
            <View style={styles.returnsRow}>
              <Text style={styles.returnsLabel}>Total Invested:</Text>
              <Text style={styles.returnsValue}>${fiveYearReturns.totalInvested.toFixed(2)}</Text>
            </View>
            <View style={styles.returnsRow}>
              <Text style={styles.returnsLabel}>Interest Earned:</Text>
              <Text style={styles.returnsValue}>${fiveYearReturns.interestEarned.toFixed(2)}</Text>
            </View>
            <View style={styles.returnsRow}>
              <Text style={styles.returnsLabel}>Total Value:</Text>
              <Text style={styles.returnsValue}>${fiveYearReturns.totalValue.toFixed(2)}</Text>
            </View>
          </View>

          {/* 10 Year Returns */}
          <View style={styles.returnsSection}>
            <Text style={styles.returnsTitle}>📈 After 10 Years:</Text>
            <View style={styles.returnsRow}>
              <Text style={styles.returnsLabel}>Total Invested:</Text>
              <Text style={styles.returnsValue}>${tenYearReturns.totalInvested.toFixed(2)}</Text>
            </View>
            <View style={styles.returnsRow}>
              <Text style={styles.returnsLabel}>Interest Earned:</Text>
              <Text style={styles.returnsValue}>${tenYearReturns.interestEarned.toFixed(2)}</Text>
            </View>
            <View style={styles.returnsRow}>
              <Text style={styles.returnsLabel}>Total Value:</Text>
              <Text style={styles.returnsValue}>${tenYearReturns.totalValue.toFixed(2)}</Text>
            </View>
          </View>
        </View>
      )}

      {scenarios.length === 0 && (
        <View style={styles.emptyState}>
          <Ionicons name="calculator-outline" size={64} color={colors.textSecondary} />
          <Text style={styles.emptyText}>
            Add scenarios above to see your potential savings and investment returns!
          </Text>
        </View>
      )}
    </ScrollView>
  );
}


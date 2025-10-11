import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';

export default function BudgetScreen() {
  const [budgets] = useState([
    { id: 1, category: 'Food', icon: '🍔', spent: 130, total: 200, percentage: 65 },
    { id: 2, category: 'Rent', icon: '🏠', spent: 800, total: 800, percentage: 100 },
    { id: 3, category: 'Tuition', icon: '🎓', spent: 500, total: 1000, percentage: 50 },
    { id: 4, category: 'Transport', icon: '🚗', spent: 60, total: 200, percentage: 30 },
  ]);

  const totalBudget = budgets.reduce((sum, b) => sum + b.total, 0);
  const totalSpent = budgets.reduce((sum, b) => sum + b.spent, 0);
  const remaining = totalBudget - totalSpent;

  const getProgressColor = (percentage: number) => {
    if (percentage >= 100) return '#F44336';
    if (percentage >= 80) return '#FF9800';
    if (percentage >= 50) return '#FFC107';
    return '#4CAF50';
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.header}>Budgets</Text>

      {/* Summary Card */}
      <View style={styles.summaryCard}>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Total Budget</Text>
          <Text style={styles.summaryValue}>${totalBudget}</Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Spent</Text>
          <Text style={[styles.summaryValue, { color: '#F44336' }]}>
            ${totalSpent}
          </Text>
        </View>
        <View style={[styles.summaryRow, styles.summaryRowLast]}>
          <Text style={[styles.summaryLabel, { fontWeight: 'bold' }]}>
            Remaining
          </Text>
          <Text style={[styles.summaryValue, { color: '#4CAF50', fontWeight: 'bold' }]}>
            ${remaining}
          </Text>
        </View>
      </View>

      {/* Budget Items */}
      <View style={styles.budgetList}>
        {budgets.map((budget) => (
          <View key={budget.id} style={styles.budgetCard}>
            <View style={styles.budgetHeader}>
              <View style={styles.budgetTitleRow}>
                <Text style={styles.budgetIcon}>{budget.icon}</Text>
                <Text style={styles.budgetCategory}>{budget.category}</Text>
              </View>
              <Text style={styles.budgetPercentage}>{budget.percentage}%</Text>
            </View>

            {/* Progress Bar */}
            <View style={styles.progressBarContainer}>
              <View
                style={[
                  styles.progressBar,
                  {
                    width: `${Math.min(budget.percentage, 100)}%`,
                    backgroundColor: getProgressColor(budget.percentage),
                  },
                ]}
              />
            </View>

            <View style={styles.budgetFooter}>
              <Text style={styles.budgetSpent}>
                ${budget.spent} spent
              </Text>
              <Text style={styles.budgetTotal}>of ${budget.total}</Text>
            </View>
          </View>
        ))}
      </View>

      {/* Edit Button */}
      <TouchableOpacity style={styles.editButton}>
        <Text style={styles.editButtonText}>Edit Budget</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    fontSize: 28,
    fontWeight: 'bold',
    padding: 20,
    paddingTop: 60,
    backgroundColor: 'white',
    marginBottom: 20,
  },
  summaryCard: {
    backgroundColor: 'white',
    marginHorizontal: 20,
    padding: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
    marginBottom: 20,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  summaryRowLast: {
    borderBottomWidth: 0,
    paddingBottom: 0,
  },
  summaryLabel: {
    fontSize: 16,
    color: '#666',
  },
  summaryValue: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  budgetList: {
    paddingHorizontal: 20,
  },
  budgetCard: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 12,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  budgetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  budgetTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  budgetIcon: {
    fontSize: 24,
    marginRight: 10,
  },
  budgetCategory: {
    fontSize: 18,
    fontWeight: '600',
  },
  budgetPercentage: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#666',
  },
  progressBarContainer: {
    height: 8,
    backgroundColor: '#f0f0f0',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 12,
  },
  progressBar: {
    height: '100%',
    borderRadius: 4,
  },
  budgetFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  budgetSpent: {
    fontSize: 14,
    color: '#666',
  },
  budgetTotal: {
    fontSize: 14,
    color: '#999',
  },
  editButton: {
    backgroundColor: '#66BB6A',
    margin: 20,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 10,
  },
  editButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
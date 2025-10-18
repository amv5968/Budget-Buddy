import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { getBudgets, type Budget } from '../services/budgetService';

export default function BudgetsScreen() {
  const router = useRouter();
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useFocusEffect(
    useCallback(() => {
      loadBudgets();
    }, [])
  );

  const loadBudgets = async () => {
    try {
      const data = await getBudgets();
      setBudgets(data);
    } catch (error) {
      console.error('Error loading budgets:', error);
      Alert.alert('Error', 'Failed to load budgets');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadBudgets();
  };

  const getProgressPercentage = (spent: number, total: number) => {
    return Math.min((spent / total) * 100, 100);
  };

  const getProgressColor = (percentage: number) => {
    if (percentage >= 90) return '#F44336';
    if (percentage >= 70) return '#FF9800';
    return '#4CAF50';
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color="#66BB6A" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Budgets</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => router.push('//add-budget')}
        >
          <Text style={styles.addButtonText}>+ Add</Text>
        </TouchableOpacity>
      </View>

      {budgets.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>💰</Text>
          <Text style={styles.emptyText}>No budgets yet</Text>
          <Text style={styles.emptySubtext}>Create a budget to track your spending!</Text>
          <TouchableOpacity
            style={styles.emptyButton}
            onPress={() => router.push('//add-budget')}
          >
            <Text style={styles.emptyButtonText}>Create Budget</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={budgets}
          keyExtractor={(item) => item._id}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          renderItem={({ item }) => {
            const percentage = getProgressPercentage(item.spentAmount, item.totalAmount);
            const progressColor = getProgressColor(percentage);

            return (
              <TouchableOpacity
                style={styles.budgetCard}
                onPress={() => router.push(`//edit-budget?id=${item._id}`)}
              >
                <View style={styles.budgetHeader}>
                  <View style={styles.budgetInfo}>
                    <Text style={styles.budgetIcon}>{item.icon || '💵'}</Text>
                    <View>
                      <Text style={styles.budgetCategory}>{item.category}</Text>
                      <Text style={styles.budgetAmount}>
                        ${item.spentAmount.toFixed(2)} / ${item.totalAmount.toFixed(2)}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.budgetPercentage}>
                    <Text style={[styles.percentageText, { color: progressColor }]}>
                      {percentage.toFixed(0)}%
                    </Text>
                  </View>
                </View>

                <View style={styles.progressBarContainer}>
                  <View
                    style={[
                      styles.progressBar,
                      {
                        width: `${percentage}%`,
                        backgroundColor: progressColor,
                      },
                    ]}
                  />
                </View>

                <Text style={styles.remainingText}>
                  ${(item.totalAmount - item.spentAmount).toFixed(2)} remaining
                </Text>
              </TouchableOpacity>
            );
          }}
          contentContainerStyle={styles.listContent}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    backgroundColor: 'white',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  addButton: {
    backgroundColor: '#66BB6A',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  addButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 14,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
  },
  emptyButton: {
    backgroundColor: '#66BB6A',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  emptyButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  listContent: {
    padding: 20,
  },
  budgetCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  budgetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  budgetInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  budgetIcon: {
    fontSize: 32,
    marginRight: 12,
  },
  budgetCategory: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  budgetAmount: {
    fontSize: 14,
    color: '#666',
  },
  budgetPercentage: {
    alignItems: 'flex-end',
  },
  percentageText: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  progressBarContainer: {
    height: 8,
    backgroundColor: '#E0E0E0',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressBar: {
    height: '100%',
    borderRadius: 4,
  },
  remainingText: {
    fontSize: 12,
    color: '#666',
    textAlign: 'right',
  },
});
import React, { useEffect, useState } from 'react';
import {
  FlatList,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { getTransactions } from '../services/transactionService';

export default function TransactionsScreen() {
  const [filter, setFilter] = useState<'All' | 'Income' | 'Expense' | 'Food' | 'Rent'>('All');
const [transactions, setTransactions] = useState<any[]>([]);
const [loading, setLoading] = useState(true);
const [error, setError] = useState<string | null>(null);

useEffect(() => {
  (async () => {
    try {
      setLoading(true);
      const data = await getTransactions(); // GET /transactions
      setTransactions(data || []);
      setError(null);
    } catch (e: any) {
      console.error('Failed to load transactions', e?.message || e);
      setError('Could not load transactions.');
    } finally {
      setLoading(false);
    }
  })();
}, []);

  const filterButtons = ['All', 'Income', 'Expense', 'Food', 'Rent'] as const;

  const filteredTransactions = transactions.filter(t => {
    if (filter === 'All') return true;
    if (filter === 'Income' || filter === 'Expense') return t.type === filter;
    return t.category === filter;
  });

  const totalIncome = transactions
    .filter(t => t.type === 'Income')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalExpense = Math.abs(
    transactions
      .filter(t => t.type === 'Expense')
      .reduce((sum, t) => sum + t.amount, 0)
  );

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Transactions</Text>

      {/* Filter Buttons */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filterContainer}
      >
        {filterButtons.map((btn) => (
          <TouchableOpacity
            key={btn}
            style={[
              styles.filterButton,
              filter === btn && styles.filterButtonActive,
            ]}
            onPress={() => setFilter(btn)}
          >
            <Text
              style={[
                styles.filterText,
                filter === btn && styles.filterTextActive,
              ]}
            >
              {btn}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Transaction List */}
      <FlatList
        data={filteredTransactions}
        keyExtractor={(item, index) => (item._id ? String(item._id) : String(index))}
        contentContainerStyle={styles.listContainer}
        renderItem={({ item }) => (
          <View style={styles.transactionCard}>
            <View style={styles.iconContainer}>
              <Text style={styles.icon}>{item.type === 'Income' ? '💰' : '💸'}</Text>
            </View>
            <View style={styles.transactionInfo}>
              <Text style={styles.transactionName}>{item.description || item.category}</Text>
              <Text style={styles.transactionCategory}>{item.category}</Text>
            </View>
            <View style={styles.transactionRight}>
              <Text
                style={[
                  styles.transactionAmount,
                  { color: item.type === 'Income' ? '#4CAF50' : '#F44336' },
                ]}
              >
                {item.type === 'Income' ? '+' : ''}${Math.abs(item.amount).toFixed(2)}
              </Text>
              <Text style={styles.transactionDate}>
                {item.date ? new Date(item.date).toLocaleDateString()
                : item.createdAt ? new Date(item.createdAt).toLocaleDateString()
                : ''}
</Text>

            </View>
          </View>
        )}
      />

      {/* Summary Footer */}
      <View style={styles.summaryFooter}>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryValue}>${totalIncome.toFixed(0)}</Text>
          <Text style={styles.summaryLabel}>Income</Text>
        </View>
        <View style={styles.summaryDivider} />
        <View style={styles.summaryItem}>
          <Text style={[styles.summaryValue, { color: '#F44336' }]}>
            ${totalExpense.toFixed(0)}
          </Text>
          <Text style={styles.summaryLabel}>Expenses</Text>
        </View>
      </View>

      {/* Edit Button */}
      <TouchableOpacity style={styles.editButton}>
        <Text style={styles.editButtonText}>Edit Transactions</Text>
      </TouchableOpacity>
    </View>
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
  },
  filterContainer: {
    backgroundColor: 'white',
    paddingHorizontal: 20,
    paddingBottom: 15,
    maxHeight: 50,
  },
  filterButton: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
    marginRight: 10,
  },
  filterButtonActive: {
    backgroundColor: '#2196F3',
  },
  filterText: {
    color: '#666',
    fontWeight: '600',
  },
  filterTextActive: {
    color: 'white',
  },
  listContainer: {
    padding: 20,
  },
  transactionCard: {
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 12,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  iconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  icon: {
    fontSize: 24,
  },
  transactionInfo: {
    flex: 1,
  },
  transactionName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  transactionCategory: {
    fontSize: 13,
    color: '#666',
  },
  transactionRight: {
    alignItems: 'flex-end',
  },
  transactionAmount: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  transactionDate: {
    fontSize: 12,
    color: '#999',
  },
  summaryFooter: {
    backgroundColor: 'white',
    flexDirection: 'row',
    paddingVertical: 20,
    paddingHorizontal: 40,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  summaryItem: {
    flex: 1,
    alignItems: 'center',
  },
  summaryValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#4CAF50',
    marginBottom: 4,
  },
  summaryLabel: {
    fontSize: 14,
    color: '#666',
  },
  summaryDivider: {
    width: 1,
    backgroundColor: '#eee',
    marginHorizontal: 20,
  },
  editButton: {
    backgroundColor: '#66BB6A',
    margin: 20,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  editButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
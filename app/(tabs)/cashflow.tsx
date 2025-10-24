import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { getTransactionStats } from '../services/transactionService';

export default function CashFlowScreen() {
  // Live stats from backend
  const [stats, setStats] = useState({
    totalIncome: 0,
    totalExpense: 0,
    balance: 0,
  });

  useEffect(() => {
    (async () => {
      try {
        const data = await getTransactionStats(); // calls /transactions/stats
        // guard against missing fields
        setStats({
          totalIncome: Number(data?.totalIncome || 0),
          totalExpense: Number(data?.totalExpense || 0),
          balance: Number(data?.balance || 0),
        });
      } catch (err) {
        console.error('Failed to fetch transaction stats:', err);
      }
    })();
  }, []);

  const { totalIncome, totalExpense, balance } = stats;

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Cash Flow Overview</Text>

      <View style={styles.card}>
        <Text style={styles.label}>Total Income</Text>
        <Text style={styles.value}>${totalIncome.toFixed(2)}</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.label}>Total Expenses</Text>
        <Text style={styles.value}>${totalExpense.toFixed(2)}</Text>
      </View>

      <View style={[styles.card, balance >= 0 ? styles.positive : styles.negative]}>
        <Text style={styles.label}>Net Balance</Text>
        <Text style={styles.value}>${balance.toFixed(2)}</Text>
      </View>

      {/* Placeholder chart area */}
      <View style={styles.chartPlaceholder}>
        <Text style={styles.chartText}>[Chart visualization coming soon]</Text>
      </View>

      {/* Export disabled for now */}
      <TouchableOpacity style={[styles.button, styles.buttonDisabled]} activeOpacity={0.7} disabled>
        <Text style={styles.buttonText}>Export Report (coming soon)</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, gap: 12 },
  title: { fontSize: 22, fontWeight: '700', marginBottom: 10 },
  card: {
    padding: 14,
    borderRadius: 12,
    backgroundColor: '#fff',
    elevation: 1,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
  },
  label: { fontSize: 14, opacity: 0.7, marginBottom: 6 },
  value: { fontSize: 20, fontWeight: '700' },
  positive: { borderLeftWidth: 4, borderLeftColor: '#2e7d32' },
  negative: { borderLeftWidth: 4, borderLeftColor: '#c62828' },
  chartPlaceholder: {
    height: 180,
    borderRadius: 12,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: '#ccc',
    alignItems: 'center',
    justifyContent: 'center',
  },
  chartText: { opacity: 0.6 },
  button: {
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  buttonDisabled: { backgroundColor: '#c5c5c5' },
  buttonText: { color: '#fff', fontWeight: '600' },
});

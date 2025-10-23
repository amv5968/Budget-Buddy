import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import axios from 'axios';

interface Transaction {
  _id: string;
  type: 'income' | 'expense';
  amount: number;
  category: string;
  date: string;
}

const API_URL = 'http://10.0.2.2:3000/api/transactions'; // adjust for your backend

const CashFlowScreen: React.FC = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  const [totalIncome, setTotalIncome] = useState(0);
  const [totalExpenses, setTotalExpenses] = useState(0);
  const [netFlow, setNetFlow] = useState(0);

  useEffect(() => {
    fetchTransactions();
  }, []);

  const fetchTransactions = async () => {
    try {
      const res = await axios.get(API_URL, {
        headers: {
          Authorization: `Bearer YOUR_JWT_TOKEN_HERE`,
        },
      });

      setTransactions(res.data);

      const income = res.data
        .filter((t: Transaction) => t.type === 'income')
        .reduce((sum: number, t: Transaction) => sum + t.amount, 0);

      const expenses = res.data
        .filter((t: Transaction) => t.type === 'expense')
        .reduce((sum: number, t: Transaction) => sum + t.amount, 0);

      setTotalIncome(income);
      setTotalExpenses(expenses);
      setNetFlow(income - expenses);
    } catch (error) {
      console.error('Error fetching transactions:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Cash Flow Overview</Text>

      {loading ? (
        <ActivityIndicator size="large" color="#4CAF50" />
      ) : (
        <View style={styles.summaryContainer}>
          <View style={styles.card}>
            <Text style={styles.label}>Total Income</Text>
            <Text style={[styles.amount, { color: '#2E7D32' }]}>+${totalIncome.toFixed(2)}</Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.label}>Total Expenses</Text>
            <Text style={[styles.amount, { color: '#C62828' }]}>-${totalExpenses.toFixed(2)}</Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.label}>Net Cash Flow</Text>
            <Text
              style={[
                styles.amount,
                { color: netFlow >= 0 ? '#2E7D32' : '#C62828' },
              ]}
            >
              {netFlow >= 0 ? '+' : '-'}${Math.abs(netFlow).toFixed(2)}
            </Text>
          </View>
        </View>
      )}

      {!loading && (
        <View style={styles.chartContainer}>
          <Text style={styles.chartTitle}>💵 Cash Flow Chart</Text>
          <View style={styles.barContainer}>
            <View
              style={[
                styles.incomeBar,
                { width: `${(totalIncome / (totalIncome + totalExpenses || 1)) * 100}%` },
              ]}
            />
            <View
              style={[
                styles.expenseBar,
                { width: `${(totalExpenses / (totalIncome + totalExpenses || 1)) * 100}%` },
              ]}
            />
          </View>
          <Text style={styles.chartLegend}>Green = Income | Red = Expenses</Text>
        </View>
      )}
    </ScrollView>
  );
};

export default CashFlowScreen;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', padding: 20 },
  title: { fontSize: 24, fontWeight: '700', marginBottom: 20 },
  summaryContainer: { marginBottom: 20 },
  card: {
    backgroundColor: '#f4f4f4',
    padding: 16,
    borderRadius: 10,
    marginBottom: 10,
  },
  label: { fontSize: 16, color: '#555' },
  amount: { fontSize: 20, fontWeight: '700', marginTop: 4 },
  chartContainer: {
    marginTop: 20,
    backgroundColor: '#f9f9f9',
    borderRadius: 10,
    padding: 16,
  },
  chartTitle: { fontSize: 18, fontWeight: '600', marginBottom: 10 },
  barContainer: {
    flexDirection: 'row',
    height: 20,
    borderRadius: 10,
    overflow: 'hidden',
    backgroundColor: '#e0e0e0',
  },
  incomeBar: {
    backgroundColor: '#2E7D32',
    height: '100%',
  },
  expenseBar: {
    backgroundColor: '#C62828',
    height: '100%',
  },
  chartLegend: {
    textAlign: 'center',
    color: '#666',
    marginTop: 8,
    fontSize: 13,
  },
});

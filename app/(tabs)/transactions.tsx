import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { 
  getTransactions, 
  updateTransaction, 
  deleteTransaction, 
  type Transaction 
} from '../services/transactionService';

const INCOME_CATEGORIES = ['Salary', 'Freelance', 'Investment', 'Business', 'Other'];
const EXPENSE_CATEGORIES = [
  'Groceries',
  'Transport',
  'Food',
  'Entertainment',
  'Shopping',
  'Healthcare',
  'Education',
  'Utilities',
  'Rent',
  'Other',
];

export default function TransactionsScreen() {
  const [filter, setFilter] = useState('All');
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Transaction | null>(null);

  const [type, setType] = useState<'Income' | 'Expense'>('Expense');
  const [category, setCategory] = useState('');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    loadTransactions();
  }, []);

  const loadTransactions = async () => {
    try {
      const data = await getTransactions();
      setTransactions(data);
    } catch (error) {
      console.error('Error loading transactions:', error);
      Alert.alert('Error', 'Failed to load transactions');
    } finally {
      setLoading(false);
    }
  };

  const filterButtons = ['All', 'Income', 'Expense', 'Food', 'Rent'];

  const filteredTransactions = transactions.filter((t) => {
    if (filter === 'All') return true;
    if (filter === 'Income' || filter === 'Expense') return t.type === filter;
    return t.category === filter;
  });

  const totalIncome = transactions
    .filter((t) => t.type === 'Income')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalExpense = Math.abs(
    transactions
      .filter((t) => t.type === 'Expense')
      .reduce((sum, t) => sum + t.amount, 0)
  );

  const startEdit = (t: Transaction) => {
    setEditing(t);
    setType(t.type);
    setCategory(t.category);
    setAmount(t.amount.toString());
    setDescription(t.description || '');
  };

  const handleUpdate = async () => {
    if (!category) {
      Alert.alert('Error', 'Please select a category');
      return;
    }
    if (!amount || parseFloat(amount) <= 0) {
      Alert.alert('Error', 'Please enter a valid amount');
      return;
    }
    setSaving(true);
    try {
      await updateTransaction(editing!._id, {
        type,
        category,
        amount: parseFloat(amount),
        description: description.trim(),
        date: new Date().toISOString(),
      });
      Alert.alert('Success', 'Transaction updated successfully!');
      setEditing(null);
      loadTransactions();
    } catch (error) {
      console.error('Error updating transaction:', error);
      Alert.alert('Error', 'Failed to update transaction');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    Alert.alert(
      'Delete Transaction',
      'Are you sure you want to delete this transaction?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setDeleting(true);
            try {
              await deleteTransaction(editing!._id);
              Alert.alert('Deleted', 'Transaction deleted successfully!');
              setEditing(null);
              loadTransactions();
            } catch (error) {
              console.error('Error deleting transaction:', error);
              Alert.alert('Error', 'Failed to delete transaction');
            } finally {
              setDeleting(false);
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color="#66BB6A" />
      </View>
    );
  }

  // 🔹 If in edit mode
  if (editing) {
    const categories = type === 'Income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;
    return (
      <ScrollView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => setEditing(null)} style={styles.backButton}>
            <Text style={styles.backText}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Edit Transaction</Text>
        </View>

        <View style={styles.typeContainer}>
          <TouchableOpacity
            style={[styles.typeButton, type === 'Income' && styles.typeButtonActive]}
            onPress={() => {
              setType('Income');
              setCategory('');
            }}
          >
            <Text style={[styles.typeText, type === 'Income' && styles.typeTextActive]}>
              Income
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.typeButton, type === 'Expense' && styles.typeButtonActive]}
            onPress={() => {
              setType('Expense');
              setCategory('');
            }}
          >
            <Text style={[styles.typeText, type === 'Expense' && styles.typeTextActive]}>
              Expense
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Amount</Text>
          <TextInput
            style={styles.amountInput}
            placeholder="0.00"
            value={amount}
            onChangeText={setAmount}
            keyboardType="decimal-pad"
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Category</Text>
          <View style={styles.categoryGrid}>
            {categories.map((cat) => (
              <TouchableOpacity
                key={cat}
                style={[
                  styles.categoryButton,
                  category === cat && styles.categoryButtonActive,
                ]}
                onPress={() => setCategory(cat)}
              >
                <Text
                  style={[
                    styles.categoryText,
                    category === cat && styles.categoryTextActive,
                  ]}
                >
                  {cat}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Description</Text>
          <TextInput
            style={styles.descriptionInput}
            placeholder="Add a note..."
            value={description}
            onChangeText={setDescription}
            multiline
          />
        </View>

        <TouchableOpacity
          style={[styles.submitButton, saving && styles.disabledButton]}
          onPress={handleUpdate}
          disabled={saving || deleting}
        >
          {saving ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text style={styles.submitText}>Update Transaction</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.deleteButton, deleting && styles.disabledButton]}
          onPress={handleDelete}
          disabled={saving || deleting}
        >
          {deleting ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text style={styles.submitText}>Delete Transaction</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    );
  }

  // 🔹 Otherwise show list mode
  return (
    <View style={styles.container}>
      <Text style={styles.headerText}>Transactions</Text>

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

      <FlatList
        data={filteredTransactions}
        keyExtractor={(item) => item._id}
        contentContainerStyle={styles.listContainer}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.transactionCard}
            onPress={() => startEdit(item)}
          >
            <View style={styles.iconContainer}>
              <Text style={styles.icon}>💵</Text>
            </View>
            <View style={styles.transactionInfo}>
              <Text style={styles.transactionName}>{item.category}</Text>
              <Text style={styles.transactionCategory}>{item.description}</Text>
            </View>
            <View style={styles.transactionRight}>
              <Text
                style={[
                  styles.transactionAmount,
                  { color: item.type === 'Income' ? '#4CAF50' : '#F44336' },
                ]}
              >
                {item.type === 'Income' ? '+' : '-'}${Math.abs(item.amount).toFixed(2)}
              </Text>
              <Text style={styles.transactionDate}>
                {new Date(item.date).toLocaleDateString()}
              </Text>
            </View>
          </TouchableOpacity>
        )}
      />

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
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  center: { justifyContent: 'center', alignItems: 'center' },
  header: {
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 20,
    backgroundColor: 'white',
  },
  backButton: { marginBottom: 16 },
  backText: { fontSize: 16, color: '#2196F3', fontWeight: '600' },
  title: { fontSize: 26, fontWeight: 'bold', marginBottom: 20 },
  headerText: {
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
  filterButtonActive: { backgroundColor: '#2196F3' },
  filterText: { color: '#666', fontWeight: '600' },
  filterTextActive: { color: 'white' },
  listContainer: { padding: 20 },
  transactionCard: {
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 12,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
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
  icon: { fontSize: 24 },
  transactionInfo: { flex: 1 },
  transactionName: { fontSize: 16, fontWeight: '600', marginBottom: 4 },
  transactionCategory: { fontSize: 13, color: '#666' },
  transactionRight: { alignItems: 'flex-end' },
  transactionAmount: { fontSize: 18, fontWeight: 'bold', marginBottom: 2 },
  transactionDate: { fontSize: 12, color: '#999' },
  summaryFooter: {
    backgroundColor: 'white',
    flexDirection: 'row',
    paddingVertical: 20,
    paddingHorizontal: 40,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  summaryItem: { flex: 1, alignItems: 'center' },
  summaryValue: { fontSize: 24, fontWeight: 'bold', color: '#4CAF50' },
  summaryLabel: { fontSize: 14, color: '#666' },
  summaryDivider: { width: 1, backgroundColor: '#eee', marginHorizontal: 20 },
  typeContainer: { flexDirection: 'row', padding: 20, gap: 12 },
  typeButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: 'white',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#e0e0e0',
  },
  typeButtonActive: { backgroundColor: '#66BB6A', borderColor: '#66BB6A' },
  typeText: { fontSize: 16, fontWeight: '600', color: '#666' },
  typeTextActive: { color: 'white' },
  section: { paddingHorizontal: 20, marginBottom: 24 },
  label: { fontSize: 16, fontWeight: '600', color: '#333', marginBottom: 12 },
  amountInput: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 16,
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    color: '#333',
  },
  categoryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  categoryButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  categoryButtonActive: {
    backgroundColor: '#E3F2FD',
    borderColor: '#2196F3',
  },
  categoryText: { fontSize: 14, color: '#666', fontWeight: '500' },
  categoryTextActive: { color: '#2196F3', fontWeight: '600' },
  descriptionInput: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 16,
    fontSize: 16,
    color: '#333',
    textAlignVertical: 'top',
    minHeight: 100,
  },
  submitButton: {
    backgroundColor: '#66BB6A',
    marginHorizontal: 20,
    marginBottom: 12,
    padding: 18,
    borderRadius: 10,
    alignItems: 'center',
  },
  deleteButton: {
    backgroundColor: '#F44336',
    marginHorizontal: 20,
    marginBottom: 40,
    padding: 18,
    borderRadius: 10,
    alignItems: 'center',
  },
  submitText: { color: 'white', fontSize: 18, fontWeight: 'bold' },
  disabledButton: { opacity: 0.7 },
});

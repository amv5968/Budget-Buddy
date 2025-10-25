import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import {
  deleteTransaction,
  getTransactions,
  updateTransaction,
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
  const { colors } = useTheme();
  const router = useRouter();
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

  const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    center: { justifyContent: 'center', alignItems: 'center' },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingTop: 60,
      paddingHorizontal: 20,
      paddingBottom: 20,
      backgroundColor: colors.cardBackground,
    },
    addButton: {
      padding: 8,
    },
    backButton: { marginBottom: 16 },
    backText: { fontSize: 16, color: colors.primary, fontWeight: '600' },
    title: { fontSize: 26, fontWeight: 'bold', marginBottom: 20, color: colors.text },
    headerText: {
      fontSize: 28,
      fontWeight: 'bold',
      color: colors.text,
    },
    filterContainer: {
      backgroundColor: colors.cardBackground,
      paddingHorizontal: 20,
      paddingBottom: 15,
      maxHeight: 50,
    },
    filterButton: {
      paddingHorizontal: 20,
      paddingVertical: 8,
      borderRadius: 20,
      backgroundColor: colors.background,
      marginRight: 10,
    },
    filterButtonActive: { backgroundColor: colors.primary },
    filterText: { color: colors.textSecondary, fontWeight: '600' },
    filterTextActive: { color: 'white' },
    listContainer: { padding: 20 },
    transactionCard: {
      backgroundColor: colors.cardBackground,
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
      backgroundColor: colors.background,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 15,
    },
    icon: { fontSize: 24 },
    transactionInfo: { flex: 1 },
    transactionName: { fontSize: 16, fontWeight: '600', marginBottom: 4, color: colors.text },
    transactionCategory: { fontSize: 13, color: colors.textSecondary },
    transactionRight: { alignItems: 'flex-end' },
    transactionAmount: { fontSize: 18, fontWeight: 'bold', marginBottom: 2 },
    transactionDate: { fontSize: 12, color: colors.textSecondary },
    summaryFooter: {
      backgroundColor: colors.cardBackground,
      flexDirection: 'row',
      paddingVertical: 20,
      paddingHorizontal: 40,
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },
    summaryItem: { flex: 1, alignItems: 'center' },
    summaryValue: { fontSize: 24, fontWeight: 'bold', color: colors.income },
    summaryLabel: { fontSize: 14, color: colors.textSecondary },
    summaryDivider: { width: 1, backgroundColor: colors.border, marginHorizontal: 20 },
    typeContainer: { flexDirection: 'row', padding: 20, gap: 12 },
    typeButton: {
      flex: 1,
      paddingVertical: 12,
      borderRadius: 10,
      backgroundColor: colors.cardBackground,
      alignItems: 'center',
      borderWidth: 2,
      borderColor: colors.border,
    },
    typeButtonActive: { backgroundColor: '#66BB6A', borderColor: '#66BB6A' },
    typeText: { fontSize: 16, fontWeight: '600', color: colors.textSecondary },
    typeTextActive: { color: 'white' },
    section: { paddingHorizontal: 20, marginBottom: 24 },
    label: { fontSize: 16, fontWeight: '600', color: colors.text, marginBottom: 12 },
    amountInput: {
      backgroundColor: colors.cardBackground,
      borderRadius: 10,
      padding: 16,
      fontSize: 28,
      fontWeight: 'bold',
      textAlign: 'center',
      color: colors.text,
    },
    categoryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
    categoryButton: {
      paddingVertical: 10,
      paddingHorizontal: 16,
      borderRadius: 8,
      backgroundColor: colors.cardBackground,
      borderWidth: 1,
      borderColor: colors.border,
    },
    categoryButtonActive: {
      backgroundColor: colors.primary + '20',
      borderColor: colors.primary,
    },
    categoryText: { fontSize: 14, color: colors.textSecondary, fontWeight: '500' },
    categoryTextActive: { color: colors.primary, fontWeight: '600' },
    descriptionInput: {
      backgroundColor: colors.cardBackground,
      borderRadius: 10,
      padding: 16,
      fontSize: 16,
      color: colors.text,
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
      backgroundColor: colors.danger,
      marginHorizontal: 20,
      marginBottom: 40,
      padding: 18,
      borderRadius: 10,
      alignItems: 'center',
    },
    submitText: { color: 'white', fontSize: 18, fontWeight: 'bold' },
    disabledButton: { opacity: 0.7 },
  });

  if (loading) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color={colors.primary} />
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
      <View style={styles.header}>
        <Text style={styles.headerText}>Transactions</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => router.push('/(tabs)/add-transaction')}
        >
          <Ionicons name="add-circle" size={28} color="#66BB6A" />
        </TouchableOpacity>
      </View>

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
                  { color: item.type === 'Income' ? colors.income : colors.expense },
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
          <Text style={[styles.summaryValue, { color: colors.expense }]}>
            ${totalExpense.toFixed(0)}
          </Text>
          <Text style={styles.summaryLabel}>Expenses</Text>
        </View>
      </View>
    </View>
  );
}

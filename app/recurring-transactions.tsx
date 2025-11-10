import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { getRecurringTransactions, processRecurringTransactions, stopRecurringTransaction, type Transaction } from './services/transactionService';

export default function RecurringTransactionsScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [processing, setProcessing] = useState(false);

  useFocusEffect(
    useCallback(() => {
      loadRecurringTransactions();
    }, [])
  );

  const loadRecurringTransactions = async () => {
    try {
      const data = await getRecurringTransactions();
      setTransactions(data);
    } catch (error) {
      console.error('Error loading recurring transactions:', error);
      Alert.alert('Error', 'Failed to load recurring transactions');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadRecurringTransactions();
  };

  const handleStopRecurring = (id: string, description: string) => {
    Alert.alert(
      'Stop Recurring Transaction',
      `Are you sure you want to stop "${description}"? No more transactions will be automatically created.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Stop',
          style: 'destructive',
          onPress: async () => {
            try {
              await stopRecurringTransaction(id);
              loadRecurringTransactions();
              Alert.alert('Success', 'Recurring transaction stopped successfully!');
            } catch (error) {
              console.error('Error stopping recurring transaction:', error);
              Alert.alert('Error', 'Failed to stop recurring transaction');
            }
          },
        },
      ]
    );
  };

  const handleProcessNow = async () => {
    setProcessing(true);
    try {
      const results = await processRecurringTransactions();
      Alert.alert(
        'Processing Complete',
        `Processed ${results.processed} recurring transactions.\n✅ Successful: ${results.successful}\n❌ Failed: ${results.failed}`,
        [{ text: 'OK', onPress: () => loadRecurringTransactions() }]
      );
    } catch (error) {
      console.error('Error processing recurring transactions:', error);
      Alert.alert('Error', 'Failed to process recurring transactions');
    } finally {
      setProcessing(false);
    }
  };

  const getFrequencyIcon = (frequency?: string) => {
    switch (frequency) {
      case 'daily': return '📅';
      case 'weekly': return '📆';
      case 'monthly': return '🗓️';
      case 'yearly': return '📊';
      default: return '🔄';
    }
  };

  const getFrequencyLabel = (frequency?: string) => {
    switch (frequency) {
      case 'daily': return 'Daily';
      case 'weekly': return 'Weekly';
      case 'monthly': return 'Monthly';
      case 'yearly': return 'Yearly';
      default: return 'Unknown';
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const getDaysUntilNext = (nextDate?: string) => {
    if (!nextDate) return null;
    const now = new Date();
    const next = new Date(nextDate);
    const diffTime = next.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return 'Overdue';
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Tomorrow';
    return `in ${diffDays} days`;
  };

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* HEADER */}
      <View style={[styles.header, { backgroundColor: colors.cardBackground }]}>
        <TouchableOpacity onPress={() => router.push('/(tabs)')}>
          <Ionicons name="arrow-back" size={26} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.text }]}>🔄 Recurring Transactions</Text>
        <View style={{ width: 26 }} />
      </View>

      <ScrollView 
        style={styles.scrollView}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* Summary Card */}
        <View style={styles.summaryContainer}>
          <View style={[styles.summaryCard, { backgroundColor: colors.cardBackground }]}>
            <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>Active Recurring</Text>
            <Text style={[styles.summaryValue, { color: colors.primary }]}>
              {transactions.filter(t => t.isActive).length}
            </Text>
          </View>
          <TouchableOpacity 
            style={[styles.processButton, { backgroundColor: colors.primary }]}
            onPress={handleProcessNow}
            disabled={processing}
          >
            {processing ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <>
                <Ionicons name="sync-outline" size={18} color="#fff" />
                <Text style={styles.processButtonText}>Process Now</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        {/* Info Box */}
        <View style={[styles.infoBox, { backgroundColor: colors.cardBackground, borderColor: colors.primary }]}>
          <Ionicons name="information-circle-outline" size={20} color={colors.primary} style={{ marginRight: 10 }} />
          <Text style={[styles.infoText, { color: colors.text }]}>
            Recurring transactions automatically create new transactions based on your schedule
          </Text>
        </View>

        {/* Transactions List */}
        <View style={styles.content}>
          {transactions.length === 0 ? (
            <View style={[styles.emptyContainer, { backgroundColor: colors.cardBackground }]}>
              <Text style={{ fontSize: 48, marginBottom: 12 }}>🔄</Text>
              <Text style={[styles.emptyText, { color: colors.text }]}>No recurring transactions</Text>
              <Text style={[styles.emptySubtext, { color: colors.textSecondary }]}>
                Create a recurring transaction to automatically track regular expenses or income
              </Text>
              <TouchableOpacity
                style={[styles.emptyButton, { backgroundColor: colors.primary }]}
                onPress={() => router.push('/(tabs)/add-transaction')}
              >
                <Text style={styles.emptyButtonText}>Add Recurring Transaction</Text>
              </TouchableOpacity>
            </View>
          ) : (
            transactions.map((transaction) => {
              const daysUntil = getDaysUntilNext(transaction.nextRecurringDate);
              const isOverdue = daysUntil === 'Overdue';
              
              return (
                <View key={transaction._id} style={[styles.transactionCard, { backgroundColor: colors.cardBackground }]}>
                  <View style={styles.cardHeader}>
                    <View style={styles.cardLeft}>
                      <Text style={styles.frequencyIcon}>
                        {getFrequencyIcon(transaction.recurringFrequency)}
                      </Text>
                      <View style={styles.cardInfo}>
                        <Text style={[styles.cardDescription, { color: colors.text }]}>
                          {transaction.description || 'No description'}
                        </Text>
                        <View style={styles.cardMeta}>
                          <Text style={[styles.cardCategory, { color: colors.textSecondary }]}>
                            {transaction.category}
                          </Text>
                          <Text style={[styles.cardFrequency, { color: colors.textSecondary }]}>
                            • {getFrequencyLabel(transaction.recurringFrequency)}
                          </Text>
                        </View>
                      </View>
                    </View>
                    <TouchableOpacity
                      onPress={() => handleStopRecurring(transaction._id, transaction.description || 'this transaction')}
                      style={styles.stopButton}
                    >
                      <Ionicons name="stop-circle-outline" size={24} color={colors.expense} />
                    </TouchableOpacity>
                  </View>
                  
                  <View style={styles.cardBody}>
                    <View style={styles.amountRow}>
                      <Text style={[
                        styles.cardAmount,
                        { color: transaction.type === 'Income' ? colors.income : colors.expense }
                      ]}>
                        {transaction.type === 'Income' ? '+' : '-'}${transaction.amount.toFixed(2)}
                      </Text>
                      <View style={[
                        styles.typeBadge,
                        { backgroundColor: transaction.type === 'Income' ? colors.income + '20' : colors.expense + '20' }
                      ]}>
                        <Text style={[
                          styles.typeBadgeText,
                          { color: transaction.type === 'Income' ? colors.income : colors.expense }
                        ]}>
                          {transaction.type}
                        </Text>
                      </View>
                    </View>
                    
                    <View style={styles.dateRow}>
                      <View style={styles.dateItem}>
                        <Text style={[styles.dateLabel, { color: colors.textSecondary }]}>Next</Text>
                        <Text style={[
                          styles.dateValue,
                          { color: isOverdue ? colors.warning : colors.text }
                        ]}>
                          {formatDate(transaction.nextRecurringDate)} {daysUntil && `(${daysUntil})`}
                        </Text>
                      </View>
                      {transaction.recurringEndDate && (
                        <View style={styles.dateItem}>
                          <Text style={[styles.dateLabel, { color: colors.textSecondary }]}>Ends</Text>
                          <Text style={[styles.dateValue, { color: colors.text }]}>
                            {formatDate(transaction.recurringEndDate)}
                          </Text>
                        </View>
                      )}
                    </View>
                  </View>
                </View>
              );
            })
          )}
        </View>
      </ScrollView>

      {transactions.length > 0 && (
        <TouchableOpacity
          style={[styles.addButton, { backgroundColor: colors.primary }]}
          onPress={() => router.push('/(tabs)/add-transaction')}
        >
          <Ionicons name="add-circle-outline" size={22} color="#fff" />
          <Text style={styles.addText}>Add Recurring Transaction</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 16,
    borderBottomWidth: 1,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  scrollView: {
    flex: 1,
  },
  summaryContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 20,
    justifyContent: 'space-between',
  },
  summaryCard: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    elevation: 2,
  },
  summaryLabel: {
    fontSize: 12,
    marginBottom: 8,
    fontWeight: '600',
  },
  summaryValue: {
    fontSize: 32,
    fontWeight: 'bold',
  },
  processButton: {
    flex: 1,
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 2,
    marginLeft: 12,
  },
  processButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
    marginLeft: 8,
  },
  infoBox: {
    marginHorizontal: 20,
    marginBottom: 20,
    padding: 12,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
  },
  infoText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 18,
  },
  content: {
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  emptyContainer: {
    padding: 40,
    borderRadius: 16,
    alignItems: 'center',
    marginTop: 20,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 20,
  },
  emptyButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  emptyButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  transactionCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  cardLeft: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    flex: 1,
  },
  frequencyIcon: {
    fontSize: 28,
    marginRight: 12,
  },
  cardInfo: {
    flex: 1,
  },
  cardDescription: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  cardMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardCategory: {
    fontSize: 12,
  },
  cardFrequency: {
    fontSize: 12,
    marginLeft: 4,
  },
  stopButton: {
    padding: 4,
  },
  cardBody: {
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(128, 128, 128, 0.2)',
  },
  amountRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardAmount: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  typeBadge: {
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: 12,
  },
  typeBadgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  dateRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  dateItem: {
    flex: 1,
  },
  dateLabel: {
    fontSize: 11,
    marginBottom: 4,
    textTransform: 'uppercase',
    fontWeight: '600',
  },
  dateValue: {
    fontSize: 13,
    fontWeight: '500',
  },
  addButton: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    padding: 16,
    elevation: 4,
  },
  addText: {
    color: '#fff',
    fontWeight: 'bold',
    marginLeft: 8,
    fontSize: 16,
  },
});


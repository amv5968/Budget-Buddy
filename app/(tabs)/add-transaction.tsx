import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { maybeTriggerThresholdAlerts, notifyNewTransaction } from '../services/notificationService';
import { addTransaction, createRecurringTransaction } from '../services/transactionService';

const INCOME_CATEGORIES = [
  'Salary',
  'Freelance',
  'Investment',
  'Business',
  'Gift',
  'Bonus',
  'Other',
];

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
  'Phone',
  'Internet',
  'Insurance',
  'Loan',
  'Other',
];

const FREQUENCY_OPTIONS = [
  { label: 'Daily', value: 'daily' },
  { label: 'Weekly', value: 'weekly' },
  { label: 'Monthly', value: 'monthly' },
  { label: 'Yearly', value: 'yearly' },
] as const;

export default function AddTransactionScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const returnTo = (params.returnTo as string) || '/(tabs)';
  const [type, setType] = useState<'Income' | 'Expense'>('Expense');
  const [category, setCategory] = useState('');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  
  // Recurring transaction fields
  const [isRecurring, setIsRecurring] = useState(false);
  const [frequency, setFrequency] = useState<'daily' | 'weekly' | 'monthly' | 'yearly'>('monthly');
  const [endDate, setEndDate] = useState('');

  const categories = type === 'Income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;

  const handleSubmit = async () => {
    if (!category) {
      Alert.alert('Error', 'Please select a category');
      return;
    }

    if (!amount || parseFloat(amount) <= 0) {
      Alert.alert('Error', 'Please enter a valid amount');
      return;
    }

    setLoading(true);
    try {
      if (isRecurring) {
        // Create recurring transaction
        const result = await createRecurringTransaction({
          type,
          category,
          amount: parseFloat(amount),
          description: description.trim(),
          frequency,
          startDate: new Date().toISOString(),
          endDate: endDate ? new Date(endDate).toISOString() : undefined,
        });

        Alert.alert(
          'Success', 
          'Recurring transaction created! It will automatically generate transactions based on your schedule.',
          [{ text: 'OK', onPress: () => router.navigate(returnTo as any) }]
        );
      } else {
        // Create one-time transaction
        const newTransaction = await addTransaction({
          type,
          category,
          amount: parseFloat(amount),
          description: description.trim(),
          date: new Date().toISOString(),
        });

        // Trigger notifications
        await notifyNewTransaction(newTransaction);
        await maybeTriggerThresholdAlerts(newTransaction);

        Alert.alert('Success', 'Transaction added successfully!');
        router.navigate(returnTo as any);
      }
    } catch (error: any) {
      console.error('Error adding transaction:', error);
      const errorMessage = error.response?.data?.error || 'Failed to add transaction';
      Alert.alert('Error', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleGoBack = () => {
    router.navigate(returnTo as any);
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={handleGoBack} style={styles.backButton}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Add Transaction</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>Transaction Type</Text>
        <View style={styles.typeContainer}>
          <TouchableOpacity
            style={[styles.typeButton, type === 'Income' && styles.typeButtonActive]}
            onPress={() => {
              setType('Income');
              setCategory(''); // Reset category when switching type
            }}
          >
            <Text style={[styles.typeText, type === 'Income' && styles.typeTextActive]}>
              💰 Income
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.typeButton, type === 'Expense' && styles.typeButtonActive]}
            onPress={() => {
              setType('Expense');
              setCategory(''); // Reset category when switching type
            }}
          >
            <Text style={[styles.typeText, type === 'Expense' && styles.typeTextActive]}>
              💸 Expense
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>Amount</Text>
        <TextInput
          style={styles.amountInput}
          placeholder="$0.00"
          value={amount}
          onChangeText={(text) => {
            // Remove non-numeric characters except decimal point
            const cleaned = text.replace(/[^0-9.]/g, '');
            // Ensure only one decimal point
            const parts = cleaned.split('.');
            let formatted = parts[0];
            if (parts.length > 1) {
              formatted += '.' + parts.slice(1).join('').substring(0, 2);
            }
            // Cap at $999,999,999.99
            const numValue = parseFloat(formatted) || 0;
            if (numValue <= 999999999.99) {
              setAmount(formatted);
            }
          }}
          keyboardType="decimal-pad"
          placeholderTextColor="#999"
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
        <Text style={styles.label}>Description (Optional)</Text>
        <TextInput
          style={styles.descriptionInput}
          placeholder="Add a note..."
          value={description}
          onChangeText={setDescription}
          multiline
          numberOfLines={3}
          placeholderTextColor="#999"
        />
      </View>

      <View style={styles.section}>
        <View style={styles.recurringHeader}>
          <View>
            <Text style={styles.label}>🔄 Make this recurring</Text>
            <Text style={styles.sublabel}>
              Automatically create this transaction on a schedule
            </Text>
          </View>
          <Switch
            value={isRecurring}
            onValueChange={setIsRecurring}
            trackColor={{ false: '#ccc', true: '#66BB6A' }}
            thumbColor={isRecurring ? '#fff' : '#f4f3f4'}
          />
        </View>

        {isRecurring && (
          <View style={styles.recurringOptions}>
            <Text style={styles.label}>Frequency</Text>
            <View style={styles.frequencyGrid}>
              {FREQUENCY_OPTIONS.map((option) => (
                <TouchableOpacity
                  key={option.value}
                  style={[
                    styles.frequencyButton,
                    frequency === option.value && styles.frequencyButtonActive,
                  ]}
                  onPress={() => setFrequency(option.value)}
                >
                  <Text
                    style={[
                      styles.frequencyText,
                      frequency === option.value && styles.frequencyTextActive,
                    ]}
                  >
                    {option.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={[styles.label, { marginTop: 16 }]}>End Date (Optional)</Text>
            <TextInput
              style={styles.input}
              placeholder="YYYY-MM-DD or leave empty for no end"
              value={endDate}
              onChangeText={setEndDate}
              placeholderTextColor="#999"
            />
            <Text style={styles.helperText}>
              Leave empty to continue indefinitely
            </Text>
          </View>
        )}
      </View>

      <TouchableOpacity
        style={[styles.submitButton, loading && styles.submitButtonDisabled]}
        onPress={handleSubmit}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="white" />
        ) : (
          <Text style={styles.submitButtonText}>
            {isRecurring ? 'Create Recurring Transaction' : 'Add Transaction'}
          </Text>
        )}
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
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 20,
    backgroundColor: 'white',
  },
  backButton: {
    marginBottom: 16,
  },
  backText: {
    fontSize: 16,
    color: '#2196F3',
    fontWeight: '600',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  amountInput: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 16,
    fontSize: 32,
    fontWeight: 'bold',
    textAlign: 'center',
    color: '#333',
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
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
  categoryText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  categoryTextActive: {
    color: '#2196F3',
    fontWeight: '600',
  },
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
    marginBottom: 40,
    padding: 18,
    borderRadius: 10,
    alignItems: 'center',
    shadowColor: '#66BB6A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  submitButtonDisabled: {
    opacity: 0.7,
  },
  submitButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  recurringHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 10,
    marginBottom: 12,
  },
  sublabel: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
  },
  recurringOptions: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 10,
  },
  frequencyGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 8,
  },
  frequencyButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    backgroundColor: '#f5f5f5',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    minWidth: 80,
    alignItems: 'center',
  },
  frequencyButtonActive: {
    backgroundColor: '#E3F2FD',
    borderColor: '#2196F3',
  },
  frequencyText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  frequencyTextActive: {
    color: '#2196F3',
    fontWeight: '600',
  },
  input: {
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#333',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  helperText: {
    fontSize: 12,
    color: '#999',
    marginTop: 6,
    fontStyle: 'italic',
  },
  typeContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 8,
  },
  typeButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 10,
    backgroundColor: 'white',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#e0e0e0',
  },
  typeButtonActive: {
    backgroundColor: '#E3F2FD',
    borderColor: '#2196F3',
  },
  typeText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
  },
  typeTextActive: {
    color: '#2196F3',
  },
});
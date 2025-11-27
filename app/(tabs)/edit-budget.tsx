import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import {
  deleteBudget,
  getBudgets,
  updateBudgetSpent,
  type Budget
} from '../services/budgetService';

export default function EditBudgetScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const budgetId = params.id as string;

  console.log('EditBudgetScreen rendered with params:', params);
  console.log('Extracted budgetId:', budgetId);

  const [budget, setBudget] = useState<Budget | null>(null);
  const [spentAmount, setSpentAmount] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);


  useEffect(() => {
    if (budgetId) {
      console.log('useEffect triggered with budgetId:', budgetId);
      loadBudget();
    }
  }, [budgetId]);

  const loadBudget = async () => {
    try {
      setLoading(true);
      console.log('==== LOADING BUDGET ====');
      console.log('Looking for budget with ID:', budgetId);
      console.log('ID type:', typeof budgetId);
      console.log('ID length:', budgetId?.length);
      
      const budgets = await getBudgets();
      console.log('Total budgets fetched:', budgets.length);
      console.log('All budgets:', budgets.map(b => ({ 
        id: b._id, 
        category: b.category, 
        type: b.type,
        idLength: b._id.length 
      })));
      
      const foundBudget = budgets.find(b => {
        const match = b._id === budgetId;
        console.log(`Comparing: "${b._id}" === "${budgetId}" = ${match}`);
        return match;
      });
      
      if (foundBudget) {
        console.log('✅ Found budget:', { 
          id: foundBudget._id, 
          category: foundBudget.category, 
          type: foundBudget.type 
        });
        setBudget(foundBudget);
        setSpentAmount(foundBudget.spentAmount.toString());
      } else {
        console.error('❌ Budget not found!');
        console.error('Looking for ID:', budgetId);
        console.error('Available IDs:', budgets.map(b => b._id));
        Alert.alert('Error', `Budget not found.\n\nLooking for: ${budgetId}\n\nAvailable: ${budgets.length} budgets`);
        router.back();
      }
    } catch (error) {
      console.error('Error loading budget:', error);
      Alert.alert('Error', 'Failed to load budget');
      router.back();
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async () => {
    if (!spentAmount || parseFloat(spentAmount) < 0) {
      Alert.alert('Error', 'Please enter a valid amount');
      return;
    }

    setSaving(true);
    try {
      await updateBudgetSpent(budgetId, parseFloat(spentAmount));
      Alert.alert('Success', 'Budget updated successfully!');
      router.back();
    } catch (error: any) {
      console.error('Error updating budget:', error);
      const errorMessage = error.response?.data?.error || 'Failed to update budget';
      Alert.alert('Error', errorMessage);
    } finally {
      setSaving(false);
    }
  };
  
  const handleDelete = async () => {
  Alert.alert(
    'Delete Budget',
    'Are you sure you want to delete this budget?',
    [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          setDeleting(true);
          try {
            await deleteBudget(budgetId);
            Alert.alert('Deleted', 'Budget deleted successfully!');
            router.back();
          } catch (error) {
            console.error('Error deleting budget:', error);
            Alert.alert('Error', 'Failed to delete budget');
          } finally {
            setDeleting(false);
          }
        },
      },
    ]
  );
};

  const getProgressPercentage = () => {
    if (!budget) return 0;
    return Math.min((parseFloat(spentAmount) / budget.totalAmount) * 100, 100);
  };

  const getProgressColor = (percentage: number) => {
    if (percentage >= 90) return '#F44336';
    if (percentage >= 70) return '#FF9800';
    return '#4CAF50';
  };

  if (loading || !budget) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color="#66BB6A" />
      </View>
    );
  }

  const percentage = getProgressPercentage();
  const progressColor = getProgressColor(percentage);

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Edit Budget</Text>
      </View>

      <View style={styles.budgetCard}>
        <View style={styles.budgetHeader}>
          <Text style={styles.budgetIcon}>{budget.icon || '💵'}</Text>
          <View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Text style={styles.budgetCategory}>{budget.category}</Text>
              {budget.type && (
                <Text style={[styles.budgetTypeBadge, { 
                  color: budget.type === 'Income' ? '#4CAF50' : '#F44336',
                  fontSize: 12,
                  fontWeight: '600',
                  backgroundColor: budget.type === 'Income' ? '#E8F5E9' : '#FFEBEE',
                  paddingHorizontal: 8,
                  paddingVertical: 4,
                  borderRadius: 4,
                }]}>
                  {budget.type === 'Income' ? '💰 Income' : '💸 Expense'}
                </Text>
              )}
            </View>
          </View>
        </View>

        <View style={styles.budgetInfo}>
          <Text style={styles.infoLabel}>Monthly Budget</Text>
          <Text style={styles.infoValue}>${budget.totalAmount.toFixed(2)}</Text>
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

        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>
              {budget.type === 'Income' ? 'Earned' : 'Spent'}
            </Text>
            <Text style={[styles.statValue, { color: progressColor }]}>
              ${parseFloat(spentAmount).toFixed(2)}
            </Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>
              {budget.type === 'Income' ? 'Target' : 'Remaining'}
            </Text>
            <Text style={styles.statValue}>
              ${(budget.totalAmount - parseFloat(spentAmount || '0')).toFixed(2)}
            </Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>Progress</Text>
            <Text style={[styles.statValue, { color: progressColor }]}>
              {percentage.toFixed(0)}%
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>
          {budget.type === 'Income' ? 'Update Earned Amount' : 'Update Spent Amount'}
        </Text>
        <TextInput
          style={styles.amountInput}
          placeholder="0.00"
          value={spentAmount}
          onChangeText={setSpentAmount}
          keyboardType="decimal-pad"
          placeholderTextColor="#999"
        />
        <Text style={styles.hint}>
          {budget.type === 'Income' 
            ? 'Enter the total amount you\'ve earned in this category'
            : 'Enter the total amount you\'ve spent in this category'}
        </Text>
      </View>

      <TouchableOpacity
        style={[styles.submitButton, saving && styles.submitButtonDisabled]}
        onPress={handleUpdate}
        disabled={saving}
      >
        {saving ? (
          <ActivityIndicator color="white" />
        ) : (
          <Text style={styles.submitButtonText}>Update Budget</Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.deleteButton, deleting && styles.submitButtonDisabled]}
        onPress={handleDelete}
        disabled={saving || deleting}
      >
        {deleting ? (
          <ActivityIndicator color="white" />
        ) : (
          <Text style={styles.submitButtonText}>Delete Budget</Text>
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
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
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
  budgetCard: {
    backgroundColor: 'white',
    margin: 20,
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  budgetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  budgetIcon: {
    fontSize: 40,
    marginRight: 12,
  },
  budgetCategory: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  budgetInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  infoLabel: {
    fontSize: 14,
    color: '#666',
  },
  infoValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  progressBarContainer: {
    height: 12,
    backgroundColor: '#E0E0E0',
    borderRadius: 6,
    overflow: 'hidden',
    marginBottom: 20,
  },
  progressBar: {
    height: '100%',
    borderRadius: 6,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
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
    marginBottom: 8,
  },
  hint: {
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
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
  deleteButton: {
  backgroundColor: '#F44336',
  marginHorizontal: 20,
  marginBottom: 40,
  padding: 18,
  borderRadius: 10,
  alignItems: 'center',
  shadowColor: '#F44336',
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
  budgetTypeBadge: {
    fontSize: 11,
    fontWeight: '600',
  },
});

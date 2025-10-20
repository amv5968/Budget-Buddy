import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { 
  getGoals, 
  updateGoalSaved,
  type Goal 
} from '../services/goalService';

export default function EditGoalScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const goalId = params.id as string;

  const [goal, setGoal] = useState<Goal | null>(null);
  const [savedAmount, setSavedAmount] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadGoal();
  }, []);

  const loadGoal = async () => {
    try {
      const goals = await getGoals();
      const foundGoal = goals.find(g => g._id === goalId);
      
      if (foundGoal) {
        setGoal(foundGoal);
        setSavedAmount(foundGoal.savedAmount.toString());
      } else {
        Alert.alert('Error', 'Goal not found');
        router.back();
      }
    } catch (error) {
      console.error('Error loading goal:', error);
      Alert.alert('Error', 'Failed to load goal');
      router.back();
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async () => {
    if (!savedAmount || parseFloat(savedAmount) < 0) {
      Alert.alert('Error', 'Please enter a valid amount');
      return;
    }

    setSaving(true);
    try {
      await updateGoalSaved(goalId, parseFloat(savedAmount));
      Alert.alert('Success', 'Goal updated successfully!');
      router.back();
    } catch (error: any) {
      console.error('Error updating goal:', error);
      const errorMessage = error.response?.data?.error || 'Failed to update goal';
      Alert.alert('Error', errorMessage);
    } finally {
      setSaving(false);
    }
  };

  const handleAddAmount = (amount: number) => {
    const currentAmount = parseFloat(savedAmount || '0');
    const newAmount = currentAmount + amount;
    setSavedAmount(newAmount.toString());
  };

  const getProgressPercentage = () => {
    if (!goal) return 0;
    return Math.min((parseFloat(savedAmount) / goal.targetAmount) * 100, 100);
  };

  if (loading || !goal) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color="#66BB6A" />
      </View>
    );
  }

  const percentage = getProgressPercentage();
  const remaining = goal.targetAmount - parseFloat(savedAmount || '0');

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Edit Goal</Text>
      </View>

      <View style={styles.goalCard}>
        <View style={styles.goalHeader}>
          <Text style={styles.goalIcon}>{goal.icon || '🎯'}</Text>
          <Text style={styles.goalName}>{goal.name}</Text>
        </View>

        <View style={styles.targetInfo}>
          <Text style={styles.targetLabel}>Target Amount</Text>
          <Text style={styles.targetValue}>${goal.targetAmount.toFixed(2)}</Text>
        </View>

        <View style={styles.progressBarContainer}>
          <View
            style={[
              styles.progressBar,
              {
                width: `${percentage}%`,
                backgroundColor: percentage >= 100 ? '#4CAF50' : '#2196F3',
              },
            ]}
          />
        </View>

        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>Saved</Text>
            <Text style={styles.statValue}>
              ${parseFloat(savedAmount || '0').toFixed(2)}
            </Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>Remaining</Text>
            <Text style={styles.statValue}>
              ${Math.max(remaining, 0).toFixed(2)}
            </Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>Progress</Text>
            <Text style={[styles.statValue, { color: percentage >= 100 ? '#4CAF50' : '#2196F3' }]}>
              {percentage.toFixed(0)}%
            </Text>
          </View>
        </View>

        {percentage >= 100 && (
          <View style={styles.achievedBanner}>
            <Text style={styles.achievedText}>🎉 Goal Achieved! 🎉</Text>
          </View>
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>Update Saved Amount</Text>
        <TextInput
          style={styles.amountInput}
          placeholder="0.00"
          value={savedAmount}
          onChangeText={setSavedAmount}
          keyboardType="decimal-pad"
          placeholderTextColor="#999"
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>Quick Add</Text>
        <View style={styles.quickAddGrid}>
          {[10, 25, 50, 100, 250, 500].map((amount) => (
            <TouchableOpacity
              key={amount}
              style={styles.quickAddButton}
              onPress={() => handleAddAmount(amount)}
            >
              <Text style={styles.quickAddText}>+${amount}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <TouchableOpacity
        style={[styles.submitButton, saving && styles.submitButtonDisabled]}
        onPress={handleUpdate}
        disabled={saving}
      >
        {saving ? (
          <ActivityIndicator color="white" />
        ) : (
          <Text style={styles.submitButtonText}>Update Goal</Text>
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
  goalCard: {
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
  goalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  goalIcon: {
    fontSize: 40,
    marginRight: 12,
  },
  goalName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
  },
  targetInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  targetLabel: {
    fontSize: 14,
    color: '#666',
  },
  targetValue: {
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
  achievedBanner: {
    marginTop: 16,
    padding: 12,
    backgroundColor: '#E8F5E9',
    borderRadius: 8,
    alignItems: 'center',
  },
  achievedText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#4CAF50',
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
  quickAddGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  quickAddButton: {
    width: '31%',
    paddingVertical: 12,
    backgroundColor: 'white',
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  quickAddText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2196F3',
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
});
    
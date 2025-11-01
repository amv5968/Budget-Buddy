import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { addGoal, deleteGoal } from '../services/goalService';

interface Goal {
  id?: string;
  name: string;
  targetAmount: number;
  icon: string;
}

const GOAL_ICONS = [
  '\u{1F3AF}', // target
  '\u{1F3E0}', // house
  '\u{1F697}', // car
  '\u{2708}\u{FE0F}', // airplane
  '\u{1F48D}', // ring
  '\u{1F393}', // graduation cap
  '\u{1F4B0}', // money bag
  '\u{1F4F1}', // phone
  '\u{1F4BB}', // laptop
  '\u{1F3AE}', // game controller
  '\u{1F3D6}\u{FE0F}', // beach
  '\u{26A1}', // lightning
];

export default function AddGoalScreen() {
  const router = useRouter();
  const { goal } = useLocalSearchParams<{ goal?: string }>();

  const [name, setName] = useState('');
  const [targetAmount, setTargetAmount] = useState('');
  const [selectedIcon, setSelectedIcon] = useState(GOAL_ICONS[0]);
  const [loading, setLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [goalId, setGoalId] = useState<string | undefined>(undefined);

  useEffect(() => {
    if (goal) {
      try {
        const parsedGoal: Goal = JSON.parse(goal);
        setName(parsedGoal.name);
        setTargetAmount(parsedGoal.targetAmount.toString());
        setSelectedIcon(parsedGoal.icon || GOAL_ICONS[0]);
        setGoalId(parsedGoal.id);
        setIsEditing(true);
      } catch (err) {
        console.error('Invalid goal data:', err);
      }
    }
  }, [goal]);

  const handleSubmit = async () => {
    if (!name.trim()) {
      Alert.alert('Error', 'Please enter a goal name');
      return;
    }

    if (!targetAmount || parseFloat(targetAmount) <= 0) {
      Alert.alert('Error', 'Please enter a valid target amount');
      return;
    }

    setLoading(true);
    try {
      await addGoal({
        name: name.trim(),
        targetAmount: parseFloat(targetAmount),
        icon: selectedIcon,
      });

      Alert.alert('Success', 'Goal created successfully!');
      router.back();
    } catch (error: any) {
      console.error('Error creating goal:', error);
      const errorMessage = error.response?.data?.error || 'Failed to create goal';
      Alert.alert('Error', errorMessage);
    } finally {

      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!goalId) return;

    Alert.alert('Delete Goal', 'Are you sure you want to delete this goal?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            setLoading(true);
            await deleteGoal(goalId);
            Alert.alert('Deleted', 'Goal deleted successfully.');
            router.back();
          } catch (error) {
            console.error('Error deleting goal:', error);
            Alert.alert('Error', 'Failed to delete goal.');
          } finally {
            setLoading(false);
          }
        },
      },
    ]);
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backText}>{'\u{2190}'} Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>{isEditing ? 'Edit Savings Goal' : 'Create Savings Goal'}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>Goal Name</Text>
        <TextInput
          style={styles.nameInput}
          placeholder="e.g., Emergency Fund, New Car..."
          value={name}
          onChangeText={setName}
          placeholderTextColor="#999"
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>Target Amount</Text>
        <TextInput
          style={styles.amountInput}
          placeholder="0.00"
          value={targetAmount}
          onChangeText={setTargetAmount}
          keyboardType="decimal-pad"
          placeholderTextColor="#999"
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>Choose an Icon</Text>
        <View style={styles.iconGrid}>
          {GOAL_ICONS.map((icon, index) => (
            <TouchableOpacity
              key={index}
              style={[
                styles.iconButton,
                selectedIcon === icon && styles.iconButtonActive,
              ]}
              onPress={() => setSelectedIcon(icon)}
            >
              <Text style={styles.iconText}>{icon}</Text>
            </TouchableOpacity>
          ))}
        </View>
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
            {isEditing ? 'Save Changes' : 'Create Goal'}
          </Text>
        )}
      </TouchableOpacity>

      {isEditing && (
        <TouchableOpacity
          style={[styles.deleteButton, loading && styles.submitButtonDisabled]}
          onPress={handleDelete}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text style={styles.deleteButtonText}>Delete Goal</Text>
          )}
        </TouchableOpacity>
      )}
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
    marginTop: 24,
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  nameInput: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 16,
    fontSize: 16,
    color: '#333',
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
  iconGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  iconButton: {
    width: 60,
    height: 60,
    backgroundColor: 'white',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#e0e0e0',
  },
  iconButtonActive: {
    backgroundColor: '#E3F2FD',
    borderColor: '#2196F3',
  },
  iconText: {
    fontSize: 32,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
  },
  submitButton: {
    backgroundColor: '#66BB6A',
    marginHorizontal: 20,
    marginBottom: 20,
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
    backgroundColor: '#E57373',
    marginHorizontal: 20,
    marginBottom: 40,
    padding: 18,
    borderRadius: 10,
    alignItems: 'center',
    shadowColor: '#E57373',
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
  deleteButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
});

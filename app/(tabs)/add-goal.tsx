import { useRouter } from 'expo-router';
import React, { useState } from 'react';
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
import { addGoal } from '../services/goalService';

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
  const [name, setName] = useState('');
  const [targetAmount, setTargetAmount] = useState('');
  const [selectedIcon, setSelectedIcon] = useState(GOAL_ICONS[0]);
  const [loading, setLoading] = useState(false);

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
        } catch (err: any) {
      console.error('Error creating goal:', err);
      const errorMessage = err?.response?.data?.error || 'Failed to create goal';
      Alert.alert('Error', errorMessage);
    } finally {

      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backText}>{'\u{2190}'} Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Create Savings Goal</Text>
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
          <Text style={styles.submitButtonText}>Create Goal</Text>
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

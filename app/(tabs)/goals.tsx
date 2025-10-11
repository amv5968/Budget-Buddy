import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';

export default function GoalsScreen() {
  const [goals] = useState([
    { id: 1, name: 'Study Abroad Fund', icon: '🎓', saved: 800, target: 2000, percentage: 40 },
    { id: 2, name: 'Graduation Fund', icon: '🎉', saved: 300, target: 1000, percentage: 30 },
    { id: 3, name: 'First Car', icon: '🚗', saved: 100, target: 2000, percentage: 5 },
  ]);

  const totalTarget = goals.reduce((sum, g) => sum + g.target, 0);
  const totalSaved = goals.reduce((sum, g) => sum + g.saved, 0);
  const overallProgress = Math.round((totalSaved / totalTarget) * 100);

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.header}>Savings Goals</Text>

      {/* Summary Card */}
      <View style={styles.summaryCard}>
        <Text style={styles.summaryTitle}>Total Goals: {goals.length}</Text>
        <Text style={styles.summaryProgress}>
          Progress: ${totalSaved} of ${totalTarget}
        </Text>
        <Text style={styles.summarySubtext}>
          saved of {totalTarget} ({overallProgress}%)
        </Text>
        
        {/* Overall Progress Bar */}
        <View style={styles.overallProgressContainer}>
          <View
            style={[
              styles.overallProgressBar,
              { width: `${overallProgress}%` },
            ]}
          />
        </View>
      </View>

      {/* Goals List */}
      <View style={styles.goalsList}>
        {goals.map((goal) => (
          <View key={goal.id} style={styles.goalCard}>
            <View style={styles.goalHeader}>
              <View style={styles.goalIconContainer}>
                <Text style={styles.goalIcon}>{goal.icon}</Text>
              </View>
              <View style={styles.goalInfo}>
                <Text style={styles.goalName}>{goal.name}</Text>
                <Text style={styles.goalAmount}>
                  Saved: ${goal.saved} of ${goal.target}
                </Text>
              </View>
              <View style={styles.goalPercentageContainer}>
                <Text style={styles.goalPercentage}>{goal.percentage}%</Text>
              </View>
            </View>

            {/* Progress Bar */}
            <View style={styles.progressBarContainer}>
              <View
                style={[
                  styles.progressBar,
                  { width: `${goal.percentage}%` },
                ]}
              />
            </View>
          </View>
        ))}
      </View>

      {/* Add New Goal Button */}
      <TouchableOpacity style={styles.addButton}>
        <Text style={styles.addButtonText}>+ Add New Goal</Text>
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
    fontSize: 28,
    fontWeight: 'bold',
    padding: 20,
    paddingTop: 60,
    backgroundColor: 'white',
    marginBottom: 20,
  },
  summaryCard: {
    backgroundColor: 'white',
    marginHorizontal: 20,
    padding: 24,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
    marginBottom: 20,
    alignItems: 'center',
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
  },
  summaryProgress: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#2196F3',
    marginBottom: 4,
  },
  summarySubtext: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
  },
  overallProgressContainer: {
    width: '100%',
    height: 10,
    backgroundColor: '#f0f0f0',
    borderRadius: 5,
    overflow: 'hidden',
  },
  overallProgressBar: {
    height: '100%',
    backgroundColor: '#4CAF50',
    borderRadius: 5,
  },
  goalsList: {
    paddingHorizontal: 20,
  },
  goalCard: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 12,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  goalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  goalIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#E3F2FD',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  goalIcon: {
    fontSize: 24,
  },
  goalInfo: {
    flex: 1,
  },
  goalName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  goalAmount: {
    fontSize: 13,
    color: '#666',
  },
  goalPercentageContainer: {
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  goalPercentage: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  progressBarContainer: {
    height: 8,
    backgroundColor: '#f0f0f0',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#4CAF50',
    borderRadius: 4,
  },
  addButton: {
    backgroundColor: '#66BB6A',
    margin: 20,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 10,
  },
  addButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
import React, { useState } from 'react';
import { 
  View, 
  Text, 
  Switch, 
  TextInput, 
  TouchableOpacity, 
  StyleSheet, 
  Alert, 
  ScrollView 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

export default function SettingsScreen() {
  const router = useRouter();

  const [weeklySummary, setWeeklySummary] = useState(true);
  const [lowBalanceAlert, setLowBalanceAlert] = useState(true);
  const [largeTransactionAlert, setLargeTransactionAlert] = useState(true);
  const [lowBalanceThreshold, setLowBalanceThreshold] = useState('50');
  const [largeTransactionThreshold, setLargeTransactionThreshold] = useState('100');
  const [currency, setCurrency] = useState('USD');

  const handleSave = () => {
    Alert.alert('✅ Settings Saved', 'Your preferences have been updated.');
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {/* 🔙 Header with Back Button */}
      <View style={styles.headerRow}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={26} color="#333" />
        </TouchableOpacity>
        <Text style={styles.header}>Settings</Text>
      </View>

      {/* Notifications Section */}
      <View style={styles.section}>
        <Text style={styles.sectionHeader}>Notifications</Text>

        <View style={styles.row}>
          <Text style={styles.label}>Weekly Summary</Text>
          <Switch 
            value={weeklySummary} 
            onValueChange={setWeeklySummary} 
            trackColor={{ true: '#4CAF50' }}
          />
        </View>

        <View style={styles.row}>
          <Text style={styles.label}>Low Balance Alerts</Text>
          <Switch 
            value={lowBalanceAlert} 
            onValueChange={setLowBalanceAlert} 
            trackColor={{ true: '#4CAF50' }}
          />
        </View>

        <View style={styles.row}>
          <Text style={styles.label}>Large Transaction Alerts</Text>
          <Switch 
            value={largeTransactionAlert} 
            onValueChange={setLargeTransactionAlert} 
            trackColor={{ true: '#4CAF50' }}
          />
        </View>

        <Text style={styles.subLabel}>Low Balance Threshold ($)</Text>
        <TextInput
          style={styles.input}
          value={lowBalanceThreshold}
          keyboardType="numeric"
          onChangeText={setLowBalanceThreshold}
        />

        <Text style={styles.subLabel}>Large Transaction Threshold ($)</Text>
        <TextInput
          style={styles.input}
          value={largeTransactionThreshold}
          keyboardType="numeric"
          onChangeText={setLargeTransactionThreshold}
        />
      </View>

      {/* Preferences Section */}
      <View style={styles.section}>
        <Text style={styles.sectionHeader}>Preferences</Text>
        <Text style={styles.subLabel}>Currency</Text>
        <TextInput
          style={styles.input}
          value={currency}
          onChangeText={setCurrency}
        />
      </View>

      {/* Save Button */}
      <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
        <Text style={styles.saveButtonText}>Save Settings</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: '#f5f5f5',
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 50,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 25,
  },
  backButton: {
    marginRight: 12,
    backgroundColor: '#e8e8e8',
    padding: 8,
    borderRadius: 8,
  },
  header: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#333',
  },
  section: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
  },
  sectionHeader: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#333',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  label: {
    fontSize: 16,
    color: '#333',
  },
  subLabel: {
    fontSize: 14,
    marginTop: 10,
    color: '#555',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    padding: 10,
    marginTop: 5,
    color: '#333',
  },
  saveButton: {
    backgroundColor: '#4CAF50',
    paddingVertical: 15,
    borderRadius: 12,
    alignItems: 'center',
    elevation: 3,
  },
  saveButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
});

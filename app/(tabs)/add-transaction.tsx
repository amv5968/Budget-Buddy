import React, { useState } from 'react';

import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';

import { useRouter } from 'expo-router';

export default function AddTransactionScreen() {

  const [category, setCategory] = useState('');

  const [amount, setAmount] = useState('');

  const [type, setType] = useState('Expense');

  const router = useRouter();

  const handleAdd = () => {

    if (!category || !amount) {

      alert('Please fill in all fields');

      return;

    }

    alert('Transaction added!');

    router.back();

  };

  return (

    <ScrollView style={styles.container}>

      <Text style={styles.title}>Add New Transaction</Text>

      

      <View style={styles.typeContainer}>

        <TouchableOpacity

          style={[styles.typeButton, type === 'Income' && styles.typeButtonActive]}

          onPress={() => setType('Income')}

        >

          <Text style={[styles.typeButtonText, type === 'Income' && styles.typeButtonTextActive]}>

            Income

          </Text>

        </TouchableOpacity>

        <TouchableOpacity

          style={[styles.typeButton, type === 'Expense' && styles.typeButtonActive]}

          onPress={() => setType('Expense')}

        >

          <Text style={[styles.typeButtonText, type === 'Expense' && styles.typeButtonTextActive]}>

            Expense

          </Text>

        </TouchableOpacity>

      </View>

      <TextInput

        style={styles.input}

        placeholder="Category (e.g., Groceries, Salary)"

        value={category}

        onChangeText={setCategory}

      />

      <TextInput

        style={styles.input}

        placeholder="Amount"

        keyboardType="numeric"

        value={amount}

        onChangeText={setAmount}

      />

      

      <TouchableOpacity style={styles.saveButton} onPress={handleAdd}>

        <Text style={styles.saveButtonText}>Save Transaction</Text>

      </TouchableOpacity>

      <TouchableOpacity style={styles.cancelButton} onPress={() => router.back()}>

        <Text style={styles.cancelButtonText}>Cancel</Text>

      </TouchableOpacity>

    </ScrollView>

  );

}

const styles = StyleSheet.create({

  container: { 

    flex: 1, 

    padding: 20,

    backgroundColor: '#f5f5f5',

  },

  title: { 

    fontSize: 24, 

    fontWeight: '600', 

    marginBottom: 30,

    textAlign: 'center',

  },

  typeContainer: {

    flexDirection: 'row',

    marginBottom: 20,

    gap: 10,

  },

  typeButton: {

    flex: 1,

    padding: 15,

    borderRadius: 8,

    borderWidth: 2,

    borderColor: '#ddd',

    backgroundColor: 'white',

    alignItems: 'center',

  },

  typeButtonActive: {

    borderColor: '#2196F3',

    backgroundColor: '#E3F2FD',

  },

  typeButtonText: {

    fontSize: 16,

    fontWeight: '600',

    color: '#666',

  },

  typeButtonTextActive: {

    color: '#2196F3',

  },

  input: { 

    borderWidth: 1, 

    borderColor: '#ddd',

    padding: 15, 

    marginBottom: 15, 

    borderRadius: 8,

    backgroundColor: 'white',

    fontSize: 16,

  },

  saveButton: {

    backgroundColor: '#4CAF50',

    padding: 15,

    borderRadius: 8,

    alignItems: 'center',

    marginTop: 10,

  },

  saveButtonText: {

    color: 'white',

    fontSize: 16,

    fontWeight: '600',

  },

  cancelButton: {

    backgroundColor: 'transparent',

    padding: 15,

    borderRadius: 8,

    alignItems: 'center',

    marginTop: 10,

  },

  cancelButtonText: {

    color: '#666',

    fontSize: 16,

  },

});
import React, { useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet } from 'react-native';
import API from '../api/api';

export default function AddTransactionScreen({ navigation }) {
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');

  const handleAdd = async () => {
    try {
      const res = await API.post('/transactions', {
        description,
        amount: parseFloat(amount)
      });
      if (res.data.success) {
        alert('Transaction added!');
        navigation.goBack();
      }
    } catch (err) {
      console.error(err);
      alert('Failed to add transaction');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Add New Transaction</Text>
      <TextInput
        style={styles.input}
        placeholder="Description"
        value={description}
        onChangeText={setDescription}
      />
      <TextInput
        style={styles.input}
        placeholder="Amount"
        keyboardType="numeric"
        value={amount}
        onChangeText={setAmount}
      />
      <Button title="Save Transaction" onPress={handleAdd} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: 20 },
  title: { fontSize: 22, fontWeight: '600', marginBottom: 20 },
  input: { borderWidth: 1, padding: 10, marginBottom: 10, borderRadius: 5 }
});
const res = await API.post('/transactions', {
    description,
    amount: parseFloat(amount)
  });
  
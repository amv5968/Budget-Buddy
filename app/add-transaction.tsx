import React, { useState } from 'react';
import {
  AccessibilityInfo,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { db } from '../src/db/sqlite'; // path is correct from app/*
import { formatCurrencyFromCents } from '../src/utils/currency';

export default function AddTransaction() {
  const [amount, setAmount] = useState('');          // dollars as string
  const [type, setType] = useState<'income' | 'expense'>('expense');
  const [note, setNote] = useState('');

  const save = () => {
    // safer validation
    const n = Number(amount);
    const cents = Math.round(n * 100);
    if (!Number.isFinite(n) || cents <= 0) {
      AccessibilityInfo.announceForAccessibility('Enter a valid amount');
      return;
    }

    db.transaction((tx: any) => {
      tx.executeSql(
        `INSERT INTO transactions (amount_cents, type, occurred_at, note)
         VALUES (?, ?, ?, ?);`,
        [cents, type, Date.now(), note || null],
        // success
        () => {
          AccessibilityInfo.announceForAccessibility('Transaction saved');
          setAmount('');
          setNote('');
        },
        // error
        (_tx: any, err: any) => {
          console.warn('SQL error:', err);
          // returning true marks the error as handled and aborts the tx cleanly
          return true;
        }
      );
    });
  };

  const previewCents = Math.round((Number(amount) || 0) * 100);

  return (
    <View style={styles.container}>
      <Text style={styles.header}>
        Add {type === 'expense' ? 'Expense' : 'Income'}
      </Text>

      <Text>Amount</Text>
      <TextInput
        accessibilityLabel="Amount"
        keyboardType="decimal-pad"
        value={amount}
        onChangeText={setAmount}
        style={styles.input}
        placeholder="0.00"
      />

      <View style={styles.row}>
        <Pressable
          onPress={() => setType('expense')}
          style={[styles.button, type === 'expense' && styles.active]}
          accessibilityRole="button"
        >
          <Text>Expense</Text>
        </Pressable>
        <Pressable
          onPress={() => setType('income')}
          style={[styles.button, type === 'income' && styles.active]}
          accessibilityRole="button"
        >
          <Text>Income</Text>
        </Pressable>
      </View>

      <Text>Note (optional)</Text>
      <TextInput
        accessibilityLabel="Note"
        value={note}
        onChangeText={setNote}
        style={styles.input}
      />

      <Pressable onPress={save} style={styles.saveButton} accessibilityRole="button">
        <Text style={styles.saveText}>Save Transaction</Text>
      </Pressable>

      <Text style={{ marginTop: 10 }}>
        Preview: {formatCurrencyFromCents(previewCents)}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, gap: 12 },
  header: { fontSize: 22, fontWeight: '700' },
  input: { borderWidth: 1, borderColor: '#bbb', borderRadius: 8, padding: 12 },
  row: { flexDirection: 'row', gap: 10 },
  button: { flex: 1, padding: 12, borderWidth: 1, borderRadius: 8, alignItems: 'center' },
  active: { backgroundColor: '#eee' },
  saveButton: { backgroundColor: '#007AFF', padding: 14, borderRadius: 10, alignItems: 'center' },
  saveText: { color: '#fff', fontWeight: '700' },
});

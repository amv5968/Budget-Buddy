import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet } from 'react-native';
import { getTransactions } from '../services/api';

export default function HomeScreen() {
  const [transactions, setTransactions] = useState([]);

  useEffect(() => {
    (async () => {
      const data = await getTransactions();
      setTransactions(data);
    })();
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Transactions</Text>
      <FlatList
        data={transactions}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <Text>{`${item.type}: $${item.amount} (${item.category})`}</Text>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: 22, fontWeight: 'bold', marginBottom: 10 },
});

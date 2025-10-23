import { Tabs } from 'expo-router';
import { Text } from 'react-native';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#66BB6A',
        tabBarInactiveTintColor: '#999',
        tabBarStyle: {
          height: 60,
          paddingBottom: 8,
          paddingTop: 8,
        },
      }}
    >
      {/* 🏠 Home */}
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: () => <Text style={{ fontSize: 24 }}>🏠</Text>,
        }}
      />

      {/* Hidden routes */}
      <Tabs.Screen name="add-transaction" options={{ href: null }} />
      <Tabs.Screen name="edit-transaction" options={{ href: null }} />

      {/* 💰 Budgets */}
      <Tabs.Screen
        name="budgets"
        options={{
          title: 'Budgets',
          tabBarIcon: () => <Text style={{ fontSize: 24 }}>💰</Text>,
        }}
      />
      <Tabs.Screen name="add-budget" options={{ href: null }} />
      <Tabs.Screen name="edit-budget" options={{ href: null }} />

      {/* 🎯 Goals */}
      <Tabs.Screen
        name="goals"
        options={{
          title: 'Goals',
          tabBarIcon: () => <Text style={{ fontSize: 24 }}>🎯</Text>,
        }}
      />
      <Tabs.Screen name="add-goal" options={{ href: null }} />
      <Tabs.Screen name="edit-goal" options={{ href: null }} />

      {/* 💸 Transactions */}
      <Tabs.Screen
        name="transactions"
        options={{
          title: 'Transactions',
          tabBarIcon: () => <Text style={{ fontSize: 24 }}>💸</Text>,
        }}
      />

      {/* 💵 Cash Flow */}
      <Tabs.Screen
        name="cash-flow"
        options={{
          title: 'Cash Flow',
          tabBarIcon: () => <Text style={{ fontSize: 24 }}>💵</Text>,
        }}
      />

      {/* 📘 Resources */}
      <Tabs.Screen
        name="resources"
        options={{
          title: 'Resources',
          tabBarIcon: () => <Text style={{ fontSize: 24 }}>📘</Text>,
        }}
      />
    </Tabs>
  );
}

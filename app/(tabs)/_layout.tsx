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
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color }) => <Text style={{ fontSize: 24 }}>🏠</Text>,
        }}
      />
      <Tabs.Screen
        name="add-transaction"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="edit-transaction"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="budgets"
        options={{
          title: 'Budgets',
          tabBarIcon: ({ color }) => <Text style={{ fontSize: 24 }}>💰</Text>,
        }}
      />
      <Tabs.Screen
        name="add-budget"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="edit-budget"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="goals"
        options={{
          title: 'Goals',
          tabBarIcon: ({ color }) => <Text style={{ fontSize: 24 }}>🎯</Text>,
        }}
      />
      <Tabs.Screen
        name="add-goal"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="edit-goal"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="cashflow"
        options={{
          title: 'Cash Flow',
          tabBarIcon: ({ color }) => <Text style={{ fontSize: 24 }}>📊</Text>,
        }}
      />
    </Tabs>
  );
}
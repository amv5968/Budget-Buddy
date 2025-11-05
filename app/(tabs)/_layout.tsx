import { Tabs } from 'expo-router';
import { Text } from 'react-native';
import { useTheme } from '../../context/ThemeContext';


export default function TabLayout() {
  const { colors, theme } = useTheme();
  
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textTertiary,
        tabBarStyle: {
          height: 60,
          paddingBottom: 8,
          paddingTop: 8,
          backgroundColor: colors.cardBackground,
          borderTopColor: colors.border,
        },
        tabBarLabelStyle: { fontSize: 12, fontWeight: '600', paddingBottom: 2 },
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
      <Tabs.Screen name="profile" options={{ href: null }} /> 

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
      <Tabs.Screen name="profile-edit" options={{ href: null }} />
      <Tabs.Screen name="privacy"      options={{ href: null }} />
      <Tabs.Screen name="help"         options={{ href: null }} />
      <Tabs.Screen name="about"        options={{ href: null }} />


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

      {/* 🤖 AI Assistant - Hidden from tab bar, accessible via sidebar */}
      <Tabs.Screen
        name="ai-assistant"
        options={{
          href: null,
          title: 'AI Advisor',
        }}
      />

      {/*  Resources - Hidden from tab bar, accessible via sidebar */}
      <Tabs.Screen
        name="resources"
        options={{
          href: null,
          title: 'Resources',
        }}
      />
    </Tabs>
  );
}

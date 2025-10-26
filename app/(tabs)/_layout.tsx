import { Tabs, useRouter } from 'expo-router';
import { Image, Text, TouchableOpacity } from 'react-native';
import { useTheme } from '../../context/ThemeContext';

export default function TabLayout() {
  const { colors } = useTheme();
  const router = useRouter();

  return (
    <Tabs
      screenOptions={{
        headerShown: true,
        headerTitleAlign: 'center',
        headerStyle: { backgroundColor: colors.cardBackground },
        headerTintColor: colors.text,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textTertiary,
        tabBarStyle: {
          height: 60,
          paddingBottom: 8,
          paddingTop: 8,
          backgroundColor: colors.cardBackground,
          borderTopColor: colors.border,
        },
      }}
    >
      {/* 🏠 Home */}
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: () => <Text style={{ fontSize: 24 }}>🏠</Text>,

          // 👤 Profile icon in top-right
          headerRight: () => (
            <TouchableOpacity
              onPress={() => router.push('/profile')}
              style={{ marginRight: 16 }}
            >
              {/* Option 1: Emoji icon */}
              {/* <Text style={{ fontSize: 22, color: colors.primary }}>👤</Text> */}

              {/* Option 2: Small profile image */}
              <Image
                source={{ uri: 'https://i.pravatar.cc/100' }} // replace with user avatar if you have one
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 16,
                  borderWidth: 1,
                  borderColor: colors.border,
                }}
              />
            </TouchableOpacity>
          ),
        }}
      />

      {/* Hidden & normal tabs (unchanged) */}
      <Tabs.Screen name="add-transaction" options={{ href: null }} />
      <Tabs.Screen name="edit-transaction" options={{ href: null }} />

      <Tabs.Screen
        name="budgets"
        options={{
          title: 'Budgets',
          tabBarIcon: () => <Text style={{ fontSize: 24 }}>💰</Text>,
        }}
      />
      <Tabs.Screen name="add-budget" options={{ href: null }} />
      <Tabs.Screen name="edit-budget" options={{ href: null }} />

      <Tabs.Screen
        name="goals"
        options={{
          title: 'Goals',
          tabBarIcon: () => <Text style={{ fontSize: 24 }}>🎯</Text>,
        }}
      />
      <Tabs.Screen name="add-goal" options={{ href: null }} />
      <Tabs.Screen name="edit-goal" options={{ href: null }} />

      <Tabs.Screen
        name="transactions"
        options={{
          title: 'Transactions',
          tabBarIcon: () => <Text style={{ fontSize: 24 }}>💸</Text>,
        }}
      />

      <Tabs.Screen
        name="cash-flow"
        options={{
          title: 'Cash Flow',
          tabBarIcon: () => <Text style={{ fontSize: 24 }}>💵</Text>,
        }}
      />

      <Tabs.Screen
        name="resources"
        options={{
          title: 'Resources',
          tabBarIcon: () => <Text style={{ fontSize: 24 }}>📘</Text>,
        }}
      />

      {/* 👤 Hidden profile screen */}
      <Tabs.Screen name="profile" options={{ href: null }} />
    </Tabs>
  );
}
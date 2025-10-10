import { Tabs } from 'expo-router';

export default function TabsLayout() {
  return (
    <Tabs>
      <Tabs.Screen 
        name="index" 
        options={{ 
          title: 'Dashboard',
          headerShown: true,
        }} 
      />
      <Tabs.Screen 
        name="add-transaction" 
        options={{ 
          title: 'Add Transaction',
          headerShown: true,
        }} 
      />
    </Tabs>
  );
}
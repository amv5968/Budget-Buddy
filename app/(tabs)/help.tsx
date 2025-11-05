import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import { Linking, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useTheme } from '../../context/ThemeContext';

export default function HelpScreen() {
  const router = useRouter();
  const { colors } = useTheme();

  const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    header: {
      flexDirection: 'row', alignItems: 'center',
      paddingHorizontal: 16, paddingTop: 56, paddingBottom: 12,
      backgroundColor: colors.cardBackground,
    },
    title: { marginLeft: 8, fontSize: 18, fontWeight: '700', color: colors.text },
    card: { margin: 16, backgroundColor: colors.cardBackground, borderRadius: 14, padding: 8 },
    row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 14 },
    left: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    text: { color: colors.text },
    chev: { color: colors.textSecondary },
  });

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.title}>Help & Support</Text>
      </View>

      <ScrollView>
        <View style={styles.card}>
          <TouchableOpacity
            style={styles.row}
            onPress={() => Linking.openURL('mailto:support@budgetbuddy.app?subject=Support')}
          >
            <View style={styles.left}>
              <Ionicons name="mail-outline" size={22} color={colors.text} />
              <Text style={styles.text}>Email Support</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} style={styles.chev} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.row}
            onPress={() => Linking.openURL('https://example.com/budget-buddy/faq')}
          >
            <View style={styles.left}>
              <Ionicons name="help-circle-outline" size={22} color={colors.text} />
              <Text style={styles.text}>FAQ</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} style={styles.chev} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.row}
            onPress={() => Linking.openURL('https://example.com/budget-buddy/report')}
          >
            <View className="left" style={styles.left}>
              <Ionicons name="bug-outline" size={22} color={colors.text} />
              <Text style={styles.text}>Report a Bug</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} style={styles.chev} />
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

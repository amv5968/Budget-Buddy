import { Ionicons } from '@expo/vector-icons';
import Constants from 'expo-constants';
import { useRouter } from 'expo-router';
import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useTheme } from '../../context/ThemeContext';

export default function AboutScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const version =
    (Constants?.expoConfig as any)?.version ||
    (Constants?.manifest as any)?.version ||
    '1.0.0';

  const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    header: {
      flexDirection: 'row', alignItems: 'center',
      paddingHorizontal: 16, paddingTop: 56, paddingBottom: 12,
      backgroundColor: colors.cardBackground,
    },
    title: { marginLeft: 8, fontSize: 18, fontWeight: '700', color: colors.text },
    card: { margin: 16, backgroundColor: colors.cardBackground, borderRadius: 14, padding: 16, gap: 8 },
    name: { fontSize: 18, fontWeight: '700', color: colors.text },
    muted: { color: colors.textSecondary },
  });

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.title}>About</Text>
      </View>

      <ScrollView>
        <View style={styles.card}>
          <Text style={styles.name}>Budget Buddy</Text>
          <Text style={styles.muted}>Version {version}</Text>
          <Text style={styles.muted}>
            Budget Buddy helps you track income, expenses, and monthly allowance with a simple, clean UI.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

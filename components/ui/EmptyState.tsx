import { StyleSheet, Text, View } from 'react-native';

type Props = {
  title?: string;
  subtitle?: string;
  emoji?: string;
};

export default function EmptyState({
  title = 'No transactions',
  subtitle = 'Try changing filters or add a new transaction.',
  emoji = '🧾',
}: Props) {
  return (
    <View style={styles.wrap}>
      <Text style={styles.emoji}>{emoji}</Text>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.subtitle}>{subtitle}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', paddingVertical: 40, gap: 6 },
  emoji: { fontSize: 36, marginBottom: 6 },
  title: { fontSize: 16, fontWeight: '700', color: '#333' },
  subtitle: { fontSize: 13, color: '#777', textAlign: 'center', paddingHorizontal: 24 },
});

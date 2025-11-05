import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Switch, Text, TouchableOpacity, View } from 'react-native';
import { useTheme } from '../../context/ThemeContext';

const STORE_KEY = 'privacy_prefs_v1';

export default function PrivacyScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const [marketingEmails, setMarketingEmails] = useState(false);
  const [dataSharing, setDataSharing] = useState(false);

  useEffect(() => {
    (async () => {
      const raw = await AsyncStorage.getItem(STORE_KEY);
      if (raw) {
        const s = JSON.parse(raw);
        setMarketingEmails(!!s.marketingEmails);
        setDataSharing(!!s.dataSharing);
      }
    })();
  }, []);

  const save = async () => {
    await AsyncStorage.setItem(STORE_KEY, JSON.stringify({ marketingEmails, dataSharing }));
    Alert.alert('Saved', 'Your privacy preferences were updated.');
    router.back();
  };

  const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    header: {
      flexDirection: 'row', alignItems: 'center',
      paddingHorizontal: 16, paddingTop: 56, paddingBottom: 12,
      backgroundColor: colors.cardBackground,
    },
    title: { marginLeft: 8, fontSize: 18, fontWeight: '700', color: colors.text },
    card: { margin: 16, backgroundColor: colors.cardBackground, borderRadius: 14, padding: 16 },
    row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 12 },
    left: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    text: { color: colors.text },
    saveBtn: { margin: 16, backgroundColor: colors.primary, padding: 14, borderRadius: 12, alignItems: 'center' },
    saveText: { color: 'white', fontWeight: '700' },
  });

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.title}>Privacy & Security</Text>
      </View>

      <ScrollView>
        <View style={styles.card}>
          <View style={styles.row}>
            <View style={styles.left}>
              <Ionicons name="mail-outline" size={22} color={colors.text} />
              <Text style={styles.text}>Allow marketing emails</Text>
            </View>
            <Switch value={marketingEmails} onValueChange={setMarketingEmails} />
          </View>

          <View style={styles.row}>
            <View style={styles.left}>
              <Ionicons name="share-social-outline" size={22} color={colors.text} />
              <Text style={styles.text}>Allow anonymized analytics</Text>
            </View>
            <Switch value={dataSharing} onValueChange={setDataSharing} />
          </View>
        </View>

        <TouchableOpacity style={styles.saveBtn} onPress={save}>
          <Text style={styles.saveText}>Save</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

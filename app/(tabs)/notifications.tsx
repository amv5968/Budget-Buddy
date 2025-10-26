import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    Alert, ScrollView, StyleSheet, Switch, Text,
    TouchableOpacity, View,
} from 'react-native';
import { scheduleWeeklySummary } from '../services/notificationService'; // adjust path if needed

const SETTINGS_KEY = 'bb.settings.v1';

type SettingsState = {
  weeklySummary: boolean;            // send me a Monday report
  lowBalance: boolean;               // alert me if balance < X
  lowBalanceThreshold: number;       // that X
  largeTx: boolean;                  // alert me on big purchase
  largeTxThreshold: number;          // "big" = $
};

const DEFAULT_SETTINGS: SettingsState = {
  weeklySummary: true,
  lowBalance: true,
  lowBalanceThreshold: 100,
  largeTx: true,
  largeTxThreshold: 100,
};

export default function NotificationsScreen() {
  const router = useRouter();

  const [settings, setSettings] = useState<SettingsState>(DEFAULT_SETTINGS);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
  (async () => {
    // iOS needs permission, Android 13+ also needs it
    const { status } = await Notifications.getPermissionsAsync();
    if (status !== 'granted') {
      const req = await Notifications.requestPermissionsAsync();
      if (req.status !== 'granted') {
        Alert.alert(
          'Notifications disabled',
          'To get alerts (low balance, large purchases, weekly summary) please enable notifications in Settings.'
        );
      }
    }
  })();
}, []);

  // 1. load from AsyncStorage
  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(SETTINGS_KEY);
        if (raw) {
          const parsed = JSON.parse(raw);
          // merge to avoid missing new keys
          setSettings({ ...DEFAULT_SETTINGS, ...parsed });
        }
      } catch (e) {
        console.warn('Failed to load notification settings:', e);
      } finally {
        setLoaded(true);
      }
    })();
  }, []);

  // helper to save state + optional side effect (like scheduling notifications)
  const updateSetting = async (
    patch: Partial<SettingsState>,
    after?: () => Promise<void> | void
  ) => {
    try {
      const next = { ...settings, ...patch };
      setSettings(next);
      await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(next));
      if (after) {
        await after();
      }
    } catch (e) {
      console.error('Failed to save setting', e);
      Alert.alert('Error', 'Could not update setting.');
    }
  };

  if (!loaded) {
    return (
      <View style={styles.loadingWrap}>
        <Text style={styles.loadingText}>Loading…</Text>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={10}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>

        <Text style={styles.headerTitle}>Notifications</Text>

        {/* spacer block to center title */}
        <View style={{ width: 50 }} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={{ paddingBottom: 40 }}
      >
        {/* SECTION: Weekly Summary */}
        <View style={styles.section}>
          <Text style={styles.sectionHeader}>Weekly Summary</Text>

          <View style={styles.row}>
            <View style={styles.rowTextWrap}>
              <Text style={styles.rowTitle}>Email-style Summary</Text>
              <Text style={styles.rowDesc}>
                Get a Monday morning recap of income, spending, and balance.
              </Text>
            </View>

            <Switch
              value={settings.weeklySummary}
              onValueChange={async (val) => {
                await updateSetting(
                  { weeklySummary: val },
                  async () => {
                    // re-schedule or cancel local push
                    await scheduleWeeklySummary(val);
                  }
                );
              }}
            />
          </View>
        </View>

        {/* SECTION: Balance Alerts */}
        <View style={styles.section}>
          <Text style={styles.sectionHeader}>Balance Alerts</Text>

          <View style={styles.row}>
            <View style={styles.rowTextWrap}>
              <Text style={styles.rowTitle}>Low Balance Alert</Text>
              <Text style={styles.rowDesc}>
                Warn me if my balance drops below $
                {settings.lowBalanceThreshold}
              </Text>
            </View>

            <Switch
              value={settings.lowBalance}
              onValueChange={async (val) => {
                await updateSetting({ lowBalance: val });
              }}
            />
          </View>

          {/* (Optional) threshold display, read-only for MVP */}
          <View style={styles.subRow}>
            <Text style={styles.subRowLabel}>Threshold</Text>
            <Text style={styles.subRowValue}>
              ${settings.lowBalanceThreshold}
            </Text>
          </View>
        </View>

        {/* SECTION: Spending Alerts */}
        <View style={styles.section}>
          <Text style={styles.sectionHeader}>Spending Alerts</Text>

          <View style={styles.row}>
            <View style={styles.rowTextWrap}>
              <Text style={styles.rowTitle}>Large Purchase Alert</Text>
              <Text style={styles.rowDesc}>
                Notify me if I spend more than $
                {settings.largeTxThreshold} in one transaction.
              </Text>
            </View>

            <Switch
              value={settings.largeTx}
              onValueChange={async (val) => {
                await updateSetting({ largeTx: val });
              }}
            />
          </View>

          {/* (Optional) threshold display, read-only for MVP */}
          <View style={styles.subRow}>
            <Text style={styles.subRowLabel}>Threshold</Text>
            <Text style={styles.subRowValue}>
              ${settings.largeTxThreshold}
            </Text>
          </View>
        </View>

        {/* We are NOT rendering fake “Recent notifications”. */}
      </ScrollView>
    </View>
  );
}

const BORDER = '#E0E0E0';
const BG_APP = '#F6F6F6';
const BG_CARD = '#FFFFFF';
const TEXT_MAIN = '#222';
const TEXT_SUB = '#555';
const ACCENT = '#2E7D32';

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: BG_APP,
  },
  header: {
    paddingTop: 60,
    paddingBottom: 16,
    paddingHorizontal: 20,
    backgroundColor: BG_CARD,
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  backText: {
    color: ACCENT,
    fontWeight: '600',
    fontSize: 16,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: TEXT_MAIN,
  },
  scroll: {
    flex: 1,
  },
  section: {
    backgroundColor: BG_CARD,
    marginTop: 16,
    paddingHorizontal: 16,
    paddingVertical: 20,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: BORDER,
  },
  sectionHeader: {
    fontSize: 16,
    fontWeight: '700',
    color: TEXT_MAIN,
    marginBottom: 12,
  },
  row: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
    paddingVertical: 12,
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  rowTextWrap: {
    flex: 1,
    paddingRight: 12,
  },
  rowTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: TEXT_MAIN,
    marginBottom: 4,
  },
  rowDesc: {
    fontSize: 13,
    color: TEXT_SUB,
    lineHeight: 18,
  },
  subRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
  },
  subRowLabel: {
    fontSize: 13,
    color: TEXT_SUB,
  },
  subRowValue: {
    fontSize: 13,
    fontWeight: '600',
    color: TEXT_MAIN,
  },
  loadingWrap: {
    flex: 1,
    backgroundColor: BG_APP,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    color: TEXT_SUB,
    fontSize: 15,
  },
});

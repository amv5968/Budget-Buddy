import AsyncStorage from '@react-native-async-storage/async-storage';

const DASHBOARD_PREFS_KEY = '@dashboard_preferences';

export interface DashboardPreferences {
  showSummary: boolean;
  showAllowance: boolean;
  showCharts: boolean;
  showCalendar: boolean;
  showTransactions: boolean;
  showGoals: boolean;
  showBudgets: boolean;
}

const DEFAULT_PREFERENCES: DashboardPreferences = {
  showSummary: true,
  showAllowance: true,
  showCharts: true,
  showCalendar: true,
  showTransactions: true,
  showGoals: true,
  showBudgets: true,
};

export const getDashboardPreferences = async (): Promise<DashboardPreferences> => {
  try {
    const stored = await AsyncStorage.getItem(DASHBOARD_PREFS_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
    return DEFAULT_PREFERENCES;
  } catch (error) {
    console.error('Error loading dashboard preferences:', error);
    return DEFAULT_PREFERENCES;
  }
};

export const saveDashboardPreferences = async (preferences: DashboardPreferences): Promise<void> => {
  try {
    await AsyncStorage.setItem(DASHBOARD_PREFS_KEY, JSON.stringify(preferences));
  } catch (error) {
    console.error('Error saving dashboard preferences:', error);
    throw error;
  }
};

export const resetDashboardPreferences = async (): Promise<void> => {
  try {
    await AsyncStorage.removeItem(DASHBOARD_PREFS_KEY);
  } catch (error) {
    console.error('Error resetting dashboard preferences:', error);
    throw error;
  }
};


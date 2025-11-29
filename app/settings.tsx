import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { scheduleDailyTransactionReminder, scheduleWeeklySummary } from './services/notificationService';
import { getSubscriptions, deleteSubscription } from './services/subscriptionService';

const SETTINGS_KEY = 'bb.settings.v1';

export default function SettingsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const returnTo = (params.returnTo as string) || '/(tabs)';
  const { theme, themeMode, setThemeMode, colors } = useTheme();

  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [weeklySummary, setWeeklySummary] = useState(true);
  const [budgetAlerts, setBudgetAlerts] = useState(true);
  const [goalUpdates, setGoalUpdates] = useState(true);
  const [lowBalanceAlert, setLowBalanceAlert] = useState(true);
  const [largeTransactionAlert, setLargeTransactionAlert] = useState(true);
  const [transactionAlerts, setTransactionAlerts] = useState(true);
  const [dailySummaryAlert, setDailySummaryAlert] = useState(true);
  
  const [lowBalanceThreshold, setLowBalanceThreshold] = useState('50');
  const [largeTransactionThreshold, setLargeTransactionThreshold] = useState('100');
  
  // Time settings
  const [dailySummaryHour, setDailySummaryHour] = useState('20');
  const [dailySummaryMinute, setDailySummaryMinute] = useState('0');
  const [weeklySummaryHour, setWeeklySummaryHour] = useState('9');
  const [weeklySummaryMinute, setWeeklySummaryMinute] = useState('0');
  
  const [currency, setCurrency] = useState('USD');
  
  const [notifications, setNotifications] = useState([
    {
      id: '1',
      type: 'warning',
      title: 'Budget Alert',
      message: "You've spent 85% of your Food budget this month. Consider reducing dining out.",
      date: new Date().toISOString(),
      read: false,
      icon: '🍔',
    },
    {
      id: '2',
      type: 'success',
      title: 'Goal Milestone',
      message: "Great job! You're 50% of the way to your 'Emergency Fund' goal. Keep saving!",
      date: new Date(Date.now() - 86400000).toISOString(),
      read: false,
      icon: '🎯',
    },
  ]);

  // Billing/Subscription state
  const [currentPlan, setCurrentPlan] = useState<'monthly' | 'yearly' | null>(null);
  const [subscriptionStatus, setSubscriptionStatus] = useState<'active' | 'cancelled' | 'expired'>('expired');
  const [nextBillingDate, setNextBillingDate] = useState(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000));

  // Load settings on mount
  useEffect(() => {
    loadSettings();
  }, []);

  // Reload settings when screen comes into focus (to update subscription status)
  useFocusEffect(
    useCallback(() => {
      loadSettings();
    }, [])
  );

  const loadSettings = async () => {
    try {
      const raw = await AsyncStorage.getItem(SETTINGS_KEY);
      if (raw) {
        const settings = JSON.parse(raw);
        setNotificationsEnabled(settings.notificationsEnabled ?? true);
        setWeeklySummary(settings.weeklySummary ?? true);
        setBudgetAlerts(settings.budgetAlerts ?? true);
        setGoalUpdates(settings.goalUpdates ?? true);
        setLowBalanceAlert(settings.lowBalance ?? true);
        setLargeTransactionAlert(settings.largeTx ?? true);
        setTransactionAlerts(settings.transactionAlerts ?? true);
        setDailySummaryAlert(settings.dailySummaryAlert ?? true);
        setLowBalanceThreshold(settings.lowBalanceThreshold?.toString() ?? '50');
        setLargeTransactionThreshold(settings.largeTxThreshold?.toString() ?? '100');
        setDailySummaryHour(settings.dailySummaryHour?.toString() ?? '20');
        setDailySummaryMinute(settings.dailySummaryMinute?.toString() ?? '0');
        setWeeklySummaryHour(settings.weeklySummaryHour?.toString() ?? '9');
        setWeeklySummaryMinute(settings.weeklySummaryMinute?.toString() ?? '0');
        setCurrency(settings.currency ?? 'USD');
        
        // Load subscription status
        if (settings.subscription) {
          const nextBilling = settings.subscription.nextBillingDate 
            ? new Date(settings.subscription.nextBillingDate) 
            : null;
          
          // Check if subscription has expired (if status is cancelled or expired, or date has passed)
          if (nextBilling && nextBilling < new Date() && settings.subscription.status === 'cancelled') {
            // Subscription has expired, clear it
            settings.subscription = null;
            await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
            setCurrentPlan(null);
            setSubscriptionStatus('expired');
          } else {
            setCurrentPlan(settings.subscription.plan);
            setSubscriptionStatus(settings.subscription.status);
            if (nextBilling) {
              setNextBillingDate(nextBilling);
            }
          }
        } else {
          // No subscription found, ensure state is cleared
          setCurrentPlan(null);
          setSubscriptionStatus('expired');
        }
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  };

  const validateTimeInput = (value: string, max: number): string => {
    const num = parseInt(value) || 0;
    return Math.min(Math.max(0, num), max).toString();
  };

const handleSave = async () => {
  try {
    const settings = {
      notificationsEnabled,
      weeklySummary,
      budgetAlerts,
      goalUpdates,
      lowBalance: lowBalanceAlert,
      largeTx: largeTransactionAlert,
      transactionAlerts,
      dailySummaryAlert,
      lowBalanceThreshold: parseFloat(lowBalanceThreshold) || 50,
      largeTxThreshold: parseFloat(largeTransactionThreshold) || 100,
      dailySummaryHour: parseInt(dailySummaryHour) || 20,
      dailySummaryMinute: parseInt(dailySummaryMinute) || 0,
      weeklySummaryHour: parseInt(weeklySummaryHour) || 9,
      weeklySummaryMinute: parseInt(weeklySummaryMinute) || 0,
      currency,
    };

    await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));

    // Update notification schedules with custom times
    if (notificationsEnabled && weeklySummary) {
      await scheduleWeeklySummary(
        true, 
        settings.weeklySummaryHour, 
        settings.weeklySummaryMinute
      );
    } else {
      await scheduleWeeklySummary(false);
    }

    if (notificationsEnabled && dailySummaryAlert) {
      await scheduleDailyTransactionReminder(
        true,
        settings.dailySummaryHour,
        settings.dailySummaryMinute
      );
    } else {
      await scheduleDailyTransactionReminder(false);
    }

    Alert.alert('✅ Settings Saved', 'Your preferences have been updated and notifications have been rescheduled.');
  } catch (error) {
    console.error('Error saving settings:', error);
    Alert.alert('Error', 'Failed to save settings');
  }
};

  const formatTime = (hour: string, minute: string): string => {
    const h = parseInt(hour) || 0;
    const m = parseInt(minute) || 0;
    const period = h >= 12 ? 'PM' : 'AM';
    const displayHour = h === 0 ? 12 : h > 12 ? h - 12 : h;
    return `${displayHour}:${m.toString().padStart(2, '0')} ${period}`;
  };

  const dynamicStyles = StyleSheet.create({
    container: {
      flexGrow: 1,
      backgroundColor: colors.background,
      paddingTop: 60,
      paddingHorizontal: 20,
      paddingBottom: 50,
    },
    headerRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 25,
    },
    backButton: {
      marginRight: 12,
      padding: 8,
    },
    backText: {
      fontSize: 16,
      color: '#2196F3',
      fontWeight: '600',
    },
    header: {
      fontSize: 26,
      fontWeight: 'bold',
      color: colors.text,
    },
    section: {
      backgroundColor: colors.cardBackground,
      borderRadius: 12,
      padding: 20,
      marginBottom: 20,
    },
    sectionHeader: {
      fontSize: 18,
      fontWeight: 'bold',
      marginBottom: 15,
      color: colors.text,
    },
    row: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 15,
    },
    label: {
      fontSize: 16,
      color: colors.text,
    },
    subLabel: {
      fontSize: 14,
      marginTop: 10,
      marginBottom: 5,
      color: colors.textSecondary,
    },
    input: {
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 10,
      padding: 10,
      marginTop: 5,
      color: colors.text,
      backgroundColor: colors.background,
    },
    timeInputContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: 5,
      marginBottom: 15,
    },
    timeInput: {
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 10,
      padding: 10,
      color: colors.text,
      backgroundColor: colors.background,
      width: 60,
      textAlign: 'center',
      fontSize: 16,
      fontWeight: '600',
    },
    timeSeparator: {
      fontSize: 20,
      fontWeight: 'bold',
      color: colors.text,
      marginHorizontal: 8,
    },
    timePreview: {
      marginLeft: 12,
      fontSize: 14,
      color: colors.primary,
      fontWeight: '600',
    },
    saveButton: {
      backgroundColor: colors.primary,
      paddingVertical: 15,
      borderRadius: 12,
      alignItems: 'center',
      elevation: 3,
    },
    saveButtonText: {
      color: '#fff',
      fontWeight: 'bold',
      fontSize: 16,
    },
    themeOption: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 12,
      borderRadius: 8,
      marginBottom: 10,
      borderWidth: 2,
    },
    themeOptionSelected: {
      borderColor: colors.primary,
      backgroundColor: colors.primary + '20',
    },
    themeOptionUnselected: {
      borderColor: colors.border,
      backgroundColor: 'transparent',
    },
    themeOptionText: {
      fontSize: 16,
      marginLeft: 10,
      color: colors.text,
    },
    // Billing styles
    currentPlanCard: {
      padding: 20,
      borderRadius: 12,
      marginBottom: 20,
      borderWidth: 2,
      elevation: 2,
    },
    planTitle: {
      fontSize: 20,
      fontWeight: '700',
      marginBottom: 4,
    },
    planPrice: {
      fontSize: 18,
      fontWeight: '600',
    },
    statusBadge: {
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 20,
    },
    statusText: {
      color: '#fff',
      fontSize: 12,
      fontWeight: '700',
    },
    billingInfo: {
      paddingTop: 12,
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },
    billingLabel: {
      fontSize: 12,
      marginBottom: 4,
      textTransform: 'uppercase',
      fontWeight: '600',
    },
    billingDate: {
      fontSize: 16,
      fontWeight: '600',
    },
    manageBillingButton: {
      paddingVertical: 12,
      borderRadius: 8,
      alignItems: 'center',
    },
    manageBillingText: {
      color: '#fff',
      fontSize: 14,
      fontWeight: '600',
    },
    subSectionTitle: {
      fontSize: 16,
      fontWeight: '700',
      marginBottom: 12,
      marginTop: 8,
    },
    planOption: {
      padding: 20,
      borderRadius: 12,
      marginBottom: 16,
      borderWidth: 2,
      elevation: 2,
    },
    planOptionTitle: {
      fontSize: 18,
      fontWeight: '700',
      marginBottom: 4,
    },
    planOptionDesc: {
      fontSize: 14,
      marginBottom: 8,
    },
    planOptionPrice: {
      fontSize: 28,
      fontWeight: '800',
    },
    yearlyEquivalent: {
      fontSize: 13,
      fontStyle: 'italic',
      marginTop: 2,
    },
    currentBadge: {
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 20,
    },
    currentBadgeText: {
      color: '#fff',
      fontSize: 12,
      fontWeight: '700',
    },
    saveBadgeContainer: {
      position: 'absolute',
      top: -10,
      right: 10,
      zIndex: 1,
    },
    saveBadge: {
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 20,
    },
    saveBadgeText: {
      color: '#fff',
      fontSize: 12,
      fontWeight: '700',
    },
    featuresList: {
      marginTop: 12,
      paddingTop: 12,
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },
    featureItem: {
      fontSize: 14,
      marginBottom: 6,
    },
    cancelButton: {
      paddingVertical: 14,
      borderRadius: 10,
      borderWidth: 2,
      alignItems: 'center',
      marginTop: 8,
      marginBottom: 16,
    },
    cancelButtonText: {
      fontSize: 15,
      fontWeight: '600',
    },
    billingDisclaimer: {
      padding: 12,
      borderRadius: 8,
      borderWidth: 1,
    },
    disclaimerTextSmall: {
      fontSize: 12,
      lineHeight: 18,
    },
  });

  const handleGoBack = () => {
    router.navigate(returnTo as any);
  };

  // Billing handlers
  const handleSelectPlan = (plan: 'monthly' | 'yearly') => {
    // If user already has an active subscription and is changing plans, show confirmation
    if (currentPlan && subscriptionStatus === 'active' && currentPlan !== plan) {
      const currentPlanName = currentPlan === 'monthly' ? 'Monthly ($14/month)' : 'Yearly ($100/year)';
      const newPlanName = plan === 'monthly' ? 'Monthly ($14/month)' : 'Yearly ($100/year - Save $68!)';
      
      Alert.alert(
        'Change Subscription Plan',
        `Switch from ${currentPlanName} to ${newPlanName}?\n\nYou'll be charged for the new plan immediately.`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Change Plan',
            onPress: () => {
              // Navigate to payment screen
              router.push({
                pathname: '/subscription-payment' as any,
                params: { plan },
              });
            },
          },
        ]
      );
    } else {
      // New subscription or resubscribing
      router.push({
        pathname: '/subscription-payment' as any,
        params: { plan },
      });
    }
  };

  const handleCancelSubscription = async () => {
    Alert.alert(
      '⚠️ Cancel Subscription',
      `Are you sure you want to cancel your subscription?\n\nYou'll lose access to premium features at the end of your billing period (${nextBillingDate.toLocaleDateString()}).`,
      [
        { text: 'Keep Subscription', style: 'cancel' },
        {
          text: 'Yes, Cancel',
          style: 'destructive',
          onPress: async () => {
            try {
              // Update subscription status in AsyncStorage
              const raw = await AsyncStorage.getItem(SETTINGS_KEY);
              const settings = raw ? JSON.parse(raw) : {};
              
              if (settings.subscription) {
                settings.subscription.status = 'cancelled';
                await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
              }
              
              // Delete Budget Buddy Premium subscription from subscriptions list
              try {
                const existingSubs = await getSubscriptions();
                const existingPremiumSub = existingSubs.find((sub: any) => 
                  sub.name.includes('Budget Buddy Premium')
                );
                
                if (existingPremiumSub) {
                  await deleteSubscription(existingPremiumSub._id);
                  console.log('Deleted Budget Buddy Premium subscription from subscriptions list');
                }
              } catch (subError) {
                console.error('Error deleting subscription from list:', subError);
                // Continue anyway - subscription status is already updated
              }
              
              setSubscriptionStatus('cancelled');
              Alert.alert(
                'Subscription Cancelled',
                `Your subscription has been cancelled. You'll have access until ${nextBillingDate.toLocaleDateString()}.`
              );
            } catch (error) {
              console.error('Error cancelling subscription:', error);
              Alert.alert('Error', 'Failed to cancel subscription. Please try again.');
            }
          },
        },
      ]
    );
  };

  const handleChangePlan = (newPlan: 'monthly' | 'yearly') => {
    // Navigate to payment screen to change plan
    router.push({
      pathname: '/subscription-payment' as any,
      params: { plan: newPlan },
    });
  };

  const handleManageBilling = () => {
    Alert.alert(
      'Manage Billing',
      'Manage your subscription and payment information.',
      [
        { 
          text: 'Update Payment Method', 
          onPress: () => {
            // Navigate to payment screen to update payment method
            router.push({
              pathname: '/subscription-payment' as any,
              params: { plan: currentPlan || 'monthly' },
            });
          }
        },
        { 
          text: 'View Subscription Details', 
          onPress: () => {
            Alert.alert(
              'Subscription Details',
              `Plan: ${currentPlan === 'monthly' ? 'Monthly Premium' : 'Yearly Premium'}\n` +
              `Status: ${subscriptionStatus === 'active' ? 'Active' : 'Cancelled'}\n` +
              `Next billing: ${formatDate(nextBillingDate)}`
            );
          }
        },
        { text: 'Close', style: 'cancel' },
      ]
    );
  };

  const formatDate = (date: Date): string => {
    return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  };

  return (
    <ScrollView contentContainerStyle={dynamicStyles.container}>
      {/* Header with Back Button */}
      <View style={dynamicStyles.headerRow}>
        <TouchableOpacity onPress={handleGoBack} style={dynamicStyles.backButton}>
          <Text style={dynamicStyles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={dynamicStyles.header}>Settings</Text>
      </View>

      {/* Appearance Section */}
      <View style={dynamicStyles.section}>
        <Text style={dynamicStyles.sectionHeader}>Appearance</Text>
        
        <TouchableOpacity
          style={[
            dynamicStyles.themeOption,
            themeMode === 'light' ? dynamicStyles.themeOptionSelected : dynamicStyles.themeOptionUnselected
          ]}
          onPress={() => setThemeMode('light')}
        >
          <Text style={{ fontSize: 24 }}>☀️</Text>
          <Text style={dynamicStyles.themeOptionText}>Light Mode</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            dynamicStyles.themeOption,
            themeMode === 'dark' ? dynamicStyles.themeOptionSelected : dynamicStyles.themeOptionUnselected
          ]}
          onPress={() => setThemeMode('dark')}
        >
          <Text style={{ fontSize: 24 }}>🌙</Text>
          <Text style={dynamicStyles.themeOptionText}>Dark Mode</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            dynamicStyles.themeOption,
            themeMode === 'auto' ? dynamicStyles.themeOptionSelected : dynamicStyles.themeOptionUnselected
          ]}
          onPress={() => setThemeMode('auto')}
        >
          <Text style={{ fontSize: 24 }}>🔄</Text>
          <Text style={dynamicStyles.themeOptionText}>Auto (System)</Text>
        </TouchableOpacity>
      </View>

      {/* Billing & Subscription Section */}
      <View style={dynamicStyles.section}>
        <Text style={dynamicStyles.sectionHeader}>💳 Billing & Subscription</Text>
        
        {/* Current Plan Status */}
        {currentPlan && subscriptionStatus !== 'expired' && (
          <View style={[dynamicStyles.currentPlanCard, { backgroundColor: colors.primary + '15', borderColor: colors.primary }]}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <View>
                <Text style={[dynamicStyles.planTitle, { color: colors.text }]}>
                  ✨ {currentPlan === 'monthly' ? 'Monthly Premium' : 'Yearly Premium'}
                </Text>
                <Text style={[dynamicStyles.planPrice, { color: colors.primary }]}>
                  {currentPlan === 'monthly' ? '$14/month' : '$100/year'}
                </Text>
              </View>
              <View style={[dynamicStyles.statusBadge, { 
                backgroundColor: subscriptionStatus === 'active' ? '#4CAF50' : 
                                 subscriptionStatus === 'cancelled' ? '#FF9800' : '#F44336' 
              }]}>
                <Text style={dynamicStyles.statusText}>
                  {subscriptionStatus === 'active' ? '✓ Active' : 
                   subscriptionStatus === 'cancelled' ? '⏸ Cancelled' : '✗ Expired'}
                </Text>
              </View>
            </View>
            
            <View style={dynamicStyles.billingInfo}>
              <Text style={[dynamicStyles.billingLabel, { color: colors.textSecondary }]}>
                {subscriptionStatus === 'active' ? 'Next billing date:' : 'Access until:'}
              </Text>
              <Text style={[dynamicStyles.billingDate, { color: colors.text }]}>
                {formatDate(nextBillingDate)}
              </Text>
            </View>

            {subscriptionStatus === 'active' && (
              <View style={{ marginTop: 12 }}>
                <TouchableOpacity
                  style={[dynamicStyles.manageBillingButton, { backgroundColor: colors.primary }]}
                  onPress={handleManageBilling}
                >
                  <Text style={dynamicStyles.manageBillingText}>Manage Billing</Text>
                </TouchableOpacity>
              </View>
            )}

            {subscriptionStatus === 'cancelled' && (
              <View style={{ marginTop: 12 }}>
                <TouchableOpacity
                  style={[dynamicStyles.manageBillingButton, { backgroundColor: colors.primary }]}
                  onPress={() => handleSelectPlan(currentPlan)}
                >
                  <Text style={dynamicStyles.manageBillingText}>Resubscribe</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}

        {/* Plan Options */}
        <Text style={[dynamicStyles.subSectionTitle, { color: colors.text }]}>
          {currentPlan && subscriptionStatus === 'active' ? 'Change Plan' : currentPlan && subscriptionStatus === 'cancelled' ? 'Resubscribe' : 'Choose Your Plan'}
        </Text>
        
        {/* Monthly Plan */}
        <TouchableOpacity
          style={[
            dynamicStyles.planOption,
            { 
              borderColor: currentPlan === 'monthly' && subscriptionStatus === 'active' ? colors.primary : colors.border,
              backgroundColor: currentPlan === 'monthly' && subscriptionStatus === 'active' ? colors.primary + '10' : colors.cardBackground 
            }
          ]}
          onPress={() => handleSelectPlan('monthly')}
          disabled={currentPlan === 'monthly' && subscriptionStatus === 'active'}
        >
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <View style={{ flex: 1 }}>
              <Text style={[dynamicStyles.planOptionTitle, { color: colors.text }]}>
                📅 Monthly Plan
              </Text>
              <Text style={[dynamicStyles.planOptionDesc, { color: colors.textSecondary }]}>
                Perfect for getting started
              </Text>
              <Text style={[dynamicStyles.planOptionPrice, { color: colors.primary }]}>
                $14 <Text style={{ fontSize: 14, color: colors.textSecondary }}>/month</Text>
              </Text>
            </View>
            {currentPlan === 'monthly' && subscriptionStatus === 'active' && (
              <View style={[dynamicStyles.currentBadge, { backgroundColor: colors.primary }]}>
                <Text style={dynamicStyles.currentBadgeText}>Current</Text>
              </View>
            )}
          </View>
          <View style={dynamicStyles.featuresList}>
            <Text style={[dynamicStyles.featureItem, { color: colors.text }]}>✓ All premium features</Text>
            <Text style={[dynamicStyles.featureItem, { color: colors.text }]}>✓ Priority support</Text>
            <Text style={[dynamicStyles.featureItem, { color: colors.text }]}>✓ Cancel anytime</Text>
          </View>
        </TouchableOpacity>

        {/* Yearly Plan */}
        <TouchableOpacity
          style={[
            dynamicStyles.planOption,
            { 
              borderColor: currentPlan === 'yearly' && subscriptionStatus === 'active' ? colors.primary : colors.border,
              backgroundColor: currentPlan === 'yearly' && subscriptionStatus === 'active' ? colors.primary + '10' : colors.cardBackground 
            }
          ]}
          onPress={() => handleSelectPlan('yearly')}
          disabled={currentPlan === 'yearly' && subscriptionStatus === 'active'}
        >
          <View style={dynamicStyles.saveBadgeContainer}>
            <View style={[dynamicStyles.saveBadge, { backgroundColor: '#4CAF50' }]}>
              <Text style={dynamicStyles.saveBadgeText}>💰 SAVE $68</Text>
            </View>
          </View>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <View style={{ flex: 1 }}>
              <Text style={[dynamicStyles.planOptionTitle, { color: colors.text }]}>
                📊 Yearly Plan
              </Text>
              <Text style={[dynamicStyles.planOptionDesc, { color: colors.textSecondary }]}>
                Best value - save 40%!
              </Text>
              <Text style={[dynamicStyles.planOptionPrice, { color: colors.primary }]}>
                $100 <Text style={{ fontSize: 14, color: colors.textSecondary }}>/year</Text>
              </Text>
              <Text style={[dynamicStyles.yearlyEquivalent, { color: colors.textSecondary }]}>
                Only $8.33/month
              </Text>
            </View>
            {currentPlan === 'yearly' && subscriptionStatus === 'active' && (
              <View style={[dynamicStyles.currentBadge, { backgroundColor: colors.primary }]}>
                <Text style={dynamicStyles.currentBadgeText}>Current</Text>
              </View>
            )}
          </View>
          <View style={dynamicStyles.featuresList}>
            <Text style={[dynamicStyles.featureItem, { color: colors.text }]}>✓ All premium features</Text>
            <Text style={[dynamicStyles.featureItem, { color: colors.text }]}>✓ Priority support</Text>
            <Text style={[dynamicStyles.featureItem, { color: colors.text }]}>✓ 2 months FREE</Text>
          </View>
        </TouchableOpacity>

        {/* Cancel Subscription Button */}
        {currentPlan && subscriptionStatus === 'active' && (
          <TouchableOpacity
            style={[dynamicStyles.cancelButton, { borderColor: colors.expense }]}
            onPress={handleCancelSubscription}
          >
            <Text style={[dynamicStyles.cancelButtonText, { color: colors.expense }]}>
              Cancel Subscription
            </Text>
          </TouchableOpacity>
        )}

        {/* Billing Disclaimer */}
        <View style={[dynamicStyles.billingDisclaimer, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}>
          <Text style={[dynamicStyles.disclaimerTextSmall, { color: colors.textSecondary }]}>
            • Subscriptions auto-renew unless cancelled{'\n'}
            • Cancel anytime before renewal{'\n'}
            • All prices in USD{'\n'}
            • Secure payment processing
          </Text>
        </View>
      </View>

      {/* Notifications Section */}
      <View style={dynamicStyles.section}>
        <Text style={dynamicStyles.sectionHeader}>Notifications</Text>

        <View style={dynamicStyles.row}>
          <Text style={dynamicStyles.label}>Enable Notifications</Text>
          <Switch 
            value={notificationsEnabled} 
            onValueChange={setNotificationsEnabled} 
            trackColor={{ true: colors.primary }}
          />
        </View>

        <View style={dynamicStyles.row}>
          <Text style={dynamicStyles.label}>Transaction Alerts</Text>
          <Switch 
            value={transactionAlerts} 
            onValueChange={setTransactionAlerts} 
            trackColor={{ true: colors.primary }}
            disabled={!notificationsEnabled}
          />
        </View>

        <View style={dynamicStyles.row}>
          <Text style={dynamicStyles.label}>Daily Summary</Text>
          <Switch 
            value={dailySummaryAlert} 
            onValueChange={setDailySummaryAlert} 
            trackColor={{ true: colors.primary }}
            disabled={!notificationsEnabled}
          />
        </View>

        {dailySummaryAlert && notificationsEnabled && (
          <>
            <Text style={dynamicStyles.subLabel}>Daily Summary Time</Text>
            <View style={dynamicStyles.timeInputContainer}>
              <TextInput
                style={dynamicStyles.timeInput}
                value={dailySummaryHour}
                keyboardType="numeric"
                onChangeText={(text) => setDailySummaryHour(validateTimeInput(text, 23))}
                placeholder="HH"
                maxLength={2}
              />
              <Text style={dynamicStyles.timeSeparator}>:</Text>
              <TextInput
                style={dynamicStyles.timeInput}
                value={dailySummaryMinute}
                keyboardType="numeric"
                onChangeText={(text) => setDailySummaryMinute(validateTimeInput(text, 59))}
                placeholder="MM"
                maxLength={2}
              />
              <Text style={dynamicStyles.timePreview}>
                {formatTime(dailySummaryHour, dailySummaryMinute)}
              </Text>
            </View>
          </>
        )}

        <View style={dynamicStyles.row}>
          <Text style={dynamicStyles.label}>Weekly Summary</Text>
          <Switch 
            value={weeklySummary} 
            onValueChange={setWeeklySummary} 
            trackColor={{ true: colors.primary }}
            disabled={!notificationsEnabled}
          />
        </View>

        {weeklySummary && notificationsEnabled && (
          <>
            <Text style={dynamicStyles.subLabel}>Weekly Summary Time (Mondays)</Text>
            <View style={dynamicStyles.timeInputContainer}>
              <TextInput
                style={dynamicStyles.timeInput}
                value={weeklySummaryHour}
                keyboardType="numeric"
                onChangeText={(text) => setWeeklySummaryHour(validateTimeInput(text, 23))}
                placeholder="HH"
                maxLength={2}
              />
              <Text style={dynamicStyles.timeSeparator}>:</Text>
              <TextInput
                style={dynamicStyles.timeInput}
                value={weeklySummaryMinute}
                keyboardType="numeric"
                onChangeText={(text) => setWeeklySummaryMinute(validateTimeInput(text, 59))}
                placeholder="MM"
                maxLength={2}
              />
              <Text style={dynamicStyles.timePreview}>
                {formatTime(weeklySummaryHour, weeklySummaryMinute)}
              </Text>
            </View>
          </>
        )}

        <View style={dynamicStyles.row}>
          <Text style={dynamicStyles.label}>Budget Alerts</Text>
          <Switch 
            value={budgetAlerts} 
            onValueChange={setBudgetAlerts} 
            trackColor={{ true: colors.primary }}
            disabled={!notificationsEnabled}
          />
        </View>

        <View style={dynamicStyles.row}>
          <Text style={dynamicStyles.label}>Goal Updates</Text>
          <Switch 
            value={goalUpdates} 
            onValueChange={setGoalUpdates} 
            trackColor={{ true: colors.primary }}
            disabled={!notificationsEnabled}
          />
        </View>

        <View style={dynamicStyles.row}>
          <Text style={dynamicStyles.label}>Low Balance Alerts</Text>
          <Switch 
            value={lowBalanceAlert} 
            onValueChange={setLowBalanceAlert} 
            trackColor={{ true: colors.primary }}
            disabled={!notificationsEnabled}
          />
        </View>

        <View style={dynamicStyles.row}>
          <Text style={dynamicStyles.label}>Large Transaction Alerts</Text>
          <Switch 
            value={largeTransactionAlert} 
            onValueChange={setLargeTransactionAlert} 
            trackColor={{ true: colors.primary }}
            disabled={!notificationsEnabled}
          />
        </View>

        <Text style={dynamicStyles.subLabel}>Low Balance Threshold ($)</Text>
        <TextInput
          style={dynamicStyles.input}
          value={lowBalanceThreshold}
          keyboardType="numeric"
          onChangeText={setLowBalanceThreshold}
          placeholderTextColor={colors.textSecondary}
        />

        <Text style={dynamicStyles.subLabel}>Large Transaction Threshold ($)</Text>
        <TextInput
          style={dynamicStyles.input}
          value={largeTransactionThreshold}
          keyboardType="numeric"
          onChangeText={setLargeTransactionThreshold}
          placeholderTextColor={colors.textSecondary}
        />

        <Text style={[dynamicStyles.sectionHeader, { marginTop: 20 }]}>Recent Notifications</Text>
        {notifications.map(notification => (
          <View
            key={notification.id}
            style={[
              {
                backgroundColor: colors.background,
                padding: 15,
                borderRadius: 10,
                marginBottom: 10,
                borderLeftWidth: 4,
                borderLeftColor: notification.type === 'warning' ? colors.warning : 
                               notification.type === 'success' ? colors.success : 
                               notification.type === 'danger' ? colors.danger : colors.info
              },
              !notification.read && { backgroundColor: colors.primary + '10' }
            ]}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 5 }}>
              <Text style={{ fontSize: 20, marginRight: 8 }}>{notification.icon}</Text>
              <Text style={{ flex: 1, fontSize: 16, fontWeight: 'bold', color: colors.text }}>
                {notification.title}
              </Text>
              <Text style={{ fontSize: 12, color: colors.textSecondary }}>
                {new Date(notification.date).toLocaleDateString()}
              </Text>
            </View>
            <Text style={{ fontSize: 14, color: colors.textSecondary }}>
              {notification.message}
            </Text>
          </View>
        ))}
      </View>

      {/* Preferences Section */}
      <View style={dynamicStyles.section}>
        <Text style={dynamicStyles.sectionHeader}>Preferences</Text>
        <Text style={dynamicStyles.subLabel}>Currency</Text>
        <TextInput
          style={dynamicStyles.input}
          value={currency}
          onChangeText={setCurrency}
          placeholderTextColor={colors.textSecondary}
        />
      </View>

      {/* Save Button */}
      <TouchableOpacity style={dynamicStyles.saveButton} onPress={handleSave}>
        <Text style={dynamicStyles.saveButtonText}>Save Settings</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}
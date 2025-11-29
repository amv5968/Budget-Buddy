import AsyncStorage from '@react-native-async-storage/async-storage';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { addSubscription, getSubscriptions, deleteSubscription, updateSubscription } from './services/subscriptionService';

const SETTINGS_KEY = 'bb.settings.v1';

export default function SubscriptionPaymentScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const plan = (params.plan as 'monthly' | 'yearly') || 'monthly';
  const { colors } = useTheme();

  const [cardNumber, setCardNumber] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [cvv, setCvv] = useState('');
  const [cardholderName, setCardholderName] = useState('');
  const [billingAddress, setBillingAddress] = useState('');
  const [city, setCity] = useState('');
  const [zipCode, setZipCode] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [fadeAnim] = useState(new Animated.Value(0));
  const [scaleAnim] = useState(new Animated.Value(0.5));

  const planPrice = plan === 'monthly' ? 14 : 100;
  const planName = plan === 'monthly' ? 'Monthly Premium' : 'Yearly Premium';

  const formatCardNumber = (text: string) => {
    // Remove all non-digits
    const cleaned = text.replace(/\D/g, '');
    // Format as XXXX XXXX XXXX XXXX
    const formatted = cleaned.match(/.{1,4}/g)?.join(' ') || cleaned;
    return formatted;
  };

  const formatExpiryDate = (text: string) => {
    // Remove all non-digits
    const cleaned = text.replace(/\D/g, '');
    // Format as MM/YY
    if (cleaned.length >= 2) {
      return cleaned.slice(0, 2) + '/' + cleaned.slice(2, 4);
    }
    return cleaned;
  };

  const validateCardNumber = (text: string): boolean => {
    const cleaned = text.replace(/\s/g, '');
    // Accept repetitions of 42 (like 4242424242424242) or any 16-digit number
    if (cleaned.length !== 16) return false;
    // Check if it's all 42s repeated or valid pattern
    const isAll42s = /^(42)+$/.test(cleaned);
    const isValidPattern = /^\d{16}$/.test(cleaned);
    return isAll42s || isValidPattern;
  };

  const validateCardholderName = (name: string): boolean => {
    // Name should only contain letters, spaces, hyphens, and apostrophes
    // No numbers allowed
    const nameRegex = /^[a-zA-Z\s'-]+$/;
    return nameRegex.test(name.trim()) && name.trim().length >= 2;
  };

  const validateZipCode = (zip: string): boolean => {
    // ZIP code should only contain numbers (5 digits for US, but we'll accept any numeric)
    if (!zip.trim()) return true; // Optional field
    const zipRegex = /^\d+$/;
    return zipRegex.test(zip.trim()) && zip.trim().length >= 3;
  };

  const validateCity = (city: string): boolean => {
    // City should only contain letters, spaces, hyphens, and apostrophes
    if (!city.trim()) return true; // Optional field
    const cityRegex = /^[a-zA-Z\s'-]+$/;
    return cityRegex.test(city.trim());
  };

  const validateExpiryDate = (expiry: string): boolean => {
    if (expiry.length !== 5) return false;
    const [month, year] = expiry.split('/');
    const monthNum = parseInt(month);
    const yearNum = parseInt(year);
    
    // Check if month is valid (01-12)
    if (monthNum < 1 || monthNum > 12) return false;
    
    // Check if year is valid (should be current year or future)
    const currentYear = new Date().getFullYear() % 100;
    if (yearNum < currentYear) return false;
    
    return true;
  };

  const validateForm = (): boolean => {
    if (!validateCardNumber(cardNumber)) {
      return false;
    }
    if (!validateExpiryDate(expiryDate)) {
      return false;
    }
    if (cvv.length < 3) {
      return false;
    }
    if (!validateCardholderName(cardholderName)) {
      return false;
    }
    if (zipCode && !validateZipCode(zipCode)) {
      return false;
    }
    if (city && !validateCity(city)) {
      return false;
    }
    return true;
  };

  const handleCardNumberChange = (text: string) => {
    const formatted = formatCardNumber(text);
    if (formatted.replace(/\s/g, '').length <= 16) {
      setCardNumber(formatted);
    }
  };

  const handleExpiryChange = (text: string) => {
    const formatted = formatExpiryDate(text);
    if (formatted.replace(/\D/g, '').length <= 4) {
      setExpiryDate(formatted);
    }
  };

  const handleCvvChange = (text: string) => {
    const cleaned = text.replace(/\D/g, '');
    if (cleaned.length <= 3) {
      setCvv(cleaned);
    }
  };

  const handleCardholderNameChange = (text: string) => {
    // Only allow letters, spaces, hyphens, and apostrophes
    const cleaned = text.replace(/[^a-zA-Z\s'-]/g, '');
    setCardholderName(cleaned);
  };

  const handleZipCodeChange = (text: string) => {
    // Only allow numbers
    const cleaned = text.replace(/\D/g, '');
    if (cleaned.length <= 10) {
      setZipCode(cleaned);
    }
  };

  const handleCityChange = (text: string) => {
    // Only allow letters, spaces, hyphens, and apostrophes
    const cleaned = text.replace(/[^a-zA-Z\s'-]/g, '');
    setCity(cleaned);
  };

  const processPayment = async () => {
    if (!validateForm()) {
      return;
    }

    setIsProcessing(true);

    // Simulate payment processing with animation
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 4,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start();

    // Simulate API call delay
    setTimeout(async () => {
      try {
        // Calculate billing dates
        const daysToAdd = plan === 'monthly' ? 30 : 365;
        const nextBillingDate = new Date(Date.now() + daysToAdd * 24 * 60 * 60 * 1000);
        
        // Format renewal date as YYYY-MM-DD for the subscription API
        const renewalDateStr = nextBillingDate.toISOString().split('T')[0];
        
        // Calculate subscription amount
        // For monthly: $14/month
        // For yearly: $100/year, but store as monthly equivalent ($8.33/month) for display purposes
        const subscriptionAmount = plan === 'monthly' ? 14 : 100 / 12;

        // Save subscription status to AsyncStorage
        const raw = await AsyncStorage.getItem(SETTINGS_KEY);
        const settings = raw ? JSON.parse(raw) : {};

        settings.subscription = {
          plan,
          status: 'active',
          nextBillingDate: nextBillingDate.toISOString(),
        };

        await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));

        // Create or update subscription entry in the subscriptions list
        try {
          // Check if Budget Buddy Premium subscription already exists
          const existingSubs = await getSubscriptions();
          const existingPremiumSub = existingSubs.find((sub: any) => 
            sub.name.includes('Budget Buddy Premium')
          );
          
          const autoCreateTransaction = plan === 'monthly';
          const subscriptionName = plan === 'monthly' ? 'Budget Buddy Premium (Monthly)' : 'Budget Buddy Premium (Yearly)';
          
          if (existingPremiumSub) {
            // Update existing subscription WITHOUT creating a new transaction
            // This is for updating payment method or changing plan
            await updateSubscription(existingPremiumSub._id, {
              name: subscriptionName,
              amount: subscriptionAmount,
              renewalDate: renewalDateStr,
              category: '📱 Software',
              autoCreateTransaction: autoCreateTransaction,
            });
            console.log('Updated existing Budget Buddy Premium subscription (no new transaction created)');
          } else {
            // Create new subscription (this will create the initial transaction)
            await addSubscription({
              name: subscriptionName,
              amount: subscriptionAmount,
              renewalDate: renewalDateStr,
              category: '📱 Software',
              autoCreateTransaction: autoCreateTransaction,
            });
            console.log('App subscription added to subscriptions list');
          }
        } catch (subError) {
          console.error('Error managing app subscription:', subError);
          // Don't fail the payment if this fails - subscription status is already saved
        }

        setIsProcessing(false);
        setShowSuccess(true);

        // Animate success
        Animated.sequence([
          Animated.timing(scaleAnim, {
            toValue: 1.2,
            duration: 200,
            useNativeDriver: true,
          }),
          Animated.timing(scaleAnim, {
            toValue: 1,
            duration: 200,
            useNativeDriver: true,
          }),
        ]).start();

        // Navigate back after showing success
        setTimeout(() => {
          router.back();
          // Refresh the settings screen by navigating to it
          setTimeout(() => {
            router.push('/settings');
          }, 100);
        }, 2000);
      } catch (error) {
        console.error('Error saving subscription:', error);
        setIsProcessing(false);
      }
    }, 2000);
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
    planCard: {
      backgroundColor: colors.primary + '15',
      borderRadius: 12,
      padding: 20,
      marginBottom: 20,
      borderWidth: 2,
      borderColor: colors.primary,
    },
    planTitle: {
      fontSize: 20,
      fontWeight: '700',
      color: colors.text,
      marginBottom: 4,
    },
    planPrice: {
      fontSize: 24,
      fontWeight: '800',
      color: colors.primary,
    },
    label: {
      fontSize: 14,
      fontWeight: '600',
      marginBottom: 8,
      color: colors.text,
    },
    input: {
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 10,
      padding: 12,
      fontSize: 16,
      color: colors.text,
      backgroundColor: colors.background,
      marginBottom: 15,
    },
    inputRow: {
      flexDirection: 'row',
      gap: 10,
    },
    inputHalf: {
      flex: 1,
    },
    submitButton: {
      backgroundColor: colors.primary,
      paddingVertical: 16,
      borderRadius: 12,
      alignItems: 'center',
      marginTop: 10,
      elevation: 3,
    },
    submitButtonDisabled: {
      backgroundColor: colors.border,
      opacity: 0.5,
    },
    submitButtonText: {
      color: '#fff',
      fontWeight: 'bold',
      fontSize: 16,
    },
    processingContainer: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.7)',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 1000,
    },
    processingCard: {
      backgroundColor: colors.cardBackground,
      borderRadius: 20,
      padding: 30,
      alignItems: 'center',
      minWidth: 250,
    },
    processingText: {
      fontSize: 18,
      fontWeight: '600',
      color: colors.text,
      marginTop: 20,
      marginBottom: 10,
    },
    processingSubtext: {
      fontSize: 14,
      color: colors.textSecondary,
      textAlign: 'center',
    },
    successContainer: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.7)',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 1001,
    },
    successCard: {
      backgroundColor: colors.cardBackground,
      borderRadius: 20,
      padding: 30,
      alignItems: 'center',
      minWidth: 250,
    },
    successIcon: {
      fontSize: 64,
      marginBottom: 20,
    },
    successText: {
      fontSize: 20,
      fontWeight: '700',
      color: colors.text,
      marginBottom: 10,
      textAlign: 'center',
    },
    successSubtext: {
      fontSize: 14,
      color: colors.textSecondary,
      textAlign: 'center',
    },
    hintText: {
      fontSize: 12,
      color: colors.textSecondary,
      fontStyle: 'italic',
      marginTop: -10,
      marginBottom: 15,
    },
  });

  return (
    <ScrollView contentContainerStyle={dynamicStyles.container}>
      {/* Header */}
      <View style={dynamicStyles.headerRow}>
        <TouchableOpacity onPress={() => router.back()} style={dynamicStyles.backButton}>
          <Text style={dynamicStyles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={dynamicStyles.header}>Payment</Text>
      </View>

      {/* Plan Summary */}
      <View style={dynamicStyles.planCard}>
        <Text style={dynamicStyles.planTitle}>✨ {planName}</Text>
        <Text style={dynamicStyles.planPrice}>
          ${planPrice}{plan === 'monthly' ? '/month' : '/year'}
        </Text>
        {plan === 'yearly' && (
          <Text style={{ fontSize: 14, color: colors.textSecondary, marginTop: 4 }}>
            Save $68 compared to monthly billing
          </Text>
        )}
      </View>

      {/* Payment Form */}
      <View style={dynamicStyles.section}>
        <Text style={dynamicStyles.sectionHeader}>💳 Payment Information</Text>

        <Text style={dynamicStyles.label}>Card Number</Text>
        <TextInput
          style={[
            dynamicStyles.input,
            cardNumber.replace(/\s/g, '').length === 16 && !validateCardNumber(cardNumber) && {
              borderColor: colors.expense,
              borderWidth: 2,
            },
          ]}
          placeholder="4242 4242 4242 4242"
          placeholderTextColor={colors.textSecondary}
          value={cardNumber}
          onChangeText={handleCardNumberChange}
          keyboardType="numeric"
          maxLength={19}
        />
        {cardNumber.replace(/\s/g, '').length === 16 && !validateCardNumber(cardNumber) ? (
          <Text style={[dynamicStyles.hintText, { color: colors.expense }]}>
            Invalid card number. Use repetitions of "42" (e.g., 4242424242424242)
          </Text>
        ) : (
          <Text style={dynamicStyles.hintText}>
            💡 Tip: Enter repetitions of "42" (e.g., 4242424242424242)
          </Text>
        )}

        <View style={dynamicStyles.inputRow}>
          <View style={dynamicStyles.inputHalf}>
            <Text style={dynamicStyles.label}>Expiry Date</Text>
            <TextInput
              style={[
                dynamicStyles.input,
                expiryDate.length === 5 && !validateExpiryDate(expiryDate) && {
                  borderColor: colors.expense,
                  borderWidth: 2,
                },
              ]}
              placeholder="MM/YY"
              placeholderTextColor={colors.textSecondary}
              value={expiryDate}
              onChangeText={handleExpiryChange}
              keyboardType="numeric"
              maxLength={5}
            />
            {expiryDate.length === 5 && !validateExpiryDate(expiryDate) && (
              <Text style={[dynamicStyles.hintText, { color: colors.expense, marginTop: -10 }]}>
                Please enter a valid expiry date (MM/YY)
              </Text>
            )}
          </View>
          <View style={dynamicStyles.inputHalf}>
            <Text style={dynamicStyles.label}>CVV</Text>
            <TextInput
              style={[
                dynamicStyles.input,
                cvv.length === 3 && cvv.length < 3 && {
                  borderColor: colors.expense,
                  borderWidth: 2,
                },
              ]}
              placeholder="123"
              placeholderTextColor={colors.textSecondary}
              value={cvv}
              onChangeText={handleCvvChange}
              keyboardType="numeric"
              maxLength={3}
              secureTextEntry
            />
            {cvv.length > 0 && cvv.length < 3 && (
              <Text style={[dynamicStyles.hintText, { color: colors.expense, marginTop: -10 }]}>
                CVV must be 3 digits
              </Text>
            )}
          </View>
        </View>

        <Text style={dynamicStyles.label}>Cardholder Name</Text>
        <TextInput
          style={[
            dynamicStyles.input,
            cardholderName && !validateCardholderName(cardholderName) && {
              borderColor: colors.expense,
              borderWidth: 2,
            },
          ]}
          placeholder="John Doe"
          placeholderTextColor={colors.textSecondary}
          value={cardholderName}
          onChangeText={handleCardholderNameChange}
          autoCapitalize="words"
        />
        {cardholderName && !validateCardholderName(cardholderName) && (
          <Text style={[dynamicStyles.hintText, { color: colors.expense }]}>
            Name should only contain letters, spaces, hyphens, and apostrophes
          </Text>
        )}

        <Text style={[dynamicStyles.sectionHeader, { marginTop: 10, marginBottom: 15 }]}>
          📍 Billing Address (Optional)
        </Text>

        <Text style={dynamicStyles.label}>Street Address</Text>
        <TextInput
          style={dynamicStyles.input}
          placeholder="123 Main St"
          placeholderTextColor={colors.textSecondary}
          value={billingAddress}
          onChangeText={setBillingAddress}
        />

        <View style={dynamicStyles.inputRow}>
          <View style={dynamicStyles.inputHalf}>
            <Text style={dynamicStyles.label}>City</Text>
            <TextInput
              style={[
                dynamicStyles.input,
                city && !validateCity(city) && {
                  borderColor: colors.expense,
                  borderWidth: 2,
                },
              ]}
              placeholder="New York"
              placeholderTextColor={colors.textSecondary}
              value={city}
              onChangeText={handleCityChange}
            />
            {city && !validateCity(city) && (
              <Text style={[dynamicStyles.hintText, { color: colors.expense, marginTop: -10 }]}>
                City should only contain letters
              </Text>
            )}
          </View>
          <View style={dynamicStyles.inputHalf}>
            <Text style={dynamicStyles.label}>ZIP Code</Text>
            <TextInput
              style={[
                dynamicStyles.input,
                zipCode && !validateZipCode(zipCode) && {
                  borderColor: colors.expense,
                  borderWidth: 2,
                },
              ]}
              placeholder="10001"
              placeholderTextColor={colors.textSecondary}
              value={zipCode}
              onChangeText={handleZipCodeChange}
              keyboardType="numeric"
            />
            {zipCode && !validateZipCode(zipCode) && (
              <Text style={[dynamicStyles.hintText, { color: colors.expense, marginTop: -10 }]}>
                ZIP code should only contain numbers
              </Text>
            )}
          </View>
        </View>

        <TouchableOpacity
          style={[
            dynamicStyles.submitButton,
            (!validateForm() || isProcessing) && dynamicStyles.submitButtonDisabled,
          ]}
          onPress={processPayment}
          disabled={!validateForm() || isProcessing}
        >
          <Text style={dynamicStyles.submitButtonText}>
            {isProcessing ? 'Processing...' : `Subscribe for $${planPrice}`}
          </Text>
        </TouchableOpacity>

        <Text style={[dynamicStyles.hintText, { marginTop: 15, textAlign: 'center' }]}>
          🔒 This is a demo payment form. No real charges will be made.
        </Text>
      </View>

      {/* Processing Overlay */}
      {isProcessing && (
        <Animated.View
          style={[
            dynamicStyles.processingContainer,
            {
              opacity: fadeAnim,
            },
          ]}
        >
          <Animated.View
            style={[
              dynamicStyles.processingCard,
              {
                transform: [{ scale: scaleAnim }],
              },
            ]}
          >
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={dynamicStyles.processingText}>Processing Payment</Text>
            <Text style={dynamicStyles.processingSubtext}>
              Please wait while we securely process your payment...
            </Text>
          </Animated.View>
        </Animated.View>
      )}

      {/* Success Overlay */}
      {showSuccess && (
        <Animated.View
          style={[
            dynamicStyles.successContainer,
            {
              opacity: fadeAnim,
            },
          ]}
        >
          <Animated.View
            style={[
              dynamicStyles.successCard,
              {
                transform: [{ scale: scaleAnim }],
              },
            ]}
          >
            <Text style={dynamicStyles.successIcon}>✅</Text>
            <Text style={dynamicStyles.successText}>Payment Successful!</Text>
            <Text style={dynamicStyles.successSubtext}>
              Welcome to Budget Buddy Premium!{'\n'}
              Your {planName} subscription is now active.
            </Text>
          </Animated.View>
        </Animated.View>
      )}
    </ScrollView>
  );
}


import { useRouter } from 'expo-router';
import { useRef, useState } from 'react';
import {
    Alert,
    Animated,
    Dimensions,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { updateMonthlyAllowance } from '../services/authService';
import { completeOnboarding } from '../services/onboardingService';
import { addTransaction } from '../services/transactionService';


const defaultColors = {
  background: '#f5f5f5',
  cardBackground: '#ffffff',
  text: '#333333',
  textSecondary: '#666666',
  primary: '#66BB6A',
  border: '#e0e0e0',
};

const { width } = Dimensions.get('window');

interface OnboardingSlide {
  title: string;
  description: string;
  icon: string;
  color: string;
}

const slides: OnboardingSlide[] = [
  {
    title: 'Welcome to Budget Buddy!',
    description: 'Take control of your finances with our powerful budgeting app. Track expenses, set goals, and achieve financial freedom.',
    icon: '💰',
    color: '#2196F3',
  },
  {
    title: 'Track Your Transactions',
    description: 'Easily record income and expenses. Categorize your spending and see where your money goes with detailed insights.',
    icon: '📊',
    color: '#66BB6A',
  },
  {
    title: 'Set Savings Goals',
    description: 'Create goals for your dreams - a new car, vacation, or emergency fund. Track your progress and stay motivated!',
    icon: '🎯',
    color: '#9C27B0',
  },
  {
    title: 'Smart Budgeting',
    description: 'Set monthly budgets for different categories. Get alerts when you\'re approaching limits and stay on track.',
    icon: '💳',
    color: '#FF9800',
  },
  {
    title: 'Calendar & Reminders',
    description: 'View all your financial activity on a calendar. Set reminders for bills and important dates. Never miss a payment!',
    icon: '📅',
    color: '#E91E63',
  },
  {
    title: 'Set Up Your Profile',
    description: 'Let\'s get started! Tell us about your monthly income and spending allowance.',
    icon: '⚙️',
    color: '#2196F3',
  },
];

export default function OnboardingScreen() {
  const colors = defaultColors;
  const router = useRouter();
  const scrollViewRef = useRef<ScrollView>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [fadeAnim] = useState(new Animated.Value(1));
  
  // Setup form state
  const [monthlyIncome, setMonthlyIncome] = useState('');
  const [monthlyAllowance, setMonthlyAllowance] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const handleNext = () => {
    if (currentPage < slides.length - 1) {
      const nextPage = currentPage + 1;
      scrollViewRef.current?.scrollTo({ x: nextPage * width, animated: true });
      setCurrentPage(nextPage);
    } else {
      // Last slide is setup form, don't auto-finish
      if (currentPage === slides.length - 1) {
        handleFinish();
      }
    }
  };

  const handleSkip = async () => {
    // When skipping, explicitly set allowance to 0 to override any defaults
    try {
      await updateMonthlyAllowance(0);
      await completeOnboarding();
      router.replace('/(tabs)' as any);
    } catch (error: any) {
      console.error('Error during skip:', error);
      // Continue anyway - complete onboarding
      await completeOnboarding();
      router.replace('/(tabs)' as any);
    }
  };

  const handleFinish = async () => {
    // If we're on the setup page, validate and save data
    if (currentPage === slides.length - 1) {
      if (!monthlyIncome.trim() || parseFloat(monthlyIncome) <= 0) {
        Alert.alert('Required Field', 'Please enter your monthly income');
        return;
      }
      
      const incomeValue = parseFloat(monthlyIncome);
      const allowanceValue = monthlyAllowance.trim() ? parseFloat(monthlyAllowance) : 0;
      
      if (allowanceValue > incomeValue) {
        Alert.alert(
          'Invalid Amount',
          'Monthly allowance cannot exceed your monthly income. Please adjust your values.'
        );
        return;
      }
      
      setIsSaving(true);
      try {
        // Create initial income transaction
        if (incomeValue > 0) {
          await addTransaction({
            type: 'Income',
            category: 'Salary',
            amount: incomeValue,
            description: 'Initial monthly income setup',
            date: new Date().toISOString(),
          });
        }
        
        // Set monthly allowance
        await updateMonthlyAllowance(allowanceValue);
        
        await completeOnboarding();
        router.replace('/(tabs)' as any);
      } catch (error: any) {
        console.error('Error saving setup data:', error);
        Alert.alert(
          'Error',
          error.response?.data?.error || 'Failed to save your information. Please try again.'
        );
      } finally {
        setIsSaving(false);
      }
    } else {
      // Skip setup, just complete onboarding
      await completeOnboarding();
      router.replace('/(tabs)' as any);
    }
  };

  const handleScroll = (event: any) => {
    const offsetX = event.nativeEvent.contentOffset.x;
    const page = Math.round(offsetX / width);
    setCurrentPage(page);
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    scrollView: {
      flex: 1,
    },
    slide: {
      width,
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: 40,
      paddingTop: 60,
    },
    iconContainer: {
      width: 120,
      height: 120,
      borderRadius: 60,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 40,
      backgroundColor: colors.cardBackground,
      elevation: 8,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
    },
    iconText: {
      fontSize: 64,
    },
    title: {
      fontSize: 28,
      fontWeight: 'bold',
      color: colors.text,
      textAlign: 'center',
      marginBottom: 20,
    },
    description: {
      fontSize: 16,
      color: colors.textSecondary,
      textAlign: 'center',
      lineHeight: 24,
      marginBottom: 40,
    },
    pagination: {
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 30,
    },
    dot: {
      width: 8,
      height: 8,
      borderRadius: 4,
      marginHorizontal: 4,
    },
    dotActive: {
      width: 24,
    },
    buttonContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      paddingHorizontal: 40,
      paddingBottom: 40,
      gap: 12,
    },
    button: {
      flex: 1,
      paddingVertical: 16,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
    },
    skipButton: {
      backgroundColor: 'transparent',
      borderWidth: 1,
      borderColor: colors.border,
    },
    nextButton: {
      backgroundColor: colors.primary,
      elevation: 4,
      shadowColor: colors.primary,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.3,
      shadowRadius: 4,
    },
    finishButton: {
      backgroundColor: '#66BB6A',
      elevation: 4,
      shadowColor: '#66BB6A',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.3,
      shadowRadius: 4,
    },
    buttonText: {
      fontSize: 16,
      fontWeight: '600',
      color: '#fff',
    },
    skipButtonText: {
      color: colors.textSecondary,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'flex-end',
      paddingHorizontal: 20,
      paddingTop: 60,
      paddingBottom: 20,
    },
    skipText: {
      fontSize: 16,
      color: colors.textSecondary,
      fontWeight: '500',
    },
    setupContainer: {
      width: '100%',
      paddingHorizontal: 20,
    },
    setupTitle: {
      fontSize: 24,
      fontWeight: 'bold',
      color: colors.text,
      marginBottom: 8,
      textAlign: 'center',
    },
    setupDescription: {
      fontSize: 14,
      color: colors.textSecondary,
      marginBottom: 30,
      textAlign: 'center',
    },
    inputContainer: {
      marginBottom: 20,
    },
    inputLabel: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 8,
    },
    input: {
      backgroundColor: colors.cardBackground,
      borderRadius: 12,
      padding: 16,
      fontSize: 18,
      color: colors.text,
      borderWidth: 1,
      borderColor: colors.border,
    },
    inputHelper: {
      fontSize: 12,
      color: colors.textSecondary,
      marginTop: 4,
    },
  });

  return (
    <View style={styles.container}>
      {currentPage < slides.length - 1 && (
        <View style={styles.header}>
          <TouchableOpacity onPress={handleSkip}>
            <Text style={styles.skipText}>Skip</Text>
          </TouchableOpacity>
        </View>
      )}

      <ScrollView
        ref={scrollViewRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        style={styles.scrollView}
      >
        {slides.map((slide, index) => (
          <View key={index} style={styles.slide}>
            {index === slides.length - 1 ? (
              // Setup form on last slide
              <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.setupContainer}
              >
                <Text style={styles.setupTitle}>{slide.title}</Text>
                <Text style={styles.setupDescription}>{slide.description}</Text>
                
                <View style={styles.inputContainer}>
                  <Text style={styles.inputLabel}>Monthly Income *</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="0.00"
                    value={monthlyIncome}
                    onChangeText={(text) => {
                      const cleaned = text.replace(/[^0-9.]/g, '');
                      const parts = cleaned.split('.');
                      let formatted = parts[0];
                      if (parts.length > 1) {
                        formatted += '.' + parts.slice(1).join('').substring(0, 2);
                      }
                      const numValue = parseFloat(formatted) || 0;
                      if (numValue <= 9999999.99) {
                        setMonthlyIncome(formatted);
                      }
                    }}
                    keyboardType="decimal-pad"
                    placeholderTextColor={colors.textSecondary}
                  />
                  <Text style={styles.inputHelper}>Your total monthly income</Text>
                </View>
                
                <View style={styles.inputContainer}>
                  <Text style={styles.inputLabel}>Monthly Allowance (Optional)</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="0.00"
                    value={monthlyAllowance}
                    onChangeText={(text) => {
                      const cleaned = text.replace(/[^0-9.]/g, '');
                      const parts = cleaned.split('.');
                      let formatted = parts[0];
                      if (parts.length > 1) {
                        formatted += '.' + parts.slice(1).join('').substring(0, 2);
                      }
                      const numValue = parseFloat(formatted) || 0;
                      if (numValue <= 9999999.99) {
                        setMonthlyAllowance(formatted);
                      }
                    }}
                    keyboardType="decimal-pad"
                    placeholderTextColor={colors.textSecondary}
                  />
                  <Text style={styles.inputHelper}>
                    How much you want to spend per month (cannot exceed income)
                  </Text>
                </View>
              </KeyboardAvoidingView>
            ) : (
              // Regular slide content
              <>
                <Animated.View style={[styles.iconContainer, { opacity: fadeAnim }]}>
                  <Text style={styles.iconText}>{slide.icon}</Text>
                </Animated.View>
                <Text style={styles.title}>{slide.title}</Text>
                <Text style={styles.description}>{slide.description}</Text>
              </>
            )}
          </View>
        ))}
      </ScrollView>

      <View style={styles.pagination}>
        {slides.map((_, index) => (
          <View
            key={index}
            style={[
              styles.dot,
              styles.dotActive,
              {
                backgroundColor: index === currentPage ? colors.primary : colors.border,
                width: index === currentPage ? 24 : 8,
              },
            ]}
          />
        ))}
      </View>

      <View style={styles.buttonContainer}>
        {currentPage < slides.length - 1 ? (
          <>
            {currentPage > 0 && (
              <TouchableOpacity
                style={[styles.button, styles.skipButton]}
                onPress={() => {
                  const prevPage = currentPage - 1;
                  scrollViewRef.current?.scrollTo({ x: prevPage * width, animated: true });
                  setCurrentPage(prevPage);
                }}
              >
                <Text style={styles.skipButtonText}>Back</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity style={[styles.button, styles.nextButton]} onPress={handleNext}>
              <Text style={styles.buttonText}>Next</Text>
            </TouchableOpacity>
          </>
        ) : (
          <TouchableOpacity
            style={[styles.button, styles.finishButton]}
            onPress={handleFinish}
            disabled={isSaving}
          >
            <Text style={styles.buttonText}>
              {isSaving ? 'Saving...' : 'Get Started'}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}


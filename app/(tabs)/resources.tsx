import React, { useState } from 'react';
import {
  View,
  Text,
  Linking,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';

interface Resource {
  title: string;
  url: string;
  desc: string;
  category: string;
  icon: string;
}

interface Tip {
  title: string;
  desc: string;
  icon: string;
}

const ResourcesScreen: React.FC = () => {
  const { colors } = useTheme();
  const [activeCategory, setActiveCategory] = useState<string>('All');

  const categories = ['All', 'Financial Aid', 'Student Jobs', 'Budgeting Tools', 'Campus Resources', 'Learning'];

  const resources: Resource[] = [
    {
      category: 'Financial Aid',
      title: 'Penn State Student Financial Education Center',
      url: 'https://studentaffairs.psu.edu/financial/financialliteracy',
      desc: 'Free workshops and one-on-one help for budgeting, debt management, and saving strategies.',
      icon: '🎓',
    },
    {
      category: 'Financial Aid',
      title: 'Office of Student Aid',
      url: 'https://studentaid.psu.edu/',
      desc: 'Complete information on grants, scholarships, loans, and FAFSA application help.',
      icon: '💰',
    },
    {
      category: 'Campus Resources',
      title: 'LionPATH',
      url: 'https://lionpath.psu.edu/',
      desc: 'Manage tuition bills, view aid disbursements, and check your account balance.',
      icon: '🦁',
    },
    {
      category: 'Financial Aid',
      title: 'Penn State Bursars Office',
      url: 'https://www.bursar.psu.edu/',
      desc: 'Payment plans, billing schedules, refund information, and financial account support.',
      icon: '🏦',
    },
    {
      category: 'Student Jobs',
      title: 'Career Services',
      url: 'https://studentaffairs.psu.edu/career',
      desc: 'Job search tools, career counseling, financial wellness resources, and income planning.',
      icon: '💼',
    },
    {
      category: 'Campus Resources',
      title: 'Student Care & Advocacy',
      url: 'https://studentaffairs.psu.edu/studentcare',
      desc: 'Emergency fund assistance, financial hardship support, and crisis intervention.',
      icon: '🤝',
    },
    {
      category: 'Student Jobs',
      title: 'Penn State Student Employment',
      url: 'https://studentaffairs.psu.edu/career/students/find-job',
      desc: 'Find on-campus jobs, work-study positions, and internship opportunities.',
      icon: '🎯',
    },
    {
      category: 'Budgeting Tools',
      title: 'Mint - Budget Tracker',
      url: 'https://mint.intuit.com/',
      desc: 'Free budgeting app that tracks spending, creates budgets, and monitors credit scores.',
      icon: '📊',
    },
    {
      category: 'Budgeting Tools',
      title: 'YNAB (You Need A Budget)',
      url: 'https://www.youneedabudget.com/college/',
      desc: 'Free for students! Award-winning budgeting method to help you gain control of money.',
      icon: '💵',
    },
    {
      category: 'Learning',
      title: 'Khan Academy - Personal Finance',
      url: 'https://www.khanacademy.org/college-careers-more/personal-finance',
      desc: 'Free courses on budgeting, credit cards, loans, taxes, and financial planning.',
      icon: '📚',
    },
    {
      category: 'Financial Aid',
      title: 'Federal Student Aid',
      url: 'https://studentaid.gov/',
      desc: 'Official U.S. government site for federal student aid, grants, and loan information.',
      icon: '🇺🇸',
    },
    {
      category: 'Learning',
      title: 'Student Loan Calculator',
      url: 'https://studentaid.gov/loan-simulator/',
      desc: 'Estimate monthly payments and see how different repayment plans affect your loans.',
      icon: '🧮',
    },
  ];

  const studentTips: Tip[] = [
    {
      icon: '🍕',
      title: 'Meal Planning Saves Money',
      desc: 'Cook meals in batches and pack lunches. You can save $100-200/month vs eating out daily.',
    },
    {
      icon: '📱',
      title: 'Student Discounts Everywhere',
      desc: 'Use your .edu email! Get discounts on Spotify, Apple Music, Amazon Prime, and more.',
    },
    {
      icon: '📖',
      title: 'Buy Used Textbooks',
      desc: 'Check Chegg, Amazon, or Facebook Marketplace before buying new. Can save 50-80% per book.',
    },
    {
      icon: '🚌',
      title: 'Use Campus Transportation',
      desc: 'Save on gas and parking. Penn State offers free CATA bus service with your student ID.',
    },
    {
      icon: '💳',
      title: 'Build Credit Responsibly',
      desc: 'Consider a student credit card, but pay it off IN FULL each month to build credit without debt.',
    },
    {
      icon: '🏋️',
      title: 'Free Campus Resources',
      desc: 'Use campus gym, health services, tutoring, and career counseling instead of paying outside.',
    },
  ];

  const openLink = async (url: string) => {
    const supported = await Linking.canOpenURL(url);
    if (supported) {
      await Linking.openURL(url);
    } else {
      Alert.alert("Error", `Can't open URL: ${url}`);
    }
  };

  const filteredResources = activeCategory === 'All' 
    ? resources 
    : resources.filter(r => r.category === activeCategory);

  const dynamicStyles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    headerSection: {
      backgroundColor: colors.cardBackground,
      paddingTop: 60,
      paddingBottom: 20,
      paddingHorizontal: 20,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    headerContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 8,
    },
    header: {
      fontSize: 24,
      fontWeight: '700',
      color: colors.text,
      marginLeft: 10,
    },
    subtitle: {
      fontSize: 14,
      color: colors.textSecondary,
      marginLeft: 38,
    },
    categoryScroll: {
      paddingVertical: 16,
      paddingHorizontal: 20,
      backgroundColor: colors.cardBackground,
    },
    categoryButton: {
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 20,
      marginRight: 10,
      borderWidth: 2,
    },
    categoryButtonActive: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },
    categoryButtonInactive: {
      backgroundColor: 'transparent',
      borderColor: colors.border,
    },
    categoryText: {
      fontSize: 14,
      fontWeight: '600',
    },
    categoryTextActive: {
      color: '#fff',
    },
    categoryTextInactive: {
      color: colors.textSecondary,
    },
    content: {
      padding: 20,
    },
    sectionTitle: {
      fontSize: 20,
      fontWeight: '700',
      color: colors.text,
      marginBottom: 12,
      marginTop: 8,
    },
    tipsContainer: {
      marginBottom: 24,
    },
    tipCard: {
      backgroundColor: colors.cardBackground,
      padding: 16,
      borderRadius: 12,
      marginBottom: 12,
      flexDirection: 'row',
      borderWidth: 1,
      borderColor: colors.border,
    },
    tipIcon: {
      fontSize: 32,
      marginRight: 12,
    },
    tipContent: {
      flex: 1,
    },
    tipTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 4,
    },
    tipDesc: {
      fontSize: 14,
      color: colors.textSecondary,
      lineHeight: 20,
    },
    card: {
      backgroundColor: colors.cardBackground,
      padding: 16,
      borderRadius: 12,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: colors.border,
      shadowColor: colors.shadow,
      shadowOpacity: 0.05,
      shadowRadius: 3,
      elevation: 2,
    },
    cardHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 8,
    },
    cardIcon: {
      fontSize: 28,
      marginRight: 10,
    },
    title: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.text,
      flex: 1,
    },
    category: {
      fontSize: 11,
      color: colors.primary,
      backgroundColor: colors.primary + '20',
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 6,
      overflow: 'hidden',
      alignSelf: 'flex-start',
      marginBottom: 8,
    },
    desc: {
      fontSize: 14,
      color: colors.textSecondary,
      marginTop: 4,
      lineHeight: 20,
    },
    link: {
      marginTop: 12,
      color: colors.info,
      fontWeight: '600',
      fontSize: 14,
    },
  });

  return (
    <View style={dynamicStyles.container}>
      {/* Header */}
      <View style={dynamicStyles.headerSection}>
        <View style={dynamicStyles.headerContainer}>
          <Ionicons name="book-outline" size={28} color={colors.primary} />
          <Text style={dynamicStyles.header}>Student Resources</Text>
        </View>
        <Text style={dynamicStyles.subtitle}>Financial tools and support for Penn State students</Text>
      </View>

      {/* Category Filter */}
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        style={dynamicStyles.categoryScroll}
      >
        {categories.map((cat) => (
          <TouchableOpacity
            key={cat}
            style={[
              dynamicStyles.categoryButton,
              activeCategory === cat ? dynamicStyles.categoryButtonActive : dynamicStyles.categoryButtonInactive
            ]}
            onPress={() => setActiveCategory(cat)}
          >
            <Text 
              style={[
                dynamicStyles.categoryText,
                activeCategory === cat ? dynamicStyles.categoryTextActive : dynamicStyles.categoryTextInactive
              ]}
            >
              {cat}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Content */}
      <ScrollView style={dynamicStyles.content}>
        {/* Student Money Tips */}
        {activeCategory === 'All' && (
          <View style={dynamicStyles.tipsContainer}>
            <Text style={dynamicStyles.sectionTitle}>💡 Student Money Tips</Text>
            {studentTips.map((tip, index) => (
              <View key={index} style={dynamicStyles.tipCard}>
                <Text style={dynamicStyles.tipIcon}>{tip.icon}</Text>
                <View style={dynamicStyles.tipContent}>
                  <Text style={dynamicStyles.tipTitle}>{tip.title}</Text>
                  <Text style={dynamicStyles.tipDesc}>{tip.desc}</Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Resources */}
        <Text style={dynamicStyles.sectionTitle}>
          {activeCategory === 'All' ? '📚 All Resources' : `📚 ${activeCategory}`}
        </Text>
        {filteredResources.map((res, index) => (
          <TouchableOpacity
            key={index}
            style={dynamicStyles.card}
            onPress={() => openLink(res.url)}
          >
            <Text style={dynamicStyles.category}>{res.category}</Text>
            <View style={dynamicStyles.cardHeader}>
              <Text style={dynamicStyles.cardIcon}>{res.icon}</Text>
              <Text style={dynamicStyles.title}>{res.title}</Text>
            </View>
            <Text style={dynamicStyles.desc}>{res.desc}</Text>
            <Text style={dynamicStyles.link}>🔗 Visit Site →</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
};

export default ResourcesScreen;

import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
  Alert,
  Linking,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useTheme } from '../../context/ThemeContext';

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

  const categories = ['All', 'Taxes', 'Scholarships', 'Student Loans', 'Money Management', 'Financial Aid', 'Student Jobs', 'Budgeting Tools', 'Campus Resources', 'Learning'];

  const resources: Resource[] = [
    // TAXES FOR STUDENTS
    {
      category: 'Taxes',
      title: 'IRS Free File - Student Edition',
      url: 'https://www.irs.gov/filing/free-file-do-your-federal-taxes-for-free',
      desc: 'File your federal taxes for FREE if you earn under $73,000. Perfect for students with part-time jobs.',
      icon: '📄',
    },
    {
      category: 'Taxes',
      title: 'Student Tax Guide - IRS Publication 970',
      url: 'https://www.irs.gov/forms-pubs/about-publication-970',
      desc: 'Official IRS guide on tax benefits for education, including credits, deductions, and savings plans.',
      icon: '📖',
    },
    {
      category: 'Taxes',
      title: 'American Opportunity Tax Credit',
      url: 'https://www.irs.gov/credits-deductions/individuals/aotc',
      desc: 'Get up to $2,500 tax credit per year for tuition, fees, and course materials. Learn if you qualify.',
      icon: '💵',
    },
    {
      category: 'Taxes',
      title: 'TurboTax Student Edition',
      url: 'https://turbotax.intuit.com/personal-taxes/online/student-edition.jsp',
      desc: 'Student-friendly tax filing with education credit guidance. Free for simple returns.',
      icon: '🧾',
    },
    {
      category: 'Taxes',
      title: 'Understanding Your 1098-T Form',
      url: 'https://www.irs.gov/forms-pubs/about-form-1098-t',
      desc: 'Learn how to use your tuition statement form for tax benefits and education credits.',
      icon: '📋',
    },
    
    // SCHOLARSHIPS
    {
      category: 'Scholarships',
      title: 'Fastweb Scholarship Search',
      url: 'https://www.fastweb.com/',
      desc: 'Free scholarship database with $3.4 billion+ available. Get matched with scholarships based on your profile.',
      icon: '🎓',
    },
    {
      category: 'Scholarships',
      title: 'Penn State Scholarships',
      url: 'https://admissions.psu.edu/costs-aid/scholarships/',
      desc: 'Browse Penn State-specific scholarships, eligibility requirements, and application deadlines.',
      icon: '🦁',
    },
    {
      category: 'Scholarships',
      title: 'Scholarships.com',
      url: 'https://www.scholarships.com/',
      desc: 'Free scholarship matching service with $19 billion in scholarships and grants.',
      icon: '💰',
    },
    {
      category: 'Scholarships',
      title: 'Chegg Scholarships',
      url: 'https://www.chegg.com/scholarships',
      desc: 'No essay scholarships, easy application process, and monthly $1,000 giveaways.',
      icon: '🎯',
    },
    {
      category: 'Scholarships',
      title: 'Federal Pell Grant Info',
      url: 'https://studentaid.gov/understand-aid/types/grants/pell',
      desc: 'Learn about federal grants that don\'t need to be repaid. Up to $7,395 per year for eligible students.',
      icon: '🇺🇸',
    },
    {
      category: 'Scholarships',
      title: 'Scholarship Scam Alerts',
      url: 'https://studentaid.gov/articles/scholarship-scams/',
      desc: 'Protect yourself from scholarship scams. Learn warning signs and how to verify legitimate opportunities.',
      icon: '⚠️',
    },
    
    // STUDENT LOANS
    {
      category: 'Student Loans',
      title: 'Federal Student Aid Loan Simulator',
      url: 'https://studentaid.gov/loan-simulator/',
      desc: 'Calculate monthly payments and compare repayment plans. See how much you\'ll pay over time.',
      icon: '🧮',
    },
    {
      category: 'Student Loans',
      title: 'Understanding Student Loan Interest',
      url: 'https://studentaid.gov/understand-aid/types/loans/interest-rates',
      desc: 'Learn how interest works on federal loans, current rates, and how to minimize interest costs.',
      icon: '📊',
    },
    {
      category: 'Student Loans',
      title: 'Income-Driven Repayment Plans',
      url: 'https://studentaid.gov/manage-loans/repayment/plans/income-driven',
      desc: 'Pay based on your income and family size. Payments as low as $0/month if you qualify.',
      icon: '💳',
    },
    {
      category: 'Student Loans',
      title: 'Public Service Loan Forgiveness',
      url: 'https://studentaid.gov/manage-loans/forgiveness-cancellation/public-service',
      desc: 'Get federal loans forgiven after 10 years working in public service jobs (teaching, nursing, government).',
      icon: '🏛️',
    },
    {
      category: 'Student Loans',
      title: 'Student Loan Deferment & Forbearance',
      url: 'https://studentaid.gov/manage-loans/lower-payments/get-temporary-relief',
      desc: 'Temporarily pause payments during hardship. Learn the difference and how to apply.',
      icon: '⏸️',
    },
    {
      category: 'Student Loans',
      title: 'Avoiding Student Loan Default',
      url: 'https://studentaid.gov/manage-loans/default',
      desc: 'Critical info on default consequences and how to get back on track if struggling with payments.',
      icon: '🚨',
    },
    {
      category: 'Student Loans',
      title: 'Student Loan Refinancing Guide',
      url: 'https://www.consumerfinance.gov/ask-cfpb/what-is-student-loan-refinancing-en-2103/',
      desc: 'Learn about refinancing private loans, when it makes sense, and potential risks.',
      icon: '🔄',
    },
    
    // MONEY MANAGEMENT
    {
      category: 'Money Management',
      title: 'MyMoney.gov - Financial Education',
      url: 'https://www.mymoney.gov/',
      desc: 'U.S. government\'s free financial literacy resource. Learn budgeting, saving, credit, and investing basics.',
      icon: '🏛️',
    },
    {
      category: 'Money Management',
      title: 'Consumer Financial Protection Bureau',
      url: 'https://www.consumerfinance.gov/consumer-tools/money-as-you-grow/',
      desc: 'Age-appropriate financial lessons and money management skills for students.',
      icon: '🛡️',
    },
    {
      category: 'Money Management',
      title: 'Building Credit as a Student',
      url: 'https://www.consumerfinance.gov/consumer-tools/credit-reports-and-scores/',
      desc: 'Learn how credit works, how to build good credit, and why it matters for your future.',
      icon: '📈',
    },
    {
      category: 'Money Management',
      title: 'Student Banking Guide',
      url: 'https://www.consumerfinance.gov/consumer-tools/bank-accounts/',
      desc: 'Choose the right bank account, avoid fees, and understand banking basics.',
      icon: '🏦',
    },
    {
      category: 'Money Management',
      title: 'Emergency Fund Calculator',
      url: 'https://www.nerdwallet.com/article/banking/emergency-fund-calculator',
      desc: 'Calculate how much to save for emergencies. Aim for 3-6 months of expenses.',
      icon: '🛟',
    },
    {
      category: 'Money Management',
      title: 'Student Investment Basics',
      url: 'https://www.investor.gov/introduction-investing',
      desc: 'Learn investing fundamentals, retirement accounts (Roth IRA), and starting small with stocks.',
      icon: '📈',
    },
    {
      category: 'Money Management',
      title: 'Credit Card Basics for Students',
      url: 'https://www.consumerfinance.gov/consumer-tools/credit-cards/',
      desc: 'Understand APR, minimum payments, and how to use credit cards responsibly.',
      icon: '💳',
    },
    {
      category: 'Money Management',
      title: 'Avoiding Financial Scams',
      url: 'https://consumer.ftc.gov/articles/how-recognize-and-avoid-scams',
      desc: 'Protect yourself from phishing, identity theft, and common student-targeted scams.',
      icon: '🚫',
    },
    
    // ORIGINAL RESOURCES
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
    {
      category: 'Learning',
      title: '​PA Personal Income Tax Guide',
      url: 'https://www.pa.gov/agencies/revenue/forms-and-publications/pa-personal-income-tax-guide',
      desc: 'Information and requirements on filing taxes in PA.',
      icon: '📝',
    },
    {
      category: 'Learning',
      title: 'Tax information for students',
      url: 'https://www.irs.gov/individuals/students',
      desc: 'Student-specific tax information.',
      icon: '✍️',
    },
  ];

  const studentTips: Tip[] = [
    {
      icon: '💰',
      title: 'File Taxes to Get Money Back',
      desc: 'Even with part-time work, file taxes! You may get refunds and education credits worth $1,000-2,500.',
    },
    {
      icon: '🎓',
      title: 'Apply for Scholarships Year-Round',
      desc: 'Don\'t stop after freshman year! Many scholarships are available for continuing students. Apply monthly.',
    },
    {
      icon: '📊',
      title: 'Track Your Loans',
      desc: 'Know exactly how much you owe. Log into StudentAid.gov quarterly to track loan balances and interest.',
    },
    {
      icon: '🍕',
      title: 'Meal Planning Saves Money',
      desc: 'Cook meals in batches and pack lunches. You can save $100-200/month vs eating out daily.',
    },
    {
      icon: '📱',
      title: 'Student Discounts Everywhere',
      desc: 'Use your .edu email! Get discounts on Spotify, Apple Music, Amazon Prime, GitHub, and more.',
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
    {
      icon: '💵',
      title: 'Start Emergency Fund Now',
      desc: 'Even $10/week adds up. Aim for $500-1000 for unexpected expenses like car repairs or medical bills.',
    },
    {
      icon: '🔍',
      title: 'Review Financial Aid Every Year',
      desc: 'Your aid can change! Resubmit FAFSA by priority deadlines to maximize grants and work-study.',
    },
    {
      icon: '📲',
      title: 'Use Free Budgeting Apps',
      desc: 'Try Mint, YNAB (free for students), or this Budget Buddy app to track spending and stay on budget.',
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
    disclaimerCard: {
      padding: 16,
      borderRadius: 12,
      marginBottom: 20,
      borderWidth: 2,
      borderLeftWidth: 4,
    },
    disclaimerTitle: {
      fontSize: 16,
      fontWeight: '700',
      marginBottom: 8,
    },
    disclaimerText: {
      fontSize: 13,
      lineHeight: 20,
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
        <Text style={dynamicStyles.subtitle}>Comprehensive financial education, scholarships, taxes, loans & money management</Text>
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
        {/* Disclaimer */}
        <View style={[dynamicStyles.disclaimerCard, { backgroundColor: colors.warning + '15', borderColor: colors.warning }]}>
          <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
            <Ionicons name="alert-circle-outline" size={24} color={colors.warning} style={{ marginRight: 10, marginTop: 2 }} />
            <View style={{ flex: 1 }}>
              <Text style={[dynamicStyles.disclaimerTitle, { color: colors.text }]}>⚠️ Disclaimer</Text>
              <Text style={[dynamicStyles.disclaimerText, { color: colors.textSecondary }]}>
                Budget Buddy is not a financial advisor and we are not trained financial professionals. 
                The resources and links provided are for educational purposes only. We do not endorse, 
                guarantee, or take responsibility for any external websites, services, or information provided. 
                Always verify information independently and consult with qualified financial professionals 
                before making financial decisions.
              </Text>
            </View>
          </View>
        </View>

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

import React from 'react';
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

interface Resource {
  title: string;
  url: string;
  desc: string;
}

const ResourcesScreen: React.FC = () => {
  const resources: Resource[] = [
    {
      title: 'Penn State Student Financial Education Center',
      url: 'https://studentaffairs.psu.edu/financial/financialliteracy',
      desc: 'Workshops and one-on-one help for budgeting, debt, and saving.',
    },
    {
      title: 'Office of Student Aid',
      url: 'https://studentaid.psu.edu/',
      desc: 'Grants, scholarships, loans, and FAFSA information.',
    },
    {
      title: 'LionPATH',
      url: 'https://lionpath.psu.edu/',
      desc: 'Manage tuition bills, aid disbursements, and account balances.',
    },
    {
      title: 'Penn State Bursar’s Office',
      url: 'https://www.bursar.psu.edu/',
      desc: 'Payment plans, billing schedules, and refund information.',
    },
    {
      title: 'Career Services',
      url: 'https://studentaffairs.psu.edu/career',
      desc: 'Job search tools, financial wellness resources, and income planning.',
    },
    {
      title: 'Student Care & Advocacy',
      url: 'https://studentaffairs.psu.edu/studentcare',
      desc: 'Emergency fund assistance and financial hardship support.',
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

  return (
    <ScrollView style={styles.container}>
      <View style={styles.headerContainer}>
        <Ionicons name="book-outline" size={28} color="#001E44" />
        <Text style={styles.header}>Penn State Financial Resources</Text>
      </View>

      {resources.map((res, index) => (
        <TouchableOpacity
          key={index}
          style={styles.card}
          onPress={() => openLink(res.url)}
        >
          <Text style={styles.title}>{res.title}</Text>
          <Text style={styles.desc}>{res.desc}</Text>
          <Text style={styles.link}>📘 Visit Site</Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
};

export default ResourcesScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#FFFFFF',
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  header: {
    fontSize: 22,
    fontWeight: '700',
    color: '#001E44', // Penn State navy blue
    marginLeft: 8,
  },
  card: {
    backgroundColor: '#F5F7FA',
    padding: 16,
    borderRadius: 10,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  desc: {
    fontSize: 14,
    color: '#4B5563',
    marginTop: 4,
    lineHeight: 20,
  },
  link: {
    marginTop: 10,
    color: '#005BBB', // Penn State bright blue accent
    fontWeight: '600',
  },
});

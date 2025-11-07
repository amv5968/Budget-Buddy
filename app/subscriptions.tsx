import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, Modal, RefreshControl, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { addSubscription, deleteSubscription, getSubscriptions, type SubscriptionData } from './services/subscriptionService';

interface Subscription extends SubscriptionData {
  _id: string;
  createdAt?: string;
}

const SUBSCRIPTION_CATEGORIES = [
  '🎬 Entertainment',
  '💪 Fitness',
  '📱 Software',
  '🎵 Music',
  '📺 Streaming',
  '☁️ Cloud Storage',
  '📰 News',
  '🎮 Gaming',
  '📚 Education',
  '💼 Business',
  '🏠 Utilities',
  '🍔 Food',
  '💸 Other'
];

export default function SubscriptionsScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    amount: '',
    renewalDate: '',
    category: '💸 Other',
  });

  useFocusEffect(
    useCallback(() => {
      loadSubscriptions();
    }, [])
  );

  const loadSubscriptions = async () => {
    try {
      const data = await getSubscriptions();
      setSubscriptions(data);
    } catch (error) {
      console.error('Error loading subscriptions:', error);
      Alert.alert('Error', 'Failed to load subscriptions');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadSubscriptions();
  };

  const handleAddSubscription = async () => {
    if (!formData.name || !formData.amount || !formData.renewalDate) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    try {
      await addSubscription({
        name: formData.name,
        amount: parseFloat(formData.amount),
        renewalDate: formData.renewalDate,
        category: formData.category,
      });
      setModalVisible(false);
      setFormData({ name: '', amount: '', renewalDate: '', category: '💸 Other' });
      loadSubscriptions();
      Alert.alert('Success', 'Subscription added successfully!');
    } catch (error) {
      console.error('Error adding subscription:', error);
      Alert.alert('Error', 'Failed to add subscription');
    }
  };

  const handleDeleteSubscription = (id: string, name: string) => {
    Alert.alert(
      'Delete Subscription',
      `Are you sure you want to delete ${name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteSubscription(id);
              loadSubscriptions();
              Alert.alert('Success', 'Subscription deleted successfully!');
            } catch (error) {
              console.error('Error deleting subscription:', error);
              Alert.alert('Error', 'Failed to delete subscription');
            }
          },
        },
      ]
    );
  };

  const calculateMonthlyTotal = () => {
    return subscriptions.reduce((sum, sub) => sum + sub.amount, 0);
  };

  const calculateYearlyTotal = () => {
    return calculateMonthlyTotal() * 12;
  };

  const getDaysUntilRenewal = (renewalDate: string) => {
    const today = new Date();
    const renewal = new Date(renewalDate);
    const diffTime = renewal.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 0;
  };

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* HEADER */}
      <View style={[styles.header, { backgroundColor: colors.cardBackground }]}>
        <TouchableOpacity onPress={() => router.push('/(tabs)')}>
          <Ionicons name="arrow-back" size={26} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.text }]}>💳 Subscriptions</Text>
        <View style={{ width: 26 }} />
      </View>

      <ScrollView 
        style={styles.scrollView}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* Summary Cards */}
        <View style={styles.summaryContainer}>
          <View style={[styles.summaryCard, { backgroundColor: colors.cardBackground }]}>
            <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>Monthly Total</Text>
            <Text style={[styles.summaryValue, { color: colors.expense }]}>
              ${calculateMonthlyTotal().toFixed(2)}
            </Text>
          </View>
          <View style={[styles.summaryCard, { backgroundColor: colors.cardBackground }]}>
            <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>Yearly Total</Text>
            <Text style={[styles.summaryValue, { color: colors.warning }]}>
              ${calculateYearlyTotal().toFixed(2)}
            </Text>
          </View>
        </View>

        {/* Subscriptions List */}
        <View style={styles.content}>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            Track and manage your recurring expenses
          </Text>

          {subscriptions.length === 0 ? (
            <View style={[styles.emptyContainer, { backgroundColor: colors.cardBackground }]}>
              <Text style={{ fontSize: 48, marginBottom: 12 }}>💳</Text>
              <Text style={[styles.emptyText, { color: colors.text }]}>No subscriptions yet</Text>
              <Text style={[styles.emptySubtext, { color: colors.textSecondary }]}>
                Add your first subscription to start tracking
              </Text>
            </View>
          ) : (
            subscriptions.map((sub) => {
              const daysUntilRenewal = getDaysUntilRenewal(sub.renewalDate);
              return (
                <View key={sub._id} style={[styles.subscriptionCard, { backgroundColor: colors.cardBackground }]}>
                  <View style={styles.cardHeader}>
                    <View style={styles.cardLeft}>
                      <Text style={styles.categoryIcon}>
                        {sub.category?.split(' ')[0] || '💸'}
                      </Text>
                      <View>
                        <Text style={[styles.cardTitle, { color: colors.text }]}>{sub.name}</Text>
                        <Text style={[styles.cardCategory, { color: colors.textSecondary }]}>
                          {sub.category?.substring(2) || 'Other'}
                        </Text>
                      </View>
                    </View>
                    <TouchableOpacity
                      onPress={() => handleDeleteSubscription(sub._id, sub.name)}
                      style={styles.deleteButton}
                    >
                      <Ionicons name="trash-outline" size={20} color={colors.expense} />
                    </TouchableOpacity>
                  </View>
                  <View style={styles.cardFooter}>
                    <Text style={[styles.cardAmount, { color: colors.expense }]}>
                      ${sub.amount.toFixed(2)} / month
                    </Text>
                    <Text style={[styles.cardRenewal, { color: daysUntilRenewal <= 7 ? colors.warning : colors.textSecondary }]}>
                      {daysUntilRenewal === 0 
                        ? '📅 Renews today' 
                        : `📅 ${daysUntilRenewal} days until renewal`}
                    </Text>
                  </View>
                </View>
              );
            })
          )}
        </View>
      </ScrollView>

      {/* Add Button */}
      <TouchableOpacity
        style={[styles.addButton, { backgroundColor: colors.primary }]}
        onPress={() => setModalVisible(true)}
      >
        <Ionicons name="add-circle-outline" size={22} color="#fff" />
        <Text style={styles.addText}>Add Subscription</Text>
      </TouchableOpacity>

      {/* Add Subscription Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.background }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>Add Subscription</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={28} color={colors.text} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              <Text style={[styles.inputLabel, { color: colors.text }]}>Name</Text>
              <TextInput
                style={[styles.input, { borderColor: colors.border, color: colors.text }]}
                placeholder="e.g., Netflix, Spotify"
                placeholderTextColor={colors.textSecondary}
                value={formData.name}
                onChangeText={(text) => setFormData({ ...formData, name: text })}
              />

              <Text style={[styles.inputLabel, { color: colors.text }]}>Monthly Amount ($)</Text>
              <TextInput
                style={[styles.input, { borderColor: colors.border, color: colors.text }]}
                placeholder="0.00"
                placeholderTextColor={colors.textSecondary}
                keyboardType="decimal-pad"
                value={formData.amount}
                onChangeText={(text) => setFormData({ ...formData, amount: text })}
              />

              <Text style={[styles.inputLabel, { color: colors.text }]}>Next Renewal Date</Text>
              <TextInput
                style={[styles.input, { borderColor: colors.border, color: colors.text }]}
                placeholder="YYYY-MM-DD"
                placeholderTextColor={colors.textSecondary}
                value={formData.renewalDate}
                onChangeText={(text) => setFormData({ ...formData, renewalDate: text })}
              />

              <Text style={[styles.inputLabel, { color: colors.text }]}>Category</Text>
              <View style={styles.categoryGrid}>
                {SUBSCRIPTION_CATEGORIES.map((cat) => (
                  <TouchableOpacity
                    key={cat}
                    style={[
                      styles.categoryButton,
                      { 
                        backgroundColor: formData.category === cat ? colors.primary : colors.cardBackground,
                        borderColor: colors.border 
                      }
                    ]}
                    onPress={() => setFormData({ ...formData, category: cat })}
                  >
                    <Text style={[
                      styles.categoryButtonText,
                      { color: formData.category === cat ? '#fff' : colors.text }
                    ]}>
                      {cat}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>

            <TouchableOpacity
              style={[styles.modalAddButton, { backgroundColor: colors.primary }]}
              onPress={handleAddSubscription}
            >
              <Text style={styles.modalAddText}>Add Subscription</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 16,
    borderBottomWidth: 1,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
  },
  scrollView: {
    flex: 1,
  },
  summaryContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 20,
    gap: 12,
  },
  summaryCard: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    elevation: 2,
  },
  summaryLabel: {
    fontSize: 12,
    marginBottom: 8,
    fontWeight: '600',
  },
  summaryValue: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  content: {
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  subtitle: {
    fontSize: 14,
    marginBottom: 20,
  },
  emptyContainer: {
    padding: 40,
    borderRadius: 16,
    alignItems: 'center',
    marginTop: 20,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    textAlign: 'center',
  },
  subscriptionCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  categoryIcon: {
    fontSize: 32,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  cardCategory: {
    fontSize: 12,
    marginTop: 2,
  },
  deleteButton: {
    padding: 8,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(128, 128, 128, 0.2)',
  },
  cardAmount: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  cardRenewal: {
    fontSize: 12,
  },
  addButton: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    padding: 16,
    elevation: 4,
  },
  addText: {
    color: '#fff',
    fontWeight: 'bold',
    marginLeft: 8,
    fontSize: 16,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingBottom: 40,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(128, 128, 128, 0.2)',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  modalBody: {
    padding: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    marginTop: 12,
  },
  input: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    fontSize: 16,
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
  },
  categoryButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
  },
  categoryButtonText: {
    fontSize: 13,
    fontWeight: '600',
  },
  modalAddButton: {
    margin: 20,
    marginTop: 0,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  modalAddText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
});

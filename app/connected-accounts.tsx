import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Modal,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { useTheme } from '../context/ThemeContext';

interface ConnectedAccount {
  id: string;
  institutionName: string;
  accountType: 'checking' | 'savings' | 'credit_card' | 'investment' | 'loan';
  accountNumber: string;
  balance: number;
  lastSync: Date;
  logo: string;
  nickname?: string;
}

const INSTITUTION_TYPES = [
  { value: 'checking', label: 'Checking Account', icon: '🏦' },
  { value: 'savings', label: 'Savings Account', icon: '💰' },
  { value: 'credit_card', label: 'Credit Card', icon: '💳' },
  { value: 'investment', label: 'Investment Account', icon: '📈' },
  { value: 'loan', label: 'Loan Account', icon: '🏠' },
];

const POPULAR_INSTITUTIONS = [
  { name: 'Chase Bank', logo: '🏦', color: '#0078C8' },
  { name: 'Bank of America', logo: '🏛️', color: '#E31837' },
  { name: 'Wells Fargo', logo: '🐴', color: '#D71E28' },
  { name: 'Capital One', logo: '💳', color: '#004879' },
  { name: 'Discover', logo: '🔶', color: '#FF6000' },
  { name: 'American Express', logo: '💎', color: '#006FCF' },
  { name: 'Citibank', logo: '🏢', color: '#003B71' },
  { name: 'US Bank', logo: '🏦', color: '#C8102E' },
  { name: 'TD Bank', logo: '💚', color: '#00A758' },
  { name: 'PNC Bank', logo: '🏦', color: '#F58220' },
  { name: 'Fidelity Investments', logo: '📊', color: '#00703C' },
  { name: 'Charles Schwab', logo: '📈', color: '#00A0DF' },
  { name: 'Vanguard', logo: '⛵', color: '#C8102E' },
  { name: 'Robinhood', logo: '🦅', color: '#00C805' },
];

export default function ConnectedAccountsScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const [accounts, setAccounts] = useState<ConnectedAccount[]>([
    {
      id: '1',
      institutionName: 'Chase Bank',
      accountType: 'checking',
      accountNumber: '****1234',
      balance: 2450.75,
      lastSync: new Date(),
      logo: '🏦',
      nickname: 'Main Checking',
    },
    {
      id: '2',
      institutionName: 'Capital One',
      accountType: 'credit_card',
      accountNumber: '****5678',
      balance: -1250.00,
      lastSync: new Date(),
      logo: '💳',
      nickname: 'Rewards Card',
    },
  ]);

  const [modalVisible, setModalVisible] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [selectedInstitution, setSelectedInstitution] = useState('');
  const [accountType, setAccountType] = useState<'checking' | 'savings' | 'credit_card' | 'investment' | 'loan'>('checking');
  const [accountNumber, setAccountNumber] = useState('');
  const [nickname, setNickname] = useState('');
  const [initialBalance, setInitialBalance] = useState('');

  const handleAddAccount = () => {
    if (!selectedInstitution || !accountNumber) {
      Alert.alert('Missing Information', 'Please fill in all required fields.');
      return;
    }

    setConnecting(true);

    // Simulate connection process
    setTimeout(() => {
      const institution = POPULAR_INSTITUTIONS.find(i => i.name === selectedInstitution);
      const newAccount: ConnectedAccount = {
        id: Date.now().toString(),
        institutionName: selectedInstitution,
        accountType,
        accountNumber: `****${accountNumber.slice(-4)}`,
        balance: parseFloat(initialBalance) || 0,
        lastSync: new Date(),
        logo: institution?.logo || '🏦',
        nickname: nickname || undefined,
      };

      setAccounts([...accounts, newAccount]);
      setConnecting(false);
      setModalVisible(false);
      
      // Reset form
      setSelectedInstitution('');
      setAccountNumber('');
      setNickname('');
      setInitialBalance('');
      setAccountType('checking');

      Alert.alert('✅ Account Connected!', `Successfully connected ${selectedInstitution}.`);
    }, 2000);
  };

  const handleRemoveAccount = (id: string, name: string) => {
    Alert.alert(
      'Remove Account',
      `Are you sure you want to disconnect ${name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => {
            setAccounts(accounts.filter(acc => acc.id !== id));
            Alert.alert('Account Removed', `${name} has been disconnected.`);
          },
        },
      ]
    );
  };

  const handleSyncAccount = (id: string) => {
    Alert.alert('Syncing...', 'Refreshing account balance...');
    setTimeout(() => {
      setAccounts(accounts.map(acc => 
        acc.id === id ? { ...acc, lastSync: new Date() } : acc
      ));
      Alert.alert('✅ Sync Complete', 'Account balance updated.');
    }, 1500);
  };

  const getAccountTypeInfo = (type: string) => {
    return INSTITUTION_TYPES.find(t => t.value === type) || INSTITUTION_TYPES[0];
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(Math.abs(amount));
  };

  const formatLastSync = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (minutes < 1440) return `${Math.floor(minutes / 60)}h ago`;
    return date.toLocaleDateString();
  };

  const totalBalance = accounts.reduce((sum, acc) => sum + acc.balance, 0);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.cardBackground, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.push('/(tabs)')}>
          <Ionicons name="arrow-back" size={26} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.text }]}>🏦 Connected Accounts</Text>
        <View style={{ width: 26 }} />
      </View>

      <ScrollView style={styles.content}>
        {/* Total Balance Card */}
        <View style={[styles.balanceCard, { backgroundColor: colors.primary }]}>
          <Text style={styles.balanceLabel}>Total Balance</Text>
          <Text style={styles.balanceAmount}>{formatCurrency(totalBalance)}</Text>
          <Text style={styles.balanceSubtext}>
            Across {accounts.length} {accounts.length === 1 ? 'account' : 'accounts'}
          </Text>
        </View>

        {/* Info Banner */}
        <View style={[styles.infoBanner, { backgroundColor: colors.cardBackground, borderColor: colors.info }]}>
          <Ionicons name="information-circle" size={20} color={colors.info} style={{ marginRight: 10 }} />
          <Text style={[styles.infoText, { color: colors.textSecondary }]}>
            Link your accounts to automatically track transactions and balances in one place.
          </Text>
        </View>

        {/* Connected Accounts */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Your Connected Accounts</Text>
          
          {accounts.length === 0 ? (
            <View style={[styles.emptyState, { backgroundColor: colors.cardBackground }]}>
              <Text style={{ fontSize: 48, marginBottom: 12 }}>🏦</Text>
              <Text style={[styles.emptyTitle, { color: colors.text }]}>No Connected Accounts</Text>
              <Text style={[styles.emptyDesc, { color: colors.textSecondary }]}>
                Connect your bank, credit card, or investment accounts to get started
              </Text>
            </View>
          ) : (
            accounts.map((account) => {
              const typeInfo = getAccountTypeInfo(account.accountType);
              return (
                <View key={account.id} style={[styles.accountCard, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}>
                  <View style={styles.accountHeader}>
                    <View style={styles.accountLeft}>
                      <View style={[styles.institutionLogo, { backgroundColor: colors.primary + '20' }]}>
                        <Text style={styles.logoText}>{account.logo}</Text>
                      </View>
                      <View style={styles.accountInfo}>
                        <Text style={[styles.accountName, { color: colors.text }]}>
                          {account.nickname || account.institutionName}
                        </Text>
                        <Text style={[styles.accountMeta, { color: colors.textSecondary }]}>
                          {typeInfo.label} • {account.accountNumber}
                        </Text>
                        <Text style={[styles.lastSync, { color: colors.textSecondary }]}>
                          Updated {formatLastSync(account.lastSync)}
                        </Text>
                      </View>
                    </View>
                    <View style={styles.accountRight}>
                      <Text style={[
                        styles.accountBalance,
                        { color: account.balance >= 0 ? colors.income : colors.expense }
                      ]}>
                        {account.balance >= 0 ? '' : '-'}{formatCurrency(account.balance)}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.accountActions}>
                    <TouchableOpacity
                      style={[styles.actionButton, { borderColor: colors.border }]}
                      onPress={() => handleSyncAccount(account.id)}
                    >
                      <Ionicons name="sync-outline" size={16} color={colors.primary} />
                      <Text style={[styles.actionButtonText, { color: colors.primary }]}>Sync</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.actionButton, { borderColor: colors.border }]}
                      onPress={() => handleRemoveAccount(account.id, account.institutionName)}
                    >
                      <Ionicons name="trash-outline" size={16} color={colors.expense} />
                      <Text style={[styles.actionButtonText, { color: colors.expense }]}>Remove</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })
          )}
        </View>

        {/* Security Notice */}
        <View style={[styles.securityNotice, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}>
          <Ionicons name="shield-checkmark" size={24} color="#4CAF50" style={{ marginRight: 12 }} />
          <View style={{ flex: 1 }}>
            <Text style={[styles.securityTitle, { color: colors.text }]}>🔒 Bank-Level Security</Text>
            <Text style={[styles.securityText, { color: colors.textSecondary }]}>
              Your data is encrypted with 256-bit encryption. We never store your login credentials.
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* Add Account Button */}
      <TouchableOpacity
        style={[styles.addButton, { backgroundColor: colors.primary }]}
        onPress={() => setModalVisible(true)}
      >
        <Ionicons name="add-circle-outline" size={22} color="#fff" />
        <Text style={styles.addButtonText}>Connect Account</Text>
      </TouchableOpacity>

      {/* Add Account Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.background }]}>
            <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>Connect Account</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={28} color={colors.text} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              {/* Institution Selection */}
              <Text style={[styles.inputLabel, { color: colors.text }]}>Select Institution *</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.institutionGrid}>
                {POPULAR_INSTITUTIONS.map((institution) => (
                  <TouchableOpacity
                    key={institution.name}
                    style={[
                      styles.institutionButton,
                      {
                        backgroundColor: selectedInstitution === institution.name ? colors.primary + '20' : colors.cardBackground,
                        borderColor: selectedInstitution === institution.name ? colors.primary : colors.border,
                      }
                    ]}
                    onPress={() => setSelectedInstitution(institution.name)}
                  >
                    <Text style={styles.modalInstitutionLogo}>{institution.logo}</Text>
                    <Text style={[styles.institutionName, { color: colors.text }]} numberOfLines={2}>
                      {institution.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              {/* Account Type */}
              <Text style={[styles.inputLabel, { color: colors.text }]}>Account Type *</Text>
              <View style={styles.typeGrid}>
                {INSTITUTION_TYPES.map((type) => (
                  <TouchableOpacity
                    key={type.value}
                    style={[
                      styles.typeButton,
                      {
                        backgroundColor: accountType === type.value ? colors.primary + '20' : colors.cardBackground,
                        borderColor: accountType === type.value ? colors.primary : colors.border,
                      }
                    ]}
                    onPress={() => setAccountType(type.value as any)}
                  >
                    <Text style={styles.typeIcon}>{type.icon}</Text>
                    <Text style={[styles.typeLabel, { color: colors.text }]}>{type.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Account Number */}
              <Text style={[styles.inputLabel, { color: colors.text }]}>Account Number *</Text>
              <TextInput
                style={[styles.input, { borderColor: colors.border, color: colors.text, backgroundColor: colors.cardBackground }]}
                placeholder="Last 4 digits"
                placeholderTextColor={colors.textSecondary}
                keyboardType="numeric"
                maxLength={4}
                value={accountNumber}
                onChangeText={setAccountNumber}
              />

              {/* Nickname */}
              <Text style={[styles.inputLabel, { color: colors.text }]}>Nickname (Optional)</Text>
              <TextInput
                style={[styles.input, { borderColor: colors.border, color: colors.text, backgroundColor: colors.cardBackground }]}
                placeholder="e.g., Main Checking, Rewards Card"
                placeholderTextColor={colors.textSecondary}
                value={nickname}
                onChangeText={setNickname}
              />

              {/* Initial Balance */}
              <Text style={[styles.inputLabel, { color: colors.text }]}>Current Balance</Text>
              <TextInput
                style={[styles.input, { borderColor: colors.border, color: colors.text, backgroundColor: colors.cardBackground }]}
                placeholder="0.00"
                placeholderTextColor={colors.textSecondary}
                keyboardType="decimal-pad"
                value={initialBalance}
                onChangeText={setInitialBalance}
              />

              <View style={[styles.disclaimer, { backgroundColor: colors.warning + '15', borderColor: colors.warning }]}>
                <Ionicons name="lock-closed" size={16} color={colors.warning} style={{ marginRight: 8 }} />
                <Text style={[styles.disclaimerText, { color: colors.textSecondary }]}>
                  This is a demo feature. In production, you would securely connect via Plaid or similar service.
                </Text>
              </View>
            </ScrollView>

            <TouchableOpacity
              style={[styles.connectButton, { backgroundColor: colors.primary }]}
              onPress={handleAddAccount}
              disabled={connecting}
            >
              {connecting ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.connectButtonText}>Connect Account</Text>
              )}
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
  content: {
    flex: 1,
    padding: 20,
  },
  balanceCard: {
    padding: 24,
    borderRadius: 16,
    marginBottom: 20,
    elevation: 4,
  },
  balanceLabel: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 14,
    marginBottom: 8,
    fontWeight: '600',
  },
  balanceAmount: {
    color: '#fff',
    fontSize: 36,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  balanceSubtext: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 13,
  },
  infoBanner: {
    flexDirection: 'row',
    padding: 12,
    borderRadius: 8,
    marginBottom: 20,
    borderWidth: 1,
    alignItems: 'center',
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 16,
  },
  emptyState: {
    padding: 40,
    borderRadius: 12,
    alignItems: 'center',
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
  },
  emptyDesc: {
    fontSize: 14,
    textAlign: 'center',
  },
  accountCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    elevation: 2,
  },
  accountHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  accountLeft: {
    flexDirection: 'row',
    flex: 1,
  },
  institutionLogo: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  logoText: {
    fontSize: 24,
  },
  accountInfo: {
    flex: 1,
  },
  accountName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  accountMeta: {
    fontSize: 13,
    marginBottom: 2,
  },
  lastSync: {
    fontSize: 11,
  },
  accountRight: {
    alignItems: 'flex-end',
  },
  accountBalance: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  accountActions: {
    flexDirection: 'row',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(128,128,128,0.2)',
    justifyContent: 'space-between',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
  },
  securityNotice: {
    flexDirection: 'row',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 100,
  },
  securityTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  securityText: {
    fontSize: 13,
    lineHeight: 18,
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
  addButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    marginLeft: 8,
    fontSize: 16,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
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
  institutionGrid: {
    marginBottom: 16,
  },
  institutionButton: {
    width: 100,
    padding: 12,
    borderRadius: 12,
    borderWidth: 2,
    alignItems: 'center',
    marginRight: 12,
  },
  modalInstitutionLogo: {
    fontSize: 32,
    marginBottom: 8,
  },
  institutionName: {
    fontSize: 11,
    fontWeight: '600',
    textAlign: 'center',
  },
  typeGrid: {
    marginBottom: 16,
  },
  typeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 10,
    borderWidth: 2,
    marginBottom: 8,
  },
  typeIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  typeLabel: {
    fontSize: 15,
    fontWeight: '600',
  },
  input: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    fontSize: 16,
    marginBottom: 8,
  },
  disclaimer: {
    flexDirection: 'row',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    marginTop: 16,
    alignItems: 'center',
  },
  disclaimerText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 16,
  },
  connectButton: {
    margin: 20,
    marginTop: 0,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  connectButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
});


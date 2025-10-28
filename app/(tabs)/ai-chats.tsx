import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

// ⬇️ NEW IMPORTS
import { getUserProfile } from '../services/authService';
import {
  buildAIBuddyMessages,
  buildInsights,
} from '../services/insightsService';
import {
  getTransactions,
  getTransactionStats,
  Transaction,
} from '../services/transactionService';

// Chat message shape
type ChatMsg = {
  from: 'bot' | 'you';
  text: string;
};

export default function AiBuddyScreen() {
  const router = useRouter();

  // chat UI state
  const [messages, setMessages] = useState<ChatMsg[]>([
    {
      from: 'bot',
      text:
        "👋 I'm AI Buddy. I can help explain your money.\n\n" +
        'Try asking:\n' +
        '• "How much did I spend on food this month?"\n' +
        '• "Am I over budget?"\n' +
        '• "How close am I to my savings goal?"',
    },
  ]);
  const [draft, setDraft] = useState('');

  // financial data state
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [monthlyAllowance, setMonthlyAllowance] = useState<number>(1000);

  // load user's transactions + allowance on mount
  useEffect(() => {
    const loadData = async () => {
      try {
        const tx = await getTransactions();
        setTransactions(tx);

        const profile = await getUserProfile();
        if (profile?.monthlyAllowance != null) {
          setMonthlyAllowance(profile.monthlyAllowance);
        }

        // optional, not currently used but might warm the cache
        await getTransactionStats();
      } catch (err) {
        console.warn('[AI Buddy] failed to load data:', err);
      }
    };

    loadData();
  }, []);

  // helper: build AI reply text using insightsService
  async function generateReply(userQuestion: string): Promise<string> {
    // figure out dates (this month vs last month)
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1); // e.g. Oct 1
    const prevMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1); // e.g. Sep 1
    const prevMonthEnd = new Date(now.getFullYear(), now.getMonth(), 1); // e.g. Oct 1 (acts as "end" of previous)

    const insight = buildInsights(
      transactions,
      monthlyAllowance,
      monthStart.toISOString(),
      prevMonthStart.toISOString(),
      prevMonthEnd.toISOString()
    );

    const { statusText, adviceText } = buildAIBuddyMessages(insight);

    // 🔮 future: inspect userQuestion and tailor the answer.
    // for now we always send status + advice.
    return `${statusText}\n\n${adviceText}`;
  }

  // send button
  
  const handleSend = async () => {
  const trimmed = draft.trim();
  if (!trimmed) return;

  // Clear input and show the user message once
  setDraft('');
  setMessages(prev => [...prev, { from: 'you', text: trimmed }]);

  try {
    // Only generate one bot reply per send
    const reply = await generateReply(trimmed); // or buildAIBuddyMessages(), etc.

    // Append ONE bot response
    setMessages(prev => [...prev, { from: 'bot', text: reply }]);
  } catch (err) {
    console.error('AI Buddy error:', err);
    setMessages(prev => [
      ...prev,
      { from: 'bot', text: '⚠️ Something went wrong getting the response.' },
    ]);
  }
};
;

  return (
    <View style={styles.screen}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={10}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>

        <Text style={styles.headerTitle}>AI Buddy</Text>

        {/* spacer to balance Back button visually */}
        <View style={{ width: 50 }} />
      </View>

      {/* Chat area */}
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={80}
      >
        <ScrollView
          style={styles.chatScroll}
          contentContainerStyle={styles.chatContent}
        >
          {messages.map((m, idx) => (
            <View
              key={idx}
              style={[
                styles.bubble,
                m.from === 'you' ? styles.youBubble : styles.botBubble,
              ]}
            >
              <Text
                style={[
                  styles.bubbleText,
                  m.from === 'you' ? styles.youText : styles.botText,
                ]}
              >
                {m.text}
              </Text>
            </View>
          ))}
        </ScrollView>

        {/* Input row */}
        <View style={styles.inputRow}>
          <TextInput
            style={styles.input}
            placeholder="Ask about your spending, savings, goals..."
            placeholderTextColor="#888"
            value={draft}
            onChangeText={setDraft}
            multiline
          />

          <TouchableOpacity
            style={styles.sendButton}
            activeOpacity={0.7}
            onPress={handleSend}
          >
            <Text style={styles.sendButtonText}>Send</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

// --- styles (unchanged from yours) ---
const BG_APP = '#F6F6F6';
const BG_CARD = '#FFFFFF';
const BORDER = '#E0E0E0';
const TEXT_MAIN = '#222';
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
  chatScroll: {
    flex: 1,
    backgroundColor: BG_APP,
  },
  chatContent: {
    padding: 16,
    paddingBottom: 100,
  },
  bubble: {
    maxWidth: '80%',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
  },
  botBubble: {
    backgroundColor: '#E8F5E9',
    borderColor: '#C8E6C9',
    alignSelf: 'flex-start',
  },
  youBubble: {
    backgroundColor: '#FFFFFF',
    borderColor: BORDER,
    alignSelf: 'flex-end',
  },
  bubbleText: {
    fontSize: 15,
    lineHeight: 20,
    color: TEXT_MAIN,
  },
  youText: {
    fontWeight: '500',
  },
  botText: {},
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: BG_CARD,
    borderTopWidth: 1,
    borderTopColor: BORDER,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  input: {
    flex: 1,
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    color: TEXT_MAIN,
    maxHeight: 100,
  },
  sendButton: {
    marginLeft: 8,
    backgroundColor: ACCENT,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
  },
  sendButtonText: {
    color: '#FFF',
    fontWeight: '600',
    fontSize: 15,
  },
});

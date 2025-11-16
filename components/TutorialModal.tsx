import React, { useState } from 'react';
import { Modal, View, Text,
  TouchableOpacity,  StyleSheet,Dimensions, } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';

const { width } = Dimensions.get('window');

interface TutorialModalProps {
  visible: boolean;
  onClose: () => void;
}

const PAGES = [
  {
    id: 'home',
    icon: 'home-outline' as const,
    title: 'Welcome to Budget Buddy',
    description:
      'Track your income, expenses, goals and budgets all in one place. This quick tour will show you the basics.',
  },
  {
    id: 'allowance',
    icon: 'wallet-outline' as const,
    title: 'Monthly Allowance',
    description:
      'Set your monthly allowance so we can show you how much you’ve spent and what’s left for the month.',
  },
  {
    id: 'goals',
    icon: 'trophy-outline' as const,
    title: 'Savings Goals',
    description:
      'Create savings goals like “New Phone” or “Summer Trip” and track progress as you add transactions.',
  },
  {
    id: 'budgets',
    icon: 'pie-chart-outline' as const,
    title: 'Category Budgets',
    description:
      'Set budgets for categories like Food, Groceries and Transport so you can see where your money goes.',
  },
];

export default function TutorialModal({ visible, onClose }: TutorialModalProps) {
  const { colors } = useTheme();
  const [pageIndex, setPageIndex] = useState(0);

  const isLastPage = pageIndex === PAGES.length - 1;
  const page = PAGES[pageIndex];

  const handleNext = () => {
    if (isLastPage) {
      onClose();
      setPageIndex(0);
    } else {
      setPageIndex((prev) => prev + 1);
    }
  };

  const handleBack = () => {
    // Go to previous page
    setPageIndex((prev) => (prev > 0 ? prev - 1 : prev));
  };

  const handleSkip = () => {
    // Close and reset to first page
    onClose();
    setPageIndex(0);
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={[styles.card, { backgroundColor: colors.cardBackground }]}>
          {/* Top-right Skip */}
          <View style={styles.topRow}>
            <TouchableOpacity
              onPress={handleSkip}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Text style={[styles.skipText, { color: colors.textSecondary }]}>
                Skip
              </Text>
            </TouchableOpacity>
          </View>

          {/* Icon */}
          <View style={styles.iconContainer}>
            <Ionicons name={page.icon} size={40} color={colors.primary} />
          </View>

          {/* Title & description */}
          <Text style={[styles.title, { color: colors.text }]}>{page.title}</Text>
          <Text style={[styles.description, { color: colors.textSecondary }]}>
            {page.description}
          </Text>

          {/* Dots */}
          <View style={styles.dotsRow}>
            {PAGES.map((p, i) => (
              <View
                key={p.id}
                style={[
                  styles.dot,
                  {
                    backgroundColor:
                      i === pageIndex ? colors.primary : colors.border,
                  },
                ]}
              />
            ))}
          </View>

          {/* Bottom buttons: Back / Next */}
          <View style={styles.buttonsRow}>
            {pageIndex > 0 ? (
              <TouchableOpacity
                style={styles.secondaryButton}
                onPress={handleBack}
              >
                <Text
                  style={[
                    styles.secondaryButtonText,
                    { color: colors.textSecondary },
                  ]}
                >
                  Back
                </Text>
              </TouchableOpacity>
            ) : (
              // Spacer so layout stays balanced when Back is hidden
              <View style={styles.secondaryButton} />
            )}

            <TouchableOpacity
              style={[styles.primaryButton, { backgroundColor: colors.primary }]}
              onPress={handleNext}
            >
              <Text style={styles.primaryButtonText}>
                {isLastPage ? 'Got it' : 'Next'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  card: {
    width: width * 0.9,
    borderRadius: 20,
    padding: 20,
    paddingBottom: 24,
    elevation: 6,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  skipText: {
    fontSize: 14,
    fontWeight: '500',
  },
  iconContainer: {
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 10,
  },
  description: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  dotsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 16,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginHorizontal: 4,
  },
  buttonsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  secondaryButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 999,
  },
  secondaryButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
  primaryButton: {
    paddingVertical: 10,
    paddingHorizontal: 22,
    borderRadius: 999,
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
});

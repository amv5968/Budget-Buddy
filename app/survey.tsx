import AsyncStorage from '@react-native-async-storage/async-storage';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useTheme } from '../context/ThemeContext';

const SURVEY_KEY = 'bb.survey.responses';

export default function SurveyScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const returnTo = (params.returnTo as string) || '/(tabs)';
  const { colors } = useTheme();

  const [rating, setRating] = useState<number>(0);
  const [feedback, setFeedback] = useState('');
  const [suggestions, setSuggestions] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleGoBack = () => {
    router.navigate(returnTo as any);
  };

  const handleSubmit = async () => {
    if (rating === 0) {
      Alert.alert('Rating Required', 'Please rate the app before submitting.');
      return;
    }

    setIsSubmitting(true);

    try {
      // Save survey response to AsyncStorage
      const existingSurveys = await AsyncStorage.getItem(SURVEY_KEY);
      const surveys = existingSurveys ? JSON.parse(existingSurveys) : [];
      
      const surveyResponse = {
        id: Date.now().toString(),
        rating,
        feedback: feedback.trim(),
        suggestions: suggestions.trim(),
        date: new Date().toISOString(),
      };

      surveys.push(surveyResponse);
      await AsyncStorage.setItem(SURVEY_KEY, JSON.stringify(surveys));

      Alert.alert(
        '✅ Thank You!',
        'Your feedback has been submitted. We appreciate your input!',
        [
          {
            text: 'OK',
            onPress: () => {
              // Reset form
              setRating(0);
              setFeedback('');
              setSuggestions('');
              router.navigate(returnTo as any);
            },
          },
        ]
      );
    } catch (error) {
      console.error('Error submitting survey:', error);
      Alert.alert('Error', 'Failed to submit feedback. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
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
    ratingContainer: {
      alignItems: 'center',
      marginVertical: 20,
    },
    ratingTitle: {
      fontSize: 16,
      fontWeight: '600',
      marginBottom: 20,
      color: colors.text,
    },
    starsContainer: {
      flexDirection: 'row',
      gap: 10,
    },
    starButton: {
      padding: 8,
    },
    starText: {
      fontSize: 40,
    },
    ratingLabel: {
      fontSize: 14,
      marginTop: 12,
      color: colors.textSecondary,
      fontWeight: '500',
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
      minHeight: 100,
      textAlignVertical: 'top',
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
    thankYouMessage: {
      backgroundColor: colors.primary + '15',
      borderRadius: 12,
      padding: 16,
      marginBottom: 20,
      borderWidth: 1,
      borderColor: colors.primary,
    },
    thankYouText: {
      fontSize: 14,
      color: colors.text,
      lineHeight: 20,
    },
  });

  const getRatingLabel = (rating: number): string => {
    switch (rating) {
      case 1:
        return 'Poor';
      case 2:
        return 'Fair';
      case 3:
        return 'Good';
      case 4:
        return 'Very Good';
      case 5:
        return 'Excellent';
      default:
        return 'Rate your experience';
    }
  };

  return (
    <ScrollView contentContainerStyle={dynamicStyles.container}>
      {/* Header */}
      <View style={dynamicStyles.headerRow}>
        <TouchableOpacity onPress={handleGoBack} style={dynamicStyles.backButton}>
          <Text style={dynamicStyles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={dynamicStyles.header}>App Feedback</Text>
      </View>

      {/* Thank You Message */}
      <View style={dynamicStyles.thankYouMessage}>
        <Text style={dynamicStyles.thankYouText}>
          💬 We'd love to hear from you! Your feedback helps us improve Budget Buddy and make it better for everyone.
        </Text>
      </View>

      {/* Rating Section */}
      <View style={dynamicStyles.section}>
        <Text style={dynamicStyles.sectionHeader}>⭐ Rate Your Experience</Text>
        <View style={dynamicStyles.ratingContainer}>
          <Text style={dynamicStyles.ratingTitle}>How would you rate Budget Buddy?</Text>
          <View style={dynamicStyles.starsContainer}>
            {[1, 2, 3, 4, 5].map((star) => (
              <TouchableOpacity
                key={star}
                style={dynamicStyles.starButton}
                onPress={() => setRating(star)}
              >
                <Text style={dynamicStyles.starText}>
                  {star <= rating ? '⭐' : '☆'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          <Text style={dynamicStyles.ratingLabel}>
            {getRatingLabel(rating)}
          </Text>
        </View>
      </View>

      {/* Feedback Section */}
      <View style={dynamicStyles.section}>
        <Text style={dynamicStyles.sectionHeader}>💭 Your Feedback</Text>
        <Text style={dynamicStyles.label}>
          What do you like about Budget Buddy? What could be improved?
        </Text>
        <TextInput
          style={dynamicStyles.input}
          placeholder="Tell us about your experience..."
          placeholderTextColor={colors.textSecondary}
          value={feedback}
          onChangeText={setFeedback}
          multiline
          numberOfLines={5}
        />
      </View>

      {/* Suggestions Section */}
      <View style={dynamicStyles.section}>
        <Text style={dynamicStyles.sectionHeader}>💡 Suggestions</Text>
        <Text style={dynamicStyles.label}>
          Do you have any feature requests or suggestions for future updates?
        </Text>
        <TextInput
          style={dynamicStyles.input}
          placeholder="Share your ideas..."
          placeholderTextColor={colors.textSecondary}
          value={suggestions}
          onChangeText={setSuggestions}
          multiline
          numberOfLines={5}
        />
      </View>

      {/* Submit Button */}
      <TouchableOpacity
        style={[
          dynamicStyles.submitButton,
          (rating === 0 || isSubmitting) && dynamicStyles.submitButtonDisabled,
        ]}
        onPress={handleSubmit}
        disabled={rating === 0 || isSubmitting}
      >
        <Text style={dynamicStyles.submitButtonText}>
          {isSubmitting ? 'Submitting...' : 'Submit Feedback'}
        </Text>
      </TouchableOpacity>

      <Text
        style={{
          fontSize: 12,
          color: colors.textSecondary,
          textAlign: 'center',
          marginTop: 20,
          fontStyle: 'italic',
        }}
      >
        Your feedback is anonymous and helps us improve the app.
      </Text>
    </ScrollView>
  );
}


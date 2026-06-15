import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Feather from 'react-native-vector-icons/Feather';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation, useRoute } from '@react-navigation/native';
import colors from '../../../theme/colors';
import { hapticTap } from '../../../utils/haptics';
import { applyReminder } from '../../../utils/notifications';

const APP_INFO_SEEN_KEY = 'appInfoSeen';
const USER_PREFERENCES_KEY = 'userPreferences';

// Info slides: purpose of the app + how to use each section.
const INFO_SLIDES = [
  {
    image: require('../../../assets/images/Edeen (1) (1).png'),
    badge: '#FBEAAF',
    title: 'Welcome to EDeen',
    body: 'EDeen helps you build meaningful Islamic habits over 40 days — tracking prayers, duas, daily habits and reflections, all in one calm space.',
  },
  {
    image: require('../../../assets/navigation/habbit.png'),
    badge: '#F4C9E4',
    title: 'Habit Tracker',
    body: 'Create a habit, choose 40 Days or specific days of the week, and check off each day. Watch your light-green progress bar fill as your streak grows.',
  },
  {
    image: require('../../../assets/navigation/dua.png'),
    badge: '#DCEAFE',
    title: 'Dua Bank',
    body: 'Browse morning and evening adhkar and daily duas. Tap the heart to save your favourites and find them under “My Favourite Duas”.',
  },
  {
    image: require('../../../assets/navigation/salah.jpg'),
    badge: '#D9F2FA',
    title: 'Salah Tracker',
    body: 'Keep track of your five daily prayers and stay consistent. Your location helps show accurate prayer times.',
  },
  {
    image: require('../../../assets/navigation/journal.png'),
    badge: '#DFF4E4',
    title: 'Journal',
    body: 'Reflect on your day, pick how you feel, and the journal adapts its colours to your mood. Look back on your entries anytime.',
  },
];

// Quiz: a few questions to tailor the app to the user.
const QUIZ = [
  {
    key: 'goal',
    question: 'What is your main goal with EDeen?',
    options: [
      { label: 'Build daily habits', value: 'habits' },
      { label: 'Strengthen my prayers', value: 'salah' },
      { label: 'Daily reflection & journaling', value: 'journal' },
      { label: 'Learn and memorise duas', value: 'dua' },
    ],
  },
  {
    key: 'reminderTime',
    question: 'When would you like your daily reminder?',
    options: [
      { label: 'Morning (8:00 AM)', value: { hour: 8, minute: 0 } },
      { label: 'Afternoon (12:00 PM)', value: { hour: 12, minute: 0 } },
      { label: 'Evening (6:00 PM)', value: { hour: 18, minute: 0 } },
      { label: 'Night (9:00 PM)', value: { hour: 21, minute: 0 } },
    ],
  },
  {
    key: 'experience',
    question: 'How would you describe your routine right now?',
    options: [
      { label: 'Just getting started', value: 'beginner' },
      { label: 'Somewhat consistent', value: 'intermediate' },
      { label: 'Very consistent', value: 'advanced' },
    ],
  },
];

export default function AppInfoScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const isFirstRun = Boolean(route.params?.firstRun);
  // Shown before auth on first launch: finishing/skipping goes to Login.
  const isPreAuth = Boolean(route.params?.preAuth);

  // Where to go when leaving onboarding:
  //  - pre-login first run  -> Auth (Login)
  //  - post-login first run -> Main tabs
  //  - opened from Profile  -> back to Profile
  const exitOnboarding = () => {
    if (isPreAuth) {
      navigation.reset({ index: 0, routes: [{ name: 'Auth' }] });
    } else if (isFirstRun) {
      navigation.reset({ index: 0, routes: [{ name: 'MainTabs' }] });
    } else {
      navigation.goBack();
    }
  };

  const totalSteps = INFO_SLIDES.length + QUIZ.length;
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState({});
  const [saving, setSaving] = useState(false);

  const isQuizStep = step >= INFO_SLIDES.length;
  const quizIndex = step - INFO_SLIDES.length;
  const currentQuiz = isQuizStep ? QUIZ[quizIndex] : null;
  const isLastStep = step === totalSteps - 1;

  const canContinue = useMemo(() => {
    if (!isQuizStep) return true;
    return answers[currentQuiz.key] !== undefined;
  }, [isQuizStep, answers, currentQuiz]);

  const finish = async () => {
    if (saving) return;
    setSaving(true);
    try {
      const preferences = {
        goal: answers.goal ?? null,
        experience: answers.experience ?? null,
      };
      await AsyncStorage.setItem(APP_INFO_SEEN_KEY, 'true');
      await AsyncStorage.setItem(
        USER_PREFERENCES_KEY,
        JSON.stringify(preferences),
      );

      // Tailor: turn on the daily reminder at the chosen time.
      if (answers.reminderTime) {
        await applyReminder('habit', {
          enabled: true,
          hour: answers.reminderTime.hour,
          minute: answers.reminderTime.minute,
        });
      }
    } catch (error) {
      console.log('AppInfo finish error:', error);
    } finally {
      setSaving(false);
      exitOnboarding();
    }
  };

  const onNext = () => {
    hapticTap();
    if (isLastStep) {
      finish();
      return;
    }
    setStep(prev => Math.min(prev + 1, totalSteps - 1));
  };

  const onBack = () => {
    hapticTap();
    if (step === 0) {
      exitOnboarding();
      return;
    }
    setStep(prev => Math.max(prev - 1, 0));
  };

  const onSkip = async () => {
    hapticTap();
    await AsyncStorage.setItem(APP_INFO_SEEN_KEY, 'true');
    exitOnboarding();
  };

  const selectOption = option => {
    hapticTap();
    setAnswers(prev => ({ ...prev, [currentQuiz.key]: option.value }));
  };

  const slide = !isQuizStep ? INFO_SLIDES[step] : null;
  const isSelected = option =>
    JSON.stringify(answers[currentQuiz?.key]) === JSON.stringify(option.value);

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.topBar}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={onBack}
          activeOpacity={0.85}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Feather name="arrow-left" size={22} color={colors.textPrimary} />
        </TouchableOpacity>
        <View style={styles.progressDots}>
          {Array.from({ length: totalSteps }).map((_, i) => (
            <View
              key={i}
              style={[styles.dot, i === step ? styles.dotActive : styles.dotMuted]}
            />
          ))}
        </View>
        <TouchableOpacity
          style={styles.skipBtn}
          onPress={onSkip}
          activeOpacity={0.85}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Text style={styles.skipText}>Skip</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {!isQuizStep ? (
          <View style={styles.slide}>
            <View style={[styles.iconWrap, { backgroundColor: slide.badge }]}>
              <Image 
                source={slide.image} 
                style={styles.slideImage}
                resizeMode="contain"
              />
            </View>
            <Text style={styles.slideTitle}>{slide.title}</Text>
            <Text style={styles.slideBody}>{slide.body}</Text>
          </View>
        ) : (
          <View style={styles.quiz}>
            <Text style={styles.quizKicker}>
              Quick quiz {quizIndex + 1}/{QUIZ.length}
            </Text>
            <Text style={styles.quizQuestion}>{currentQuiz.question}</Text>
            <View style={styles.optionList}>
              {currentQuiz.options.map(option => {
                const selected = isSelected(option);
                return (
                  <TouchableOpacity
                    key={option.label}
                    style={[
                      styles.option,
                      selected && styles.optionSelected,
                    ]}
                    onPress={() => selectOption(option)}
                    activeOpacity={0.85}
                  >
                    <Text
                      style={[
                        styles.optionText,
                        selected && styles.optionTextSelected,
                      ]}
                    >
                      {option.label}
                    </Text>
                    {selected ? (
                      <Feather name="check" size={18} color="#0B7A2A" />
                    ) : null}
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        )}
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.nextBtn, !canContinue && styles.nextBtnDisabled]}
          onPress={onNext}
          disabled={!canContinue || saving}
          activeOpacity={0.9}
        >
          <Text style={styles.nextText}>
            {isLastStep ? 'Get Started' : 'Continue'}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#FFFFFF' },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backBtn: {
    width: 50,
    height: 38,
    justifyContent: 'center',
  },
  skipBtn: { width: 50, height: 38, justifyContent: 'center', alignItems: 'flex-end' },
  skipText: { fontSize: 14, color: colors.textMuted, fontWeight: '600' },
  progressDots: {
    flexDirection: 'row',
    gap: 6,
    alignItems: 'center',
  },
  dot: { width: 8, height: 8, borderRadius: 4 },
  dotActive: { backgroundColor: colors.dotActive, width: 18 },
  dotMuted: { backgroundColor: colors.dotMuted },

  content: { flexGrow: 1, padding: 24, justifyContent: 'center' },

  slide: { alignItems: 'center' },
  iconWrap: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 28,
  },
  slideImage: {
    width: 70,
    height: 70,
  },
  slideTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: 14,
  },
  slideBody: {
    fontSize: 15,
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: 23,
    maxWidth: 320,
  },

  quiz: { width: '100%' },
  quizKicker: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    color: '#E85D9A',
    marginBottom: 10,
  },
  quizQuestion: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.textPrimary,
    marginBottom: 22,
    lineHeight: 30,
  },
  optionList: { gap: 12 },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderRadius: 16,
    backgroundColor: '#F7F7F8',
    borderWidth: 1.5,
    borderColor: '#ECECEC',
  },
  optionSelected: { backgroundColor: '#EAF6EC', borderColor: '#9BD7A8' },
  optionText: { fontSize: 15, color: colors.textPrimary, fontWeight: '500' },
  optionTextSelected: { fontWeight: '700' },

  footer: { padding: 20 },
  nextBtn: {
    backgroundColor: colors.button,
    paddingVertical: 16,
    borderRadius: 20,
    alignItems: 'center',
  },
  nextBtnDisabled: { opacity: 0.5 },
  nextText: { fontSize: 16, fontWeight: '700', color: colors.textPrimary },
});

import React, { useCallback, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import {
  SafeAreaView,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';
import { useNavigation, useRoute, useFocusEffect } from '@react-navigation/native';
import Feather from 'react-native-vector-icons/Feather';
import { request } from '../../../utils/api';
import { handleBatchErrors, formatDateYYMMDD } from '../../../utils';
import { hapticTap } from '../../../utils/haptics';
import colors from '../../../theme/colors';
import CalendarModal from '../components/modal/CalendarModal';
import EmojiPickerModal from '../components/modal/EmojiPickerModal';
import { habitSchema } from '../../../validation/validate';

// Pastel colours only.
const COLOR_SWATCHES = [
  '#F9D6E5',
  '#E9DDF8',
  '#DCEAFE',
  '#D9F2FA',
  '#FBEAAF',
  '#FADCC0',
  '#F9D4D4',
  '#F4C9E4',
  '#DFF4E4',
  '#FFE9C7',
];

// "Specific Days of Week" runs on the chosen weekdays across this many days.
const HABIT_PERIOD_DAYS = 40;

const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

// Frequency chips: the internal `value` is kept as 'Custom'/'40 Days' so it
// stays valid against habitSchema + the backend; only the display label changes.
const FREQUENCY_OPTIONS = [
  { value: 'Custom', label: 'Specific Days of Week' },
  { value: '40 Days', label: '40 Days' },
];

function startOfDay(value) {
  const d = value ? new Date(value) : new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

function addDays(date, amount) {
  const d = startOfDay(date);
  d.setDate(d.getDate() + amount);
  return d;
}

function getMonthDays(date) {
  const year = date.getFullYear();
  const month = date.getMonth();
  const first = new Date(year, month, 1);
  const last = new Date(year, month + 1, 0);
  const days = [];
  for (let d = 1; d <= last.getDate(); d += 1) {
    days.push(new Date(year, month, d));
  }
  return { firstWeekday: (first.getDay() + 6) % 7, days };
}

function mapFrequencyFromApi(apiFreq) {
  if (apiFreq === '40_days') return '40 Days';
  if (apiFreq === 'custom') return 'Custom';
  return '40 Days';
}

function normalizeDays(value) {
  if (Array.isArray(value)) {
    return value.map(v => String(v)).filter(v => DAY_LABELS.includes(v));
  }
  return [];
}

export default function AddHabitScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const route = useRoute();
  const editingHabit = route.params?.habit || null;
  const isEditing = Boolean(editingHabit);

  const [habitName, setHabitName] = useState(editingHabit?.name || '');
  const [habitIcon, setHabitIcon] = useState(editingHabit?.icon || '🏃');
  const [habitColor, setHabitColor] = useState(editingHabit?.color || '#F4C9E4');
  const [frequency, setFrequency] = useState(
    editingHabit ? mapFrequencyFromApi(editingHabit.frequency) : '',
  );
  const [habitStartDate, setHabitStartDate] = useState(() =>
    startOfDay(editingHabit?.start_date),
  );
  const [selectedDays, setSelectedDays] = useState(() =>
    normalizeDays(editingHabit?.days_of_week || editingHabit?.selected_days),
  );

  const [calendarOpen, setCalendarOpen] = useState(false);
  const [emojiOpen, setEmojiOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  // When this page is opened to ADD a new habit (not editing), always start from
  // a clean form so the previous habit's details are never carried over.
  useFocusEffect(
    useCallback(() => {
      if (!editingHabit) {
        setHabitName('');
        setHabitIcon('🏃');
        setHabitColor('#F4C9E4');
        setFrequency('');
        setHabitStartDate(startOfDay());
        setSelectedDays([]);
        setErrors({});
      }
    }, [editingHabit]),
  );

  // The habit always spans HABIT_PERIOD_DAYS days; the end date is derived,
  // not picked, so "specific days" habits always run for 40 days.
  const endDate = useMemo(
    () => addDays(habitStartDate, HABIT_PERIOD_DAYS - 1),
    [habitStartDate],
  );

  const monthData = useMemo(() => getMonthDays(habitStartDate), [habitStartDate]);
  const monthLabel = useMemo(
    () => habitStartDate.toLocaleString('default', { month: 'long' }),
    [habitStartDate],
  );

  const isSpecificDays = frequency === 'Custom';

  const openCalendar = () => {
    hapticTap();
    setCalendarOpen(true);
  };

  const onSelectDate = d => {
    setHabitStartDate(startOfDay(d));
  };

  const toggleDay = label => {
    hapticTap();
    if (errors.frequency) setErrors(prev => ({ ...prev, frequency: null }));
    setSelectedDays(prev =>
      prev.includes(label) ? prev.filter(d => d !== label) : [...prev, label],
    );
  };

  const buildHabitPayload = () => {
    const basePayload = {
      name: habitName.trim(),
      icon: habitIcon,
      start_date: formatDateYYMMDD(habitStartDate),
      color: habitColor,
    };

    if (frequency === '40 Days') {
      return { ...basePayload, frequency: '40_days' };
    }

    if (frequency === 'Custom') {
      return {
        ...basePayload,
        frequency: 'custom',
        custom_date: formatDateYYMMDD(endDate),
        days_of_week: selectedDays,
      };
    }

    return basePayload;
  };

  const onSave = async () => {
    hapticTap();
    try {
      setErrors({});
      await habitSchema.validate(
        { title: habitName?.trim(), frequency },
        { abortEarly: false },
      );

      if (isSpecificDays && selectedDays.length === 0) {
        setErrors(prev => ({
          ...prev,
          frequency: 'Select at least one day of the week.',
        }));
        return;
      }

      setLoading(true);
      const payload = buildHabitPayload();
      await request({
        url: isEditing ? `habits/${editingHabit.id}` : 'habits',
        method: isEditing ? 'PUT' : 'POST',
        data: payload,
      });
      navigation.goBack();
    } catch (err) {
      handleBatchErrors(err, setErrors);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      {/* Lightweight top bar: back arrow + title (no MainTabHeader area) */}
      <View style={styles.topBar}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => navigation.goBack()}
          activeOpacity={0.85}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Feather name="arrow-left" size={22} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.topTitle}>
          {isEditing ? 'Edit Habit' : 'Add New Habit'}
        </Text>
        <View style={styles.backBtn} />
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingBottom: 130 + insets.bottom },
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.card}>
          <Text style={styles.label}>Habit Name</Text>
          <TextInput
            value={habitName}
            onChangeText={text => {
              setHabitName(text);
              if (errors.title) setErrors(prev => ({ ...prev, title: null }));
            }}
            placeholder="e.g. Morning Walk"
            placeholderTextColor="#9A9A9A"
            style={[styles.inputText, errors.title && styles.inputErrorBorder]}
          />
          {errors.title ? (
            <Text style={styles.errorText}>{errors.title}</Text>
          ) : null}

          <Text style={styles.label}>Habit Icon</Text>
          <View style={styles.iconBox}>
            <View style={styles.iconRow}>
              <TouchableOpacity
                style={styles.iconChip}
                onPress={() => {
                  hapticTap();
                  setEmojiOpen(true);
                }}
              >
                <Text style={styles.iconChipText}>{habitIcon}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.iconChipAdd}
                onPress={() => {
                  hapticTap();
                  setEmojiOpen(true);
                }}
              >
                <Feather name="plus" size={14} color={colors.textPrimary} />
              </TouchableOpacity>
            </View>
          </View>

          <Text style={styles.label}>Frequency</Text>
          <View
            style={[styles.freqBox, errors.frequency && styles.inputErrorBorder]}
          >
            <View style={styles.freqRow}>
              {FREQUENCY_OPTIONS.map(option => {
                const active = frequency === option.value;
                return (
                  <TouchableOpacity
                    key={option.value}
                    style={[styles.freqChip, active && styles.freqChipActive]}
                    onPress={() => {
                      hapticTap();
                      setFrequency(option.value);
                      if (errors.frequency) {
                        setErrors(prev => ({ ...prev, frequency: null }));
                      }
                    }}
                    activeOpacity={0.85}
                  >
                    <Text
                      style={[styles.freqText, active && styles.freqTextActive]}
                    >
                      {option.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
          {errors.frequency ? (
            <Text style={styles.errorText}>{errors.frequency}</Text>
          ) : null}

          {isSpecificDays ? (
            <>
              <Text style={styles.label}>Select Days</Text>
              <View style={styles.daysBox}>
                <View style={styles.daysRow}>
                  {DAY_LABELS.map(day => {
                    const active = selectedDays.includes(day);
                    return (
                      <TouchableOpacity
                        key={day}
                        style={[styles.dayChip, active && styles.dayChipActive]}
                        onPress={() => toggleDay(day)}
                        activeOpacity={0.85}
                      >
                        <Text
                          style={[
                            styles.dayText,
                            active && styles.dayTextActive,
                          ]}
                        >
                          {day}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
              <Text style={styles.helperText}>
                Runs on the selected days for {HABIT_PERIOD_DAYS} days.
              </Text>
            </>
          ) : null}

          <Text style={styles.label}>Start Date</Text>
          <TouchableOpacity
            style={styles.dateInput}
            onPress={openCalendar}
            activeOpacity={0.85}
          >
            <Text style={styles.dateText}>{habitStartDate.toDateString()}</Text>
            <Feather name="calendar" size={16} color="#7A7A7A" />
          </TouchableOpacity>

          {isSpecificDays ? (
            <>
              <Text style={styles.label}>End Date (40 days from start)</Text>
              <View style={[styles.dateInput, styles.dateInputReadonly]}>
                <Text style={styles.dateText}>{endDate.toDateString()}</Text>
                <Feather name="lock" size={14} color="#9A9A9A" />
              </View>
            </>
          ) : null}

          <Text style={styles.label}>Choose Color</Text>
          <View style={styles.colorBox}>
            <View style={styles.colorRow}>
              {COLOR_SWATCHES.map(c => (
                <TouchableOpacity
                  key={c}
                  style={[
                    styles.colorDot,
                    { backgroundColor: c },
                    habitColor === c && styles.colorDotActive,
                  ]}
                  onPress={() => {
                    hapticTap();
                    setHabitColor(c);
                  }}
                  activeOpacity={0.85}
                />
              ))}
            </View>
          </View>

          <View style={styles.actions}>
            <TouchableOpacity
              style={styles.btnGhost}
              onPress={() => navigation.goBack()}
              disabled={loading}
            >
              <Text style={styles.btnGhostText}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.btnPrimary}
              onPress={onSave}
              disabled={loading}
              activeOpacity={0.9}
            >
              {loading ? (
                <ActivityIndicator size="small" color={colors.textPrimary} />
              ) : (
                <Text style={styles.btnPrimaryText}>
                  {isEditing ? 'Update Habit' : 'Add Habit'}
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      <CalendarModal
        visible={calendarOpen}
        monthLabel={monthLabel}
        monthData={monthData}
        selectedDate={habitStartDate}
        onSelectDate={onSelectDate}
        onClose={() => setCalendarOpen(false)}
      />

      <EmojiPickerModal
        visible={emojiOpen}
        onClose={() => setEmojiOpen(false)}
        onSelect={emoji => {
          setHabitIcon(emoji);
          setEmojiOpen(false);
        }}
      />
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
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  topTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 20,
    fontWeight: '700',
    color: colors.textPrimary,
  },

  content: { padding: 16 },

  card: {
    backgroundColor: '#FBEAAF',
    borderRadius: 18,
    padding: 16,
  },

  label: { marginTop: 12, fontSize: 13, fontWeight: '600', color: colors.textPrimary },
  helperText: { marginTop: 6, fontSize: 11, color: '#6B6B6B' },

  inputText: {
    marginTop: 8,
    height: 44,
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    paddingHorizontal: 12,
    color: colors.textPrimary,
    borderWidth: 1,
    borderColor: '#E3E3E3',
  },
  inputErrorBorder: { borderColor: '#FF4D4F' },
  errorText: { marginTop: 4, fontSize: 11, color: '#FF4D4F' },

  iconBox: {
    marginTop: 8,
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#DFDFDF',
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  iconRow: { flexDirection: 'row', gap: 10, alignItems: 'center' },
  iconChip: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#EEEEEE',
  },
  iconChipText: { fontSize: 20 },
  iconChipAdd: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },

  freqBox: {
    marginTop: 8,
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#DFDFDF',
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  freqRow: { flexDirection: 'row', gap: 10, flexWrap: 'wrap' },
  freqChip: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#EEEEEE',
  },
  freqChipActive: { backgroundColor: '#F4C9E4', borderColor: '#E59EC6' },
  freqText: { fontSize: 13, color: colors.textPrimary },
  freqTextActive: { fontWeight: '700' },

  daysBox: {
    marginTop: 8,
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#DFDFDF',
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  daysRow: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  dayChip: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#EEEEEE',
    minWidth: 45,
    alignItems: 'center',
  },
  dayChipActive: { backgroundColor: '#F4C9E4', borderColor: '#E59EC6' },
  dayText: { fontSize: 12, color: colors.textPrimary },
  dayTextActive: { fontWeight: '700' },

  dateInput: {
    marginTop: 8,
    height: 44,
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#E3E3E3',
  },
  dateInputReadonly: { backgroundColor: '#F4F4F4' },
  dateText: { fontSize: 13, color: colors.textPrimary },

  colorBox: {
    marginTop: 8,
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#DFDFDF',
    padding: 12,
  },
  colorRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  colorDot: { width: 22, height: 22, borderRadius: 11 },
  colorDotActive: { borderWidth: 2, borderColor: '#333333' },

  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
    marginTop: 20,
  },
  btnGhost: {
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
  },
  btnGhostText: { fontSize: 14, color: colors.textPrimary, fontWeight: '600' },
  btnPrimary: {
    minWidth: 120,
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#F4C9E4',
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnPrimaryText: { fontSize: 14, color: colors.textPrimary, fontWeight: '700' },
});

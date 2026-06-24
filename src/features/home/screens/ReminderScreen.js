import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Switch,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Feather from 'react-native-vector-icons/Feather';
import { useNavigation } from '@react-navigation/native';
import colors from '../../../theme/colors';
import { hapticTap } from '../../../utils/haptics';
import {
  applyReminder,
  getReminderSettings,
  DEFAULT_REMINDER_SETTINGS,
} from '../../../utils/notifications';

// Pink accent for this screen (the shared theme has no `primary` colour).
const ACCENT = '#E85D9A';

const TIME_PRESETS = [
  { label: '6:00 AM', hour: 6, minute: 0 },
  { label: '8:00 AM', hour: 8, minute: 0 },
  { label: '12:00 PM', hour: 12, minute: 0 },
  { label: '6:00 PM', hour: 18, minute: 0 },
  { label: '9:00 PM', hour: 21, minute: 0 },
];

const REMINDERS = [
  {
    type: 'habit',
    icon: 'check-circle',
    title: 'Habit Reminder',
    subtitle: '“Start your day with intention! 🌙 Log your habits now.”',
    hasTime: true,
  },
  {
    type: 'journal',
    icon: 'book-open',
    title: 'Evening Journalling',
    subtitle: '“How was your day? Take 3 minutes to reflect & journal 📝”',
    hasTime: true,
  },
  {
    type: 'salah',
    icon: 'clock',
    title: 'Salah Check-in',
    subtitle: 'A nudge 10 minutes after each prayer time, e.g. “Dhuhr time – log your prayer ✅”.',
    hasTime: false,
  },
  {
    type: 'weekly',
    icon: 'bar-chart-2',
    title: 'Weekly Summary',
    subtitle: 'A summary of your week, every Sunday evening 🌟.',
    hasTime: true,
    timePrefix: 'Sunday at',
  },
];

function formatTime(hour, minute) {
  const period = hour >= 12 ? 'PM' : 'AM';
  const h12 = hour % 12 === 0 ? 12 : hour % 12;
  const mm = String(minute).padStart(2, '0');
  return `${h12}:${mm} ${period}`;
}

// 24h <-> 12h helpers for the custom-time wheel.
function to12h(hour24) {
  const period = hour24 >= 12 ? 1 : 0; // 0 = AM, 1 = PM
  const h12 = hour24 % 12 === 0 ? 12 : hour24 % 12;
  return { h12, period };
}
function to24h(h12, period) {
  if (period === 1) return h12 === 12 ? 12 : h12 + 12;
  return h12 === 12 ? 0 : h12;
}

const WHEEL_ITEM_HEIGHT = 46;
const WHEEL_VISIBLE = 5; // odd; centre row is the selection
const WHEEL_HEIGHT = WHEEL_ITEM_HEIGHT * WHEEL_VISIBLE;
const WHEEL_PAD = WHEEL_ITEM_HEIGHT * ((WHEEL_VISIBLE - 1) / 2);

// A snapping wheel column (modern iOS-style picker).
function WheelColumn({ data, selectedIndex, onChange, render }) {
  const ref = useRef(null);

  useEffect(() => {
    const t = setTimeout(() => {
      ref.current?.scrollTo({ y: selectedIndex * WHEEL_ITEM_HEIGHT, animated: false });
    }, 0);
    return () => clearTimeout(t);
    // Only re-centre when the selection is changed externally (modal open).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleEnd = e => {
    const idx = Math.round(e.nativeEvent.contentOffset.y / WHEEL_ITEM_HEIGHT);
    const clamped = Math.max(0, Math.min(data.length - 1, idx));
    if (clamped !== selectedIndex) onChange(clamped);
  };

  return (
    <ScrollView
      ref={ref}
      style={styles.wheel}
      showsVerticalScrollIndicator={false}
      snapToInterval={WHEEL_ITEM_HEIGHT}
      decelerationRate="fast"
      nestedScrollEnabled
      contentContainerStyle={{ paddingVertical: WHEEL_PAD }}
      onMomentumScrollEnd={handleEnd}
    >
      {data.map((item, i) => {
        const active = i === selectedIndex;
        return (
          <View key={i} style={styles.wheelItem}>
            <Text style={[styles.wheelText, active && styles.wheelTextActive]}>
              {render ? render(item) : item}
            </Text>
          </View>
        );
      })}
    </ScrollView>
  );
}

const HOURS_12 = Array.from({ length: 12 }, (_, i) => i + 1); // 1..12
const MINUTES = Array.from({ length: 60 }, (_, i) => i); // 0..59

export default function ReminderScreen() {
  const navigation = useNavigation();
  const [settings, setSettings] = useState(DEFAULT_REMINDER_SETTINGS);
  const [busyType, setBusyType] = useState(null);
  const [timePickerVisible, setTimePickerVisible] = useState(false);
  const [selectedReminderType, setSelectedReminderType] = useState(null);
  const [pickerHour12, setPickerHour12] = useState(9); // 1..12
  const [pickerMinute, setPickerMinute] = useState(0); // 0..59
  const [pickerPeriod, setPickerPeriod] = useState(0); // 0 = AM, 1 = PM

  useEffect(() => {
    let mounted = true;
    getReminderSettings().then(saved => {
      if (mounted) setSettings(saved);
    });
    return () => {
      mounted = false;
    };
  }, []);

  const updateReminder = async (type, config) => {
    hapticTap();
    setBusyType(type);
    try {
      const next = await applyReminder(type, config);
      setSettings(prev => ({ ...prev, [type]: next }));
    } finally {
      setBusyType(null);
    }
  };

  const openTimePicker = (reminderType) => {
    hapticTap();
    const state = settings[reminderType] || {};
    const { h12, period } = to12h(state.hour ?? 9);
    setPickerHour12(h12);
    setPickerMinute(state.minute ?? 0);
    setPickerPeriod(period);
    setSelectedReminderType(reminderType);
    setTimePickerVisible(true);
  };

  const confirmTime = () => {
    if (selectedReminderType) {
      updateReminder(selectedReminderType, {
        hour: to24h(pickerHour12, pickerPeriod),
        minute: pickerMinute,
        enabled: true,
      });
    }
    setTimePickerVisible(false);
    setSelectedReminderType(null);
  };

  const previewHour24 = to24h(pickerHour12, pickerPeriod);

  const cancelTimePicker = () => {
    setTimePickerVisible(false);
    setSelectedReminderType(null);
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.topBar}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => navigation.goBack()}
          activeOpacity={0.85}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Feather name="arrow-left" size={22} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.topTitle}>Reminders</Text>
        <View style={styles.backBtn} />
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.intro}>
          Get gentle daily push notifications so you never miss your habits or
          journaling. Choose from preset times or set your own custom time for each
          reminder.
        </Text>

        {REMINDERS.map(reminder => {
          const state = settings[reminder.type] || {};
          const enabled = Boolean(state.enabled);
          const isBusy = busyType === reminder.type;
          const isCustomTime =
            reminder.hasTime &&
            !TIME_PRESETS.some(
              p => p.hour === (state.hour ?? 9) && p.minute === (state.minute ?? 0),
            );

          return (
            <View key={reminder.type} style={styles.card}>
              <View style={styles.cardHeader}>
                <View style={styles.cardIcon}>
                  <Feather
                    name={reminder.icon}
                    size={18}
                    color={colors.textPrimary}
                  />
                </View>
                <View style={styles.cardHeaderText}>
                  <Text style={styles.cardTitle}>{reminder.title}</Text>
                  <Text style={styles.cardSub}>{reminder.subtitle}</Text>
                </View>
                <Switch
                  value={enabled}
                  disabled={isBusy}
                  onValueChange={value =>
                    updateReminder(reminder.type, { enabled: value })
                  }
                  trackColor={{ false: '#E3E3E3', true: '#F1C3DD' }}
                  thumbColor={enabled ? '#E85D9A' : '#FAFAFA'}
                />
              </View>

              {reminder.hasTime ? (
                <>
                  <View style={styles.timeRow}>
                    <Text style={styles.timeLabel}>
                      {reminder.timePrefix || 'Time:'}{' '}
                      {formatTime(state.hour ?? 9, state.minute ?? 0)}
                    </Text>
                  </View>

                  <View style={styles.presetRow}>
                    {TIME_PRESETS.map(preset => {
                      const active =
                        state.hour === preset.hour &&
                        state.minute === preset.minute;
                      return (
                        <TouchableOpacity
                          key={preset.label}
                          style={[
                            styles.presetChip,
                            active && styles.presetChipActive,
                          ]}
                          disabled={isBusy}
                          onPress={() =>
                            updateReminder(reminder.type, {
                              hour: preset.hour,
                              minute: preset.minute,
                              enabled: true,
                            })
                          }
                          activeOpacity={0.85}
                        >
                          <Text
                            style={[
                              styles.presetText,
                              active && styles.presetTextActive,
                            ]}
                          >
                            {preset.label}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                    
                    <TouchableOpacity
                      style={[
                        styles.presetChip,
                        styles.customTimeChip,
                        isCustomTime && styles.customTimeChipActive,
                      ]}
                      disabled={isBusy}
                      onPress={() => openTimePicker(reminder.type)}
                      activeOpacity={0.85}
                    >
                      <Feather
                        name="clock"
                        size={12}
                        color={isCustomTime ? '#FFFFFF' : ACCENT}
                      />
                      <Text
                        style={[
                          styles.customTimeText,
                          isCustomTime && styles.customTimeTextActive,
                        ]}
                      >
                        {isCustomTime
                          ? formatTime(state.hour, state.minute)
                          : 'Custom Time'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </>
              ) : null}
            </View>
          );
        })}

        <View style={styles.note}>
          <Feather name="info" size={14} color={colors.textMuted} />
          <Text style={styles.noteText}>
            Reminders will work even when the app is closed. They repeat daily at
            your chosen time and can be turned off anytime.
          </Text>
        </View>
      </ScrollView>

      {/* Custom Time Picker — modern wheel */}
      {timePickerVisible && (
        <Modal
          transparent
          animationType="fade"
          visible={timePickerVisible}
          onRequestClose={cancelTimePicker}
          statusBarTranslucent
        >
          <View style={styles.modalOverlay}>
            <TouchableOpacity
              style={StyleSheet.absoluteFill}
              activeOpacity={1}
              onPress={cancelTimePicker}
            />

            <View style={styles.sheet}>
              <Text style={styles.sheetTitle}>Set Custom Time</Text>
              <Text style={styles.sheetSub}>Scroll to pick your reminder time</Text>

              <View style={styles.previewPill}>
                <Feather name="clock" size={16} color={ACCENT} />
                <Text style={styles.previewText}>
                  {formatTime(previewHour24, pickerMinute)}
                </Text>
              </View>

              <View style={styles.wheelRow}>
                <View pointerEvents="none" style={styles.selectionBand} />

                <WheelColumn
                  data={HOURS_12}
                  selectedIndex={pickerHour12 - 1}
                  onChange={i => setPickerHour12(HOURS_12[i])}
                  render={v => String(v).padStart(2, '0')}
                />
                <Text style={styles.wheelColon}>:</Text>
                <WheelColumn
                  data={MINUTES}
                  selectedIndex={pickerMinute}
                  onChange={i => setPickerMinute(i)}
                  render={v => String(v).padStart(2, '0')}
                />

                <View style={styles.periodCol}>
                  {['AM', 'PM'].map((p, idx) => {
                    const active = pickerPeriod === idx;
                    return (
                      <TouchableOpacity
                        key={p}
                        style={[styles.periodBtn, active && styles.periodBtnActive]}
                        onPress={() => setPickerPeriod(idx)}
                        activeOpacity={0.85}
                      >
                        <Text style={[styles.periodText, active && styles.periodTextActive]}>
                          {p}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              <View style={styles.sheetActions}>
                <TouchableOpacity
                  style={[styles.actionBtn, styles.actionGhost]}
                  onPress={cancelTimePicker}
                  activeOpacity={0.85}
                >
                  <Text style={styles.actionGhostText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.actionBtn, styles.actionPrimary]}
                  onPress={confirmTime}
                  activeOpacity={0.85}
                >
                  <Text style={styles.actionPrimaryText}>Set Time</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      )}
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
  content: { padding: 16, paddingBottom: 40 },
  intro: {
    fontSize: 13,
    color: colors.textMuted,
    marginBottom: 14,
    lineHeight: 19,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#ECECEC',
    padding: 16,
    marginBottom: 14,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  cardIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F4C9E4',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardHeaderText: { flex: 1 },
  cardTitle: { fontSize: 15, fontWeight: '700', color: colors.textPrimary },
  cardSub: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
  timeRow: { marginTop: 14 },
  timeLabel: { fontSize: 13, fontWeight: '600', color: colors.textPrimary },
  presetRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 10,
  },
  presetChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: '#F4F4F4',
    borderWidth: 1,
    borderColor: '#ECECEC',
  },
  presetChipActive: { backgroundColor: '#F1C3DD', borderColor: '#E59EC6' },
  presetText: { fontSize: 12, color: colors.textPrimary },
  presetTextActive: { fontWeight: '700' },
  customTimeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#E8F5F9',
    borderColor: '#B3E0ED',
  },
  customTimeText: {
    fontSize: 12,
    color: ACCENT,
    fontWeight: '600',
  },
  customTimeChipActive: {
    backgroundColor: ACCENT,
    borderColor: ACCENT,
  },
  customTimeTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },

  /* ---- Modern custom-time dialog ---- */
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(17,24,39,0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 22,
  },
  sheet: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: '#FFFFFF',
    borderRadius: 26,
    paddingTop: 22,
    paddingBottom: 18,
    paddingHorizontal: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.18,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 12 },
    elevation: 10,
  },
  sheetTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  sheetSub: {
    marginTop: 4,
    fontSize: 12.5,
    color: colors.textMuted,
  },
  previewPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 16,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: '#FCEFF6',
    borderWidth: 1,
    borderColor: '#F4C9E4',
  },
  previewText: {
    fontSize: 22,
    fontWeight: '900',
    color: ACCENT,
    letterSpacing: 0.5,
  },
  wheelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: WHEEL_HEIGHT,
    marginTop: 14,
    alignSelf: 'stretch',
  },
  selectionBand: {
    position: 'absolute',
    left: 8,
    right: 8,
    top: WHEEL_PAD,
    height: WHEEL_ITEM_HEIGHT,
    borderRadius: 14,
    backgroundColor: '#F5F7FA',
    borderWidth: 1,
    borderColor: '#ECEFF3',
  },
  wheel: {
    width: 64,
    height: WHEEL_HEIGHT,
  },
  wheelItem: {
    height: WHEEL_ITEM_HEIGHT,
    alignItems: 'center',
    justifyContent: 'center',
  },
  wheelText: {
    fontSize: 20,
    color: '#AEB6C2',
    fontWeight: '600',
  },
  wheelTextActive: {
    fontSize: 26,
    color: colors.textPrimary,
    fontWeight: '900',
  },
  wheelColon: {
    fontSize: 26,
    fontWeight: '900',
    color: colors.textPrimary,
    marginHorizontal: 2,
  },
  periodCol: {
    marginLeft: 14,
    gap: 8,
  },
  periodBtn: {
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 12,
    backgroundColor: '#F4F4F4',
    borderWidth: 1,
    borderColor: '#ECECEC',
    alignItems: 'center',
  },
  periodBtnActive: {
    backgroundColor: '#F1C3DD',
    borderColor: '#E59EC6',
  },
  periodText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textMuted,
  },
  periodTextActive: {
    color: colors.textPrimary,
  },
  sheetActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
    alignSelf: 'stretch',
  },
  actionBtn: {
    flex: 1,
    height: 50,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionGhost: {
    backgroundColor: '#F4F4F6',
  },
  actionGhostText: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textMuted,
  },
  actionPrimary: {
    backgroundColor: ACCENT,
  },
  actionPrimaryText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  note: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'flex-start',
    marginTop: 4,
    paddingHorizontal: 4,
  },
  noteText: { flex: 1, fontSize: 11, color: colors.textMuted, lineHeight: 16 },
});

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Switch,
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

export default function ReminderScreen() {
  const navigation = useNavigation();
  const [settings, setSettings] = useState(DEFAULT_REMINDER_SETTINGS);
  const [busyType, setBusyType] = useState(null);

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
          journaling.
        </Text>

        {REMINDERS.map(reminder => {
          const state = settings[reminder.type] || {};
          const enabled = Boolean(state.enabled);
          const isBusy = busyType === reminder.type;

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
                  </View>
                </>
              ) : null}
            </View>
          );
        })}

        <View style={styles.note}>
          <Feather name="info" size={14} color={colors.textMuted} />
          <Text style={styles.noteText}>
            Reminders repeat every day at the chosen time. You can turn them off
            anytime.
          </Text>
        </View>
      </ScrollView>
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
  note: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'flex-start',
    marginTop: 4,
    paddingHorizontal: 4,
  },
  noteText: { flex: 1, fontSize: 11, color: colors.textMuted, lineHeight: 16 },
});

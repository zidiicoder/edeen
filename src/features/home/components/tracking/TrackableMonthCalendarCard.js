import React, { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Feather from 'react-native-vector-icons/Feather';
import colors from '../../../../theme/colors';

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

function getMonthMatrix(date) {
  const year = date.getFullYear();
  const month = date.getMonth();
  const first = new Date(year, month, 1);
  const last = new Date(year, month + 1, 0);
  const firstWeekday = (first.getDay() + 6) % 7;
  const daysInMonth = last.getDate();

  const cells = [];
  for (let i = 0; i < firstWeekday; i += 1) {
    cells.push(null);
  }
  for (let d = 1; d <= daysInMonth; d += 1) {
    cells.push(d);
  }
  while (cells.length % 7 !== 0) {
    cells.push(null);
  }

  return cells;
}

function buildDateKey(date, day) {
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(day).padStart(2, '0');
  return `${date.getFullYear()}-${month}-${dd}`;
}

export default function TrackableMonthCalendarCard({
  date = new Date(),
  completedMap = {},
  onToggleDay,
  legendLabel = 'completed',
  accentColor = '#6ECBC7',
}) {
  const cells = useMemo(() => getMonthMatrix(date), [date]);

  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        {DAYS.map(day => (
          <Text key={day} style={styles.headerDay}>
            {day}
          </Text>
        ))}
      </View>

      <View style={styles.grid}>
        {cells.map((day, index) => {
          if (!day) {
            return <View key={`empty-${index}`} style={styles.cell} />;
          }

          const key = buildDateKey(date, day);
          const checked = Boolean(completedMap[key]);

          return (
            <Pressable
              key={key}
              style={styles.cell}
              onPress={() => onToggleDay?.(key, day, !checked)}
            >
              <View style={[styles.dayWrap, checked && styles.dayWrapChecked]}>
                <Text style={styles.dayText}>{day}</Text>
                <View
                  style={[
                    styles.dayCheckbox,
                    checked && styles.dayCheckboxChecked,
                  ]}
                >
                  {checked ? (
                    <Feather name="check" size={12} color="#0B7A2A" />
                  ) : (
                    <View style={styles.dayCheckboxInner} />
                  )}
                </View>
              </View>
            </Pressable>
          );
        })}
      </View>

      <View style={styles.legendRow}>
        <View style={[styles.legendDot, { backgroundColor: accentColor }]} />
        <Text style={styles.legendText}>{legendLabel}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginTop: 14,
    backgroundColor: '#D0E6EC',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingTop: 14,
    paddingBottom: 12,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  headerRow: {
    flexDirection: 'row',
  },
  headerDay: {
    flex: 1,
    textAlign: 'center',
    fontSize: 12,
    color: colors.textPrimary,
    opacity: 0.9,
  },
  grid: {
    marginTop: 10,
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  cell: {
    width: '14.285%',
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayWrap: {
    width: 34,
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
    paddingVertical: 4,
    gap: 4,
  },
  dayWrapChecked: {
    backgroundColor: 'rgba(255,255,255,0.28)',
  },
  dayText: {
    fontSize: 13,
    color: colors.textPrimary,
    fontWeight: '700',
  },
  dayCheckbox: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.55)',
    borderWidth: 1,
    borderColor: 'rgba(17,17,17,0.16)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayCheckboxChecked: {
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderColor: 'rgba(11,122,42,0.35)',
    borderWidth: 1.5,
  },
  dayCheckboxInner: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: 'rgba(17,17,17,0.18)',
  },
  legendRow: {
    marginTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  legendDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
  },
  legendText: {
    fontSize: 11,
    color: '#496169',
    fontWeight: '600',
  },
});

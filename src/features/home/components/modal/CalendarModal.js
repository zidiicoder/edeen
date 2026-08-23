import React, { useState, useEffect } from 'react';
import { Modal, Pressable, View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import Feather from 'react-native-vector-icons/Feather';
import colors from '../../../../theme/colors';

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

function sameDate(a, b) {
  if (!a || !b) return false;
  return (
    a.getDate() === b.getDate() &&
    a.getMonth() === b.getMonth() &&
    a.getFullYear() === b.getFullYear()
  );
}

function isInRange(date, startDate, endDate) {
  if (!startDate || !endDate) return false;
  const time = date.getTime();
  return time >= startDate.getTime() && time <= endDate.getTime();
}

function getMonthData(year, month) {
  const first = new Date(year, month, 1);
  const last = new Date(year, month + 1, 0);
  const days = [];
  for (let d = 1; d <= last.getDate(); d += 1) {
    days.push(new Date(year, month, d));
  }
  return { firstWeekday: (first.getDay() + 6) % 7, days };
}

export default function CalendarModal({ visible, selectedDate, endDate, onSelectDate, onClose }) {
  const today = new Date();
  const currentYear = today.getFullYear();
  const currentMonth = today.getMonth();
  
  const [viewYear, setViewYear] = useState(currentYear);
  const [viewMonth, setViewMonth] = useState(currentMonth);

  // Reset calendar to current month whenever modal becomes visible
  useEffect(() => {
    if (visible) {
      const baseDate = selectedDate || today;
      setViewYear(baseDate.getFullYear());
      setViewMonth(baseDate.getMonth());
    }
  }, [visible]);

  const monthData = getMonthData(viewYear, viewMonth);

  const goToPreviousMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear(viewYear - 1);
    } else {
      setViewMonth(viewMonth - 1);
    }
  };

  const goToNextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear(viewYear + 1);
    } else {
      setViewMonth(viewMonth + 1);
    }
  };

  const renderMonth = () => (
    <View>
      <View style={styles.monthHeader}>
        <TouchableOpacity onPress={goToPreviousMonth} style={styles.navButton}>
          <Feather name="chevron-left" size={20} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.monthTitle}>
          {MONTHS[viewMonth]} {viewYear}
        </Text>
        <TouchableOpacity onPress={goToNextMonth} style={styles.navButton}>
          <Feather name="chevron-right" size={20} color={colors.textPrimary} />
        </TouchableOpacity>
      </View>
      
      <View style={styles.headerRow}>
        {DAYS.map(d => (
          <Text key={d} style={styles.day}>{d}</Text>
        ))}
      </View>
      
      <View style={styles.grid}>
        {Array.from({ length: monthData.firstWeekday }).map((_, i) => (
          <View key={`e-${i}`} style={styles.cell} />
        ))}
        {monthData.days.map(d => {
          const isToday = sameDate(d, today);
          const isSelected = sameDate(d, selectedDate);
          const inRange = isInRange(d, selectedDate, endDate);
          
          return (
            <TouchableOpacity
              key={d.toISOString()}
              style={[
                styles.cell,
                inRange && styles.cellActive,
              ]}
              onPress={() => onSelectDate(d)}
              activeOpacity={0.85}
            >
              <View style={[
                styles.dateCircle,
                isToday && styles.todayCircle,
              ]}>
                <Text style={[
                  styles.cellText,
                  inRange && styles.cellTextActive,
                  isToday && styles.todayText,
                ]}>
                  {d.getDate()}
                </Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );

  return (
    <Modal transparent visible={visible} animationType="fade">
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={styles.card} onPress={() => {}}>
          <Text style={styles.title}>Select Start Date</Text>
          {renderMonth()}
          <View style={styles.actions}>
            <TouchableOpacity style={styles.btnGhost} onPress={onClose}>
              <Text style={styles.btnGhostText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.btnPrimary} onPress={onClose}>
              <Text style={styles.btnPrimaryText}>Ok</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.15)',
    justifyContent: 'center',
    padding: 16,
  },
  card: {
    backgroundColor: '#EAF3FB',
    borderRadius: 18,
    padding: 16,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 16,
    textAlign: 'center',
  },
  monthHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingHorizontal: 8,
  },
  navButton: {
    padding: 8,
  },
  monthTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  day: {
    width: 40,
    textAlign: 'center',
    fontSize: 11,
    fontWeight: '600',
    color: '#7A7A7A',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 16,
  },
  cell: {
    width: '14.285%',
    alignItems: 'center',
    paddingVertical: 4,
  },
  cellActive: {
    backgroundColor: '#F4C9E4',
    borderRadius: 10,
  },
  dateCircle: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
  },
  todayCircle: {
    borderWidth: 2,
    borderColor: '#78B8F6',
  },
  cellText: {
    fontSize: 13,
    color: colors.textPrimary,
  },
  cellTextActive: {
    fontWeight: '700',
  },
  todayText: {
    color: '#78B8F6',
    fontWeight: '600',
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
    marginTop: 8,
  },
  btnGhost: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
  },
  btnGhostText: { fontSize: 13, color: colors.textPrimary, fontWeight: '600' },
  btnPrimary: {
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: '#78B8F6',
  },
  btnPrimaryText: { fontSize: 13, color: '#FFFFFF', fontWeight: '700' },
});

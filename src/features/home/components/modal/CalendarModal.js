import React, { useState, useEffect } from 'react';
import { Modal, Pressable, View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Feather from 'react-native-vector-icons/Feather';
import colors from '../../../../theme/colors';

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

function sameDate(a, b) {
  return (
    a.getDate() === b.getDate() &&
    a.getMonth() === b.getMonth() &&
    a.getFullYear() === b.getFullYear()
  );
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

export default function CalendarModal({ visible, monthLabel, monthData, selectedDate, onSelectDate, onClose }) {
  const [currentDate, setCurrentDate] = useState(selectedDate || new Date());
  const [displayMonthData, setDisplayMonthData] = useState(monthData);
  const [displayMonthLabel, setDisplayMonthLabel] = useState(monthLabel);

  useEffect(() => {
    if (visible) {
      setCurrentDate(selectedDate || new Date());
    }
  }, [visible, selectedDate]);

  useEffect(() => {
    const newMonthData = getMonthDays(currentDate);
    const newMonthLabel = currentDate.toLocaleString('default', { month: 'long', year: 'numeric' });
    setDisplayMonthData(newMonthData);
    setDisplayMonthLabel(newMonthLabel);
  }, [currentDate]);

  const goToPreviousMonth = () => {
    const prev = new Date(currentDate);
    prev.setMonth(prev.getMonth() - 1);
    setCurrentDate(prev);
  };

  const goToNextMonth = () => {
    const next = new Date(currentDate);
    next.setMonth(next.getMonth() + 1);
    setCurrentDate(next);
  };

  return (
    <Modal transparent visible={visible} animationType="fade">
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={styles.card} onPress={() => {}}>
          <Text style={styles.title}>Habit Tracker</Text>
          <View style={styles.monthHeader}>
            <TouchableOpacity onPress={goToPreviousMonth} style={styles.navButton}>
              <Feather name="chevron-left" size={20} color={colors.textPrimary} />
            </TouchableOpacity>
            <Text style={styles.month}>{displayMonthLabel}</Text>
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
            {Array.from({ length: displayMonthData.firstWeekday }).map((_, i) => (
              <View key={`e-${i}`} style={styles.cell} />
            ))}
            {displayMonthData.days.map(d => {
              const active = sameDate(d, selectedDate);
              return (
                <TouchableOpacity
                  key={d.toISOString()}
                  style={[styles.cell, active && styles.cellActive]}
                  onPress={() => onSelectDate(d)}
                  activeOpacity={0.85}
                >
                  <Text style={[styles.cellText, active && styles.cellTextActive]}>{d.getDate()}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
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
  },
  month: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
    flex: 1,
    textAlign: 'center',
  },
  monthHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  navButton: {
    padding: 4,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
  },
  day: {
    width: 32,
    textAlign: 'center',
    fontSize: 11,
    color: '#7A7A7A',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
  },
  cell: {
    width: '14.285%',
    alignItems: 'center',
    paddingVertical: 6,
  },
  cellActive: {
    backgroundColor: '#F4C9E4',
    borderRadius: 10,
  },
  cellText: {
    fontSize: 12,
    color: colors.textPrimary,
  },
  cellTextActive: {
    fontWeight: '700',
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
    marginTop: 10,
  },
  btnGhost: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
  },
  btnGhostText: { fontSize: 12, color: colors.textPrimary },
  btnPrimary: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 10,
    backgroundColor: '#78B8F6',
  },
  btnPrimaryText: { fontSize: 12, color: '#FFFFFF', fontWeight: '700' },
});

import React from 'react';
import { Modal, Pressable, View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import colors from '../../../../theme/colors';

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

function sameDate(a, b) {
  return (
    a.getDate() === b.getDate() &&
    a.getMonth() === b.getMonth() &&
    a.getFullYear() === b.getFullYear()
  );
}

export default function CalendarModal({ visible, monthLabel, monthData, selectedDate, onSelectDate, onClose }) {
  return (
    <Modal transparent visible={visible} animationType="fade">
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={styles.card} onPress={() => {}}>
          <Text style={styles.title}>Habit Tracker</Text>
          <Text style={styles.month}>{monthLabel}</Text>
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
    marginTop: 6,
    fontSize: 12,
    color: '#7A7A7A',
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

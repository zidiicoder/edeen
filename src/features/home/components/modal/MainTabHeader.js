import React, { useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Feather from 'react-native-vector-icons/Feather';
import { useNavigation } from '@react-navigation/native';
import colors from '../../../../theme/colors';

function startOfWeekMonday(date) {
  const d = new Date(date);
  const day = (d.getDay() + 6) % 7; // Monday=0
  d.setDate(d.getDate() - day);
  d.setHours(0, 0, 0, 0);
  return d;
}

function sameDate(a, b) {
  return (
    a.getDate() === b.getDate() &&
    a.getMonth() === b.getMonth() &&
    a.getFullYear() === b.getFullYear()
  );
}

function dayLetterFromDate(d) {
  const map = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
  return map[d.getDay()];
}

export default function MainTabHeader({
  title = 'User',
  bg = '#CFE4F5',
  filterLabel = 'All',
  onPressBell,
  onPressFilter,
  onPressSettings,
}) {
  const navigation = useNavigation();
  const today = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  const datesForWeek = useMemo(() => {
    const monday = startOfWeekMonday(today);
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      d.setHours(0, 0, 0, 0);
      return d;
    });
  }, [today]);

  const activeIndex = useMemo(() => {
    const idx = datesForWeek.findIndex(d => sameDate(d, today));
    return idx >= 0 ? idx : 0;
  }, [datesForWeek, today]);

  return (
    <View style={[styles.headerCard, { backgroundColor: bg }]}>
      <View style={styles.headerRow}>
        <Text style={styles.headerTitle}>Salam, {title}</Text>
        <View style={styles.headerIcons}>
          <TouchableOpacity
            onPress={
              onPressBell ||
              (() => navigation.navigate('Notifications'))
            }
            activeOpacity={0.85}
          >
            <Feather name="bell" size={18} color={colors.textPrimary} />
          </TouchableOpacity>
          <TouchableOpacity
            activeOpacity={0.85}
            style={styles.filterPill}
            onPress={onPressFilter}
          >
            <Text style={styles.filterText}>{filterLabel}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.iconCircle}
            onPress={
              onPressSettings ||
              (() => navigation.navigate('Profile'))
            }
            activeOpacity={0.8}
          >
            <Feather name="sliders" size={16} color={colors.textPrimary} />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.calendarRow}>
        {datesForWeek.map((d, i) => {
          const date = String(d.getDate()).padStart(2, '0');
          const active = i === activeIndex;
          return (
            <View key={String(d)} style={styles.calendarCol}>
              <View
                style={[
                  styles.calendarPill,
                  active && styles.calendarPillActive,
                ]}
              >
                <Text style={styles.weekText}>{dayLetterFromDate(d)}</Text>
                <View
                  style={[
                    styles.calendarDateCircle,
                    active && styles.calendarDateCircleActive,
                  ]}
                >
                  <Text style={[styles.dateText, active && styles.dateTextActive]}>
                    {date}
                  </Text>
                </View>
              </View>
            </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  headerCard: {
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    paddingHorizontal: 18,
    paddingTop: 16,
    paddingBottom: 20,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: { fontSize: 20, fontWeight: '800', color: colors.textPrimary },
  headerIcons: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  filterPill: {
    backgroundColor: '#F4C9E4',
    borderRadius: 18,
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderWidth: 2,
    borderColor: '#F2B7D9',
    minWidth: 70,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterText: { fontSize: 13, fontWeight: '700', color: colors.textPrimary },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 2,
    borderColor: '#F4C9E4',
    alignItems: 'center',
    justifyContent: 'center',
  },
  calendarRow: {
    flexDirection: 'row',
    marginTop: 12,
    justifyContent: 'space-between',
  },
  calendarCol: { width: 36, alignItems: 'center' },
  calendarPill: {
    width: 32,
    paddingVertical: 6,
    alignItems: 'center',
    borderRadius: 16,
  },
  calendarPillActive: { backgroundColor: '#F4B6D2' },
  weekText: { fontSize: 12, color: colors.textPrimary },
  calendarDateCircle: {
    marginTop: 6,
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E7F2FB',
  },
  calendarDateCircleActive: {
    backgroundColor: '#EAD8E9',
    borderColor: '#E7A9C7',
    borderWidth: 1,
  },
  dateText: { fontSize: 12, color: colors.textPrimary },
  dateTextActive: { fontWeight: '700' },
});

import React, { useCallback, useContext, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Modal,
  Pressable,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import colors from '../../../theme/colors';
import MainTabHeader from '../components/modal/MainTabHeader';
import CalendarModal from '../components/modal/CalendarModal';
import { COMMON_FILTERS, toApiDate, toApiFilter } from '../constants/filters';
import { request } from '../../../utils/api';
import { AuthContext } from '../../../context/AuthContext';

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

export default function HomeScreen() {
  const navigation = useNavigation();
  const { user } = useContext(AuthContext);
  const [filter, setFilter] = useState('All');
  const [filterOpen, setFilterOpen] = useState(false);
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [completedHabits, setCompletedHabits] = useState([]);
  const [upcomingHabits, setUpcomingHabits] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  });

  const monthData = getMonthDays(selectedDate);
  const monthLabel = selectedDate.toLocaleString('default', {
    month: 'long',
    year: 'numeric',
  });

  const formatDate = dateValue => {
    if (!dateValue) return '';
    const date = new Date(dateValue);
    if (Number.isNaN(date.getTime())) return dateValue;
    return date.toLocaleDateString();
  };

  const getHabbitDashboard = useCallback(async (selectedFilter = filter, date = selectedDate) => {
    try {
      setLoading(true);
      const apiFilter = toApiFilter(selectedFilter);
      let url = `habits-dashboard?filter=${apiFilter}`;
      if (apiFilter === 'custom') {
        const apiDate = toApiDate(date);
        if (apiDate) {
          url += `&date=${apiDate}&custom_date=${apiDate}`;
        }
      }
      const response = await request({
        method: 'GET',
        url,
      });

      setCompletedHabits(response?.data?.completed_habits || []);
      setUpcomingHabits(response?.data?.upcoming_habits_list || []);
    } catch (error) {
      setCompletedHabits([]);
      setUpcomingHabits([]);
    } finally {
      setLoading(false);
    }
  }, [filter, selectedDate]);

  useEffect(() => {
    getHabbitDashboard(filter, selectedDate);
  }, [filter, selectedDate, getHabbitDashboard]);

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <MainTabHeader
        title={user?.name || 'User'}
        bg="#CFE4F5"
        filterLabel={filter}
        onPressFilter={() => setFilterOpen(true)}
        onPressBell={() => navigation.navigate('Notifications')}
        onPressSettings={() => navigation.navigate('Profile')}
      />

      <View style={styles.container}>
        <Modal visible={filterOpen} transparent animationType="fade">
          <Pressable
            style={styles.modalOverlay}
            onPress={() => setFilterOpen(false)}
          >
            <Pressable style={styles.dropdownCard} onPress={() => {}}>
              {COMMON_FILTERS.map(item => {
                const active = item === filter;
                return (
                  <TouchableOpacity
                    key={item}
                    activeOpacity={0.85}
                    style={[
                      styles.dropdownItem,
                      active && styles.dropdownItemActive,
                    ]}
                    onPress={() => {
                      if (item === 'Custom') {
                        setFilterOpen(false);
                        setTimeout(() => setCalendarOpen(true), 120);
                        return;
                      }
                      setFilter(item);
                      setFilterOpen(false);
                    }}
                  >
                    <Text
                      style={[
                        styles.dropdownText,
                        active && styles.dropdownTextActive,
                      ]}
                    >
                      {item}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </Pressable>
          </Pressable>
        </Modal>
        <CalendarModal
          visible={calendarOpen}
          monthLabel={monthLabel}
          monthData={monthData}
          selectedDate={selectedDate}
          onSelectDate={date => {
            const next = new Date(date);
            next.setHours(0, 0, 0, 0);
            setSelectedDate(next);
            setFilter('Custom');
          }}
          onClose={() => setCalendarOpen(false)}
        />

        <ScrollView showsVerticalScrollIndicator={false}>
          <View style={styles.sectionRow}>
            <Text style={styles.sectionTitle}>Upcoming Habits</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Reminder')}>
              <Text style={styles.sectionLink}>Reminders</Text>
            </TouchableOpacity>
          </View>

          {loading
            ? Array.from({ length: 3 }).map((_, index) => (
                <View key={`upcoming-skeleton-${index}`} style={styles.card}>
                  <View style={styles.cardLeft}>
                    <View style={styles.emojiSkeleton} />
                    <View style={styles.textWrap}>
                      <View style={styles.skeletonTitle} />
                      <View style={styles.skeletonSubtitle} />
                    </View>
                  </View>
                  <View style={styles.statusSkeleton} />
                </View>
              ))
            : upcomingHabits.map(item => {
                const upcomingDate = formatDate(
                  item?.upcoming_date || item?.custom_date || item?.start_date,
                );

                return (
                  <View key={`upcoming-${item.id}`} style={styles.card}>
                    <View style={styles.cardLeft}>
                      <Text style={styles.emojiIcon}>{item?.icon || 'H'}</Text>
                      <View style={styles.textWrap}>
                        <Text style={styles.cardTitle}>{item?.name || 'Habit'}</Text>
                        <Text style={styles.cardSubtitle}>
                          {item?.description || 'No description'}
                        </Text>
                      </View>
                    </View>
                    <View style={styles.statusWrap}>
                      <Text style={styles.statusText}>{upcomingDate || 'Upcoming'}</Text>
                    </View>
                  </View>
                );
              })}

          {!loading && upcomingHabits.length === 0 && (
            <Text style={styles.emptyText}>No upcoming habits found.</Text>
          )}

          <View style={styles.sectionRow}>
            <Text style={styles.sectionTitle}>Completed</Text>
          </View>

          {loading
            ? Array.from({ length: 3 }).map((_, index) => (
                <View key={`completed-skeleton-${index}`} style={styles.card}>
                  <View style={styles.cardLeft}>
                    <View style={styles.emojiSkeleton} />
                    <View style={styles.textWrap}>
                      <View style={styles.skeletonTitle} />
                      <View style={styles.skeletonSubtitle} />
                    </View>
                  </View>
                  <View style={styles.completedSkeleton} />
                </View>
              ))
            : completedHabits.map(item => (
                <View key={`completed-${item.id}`} style={styles.card}>
                  <View style={styles.cardLeft}>
                    <Text style={styles.emojiIcon}>{item?.icon || 'H'}</Text>
                    <View style={styles.textWrap}>
                      <Text style={styles.cardTitle}>{item?.name || 'Habit'}</Text>
                      <Text style={styles.cardSubtitle}>
                        {item?.description || 'No description'}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.completedTag}>
                    <Text style={styles.completedTagText}>
                      {item?.status || 'complete'}
                    </Text>
                  </View>
                </View>
              ))}

          {!loading && completedHabits.length === 0 && (
            <Text style={styles.emptyText}>No completed habits found.</Text>
          )}
        </ScrollView>

        <Image
          source={require('../../../assets/images/Edeen (1).png')}
          style={styles.watermark}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#FFFFFF' },
  container: {
    flex: 1,
    paddingTop: 0,
    backgroundColor: '#FFFFFF',
  },

  sectionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 18,
    paddingHorizontal: 18,
  },
  sectionTitle: {
    fontSize: 14,
    color: '#5C5C5C',
    fontWeight: '600',
  },
  sectionLink: {
    fontSize: 12,
    color: '#5C5C5C',
  },

  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
    borderWidth: 1,
    borderColor: '#E4E4E4',
    marginHorizontal: 18,
  },
  cardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  textWrap: {
    flex: 1,
    paddingRight: 10,
  },
  emojiIcon: {
    fontSize: 20,
  },
  emojiSkeleton: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#E5EAF0',
  },
  cardTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  cardSubtitle: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 2,
  },
  skeletonTitle: {
    width: '65%',
    height: 12,
    borderRadius: 6,
    backgroundColor: '#E5EAF0',
  },
  skeletonSubtitle: {
    marginTop: 6,
    width: '85%',
    height: 10,
    borderRadius: 6,
    backgroundColor: '#E5EAF0',
  },

  statusWrap: {
    minWidth: 80,
    paddingHorizontal: 10,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#F3F6FA',
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusSkeleton: {
    width: 78,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#E5EAF0',
  },
  statusText: {
    fontSize: 10,
    color: '#4E5A65',
    fontWeight: '600',
  },

  completedTag: {
    minWidth: 64,
    height: 24,
    borderRadius: 12,
    paddingHorizontal: 8,
    backgroundColor: '#DDF2E8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  completedSkeleton: {
    width: 64,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#E5EAF0',
  },
  completedTagText: {
    fontSize: 10,
    color: colors.textPrimary,
    fontWeight: '700',
    textTransform: 'capitalize',
  },

  emptyText: {
    fontSize: 12,
    color: colors.textMuted,
    paddingHorizontal: 18,
    marginTop: 10,
  },

  watermark: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{ translateX: -100 }, { translateY: -100 }],
    width: 200,
    height: 200,
    opacity: 0.16,
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.10)',
    justifyContent: 'flex-start',
    alignItems: 'flex-end',
    paddingTop: 90,
    paddingRight: 18,
  },
  dropdownCard: {
    width: 150,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#F2B7D9',
    paddingVertical: 8,
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },
  dropdownItem: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    marginHorizontal: 8,
    marginVertical: 4,
  },
  dropdownItemActive: {
    backgroundColor: '#F4C9E4',
  },
  dropdownText: {
    fontSize: 13,
    color: colors.textPrimary,
    fontWeight: '600',
  },
  dropdownTextActive: {
    fontWeight: '800',
  },
});

import React, { useEffect, useState, useMemo } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Feather from 'react-native-vector-icons/Feather';
import colors from '../../../theme/colors';
import { request } from '../../../utils/api';
import { getAppStartDate } from '../../../utils/appDate';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const DAYS_OF_WEEK = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

function getQuranReadsFromResponse(response) {
  if (Array.isArray(response?.data?.quran_reads)) {
    return response.data.quran_reads;
  }
  if (Array.isArray(response?.quran_reads)) {
    return response.quran_reads;
  }
  return [];
}

function normalizeQuranReads(response) {
  const reads = getQuranReadsFromResponse(response);
  return reads.reduce((acc, item) => {
    if (!item?.date) {
      return acc;
    }
    acc[item.date] = {
      id: item?.id,
      date: item.date,
      read: Boolean(item.read),
    };
    return acc;
  }, {});
}

function calculateStreak(sortedDates) {
  if (sortedDates.length === 0) return 0;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayKey = formatDateKey(today);

  let currentStreak = 0;
  let checkDate = new Date(today);

  // Check if today or yesterday has a read
  const todayRead = sortedDates.includes(todayKey);
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayKey = formatDateKey(yesterday);
  const yesterdayRead = sortedDates.includes(yesterdayKey);

  if (!todayRead && !yesterdayRead) {
    return 0; // Streak is broken
  }

  // Start counting from today or yesterday
  if (!todayRead) {
    checkDate = yesterday;
  }

  // Count backwards
  while (true) {
    const key = formatDateKey(checkDate);
    if (sortedDates.includes(key)) {
      currentStreak++;
      checkDate.setDate(checkDate.getDate() - 1);
    } else {
      break;
    }
  }

  return currentStreak;
}

function formatDateKey(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function getMonthYearFromDate(dateStr) {
  const date = new Date(dateStr);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

function getMonthDays(year, month) {
  const first = new Date(year, month, 1);
  const last = new Date(year, month + 1, 0);
  const days = [];
  for (let d = 1; d <= last.getDate(); d += 1) {
    days.push(new Date(year, month, d));
  }
  // Calculate first weekday (0=Mon, 1=Tue, ..., 6=Sun)
  return { firstWeekday: (first.getDay() + 6) % 7, days };
}

export default function QuranSummaryScreen({ navigation }) {
  const [quranReadMap, setQuranReadMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [selectedYear, setSelectedYear] = useState(() => new Date().getFullYear());
  const [userStartYear, setUserStartYear] = useState(null);
  const [userStartMonth, setUserStartMonth] = useState(null); // 0-based
  const [monthModalVisible, setMonthModalVisible] = useState(false);
  const [selectedMonthData, setSelectedMonthData] = useState(null);

  useEffect(() => {
    getAppStartDate().then(v => {
      if (!v) return;
      const d = new Date(v);
      setUserStartYear(d.getFullYear());
      setUserStartMonth(d.getMonth());
    });
  }, []);

  const getQuranReads = async () => {
    try {
      setLoading(true);
      const response = await request({
        method: 'GET',
        url: 'quran',
      });
      setQuranReadMap(normalizeQuranReads(response));
    } catch (error) {
      setQuranReadMap({});
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getQuranReads();
  }, []);

  const stats = useMemo(() => {
    const allReadDates = Object.keys(quranReadMap)
      .filter(key => quranReadMap[key]?.read === true)
      .sort();

    const yearReadDates = allReadDates.filter(dateStr => {
      const date = new Date(dateStr);
      return date.getFullYear() === selectedYear;
    });

    const totalDays = yearReadDates.length;
    const currentStreak = calculateStreak(allReadDates);

    // Calculate longest streak
    let longestStreak = 0;
    let tempStreak = 0;
    let prevDate = null;

    allReadDates.forEach(dateStr => {
      const date = new Date(dateStr);
      if (prevDate) {
        const daysDiff = Math.floor((date - prevDate) / (1000 * 60 * 60 * 24));
        if (daysDiff === 1) {
          tempStreak++;
        } else {
          longestStreak = Math.max(longestStreak, tempStreak);
          tempStreak = 1;
        }
      } else {
        tempStreak = 1;
      }
      prevDate = date;
    });
    longestStreak = Math.max(longestStreak, tempStreak);

    // Group by month
    const monthlyData = yearReadDates.reduce((acc, dateStr) => {
      const monthYear = getMonthYearFromDate(dateStr);
      acc[monthYear] = (acc[monthYear] || 0) + 1;
      return acc;
    }, {});

    return {
      totalDays,
      currentStreak,
      longestStreak,
      monthlyData,
      yearReadDates,
    };
  }, [quranReadMap, selectedYear]);

  const availableYears = useMemo(() => {
    const years = new Set();
    Object.keys(quranReadMap).forEach(dateStr => {
      const year = new Date(dateStr).getFullYear();
      years.add(year);
    });
    return Array.from(years).sort((a, b) => b - a);
  }, [quranReadMap]);

  const goToPreviousYear = () => {
    if (userStartYear && selectedYear <= userStartYear) {
      return; // Cannot go before user's join year
    }
    setSelectedYear(prev => prev - 1);
  };

  const goToNextYear = () => {
    const currentYear = new Date().getFullYear();
    if (selectedYear < currentYear) {
      setSelectedYear(prev => prev + 1);
    }
  };

  const openMonthCalendar = (monthIndex) => {
    const monthData = getMonthDays(selectedYear, monthIndex);
    setSelectedMonthData({
      year: selectedYear,
      month: monthIndex,
      monthName: MONTHS[monthIndex],
      ...monthData,
    });
    setMonthModalVisible(true);
  };

  const closeMonthCalendar = () => {
    setMonthModalVisible(false);
    setSelectedMonthData(null);
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Feather name="arrow-left" size={24} color={colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Quran Summary</Text>
          <View style={styles.headerSpacer} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#6ECBC7" />
          <Text style={styles.loadingText}>Loading your Quran reading history...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Feather name="arrow-left" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Quran Summary</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
        {/* Year Navigator */}
        <View style={styles.yearNavigator}>
          <TouchableOpacity 
            style={[
              styles.yearNavButton,
              userStartYear && selectedYear <= userStartYear && styles.yearNavButtonDisabled,
            ]}
            onPress={goToPreviousYear}
            disabled={userStartYear && selectedYear <= userStartYear}
          >
            <Feather 
              name="chevron-left" 
              size={20} 
              color={userStartYear && selectedYear <= userStartYear ? '#D0D5DD' : '#6C8190'} 
            />
          </TouchableOpacity>
          <Text style={styles.yearLabel}>{selectedYear}</Text>
          <TouchableOpacity
            style={[
              styles.yearNavButton,
              selectedYear >= new Date().getFullYear() && styles.yearNavButtonDisabled,
            ]}
            onPress={goToNextYear}
            disabled={selectedYear >= new Date().getFullYear()}
          >
            <Feather
              name="chevron-right"
              size={20}
              color={selectedYear >= new Date().getFullYear() ? '#D0D5DD' : '#6C8190'}
            />
          </TouchableOpacity>
        </View>

        {/* Stats Cards */}
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <View style={styles.statIconContainer}>
              <Feather name="calendar" size={20} color="#6ECBC7" />
            </View>
            <Text style={styles.statValue}>{stats.totalDays}</Text>
            <Text style={styles.statLabel}>Days Read</Text>
          </View>

          <View style={styles.statCard}>
            <View style={[styles.statIconContainer, { backgroundColor: '#FEF3C7' }]}>
              <Feather name="zap" size={20} color="#F59E0B" />
            </View>
            <Text style={styles.statValue}>{stats.currentStreak}</Text>
            <Text style={styles.statLabel}>Current Streak</Text>
          </View>

          <View style={styles.statCard}>
            <View style={[styles.statIconContainer, { backgroundColor: '#DBEAFE' }]}>
              <Feather name="award" size={20} color="#3B82F6" />
            </View>
            <Text style={styles.statValue}>{stats.longestStreak}</Text>
            <Text style={styles.statLabel}>Longest Streak</Text>
          </View>
        </View>

        {/* Monthly Breakdown */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Monthly Breakdown</Text>
          <View style={styles.monthlyGrid}>
            {MONTHS.map((month, index) => {
              // Hide months outside the user's range: before the join month (in
              // the join year) and any future months (in the current year).
              const now = new Date();
              const minMonth =
                userStartMonth != null && selectedYear === userStartYear
                  ? userStartMonth
                  : 0;
              const maxMonth =
                selectedYear === now.getFullYear() ? now.getMonth() : 11;
              if (index < minMonth || index > maxMonth) {
                return null;
              }

              const monthKey = `${selectedYear}-${String(index + 1).padStart(2, '0')}`;
              const count = stats.monthlyData[monthKey] || 0;
              const hasData = count > 0;

              return (
                <TouchableOpacity
                  key={monthKey}
                  style={[styles.monthCard, hasData && styles.monthCardActive]}
                  onPress={() => openMonthCalendar(index)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.monthName, hasData && styles.monthNameActive]}>
                    {month}
                  </Text>
                  <Text style={[styles.monthCount, hasData && styles.monthCountActive]}>
                    {count}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Tips Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Tips for Consistency</Text>
          <View style={styles.tipCard}>
            <Feather name="sunrise" size={16} color="#6C8190" />
            <Text style={styles.tipText}>Read at the same time each day to build a habit</Text>
          </View>
          <View style={styles.tipCard}>
            <Feather name="target" size={16} color="#6C8190" />
            <Text style={styles.tipText}>Start small - even one page counts</Text>
          </View>
          <View style={styles.tipCard}>
            <Feather name="users" size={16} color="#6C8190" />
            <Text style={styles.tipText}>Share your progress with friends for accountability</Text>
          </View>
        </View>
      </ScrollView>

      {/* Month Calendar Modal */}
      <Modal
        visible={monthModalVisible}
        transparent
        animationType="fade"
        onRequestClose={closeMonthCalendar}
      >
        <Pressable style={styles.modalOverlay} onPress={closeMonthCalendar}>
          <Pressable style={styles.modalContent} onPress={() => {}}>
            {selectedMonthData && (
              <>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>
                    {selectedMonthData.monthName} {selectedMonthData.year}
                  </Text>
                  <TouchableOpacity onPress={closeMonthCalendar} style={styles.modalCloseButton}>
                    <Feather name="x" size={24} color={colors.textPrimary} />
                  </TouchableOpacity>
                </View>

                <View style={styles.calendarContainer}>
                  {/* Day Labels */}
                  <View style={styles.calendarDayLabels}>
                    {DAYS_OF_WEEK.map(day => (
                      <Text key={day} style={styles.calendarDayLabel}>{day}</Text>
                    ))}
                  </View>

                  {/* Calendar Grid */}
                  <View style={styles.calendarGrid}>
                    {(() => {
                      const today = new Date();
                      today.setHours(0, 0, 0, 0);

                      // Empty cells before first day
                      const emptyCells = Array.from({ length: selectedMonthData.firstWeekday }).map((_, i) => (
                        <View key={`empty-${i}`} style={styles.calendarDayCell} />
                      ));

                      // Actual day cells
                      const dayCells = selectedMonthData.days.map((dayDate) => {
                        const dateKey = formatDateKey(dayDate);
                        const isRead = quranReadMap[dateKey]?.read === true;
                        const isToday = dayDate.getTime() === today.getTime();
                        const isFuture = dayDate > today;

                        return (
                          <View
                            key={dateKey}
                            style={[
                              styles.calendarDayCell,
                              styles.calendarDayCellWithBorder,
                            ]}
                          >
                            <View
                              style={[
                                styles.calendarDayCircle,
                                isToday && styles.calendarDayCircleToday,
                                isRead && styles.calendarDayCircleRead,
                                isFuture && styles.calendarDayCircleFuture,
                              ]}
                            >
                              {isRead ? (
                                <Feather name="check" size={14} color="#FFFFFF" />
                              ) : (
                                <Text
                                  style={[
                                    styles.calendarDayText,
                                    isToday && styles.calendarDayTextToday,
                                    isFuture && styles.calendarDayTextFuture,
                                  ]}
                                >
                                  {dayDate.getDate()}
                                </Text>
                              )}
                            </View>
                          </View>
                        );
                      });

                      return [...emptyCells, ...dayCells];
                    })()}
                  </View>

                  {/* Legend */}
                  <View style={styles.calendarLegend}>
                    <View style={styles.legendItem}>
                      <View style={[styles.legendDot, styles.legendDotRead]}>
                        <Feather name="check" size={10} color="#FFFFFF" />
                      </View>
                      <Text style={styles.legendLabel}>Read</Text>
                    </View>
                    <View style={styles.legendItem}>
                      <View style={[styles.legendDot, styles.legendDotToday]} />
                      <Text style={styles.legendLabel}>Today</Text>
                    </View>
                    <View style={styles.legendItem}>
                      <View style={[styles.legendDot, styles.legendDotNotRead]} />
                      <Text style={styles.legendLabel}>Not Read</Text>
                    </View>
                  </View>
                </View>
              </>
            )}
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#E5ECF2',
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  headerSpacer: {
    width: 32,
  },
  container: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 40,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  loadingText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6C8190',
  },
  yearNavigator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    gap: 20,
  },
  yearNavButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F5F8FB',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E5ECF2',
  },
  yearNavButtonDisabled: {
    opacity: 0.4,
  },
  yearLabel: {
    fontSize: 20,
    fontWeight: '900',
    color: colors.textPrimary,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#F5F8FB',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5ECF2',
  },
  statIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E8F7F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '900',
    color: colors.textPrimary,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#6C8190',
    textTransform: 'uppercase',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.textPrimary,
    marginBottom: 12,
  },
  monthlyGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  monthCard: {
    width: '22%',
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  monthCardActive: {
    backgroundColor: '#E8F7F6',
    borderColor: '#6ECBC7',
  },
  monthName: {
    fontSize: 11,
    fontWeight: '700',
    color: '#9CA3AF',
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  monthNameActive: {
    color: '#6ECBC7',
  },
  monthCount: {
    fontSize: 16,
    fontWeight: '900',
    color: '#6B7280',
  },
  monthCountActive: {
    color: '#6ECBC7',
  },
  insightCard: {
    flexDirection: 'row',
    backgroundColor: '#ECFDF5',
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    gap: 12,
  },
  insightIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#A7F3D0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  insightContent: {
    flex: 1,
  },
  insightTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.textPrimary,
    marginBottom: 4,
  },
  insightText: {
    fontSize: 12,
    lineHeight: 18,
    fontWeight: '600',
    color: '#6C8190',
  },
  tipCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  tipText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 18,
    fontWeight: '600',
    color: '#6C8190',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    width: '100%',
    maxWidth: 400,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5ECF2',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: colors.textPrimary,
  },
  modalCloseButton: {
    padding: 4,
  },
  calendarContainer: {
    padding: 20,
  },
  calendarDayLabels: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  calendarDayLabel: {
    flex: 1,
    textAlign: 'center',
    fontSize: 11,
    fontWeight: '700',
    color: '#6C8190',
    textTransform: 'uppercase',
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
  },
  calendarDayCell: {
    width: '13.2%',
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  calendarDayCellWithBorder: {
    borderRadius: 8,
  },
  calendarDayCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  calendarDayCircleToday: {
    backgroundColor: '#FFF7ED',
    borderColor: '#FED7AA',
  },
  calendarDayCircleRead: {
    backgroundColor: '#6ECBC7',
    borderColor: '#6ECBC7',
  },
  calendarDayCircleFuture: {
    opacity: 0.4,
  },
  calendarDayText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  calendarDayTextToday: {
    color: '#F97316',
    fontWeight: '900',
  },
  calendarDayTextFuture: {
    color: '#9CA3AF',
  },
  calendarLegend: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
    marginTop: 20,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5ECF2',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendDot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  legendDotRead: {
    backgroundColor: '#6ECBC7',
    borderColor: '#6ECBC7',
  },
  legendDotToday: {
    backgroundColor: '#FFF7ED',
    borderColor: '#FED7AA',
  },
  legendDotNotRead: {
    backgroundColor: '#F9FAFB',
    borderColor: '#E5E7EB',
  },
  legendLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#6C8190',
  },
});

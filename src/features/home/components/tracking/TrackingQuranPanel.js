import { useEffect, useMemo, useState, useContext } from 'react';
import { StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Feather from 'react-native-vector-icons/Feather';
import colors from '../../../../theme/colors';
import { request } from '../../../../utils/api';
import { hapticTap } from '../../../../utils/haptics';
import { AuthContext } from '../../../../context/AuthContext';
import { getAppStartDate } from '../../../../utils/appDate';

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

function getQuranReadId(item) {
  return item?.id ?? item?.quran_read_id ?? item?.quran_id ?? item?.record_id ?? null;
}

function normalizeQuranReads(response) {
  const reads = getQuranReadsFromResponse(response);
  return reads.reduce((acc, item) => {
    if (!item?.date) {
      return acc;
    }
    acc[item.date] = {
      id: getQuranReadId(item),
      date: item.date,
      read: Boolean(item.read),
    };
    return acc;
  }, {});
}

function getQuranMutationRecord(response) {
  const candidates = [
    response?.data?.quran_read,
    response?.quran_read,
    response?.data,
    response,
  ];
  return (
    candidates.find(
      candidate =>
        candidate &&
        typeof candidate === 'object' &&
        !Array.isArray(candidate) &&
        (candidate.date || typeof candidate.read === 'boolean' || candidate.id),
    ) || null
  );
}

function getWeekDates(startDate) {
  const dates = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(startDate);
    d.setDate(startDate.getDate() + i);
    dates.push(d);
  }
  return dates;
}

// Calculate which week number (0-indexed) a given date falls into based on app start date
function getWeekNumberFromStart(date, appStartDate) {
  if (!appStartDate) return 0;
  const diffTime = date.getTime() - appStartDate.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  return Math.floor(diffDays / 7);
}

// Get the start date of a specific week number (0-indexed) from app start date
function getWeekStartDate(appStartDate, weekNumber) {
  if (!appStartDate) return new Date();
  
  // Week 0 and beyond: Start from account creation date
  if (weekNumber >= 0) {
    const start = new Date(appStartDate);
    start.setDate(start.getDate() + (weekNumber * 7));
    return start;
  }
  
  // Negative weeks: Go backward from account creation date
  // But don't show weeks that would be entirely before account creation
  const start = new Date(appStartDate);
  start.setDate(start.getDate() + (weekNumber * 7));
  return start;
}

function formatDateKey(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function isToday(date) {
  const today = new Date();
  return (
    date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear()
  );
}

function isFutureDate(date) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return date > today;
}

export default function TrackingQuranPanel() {
  const navigation = useNavigation();
  const { user } = useContext(AuthContext);
  const [startDate, setStartDate] = useState(null); // install / account-create day
  const [currentWeekNumber, setCurrentWeekNumber] = useState(0); // 0-indexed week number from start date
  const [quranReadMap, setQuranReadMap] = useState({});
  const [loadingReads, setLoadingReads] = useState(false);
  const [syncingDayKey, setSyncingDayKey] = useState(null);

  // Initialize app start date from user's created_at and set current week number
  useEffect(() => {
    const initializeStartDate = async () => {
      let accountCreatedDate = null;
      
      console.log('[QuranTracker] Initializing start date...');
      console.log('[QuranTracker] Full user object:', JSON.stringify(user));
      console.log('[QuranTracker] user.created_at:', user?.created_at);
      
      // Try to get from user.created_at (if available from backend)
      if (user?.created_at) {
        accountCreatedDate = new Date(user.created_at);
        console.log('[QuranTracker] Using user.created_at:', accountCreatedDate);
      } else {
        // Fallback: Use AsyncStorage or default to today
        const storedDate = await getAppStartDate();
        accountCreatedDate = new Date(storedDate);
        console.log('[QuranTracker] Using AsyncStorage fallback:', accountCreatedDate);
      }
      
      accountCreatedDate.setHours(0, 0, 0, 0);
      setStartDate(accountCreatedDate);
      
      // Calculate which week we're currently in
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const weekNum = getWeekNumberFromStart(today, accountCreatedDate);
      console.log('[QuranTracker] Today:', today);
      console.log('[QuranTracker] Account created:', accountCreatedDate);
      console.log('[QuranTracker] Current week number:', weekNum);
      setCurrentWeekNumber(weekNum);
    };
    
    if (user) {
      initializeStartDate();
    }
  }, [user]);

  // Calculate week start date based on current week number
  const weekStart = useMemo(() => {
    if (!startDate) return new Date();
    const start = getWeekStartDate(startDate, currentWeekNumber);
    console.log('[QuranTracker] Week start date for week', currentWeekNumber, ':', start);
    return start;
  }, [startDate, currentWeekNumber]);

  // Days before the user joined cannot be tracked.
  const isBeforeStart = date => {
    if (!startDate) return false;
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    return d < startDate;
  };

  // Calculate if we can go to previous week
  // Don't allow going to weeks that would be entirely before account creation
  const canGoPrevious = useMemo(() => {
    if (!startDate) return false;
    
    // Calculate what the previous week start date would be
    const prevWeekNumber = currentWeekNumber - 1;
    const prevWeekStart = getWeekStartDate(startDate, prevWeekNumber);
    const prevWeekEnd = new Date(prevWeekStart);
    prevWeekEnd.setDate(prevWeekEnd.getDate() + 6); // Last day of that week
    
    // If the entire previous week ends before account creation, don't allow going back
    return prevWeekEnd >= startDate;
  }, [currentWeekNumber, startDate]);

  // Calculate if we can go to next week (can't go beyond current week)
  const canGoNext = useMemo(() => {
    if (!startDate) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const currentWeekNum = getWeekNumberFromStart(today, startDate);
    return currentWeekNumber < currentWeekNum;
  }, [currentWeekNumber, startDate]);

  const weekDates = useMemo(() => getWeekDates(weekStart), [weekStart]);
  
  const thisWeekCount = useMemo(() => {
    return weekDates.filter(date => {
      if (isBeforeStart(date)) return false;
      const key = formatDateKey(date);
      return quranReadMap[key]?.read === true;
    }).length;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [weekDates, quranReadMap, startDate]);

  const weekLabel = useMemo(() => {
    const start = weekDates[0];
    const end = weekDates[6];
    const startMonth = start.toLocaleString('default', { month: 'short' });
    const endMonth = end.toLocaleString('default', { month: 'short' });
    
    if (startMonth === endMonth) {
      return `${startMonth} ${start.getDate()}-${end.getDate()}, ${start.getFullYear()}`;
    }
    return `${startMonth} ${start.getDate()} - ${endMonth} ${end.getDate()}, ${start.getFullYear()}`;
  }, [weekDates]);

  const isCurrentWeek = useMemo(() => {
    if (!startDate) return true;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayWeekNum = getWeekNumberFromStart(today, startDate);
    return currentWeekNumber === todayWeekNum;
  }, [currentWeekNumber, startDate]);

  const getQuranReads = async () => {
    try {
      setLoadingReads(true);
      const response = await request({
        method: 'GET',
        url: 'quran',
      });
      setQuranReadMap(normalizeQuranReads(response));
    } catch (error) {
      setQuranReadMap({});
    } finally {
      setLoadingReads(false);
    }
  };

  useEffect(() => {
    getQuranReads();
  }, []);

  const handleToggleDay = async (date) => {
    const key = formatDateKey(date);
    
    // Only prevent toggling for future dates, allow past dates to be toggled
    if (loadingReads || syncingDayKey || isFutureDate(date)) {
      return;
    }

    // Haptic feedback when a Quran day is toggled.
    hapticTap();

    const previousRecord = quranReadMap[key];
    const newValue = !previousRecord?.read;

    setQuranReadMap(prev => ({
      ...prev,
      [key]: {
        id: previousRecord?.id ?? null,
        date: key,
        read: newValue,
      },
    }));
    setSyncingDayKey(key);

    try {
      let response;
      const payload = {
        date: key,
        read: Boolean(newValue),
      };

      if (previousRecord?.id) {
        response = await request({
          method: 'PUT',
          url: `quran/${previousRecord.id}`,
          data: payload,
        });
      } else {
        response = await request({
          method: 'POST',
          url: 'quran',
          data: payload,
        });
      }

      const mutationRecord = getQuranMutationRecord(response);
      const resolvedRecord = {
        id: getQuranReadId(mutationRecord) ?? previousRecord?.id ?? null,
        date: mutationRecord?.date ?? key,
        read:
          typeof mutationRecord?.read === 'boolean'
            ? mutationRecord.read
            : Boolean(newValue),
      };

      setQuranReadMap(prev => ({
        ...prev,
        [key]: resolvedRecord,
      }));

      if (!resolvedRecord.id) {
        await getQuranReads();
      }
    } catch (error) {
      setQuranReadMap(prev => {
        if (!previousRecord) {
          const next = { ...prev };
          delete next[key];
          return next;
        }
        return {
          ...prev,
          [key]: previousRecord,
        };
      });
    } finally {
      setSyncingDayKey(null);
    }
  };

  const goToPreviousWeek = () => {
    console.log('[QuranTracker] Going to previous week. Current:', currentWeekNumber);
    setCurrentWeekNumber(prev => {
      const next = prev - 1;
      console.log('[QuranTracker] New week number:', next);
      return next;
    });
  };

  const goToNextWeek = () => {
    if (!canGoNext) return;
    console.log('[QuranTracker] Going to next week. Current:', currentWeekNumber);
    setCurrentWeekNumber(prev => {
      const next = prev + 1;
      console.log('[QuranTracker] New week number:', next);
      return next;
    });
  };

  const goToCurrentWeek = () => {
    if (!startDate) return;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayWeekNum = getWeekNumberFromStart(today, startDate);
    setCurrentWeekNumber(todayWeekNum);
  };

  return (
    <View style={styles.wrap}>
      <View style={styles.headerRow}>
        <View style={styles.headerLeft}>
          <Feather name="book-open" size={18} color={colors.textPrimary} />
          <Text style={styles.title}>Quran Reading Tracker</Text>
        </View>
        <TouchableOpacity
          style={styles.summaryButton}
          onPress={() => navigation.navigate('QuranSummary')}
          activeOpacity={0.8}
        >
          <Feather name="bar-chart-2" size={16} color="#6ECBC7" />
          <Text style={styles.summaryButtonText}>View Summary</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.statsCard}>
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>This Week</Text>
          <Text style={styles.statValue}>{thisWeekCount}/7 days</Text>
        </View>
        {thisWeekCount > 0 && (
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${(thisWeekCount / 7) * 100}%` }]} />
          </View>
        )}
      </View>

      <View style={styles.weekNavigator}>
        <TouchableOpacity
          style={[styles.navButton, !canGoPrevious && styles.navButtonDisabled]}
          onPress={goToPreviousWeek}
          activeOpacity={0.7}
          disabled={!canGoPrevious}
        >
          <Feather name="chevron-left" size={20} color={!canGoPrevious ? '#D0D5DD' : '#6C8190'} />
        </TouchableOpacity>

        <View style={styles.weekLabelContainer}>
          <Text style={styles.weekLabel}>{weekLabel}</Text>
          {!isCurrentWeek && (
            <TouchableOpacity
              style={styles.todayButton}
              onPress={goToCurrentWeek}
              activeOpacity={0.7}
            >
              <Text style={styles.todayButtonText}>This Week</Text>
            </TouchableOpacity>
          )}
        </View>

        <TouchableOpacity
          style={[styles.navButton, !canGoNext && styles.navButtonDisabled]}
          onPress={goToNextWeek}
          activeOpacity={0.7}
          disabled={!canGoNext}
        >
          <Feather name="chevron-right" size={20} color={!canGoNext ? '#D0D5DD' : '#6C8190'} />
        </TouchableOpacity>
      </View>

      <View style={styles.weekCalendar}>
        {weekDates.map((date, index) => {
          const key = formatDateKey(date);
          const beforeStart = isBeforeStart(date);

          // HIDE days before account creation - they should not display at all
          if (beforeStart) {
            return null;
          }
          
          const isRead = quranReadMap[key]?.read === true;
          const isTodayDate = isToday(date);
          const isFuture = isFutureDate(date);
          const isLocked = isFuture; // Only lock future days, past days can be edited
          const isSyncing = syncingDayKey === key;

          if (index === 0) {
            console.log('[QuranTracker] Rendering week dates:', weekDates.map(d => formatDateKey(d)));
            console.log('[QuranTracker] Today check:', {
              todayDate: new Date(),
              isTodayResults: weekDates.map(d => isToday(d)),
            });
          }

          return (
            <TouchableOpacity
              key={key}
              style={[
                styles.dayCard,
                isTodayDate && styles.dayCardToday,
                isRead && styles.dayCardRead,
                isLocked && styles.dayCardFuture,
              ]}
              onPress={() => handleToggleDay(date)}
              activeOpacity={isLocked ? 1 : 0.7}
              disabled={isSyncing || isLocked}
            >
              <Text style={[styles.dayName, isTodayDate && styles.dayNameToday]}>
                {DAYS_OF_WEEK[(date.getDay() + 6) % 7]}
              </Text>
              <Text
                style={[
                  styles.dayNumber,
                  isTodayDate && styles.dayNumberToday,
                  isRead && styles.dayNumberRead,
                ]}
              >
                {date.getDate()}
              </Text>
              <View style={styles.checkboxContainer}>
                {isSyncing ? (
                  <View style={styles.checkboxSyncing}>
                    <View style={styles.syncingDot} />
                  </View>
                ) : (
                  <View style={[styles.checkbox, isRead && styles.checkboxChecked]}>
                    {isRead && <Feather name="check" size={14} color="#FFFFFF" />}
                  </View>
                )}
              </View>
            </TouchableOpacity>
          );
        })}
      </View>

      <View style={styles.hintCard}>
        <Feather name="info" size={14} color="#6C8190" />
        <Text style={styles.hintText}>
          Tap any day to mark whether you read Quran. Build your streak!
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginTop: 14,
    marginBottom: 16,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  summaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: '#E8F7F6',
    borderWidth: 1,
    borderColor: '#D0F0EE',
  },
  summaryButtonText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#6ECBC7',
  },
  statsCard: {
    backgroundColor: '#F5F8FB',
    borderRadius: 14,
    padding: 14,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#E5ECF2',
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  statLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#6C8190',
  },
  statValue: {
    fontSize: 16,
    fontWeight: '900',
    color: '#6ECBC7',
  },
  progressBar: {
    marginTop: 10,
    height: 6,
    backgroundColor: '#E5ECF2',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#6ECBC7',
    borderRadius: 3,
  },
  weekNavigator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
    paddingHorizontal: 4,
  },
  navButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F5F8FB',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E5ECF2',
  },
  navButtonDisabled: {
    opacity: 0.4,
  },
  weekLabelContainer: {
    alignItems: 'center',
    gap: 4,
  },
  weekLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  todayButton: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: '#6ECBC7',
  },
  todayButtonText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  weekCalendar: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 14,
  },
  dayCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5ECF2',
  },
  dayCardToday: {
    backgroundColor: '#FFF7ED',
    borderColor: '#FED7AA',
  },
  dayCardRead: {
    backgroundColor: '#E8F7F6',
    borderColor: '#6ECBC7',
  },
  dayCardFuture: {
    opacity: 0.4,
  },
  dayCardLocked: {
    backgroundColor: '#F3F4F6',
    borderColor: '#E5E7EB',
    opacity: 0.7,
  },
  dayMuted: {
    color: '#C7CDD6',
  },
  dayName: {
    fontSize: 10,
    fontWeight: '700',
    color: '#9CA3AF',
    textTransform: 'uppercase',
  },
  dayNameToday: {
    color: '#F97316',
  },
  dayNumber: {
    marginTop: 4,
    fontSize: 16,
    fontWeight: '900',
    color: colors.textPrimary,
  },
  dayNumberToday: {
    color: '#F97316',
  },
  dayNumberRead: {
    color: '#6ECBC7',
  },
  checkboxContainer: {
    marginTop: 8,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#D0D5DD',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: '#6ECBC7',
    borderColor: '#6ECBC7',
  },
  checkboxSyncing: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#E5ECF2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  syncingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#6C8190',
  },
  hintCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#F5F8FB',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E5ECF2',
  },
  hintText: {
    flex: 1,
    fontSize: 11,
    lineHeight: 16,
    fontWeight: '600',
    color: '#6C8190',
  },
});

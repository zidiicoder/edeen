import React, { useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Modal,
  Pressable,
  Platform,
} from 'react-native';
import {
  SafeAreaView,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { request } from '../../../utils/api';
import { formatDate, handleBatchErrors, formatDateYYMMDD } from '../../../utils';
import { hapticTap } from '../../../utils/haptics';
import Feather from 'react-native-vector-icons/Feather';
import AsyncStorage from '@react-native-async-storage/async-storage';
import colors from '../../../theme/colors';
import CalendarModal from '../components/modal/CalendarModal';
import ConfirmationModal from '../../../components/common/ConfirmationModal';
import MainTabHeader from '../components/modal/MainTabHeader';
import { COMMON_FILTERS, toApiFilter } from '../constants/filters';
import { AuthContext } from '../../../context/AuthContext';
import { habitSchema } from '../../../validation/validate';

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

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

function sameDate(a, b) {
  return (
    a.getDate() === b.getDate() &&
    a.getMonth() === b.getMonth() &&
    a.getFullYear() === b.getFullYear()
  );
}

function ordinalLabel(index) {
  const labels = ['1st', '2nd', '3rd', '4th', '5th', '6th'];
  return labels[index] || `${index + 1}th`;
}

function isFutureDate(dateValue) {
  if (!dateValue) return false;
  const d = new Date(dateValue);
  if (Number.isNaN(d.getTime())) return false;

  d.setHours(0, 0, 0, 0);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return d.getTime() > today.getTime();
}

export default function HabitTrackerScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const { user } = useContext(AuthContext);
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [filterOpen, setFilterOpen] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [emojiOpen, setEmojiOpen] = useState(false);
  const [pendingReturnToAdd, setPendingReturnToAdd] = useState(false);
  const [headerFilter, setHeaderFilter] = useState('All');
  const [calendarPurpose, setCalendarPurpose] = useState('progress');

  const [selectedDate, setSelectedDate] = useState(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  });
  const [habitStartDate, setHabitStartDate] = useState(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  });
  const [habitCustomDate, setHabitCustomDate] = useState(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  });

  const [habitName, setHabitName] = useState('');
  const [habitIcon, setHabitIcon] = useState('\uD83C\uDFC3');
  const [habitColor, setHabitColor] = useState('#F4C9E4');
  const [frequency, setFrequency] = useState('');
  const [totalDays, setTotalDays] = useState(10);
  const [habits, setHabits] = useState([]);
  const [editingHabit, setEditingHabit] = useState(null);
  const [loading, setLoading] = useState(false);
  const [habitsLoading, setHabitsLoading] = useState(false);
  const [progressLoading, setProgressLoading] = useState(false);
  const [progressData, setProgressData] = useState([]);
  const [progressFilter, setProgressFilter] = useState('all');
  const [deleteConfirmVisible, setDeleteConfirmVisible] = useState(false);
  const [habitToDelete, setHabitToDelete] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [notice, setNotice] = useState({ visible: false, message: '' });
  const [expandedHabits, setExpandedHabits] = useState({});
  const noticeTimerRef = useRef(null);

  const calendarSelectedDate = useMemo(() => {
    if (calendarPurpose === 'habitStart') return habitStartDate;
    if (calendarPurpose === 'habitCustom') return habitCustomDate;
    return selectedDate;
  }, [calendarPurpose, habitCustomDate, habitStartDate, selectedDate]);

  const monthData = useMemo(
    () => getMonthDays(calendarSelectedDate),
    [calendarSelectedDate],
  );
  const monthLabel = useMemo(
    () => calendarSelectedDate.toLocaleString('default', { month: 'long' }),
    [calendarSelectedDate],
  );

  const showUserMessage = useCallback(message => {
    if (!message) return;
    if (noticeTimerRef.current) {
      clearTimeout(noticeTimerRef.current);
    }
    setNotice({ visible: true, message });
    noticeTimerRef.current = setTimeout(() => {
      setNotice({ visible: false, message: '' });
      noticeTimerRef.current = null;
    }, 2500);
  }, []);

  useEffect(() => {
    return () => {
      if (noticeTimerRef.current) {
        clearTimeout(noticeTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    AsyncStorage.getItem('habits').then(data => {
      if (data) {
        try {
          setHabits(JSON.parse(data));
        } catch (e) {
          setHabits([]);
        }
      }
    });
  }, []);

  const completedDays = habit => {
    const start = new Date(habit.start_date);
    start.setHours(0, 0, 0, 0);
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const diff = Math.floor((now - start) / (1000 * 60 * 60 * 24)) + 1;
    return Math.max(0, Math.min(habit.totalDays || 10, diff));
  };

  const getTargetDays = habit => {
    if (habit?.totalDays) return Number(habit.totalDays) || 10;
    if (habit?.total_days) return Number(habit.total_days) || 10;
    const frequency = habit?.frequency;
    if (!frequency) return 10;

    if (
      frequency === 'custom' &&
      habit?.start_date &&
      habit?.custom_date
    ) {
      const start = new Date(habit.start_date);
      const end = new Date(habit.custom_date);
      start.setHours(0, 0, 0, 0);
      end.setHours(0, 0, 0, 0);
      const diff = Math.floor((end - start) / (1000 * 60 * 60 * 24)) + 1;
      return Math.max(1, diff);
    }

    const frequencyDays = frequency === '40_days' ? 40 : frequency === 'day' ? 1 : 10;
    if (!habit?.start_date) return frequencyDays;

    const start = new Date(habit.start_date);
    const end = new Date(habit.start_date);
    start.setHours(0, 0, 0, 0);
    end.setHours(0, 0, 0, 0);
    end.setDate(end.getDate() + (frequencyDays - 1));

    const diff = Math.floor((end - start) / (1000 * 60 * 60 * 24)) + 1;
    return Math.max(1, diff);
  };

  const getCompletedCount = habit => {
    const days = Array.isArray(habit?.days) ? habit.days : [];
    return days.filter(day => Boolean(day?.marked)).length;
  };

  const getTotalDays = habit => {
    return getTargetDays(habit);
  };

  const getProgressPercent = habit => {
    const total = getTargetDays(habit);
    if (!total) return 0;
    const completed = Math.min(getCompletedCount(habit), total);
    return Math.round((completed / total) * 100);
  };

  const getDayByIndex = (habit, dayIndex) => {
    const days = Array.isArray(habit?.days) ? habit.days : [];
    const byDayNumber = days.find(
      day => Number(day?.day_number) === Number(dayIndex) + 1,
    );
    if (byDayNumber) return byDayNumber;
    return days[dayIndex] || null;
  };

  const getCompletionDateByDayIndex = (habit, dayIndex) => {
    const day = getDayByIndex(habit, dayIndex);
    if (day?.date) return day.date;
    if (!habit?.start_date) return null;

    const d = new Date(habit.start_date);
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() + dayIndex);
    return formatDateYYMMDD(d);
  };

  const getCurrentDayIndex = habit => {
    if (!habit?.start_date) return null;

    const start = new Date(habit.start_date);
    if (Number.isNaN(start.getTime())) return null;

    start.setHours(0, 0, 0, 0);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const diff = Math.floor((today - start) / (1000 * 60 * 60 * 24));
    if (diff < 0) return null;

    const total = getTotalBoxes(habit);
    if (!total || total <= 0) return null;

    return Math.min(diff, total - 1);
  };

  const getStatusLabel = habit => {
    switch (habit.status) {
      case 'pending':
        return 'Pending';
      case 'overdue':
        return 'Overdue';
      case 'completed':
        return 'Completed';
      case 'in_progress':
        return 'In Progress';
      default:
        return 'Pending';
    }
  };

  const toggleHabitExpanded = habitId => {
    setExpandedHabits(prev => ({
      ...prev,
      [habitId]: !prev[habitId],
    }));
  };

  const openAdd = () => {
    setCalendarOpen(false);
    setEmojiOpen(false);
    setPendingReturnToAdd(false);
    setErrors({});
    setAddOpen(true);
  };

  const openEmoji = () => {
    setCalendarOpen(false);
    setAddOpen(false); // important: avoid modal overlap issues
    setEmojiOpen(true);
  };

  const openCalendarForCustom = () => {
    setCalendarPurpose('habitCustom');
    setEmojiOpen(false);
    setAddOpen(false); // important: avoid overlap
    setPendingReturnToAdd(true);
    setTimeout(() => setCalendarOpen(true), 200);
  };

  const openCalendarForHabitStart = () => {
    setCalendarPurpose('habitStart');
    setEmojiOpen(false);
    setAddOpen(false); // important: avoid overlap
    setPendingReturnToAdd(true);
    setTimeout(() => setCalendarOpen(true), 200);
  };

  const closeCalendar = () => {
    setCalendarOpen(false);
    if (pendingReturnToAdd) {
      setPendingReturnToAdd(false);
      setTimeout(() => setAddOpen(true), 200);
    }
  };

  const onSelectDate = d => {
    const next = new Date(d);
    next.setHours(0, 0, 0, 0);
    if (calendarPurpose === 'progress') {
      setSelectedDate(next);
      setHeaderFilter('Custom');
      setProgressFilter('custom');
      return;
    }
    if (calendarPurpose === 'habitStart') {
      setHabitStartDate(next);
      return;
    }
    if (calendarPurpose === 'habitCustom') {
      setHabitCustomDate(next);
    }
  };

  const buildHabitPayload = () => {
    const basePayload = {
      name: habitName.trim(),
      icon: habitIcon,
      start_date: formatDateYYMMDD(habitStartDate),
      color: habitColor,
    };

    if (frequency === 'Daily') {
      return {
        ...basePayload,
        frequency: 'day',
      };
    }

    if (frequency === '40 Days') {
      return {
        ...basePayload,
        frequency: '40_days',
      };
    }

    if (frequency === 'Custom') {
      return {
        ...basePayload,
        frequency: 'custom',
        custom_date: formatDateYYMMDD(habitCustomDate || habitStartDate),
      };
    }

    return basePayload;
  };

  const mapFrequencyFromApi = apiFreq => {
    // if (apiFreq === 'day') return 'Daily';
    if (apiFreq === '40_days') return '40 Days';
    if (apiFreq === 'custom') return 'Custom';
    return '40 Days';
  };

  const addHabit = async () => {
    try {
      setErrors({});
      await habitSchema.validate(
        { title: habitName?.trim(), frequency },
        { abortEarly: false },
      );
      setLoading(true);
      const payload = buildHabitPayload();
      const res = await request({
        url: 'habits',
        method: 'POST',
        data: payload,
      });

      fetchHabits();
      resetForm();
      setAddOpen(false);
    } catch (err) {
      handleBatchErrors(err, setErrors);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    setHabitName('');
    setHabitIcon('\uD83C\uDFC3');
    setHabitColor('#F4C9E4');
    setFrequency('');
    setTotalDays(10);
    setHabitStartDate(new Date(today));
    setHabitCustomDate(new Date(today));
    setErrors({});
    setEditingHabit(null);
  };

  const fetchHabits = async () => {
    try {
      setHabitsLoading(true);
      const res = await request({
        url: 'habits',
        method: 'GET',
      });
      setHabits(transformData(res?.data.habits || []));
      console.log('Fetched Habits:', transformData(res?.data.habits || []));
    } catch (err) {
      console.log('Fetch Habits Error:', err);
    } finally {
      setHabitsLoading(false);
    }
  };

  // Refetch on focus so the list reflects habits added/edited on the
  // AddHabit page and updates whenever the user returns to this tab.
  useFocusEffect(
    useCallback(() => {
      fetchHabits();
    }, []),
  );

  const openEditHabit = habit => {
    setEditingHabit(habit);

    setHabitName(habit.name);
    setHabitIcon(habit.icon);
    setHabitColor(habit.color);
    const uiFrequency = mapFrequencyFromApi(habit.frequency);
    setFrequency(uiFrequency);
    setErrors({});
    if (habit.start_date) {
      const start = new Date(habit.start_date);
      start.setHours(0, 0, 0, 0);
      setHabitStartDate(start);
    }
    if (habit.frequency === 'custom' && habit.custom_date) {
      const custom = new Date(habit.custom_date);
      custom.setHours(0, 0, 0, 0);
      setHabitCustomDate(custom);
    } else if (habit.start_date) {
      const start = new Date(habit.start_date);
      start.setHours(0, 0, 0, 0);
      setHabitCustomDate(start);
    }

    setAddOpen(true);
  };

  const updateHabit = async () => {
    if (!editingHabit) return;

    try {
      setErrors({});
      await habitSchema.validate(
        { title: habitName?.trim(), frequency },
        { abortEarly: false },
      );
      setLoading(true);
      const payload = buildHabitPayload();
      const res = await request({
        url: `habits/${editingHabit.id}`,
        method: 'PUT',
        data: payload,
      });
      fetchHabits();
      resetForm();
      setAddOpen(false);
    } catch (err) {
      handleBatchErrors(err, setErrors);
    } finally {
      setLoading(false);
    }
  };

  const openDeleteConfirm = habit => {
    setHabitToDelete(habit);
    setDeleteConfirmVisible(true);
  };

  const closeDeleteConfirm = (force = false) => {
    if (deleteLoading && !force) return;
    setDeleteConfirmVisible(false);
    setHabitToDelete(null);
  };

  const deleteHabitById = async habitId => {
    if (!habitId) return;
    try {
      setDeleteLoading(true);
      await request({
        url: `habits/${habitId}`,
        method: 'DELETE',
      });
      closeDeleteConfirm(true);
      fetchHabits();
      getHabbitProgress(progressFilter, selectedDate);
    } catch (err) {
      console.log('Delete Habit Error:', err);
    } finally {
      setDeleteLoading(false);
    }
  };

  const deleteHabit = async () => {
    if (!habitToDelete?.id) return;
    await deleteHabitById(habitToDelete.id);
  };

  const getFrequencyLabel = habit => {
    // if (habit.frequency === 'day') return 'Daily';
    if (habit.frequency === '40_days') return '40 Days';
    if (habit.frequency === 'custom') return 'Custom';
    return habit.frequency;
  };

  const getHabbitProgress = useCallback(async (filter = 'all', date = selectedDate) => {
    try {
      setProgressLoading(true);
      const formattedDate = date ? formatDate(date) : null;
      let url = `habits/progress?filter=${filter}`;
      if (formattedDate) {
        url += `&date=${formattedDate}`;
      }
      const res = await request({
        url,
        method: 'GET',
      });
      setProgressData(res?.data?.summary || []);
    } catch (error) {
      console.log('Progress Error:', error);
    } finally {
      setProgressLoading(false);
    }
  }, [selectedDate]);

  useEffect(() => {
    getHabbitProgress(progressFilter, selectedDate);
  }, [progressFilter, selectedDate, getHabbitProgress]);

  const [dayUpdatingMap, setDayUpdatingMap] = useState({});

  // returns total boxes to show (from backend)
  const getTotalBoxes = habit => {
    return getTargetDays(habit);
  };

  const isDayChecked = (habit, dayIndex) => {
    return Boolean(getDayByIndex(habit, dayIndex)?.marked);
  };

  const updateHabitDayInState = (habitId, dayIndex, checked) => {
    setHabits(prevHabits =>
      prevHabits.map(habit => {
        if (habit.id !== habitId) return habit;

        const days = Array.isArray(habit.days) ? [...habit.days] : [];
        const byNumberIndex = days.findIndex(
          day => Number(day?.day_number) === Number(dayIndex) + 1,
        );
        const targetIndex = byNumberIndex >= 0 ? byNumberIndex : dayIndex;
        const existingDay = days[targetIndex] || {};
        const completionDate =
          existingDay?.date || getCompletionDateByDayIndex(habit, dayIndex);

        days[targetIndex] = {
          ...existingDay,
          day_number: existingDay?.day_number ?? dayIndex + 1,
          date: completionDate,
          marked: checked,
          completed: checked,
        };

        return { ...habit, days };
      }),
    );
  };

  const updateHabitDayApi = async (habitId, completionDate, checked) => {
    if (!habitId || !completionDate) {
      throw new Error('Missing habitId or completion_date');
    }

    if (checked) {
      await request({
        url: `habits/${habitId}/mark-completion`,
        method: 'POST',
        data: { completion_date: completionDate },
      });
      return;
    }

    await request({
      url: `habits/${habitId}/unmark-completion?completion_date=${encodeURIComponent(completionDate)}`,
      method: 'DELETE',
    });
  };

  const onToggleDay = async (habit, dayIndex) => {
    const habitId = habit?.id;
    if (!habitId) return;
    hapticTap();

    const completionDate = getCompletionDateByDayIndex(habit, dayIndex);
    if (!completionDate) return;
    if (isFutureDate(completionDate)) {
      showUserMessage('You cannot mark future dates');
      return;
    }

    const updatingKey = `${habitId}-${dayIndex}`;
    if (dayUpdatingMap[updatingKey]) return;

    const prevChecked = isDayChecked(habit, dayIndex);
    const nextChecked = !prevChecked;

    updateHabitDayInState(habitId, dayIndex, nextChecked);
    setDayUpdatingMap(prev => ({ ...prev, [updatingKey]: true }));

    try {
      await updateHabitDayApi(habitId, completionDate, nextChecked);
    } catch (e) {
      updateHabitDayInState(habitId, dayIndex, prevChecked);
      const errorMessage =
        e?.response?.data?.message ||
        e?.response?.data?.error ||
        'Unable to update this day.';
      showUserMessage(errorMessage);
    } finally {
      setDayUpdatingMap(prev => {
        const next = { ...prev };
        delete next[updatingKey];
        return next;
      });
    }
  };

  const transformData = (habitsRes) => {
  return habitsRes.map(item => {
    const {
      habit,
      days_data = [],
      marked_complete_days = 0,
      progress_percentage = 0,
      total_days = 0,
    } = item;

    return {
      id: habit.id,
      name: habit.name,
      description: habit.description,
      frequency: habit.frequency,
      start_date: habit.start_date,
      custom_date: habit.custom_date,
      status: habit.status,
      color: habit.color,
      icon: habit.icon,
      days_of_week: habit.days_of_week || [],

      // progress info
      total_days,
      marked_complete_days,
      progress_percentage,

      // flatten days into simple array
      days: days_data.flatMap(chunk =>
        chunk.days.map(day => ({
          ...day,
          chunk_index: chunk.chunk_index,
        }))
      ),

      // keep original chunked structure if needed
      days_data,
    };
  });
};
  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <MainTabHeader
        title={user?.name || 'User'}
        bg="#D8EEE9"
        filterLabel={headerFilter}
        onPressFilter={() => {
          setPendingReturnToAdd(false);
          setAddOpen(false);
          setEmojiOpen(false);
          setFilterOpen(true);
        }}
      />
      <View style={styles.container}>
        {notice.visible ? (
          <View pointerEvents="none" style={styles.noticeWrap}>
            <View style={styles.noticeCard}>
              <Feather name="alert-circle" size={16} color="#FFFFFF" />
              <Text style={styles.noticeText}>{notice.message}</Text>
            </View>
          </View>
        ) : null}
        <Modal visible={filterOpen} transparent animationType="fade">
          <Pressable
            style={styles.filterOverlay}
            onPress={() => setFilterOpen(false)}
          >
            <Pressable style={styles.dropdownCard} onPress={() => {}}>
              {COMMON_FILTERS.map(item => {
                const active = item === headerFilter;
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
                        setCalendarPurpose('progress');
                        setTimeout(() => setCalendarOpen(true), 120);
                        return;
                      }
                      setHeaderFilter(item);
                      setProgressFilter(toApiFilter(item));
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
        <ScrollView
          contentContainerStyle={[
            styles.content,
            { paddingBottom: 140 + insets.bottom },
          ]}
          showsVerticalScrollIndicator={false}
        >
          {/* {progressLoading ? (
            <View style={styles.scoreCard}>
              <View style={styles.scoreLegend}>
                <View style={styles.legendSkeletonLine} />
                <View style={styles.legendSkeletonLine} />
                <View style={styles.legendSkeletonLine} />
              </View>
              <View style={styles.scoreCircleSkeleton} />
            </View>
          ) : (
            <View style={styles.scoreCard}>
              <View style={styles.scoreLegend}>
                <View style={styles.legendRow}>
                  <View
                    style={[styles.legendDot, { backgroundColor: '#8ED1FF' }]}
                  />
                  <Text style={styles.legendText}>
                    {progressData.completed} - Completed
                  </Text>
                </View>
                <View style={styles.legendRow}>
                  <View
                    style={[styles.legendDot, { backgroundColor: '#F6C1DD' }]}
                  />
                  <Text style={styles.legendText}>
                    {progressData.pending} - Remaining
                  </Text>
                </View>
                <View style={styles.legendRow}>
                  <View
                    style={[styles.legendDot, { backgroundColor: '#E0B66C' }]}
                  />
                  <Text style={styles.legendText}>
                    {progressData.overdue} - Overdue
                  </Text>
                </View>
              </View>

              <View style={styles.scoreCircle}>
                <Text style={styles.scoreLabel}>Habit Score</Text>
                <Text style={styles.scoreValue}>{progressData.score || 0}%</Text>
              </View>
            </View>
          )} */}
          {habitsLoading ? (
            Array.from({ length: 3 }).map((_, index) => (
              <View key={`habit-skeleton-${index}`} style={styles.habitCardSkeleton}>
                <View style={styles.habitSkeletonTopRow}>
                  <View style={styles.habitSkeletonIcon} />
                  <View style={styles.habitSkeletonBar} />
                </View>
                <View style={styles.habitSkeletonLineWide} />
                <View style={styles.habitSkeletonLineMedium} />
              </View>
            ))
          ) : habits.length === 0 ? (
            <View style={styles.emptyStateContainer}>
              <Text style={styles.emptyStateEmoji}>🎯</Text>
              <Text style={styles.emptyStateTitle}>Start Building Your Habits Today</Text>
              <Text style={styles.emptyStateDescription}>
                Create your first habit and begin your journey to a better you
              </Text>
            </View>
          ) : (
            habits.map(habit => {
              const isExpanded = Boolean(expandedHabits[habit.id]);
              const currentDayIndex = getCurrentDayIndex(habit);
              const isCurrentDayAvailable = currentDayIndex != null;
              const isCurrentDayChecked = isCurrentDayAvailable
                ? isDayChecked(habit, currentDayIndex)
                : false;
              const isCurrentDayUpdating = isCurrentDayAvailable
                ? Boolean(dayUpdatingMap[`${habit.id}-${currentDayIndex}`])
                : false;

              return (
              <View
                key={habit.id}
                style={[
                  styles.habitCard,
                  { 
                    backgroundColor: habit.color ? 
                      `${habit.color}80` : // 50% opacity for better visibility
                      '#E8CDBA' 
                  },
                ]}
              >
                <View style={styles.habitHeader}>
                  <View style={styles.habitHeaderLeft}>
                    <View style={styles.habitIconWrap}>
                      <Text style={styles.habitIconText}>
                        {habit.icon || '🏃'}
                      </Text>
                    </View>

                    <View style={styles.progressRow}>
                      <View style={styles.progressTrack}>
                        <View
                          style={[
                            styles.progressFill,
                            { 
                              width: `${getProgressPercent(habit)}%`,
                              backgroundColor: habit.color || colors.lightGreen
                            },
                          ]}
                        />
                      </View>
                      <View style={styles.daysCompletedCard}>
                        <Text style={styles.daysCompletedNumber}>
                          {getCompletedCount(habit)}/{getTotalDays(habit)} Days
                        </Text>
                        <Text style={styles.daysCompletedLabel}>
                          Days completed
                        </Text>
                      </View>
                    </View>
                  </View>

                  {/* No quick-check here on purpose: each day is marked with a
                      single checkbox in the day grid below (expand the row),
                      so the current day never has two checkboxes. */}
                </View>
                <View style={styles.hr} />
                <TouchableOpacity
                  style={styles.accordionToggle}
                  onPress={() => toggleHabitExpanded(habit.id)}
                  activeOpacity={0.85}
                >
                  <View style={styles.daysRow}>
                    <Text style={styles.daysTextLeft}>{habit.name}</Text>
                    <View style={styles.daysRightWrap}>
                      <Feather
                        name={isExpanded ? 'chevron-up' : 'chevron-down'}
                        size={18}
                        color="#111111"
                      />
                    </View>
                  </View>
                </TouchableOpacity>

                {isExpanded ? (
                <>
                {/* Calendar View */}
                <View style={styles.habitCalendarWrap}>
                  {/* Month Navigation */}
                  <View style={styles.calendarHeader}>
                    <TouchableOpacity onPress={() => {
                      const prev = new Date(selectedDate);
                      prev.setMonth(prev.getMonth() - 1);
                      setSelectedDate(prev);
                    }}>
                      <Feather name="chevron-left" size={20} color="#111111" />
                    </TouchableOpacity>
                    <View style={styles.calendarMonthRow}>
                      <Text style={styles.calendarMonth}>
                        {selectedDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
                      </Text>
                      <Feather name="calendar" size={16} color="#111111" />
                    </View>
                    <TouchableOpacity onPress={() => {
                      const next = new Date(selectedDate);
                      next.setMonth(next.getMonth() + 1);
                      setSelectedDate(next);
                    }}>
                      <Feather name="chevron-right" size={20} color="#111111" />
                    </TouchableOpacity>
                  </View>

                  {/* Day Labels */}
                  <View style={styles.calendarDayLabels}>
                    {DAYS.map(day => (
                      <Text key={day} style={styles.calendarDayLabel}>{day}</Text>
                    ))}
                  </View>

                  {/* Calendar Grid */}
                  <View style={styles.calendarGrid}>
                    {(() => {
                      const monthData = getMonthDays(selectedDate);
                      const today = new Date();
                      today.setHours(0, 0, 0, 0);
                      
                      // Empty cells before first day
                      const emptyCells = Array.from({ length: monthData.firstWeekday }).map((_, i) => (
                        <View key={`empty-${i}`} style={styles.calendarDayCell} />
                      ));

                      // Actual day cells
                      const dayCells = monthData.days.map((dayDate) => {
                        const dayIndex = Math.floor(
                          (dayDate.getTime() - new Date(habit.start_date).setHours(0, 0, 0, 0)) / (1000 * 60 * 60 * 24)
                        );
                        
                        const isInRange = dayIndex >= 0 && dayIndex < getTotalBoxes(habit);
                        const checked = isInRange && isDayChecked(habit, dayIndex);
                        const isToday = sameDate(dayDate, today);
                        const isFuture = dayDate > today;
                        const isUpdatingDay = isInRange && Boolean(
                          dayUpdatingMap[`${habit.id}-${dayIndex}`]
                        );

                        return (
                          <TouchableOpacity
                            key={dayDate.getDate()}
                            style={[
                              styles.calendarDayCell,
                            ]}
                            onPress={() => {
                              if (isFuture) {
                                showUserMessage('You cannot mark future dates');
                                return;
                              }
                              if (isInRange && !isUpdatingDay) {
                                onToggleDay(habit, dayIndex);
                              }
                            }}
                            disabled={!isInRange && !isFuture}
                            activeOpacity={0.85}
                          >
                            <View
                              style={[
                                styles.calendarDayCircle,
                                isToday && !checked && [
                                  styles.calendarDayCircleToday,
                                  { 
                                    backgroundColor: habit.color ? 
                                      `${habit.color}80` : 
                                      '#E8CDBA',
                                  }
                                ],
                                checked && [
                                  styles.calendarDayCircleChecked,
                                  { 
                                    backgroundColor: habit.color || '#F48FB1',
                                  }
                                ],
                                // Keep today's border even when checked
                                isToday && checked && [
                                  styles.calendarDayCircleToday,
                                ],
                                !isInRange && styles.calendarDayCircleDisabled,
                                isUpdatingDay && { opacity: 0.55 },
                              ]}
                            >
                              {checked ? (
                                <Feather name="check" size={16} color="#FFFFFF" />
                              ) : (
                                <Text
                                  style={[
                                    styles.calendarDayText,
                                    !isInRange && styles.calendarDayTextDisabled,
                                  ]}
                                >
                                  {dayDate.getDate()}
                                </Text>
                              )}
                            </View>
                          </TouchableOpacity>
                        );
                      });

                      return [...emptyCells, ...dayCells];
                    })()}
                  </View>

                  {/* Legend */}
                  <View style={styles.calendarLegend}>
                    <View style={styles.legendItem}>
                      <View style={[
                        styles.legendDot, 
                        styles.legendDotCompleted,
                        {
                          backgroundColor: habit.color ? 
                            `${habit.color}CC` : // Slightly darker for contrast
                            '#F48FB1'
                        }
                      ]}>
                        <Feather name="check" size={10} color="#FFFFFF" />
                      </View>
                      <Text style={styles.legendLabel}>Completed</Text>
                    </View>
                    <View style={styles.legendItem}>
                      <View style={[
                        styles.legendDot, 
                        styles.legendDotToday,
                        {
                          backgroundColor: habit.color ? 
                            `${habit.color}80` : 
                            'rgba(255, 255, 255, 0.8)'
                        }
                      ]} />
                      <Text style={[styles.legendLabel, styles.legendLabelToday]}>Today</Text>
                    </View>
                    <View style={styles.legendItem}>
                      <View style={[styles.legendDot, styles.legendDotNotDone]} />
                      <Text style={styles.legendLabel}>Not done</Text>
                    </View>
                  </View>
                </View>

                <View style={styles.habitFooterRow}>
                  <View style={{ flex: 1 }} />

                  <TouchableOpacity
                    style={styles.editBtn}
                    onPress={() => {
                      hapticTap();
                      navigation.navigate('AddHabit', { habit });
                    }}
                    activeOpacity={0.85}
                  >
                    <Feather name="edit-2" size={16} color="#2F2F2F" />
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.deleteBtn}
                    onPress={() => openDeleteConfirm(habit)}
                    activeOpacity={0.85}
                  >
                    <Feather name="trash-2" size={18} color="#2F2F2F" />
                  </TouchableOpacity>
                </View>
                </>
                ) : null}
              </View>
              );
            })
          )}
        </ScrollView>
        <TouchableOpacity
          style={[styles.fab, { bottom: 86 + insets.bottom }]}
          onPress={() => {
            hapticTap();
            navigation.navigate('AddHabit');
          }}
          activeOpacity={0.9}
        >
          <Text style={styles.fabText}>+</Text>
        </TouchableOpacity>

        <CalendarModal
          visible={calendarOpen}
          monthLabel={monthLabel}
          monthData={monthData}
          selectedDate={calendarSelectedDate}
          onSelectDate={onSelectDate}
          onClose={closeCalendar}
        />
        <ConfirmationModal
          visible={deleteConfirmVisible}
          title="Delete Habit?"
          message={
            habitToDelete?.name
              ? `This will remove "${habitToDelete.name}" from your tracker.`
              : 'This will remove this habit from your tracker.'
          }
          confirmText="Delete"
          cancelText="Keep It"
          confirmVariant="danger"
          iconName="trash-2"
          loading={deleteLoading}
          onCancel={closeDeleteConfirm}
          onConfirm={deleteHabit}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#FFFFFF' },
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  noticeWrap: {
    position: 'absolute',
    top: 14,
    left: 14,
    right: 14,
    zIndex: 50,
    alignItems: 'center',
  },
  noticeCard: {
    maxWidth: '100%',
    minHeight: 42,
    borderRadius: 12,
    backgroundColor: '#1F2937',
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    ...Platform.select({ android: { elevation: 6 } }),
  },
  noticeText: {
    flexShrink: 1,
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },

  content: { padding: 16, paddingBottom: 140 },

  scoreCard: {
    backgroundColor: '#EAF3FB',
    borderRadius: 16,
    padding: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  scoreLegend: { gap: 8 },
  legendRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  legendText: { fontSize: 11, color: '#5C5C5C' },
  legendSkeletonLine: {
    height: 10,
    width: 120,
    borderRadius: 6,
    backgroundColor: '#D5E5F2',
  },

  scoreCircle: {
    width: 90,
    height: 90,
    borderRadius: 45,
    borderWidth: 8,
    borderColor: '#D6E8F7',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
  scoreLabel: { fontSize: 10, color: '#7A7A7A' },
  scoreValue: { fontSize: 22, fontWeight: '800', color: colors.textPrimary },
  scoreCircleSkeleton: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: '#D5E5F2',
  },
  habitCardSkeleton: {
    marginTop: 14,
    borderRadius: 22,
    padding: 14,
    backgroundColor: '#F0F0F0',
  },
  habitSkeletonTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  habitSkeletonIcon: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: '#E0E0E0',
  },
  habitSkeletonBar: {
    flex: 1,
    height: 16,
    borderRadius: 999,
    backgroundColor: '#E0E0E0',
  },
  habitSkeletonLineWide: {
    marginTop: 14,
    height: 12,
    width: '80%',
    borderRadius: 8,
    backgroundColor: '#E0E0E0',
  },
  habitSkeletonLineMedium: {
    marginTop: 10,
    height: 10,
    width: '55%',
    borderRadius: 8,
    backgroundColor: '#E0E0E0',
  },
  habitCard: {
    marginTop: 14,
    borderRadius: 22,
    padding: 14,
  },

  habitHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },

  habitHeaderLeft: {
    flex: 1,
    minWidth: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },

  habitIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.75)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  habitIconText: { fontSize: 30 },

  habitTitleWrap: { flex: 1 },

  habitName: {
    fontSize: 17,
    fontWeight: '800',
    color: '#111111',
  },

  metaRow: {
    marginTop: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
    flex: 1,
  },

  metaPill: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.8)',
  },

  metaPillText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#111111',
  },

  metaPillSoft: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.8)',
  },

  metaPillTextSoft: {
    fontSize: 11,
    fontWeight: '700',
    color: '#111111',
  },

  progressRow: {
    flex: 1,
    minWidth: 0,
    maxWidth: 300,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },

  progressDaysText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#111111',
    marginLeft: 8,
  },

  daysCompletedCard: {
    backgroundColor: 'rgba(248, 248, 248, 0.7)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 12,
    minWidth: 100,
  },

  daysCompletedNumber: {
    fontSize: 14,
    fontWeight: '900',
    color: '#111111',
    marginBottom: 4,
  },

  daysCompletedLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: '#666666',
  },

  progressPill: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.75)',
    flexShrink: 0,
  },

  progressPillText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#111111',
  },

daysRow: {
  marginTop: 8,
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'space-between',
},
accordionToggle: {
  marginTop: 2,
},
daysRightWrap: {
  flexDirection: 'row',
  alignItems: 'center',
  gap: 8,
  marginLeft: 12,
},
daysTextLeft: {
  flex: 1,
  fontSize: 14,
  color: '#111111',
  fontWeight: '900',
},
daysTextRight: {
  fontSize: 13,
  color: 'rgba(17,17,17,0.85)',
  fontWeight: '900',
},
  rowTag: {
    minWidth: 44,
    height: 30,
    borderRadius: 10,
    backgroundColor: 'rgba(17,17,17,0.16)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },

  rowTagText: { fontSize: 12, fontWeight: '800', color: '#111111' },
  dayDot: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: 'rgba(255,255,255,0.55)',
    borderWidth: 1,
    borderColor: 'rgba(17,17,17,0.16)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  dayDotInner: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(17,17,17,0.12)',
  },

  dayDotChecked: {
    backgroundColor: 'rgba(255,255,255,0.85)',
    borderColor: 'rgba(11,122,42,0.35)',
    borderWidth: 1.5,
  },
  habitTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  habitIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  habitIconText: { fontSize: 30 },
  habitTopCenter: {
    flex: 1,
    minWidth: 0,
    marginLeft: 12,
    marginRight: 8,
  },
  progressTrack: {
    flex: 1,
    height: 12,
    borderRadius: 999,
    overflow: 'hidden',
    backgroundColor: 'rgba(255,255,255,0.6)',
    borderWidth: 1,
    borderColor: 'rgba(17,17,17,0.08)',
  },
  progressFill: {
    height: '100%',
    borderRadius: 999,
    backgroundColor: colors.lightGreen, // Will be overridden dynamically
  },
  progressPercentPill: {
    backgroundColor: '#BDA795',
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 5,
    marginRight: 4,
    flexShrink: 0,
  },
  progressPercentText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  editBtn: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.88)',
    borderWidth: 1,
    borderColor: 'rgba(17,17,17,0.14)',
    shadowColor: '#000',
    shadowOpacity: 0.14,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  deleteBtn: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.88)',
    borderWidth: 1,
    borderColor: 'rgba(17,17,17,0.14)',
    shadowColor: '#000',
    shadowOpacity: 0.14,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  currentDayCheckBtn: {
    width: 26,
    height: 26,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.92)',
    borderWidth: 1.5,
    borderColor: 'rgba(17,17,17,0.16)',
    shadowColor: '#000',
    shadowOpacity: 0.14,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  currentDayCheckBtnActive: {
    borderColor: 'rgba(11,122,42,0.35)',
    backgroundColor: 'rgba(255,255,255,0.98)',
  },
  currentDayCheckBtnDisabled: {
    opacity: 0.5,
  },
  currentDayCheckInner: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(17,17,17,0.16)',
  },
  habitDivider: {
    marginTop: 14,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.6)',
    marginBottom: 10,
  },
  habitNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  habitName: {
    flex: 1,
    fontSize: 17,
    fontWeight: '700',
    color: '#111111',
  },
  habitDaysText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111111',
  },
  habitGridWrap: { marginTop: 12, gap: 8 },
  
  // Calendar View Styles
  habitCalendarWrap: {
    marginTop: 16,
    gap: 12,
  },
  calendarHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
  },
  calendarMonthRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  calendarMonth: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111111',
  },
  calendarDayLabels: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 4,
  },
  calendarDayLabel: {
    width: '14.285%',
    textAlign: 'center',
    fontSize: 11,
    fontWeight: '700',
    color: 'rgba(17, 17, 17, 0.8)',
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  calendarDayCell: {
    width: '14.285%',
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 2,
  },
  calendarDayCellToday: {
    // Today styling removed from cell, applied to circle instead
  },
  calendarDayCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.6)',
    borderWidth: 1.5,
    borderColor: 'rgba(17, 17, 17, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  calendarDayCircleChecked: {
    backgroundColor: '#F48FB1',
    borderColor: 'transparent',
    borderWidth: 0,
  },
  calendarDayCircleToday: {
    borderWidth: 2.5,
    borderColor: 'rgba(17, 17, 17, 0.6)', // Dark border only
  },
  calendarDayCircleDisabled: {
    backgroundColor: 'transparent',
    borderColor: 'transparent',
  },
  calendarDayText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111111',
  },
  calendarDayTextDisabled: {
    color: 'rgba(17, 17, 17, 0.3)',
  },
  calendarLegend: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.5)',
    marginTop: 8,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  legendDotCompleted: {
    backgroundColor: '#F48FB1',
    borderColor: '#999999', // Thin gray border
    borderWidth: 1,
  },
  legendDotToday: {
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderWidth: 2,
    borderColor: '#000000',
  },
  legendDotNotDone: {
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
  },
  legendLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: 'rgba(17, 17, 17, 0.8)',
  },
  legendLabelToday: {
    fontWeight: '700',
  },
  
  habitFooterRow: {
    marginTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  gridRow: { flexDirection: 'row', alignItems: 'center' },
  rowTagText: { fontSize: 13, fontWeight: '700', color: '#FFFFFF' },
  rowBoxes: {
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'nowrap',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  checkCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#E8BEDB',
    borderWidth: 2,
    borderColor: '#B98DB2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkCircleActive: {
    backgroundColor: '#D9B6D5',
  },
  habitStatusText: {
    marginTop: 10,
    textAlign: 'right',
    fontSize: 14,
    fontWeight: '700',
    color: '#111111',
  },

  dotGrid: { marginTop: 12, flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  dot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dotActive: { backgroundColor: '#F4C9E4' },
  dotInactive: { backgroundColor: '#E8E8E8' },

  fab: {
    position: 'absolute',
    right: 16,
    bottom: 86,
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#F4C9E4',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    ...Platform.select({ android: { elevation: 6 } }),
  },
  fabText: { fontSize: 26, color: '#FFFFFF', marginBottom: 2 },

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.15)',
    justifyContent: 'center',
    padding: 16,
  },
  filterOverlay: {
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

  calendarCard: { backgroundColor: '#EAF3FB', borderRadius: 18, padding: 16 },
  calendarTitle: { fontSize: 16, fontWeight: '700', color: colors.textPrimary },
  calendarMonth: { marginTop: 6, fontSize: 12, color: '#7A7A7A' },
  calendarHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
  },
  calendarDay: {
    width: 32,
    textAlign: 'center',
    fontSize: 11,
    color: '#7A7A7A',
  },

  calendarGrid: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 8 },
  calendarCell: { width: '14.285%', alignItems: 'center', paddingVertical: 6 },
  calendarCellActive: { backgroundColor: '#F4C9E4', borderRadius: 10 },
  calendarCellText: { fontSize: 12, color: colors.textPrimary },
  calendarCellTextActive: { fontWeight: '700' },

  calendarActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
    marginTop: 10,
  },

  addCard: { backgroundColor: '#F4C9E4', borderRadius: 18, padding: 16 },
  addTitle: {
    fontSize: 28,
    fontWeight: '500',
    color: colors.textPrimary,
    textAlign: 'center',
    alignSelf: 'center',
    width: '100%',
  },
  addLabel: { marginTop: 10, fontSize: 12, color: colors.textPrimary },

  addInput: {
    marginTop: 6,
    height: 36,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    justifyContent: 'center',
    paddingHorizontal: 10,
  },
  inputHint: { fontSize: 11, color: '#7A7A7A' },

  addInputText: {
    marginTop: 6,
    height: 36,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    paddingHorizontal: 10,
    color: colors.textPrimary,
    borderWidth: 1,
    borderColor: '#E3E3E3',
  },
  inputErrorBorder: {
    borderColor: '#FF4D4F',
  },
  errorText: {
    marginTop: 4,
    fontSize: 11,
    color: '#FF4D4F',
  },

  iconBox: {
    marginTop: 8,
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#DFDFDF',
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  iconRow: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  iconChip: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconChipText: { fontSize: 18 },
  iconChipAdd: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },

  freqBox: {
    marginTop: 8,
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#DFDFDF',
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  freqRow: { flexDirection: 'row', gap: 8 },
  freqChip: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  freqChipActive: { backgroundColor: '#F4C9E4' },
  freqText: { fontSize: 11, color: colors.textPrimary },
  freqTextActive: { fontWeight: '700' },

  colorBox: {
    marginTop: 10,
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#DFDFDF',
    padding: 10,
  },
  colorRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  colorDot: { width: 18, height: 18, borderRadius: 9 },
  colorDotActive: { borderWidth: 2, borderColor: '#333333' },

  addActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
    marginTop: 14,
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
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: '#faedcb',
  },
  btnPrimaryText: { fontSize: 12, color: colors.textPrimary, fontWeight: '500' },
  hr: {
  height: 1,
  backgroundColor: 'rgba(255,255,255,0.55)',
  marginTop: 12,
  marginBottom: 10,
},
  // Empty State Styles
  emptyStateContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
    paddingHorizontal: 32,
  },
  emptyStateEmoji: {
    fontSize: 72,
    marginBottom: 20,
  },
  emptyStateTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#111111',
    textAlign: 'center',
    marginBottom: 12,
  },
  emptyStateDescription: {
    fontSize: 15,
    fontWeight: '400',
    color: '#666666',
    textAlign: 'center',
    lineHeight: 22,
  },
});


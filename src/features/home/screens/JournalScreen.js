import React, { useCallback, useContext, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Platform,
  KeyboardAvoidingView,
  Modal,
  Pressable,
} from 'react-native';
import {
  SafeAreaView,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import Feather from 'react-native-vector-icons/Feather';
import colors from '../../../theme/colors';

import { request } from '../../../utils/api';
import { journalSchema } from '../../../validation/validate';
import { handleBatchErrors } from '../../../utils';
import MainTabHeader from '../components/modal/MainTabHeader';
import CalendarModal from '../components/modal/CalendarModal';
import ConfirmationModal from '../../../components/common/ConfirmationModal';
import { COMMON_FILTERS, toApiDate, toApiFilter } from '../constants/filters';
import { AuthContext } from '../../../context/AuthContext';

const MAX_GRATITUDE_ITEMS = 3;
const SUMMARY_PREVIEW_LIMIT = 90;

const MOOD_OPTIONS = [
  { emoji: '🙁', label: 'Meh', bgColor: '#FDE9E2', iconBg: '#F6C9BD' },
  { emoji: '😕', label: 'Chill', bgColor: '#ECE4FF', iconBg: '#D3C4FB' },
  { emoji: '😐', label: 'Satisfied', bgColor: '#DFEAFF', iconBg: '#BFD4FF' },
  { emoji: '🙂', label: 'Optimistic', bgColor: '#FFF3CE', iconBg: '#F8E28A' },
  { emoji: '😄', label: 'Grateful', bgColor: '#DFF4E4', iconBg: '#BDEBC9' },
];
const DEFAULT_MOOD = MOOD_OPTIONS[3];

const FEELING_TAG_OPTIONS = [
  'Calm',
  'Chill',
  'Motivated',
  'Optimistic',
  'Curious',
  'Satisfied',
  'Comfortable',
  'Inspired',
  'Appreciated',
];

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

function formatEntryDate(dateValue) {
  if (!dateValue) return '';
  const parsed = new Date(dateValue);
  if (Number.isNaN(parsed.getTime())) return '';
  return parsed.toLocaleDateString('default', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

function normalizeTag(value) {
  return String(value || '').trim();
}

function normalizeList(value) {
  if (Array.isArray(value)) {
    return value.map(normalizeTag).filter(Boolean);
  }

  const normalizedValue = normalizeTag(value);
  if (!normalizedValue) return [];

  return normalizedValue
    .split(',')
    .map(normalizeTag)
    .filter(Boolean);
}

function getMoodOptionByEmoji(emoji) {
  return MOOD_OPTIONS.find(item => item.emoji === emoji) || DEFAULT_MOOD;
}

function getSummaryPreview(summary) {
  const normalized = normalizeTag(summary).replace(/\s+/g, ' ');
  if (normalized.length <= SUMMARY_PREVIEW_LIMIT) return normalized;
  return `${normalized.slice(0, SUMMARY_PREVIEW_LIMIT).trim()}...`;
}

function hydrateEntry(item) {
  const normalizedDescription = normalizeTag(item?.description || item?.body);
  const normalizedTags = normalizeList(item?.tag);
  const normalizedPromt = normalizeList(item?.promt ?? item?.prompt).slice(
    0,
    MAX_GRATITUDE_ITEMS,
  );
  const resolvedMood = getMoodOptionByEmoji(item?.emoji || item?.mood);

  return {
    ...item,
    description: normalizedDescription,
    body: normalizedDescription,
    summary: normalizedDescription,
    tag: normalizedTags,
    promt: normalizedPromt,
    feelingTags: normalizedTags,
    gratitudeItems: normalizedPromt,
    mood: resolvedMood.emoji,
    moodLabel: resolvedMood.label,
  };
}

export default function JournalScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { user } = useContext(AuthContext);

  const [entries, setEntries] = useState([]);
  const [filter, setFilter] = useState('All');
  const [filterOpen, setFilterOpen] = useState(false);
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [fetchingEntries, setFetchingEntries] = useState(false);
  const [mode, setMode] = useState('empty');
  const [activeEntry, setActiveEntry] = useState(null);
  const [errors, setErrors] = useState({});
  const [title, setTitle] = useState('');
  const [summaryText, setSummaryText] = useState('');
  const [mood, setMood] = useState(DEFAULT_MOOD.emoji);
  const [feelingTags, setFeelingTags] = useState([]);
  const [gratitudeItems, setGratitudeItems] = useState([]);
  const [gratitudeInput, setGratitudeInput] = useState('');
  const [deleteConfirmVisible, setDeleteConfirmVisible] = useState(false);
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
  const activeEntryId = activeEntry?.id;

  const activeMood = useMemo(() => getMoodOptionByEmoji(mood), [mood]);

  const fetchJournals = useCallback(
    async (selectedFilter = filter, date = selectedDate) => {
      try {
        setFetchingEntries(true);
        setLoading(true);
        const apiFilter = toApiFilter(selectedFilter);
        let url = `journals?filter=${apiFilter}`;
        if (apiFilter === 'custom') {
          const apiDate = toApiDate(date);
          if (apiDate) {
            url += `&date=${apiDate}&custom_date=${apiDate}`;
          }
        }
        const res = await request({
          url,
          method: 'GET',
        });

        const rawList = (res && res.data && res.data.journals) || [];
        const list = rawList.map(hydrateEntry);

        setEntries(list);
        setMode(list.length ? 'list' : 'empty');

        if (activeEntryId) {
          const refreshedActive = list.find(item => item.id === activeEntryId);
          if (refreshedActive) {
            setActiveEntry(refreshedActive);
          }
        }
      } catch (err) {
        console.log('Fetch Journals Error:', err);
      } finally {
        setFetchingEntries(false);
        setLoading(false);
      }
    },
    [activeEntryId, filter, selectedDate],
  );

  useEffect(() => {
    fetchJournals(filter, selectedDate);
  }, [filter, selectedDate, fetchJournals]);

  const clearEditorState = useCallback(() => {
    setTitle('');
    setSummaryText('');
    setMood(DEFAULT_MOOD.emoji);
    setFeelingTags([]);
    setGratitudeItems([]);
    setGratitudeInput('');
  }, []);

  const openEditor = entry => {
    setErrors({});

    if (entry) {
      const hydrated = hydrateEntry(entry);
      setActiveEntry(hydrated);
      setTitle(hydrated.title || '');
      setSummaryText(hydrated.description || '');
      setMood(hydrated.mood || DEFAULT_MOOD.emoji);
      setFeelingTags(hydrated.tag || []);
      setGratitudeItems((hydrated.promt || []).slice(0, MAX_GRATITUDE_ITEMS));
      setGratitudeInput('');
    } else {
      setActiveEntry(null);
      clearEditorState();
    }

    setMode('edit');
  };

  const closeEditor = () => {
    setErrors({});
    setMode(entries.length ? 'list' : 'empty');
  };

  const toggleFeelingTag = selectedTag => {
    setFeelingTags(prev => {
      if (prev.includes(selectedTag)) {
        return prev.filter(item => item !== selectedTag);
      }
      return [...prev, selectedTag];
    });
  };

  const addGratitudeItem = () => {
    const nextValue = normalizeTag(gratitudeInput);
    if (!nextValue) return;
    if (gratitudeItems.length >= MAX_GRATITUDE_ITEMS) return;
    setGratitudeItems(prev => [...prev, nextValue]);
    setGratitudeInput('');
  };

  const removeGratitudeItem = indexToRemove => {
    setGratitudeItems(prev =>
      prev.filter((_, index) => index !== indexToRemove),
    );
  };

  const saveEntry = async () => {
    const pendingListValue = normalizeTag(gratitudeInput);
    const normalizedGratitude = [...gratitudeItems]
      .map(normalizeTag)
      .filter(Boolean)
      .slice(0, MAX_GRATITUDE_ITEMS);

    if (
      pendingListValue &&
      normalizedGratitude.length < MAX_GRATITUDE_ITEMS &&
      !normalizedGratitude.includes(pendingListValue)
    ) {
      normalizedGratitude.push(pendingListValue);
    }

    const normalizedTags = feelingTags.map(normalizeTag).filter(Boolean);
    const payload = {
      title: normalizeTag(title),
      description: normalizeTag(summaryText),
      emoji: activeMood.emoji,
      tag: normalizedTags.join(', '),
      promt: normalizedGratitude,
    };
    
    try {
      setErrors({});
      await journalSchema.validate(payload, { abortEarly: false });
      setLoading(true);
      const requestPayload = {
        ...payload,
        date: activeEntry?.date || new Date().toISOString(),
        color: activeEntry?.color || '#FF5733',
      };
      if (activeEntry) {
        await request({
          url: `journals/${activeEntry.id}`,
          method: 'POST',
          data: requestPayload,
        });
      } else {
        await request({
          url: 'journals',
          method: 'POST',
          data: requestPayload,
        });
      }

      setGratitudeInput('');
      await fetchJournals();
      setMode('list');
      setActiveEntry(null);
    } catch (err) {
      handleBatchErrors(err, setErrors);
    } finally {
      setLoading(false);
    }
  };

  const deleteEntry = async () => {
    if (!activeEntry) return false;

    try {
      setLoading(true);

      await request({
        url: `journals/${activeEntry.id}`,
        method: 'DELETE',
      });

      await fetchJournals();
      setDeleteConfirmVisible(false);
      setActiveEntry(null);
      setMode('list');
      return true;
    } catch (err) {
      console.log('Delete Journal Error:', err);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const openDeleteConfirm = () => {
    if (!activeEntry) return;
    setDeleteConfirmVisible(true);
  };

  const closeDeleteConfirm = () => {
    if (loading) return;
    setDeleteConfirmVisible(false);
  };

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

      <Modal visible={filterOpen} transparent animationType="fade">
        <Pressable style={styles.modalOverlay} onPress={() => setFilterOpen(false)}>
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

      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {mode === 'edit' && (
          <ScrollView
            contentContainerStyle={[
              styles.editWrap,
              { paddingBottom: 140 + insets.bottom },
            ]}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.formCard}>
              <View style={styles.sectionHeaderRow}>
                <Text style={styles.sectionTitle}>Activity Summary</Text>
                <TouchableOpacity
                  style={styles.closeBtn}
                  onPress={closeEditor}
                  activeOpacity={0.85}
                >
                  <Feather name="x" size={16} color={colors.textPrimary} />
                </TouchableOpacity>
              </View>
              <Text style={styles.subLabel}>Today you focused on:</Text>
              <TextInput
                value={title}
                onChangeText={text => {
                  setTitle(text);
                  if (errors.title) setErrors(prev => ({ ...prev, title: null }));
                }}
                placeholder="Text"
                placeholderTextColor="#8A8A8A"
                style={[
                  styles.primaryInput,
                  errors.title && styles.inputError,
                ]}
              />
              {errors.title && <Text style={styles.errorText}>{errors.title}</Text>}
            </View>

            <View style={styles.formCard}>
              <Text style={styles.sectionTitle}>How are you feeling today?</Text>
              <View style={styles.moodRow}>
                {MOOD_OPTIONS.map(option => {
                  const selected = option.emoji === mood;
                  return (
                    <TouchableOpacity
                      key={option.label}
                      style={[
                        styles.moodItem,
                        selected && styles.moodItemActive,
                      ]}
                      activeOpacity={0.85}
                      onPress={() => setMood(option.emoji)}
                    >
                      <View
                        style={[
                          styles.moodIconWrap,
                          { backgroundColor: option.iconBg },
                        ]}
                      >
                        <Text style={styles.moodEmoji}>{option.emoji}</Text>
                      </View>
                      <Text style={styles.moodLabel}>{option.label}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <View style={styles.tagWrap}>
                {FEELING_TAG_OPTIONS.map(item => {
                  const selected = feelingTags.includes(item);
                  return (
                    <TouchableOpacity
                      key={item}
                      activeOpacity={0.85}
                      style={[
                        styles.feelingTag,
                        selected && styles.feelingTagActive,
                      ]}
                      onPress={() => toggleFeelingTag(item)}
                    >
                      <Text
                        style={[
                          styles.feelingTagText,
                          selected && styles.feelingTagTextActive,
                        ]}
                      >
                        {item}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            <View style={styles.formCard}>
              <Text style={styles.sectionTitle}>Write a summary of your day</Text>
              <Text style={styles.subLabel}>Start writing...</Text>
              <TextInput
                value={summaryText}
                onChangeText={text => {
                  setSummaryText(text);
                  if (errors.description) {
                    setErrors(prev => ({ ...prev, description: null }));
                  }
                }}
                multiline
                textAlignVertical="top"
                placeholder="Start writing..."
                placeholderTextColor="#9A9A9A"
                style={[
                  styles.summaryInput,
                  errors.description && styles.inputError,
                ]}
              />
              {errors.description && (
                <Text style={styles.errorText}>{errors.description}</Text>
              )}
            </View>

            <View style={styles.formCard}>
              <Text style={styles.sectionTitle}>
                List three things you&apos;re grateful for today
              </Text>

              {!!gratitudeItems.length && (
                <View style={styles.gratitudeList}>
                  {gratitudeItems.map((item, index) => (
                    <View key={`${item}-${index}`} style={styles.gratitudeItemRow}>
                      <Text style={styles.gratitudeItemText}>• {item}</Text>
                      <TouchableOpacity
                        activeOpacity={0.8}
                        onPress={() => removeGratitudeItem(index)}
                      >
                        <Feather name="x" size={15} color="#8A8A8A" />
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              )}

              <View style={styles.addListRow}>
                <TextInput
                  value={gratitudeInput}
                  onChangeText={setGratitudeInput}
                  placeholder="+ Add list"
                  placeholderTextColor="#8A8A8A"
                  style={styles.addListInput}
                  onSubmitEditing={addGratitudeItem}
                  returnKeyType="done"
                />
                <TouchableOpacity
                  style={[
                    styles.addListBtn,
                    gratitudeItems.length >= MAX_GRATITUDE_ITEMS && { opacity: 0.45 },
                  ]}
                  onPress={addGratitudeItem}
                  disabled={gratitudeItems.length >= MAX_GRATITUDE_ITEMS}
                  activeOpacity={0.85}
                >
                  <Feather name="plus" size={16} color={colors.textPrimary} />
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.actionRow}>
              <TouchableOpacity
                style={[styles.saveBtn, loading && { opacity: 0.6 }]}
                onPress={saveEntry}
                disabled={loading}
              >
                <Text style={styles.saveBtnText}>
                  {loading ? 'Saving...' : activeEntry ? 'Update Journal' : 'Save Journal'}
                </Text>
              </TouchableOpacity>

              {!!activeEntry && (
                <TouchableOpacity
                  style={[styles.deleteBtn, loading && { opacity: 0.6 }]}
                  onPress={openDeleteConfirm}
                  disabled={loading}
                >
                  <Text style={styles.deleteBtnText}>Delete</Text>
                </TouchableOpacity>
              )}
            </View>
          </ScrollView>
        )}

        {mode !== 'edit' && fetchingEntries && (
          <ScrollView
            contentContainerStyle={[
              styles.listWrap,
              { paddingBottom: 140 + insets.bottom },
            ]}
            showsVerticalScrollIndicator={false}
          >
            {Array.from({ length: 4 }).map((_, index) => (
              <View key={`journal-skeleton-${index}`} style={styles.listCard}>
                <View style={styles.listHeaderRow}>
                  <View style={styles.skeletonLineLong} />
                  <View style={styles.skeletonPill} />
                </View>
                <View style={styles.skeletonLineShort} />
                <View style={styles.skeletonTagRow}>
                  <View style={styles.skeletonTag} />
                  <View style={styles.skeletonTag} />
                  <View style={styles.skeletonTag} />
                </View>
              </View>
            ))}
          </ScrollView>
        )}

        {mode === 'list' && !fetchingEntries && (
          <ScrollView
            contentContainerStyle={[
              styles.listWrap,
              { paddingBottom: 140 + insets.bottom },
            ]}
            showsVerticalScrollIndicator={false}
          >
            {entries.map(item => {
              const moodOption = getMoodOptionByEmoji(item.mood);
              const tags = item.tag || [];
              const promptItems = (item.promt || []).slice(0, 3);
              const gratitudePreview = promptItems;
              return (
                <TouchableOpacity
                  key={item.id}
                  style={styles.listCard}
                  activeOpacity={0.9}
                  onPress={() => openEditor(item)}
                >
                  <View style={styles.listHeaderRow}>
                    <View style={styles.listDateWrap}>
                      <Text style={styles.listMetaLabel}>Journal Entry</Text>
                      <Text style={styles.listDate}>{formatEntryDate(item.date)}</Text>
                    </View>
                    <View
                      style={[
                        styles.moodPill,
                        { backgroundColor: moodOption.bgColor },
                      ]}
                    >
                      <Text style={styles.moodPillEmoji}>{item.emoji || moodOption.emoji}</Text>
                    </View>
                  </View>

                  {!!item.title && (
                    <Text style={styles.focusedText}>{item.title}</Text>
                  )}

                  {!!tags.length && (
                    <View style={styles.previewTagRow}>
                      {tags.slice(0, 3).map(tag => (
                        <View key={`${item.id}-${tag}`} style={styles.previewTag}>
                          <Text style={styles.previewTagText}>{tag}</Text>
                        </View>
                      ))}
                    </View>
                  )}

                  {!!promptItems.length && (
                    <Text style={styles.summaryPreview}>
                      {gratitudePreview.join(' • ')}
                    </Text>
                  )}

                  {!!item.description && (
                    <Text style={styles.summaryPreview}>
                      {getSummaryPreview(item.description)}
                    </Text>
                  )}
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        )}

        {mode === 'empty' && !fetchingEntries && (
          <View style={styles.emptyWrap}>
            <Feather name="book-open" size={100} color="#D9B87A" />
            <Text style={styles.emptyTitle}>No Journal Yet</Text>
            <Text style={styles.emptySub}>Start your reflection for today.</Text>
          </View>
        )}

        {mode !== 'edit' && (
          <TouchableOpacity
            style={[styles.fab, { bottom: 86 + insets.bottom }]}
            onPress={() => openEditor(null)}
            activeOpacity={0.88}
          >
            <Text style={styles.fabText}>+</Text>
          </TouchableOpacity>
        )}

        <ConfirmationModal
          visible={deleteConfirmVisible}
          title="Delete Journal?"
          message={
            activeEntry?.title
              ? `This will permanently delete "${activeEntry.title}".`
              : 'This will permanently delete this journal entry.'
          }
          confirmText="Delete"
          cancelText="Keep It"
          confirmVariant="danger"
          iconName="trash-2"
          loading={loading}
          onCancel={closeDeleteConfirm}
          onConfirm={deleteEntry}
        />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#FFFFFF' },
  container: { flex: 1, backgroundColor: '#FFFFFF' },

  editWrap: { padding: 14, gap: 12 },
  formCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 14,
    borderWidth: 1,
    borderColor: '#ECE8F8',
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionTitle: {
    fontSize: 19,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  subLabel: {
    marginTop: 6,
    fontSize: 14,
    color: '#5F5F5F',
  },
  closeBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#F3F0FB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryInput: {
    marginTop: 8,
    borderRadius: 16,
    backgroundColor: '#F6F6F9',
    borderWidth: 1,
    borderColor: '#ECECF0',
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 17,
    color: colors.textPrimary,
  },
  summaryInput: {
    marginTop: 10,
    borderRadius: 16,
    backgroundColor: '#F6F6F9',
    borderWidth: 1,
    borderColor: '#ECECF0',
    minHeight: 120,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: colors.textPrimary,
  },
  inputError: {
    borderColor: '#FF4D4F',
  },
  errorText: {
    marginTop: 6,
    fontSize: 11,
    color: '#FF4D4F',
  },

  moodRow: {
    marginTop: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  moodItem: {
    flex: 1,
    alignItems: 'center',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'transparent',
    paddingVertical: 8,
  },
  moodItemActive: {
    borderColor: '#D8D8DE',
    backgroundColor: '#F3F3F6',
  },
  moodIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  moodEmoji: { fontSize: 22 },
  moodLabel: {
    marginTop: 6,
    fontSize: 11,
    color: colors.textPrimary,
    fontWeight: '600',
  },
  tagWrap: {
    marginTop: 12,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  feelingTag: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 999,
    backgroundColor: '#F1F1F5',
    borderWidth: 1,
    borderColor: '#E8E8EC',
  },
  feelingTagActive: {
    backgroundColor: '#E8E8ED',
    borderColor: '#D6D6DE',
  },
  feelingTagText: {
    fontSize: 13,
    color: '#5C5C5C',
    fontWeight: '500',
  },
  feelingTagTextActive: {
    color: '#3F3F46',
    fontWeight: '700',
  },

  gratitudeList: {
    marginTop: 10,
    gap: 6,
  },
  gratitudeItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F7F7FA',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#ECE8F0',
  },
  gratitudeItemText: { fontSize: 13, color: '#565656', flex: 1, marginRight: 8 },
  addListRow: {
    marginTop: 10,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#ECECF0',
    backgroundColor: '#F7F7FA',
    flexDirection: 'row',
    alignItems: 'center',
    paddingRight: 6,
  },
  addListInput: {
    flex: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: colors.textPrimary,
  },
  addListBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E2E7',
    alignItems: 'center',
    justifyContent: 'center',
  },

  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    marginTop: 2,
  },
  saveBtn: {
    paddingHorizontal: 24,
    paddingVertical: 11,
    borderRadius: 999,
    backgroundColor: '#F4C9E4',
    borderWidth: 1,
    borderColor: '#E3A8CC',
  },
  saveBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#3F2A36',
  },
  deleteBtn: {
    paddingHorizontal: 18,
    paddingVertical: 11,
    borderRadius: 999,
    backgroundColor: '#FFF0F0',
    borderWidth: 1,
    borderColor: '#F3C3C3',
  },
  deleteBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#AA3A3A',
  },

  listWrap: { padding: 14 },
  listCard: {
    backgroundColor: '#FAFAFB',
    borderRadius: 28,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#E7E8EC',
    shadowColor: '#000000',
    shadowOpacity: 0.08,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
    ...Platform.select({ android: { elevation: 3 } }),
  },
  listHeaderRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
  },
  listDateWrap: {
    flex: 1,
  },
  listMetaLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    color: '#8A8F98',
  },
  listDate: {
    marginTop: 4,
    fontSize: 18,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  moodPill: {
    borderRadius: 999,
    minWidth: 42,
    minHeight: 42,
    paddingHorizontal: 12,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: 'rgba(80, 60, 40, 0.08)',
  },
  moodPillEmoji: { fontSize: 20 },
  moodPillText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4E4E4E',
  },
  focusedText: {
    marginTop: 14,
    fontSize: 20,
    lineHeight: 26,
    color: '#2F241C',
    fontWeight: '700',
  },
  previewTagRow: {
    marginTop: 12,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  previewTag: {
    backgroundColor: '#F1F2F5',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: '#E1E4E8',
  },
  previewTagText: {
    fontSize: 12,
    color: '#5F6670',
    fontWeight: '600',
  },
  summaryPreview: {
    marginTop: 12,
    fontSize: 13,
    color: '#666D78',
    lineHeight: 21,
    backgroundColor: '#F4F5F7',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#E4E7EB',
  },

  emptyWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 18,
    margin: 14,
    borderWidth: 1,
    borderColor: '#ECE8F8',
    borderRadius: 24,
  },
  emptyTitle: {
    marginTop: 10,
    fontSize: 17,
    color: colors.textPrimary,
    fontWeight: '700',
  },
  emptySub: {
    marginTop: 6,
    fontSize: 13,
    color: '#7A7A7A',
  },

  skeletonLineLong: {
    height: 13,
    width: 160,
    borderRadius: 8,
    backgroundColor: '#EFEFF3',
  },
  skeletonLineShort: {
    marginTop: 10,
    height: 12,
    width: 120,
    borderRadius: 8,
    backgroundColor: '#EFEFF3',
  },
  skeletonPill: {
    height: 28,
    width: 90,
    borderRadius: 999,
    backgroundColor: '#EFEFF3',
  },
  skeletonTagRow: {
    marginTop: 10,
    flexDirection: 'row',
    gap: 6,
  },
  skeletonTag: {
    height: 24,
    width: 70,
    borderRadius: 999,
    backgroundColor: '#EFEFF3',
  },
  fab: {
    position: 'absolute',
    right: 16,
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#F4C9E4',
    borderWidth: 1,
    borderColor: '#E3A8CC',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    ...Platform.select({ android: { elevation: 6 } }),
  },
  fabText: { fontSize: 28, color: '#FFFFFF', marginBottom: 2 },

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

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
  Image,
  ActivityIndicator,
} from 'react-native';
import {
  SafeAreaView,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';
import Feather from 'react-native-vector-icons/Feather';
import Svg, { Path } from 'react-native-svg';
import colors from '../../../theme/colors';

import { request } from '../../../utils/api';
import { journalSchema } from '../../../validation/validate';
import { handleBatchErrors } from '../../../utils';
import { AuthContext } from '../../../context/AuthContext';
import { hapticTap } from '../../../utils/haptics';

const MOOD_OPTIONS = [
  { emoji: '🙁', label: 'Meh', color: 'amber' },
  { emoji: '😕', label: 'Chill', color: 'mint' },
  { emoji: '😐', label: 'Satisfied', color: 'lavender' },
  { emoji: '🙂', label: 'Optimistic', color: 'rose' },
  { emoji: '😄', label: 'Grateful', color: 'amber' },
];

// Map emoji to color for backward compatibility with server data
function getColorFromEmoji(emoji) {
  const mood = MOOD_OPTIONS.find(m => m.emoji === emoji);
  return mood ? mood.color : DEFAULT_THEME;
}

const THEMES = {
  amber: {
    card: '#FFF8EC',
    border: '#F5C842',
    badge: '#FEF3C7',
    badgeText: '#92600A',
    leaf: '#F5C84280',
  },
  mint: {
    card: '#EDFAF4',
    border: '#5DBD8A',
    badge: '#D1FAE5',
    badgeText: '#065F46',
    leaf: '#5DBD8A60',
  },
  lavender: {
    card: '#F5F0FF',
    border: '#9B7FE8',
    badge: '#EDE9FE',
    badgeText: '#4C1D95',
    leaf: '#9B7FE860',
  },
  rose: {
    card: '#FFF0F3',
    border: '#F472B6',
    badge: '#FCE7F3',
    badgeText: '#831843',
    leaf: '#F472B660',
  },
};

const DEFAULT_MOOD = MOOD_OPTIONS[0];
const DEFAULT_THEME = 'amber';

function LeafDecoration({ color, style }) {
  return (
    <View style={[styles.leafContainer, style]}>
      <Svg width={112} height={144} viewBox="0 0 120 160" fill="none">
        <Path
          d="M90 150 C90 150 20 130 10 60 C0 -10 80 10 90 150Z"
          fill={color}
          opacity="0.6"
        />
        <Path
          d="M90 150 L50 80"
          stroke={color}
          strokeWidth="1.5"
          opacity="0.8"
        />
        <Path d="M50 80 C40 65 30 55 20 45" stroke={color} strokeWidth="1" opacity="0.6" />
        <Path d="M50 80 C55 62 58 50 60 35" stroke={color} strokeWidth="1" opacity="0.6" />
        <Path d="M65 110 C55 95 45 85 35 75" stroke={color} strokeWidth="1" opacity="0.5" />
        <Path
          d="M110 140 C110 140 60 128 55 85 C50 42 105 55 110 140Z"
          fill={color}
          opacity="0.35"
        />
        <Path d="M110 140 L82 100" stroke={color} strokeWidth="1" opacity="0.5" />
      </Svg>
    </View>
  );
}

function formatEntryDate(dateValue) {
  if (!dateValue) return '';
  const parsed = new Date(dateValue);
  if (Number.isNaN(parsed.getTime())) return '';
  return parsed.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  }).toUpperCase();
}

function normalizeTag(value) {
  return String(value || '').trim();
}

function hydrateEntry(item) {
  const normalizedDescription = normalizeTag(item?.description || item?.body);
  const resolvedMood = item?.emoji || item?.mood || DEFAULT_MOOD.emoji;
  // If server doesn't return color, derive it from the emoji
  const resolvedTheme = item?.color || item?.theme || getColorFromEmoji(resolvedMood) || DEFAULT_THEME;

  return {
    ...item,
    description: normalizedDescription,
    body: normalizedDescription,
    summary: normalizedDescription,
    mood: resolvedMood,
    theme: resolvedTheme,
    title: normalizeTag(item?.title || ''),
  };
}

export default function JournalScreen() {
  const insets = useSafeAreaInsets();
  const { user } = useContext(AuthContext);

  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fetchingEntries, setFetchingEntries] = useState(false);
  const [mode, setMode] = useState('empty');
  const [activeEntry, setActiveEntry] = useState(null);
  const [errors, setErrors] = useState({});
  
  const [title, setTitle] = useState('');
  const [summaryText, setSummaryText] = useState('');
  const [mood, setMood] = useState(DEFAULT_MOOD.emoji);
  const [theme, setTheme] = useState(DEFAULT_THEME);

  const activeTheme = THEMES[theme] || THEMES[DEFAULT_THEME];

  const fetchJournals = useCallback(async () => {
    try {
      setFetchingEntries(true);
      setLoading(true);
      const res = await request({
        url: 'journals',
        method: 'GET',
      });

      const rawList = (res && res.data && res.data.journals) || [];
      console.log('Raw journal data from server:', JSON.stringify(rawList, null, 2));
      const list = rawList.map(hydrateEntry);
      console.log('Hydrated journal data:', JSON.stringify(list, null, 2));

      setEntries(list);
      setMode(list.length ? 'list' : 'empty');
    } catch (err) {
      console.log('Fetch Journals Error:', err);
    } finally {
      setFetchingEntries(false);
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchJournals();
  }, [fetchJournals]);

  const clearEditorState = useCallback(() => {
    setTitle('');
    setSummaryText('');
    setMood(DEFAULT_MOOD.emoji);
    setTheme(DEFAULT_THEME);
  }, []);

  const openEditor = entry => {
    hapticTap();
    setErrors({});

    if (entry) {
      const hydrated = hydrateEntry(entry);
      setActiveEntry(hydrated);
      setTitle(hydrated.title || '');
      setSummaryText(hydrated.description || '');
      setMood(hydrated.mood || DEFAULT_MOOD.emoji);
      setTheme(hydrated.theme || DEFAULT_THEME);
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

  const saveEntry = async () => {
    hapticTap();
    
    const payload = {
      title: normalizeTag(title),
      description: normalizeTag(summaryText),
      emoji: mood,
      color: theme,
      tag: '',
      promt: [],
    };
    
    console.log('Saving journal entry with payload:', JSON.stringify(payload, null, 2));
    
    try {
      setErrors({});
      await journalSchema.validate(payload, { abortEarly: false });
      setLoading(true);
      
      const requestPayload = {
        ...payload,
        date: activeEntry?.date || new Date().toISOString(),
      };
      
      console.log('Final request payload:', JSON.stringify(requestPayload, null, 2));
      
      if (activeEntry) {
        await request({
          url: `journals/${activeEntry.id}`,
          method: 'PUT',
          data: requestPayload,
        });
      } else {
        await request({
          url: 'journals',
          method: 'POST',
          data: requestPayload,
        });
      }

      await fetchJournals();
      setMode('list');
      setActiveEntry(null);
      clearEditorState();
    } catch (err) {
      handleBatchErrors(err, setErrors);
    } finally {
      setLoading(false);
    }
  };

  const deleteEntry = async (entryToDelete) => {
    const entry = entryToDelete || activeEntry;
    if (!entry) return false;

    try {
      setLoading(true);
      await request({
        url: `journals/${entry.id}`,
        method: 'DELETE',
      });

      await fetchJournals();
      setActiveEntry(null);
      setMode(entries.length > 1 ? 'list' : 'empty');
      return true;
    } catch (err) {
      console.log('Delete Journal Error:', err);
      return false;
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        style={[
          styles.container,
          mode === 'edit' && { backgroundColor: activeTheme.card },
        ]}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {mode === 'edit' ? (
          <ScrollView
            contentContainerStyle={[
              styles.editWrap,
              { paddingBottom: 40 + insets.bottom },
            ]}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {/* Top bar */}
            <View style={styles.topBar}>
              <TouchableOpacity
                onPress={closeEditor}
                style={styles.backButton}
                activeOpacity={0.7}
              >
                <Feather name="arrow-left" size={18} color="#1a1a1a" />
              </TouchableOpacity>
              <Text style={styles.topBarTitle}>New Entry</Text>
            </View>

            {/* Date display */}
            <Text style={styles.dateLabel}>
              {new Date().toLocaleDateString('en-GB', {
                weekday: 'long',
                day: 'numeric',
                month: 'long',
                year: 'numeric',
              }).toUpperCase()}
            </Text>

            {/* Title */}
            <View style={styles.fieldContainer}>
              <Text style={styles.fieldLabel}>TITLE</Text>
              <TextInput
                value={title}
                onChangeText={text => {
                  setTitle(text);
                  if (errors.title) setErrors(prev => ({ ...prev, title: null }));
                }}
                placeholder="What's on your mind today?"
                placeholderTextColor="#999"
                maxLength={80}
                style={[
                  styles.titleInput,
                  errors.title && styles.inputError,
                ]}
              />
              <View style={styles.fieldFooter}>
                {errors.title ? (
                  <Text style={styles.errorText}>{errors.title}</Text>
                ) : <View />}
                <Text style={styles.charCount}>{title.length}/80</Text>
              </View>
            </View>

            {/* Body */}
            <View style={styles.fieldContainer}>
              <Text style={styles.fieldLabel}>YOUR THOUGHTS</Text>
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
                placeholder="Write freely — no rules, no judgment. This is just for you..."
                placeholderTextColor="#999"
                maxLength={1000}
                style={[
                  styles.bodyInput,
                  errors.description && styles.inputError,
                ]}
              />
              <View style={styles.fieldFooter}>
                {errors.description ? (
                  <Text style={styles.errorText}>{errors.description}</Text>
                ) : <View />}
                <Text style={styles.charCount}>{summaryText.length}/1000</Text>
              </View>
            </View>

            {/* Mood picker */}
            <View style={styles.fieldContainer}>
              <View style={styles.moodHeader}>
                <Text style={styles.fieldLabel}>HOW ARE YOU FEELING?</Text>
                {errors.mood && (
                  <Text style={styles.errorTextInline}>Pick a mood</Text>
                )}
              </View>
              <View style={[
                styles.moodGrid,
                errors.mood && styles.inputError
              ]}>
                {MOOD_OPTIONS.map((m) => {
                  const selected = mood === m.emoji;
                  const themeColors = THEMES[m.color];
                  return (
                    <TouchableOpacity
                      key={m.emoji}
                      onPress={() => {
                        hapticTap();
                        setMood(m.emoji);
                        setTheme(m.color);
                        if (errors.mood) setErrors(prev => ({ ...prev, mood: null }));
                      }}
                      style={[
                        styles.moodButton,
                        { backgroundColor: themeColors.card },
                        selected && {
                          ...styles.moodButtonActive,
                          borderColor: themeColors.border,
                        },
                      ]}
                      activeOpacity={0.7}
                    >
                      <Text style={[
                        styles.moodEmoji,
                        {
                          textShadowColor: 'rgba(255, 255, 255, 0.8)',
                          textShadowOffset: { width: 0, height: 1 },
                          textShadowRadius: 3,
                        }
                      ]}>{m.emoji}</Text>
                      <Text style={[
                        styles.moodLabel,
                        selected && styles.moodLabelActive,
                      ]}>
                        {m.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Save button */}
            <TouchableOpacity
              onPress={saveEntry}
              style={styles.saveButtonBottom}
              activeOpacity={0.7}
              disabled={loading}
            >
              <Text style={styles.saveButtonText}>
                {loading ? 'Saving...' : 'Save'}
              </Text>
            </TouchableOpacity>

          </ScrollView>
        ) : (
          <>
            {/* Header */}
            <View style={styles.header}>
              <View>
                <Text style={styles.headerTitle}>My Journal</Text>
              </View>
            </View>

            {/* Entries */}
            <ScrollView
              contentContainerStyle={[
                styles.listWrap,
                { paddingBottom: 40 + insets.bottom },
              ]}
              showsVerticalScrollIndicator={false}
            >
              {fetchingEntries ? (
                <View style={styles.emptyContainer}>
                  <ActivityIndicator size="large" color="#999" />
                  <Text style={styles.emptyTitle}>Loading...</Text>
                </View>
              ) : entries.length === 0 ? (
                <View style={styles.emptyContainer}>
                  <Image 
                    source={require('../../../assets/navigation/journal.png')} 
                    style={styles.emptyIcon}
                  />
                  <Text style={styles.emptyTitle}>No entries yet</Text>
                  <Text style={styles.emptySub}>
                    Tap + to write your first one
                  </Text>
                </View>
              ) : (
                entries.map(item => {
                  const t = THEMES[item.theme] || THEMES[DEFAULT_THEME];
                  return (
                    <View
                      key={item.id}
                      style={[
                        styles.entryCard,
                        {
                          backgroundColor: t.card,
                          borderLeftColor: t.border,
                        },
                      ]}
                    >
                      <TouchableOpacity
                        style={styles.cardClickable}
                        activeOpacity={0.9}
                        onPress={() => openEditor(item)}
                      >
                        <LeafDecoration
                          color={t.leaf}
                          style={styles.cardLeaf}
                        />
                        <View style={styles.cardContent}>
                          <View
                            style={[
                              styles.cardBadge,
                              { backgroundColor: t.badge },
                            ]}
                          >
                            <Text
                              style={[
                                styles.cardBadgeText,
                                { color: t.badgeText },
                              ]}
                            >
                              {formatEntryDate(item.date)}
                            </Text>
                          </View>
                          <Text style={styles.cardTitle}>{item.title}</Text>
                          {item.description && (
                            <Text style={styles.cardBody}>
                              {item.description}
                            </Text>
                          )}
                        </View>
                        <View style={styles.cardMoodCircle}>
                          <Text style={styles.cardMoodEmoji}>{item.mood}</Text>
                        </View>
                      </TouchableOpacity>
                      
                      {/* Action buttons */}
                      <View style={styles.cardActions}>
                        <View style={styles.cardDivider} />
                        <View style={styles.cardButtons}>
                          <TouchableOpacity
                            style={styles.cardActionButton}
                            onPress={() => openEditor(item)}
                            activeOpacity={0.7}
                          >
                            <Feather name="edit-2" size={16} color="#666" />
                            <Text style={styles.cardActionText}>Edit</Text>
                          </TouchableOpacity>
                          <TouchableOpacity
                            style={styles.cardActionButton}
                            onPress={() => {
                              hapticTap();
                              deleteEntry(item);
                            }}
                            activeOpacity={0.7}
                          >
                            <Feather name="trash-2" size={16} color="#EF4444" />
                            <Text style={[styles.cardActionText, { color: '#EF4444' }]}>Delete</Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                    </View>
                  );
                })
              )}
            </ScrollView>

            {/* Floating Action Button */}
            <TouchableOpacity
              onPress={() => openEditor(null)}
              style={[styles.fabBottom, { bottom: 100 + insets.bottom }]}
              activeOpacity={0.85}
            >
              <Feather name="plus" size={24} color="#1a1a1a" />
            </TouchableOpacity>
          </>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F0EDE8' },
  container: { flex: 1, backgroundColor: '#F0EDE8' },
  
  // Edit mode
  editWrap: { paddingHorizontal: 20, paddingTop: 12 },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#E0DBD4',
    alignItems: 'center',
    justifyContent: 'center',
  },
  topBarTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1a1a1a',
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
  },
  saveButton: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: '#F4C9E4',
  },
  saveButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  saveButtonBottom: {
    backgroundColor: '#F4C9E4',
    paddingVertical: 14,
    borderRadius: 25,
    alignItems: 'center',
    marginHorizontal: 20,
    marginTop: 20,
    marginBottom: 10,
  },
  
  dateLabel: {
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 1.5,
    color: '#AAA',
    marginBottom: 20,
  },
  
  fieldContainer: { marginBottom: 20 },
  fieldLabel: {
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 1.5,
    color: '#888',
    marginBottom: 8,
  },
  fieldFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
    paddingHorizontal: 4,
  },
  charCount: {
    fontSize: 11,
    color: '#BBB',
  },
  errorText: {
    fontSize: 11,
    color: '#EF4444',
  },
  errorTextInline: {
    fontSize: 10,
    color: '#EF4444',
  },
  
  titleInput: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  bodyInput: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 12,
    fontSize: 14,
    color: '#333',
    lineHeight: 22,
    minHeight: 140,
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  inputError: {
    backgroundColor: '#FFF0F0',
    borderColor: '#F87171',
  },
  
  moodHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  moodGrid: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 12,
    flexDirection: 'row',
    flexWrap: 'nowrap',
    gap: 8,
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  moodButton: {
    flex: 1,
    backgroundColor: '#F7F5F2',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 4,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2.5,
    borderColor: 'transparent',
  },
  moodButtonActive: {
    transform: [{ scale: 1.05 }],
    borderWidth: 2.5,
  },
  moodEmoji: { 
    fontSize: 28, 
    marginBottom: 6,
  },
  moodLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: '#555',
  },
  moodLabelActive: { 
    color: '#1a1a1a',
    fontWeight: '700',
  },
  
  themeRow: {
    flexDirection: 'row',
    gap: 12,
  },
  themeButton: {
    flex: 1,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2.5,
    borderColor: 'transparent',
  },
  themeDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  
  // Preview card
  previewCard: {
    borderRadius: 16,
    overflow: 'hidden',
    borderLeftWidth: 4,
  },
  previewLeaf: {
    position: 'absolute',
    bottom: 0,
    right: 0,
  },
  previewContent: {
    padding: 20,
    paddingRight: 56,
    zIndex: 10,
  },
  previewBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
    marginBottom: 12,
  },
  previewBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 1.2,
  },
  previewTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 8,
    lineHeight: 24,
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
  },
  previewBody: {
    fontSize: 14,
    color: '#555',
    lineHeight: 20,
  },
  previewMoodCircle: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  previewMoodEmoji: { fontSize: 20 },
  
  deleteButton: {
    backgroundColor: '#FFF0F0',
    borderRadius: 20,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#F3C3C3',
  },
  deleteButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#AA3A3A',
  },
  
  // List mode
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 12,
  },
  headerDate: {
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 1.5,
    color: '#AAA',
  },
  headerTitle: {
    fontSize: 30,
    fontWeight: '700',
    color: '#1a1a1a',
    marginTop: 2,
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
  },
  fabBottom: {
    position: 'absolute',
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#F4C9E4',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  
  listWrap: {
    paddingHorizontal: 20,
    paddingTop: 12,
  },
  
  leafContainer: {
    position: 'absolute',
    bottom: 0,
    right: 0,
  },
  
  entryCard: {
    borderRadius: 16,
    marginBottom: 16,
    overflow: 'hidden',
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  cardLeaf: {
    position: 'absolute',
    bottom: 0,
    right: 0,
  },
  cardContent: {
    padding: 20,
    paddingRight: 56,
    zIndex: 10,
  },
  cardBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
    marginBottom: 12,
  },
  cardBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 1.2,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 8,
    lineHeight: 26,
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
  },
  cardBody: {
    fontSize: 14,
    color: '#555',
    lineHeight: 20,
  },
  cardMoodCircle: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardMoodEmoji: { fontSize: 20 },
  
  // Card actions
  cardClickable: {
    position: 'relative',
  },
  cardActions: {
    backgroundColor: 'transparent',
  },
  cardDivider: {
    height: 1,
    backgroundColor: '#E0E0E0',
    marginHorizontal: 16,
    marginTop: 12,
  },
  cardButtons: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  cardActionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: '#F5F5F5',
  },
  cardActionText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#666',
  },
  
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 120,
  },
  emptyIcon: {
    width: 64,
    height: 64,
    marginBottom: 20,
    opacity: 0.4,
  },
  emptyEmoji: { fontSize: 48, marginBottom: 12 },
  emptyTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#BBB',
  },
  emptySub: {
    fontSize: 12,
    color: '#CCC',
    marginTop: 4,
  },
});

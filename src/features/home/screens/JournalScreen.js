/**
 * Journal App — React Native + NativeWind
 *
 * Required packages (run in your RN project):
 *   npm install nativewind react-native-svg react-native-safe-area-context
 *   npx pod-install   (iOS only)
 *
 * NativeWind setup: https://www.nativewind.dev/getting-started/react-native
 * react-native-svg setup: https://github.com/software-mansion/react-native-svg
 */

import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Modal,
  SafeAreaView,
  StatusBar,
  Platform,
  StyleSheet,
  Dimensions,
  Image,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from "react-native";
import Svg, { Path, Circle } from "react-native-svg";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { request } from "../../../utils/api";

const LOCAL_STORAGE_KEY = "@edeen_journal_entries";

// ─── Data ────────────────────────────────────────────────────────────────────

const MOODS = [
  { emoji: "🙁", label: "Meh", theme: "amber", gradient: ["#F5C842", "#FF9A62"] },
  { emoji: "😕", label: "Chill", theme: "mint" },
  { emoji: "😐", label: "Satisfied", theme: "lavender" },
  { emoji: "🙂", label: "Optimistic", theme: "rose" },
  { emoji: "😄", label: "Grateful", theme: "amber", gradient: ["#F5C842", "#FFD93D"] },
];

const THEMES = {
  amber: {
    card: "#FFF8EC",
    border: "#F5C842",
    badge: "#FEF3C7",
    badgeText: "#92600A",
    leaf: "#F5C84260",
  },
  mint: {
    card: "#EDFAF4",
    border: "#5DBD8A",
    badge: "#D1FAE5",
    badgeText: "#065F46",
    leaf: "#5DBD8A60",
  },
  lavender: {
    card: "#F5F0FF",
    border: "#9B7FE8",
    badge: "#EDE9FE",
    badgeText: "#4C1D95",
    leaf: "#9B7FE860",
  },
  rose: {
    card: "#FFF0F3",
    border: "#F472B6",
    badge: "#FCE7F3",
    badgeText: "#831843",
    leaf: "#F472B660",
  },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(date) {
  return date
    .toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    })
    .toUpperCase();
}

function formatDateLong(date) {
  return date
    .toLocaleDateString("en-GB", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    })
    .toUpperCase();
}

/** Convert YYYY-MM-DD to a display date like "22 AUGUST 2026" */
function formatApiDate(dateStr) {
  if (!dateStr) return formatDate(new Date());
  const d = new Date(dateStr + "T00:00:00");
  return formatDate(d);
}

/** Convert API journal object to the shape JournalCard expects */
function hydrateEntry(j) {
  // Resolve theme: prefer 'theme' (alias of tag), then tag, then emoji-based lookup
  const moodEntry = MOODS.find((m) => m.emoji === j.emoji);
  const theme = j.theme || j.tag || (moodEntry ? moodEntry.theme : "amber");
  return {
    id: j.id,
    title: j.title || "",
    body: j.description || j.body || "",
    mood: j.emoji || j.mood || "",
    theme,
    date: formatApiDate(j.date),
  };
}

// ─── Leaf SVG ─────────────────────────────────────────────────────────────────

function LeafDecoration({ color }) {
  return (
    <View style={styles.leafContainer} pointerEvents="none">
      <Svg width={112} height={144} viewBox="0 0 120 160">
        <Path
          d="M90 150 C90 150 20 130 10 60 C0 -10 80 10 90 150Z"
          fill={color}
          opacity={0.6}
        />
        <Path
          d="M90 150 L50 80"
          stroke={color}
          strokeWidth={1.5}
          opacity={0.8}
        />
        <Path
          d="M50 80 C40 65 30 55 20 45"
          stroke={color}
          strokeWidth={1}
          opacity={0.6}
        />
        <Path
          d="M50 80 C55 62 58 50 60 35"
          stroke={color}
          strokeWidth={1}
          opacity={0.6}
        />
        <Path
          d="M65 110 C55 95 45 85 35 75"
          stroke={color}
          strokeWidth={1}
          opacity={0.5}
        />
        <Path
          d="M110 140 C110 140 60 128 55 85 C50 42 105 55 110 140Z"
          fill={color}
          opacity={0.35}
        />
        <Path
          d="M110 140 L82 100"
          stroke={color}
          strokeWidth={1}
          opacity={0.5}
        />
      </Svg>
    </View>
  );
}

// ─── Journal Card ─────────────────────────────────────────────────────────────

function JournalCard({ entry, onDelete }) {
  const t = THEMES[entry.theme] || THEMES.amber;
  return (
    <TouchableOpacity
      activeOpacity={0.9}
      onLongPress={onDelete}
      delayLongPress={600}
      style={[
        styles.card,
        { backgroundColor: t.card, borderLeftColor: t.border },
      ]}
    >
      <LeafDecoration color={t.leaf} />

      <View style={styles.cardInner}>
        {/* Date badge */}
        <View style={[styles.badge, { backgroundColor: t.badge }]}>
          <Text style={[styles.badgeText, { color: t.badgeText }]}>
            {entry.date}
          </Text>
        </View>

        {/* Title */}
        <Text style={styles.cardTitle}>{entry.title}</Text>

        {/* Body */}
        {entry.body && entry.body.length > 0 && (
          <Text style={styles.cardBody}>
            {entry.body}
          </Text>
        )}
      </View>

      {/* Mood bubble */}
      <View style={styles.moodBubble}>
        <Text style={styles.moodBubbleEmoji}>{entry.mood}</Text>
      </View>
    </TouchableOpacity>
  );
}

// ─── New Entry Screen ─────────────────────────────────────────────────────────

function NewEntryScreen({ visible, onClose, onSave }) {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [mood, setMood] = useState(null);
  const [theme, setTheme] = useState("amber");
  const [selectedMoodIndex, setSelectedMoodIndex] = useState(null);
  const [titleError, setTitleError] = useState(false);
  const [moodError, setMoodError] = useState(false);

  function reset() {
    setTitle("");
    setBody("");
    setMood(null);
    setTheme("amber");
    setSelectedMoodIndex(null);
    setTitleError(false);
    setMoodError(false);
  }

  function handleClose() {
    reset();
    onClose();
  }

  function handleSave() {
    const titleOk = title.trim().length > 0;
    const moodOk = mood !== null;
    setTitleError(!titleOk);
    setMoodError(!moodOk);
    if (!titleOk || !moodOk) return;
    onSave({
      id: Date.now(),
      title: title.trim(),
      body: body.trim(),
      mood,
      theme,
      date: formatDate(new Date()),
    });
    reset();
  }

  const t = THEMES[theme];
  const showPreview = title.trim().length > 0;

  return (
    <Modal visible={visible} animationType="slide" statusBarTranslucent>
      <SafeAreaView style={styles.screenBg}>
        <StatusBar barStyle="dark-content" backgroundColor="#f0ede8" />

        {/* Top bar */}
        <View style={styles.topBar}>
          <TouchableOpacity onPress={handleClose} style={styles.backBtn}>
            <Svg width={18} height={18} viewBox="0 0 18 18" fill="none">
              <Path
                d="M11 4L6 9L11 14"
                stroke="#1a1a1a"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </Svg>
          </TouchableOpacity>

          <Text style={styles.topBarTitle}>New Entry</Text>

          <TouchableOpacity onPress={handleSave} style={styles.saveBtn}>
            <Text style={styles.saveBtnText}>Save</Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={styles.formContainer}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Date */}
          <Text style={styles.dateLabel}>{formatDateLong(new Date())}</Text>

          {/* Title */}
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>TITLE</Text>
            <TextInput
              style={[
                styles.titleInput,
                titleError && styles.inputError,
              ]}
              placeholder="What's on your mind today?"
              placeholderTextColor="#aaa"
              value={title}
              onChangeText={(v) => { setTitle(v); setTitleError(false); }}
              maxLength={80}
              returnKeyType="next"
            />
            <View style={styles.inputMeta}>
              {titleError
                ? <Text style={styles.errorText}>Please add a title</Text>
                : <View />}
              <Text style={styles.charCount}>{title.length}/80</Text>
            </View>
          </View>

          {/* Body */}
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>YOUR THOUGHTS</Text>
            <TextInput
              style={styles.bodyInput}
              placeholder="Write freely — no rules, no judgment. This is just for you..."
              placeholderTextColor="#aaa"
              value={body}
              onChangeText={setBody}
              maxLength={1000}
              multiline
              textAlignVertical="top"
            />
            <View style={styles.inputMeta}>
              <View />
              <Text style={styles.charCount}>{body.length}/1000</Text>
            </View>
          </View>

          {/* Mood picker */}
          <View style={styles.fieldGroup}>
            <View style={styles.fieldLabelRow}>
              <Text style={styles.fieldLabel}>HOW ARE YOU FEELING?</Text>
              {moodError && (
                <Text style={styles.errorText}>Pick a mood</Text>
              )}
            </View>
            <View
              style={[
                styles.moodGrid,
                moodError && styles.moodGridError,
              ]}
            >
              {MOODS.map((m, index) => {
                const selected = selectedMoodIndex === index;
                const moodTheme = THEMES[m.theme];
                const hasGradient = m.gradient && m.gradient.length > 0;
                
                return (
                  <TouchableOpacity
                    key={m.emoji + index}
                    onPress={() => {
                      setMood(m.emoji);
                      setTheme(m.theme);
                      setSelectedMoodIndex(index);
                      setMoodError(false);
                    }}
                    style={[
                      styles.moodBtn,
                      {
                        borderWidth: selected ? 2 : 0,
                        borderColor: selected ? moodTheme.border : "transparent",
                        backgroundColor: hasGradient ? 'transparent' : (selected ? moodTheme.border : moodTheme.card),
                      },
                    ]}
                    activeOpacity={0.8}
                  >
                    {hasGradient && selected && (
                      <>
                        <View style={[styles.gradientLeft, { backgroundColor: m.gradient[0] }]} />
                        <View style={[styles.gradientRight, { backgroundColor: m.gradient[1] }]} />
                      </>
                    )}
                    {hasGradient && !selected && (
                      <View style={[styles.gradientBackground, { backgroundColor: moodTheme.card }]} />
                    )}
                    <Text style={styles.moodEmoji}>{m.emoji}</Text>
                    <Text
                      style={[
                        styles.moodLabel,
                        { color: selected ? "#fff" : "#666" },
                      ]}
                    >
                      {m.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Live preview */}
          {showPreview && (
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>PREVIEW</Text>
              <View
                style={[
                  styles.card,
                  { backgroundColor: t.card, borderLeftColor: t.border },
                ]}
              >
                <LeafDecoration color={t.leaf} />
                <View style={styles.cardInner}>
                  <View style={[styles.badge, { backgroundColor: t.badge }]}>
                    <Text style={[styles.badgeText, { color: t.badgeText }]}>
                      {formatDate(new Date())}
                    </Text>
                  </View>
                  <Text style={styles.cardTitle}>{title}</Text>
                  {body.trim().length > 0 && (
                    <Text style={styles.cardBody} numberOfLines={2}>
                      {body}
                    </Text>
                  )}
                </View>
                {mood && (
                  <View style={styles.moodBubble}>
                    <Text style={styles.moodBubbleEmoji}>{mood}</Text>
                  </View>
                )}
              </View>
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

// ─── Main App ─────────────────────────────────────────────────────────────────

export default function JournalApp() {
  const [entries, setEntries] = useState([]);
  const [showNewEntry, setShowNewEntry] = useState(false);
  const [activeTab, setActiveTab] = useState("journal");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [testResult, setTestResult] = useState("");

  // ── Helper to save entries to local storage ──────────────────────────────
  const persistLocalEntries = async (newList) => {
    try {
      await AsyncStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(newList));
    } catch (e) {
      console.log("Local storage save error:", e);
    }
  };

  // ── Fetch journals from backend with local cache fallback ─────────────────
  const fetchJournals = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      else {
        // Load cached entries immediately
        const cached = await AsyncStorage.getItem(LOCAL_STORAGE_KEY);
        if (cached) {
          try {
            const parsed = JSON.parse(cached);
            if (Array.isArray(parsed) && parsed.length > 0) {
              console.log("📱 Loaded", parsed.length, "entries from local cache");
              setEntries(parsed);
              setLoading(false);
            }
          } catch (e) {}
        }
      }

      console.log("🌐 Fetching journals from API...");
      const res = await request({ url: "journals", method: "GET" });
      console.log("✅ API Response:", JSON.stringify(res, null, 2));
      
      const rawList = res?.data?.journals || [];
      console.log("📋 Received", rawList.length, "journals from API");
      
      const hydrated = rawList.map(hydrateEntry);
      setEntries(hydrated);
      await persistLocalEntries(hydrated);
      console.log("✅ Journals loaded and cached");
    } catch (err) {
      console.error("❌ Fetch journals error:", err?.response?.data || err.message);
      console.error("❌ Full error:", err);
      // If we don't have entries yet, try reading local cache
      try {
        const cached = await AsyncStorage.getItem(LOCAL_STORAGE_KEY);
        if (cached) {
          const parsed = JSON.parse(cached);
          console.log("📱 Fallback: Loaded", parsed.length, "entries from local cache");
          setEntries(parsed);
        }
      } catch (e) {}
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // Test API connectivity
  async function testConnection() {
    try {
      setTestResult("Testing...");
      const res = await request({ url: "test-connection", method: "GET" });
      setTestResult(`✅ SUCCESS!\n${JSON.stringify(res, null, 2)}`);
      Alert.alert("API Test Success", `Backend is reachable!\n\nResponse: ${JSON.stringify(res)}`);
    } catch (err) {
      const errorMsg = err?.response?.data || err.message || "Unknown error";
      setTestResult(`❌ FAILED!\n${JSON.stringify(errorMsg, null, 2)}`);
      Alert.alert("API Test Failed", `Error: ${JSON.stringify(errorMsg, null, 2)}`);
    }
  }

  // Load journals on mount
  useEffect(() => {
    fetchJournals();
  }, [fetchJournals]);

  // ── Save new entry (Optimistic + Backend sync) ───────────────────────────
  async function handleSave(entry) {
    try {
      setSaving(true);
      const tempEntry = {
        ...entry,
        id: entry.id || Date.now(),
      };

      // Optimistically add to UI and local cache
      setEntries((prev) => {
        const next = [tempEntry, ...prev.filter((e) => e.id !== tempEntry.id)];
        persistLocalEntries(next);
        return next;
      });
      setShowNewEntry(false);

      const payload = {
        title: entry.title,
        description: entry.body,
        emoji: entry.mood,
        tag: entry.theme,
        date: new Date().toISOString().split("T")[0], // YYYY-MM-DD
      };

      console.log("📤 Sending journal entry to API:", payload);
      const res = await request({ url: "journals", method: "POST", data: payload });
      console.log("✅ API Response:", JSON.stringify(res, null, 2));
      
      const saved = res?.data?.journal;
      if (saved) {
        console.log("✅ Journal saved successfully with ID:", saved.id);
        const hydratedSaved = hydrateEntry(saved);
        setEntries((prev) => {
          const next = [hydratedSaved, ...prev.filter((e) => e.id !== tempEntry.id && e.id !== hydratedSaved.id)];
          persistLocalEntries(next);
          return next;
        });
      } else {
        console.warn("⚠️ No journal data in response");
      }
    } catch (err) {
      console.error("❌ Save journal error:", err?.response?.data || err.message);
      console.error("❌ Full error:", err);
      
      let errorMessage = "Could not save to server.\n\nEntry saved locally only.";
      
      if (err?.response?.status === 403 || err?.response?.status === 401) {
        errorMessage = "Authentication required.\n\nPlease log in to save entries to the server.\n\nEntry saved locally only.";
      } else if (err?.response?.data?.message) {
        errorMessage = `Server error: ${err.response.data.message}\n\nEntry saved locally only.`;
      } else if (err.message) {
        errorMessage = `Error: ${err.message}\n\nEntry saved locally only.`;
      }
      
      Alert.alert("Cannot Save to Server", errorMessage);
      // Entry is already saved in local storage
    } finally {
      setSaving(false);
    }
  }

  // ── Delete entry ──────────────────────────────────────────────────────────
  function handleDelete(entryId) {
    Alert.alert(
      "Delete Entry",
      "Are you sure you want to delete this journal entry?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            setEntries((prev) => {
              const next = prev.filter((e) => e.id !== entryId);
              persistLocalEntries(next);
              return next;
            });
            try {
              await request({ url: `journals/${entryId}`, method: "DELETE" });
            } catch (err) {
              console.log("Delete journal network notice:", err?.response?.data || err.message);
            }
          },
        },
      ]
    );
  }

  const NAV_TABS = [
    {
      id: "journal",
      label: "Journal",
      icon: (active) => (
        <Svg width={22} height={22} viewBox="0 0 22 22" fill="none">
          <Path
            d="M3 4.5C3 3.12 4.12 2 5.5 2H16.5C17.88 2 19 3.12 19 4.5V17.5C19 18.88 17.88 20 16.5 20H5.5C4.12 20 3 18.88 3 17.5V4.5Z"
            stroke={active ? "#1a1a1a" : "#bbb"}
            strokeWidth={1.8}
            fill={active ? "#f0ede8" : "none"}
          />
          <Path
            d="M7 7H15M7 11H15M7 15H11"
            stroke={active ? "#1a1a1a" : "#bbb"}
            strokeWidth={1.8}
            strokeLinecap="round"
          />
        </Svg>
      ),
    },
    {
      id: "calendar",
      label: "Calendar",
      icon: (active) => (
        <Svg width={22} height={22} viewBox="0 0 22 22" fill="none">
          <Path
            d="M2 8H20V18C20 19.1 19.1 20 18 20H4C2.9 20 2 19.1 2 18V8Z"
            stroke={active ? "#1a1a1a" : "#bbb"}
            strokeWidth={1.8}
            fill="none"
          />
          <Path
            d="M2 8V6C2 4.9 2.9 4 4 4H18C19.1 4 20 4.9 20 6V8"
            stroke={active ? "#1a1a1a" : "#bbb"}
            strokeWidth={1.8}
          />
          <Path
            d="M7 2V5M15 2V5"
            stroke={active ? "#1a1a1a" : "#bbb"}
            strokeWidth={1.8}
            strokeLinecap="round"
          />
        </Svg>
      ),
    },
    {
      id: "insights",
      label: "Insights",
      icon: (active) => (
        <Svg width={22} height={22} viewBox="0 0 22 22" fill="none">
          <Path
            d="M3 17L8 11L12 14L17 8L21 11"
            stroke={active ? "#1a1a1a" : "#bbb"}
            strokeWidth={1.8}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </Svg>
      ),
    },
    {
      id: "profile",
      label: "Profile",
      icon: (active) => (
        <Svg width={22} height={22} viewBox="0 0 22 22" fill="none">
          <Circle
            cx={11}
            cy={7.5}
            r={3.5}
            stroke={active ? "#1a1a1a" : "#bbb"}
            strokeWidth={1.8}
          />
          <Path
            d="M3 19C3 15.134 6.686 12 11 12C15.314 12 19 15.134 19 19"
            stroke={active ? "#1a1a1a" : "#bbb"}
            strokeWidth={1.8}
            strokeLinecap="round"
          />
        </Svg>
      ),
    },
  ];

  return (
    <SafeAreaView style={styles.screenBg}>
      <StatusBar barStyle="dark-content" backgroundColor="#f0ede8" />

      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>My Journal</Text>
        </View>
        {/* Test API Button */}
        <TouchableOpacity 
          onPress={testConnection}
          style={{backgroundColor: '#FF6B6B', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8}}
        >
          <Text style={{color: '#fff', fontSize: 12, fontWeight: '700'}}>Test API</Text>
        </TouchableOpacity>
      </View>

      {/* Entries list */}
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => fetchJournals(true)}
            tintColor="#aaa"
            colors={["#F4C9E4"]}
          />
        }
      >
        {loading ? (
          <View style={styles.emptyState}>
            <ActivityIndicator size="large" color="#F4C9E4" />
            <Text style={[styles.emptySubtitle, { marginTop: 12 }]}>
              Loading your journal...
            </Text>
          </View>
        ) : entries.length === 0 ? (
          <View style={styles.emptyState}>
            <Image
              source={require('../../../assets/navigation/journal.png')}
              style={styles.emptyIcon}
              resizeMode="contain"
            />
            <Text style={styles.emptyTitle}>No entries yet</Text>
            <Text style={styles.emptySubtitle}>
              Tap + to write your first one
            </Text>
          </View>
        ) : (
          entries.map((entry) => (
            <JournalCard
              key={entry.id}
              entry={entry}
              onDelete={() => handleDelete(entry.id)}
            />
          ))
        )}
      </ScrollView>

      {/* Floating Add Button */}
      <TouchableOpacity
        onPress={() => setShowNewEntry(true)}
        style={styles.floatingAddBtn}
        activeOpacity={0.85}
      >
        <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
          <Path
            d="M12 4V20M4 12H20"
            stroke="white"
            strokeWidth={2.5}
            strokeLinecap="round"
          />
        </Svg>
      </TouchableOpacity>

      {/* Bottom Nav */}
      <View style={styles.bottomNav}>
        {NAV_TABS.map((tab) => (
          <TouchableOpacity
            key={tab.id}
            onPress={() => setActiveTab(tab.id)}
            style={styles.navTab}
            activeOpacity={0.7}
          >
            {tab.icon(activeTab === tab.id)}
            <Text
              style={[
                styles.navLabel,
                { color: activeTab === tab.id ? "#1a1a1a" : "#bbb" },
              ]}
            >
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <NewEntryScreen
        visible={showNewEntry}
        onClose={() => setShowNewEntry(false)}
        onSave={handleSave}
      />
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  screenBg: {
    flex: 1,
    backgroundColor: "#f0ede8",
  },

  // Header
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 8,
  },
  headerDate: {
    fontSize: 10,
    fontWeight: "600",
    letterSpacing: 1.5,
    color: "#aaa",
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "700",
    color: "#1a1a1a",
    marginTop: 2,
  },
  floatingAddBtn: {
    position: "absolute",
    bottom: Platform.OS === "ios" ? 100 : 80,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#F4C9E4",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#F4C9E4",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 8,
    zIndex: 10,
  },

  // Filter strip
  filterScroll: {
    flexGrow: 0,
  },
  filterContent: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 8,
    flexDirection: "row",
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#e0dbd4",
  },
  filterChipActive: {
    backgroundColor: "#1a1a1a",
    borderColor: "#1a1a1a",
  },
  filterChipText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#555",
  },
  filterChipTextActive: {
    color: "#fff",
  },

  // List
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    paddingTop: 4,
  },

  // Card
  card: {
    borderRadius: 18,
    borderLeftWidth: 4,
    marginBottom: 14,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  cardInner: {
    padding: 18,
    paddingRight: 56,
  },
  leafContainer: {
    position: "absolute",
    bottom: 0,
    right: 0,
  },
  badge: {
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    marginBottom: 10,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 1.2,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1a1a1a",
    marginBottom: 6,
    lineHeight: 24,
  },
  cardBody: {
    fontSize: 13,
    color: "#555",
    lineHeight: 20,
  },
  moodBubble: {
    position: "absolute",
    top: 14,
    right: 14,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  moodBubbleEmoji: {
    fontSize: 20,
  },

  // Empty state
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 100,
  },
  emptyIcon: {
    width: 80,
    height: 80,
    marginBottom: 20,
    opacity: 0.6,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#bbb",
  },
  emptySubtitle: {
    fontSize: 13,
    color: "#ccc",
    marginTop: 4,
  },

  // Bottom nav
  bottomNav: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    paddingTop: 12,
    paddingBottom: Platform.OS === "ios" ? 24 : 14,
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderTopColor: "#ece8e2",
  },
  navTab: {
    alignItems: "center",
    gap: 4,
  },
  navLabel: {
    fontSize: 11,
    fontWeight: "600",
    marginTop: 2,
  },

  // New Entry screen
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 28,
    paddingBottom: 14,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#e0dbd4",
    alignItems: "center",
    justifyContent: "center",
  },
  topBarTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1a1a1a",
  },
  saveBtn: {
    backgroundColor: "#F4C9E4",
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 20,
  },
  saveBtnText: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "700",
  },
  formContainer: {
    paddingHorizontal: 20,
    paddingBottom: 40,
    gap: 20,
  },
  dateLabel: {
    fontSize: 10,
    fontWeight: "600",
    letterSpacing: 1.5,
    color: "#aaa",
  },
  fieldGroup: {
    gap: 6,
  },
  fieldLabel: {
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 1.5,
    color: "#888",
  },
  fieldLabelRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  titleInput: {
    backgroundColor: "#fff",
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    fontWeight: "600",
    color: "#1a1a1a",
    borderWidth: 1.5,
    borderColor: "transparent",
  },
  bodyInput: {
    backgroundColor: "#fff",
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 14,
    color: "#333",
    lineHeight: 22,
    minHeight: 140,
    borderWidth: 1.5,
    borderColor: "transparent",
  },
  inputError: {
    borderColor: "#f87171",
    backgroundColor: "#fff0f0",
  },
  inputMeta: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 4,
  },
  errorText: {
    fontSize: 11,
    color: "#ef4444",
    fontWeight: "600",
  },
  charCount: {
    fontSize: 11,
    color: "#bbb",
  },
  moodGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 8,
    borderRadius: 16,
    padding: 6,
    borderWidth: 1.5,
    borderColor: "transparent",
  },
  moodGridError: {
    borderColor: "#f87171",
  },
  moodBtn: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 4,
    borderRadius: 12,
    gap: 4,
    overflow: 'hidden',
  },
  gradientBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 12,
  },
  gradientLeft: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '50%',
    height: '100%',
    borderTopLeftRadius: 12,
    borderBottomLeftRadius: 12,
  },
  gradientRight: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: '50%',
    height: '100%',
    borderTopRightRadius: 12,
    borderBottomRightRadius: 12,
  },
  moodEmoji: {
    fontSize: 22,
    zIndex: 1,
  },
  moodLabel: {
    fontSize: 9,
    fontWeight: "600",
    zIndex: 1,
  },
});

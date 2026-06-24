import React, { useEffect, useMemo, useState, useCallback } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  FlatList,
  Pressable,
  Dimensions,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Feather from 'react-native-vector-icons/Feather';
import colors from '../../../../theme/colors';
import emojiData from '../../../../assets/emojis.json';

const RECENT_KEY = 'emoji_recents';
const MAX_RECENT = 24;
const NUM_COLUMNS = 6;
const { width, height } = Dimensions.get('window');
const CELL = Math.floor((width - 32) / NUM_COLUMNS);

const CATEGORIES = emojiData.categories || [];
// One flat list (with category name as extra search keyword) for searching.
const ALL_EMOJIS = CATEGORIES.flatMap(cat =>
  cat.emojis.map(e => ({ c: e.c, n: e.n })),
);

export default function EmojiPickerModal({ visible, onClose, onSelect }) {
  const [activeKey, setActiveKey] = useState(CATEGORIES[0]?.key);
  const [query, setQuery] = useState('');
  const [recents, setRecents] = useState([]);

  useEffect(() => {
    if (!visible) return;
    setQuery('');
    AsyncStorage.getItem(RECENT_KEY).then(raw => {
      let r = [];
      try {
        r = raw ? JSON.parse(raw) : [];
      } catch (e) {
        r = [];
      }
      setRecents(r);
      setActiveKey(r.length ? 'recent' : CATEGORIES[0]?.key);
    });
  }, [visible]);

  const tabs = useMemo(() => {
    const base = recents.length
      ? [{ key: 'recent', icon: '🕘' }]
      : [];
    return [...base, ...CATEGORIES.map(c => ({ key: c.key, icon: c.icon }))];
  }, [recents.length]);

  const data = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (q) {
      return ALL_EMOJIS.filter(e => e.n.includes(q));
    }
    if (activeKey === 'recent') {
      return recents.map(c => ({ c, n: '' }));
    }
    const cat = CATEGORIES.find(c => c.key === activeKey);
    return cat ? cat.emojis : [];
  }, [query, activeKey, recents]);

  const handleSelect = useCallback(
    async char => {
      try {
        const next = [char, ...recents.filter(r => r !== char)].slice(0, MAX_RECENT);
        setRecents(next);
        await AsyncStorage.setItem(RECENT_KEY, JSON.stringify(next));
      } catch (e) {
        // ignore – recents are best-effort
      }
      onSelect(char);
    },
    [recents, onSelect],
  );

  return (
    <Modal transparent visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <Pressable style={styles.backdrop} onPress={onClose} />
        <View style={styles.sheet}>
          <View style={styles.handle} />

          <View style={styles.headerRow}>
            <Text style={styles.title}>Choose an icon</Text>
            <TouchableOpacity
              onPress={onClose}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Feather name="x" size={20} color={colors.textPrimary} />
            </TouchableOpacity>
          </View>

          <View style={styles.searchBar}>
            <Feather name="search" size={16} color="#9AA5B1" />
            <TextInput
              style={styles.searchInput}
              placeholder="Search emoji..."
              placeholderTextColor="#9AA5B1"
              value={query}
              onChangeText={setQuery}
              autoCorrect={false}
            />
            {query ? (
              <TouchableOpacity onPress={() => setQuery('')}>
                <Feather name="x-circle" size={16} color="#9AA5B1" />
              </TouchableOpacity>
            ) : null}
          </View>

          {!query ? (
            <View style={styles.tabsRow}>
              {tabs.map(item => {
                const active = item.key === activeKey;
                return (
                  <TouchableOpacity
                    key={item.key}
                    style={[styles.tab, active && styles.tabActive]}
                    onPress={() => setActiveKey(item.key)}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.tabIcon}>{item.icon}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          ) : null}

          <FlatList
            data={data}
            keyExtractor={(item, i) => `${item.c}-${i}`}
            numColumns={NUM_COLUMNS}
            removeClippedSubviews
            initialNumToRender={48}
            maxToRenderPerBatch={60}
            windowSize={10}
            keyboardShouldPersistTaps="handled"
            style={styles.grid}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.emojiCell}
                onPress={() => handleSelect(item.c)}
                activeOpacity={0.6}
              >
                <Text style={styles.emoji}>{item.c}</Text>
              </TouchableOpacity>
            )}
            ListEmptyComponent={<Text style={styles.empty}>No emoji found</Text>}
          />
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  sheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 16,
    paddingBottom: 14,
    height: Math.round(height * 0.66),
  },
  handle: {
    alignSelf: 'center',
    width: 42,
    height: 5,
    borderRadius: 3,
    backgroundColor: '#E2E6EB',
    marginTop: 8,
    marginBottom: 8,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  title: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#F2F4F7',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 42,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: colors.textPrimary,
    paddingVertical: 0,
  },
  tabsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 10,
    marginBottom: 4,
  },
  tab: {
    flex: 1,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabActive: {
    backgroundColor: '#EAF1F0',
    borderBottomWidth: 2,
    borderBottomColor: colors.dotActive,
  },
  tabIcon: {
    fontSize: 20,
  },
  grid: {
    marginTop: 8,
    flex: 1,
  },
  emojiCell: {
    width: CELL,
    height: CELL,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emoji: {
    fontSize: 26,
  },
  empty: {
    textAlign: 'center',
    marginTop: 30,
    color: colors.textMuted,
    fontSize: 13,
  },
});

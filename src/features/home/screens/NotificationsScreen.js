import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import Feather from 'react-native-vector-icons/Feather';
import colors from '../../../theme/colors';
import {
  clearSavedNotifications,
  getSavedNotifications,
} from '../../../utils/notifications';

export default function NotificationsScreen() {
  const navigation = useNavigation();
  const [items, setItems] = useState([]);

  useFocusEffect(
    useCallback(() => {
      let mounted = true;

      const load = async () => {
        const notifications = await getSavedNotifications();
        if (mounted) {
          setItems(notifications);
        }
      };

      load();

      return () => {
        mounted = false;
      };
    }, []),
  );

  const handleBack = () => {
    if (navigation.canGoBack()) {
      navigation.goBack();
      return;
    }
    navigation.navigate('MainTabs');
  };

  const handleClear = async () => {
    await clearSavedNotifications();
    setItems([]);
  };

  const formatTime = isoDate => {
    const date = new Date(isoDate);
    if (Number.isNaN(date.getTime())) {
      return '';
    }
    return date.toLocaleString();
  };

  const renderItem = ({ item }) => (
    <View style={styles.card}>
      <View style={styles.cardTextWrap}>
        <Text style={styles.cardTitle}>{item?.title || 'Notification'}</Text>
        <Text style={styles.cardSub}>{item?.body || 'No description'}</Text>
      </View>
      <View style={styles.pill}>
        <Text style={styles.pillText}>{formatTime(item?.receivedAt)}</Text>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.container}>
        <View style={styles.headerCard}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={handleBack}
            activeOpacity={0.85}
          >
            <Feather name="arrow-left" size={18} color={colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.title}>Notification</Text>
          <Text style={styles.subtitle}>Notifications and Live Alerts</Text>
          {items.length > 0 ? (
            <TouchableOpacity onPress={handleClear} style={styles.clearBtn}>
              <Text style={styles.clearText}>Clear all</Text>
            </TouchableOpacity>
          ) : null}
        </View>

        <FlatList
          data={items}
          keyExtractor={item => String(item.id)}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.emptyCard}>
              <Text style={styles.emptyTitle}>No notifications yet</Text>
              <Text style={styles.emptySub}>
                New push notifications will appear here.
              </Text>
            </View>
          }
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  container: {
    flex: 1,
    paddingHorizontal: 18,
    paddingTop: 16,
    backgroundColor: colors.background,
  },
  headerCard: {
    backgroundColor: '#F4C9E4',
    borderRadius: 20,
    padding: 18,
    paddingTop: 16,
  },
  backBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(255,255,255,0.75)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  subtitle: {
    marginTop: 4,
    fontSize: 12,
    color: colors.textMuted,
  },
  clearBtn: {
    marginTop: 10,
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.7)',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  clearText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  listContent: {
    paddingBottom: 20,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    marginTop: 12,
    borderWidth: 1,
    borderColor: '#E9E9E9',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardTextWrap: {
    flex: 1,
    marginRight: 8,
  },
  cardTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  cardSub: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 4,
    maxWidth: 220,
  },
  pill: {
    backgroundColor: '#F1C3DD',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 4,
    maxWidth: 140,
  },
  pillText: {
    fontSize: 10,
    color: colors.textPrimary,
    textAlign: 'right',
  },
  emptyCard: {
    marginTop: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E9E9E9',
    padding: 16,
  },
  emptyTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  emptySub: {
    marginTop: 6,
    fontSize: 12,
    color: colors.textMuted,
  },
});

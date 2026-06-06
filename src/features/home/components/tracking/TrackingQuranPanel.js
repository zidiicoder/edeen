import { useEffect, useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import AchievementRingCard from './AchievementRingCard';
import TrackableMonthCalendarCard from './TrackableMonthCalendarCard';
import colors from '../../../../theme/colors';
import { request } from '../../../../utils/api';

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
  return (
    item?.id ??
    item?.quran_read_id ??
    item?.quran_id ??
    item?.record_id ??
    null
  );
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

function getMonthDayCount(date) {
  const d = new Date(date);
  return new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
}

function isDateInMonth(dateKey, date) {
  const parsed = new Date(dateKey);
  if (Number.isNaN(parsed.getTime())) {
    return false;
  }

  const d = new Date(date);
  return (
    parsed.getFullYear() === d.getFullYear() &&
    parsed.getMonth() === d.getMonth()
  );
}

export default function TrackingQuranPanel({ date = new Date() }) {
  const [quranReadMap, setQuranReadMap] = useState({});
  const [loadingReads, setLoadingReads] = useState(false);
  const [syncingDayKey, setSyncingDayKey] = useState(null);

  const completedMap = useMemo(
    () =>
      Object.keys(quranReadMap).reduce((acc, key) => {
        if (quranReadMap[key]?.read) {
          acc[key] = true;
        }
        return acc;
      }, {}),
    [quranReadMap],
  );

  const completedCount = useMemo(
    () =>
      Object.keys(completedMap).filter(
        key => completedMap[key] && isDateInMonth(key, date),
      ).length,
    [completedMap, date],
  );

  // const targetDays = useMemo(() => getMonthDayCount(date), [date]);
  const targetDays = 40;

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
  }, [date?.getFullYear(), date?.getMonth()]);

  const handleToggleQuranDay = async (key, _day, value) => {
    if (loadingReads || syncingDayKey) {
      return;
    }

    const previousRecord = quranReadMap[key];

    setQuranReadMap(prev => ({
      ...prev,
      [key]: {
        id: previousRecord?.id ?? null,
        date: key,
        read: value,
      },
    }));
    setSyncingDayKey(key);

    try {
      let response;
      const payload = {
        date: key,
        read: Boolean(value),
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
            : Boolean(value),
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

  return (
    <View style={styles.wrap}>
      <View style={styles.infoCard}>
        <Text style={styles.title}>Quran Reading Tracker</Text>
        <Text style={styles.subtitle}>
          Tap a day to mark whether you read Quran on that date.
        </Text>
      </View>

      <AchievementRingCard completed={completedCount} target={targetDays} label="Days" />

      <TrackableMonthCalendarCard
        date={date}
        completedMap={completedMap}
        onToggleDay={handleToggleQuranDay}
        legendLabel={loadingReads ? 'loading...' : 'read'}
        accentColor="#6ECBC7"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginTop: 14, marginBottom: 16 },
  infoCard: {
    backgroundColor: '#F5F8FB',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E5ECF2',
  },
  title: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  subtitle: {
    marginTop: 4,
    fontSize: 12,
    lineHeight: 18,
    color: '#6B7280',
  },
});

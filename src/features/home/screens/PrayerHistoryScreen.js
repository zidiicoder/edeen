import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Feather from 'react-native-vector-icons/Feather';
import colors from '../../../theme/colors';
import { request } from '../../../utils/api';

const PRAYERS = ['Tahajjud', 'Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'];

function formatDate(dateString) {
  const date = new Date(dateString);
  const day = String(date.getDate()).padStart(2, '0');
  const month = date.toLocaleString('default', { month: 'short' });
  const year = date.getFullYear();
  return `${day} ${month} ${year}`;
}

function getDayName(dateString) {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { weekday: 'long' });
}

function getLast30Days() {
  const days = [];
  const today = new Date();
  
  for (let i = 0; i < 30; i++) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const dateKey = date.toISOString().split('T')[0];
    days.push({
      date: dateKey,
      displayDate: formatDate(dateKey),
      dayName: getDayName(dateKey),
    });
  }
  
  return days;
}

export default function PrayerHistoryScreen({ navigation }) {
  const [loading, setLoading] = useState(true);
  const [historyData, setHistoryData] = useState([]);
  const [expandedDate, setExpandedDate] = useState(null);

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      setLoading(true);
      const days = getLast30Days();
      const promises = days.map(day =>
        request({ url: `salah/records?date=${day.date}`, method: 'GET' })
          .then(res => ({
            ...day,
            record: res?.data?.salah_record || {},
          }))
          .catch(() => ({
            ...day,
            record: {},
          }))
      );

      const results = await Promise.all(promises);
      setHistoryData(results);
    } catch (error) {
      console.log('History fetch error:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateCompletion = (record) => {
    const fields = [
      record.fajr_performed,
      record.dhuhr_performed,
      record.asr_performed,
      record.maghrib_performed,
      record.isha_performed,
    ];
    const completed = fields.filter(Boolean).length;
    return `${completed}/5`;
  };

  const calculatePercentage = (record) => {
    const fields = [
      record.fajr_performed,
      record.dhuhr_performed,
      record.asr_performed,
      record.maghrib_performed,
      record.isha_performed,
    ];
    const completed = fields.filter(Boolean).length;
    return Math.round((completed / 5) * 100);
  };

  const renderPrayerStatus = (record) => {
    const prayerFields = {
      Tahajjud: record.tahajud_performed,
      Fajr: record.fajr_performed,
      Dhuhr: record.dhuhr_performed,
      Asr: record.asr_performed,
      Maghrib: record.maghrib_performed,
      Isha: record.isha_performed,
    };

    return (
      <View style={styles.prayerStatusGrid}>
        {PRAYERS.map(prayer => (
          <View key={prayer} style={styles.prayerStatusItem}>
            <View
              style={[
                styles.prayerStatusIcon,
                prayerFields[prayer] && styles.prayerStatusIconCompleted,
              ]}
            >
              {prayerFields[prayer] ? (
                <Feather name="check" size={14} color="#FFFFFF" />
              ) : (
                <Feather name="x" size={14} color="#9CA3AF" />
              )}
            </View>
            <Text style={styles.prayerStatusLabel}>{prayer}</Text>
          </View>
        ))}
      </View>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Feather name="arrow-left" size={24} color={colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Prayer History</Text>
          <View style={{ width: 24 }} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3D7FB6" />
          <Text style={styles.loadingText}>Loading history...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Feather name="arrow-left" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Prayer History</Text>
        <TouchableOpacity onPress={fetchHistory}>
          <Feather name="refresh-cw" size={20} color="#3D7FB6" />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>Last 30 Days</Text>
          <View style={styles.summaryStats}>
            <View style={styles.summaryStatItem}>
              <Text style={styles.summaryStatValue}>
                {historyData.filter(d => d.record?.fajr_performed).length}
              </Text>
              <Text style={styles.summaryStatLabel}>Fajr</Text>
            </View>
            <View style={styles.summaryStatItem}>
              <Text style={styles.summaryStatValue}>
                {historyData.filter(d => d.record?.dhuhr_performed).length}
              </Text>
              <Text style={styles.summaryStatLabel}>Dhuhr</Text>
            </View>
            <View style={styles.summaryStatItem}>
              <Text style={styles.summaryStatValue}>
                {historyData.filter(d => d.record?.asr_performed).length}
              </Text>
              <Text style={styles.summaryStatLabel}>Asr</Text>
            </View>
            <View style={styles.summaryStatItem}>
              <Text style={styles.summaryStatValue}>
                {historyData.filter(d => d.record?.maghrib_performed).length}
              </Text>
              <Text style={styles.summaryStatLabel}>Maghrib</Text>
            </View>
            <View style={styles.summaryStatItem}>
              <Text style={styles.summaryStatValue}>
                {historyData.filter(d => d.record?.isha_performed).length}
              </Text>
              <Text style={styles.summaryStatLabel}>Isha</Text>
            </View>
          </View>
        </View>

        {historyData.map(item => (
          <View key={item.date} style={styles.historyCard}>
            <TouchableOpacity
              onPress={() =>
                setExpandedDate(expandedDate === item.date ? null : item.date)
              }
              style={styles.historyCardHeader}
            >
              <View style={styles.historyCardLeft}>
                <Text style={styles.historyDate}>{item.displayDate}</Text>
                <Text style={styles.historyDay}>{item.dayName}</Text>
              </View>
              <View style={styles.historyCardRight}>
                <View style={styles.completionBadge}>
                  <Text style={styles.completionText}>
                    {calculateCompletion(item.record)}
                  </Text>
                </View>
                <Text style={styles.completionPercentage}>
                  {calculatePercentage(item.record)}%
                </Text>
                <Feather
                  name={expandedDate === item.date ? 'chevron-up' : 'chevron-down'}
                  size={20}
                  color="#6B7280"
                />
              </View>
            </TouchableOpacity>

            {expandedDate === item.date && (
              <View style={styles.historyCardBody}>
                {renderPrayerStatus(item.record)}
              </View>
            )}
          </View>
        ))}
      </ScrollView>
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
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#6B7280',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  summaryCard: {
    backgroundColor: '#EAF4FB',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#DCE9F4',
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.textPrimary,
    marginBottom: 12,
  },
  summaryStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  summaryStatItem: {
    alignItems: 'center',
  },
  summaryStatValue: {
    fontSize: 24,
    fontWeight: '900',
    color: '#3D7FB6',
  },
  summaryStatLabel: {
    marginTop: 4,
    fontSize: 11,
    fontWeight: '600',
    color: '#6B7280',
  },
  historyCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    overflow: 'hidden',
  },
  historyCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
  },
  historyCardLeft: {
    flex: 1,
  },
  historyDate: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  historyDay: {
    marginTop: 2,
    fontSize: 12,
    color: '#6B7280',
  },
  historyCardRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  completionBadge: {
    backgroundColor: '#D1FAE5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  completionText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#059669',
  },
  completionPercentage: {
    fontSize: 14,
    fontWeight: '800',
    color: '#3D7FB6',
  },
  historyCardBody: {
    padding: 14,
    paddingTop: 0,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  prayerStatusGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  prayerStatusItem: {
    width: '30%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  prayerStatusIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  prayerStatusIconCompleted: {
    backgroundColor: '#10B981',
  },
  prayerStatusLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#6B7280',
  },
});

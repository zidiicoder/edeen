import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Feather from 'react-native-vector-icons/Feather';
import { useNavigation } from '@react-navigation/native';
import colors from '../../../theme/colors';

export default function ReminderScreen() {
  const navigation = useNavigation();

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.container}>
      <View style={styles.headerCard}>
        <View style={styles.headerRow}>
          <Text style={styles.name}>Salam</Text>
          <View style={styles.headerIcons}>
            <Feather name="bell" size={18} color={colors.textPrimary} />
            <View style={styles.dayChip}><Text style={styles.dayChipText}>Day</Text></View>
          </View>
        </View>
        <View style={styles.weekRow}>
          {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((d, i) => (
            <View key={i} style={styles.weekItem}><Text style={styles.weekText}>{d}</Text></View>
          ))}
        </View>
        <View style={styles.dateRow}>
          {['29', '30', '01', '02', '03', '04', '05'].map((d, i) => (
            <View key={i} style={[styles.dateItem, i === 1 && styles.dateActive]}>
              <Text style={[styles.dateText, i === 1 && styles.dateTextActive]}>{d}</Text>
            </View>
          ))}
        </View>
      </View>

      <View style={styles.segmented}>
        {['Noon', 'Night', 'All Day'].map((label, i) => (
          <View key={label} style={[styles.segment, i === 1 && styles.segmentActive]}>
            <Text style={[styles.segmentText, i === 1 && styles.segmentTextActive]}>{label}</Text>
          </View>
        ))}
      </View>

      <View style={[styles.card, styles.alertCard]}>
        <View>
          <Text style={styles.reminderTitle}>Reminder!</Text>
          <Text style={styles.cardSub}>Do it 4 times this week to succeed</Text>
        </View>
        <TouchableOpacity><Text style={styles.close}>×</Text></TouchableOpacity>
      </View>

      <View style={styles.card}>
        <View>
          <Text style={styles.cardTitle}>Bedtime, 09:00pm</Text>
          <Text style={styles.cardSub}>in 6hours 22minutes</Text>
        </View>
        <TouchableOpacity style={styles.toggleOn} onPress={() => navigation.navigate('Profile')} />
      </View>

      <View style={styles.card}>
        <View>
          <Text style={styles.cardTitle}>Alarm, 05:10am</Text>
          <Text style={styles.cardSub}>in 14hours 30minutes</Text>
        </View>
        <TouchableOpacity style={styles.toggleOff} onPress={() => navigation.navigate('Profile')} />
      </View>

      <View style={styles.cardLarge}>
        <View>
          <Text style={styles.cardTitle}>Ideal Hours for Sleep</Text>
          <Text style={styles.cardSub}>8hours 30minutes</Text>
          <TouchableOpacity style={styles.learnMore}>
            <Text style={styles.learnText}>Learn More</Text>
          </TouchableOpacity>
        </View>
        <Feather name="moon" size={28} color={colors.textPrimary} />
      </View>

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
    backgroundColor: '#D8ECFA',
    borderRadius: 20,
    paddingTop: 16,
    padding: 16,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  name: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  headerIcons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  dayChip: {
    backgroundColor: '#F1C3DD',
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  dayChipText: {
    fontSize: 12,
    color: colors.textPrimary,
  },
  weekRow: {
    flexDirection: 'row',
    marginTop: 10,
    justifyContent: 'space-between',
  },
  weekItem: {
    width: 28,
    alignItems: 'center',
  },
  weekText: {
    fontSize: 12,
    color: colors.textPrimary,
  },
  dateRow: {
    flexDirection: 'row',
    marginTop: 6,
    justifyContent: 'space-between',
  },
  dateItem: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 14,
  },
  dateActive: {
    backgroundColor: '#F4B6D2',
  },
  dateText: {
    fontSize: 12,
    color: colors.textPrimary,
  },
  dateTextActive: {
    fontWeight: '700',
  },
  segmented: {
    flexDirection: 'row',
    marginTop: 16,
    gap: 10,
  },
  segment: {
    flex: 1,
    backgroundColor: '#EFEFEF',
    borderRadius: 16,
    paddingVertical: 6,
    alignItems: 'center',
  },
  segmentActive: {
    backgroundColor: '#F1C3DD',
  },
  segmentText: {
    fontSize: 12,
    color: colors.textMuted,
  },
  segmentTextActive: {
    color: colors.textPrimary,
    fontWeight: '600',
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
  alertCard: {
    backgroundColor: '#F4C9E4',
    borderColor: '#F0B7D8',
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
  },
  reminderTitle: {
    color: '#E85D9A',
    fontWeight: '700',
    fontSize: 12,
  },
  close: {
    fontSize: 16,
    color: colors.textPrimary,
  },
  toggleOn: {
    width: 34,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#F1C3DD',
  },
  toggleOff: {
    width: 34,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#E3E3E3',
  },
  cardLarge: {
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
  learnMore: {
    marginTop: 10,
    backgroundColor: '#F1C3DD',
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 6,
    alignSelf: 'flex-start',
  },
  learnText: {
    fontSize: 11,
    color: colors.textPrimary,
  },
});

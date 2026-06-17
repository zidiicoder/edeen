import { useMemo, useState, useEffect } from 'react';
import { Pressable, StyleSheet, Text, View, ScrollView } from 'react-native';
import Feather from 'react-native-vector-icons/Feather';
import colors from '../../../../theme/colors';
import { request } from '../../../../utils/api';
import { formatDateYYMMDD, formatPrayerTimes } from '../../../../utils';

const SALAH_ITEMS = [
  { label: 'Tahajjud', field: 'tahajud_performed' },
  { label: 'Fajr', field: 'fajr_performed' },
  { label: 'Dhuhr', field: 'dhuhr_performed' },
  { label: 'Asr', field: 'asr_performed' },
  { label: 'Maghrib', field: 'maghrib_performed' },
  { label: 'Isha', field: 'isha_performed' },
];

function getEmptySalahRecord(currentDate) {
  return {
    date: currentDate,
    fajr_performed: false,
    dhuhr_performed: false,
    asr_performed: false,
    maghrib_performed: false,
    isha_performed: false,
    tahajud_performed: false,
  };
}

export default function TrackingSalahPanel({latitude, longitude, date, staticPrayerTimes = []}) {
 const dateKey = useMemo(() => formatDateYYMMDD(date || new Date()), [date]);
 const [loading, setLoading]  = useState(false);
 const [prayerTimes, setPrayerTimes] = useState([]);
 const [salahRecord, setSalahRecord] = useState(getEmptySalahRecord(dateKey));
 const [salahRecordLoading, setSalahRecordLoading] = useState(false);
 const [updatingField, setUpdatingField] = useState(null);


  const getPrayerTimesForToday=async ()=> {
    try {
      setLoading(true);
      const res = await request({url:`salah/timings?latitude=${latitude}&longitude=${longitude}&date=${dateKey}`, method:'GET'});  
      const today = formatPrayerTimes(res.data.timings);
      
      // Get tomorrow's times for prayers that have passed
      const tomorrow = new Date(date);
      tomorrow.setDate(tomorrow.getDate() + 1);
      const tomorrowKey = formatDateYYMMDD(tomorrow);
      const tomorrowRes = await request({url:`salah/timings?latitude=${latitude}&longitude=${longitude}&date=${tomorrowKey}`, method:'GET'});
      const tomorrowTimes = formatPrayerTimes(tomorrowRes.data.timings);
      
      // Check which prayers have passed
      const now = new Date();
      const currentTime = now.getHours() * 60 + now.getMinutes();
      
      const enrichedTimes = today.map(prayer => {
        const [hours, minutes] = prayer.time.split(':').map(Number);
        const prayerTime = hours * 60 + minutes;
        
        // If prayer time has passed, show tomorrow's time
        if (currentTime > prayerTime) {
          const tomorrowPrayer = tomorrowTimes.find(t => t.label === prayer.label);
          if (tomorrowPrayer) {
            return {
              ...prayer,
              time: tomorrowPrayer.time,
              isTomorrow: true,
            };
          }
        }
        return prayer;
      });
      
      setPrayerTimes(enrichedTimes);
    } catch (error) {
      setPrayerTimes(staticPrayerTimes || []);
    } finally {
      setLoading(false);
    }
  }

  useEffect(()=>{
    getPrayerTimesForToday();
  },[latitude, longitude, dateKey]);


  const getSalahRecord = async() =>{
    try {
      setSalahRecordLoading(true);
      const res =await request({url:`salah/records?date=${dateKey}`, method:'GET'});
      setSalahRecord({
        ...getEmptySalahRecord(dateKey),
        ...(res?.data?.salah_record || {}),
      });
    } catch (error) {
      setSalahRecord(getEmptySalahRecord(dateKey));
    }finally{
      setSalahRecordLoading(false);
    }
  }

  useEffect(()=>{
    getSalahRecord();
  },[dateKey]);


  const updateSalahRecord = async(nextRecord)=>{
    try {
      await request({
        url:`salah/records`,
        method:'PUT',
        data:{
          date: dateKey,
          fajr_performed: Boolean(nextRecord.fajr_performed),
          dhuhr_performed: Boolean(nextRecord.dhuhr_performed),
          asr_performed: Boolean(nextRecord.asr_performed),
          maghrib_performed: Boolean(nextRecord.maghrib_performed),
          isha_performed: Boolean(nextRecord.isha_performed),
          tahajud_performed: Boolean(nextRecord.tahajud_performed),
        }
      });
    } catch (error) {
      throw error;
    }
  }

  const handleTogglePrayer = async(field) => {
    if (salahRecordLoading || updatingField) {
      return;
    }

    const previous = salahRecord;
    const nextRecord = {
      ...salahRecord,
      date: dateKey,
      [field]: !Boolean(salahRecord?.[field]),
    };

    setSalahRecord(nextRecord);
    setUpdatingField(field);

    try {
      await updateSalahRecord(nextRecord);
    } catch (error) {
      setSalahRecord(previous);
    } finally {
      setUpdatingField(null);
    }
  };

  const salahChecks = useMemo(
    () => SALAH_ITEMS.map(item => ({
      ...item,
      checked: Boolean(salahRecord?.[item.field]),
    })),
    [salahRecord],
  );

  const showSkeleton = loading || salahRecordLoading;


  return (
    <View style={styles.wrap}>
      {showSkeleton ? (
        <View style={styles.salahTrackCard}>
          <View style={styles.salahRow}>
            {SALAH_ITEMS.map(item => (
              <View key={item.field} style={styles.salahItem}>
                <View style={styles.salahLabelSkeleton} />
                <View style={styles.salahCheckboxSkeleton} />
              </View>
            ))}
          </View>
        </View>
      ) : (
        <View style={styles.salahTrackCard}>
          <View style={styles.salahRow}>
            {salahChecks.map(item => (
              <View key={item.field} style={styles.salahItem}>
                <Text style={styles.salahItemLabel}>{item.label}</Text>
                <Pressable
                  style={[
                    styles.salahCheckbox,
                    item.checked && styles.salahCheckboxChecked,
                    (salahRecordLoading || updatingField === item.field) && styles.salahCheckboxDisabled,
                  ]}
                  onPress={() => handleTogglePrayer(item.field)}
                  disabled={salahRecordLoading || updatingField === item.field}
                >
                  {item.checked ? (
                    <Feather name="check" size={26} color="#0A0A0A" />
                  ) : null}
                </Pressable>
              </View>
            ))}
          </View>
        </View>
      )}

      {showSkeleton ? (
        <View style={styles.timesScroll}>
          <View style={styles.timesWrap}>
            {[0, 1, 2, 3, 4].map(index => (
              <View key={`time-skeleton-${index}`} style={styles.timeCardSkeleton} />
            ))}
          </View>
        </View>
      ) : prayerTimes.length > 0 ? (
        <ScrollView
          nestedScrollEnabled
          style={styles.timesScroll}
          contentContainerStyle={styles.timesWrap}
          showsVerticalScrollIndicator
        >
          {prayerTimes.map(item => (
            <View key={item.key || item.label} style={styles.timeCard}>
              <View style={styles.timeLabelContainer}>
                <Text style={styles.timeLabel}>{item.label}</Text>
                {item.isTomorrow && (
                  <Text style={styles.tomorrowLabel}>(Tomorrow)</Text>
                )}
              </View>
              <Text style={styles.timeValue}>{item.time}</Text>
            </View>
          ))}
        </ScrollView>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginTop: 14 },
  salahTrackCard: {
    backgroundColor: '#E7F1F8',
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 10,
  },
  salahRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  salahItem: {
    width: '16%',
    alignItems: 'center',
  },
  salahItemLabel: {
    fontSize: 11,
    color: '#4B5563',
    fontWeight: '600',
    marginBottom: 8,
  },
  salahLabelSkeleton: {
    width: 30,
    height: 10,
    borderRadius: 6,
    backgroundColor: '#D7E7F3',
    marginBottom: 8,
  },
  salahCheckbox: {
    width: 38,
    height: 38,
    borderRadius: 21,
    backgroundColor: '#B8D6EC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  salahCheckboxChecked: {
    backgroundColor: '#B8D6EC',
  },
  salahCheckboxDisabled: {
    opacity: 0.6,
  },
  salahCheckboxSkeleton: {
    width: 38,
    height: 38,
    borderRadius: 21,
    backgroundColor: '#D7E7F3',
  },
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
  timesWrap: {
    gap: 8,
    paddingBottom: 4,
  },
  timesScroll: {
    marginTop: 12,
    height: 230,
  },
  timeCard: {
    backgroundColor: '#D8EEE9',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  timeCardSkeleton: {
    height: 44,
    borderRadius: 12,
    backgroundColor: '#DCE9F4',
  },
  timeLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  timeLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  tomorrowLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: '#6B7280',
    fontStyle: 'italic',
  },
  timeValue: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.textPrimary,
  },
});

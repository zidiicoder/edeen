import React, { useCallback, useContext, useEffect, useMemo, useState } from 'react';
import {
  PermissionsAndroid,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  NativeModules,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRoute, useFocusEffect } from '@react-navigation/native';
import Geolocation from '@react-native-community/geolocation';
import colors from '../../../theme/colors';
import TrackerModeTabs from '../components/tracking/TrackerModeTabs';
import TrackingSalahPanel from '../components/tracking/TrackingSalahPanel';
import TrackingQuranPanel from '../components/tracking/TrackingQuranPanel';
import CalendarModal from '../components/modal/CalendarModal';
import { request } from '../../../utils/api';
import { saveUserLocation } from '../../../utils/notifications';
import { AuthContext } from '../../../context/AuthContext';

const TRACKER_OPTIONS = [
  { label: 'Tracking Salah', value: 'salah' },
  { label: 'Tracking Quran', value: 'quran' },
];

const PRAYER_TIMES = [
  { key: 'fajr', label: 'Fajr', time: '05:28' },
  { key: 'sunrise', label: 'Sunrise', time: '06:52' },
  { key: 'dhuhr', label: 'Dhuhr', time: '12:39' },
  { key: 'asr', label: 'Asr', time: '15:58' },
  { key: 'maghrib', label: 'Maghrib', time: '18:21' },
  { key: 'isha', label: 'Isha', time: '19:42' },
];

function parseTimeToMinutes(value) {
  const [hours, minutes] = String(value).split(':').map(Number);
  return (hours || 0) * 60 + (minutes || 0);
}

function to12Hour(value) {
  const [h, m] = String(value).split(':').map(Number);
  const hour = h % 12 || 12;
  const suffix = h >= 12 ? 'PM' : 'AM';
  return `${hour}:${String(m).padStart(2, '0')} ${suffix}`;
}

function getCurrentPrayerSnapshot(now = new Date(), times = PRAYER_TIMES) {
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const sorted = times.map(item => ({
    ...item,
    totalMinutes: parseTimeToMinutes(item.time),
  }));

  let current = sorted[0];
  let next = sorted[0];

  for (let i = 0; i < sorted.length; i += 1) {
    const item = sorted[i];
    if (currentMinutes >= item.totalMinutes) {
      current = item;
      next = sorted[(i + 1) % sorted.length];
    }
  }

  return { current, next };
}

function getTodayDateKey() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

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

function formatPossibleSalahDate(value) {
  if (value) {
    const parsed = new Date(value);
    if (!Number.isNaN(parsed.getTime())) {
      return parsed.toLocaleDateString('default', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      });
    }
  }

  return new Date().toLocaleDateString('default', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

function getMinutesUntilTime(value, now = new Date()) {
  if (!value) return null;

  const targetMinutes = parseTimeToMinutes(value);
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  let diff = targetMinutes - currentMinutes;

  if (diff < 0) {
    diff += 24 * 60;
  }

  return diff;
}

function formatMinutesAsDuration(totalMinutes) {
  if (totalMinutes == null) return '--';

  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (hours <= 0) return `${minutes}m`;
  return `${hours}h ${minutes}m`;
}

export default function SalahTrackerScreen() {
  const insets = useSafeAreaInsets();
  const route = useRoute();
  const { user } = useContext(AuthContext);
  const [salahTime, setSalahTime] = useState({});
  const [getSalahTimeLoading, setGetSalahTimeLoading] = useState(false);
  const [salahTimeLoadedOnce, setSalahTimeLoadedOnce] = useState(false);
  const [salahTimeLoadError, setSalahTimeLoadError] = useState('');
  const [filter, setFilter] = useState('All');
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [activeTracker, setActiveTracker] = useState('salah');
  const [deviceLocation, setDeviceLocation] = useState(null);
  const [locationReady, setLocationReady] = useState(false);
  const [locationServicesEnabled, setLocationServicesEnabled] = useState(null); // null = checking, true = enabled, false = disabled
  const [selectedMonthDate] = useState(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  });
  const [tick, setTick] = useState(Date.now());
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
  const hasCurrentSalahData = Boolean(salahTime?.current?.name && salahTime?.current?.start_time);
  const hasUpcomingSalahData = Boolean(salahTime?.upcoming?.name && salahTime?.upcoming?.start_time);
  const hasSalahTimeData = hasCurrentSalahData || hasUpcomingSalahData;
  const possibleSalahDate = formatPossibleSalahDate(
    salahTime?.upcoming?.date ||
      salahTime?.upcoming?.salah_date ||
      salahTime?.current?.date ||
      salahTime?.current?.salah_date,
  );
  const showCurrentSalahSkeleton =
    getSalahTimeLoading || (!salahTimeLoadedOnce && !hasSalahTimeData);
  const currentSnapshot = useMemo(() => {
    const fallbackCurrent = hasCurrentSalahData
      ? {
          label: salahTime.current?.name,
          time: salahTime.current?.start_time,
        }
      : null;
    const fallbackNext = hasUpcomingSalahData
      ? {
          label: salahTime.upcoming?.name,
          time: salahTime.upcoming?.start_time,
        }
      : null;

    return {
      current: fallbackCurrent,
      next: fallbackNext,
    };
  }, [
    hasCurrentSalahData,
    hasUpcomingSalahData,
    salahTime.current?.name,
    salahTime.current?.start_time,
    salahTime.upcoming?.name,
    salahTime.upcoming?.start_time,
  ]);
  const nextPrayerMinutes = getMinutesUntilTime(
    currentSnapshot.next?.time,
    new Date(tick),
  );

  const [salahCompletedMap, setSalahCompletedMap] = useState(() => ({
    [getTodayDateKey()]: true,
  }));

  // Use deviceLocation state, which will re-trigger effects when location is obtained
  const latitude = route?.params?.latitude ?? deviceLocation?.latitude ?? 24.8607;
  const longitude = route?.params?.longitude ?? deviceLocation?.longitude ?? 67.0011;
  const isUsingFallbackLocation = !route?.params?.latitude && !deviceLocation?.latitude;
  const locationSource = route?.params?.latitude 
    ? 'Navigation Params' 
    : deviceLocation?.latitude 
      ? `GPS (${deviceLocation.latitude.toFixed(4)}, ${deviceLocation.longitude.toFixed(4)})` 
      : 'Default (Karachi)';
  const requestLocationPermission = async () => {
    if (Platform.OS === 'ios') {
      return true;
    }

    try {
      // First check if permission is already granted
      const checkResult = await PermissionsAndroid.check(
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
      );
      
      console.log('[SalahTracker] Permission already granted:', checkResult);
      
      if (checkResult) {
        return true;
      }

      // If not granted, request permission with a clear dialog
      console.log('[SalahTracker] Requesting location permission from user...');
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        {
          title: 'Edeen Needs Location Access',
          message: 'Edeen needs access to your location to show accurate prayer times for your area.',
          buttonPositive: 'Allow',
          buttonNegative: 'Deny',
        },
      );

      console.log('[SalahTracker] Permission request result:', granted);
      return granted === PermissionsAndroid.RESULTS.GRANTED;
    } catch (error) {
      console.log('[SalahTracker] Permission request error:', error);
      return false;
    }
  };

  const checkLocationServicesEnabled = () => {
    return new Promise((resolve) => {
      if (Platform.OS === 'ios') {
        resolve(true);
        return;
      }

      // For Android, we'll use Geolocation to check if location services are enabled
      // by attempting to get the current position with a very short timeout
      const timeoutId = setTimeout(() => {
        console.log('[SalahTracker] Location services check timed out');
        resolve(false);
      }, 2000);

      Geolocation.getCurrentPosition(
        (position) => {
          clearTimeout(timeoutId);
          console.log('[SalahTracker] Location services are enabled');
          resolve(true);
        },
        (error) => {
          clearTimeout(timeoutId);
          console.log('[SalahTracker] Location services error:', error);
          // Error code 2 means location services are disabled
          // Error code 1 means permission denied (but services are on)
          // Error code 3 means timeout
          if (error.code === 2) {
            console.log('[SalahTracker] Location services are DISABLED');
            resolve(false);
          } else {
            console.log('[SalahTracker] Location services are enabled (error is not about services)');
            resolve(true);
          }
        },
        {
          enableHighAccuracy: false,
          timeout: 1000,
          maximumAge: 0,
        },
      );
    });
  };
  
  useEffect(() => {
    const timer = setInterval(() => setTick(Date.now()), 60000);
    return () => clearInterval(timer);
  }, []);

  useFocusEffect(
    useCallback(() => {
      const loadLocation = async () => {
        console.log('[SalahTracker] Screen focused - checking location services...');
        
        if (route?.params?.latitude && route?.params?.longitude) {
          console.log('[SalahTracker] Using route params:', route.params.latitude, route.params.longitude);
          setLocationServicesEnabled(true);
          setLocationReady(true);
          return;
        }

        // Step 1: Check if location services are enabled on device
        const servicesEnabled = await checkLocationServicesEnabled();
        console.log('[SalahTracker] Location services enabled:', servicesEnabled);
        setLocationServicesEnabled(servicesEnabled);

        if (!servicesEnabled) {
          console.log('[SalahTracker] Location services are DISABLED - not showing prayer times');
          setLocationReady(false); // Keep loading state
          return;
        }

        // Step 2: Location services are enabled, now check permission
        const alreadyGranted = await PermissionsAndroid.check(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        );
        
        console.log('[SalahTracker] Permission already granted:', alreadyGranted);

        if (alreadyGranted) {
          // Permission already granted, fetch location directly
          console.log('[SalahTracker] Requesting GPS position...');
          Geolocation.getCurrentPosition(
            position => {
              const nextLocation = {
                latitude: position.coords.latitude,
                longitude: position.coords.longitude,
              };
              console.log('[SalahTracker] GPS position obtained:', nextLocation);
              setDeviceLocation(nextLocation);
              saveUserLocation(nextLocation);
              setLocationReady(true);
            },
            error => {
              console.log('[SalahTracker] Location error:', error);
              setLocationReady(true); // Show fallback times
            },
            {
              enableHighAccuracy: true,
              timeout: 15000,
              maximumAge: 10000,
            },
          );
          return;
        }

        // Step 3: Permission not granted, request it
        const hasPermission = await requestLocationPermission();
        console.log('[SalahTracker] Permission request result:', hasPermission);
        
        if (!hasPermission) {
          console.log('[SalahTracker] Location permission denied, using fallback');
          setLocationReady(true); // Show fallback Karachi times
          return;
        }

        // Step 4: Permission just granted, fetch location
        console.log('[SalahTracker] Requesting GPS position after permission granted...');
        Geolocation.getCurrentPosition(
          position => {
            const nextLocation = {
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
            };
            console.log('[SalahTracker] GPS position obtained:', nextLocation);
            setDeviceLocation(nextLocation);
            saveUserLocation(nextLocation);
            setLocationReady(true);
          },
          error => {
            console.log('[SalahTracker] Location error:', error);
            setLocationReady(true); // Show fallback times
          },
          {
            enableHighAccuracy: true,
            timeout: 15000,
            maximumAge: 10000,
          },
        );
      };

      // Reset states when screen focuses
      setLocationReady(false);
      setLocationServicesEnabled(null);
      
      loadLocation();
    }, [route?.params?.latitude, route?.params?.longitude])
  );


  const handleToggleSalahDay = (key, _day, value) => {
    setSalahCompletedMap(prev => ({
      ...prev,
      [key]: value,
    }));
  };

    const getCurrentSalahTime = useCallback(async () => {
      const requestTimeout = 12000;
      console.log('[SalahTracker] Fetching prayer times for:', { latitude, longitude });
      
      try {
        setGetSalahTimeLoading(true);
        setSalahTimeLoadError('');
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Salah time request timed out')), requestTimeout),
        );
        const res = await Promise.race([
          request({url:`salah/current-upcoming?latitude=${latitude}&longitude=${longitude}`, method:'GET'}),
          timeoutPromise,
        ]);
        
        console.log('[SalahTracker] Prayer times response:', res?.data);
        const current = res?.data?.current_salah;
        const upcoming = res?.data?.upcoming_salah;

        if ((current?.name && current?.start_time) || (upcoming?.name && upcoming?.start_time)) {
          setSalahTime({
            current,
            upcoming,
          });
        } else {
          setSalahTime({});
          setSalahTimeLoadError('Prayer time data is not available right now.');
        }
      } catch (error) {
        console.log('[SalahTracker] Prayer times error:', error);
        setSalahTime({});
        setSalahTimeLoadError('Unable to load prayer times. Please try again.');
      } finally {
        setSalahTimeLoadedOnce(true);
        setGetSalahTimeLoading(false);
      }
    }, [latitude, longitude]);
  
    useEffect(()=>{
      if (!route?.params?.latitude && !route?.params?.longitude && !locationReady) {
        return;
      }
      getCurrentSalahTime();
    },[latitude, longitude, locationReady, route?.params?.latitude, route?.params?.longitude, getCurrentSalahTime]);

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
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

      <ScrollView
        nestedScrollEnabled
        style={styles.container}
        contentContainerStyle={[
          styles.contentContainer,
          { paddingBottom: insets.bottom + 70 },
        ]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
      >
        {showCurrentSalahSkeleton ? (
          <View style={styles.currentSalahCard}>
            <View style={styles.heroBackdrop}>
              <View style={styles.heroMoon} />
              <View style={styles.heroStarSmall} />
              <View style={styles.heroStarMedium} />
              <View style={styles.heroGlow} />
            </View>
            {locationServicesEnabled === false ? (
              <>
                <Text style={styles.currentSalahLabel}>Location Services Disabled</Text>
                <Text style={styles.locationServicesMessage}>
                  Please enable location services in your device settings to see accurate prayer times for your area.
                </Text>
                <Text style={styles.locationServicesSteps}>
                  Settings → Location → Turn ON
                </Text>
              </>
            ) : (
              <>
                <View style={styles.salahLabelSkeleton} />
                <View style={styles.salahNameSkeleton} />
                <View style={styles.salahValueSkeleton} />
                <View style={styles.salahNextSkeleton} />
              </>
            )}
          </View>
        ) : hasSalahTimeData ? (
          <View style={styles.currentSalahCard}>
            <View style={styles.heroBackdrop}>
              <View style={styles.heroMoon} />
              <View style={styles.heroStarSmall} />
              <View style={styles.heroStarMedium} />
              <View style={styles.heroGlow} />
            </View>

            <View style={styles.heroTopRow}>
              <View style={styles.heroBadge}>
                <Text style={styles.heroBadgeText}>Prayer Focus</Text>
              </View>
              <Text style={styles.heroDateText}>{possibleSalahDate}</Text>
            </View>

            <Text style={styles.locationDebugText}>
              📍 Location: {locationSource}
            </Text>

            <Text style={styles.currentSalahLabel}>
              {hasCurrentSalahData ? 'Current Salah Time' : 'Upcoming Salah Time'}
            </Text>
            <Text style={styles.currentSalahName}>
              {hasCurrentSalahData ? salahTime.current?.name : salahTime.upcoming?.name}
            </Text>
            <Text style={styles.currentSalahValue}>
              {hasCurrentSalahData ? salahTime.current?.start_time : salahTime.upcoming?.start_time}
            </Text>

            <View style={styles.heroStatsRow}>
              <View style={styles.heroStatCard}>
                <Text style={styles.heroStatLabel}>Next Prayer</Text>
                <Text style={styles.heroStatValue}>
                  {currentSnapshot.next?.label || '--'}
                </Text>
              </View>
              <View style={styles.heroStatCard}>
                <Text style={styles.heroStatLabel}>Starts In</Text>
                <Text style={styles.heroStatValue}>
                  {formatMinutesAsDuration(nextPrayerMinutes)}
                </Text>
              </View>
            </View>

            {hasCurrentSalahData && hasUpcomingSalahData && (
              <Text style={styles.nextSalahText}>
                Next: {salahTime.upcoming?.name || 'None'} at {salahTime.upcoming?.start_time || 'N/A'}
              </Text>
            )}
          </View>
        ) : (
          <View style={styles.currentSalahCard}>
            <View style={styles.heroBackdrop}>
              <View style={styles.heroMoon} />
              <View style={styles.heroStarSmall} />
              <View style={styles.heroStarMedium} />
              <View style={styles.heroGlow} />
            </View>
            <Text style={styles.currentSalahLabel}>Current Salah Time</Text>
            <Text style={styles.currentSalahErrorText}>
              {salahTimeLoadError || 'Prayer times are currently unavailable.'}
            </Text>
            <TouchableOpacity
              activeOpacity={0.85}
              style={styles.retryButton}
              onPress={getCurrentSalahTime}
            >
              <Text style={styles.retryButtonText}>Retry</Text>
            </TouchableOpacity>
          </View>
        )}

        <TrackerModeTabs
          options={TRACKER_OPTIONS}
          value={activeTracker}
          onChange={setActiveTracker}
        />

        {getSalahTimeLoading ? (
          <View style={styles.trackerSkeletonWrap}>
            <View style={styles.trackerSkeletonLine} />
            <View style={styles.trackerSkeletonLine} />
            <View style={[styles.trackerSkeletonLine, { width: '70%' }]} />
          </View>
        ) : (
          activeTracker === 'salah' ? (
            <TrackingSalahPanel
              latitude={latitude}
              longitude={longitude}
              date={selectedMonthDate}
              completedMap={salahCompletedMap}
              onToggleDay={handleToggleSalahDay}
              staticPrayerTimes={PRAYER_TIMES}
            />
          ) : (
            <TrackingQuranPanel
              date={selectedMonthDate}
            />
          )
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  contentContainer: {
    flexGrow: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 22,
  },
  currentSalahCard: {
    backgroundColor: '#EAF4FB',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: '#DCE9F4',
    overflow: 'hidden',
  },
  heroBackdrop: {
    position: 'absolute',
    top: -8,
    right: -10,
    width: 150,
    height: 120,
  },
  heroMoon: {
    position: 'absolute',
    top: 6,
    right: 24,
    width: 62,
    height: 62,
    borderRadius: 31,
    backgroundColor: 'rgba(255,255,255,0.9)',
  },
  heroGlow: {
    position: 'absolute',
    top: 20,
    right: 0,
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: 'rgba(90,156,214,0.12)',
  },
  heroStarSmall: {
    position: 'absolute',
    top: 18,
    right: 104,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FFFFFF',
  },
  heroStarMedium: {
    position: 'absolute',
    top: 54,
    right: 116,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: 'rgba(255,255,255,0.78)',
  },
  heroTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  heroBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.82)',
    alignSelf: 'flex-start',
  },
  heroBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#3D7FB6',
  },
  heroDateText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#6C8190',
  },
  locationDebugText: {
    marginTop: 6,
    fontSize: 9,
    fontWeight: '600',
    color: '#6C8190',
    opacity: 0.8,
  },
  currentSalahLabel: {
    marginTop: 12,
    fontSize: 12,
    fontWeight: '700',
    color: '#5E7282',
  },
  locationServicesMessage: {
    marginTop: 8,
    fontSize: 13,
    fontWeight: '600',
    color: '#5E7282',
    textAlign: 'center',
    lineHeight: 20,
  },
  locationServicesSteps: {
    marginTop: 12,
    fontSize: 12,
    fontWeight: '700',
    color: '#3D7FB6',
    textAlign: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: 'rgba(61,127,182,0.1)',
    borderRadius: 8,
    alignSelf: 'center',
  },
  currentSalahName: {
    marginTop: 3,
    fontSize: 19  ,
    fontWeight: '900',
    color: colors.textPrimary,
  },
  currentSalahValue: {
    marginTop: 3,
    fontSize: 26,
    fontWeight: '900',
    color: '#3D7FB6',
  },
  nextSalahText: {
    marginTop: 6,
    fontSize: 12,
    color: '#5E7282',
    fontWeight: '600',
  },
  heroStatsRow: {
    marginTop: 14,
    flexDirection: 'row',
    gap: 10,
  },
  heroStatCard: {
    flex: 1,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.72)',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: 'rgba(61,127,182,0.08)',
  },
  heroStatLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#6C8190',
    textTransform: 'uppercase',
  },
  heroStatValue: {
    marginTop: 4,
    fontSize: 14,
    fontWeight: '900',
    color: '#214C73',
  },
  currentSalahErrorText: {
    marginTop: 8,
    fontSize: 13,
    color: '#5E7282',
    fontWeight: '600',
  },
  retryButton: {
    marginTop: 12,
    alignSelf: 'flex-start',
    backgroundColor: '#3D7FB6',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  salahLabelSkeleton: {
    width: 110,
    height: 10,
    borderRadius: 6,
    backgroundColor: '#D7E7F3',
  },
  salahNameSkeleton: {
    marginTop: 10,
    width: 140,
    height: 18,
    borderRadius: 6,
    backgroundColor: '#D7E7F3',
  },
  salahValueSkeleton: {
    marginTop: 8,
    width: 100,
    height: 24,
    borderRadius: 8,
    backgroundColor: '#D7E7F3',
  },
  salahNextSkeleton: {
    marginTop: 10,
    width: '80%',
    height: 10,
    borderRadius: 6,
    backgroundColor: '#D7E7F3',
  },
  trackerSkeletonWrap: {
    marginTop: 12,
    backgroundColor: '#F2F6FA',
    borderRadius: 16,
    padding: 14,
  },
  trackerSkeletonLine: {
    height: 12,
    borderRadius: 6,
    backgroundColor: '#DFE7EE',
    marginBottom: 10,
  },
});

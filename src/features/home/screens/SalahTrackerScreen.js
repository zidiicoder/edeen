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
import Feather from 'react-native-vector-icons/Feather';
import colors from '../../../theme/colors';
import TrackerModeTabs from '../components/tracking/TrackerModeTabs';
import TrackingSalahPanel from '../components/tracking/TrackingSalahPanel';
import TrackingQuranPanel from '../components/tracking/TrackingQuranPanel';
import QiblaPanel from '../components/tracking/QiblaPanel';
import CalendarModal from '../components/modal/CalendarModal';
import { request } from '../../../utils/api';
import { saveUserLocation } from '../../../utils/notifications';
import { AuthContext } from '../../../context/AuthContext';

const TRACKER_OPTIONS = [
  { label: 'Tracking Salah', value: 'salah', icon: 'mosque' },
  { label: 'Qibla', value: 'qibla', icon: 'compass-outline' },
  { label: 'Tracking Quran', value: 'quran', icon: 'book-open-page-variant' },
];

const SALAH_SEQUENCE = ['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'];

// Works out the current (most recently started) and next prayer purely from the
// day's timings using the DEVICE's local clock — so it is always correct for the
// user's timezone and advances on its own as time passes.
function computeCurrentUpcoming(timings, now = new Date()) {
  if (!timings) return { current: null, upcoming: null };

  const nowMinutes = now.getHours() * 60 + now.getMinutes();
  const slots = SALAH_SEQUENCE
    .filter(name => timings[name])
    .map(name => ({
      name,
      start_time: timings[name],
      minutes: parseTimeToMinutes(timings[name]),
    }));

  if (!slots.length) return { current: null, upcoming: null };

  let current = null;
  let upcoming = null;
  for (const slot of slots) {
    if (nowMinutes >= slot.minutes) {
      current = slot; // keep updating so we end on the LAST prayer that started
    } else if (!upcoming) {
      upcoming = slot; // first prayer that has not started yet
    }
  }

  // Before Fajr: the night prayer (Isha) is still the active one; Fajr is next.
  if (!current) {
    current = slots.find(s => s.name === 'Isha') || slots[slots.length - 1];
    upcoming = slots[0];
  }

  // After Isha: the next prayer is tomorrow's Fajr.
  if (!upcoming) {
    upcoming = slots.find(s => s.name === 'Fajr') || slots[0];
  }

  return {
    current: current ? { name: current.name, start_time: current.start_time } : null,
    upcoming: upcoming ? { name: upcoming.name, start_time: upcoming.start_time } : null,
  };
}

// Direct Aladhan fallback (the API needs no key) so prayer times still load even
// if our own backend is ever unreachable.
async function fetchAladhanTimingsDirect(latitude, longitude, date = new Date()) {
  const dd = String(date.getDate()).padStart(2, '0');
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const yyyy = date.getFullYear();
  // Ahle Sunnat (Hanafi): method 1 (Karachi) + school 1 (Hanafi Asr).
  const url = `https://api.aladhan.com/v1/timings/${dd}-${mm}-${yyyy}?latitude=${latitude}&longitude=${longitude}&method=1&school=1`;
  const response = await fetch(url);
  const json = await response.json();
  const raw = json?.data?.timings || {};
  const clean = {};
  ['Fajr', 'Sunrise', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'].forEach(key => {
    const match = String(raw[key] || '').match(/(\d{1,2}:\d{2})/);
    if (match) clean[key] = match[1];
  });
  
  // Extract Hijri date
  const hijri = json?.data?.date?.hijri;
  const hijriFormatted = hijri 
    ? `${hijri.day} ${hijri.month?.en || ''} ${hijri.year}`.trim()
    : '';
  
  return { timings: clean, hijri: hijriFormatted };
}

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

export default function SalahTrackerScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const route = useRoute();
  const { user } = useContext(AuthContext);
  const [salahTime, setSalahTime] = useState({});
  const [dayTimings, setDayTimings] = useState(null);
  const [hijriDate, setHijriDate] = useState('');
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
  
  useEffect(() => {
    const timer = setInterval(() => setTick(Date.now()), 60000);
    return () => clearInterval(timer);
  }, []);

  useFocusEffect(
    useCallback(() => {
      let isFocused = true;
      let pollInterval = null;
      
      const attemptLocationFetch = async (shouldPromptEnable = false) => {
        if (!isFocused) return false;
        
        // If using route params, use those
        if (route?.params?.latitude && route?.params?.longitude) {
          console.log('[SalahTracker] Using route params:', route.params.latitude, route.params.longitude);
          if (isFocused) {
            setLocationServicesEnabled(true);
            setLocationReady(true);
          }
          return true;
        }

        // Check if app has location permission
        const alreadyGranted = await PermissionsAndroid.check(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        );
        
        console.log('[SalahTracker] Permission granted:', alreadyGranted);

        if (!alreadyGranted) {
          // Request permission silently
          console.log('[SalahTracker] Requesting location permission...');
          const hasPermission = await requestLocationPermission();
          console.log('[SalahTracker] Permission result:', hasPermission);
          
          if (!hasPermission) {
            console.log('[SalahTracker] Permission DENIED - will retry');
            return false;
          }
        }

        // After permission is granted, check if location services are enabled
        const { LocationManager } = NativeModules;
        if (LocationManager && shouldPromptEnable) {
          try {
            console.log('[SalahTracker] Prompting user to enable location services...');
            await LocationManager.promptEnableLocation();
            console.log('[SalahTracker] User responded to location prompt');
          } catch (error) {
            console.log('[SalahTracker] Failed to prompt for location:', error);
          }
        }

        // Try to get location immediately
        return new Promise((resolve) => {
          console.log('[SalahTracker] Attempting GPS fetch...');
          Geolocation.getCurrentPosition(
            position => {
              if (!isFocused) {
                console.log('[SalahTracker] Screen unfocused, ignoring result');
                resolve(false);
                return;
              }
              
              const nextLocation = {
                latitude: position.coords.latitude,
                longitude: position.coords.longitude,
              };
              console.log('[SalahTracker] GPS SUCCESS:', nextLocation);
              setDeviceLocation(nextLocation);
              saveUserLocation(nextLocation);
              setLocationServicesEnabled(true);
              setLocationReady(true);
              resolve(true);
            },
            error => {
              if (!isFocused) {
                console.log('[SalahTracker] Screen unfocused, ignoring error');
                resolve(false);
                return;
              }
              
              console.log('[SalahTracker] GPS FAILED - code:', error.code, 'message:', error.message);
              
              // Error code 2 means location services are disabled
              if (error.code === 2) {
                console.log('[SalahTracker] Location services are OFF');
                setLocationServicesEnabled(false);
              }
              
              setLocationReady(false);
              resolve(false);
            },
            {
              enableHighAccuracy: true,
              timeout: 15000,
              maximumAge: 0,
            },
          );
        });
      };
      
      const startLocationPolling = async () => {
        console.log('[SalahTracker] ===== Screen focused - Starting location =====');
        
        // Clear previous state
        setLocationReady(false);
        setLocationServicesEnabled(null);
        setDeviceLocation(null);
        setSalahTime({});
        
        // Try immediately with location enable prompt
        const success = await attemptLocationFetch(true);
        
        if (success) {
          console.log('[SalahTracker] Location obtained successfully!');
          return;
        }
        
        // If failed, poll every 3 seconds
        console.log('[SalahTracker] Starting continuous polling...');
        pollInterval = setInterval(async () => {
          if (!isFocused) {
            if (pollInterval) {
              clearInterval(pollInterval);
            }
            return;
          }
          
          console.log('[SalahTracker] Polling for location...');
          const success = await attemptLocationFetch(false);
          
          if (success && pollInterval) {
            console.log('[SalahTracker] Location obtained, stopping polling');
            clearInterval(pollInterval);
            pollInterval = null;
          }
        }, 3000);
      };
      
      startLocationPolling();
      
      return () => {
        isFocused = false;
        if (pollInterval) {
          clearInterval(pollInterval);
        }
      };
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

        // Fetch the full day's timings (single source of truth shared with the
        // tracker list). Current/upcoming is then derived from the device clock.
        let timings = null;
        let hijri = null;
        try {
          const timeoutPromise = new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Salah time request timed out')), requestTimeout),
          );
          const res = await Promise.race([
            request({ url: `salah/timings?latitude=${latitude}&longitude=${longitude}&date=${getTodayDateKey()}`, method: 'GET' }),
            timeoutPromise,
          ]);
          timings = res?.data?.timings || null;
          hijri = res?.data?.hijri || null;
        } catch (backendError) {
          console.log('[SalahTracker] Backend timings failed, trying Aladhan directly:', backendError?.message);
          const aladhanResult = await fetchAladhanTimingsDirect(latitude, longitude, new Date());
          timings = aladhanResult.timings;
          hijri = { formatted: aladhanResult.hijri };
        }

        if (timings && Object.keys(timings).length > 0) {
          setDayTimings(timings);
          setHijriDate(hijri?.formatted || '');
          setSalahTime(computeCurrentUpcoming(timings, new Date()));
        } else {
          setDayTimings(null);
          setSalahTime({});
          setSalahTimeLoadError('Prayer time data is not available right now.');
        }
      } catch (error) {
        console.log('[SalahTracker] Prayer times error:', error);
        setDayTimings(null);
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

    // Re-derive the current/upcoming prayer every minute (and when timings load)
    // so the hero card advances on its own without re-fetching.
    useEffect(() => {
      if (dayTimings) {
        setSalahTime(computeCurrentUpcoming(dayTimings, new Date()));
      }
    }, [tick, dayTimings]);

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
        {activeTracker === 'qibla' ? (
          <View style={styles.qiblaIntroCard}>
            <View style={styles.qiblaIntroHeader}>
              <View style={styles.qiblaIntroIcon}>
                <Feather name="compass" size={20} color="#2E6FB0" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.qiblaIntroTitle}>Find the Qibla 🕋</Text>
                <Text style={styles.qiblaIntroSub}>
                  Use the live compass below to face Makkah from anywhere in the world.
                </Text>
              </View>
            </View>
            <View style={styles.qiblaSteps}>
              {[
                'Hold your phone flat, screen facing up.',
                'Keep it away from metal, magnets & electronics.',
                'Turn slowly until the arrow turns green and your phone vibrates.',
              ].map((step, i) => (
                <View key={`qstep-${i}`} style={styles.qiblaStepRow}>
                  <View style={styles.qiblaStepNum}>
                    <Text style={styles.qiblaStepNumText}>{i + 1}</Text>
                  </View>
                  <Text style={styles.qiblaStepText}>{step}</Text>
                </View>
              ))}
            </View>
          </View>
        ) : showCurrentSalahSkeleton ? (
          <View style={styles.currentSalahCard}>
            <View style={styles.heroBackdrop}>
              <View style={styles.heroMoon} />
              <View style={styles.heroStarSmall} />
              <View style={styles.heroStarMedium} />
              <View style={styles.heroGlow} />
            </View>
            <View style={styles.salahLabelSkeleton} />
            <View style={styles.salahNameSkeleton} />
            <View style={styles.salahValueSkeleton} />
            <View style={styles.salahNextSkeleton} />
          </View>
        ) : hasSalahTimeData ? (
          <View style={styles.currentSalahCard}>
            <View style={styles.heroBackdrop}>
              <View style={styles.heroMoon} />
              <View style={styles.heroStarSmall} />
              <View style={styles.heroStarMedium} />
              <View style={styles.heroGlow} />
            </View>

            <View style={styles.heroContentRow}>
              <View style={styles.heroLeftCol}>
                <Text style={styles.currentSalahLabel}>
                  {hasCurrentSalahData ? 'Current Salah Time' : 'Upcoming Salah Time'}
                </Text>
                <Text style={styles.currentSalahName}>
                  {hasCurrentSalahData ? salahTime.current?.name : salahTime.upcoming?.name}
                </Text>
                <Text style={styles.currentSalahValue}>
                  {hasCurrentSalahData ? salahTime.current?.start_time : salahTime.upcoming?.start_time}
                </Text>
              </View>

              <View style={styles.heroRightCol}>
                <Text style={styles.heroDateText}>{possibleSalahDate}</Text>
                {hijriDate ? (
                  <Text style={styles.heroHijriText}>{hijriDate}</Text>
                ) : null}
                <Text style={styles.heroLocationText}>
                  📍 {locationSource}
                </Text>
              </View>
            </View>

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

        {/* Prayer History Button — only relevant to Salah tracking */}
        {activeTracker === 'salah' && (
          <TouchableOpacity
            style={styles.historyButton}
            onPress={() => navigation.navigate('PrayerHistory')}
            activeOpacity={0.8}
          >
            <Feather name="calendar" size={18} color="#3D7FB6" />
            <Text style={styles.historyButtonText}>View Prayer History</Text>
            <Feather name="chevron-right" size={18} color="#3D7FB6" />
          </TouchableOpacity>
        )}

        {activeTracker === 'qibla' ? (
          <QiblaPanel latitude={latitude} longitude={longitude} />
        ) : getSalahTimeLoading ? (
          <View style={styles.trackerSkeletonWrap}>
            <View style={styles.trackerSkeletonLine} />
            <View style={styles.trackerSkeletonLine} />
            <View style={[styles.trackerSkeletonLine, { width: '70%' }]} />
          </View>
        ) : activeTracker === 'salah' ? (
          <TrackingSalahPanel
            latitude={latitude}
            longitude={longitude}
            date={selectedMonthDate}
            completedMap={salahCompletedMap}
            onToggleDay={handleToggleSalahDay}
            staticPrayerTimes={PRAYER_TIMES}
            timings={dayTimings}
          />
        ) : (
          <TrackingQuranPanel
            date={selectedMonthDate}
          />
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
    justifyContent: 'flex-end',
    gap: 12,
  },
  heroContentRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
  },
  heroLeftCol: {
    flex: 1,
    justifyContent: 'center',
  },
  heroRightCol: {
    alignItems: 'flex-end',
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
  heroDateCol: {
    alignItems: 'flex-end',
  },
  heroDateText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#6C8190',
  },
  heroHijriText: {
    marginTop: 3,
    fontSize: 14,
    fontWeight: '900',
    color: '#3D7FB6',
    textAlign: 'right',
  },
  heroLocationText: {
    marginTop: 3,
    fontSize: 9,
    fontWeight: '600',
    color: '#6C8190',
    opacity: 0.8,
    textAlign: 'right',
    lineHeight: 11,
  },
  currentSalahLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#5E7282',
    lineHeight: 14,
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
  locationServicesNote: {
    marginTop: 10,
    fontSize: 10,
    fontWeight: '600',
    color: '#9B4D4D',
    textAlign: 'center',
    fontStyle: 'italic',
    lineHeight: 14,
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
  historyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EAF4FB',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginTop: 14,
    gap: 8,
    borderWidth: 1,
    borderColor: '#DCE9F4',
  },
  historyButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#3D7FB6',
    flex: 1,
  },
  qiblaIntroCard: {
    backgroundColor: '#F3F8FC',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2EDF6',
  },
  qiblaIntroHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  qiblaIntroIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#E3EFFA',
    alignItems: 'center',
    justifyContent: 'center',
  },
  qiblaIntroTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: colors.textPrimary,
  },
  qiblaIntroSub: {
    marginTop: 2,
    fontSize: 12.5,
    lineHeight: 17,
    color: '#5E7282',
    fontWeight: '600',
  },
  qiblaSteps: {
    marginTop: 14,
    gap: 10,
  },
  qiblaStepRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  qiblaStepNum: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#2E6FB0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  qiblaStepNumText: {
    fontSize: 11,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  qiblaStepText: {
    flex: 1,
    fontSize: 12.5,
    lineHeight: 17,
    color: '#41505E',
    fontWeight: '600',
  },
});

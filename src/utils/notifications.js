import { PermissionsAndroid, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import messaging from '@react-native-firebase/messaging';
import notifee, {
  AndroidImportance,
  RepeatFrequency,
  TriggerType,
} from '@notifee/react-native';
import { request } from './api';

const FCM_TOKEN_KEY = 'fcm_token';
const NOTIFICATIONS_STORAGE_KEY = 'app_notifications';
const MAX_NOTIFICATIONS = 50;
const DEFAULT_NOTIFICATION_CHANNEL_ID = 'default';
const REMINDER_NOTIFICATION_CHANNEL_ID = 'reminders';
const REMINDER_SETTINGS_KEY = 'reminder_settings';
export const USER_LOCATION_KEY = 'user_location';

// Default fallback location (matches SalahTrackerScreen) so Salah check-ins can
// still be scheduled before the device location is resolved.
const DEFAULT_LOCATION = { latitude: 24.8607, longitude: 67.0011 };

// Stable ids so re-scheduling replaces the existing reminder instead of stacking.
export const REMINDER_IDS = {
  habit: 'daily-habit-reminder',
  journal: 'journal-reminder',
  weekly: 'weekly-summary-reminder',
};

// Salah check-ins use one trigger per prayer (fired at prayer time + 10 min).
const SALAH_PRAYERS = [
  { key: 'fajr', label: 'Fajr', field: 'Fajr' },
  { key: 'dhuhr', label: 'Dhuhr', field: 'Dhuhr' },
  { key: 'asr', label: 'Asr', field: 'Asr' },
  { key: 'maghrib', label: 'Maghrib', field: 'Maghrib' },
  { key: 'isha', label: 'Isha', field: 'Isha' },
];
const SALAH_REMINDER_ID = prayerKey => `salah-checkin-${prayerKey}`;
const SALAH_OFFSET_MINUTES = 10;
const WEEKLY_SUMMARY_WEEKDAY = 0; // 0 = Sunday (evening summary).

export const DEFAULT_REMINDER_SETTINGS = {
  // Habit reminder: user-set, default evening.
  habit: { enabled: false, hour: 18, minute: 0 },
  // Evening journalling: user-set, default 9:00 PM.
  journal: { enabled: false, hour: 21, minute: 0 },
  // Salah check-in: fires at each prayer time + 10 minutes.
  salah: { enabled: false },
  // Weekly summary: Sunday evening.
  weekly: { enabled: false, hour: 18, minute: 0 },
};

const REMINDER_CONTENT = {
  habit: {
    title: 'Habit Reminder',
    body: 'Start your day with intention! 🌙 Log your habits now.',
  },
  journal: {
    title: 'Evening Journalling',
    body: 'How was your day? Take 3 minutes to reflect & journal 📝',
  },
  weekly: {
    title: 'Weekly Summary',
    body: 'Here is your week with EDeen — tap to see your prayers & journalling 🌟',
  },
};

const normalizeRemoteMessage = remoteMessage => {
  const title =
    remoteMessage?.notification?.title ||
    remoteMessage?.data?.title ||
    'Notification';
  const body = remoteMessage?.notification?.body || remoteMessage?.data?.body || '';

  return {
    id:
      remoteMessage?.messageId ||
      `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    title,
    body,
    data: remoteMessage?.data || {},
    receivedAt: new Date().toISOString(),
  };
};

export const requestUserNotificationPermission = async () => {
  try {
    if (Platform.OS === 'android' && Platform.Version >= 33) {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS,
      );

      if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
        return false;
      }
    }

    await notifee.requestPermission();

    const authStatus = await messaging().requestPermission();
    const enabled =
      authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
      authStatus === messaging.AuthorizationStatus.PROVISIONAL;

    return enabled;
  } catch (error) {
    console.log('Notification Permission Error:', error);
    return false;
  }
};

export const createDefaultNotificationChannel = async () => {
  if (Platform.OS !== 'android') {
    return DEFAULT_NOTIFICATION_CHANNEL_ID;
  }

  try {
    return await notifee.createChannel({
      id: DEFAULT_NOTIFICATION_CHANNEL_ID,
      name: 'General Notifications',
      importance: AndroidImportance.HIGH,
    });
  } catch (error) {
    console.log('Create Notification Channel Error:', error);
    return DEFAULT_NOTIFICATION_CHANNEL_ID;
  }
};

export const shouldDisplayLocalNotificationFromBackground = remoteMessage => {
  // If FCM includes `notification`, Android will usually show it automatically.
  return !remoteMessage?.notification;
};

export const displayLocalNotification = async remoteMessage => {
  const nextItem = normalizeRemoteMessage(remoteMessage);
  const channelId = await createDefaultNotificationChannel();

  try {
    await notifee.displayNotification({
      title: nextItem.title,
      body: nextItem.body,
      data: nextItem.data,
      android: {
        channelId,
        pressAction: { id: 'default' },
      },
    });
  } catch (error) {
    console.log('Display Notification Error:', error);
  }
};

export const hasUserNotificationPermission = async () => {
  try {
    if (Platform.OS === 'android' && Platform.Version >= 33) {
      const androidGranted = await PermissionsAndroid.check(
        PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS,
      );

      if (!androidGranted) {
        return false;
      }
    }

    const authStatus = await messaging().hasPermission();
    return (
      authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
      authStatus === messaging.AuthorizationStatus.PROVISIONAL
    );
  } catch (error) {
    console.log('Notification Permission Check Error:', error);
    return false;
  }
};

export const ensureUserNotificationPermission = async () => {
  const alreadyGranted = await hasUserNotificationPermission();
  if (alreadyGranted) {
    return true;
  }

  return requestUserNotificationPermission();
};

export async function getFCMToken() {
  try {
    const token = await messaging().getToken();
    console.log('FCM Token:', token);
    if (token) {
      await AsyncStorage.setItem(FCM_TOKEN_KEY, token);
    }
    return token;
  } catch (error) {
    console.log('Get FCM Token Error:', error);
    return null;
  }
}

export const saveNotification = async remoteMessage => {
  try {
    const nextItem = normalizeRemoteMessage(remoteMessage);
    const existingRaw = await AsyncStorage.getItem(NOTIFICATIONS_STORAGE_KEY);
    const existing = existingRaw ? JSON.parse(existingRaw) : [];
    const next = [nextItem, ...existing].slice(0, MAX_NOTIFICATIONS);
    await AsyncStorage.setItem(NOTIFICATIONS_STORAGE_KEY, JSON.stringify(next));
    return nextItem;
  } catch (error) {
    console.log('Save Notification Error:', error);
    return null;
  }
};

export const getSavedNotifications = async () => {
  try {
    const raw = await AsyncStorage.getItem(NOTIFICATIONS_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (error) {
    console.log('Get Notifications Error:', error);
    return [];
  }
};

export const clearSavedNotifications = async () => {
  try {
    await AsyncStorage.removeItem(NOTIFICATIONS_STORAGE_KEY);
  } catch (error) {
    console.log('Clear Notifications Error:', error);
  }
};

/* -------------------------------------------------------------------------- */
/* Scheduled reminders (Daily habits + Journal)                               */
/* -------------------------------------------------------------------------- */

export const createReminderNotificationChannel = async () => {
  if (Platform.OS !== 'android') {
    return REMINDER_NOTIFICATION_CHANNEL_ID;
  }

  try {
    return await notifee.createChannel({
      id: REMINDER_NOTIFICATION_CHANNEL_ID,
      name: 'Reminders',
      importance: AndroidImportance.HIGH,
    });
  } catch (error) {
    console.log('Create Reminder Channel Error:', error);
    return REMINDER_NOTIFICATION_CHANNEL_ID;
  }
};

// Next occurrence of hour:minute (today if still ahead, otherwise tomorrow).
const getNextTriggerTimestamp = (hour, minute) => {
  const now = new Date();
  const next = new Date();
  next.setHours(hour, minute, 0, 0);
  if (next.getTime() <= now.getTime()) {
    next.setDate(next.getDate() + 1);
  }
  return next.getTime();
};

// Next occurrence of a given weekday (0=Sun..6=Sat) at hour:minute.
const getNextWeekdayTimestamp = (weekday, hour, minute) => {
  const now = new Date();
  const next = new Date();
  next.setHours(hour, minute, 0, 0);
  let dayDiff = (weekday - next.getDay() + 7) % 7;
  if (dayDiff === 0 && next.getTime() <= now.getTime()) {
    dayDiff = 7;
  }
  next.setDate(next.getDate() + dayDiff);
  return next.getTime();
};

export const cancelReminder = async reminderId => {
  try {
    await notifee.cancelTriggerNotification(reminderId);
  } catch (error) {
    console.log('Cancel Reminder Error:', error);
  }
};

const createTriggerReminder = async ({ id, title, body, timestamp, repeatFrequency }) => {
  const channelId = await createReminderNotificationChannel();
  await notifee.createTriggerNotification(
    {
      id,
      title,
      body,
      android: { channelId, pressAction: { id: 'default' } },
    },
    {
      type: TriggerType.TIMESTAMP,
      timestamp,
      repeatFrequency,
    },
  );
};

// Schedules (or replaces) a daily-repeating reminder at the given time.
export const scheduleDailyReminder = async ({ id, hour, minute, title, body }) => {
  try {
    const granted = await ensureUserNotificationPermission();
    if (!granted) {
      return false;
    }
    await createTriggerReminder({
      id,
      title,
      body,
      timestamp: getNextTriggerTimestamp(hour, minute),
      repeatFrequency: RepeatFrequency.DAILY,
    });
    return true;
  } catch (error) {
    console.log('Schedule Reminder Error:', error);
    return false;
  }
};

// Schedules (or replaces) a weekly-repeating reminder (e.g. Sunday evening).
export const scheduleWeeklyReminder = async ({ id, weekday, hour, minute, title, body }) => {
  try {
    const granted = await ensureUserNotificationPermission();
    if (!granted) {
      return false;
    }
    await createTriggerReminder({
      id,
      title,
      body,
      timestamp: getNextWeekdayTimestamp(weekday, hour, minute),
      repeatFrequency: RepeatFrequency.WEEKLY,
    });
    return true;
  } catch (error) {
    console.log('Schedule Weekly Reminder Error:', error);
    return false;
  }
};

/* ---- Salah check-ins (each prayer time + 10 minutes) --------------------- */

export const saveUserLocation = async location => {
  try {
    if (location?.latitude && location?.longitude) {
      await AsyncStorage.setItem(USER_LOCATION_KEY, JSON.stringify(location));
    }
  } catch (error) {
    console.log('Save Location Error:', error);
  }
};

const getStoredLocation = async () => {
  try {
    const raw = await AsyncStorage.getItem(USER_LOCATION_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed?.latitude && parsed?.longitude) {
        return parsed;
      }
    }
  } catch (error) {
    console.log('Get Location Error:', error);
  }
  return DEFAULT_LOCATION;
};

const toApiDate = date => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

// Parses a prayer-time string like "12:39" or "12:39 (EET)" into {hour, minute}.
const parsePrayerTime = value => {
  const match = String(value || '').match(/(\d{1,2}):(\d{2})/);
  if (!match) return null;
  return { hour: Number(match[1]), minute: Number(match[2]) };
};

export const cancelSalahCheckins = async () => {
  await Promise.all(
    SALAH_PRAYERS.map(prayer => cancelReminder(SALAH_REMINDER_ID(prayer.key))),
  );
};

// Fetches today's prayer times for the stored location and schedules a daily
// check-in for each prayer, 10 minutes after the prayer time.
export const scheduleSalahCheckins = async () => {
  try {
    const granted = await ensureUserNotificationPermission();
    if (!granted) {
      return false;
    }

    const { latitude, longitude } = await getStoredLocation();
    const date = toApiDate(new Date());
    const res = await request({
      url: `salah/timings?latitude=${latitude}&longitude=${longitude}&date=${date}`,
      method: 'GET',
    });
    const timings = res?.data?.timings;
    if (!timings) {
      return false;
    }

    let scheduledAny = false;
    await Promise.all(
      SALAH_PRAYERS.map(async prayer => {
        const parsed = parsePrayerTime(timings[prayer.field]);
        if (!parsed) return;

        // Prayer time + 10 minutes (handles minute overflow into the next hour).
        const total = parsed.hour * 60 + parsed.minute + SALAH_OFFSET_MINUTES;
        const hour = Math.floor((total % (24 * 60)) / 60);
        const minute = total % 60;

        await createTriggerReminder({
          id: SALAH_REMINDER_ID(prayer.key),
          title: 'Salah Check-in',
          body: `${prayer.label} time – log your prayer ✅`,
          timestamp: getNextTriggerTimestamp(hour, minute),
          repeatFrequency: RepeatFrequency.DAILY,
        });
        scheduledAny = true;
      }),
    );
    return scheduledAny;
  } catch (error) {
    console.log('Schedule Salah Check-ins Error:', error);
    return false;
  }
};

export const getReminderSettings = async () => {
  try {
    const raw = await AsyncStorage.getItem(REMINDER_SETTINGS_KEY);
    if (!raw) {
      return JSON.parse(JSON.stringify(DEFAULT_REMINDER_SETTINGS));
    }
    const parsed = JSON.parse(raw);
    return {
      habit: { ...DEFAULT_REMINDER_SETTINGS.habit, ...(parsed.habit || {}) },
      journal: { ...DEFAULT_REMINDER_SETTINGS.journal, ...(parsed.journal || {}) },
      salah: { ...DEFAULT_REMINDER_SETTINGS.salah, ...(parsed.salah || {}) },
      weekly: { ...DEFAULT_REMINDER_SETTINGS.weekly, ...(parsed.weekly || {}) },
    };
  } catch (error) {
    console.log('Get Reminder Settings Error:', error);
    return JSON.parse(JSON.stringify(DEFAULT_REMINDER_SETTINGS));
  }
};

const saveReminderSettings = async settings => {
  try {
    await AsyncStorage.setItem(REMINDER_SETTINGS_KEY, JSON.stringify(settings));
  } catch (error) {
    console.log('Save Reminder Settings Error:', error);
  }
};

// Schedules (or cancels) the trigger(s) for a single reminder type.
const scheduleReminderType = async (type, config) => {
  if (!config.enabled) {
    if (type === 'salah') {
      await cancelSalahCheckins();
    } else {
      await cancelReminder(REMINDER_IDS[type]);
    }
    return false;
  }

  if (type === 'salah') {
    return scheduleSalahCheckins();
  }
  if (type === 'weekly') {
    return scheduleWeeklyReminder({
      id: REMINDER_IDS.weekly,
      weekday: WEEKLY_SUMMARY_WEEKDAY,
      hour: config.hour,
      minute: config.minute,
      title: REMINDER_CONTENT.weekly.title,
      body: REMINDER_CONTENT.weekly.body,
    });
  }
  return scheduleDailyReminder({
    id: REMINDER_IDS[type],
    hour: config.hour,
    minute: config.minute,
    title: REMINDER_CONTENT[type].title,
    body: REMINDER_CONTENT[type].body,
  });
};

// Applies one reminder (habit|journal|salah|weekly): schedules or cancels, then
// persists. Returns the resolved config so the caller can reflect the real
// state (e.g. permission denied -> enabled stays false).
export const applyReminder = async (type, config) => {
  const current = await getReminderSettings();
  const next = { ...current[type], ...config };

  next.enabled = (await scheduleReminderType(type, next)) ? next.enabled : false;

  const updated = { ...current, [type]: next };
  await saveReminderSettings(updated);
  return next;
};

// Re-schedules every enabled reminder. Call on app start so reminders survive
// reboots / app updates (trigger notifications are cleared by the OS on reboot)
// and so Salah times refresh to the current day.
export const rescheduleSavedReminders = async () => {
  try {
    const settings = await getReminderSettings();
    await Promise.all(
      ['habit', 'journal', 'salah', 'weekly'].map(type => {
        if (settings[type]?.enabled) {
          return scheduleReminderType(type, settings[type]);
        }
        return Promise.resolve();
      }),
    );
  } catch (error) {
    console.log('Reschedule Reminders Error:', error);
  }
};

import { PermissionsAndroid, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import messaging from '@react-native-firebase/messaging';
import notifee, { AndroidImportance } from '@notifee/react-native';

const FCM_TOKEN_KEY = 'fcm_token';
const NOTIFICATIONS_STORAGE_KEY = 'app_notifications';
const MAX_NOTIFICATIONS = 50;
const DEFAULT_NOTIFICATION_CHANNEL_ID = 'default';

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

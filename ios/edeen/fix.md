
In notifications.js, make these exact changes:

Change 1 — Add AuthorizationStatus to the notifee import:

// BEFORE:
import notifee, {
  AndroidImportance,
  RepeatFrequency,
  TriggerType,
} from '@notifee/react-native';

// AFTER:
import notifee, {
  AndroidImportance,
  AuthorizationStatus,
  RepeatFrequency,
  TriggerType,
} from '@notifee/react-native';
Change 2 — Fix hasUserNotificationPermission to handle iOS correctly:

// BEFORE:
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

// AFTER:
export const hasUserNotificationPermission = async () => {
  try {
    if (Platform.OS === 'ios') {
      const settings = await notifee.getNotificationSettings();
      return (
        settings.authorizationStatus === AuthorizationStatus.AUTHORIZED ||
        settings.authorizationStatus === AuthorizationStatus.PROVISIONAL
      );
    }

    if (Platform.Version >= 33) {
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
Change 3 — Fix createTriggerReminder to keep alarmManager Android-only:

// BEFORE:
const createTriggerReminder = async ({ id, title, body, timestamp, repeatFrequency }) => {
  const channelId = await createReminderNotificationChannel();
  await notifee.createTriggerNotification(
    {
      id,
      title,
      body,
      android: {
        channelId,
        pressAction: { id: 'default' },
        importance: AndroidImportance.HIGH,
      },
    },
    {
      type: TriggerType.TIMESTAMP,
      timestamp,
      repeatFrequency,
      alarmManager: { allowWhileIdle: true },
    },
  );
};

// AFTER:
const createTriggerReminder = async ({ id, title, body, timestamp, repeatFrequency }) => {
  const channelId = await createReminderNotificationChannel();
  const trigger = {
    type: TriggerType.TIMESTAMP,
    timestamp,
    repeatFrequency,
    ...(Platform.OS === 'android' && { alarmManager: { allowWhileIdle: true } }),
  };
  await notifee.createTriggerNotification(
    {
      id,
      title,
      body,
      android: {
        channelId,
        pressAction: { id: 'default' },
        importance: AndroidImportance.HIGH,
      },
    },
    trigger,
  );
};
After making these changes, rebuild for iOS:

cd ios && pod install && cd ..
npx react-native run-ios
The toggle should now work correctly on iOS. If it still doesn't work after these fixes, check that NSUserNotificationUsageDescription is present in your ios/edeen/Info.plist.

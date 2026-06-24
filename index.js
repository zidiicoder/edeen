/**
 * @format
 */

import 'react-native-reanimated';
import 'react-native-gesture-handler';
import { AppRegistry, Platform } from 'react-native';
import App from './App';
import { name as appName } from './app.json';

// Global JS error reporter — catches uncaught errors (outside React render) and
// sends them to the backend so crashes can be diagnosed from the server logs.
try {
  if (global.ErrorUtils && typeof global.ErrorUtils.setGlobalHandler === 'function') {
    const previousHandler = global.ErrorUtils.getGlobalHandler
      ? global.ErrorUtils.getGlobalHandler()
      : null;
    global.ErrorUtils.setGlobalHandler((error, isFatal) => {
      try {
        fetch('https://edeenapp.co.uk/api/crash-report', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
          body: JSON.stringify({
            error: (error && (error.message || error.toString())) || 'Unknown error',
            stack: (error && error.stack) || '',
            timestamp: new Date().toISOString(),
            platform: Platform.OS,
            version: String(Platform.Version),
            screen: isFatal ? 'global-handler-fatal' : 'global-handler',
          }),
        }).catch(() => {});
      } catch (e) {
        // ignore
      }
      if (previousHandler) previousHandler(error, isFatal);
    });
  }
} catch (e) {
  // ignore
}

// Wrap Firebase initialization in try-catch to prevent crashes
try {
  const messaging = require('@react-native-firebase/messaging').default;
  const {
    displayLocalNotification,
    saveNotification,
    shouldDisplayLocalNotificationFromBackground,
  } = require('./src/utils/notifications');

  messaging().setBackgroundMessageHandler(async remoteMessage => {
    try {
      await saveNotification(remoteMessage);
      if (shouldDisplayLocalNotificationFromBackground(remoteMessage)) {
        await displayLocalNotification(remoteMessage);
      }
    } catch (error) {
      console.log('Background message handler error:', error);
    }
  });
} catch (error) {
  console.log('Firebase messaging initialization error:', error);
}

// notifee REQUIRES a background event handler to be registered at the top level.
// Scheduled (trigger) reminders are delivered by notifee even when the app is
// closed; this handler lets the OS-delivered events (deliver/press/dismiss) be
// processed in the background without warnings or dropped notifications.
try {
  const notifee = require('@notifee/react-native').default;
  notifee.onBackgroundEvent(async () => {
    // No-op: the notification is already shown by the OS. We just need a
    // registered handler so background delivery/press events don't crash.
  });
} catch (error) {
  console.log('notifee background handler init error:', error);
}

AppRegistry.registerComponent(appName, () => App);

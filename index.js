/**
 * @format
 */

import 'react-native-reanimated';
import 'react-native-gesture-handler';
import { AppRegistry } from 'react-native';
import App from './App';
import { name as appName } from './app.json';

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

AppRegistry.registerComponent(appName, () => App);

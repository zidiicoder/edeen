import React, { useEffect } from 'react';
import { StyleSheet } from 'react-native';
import { SafeAreaProvider } from "react-native-safe-area-context";
import messaging from '@react-native-firebase/messaging';
import colors from './theme/colors';
import RootNavigator from './navigation/RootNavigator';
import {
  createDefaultNotificationChannel,
  createReminderNotificationChannel,
  displayLocalNotification,
  rescheduleSavedReminders,
  saveNotification,
} from './utils/notifications';

export default function App() {
  useEffect(() => {
    const initializeFirebase = async () => {
      try {
        await createDefaultNotificationChannel();
        await createReminderNotificationChannel();
        // Re-arm any reminders the user enabled (OS clears triggers on reboot).
        await rescheduleSavedReminders();

        const unsubscribeOnMessage = messaging().onMessage(async remoteMessage => {
          try {
            await saveNotification(remoteMessage);
            await displayLocalNotification(remoteMessage);
          } catch (error) {
            console.log('Error handling message:', error);
          }
        });

        const unsubscribeOnOpened = messaging().onNotificationOpenedApp(
          async remoteMessage => {
            try {
              if (remoteMessage) {
                await saveNotification(remoteMessage);
              }
            } catch (error) {
              console.log('Error handling notification opened:', error);
            }
          },
        );

        messaging()
          .getInitialNotification()
          .then(async remoteMessage => {
            try {
              if (remoteMessage) {
                await saveNotification(remoteMessage);
              }
            } catch (error) {
              console.log('Error getting initial notification:', error);
            }
          })
          .catch(error => {
            console.log('Error in getInitialNotification:', error);
          });

        return () => {
          unsubscribeOnMessage();
          unsubscribeOnOpened();
        };
      } catch (error) {
        console.log('Firebase initialization error:', error);
      }
    };

    initializeFirebase();
  }, []);

  return (
    <SafeAreaProvider style={styles.safe}>
      <RootNavigator />
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.background,
  },
});

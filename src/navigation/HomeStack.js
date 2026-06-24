import React, { useEffect, useState } from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import AsyncStorage from '@react-native-async-storage/async-storage';
import MainTabs from './MainTabs';
import HomeStartScreen, { HOME_START_SEEN_KEY } from '../features/home/screens/HomeStartScreen';
import HomeScreen from '../features/home/screens/HomeScreen';
import NotificationsScreen from '../features/home/screens/NotificationsScreen';
import ReminderScreen from '../features/home/screens/ReminderScreen';
import PrayerHistoryScreen from '../features/home/screens/PrayerHistoryScreen';
import QuranSummaryScreen from '../features/home/screens/QuranSummaryScreen';
import ProfileScreen from '../features/profile/screens/ProfileScreen';
import ProfileEditScreen from '../features/profile/screens/ProfileEditScreen';
import ShareAppScreen from '../features/profile/screens/ShareAppScreen';
import RateAppScreen from '../features/profile/screens/RateAppScreen';
import AboutScreen from '../features/profile/screens/AboutScreen';
import ContactScreen from '../features/profile/screens/ContactScreen';
import TermsScreen from '../features/profile/screens/TermsScreen';
import PrivacyScreen from '../features/profile/screens/PrivacyScreen';
import ChangePasswordScreen from '../features/profile/screens/ChangePasswordScreen';
import AppInfoScreen from '../features/onboarding/screens/AppInfoScreen';

const Stack = createNativeStackNavigator();

export default function HomeStack() {
  // Show the "40 Days Challenge" welcome only the first time. After the user
  // taps "Start Now" a flag is stored, and every later launch starts at MainTabs.
  const [initialRoute, setInitialRoute] = useState(null);

  useEffect(() => {
    AsyncStorage.getItem(HOME_START_SEEN_KEY)
      .then(v => setInitialRoute(v === 'true' ? 'MainTabs' : 'HomeStart'))
      .catch(() => setInitialRoute('HomeStart'));
  }, []);

  if (!initialRoute) {
    return null; // brief blank while the flag is read
  }

  return (
    <Stack.Navigator
      initialRouteName={initialRoute}
      screenOptions={{
        headerShown: false,
        // Swipe-back returns to the correct previous screen in the stack.
        gestureEnabled: true,
        fullScreenGestureEnabled: true,
      }}
    >
        <Stack.Screen name="HomeStart" component={HomeStartScreen} />
        <Stack.Screen name="MainTabs" component={MainTabs} />
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen name="Notifications" component={NotificationsScreen} />
        <Stack.Screen name="Reminder" component={ReminderScreen} />
        <Stack.Screen name="PrayerHistory" component={PrayerHistoryScreen} />
        <Stack.Screen name="QuranSummary" component={QuranSummaryScreen} />
        <Stack.Screen name="Profile" component={ProfileScreen} />
        <Stack.Screen name="ProfileEdit" component={ProfileEditScreen} />
        <Stack.Screen name="ShareApp" component={ShareAppScreen} />
        <Stack.Screen name="RateApp" component={RateAppScreen} />
        <Stack.Screen name="About" component={AboutScreen} />
        <Stack.Screen name="Contact" component={ContactScreen} />
        <Stack.Screen name="Terms" component={TermsScreen} />
        <Stack.Screen name="Privacy" component={PrivacyScreen} />
        <Stack.Screen name="ChangePassword" component={ChangePasswordScreen} />
        <Stack.Screen name="AppInfo" component={AppInfoScreen} />
    </Stack.Navigator>
  );
}

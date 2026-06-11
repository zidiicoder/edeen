import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import MainTabs from './MainTabs';
import HomeStartScreen from '../features/home/screens/HomeStartScreen';
import HomeScreen from '../features/home/screens/HomeScreen';
import NotificationsScreen from '../features/home/screens/NotificationsScreen';
import ReminderScreen from '../features/home/screens/ReminderScreen';
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
  return (
    <Stack.Navigator
      initialRouteName="HomeStart"
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

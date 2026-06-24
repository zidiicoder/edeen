import React from 'react';
import { useNavigation } from '@react-navigation/native';
import SwipeNavigationWrapper from '../../../../components/SwipeNavigationWrapper';
import HabitTrackerScreen from '../HabitTrackerScreen';

export default function HabitTrackerScreenWrapper() {
  const navigation = useNavigation();

  const handleSwipeLeft = () => {
    // Swipe left: Habit → Dua
    navigation.navigate('DuaBank');
  };

  // No swipe right handler (Habit is the first screen)

  return (
    <SwipeNavigationWrapper onSwipeLeft={handleSwipeLeft}>
      <HabitTrackerScreen />
    </SwipeNavigationWrapper>
  );
}

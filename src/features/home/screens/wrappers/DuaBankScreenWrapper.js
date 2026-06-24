import React from 'react';
import { useNavigation } from '@react-navigation/native';
import SwipeNavigationWrapper from '../../../../components/SwipeNavigationWrapper';
import DuaBankScreen from '../DuaBankScreen';

export default function DuaBankScreenWrapper() {
  const navigation = useNavigation();

  const handleSwipeLeft = () => {
    // Swipe left: Dua → Salah
    navigation.navigate('SalahTracker');
  };

  const handleSwipeRight = () => {
    // Swipe right: Dua → Habit
    navigation.navigate('HabitTracker');
  };

  return (
    <SwipeNavigationWrapper 
      onSwipeLeft={handleSwipeLeft}
      onSwipeRight={handleSwipeRight}
    >
      <DuaBankScreen />
    </SwipeNavigationWrapper>
  );
}

import React from 'react';
import { useNavigation } from '@react-navigation/native';
import SwipeNavigationWrapper from '../../../../components/SwipeNavigationWrapper';
import JournalScreen from '../JournalScreen';

export default function JournalScreenWrapper() {
  const navigation = useNavigation();

  const handleSwipeRight = () => {
    // Swipe right: Journal → Salah
    navigation.navigate('SalahTracker');
  };

  // No swipe left handler (Journal is the last screen)

  return (
    <SwipeNavigationWrapper onSwipeRight={handleSwipeRight}>
      <JournalScreen />
    </SwipeNavigationWrapper>
  );
}

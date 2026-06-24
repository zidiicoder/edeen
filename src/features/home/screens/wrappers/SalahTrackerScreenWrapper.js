import React from 'react';
import { useNavigation } from '@react-navigation/native';
import SwipeNavigationWrapper from '../../../../components/SwipeNavigationWrapper';
import SalahTrackerScreen from '../SalahTrackerScreen';

export default function SalahTrackerScreenWrapper() {
  const navigation = useNavigation();

  const handleSwipeLeft = () => {
    // Swipe left: Salah → Journal
    navigation.navigate('Journal');
  };

  const handleSwipeRight = () => {
    // Swipe right: Salah → Dua
    navigation.navigate('DuaBank');
  };

  return (
    <SwipeNavigationWrapper 
      onSwipeLeft={handleSwipeLeft}
      onSwipeRight={handleSwipeRight}
    >
      <SalahTrackerScreen navigation={navigation} />
    </SwipeNavigationWrapper>
  );
}

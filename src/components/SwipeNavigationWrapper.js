import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { runOnJS } from 'react-native-reanimated';
import { hapticTap } from '../utils/haptics';

/**
 * SwipeNavigationWrapper
 * Wraps a screen to enable left/right swipe gestures for navigation
 * 
 * @param {Object} props
 * @param {React.ReactNode} props.children - The screen content to wrap
 * @param {Function} props.onSwipeLeft - Callback when user swipes left (next screen)
 * @param {Function} props.onSwipeRight - Callback when user swipes right (previous screen)
 * @param {number} props.swipeThreshold - Minimum distance in pixels to trigger swipe (default: 50)
 */
export default function SwipeNavigationWrapper({
  children,
  onSwipeLeft,
  onSwipeRight,
  swipeThreshold = 50,
}) {
  const handleSwipeLeft = () => {
    if (onSwipeLeft) {
      hapticTap();
      onSwipeLeft();
    }
  };

  const handleSwipeRight = () => {
    if (onSwipeRight) {
      hapticTap();
      onSwipeRight();
    }
  };

  const panGesture = Gesture.Pan()
    .onEnd((event) => {
      const { translationX, velocityX } = event;
      
      // Swipe left (move to next screen)
      if (translationX < -swipeThreshold && velocityX < 0) {
        runOnJS(handleSwipeLeft)();
      }
      // Swipe right (move to previous screen)
      else if (translationX > swipeThreshold && velocityX > 0) {
        runOnJS(handleSwipeRight)();
      }
    })
    .activeOffsetX([-10, 10]); // Require minimum horizontal movement before recognizing gesture

  return (
    <GestureDetector gesture={panGesture}>
      <View style={styles.container}>
        {children}
      </View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

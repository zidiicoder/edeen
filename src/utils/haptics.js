import { Vibration, Platform } from 'react-native';

/**
 * Light haptic "tick" for tapping clickable buttons.
 *
 * Uses the built-in Vibration API (no extra native dependency). On Android a
 * short 12ms buzz reads as a subtle tap. iOS Vibration ignores the duration
 * and fires a full ~400ms buzz, which is too strong for a button tap, so it is
 * intentionally skipped there.
 */
export function hapticTap() {
  if (Platform.OS === 'android') {
    Vibration.vibrate(12);
  }
}

export default hapticTap;

import { Vibration, Platform } from 'react-native';

// Native haptics (UIImpactFeedbackGenerator on iOS, Vibrator on Android).
// Guarded so the app still runs (with a Vibration fallback) if the native
// module isn't linked yet.
let RNHaptic = null;
try {
  // eslint-disable-next-line global-require
  const mod = require('react-native-haptic-feedback');
  RNHaptic = mod?.default || mod || null;
} catch (e) {
  RNHaptic = null;
}

const HAPTIC_OPTIONS = {
  enableVibrateFallback: true,
  ignoreAndroidSystemSettings: false,
};

/**
 * Light haptic "tick" for tapping clickable buttons.
 * iOS: a subtle UIImpactFeedbackGenerator(.light). Android: a short vibration.
 */
export function hapticTap() {
  if (RNHaptic && typeof RNHaptic.trigger === 'function') {
    RNHaptic.trigger('impactLight', HAPTIC_OPTIONS);
    return;
  }
  // Fallback to the built-in Vibration API.
  if (Platform.OS === 'android') {
    Vibration.vibrate(12);
  } else {
    Vibration.vibrate();
  }
}

/**
 * Stronger "success" feedback — e.g. when the Qibla direction is found.
 */
export function hapticSuccess() {
  if (RNHaptic && typeof RNHaptic.trigger === 'function') {
    RNHaptic.trigger('notificationSuccess', HAPTIC_OPTIONS);
    return;
  }
  if (Platform.OS === 'android') {
    Vibration.vibrate([0, 60, 55, 130]);
  } else {
    Vibration.vibrate();
  }
}

export default hapticTap;

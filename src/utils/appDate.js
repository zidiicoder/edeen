import AsyncStorage from '@react-native-async-storage/async-storage';

const APP_START_DATE_KEY = 'app_start_date';

export function localYMD(date = new Date()) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

// The day the user first started using the app (≈ install / account-create day).
// Stored once on first launch and never moved earlier, so history/tracking views
// never show dates before the user joined.
export async function ensureAppStartDate() {
  try {
    const existing = await AsyncStorage.getItem(APP_START_DATE_KEY);
    if (existing) return existing;
    const today = localYMD();
    await AsyncStorage.setItem(APP_START_DATE_KEY, today);
    return today;
  } catch (e) {
    return localYMD();
  }
}

export async function getAppStartDate() {
  try {
    const v = await AsyncStorage.getItem(APP_START_DATE_KEY);
    return v || (await ensureAppStartDate());
  } catch (e) {
    return localYMD();
  }
}

# DEBUG VERSION 1.71 - Quran Tracker Navigation

## What's New in Version 1.71

This is a **debug version** with extensive console logging to help us understand why the back arrow navigation and today's date display are not working properly.

## Changes Made

### 1. Added Console Logs

I've added detailed console logs throughout the Quran tracker component that will show:

- **Initialization**: When the start date is being set
  - Whether it's using `user.created_at` from the backend
  - Or falling back to AsyncStorage
  - The calculated current week number

- **Week Navigation**: When you click the back/forward arrows
  - Current week number before navigation
  - New week number after navigation
  - Week start date for the displayed week

- **Date Rendering**: When displaying the week's dates
  - All 7 dates being displayed
  - Which date is recognized as "today"

### 2. Kept Previous Fix

The back arrow is still ALWAYS enabled (from version 1.70), allowing unlimited backward navigation.

## How to Use This Debug Version

### Step 1: Install the APK
Install `edeen-v1.71-debug.apk` on your device.

### Step 2: View the Logs

**Option A: Using Chrome DevTools (Recommended)**
1. Make sure your device is connected via USB with USB debugging enabled
2. Open Chrome on your computer
3. Go to `chrome://inspect`
4. You should see your device listed
5. Click "inspect" next to the Edeen app
6. Open the "Console" tab
7. Now navigate to the Quran Tracking page in the app
8. Watch the console for logs starting with `[QuranTracker]`

**Option B: Using React Native Debugger**
1. On your device, shake the phone to open the developer menu
2. Tap "Debug" or "Enable Remote JS Debugging"
3. This will open a browser window showing the logs

**Option C: Using ADB logcat**
```bash
adb logcat | grep -i "QuranTracker"
```

### Step 3: Test the Navigation
1. Open the Quran Tracking page
2. Look at the console logs - you should see:
   - `[QuranTracker] Initializing start date...`
   - `[QuranTracker] Using user.created_at:` or `Using AsyncStorage fallback:`
   - `[QuranTracker] Current week number: X`
   
3. Click the **back arrow** (left arrow)
4. Watch for these logs:
   - `[QuranTracker] Going to previous week. Current: X`
   - `[QuranTracker] New week number: Y`
   - `[QuranTracker] Week start date for week Y:`

4. Look at the dates displayed - check if today's date is showing
   - You should see: `[QuranTracker] Rendering week dates: [array of dates]`
   - And: `[QuranTracker] Today check: {todayDate: ..., isTodayResults: [...]}`

## What We're Looking For

### Issue 1: Back Arrow Not Working
If the back arrow isn't working, the logs will tell us:
- Is the `currentWeekNumber` changing when you click?
- What week number is it calculating?
- What date range is being displayed?

### Issue 2: Today's Date Hidden
The logs will show:
- What dates are being rendered this week
- Which date is being identified as "today"
- Whether today's date is in the current week being displayed

## Expected Logs Example

When you open the Quran Tracking page, you should see something like:

```
[QuranTracker] Initializing start date...
[QuranTracker] user.created_at: 2026-06-13T00:00:00.000Z
[QuranTracker] Using user.created_at: Fri Jun 13 2026 00:00:00 GMT+0000
[QuranTracker] Today: Mon Jun 22 2026 00:00:00 GMT+0000
[QuranTracker] Account created: Fri Jun 13 2026 00:00:00 GMT+0000
[QuranTracker] Current week number: 1
[QuranTracker] Week start date for week 1: Fri Jun 20 2026
[QuranTracker] Rendering week dates: ["2026-06-20", "2026-06-21", "2026-06-22", ...]
[QuranTracker] Today check: {todayDate: Mon Jun 22 2026, isTodayResults: [false, false, true, ...]}
```

When you click the back arrow:
```
[QuranTracker] Going to previous week. Current: 1
[QuranTracker] New week number: 0
[QuranTracker] Week start date for week 0: Fri Jun 13 2026
[QuranTracker] Rendering week dates: ["2026-06-13", "2026-06-14", "2026-06-15", ...]
```

## Next Steps

Once you share the console logs, I will be able to:
1. Identify exactly why the back arrow isn't working
2. Understand why today's date is hidden
3. Fix the root cause issue

## Files Modified

- `src/features/home/components/tracking/TrackingQuranPanel.js` - Added console logs
- `android/app/build.gradle` - Version bumped to 1.71

## APK Location

`e:\edeen\edeen-v1.71-debug.apk`

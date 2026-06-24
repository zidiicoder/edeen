# How to View React Native Logs - Simple Guide

## Method 1: Chrome DevTools (Easiest - Recommended)

### Step 1: Enable USB Debugging on Your Phone
1. Go to **Settings** → **About Phone**
2. Tap **Build Number** 7 times to enable Developer Options
3. Go back to **Settings** → **Developer Options**
4. Enable **USB Debugging**

### Step 2: Connect Your Phone
1. Connect your Android phone to your computer using a USB cable
2. On your phone, when prompted "Allow USB debugging?", tap **OK**

### Step 3: Open Chrome DevTools
1. Open **Google Chrome** on your computer
2. In the address bar, type: `chrome://inspect`
3. Press Enter
4. You should see your phone listed under "Remote Target"
5. Look for "com.edeen" or your app name
6. Click **"inspect"** next to it

### Step 4: View the Logs
1. A new window will open (Chrome DevTools)
2. Click on the **"Console"** tab at the top
3. Now open the **Quran Tracking** page in your app
4. You will see logs appearing in the console!
5. Look for logs that start with `[QuranTracker]`

### Step 5: Test and Share
1. Click the **back arrow** in the Quran Tracker
2. Watch the console for new logs
3. **Take a screenshot** of the console showing the logs
4. Share the screenshot so I can see what's happening

---

## Method 2: Android Studio Logcat (Alternative)

### If you have Android Studio installed:
1. Open **Android Studio**
2. Click **View** → **Tool Windows** → **Logcat**
3. Connect your phone via USB
4. Select your device from the dropdown
5. In the search box, type: `QuranTracker`
6. Open the Quran Tracking page in your app
7. You'll see the logs appearing

---

## Method 3: Command Line (ADB)

### If you have ADB installed:
1. Open **Command Prompt** (Windows) or **Terminal** (Mac/Linux)
2. Run this command:
   ```
   adb logcat | findstr QuranTracker
   ```
3. Open the Quran Tracking page in your app
4. Logs will appear in the terminal

---

## What to Look For

When you open the Quran Tracking page, you should see logs like:

```
[QuranTracker] Initializing start date...
[QuranTracker] user.created_at: 2026-06-13...
[QuranTracker] Current week number: 1
[QuranTracker] Week start date for week 1: ...
```

When you click the back arrow:
```
[QuranTracker] Going to previous week. Current: 1
[QuranTracker] New week number: 0
```

---

## Troubleshooting

### "I don't see my device in chrome://inspect"
- Make sure USB debugging is enabled on your phone
- Try unplugging and reconnecting the USB cable
- On your phone, make sure you selected "File Transfer" or "MTP" mode (not "Charging only")

### "I see the device but not the app"
- Make sure the app is running on your phone
- Try closing and reopening the app

### "I see too many logs"
- In the Chrome DevTools console, use the filter box
- Type: `QuranTracker`
- This will show only the logs we need

---

## Quick Summary

**Easiest way:**
1. Enable USB debugging on phone
2. Connect phone to computer
3. Open Chrome → `chrome://inspect`
4. Click "inspect"
5. Look at the Console tab
6. Open Quran Tracker in the app
7. Take screenshots of the logs

That's it! Share the screenshots with the logs and I'll be able to fix the issue.

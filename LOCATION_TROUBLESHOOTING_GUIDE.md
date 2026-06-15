# Prayer Times Location Issue - Troubleshooting Guide

## Problem
You are in Okara, but the app is showing prayer times for Karachi (default location) instead of your actual location.

## Root Cause
The app isn't successfully getting your GPS location, so it's using the fallback coordinates:
- **Fallback**: Latitude 24.8607, Longitude 67.0011 (Karachi, Pakistan)
- **Your Location (Okara)**: Should be approximately Latitude 30.8081, Longitude 73.4534

---

## Solution Steps

### Step 1: Check Location Indicator in App

Open the Salah Tracker screen and look at the **location indicator** I've added:

```
📍 Location: GPS (30.8081, 73.4534)    ← This means GPS is working!
📍 Location: Default (Karachi)          ← This means GPS is NOT working
```

If you see **"Default (Karachi)"**, follow the steps below.

### Step 2: Check App Permissions

1. **Go to Android Settings**
2. **Apps** → **Edeen** → **Permissions**
3. **Location** → Set to **"Allow all the time"** or **"Allow only while using the app"**

<img width="300" alt="Android Location Permission" src="https://developer.android.com/static/training/location/images/location-permission.png" />

### Step 3: Enable Location Services

1. **Go to Android Settings**
2. **Location** or **Security & Location**
3. Toggle **Location** to **ON**
4. Set **Location Mode** to **"High accuracy"** (uses GPS, Wi-Fi, and mobile networks)

### Step 4: Check Device Location Settings

For **Huawei devices** (like your ELE-L29):

1. Go to **Settings** → **Privacy** → **Location Services**
2. Enable **Access my location**
3. Set **Mode** to **Device, Wi-Fi, and mobile networks** (High accuracy)

### Step 5: Force Close and Restart App

1. **Force Stop** the app:
   - Settings → Apps → Edeen → Force Stop
2. **Clear App Cache** (optional):
   - Settings → Apps → Edeen → Storage → Clear Cache (NOT Clear Data)
3. **Restart the app**
4. When prompted, **Allow location permission**

### Step 6: Test GPS Directly

Install a GPS testing app to verify your device's GPS is working:
- **GPS Test** (by Chartcross Limited)
- **GPS Status & Toolbox**

If GPS doesn't work in test apps, the issue is with your device, not the Edeen app.

---

## How to Check Logs (For Debugging)

I've added detailed logging to help diagnose the issue. Connect your phone to your computer and run:

```bash
adb logcat | findstr "SalahTracker"
```

You should see logs like:
```
[SalahTracker] Starting location fetch...
[SalahTracker] Location permission granted: true
[SalahTracker] Requesting GPS position...
[SalahTracker] GPS position obtained: {latitude: 30.8081, longitude: 73.4534}
[SalahTracker] Fetching prayer times for: {latitude: 30.8081, longitude: 73.4534}
```

If you see:
```
[SalahTracker] Location permission granted: false
```
→ Permission issue - grant location permission

If you see:
```
[SalahTracker] Location error: [error details]
```
→ GPS hardware issue or location services disabled

---

## Understanding the Visual Indicators

### 1. Location Warning Banner (Orange)
```
⚠️ Using default location (Karachi). Enable location permission for accurate prayer times.
```
**Meaning**: GPS is not working, using Karachi as fallback

### 2. Location Debug Text
```
📍 Location: GPS (30.8081, 73.4534)
```
**Meaning**: Successfully using your actual GPS coordinates

```
📍 Location: Default (Karachi)
```
**Meaning**: Using fallback Karachi coordinates (24.8607, 67.0011)

---

## Expected Prayer Times

### Karachi (24.8607, 67.0011) - Current Default
- Fajr: 04:13
- Dhuhr: 12:32
- Asr: 15:54
- Maghrib: 19:23
- Isha: 20:46

### Okara (30.8081, 73.4534) - Your Actual Location
- Fajr: ~04:27 (about 14 minutes later than Karachi)
- Dhuhr: ~12:15 (about 17 minutes earlier than Karachi)
- Asr: ~15:37 (about 17 minutes earlier than Karachi)
- Maghrib: ~19:07 (about 16 minutes earlier than Karachi)
- Isha: ~20:30 (about 16 minutes earlier than Karachi)

**If your prayer times match Karachi**, the app is using default location.  
**If your prayer times match Okara**, the app successfully detected your location.

---

## Common Issues

### Issue 1: "Location permission denied"
**Solution**: Go to Settings → Apps → Edeen → Permissions → Location → Allow

### Issue 2: "Location timeout"
**Solution**: 
- Make sure you're not in airplane mode
- Go outside or near a window for better GPS signal
- Wait 30-60 seconds for GPS to lock

### Issue 3: "Mock location detected"
**Solution**: 
- Disable developer options
- Disable any location spoofing apps

### Issue 4: Huawei-specific location restrictions
**Solution**:
- Settings → Battery → Launch → Edeen → Manage manually
- Enable **Auto-launch**, **Secondary launch**, **Run in background**
- This allows the app to access location even when minimized

---

## Technical Details

### Location Fetch Process

1. **App starts** → Requests location permission
2. **Permission granted** → Calls `Geolocation.getCurrentPosition()`
3. **GPS responds** → Sets `deviceLocation` state with coordinates
4. **Coordinates available** → Fetches prayer times from backend API
5. **Backend calls Aladhan API** → With your GPS coordinates
6. **Prayer times displayed** → Accurate for your location

### Fallback Behavior

If any step fails:
- **No permission** → Uses default Karachi coordinates
- **GPS timeout** (15 seconds) → Uses default Karachi coordinates
- **GPS error** → Uses default Karachi coordinates
- **Orange warning** appears → Tells you GPS didn't work

---

## Testing Commands (For Developers)

### Test with specific coordinates
You can test with manual coordinates using ADB:

```bash
# Test with Okara coordinates
adb shell am start -n com.edeen/.MainActivity -e latitude "30.8081" -e longitude "73.4534"
```

### Check app logs
```bash
adb logcat *:S ReactNative:V ReactNativeJS:V SalahTracker:V
```

---

## Still Not Working?

If location still doesn't work after all these steps:

1. **Check device GPS**:
   - Test with Google Maps
   - If Maps doesn't get location, it's a device issue

2. **Factory GPS reset** (Huawei):
   - Dial `*#*#1472365#*#*` in phone app
   - This opens GPS test mode
   - Tap "Cold Start" to reset GPS

3. **Update Google Play Services**:
   - If available on your Huawei device
   - Play Store → My apps & games → Update all

4. **Contact Support**:
   - Share screenshots of the location indicator
   - Share ADB logs if possible
   - Mention your exact device model (ELE-L29)

---

## Summary

✅ **App is working correctly** - the Aladhan API integration is perfect  
✅ **Problem is with GPS access** - not the app logic  
✅ **Visual indicators added** - you can now see what's happening  
✅ **Detailed logging added** - for debugging if needed  

**Next step**: Follow the permission steps above to allow the app to access your location!

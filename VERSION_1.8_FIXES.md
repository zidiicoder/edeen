# Version 1.8 - Critical Fixes

**Release Date:** June 17, 2026  
**Build:** Version Code 8, Version Name 1.8

---

## Issues Fixed

### 1. ✅ FIXED: Wrong Current Prayer Time After Isha

**Problem:** 
- At 10:35 PM (after Isha at 8:41 PM), the app showed "Current Salah Time: Asr 15:43"
- This was because the server timezone was set to UTC instead of Pakistan time
- When it's 10:35 PM in Pakistan (PKT = UTC+5), it's only 5:35 PM UTC
- So the server thought it was still between Asr (3:43 PM) and Maghrib (7:10 PM)

**Solution:**
- Changed server timezone from UTC to Asia/Karachi in `/laravel/.env`
- Updated `APP_TIMEZONE=Asia/Karachi`
- Cleared all server caches (Laravel cache and bootstrap cache)
- Now the server correctly identifies current/upcoming prayers based on Pakistan time

**Expected Behavior Now:**
- At 10:35 PM: Shows "Current: Isha" and "Upcoming: Fajr (tomorrow)"
- After Isha passes: Always shows Isha as current, Fajr as upcoming
- Before Fajr (early morning): Shows yesterday's Isha as current, today's Fajr as upcoming

---

### 2. ✅ FIXED: Checkboxes Cannot Be Unchecked

**Problem:**
- Once a prayer checkbox was ticked (marked as performed), it could not be unchecked
- Users could not correct mistakes

**Root Cause:**
- Backend validation used `'sometimes'` rule, making fields optional
- When sending `false` to uncheck, the field might not be properly processed

**Solution:**
- Changed all validation rules from `'sometimes'` to `'required'`
- Now all 6 prayer fields (tahajud, fajr, dhuhr, asr, maghrib, isha) must be sent with every update
- Frontend already sends all fields, so this ensures `false` values are properly saved

**File Changed:**
- `backend/app/Http/Controllers/Api/SalahController.php`

**Expected Behavior Now:**
- Click checkbox once: ✓ (checked/performed)
- Click checkbox again: ☐ (unchecked/not performed)
- Can toggle checkboxes on and off freely

---

### 3. ✅ FIXED: Tahajjud Missing from Prayer History

**Problem:**
- Prayer History screen showed only 5 prayers (Fajr, Dhuhr, Asr, Maghrib, Isha)
- Tahajjud was missing from the summary and detail view
- Completion percentage calculated as X/5 instead of X/6

**Solution:**
- Added Tahajjud to summary statistics card at top
- Updated completion calculation to include Tahajjud (now shows X/6 instead of X/5)
- Updated percentage calculation to divide by 6 instead of 5
- Tahajjud already existed in the detail prayer grid, just needed summary inclusion

**File Changed:**
- `src/features/home/screens/PrayerHistoryScreen.js`

**Expected Behavior Now:**
- Summary card shows 6 prayer counts: Tahajjud, Fajr, Dhuhr, Asr, Maghrib, Isha
- Daily completion shows "3/6" format (including Tahajjud)
- Percentage calculated correctly (e.g., 3/6 = 50%, not 3/5 = 60%)

---

## Files Modified

### Backend (Server)
1. `/home/u963776255/domains/edeenapp.co.uk/laravel/.env`
   - Changed `APP_TIMEZONE=UTC` to `APP_TIMEZONE=Asia/Karachi`

2. `/home/u963776255/domains/edeenapp.co.uk/laravel/app/Http/Controllers/Api/SalahController.php`
   - Changed validation rules from `'sometimes'` to `'required'` for all prayer fields

3. `/home/u963776255/domains/edeenapp.co.uk/laravel/app/Services/PrayerTimeService.php`
   - Improved currentAndUpcoming logic (already fixed in previous version)

### Frontend (App)
1. `src/features/home/screens/PrayerHistoryScreen.js`
   - Added Tahajjud to summary statistics
   - Updated completion calculation: X/6 instead of X/5
   - Updated percentage calculation: divide by 6 instead of 5

2. `android/app/build.gradle`
   - Updated versionCode from 7 to 8
   - Updated versionName from "1.7" to "1.8"

---

## Testing Instructions

1. **Test Current Prayer Time:**
   - Open app after 8:41 PM (after Isha)
   - Should show "Current Salah Time: Isha 20:41"
   - Should show "Next Prayer: Fajr" (tomorrow's time)

2. **Test Checkbox Toggle:**
   - Tap any prayer checkbox to check it ✓
   - Tap the same checkbox again to uncheck it ☐
   - Verify it toggles properly both ways

3. **Test Prayer History:**
   - Tap "View Prayer History" button
   - Verify summary shows 6 prayers including Tahajjud
   - Verify completion shows "X/6" format
   - Verify percentage calculates correctly

---

## Server Cache Cleared

- Laravel cache: `/storage/framework/cache/data/*`
- Bootstrap cache: `/bootstrap/cache/*.php`
- Prayer time cache automatically cleared (12-hour TTL)

---

## Installation

**Device:** Huawei ELE-L29 (ID: 53F0219313005060)  
**Version:** 1.8 (Build 8)  
**Installed:** Successfully via `adb install -r`

---

## What Users Will See

✅ Correct current prayer time based on Pakistan timezone  
✅ Ability to check and uncheck prayer boxes  
✅ Complete prayer history with Tahajjud included  
✅ Accurate completion percentages (X/6)  
✅ No more "tomorrow" times - only current date prayers  
✅ Prayer History button to view past records  

---

**STATUS:** All 3 critical issues resolved and deployed ✅

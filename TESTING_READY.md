# ✅ Test Environment Ready

## Database Setup Complete

Successfully created test data on **LIVE SERVER** for testing the new Quran Tracker weekly system.

---

## Test User Account

- **Email**: forcann66@gmail.com
- **User ID**: 2
- **Account Created**: June 13, 2026
- **Status**: ✅ Ready for testing

---

## Test Data Summary

### ✅ Week 0: June 13-19, 2026 (First week after account creation)

| Date | Day | Status | 
|------|-----|--------|
| Jun 13 (Fri) | 0 | ✅ Read |
| Jun 14 (Sat) | 1 | ✅ Read |
| Jun 15 (Sun) | 2 | ❌ Missed |
| Jun 16 (Mon) | 3 | ✅ Read |
| Jun 17 (Tue) | 4 | ❌ Missed |
| Jun 18 (Wed) | 5 | ✅ Read |
| Jun 19 (Thu) | 6 | ❌ Missed |

**Week 0 Result**: 4/7 days read (57%)

### ✅ Week 1: June 20-26, 2026 (Current week)

| Date | Day | Status | 
|------|-----|--------|
| Jun 20 (Fri) | 7 | ✅ Read |
| Jun 21 (Sat) | 8 | ❌ Missed |
| Jun 22 (Sun) | 9 | ✅ Read ← **TODAY** |
| Jun 23 (Mon) | 10 | 🔒 Future (locked) |
| Jun 24 (Tue) | 11 | 🔒 Future (locked) |
| Jun 25 (Wed) | 12 | 🔒 Future (locked) |
| Jun 26 (Thu) | 13 | 🔒 Future (locked) |

**Week 1 Result**: 2/3 days read so far (67%)

### Overall Statistics
- **Total days tracked**: 10 days
- **Days with Quran read**: 6 days ✅
- **Days missed**: 4 days ❌
- **Future days locked**: 4 days 🔒

---

## Next Steps for Testing

### Step 1: Set App Start Date

The app needs to know the user's install date. Choose one method:

#### **Method A: Add Temporary Code** (Recommended - Easiest)

1. Open `src/features/home/components/tracking/TrackingQuranPanel.js`

2. Add this `useEffect` at line 120 (after the existing useEffect for `getAppStartDate`):

```javascript
// TEMPORARY: Force test start date - REMOVE AFTER TESTING
useEffect(() => {
  AsyncStorage.setItem('app_start_date', '2026-06-13').then(() => {
    console.log('Test start date set to June 13, 2026');
    // Recalculate current week after setting date
    const d = new Date('2026-06-13');
    d.setHours(0, 0, 0, 0);
    setStartDate(d);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const weekNum = getWeekNumberFromStart(today, d);
    setCurrentWeekNumber(weekNum);
  });
}, []);
```

3. Ensure AsyncStorage is imported at the top:
```javascript
import AsyncStorage from '@react-native-async-storage/async-storage';
```

4. Rebuild app: `.\gradlew.bat assembleRelease --no-daemon` (in android folder)

5. Install: `adb install -r android\app\build\outputs\apk\release\app-release.apk`

6. Log in with forcann66@gmail.com

7. **IMPORTANT**: After testing, remove this code and rebuild!

#### **Method B: Using React Native Debugger**

1. Log in to app with forcann66@gmail.com
2. Open React Native Debugger
3. In console, run:
```javascript
AsyncStorage.setItem('app_start_date', '2026-06-13');
```
4. Restart the app

---

### Step 2: Test the Features

Open the app and go to **Tracking Quran** tab.

#### ✅ Test 1: Initial Display (Current Week)
**Expected:**
- Shows "Jun 20-26, 2026" as week label
- Shows "This Week: 2/7 days" 
- Progress bar at ~29% (2 out of 7)
- Jun 20: ✅ Checked
- Jun 21: ☐ Empty checkbox
- Jun 22: ✅ Checked (TODAY - highlighted)
- Jun 23-26: Grayed out and locked (future dates)
- Right arrow: DISABLED (already at current week)
- Left arrow: ENABLED
- No "This Week" button (already at current week)

#### ✅ Test 2: Navigate to Previous Week (Week 0)
**Actions:**
1. Click LEFT arrow

**Expected:**
- Week changes to "Jun 13-19, 2026"
- Shows "This Week: 4/7 days"
- Progress bar at ~57% (4 out of 7)
- Jun 13: ✅ Checked
- Jun 14: ✅ Checked
- Jun 15: ☐ Empty
- Jun 16: ✅ Checked
- Jun 17: ☐ Empty
- Jun 18: ✅ Checked
- Jun 19: ☐ Empty
- All days are clickable (past dates, not locked)
- Left arrow: DISABLED (can't go before Week 0)
- Right arrow: ENABLED
- "This Week" button: VISIBLE (to jump back to current week)

#### ✅ Test 3: Navigate Back to Current Week
**Actions:**
1. From Week 0, click "This Week" button OR click RIGHT arrow

**Expected:**
- Returns to "Jun 20-26, 2026"
- Shows "This Week: 2/7 days"
- Same state as Test 1
- "This Week" button disappears

#### ✅ Test 4: Toggle Past Day (Week 0)
**Actions:**
1. Navigate to Week 0
2. Click on Jun 15 (currently empty ☐)
3. Navigate to Week 1 and back to Week 0

**Expected:**
- Jun 15 becomes checked ✅
- Counter updates to "5/7 days"
- Progress bar updates to ~71%
- After navigating away and back, Jun 15 stays checked
- Database should have new record

#### ✅ Test 5: Toggle Current Week Day
**Actions:**
1. On Week 1, click on Jun 21 (currently empty ☐)
2. Navigate to Week 0 and back to Week 1

**Expected:**
- Jun 21 becomes checked ✅
- Counter updates to "3/7 days"
- Progress bar updates to ~43%
- After navigating away and back, Jun 21 stays checked

#### ✅ Test 6: Try to Toggle Future Day (Should Fail)
**Actions:**
1. On Week 1, try to click on Jun 23, 24, 25, or 26

**Expected:**
- Nothing happens (locked)
- Days stay grayed out
- No checkbox appears
- Counter doesn't change

#### ✅ Test 7: Week Boundary Constraints
**Expected:**
- At Week 0: Left arrow DISABLED, Right arrow ENABLED
- At Week 1: Left arrow ENABLED, Right arrow DISABLED
- Can't navigate beyond these boundaries

---

## Expected vs Current System

### Old System (Broken)
- ❌ Week started on Monday (calendar week)
- ❌ Auto-advanced every Monday
- ❌ Couldn't properly view previous weeks
- ❌ Not aligned with user's install date

### New System (Fixed)
- ✅ Week starts from user's install/account creation date
- ✅ Week 0 is first 7 days, Week 1 is next 7 days, etc.
- ✅ No auto-advance - manually navigate with arrows
- ✅ Can scroll through all previous weeks
- ✅ Can't go beyond current week (future weeks locked)
- ✅ Future days within current week are locked

---

## Database Verification

If you want to verify the data directly in the database:

```bash
ssh -p 65002 u963776255@77.37.37.189
mysql -u u963776255_app_edeen -p u963776255_e_deen_app
# Password: tMee5Xis$xG.B27

# View all records
SELECT date, `read` FROM quran_reads WHERE user_id = 2 ORDER BY date;

# Check a specific week
SELECT date, `read` FROM quran_reads 
WHERE user_id = 2 
  AND date BETWEEN '2026-06-13' AND '2026-06-19' 
ORDER BY date;
```

---

## Troubleshooting

### Issue: Week shows wrong dates
**Solution**: Check that `app_start_date` in AsyncStorage is set to `2026-06-13`

### Issue: All past weeks are empty
**Solution**: Database data might not be synced. Check:
1. User is logged in as forcann66@gmail.com (user_id = 2)
2. Database has the records (verify with SQL above)
3. API is fetching correctly (check Network tab)

### Issue: Can toggle future dates
**Solution**: This is a bug - future dates should be locked. Check `isFutureDate()` function.

### Issue: Wrong week number displayed
**Solution**: Check `getWeekNumberFromStart()` calculation. Should be:
- Today (Jun 22) - Install (Jun 13) = 9 days
- 9 days ÷ 7 = 1.28... → Week 1 (floor)

---

## Files Created

1. ✅ `setup_test_user.sql` - SQL script to create test data
2. ✅ `verify_test_data.sql` - SQL script to verify data
3. ✅ `QURAN_TRACKER_WEEK_FIX.md` - Technical documentation
4. ✅ `TEST_USER_SETUP.md` - Detailed setup instructions
5. ✅ `SET_TEST_START_DATE.js` - Code snippet for setting test date
6. ✅ `TESTING_READY.md` - This file (testing checklist)

---

## Version Info

- **App Version**: 1.65
- **Test User**: forcann66@gmail.com (ID: 2)
- **Install Date**: June 13, 2026
- **Today's Date**: June 22, 2026
- **Current Week**: Week 1 (June 20-26)
- **Database**: Live production database (u963776255_e_deen_app)

---

## ⚠️ Important Reminders

1. **Remove test code after testing** - The temporary useEffect to set start date should be removed before production build
2. **Test on actual device** - Not just emulator
3. **Test network sync** - Ensure data saves to backend correctly
4. **Test offline behavior** - What happens if no network connection?
5. **Clean up test data** - After testing, you may want to clean up the test records if needed

---

## Success Criteria

The new system works correctly if:

✅ Week 0 shows June 13-19 with 4/7 days marked as read
✅ Week 1 shows June 20-26 with 2/7 days marked as read (so far)
✅ Can navigate between Week 0 and Week 1 using arrows
✅ Cannot navigate before Week 0 (left arrow disabled)
✅ Cannot navigate beyond Week 1 (right arrow disabled)
✅ Future dates (Jun 23-26) are locked and cannot be toggled
✅ Past dates can be toggled and sync to database
✅ "This Week" button appears only when viewing past weeks
✅ Data persists after navigation and app restart
✅ Week boundaries are based on install date (June 13), not calendar weeks

---

**Ready to test!** 🚀

Let me know if you encounter any issues or if the behavior doesn't match expectations.

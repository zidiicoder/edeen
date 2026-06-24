# Test User Setup for Quran Tracker

## Database Changes Made

Successfully created test data on **live server** database for testing the new weekly Quran tracking system.

### Test Account Details
- **Email**: forcann66@gmail.com
- **User ID**: 2
- **Account Created Date**: June 13, 2026 (set in database)
- **Install Date (for app)**: Should be set to June 13, 2026 on device

---

## Database Records Created

### User Account
- Updated `created_at` to: **2026-06-13 00:00:00**
- This simulates account creation on June 13, 2026

### Quran Reading Records

#### **Week 0: June 13-19, 2026** (First week - Days 0-6)
| Date | Day # | Read? | Notes |
|------|-------|-------|-------|
| Jun 13 | 0 | ✅ Yes | Account creation day |
| Jun 14 | 1 | ✅ Yes | |
| Jun 15 | 2 | ❌ No | Missed day |
| Jun 16 | 3 | ✅ Yes | |
| Jun 17 | 4 | ❌ No | Missed day |
| Jun 18 | 5 | ✅ Yes | |
| Jun 19 | 6 | ❌ No | Missed day |

**Week 0 Summary**: 4 out of 7 days read

#### **Week 1: June 20-26, 2026** (Current week - Days 7-13)
| Date | Day # | Read? | Notes |
|------|-------|-------|-------|
| Jun 20 | 7 | ✅ Yes | Start of Week 1 |
| Jun 21 | 8 | ❌ No | Missed day |
| Jun 22 | 9 | ✅ Yes | TODAY |
| Jun 23 | 10 | - | Future (locked) |
| Jun 24 | 11 | - | Future (locked) |
| Jun 25 | 12 | - | Future (locked) |
| Jun 26 | 13 | - | Future (locked) |

**Week 1 Summary**: 2 out of 3 days read so far (future days locked)

### Total Summary
- **Total records**: 10 days
- **Days read**: 6 days ✅
- **Days not read**: 4 days ❌

---

## App Setup Required

### IMPORTANT: Set App Start Date on Device

The app stores the install date in AsyncStorage. You need to manually set this for the test user to match the database:

**Option 1: Clear App Data and Login**
1. Uninstall the app completely from device
2. Reinstall version 1.65
3. Before logging in, the app will set today (June 22) as start date
4. You'll need to manually update AsyncStorage to June 13 instead

**Option 2: Update AsyncStorage Directly** (Recommended)
1. Log in to the app with forcann66@gmail.com
2. Using React Native Debugger or development tools, execute:
   ```javascript
   import AsyncStorage from '@react-native-async-storage/async-storage';
   await AsyncStorage.setItem('app_start_date', '2026-06-13');
   ```
3. Restart the app

**Option 3: Add Temporary Debug Code** (Easiest)
Add this code temporarily to `TrackingQuranPanel.js`:

```javascript
// TEMPORARY: Force start date for testing
useEffect(() => {
  AsyncStorage.setItem('app_start_date', '2026-06-13');
}, []);
```

Then rebuild and install the app.

---

## Expected Behavior When Testing

### When Opening Tracking Quran Page:

1. **Current Display**
   - Should show **Week 1: June 20-26, 2026**
   - "This Week: 2/7 days" (Jun 20 and 22 marked as read)
   - Progress bar showing 2/7 completion
   - Days 20, 21, 22 should be available to toggle
   - Days 23, 24, 25, 26 should be locked (future dates)

2. **Left Arrow Navigation** (Go to Previous Week)
   - Click left arrow
   - Should show **Week 0: June 13-19, 2026**
   - "This Week: 4/7 days" (Jun 13, 14, 16, 18 marked as read)
   - All 7 days should be available to view/toggle
   - "This Week" button should appear to go back to current week
   - Left arrow should be DISABLED (can't go before Week 0)

3. **Right Arrow Navigation** (Go to Next Week)
   - From Week 0, click right arrow
   - Should return to **Week 1: June 20-26, 2026**
   - Right arrow should be DISABLED (can't go beyond current week)

4. **"This Week" Button**
   - Should only appear when viewing Week 0
   - Clicking it should jump back to Week 1 (current week)

5. **Toggle Days**
   - Toggle days in Week 0 - should save and update counter
   - Toggle days 20, 21, 22 in Week 1 - should save
   - Try to toggle future days (23-26) - should be locked/disabled
   - Navigate between weeks - changes should persist

---

## Test Cases

### ✅ Test Case 1: Initial Load
- [ ] App loads and shows Week 1 (June 20-26)
- [ ] Shows "2/7 days" counter
- [ ] Jun 20 and 22 have checkmarks
- [ ] Jun 21 has empty checkbox
- [ ] Jun 23-26 are grayed out (future/locked)

### ✅ Test Case 2: Navigate to Week 0
- [ ] Click left arrow
- [ ] Week changes to June 13-19
- [ ] Shows "4/7 days" counter
- [ ] Jun 13, 14, 16, 18 have checkmarks
- [ ] Jun 15, 17, 19 have empty checkboxes
- [ ] "This Week" button appears
- [ ] Left arrow is disabled

### ✅ Test Case 3: Navigate Back to Current Week
- [ ] From Week 0, click right arrow (or "This Week" button)
- [ ] Returns to Week 1 (June 20-26)
- [ ] Right arrow is disabled
- [ ] "This Week" button disappears

### ✅ Test Case 4: Toggle Past Days
- [ ] Navigate to Week 0
- [ ] Toggle Jun 15 (should mark as read)
- [ ] Counter updates to "5/7 days"
- [ ] Toggle Jun 15 again (should unmark)
- [ ] Counter updates to "4/7 days"
- [ ] Changes persist when navigating away and back

### ✅ Test Case 5: Toggle Current Week Days
- [ ] On Week 1, toggle Jun 21
- [ ] Counter updates to "3/7 days"
- [ ] Try to toggle Jun 23 (future) - should not work
- [ ] Navigate to Week 0 and back - Jun 21 should still be marked

### ✅ Test Case 6: Week Boundaries
- [ ] Verify can't go before Week 0 (left arrow disabled)
- [ ] Verify can't go beyond current week (right arrow disabled)
- [ ] Week label correctly shows date ranges

---

## Database Verification

To verify the database has the correct data, run on server:

```bash
ssh -p 65002 u963776255@77.37.37.189
mysql -u u963776255_app_edeen -p u963776255_e_deen_app

SELECT date, `read` FROM quran_reads WHERE user_id = 2 ORDER BY date;
```

Expected output:
```
2026-06-13 | 1
2026-06-14 | 1
2026-06-15 | 0
2026-06-16 | 1
2026-06-17 | 0
2026-06-18 | 1
2026-06-19 | 0
2026-06-20 | 1
2026-06-21 | 0
2026-06-22 | 1
```

---

## Credentials

### SSH Access
- **Host**: 77.37.37.189
- **Port**: 65002
- **Username**: u963776255
- **Password**: tMee5Xis$xG.B27

### Database Access
- **Database**: u963776255_e_deen_app
- **Username**: u963776255_app_edeen
- **Password**: tMee5Xis$xG.B27

### Test User Login
- **Email**: forcann66@gmail.com
- **User ID**: 2
- **Password**: [Use the existing password for this account]

---

## Files Created

1. `setup_test_user.sql` - SQL script used to create test data (uploaded to server)
2. `TEST_USER_SETUP.md` - This documentation file
3. `QURAN_TRACKER_WEEK_FIX.md` - Technical documentation of the fix

---

## Notes

- All dates are set for **2026** to match the current system date
- The test data simulates realistic usage patterns (some days read, some missed)
- Week 0 is complete (7 days of data)
- Week 1 is partial (3 days so far, 4 future days locked)
- Future days (Jun 23-26) have no database records and should be locked in UI
- The app will prevent toggling future dates automatically

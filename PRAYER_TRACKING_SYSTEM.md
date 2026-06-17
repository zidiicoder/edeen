# Prayer Tracking System - Complete Guide

## Overview
The Edeen app provides a comprehensive prayer (Salah) tracking system that allows users to:
- View current and upcoming prayer times based on their GPS location
- Mark prayers as completed with checkboxes
- View prayer history stored in the database
- See tomorrow's time for prayers that have passed

---

## Features Implemented

### 1. Real-Time Prayer Times ✅
- **Source**: Aladhan API (https://api.aladhan.com/v1)
- **Method**: Muslim World League (method=3)
- **Location**: GPS-based automatic location detection
- **Prayers Tracked**:
  - Tahajjud (optional night prayer)
  - Fajr (dawn)
  - Dhuhr (noon)
  - Asr (afternoon)
  - Maghrib (sunset)
  - Isha (night)

### 2. Smart Time Display ✅
- **Current Prayer**: Shows the most recent prayer time that has started
- **Next Prayer**: Shows the upcoming prayer
- **Time Until Next**: Calculates and displays countdown (e.g., "19h 16m")
- **Passed Prayers**: Automatically shows tomorrow's time for prayers that have passed
- **Tomorrow Indicator**: Shows "(Tomorrow)" label next to passed prayer times

### 3. Prayer Completion Tracking ✅
- **Checkboxes**: Each prayer has a checkbox to mark it as completed
- **Database Storage**: All completions are saved to the database
- **User-Specific**: Each user has their own prayer records
- **Date-Based**: Records are stored per date for historical tracking
- **Real-Time Sync**: Instantly updates when user clicks checkbox

### 4. Database Structure ✅

#### Table: `salah_records`
```sql
CREATE TABLE salah_records (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_id BIGINT NOT NULL,
    date DATE NOT NULL,
    fajr_performed BOOLEAN DEFAULT FALSE,
    dhuhr_performed BOOLEAN DEFAULT FALSE,
    asr_performed BOOLEAN DEFAULT FALSE,
    maghrib_performed BOOLEAN DEFAULT FALSE,
    isha_performed BOOLEAN DEFAULT FALSE,
    tahajud_performed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP,
    updated_at TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    UNIQUE KEY unique_user_date (user_id, date)
);
```

---

## API Endpoints

### 1. Get Current & Upcoming Prayer
```http
GET /api/salah/current-upcoming
Query Parameters:
  - latitude: decimal (required)
  - longitude: decimal (required)

Response:
{
  "status": "success",
  "data": {
    "current_salah": {
      "name": "Dhuhr",
      "start_time": "12:06"
    },
    "upcoming_salah": {
      "name": "Asr",
      "start_time": "15:43"
    }
  }
}
```

### 2. Get Prayer Times for Date
```http
GET /api/salah/timings
Query Parameters:
  - latitude: decimal (required)
  - longitude: decimal (required)
  - date: YYYY-MM-DD (optional, defaults to today)

Response:
{
  "status": "success",
  "data": {
    "timings": {
      "Fajr": "03:26",
      "Sunrise": "05:05",
      "Dhuhr": "12:06",
      "Asr": "15:43",
      "Maghrib": "19:10",
      "Isha": "20:41"
    }
  }
}
```

### 3. Get Prayer Records
```http
GET /api/salah/records
Query Parameters:
  - date: YYYY-MM-DD (optional, defaults to today)
Headers:
  - Authorization: Bearer {token}

Response:
{
  "status": "success",
  "data": {
    "salah_record": {
      "id": 1,
      "date": "2026-06-17",
      "fajr_performed": true,
      "dhuhr_performed": true,
      "asr_performed": false,
      "maghrib_performed": false,
      "isha_performed": false,
      "tahajud_performed": true
    }
  }
}
```

### 4. Update Prayer Records
```http
PUT /api/salah/records
Headers:
  - Authorization: Bearer {token}
  - Content-Type: application/json
Body:
{
  "date": "2026-06-17",
  "fajr_performed": true,
  "dhuhr_performed": true,
  "asr_performed": false,
  "maghrib_performed": false,
  "isha_performed": false,
  "tahajud_performed": false
}

Response:
{
  "status": "success",
  "message": "Salah record saved.",
  "data": {
    "salah_record": {
      "id": 1,
      "date": "2026-06-17",
      "fajr_performed": true,
      ...
    }
  }
}
```

---

## Frontend Implementation

### Files Modified

#### 1. `SalahTrackerScreen.js`
**Changes**:
- ✅ Removed duplicate "Next: Asr at 15:43" text
- ✅ Kept "Next Prayer" and "Starts In" cards
- ✅ Maintained GPS-based location detection
- ✅ Integrated with prayer tracking panel

**Location**: `src/features/home/screens/SalahTrackerScreen.js`

#### 2. `TrackingSalahPanel.js`
**Changes**:
- ✅ Added tomorrow's time display for passed prayers
- ✅ Shows "(Tomorrow)" label for passed prayers
- ✅ Checkbox integration with database
- ✅ Real-time prayer time fetching

**Location**: `src/features/home/components/tracking/TrackingSalahPanel.js`

---

## How It Works

### Prayer Time Calculation Flow

```
1. User opens Salah screen
   ↓
2. App requests GPS location permission
   ↓
3. App prompts user to enable location services
   ↓
4. GPS coordinates obtained (lat, lng)
   ↓
5. Frontend calls: GET /api/salah/current-upcoming?latitude=X&longitude=Y
   ↓
6. Backend calls Aladhan API with coordinates
   ↓
7. Backend caches response for 12 hours
   ↓
8. Backend calculates current & upcoming prayers
   ↓
9. Frontend displays prayer times
   ↓
10. Frontend checks current time vs prayer times
   ↓
11. If prayer time passed → fetch tomorrow's time
   ↓
12. Display times with "(Tomorrow)" label
```

### Checkbox Tracking Flow

```
1. User clicks checkbox for a prayer (e.g., Fajr)
   ↓
2. UI immediately updates (optimistic update)
   ↓
3. Frontend calls: PUT /api/salah/records
   ↓
4. Backend finds or creates record for user + date
   ↓
5. Backend updates fajr_performed = true
   ↓
6. Backend saves to database
   ↓
7. Frontend receives confirmation
   ↓
8. If error → revert UI to previous state
```

---

## Tomorrow Time Logic

### Problem
When it's 8:27 PM (current time in screenshot):
- Fajr (3:26 AM) - **PASSED** ❌
- Dhuhr (12:06 PM) - **PASSED** ❌
- Asr (3:43 PM) - **PASSED** ❌
- Maghrib (7:10 PM) - **PASSED** ❌
- Isha (8:41 PM) - **UPCOMING** ✅

### Solution
```javascript
// Check if prayer time has passed
const now = new Date();
const currentTime = now.getHours() * 60 + now.getMinutes();

const [hours, minutes] = prayer.time.split(':').map(Number);
const prayerTime = hours * 60 + minutes;

if (currentTime > prayerTime) {
  // Prayer has passed → show tomorrow's time
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  
  // Fetch tomorrow's times from API
  const tomorrowTimes = await getTomorrowPrayerTimes();
  
  // Display with "(Tomorrow)" label
  displayTime = tomorrowTimes.find(t => t.name === prayer.name);
}
```

---

## UI Improvements Made

### Before ❌
```
Current Salah Time: Dhuhr
12:06

Next Prayer: Asr
Starts In: 19h 16m

Next: Asr at 15:43    ← DUPLICATE!

Prayer Times:
- Fajr: 03:26         ← Shows today's time (already passed)
- Dhuhr: 12:06        ← Shows today's time (already passed)
- Asr: 15:43
- Maghrib: 19:10
- Isha: 20:41
```

### After ✅
```
Current Salah Time: Dhuhr
12:06

Next Prayer: Asr
Starts In: 19h 16m

Prayer Times:
- Fajr (Tomorrow): 03:26    ← Tomorrow's time!
- Dhuhr (Tomorrow): 12:06   ← Tomorrow's time!
- Asr: 15:43
- Maghrib: 19:10
- Isha: 20:41
```

---

## Database Records Example

### User Prayer History
```json
[
  {
    "id": 1,
    "user_id": 2,
    "date": "2026-06-17",
    "fajr_performed": true,
    "dhuhr_performed": true,
    "asr_performed": false,
    "maghrib_performed": false,
    "isha_performed": false,
    "tahajud_performed": true
  },
  {
    "id": 2,
    "user_id": 2,
    "date": "2026-06-16",
    "fajr_performed": true,
    "dhuhr_performed": true,
    "asr_performed": true,
    "maghrib_performed": true,
    "isha_performed": true,
    "tahajud_performed": false
  }
]
```

### Viewing User's Prayer Statistics

**Query Example**:
```sql
-- Get prayer completion rate for last 30 days
SELECT 
    COUNT(*) as total_days,
    SUM(fajr_performed) as fajr_count,
    SUM(dhuhr_performed) as dhuhr_count,
    SUM(asr_performed) as asr_count,
    SUM(maghrib_performed) as maghrib_count,
    SUM(isha_performed) as isha_count,
    SUM(tahajud_performed) as tahajud_count
FROM salah_records
WHERE user_id = 2
  AND date >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
  AND date <= CURDATE();
```

---

## Testing the System

### Test 1: Check Current/Upcoming Prayer
```bash
# Get your current location coordinates
# Example: London (51.5074, -0.1278)

curl -X GET "https://edeenapp.co.uk/api/salah/current-upcoming?latitude=51.5074&longitude=-0.1278" \
  -H "Accept: application/json"
```

### Test 2: Mark Prayer as Completed
```bash
curl -X PUT "https://edeenapp.co.uk/api/salah/records" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "date": "2026-06-17",
    "fajr_performed": true,
    "dhuhr_performed": false,
    "asr_performed": false,
    "maghrib_performed": false,
    "isha_performed": false,
    "tahajud_performed": false
  }'
```

### Test 3: View Prayer History
```bash
curl -X GET "https://edeenapp.co.uk/api/salah/records?date=2026-06-17" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Accept: application/json"
```

---

## Future Enhancements

### Potential Features
1. **Prayer Statistics Dashboard**
   - Monthly completion percentage
   - Streak tracking (consecutive days)
   - Most consistent prayer
   - Visual charts and graphs

2. **Notifications**
   - Reminder 10 minutes before each prayer
   - Daily prayer completion summary
   - Motivational messages

3. **Qibla Direction**
   - Compass pointing to Mecca
   - Integrated with prayer times

4. **Prayer History Export**
   - Export to CSV/PDF
   - Share on social media
   - Email reports

5. **Community Features**
   - Compare with friends
   - Local mosque times
   - Group challenges

---

## Troubleshooting

### Issue: Prayer times not updating
**Solution**: Check GPS permissions and location services

### Issue: Checkboxes not saving
**Solution**: Verify user is logged in (Bearer token present)

### Issue: Wrong prayer times
**Solution**: Ensure correct GPS coordinates are being sent

### Issue: Tomorrow times not showing
**Solution**: Check device time is correct and API is responding

---

## Files Reference

### Backend
- `backend/app/Http/Controllers/Api/SalahController.php` - API endpoints
- `backend/app/Services/PrayerTimeService.php` - Aladhan API integration
- `backend/app/Models/SalahRecord.php` - Database model
- `backend/routes/api.php` - API routes

### Frontend
- `src/features/home/screens/SalahTrackerScreen.js` - Main screen
- `src/features/home/components/tracking/TrackingSalahPanel.js` - Prayer list & checkboxes
- `src/utils/api.js` - API client

### Documentation
- `ALADHAN_API_DOCUMENTATION.md` - Aladhan API details
- `ALADHAN_IMPLEMENTATION_GUIDE.md` - Implementation guide
- `PRAYER_TRACKING_SYSTEM.md` - This document

---

**Status**: ✅ Fully Implemented  
**Database**: ✅ Prayer records saved  
**Tomorrow Times**: ✅ Showing for passed prayers  
**Duplicate Text**: ✅ Removed  
**Ready for Production**: Yes

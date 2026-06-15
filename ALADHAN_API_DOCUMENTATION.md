# Aladhan API Integration - Complete Documentation

## Overview
Your Edeen app is **already using the Aladhan API** (https://aladhan.com/) for prayer times. The integration is complete and working properly.

## Backend Implementation

### 1. Configuration (`backend/config/services.php`)
```php
'aladhan' => [
    'base_url' => 'https://api.aladhan.com/v1',
    'method' => (int) env('PRAYER_TIMES_METHOD', 3),
],
```

### 2. Environment Settings (`backend/.env`)
```
PRAYER_TIMES_METHOD=3
```

**Calculation Methods Available:**
- `1` = University of Islamic Sciences, Karachi
- `2` = Islamic Society of North America (ISNA)
- `3` = Muslim World League (MWL) - **Currently Active**
- `4` = Umm Al-Qura University, Makkah
- `5` = Egyptian General Authority of Survey
- `7` = Institute of Geophysics, University of Tehran
- `8` = Gulf Region
- `9` = Kuwait
- `10` = Qatar
- `11` = Majlis Ugama Islam Singapura, Singapore
- `12` = Union Organization islamic de France
- `13` = Diyanet İşleri Başkanlığı, Turkey
- `14` = Spiritual Administration of Muslims of Russia

### 3. Service Class (`backend/app/Services/PrayerTimeService.php`)

The `PrayerTimeService` class handles:
- Fetching prayer times from Aladhan API
- Caching results for 12 hours
- Determining current and upcoming prayers
- Formatting times to HH:MM format

**Key Methods:**
- `timings(latitude, longitude, date)` - Get all prayer times for a specific date
- `currentAndUpcoming(latitude, longitude)` - Get current and next prayer

### 4. API Endpoints (`backend/routes/api.php`)

**GET** `/api/salah/timings?latitude={lat}&longitude={lon}&date={YYYY-MM-DD}`
- Returns all prayer times for a specific date
- Requires authentication (Bearer token)

**GET** `/api/salah/current-upcoming?latitude={lat}&longitude={lon}`
- Returns current and upcoming prayer times
- Requires authentication (Bearer token)

**GET** `/api/salah/records?date={YYYY-MM-DD}`
- Returns user's salah tracking record
- Requires authentication (Bearer token)

**POST/PUT** `/api/salah/records`
- Update user's salah tracking
- Requires authentication (Bearer token)

## Frontend Implementation

### Location-Based Prayer Times
The `SalahTrackerScreen.js` automatically:
1. Requests location permission
2. Gets user's GPS coordinates
3. Fetches prayer times from backend API using those coordinates
4. Displays current and upcoming prayers
5. Caches location for notification scheduling

### API Call Flow
```javascript
const res = await request({
  url: `salah/current-upcoming?latitude=${latitude}&longitude=${longitude}`,
  method: 'GET'
});
```

Response format:
```json
{
  "message": "Current and upcoming prayer fetched.",
  "data": {
    "current_salah": {
      "name": "Dhuhr",
      "start_time": "12:32"
    },
    "upcoming_salah": {
      "name": "Asr",
      "start_time": "15:54"
    }
  }
}
```

## Aladhan API Details

### Base URL
`https://api.aladhan.com/v1`

### Example Direct API Call
```bash
curl "https://api.aladhan.com/v1/timings/15-06-2026?latitude=24.8607&longitude=67.0011&method=3"
```

### Response Structure (from Aladhan)
```json
{
  "code": 200,
  "status": "OK",
  "data": {
    "timings": {
      "Fajr": "04:13",
      "Sunrise": "05:42",
      "Dhuhr": "12:32",
      "Asr": "15:54",
      "Sunset": "19:23",
      "Maghrib": "19:23",
      "Isha": "20:46",
      "Imsak": "04:03",
      "Midnight": "00:33"
    },
    "date": { ... },
    "meta": {
      "latitude": 24.8607,
      "longitude": 67.0011,
      "timezone": "Asia/Karachi",
      "method": {
        "id": 3,
        "name": "Muslim World League",
        "params": {
          "Fajr": 18,
          "Isha": 17
        }
      }
    }
  }
}
```

## Testing

### Test Backend API (requires user authentication)
```bash
# Get access token first
TOKEN=$(curl -s -X POST "https://edeenapp.co.uk/api/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"forcann66@gmail.com","password":"Abcd@123"}' | \
  jq -r '.data.token')

# Get current/upcoming prayer times
curl -X GET "https://edeenapp.co.uk/api/salah/current-upcoming?latitude=24.8607&longitude=67.0011" \
  -H "Authorization: Bearer $TOKEN"
```

### Test Aladhan API Directly (no authentication needed)
```bash
# Current date prayer times for Karachi coordinates
curl "https://api.aladhan.com/v1/timings/$(date +%d-%m-%Y)?latitude=24.8607&longitude=67.0011&method=3"
```

## Caching

Prayer times are cached for **12 hours** using this cache key format:
```
prayer:{latitude}:{longitude}:{date}:{method}
```

Example: `prayer:24.8607:67.0011:15-06-2026:3`

To clear cache on server:
```bash
cd /home/u963776255/domains/edeenapp.co.uk/laravel
/opt/alt/php83/usr/bin/php artisan cache:clear
```

## Changing Calculation Method

To change the prayer calculation method:

1. Edit `backend/.env`:
```bash
PRAYER_TIMES_METHOD=2  # Change to desired method (1-14)
```

2. Clear cache:
```bash
/opt/alt/php83/usr/bin/php artisan config:cache
/opt/alt/php83/usr/bin/php artisan cache:clear
```

3. Changes take effect immediately for new requests

## Troubleshooting

### Prayer times not showing
1. Check user has location permission enabled
2. Verify GPS coordinates are being obtained
3. Check network connectivity
4. Verify authentication token is valid
5. Check Laravel logs: `backend/storage/logs/laravel.log`

### Wrong prayer times
1. Verify correct calculation method in `.env`
2. Check latitude/longitude accuracy
3. Clear backend cache
4. Test with Aladhan API directly to verify calculations

### API timeout
The frontend has a 12-second timeout for prayer time requests. If network is slow:
1. Check server connectivity
2. Verify Aladhan API is accessible from server
3. Check for firewall issues

## API Rate Limits

**Aladhan API is free and has no API key requirement**, but respect fair usage:
- Cache results appropriately (currently 12 hours)
- Don't make excessive requests
- Use the date parameter for future/past dates

## Summary

✅ **Your app is fully integrated with Aladhan API**
✅ **No API keys needed** - Aladhan is a free public API
✅ **Backend handles all API calls** - Frontend just requests from your Laravel backend
✅ **Automatic caching** - Reduces API calls and improves performance
✅ **Location-based** - Uses GPS for accurate prayer times
✅ **Configurable** - Easy to change calculation method via .env

The implementation is complete and production-ready!

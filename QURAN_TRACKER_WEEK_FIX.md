# Quran Tracker Weekly System Fix

## Issue Description

The Tracking Quran page had the following problems:
1. **Date auto-advancing**: The week was automatically advancing day-by-day based on calendar weeks (Monday start)
2. **No proper week boundaries**: Week started on Monday regardless of when user installed/created account
3. **Can't scroll previous weeks properly**: Previous weeks couldn't be accessed properly because it was constrained to calendar weeks
4. **Week not based on user's start date**: Should start from the day user installed app or created account

## Solution Implemented

### Complete Redesign of Week System

Changed from **calendar-based weeks** to **user-based weeks**:

**Before:**
- Weeks always started on Monday (calendar week)
- Auto-advanced when Monday arrived
- Constrained navigation based on calendar weeks
- Week boundaries not aligned with user's install date

**After:**
- Weeks start from user's app install/account creation date
- Each week is a complete 7-day period from that start date
- Week 0: Day 0-6 from install date
- Week 1: Day 7-13 from install date
- Week 2: Day 14-20 from install date
- And so on...
- Users can scroll through all previous weeks using left/right arrows
- Current week is calculated based on which 7-day period today falls into

### Key Changes Made

#### 1. Removed Calendar Week Logic

**Removed:**
```javascript
function getStartOfWeek(date) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day; // Monday as first day
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}
```

#### 2. Added User-Based Week Calculation

**Added:**
```javascript
// Calculate which week number (0-indexed) a given date falls into based on app start date
function getWeekNumberFromStart(date, appStartDate) {
  if (!appStartDate) return 0;
  const diffTime = date.getTime() - appStartDate.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  return Math.floor(diffDays / 7);
}

// Get the start date of a specific week number (0-indexed) from app start date
function getWeekStartDate(appStartDate, weekNumber) {
  const start = new Date(appStartDate);
  start.setDate(start.getDate() + (weekNumber * 7));
  return start;
}
```

#### 3. Changed State Management

**Before:**
```javascript
const [weekStart, setWeekStart] = useState(() => getStartOfWeek(new Date()));
```

**After:**
```javascript
const [startDate, setStartDate] = useState(null); // install / account-create day
const [currentWeekNumber, setCurrentWeekNumber] = useState(0); // 0-indexed week number
```

#### 4. Removed Auto-Advance Timer

**Removed entire useEffect** that was advancing the week automatically on Monday:
```javascript
// This entire block was removed
useEffect(() => {
  const updateToCurrentWeek = () => {
    setWeekStart(getStartOfWeek(new Date()));
  };
  // Timer that fires on Monday midnight
  const mondayTimer = setTimeout(() => {
    updateToCurrentWeek();
    const weeklyInterval = setInterval(updateToCurrentWeek, 7 * 24 * 60 * 60 * 1000);
    return () => clearInterval(weeklyInterval);
  }, msUntilMonday);
  return () => clearTimeout(mondayTimer);
}, []);
```

#### 5. Simplified Navigation Logic

**Before:** Complex date manipulation
```javascript
const goToPreviousWeek = () => {
  if (!canGoPrevious) return;
  const prev = new Date(weekStart);
  prev.setDate(prev.getDate() - 7);
  setWeekStart(prev);
};
```

**After:** Simple week number increment/decrement
```javascript
const goToPreviousWeek = () => {
  if (!canGoPrevious) return;
  setCurrentWeekNumber(prev => prev - 1);
};

const goToNextWeek = () => {
  if (!canGoNext) return;
  setCurrentWeekNumber(prev => prev + 1);
};
```

#### 6. Updated Navigation Constraints

**Before:** Could go back arbitrarily
**After:** 
- Can only go back if `currentWeekNumber > 0` (can't go before week 0)
- Can only go forward if not at current week
- Right arrow disabled when at current week
- Left arrow disabled when at week 0

### How It Works Now

1. **On First Load:**
   - Retrieve user's app start date from AsyncStorage
   - Calculate today's week number: `floor(daysSinceInstall / 7)`
   - Display that week

2. **Week Display:**
   - Week 0: Shows days 0-6 from install date
   - Week 1: Shows days 7-13 from install date
   - Week N: Shows days (N×7) to (N×7+6) from install date

3. **Navigation:**
   - Left arrow: Goes to previous week (disabled at week 0)
   - Right arrow: Goes to next week (disabled at current week)
   - "This Week" button: Jumps to current week (only shows when not at current week)

4. **Date Range Label:**
   - Dynamically shows the date range for the displayed week
   - Format: "Jun 22-28, 2026" or "Jun 22 - Jul 5, 2026" (if spans months)

### Benefits

✅ **Consistent Tracking**: Weeks always start from user's install date
✅ **No Auto-Advance**: Week only changes when user navigates or reopens app
✅ **Full History Access**: Can scroll back to week 0 (first week)
✅ **Clear Boundaries**: Each week is exactly 7 days from install date
✅ **Intuitive Navigation**: Simple left/right arrows with clear constraints
✅ **Accurate Progress**: "This Week" counter always shows current week's progress

## Files Modified

1. **src/features/home/components/tracking/TrackingQuranPanel.js**
   - Removed calendar week logic
   - Added user-based week calculation
   - Updated state management
   - Removed auto-advance timer
   - Simplified navigation functions
   - Updated navigation constraints

2. **android/app/build.gradle**
   - Updated version: `1.64` → `1.65`

## Testing

✅ **Build**: Android version 1.65 built successfully
✅ **Install**: APK installed on device
✅ **Version**: Verified version 1.65 on device

## Next Steps for User Testing

1. Open the app and go to "Tracking Quran" tab
2. Verify the week starts from your install date
3. Test left arrow to navigate to previous weeks
4. Test right arrow (should be disabled at current week)
5. Test "This Week" button to return to current week
6. Mark some days as read and verify they save correctly
7. Navigate to a previous week and verify previous activity is shown
8. Verify future dates are still locked and cannot be marked

## Technical Notes

- Week numbers are 0-indexed (Week 0 is the first week)
- Install date is stored in AsyncStorage under `app_start_date` key
- Week calculation uses integer division: `floor(daysSinceInstall / 7)`
- Navigation is disabled beyond boundaries (week 0 and current week)
- Date comparisons use midnight (00:00:00) for consistency

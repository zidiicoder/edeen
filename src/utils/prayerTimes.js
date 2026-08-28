// On-device prayer time calculation — matches how privacy-focused prayer apps
// (e.g. Pillars) work: astronomical calculation happens entirely on the phone
// from GPS coordinates + the device clock, with no network round-trip and no
// location data ever leaving the device.
import {
  CalculationMethod,
  Coordinates,
  HighLatitudeRule,
  Madhab,
  PrayerTimes,
} from 'adhan';

const HIJRI_MONTHS = [
  'Muharram',
  'Safar',
  "Rabi' al-awwal",
  "Rabi' al-thani",
  'Jumada al-awwal',
  'Jumada al-thani',
  'Rajab',
  "Sha'ban",
  'Ramadan',
  'Shawwal',
  "Dhu al-Qi'dah",
  'Dhu al-Hijjah',
];

// Fajr/Isha calculation method. Moonsighting Committee everywhere — verified
// against a real Pillars app screenshot (London) and matched its times to the
// minute; it's also a latitude-adaptive method by design, so it doesn't need
// the per-region switching a fixed-angle method (e.g. Muslim World League)
// would. Asr stays Hanafi (a deliberate choice for this app's audience — see
// PRAYER_TIMES_SCHOOL in the backend .env.example).
export function getCalculationMethod(latitude, longitude) {
  return CalculationMethod.MoonsightingCommittee();
}

function formatLocalTime(date) {
  if (!date) return null;
  const h = String(date.getHours()).padStart(2, '0');
  const m = String(date.getMinutes()).padStart(2, '0');
  return `${h}:${m}`;
}

/**
 * Computes a full day's prayer timings entirely on-device.
 * Returns { Fajr, Sunrise, Dhuhr, Asr, Maghrib, Isha } as "HH:MM" in the
 * device's local time — no network request, no location sent anywhere.
 */
export function computeDayTimings(latitude, longitude, date = new Date()) {
  const coordinates = new Coordinates(Number(latitude), Number(longitude));
  const params = getCalculationMethod(latitude, longitude);
  params.madhab = Madhab.Hanafi;
  params.highLatitudeRule = HighLatitudeRule.recommended(coordinates);

  const times = new PrayerTimes(coordinates, date, params);

  return {
    Fajr: formatLocalTime(times.fajr),
    Sunrise: formatLocalTime(times.sunrise),
    Dhuhr: formatLocalTime(times.dhuhr),
    Asr: formatLocalTime(times.asr),
    Maghrib: formatLocalTime(times.maghrib),
    Isha: formatLocalTime(times.isha),
  };
}

/**
 * Gregorian -> Hijri conversion using the tabular (civil) Islamic calendar —
 * the same "mathematical" method the app previously requested from Aladhan
 * (PRAYER_HIJRI_METHOD=MATHEMATICAL), so dates stay consistent. Typically
 * within a day of local moon-sighting-based dates.
 */
export function computeHijriDate(date = new Date()) {
  const day = date.getDate();
  const month = date.getMonth() + 1;
  const year = date.getFullYear();

  const jd =
    Math.floor((1461 * (year + 4800 + Math.floor((month - 14) / 12))) / 4) +
    Math.floor((367 * (month - 2 - 12 * Math.floor((month - 14) / 12))) / 12) -
    Math.floor((3 * Math.floor((year + 4900 + Math.floor((month - 14) / 12)) / 100)) / 4) +
    day -
    32075;

  let l = jd - 1948442 + 10632;
  const n = Math.floor((l - 1) / 10631);
  l = l - 10631 * n + 354;
  const j =
    Math.floor((10985 - l) / 5316) * Math.floor((50 * l) / 17719) +
    Math.floor(l / 5670) * Math.floor((43 * l) / 15238);
  l =
    l -
    Math.floor((30 - j) / 15) * Math.floor((17719 * j) / 50) -
    Math.floor(j / 16) * Math.floor((15238 * j) / 43) +
    29;
  const hMonth = Math.floor((24 * l) / 709);
  const hDay = l - Math.floor((709 * hMonth) / 24);
  const hYear = 30 * n + j - 30;

  const monthName = HIJRI_MONTHS[hMonth - 1] || '';

  return {
    day: hDay,
    month: monthName,
    year: hYear,
    formatted: `${hDay} ${monthName} ${hYear}`.trim(),
  };
}

/**
 * Full day payload matching the previous backend/Aladhan response shape, so
 * existing screens/components need no change beyond the source of the data.
 */
export function computePrayerPayload(latitude, longitude, date = new Date()) {
  return {
    timings: computeDayTimings(latitude, longitude, date),
    hijri: computeHijriDate(date),
  };
}

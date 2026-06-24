/**
 * Handles batch errors from validation or API response
 * @param {Object} error - error object from Yup or API
 * @param {Function} setErrors - React state setter for errors
 * @returns {Object} normalized errors object
 */
export const handleBatchErrors = (error, setErrors) => {
  let normalizedErrors = {};

  // If Yup Validation Error
  if (error.inner && Array.isArray(error.inner)) {
    error.inner.forEach((err) => {
      if (!normalizedErrors[err.path]) {
        normalizedErrors[err.path] = err.message;
      }
    });
  }

  // If Laravel API validation errors (common format: error.response.data.errors)
  if (error.response?.data?.errors) {
    const apiErrors = error.response.data.errors;
    Object.keys(apiErrors).forEach((key) => {
      normalizedErrors[key] = apiErrors[key][0]; // Take first message
    });
  }
  if (typeof setErrors === "function") {
    setErrors(normalizedErrors);
  }

  return normalizedErrors;
};


/**
 * format date
*/

export const formatDate = (inputDate) => {
  const formattedDate = new Date(inputDate).toISOString().split('T')[0];
  return formattedDate;
};

export const formatDateYYMMDD = (date) => {
  const d = new Date(date || Date.now());

  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

export const formatPrayerTimes = (timings) => {
  if (!timings) return [];

  // Sunrise is shown right after Fajr (it is not a prayer, just a time marker).
  return [
    { key: 'fajr', label: 'Fajr', time: timings.Fajr },
    { key: 'sunrise', label: 'Sunrise', time: timings.Sunrise },
    { key: 'dhuhr', label: 'Dhuhr', time: timings.Dhuhr },
    { key: 'asr', label: 'Asr', time: timings.Asr },
    { key: 'maghrib', label: 'Maghrib', time: timings.Maghrib },
    { key: 'isha', label: 'Isha', time: timings.Isha },
  ].filter(item => item.time);
};
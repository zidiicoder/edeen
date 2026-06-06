export const COMMON_FILTERS = ['All', 'Day', 'Week', 'Month', '40 Days', 'Custom'];

export function toApiFilter(value) {
  if (value === '40 Days') return '40_days';
  if (value === 'Custom') return 'custom';
  return String(value || 'all').toLowerCase();
}

export function toApiDate(date) {
  if (!date) return '';
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return '';
  return d.toISOString().split('T')[0];
}

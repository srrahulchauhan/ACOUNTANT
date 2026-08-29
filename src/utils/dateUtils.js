export const getLocalDateString = (date = new Date()) => {
  const d = new Date(date);
  const offset = d.getTimezoneOffset();
  const localDate = new Date(d.getTime() - (offset * 60 * 1000));
  return localDate.toISOString().split('T')[0];
};

export const addMonthsToDate = (dateStr, months) => {
  if (!dateStr) return '';
  const parts = dateStr.split('-');
  if (parts.length !== 3) return dateStr;
  const year = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10) - 1; // 0-indexed
  const day = parseInt(parts[2], 10);

  const numMonths = parseInt(months || 0, 10);
  const d = new Date(year, month + numMonths, day);
  
  // Handle edge cases like Jan 31 -> Feb 28
  if (d.getDate() !== day) {
    d.setDate(0);
  }
  return getLocalDateString(d);
};

export const calculateMonthsBetween = (startDateStr, endDateStr) => {
  if (!startDateStr || !endDateStr) return 1;
  const start = new Date(startDateStr);
  const end = new Date(endDateStr);
  const months = (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth());
  return months > 0 ? months : 1;
};


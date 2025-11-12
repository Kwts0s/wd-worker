/**
 * Get default scheduled dropoff time (current time + minutes)
 * @param minutesFromNow - Number of minutes to add from current time
 * @returns ISO string of the calculated time
 */
export function getDefaultScheduledTime(minutesFromNow: number = 60): string {
  const now = new Date();
  now.setMinutes(now.getMinutes() + minutesFromNow);
  return now.toISOString();
}

/**
 * Check if a scheduled time is more than 1 hour in the future
 * @param scheduledTime - ISO string of the scheduled time
 * @returns true if more than 1 hour in the future
 */
export function isScheduledMoreThanOneHour(scheduledTime: string): boolean {
  if (!scheduledTime) return false;
  
  const scheduled = new Date(scheduledTime);
  const now = new Date();
  const oneHourFromNow = new Date(now.getTime() + 60 * 60 * 1000);
  
  return scheduled > oneHourFromNow;
}

/**
 * Format a date/time to display in a specific timezone
 * @param isoString - ISO string of the date/time
 * @param timezone - IANA timezone string (e.g., 'Europe/Athens')
 * @returns Formatted date/time string
 */
export function formatTimeInTimezone(isoString: string, timezone: string = 'Europe/Athens'): string {
  if (!isoString) return '';
  
  try {
    const date = new Date(isoString);
    return date.toLocaleString('en-US', {
      timeZone: timezone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
  } catch (error) {
    console.error('Error formatting time in timezone:', error);
    return isoString;
  }
}

/**
 * Convert local datetime-local input to ISO string
 * @param localDateTime - Value from datetime-local input
 * @returns ISO string
 */
export function localDateTimeToISO(localDateTime: string): string {
  if (!localDateTime) return '';
  
  try {
    // Parse the local datetime string and create a Date object
    const date = new Date(localDateTime);
    return date.toISOString();
  } catch (error) {
    console.error('Error converting local datetime to ISO:', error);
    return '';
  }
}

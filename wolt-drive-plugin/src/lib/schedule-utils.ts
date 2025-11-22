import { VenueSchedule } from './settings-store';

/**
 * Calculate the scheduled dropoff time based on venue hours
 * If current time is outside venue hours, schedule for next day opening time
 * @param venueSchedule - The venue's opening hours
 * @param timezone - The timezone (default: 'Europe/Athens')
 * @param preparationMinutes - Minimum preparation time in minutes (default: 60)
 */
export function calculateScheduledDropoffTime(
  venueSchedule: VenueSchedule,
  timezone: string = 'Europe/Athens',
  preparationMinutes: number = 60
): string {
  const now = new Date();
  
  // Add 15-minute safety buffer to prevent "too early" errors
  // This accounts for API processing time, network delays, and clock skew
  const safetyBufferMs = 15 * 60 * 1000;
  const baseTime = new Date(now.getTime() + safetyBufferMs);
  
  // Parse venue hours
  const [openHour, openMinute] = venueSchedule.openTime.split(':').map(Number);
  const [closeHour, closeMinute] = venueSchedule.closeTime.split(':').map(Number);
  
  // Get current time components in the specified timezone
  const timeString = baseTime.toLocaleString('en-US', { 
    timeZone: timezone,
    hour12: false,
    hour: '2-digit',
    minute: '2-digit'
  });
  const [currentHour, currentMinute] = timeString.split(':').map(Number);
  
  // Convert times to minutes since midnight for easier comparison
  const currentTimeInMinutes = currentHour * 60 + currentMinute;
  const openTimeInMinutes = openHour * 60 + openMinute;
  const closeTimeInMinutes = closeHour * 60 + closeMinute;
  
  let scheduledDate = new Date(baseTime);
  
  // If current time is before opening time, schedule for today's opening time + prep time
  if (currentTimeInMinutes < openTimeInMinutes) {
    scheduledDate.setHours(openHour, openMinute, 0, 0);
    scheduledDate = new Date(scheduledDate.getTime() + preparationMinutes * 60 * 1000);
  }
  // If current time is after closing time, schedule for tomorrow's opening time + prep time
  else if (currentTimeInMinutes >= closeTimeInMinutes) {
    scheduledDate.setDate(scheduledDate.getDate() + 1);
    scheduledDate.setHours(openHour, openMinute, 0, 0);
    scheduledDate = new Date(scheduledDate.getTime() + preparationMinutes * 60 * 1000);
  }
  // If within hours, add preparation time
  else {
    scheduledDate = new Date(baseTime.getTime() + preparationMinutes * 60 * 1000);
    
    // Make sure scheduled time doesn't exceed closing time
    const scheduledTimeInMinutes = scheduledDate.getHours() * 60 + scheduledDate.getMinutes();
    if (scheduledTimeInMinutes > closeTimeInMinutes) {
      // Schedule for tomorrow's opening time + prep time
      scheduledDate = new Date(baseTime);
      scheduledDate.setDate(scheduledDate.getDate() + 1);
      scheduledDate.setHours(openHour, openMinute, 0, 0);
      scheduledDate = new Date(scheduledDate.getTime() + preparationMinutes * 60 * 1000);
    }
  }
  
  // Return ISO 8601 format
  return scheduledDate.toISOString();
}

/**
 * Check if venue is currently open
 */
export function isVenueOpen(venueSchedule: VenueSchedule, timezone: string = 'Europe/Athens'): boolean {
  const now = new Date();
  const timeString = now.toLocaleString('en-US', { 
    timeZone: timezone,
    hour12: false,
    hour: '2-digit',
    minute: '2-digit'
  });
  const [currentHour, currentMinute] = timeString.split(':').map(Number);
  
  const [openHour, openMinute] = venueSchedule.openTime.split(':').map(Number);
  const [closeHour, closeMinute] = venueSchedule.closeTime.split(':').map(Number);
  
  const currentTimeInMinutes = currentHour * 60 + currentMinute;
  const openTimeInMinutes = openHour * 60 + openMinute;
  const closeTimeInMinutes = closeHour * 60 + closeMinute;
  
  return currentTimeInMinutes >= openTimeInMinutes && currentTimeInMinutes < closeTimeInMinutes;
}

/**
 * Get minutes until venue closes
 * Returns negative if venue is already closed
 */
export function getMinutesUntilClose(venueSchedule: VenueSchedule, timezone: string = 'Europe/Athens'): number {
  const now = new Date();
  const timeString = now.toLocaleString('en-US', { 
    timeZone: timezone,
    hour12: false,
    hour: '2-digit',
    minute: '2-digit'
  });
  const [currentHour, currentMinute] = timeString.split(':').map(Number);
  
  const [closeHour, closeMinute] = venueSchedule.closeTime.split(':').map(Number);
  
  const currentTimeInMinutes = currentHour * 60 + currentMinute;
  const closeTimeInMinutes = closeHour * 60 + closeMinute;
  
  return closeTimeInMinutes - currentTimeInMinutes;
}

/**
 * Check if there's enough time for immediate delivery (needs at least 90 minutes before close)
 */
export function hasEnoughTimeForImmediateDelivery(venueSchedule: VenueSchedule, timezone: string = 'Europe/Athens'): boolean {
  const minutesUntilClose = getMinutesUntilClose(venueSchedule, timezone);
  return minutesUntilClose >= 90; // Need at least 90 minutes (30 prep + 60 delivery)
}

/**
 * Check if venue is currently closed (outside operating hours)
 */
export function isVenueClosed(venueSchedule: VenueSchedule, timezone: string = 'Europe/Athens'): boolean {
  return !isVenueOpen(venueSchedule, timezone);
}

/**
 * Get list of available delivery dates (excluding today)
 */
export function getAvailableDeliveryDates(daysAhead: number = 7): Array<{ value: string; label: string }> {
  const dates: Array<{ value: string; label: string }> = [];
  const now = new Date();
  
  for (let i = 1; i <= daysAhead; i++) {
    const date = new Date(now);
    date.setDate(date.getDate() + i);
    const value = date.toISOString().split('T')[0];
    const label = date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
    dates.push({ value, label });
  }
  
  return dates;
}

/**
 * Get available time slots for a given date based on venue schedule
 */
export function getAvailableTimeSlots(venueSchedule: VenueSchedule): Array<{ value: string; label: string }> {
  const [openHour, openMinute] = venueSchedule.openTime.split(':').map(Number);
  const [closeHour, closeMinute] = venueSchedule.closeTime.split(':').map(Number);
  
  const slots: Array<{ value: string; label: string }> = [];
  
  // Generate 30-minute slots from open to close (minus 1 hour for delivery)
  let currentHour = openHour;
  let currentMinute = openMinute;
  
  while (currentHour < closeHour || (currentHour === closeHour && currentMinute < closeMinute - 60)) {
    const value = `${String(currentHour).padStart(2, '0')}:${String(currentMinute).padStart(2, '0')}`;
    const label = value;
    slots.push({ value, label });
    
    currentMinute += 30;
    if (currentMinute >= 60) {
      currentMinute = 0;
      currentHour += 1;
    }
  }
  
  return slots;
}

/**
 * Format SMS text with dynamic values
 */
export function formatSMSText(
  template: string,
  customerName: string,
  storeName: string,
  trackingLink: string
): string {
  return template
    .replace('{CUSTOMER_NAME}', customerName)
    .replace('{STORE_NAME}', storeName)
    .replace('{TRACKING_LINK}', trackingLink);
}

import { VenueSchedule } from './settings-store';

/**
 * Calculate the scheduled dropoff time based on venue hours
 * If current time is outside venue hours, schedule for next day opening time
 */
export function calculateScheduledDropoffTime(
  venueSchedule: VenueSchedule,
  timezone: string = 'Europe/Athens'
): string {
  const now = new Date();
  
  // Parse venue hours
  const [openHour, openMinute] = venueSchedule.openTime.split(':').map(Number);
  const [closeHour, closeMinute] = venueSchedule.closeTime.split(':').map(Number);
  
  // Get current time components in the specified timezone
  const currentHour = now.getHours();
  const currentMinute = now.getMinutes();
  
  // Convert times to minutes since midnight for easier comparison
  const currentTimeInMinutes = currentHour * 60 + currentMinute;
  const openTimeInMinutes = openHour * 60 + openMinute;
  const closeTimeInMinutes = closeHour * 60 + closeMinute;
  
  let scheduledDate = new Date(now);
  
  // If current time is before opening time, schedule for today's opening time
  if (currentTimeInMinutes < openTimeInMinutes) {
    scheduledDate.setHours(openHour, openMinute, 0, 0);
  }
  // If current time is after closing time, schedule for tomorrow's opening time
  else if (currentTimeInMinutes >= closeTimeInMinutes) {
    scheduledDate.setDate(scheduledDate.getDate() + 1);
    scheduledDate.setHours(openHour, openMinute, 0, 0);
  }
  // If within hours, add 30 minutes preparation time
  else {
    scheduledDate = new Date(now.getTime() + 30 * 60 * 1000); // Add 30 minutes
    
    // Make sure scheduled time doesn't exceed closing time
    const scheduledTimeInMinutes = scheduledDate.getHours() * 60 + scheduledDate.getMinutes();
    if (scheduledTimeInMinutes > closeTimeInMinutes) {
      // Schedule for tomorrow's opening time
      scheduledDate = new Date(now);
      scheduledDate.setDate(scheduledDate.getDate() + 1);
      scheduledDate.setHours(openHour, openMinute, 0, 0);
    }
  }
  
  // Return ISO 8601 format
  return scheduledDate.toISOString();
}

/**
 * Check if venue is currently open
 */
export function isVenueOpen(venueSchedule: VenueSchedule): boolean {
  const now = new Date();
  const currentHour = now.getHours();
  const currentMinute = now.getMinutes();
  
  const [openHour, openMinute] = venueSchedule.openTime.split(':').map(Number);
  const [closeHour, closeMinute] = venueSchedule.closeTime.split(':').map(Number);
  
  const currentTimeInMinutes = currentHour * 60 + currentMinute;
  const openTimeInMinutes = openHour * 60 + openMinute;
  const closeTimeInMinutes = closeHour * 60 + closeMinute;
  
  return currentTimeInMinutes >= openTimeInMinutes && currentTimeInMinutes < closeTimeInMinutes;
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

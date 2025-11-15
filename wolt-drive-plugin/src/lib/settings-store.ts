import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface VenueSchedule {
  openTime: string; // HH:mm format
  closeTime: string; // HH:mm format
}

export interface SMSNotifications {
  received: string;
  picked_up: string;
}

export interface CustomerSupport {
  email: string;
  phone_number: string;
  url: string;
}

interface PluginSettings {
  venueSchedule: VenueSchedule;
  smsNotifications: SMSNotifications;
  customerSupport: CustomerSupport;
  shouldSendSmsToDropoffContact: boolean;
  deliveryFee: number; // in cents
  preparationTimeMinutes: number; // Minimum preparation time in minutes
  
  // Actions
  updateVenueSchedule: (schedule: VenueSchedule) => void;
  updateSMSNotifications: (sms: SMSNotifications) => void;
  updateCustomerSupport: (support: CustomerSupport) => void;
  setShouldSendSmsToDropoffContact: (value: boolean) => void;
  setDeliveryFee: (fee: number) => void;
  setPreparationTimeMinutes: (minutes: number) => void;
}

export const usePluginSettings = create<PluginSettings>()(
  persist(
    (set) => ({
      // Default values
      venueSchedule: {
        openTime: '08:00',
        closeTime: '18:00',
      },
      smsNotifications: {
        received: 'Hello {CUSTOMER_NAME}! Your order from {STORE_NAME} will be delivered soon. You can follow it here: {TRACKING_LINK}',
        picked_up: 'Hello {CUSTOMER_NAME}! Your order from {STORE_NAME} has been picked up and will be delivered soon. You can follow it here: {TRACKING_LINK}',
      },
      customerSupport: {
        email: 'support@example.com',
        phone_number: '+30 210 1234567',
        url: 'https://example.com/support',
      },
      shouldSendSmsToDropoffContact: true,
      deliveryFee: 0, // Will use Wolt's calculated fee
      preparationTimeMinutes: 60, // Default 60 minutes for ASAP deliveries

      // Actions
      updateVenueSchedule: (schedule) => set({ venueSchedule: schedule }),
      updateSMSNotifications: (sms) => set({ smsNotifications: sms }),
      updateCustomerSupport: (support) => set({ customerSupport: support }),
      setShouldSendSmsToDropoffContact: (value) => set({ shouldSendSmsToDropoffContact: value }),
      setDeliveryFee: (fee) => set({ deliveryFee: fee }),
      setPreparationTimeMinutes: (minutes) => set({ preparationTimeMinutes: minutes }),
    }),
    {
      name: 'plugin-settings-storage',
    }
  )
);

import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { DeliveryResponse, DeliveryStatus } from '@/types/wolt-drive';
import { initializeWoltClient } from '@/api/wolt-client';

interface WoltDriveState {
  // Configuration
  apiToken: string | null;
  merchantId: string | null;
  venueId: string | null;
  isDevelopment: boolean;
  timezone: string;
  
  // Deliveries
  deliveries: DeliveryResponse[];
  selectedDelivery: DeliveryResponse | null;
  
  // UI State
  isLoading: boolean;
  error: string | null;
  
  // Actions
  setConfig: (apiToken: string, merchantId: string, venueId: string, isDevelopment?: boolean, timezone?: string) => void;
  clearConfig: () => void;
  setTimezone: (timezone: string) => void;
  
  addDelivery: (delivery: DeliveryResponse) => void;
  updateDelivery: (deliveryId: string, updates: Partial<DeliveryResponse>) => void;
  setDeliveries: (deliveries: DeliveryResponse[]) => void;
  selectDelivery: (delivery: DeliveryResponse | null) => void;
  removeDelivery: (deliveryId: string) => void;
  
  setLoading: (isLoading: boolean) => void;
  setError: (error: string | null) => void;
  clearError: () => void;
  
  // Helper methods
  getDeliveryById: (deliveryId: string) => DeliveryResponse | undefined;
  getDeliveriesByStatus: (status: DeliveryStatus) => DeliveryResponse[];
}

// Helper function to get initial config from environment variables
const getInitialConfig = () => {
  const envToken = process.env.NEXT_PUBLIC_WOLT_API_TOKEN;
  const envMerchantId = process.env.NEXT_PUBLIC_WOLT_MERCHANT_ID;
  const envVenueId = process.env.NEXT_PUBLIC_WOLT_VENUE_ID;
  const envIsDevelopment = process.env.NEXT_PUBLIC_WOLT_IS_DEVELOPMENT === 'true';
  const envTimezone = process.env.NEXT_PUBLIC_WOLT_TIMEZONE || 'Europe/Athens'; // Default to Athens, Greece

  return {
    apiToken: envToken || null,
    merchantId: envMerchantId || null,
    venueId: envVenueId || null,
    isDevelopment: envIsDevelopment ?? true,
    timezone: envTimezone,
  };
};

export const useWoltDriveStore = create<WoltDriveState>()(
  devtools(
    persist(
      (set, get) => {
        const initialConfig = getInitialConfig();
        
        // Auto-initialize the Wolt client if all required environment variables are present
        if (initialConfig.apiToken && initialConfig.merchantId && initialConfig.venueId) {
          try {
            initializeWoltClient(
              initialConfig.apiToken,
              initialConfig.merchantId,
              initialConfig.venueId,
              initialConfig.isDevelopment
            );
          } catch (error) {
            console.warn('Failed to auto-initialize Wolt client from environment variables:', error);
          }
        }
        
        return {
          // Initial state from environment variables
          apiToken: initialConfig.apiToken,
          merchantId: initialConfig.merchantId,
          venueId: initialConfig.venueId,
          isDevelopment: initialConfig.isDevelopment,
          timezone: initialConfig.timezone,
          deliveries: [],
          selectedDelivery: null,
          isLoading: false,
          error: null,

          // Configuration actions
          setConfig: (apiToken, merchantId, venueId, isDevelopment = true, timezone = 'Europe/Athens') => {
            set({
              apiToken,
              merchantId,
              venueId,
              isDevelopment,
              timezone,
            });
          },

          clearConfig: () => {
            set({
              apiToken: null,
              merchantId: null,
              venueId: null,
              deliveries: [],
              selectedDelivery: null,
              timezone: 'Europe/Athens',
            });
          },

          setTimezone: (timezone) => {
            set({ timezone });
          },

          // Delivery actions
          addDelivery: (delivery) => {
            set((state) => ({
              deliveries: [delivery, ...state.deliveries],
            }));
          },

          updateDelivery: (deliveryId, updates) => {
            set((state) => ({
              deliveries: state.deliveries.map((d) =>
                d.id === deliveryId ? { ...d, ...updates } : d
              ),
              selectedDelivery:
                state.selectedDelivery?.id === deliveryId
                  ? { ...state.selectedDelivery, ...updates }
                  : state.selectedDelivery,
            }));
          },

          setDeliveries: (deliveries) => {
            set({ deliveries });
          },

          selectDelivery: (delivery) => {
            set({ selectedDelivery: delivery });
          },

          removeDelivery: (deliveryId) => {
            set((state) => ({
              deliveries: state.deliveries.filter((d) => d.id !== deliveryId),
              selectedDelivery:
                state.selectedDelivery?.id === deliveryId
                  ? null
                  : state.selectedDelivery,
            }));
          },

          // UI state actions
          setLoading: (isLoading) => {
            set({ isLoading });
          },

          setError: (error) => {
            set({ error });
          },

          clearError: () => {
            set({ error: null });
          },

          // Helper methods
          getDeliveryById: (deliveryId) => {
            return get().deliveries.find((d) => d.id === deliveryId);
          },

          getDeliveriesByStatus: (status) => {
            return get().deliveries.filter((d) => d.status === status);
          },
        };
      },
      {
        name: 'wolt-drive-storage',
        partialize: (state: WoltDriveState) => ({
          apiToken: state.apiToken,
          merchantId: state.merchantId,
          venueId: state.venueId,
          isDevelopment: state.isDevelopment,
          timezone: state.timezone,
          deliveries: state.deliveries,
        }),
      }
    )
  )
);

import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { DeliveryResponse, DeliveryStatus } from '@/types/wolt-drive';

interface WoltDriveState {
  // Configuration
  apiToken: string | null;
  merchantId: string | null;
  venueId: string | null;
  isDevelopment: boolean;
  
  // Deliveries
  deliveries: DeliveryResponse[];
  selectedDelivery: DeliveryResponse | null;
  
  // UI State
  isLoading: boolean;
  error: string | null;
  
  // Actions
  setConfig: (apiToken: string, merchantId: string, venueId: string, isDevelopment?: boolean) => void;
  clearConfig: () => void;
  
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

export const useWoltDriveStore = create<WoltDriveState>()(
  devtools(
    persist(
      (set, get) => ({
        // Initial state
        apiToken: null,
        merchantId: null,
        venueId: null,
        isDevelopment: true,
        deliveries: [],
        selectedDelivery: null,
        isLoading: false,
        error: null,

        // Configuration actions
        setConfig: (apiToken, merchantId, venueId, isDevelopment = true) => {
          set({
            apiToken,
            merchantId,
            venueId,
            isDevelopment,
          });
        },

        clearConfig: () => {
          set({
            apiToken: null,
            merchantId: null,
            venueId: null,
            deliveries: [],
            selectedDelivery: null,
          });
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
      }),
      {
        name: 'wolt-drive-storage',
        partialize: (state) => ({
          apiToken: state.apiToken,
          merchantId: state.merchantId,
          venueId: state.venueId,
          isDevelopment: state.isDevelopment,
          deliveries: state.deliveries,
        }),
      }
    )
  )
);

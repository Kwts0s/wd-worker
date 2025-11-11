import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface DeliveryFormData {
  // Dropoff location for quote
  street: string;
  city: string;
  postCode: string;
  dropoffLat: string;
  dropoffLon: string;
  language: string;
  minPrepTime: string;
  scheduledDropoffTime: string;

  // Pickup
  pickupComment: string;

  // Dropoff
  dropoffName: string;
  dropoffPhone: string;
  dropoffEmail: string;
  dropoffComment: string;
  noContact: boolean;

  // Order details
  orderReference: string;
  orderPrice: string;
  currency: string;

  // Customer support
  supportUrl: string;
  supportEmail: string;
  supportPhone: string;

  // Item/Parcel details
  parcelDescription: string;
  parcelIdentifier: string;
  parcelCount: string;
  parcelWeight: string;
  parcelWidth: string;
  parcelHeight: string;
  parcelDepth: string;
  parcelPrice: string;
  tipAmount: string;

  // SMS Notifications
  receivedSms: string;
  pickedUpSms: string;
}

interface FormState {
  formData: DeliveryFormData;
  shipmentPromiseId: string | null;
  scheduledPickupTime: string | null;
  scheduledDropoffTime: string | null;
  currentStep: number;
  
  // Actions
  updateFormData: (updates: Partial<DeliveryFormData>) => void;
  setShipmentPromiseId: (id: string | null) => void;
  setScheduledPickupTime: (time: string | null) => void;
  setScheduledDropoffTime: (time: string | null) => void;
  setCurrentStep: (step: number) => void;
  resetForm: () => void;
  generateNewOrderRef: () => void;
}

const getDefaultFormData = (): DeliveryFormData => ({
  street: 'Mesogeion 217',
  city: 'Athens',
  postCode: '11525',
  dropoffLat: '37.996825',
  dropoffLon: '23.781103',
  language: 'en',
  minPrepTime: '60',
  scheduledDropoffTime: '',
  pickupComment: '',
  dropoffName: 'Kostas Gall',
  dropoffPhone: '6944213449',
  dropoffEmail: 'info.kgalliakis@gmail.com',
  dropoffComment: '',
  noContact: false,
  orderReference: `ORDER-${Date.now()}`,
  orderPrice: '890',
  currency: 'EUR',
  supportUrl: 'kgalliakis.gr',
  supportEmail: '',
  supportPhone: '',
  parcelDescription: 'Burger',
  parcelIdentifier: 'burger-2',
  parcelCount: '1',
  parcelWeight: '200',
  parcelWidth: '30',
  parcelHeight: '30',
  parcelDepth: '30',
  parcelPrice: '10',
  tipAmount: '0',
  receivedSms: 'Hello John Doe! Your order from Amazing Store will be delivered soon. You can follow it here: TRACKING_LINK',
  pickedUpSms: 'Hello John Doe! Your order from Amazing Store has been picked up and will be delivered soon. You can follow it here: TRACKING_LINK',
});

export const useFormStore = create<FormState>()(
  persist(
    (set) => ({
      formData: getDefaultFormData(),
      shipmentPromiseId: null,
      scheduledPickupTime: null,
      scheduledDropoffTime: null,
      currentStep: 1,

      updateFormData: (updates) =>
        set((state) => ({
          formData: { ...state.formData, ...updates },
        })),

      setShipmentPromiseId: (id) => set({ shipmentPromiseId: id }),
      
      setScheduledPickupTime: (time) => set({ scheduledPickupTime: time }),
      
      setScheduledDropoffTime: (time) => set({ scheduledDropoffTime: time }),
      
      setCurrentStep: (step) => set({ currentStep: step }),

      resetForm: () =>
        set({
          formData: getDefaultFormData(),
          shipmentPromiseId: null,
          scheduledPickupTime: null,
          scheduledDropoffTime: null,
          currentStep: 1,
        }),

      generateNewOrderRef: () =>
        set((state) => ({
          formData: {
            ...state.formData,
            orderReference: `ORDER-${Date.now()}`,
          },
        })),
    }),
    {
      name: 'delivery-form-storage',
      partialize: (state) => ({
        formData: state.formData,
        currentStep: state.currentStep,
      }),
    }
  )
);

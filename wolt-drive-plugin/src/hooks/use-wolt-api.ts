import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ShipmentPromiseRequest,
  CreateDeliveryRequest,
  CancelDeliveryRequest,
  AvailableVenuesRequest,
} from '@/types/wolt-drive';
import { useWoltDriveStore } from '@/store/wolt-store';

// Query Keys
export const queryKeys = {
  deliveries: ['deliveries'] as const,
  delivery: (id: string) => ['delivery', id] as const,
  tracking: (id: string) => ['tracking', id] as const,
  quote: ['quote'] as const,
  shipmentPromise: ['shipmentPromise'] as const,
};



/**
 * Hook to get a shipment promise as a mutation (manual trigger)
 */
export function useShipmentPromiseMutation() {
  return useMutation({
    mutationFn: async (request: ShipmentPromiseRequest & { venue_id?: string }) => {
      const response = await fetch('/api/wolt/shipment-promises', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to get shipment promise');
      }

      return response.json();
    },
  });
}

/**
 * Hook to create a delivery
 */
export function useCreateDelivery() {
  const queryClient = useQueryClient();
  const { addDelivery, setLoading, setError } = useWoltDriveStore();

  return useMutation({
    mutationFn: async (request: CreateDeliveryRequest & { venue_id?: string }) => {
      const response = await fetch('/api/wolt/deliveries', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create delivery');
      }

      return response.json();
    },
    onMutate: () => {
      setLoading(true);
      setError(null);
    },
    onSuccess: (data) => {
      addDelivery(data);
      queryClient.invalidateQueries({ queryKey: queryKeys.deliveries });
      setLoading(false);
    },
    onError: (error: Error) => {
      setError(error.message);
      setLoading(false);
    },
  });
}

/**
 * Hook to cancel a delivery
 */
export function useCancelDelivery() {
  const queryClient = useQueryClient();
  const { setLoading, setError } = useWoltDriveStore();

  return useMutation({
    mutationFn: async (params: {
      woltOrderReferenceId: string;
      request: CancelDeliveryRequest;
    }) => {
      const response = await fetch(
        `/api/wolt/deliveries/${params.woltOrderReferenceId}/cancel`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(params.request),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || errorData.details || 'Failed to cancel delivery');
      }

      return response.json();
    },
    onMutate: () => {
      setLoading(true);
      setError(null);
    },
    onSuccess: () => {
      // Update the delivery status in the store
      // Note: We need to find the delivery by wolt_order_reference_id
      queryClient.invalidateQueries({ queryKey: queryKeys.deliveries });
      setLoading(false);
    },
    onError: (error: Error) => {
      setError(error.message);
      setLoading(false);
    },
  });
}

/**
 * Hook to get available venues
 */
export function useAvailableVenues() {
  return useMutation({
    mutationFn: async (request: AvailableVenuesRequest) => {
      const response = await fetch('/api/wolt/available-venues', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to get available venues');
      }

      return response.json();
    },
  });
}



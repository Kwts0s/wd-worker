import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  DeliveryQuoteRequest,
  ShipmentPromiseRequest,
  CreateDeliveryRequest,
  CancelDeliveryRequest,
  DeliveryStatus,
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
 * Hook to get a shipment promise (quote with promise ID)
 * @deprecated Use useShipmentPromiseMutation instead
 */
export function useShipmentPromise(request: ShipmentPromiseRequest | null) {
  return useQuery({
    queryKey: [...queryKeys.shipmentPromise, request],
    queryFn: async () => {
      throw new Error('This hook is deprecated. Use useShipmentPromiseMutation instead.');
    },
    enabled: false, // Disabled - use mutation instead
    staleTime: 60000, // 1 minute
  });
}

/**
 * Hook to get a delivery quote
 * @deprecated Use useShipmentPromiseMutation for quotes with promise ID
 */
export function useDeliveryQuote(request: DeliveryQuoteRequest | null) {
  return useQuery({
    queryKey: [...queryKeys.quote, request],
    queryFn: async () => {
      throw new Error('This hook is deprecated. Use useShipmentPromiseMutation instead.');
    },
    enabled: false, // Disabled - use mutation instead
    staleTime: 60000, // 1 minute
  });
}

/**
 * Hook to get a shipment promise as a mutation (manual trigger)
 */
export function useShipmentPromiseMutation() {
  return useMutation({
    mutationFn: async (request: ShipmentPromiseRequest) => {
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
 * Hook to get a single delivery
 * TODO: Implement API route for single delivery
 */
export function useDelivery(deliveryId: string | null) {
  // const { updateDelivery } = useWoltDriveStore(); // TODO: Use when implemented

  const query = useQuery({
    queryKey: deliveryId ? queryKeys.delivery(deliveryId) : ['delivery-null'],
    queryFn: async () => {
      if (!deliveryId) return null;
      // TODO: Replace with API route call
      throw new Error('Single delivery API not implemented yet');
    },
    enabled: false, // Disabled until API route is implemented
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  // TODO: Update store when data changes (disabled until implemented)
  // if (query.data) {
  //   updateDelivery(query.data.id, query.data);
  // }

  return query;
}

/**
 * Hook to list deliveries
 * @deprecated Wolt venueful API doesn't support listing deliveries. Use Zustand store instead.
 */
export function useDeliveries(_params?: {
  limit?: number;
  offset?: number;
  status?: DeliveryStatus;
}) {
  return useQuery({
    queryKey: [...queryKeys.deliveries, _params],
    queryFn: async () => {
      throw new Error('List deliveries API not available for venueful endpoints. Use Zustand store instead.');
    },
    enabled: false, // Disabled - use Zustand store instead
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

/**
 * Hook to get tracking information
 * TODO: Implement API route for tracking
 */
export function useTracking(deliveryId: string | null) {
  return useQuery({
    queryKey: deliveryId ? queryKeys.tracking(deliveryId) : ['tracking-null'],
    queryFn: async () => {
      if (!deliveryId) return null;
      // TODO: Replace with API route call
      throw new Error('Tracking API not implemented yet');
    },
    enabled: false, // Disabled until API route is implemented
    refetchInterval: 15000, // Refetch every 15 seconds for real-time tracking
  });
}

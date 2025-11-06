import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  DeliveryQuoteRequest,
  ShipmentPromiseRequest,
  CreateDeliveryRequest,
  CancelDeliveryRequest,
  DeliveryStatus,
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
    mutationFn: async (request: CreateDeliveryRequest) => {
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
 */
export function useDeliveries(params?: {
  limit?: number;
  offset?: number;
  status?: DeliveryStatus;
}) {
  const { setDeliveries } = useWoltDriveStore();

  const query = useQuery({
    queryKey: [...queryKeys.deliveries, params],
    queryFn: async () => {
      const searchParams = new URLSearchParams();
      if (params?.limit) searchParams.append('limit', params.limit.toString());
      if (params?.offset) searchParams.append('offset', params.offset.toString());
      if (params?.status) searchParams.append('status', params.status);

      const response = await fetch(`/api/wolt/deliveries?${searchParams.toString()}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch deliveries');
      }

      return response.json();
    },
    refetchInterval: 60000, // Refetch every minute
  });

  // Update store when data changes
  if (query.data?.deliveries) {
    setDeliveries(query.data.deliveries);
  }

  return query;
}

/**
 * Hook to cancel a delivery
 * TODO: Implement API route for cancel delivery
 */
export function useCancelDelivery() {
  const queryClient = useQueryClient();
  const { updateDelivery, setLoading, setError } = useWoltDriveStore();

  return useMutation({
    mutationFn: async (params: {
      deliveryId: string;
      request: CancelDeliveryRequest;
    }) => {
      // TODO: Replace with API route call
      console.log('Cancel delivery params:', params); // Temporary to avoid unused warning
      throw new Error('Cancel delivery API not implemented yet');
    },
    onMutate: () => {
      setLoading(true);
      setError(null);
    },
    onSuccess: (data, variables) => {
      updateDelivery(variables.deliveryId, data);
      queryClient.invalidateQueries({
        queryKey: queryKeys.delivery(variables.deliveryId),
      });
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

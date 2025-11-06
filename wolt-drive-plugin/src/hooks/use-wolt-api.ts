import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getWoltClient } from '@/api/wolt-client';
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
 */
export function useShipmentPromise(request: ShipmentPromiseRequest | null) {
  return useQuery({
    queryKey: [...queryKeys.shipmentPromise, request],
    queryFn: async () => {
      if (!request) return null;
      const client = getWoltClient();
      return client.getShipmentPromise(request);
    },
    enabled: !!request,
    staleTime: 60000, // 1 minute
  });
}

/**
 * Hook to get a delivery quote
 */
export function useDeliveryQuote(request: DeliveryQuoteRequest | null) {
  return useQuery({
    queryKey: [...queryKeys.quote, request],
    queryFn: async () => {
      if (!request) return null;
      const client = getWoltClient();
      return client.getDeliveryQuote(request);
    },
    enabled: !!request,
    staleTime: 60000, // 1 minute
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
      const client = getWoltClient();
      return client.createDelivery(request);
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
 */
export function useDelivery(deliveryId: string | null) {
  const { updateDelivery } = useWoltDriveStore();

  const query = useQuery({
    queryKey: deliveryId ? queryKeys.delivery(deliveryId) : ['delivery-null'],
    queryFn: async () => {
      if (!deliveryId) return null;
      const client = getWoltClient();
      return client.getDelivery(deliveryId);
    },
    enabled: !!deliveryId,
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  // Update store when data changes
  if (query.data) {
    updateDelivery(query.data.id, query.data);
  }

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
      const client = getWoltClient();
      return client.listDeliveries(params);
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
 */
export function useCancelDelivery() {
  const queryClient = useQueryClient();
  const { updateDelivery, setLoading, setError } = useWoltDriveStore();

  return useMutation({
    mutationFn: async ({
      deliveryId,
      request,
    }: {
      deliveryId: string;
      request: CancelDeliveryRequest;
    }) => {
      const client = getWoltClient();
      return client.cancelDelivery(deliveryId, request);
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
 */
export function useTracking(deliveryId: string | null) {
  return useQuery({
    queryKey: deliveryId ? queryKeys.tracking(deliveryId) : ['tracking-null'],
    queryFn: async () => {
      if (!deliveryId) return null;
      const client = getWoltClient();
      return client.getTracking(deliveryId);
    },
    enabled: !!deliveryId,
    refetchInterval: 15000, // Refetch every 15 seconds for real-time tracking
  });
}

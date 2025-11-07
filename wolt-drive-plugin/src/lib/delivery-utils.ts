import { DeliveryResponse } from '@/types/wolt-drive';

/**
 * Get a display name for a delivery in a consistent way
 */
export function getDeliveryDisplayName(delivery: DeliveryResponse): string {
  return delivery.merchant_order_reference_id || delivery.order_number || delivery.id.slice(0, 8);
}

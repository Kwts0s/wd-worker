// Wolt Drive API Types

export interface Coordinates {
  lat: number;
  lon: number;
}

export interface Location {
  formatted_address: string;
  coordinates: Coordinates;
}

export interface ContactDetails {
  name: string;
  phone_number: string;
  send_tracking_link_sms: boolean;
}

export interface LocationWithContact {
  location: Location;
  comment?: string;
  contact_details: ContactDetails;
}

export interface CustomerSupport {
  email: string;
  phone_number: string;
  url: string;
}

export interface DeliveryContent {
  count: number;
  description: string;
  identifier: string;
  tags?: string[];
}

export interface Fee {
  amount: number;
  currency: string;
}

export interface Tracking {
  url: string;
  code: string;
}

export interface Courier {
  name: string;
  phone_number: string;
  location?: Coordinates;
}

export interface TimelineEvent {
  status: DeliveryStatus;
  timestamp: string;
}

export type DeliveryStatus =
  | 'created'
  | 'scheduled'
  | 'courier_assigned'
  | 'picking_up'
  | 'picked_up'
  | 'in_transit'
  | 'delivered'
  | 'cancelled';

// Request Types
export interface DeliveryQuoteRequest {
  pickup: {
    location: Location;
  };
  dropoff: {
    location: Location;
  };
}

export interface CreateDeliveryRequest {
  pickup: LocationWithContact;
  dropoff: LocationWithContact;
  customer_support: CustomerSupport;
  merchant_order_reference_id: string;
  is_no_contact_delivery: boolean;
  contents: DeliveryContent[];
  tips?: any[];
}

export interface CancelDeliveryRequest {
  reason: string;
}

// Response Types
export interface DeliveryQuoteResponse {
  fee: Fee;
  estimated_pickup_time: string;
  estimated_delivery_time: string;
  distance_meters: number;
}

export interface DeliveryResponse {
  id: string;
  status: DeliveryStatus;
  tracking: Tracking;
  created_at: string;
  fee: Fee;
  estimated_pickup_time: string;
  estimated_delivery_time: string;
  pickup: LocationWithContact;
  dropoff: LocationWithContact;
  courier?: Courier;
  timeline?: TimelineEvent[];
  actual_pickup_time?: string;
  actual_delivery_time?: string;
  merchant_order_reference_id?: string;
}

export interface ListDeliveriesResponse {
  deliveries: DeliveryResponse[];
  pagination: {
    total: number;
    limit: number;
    offset: number;
    has_more: boolean;
  };
}

export interface TrackingResponse {
  delivery_id: string;
  status: DeliveryStatus;
  courier?: {
    name: string;
    location: Coordinates & {
      heading?: number;
      accuracy?: number;
    };
    updated_at: string;
  };
  eta: string;
  distance_to_destination_meters?: number;
  tracking_url: string;
}

export interface CancelDeliveryResponse {
  id: string;
  status: 'cancelled';
  cancelled_at: string;
  cancellation_reason: string;
  refund?: {
    amount: number;
    currency: string;
    status: string;
  };
}

// Error Types
export interface ApiError {
  error: {
    code: string;
    message: string;
    details?: Record<string, any>;
  };
}

// Webhook Types
export type WebhookEventType =
  | 'delivery.created'
  | 'delivery.status_changed'
  | 'delivery.delivered'
  | 'delivery.cancelled';

export interface WebhookEvent {
  event_type: WebhookEventType;
  delivery_id: string;
  timestamp: string;
  merchant_id: string;
  data: Record<string, any>;
}

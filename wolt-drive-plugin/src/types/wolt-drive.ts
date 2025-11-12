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

export interface Price {
  amount: number;
  currency: string;
}

// Fee is an alias for Price for backward compatibility
export type Fee = Price;

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
  | 'INFO_RECEIVED'
  | 'created'
  | 'scheduled'
  | 'courier_assigned'
  | 'picking_up'
  | 'picked_up'
  | 'in_transit'
  | 'delivered'
  | 'cancelled';

// Shipment Promise (Quote) Types
export interface ShipmentPromiseRequest {
  street: string;
  city: string;
  post_code: string;
  lat: number;
  lon: number;
  language: string;
  min_preparation_time_minutes: number;
  scheduled_dropoff_time?: string; // ISO 8601 timestamp
}

export interface ShipmentPromiseResponse {
  id: string;
  fee?: Fee;
  estimated_pickup_time?: string;
  estimated_delivery_time?: string;
  distance_meters?: number;
  pickup?: {
    options?: {
      scheduled_time?: string;
    };
  };
  dropoff?: {
    options?: {
      scheduled_time?: string;
    };
  };
}

// Available Venues Types
export interface AvailableVenuesRequest {
  dropoff: {
    location: {
      formatted_address: string;
      coordinates: {
        lat: number;
        lon: number;
      };
    };
  };
  scheduled_dropoff_time?: string; // ISO 8601 timestamp
}

export interface VenueName {
  lang: string;
  value: string;
}

export interface PreEstimate {
  pickup_minutes: number;
  delivery_minutes: number;
  total_minutes: {
    min: number;
    mean: number;
    max: number;
  };
}

export interface AvailableVenue {
  pickup: {
    venue_id: string;
    name: VenueName[];
    location: Location;
  };
  fee: Fee;
  pre_estimate: PreEstimate;
  scheduled_dropoff_time?: string;
}

export type AvailableVenuesResponse = AvailableVenue[];

// Parcel/Package Types
export interface ParcelDimensions {
  weight_gram: number;
  width_cm: number;
  height_cm: number;
  depth_cm: number;
}

export interface DropoffRestrictions {
  id_check_required: boolean;
}

export interface Parcel {
  count: number;
  dimensions: ParcelDimensions;
  price: Price;
  description: string;
  identifier: string;
  dropoff_restrictions: DropoffRestrictions;
  tags?: string[];
}

// Recipient Types
export interface Recipient {
  name: string;
  phone_number: string;
  email: string;
}

// Pickup/Dropoff Options
export interface PickupOptions {
  min_preparation_time_minutes: number;
  scheduled_time?: string; // ISO 8601 timestamp
}

export interface DropoffOptions {
  is_no_contact: boolean;
  scheduled_time?: string; // ISO 8601 timestamp
}

// SMS Notifications
export interface SmsNotifications {
  received: string;
  picked_up: string;
}

// Tips
export interface Tip {
  type: string;
  price: Price;
}

// Handshake Delivery
export interface HandshakeDelivery {
  is_required: boolean;
  should_send_sms_to_dropoff_contact: boolean;
}

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
  pickup: {
    options: PickupOptions;
    comment: string;
  };
  dropoff: {
    location: {
      coordinates: Coordinates;
    };
    comment: string;
    options: DropoffOptions;
  };
  price: Price;
  recipient: Recipient;
  parcels: Parcel[];
  shipment_promise_id: string;
  customer_support: CustomerSupport;
  merchant_order_reference_id: string;
  sms_notifications?: SmsNotifications;
  tips?: Tip[];
  order_number?: string;
  handshake_delivery?: HandshakeDelivery;
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

// Actual API Response structure (venueful endpoints)
export interface DeliveryResponse {
  id: string;
  status: DeliveryStatus;
  tracking: {
    id: string;
    url: string;
  };
  tracking_sms: string | null;
  pickup: {
    location: Location;
    comment: string;
    options: {
      min_preparation_time_minutes: number;
      scheduled_time?: string;
    };
    eta: string;
    display_name: string;
  };
  dropoff: {
    location: Location;
    comment: string;
    options: {
      is_no_contact: boolean;
      scheduled_time?: string;
    };
    eta: string | null;
  };
  price: Price;
  recipient: Recipient;
  parcels: Parcel[];
  customer_support: CustomerSupport;
  wolt_order_reference_id: string;
  merchant_order_reference_id: string;
  tips: Tip[];
  order_number: string;
  courier?: Courier;
  timeline?: TimelineEvent[];
  actual_pickup_time?: string;
  actual_delivery_time?: string;
  created_at?: string;
  fee?: Fee;
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
    details?: Record<string, unknown>;
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
  data: Record<string, unknown>;
}

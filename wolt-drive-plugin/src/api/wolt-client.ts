import axios, { AxiosInstance, AxiosError } from 'axios';
import {
  DeliveryQuoteRequest,
  DeliveryQuoteResponse,
  CreateDeliveryRequest,
  DeliveryResponse,
  ListDeliveriesResponse,
  TrackingResponse,
  CancelDeliveryRequest,
  CancelDeliveryResponse,
  ApiError,
} from '@/types/wolt-drive';

export class WoltDriveClient {
  private client: AxiosInstance;
  private merchantId: string;
  private venueId: string;

  constructor(apiToken: string, merchantId: string, venueId: string, isDevelopment = true) {
    const baseURL = isDevelopment
      ? 'https://daas-public-api.development.dev.woltapi.com'
      : 'https://daas-public-api.wolt.com';

    this.merchantId = merchantId;
    this.venueId = venueId;
    this.client = axios.create({
      baseURL,
      headers: {
        'Authorization': `Bearer ${apiToken}`,
        'Content-Type': 'application/json',
      },
      timeout: 30000,
    });

    // Add response interceptor for error handling
    this.client.interceptors.response.use(
      (response) => response,
      (error: AxiosError<ApiError>) => {
        if (error.response?.data?.error) {
          throw new Error(
            `${error.response.data.error.code}: ${error.response.data.error.message}`
          );
        }
        throw error;
      }
    );
  }

  /**
   * Get a delivery quote (shipment promise)
   */
  async getDeliveryQuote(
    request: DeliveryQuoteRequest
  ): Promise<DeliveryQuoteResponse> {
    const response = await this.client.post<DeliveryQuoteResponse>(
      `/v1/venues/${this.venueId}/shipment-promises`,
      request
    );
    return response.data;
  }

  /**
   * Create a new delivery
   */
  async createDelivery(
    request: CreateDeliveryRequest
  ): Promise<DeliveryResponse> {
    const response = await this.client.post<DeliveryResponse>(
      `/v1/venues/${this.venueId}/deliveries`,
      request
    );
    return response.data;
  }

  /**
   * Get delivery details by ID
   */
  async getDelivery(deliveryId: string): Promise<DeliveryResponse> {
    const response = await this.client.get<DeliveryResponse>(
      `/v1/venues/${this.venueId}/deliveries/${deliveryId}`
    );
    return response.data;
  }

  /**
   * List deliveries with optional filters
   */
  async listDeliveries(params?: {
    limit?: number;
    offset?: number;
    status?: string;
    created_after?: string;
    created_before?: string;
  }): Promise<ListDeliveriesResponse> {
    const response = await this.client.get<ListDeliveriesResponse>(
      `/v1/venues/${this.venueId}/deliveries`,
      { params }
    );
    return response.data;
  }

  /**
   * Cancel a delivery
   */
  async cancelDelivery(
    deliveryId: string,
    request: CancelDeliveryRequest
  ): Promise<CancelDeliveryResponse> {
    const response = await this.client.post<CancelDeliveryResponse>(
      `/v1/venues/${this.venueId}/deliveries/${deliveryId}/cancel`,
      request
    );
    return response.data;
  }

  /**
   * Get tracking information for a delivery
   */
  async getTracking(deliveryId: string): Promise<TrackingResponse> {
    const response = await this.client.get<TrackingResponse>(
      `/v1/venues/${this.venueId}/deliveries/${deliveryId}/tracking`
    );
    return response.data;
  }
}

// Singleton instance
let woltClient: WoltDriveClient | null = null;

export function initializeWoltClient(
  apiToken: string,
  merchantId: string,
  venueId: string,
  isDevelopment = true
): WoltDriveClient {
  woltClient = new WoltDriveClient(apiToken, merchantId, venueId, isDevelopment);
  return woltClient;
}

export function getWoltClient(): WoltDriveClient {
  if (!woltClient) {
    throw new Error(
      'Wolt Drive client not initialized. Call initializeWoltClient first.'
    );
  }
  return woltClient;
}

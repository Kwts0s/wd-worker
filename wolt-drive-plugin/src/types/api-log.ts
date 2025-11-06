// API Logging Types

export interface ApiLogEntry {
  id: string;
  timestamp: string;
  type: 'shipment-promise' | 'create-delivery' | 'list-deliveries';
  request: {
    method: string;
    url: string;
    headers?: Record<string, string>;
    body?: unknown;
  };
  response: {
    status: number;
    statusText?: string;
    headers?: Record<string, string>;
    body?: unknown;
  };
  duration?: number; // in milliseconds
}

export type ApiLogType = ApiLogEntry['type'];

import { NextRequest, NextResponse } from 'next/server';
import { DeliveryQuoteRequest } from '@/types/wolt-drive';

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  let requestBody: DeliveryQuoteRequest & { venue_id?: string } | null = null;
  
  try {
    requestBody = await request.json();

    // Debug: Log all environment variables
    console.log('All env vars:', {
      WOLT_API_TOKEN: process.env.WOLT_API_TOKEN ? '***exists***' : 'missing',
      NEXT_PUBLIC_WOLT_API_TOKEN: process.env.NEXT_PUBLIC_WOLT_API_TOKEN ? '***exists***' : 'missing',
      WOLT_VENUE_ID: process.env.WOLT_VENUE_ID ? '***exists***' : 'missing',
      NEXT_PUBLIC_WOLT_VENUE_ID: process.env.NEXT_PUBLIC_WOLT_VENUE_ID ? '***exists***' : 'missing',
      NODE_ENV: process.env.NODE_ENV,
    });

    // Use server-side environment variables, fallback to public ones
    const apiToken = process.env.WOLT_API_TOKEN || process.env.NEXT_PUBLIC_WOLT_API_TOKEN;
    const defaultVenueId = process.env.WOLT_VENUE_ID || process.env.NEXT_PUBLIC_WOLT_VENUE_ID;
    const isDevelopment = (process.env.WOLT_IS_DEVELOPMENT || process.env.NEXT_PUBLIC_WOLT_IS_DEVELOPMENT) === 'true';

    // Use venue_id from request body if provided, otherwise use default from env
    const venueId = requestBody?.venue_id || defaultVenueId;

    console.log('Environment check:', {
      hasToken: !!apiToken,
      hasVenueId: !!venueId,
      isDevelopment,
      tokenStart: apiToken?.substring(0, 10),
      venueId: venueId?.substring(0, 10),
    });

    if (!apiToken || !venueId) {
      console.error('Missing API configuration:', { apiToken: !!apiToken, venueId: !!venueId });
      const errorResponse = { 
        error: 'Missing API configuration',
        details: { hasToken: !!apiToken, hasVenueId: !!venueId }
      };
      
      // Log the error
      await logApiCall(requestBody, errorResponse, 500, startTime, 'shipment-promise');
      
      return NextResponse.json(errorResponse, { status: 500 });
    }

    const baseURL = isDevelopment
      ? 'https://daas-public-api.development.dev.woltapi.com'
      : 'https://daas-public-api.wolt.com';

    const woltApiUrl = `${baseURL}/v1/venues/${venueId}/shipment-promises`;
    
    // Remove venue_id from body before sending to Wolt API
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { venue_id, ...cleanRequestBody } = requestBody as DeliveryQuoteRequest & { venue_id?: string };
    
    const response = await fetch(woltApiUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(cleanRequestBody),
    });

    if (!response.ok) {
      const errorText = await response.text();
      const errorResponse = { error: `Wolt API error: ${errorText}` };
      
      // Log the error
      await logApiCall(requestBody, errorResponse, response.status, startTime, 'shipment-promise');
      
      return NextResponse.json(errorResponse, { status: response.status });
    }

    const data = await response.json();
    
    // Log successful response
    await logApiCall(requestBody, data, response.status, startTime, 'shipment-promise');
    
    return NextResponse.json(data);
  } catch (error) {
    console.error('Shipment promise error:', error);
    const errorResponse = { error: 'Internal server error' };
    
    // Log the error
    await logApiCall(requestBody, errorResponse, 500, startTime, 'shipment-promise');
    
    return NextResponse.json(errorResponse, { status: 500 });
  }
}

// Helper function to log API calls to client-accessible endpoint
// Note: Using global storage for simplicity. For production, consider using:
// - Database storage (PostgreSQL, MongoDB, etc.)
// - Redis for caching
// - External logging service (Datadog, LogRocket, etc.)
async function logApiCall(
  requestBody: unknown,
  responseBody: unknown,
  status: number,
  startTime: number,
  type: 'shipment-promise'
) {
  try {
    const logEntry = {
      id: `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
      timestamp: new Date().toISOString(),
      type: type,
      request: {
        method: 'POST',
        url: '/api/wolt/shipment-promises',
        body: requestBody,
      },
      response: {
        status: status,
        body: responseBody,
      },
      duration: Date.now() - startTime,
    };
    
    // Store in temporary global (will be replaced with proper storage)
    if (typeof globalThis !== 'undefined') {
      if (!globalThis.apiLogs) {
        globalThis.apiLogs = [];
      }
      globalThis.apiLogs.unshift(logEntry);
      // Keep only last 100 logs
      if (globalThis.apiLogs.length > 100) {
        globalThis.apiLogs = globalThis.apiLogs.slice(0, 100);
      }
    }
  } catch (err) {
    console.error('Failed to log API call:', err);
  }
}
import { NextRequest, NextResponse } from 'next/server';
import { CreateDeliveryRequest } from '@/types/wolt-drive';

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  let requestBody: CreateDeliveryRequest | null = null;
  
  try {
    requestBody = await request.json();

    // Use server-side environment variables, fallback to public ones
    const apiToken = process.env.WOLT_API_TOKEN || process.env.NEXT_PUBLIC_WOLT_API_TOKEN;
    const venueId = process.env.WOLT_VENUE_ID || process.env.NEXT_PUBLIC_WOLT_VENUE_ID;
    const isDevelopment = (process.env.WOLT_IS_DEVELOPMENT || process.env.NEXT_PUBLIC_WOLT_IS_DEVELOPMENT) === 'true';

    if (!apiToken || !venueId) {
      const errorResponse = { error: 'Missing API configuration' };
      await logApiCall(requestBody, errorResponse, 500, startTime, 'create-delivery');
      return NextResponse.json(errorResponse, { status: 500 });
    }

    const baseURL = isDevelopment
      ? 'https://daas-public-api.development.dev.woltapi.com'
      : 'https://daas-public-api.wolt.com';

    const response = await fetch(
      `${baseURL}/v1/venues/${venueId}/deliveries`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      const errorResponse = { error: `Wolt API error: ${errorText}` };
      await logApiCall(requestBody, errorResponse, response.status, startTime, 'create-delivery');
      return NextResponse.json(errorResponse, { status: response.status });
    }

    const data = await response.json();
    await logApiCall(requestBody, data, response.status, startTime, 'create-delivery');
    return NextResponse.json(data);
  } catch (error) {
    console.error('Create delivery error:', error);
    const errorResponse = { error: 'Internal server error' };
    await logApiCall(requestBody, errorResponse, 500, startTime, 'create-delivery');
    return NextResponse.json(errorResponse, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    const { searchParams } = new URL(request.url);
    const limit = searchParams.get('limit') || '20';
    const offset = searchParams.get('offset') || '0';

    // Use server-side environment variables, fallback to public ones
    const apiToken = process.env.WOLT_API_TOKEN || process.env.NEXT_PUBLIC_WOLT_API_TOKEN;
    const venueId = process.env.WOLT_VENUE_ID || process.env.NEXT_PUBLIC_WOLT_VENUE_ID;
    const isDevelopment = (process.env.WOLT_IS_DEVELOPMENT || process.env.NEXT_PUBLIC_WOLT_IS_DEVELOPMENT) === 'true';

    if (!apiToken || !venueId) {
      const errorResponse = { error: 'Missing API configuration' };
      await logApiCall(
        { limit, offset },
        errorResponse,
        500,
        startTime,
        'list-deliveries'
      );
      return NextResponse.json(errorResponse, { status: 500 });
    }

    const baseURL = isDevelopment
      ? 'https://daas-public-api.development.dev.woltapi.com'
      : 'https://daas-public-api.wolt.com';

    const response = await fetch(
      `${baseURL}/v1/venues/${venueId}/deliveries?limit=${limit}&offset=${offset}`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${apiToken}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      const errorResponse = { error: `Wolt API error: ${errorText}` };
      await logApiCall(
        { limit, offset },
        errorResponse,
        response.status,
        startTime,
        'list-deliveries'
      );
      return NextResponse.json(errorResponse, { status: response.status });
    }

    const data = await response.json();
    await logApiCall({ limit, offset }, data, response.status, startTime, 'list-deliveries');
    return NextResponse.json(data);
  } catch (error) {
    console.error('List deliveries error:', error);
    const errorResponse = { error: 'Internal server error' };
    await logApiCall(null, errorResponse, 500, startTime, 'list-deliveries');
    return NextResponse.json(errorResponse, { status: 500 });
  }
}

// Helper function to log API calls
// Note: Using global storage for simplicity. For production, consider using:
// - Database storage (PostgreSQL, MongoDB, etc.)
// - Redis for caching
// - External logging service (Datadog, LogRocket, etc.)
async function logApiCall(
  requestBody: unknown,
  responseBody: unknown,
  status: number,
  startTime: number,
  type: 'create-delivery' | 'list-deliveries'
) {
  try {
    const logEntry = {
      id: `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
      timestamp: new Date().toISOString(),
      type: type,
      request: {
        method: type === 'list-deliveries' ? 'GET' : 'POST',
        url: '/api/wolt/deliveries',
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
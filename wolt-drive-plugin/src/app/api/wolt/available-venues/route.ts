import { NextRequest, NextResponse } from 'next/server';
import { AvailableVenuesRequest } from '@/types/wolt-drive';

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  let requestBody: AvailableVenuesRequest | null = null;

  try {
    requestBody = await request.json();

    // Use server-side environment variables, fallback to public ones
    const apiToken = process.env.WOLT_API_TOKEN || process.env.NEXT_PUBLIC_WOLT_API_TOKEN;
    const merchantId = process.env.WOLT_MERCHANT_ID || process.env.NEXT_PUBLIC_WOLT_MERCHANT_ID;
    const isDevelopment = (process.env.WOLT_IS_DEVELOPMENT || process.env.NEXT_PUBLIC_WOLT_IS_DEVELOPMENT) === 'true';

    if (!apiToken || !merchantId) {
      const errorResponse = { error: 'Missing API configuration' };
      await logApiCall(requestBody, errorResponse, 500, startTime);
      return NextResponse.json(errorResponse, { status: 500 });
    }

    const baseURL = isDevelopment
      ? 'https://daas-public-api.development.dev.woltapi.com'
      : 'https://daas-public-api.wolt.com';

    const response = await fetch(
      `${baseURL}/merchants/${merchantId}/available-venues`,
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
      await logApiCall(requestBody, errorResponse, response.status, startTime);
      return NextResponse.json(errorResponse, { status: response.status });
    }

    const data = await response.json();
    await logApiCall(requestBody, data, response.status, startTime);
    return NextResponse.json(data);
  } catch (error) {
    console.error('Available venues error:', error);
    const errorResponse = { error: 'Internal server error' };
    await logApiCall(requestBody, errorResponse, 500, startTime);
    return NextResponse.json(errorResponse, { status: 500 });
  }
}

// Helper function to log API calls
async function logApiCall(
  requestBody: unknown,
  responseBody: unknown,
  status: number,
  startTime: number
) {
  try {
    const logEntry = {
      id: `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
      timestamp: new Date().toISOString(),
      type: 'available-venues',
      request: {
        method: 'POST',
        url: '/api/wolt/available-venues',
        body: requestBody,
      },
      response: {
        status: status,
        body: responseBody,
      },
      duration: Date.now() - startTime,
    };

    // Store in temporary global
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

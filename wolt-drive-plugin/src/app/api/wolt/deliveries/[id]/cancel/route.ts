import { NextRequest, NextResponse } from 'next/server';
import { CancelDeliveryRequest } from '@/types/wolt-drive';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const startTime = Date.now();
  let requestBody: CancelDeliveryRequest | null = null;
  const { id: woltOrderReferenceId } = await params;

  try {
    requestBody = await request.json();

    // Use server-side environment variables, fallback to public ones
    const apiToken = process.env.WOLT_API_TOKEN || process.env.NEXT_PUBLIC_WOLT_API_TOKEN;
    const isDevelopment =
      (process.env.WOLT_IS_DEVELOPMENT || process.env.NEXT_PUBLIC_WOLT_IS_DEVELOPMENT) === 'true';

    if (!apiToken) {
      const errorResponse = { error: 'Missing API configuration' };
      await logApiCall(woltOrderReferenceId, requestBody, errorResponse, 500, startTime);
      return NextResponse.json(errorResponse, { status: 500 });
    }

    const baseURL = isDevelopment
      ? 'https://daas-public-api.development.dev.woltapi.com'
      : 'https://daas-public-api.wolt.com';

    const response = await fetch(
      `${baseURL}/order/${woltOrderReferenceId}/status/cancel`,
      {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${apiToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      }
    );

    const responseText = await response.text();
    let data;
    try {
      data = JSON.parse(responseText);
    } catch {
      data = { message: responseText };
    }

    if (!response.ok) {
      const errorResponse = {
        error: data.reason || data.error_code || `Wolt API error: ${responseText}`,
        details: data.details || data.reason || responseText,
        error_code: data.error_code,
      };
      await logApiCall(woltOrderReferenceId, requestBody, errorResponse, response.status, startTime);
      return NextResponse.json(errorResponse, { status: response.status });
    }

    await logApiCall(woltOrderReferenceId, requestBody, data, response.status, startTime);
    return NextResponse.json(data);
  } catch (error) {
    console.error('Cancel delivery error:', error);
    const errorResponse = { error: 'Internal server error' };
    await logApiCall(woltOrderReferenceId, requestBody, errorResponse, 500, startTime);
    return NextResponse.json(errorResponse, { status: 500 });
  }
}

// Helper function to log API calls
async function logApiCall(
  orderId: string,
  requestBody: unknown,
  responseBody: unknown,
  status: number,
  startTime: number
) {
  try {
    const logEntry = {
      id: `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
      timestamp: new Date().toISOString(),
      type: 'cancel-delivery',
      request: {
        method: 'PATCH',
        url: `/api/wolt/deliveries/${orderId}/cancel`,
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

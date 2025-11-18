import { NextRequest, NextResponse } from 'next/server';
import { DeliveryQuoteRequest } from '@/types/wolt-drive';

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  let requestBody: DeliveryQuoteRequest & { venue_id?: string } | null = null;
  
  try {
    requestBody = await request.json();



    // Use server-side environment variables, fallback to public ones
    const apiToken = process.env.WOLT_API_TOKEN || process.env.NEXT_PUBLIC_WOLT_API_TOKEN;
    const defaultVenueId = process.env.WOLT_VENUE_ID || process.env.NEXT_PUBLIC_WOLT_VENUE_ID;
    const isDevelopment = (process.env.WOLT_IS_DEVELOPMENT || process.env.NEXT_PUBLIC_WOLT_IS_DEVELOPMENT) === 'true';

    // Use venue_id from request body if provided, otherwise use default from env
    const venueId = requestBody?.venue_id || defaultVenueId;


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
    
    let response = await fetch(woltApiUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(cleanRequestBody),
    });

    // Handle INVALID_SCHEDULED_DROPOFF_TIME error with retry
    if (!response.ok) {
      const errorText = await response.text();
      
      // Check if error is INVALID_SCHEDULED_DROPOFF_TIME
      if (errorText.includes('INVALID_SCHEDULED_DROPOFF_TIME')) {
        console.log('Received INVALID_SCHEDULED_DROPOFF_TIME error, attempting to parse earliest delivery time...');
        
        // Try to parse the error response to get the earliest possible time
        try {
          const errorJson = JSON.parse(errorText);
          
          // Look for earliest_scheduled_dropoff_time or parse from details message
          let earliestTime = errorJson.earliest_scheduled_dropoff_time;
          
          // If not found directly, try to extract from details message
          // Example: "Scheduled time (2025-11-18T23:31:14.456Z) is too early. Earliest possible delivery at 2025-11-18T23:51:14.929Z."
          if (!earliestTime && errorJson.details) {
            const match = errorJson.details.match(/Earliest possible delivery at ([0-9T:.Z-]+)/);
            if (match && match[1]) {
              earliestTime = match[1];
            }
          }
          
          if (earliestTime) {
            console.log(`Found earliest time: ${earliestTime}, retrying with updated schedule...`);
            
            // Update the scheduled time in the request
            const retryRequestBody = {
              ...cleanRequestBody,
              scheduled_dropoff_time: earliestTime
            };
            
            // Retry the request with updated time
            response = await fetch(woltApiUrl, {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${apiToken}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify(retryRequestBody),
            });
            
            // If retry fails, return the retry error
            if (!response.ok) {
              const retryErrorText = await response.text();
              const errorResponse = { error: `Wolt API error after retry: ${retryErrorText}` };
              await logApiCall(requestBody, errorResponse, response.status, startTime, 'shipment-promise');
              return NextResponse.json(errorResponse, { status: response.status });
            }
            
            // If retry succeeds, continue with normal flow
            console.log('Retry successful with earliest scheduled time');
          } else {
            // No earliest time found in error, return original error
            const errorResponse = { error: `Wolt API error: ${errorText}` };
            await logApiCall(requestBody, errorResponse, response.status, startTime, 'shipment-promise');
            return NextResponse.json(errorResponse, { status: response.status });
          }
        } catch (parseError) {
          console.error('Failed to parse error response:', parseError);
          // Return original error if parsing fails
          const errorResponse = { error: `Wolt API error: ${errorText}` };
          await logApiCall(requestBody, errorResponse, response.status, startTime, 'shipment-promise');
          return NextResponse.json(errorResponse, { status: response.status });
        }
      } else {
        // Not an INVALID_SCHEDULED_DROPOFF_TIME error, return as-is
        const errorResponse = { error: `Wolt API error: ${errorText}` };
        await logApiCall(requestBody, errorResponse, response.status, startTime, 'shipment-promise');
        return NextResponse.json(errorResponse, { status: response.status });
      }
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
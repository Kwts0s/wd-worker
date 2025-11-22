import { NextRequest, NextResponse } from 'next/server';
import { CreateDeliveryRequest, DeliveryResponse } from '@/types/wolt-drive';
import { saveDelivery, getAllDeliveries } from '@/lib/db';

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  let requestBody: CreateDeliveryRequest & { venue_id?: string } | null = null;
  
  try {
    requestBody = await request.json();

    // Use server-side environment variables, fallback to public ones
    const apiToken = process.env.WOLT_API_TOKEN || process.env.NEXT_PUBLIC_WOLT_API_TOKEN;
    const defaultVenueId = process.env.WOLT_VENUE_ID || process.env.NEXT_PUBLIC_WOLT_VENUE_ID;
    const isDevelopment = (process.env.WOLT_IS_DEVELOPMENT || process.env.NEXT_PUBLIC_WOLT_IS_DEVELOPMENT) === 'true';

    // Use venue_id from request body if provided, otherwise use default from env
    const venueId = requestBody?.venue_id || defaultVenueId;

    if (!apiToken || !venueId) {
      const errorResponse = { error: 'Missing API configuration' };
      await logApiCall(requestBody, errorResponse, 500, startTime, 'create-delivery');
      return NextResponse.json(errorResponse, { status: 500 });
    }

    const baseURL = isDevelopment
      ? 'https://daas-public-api.development.dev.woltapi.com'
      : 'https://daas-public-api.wolt.com';

    // Remove venue_id from body before sending to Wolt API
    const { venue_id: _venue_id, ...cleanRequestBody } = requestBody as CreateDeliveryRequest & { venue_id?: string };

    let response = await fetch(
      `${baseURL}/v1/venues/${venueId}/deliveries`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(cleanRequestBody),
      }
    );

    // Handle INVALID_SCHEDULED_DROPOFF_TIME error with retry
    if (!response.ok) {
      const errorText = await response.text();
      
      // Check if error is INVALID_SCHEDULED_DROPOFF_TIME
      if (errorText.includes('INVALID_SCHEDULED_DROPOFF_TIME')) {
        console.log('Received INVALID_SCHEDULED_DROPOFF_TIME error, attempting to parse earliest delivery time...');
        
        // Try to parse the error response to get the earliest possible time
        try {
          const errorJson = JSON.parse(errorText);
          
          // Look for earliest_scheduled_dropoff_time in error response
          let earliestTime = errorJson.earliest_scheduled_dropoff_time || 
                              errorJson.details?.earliest_scheduled_dropoff_time;
          
          // If not found directly, try to extract from details message
          if (!earliestTime && errorJson.details) {
            const match = errorJson.details.match(/Earliest possible delivery at (\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z)/);
            if (match && match[1]) {
              earliestTime = match[1];
            }
          }
          
          if (earliestTime) {
            console.log(`Found earliest time: ${earliestTime}, retrying with updated schedule...`);
            
            // Validate the datetime format before using it
            let adjustedTime: string;
            try {
              const testDate = new Date(earliestTime);
              if (isNaN(testDate.getTime())) {
                throw new Error('Invalid datetime');
              }
              
              // Add 5-second buffer to the earliest time to account for API processing delay
              // This prevents the retry from also being "too early"
              const bufferedDate = new Date(testDate.getTime() + 5000);
              adjustedTime = bufferedDate.toISOString();
              console.log(`Adjusted retry time with 5s buffer: ${adjustedTime}`);
            } catch {
              console.error('Invalid earliest time format:', earliestTime);
              const errorResponse = { error: `Wolt API error: ${errorText}` };
              await logApiCall(requestBody, errorResponse, response.status, startTime, 'create-delivery');
              return NextResponse.json(errorResponse, { status: response.status });
            }
            
            // Update the scheduled times in the request with the buffered time
            const retryRequestBody = {
              ...cleanRequestBody,
              pickup: {
                ...cleanRequestBody.pickup,
                options: {
                  ...cleanRequestBody.pickup.options,
                  scheduled_time: adjustedTime
                }
              },
              dropoff: {
                ...cleanRequestBody.dropoff,
                options: {
                  ...cleanRequestBody.dropoff.options,
                  scheduled_time: adjustedTime
                }
              }
            };
            
            // Retry the request with updated time
            response = await fetch(
              `${baseURL}/v1/venues/${venueId}/deliveries`,
              {
                method: 'POST',
                headers: {
                  'Authorization': `Bearer ${apiToken}`,
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify(retryRequestBody),
              }
            );
            
            // If retry fails, return the retry error
            if (!response.ok) {
              const retryErrorText = await response.text();
              const errorResponse = { error: `Wolt API error after retry: ${retryErrorText}` };
              await logApiCall(requestBody, errorResponse, response.status, startTime, 'create-delivery');
              return NextResponse.json(errorResponse, { status: response.status });
            }
            
            // If retry succeeds, continue with normal flow
            console.log('Retry successful with earliest scheduled time');
          } else {
            // No earliest time found in error, return original error
            const errorResponse = { error: `Wolt API error: ${errorText}` };
            await logApiCall(requestBody, errorResponse, response.status, startTime, 'create-delivery');
            return NextResponse.json(errorResponse, { status: response.status });
          }
        } catch (parseError) {
          console.error('Failed to parse error response:', parseError);
          // Return original error if parsing fails
          const errorResponse = { error: `Wolt API error: ${errorText}` };
          await logApiCall(requestBody, errorResponse, response.status, startTime, 'create-delivery');
          return NextResponse.json(errorResponse, { status: response.status });
        }
      } else {
        // Not an INVALID_SCHEDULED_DROPOFF_TIME error, return as-is
        const errorResponse = { error: `Wolt API error: ${errorText}` };
        await logApiCall(requestBody, errorResponse, response.status, startTime, 'create-delivery');
        return NextResponse.json(errorResponse, { status: response.status });
      }
    }

    const data = await response.json() as DeliveryResponse;
    
    // Save delivery to database
    try {
      saveDelivery(data);
    } catch (dbError) {
      console.error('Failed to save delivery to database:', dbError);
      // Continue anyway - don't fail the request
    }
    
    await logApiCall(requestBody, data, response.status, startTime, 'create-delivery');
    return NextResponse.json(data);
  } catch (error) {
    console.error('Create delivery error:', error);
    const errorResponse = { error: 'Internal server error' };
    await logApiCall(requestBody, errorResponse, 500, startTime, 'create-delivery');
    return NextResponse.json(errorResponse, { status: 500 });
  }
}

/**
 * GET endpoint to retrieve all deliveries from SQLite database
 */
export async function GET() {
  try {
    const deliveries = getAllDeliveries();
    return NextResponse.json({ deliveries });
  } catch (error) {
    console.error('Failed to retrieve deliveries:', error);
    return NextResponse.json({ error: 'Failed to retrieve deliveries' }, { status: 500 });
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
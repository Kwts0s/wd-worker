import { NextRequest, NextResponse } from 'next/server';
import { DeliveryQuoteRequest } from '@/types/wolt-drive';

export async function POST(request: NextRequest) {
  try {
    const body: DeliveryQuoteRequest = await request.json();

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
    const venueId = process.env.WOLT_VENUE_ID || process.env.NEXT_PUBLIC_WOLT_VENUE_ID;
    const isDevelopment = (process.env.WOLT_IS_DEVELOPMENT || process.env.NEXT_PUBLIC_WOLT_IS_DEVELOPMENT) === 'true';

    console.log('Environment check:', {
      hasToken: !!apiToken,
      hasVenueId: !!venueId,
      isDevelopment,
      tokenStart: apiToken?.substring(0, 10),
      venueId: venueId?.substring(0, 10),
    });

    if (!apiToken || !venueId) {
      console.error('Missing API configuration:', { apiToken: !!apiToken, venueId: !!venueId });
      return NextResponse.json(
        { 
          error: 'Missing API configuration',
          details: { hasToken: !!apiToken, hasVenueId: !!venueId }
        },
        { status: 500 }
      );
    }

    const baseURL = isDevelopment
      ? 'https://daas-public-api.development.dev.woltapi.com'
      : 'https://daas-public-api.wolt.com';

    const response = await fetch(
      `${baseURL}/v1/venues/${venueId}/shipment-promises`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      return NextResponse.json(
        { error: `Wolt API error: ${errorText}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Shipment promise error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
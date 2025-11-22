import { NextRequest, NextResponse } from 'next/server';
import { WebhookEvent } from '@/types/wolt-drive';
import { verifyWebhookSignature, getWoltApiConfig } from '@/lib/wolt-api-utils';
import { updateDeliveryStatus, saveDelivery, getDatabase } from '@/lib/db';

/**
 * GET endpoint to retrieve webhook event logs
 */
export async function GET() {
  try {
    const db = getDatabase();
    
    // Ensure table exists
    db.exec(`
      CREATE TABLE IF NOT EXISTS webhook_events (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        event_type TEXT,
        delivery_id TEXT,
        merchant_id TEXT,
        status TEXT DEFAULT 'success',
        payload TEXT,
        processed_at TEXT,
        processing_time_ms INTEGER
      )
    `);

    const stmt = db.prepare(`
      SELECT * FROM webhook_events 
      ORDER BY processed_at DESC 
      LIMIT 100
    `);
    
    const events = stmt.all();
    
    return NextResponse.json({ events });
  } catch (error) {
    console.error('Failed to retrieve webhook events:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve webhook events' },
      { status: 500 }
    );
  }
}

/**
 * Webhook endpoint for receiving Wolt Drive delivery status updates
 * 
 * Wolt Drive will send POST requests to this endpoint whenever a delivery status changes.
 * The webhook payload includes event type, delivery ID, and updated delivery data.
 */
export async function POST(request: NextRequest) {
  const startTime = Date.now();
  let webhookBody: WebhookEvent | null = null;

  try {
    // Get raw body for signature verification
    const rawBody = await request.text();
    
    // Parse the JSON body
    try {
      webhookBody = JSON.parse(rawBody);
    } catch (parseError) {
      console.error('Failed to parse webhook body:', parseError);
      return NextResponse.json(
        { error: 'Invalid JSON payload' },
        { status: 400 }
      );
    }

    // Get webhook signature from header
    const signature = request.headers.get('x-wolt-signature');
    
    // Verify signature if webhook secret is configured
    const { webhookSecret } = getWoltApiConfig();
    
    if (webhookSecret) {
      if (!signature) {
        console.error('Missing webhook signature');
        return NextResponse.json(
          { error: 'Missing signature' },
          { status: 401 }
        );
      }

      const isValid = await verifyWebhookSignature(rawBody, signature, webhookSecret);
      
      if (!isValid) {
        console.error('Invalid webhook signature');
        return NextResponse.json(
          { error: 'Invalid signature' },
          { status: 401 }
        );
      }
    } else {
      console.warn('WOLT_WEBHOOK_SECRET not configured - skipping signature verification');
    }

    // Ensure webhookBody is not null at this point
    if (!webhookBody) {
      return NextResponse.json(
        { error: 'Invalid webhook payload' },
        { status: 400 }
      );
    }

    // Log the webhook event
    await logWebhookEvent(webhookBody, startTime);

    // Process the webhook event
    await processWebhookEvent(webhookBody);

    // Return success response
    return NextResponse.json(
      { 
        received: true,
        event_type: webhookBody.event_type,
        delivery_id: webhookBody.delivery_id
      },
      { status: 200 }
    );

  } catch (error) {
    console.error('Webhook processing error:', error);
    
    // Log error
    await logWebhookEvent(
      webhookBody || { error: 'Failed to parse webhook' },
      startTime,
      'error'
    );

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Process webhook event and update database
 */
async function processWebhookEvent(event: WebhookEvent): Promise<void> {
  console.log(`Processing webhook event: ${event.event_type} for delivery ${event.delivery_id}`);

  switch (event.event_type) {
    case 'delivery.created':
      // Delivery was created - store in database
      if (event.data) {
        try {
          saveDelivery(event.data as never);
          console.log(`Delivery ${event.delivery_id} saved to database`);
        } catch (error) {
          console.error(`Failed to save delivery ${event.delivery_id}:`, error);
        }
      }
      break;

    case 'delivery.status_changed':
      // Delivery status changed - update database
      if (event.data && typeof event.data === 'object' && 'status' in event.data) {
        try {
          updateDeliveryStatus(event.delivery_id, String(event.data.status));
          console.log(`Delivery ${event.delivery_id} status updated to ${event.data.status}`);
        } catch (error) {
          console.error(`Failed to update delivery ${event.delivery_id}:`, error);
        }
      }
      break;

    case 'delivery.delivered':
      // Delivery was completed
      try {
        updateDeliveryStatus(event.delivery_id, 'delivered');
        console.log(`Delivery ${event.delivery_id} marked as delivered`);
      } catch (error) {
        console.error(`Failed to update delivery ${event.delivery_id}:`, error);
      }
      break;

    case 'delivery.cancelled':
      // Delivery was cancelled
      try {
        updateDeliveryStatus(event.delivery_id, 'cancelled');
        console.log(`Delivery ${event.delivery_id} marked as cancelled`);
      } catch (error) {
        console.error(`Failed to update delivery ${event.delivery_id}:`, error);
      }
      break;

    default:
      console.warn(`Unknown webhook event type: ${event.event_type}`);
  }
}

/**
 * Log webhook event to database
 */
async function logWebhookEvent(
  event: WebhookEvent | { error: string },
  startTime: number,
  status: 'success' | 'error' = 'success'
): Promise<void> {
  try {
    const db = getDatabase();
    
    // Ensure webhook_events table exists
    db.exec(`
      CREATE TABLE IF NOT EXISTS webhook_events (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        event_type TEXT,
        delivery_id TEXT,
        merchant_id TEXT,
        status TEXT DEFAULT 'success',
        payload TEXT,
        processed_at TEXT,
        processing_time_ms INTEGER
      )
    `);

    const stmt = db.prepare(`
      INSERT INTO webhook_events (
        event_type,
        delivery_id,
        merchant_id,
        status,
        payload,
        processed_at,
        processing_time_ms
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    const webhookEvent = event as WebhookEvent;
    
    stmt.run(
      webhookEvent.event_type || 'unknown',
      webhookEvent.delivery_id || 'unknown',
      webhookEvent.merchant_id || 'unknown',
      status,
      JSON.stringify(event),
      new Date().toISOString(),
      Date.now() - startTime
    );

    console.log(`Webhook event logged to database`);
  } catch (error) {
    console.error('Failed to log webhook event:', error);
  }
}

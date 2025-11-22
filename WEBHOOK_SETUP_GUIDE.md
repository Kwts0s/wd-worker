# Wolt Drive Webhook Setup Guide

Complete guide for setting up and testing Wolt Drive webhooks for real-time delivery status updates.

## 📋 Overview

Webhooks allow your application to receive real-time notifications when delivery statuses change, eliminating the need for polling the API. This guide covers:

1. Configuring webhooks in Wolt merchant dashboard
2. Setting up your webhook endpoint
3. Verifying webhook signatures
4. Testing webhook integration
5. Monitoring and debugging

---

## 🔧 Configuration

### Step 1: Set Environment Variables

Add the webhook secret to your environment configuration:

```bash
# .env.local or production environment
WOLT_WEBHOOK_SECRET=your_webhook_secret_here
```

**Important:** This secret is provided by Wolt when you configure your webhook URL in the merchant dashboard. Keep it secure and never commit it to version control.

### Step 2: Configure Webhook URL in Wolt Dashboard

1. Log into your [Wolt Merchant Dashboard](https://merchant.wolt.com)
2. Navigate to **Developer Settings** or **API Settings**
3. Find the **Webhooks** section
4. Click **Add Webhook Endpoint**
5. Enter your webhook URL:
   - **Development:** `https://your-ngrok-url.ngrok.io/api/wolt/webhooks`
   - **Production:** `https://yourdomain.com/api/wolt/webhooks`
6. Save the configuration
7. Copy the **Webhook Secret** provided by Wolt
8. Add the secret to your environment variables

---

## 🔐 Security: Signature Verification

All webhook requests from Wolt Drive include an `X-Wolt-Signature` header containing an HMAC SHA-256 signature. Your application automatically verifies this signature to ensure the webhook is authentic.

### How Signature Verification Works

```typescript
// The webhook endpoint automatically:
1. Receives the raw request body
2. Gets the signature from X-Wolt-Signature header
3. Computes HMAC SHA-256 of body using WOLT_WEBHOOK_SECRET
4. Compares computed signature with received signature
5. Rejects request if signatures don't match
```

### Manual Verification (for testing)

```javascript
const crypto = require('crypto');

function verifyWebhookSignature(payload, signature, secret) {
  const hmac = crypto.createHmac('sha256', secret);
  const digest = hmac.update(payload).digest('hex');
  return digest === signature;
}
```

---

## 📡 Webhook Event Types

Your application handles the following webhook events:

### 1. `delivery.created`
Sent when a new delivery is created.

```json
{
  "event_type": "delivery.created",
  "delivery_id": "wolt-delivery-id-123",
  "timestamp": "2024-11-22T10:30:00Z",
  "merchant_id": "your-merchant-id",
  "data": {
    // Full delivery object
  }
}
```

**Action:** Stores delivery in database if not already present.

---

### 2. `delivery.status_changed`
Sent when delivery status changes (e.g., courier assigned, picked up, in transit).

```json
{
  "event_type": "delivery.status_changed",
  "delivery_id": "wolt-delivery-id-123",
  "timestamp": "2024-11-22T10:35:00Z",
  "merchant_id": "your-merchant-id",
  "data": {
    "status": "picked_up",
    // Additional status details
  }
}
```

**Action:** Updates delivery status in database.

---

### 3. `delivery.delivered`
Sent when delivery is successfully completed.

```json
{
  "event_type": "delivery.delivered",
  "delivery_id": "wolt-delivery-id-123",
  "timestamp": "2024-11-22T11:00:00Z",
  "merchant_id": "your-merchant-id",
  "data": {
    "status": "delivered",
    "delivered_at": "2024-11-22T11:00:00Z"
  }
}
```

**Action:** Updates status to 'delivered' and stores completion time.

---

### 4. `delivery.cancelled`
Sent when delivery is cancelled.

```json
{
  "event_type": "delivery.cancelled",
  "delivery_id": "wolt-delivery-id-123",
  "timestamp": "2024-11-22T10:45:00Z",
  "merchant_id": "your-merchant-id",
  "data": {
    "status": "cancelled",
    "cancellation_reason": "Customer request"
  }
}
```

**Action:** Updates status to 'cancelled' and stores cancellation details.

---

## 🧪 Testing Webhooks

### Local Development Testing with ngrok

Since Wolt needs to reach your webhook endpoint, you'll need to expose your local server:

#### 1. Install ngrok

```bash
# macOS
brew install ngrok

# Or download from https://ngrok.com/download
```

#### 2. Start your local development server

```bash
npm run dev
```

#### 3. Create ngrok tunnel

```bash
ngrok http 3000
```

This will output something like:
```
Forwarding    https://abc123.ngrok.io -> http://localhost:3000
```

#### 4. Configure webhook URL in Wolt Dashboard

Use the ngrok URL: `https://abc123.ngrok.io/api/wolt/webhooks`

#### 5. Test webhook delivery

Create a test delivery through your application or the Wolt API, then check:
- Your application logs
- Webhook logs UI in the application (Webhooks tab)
- ngrok web interface (http://127.0.0.1:4040)

---

### Manual Webhook Testing with cURL

Test your webhook endpoint manually:

```bash
# Test webhook endpoint (will fail signature verification without proper secret)
curl -X POST http://localhost:3000/api/wolt/webhooks \
  -H "Content-Type: application/json" \
  -H "X-Wolt-Signature: test-signature" \
  -d '{
    "event_type": "delivery.status_changed",
    "delivery_id": "test-delivery-123",
    "timestamp": "2024-11-22T10:30:00Z",
    "merchant_id": "test-merchant",
    "data": {
      "status": "in_transit"
    }
  }'
```

Expected responses:
- `401` - Invalid or missing signature (expected if testing without proper signature)
- `200` - Success (webhook processed)
- `400` - Invalid payload
- `500` - Internal server error

---

### Generate Valid Test Signature

To test with valid signature:

```javascript
const crypto = require('crypto');

const payload = JSON.stringify({
  event_type: 'delivery.status_changed',
  delivery_id: 'test-delivery-123',
  timestamp: '2024-11-22T10:30:00Z',
  merchant_id: 'test-merchant',
  data: { status: 'in_transit' }
});

const secret = 'your_webhook_secret_here';
const signature = crypto.createHmac('sha256', secret)
  .update(payload)
  .digest('hex');

console.log('Signature:', signature);
```

Then use this signature in your cURL test:

```bash
curl -X POST http://localhost:3000/api/wolt/webhooks \
  -H "Content-Type: application/json" \
  -H "X-Wolt-Signature: <generated-signature>" \
  -d '<payload-json>'
```

---

## 📊 Monitoring Webhooks

### View Webhook Logs in UI

1. Navigate to your application
2. Click on the **Webhooks** tab
3. View all received webhook events with:
   - Event type
   - Delivery ID
   - Timestamp
   - Processing status
   - Processing time
   - Full payload

### Database Queries

Query webhook events directly from the database:

```sql
-- View all webhook events
SELECT * FROM webhook_events 
ORDER BY processed_at DESC 
LIMIT 100;

-- View failed webhooks
SELECT * FROM webhook_events 
WHERE status = 'error' 
ORDER BY processed_at DESC;

-- Count webhooks by event type
SELECT event_type, COUNT(*) as count 
FROM webhook_events 
GROUP BY event_type;

-- Average processing time
SELECT AVG(processing_time_ms) as avg_ms 
FROM webhook_events 
WHERE status = 'success';
```

### Application Logs

Check server logs for webhook processing:

```bash
# Development
npm run dev

# Look for log entries like:
# Processing webhook event: delivery.status_changed for delivery abc123
# Webhook event logged to database
# Delivery abc123 status updated to in_transit
```

---

## 🐛 Troubleshooting

### Issue: Webhooks not being received

**Possible causes:**
1. Webhook URL not configured in Wolt dashboard
2. Server not publicly accessible (use ngrok for local testing)
3. Firewall blocking incoming requests
4. SSL certificate issues (production only)

**Solution:**
- Verify webhook URL in Wolt dashboard
- Test with ngrok for local development
- Check server logs for incoming requests
- Verify SSL certificate is valid (production)

---

### Issue: Signature verification failing

**Possible causes:**
1. `WOLT_WEBHOOK_SECRET` not set or incorrect
2. Using wrong secret (dev vs prod)
3. Payload modified before verification

**Solution:**
- Check environment variable is set correctly
- Verify secret matches Wolt dashboard
- Ensure webhook endpoint reads raw body before parsing
- Check logs for detailed error message

---

### Issue: Database not updating

**Possible causes:**
1. Database write permissions
2. Delivery ID not found in database
3. Database connection issues

**Solution:**
- Check `/data` directory permissions
- Verify delivery exists in database
- Check application logs for database errors
- Restart application if connection issues

---

### Issue: Slow webhook processing

**Possible causes:**
1. Database queries slow
2. External API calls in webhook handler
3. Large webhook payload

**Solution:**
- Add database indexes
- Move heavy processing to background jobs
- Optimize database queries
- Monitor processing time in webhook logs

---

## 🔄 Webhook Retry Logic

### Wolt's Retry Behavior

Wolt Drive will retry failed webhook deliveries:
- Exponential backoff strategy
- Multiple retry attempts
- Up to 24 hours of retries
- Manual retry option in Wolt dashboard

### Your Application's Response

Return appropriate HTTP status codes:
- `200` - Success, don't retry
- `400` - Invalid payload, don't retry
- `401` - Authentication failed, don't retry
- `500` - Internal error, please retry

---

## 📈 Best Practices

1. **Always verify signatures** - Never process webhooks without verification
2. **Return quickly** - Process webhook in under 5 seconds, queue heavy work
3. **Log everything** - Keep detailed logs for debugging
4. **Monitor failures** - Set up alerts for failed webhooks
5. **Handle duplicates** - Use idempotent operations
6. **Test thoroughly** - Test all event types before production
7. **Keep secrets secure** - Never commit webhook secrets
8. **Document changes** - Keep track of webhook schema changes

---

## 📞 Support

### Getting Help

- **Wolt Developer Docs:** https://developer.wolt.com/docs/wolt-drive/webhooks
- **Wolt API Support:** api-support@wolt.com
- **Application Logs:** Check server logs and webhook logs UI
- **Database Logs:** Query `webhook_events` table

### Reporting Issues

When reporting webhook issues to Wolt support, include:
- Webhook URL configured
- Example webhook payload (sanitized)
- Timestamp of failed webhook
- Error message or status code
- Application logs (sanitized)

---

## ✅ Checklist

Before deploying to production:

- [ ] `WOLT_WEBHOOK_SECRET` environment variable set
- [ ] Webhook URL configured in Wolt dashboard
- [ ] SSL certificate valid (HTTPS required)
- [ ] Signature verification tested
- [ ] All webhook event types tested
- [ ] Database updates verified
- [ ] Webhook logs monitoring setup
- [ ] Error alerting configured
- [ ] Documentation reviewed by team
- [ ] Backup webhook endpoint configured (optional)

---

**Your webhook integration is now complete!** 🎉

Monitor the Webhooks tab in your application to see real-time delivery updates as they happen.

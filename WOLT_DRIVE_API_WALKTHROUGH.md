# Wolt Drive API - Complete Walkthrough

## Overview

Wolt Drive is a delivery-as-a-service API that allows e-commerce businesses to integrate professional courier delivery services into their platforms. This guide provides a comprehensive walkthrough of the API.

## Table of Contents

1. [Authentication](#authentication)
2. [Base URL](#base-url)
3. [Core Concepts](#core-concepts)
4. [API Endpoints](#api-endpoints)
5. [Webhook Events](#webhook-events)
6. [Error Handling](#error-handling)
7. [Best Practices](#best-practices)

---

## Authentication

Wolt Drive API uses **Bearer Token** authentication. All requests must include the API token in the Authorization header:

```
Authorization: Bearer YOUR_API_TOKEN
```

### Getting API Keys

1. Sign up for a Wolt Drive merchant account
2. Navigate to the Developer Dashboard
3. Generate API credentials (token and merchant ID)
4. Store credentials securely (use environment variables)

---

## Base URL

**Development/Testing:**
```
https://daas-public-api.development.dev.woltapi.com
```

**Production:**
```
https://daas-public-api.wolt.com
```

---

## Core Concepts

### Delivery Lifecycle

```
Created → Scheduled → Courier Assigned → Picking Up → 
In Transit → Delivered (or Cancelled)
```

### Key Objects

#### 1. Location Object
```json
{
  "formatted_address": "Street 123, 00100 City, Country",
  "coordinates": {
    "lat": 60.168992,
    "lon": 24.942590
  }
}
```

#### 2. Contact Details
```json
{
  "name": "John Doe",
  "phone_number": "+358401234567",
  "send_tracking_link_sms": true
}
```

#### 3. Delivery Contents
```json
{
  "count": 2,
  "description": "Product name",
  "identifier": "SKU-123",
  "tags": ["food", "fragile"]
}
```

---

## API Endpoints

### 1. Get Delivery Quote

**Purpose:** Calculate delivery cost and estimated time before creating an order.

**Endpoint:** `POST /merchants/{merchant_id}/delivery-quote`

**Request:**
```json
{
  "pickup": {
    "location": {
      "formatted_address": "Pickup Street 1, 00100 Helsinki",
      "coordinates": {
        "lat": 60.168992,
        "lon": 24.942590
      }
    }
  },
  "dropoff": {
    "location": {
      "formatted_address": "Delivery Street 2, 00100 Helsinki",
      "coordinates": {
        "lat": 60.169857,
        "lon": 24.938379
      }
    }
  }
}
```

**Response:**
```json
{
  "fee": {
    "amount": 590,
    "currency": "EUR"
  },
  "estimated_pickup_time": "2024-01-15T10:15:00Z",
  "estimated_delivery_time": "2024-01-15T10:45:00Z",
  "distance_meters": 1500
}
```

**Use Case:** Display delivery cost to customer before checkout.

---

### 2. Create Delivery

**Purpose:** Create a new delivery order.

**Endpoint:** `POST /merchants/{merchant_id}/deliveries`

**Request:**
```json
{
  "pickup": {
    "location": {
      "formatted_address": "Store Location, Street 1",
      "coordinates": {
        "lat": 60.168992,
        "lon": 24.942590
      }
    },
    "comment": "Ring doorbell, use side entrance",
    "contact_details": {
      "name": "Store Manager",
      "phone_number": "+358401234567",
      "send_tracking_link_sms": false
    }
  },
  "dropoff": {
    "location": {
      "formatted_address": "Customer Address, Street 2",
      "coordinates": {
        "lat": 60.169857,
        "lon": 24.938379
      }
    },
    "comment": "Leave at door if no answer",
    "contact_details": {
      "name": "Customer Name",
      "phone_number": "+358409876543",
      "send_tracking_link_sms": true
    }
  },
  "customer_support": {
    "email": "support@yourstore.com",
    "phone_number": "+358401234567",
    "url": "https://yourstore.com/support"
  },
  "merchant_order_reference_id": "ORDER-12345",
  "is_no_contact_delivery": false,
  "contents": [
    {
      "count": 2,
      "description": "Pizza Margherita",
      "identifier": "PIZZA-001",
      "tags": ["food", "hot"]
    },
    {
      "count": 1,
      "description": "Coca Cola 0.5L",
      "identifier": "DRINK-001",
      "tags": ["beverage"]
    }
  ],
  "tips": []
}
```

**Response:**
```json
{
  "id": "delivery-uuid-12345",
  "status": "scheduled",
  "tracking": {
    "url": "https://wolt.com/track/delivery-uuid-12345",
    "code": "ABC123"
  },
  "created_at": "2024-01-15T10:00:00Z",
  "fee": {
    "amount": 590,
    "currency": "EUR"
  },
  "estimated_pickup_time": "2024-01-15T10:15:00Z",
  "estimated_delivery_time": "2024-01-15T10:45:00Z"
}
```

**Important Fields:**
- `merchant_order_reference_id`: Your internal order ID for reference
- `is_no_contact_delivery`: Set to true for contactless delivery
- `send_tracking_link_sms`: Automatically send tracking link via SMS

---

### 3. Get Delivery Details

**Purpose:** Retrieve current status and details of a delivery.

**Endpoint:** `GET /merchants/{merchant_id}/deliveries/{delivery_id}`

**Response:**
```json
{
  "id": "delivery-uuid-12345",
  "status": "in_transit",
  "pickup": { /* pickup details */ },
  "dropoff": { /* dropoff details */ },
  "courier": {
    "name": "Courier Name",
    "phone_number": "+358401234567",
    "location": {
      "lat": 60.169500,
      "lon": 24.940000
    }
  },
  "tracking": {
    "url": "https://wolt.com/track/delivery-uuid-12345",
    "code": "ABC123"
  },
  "timeline": [
    {
      "status": "created",
      "timestamp": "2024-01-15T10:00:00Z"
    },
    {
      "status": "courier_assigned",
      "timestamp": "2024-01-15T10:10:00Z"
    },
    {
      "status": "picking_up",
      "timestamp": "2024-01-15T10:15:00Z"
    },
    {
      "status": "in_transit",
      "timestamp": "2024-01-15T10:25:00Z"
    }
  ],
  "estimated_delivery_time": "2024-01-15T10:45:00Z",
  "actual_pickup_time": "2024-01-15T10:20:00Z"
}
```

**Delivery Statuses:**
- `created`: Order created, waiting for courier
- `scheduled`: Courier will be assigned soon
- `courier_assigned`: Courier assigned, heading to pickup
- `picking_up`: Courier at pickup location
- `picked_up`: Package collected
- `in_transit`: En route to delivery
- `delivered`: Successfully delivered
- `cancelled`: Order cancelled

---

### 4. List Deliveries

**Purpose:** Get a list of all deliveries with filtering and pagination.

**Endpoint:** `GET /merchants/{merchant_id}/deliveries`

**Query Parameters:**
- `limit`: Number of results (1-100, default 20)
- `offset`: Pagination offset (default 0)
- `status`: Filter by status (optional)
- `created_after`: ISO 8601 timestamp (optional)
- `created_before`: ISO 8601 timestamp (optional)

**Example Request:**
```
GET /merchants/merchant-123/deliveries?limit=20&offset=0&status=in_transit
```

**Response:**
```json
{
  "deliveries": [
    {
      "id": "delivery-1",
      "status": "in_transit",
      "merchant_order_reference_id": "ORDER-123",
      "created_at": "2024-01-15T10:00:00Z"
    }
  ],
  "pagination": {
    "total": 150,
    "limit": 20,
    "offset": 0,
    "has_more": true
  }
}
```

---

### 5. Cancel Delivery

**Purpose:** Cancel a delivery before it's completed.

**Endpoint:** `POST /merchants/{merchant_id}/deliveries/{delivery_id}/cancel`

**Request:**
```json
{
  "reason": "Customer requested cancellation"
}
```

**Response:**
```json
{
  "id": "delivery-uuid-12345",
  "status": "cancelled",
  "cancelled_at": "2024-01-15T10:30:00Z",
  "cancellation_reason": "Customer requested cancellation",
  "refund": {
    "amount": 590,
    "currency": "EUR",
    "status": "pending"
  }
}
```

**Cancellation Rules:**
- Can cancel before courier picks up the package (usually free)
- After pickup, cancellation may incur fees
- Cannot cancel after delivery is completed

---

### 6. Get Tracking Information

**Purpose:** Get real-time tracking information including courier location.

**Endpoint:** `GET /merchants/{merchant_id}/deliveries/{delivery_id}/tracking`

**Response:**
```json
{
  "delivery_id": "delivery-uuid-12345",
  "status": "in_transit",
  "courier": {
    "name": "Courier Name",
    "location": {
      "lat": 60.169500,
      "lon": 24.940000,
      "heading": 45,
      "accuracy": 10
    },
    "updated_at": "2024-01-15T10:35:00Z"
  },
  "eta": "2024-01-15T10:45:00Z",
  "distance_to_destination_meters": 500,
  "tracking_url": "https://wolt.com/track/delivery-uuid-12345"
}
```

**Use Case:** Display real-time courier location on a map for customers.

---

## Webhook Events

Wolt Drive sends webhook notifications for delivery status changes. Configure your webhook URL in the merchant dashboard.

### Webhook Signature Verification

All webhooks include an `X-Wolt-Signature` header for verification:

```javascript
const crypto = require('crypto');

function verifyWebhook(payload, signature, secret) {
  const hmac = crypto.createHmac('sha256', secret);
  const digest = hmac.update(payload).digest('hex');
  return digest === signature;
}
```

### Event Types

#### 1. delivery.created
```json
{
  "event_type": "delivery.created",
  "delivery_id": "delivery-uuid",
  "timestamp": "2024-01-15T10:00:00Z",
  "merchant_id": "merchant-uuid",
  "data": {
    "status": "created",
    "merchant_order_reference_id": "ORDER-123"
  }
}
```

#### 2. delivery.status_changed
```json
{
  "event_type": "delivery.status_changed",
  "delivery_id": "delivery-uuid",
  "timestamp": "2024-01-15T10:25:00Z",
  "merchant_id": "merchant-uuid",
  "data": {
    "previous_status": "picking_up",
    "new_status": "in_transit",
    "courier": {
      "name": "Courier Name",
      "phone": "+358401234567"
    },
    "eta": "2024-01-15T10:45:00Z"
  }
}
```

#### 3. delivery.delivered
```json
{
  "event_type": "delivery.delivered",
  "delivery_id": "delivery-uuid",
  "timestamp": "2024-01-15T10:45:00Z",
  "merchant_id": "merchant-uuid",
  "data": {
    "delivered_at": "2024-01-15T10:45:00Z",
    "signature_url": "https://...",
    "photo_url": "https://..."
  }
}
```

#### 4. delivery.cancelled
```json
{
  "event_type": "delivery.cancelled",
  "delivery_id": "delivery-uuid",
  "timestamp": "2024-01-15T10:30:00Z",
  "merchant_id": "merchant-uuid",
  "data": {
    "cancelled_by": "merchant",
    "reason": "Customer requested cancellation",
    "refund_status": "pending"
  }
}
```

---

## Error Handling

### HTTP Status Codes

- `200 OK`: Request successful
- `201 Created`: Delivery created successfully
- `400 Bad Request`: Invalid request parameters
- `401 Unauthorized`: Invalid or missing API token
- `403 Forbidden`: Access denied
- `404 Not Found`: Resource not found
- `429 Too Many Requests`: Rate limit exceeded
- `500 Internal Server Error`: Server error

### Error Response Format

```json
{
  "error": {
    "code": "INVALID_COORDINATES",
    "message": "The provided coordinates are outside the service area",
    "details": {
      "field": "dropoff.location.coordinates",
      "provided": {"lat": 70.0, "lon": 25.0}
    }
  }
}
```

### Common Error Codes

| Code | Description | Solution |
|------|-------------|----------|
| `INVALID_COORDINATES` | Coordinates invalid or outside service area | Verify lat/lon values |
| `MISSING_REQUIRED_FIELD` | Required field is missing | Check API documentation |
| `INVALID_PHONE_NUMBER` | Phone number format invalid | Use E.164 format (+country code) |
| `DELIVERY_NOT_FOUND` | Delivery ID doesn't exist | Verify delivery ID |
| `CANNOT_CANCEL` | Delivery cannot be cancelled | Check delivery status |
| `RATE_LIMIT_EXCEEDED` | Too many requests | Implement exponential backoff |
| `INSUFFICIENT_BALANCE` | Account balance too low | Add funds to account |

---

## Best Practices

### 1. Request Quotes First
Always get a delivery quote before creating an order to show accurate pricing to customers.

```javascript
// Get quote first
const quote = await getDeliveryQuote(pickup, dropoff);
// Show quote.fee to customer
// Then create delivery if customer confirms
const delivery = await createDelivery(deliveryData);
```

### 2. Use Webhooks
Don't poll the API for status updates. Configure webhooks to receive real-time notifications.

```javascript
// Bad: Polling
setInterval(() => getDelivery(deliveryId), 30000);

// Good: Webhooks
app.post('/webhook', (req, res) => {
  const event = req.body;
  handleDeliveryEvent(event);
  res.status(200).send('OK');
});
```

### 3. Store merchant_order_reference_id
Always include your internal order ID for easy correlation:

```javascript
const delivery = await createDelivery({
  merchant_order_reference_id: "YOUR-ORDER-123",
  // ... other fields
});
```

### 4. Validate Coordinates
Ensure coordinates are accurate to avoid failed pickups/deliveries:

```javascript
function validateCoordinates(lat, lon) {
  return lat >= -90 && lat <= 90 && lon >= -180 && lon <= 180;
}
```

### 5. Handle Errors Gracefully
Implement retry logic with exponential backoff for transient errors:

```javascript
async function createDeliveryWithRetry(data, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await createDelivery(data);
    } catch (error) {
      if (error.status >= 500 && i < maxRetries - 1) {
        await sleep(Math.pow(2, i) * 1000);
        continue;
      }
      throw error;
    }
  }
}
```

### 6. Rate Limiting
Respect rate limits (typically 100 requests/minute):

```javascript
const rateLimiter = new RateLimiter({
  tokensPerInterval: 100,
  interval: 'minute'
});

await rateLimiter.removeTokens(1);
const result = await apiCall();
```

### 7. Secure API Keys
Never expose API keys in client-side code:

```javascript
// Bad: Client-side
const token = 'your-api-token-here';

// Good: Server-side only
const token = process.env.WOLT_API_TOKEN;
```

### 8. Test in Development Environment
Always test in development before going to production:

```javascript
const baseUrl = process.env.NODE_ENV === 'production'
  ? 'https://daas-public-api.wolt.com'
  : 'https://daas-public-api.development.dev.woltapi.com';
```

---

## Integration Flow Example

### Complete Order-to-Delivery Flow

```javascript
// 1. Customer adds items to cart and enters delivery address
const deliveryAddress = getCustomerAddress();

// 2. Get delivery quote to show cost
const quote = await fetch(`${baseUrl}/merchants/${merchantId}/delivery-quote`, {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${apiToken}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    pickup: storeLocation,
    dropoff: { location: deliveryAddress }
  })
});

const { fee, estimated_delivery_time } = await quote.json();

// 3. Show quote to customer
displayDeliveryOption(`${fee.amount/100} ${fee.currency}`, estimated_delivery_time);

// 4. Customer completes checkout
// 5. Create delivery order
const delivery = await fetch(`${baseUrl}/merchants/${merchantId}/deliveries`, {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${apiToken}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    pickup: {
      location: storeLocation,
      contact_details: {
        name: "Store",
        phone_number: storePhone,
        send_tracking_link_sms: false
      }
    },
    dropoff: {
      location: deliveryAddress,
      contact_details: {
        name: customerName,
        phone_number: customerPhone,
        send_tracking_link_sms: true
      }
    },
    merchant_order_reference_id: orderId,
    contents: cartItems.map(item => ({
      count: item.quantity,
      description: item.name,
      identifier: item.sku
    }))
  })
});

const deliveryData = await delivery.json();

// 6. Store delivery ID with order
await saveDeliveryId(orderId, deliveryData.id);

// 7. Send tracking link to customer
await sendTrackingEmail(customerEmail, deliveryData.tracking.url);

// 8. Receive webhook updates
// Your webhook endpoint handles status changes automatically
```

---

## Testing Checklist

Before going live, test these scenarios:

- [ ] Get quote for valid addresses
- [ ] Get quote for invalid/out-of-service addresses
- [ ] Create delivery with all required fields
- [ ] Create delivery with optional fields
- [ ] Get delivery details
- [ ] List deliveries with pagination
- [ ] Cancel delivery before pickup
- [ ] Try to cancel after pickup (should fail)
- [ ] Receive and verify webhook signatures
- [ ] Handle all webhook event types
- [ ] Test with invalid API token
- [ ] Test with missing required fields
- [ ] Test rate limiting behavior
- [ ] Test with malformed coordinates

---

## Support and Resources

- **API Documentation**: https://developer.wolt.com/docs/api/wolt-drive
- **Merchant Dashboard**: https://merchant.wolt.com
- **Support Email**: api-support@wolt.com
- **Status Page**: https://status.wolt.com

---

## Summary

The Wolt Drive API provides a comprehensive delivery solution with:

✅ **Easy Integration**: RESTful API with clear endpoints  
✅ **Real-time Tracking**: Live courier location and ETA  
✅ **Webhook Support**: Automatic status notifications  
✅ **Flexible Pricing**: Get quotes before committing  
✅ **Reliable Service**: Professional courier network  

Start with the Postman collection to explore the API, then implement the integration using the code examples in this guide.

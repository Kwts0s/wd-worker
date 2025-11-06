# Wolt Drive Integration Guide

This guide will help you integrate the Wolt Drive plugin into your existing e-commerce platform.

## Overview

The Wolt Drive plugin provides three main integration paths:

1. **Standalone Application** - Use the Next.js app as-is
2. **Component Library** - Import components into your existing app
3. **API Client** - Use just the API client in your backend

## Integration Path 1: Standalone Application

The simplest approach - deploy the Next.js application:

### Steps:

1. **Deploy the application:**
   ```bash
   cd wolt-drive-plugin
   npm install
   npm run build
   npm start
   ```

2. **Configure environment variables:**
   ```env
   NEXT_PUBLIC_WOLT_API_TOKEN=your_token
   NEXT_PUBLIC_WOLT_MERCHANT_ID=your_merchant_id
   NEXT_PUBLIC_WOLT_VENUE_ID=your_venue_id
   NEXT_PUBLIC_WOLT_IS_DEVELOPMENT=false
   ```

3. **Access the application:**
   - Your team can use the web interface to manage deliveries
   - Can be embedded in an iframe if needed

### Pros:
- ✅ No code changes needed
- ✅ Works immediately
- ✅ Full UI included

### Cons:
- ❌ Separate application to maintain
- ❌ Less integration with existing UI

## Integration Path 2: Component Library

Import React components into your existing Next.js/React application:

### Steps:

1. **Copy necessary files to your project:**
   ```bash
   # Copy these directories:
   wolt-drive-plugin/src/api/
   wolt-drive-plugin/src/components/
   wolt-drive-plugin/src/hooks/
   wolt-drive-plugin/src/store/
   wolt-drive-plugin/src/types/
   wolt-drive-plugin/src/lib/
   ```

2. **Install dependencies:**
   ```bash
   npm install zustand @tanstack/react-query axios
   npm install class-variance-authority clsx tailwind-merge lucide-react
   ```

3. **Add the React Query provider to your app:**
   ```tsx
   // app/layout.tsx or _app.tsx
   import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
   
   const queryClient = new QueryClient();
   
   export default function Layout({ children }) {
     return (
       <QueryClientProvider client={queryClient}>
         {children}
       </QueryClientProvider>
     );
   }
   ```

4. **Initialize the Wolt client:**
   ```tsx
   // In your app initialization
   import { initializeWoltClient } from '@/api/wolt-client';
   
   initializeWoltClient(
     process.env.NEXT_PUBLIC_WOLT_API_TOKEN!,
     process.env.NEXT_PUBLIC_WOLT_MERCHANT_ID!,
     process.env.NEXT_PUBLIC_WOLT_VENUE_ID!,
     process.env.NODE_ENV === 'development'
   );
   ```

5. **Use components in your pages:**
   ```tsx
   import { CreateDeliveryForm } from '@/components/create-delivery-form';
   import { DeliveryList } from '@/components/delivery-list';
   
   export default function DeliveriesPage() {
     return (
       <div>
         <h1>Manage Deliveries</h1>
         <CreateDeliveryForm />
         <DeliveryList />
       </div>
     );
   }
   ```

### Pros:
- ✅ Integrated with your existing UI
- ✅ Reusable components
- ✅ Full control over styling

### Cons:
- ❌ Requires React/Next.js
- ❌ Need to adapt components to your design system

## Integration Path 3: API Client Only

Use the Wolt Drive client in your backend or Node.js application:

### Steps:

1. **Copy the API client:**
   ```bash
   cp wolt-drive-plugin/src/api/wolt-client.ts your-backend/src/
   cp wolt-drive-plugin/src/types/wolt-drive.ts your-backend/src/
   ```

2. **Install dependencies:**
   ```bash
   npm install axios
   ```

3. **Use in your backend:**
   ```typescript
   import { WoltDriveClient } from './wolt-client';
   
   const client = new WoltDriveClient(
     process.env.WOLT_API_TOKEN,
     process.env.WOLT_MERCHANT_ID,
     process.env.WOLT_VENUE_ID,
     false // production
   );
   
   // Create a delivery
   const delivery = await client.createDelivery({
     pickup: { /* ... */ },
     dropoff: { /* ... */ },
     // ... other fields
   });
   
   // Get delivery status
   const status = await client.getDelivery(delivery.id);
   ```

4. **Create your own API endpoints:**
   ```typescript
   // Example Express.js endpoint
   app.post('/api/deliveries', async (req, res) => {
     try {
       const delivery = await client.createDelivery(req.body);
       res.json(delivery);
     } catch (error) {
       res.status(500).json({ error: error.message });
     }
   });
   ```

### Pros:
- ✅ Backend-only integration
- ✅ Works with any frontend
- ✅ More secure (API keys on server)

### Cons:
- ❌ Need to build your own UI
- ❌ Need to handle state management

## Integration with E-commerce Platforms

### Shopify Integration

Add to your Shopify admin or storefront:

```typescript
// In your Shopify app
import { WoltDriveClient } from './wolt-client';

// When order is placed
shopify.webhooks.on('orders/create', async (order) => {
  const client = new WoltDriveClient(apiToken, merchantId);
  
  const delivery = await client.createDelivery({
    pickup: shopLocation,
    dropoff: {
      location: {
        formatted_address: order.shipping_address.address1,
        coordinates: await geocodeAddress(order.shipping_address)
      },
      contact_details: {
        name: order.customer.name,
        phone_number: order.shipping_address.phone,
        send_tracking_link_sms: true
      }
    },
    merchant_order_reference_id: order.id.toString(),
    contents: order.line_items.map(item => ({
      count: item.quantity,
      description: item.name,
      identifier: item.sku
    }))
  });
  
  // Save delivery ID to order metadata
  await shopify.orders.update(order.id, {
    note_attributes: [
      { name: 'wolt_delivery_id', value: delivery.id }
    ]
  });
});
```

### WooCommerce Integration

Add to your WordPress plugin:

```php
// In your WooCommerce hooks
add_action('woocommerce_order_status_processing', 'create_wolt_delivery', 10, 1);

function create_wolt_delivery($order_id) {
    $order = wc_get_order($order_id);
    
    // Call your Node.js backend endpoint
    $response = wp_remote_post(YOUR_API_URL . '/create-delivery', [
        'body' => json_encode([
            'order_id' => $order_id,
            'customer_name' => $order->get_billing_first_name() . ' ' . $order->get_billing_last_name(),
            'customer_phone' => $order->get_billing_phone(),
            'address' => $order->get_shipping_address_1(),
            'items' => array_map(function($item) {
                return [
                    'description' => $item->get_name(),
                    'quantity' => $item->get_quantity()
                ];
            }, $order->get_items())
        ])
    ]);
    
    $delivery = json_decode(wp_remote_retrieve_body($response));
    update_post_meta($order_id, '_wolt_delivery_id', $delivery->id);
}
```

### Custom E-commerce Platform

For custom platforms, integrate at the checkout flow:

```typescript
// After payment is confirmed
async function onPaymentSuccess(order) {
  // 1. Get delivery quote first
  const quote = await woltClient.getDeliveryQuote({
    pickup: { location: storeLocation },
    dropoff: { location: customerAddress }
  });
  
  // 2. Create delivery
  const delivery = await woltClient.createDelivery({
    pickup: {
      location: storeLocation,
      contact_details: storeContact
    },
    dropoff: {
      location: customerAddress,
      contact_details: {
        name: order.customer.name,
        phone_number: order.customer.phone,
        send_tracking_link_sms: true
      }
    },
    merchant_order_reference_id: order.id,
    contents: order.items.map(item => ({
      count: item.quantity,
      description: item.name,
      identifier: item.sku
    }))
  });
  
  // 3. Save to database
  await db.orders.update(order.id, {
    deliveryId: delivery.id,
    trackingUrl: delivery.tracking.url
  });
  
  // 4. Send tracking link to customer
  await sendEmail(order.customer.email, {
    subject: 'Track your delivery',
    trackingUrl: delivery.tracking.url
  });
}
```

## Webhook Integration

Set up webhooks to receive real-time delivery updates:

### 1. Create webhook endpoint:

```typescript
// Express.js example
import crypto from 'crypto';

app.post('/webhooks/wolt', async (req, res) => {
  // 1. Verify signature
  const signature = req.headers['x-wolt-signature'];
  const payload = JSON.stringify(req.body);
  const expectedSignature = crypto
    .createHmac('sha256', WEBHOOK_SECRET)
    .update(payload)
    .digest('hex');
  
  if (signature !== expectedSignature) {
    return res.status(401).send('Invalid signature');
  }
  
  // 2. Handle event
  const event = req.body;
  
  switch (event.event_type) {
    case 'delivery.status_changed':
      await handleStatusChange(event);
      break;
    case 'delivery.delivered':
      await handleDelivered(event);
      break;
    case 'delivery.cancelled':
      await handleCancelled(event);
      break;
  }
  
  res.status(200).send('OK');
});

async function handleStatusChange(event) {
  // Update order status in your database
  await db.orders.updateByDeliveryId(event.delivery_id, {
    deliveryStatus: event.data.new_status,
    eta: event.data.eta
  });
  
  // Notify customer
  const order = await db.orders.findByDeliveryId(event.delivery_id);
  await sendNotification(order.customer, {
    message: `Your delivery is now ${event.data.new_status}`
  });
}
```

### 2. Configure webhook URL in Wolt dashboard:
- Go to Wolt Drive merchant dashboard
- Add your webhook URL: `https://yourdomain.com/webhooks/wolt`
- Save webhook secret for signature verification

## Best Practices

### 1. Error Handling

```typescript
try {
  const delivery = await client.createDelivery(data);
} catch (error) {
  if (error.message.includes('INVALID_COORDINATES')) {
    // Show user-friendly error
    showError('Address is outside delivery area');
  } else if (error.message.includes('INSUFFICIENT_BALANCE')) {
    // Contact admin
    notifyAdmin('Wolt account needs funding');
    showError('Unable to create delivery. Please try again later.');
  } else {
    // Generic error
    logError(error);
    showError('Something went wrong. Please contact support.');
  }
}
```

### 2. Rate Limiting

```typescript
import { RateLimiter } from 'limiter';

const limiter = new RateLimiter({
  tokensPerInterval: 100,
  interval: 'minute'
});

async function createDeliveryWithRateLimit(data) {
  await limiter.removeTokens(1);
  return client.createDelivery(data);
}
```

### 3. Retries

```typescript
async function createDeliveryWithRetry(data, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await client.createDelivery(data);
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      await sleep(Math.pow(2, i) * 1000); // Exponential backoff
    }
  }
}
```

### 4. Monitoring

```typescript
// Track delivery creation
analytics.track('delivery_created', {
  delivery_id: delivery.id,
  order_id: order.id,
  estimated_time: delivery.estimated_delivery_time
});

// Track errors
Sentry.captureException(error, {
  tags: {
    operation: 'create_delivery',
    order_id: order.id
  }
});
```

## Testing

### Unit Tests

```typescript
import { WoltDriveClient } from './wolt-client';

describe('WoltDriveClient', () => {
  let client: WoltDriveClient;
  
  beforeEach(() => {
    client = new WoltDriveClient(
      'test-token',
      'test-merchant-id',
      true
    );
  });
  
  it('creates delivery successfully', async () => {
    const delivery = await client.createDelivery(mockDeliveryData);
    expect(delivery.id).toBeDefined();
    expect(delivery.status).toBe('created');
  });
});
```

### Integration Tests

```typescript
describe('Delivery Integration', () => {
  it('creates delivery when order is placed', async () => {
    const order = await createTestOrder();
    const delivery = await createDeliveryForOrder(order);
    
    expect(delivery.merchant_order_reference_id).toBe(order.id);
    expect(order.deliveryId).toBe(delivery.id);
  });
});
```

## Troubleshooting

### Common Issues

**Issue**: "Cannot apply unknown utility class"
- **Solution**: Check Tailwind CSS configuration

**Issue**: "Wolt Drive client not initialized"
- **Solution**: Call `initializeWoltClient` before using the API

**Issue**: "Invalid coordinates"
- **Solution**: Ensure lat/lon are valid and within service area

**Issue**: "Rate limit exceeded"
- **Solution**: Implement exponential backoff and rate limiting

## Support

- **Plugin Issues**: Create an issue in this repository
- **Wolt Drive API**: Contact api-support@wolt.com
- **Integration Help**: See [API Walkthrough](WOLT_DRIVE_API_WALKTHROUGH.md)

---

Happy integrating! 🚀

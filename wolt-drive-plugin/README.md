# Wolt Drive E-shop Plugin

A complete delivery integration plugin for e-commerce platforms using the Wolt Drive API. Built with Next.js, TypeScript, Zustand for state management, React Query for API requests, and Shadcn UI for the interface.

## 🚀 Features

- **Complete Wolt Drive API Integration**
  - Create deliveries
  - Get delivery quotes (shipment promises)
  - View delivery details
  - Cancel deliveries
  - Webhook support for real-time status updates
  - Persistent delivery storage (SQLite database)
  - Beautiful delivery detail pages

- **Modern Tech Stack**
  - Next.js 15 with App Router
  - TypeScript for type safety
  - Zustand for efficient state management
  - React Query for data fetching and caching
  - Shadcn UI for beautiful, accessible components
  - Tailwind CSS for styling

- **Developer-Friendly**
  - Full TypeScript types for the Wolt Drive API
  - Comprehensive API client
  - Custom React hooks for all API operations
  - Persistent configuration storage
  - Error handling and loading states

## 📋 Prerequisites

- Node.js 18+ and npm
- Wolt Drive API credentials (API Token, Merchant ID, and Venue ID)
- Basic understanding of React and Next.js

## 🛠️ Installation

1. **Install dependencies:**
```bash
npm install
```

2. **Create environment variables (optional):**
Create a `.env.local` file:
```env
NEXT_PUBLIC_WOLT_API_TOKEN=your_api_token_here
NEXT_PUBLIC_WOLT_MERCHANT_ID=your_merchant_id_here
NEXT_PUBLIC_WOLT_VENUE_ID=your_venue_id_here
NEXT_PUBLIC_WOLT_IS_DEVELOPMENT=true
WOLT_WEBHOOK_SECRET=your_webhook_secret_here
```

**Note:** The `WOLT_WEBHOOK_SECRET` is optional but highly recommended for production to verify webhook signatures.

3. **Run the development server:**
```bash
npm run dev
```

4. **Open your browser:**
Navigate to [http://localhost:3000](http://localhost:3000)

## 📖 Usage

### 1. Configuration

First, configure your Wolt Drive API credentials:
- Go to the "Configuration" tab
- Enter your API Token
- Enter your Merchant ID
- Enter your Venue ID
- Choose Development or Production environment
- Click "Save Configuration"

### 2. Creating a Delivery

Navigate to "Create Delivery" tab:
- Fill in pickup location details (address, coordinates, contact)
- Fill in dropoff location details
- Add order reference and item details
- Choose delivery options (SMS tracking, no-contact delivery)
- Click "Create Delivery"

### 3. Viewing Deliveries

Navigate to "Deliveries" tab:
- View all deliveries created in your system
- Deliveries are stored in a SQLite database
- Click on any delivery card to view full details
- See comprehensive delivery information including tracking, pricing, locations, recipient details, and parcels
- Real-time status updates via webhooks

### 4. Webhook Integration

The plugin supports real-time delivery status updates via webhooks:

1. **Configure your webhook endpoint in Wolt Merchant Dashboard:**
   - Navigate to Developer Settings
   - Add webhook URL: `https://yourdomain.com/api/wolt/webhooks`
   - Save the webhook secret in your environment variables

2. **Webhook events handled:**
   - `delivery.created` - New delivery created
   - `delivery.status_changed` - Delivery status updated
   - `delivery.delivered` - Delivery completed
   - `delivery.cancelled` - Delivery cancelled

3. **View webhook logs:**
   - Navigate to the "Webhooks" tab to see all received webhook events
   - Monitor delivery status changes in real-time
   - Debug webhook issues with detailed payload information

4. **Security:**
   - All webhooks are verified using HMAC SHA-256 signatures
   - Set `WOLT_WEBHOOK_SECRET` environment variable to enable signature verification
   - Unauthorized requests are rejected automatically

## 🗂️ Project Structure

```
wolt-drive-plugin/
├── src/
│   ├── api/
│   │   └── wolt-client.ts         # API client for Wolt Drive
│   ├── components/
│   │   ├── ui/                    # Shadcn UI components
│   │   ├── configuration-form.tsx # API configuration
│   │   ├── create-delivery-form.tsx # Delivery creation
│   │   ├── delivery-list.tsx      # Delivery listing
│   │   └── providers.tsx          # React Query provider
│   ├── hooks/
│   │   └── use-wolt-api.ts       # React Query hooks
│   ├── store/
│   │   ├── wolt-store.ts         # Zustand state management
│   │   └── api-log-store.ts      # API logs storage
│   ├── types/
│   │   └── wolt-drive.ts         # TypeScript types
│   └── app/
│       ├── layout.tsx            # Root layout
│       ├── page.tsx              # Main page
│       ├── delivery/
│       │   └── [id]/
│       │       └── page.tsx      # Delivery detail page
│       ├── api/
│       │   └── wolt/
│       │       ├── deliveries/
│       │       │   └── route.ts  # Create delivery API
│       │       └── shipment-promises/
│       │           └── route.ts  # Get quote API
│       └── globals.css           # Global styles
├── wolt-drive-api.postman_collection.json # Postman collection
└── WOLT_DRIVE_API_WALKTHROUGH.md # API documentation
```

## 🔧 API Integration

### Using the Wolt Client

```typescript
import { initializeWoltClient, getWoltClient } from '@/api/wolt-client';

// Initialize once
initializeWoltClient(apiToken, merchantId, isDevelopment);

// Use throughout your app
const client = getWoltClient();
const quote = await client.getDeliveryQuote(request);
```

### Using React Query Hooks

```typescript
import { useCreateDelivery, useShipmentPromiseMutation } from '@/hooks/use-wolt-api';

function MyComponent() {
  const createDelivery = useCreateDelivery();
  const shipmentPromise = useShipmentPromiseMutation();
  
  const handleCreate = async () => {
    // First get a shipment promise (quote)
    const promise = await shipmentPromise.mutateAsync(quoteRequest);
    
    // Then create delivery with the promise ID
    await createDelivery.mutateAsync({
      ...deliveryRequest,
      shipment_promise_id: promise.id
    });
  };
}
```

**Note:** The `useDeliveries` hook is deprecated as the Wolt venueful API doesn't support listing deliveries. Use the Zustand store to access deliveries instead.

### Using Zustand Store

```typescript
import { useWoltDriveStore } from '@/store/wolt-store';

function MyComponent() {
  const { apiToken, deliveries, addDelivery } = useWoltDriveStore();
}
```

## 📚 API Documentation

### Database Storage

This plugin uses SQLite for persistent storage of:
- Deliveries created through the system
- Webhook events received from Wolt Drive
- Mock products for the e-shop demo
- Customer and order data structures

The database file is stored in the `data/` directory and persists across application restarts.

### Postman Collection

Import `../wolt-drive-api.postman_collection.json` into Postman to explore available API endpoints:
- Get shipment promises (quotes with promise ID)
- Create deliveries

### Complete API Walkthrough

See `../WOLT_DRIVE_API_WALKTHROUGH.md` for:
- Detailed endpoint documentation
- Request/response examples
- Authentication guide
- Error handling
- Best practices

## 🎨 Customization

### Styling

The project uses Tailwind CSS with Shadcn UI theming. Customize colors in `src/app/globals.css`:

```css
:root {
  --primary: 221.2 83.2% 53.3%;
  --secondary: 210 40% 96.1%;
  /* ... other theme colors */
}
```

## 🔒 Security Best Practices

1. **Never commit API keys** - Use environment variables
2. **Server-side API calls** - Keep tokens on the server when possible
3. **Validate webhook signatures** - Always set `WOLT_WEBHOOK_SECRET` and verify signatures
4. **Rate limiting** - Implement rate limiting on your endpoints
5. **Input validation** - Always validate user inputs
6. **Database security** - Restrict file system access to the `data/` directory in production

## 📦 Production Deployment

1. **Build the project:**
```bash
npm run build
```

2. **Start production server:**
```bash
npm start
```

3. **Deploy to Vercel (recommended):**
```bash
vercel
```

Or deploy to any hosting platform that supports Next.js.

## 🔗 Useful Links

- [Wolt Drive API Documentation](https://developer.wolt.com/docs/api/wolt-drive)
- [Next.js Documentation](https://nextjs.org/docs)
- [Zustand Documentation](https://zustand-demo.pmnd.rs/)
- [React Query Documentation](https://tanstack.com/query/latest)
- [Shadcn UI Documentation](https://ui.shadcn.com/)

## 🐛 Troubleshooting

### API Connection Issues
- Verify your API token and merchant ID
- Check you're using the correct environment (dev/prod)
- Ensure coordinates are within service areas

### Build Errors
- Clear `.next` folder and rebuild: `rm -rf .next && npm run build`
- Clear node_modules and reinstall: `rm -rf node_modules && npm install`

### Runtime Errors
- Check browser console for detailed error messages
- Verify all required fields are filled in forms
- Ensure phone numbers are in E.164 format (+country code)

## 📞 Support

For Wolt Drive API support, contact: api-support@wolt.com

---

**Built with ❤️ for seamless e-commerce delivery integration**

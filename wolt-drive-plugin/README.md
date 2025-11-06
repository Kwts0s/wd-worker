# Wolt Drive E-shop Plugin

A complete delivery integration plugin for e-commerce platforms using the Wolt Drive API. Built with Next.js, TypeScript, Zustand for state management, React Query for API requests, and Shadcn UI for the interface.

## 🚀 Features

- **Complete Wolt Drive API Integration**
  - Create deliveries
  - Get delivery quotes
  - Track deliveries in real-time
  - List and filter deliveries
  - Cancel deliveries

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
```

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
- View all your deliveries
- See real-time status updates
- Click on any delivery for more details
- Refresh to get latest updates

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
│   │   └── wolt-store.ts         # Zustand state management
│   ├── types/
│   │   └── wolt-drive.ts         # TypeScript types
│   └── app/
│       ├── layout.tsx            # Root layout
│       ├── page.tsx              # Main page
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
import { useCreateDelivery, useDeliveries } from '@/hooks/use-wolt-api';

function MyComponent() {
  const createDelivery = useCreateDelivery();
  const { data: deliveries } = useDeliveries();
  
  const handleCreate = async () => {
    await createDelivery.mutateAsync(deliveryRequest);
  };
}
```

### Using Zustand Store

```typescript
import { useWoltDriveStore } from '@/store/wolt-store';

function MyComponent() {
  const { apiToken, deliveries, addDelivery } = useWoltDriveStore();
}
```

## 📚 API Documentation

### Postman Collection

Import `../wolt-drive-api.postman_collection.json` into Postman to explore all API endpoints:
- Get delivery quotes
- Create deliveries
- Get delivery details
- List deliveries
- Cancel deliveries
- Get tracking information

### Complete API Walkthrough

See `../WOLT_DRIVE_API_WALKTHROUGH.md` for:
- Detailed endpoint documentation
- Request/response examples
- Authentication guide
- Error handling
- Best practices
- Webhook integration

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
3. **Validate webhook signatures** - Verify webhook authenticity
4. **Rate limiting** - Implement rate limiting on your endpoints
5. **Input validation** - Always validate user inputs

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

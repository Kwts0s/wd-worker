# Wolt Drive Worker

Complete Wolt Drive API integration toolkit for e-commerce platforms.

## 📦 What's Included

This repository contains everything you need to integrate Wolt Drive delivery services into your e-commerce platform:

1. **Postman Collection** - Test and explore all Wolt Drive API endpoints
2. **API Walkthrough** - Comprehensive documentation and best practices guide
3. **Next.js Plugin** - Full-featured web application for managing deliveries

## 🚀 Quick Start

### Postman Collection

Import `wolt-drive-api.postman_collection.json` into Postman:
- Configure your API token, merchant ID, and venue ID
- Test all endpoints interactively
- See example requests and responses

### API Documentation

Read `WOLT_DRIVE_API_WALKTHROUGH.md` for:
- Complete API reference
- Integration patterns
- Best practices
- Error handling
- Webhook setup

### Next.js Plugin

```bash
cd wolt-drive-plugin
npm install
npm run dev
```

Visit http://localhost:3000 to access the web interface.

## 📖 Documentation

- **[API Walkthrough](WOLT_DRIVE_API_WALKTHROUGH.md)** - Complete API guide
- **[Plugin README](wolt-drive-plugin/README.md)** - Next.js application documentation
- **[Postman Collection](wolt-drive-api.postman_collection.json)** - API testing suite

## 🛠️ Tech Stack

- **Next.js 15** - React framework with App Router
- **TypeScript** - Full type safety
- **Zustand** - State management
- **React Query** - Data fetching and caching
- **Shadcn UI** - UI component library
- **Tailwind CSS** - Styling

## 📋 Features

- ✅ Complete API type definitions
- ✅ Create and manage deliveries
- ✅ Get delivery quotes (shipment promises)
- ✅ Multi-venue support
- ✅ Persistent delivery storage (SQLite database)
- ✅ Cancel deliveries
- ✅ Webhook support for real-time status updates
- ✅ Webhook event logging and monitoring
- ✅ Scheduled deliveries
- ✅ Cash on Delivery (COD) support
- ✅ Handshake delivery (PIN verification)
- ✅ Detailed delivery information pages
- ✅ Persistent configuration
- ✅ Responsive UI design
- ✅ Error handling and retry logic
- ✅ Loading states
- ✅ API request logging

## 🔑 Configuration

You'll need:
- Wolt Drive API Token
- Wolt Drive Merchant ID
- Wolt Drive Venue ID

Get these from your [Wolt Drive merchant dashboard](https://merchant.wolt.com).

## 📞 Support

For Wolt Drive API support: api-support@wolt.com

---

**Built for seamless e-commerce delivery integration** 🚚

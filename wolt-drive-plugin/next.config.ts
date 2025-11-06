import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  env: {
    WOLT_API_TOKEN: process.env.WOLT_API_TOKEN,
    WOLT_MERCHANT_ID: process.env.WOLT_MERCHANT_ID,
    WOLT_VENUE_ID: process.env.WOLT_VENUE_ID,
    WOLT_IS_DEVELOPMENT: process.env.WOLT_IS_DEVELOPMENT,
  },
  experimental: {
    
  },
  serverExternalPackages: [],
};

export default nextConfig;

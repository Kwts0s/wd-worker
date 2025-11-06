'use client';

import { useWoltDriveStore } from '@/store/wolt-store';

/**
 * Hook to ensure environment configuration is loaded
 * This can be used to show different UI states based on whether
 * configuration comes from environment variables or needs manual input
 */
export function useEnvConfig() {
  const { apiToken, merchantId, venueId } = useWoltDriveStore();

  // Check if configuration is available (either from env or manually set)
  const isConfigured = !!(apiToken && merchantId && venueId);
  
  // Check if configuration likely comes from environment variables
  const hasEnvConfig = !!(
    process.env.NEXT_PUBLIC_WOLT_API_TOKEN &&
    process.env.NEXT_PUBLIC_WOLT_MERCHANT_ID &&
    process.env.NEXT_PUBLIC_WOLT_VENUE_ID
  );

  return {
    isConfigured,
    hasEnvConfig,
    needsManualConfig: !isConfigured && !hasEnvConfig
  };
}
/**
 * Utility functions for Wolt Drive API integration
 */

/**
 * Get Wolt Drive API configuration from environment variables
 */
export function getWoltApiConfig() {
  const apiToken = process.env.WOLT_API_TOKEN || process.env.NEXT_PUBLIC_WOLT_API_TOKEN;
  const merchantId = process.env.WOLT_MERCHANT_ID || process.env.NEXT_PUBLIC_WOLT_MERCHANT_ID;
  const venueId = process.env.WOLT_VENUE_ID || process.env.NEXT_PUBLIC_WOLT_VENUE_ID;
  const isDevelopment = (process.env.WOLT_IS_DEVELOPMENT || process.env.NEXT_PUBLIC_WOLT_IS_DEVELOPMENT) === 'true';
  const webhookSecret = process.env.WOLT_WEBHOOK_SECRET;

  return {
    apiToken,
    merchantId,
    venueId,
    isDevelopment,
    webhookSecret,
  };
}

/**
 * Get Wolt Drive API base URL
 */
export function getWoltApiBaseUrl(isDevelopment: boolean): string {
  return isDevelopment
    ? 'https://daas-public-api.development.dev.woltapi.com'
    : 'https://daas-public-api.wolt.com';
}

/**
 * Create authorization headers for Wolt Drive API
 */
export function createWoltApiHeaders(apiToken: string): Record<string, string> {
  return {
    'Authorization': `Bearer ${apiToken}`,
    'Content-Type': 'application/json',
  };
}

/**
 * Verify webhook signature using HMAC
 */
export async function verifyWebhookSignature(
  payload: string,
  signature: string,
  secret: string
): Promise<boolean> {
  try {
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      'raw',
      encoder.encode(secret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign', 'verify']
    );

    const signatureBuffer = await crypto.subtle.sign(
      'HMAC',
      key,
      encoder.encode(payload)
    );

    const computedSignature = Array.from(new Uint8Array(signatureBuffer))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');

    return computedSignature === signature;
  } catch (error) {
    console.error('Error verifying webhook signature:', error);
    return false;
  }
}

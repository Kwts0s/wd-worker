'use client';

import { useState } from 'react';
import { useWoltDriveStore } from '@/store/wolt-store';
import { initializeWoltClient } from '@/api/wolt-client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export function ConfigurationForm() {
  const { apiToken, merchantId, venueId, isDevelopment, setConfig, clearConfig } = useWoltDriveStore();
  const [tempToken, setTempToken] = useState(apiToken || '');
  const [tempMerchantId, setTempMerchantId] = useState(merchantId || '');
  const [tempVenueId, setTempVenueId] = useState(venueId || '');
  const [tempIsDev, setTempIsDev] = useState(isDevelopment);
  const [error, setError] = useState<string | null>(null);

  const handleSave = () => {
    if (!tempToken.trim() || !tempMerchantId.trim() || !tempVenueId.trim()) {
      setError('API Token, Merchant ID, and Venue ID are required');
      return;
    }

    try {
      initializeWoltClient(tempToken, tempMerchantId, tempVenueId, tempIsDev);
      setConfig(tempToken, tempMerchantId, tempVenueId, tempIsDev);
      setError(null);
    } catch {
      setError('Failed to initialize Wolt Drive client');
    }
  };

  const handleClear = () => {
    clearConfig();
    setTempToken('');
    setTempMerchantId('');
    setTempVenueId('');
    setTempIsDev(true);
    setError(null);
  };

  const isConfigured = !!apiToken && !!merchantId && !!venueId;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Wolt Drive Configuration</CardTitle>
            <CardDescription>
              Configure your Wolt Drive API credentials
            </CardDescription>
          </div>
          {isConfigured && (
            <Badge variant="secondary">Configured</Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <label htmlFor="apiToken" className="text-sm font-medium">
            API Token
          </label>
          <Input
            id="apiToken"
            type="password"
            placeholder="Enter your Wolt Drive API token"
            value={tempToken}
            onChange={(e) => setTempToken(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="merchantId" className="text-sm font-medium">
            Merchant ID
          </label>
          <Input
            id="merchantId"
            placeholder="Enter your merchant ID"
            value={tempMerchantId}
            onChange={(e) => setTempMerchantId(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="venueId" className="text-sm font-medium">
            Venue ID
          </label>
          <Input
            id="venueId"
            placeholder="Enter your venue ID"
            value={tempVenueId}
            onChange={(e) => setTempVenueId(e.target.value)}
          />
        </div>

        <div className="flex items-center space-x-2">
          <input
            id="isDevelopment"
            type="checkbox"
            checked={tempIsDev}
            onChange={(e) => setTempIsDev(e.target.checked)}
            className="rounded border-gray-300"
          />
          <label htmlFor="isDevelopment" className="text-sm font-medium">
            Use Development Environment
          </label>
        </div>

        {error && (
          <div className="text-sm text-red-500">
            {error}
          </div>
        )}

        <div className="flex gap-2">
          <Button onClick={handleSave}>
            {isConfigured ? 'Update' : 'Save'} Configuration
          </Button>
          {isConfigured && (
            <Button variant="outline" onClick={handleClear}>
              Clear
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

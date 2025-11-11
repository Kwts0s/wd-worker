'use client';

import { useState } from 'react';
import { useWoltDriveStore } from '@/store/wolt-store';
import { useEnvConfig } from '@/hooks/use-env-config';
import { initializeWoltClient } from '@/api/wolt-client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';

export function ConfigurationForm() {
  const { apiToken, merchantId, venueId, isDevelopment, setConfig, clearConfig } = useWoltDriveStore();
  const { hasEnvConfig } = useEnvConfig();
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
              {hasEnvConfig ? 
                'Configuration loaded from environment variables (.env.local)' : 
                'Configure your Wolt Drive API credentials'
              }
            </CardDescription>
          </div>
          {isConfigured && (
            <Badge variant="secondary">Configured</Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="space-y-2">
          <Label htmlFor="apiToken">
            API Token
          </Label>
          <Input
            id="apiToken"
            type="password"
            placeholder="Enter your Wolt Drive API token"
            value={tempToken}
            onChange={(e) => setTempToken(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="merchantId">
            Merchant ID
          </Label>
          <Input
            id="merchantId"
            placeholder="Enter your merchant ID"
            value={tempMerchantId}
            onChange={(e) => setTempMerchantId(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="venueId">
            Venue ID
          </Label>
          <Input
            id="venueId"
            placeholder="Enter your venue ID"
            value={tempVenueId}
            onChange={(e) => setTempVenueId(e.target.value)}
          />
        </div>

        <div className="flex items-center space-x-3 pt-1">
          <Checkbox
            id="isDevelopment"
            checked={tempIsDev}
            onChange={(e) => setTempIsDev(e.target.checked)}
          />
          <Label htmlFor="isDevelopment" className="cursor-pointer">
            Use Development Environment
          </Label>
        </div>

        {error && (
          <div className="p-3 text-sm text-destructive bg-red-50 border border-red-200 rounded-lg">
            {error}
          </div>
        )}

        <div className="flex gap-3 pt-2">
          <Button onClick={handleSave} size="lg">
            {isConfigured ? 'Update' : 'Save'} Configuration
          </Button>
          {isConfigured && (
            <Button variant="outline" size="lg" onClick={handleClear}>
              Clear
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

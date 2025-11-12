'use client';

import { useState } from 'react';
import { useWoltDriveStore } from '@/store/wolt-store';
import { useEnvConfig } from '@/hooks/use-env-config';
import { initializeWoltClient } from '@/api/wolt-client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export function ConfigurationForm() {
  const { apiToken, merchantId, venueId, isDevelopment, timezone, setConfig, clearConfig } = useWoltDriveStore();
  const { hasEnvConfig } = useEnvConfig();
  const [tempToken, setTempToken] = useState(apiToken || '');
  const [tempMerchantId, setTempMerchantId] = useState(merchantId || '');
  const [tempVenueId, setTempVenueId] = useState(venueId || '');
  const [tempIsDev, setTempIsDev] = useState(isDevelopment);
  const [tempTimezone, setTempTimezone] = useState(timezone || 'Europe/Athens');
  const [error, setError] = useState<string | null>(null);

  const handleSave = () => {
    if (!tempToken.trim() || !tempMerchantId.trim() || !tempVenueId.trim()) {
      setError('API Token, Merchant ID, and Venue ID are required');
      return;
    }

    try {
      initializeWoltClient(tempToken, tempMerchantId, tempVenueId, tempIsDev);
      setConfig(tempToken, tempMerchantId, tempVenueId, tempIsDev, tempTimezone);
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
    setTempTimezone('Europe/Athens');
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

        <div className="space-y-2">
          <label htmlFor="timezone" className="text-sm font-medium">
            Timezone
          </label>
          <select
            id="timezone"
            value={tempTimezone}
            onChange={(e) => setTempTimezone(e.target.value)}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            <option value="Europe/Athens">Athens, Greece (Europe/Athens)</option>
            <option value="Europe/London">London, UK (Europe/London)</option>
            <option value="Europe/Paris">Paris, France (Europe/Paris)</option>
            <option value="Europe/Berlin">Berlin, Germany (Europe/Berlin)</option>
            <option value="Europe/Rome">Rome, Italy (Europe/Rome)</option>
            <option value="Europe/Madrid">Madrid, Spain (Europe/Madrid)</option>
            <option value="Europe/Amsterdam">Amsterdam, Netherlands (Europe/Amsterdam)</option>
            <option value="Europe/Stockholm">Stockholm, Sweden (Europe/Stockholm)</option>
            <option value="Europe/Helsinki">Helsinki, Finland (Europe/Helsinki)</option>
            <option value="America/New_York">New York, USA (America/New_York)</option>
            <option value="America/Los_Angeles">Los Angeles, USA (America/Los_Angeles)</option>
            <option value="America/Chicago">Chicago, USA (America/Chicago)</option>
            <option value="Asia/Tokyo">Tokyo, Japan (Asia/Tokyo)</option>
            <option value="Asia/Dubai">Dubai, UAE (Asia/Dubai)</option>
            <option value="Asia/Singapore">Singapore (Asia/Singapore)</option>
            <option value="Australia/Sydney">Sydney, Australia (Australia/Sydney)</option>
          </select>
          <p className="text-xs text-muted-foreground">
            All times in the application will be displayed in this timezone
          </p>
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

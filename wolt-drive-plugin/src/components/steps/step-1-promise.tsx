'use client';

import { useState } from 'react';
import { UseMutationResult } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { LocationPicker } from '@/components/location-picker';
import { DeliveryFormData } from '@/store/form-store';
import {
  ShipmentPromiseRequest,
  ShipmentPromiseResponse,
} from '@/types/wolt-drive';
import { MapPin, Loader2, CheckCircle2 } from 'lucide-react';

interface Step1PromiseProps {
  formData: DeliveryFormData;
  updateFormData: (updates: Partial<DeliveryFormData>) => void;
  shipmentPromiseMutation: UseMutationResult<ShipmentPromiseResponse, Error, ShipmentPromiseRequest>;
  onPromiseComplete: (promiseId: string, pickupTime: string | null, dropoffTime: string | null) => void;
}

export function Step1Promise({
  formData,
  updateFormData,
  shipmentPromiseMutation,
  onPromiseComplete,
}: Step1PromiseProps) {
  const [showMap, setShowMap] = useState(false);

  const handleGetPromise = async (e: React.FormEvent) => {
    e.preventDefault();

    const request: ShipmentPromiseRequest = {
      street: formData.street,
      city: formData.city,
      post_code: formData.postCode,
      lat: parseFloat(formData.dropoffLat),
      lon: parseFloat(formData.dropoffLon),
      language: formData.language,
      min_preparation_time_minutes: parseInt(formData.minPrepTime),
    };

    // Add scheduled dropoff time if provided
    if (formData.scheduledDropoffTime) {
      request.scheduled_dropoff_time = formData.scheduledDropoffTime;
    }

    try {
      const result = await shipmentPromiseMutation.mutateAsync(request);
      // Extract scheduled times from the quote response
      const pickupTime = result.pickup?.options?.scheduled_time || null;
      const dropoffTime = result.dropoff?.options?.scheduled_time || null;
      onPromiseComplete(result.id, pickupTime, dropoffTime);
    } catch (error) {
      console.error('Failed to get shipment promise:', error);
    }
  };

  const handleLocationChange = (location: {
    street: string;
    city: string;
    postCode: string;
    latitude: string;
    longitude: string;
  }) => {
    updateFormData({
      street: location.street,
      city: location.city,
      postCode: location.postCode,
      dropoffLat: location.latitude,
      dropoffLon: location.longitude,
    });
  };

  return (
    <div className="space-y-6">
      <Card className="border-blue-200 bg-blue-50/50">
        <CardHeader>
          <CardTitle className="text-blue-700">Delivery Location & Quote</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <form onSubmit={handleGetPromise} className="space-y-4">
            {/* Location Fields */}
            <div className="grid gap-4 md:grid-cols-2">
              <div className="md:col-span-2">
                <label className="text-sm font-medium">Street Address</label>
                <Input
                  value={formData.street}
                  onChange={(e) => updateFormData({ street: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="text-sm font-medium">City</label>
                <Input
                  value={formData.city}
                  onChange={(e) => updateFormData({ city: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="text-sm font-medium">Post Code</label>
                <Input
                  value={formData.postCode}
                  onChange={(e) => updateFormData({ postCode: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="text-sm font-medium">Latitude</label>
                <Input
                  type="number"
                  step="any"
                  value={formData.dropoffLat}
                  onChange={(e) => updateFormData({ dropoffLat: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="text-sm font-medium">Longitude</label>
                <Input
                  type="number"
                  step="any"
                  value={formData.dropoffLon}
                  onChange={(e) => updateFormData({ dropoffLon: e.target.value })}
                  required
                />
              </div>
            </div>

            {/* Map Toggle Button */}
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowMap(!showMap)}
              className="w-full flex items-center justify-center gap-2"
            >
              <MapPin className="h-4 w-4" />
              {showMap ? 'Hide Map' : 'Show Map to Select Location'}
            </Button>

            {/* Scheduled Dropoff Time */}
            <div>
              <label className="text-sm font-medium">Scheduled Dropoff Time (optional)</label>
              <Input
                type="datetime-local"
                onChange={(e) => {
                  const localDateTime = e.target.value;
                  if (localDateTime) {
                    const isoDateTime = new Date(localDateTime).toISOString();
                    updateFormData({ scheduledDropoffTime: isoDateTime });
                  } else {
                    updateFormData({ scheduledDropoffTime: '' });
                  }
                }}
                placeholder="Select scheduled dropoff time"
              />
              <p className="text-xs text-gray-500 mt-1">
                Leave empty for ASAP delivery
              </p>
              {formData.scheduledDropoffTime && (
                <p className="text-xs text-blue-600 mt-1">
                  Will send: {formData.scheduledDropoffTime}
                </p>
              )}
            </div>

            <Button
              type="submit"
              disabled={shipmentPromiseMutation.isPending}
              className="w-full"
            >
              {shipmentPromiseMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Getting Quote...
                </>
              ) : (
                'Get Shipment Promise'
              )}
            </Button>
          </form>

          {/* Success Message */}
          {shipmentPromiseMutation.data && (
            <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
                <p className="text-sm font-semibold text-green-700">Quote received!</p>
              </div>
              <p className="text-sm text-green-600">Shipment Promise ID: {shipmentPromiseMutation.data.id}</p>
              {shipmentPromiseMutation.data.fee && (
                <p className="text-sm text-green-600">
                  Fee: {(shipmentPromiseMutation.data.fee.amount / 100).toFixed(2)} {shipmentPromiseMutation.data.fee.currency}
                </p>
              )}
              {shipmentPromiseMutation.data.estimated_pickup_time && (
                <p className="text-sm text-green-600">
                  Estimated Pickup: {new Date(shipmentPromiseMutation.data.estimated_pickup_time).toLocaleString()}
                </p>
              )}
              {shipmentPromiseMutation.data.estimated_delivery_time && (
                <p className="text-sm text-green-600">
                  Estimated Delivery: {new Date(shipmentPromiseMutation.data.estimated_delivery_time).toLocaleString()}
                </p>
              )}
              <p className="text-sm text-green-600 mt-2">Click &quot;Next&quot; to select a venue</p>
            </div>
          )}

          {/* Error Message */}
          {shipmentPromiseMutation.error && (
            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm font-semibold text-red-700">Error getting quote</p>
              <p className="text-sm text-red-600">{String(shipmentPromiseMutation.error)}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Map Picker */}
      {showMap && (
        <LocationPicker
          street={formData.street}
          city={formData.city}
          postCode={formData.postCode}
          latitude={formData.dropoffLat}
          longitude={formData.dropoffLon}
          onLocationChange={handleLocationChange}
        />
      )}
    </div>
  );
}

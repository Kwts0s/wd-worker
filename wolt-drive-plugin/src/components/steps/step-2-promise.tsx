'use client';

import { UseMutationResult } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DeliveryFormData } from '@/store/form-store';
import {
  ShipmentPromiseRequest,
  ShipmentPromiseResponse,
} from '@/types/wolt-drive';
import { Loader2, CheckCircle2, DollarSign, Clock } from 'lucide-react';

interface Step2PromiseProps {
  formData: DeliveryFormData;
  selectedVenueId: string | null;
  shipmentPromiseMutation: UseMutationResult<ShipmentPromiseResponse, Error, ShipmentPromiseRequest & { venue_id?: string }>;
  onPromiseComplete: (promiseId: string, pickupTime: string | null, dropoffTime: string | null) => void;
}

export function Step2Promise({
  formData,
  selectedVenueId,
  shipmentPromiseMutation,
  onPromiseComplete,
}: Step2PromiseProps) {
  const handleGetPromise = async () => {
    if (!selectedVenueId) {
      alert('Please select a venue first!');
      return;
    }

    // Use scheduled dropoff time from form (already set with default in step 1)
    const scheduledTime = formData.scheduledDropoffTime;

    const request: ShipmentPromiseRequest & { venue_id?: string } = {
      street: formData.street,
      city: formData.city,
      post_code: formData.postCode,
      lat: parseFloat(formData.dropoffLat),
      lon: parseFloat(formData.dropoffLon),
      language: formData.language,
      min_preparation_time_minutes: parseInt(formData.minPrepTime),
      scheduled_dropoff_time: scheduledTime,
      venue_id: selectedVenueId,
    };

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

  return (
    <div className="space-y-6">
      <Card className="border-purple-200 bg-purple-50/50">
        <CardHeader>
          <CardTitle className="text-purple-700">Get Shipment Promise</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Get a quote for the selected venue and delivery location from Step 1.
          </p>

          {/* Display Selected Location */}
          <div className="bg-muted p-3 rounded-lg space-y-2">
            <div className="text-sm font-medium">Selected Location:</div>
            <div className="text-sm">
              {formData.street}, {formData.city} {formData.postCode}
            </div>
            <div className="text-xs text-muted-foreground">
              Coordinates: {formData.dropoffLat}, {formData.dropoffLon}
            </div>
            {formData.scheduledDropoffTime && (
              <div className="text-xs text-muted-foreground">
                Scheduled: {new Date(formData.scheduledDropoffTime).toLocaleString()}
              </div>
            )}
          </div>

          <Button
            onClick={handleGetPromise}
            disabled={shipmentPromiseMutation.isPending || !selectedVenueId}
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

          {/* Success Message */}
          {shipmentPromiseMutation.data && (
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
                <p className="text-sm font-semibold text-green-700">Quote received!</p>
              </div>
              <p className="text-sm text-green-600 mb-2">Shipment Promise ID: {shipmentPromiseMutation.data.id}</p>
              <div className="grid grid-cols-2 gap-2">
                {shipmentPromiseMutation.data.fee && (
                  <div className="flex items-center gap-1">
                    <DollarSign className="h-4 w-4 text-green-600" />
                    <span className="text-sm text-green-600">
                      {(shipmentPromiseMutation.data.fee.amount / 100).toFixed(2)} {shipmentPromiseMutation.data.fee.currency}
                    </span>
                  </div>
                )}
                {shipmentPromiseMutation.data.estimated_delivery_time && (
                  <div className="flex items-center gap-1">
                    <Clock className="h-4 w-4 text-green-600" />
                    <span className="text-sm text-green-600">
                      ETA: {new Date(shipmentPromiseMutation.data.estimated_delivery_time).toLocaleTimeString()}
                    </span>
                  </div>
                )}
              </div>
              <p className="text-sm text-green-600 mt-2">Click &quot;Next&quot; to complete order details</p>
            </div>
          )}

          {/* Error Message */}
          {shipmentPromiseMutation.error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm font-semibold text-red-700">Error getting quote</p>
              <p className="text-sm text-red-600">{String(shipmentPromiseMutation.error)}</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

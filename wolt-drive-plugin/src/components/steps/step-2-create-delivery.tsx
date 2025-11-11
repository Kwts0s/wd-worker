'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { DeliveryFormData } from '@/store/form-store';
import { AvailableVenue } from '@/types/wolt-drive';
import { Package, User, Phone, Mail, DollarSign, AlertCircle } from 'lucide-react';

interface Step2CreateDeliveryProps {
  formData: DeliveryFormData;
  updateFormData: (updates: Partial<DeliveryFormData>) => void;
  selectedVenue: AvailableVenue | null;
  shipmentPromiseId: string | null;
  scheduledDropoffTime: string | null;
  onSubmit: (e: React.FormEvent) => void;
  isSubmitting: boolean;
}

export function Step2CreateDelivery({
  formData,
  updateFormData,
  selectedVenue,
  shipmentPromiseId,
  scheduledDropoffTime,
  onSubmit,
  isSubmitting,
}: Step2CreateDeliveryProps) {
  if (!selectedVenue) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="flex items-center gap-2 text-yellow-600">
            <AlertCircle className="h-5 w-5" />
            <p>Please complete Step 1 first to select a venue.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const venueName = selectedVenue.pickup.name.find((n) => n.lang === 'en')?.value || 'Unknown Venue';

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      {/* Selected Venue Info */}
      <Card className="border-green-200 bg-green-50/50">
        <CardHeader>
          <CardTitle className="text-green-700">Selected Venue</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <p className="font-semibold text-lg">{venueName}</p>
            <p className="text-sm text-muted-foreground">
              {selectedVenue.pickup.location.formatted_address}
            </p>
            <div className="grid grid-cols-2 gap-2 text-sm mt-3">
              <div>
                <span className="text-muted-foreground">Delivery Fee:</span>{' '}
                <span className="font-semibold">
                  {(selectedVenue.fee.amount / 100).toFixed(2)} {selectedVenue.fee.currency}
                </span>
              </div>
              <div>
                <span className="text-muted-foreground">Estimated Time:</span>{' '}
                <span className="font-semibold">
                  {selectedVenue.pre_estimate.total_minutes.min}-{selectedVenue.pre_estimate.total_minutes.max} min
                </span>
              </div>
            </div>
            {shipmentPromiseId && (
              <div className="text-xs text-muted-foreground mt-2">
                Venue ID: {shipmentPromiseId}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Recipient Details */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Recipient Details
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="text-sm font-medium">Name</label>
              <Input
                value={formData.dropoffName}
                onChange={(e) => updateFormData({ dropoffName: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="text-sm font-medium">Phone Number</label>
              <Input
                value={formData.dropoffPhone}
                onChange={(e) => updateFormData({ dropoffPhone: e.target.value })}
                required
              />
            </div>
            <div className="md:col-span-2">
              <label className="text-sm font-medium">Email</label>
              <Input
                type="email"
                value={formData.dropoffEmail}
                onChange={(e) => updateFormData({ dropoffEmail: e.target.value })}
                required
              />
            </div>
            <div className="md:col-span-2">
              <label className="text-sm font-medium">Dropoff Comment (optional)</label>
              <Input
                value={formData.dropoffComment}
                onChange={(e) => updateFormData({ dropoffComment: e.target.value })}
                placeholder="e.g., Ring the doorbell"
              />
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="noContact"
              checked={formData.noContact}
              onChange={(e) => updateFormData({ noContact: e.target.checked })}
              className="rounded border-gray-300"
            />
            <label htmlFor="noContact" className="text-sm font-medium">
              No contact delivery
            </label>
          </div>
        </CardContent>
      </Card>

      {/* Order Details */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Order Details
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="text-sm font-medium">Order Reference</label>
              <Input
                value={formData.orderReference}
                onChange={(e) => updateFormData({ orderReference: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="text-sm font-medium">Order Price (cents)</label>
              <Input
                type="number"
                value={formData.orderPrice}
                onChange={(e) => updateFormData({ orderPrice: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="text-sm font-medium">Tip Amount (cents)</label>
              <Input
                type="number"
                value={formData.tipAmount}
                onChange={(e) => updateFormData({ tipAmount: e.target.value })}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Parcel Details */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Parcel Details
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="text-sm font-medium">Description</label>
              <Input
                value={formData.parcelDescription}
                onChange={(e) => updateFormData({ parcelDescription: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="text-sm font-medium">Identifier</label>
              <Input
                value={formData.parcelIdentifier}
                onChange={(e) => updateFormData({ parcelIdentifier: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="text-sm font-medium">Count</label>
              <Input
                type="number"
                min="1"
                value={formData.parcelCount}
                onChange={(e) => updateFormData({ parcelCount: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="text-sm font-medium">Weight (grams)</label>
              <Input
                type="number"
                value={formData.parcelWeight}
                onChange={(e) => updateFormData({ parcelWeight: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="text-sm font-medium">Width (cm)</label>
              <Input
                type="number"
                value={formData.parcelWidth}
                onChange={(e) => updateFormData({ parcelWidth: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="text-sm font-medium">Height (cm)</label>
              <Input
                type="number"
                value={formData.parcelHeight}
                onChange={(e) => updateFormData({ parcelHeight: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="text-sm font-medium">Depth (cm)</label>
              <Input
                type="number"
                value={formData.parcelDepth}
                onChange={(e) => updateFormData({ parcelDepth: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="text-sm font-medium">Parcel Price (cents)</label>
              <Input
                type="number"
                value={formData.parcelPrice}
                onChange={(e) => updateFormData({ parcelPrice: e.target.value })}
                required
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Customer Support */}
      <Card>
        <CardHeader>
          <CardTitle>Customer Support</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="text-sm font-medium">Support URL</label>
              <Input
                value={formData.supportUrl}
                onChange={(e) => updateFormData({ supportUrl: e.target.value })}
                required
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </form>
  );
}

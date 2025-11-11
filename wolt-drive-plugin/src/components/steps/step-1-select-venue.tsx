'use client';

import { useState } from 'react';
import { UseMutationResult } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { LocationPicker } from '@/components/location-picker';
import { DeliveryFormData } from '@/store/form-store';
import {
  AvailableVenuesRequest,
  AvailableVenuesResponse,
  AvailableVenue,
} from '@/types/wolt-drive';
import { MapPin, CheckCircle2, Clock, DollarSign, Loader2 } from 'lucide-react';

interface Step1SelectVenueProps {
  formData: DeliveryFormData;
  updateFormData: (updates: Partial<DeliveryFormData>) => void;
  availableVenuesMutation: UseMutationResult<AvailableVenuesResponse, Error, AvailableVenuesRequest>;
  selectedVenue: AvailableVenue | null;
  onVenueSelect: (venue: AvailableVenue) => void;
}

export function Step1SelectVenue({
  formData,
  updateFormData,
  availableVenuesMutation,
  selectedVenue,
  onVenueSelect,
}: Step1SelectVenueProps) {
  const [showMap, setShowMap] = useState(false);

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

  const handleGetVenues = async (e: React.FormEvent) => {
    e.preventDefault();

    // Set default dropoff time if not provided (+60 minutes from now)
    let scheduledTime = formData.scheduledDropoffTime;
    if (!scheduledTime) {
      const now = new Date();
      now.setMinutes(now.getMinutes() + 60);
      scheduledTime = now.toISOString();
      updateFormData({ scheduledDropoffTime: scheduledTime });
    }

    const request: AvailableVenuesRequest = {
      dropoff: {
        location: {
          formatted_address: `${formData.street}, ${formData.city}`,
          coordinates: {
            lat: parseFloat(formData.dropoffLat),
            lon: parseFloat(formData.dropoffLon),
          },
        },
      },
      scheduled_dropoff_time: scheduledTime,
    };

    try {
      await availableVenuesMutation.mutateAsync(request);
    } catch (error) {
      console.error('Failed to get available venues:', error);
    }
  };

  const venues = availableVenuesMutation.data || [];

  return (
    <div className="space-y-6">
      <Card className="border-blue-200 bg-blue-50/50">
        <CardHeader>
          <CardTitle className="text-blue-700">Delivery Location & Venue Selection</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <form onSubmit={handleGetVenues} className="space-y-4">
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
                value={formData.scheduledDropoffTime ? 
                  new Date(formData.scheduledDropoffTime).toISOString().slice(0, 16) : 
                  ''
                }
                onChange={(e) => {
                  const localDateTime = e.target.value;
                  if (localDateTime) {
                    const selectedTime = new Date(localDateTime);
                    const now = new Date();
                    
                    // Ensure the selected time is at least 60 minutes from now
                    const minTime = new Date(now.getTime() + 60 * 60 * 1000); // +60 minutes
                    
                    if (selectedTime < minTime) {
                      // If selected time is too early, use the minimum time
                      const isoDateTime = minTime.toISOString();
                      updateFormData({ scheduledDropoffTime: isoDateTime });
                    } else {
                      const isoDateTime = selectedTime.toISOString();
                      updateFormData({ scheduledDropoffTime: isoDateTime });
                    }
                  } else {
                    updateFormData({ scheduledDropoffTime: '' });
                  }
                }}
                placeholder="Select scheduled dropoff time"
              />
              <p className="text-xs text-gray-500 mt-1">
                Leave empty for default (+60 minutes from now). Selected time must be at least 60 minutes in the future.
              </p>
              {formData.scheduledDropoffTime && (
                <p className="text-xs text-blue-600 mt-1">
                  Will send: {formData.scheduledDropoffTime}
                </p>
              )}
            </div>

            <Button
              type="submit"
              disabled={availableVenuesMutation.isPending}
              className="w-full"
            >
              {availableVenuesMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Getting Available Venues...
                </>
              ) : (
                'Get Available Venues'
              )}
            </Button>
          </form>
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

      {/* Available Venues List */}
      {venues.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Available Venues</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {venues.map((venue, index) => {
                const venueName = venue.pickup.name.find((n) => n.lang === 'en')?.value || 'Unknown Venue';
                const isSelected = selectedVenue?.pickup.venue_id === venue.pickup.venue_id;

                return (
                  <div
                    key={index}
                    className={`border rounded-lg p-4 cursor-pointer transition-all ${
                      isSelected
                        ? 'border-primary bg-primary/5 shadow-md'
                        : 'border-border hover:border-primary hover:shadow-sm'
                    }`}
                    onClick={() => onVenueSelect(venue)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-lg">{venueName}</h3>
                          {isSelected && <CheckCircle2 className="h-5 w-5 text-primary" />}
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">
                          {venue.pickup.location.formatted_address}
                        </p>
                        <div className="flex items-center gap-4 mt-3 text-sm">
                          <div className="flex items-center gap-1">
                            <Clock className="h-4 w-4 text-muted-foreground" />
                            <span>
                              {venue.pre_estimate.total_minutes.min}-{venue.pre_estimate.total_minutes.max} min
                            </span>
                          </div>
                          <div className="flex items-center gap-1">
                            <DollarSign className="h-4 w-4 text-muted-foreground" />
                            <span className="font-semibold">
                              {(venue.fee.amount / 100).toFixed(2)} {venue.fee.currency}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
          </CardContent>
        </Card>
      )}

      {availableVenuesMutation.error && (
        <Card>
          <CardContent className="p-4">
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm font-semibold text-red-700">Error getting venues</p>
              <p className="text-sm text-red-600">{String(availableVenuesMutation.error)}</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

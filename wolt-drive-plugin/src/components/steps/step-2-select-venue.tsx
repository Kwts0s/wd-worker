'use client';

import { UseMutationResult } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DeliveryFormData } from '@/store/form-store';
import {
  AvailableVenuesRequest,
  AvailableVenuesResponse,
  AvailableVenue,
} from '@/types/wolt-drive';
import { MapPin, CheckCircle2, Clock, DollarSign, Loader2 } from 'lucide-react';

interface Step2SelectVenueProps {
  formData: DeliveryFormData;
  availableVenuesMutation: UseMutationResult<AvailableVenuesResponse, Error, AvailableVenuesRequest>;
  selectedVenue: AvailableVenue | null;
  onVenueSelect: (venue: AvailableVenue) => void;
}

export function Step2SelectVenue({
  formData,
  availableVenuesMutation,
  selectedVenue,
  onVenueSelect,
}: Step2SelectVenueProps) {
  const handleGetVenues = async () => {
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
    };

    // Add scheduled dropoff time if provided
    if (formData.scheduledDropoffTime) {
      request.scheduled_dropoff_time = formData.scheduledDropoffTime;
    }

    try {
      await availableVenuesMutation.mutateAsync(request);
    } catch (error) {
      console.error('Failed to get available venues:', error);
    }
  };

  const venues = availableVenuesMutation.data || [];

  return (
    <div className="space-y-6">
      <Card className="border-purple-200 bg-purple-50/50">
        <CardHeader>
          <CardTitle className="text-purple-700 flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Select Pickup Venue
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Select which venue will fulfill this delivery. This is useful for merchants with multiple locations.
          </p>

          {venues.length === 0 ? (
            <Button
              onClick={handleGetVenues}
              disabled={availableVenuesMutation.isPending}
              className="w-full"
            >
              {availableVenuesMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Loading Venues...
                </>
              ) : (
                'Get Available Venues'
              )}
            </Button>
          ) : (
            <div className="space-y-4">
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
            </div>
          )}

          {availableVenuesMutation.error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm font-semibold text-red-700">Error getting venues</p>
              <p className="text-sm text-red-600">{String(availableVenuesMutation.error)}</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

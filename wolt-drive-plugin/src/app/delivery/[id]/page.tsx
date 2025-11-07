'use client';

import { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useWoltDriveStore } from '@/store/wolt-store';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DeliveryStatus } from '@/types/wolt-drive';
import { getDeliveryDisplayName } from '@/lib/delivery-utils';
import { 
  Package, 
  MapPin, 
  User, 
  Phone, 
  Mail, 
  Clock, 
  DollarSign, 
  Link as LinkIcon,
  ArrowLeft,
  ExternalLink,
  Truck,
  Info
} from 'lucide-react';

function getStatusColor(status: DeliveryStatus): 'default' | 'secondary' | 'destructive' | 'outline' {
  switch (status) {
    case 'delivered':
      return 'default';
    case 'in_transit':
    case 'picking_up':
      return 'secondary';
    case 'cancelled':
      return 'destructive';
    default:
      return 'outline';
  }
}

function formatDate(dateString?: string): string {
  if (!dateString) return 'N/A';
  return new Date(dateString).toLocaleString();
}

export default function DeliveryDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { deliveries, selectedDelivery, selectDelivery } = useWoltDriveStore();

  useEffect(() => {
    const id = params.id as string;
    const found = deliveries.find(d => d.id === id);
    if (found && (!selectedDelivery || selectedDelivery.id !== found.id)) {
      selectDelivery(found);
    }
  }, [params.id, deliveries, selectedDelivery, selectDelivery]);

  // Get delivery from params ID
  const delivery = deliveries.find(d => d.id === params.id);

  if (!delivery) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-7xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle>Delivery Not Found</CardTitle>
              <CardDescription>
                The delivery you&apos;re looking for doesn&apos;t exist or hasn&apos;t been loaded yet.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={() => router.push('/')} variant="outline">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Home
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button 
                onClick={() => router.push('/')} 
                variant="ghost" 
                size="sm"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  {getDeliveryDisplayName(delivery)}
                </h1>
                <p className="text-sm text-gray-500">Delivery ID: {delivery.id}</p>
              </div>
            </div>
            <Badge variant={getStatusColor(delivery.status)} className="text-base px-4 py-2">
              {delivery.status.replace('_', ' ').toUpperCase()}
            </Badge>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid gap-6 md:grid-cols-2">
          {/* Tracking Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Truck className="mr-2 h-5 w-5" />
                Tracking Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Tracking ID</p>
                <p className="text-sm font-mono">{delivery.tracking.id}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Tracking URL</p>
                <a 
                  href={delivery.tracking.url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-sm text-blue-600 hover:underline flex items-center"
                >
                  View on Wolt
                  <ExternalLink className="ml-1 h-3 w-3" />
                </a>
              </div>
              {delivery.tracking_sms && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground">SMS Sent</p>
                  <p className="text-sm">{delivery.tracking_sms}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Pricing Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <DollarSign className="mr-2 h-5 w-5" />
                Pricing Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Delivery Price</p>
                <p className="text-2xl font-bold">
                  {(delivery.price.amount / 100).toFixed(2)} {delivery.price.currency}
                </p>
              </div>
              {delivery.tips && delivery.tips.length > 0 && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-2">Tips</p>
                  {delivery.tips.map((tip, index) => (
                    <div key={index} className="flex justify-between text-sm">
                      <span>{tip.type.replace(/_/g, ' ')}</span>
                      <span>{(tip.price.amount / 100).toFixed(2)} {tip.price.currency}</span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Pickup Location */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <MapPin className="mr-2 h-5 w-5" />
                Pickup Location
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Venue</p>
                <p className="text-sm font-semibold">{delivery.pickup.display_name}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Address</p>
                <p className="text-sm">{delivery.pickup.location.formatted_address}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Coordinates: {delivery.pickup.location.coordinates.lat.toFixed(6)}, {delivery.pickup.location.coordinates.lon.toFixed(6)}
                </p>
              </div>
              {delivery.pickup.comment && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Comment</p>
                  <p className="text-sm">{delivery.pickup.comment}</p>
                </div>
              )}
              <div>
                <p className="text-sm font-medium text-muted-foreground">Estimated Pickup Time</p>
                <p className="text-sm">{formatDate(delivery.pickup.eta)}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Preparation Time</p>
                <p className="text-sm">{delivery.pickup.options.min_preparation_time_minutes} minutes</p>
              </div>
              {delivery.pickup.options.scheduled_time && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Scheduled Time</p>
                  <p className="text-sm">{formatDate(delivery.pickup.options.scheduled_time)}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Dropoff Location */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <MapPin className="mr-2 h-5 w-5 text-green-600" />
                Dropoff Location
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Address</p>
                <p className="text-sm">{delivery.dropoff.location.formatted_address}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Coordinates: {delivery.dropoff.location.coordinates.lat.toFixed(6)}, {delivery.dropoff.location.coordinates.lon.toFixed(6)}
                </p>
              </div>
              {delivery.dropoff.comment && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Comment</p>
                  <p className="text-sm">{delivery.dropoff.comment}</p>
                </div>
              )}
              {delivery.dropoff.eta && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Estimated Delivery Time</p>
                  <p className="text-sm">{formatDate(delivery.dropoff.eta)}</p>
                </div>
              )}
              {delivery.dropoff.options.scheduled_time && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Scheduled Time</p>
                  <p className="text-sm">{formatDate(delivery.dropoff.options.scheduled_time)}</p>
                </div>
              )}
              <div>
                <p className="text-sm font-medium text-muted-foreground">Contact Type</p>
                <Badge variant={delivery.dropoff.options.is_no_contact ? 'secondary' : 'outline'}>
                  {delivery.dropoff.options.is_no_contact ? 'No Contact Delivery' : 'Contact Delivery'}
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Recipient Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <User className="mr-2 h-5 w-5" />
                Recipient Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Name</p>
                <p className="text-sm font-semibold">{delivery.recipient.name}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Phone Number</p>
                <p className="text-sm flex items-center">
                  <Phone className="mr-2 h-4 w-4" />
                  {delivery.recipient.phone_number}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Email</p>
                <p className="text-sm flex items-center">
                  <Mail className="mr-2 h-4 w-4" />
                  {delivery.recipient.email}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Customer Support */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Info className="mr-2 h-5 w-5" />
                Customer Support
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {delivery.customer_support.url && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Website</p>
                  <a 
                    href={delivery.customer_support.url.startsWith('http') ? delivery.customer_support.url : `https://${delivery.customer_support.url}`} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-sm text-blue-600 hover:underline flex items-center"
                  >
                    <LinkIcon className="mr-2 h-4 w-4" />
                    {delivery.customer_support.url}
                  </a>
                </div>
              )}
              {delivery.customer_support.email && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Email</p>
                  <p className="text-sm flex items-center">
                    <Mail className="mr-2 h-4 w-4" />
                    {delivery.customer_support.email}
                  </p>
                </div>
              )}
              {delivery.customer_support.phone_number && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Phone</p>
                  <p className="text-sm flex items-center">
                    <Phone className="mr-2 h-4 w-4" />
                    {delivery.customer_support.phone_number}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Parcels */}
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Package className="mr-2 h-5 w-5" />
                Parcels ({delivery.parcels.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {delivery.parcels.map((parcel, index) => (
                  <div key={index} className="border rounded-lg p-4 space-y-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-semibold">{parcel.description}</p>
                        <p className="text-sm text-muted-foreground">ID: {parcel.identifier}</p>
                      </div>
                      <Badge variant="outline">
                        Count: {parcel.count}
                      </Badge>
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <p className="font-medium text-muted-foreground">Weight</p>
                        <p>{parcel.dimensions.weight_gram}g</p>
                      </div>
                      <div>
                        <p className="font-medium text-muted-foreground">Width</p>
                        <p>{parcel.dimensions.width_cm}cm</p>
                      </div>
                      <div>
                        <p className="font-medium text-muted-foreground">Height</p>
                        <p>{parcel.dimensions.height_cm}cm</p>
                      </div>
                      <div>
                        <p className="font-medium text-muted-foreground">Depth</p>
                        <p>{parcel.dimensions.depth_cm}cm</p>
                      </div>
                    </div>

                    <div className="flex justify-between items-center pt-2 border-t">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Price</p>
                        <p className="font-semibold">
                          {(parcel.price.amount / 100).toFixed(2)} {parcel.price.currency}
                        </p>
                      </div>
                      <div>
                        <Badge variant={parcel.dropoff_restrictions.id_check_required ? 'destructive' : 'outline'}>
                          {parcel.dropoff_restrictions.id_check_required ? 'ID Check Required' : 'No ID Check'}
                        </Badge>
                      </div>
                    </div>

                    {parcel.tags && parcel.tags.length > 0 && (
                      <div className="flex gap-2 flex-wrap">
                        {parcel.tags.map((tag, tagIndex) => (
                          <Badge key={tagIndex} variant="secondary" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Order References */}
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Clock className="mr-2 h-5 w-5" />
                Order References
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Order Number</p>
                  <p className="text-sm font-mono">{delivery.order_number}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Merchant Order Reference</p>
                  <p className="text-sm font-mono">{delivery.merchant_order_reference_id}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Wolt Order Reference</p>
                  <p className="text-sm font-mono">{delivery.wolt_order_reference_id}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Courier Information (if available) */}
          {delivery.courier && (
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Truck className="mr-2 h-5 w-5" />
                  Courier Information
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Name</p>
                    <p className="text-sm">{delivery.courier.name}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Phone</p>
                    <p className="text-sm">{delivery.courier.phone_number}</p>
                  </div>
                  {delivery.courier.location && (
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Location</p>
                      <p className="text-sm">
                        {delivery.courier.location.lat.toFixed(6)}, {delivery.courier.location.lon.toFixed(6)}
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
}

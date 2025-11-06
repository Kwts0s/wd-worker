'use client';

import { useState } from 'react';
import { useCreateDelivery, useShipmentPromise } from '@/hooks/use-wolt-api';
import { useWoltDriveStore } from '@/store/wolt-store';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { CreateDeliveryRequest, ShipmentPromiseRequest } from '@/types/wolt-drive';

export function CreateDeliveryForm() {
  const { apiToken, merchantId } = useWoltDriveStore();
  const createDelivery = useCreateDelivery();

  // Generate order reference once on mount
  const [orderRef] = useState(() => `ORDER-${Date.now()}`);
  const [shipmentPromiseId, setShipmentPromiseId] = useState<string | null>(null);
  const [quoteRequest, setQuoteRequest] = useState<ShipmentPromiseRequest | null>(null);

  // Use the shipment promise hook
  const shipmentPromise = useShipmentPromise(quoteRequest);

  const [formData, setFormData] = useState({
    // Dropoff location for quote
    street: 'Mesogeion 217',
    city: 'Athens',
    postCode: '11525',
    dropoffLat: '37.996825',
    dropoffLon: '23.781103',
    language: 'en',
    minPrepTime: '60',

    // Pickup
    pickupComment: '',

    // Dropoff
    dropoffName: 'Kostas Gall',
    dropoffPhone: '6944213449',
    dropoffEmail: 'info.kgalliakis@gmail.com',
    dropoffComment: '',
    noContact: false,

    // Order details
    orderReference: orderRef,
    orderPrice: '890',
    currency: 'EUR',

    // Customer support
    supportUrl: 'kgalliakis.gr',
    supportEmail: '',
    supportPhone: '',

    // Item/Parcel details
    parcelDescription: 'Burger',
    parcelIdentifier: 'burger-2',
    parcelCount: '1',
    parcelWeight: '200',
    parcelWidth: '30',
    parcelHeight: '30',
    parcelDepth: '30',
    parcelPrice: '10',
    tipAmount: '0',

    // SMS Notifications
    receivedSms: 'Hello John Doe! Your order from Amazing Store will be delivered soon. You can follow it here: TRACKING_LINK',
    pickedUpSms: 'Hello John Doe! Your order from Amazing Store has been picked up and will be delivered soon. You can follow it here: TRACKING_LINK',
  });

  const handleGetQuote = async (e: React.FormEvent) => {
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

    setQuoteRequest(request);
  };

  // When shipment promise is received, save the ID
  if (shipmentPromise.data && !shipmentPromiseId) {
    setShipmentPromiseId(shipmentPromise.data.id);
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!shipmentPromiseId) {
      alert('Please get a quote first before creating the delivery!');
      return;
    }

    const request: CreateDeliveryRequest = {
      pickup: {
        options: {
          min_preparation_time_minutes: parseInt(formData.minPrepTime),
        },
        comment: formData.pickupComment,
      },
      dropoff: {
        location: {
          coordinates: {
            lat: parseFloat(formData.dropoffLat),
            lon: parseFloat(formData.dropoffLon),
          },
        },
        comment: formData.dropoffComment,
        options: {
          is_no_contact: formData.noContact,
        },
      },
      price: {
        amount: parseInt(formData.orderPrice),
        currency: formData.currency,
      },
      recipient: {
        name: formData.dropoffName,
        phone_number: formData.dropoffPhone,
        email: formData.dropoffEmail,
      },
      parcels: [
        {
          count: parseInt(formData.parcelCount),
          dimensions: {
            weight_gram: parseInt(formData.parcelWeight),
            width_cm: parseInt(formData.parcelWidth),
            height_cm: parseInt(formData.parcelHeight),
            depth_cm: parseInt(formData.parcelDepth),
          },
          price: {
            amount: parseInt(formData.parcelPrice),
            currency: formData.currency,
          },
          description: formData.parcelDescription,
          identifier: formData.parcelIdentifier,
          dropoff_restrictions: {
            id_check_required: false,
          },
        },
      ],
      shipment_promise_id: shipmentPromiseId,
      customer_support: {
        url: formData.supportUrl,
        email: formData.supportEmail,
        phone_number: formData.supportPhone,
      },
      merchant_order_reference_id: formData.orderReference,
      sms_notifications: {
        received: formData.receivedSms,
        picked_up: formData.pickedUpSms,
      },
      tips: [
        {
          type: 'pre_delivery_courier_tip',
          price: {
            amount: parseInt(formData.tipAmount),
            currency: formData.currency,
          },
        },
      ],
      order_number: formData.orderReference, // Use order reference as order number
      handshake_delivery: {
        is_required: false,
        should_send_sms_to_dropoff_contact: true,
      },
    };

    try {
      await createDelivery.mutateAsync(request);
      alert('Delivery created successfully!');
      // Reset shipment promise for next order
      setShipmentPromiseId(null);
      setQuoteRequest(null);
    } catch (error) {
      alert(`Failed to create delivery: ${error}`);
    }
  };

  if (!apiToken || !merchantId) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Create Delivery</CardTitle>
          <CardDescription>
            Please configure your API credentials first
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Create New Delivery</CardTitle>
        <CardDescription>
          Step 1: Get a quote. Step 2: Create the delivery using the quote ID.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleGetQuote} className="space-y-6 mb-8">
          {/* Step 1: Get Quote */}
          <div className="space-y-4 border-2 border-blue-200 p-4 rounded-lg">
            <h3 className="text-lg font-semibold text-blue-700">Step 1: Get Shipment Quote</h3>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="md:col-span-2">
                <label className="text-sm font-medium">Street</label>
                <Input
                  value={formData.street}
                  onChange={(e) => setFormData({ ...formData, street: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="text-sm font-medium">City</label>
                <Input
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="text-sm font-medium">Post Code</label>
                <Input
                  value={formData.postCode}
                  onChange={(e) => setFormData({ ...formData, postCode: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="text-sm font-medium">Latitude</label>
                <Input
                  type="number"
                  step="any"
                  value={formData.dropoffLat}
                  onChange={(e) => setFormData({ ...formData, dropoffLat: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="text-sm font-medium">Longitude</label>
                <Input
                  type="number"
                  step="any"
                  value={formData.dropoffLon}
                  onChange={(e) => setFormData({ ...formData, dropoffLon: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="text-sm font-medium">Language</label>
                <Input
                  value={formData.language}
                  onChange={(e) => setFormData({ ...formData, language: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="text-sm font-medium">Min Preparation Time (minutes)</label>
                <Input
                  type="number"
                  value={formData.minPrepTime}
                  onChange={(e) => setFormData({ ...formData, minPrepTime: e.target.value })}
                  required
                />
              </div>
            </div>
            <Button type="submit" disabled={shipmentPromise.isPending} className="w-full">
              {shipmentPromise.isPending ? 'Getting Quote...' : 'Get Quote'}
            </Button>
            {shipmentPromise.data && (
              <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-sm font-semibold text-green-700">Quote received!</p>
                <p className="text-sm text-green-600">Shipment Promise ID: {shipmentPromise.data.id}</p>
                {shipmentPromise.data.fee && (
                  <p className="text-sm text-green-600">
                    Fee: {shipmentPromise.data.fee.amount} {shipmentPromise.data.fee.currency}
                  </p>
                )}
              </div>
            )}
            {shipmentPromise.error && (
              <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm font-semibold text-red-700">Error getting quote</p>
                <p className="text-sm text-red-600">{String(shipmentPromise.error)}</p>
              </div>
            )}
          </div>
        </form>

        {/* Step 2: Create Delivery */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4 border-2 border-green-200 p-4 rounded-lg">
            <h3 className="text-lg font-semibold text-green-700">Step 2: Create Delivery Order</h3>
            
            {/* Pickup Section */}
            <div className="space-y-4">
              <h4 className="font-semibold">Pickup Options</h4>
              <div>
                <label className="text-sm font-medium">Pickup Comment (optional)</label>
                <Input
                  value={formData.pickupComment}
                  onChange={(e) => setFormData({ ...formData, pickupComment: e.target.value })}
                />
              </div>
            </div>

            {/* Recipient Section */}
            <div className="space-y-4">
              <h4 className="font-semibold">Recipient Details</h4>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="text-sm font-medium">Name</label>
                  <Input
                    value={formData.dropoffName}
                    onChange={(e) => setFormData({ ...formData, dropoffName: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Phone Number</label>
                  <Input
                    value={formData.dropoffPhone}
                    onChange={(e) => setFormData({ ...formData, dropoffPhone: e.target.value })}
                    required
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="text-sm font-medium">Email</label>
                  <Input
                    type="email"
                    value={formData.dropoffEmail}
                    onChange={(e) => setFormData({ ...formData, dropoffEmail: e.target.value })}
                    required
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="text-sm font-medium">Dropoff Comment (optional)</label>
                  <Input
                    value={formData.dropoffComment}
                    onChange={(e) => setFormData({ ...formData, dropoffComment: e.target.value })}
                  />
                </div>
              </div>
            </div>

            {/* Order Details */}
            <div className="space-y-4">
              <h4 className="font-semibold">Order Details</h4>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="text-sm font-medium">Order Reference</label>
                  <Input
                    value={formData.orderReference}
                    onChange={(e) => setFormData({ ...formData, orderReference: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Order Price (cents)</label>
                  <Input
                    type="number"
                    value={formData.orderPrice}
                    onChange={(e) => setFormData({ ...formData, orderPrice: e.target.value })}
                    required
                  />
                </div>
              </div>
            </div>

            {/* Parcel Details */}
            <div className="space-y-4">
              <h4 className="font-semibold">Parcel Details</h4>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="text-sm font-medium">Description</label>
                  <Input
                    value={formData.parcelDescription}
                    onChange={(e) => setFormData({ ...formData, parcelDescription: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Identifier</label>
                  <Input
                    value={formData.parcelIdentifier}
                    onChange={(e) => setFormData({ ...formData, parcelIdentifier: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Count</label>
                  <Input
                    type="number"
                    min="1"
                    value={formData.parcelCount}
                    onChange={(e) => setFormData({ ...formData, parcelCount: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Weight (grams)</label>
                  <Input
                    type="number"
                    value={formData.parcelWeight}
                    onChange={(e) => setFormData({ ...formData, parcelWeight: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Width (cm)</label>
                  <Input
                    type="number"
                    value={formData.parcelWidth}
                    onChange={(e) => setFormData({ ...formData, parcelWidth: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Height (cm)</label>
                  <Input
                    type="number"
                    value={formData.parcelHeight}
                    onChange={(e) => setFormData({ ...formData, parcelHeight: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Depth (cm)</label>
                  <Input
                    type="number"
                    value={formData.parcelDepth}
                    onChange={(e) => setFormData({ ...formData, parcelDepth: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Parcel Price (cents)</label>
                  <Input
                    type="number"
                    value={formData.parcelPrice}
                    onChange={(e) => setFormData({ ...formData, parcelPrice: e.target.value })}
                    required
                  />
                </div>
              </div>
            </div>

            {/* Customer Support */}
            <div className="space-y-4">
              <h4 className="font-semibold">Customer Support</h4>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="text-sm font-medium">Support URL</label>
                  <Input
                    value={formData.supportUrl}
                    onChange={(e) => setFormData({ ...formData, supportUrl: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Tip Amount (cents)</label>
                  <Input
                    type="number"
                    value={formData.tipAmount}
                    onChange={(e) => setFormData({ ...formData, tipAmount: e.target.value })}
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={formData.noContact}
                  onChange={(e) => setFormData({ ...formData, noContact: e.target.checked })}
                  className="rounded border-gray-300"
                />
                <span className="text-sm font-medium">No contact delivery</span>
              </label>
            </div>

            <Button 
              type="submit" 
              disabled={createDelivery.isPending || !shipmentPromiseId} 
              className="w-full"
            >
              {createDelivery.isPending ? 'Creating...' : 'Create Delivery'}
            </Button>
            
            {!shipmentPromiseId && (
              <p className="text-sm text-yellow-600 text-center">
                ⚠️ Please get a quote first before creating a delivery
              </p>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

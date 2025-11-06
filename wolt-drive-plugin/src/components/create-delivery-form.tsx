'use client';

import { useState } from 'react';
import { useCreateDelivery } from '@/hooks/use-wolt-api';
import { useWoltDriveStore } from '@/store/wolt-store';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { CreateDeliveryRequest } from '@/types/wolt-drive';

export function CreateDeliveryForm() {
  const { apiToken, merchantId } = useWoltDriveStore();
  const createDelivery = useCreateDelivery();

  const [formData, setFormData] = useState({
    // Pickup
    pickupAddress: 'Aleksanterinkatu 21, 00100 Helsinki, Finland',
    pickupLat: '60.168992',
    pickupLon: '24.942590',
    pickupName: 'Store Manager',
    pickupPhone: '+358401234567',
    pickupComment: '',

    // Dropoff
    dropoffAddress: 'Mannerheimintie 12, 00100 Helsinki, Finland',
    dropoffLat: '60.169857',
    dropoffLon: '24.938379',
    dropoffName: 'John Doe',
    dropoffPhone: '+358409876543',
    dropoffComment: '',
    sendSMS: true,

    // Order details
    orderReference: `ORDER-${Date.now()}`,
    noContact: false,

    // Items
    itemDescription: 'Pizza Margherita',
    itemCount: '1',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const request: CreateDeliveryRequest = {
      pickup: {
        location: {
          formatted_address: formData.pickupAddress,
          coordinates: {
            lat: parseFloat(formData.pickupLat),
            lon: parseFloat(formData.pickupLon),
          },
        },
        comment: formData.pickupComment,
        contact_details: {
          name: formData.pickupName,
          phone_number: formData.pickupPhone,
          send_tracking_link_sms: false,
        },
      },
      dropoff: {
        location: {
          formatted_address: formData.dropoffAddress,
          coordinates: {
            lat: parseFloat(formData.dropoffLat),
            lon: parseFloat(formData.dropoffLon),
          },
        },
        comment: formData.dropoffComment,
        contact_details: {
          name: formData.dropoffName,
          phone_number: formData.dropoffPhone,
          send_tracking_link_sms: formData.sendSMS,
        },
      },
      customer_support: {
        email: 'support@example.com',
        phone_number: formData.pickupPhone,
        url: 'https://example.com/support',
      },
      merchant_order_reference_id: formData.orderReference,
      is_no_contact_delivery: formData.noContact,
      contents: [
        {
          count: parseInt(formData.itemCount),
          description: formData.itemDescription,
          identifier: 'ITEM-001',
          tags: ['food'],
        },
      ],
      tips: [],
    };

    try {
      await createDelivery.mutateAsync(request);
      alert('Delivery created successfully!');
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
          Fill in the details to create a delivery order
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Pickup Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Pickup Location</h3>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="md:col-span-2">
                <label className="text-sm font-medium">Address</label>
                <Input
                  value={formData.pickupAddress}
                  onChange={(e) => setFormData({ ...formData, pickupAddress: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="text-sm font-medium">Latitude</label>
                <Input
                  type="number"
                  step="any"
                  value={formData.pickupLat}
                  onChange={(e) => setFormData({ ...formData, pickupLat: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="text-sm font-medium">Longitude</label>
                <Input
                  type="number"
                  step="any"
                  value={formData.pickupLon}
                  onChange={(e) => setFormData({ ...formData, pickupLon: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="text-sm font-medium">Contact Name</label>
                <Input
                  value={formData.pickupName}
                  onChange={(e) => setFormData({ ...formData, pickupName: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="text-sm font-medium">Phone Number</label>
                <Input
                  value={formData.pickupPhone}
                  onChange={(e) => setFormData({ ...formData, pickupPhone: e.target.value })}
                  required
                />
              </div>
              <div className="md:col-span-2">
                <label className="text-sm font-medium">Comment (optional)</label>
                <Input
                  value={formData.pickupComment}
                  onChange={(e) => setFormData({ ...formData, pickupComment: e.target.value })}
                />
              </div>
            </div>
          </div>

          {/* Dropoff Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Dropoff Location</h3>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="md:col-span-2">
                <label className="text-sm font-medium">Address</label>
                <Input
                  value={formData.dropoffAddress}
                  onChange={(e) => setFormData({ ...formData, dropoffAddress: e.target.value })}
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
                <label className="text-sm font-medium">Contact Name</label>
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
                <label className="text-sm font-medium">Comment (optional)</label>
                <Input
                  value={formData.dropoffComment}
                  onChange={(e) => setFormData({ ...formData, dropoffComment: e.target.value })}
                />
              </div>
            </div>
          </div>

          {/* Order Details */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Order Details</h3>
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
                <label className="text-sm font-medium">Item Description</label>
                <Input
                  value={formData.itemDescription}
                  onChange={(e) => setFormData({ ...formData, itemDescription: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="text-sm font-medium">Item Count</label>
                <Input
                  type="number"
                  min="1"
                  value={formData.itemCount}
                  onChange={(e) => setFormData({ ...formData, itemCount: e.target.value })}
                  required
                />
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={formData.sendSMS}
                  onChange={(e) => setFormData({ ...formData, sendSMS: e.target.checked })}
                  className="rounded border-gray-300"
                />
                <span className="text-sm font-medium">Send tracking SMS</span>
              </label>
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
          </div>

          <Button type="submit" disabled={createDelivery.isPending} className="w-full">
            {createDelivery.isPending ? 'Creating...' : 'Create Delivery'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

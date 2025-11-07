'use client';

import { useWoltDriveStore } from '@/store/wolt-store';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { DeliveryResponse, DeliveryStatus } from '@/types/wolt-drive';
import { useRouter } from 'next/navigation';

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

interface DeliveryCardProps {
  delivery: DeliveryResponse;
  onSelect: () => void;
}

function DeliveryCard({ delivery, onSelect }: DeliveryCardProps) {
  return (
    <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={onSelect}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <CardTitle className="text-base">
              {delivery.merchant_order_reference_id || delivery.order_number || delivery.id.slice(0, 8)}
            </CardTitle>
            <CardDescription className="text-xs">
              Created: {formatDate(delivery.created_at)}
            </CardDescription>
          </div>
          <Badge variant={getStatusColor(delivery.status)}>
            {delivery.status.replace('_', ' ')}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-2 text-sm">
        <div>
          <p className="font-medium text-xs text-muted-foreground">From</p>
          <p className="text-xs">{delivery.pickup.location.formatted_address}</p>
        </div>
        <div>
          <p className="font-medium text-xs text-muted-foreground">To</p>
          <p className="text-xs">{delivery.dropoff.location.formatted_address}</p>
        </div>
        <div className="flex items-center justify-between pt-2">
          <div>
            <p className="font-medium text-xs text-muted-foreground">Price</p>
            <p className="text-sm font-semibold">
              {(delivery.price.amount / 100).toFixed(2)} {delivery.price.currency}
            </p>
          </div>
          {delivery.courier && (
            <div className="text-right">
              <p className="font-medium text-xs text-muted-foreground">Courier</p>
              <p className="text-xs">{delivery.courier.name}</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export function DeliveryList() {
  const { apiToken, merchantId, venueId, deliveries, selectDelivery } = useWoltDriveStore();
  const router = useRouter();

  if (!apiToken || !merchantId || !venueId) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Deliveries</CardTitle>
          <CardDescription>
            Please configure your API credentials first
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const handleSelectDelivery = (delivery: DeliveryResponse) => {
    selectDelivery(delivery);
    router.push(`/delivery/${delivery.id}`);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Deliveries</h2>
          <p className="text-sm text-muted-foreground">
            {deliveries.length} {deliveries.length === 1 ? 'delivery' : 'deliveries'} in this session
          </p>
        </div>
      </div>

      {deliveries.length === 0 ? (
        <Card>
          <CardContent className="py-8">
            <p className="text-center text-muted-foreground">
              No deliveries found. Create your first delivery to get started.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {deliveries.map((delivery) => (
            <DeliveryCard
              key={delivery.id}
              delivery={delivery}
              onSelect={() => handleSelectDelivery(delivery)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

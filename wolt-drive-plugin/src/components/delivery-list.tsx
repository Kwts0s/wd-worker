'use client';

import { useWoltDriveStore } from '@/store/wolt-store';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { DeliveryResponse, DeliveryStatus } from '@/types/wolt-drive';
import { useRouter } from 'next/navigation';
import { getDeliveryDisplayName } from '@/lib/delivery-utils';
import { ArrowUpDown } from 'lucide-react';

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

function formatDateTime(dateString?: string): string {
  if (!dateString) return 'N/A';
  const date = new Date(dateString);
  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
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

  // Sort deliveries by created_at, newest first
  const sortedDeliveries = [...deliveries].sort((a, b) => {
    const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
    const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
    return dateB - dateA;
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            Deliveries
          </h2>
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
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Order
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      <div className="flex items-center gap-1">
                        Created <ArrowUpDown className="h-3 w-3" />
                      </div>
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      From
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      To
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Price
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {sortedDeliveries.map((delivery) => (
                    <tr
                      key={delivery.id}
                      onClick={() => handleSelectDelivery(delivery)}
                      className="cursor-pointer hover:bg-muted/50 transition-colors"
                    >
                      <td className="px-4 py-4">
                        <div className="flex flex-col">
                          <span className="font-medium text-sm">{getDeliveryDisplayName(delivery)}</span>
                          <span className="text-xs text-muted-foreground">{delivery.order_number}</span>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <span className="text-sm">{formatDateTime(delivery.created_at)}</span>
                      </td>
                      <td className="px-4 py-4">
                        <Badge variant={getStatusColor(delivery.status)}>
                          {delivery.status.replace('_', ' ')}
                        </Badge>
                      </td>
                      <td className="px-4 py-4">
                        <span className="text-sm text-muted-foreground">
                          {delivery.pickup.location.formatted_address?.split(',')[0] || 'N/A'}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <span className="text-sm text-muted-foreground">
                          {delivery.dropoff.location.formatted_address?.split(',')[0] || 'N/A'}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-right">
                        <span className="font-semibold text-sm">
                          {(delivery.price.amount / 100).toFixed(2)} {delivery.price.currency}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

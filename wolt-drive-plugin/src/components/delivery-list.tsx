'use client';

import { useState } from 'react';
import { useWoltDriveStore } from '@/store/wolt-store';
import { useCancelDelivery } from '@/hooks/use-wolt-api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { DeliveryResponse, DeliveryStatus } from '@/types/wolt-drive';
import { useRouter } from 'next/navigation';
import { getDeliveryDisplayName } from '@/lib/delivery-utils';
import { ArrowUpDown, XCircle, AlertTriangle } from 'lucide-react';

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
  const { apiToken, merchantId, venueId, deliveries, selectDelivery, updateDelivery } = useWoltDriveStore();
  const router = useRouter();
  const cancelDeliveryMutation = useCancelDelivery();
  
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [selectedDeliveryForCancel, setSelectedDeliveryForCancel] = useState<DeliveryResponse | null>(null);
  const [cancelReason, setCancelReason] = useState('');

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

  const handleCancelClick = (e: React.MouseEvent, delivery: DeliveryResponse) => {
    e.stopPropagation();
    setSelectedDeliveryForCancel(delivery);
    setShowCancelDialog(true);
  };

  const handleCancelDelivery = async () => {
    if (!selectedDeliveryForCancel || !cancelReason.trim()) {
      alert('Please provide a cancellation reason');
      return;
    }

    try {
      await cancelDeliveryMutation.mutateAsync({
        woltOrderReferenceId: selectedDeliveryForCancel.wolt_order_reference_id,
        request: { reason: cancelReason },
      });
      
      // Update the delivery status locally
      updateDelivery(selectedDeliveryForCancel.id, { status: 'cancelled' as DeliveryStatus });
      
      alert('Delivery cancelled successfully!');
      setShowCancelDialog(false);
      setSelectedDeliveryForCancel(null);
      setCancelReason('');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      alert(`Failed to cancel delivery: ${errorMessage}`);
    }
  };

  const canCancelDelivery = (delivery: DeliveryResponse) => {
    return delivery.status !== 'cancelled' && 
      delivery.status !== 'delivered' &&
      delivery.status !== 'picked_up' &&
      delivery.status !== 'in_transit';
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
                    <th className="px-4 py-3 text-center text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {sortedDeliveries.map((delivery) => (
                    <tr
                      key={delivery.id}
                      className="hover:bg-muted/50 transition-colors"
                    >
                      <td 
                        className="px-4 py-4 cursor-pointer"
                        onClick={() => handleSelectDelivery(delivery)}
                      >
                        <div className="flex flex-col">
                          <span className="font-medium text-sm">{getDeliveryDisplayName(delivery)}</span>
                          <span className="text-xs text-muted-foreground">{delivery.order_number}</span>
                        </div>
                      </td>
                      <td 
                        className="px-4 py-4 cursor-pointer"
                        onClick={() => handleSelectDelivery(delivery)}
                      >
                        <span className="text-sm">{formatDateTime(delivery.created_at)}</span>
                      </td>
                      <td 
                        className="px-4 py-4 cursor-pointer"
                        onClick={() => handleSelectDelivery(delivery)}
                      >
                        <Badge variant={getStatusColor(delivery.status)}>
                          {delivery.status.replace('_', ' ')}
                        </Badge>
                      </td>
                      <td 
                        className="px-4 py-4 cursor-pointer"
                        onClick={() => handleSelectDelivery(delivery)}
                      >
                        <span className="text-sm text-muted-foreground">
                          {delivery.pickup.location.formatted_address?.split(',')[0] || 'N/A'}
                        </span>
                      </td>
                      <td 
                        className="px-4 py-4 cursor-pointer"
                        onClick={() => handleSelectDelivery(delivery)}
                      >
                        <span className="text-sm text-muted-foreground">
                          {delivery.dropoff.location.formatted_address?.split(',')[0] || 'N/A'}
                        </span>
                      </td>
                      <td 
                        className="px-4 py-4 text-right cursor-pointer"
                        onClick={() => handleSelectDelivery(delivery)}
                      >
                        <span className="font-semibold text-sm">
                          {(delivery.price.amount / 100).toFixed(2)} {delivery.price.currency}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-center">
                        {canCancelDelivery(delivery) && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => handleCancelClick(e, delivery)}
                            className="text-destructive hover:text-destructive hover:bg-destructive/10"
                          >
                            <XCircle className="h-4 w-4" />
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Cancel Dialog */}
      {showCancelDialog && selectedDeliveryForCancel && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <Card className="max-w-md w-full">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-destructive">
                <AlertTriangle className="h-5 w-5" />
                Cancel Delivery
              </CardTitle>
              <CardDescription>
                Are you sure you want to cancel order {selectedDeliveryForCancel.order_number}?
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium">Cancellation Reason *</label>
                <Input
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  placeholder="e.g., Customer requested cancellation"
                  className="mt-1"
                />
              </div>
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                <p className="text-sm text-yellow-800">
                  <strong>Note:</strong> Deliveries can only be cancelled before the courier accepts the task.
                </p>
              </div>
              <div className="flex gap-2 justify-end">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowCancelDialog(false);
                    setSelectedDeliveryForCancel(null);
                    setCancelReason('');
                  }}
                  disabled={cancelDeliveryMutation.isPending}
                >
                  Keep Order
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleCancelDelivery}
                  disabled={cancelDeliveryMutation.isPending || !cancelReason.trim()}
                >
                  {cancelDeliveryMutation.isPending ? 'Cancelling...' : 'Cancel Order'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

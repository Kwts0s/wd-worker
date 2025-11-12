'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { XCircle, ExternalLink, RefreshCw, ShoppingCart } from 'lucide-react';

interface Delivery {
  id: number;
  wolt_order_reference_id: string;
  merchant_order_reference_id: string;
  venue_name: string;
  status: string;
  price_amount: number;
  price_currency: string;
  tracking_url: string;
  customer_name: string;
  dropoff_address: string;
  created_at: string;
}

export default function AdminDeliveriesPage() {
  const router = useRouter();
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  const loadDeliveries = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/wolt/deliveries');
      if (!response.ok) {
        throw new Error('Failed to load deliveries');
      }
      const data = await response.json();
      setDeliveries(data.deliveries || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load deliveries');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDeliveries();
  }, []);

  const handleCancel = async (woltOrderReferenceId: string) => {
    if (!confirm('Are you sure you want to cancel this delivery?')) {
      return;
    }

    setCancellingId(woltOrderReferenceId);
    try {
      const response = await fetch(`/api/wolt/deliveries/${woltOrderReferenceId}/cancel`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: 'Customer cancelled' })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to cancel delivery');
      }

      // Reload deliveries after successful cancellation
      await loadDeliveries();
      alert('Delivery cancelled successfully');
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to cancel delivery');
    } finally {
      setCancellingId(null);
    }
  };

  const canCancel = (status: string) => {
    const nonCancellableStatuses = ['delivered', 'picked_up', 'cancelled'];
    return !nonCancellableStatuses.includes(status.toLowerCase());
  };

  const getStatusColor = (status: string) => {
    const statusLower = status.toLowerCase();
    if (statusLower === 'delivered') return 'bg-green-500';
    if (statusLower === 'cancelled') return 'bg-gray-500';
    if (statusLower === 'picked_up' || statusLower === 'in_transit') return 'bg-blue-500';
    if (statusLower === 'courier_assigned' || statusLower === 'picking_up') return 'bg-yellow-500';
    return 'bg-purple-500';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted">
      <header className="bg-card/80 backdrop-blur-sm border-b border-border/50 sticky top-0 z-20">
        <div className="px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold">Admin - Deliveries</h1>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => router.push('/cart')}>
                <ShoppingCart className="h-4 w-4 mr-2" />
                Go to Shop
              </Button>
              <Button variant="outline" onClick={() => router.push('/')}>
                Main Panel
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="px-4 sm:px-6 lg:px-8 py-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold">All Deliveries</h2>
            <Button onClick={loadDeliveries} disabled={loading} variant="outline" size="sm">
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>

          {error && (
            <div className="bg-destructive/10 text-destructive p-4 rounded-lg mb-6">
              {error}
            </div>
          )}

          {loading && deliveries.length === 0 ? (
            <Card className="p-8 text-center">
              <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading deliveries...</p>
            </Card>
          ) : deliveries.length === 0 ? (
            <Card className="p-8 text-center">
              <p className="text-muted-foreground">No deliveries found</p>
            </Card>
          ) : (
            <div className="overflow-x-auto">
              <Card className="p-0">
                <table className="w-full">
                  <thead className="border-b">
                    <tr className="text-left">
                      <th className="p-4 font-semibold">Order #</th>
                      <th className="p-4 font-semibold">Customer</th>
                      <th className="p-4 font-semibold">Venue</th>
                      <th className="p-4 font-semibold">Status</th>
                      <th className="p-4 font-semibold">Price</th>
                      <th className="p-4 font-semibold">Tracking</th>
                      <th className="p-4 font-semibold">Created</th>
                      <th className="p-4 font-semibold">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {deliveries.map((delivery) => (
                      <tr key={delivery.id} className="border-b last:border-b-0 hover:bg-muted/50">
                        <td className="p-4">
                          <div className="font-mono text-sm">
                            {delivery.merchant_order_reference_id || delivery.wolt_order_reference_id.slice(0, 8)}
                          </div>
                        </td>
                        <td className="p-4">
                          <div className="font-medium">{delivery.customer_name}</div>
                          <div className="text-sm text-muted-foreground line-clamp-1">
                            {delivery.dropoff_address}
                          </div>
                        </td>
                        <td className="p-4">
                          <div className="text-sm">{delivery.venue_name || 'N/A'}</div>
                        </td>
                        <td className="p-4">
                          <Badge className={`${getStatusColor(delivery.status)} text-white`}>
                            {delivery.status}
                          </Badge>
                        </td>
                        <td className="p-4">
                          <div className="font-semibold">
                            {delivery.price_currency} {(delivery.price_amount / 100).toFixed(2)}
                          </div>
                        </td>
                        <td className="p-4">
                          {delivery.tracking_url ? (
                            <a
                              href={delivery.tracking_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center text-primary hover:underline text-sm"
                            >
                              Track <ExternalLink className="h-3 w-3 ml-1" />
                            </a>
                          ) : (
                            <span className="text-muted-foreground text-sm">N/A</span>
                          )}
                        </td>
                        <td className="p-4">
                          <div className="text-sm">
                            {new Date(delivery.created_at).toLocaleDateString()}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {new Date(delivery.created_at).toLocaleTimeString()}
                          </div>
                        </td>
                        <td className="p-4">
                          {canCancel(delivery.status) ? (
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleCancel(delivery.wolt_order_reference_id)}
                              disabled={cancellingId === delivery.wolt_order_reference_id}
                            >
                              {cancellingId === delivery.wolt_order_reference_id ? (
                                'Cancelling...'
                              ) : (
                                <>
                                  <XCircle className="h-4 w-4 mr-1" />
                                  Cancel
                                </>
                              )}
                            </Button>
                          ) : (
                            <span className="text-xs text-muted-foreground">
                              {delivery.status === 'cancelled' ? 'Cancelled' : 'Cannot cancel'}
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </Card>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

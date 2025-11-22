'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Webhook, RefreshCw, CheckCircle, XCircle, Clock } from 'lucide-react';

interface WebhookEvent {
  id: number;
  event_type: string;
  delivery_id: string;
  merchant_id: string;
  status: string;
  payload: string;
  processed_at: string;
  processing_time_ms: number;
}

export function WebhookLogs() {
  const [events, setEvents] = useState<WebhookEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchWebhookEvents = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/wolt/webhooks');
      
      if (!response.ok) {
        throw new Error('Failed to fetch webhook events');
      }

      const data = await response.json();
      setEvents(data.events || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWebhookEvents();
  }, []);

  const getEventTypeBadgeVariant = (eventType: string) => {
    if (eventType.includes('created')) return 'default';
    if (eventType.includes('delivered')) return 'default';
    if (eventType.includes('cancelled')) return 'destructive';
    if (eventType.includes('status_changed')) return 'secondary';
    return 'outline';
  };

  const getStatusIcon = (status: string) => {
    if (status === 'success') return <CheckCircle className="h-4 w-4 text-green-500" />;
    if (status === 'error') return <XCircle className="h-4 w-4 text-red-500" />;
    return <Clock className="h-4 w-4 text-gray-500" />;
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Webhook className="h-5 w-5" />
              Webhook Events
            </CardTitle>
            <CardDescription>
              Real-time delivery status updates from Wolt Drive
            </CardDescription>
          </div>
          <Button
            onClick={fetchWebhookEvents}
            disabled={loading}
            variant="outline"
            size="sm"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {error && (
          <div className="text-sm text-red-500 mb-4">
            Error: {error}
          </div>
        )}

        {loading && events.length === 0 ? (
          <div className="text-center text-muted-foreground py-8">
            Loading webhook events...
          </div>
        ) : events.length === 0 ? (
          <div className="text-center text-muted-foreground py-8">
            <Webhook className="h-12 w-12 mx-auto mb-3 opacity-30" />
            <p>No webhook events received yet</p>
            <p className="text-xs mt-2">
              Configure webhooks in your Wolt merchant dashboard
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {events.map((event) => (
              <div
                key={event.id}
                className="border rounded-lg p-4 space-y-2 hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    {getStatusIcon(event.status)}
                    <Badge variant={getEventTypeBadgeVariant(event.event_type)}>
                      {event.event_type}
                    </Badge>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {new Date(event.processed_at).toLocaleString()}
                  </span>
                </div>
                
                <div className="text-sm space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground">Delivery ID:</span>
                    <span className="font-mono text-xs">{event.delivery_id}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground">Processing time:</span>
                    <span className="font-mono text-xs">{event.processing_time_ms}ms</span>
                  </div>
                </div>

                <details className="text-xs">
                  <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
                    View payload
                  </summary>
                  <pre className="mt-2 p-2 bg-muted rounded text-xs overflow-auto max-h-40">
                    {(() => {
                      try {
                        return JSON.stringify(JSON.parse(event.payload), null, 2);
                      } catch {
                        return event.payload;
                      }
                    })()}
                  </pre>
                </details>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ApiLogEntry } from '@/types/api-log';

export function ApiLogs() {
  const [logs, setLogs] = useState<ApiLogEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(false);

  const fetchLogs = async () => {
    try {
      const response = await fetch('/api/logs');
      if (response.ok) {
        const data = await response.json();
        setLogs(data.logs || []);
      }
    } catch (error) {
      console.error('Failed to fetch logs:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const clearLogs = async () => {
    try {
      const response = await fetch('/api/logs', { method: 'DELETE' });
      if (response.ok) {
        setLogs([]);
      }
    } catch (error) {
      console.error('Failed to clear logs:', error);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  useEffect(() => {
    if (autoRefresh) {
      const interval = setInterval(fetchLogs, 2000); // Refresh every 2 seconds
      return () => clearInterval(interval);
    }
  }, [autoRefresh]);

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'shipment-promise':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'create-delivery':
        return 'bg-green-100 text-green-800 border-green-300';
      case 'list-deliveries':
        return 'bg-purple-100 text-purple-800 border-purple-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getStatusColor = (status: number) => {
    if (status >= 200 && status < 300) {
      return 'text-green-600 font-semibold';
    } else if (status >= 400) {
      return 'text-red-600 font-semibold';
    }
    return 'text-gray-600';
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>API Logs</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-500">Loading logs...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>API Request/Response Logs</CardTitle>
        <CardDescription>
          Beautified logs of all API requests and responses to the Wolt Drive API
        </CardDescription>
        <div className="flex gap-2 mt-4">
          <Button onClick={fetchLogs} variant="outline" size="sm">
            Refresh
          </Button>
          <Button
            onClick={() => setAutoRefresh(!autoRefresh)}
            variant={autoRefresh ? 'default' : 'outline'}
            size="sm"
          >
            {autoRefresh ? '⏸ Stop Auto-Refresh' : '▶ Auto-Refresh'}
          </Button>
          <Button onClick={clearLogs} variant="destructive" size="sm">
            Clear Logs
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {logs.length === 0 ? (
          <p className="text-gray-500 text-center py-8">
            No API logs yet. Make some requests to see them here!
          </p>
        ) : (
          <div className="space-y-4">
            {logs.map((log) => (
              <div
                key={log.id}
                className="border rounded-lg p-4 bg-gray-50 hover:bg-gray-100 transition-colors"
              >
                {/* Header */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-medium border ${getTypeColor(
                        log.type
                      )}`}
                    >
                      {log.type}
                    </span>
                    <span className="text-xs text-gray-500">
                      {new Date(log.timestamp).toLocaleString()}
                    </span>
                    {log.duration !== undefined && (
                      <span className="text-xs text-gray-500">
                        ⏱ {log.duration}ms
                      </span>
                    )}
                  </div>
                  <span className={`text-sm ${getStatusColor(log.response.status)}`}>
                    {log.response.status} {log.response.statusText || ''}
                  </span>
                </div>

                {/* Request */}
                <div className="mb-3">
                  <h4 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                    <span className="text-blue-600">→</span> Request
                  </h4>
                  <div className="bg-white rounded border p-3">
                    <div className="text-xs text-gray-600 mb-2">
                      <span className="font-medium">{log.request.method}</span>{' '}
                      <span className="text-gray-500">{log.request.url}</span>
                    </div>
                    {log.request.body ? (
                      <pre className="text-xs overflow-x-auto bg-gray-50 p-2 rounded">
                        {JSON.stringify(log.request.body, null, 2)}
                      </pre>
                    ) : null}
                  </div>
                </div>

                {/* Response */}
                <div>
                  <h4 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                    <span className="text-green-600">←</span> Response
                  </h4>
                  <div className="bg-white rounded border p-3">
                    {log.response.body ? (
                      <pre className="text-xs overflow-x-auto bg-gray-50 p-2 rounded max-h-96">
                        {JSON.stringify(log.response.body, null, 2)}
                      </pre>
                    ) : null}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

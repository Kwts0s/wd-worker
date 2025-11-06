import { NextResponse } from 'next/server';

// Declare global type for apiLogs
declare global {
  var apiLogs: Array<{
    id: string;
    timestamp: string;
    type: string;
    request: {
      method: string;
      url: string;
      body?: unknown;
    };
    response: {
      status: number;
      body?: unknown;
    };
    duration?: number;
  }>;
}

export async function GET() {
  try {
    // Return logs from global storage
    const logs = globalThis.apiLogs || [];
    
    return NextResponse.json({
      logs: logs,
      count: logs.length,
    });
  } catch (error) {
    console.error('Error fetching logs:', error);
    return NextResponse.json(
      { error: 'Failed to fetch logs' },
      { status: 500 }
    );
  }
}

export async function DELETE() {
  try {
    // Clear logs
    globalThis.apiLogs = [];
    
    return NextResponse.json({
      message: 'Logs cleared successfully',
    });
  } catch (error) {
    console.error('Error clearing logs:', error);
    return NextResponse.json(
      { error: 'Failed to clear logs' },
      { status: 500 }
    );
  }
}

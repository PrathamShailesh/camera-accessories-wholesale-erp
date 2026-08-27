import { NextRequest } from 'next/server';
import { eventsEmitter, SystemEventPayload } from '@/lib/events-emitter';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  const entityId = req.nextUrl.searchParams.get('id');

  const encoder = new TextEncoder();

  let listener: ((event: SystemEventPayload) => void) | null = null;
  let heartbeatTimer: NodeJS.Timeout | null = null;

  const stream = new ReadableStream({
    start(controller) {
      // 1. Send initial connection confirmation
      const initMessage = `data: ${JSON.stringify({ type: 'CONNECTED', timestamp: new Date().toISOString() })}\n\n`;
      controller.enqueue(encoder.encode(initMessage));

      // 2. Define listener
      listener = (event: SystemEventPayload) => {
        try {
          if (!entityId || event.id === entityId || !event.id) {
            const dataStr = `data: ${JSON.stringify(event)}\n\n`;
            controller.enqueue(encoder.encode(dataStr));
          }
        } catch {
          // Stream might be closed
        }
      };

      eventsEmitter.on('system-event', listener);

      // 3. Heartbeat to keep connection alive across proxies
      heartbeatTimer = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(': heartbeat\n\n'));
        } catch {
          if (heartbeatTimer) clearInterval(heartbeatTimer);
        }
      }, 15000);
    },
    cancel() {
      if (listener) {
        eventsEmitter.off('system-event', listener);
      }
      if (heartbeatTimer) {
        clearInterval(heartbeatTimer);
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  });
}

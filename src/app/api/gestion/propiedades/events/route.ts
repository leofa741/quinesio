// app/api/gestion/propiedades/events/route.ts
import { NextRequest } from 'next/server';
import { authOptions } from '@/app/lib/auth';
import { getServerSession } from 'next-auth';
import { propertiesEmitter } from '../events/propertiesNotifier';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user || !['admin', 'superadmin', 'agente'].includes(session.user.role)) {
    return new Response('Acceso denegado', { status: 403 });
  }

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    start(controller) {
      // Keep-alive ping cada 30s
      const ping = setInterval(() => {
        controller.enqueue(encoder.encode('data: ping\n\n'));
      }, 30000);

      // Listener de eventos
      const onEvent = (data: string) => {
        controller.enqueue(encoder.encode(`data: ${data}\n\n`));
      };
      propertiesEmitter.on('property-event', onEvent);

      // Cleanup
      req.signal.addEventListener('abort', () => {
        clearInterval(ping);
        propertiesEmitter.off('property-event', onEvent);
        controller.close();
      });
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
    },
  });
}
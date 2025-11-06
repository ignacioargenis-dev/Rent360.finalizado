import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { logger } from '@/lib/logger-minimal';

// Pusher server - loaded conditionally
let PusherServer: any = null;

const loadPusherServer = () => {
  if (PusherServer) {
    return PusherServer;
  }

  try {
    // Try to require pusher (will fail if not installed)
    // Use eval to avoid webpack static analysis
    PusherServer = (global as any).require('pusher');
    return PusherServer;
  } catch (error) {
    logger.warn('Pusher server not available:', error);
    return null;
  }
};

/**
 * POST /api/pusher/auth
 * Endpoint de autenticación para canales privados de Pusher
 */
export async function POST(request: NextRequest) {
  try {
    // Verificar que Pusher esté disponible
    const PusherServer = loadPusherServer();
    if (!PusherServer) {
      logger.error('Pusher server not available');
      return NextResponse.json({ error: 'Pusher not configured' }, { status: 503 });
    }

    // Verificar que las variables de entorno estén configuradas
    if (!process.env.PUSHER_APP_ID || !process.env.PUSHER_KEY || !process.env.PUSHER_SECRET) {
      logger.error('Pusher environment variables not configured');
      return NextResponse.json({ error: 'Pusher not configured' }, { status: 503 });
    }

    // Autenticar al usuario
    const user = await requireAuth(request);
    if (!user) {
      logger.warn('Unauthorized Pusher auth attempt');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Obtener datos del request
    const { socket_id, channel_name } = await request.json();

    logger.info('🔐 [PUSHER] Auth request', {
      userId: user.id,
      socketId: socket_id,
      channelName: channel_name,
    });

    // Verificar que sea un canal privado de usuario
    if (!channel_name.startsWith('private-user')) {
      logger.warn('Invalid channel name for Pusher auth:', channel_name);
      return NextResponse.json({ error: 'Invalid channel' }, { status: 403 });
    }

    // Crear instancia de Pusher server
    const pusher = new PusherServer({
      appId: process.env.PUSHER_APP_ID,
      key: process.env.PUSHER_KEY,
      secret: process.env.PUSHER_SECRET,
      cluster: process.env.PUSHER_CLUSTER || 'us2',
      encrypted: true,
    });

    // Generar respuesta de autenticación
    const authResponse = pusher.authenticate(socket_id, channel_name, {
      user_id: user.id,
      user_info: {
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });

    logger.info('✅ [PUSHER] Auth successful', {
      userId: user.id,
      channelName: channel_name,
    });

    return NextResponse.json(authResponse);
  } catch (error) {
    logger.error('❌ [PUSHER] Auth error:', error);
    return NextResponse.json({ error: 'Authentication failed' }, { status: 500 });
  }
}

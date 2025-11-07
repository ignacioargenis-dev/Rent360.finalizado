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
    // Import pusher server library
    PusherServer = require('pusher');
    logger.info('✅ Pusher server library loaded successfully');
    return PusherServer;
  } catch (error) {
    logger.error('❌ Failed to load Pusher server library:', {
      error: error instanceof Error ? error.message : String(error),
      errorName: error instanceof Error ? error.name : 'Unknown',
    });
    return null;
  }
};

/**
 * POST /api/pusher/auth
 * Endpoint de autenticación para canales privados de Pusher
 */
export async function POST(request: NextRequest) {
  try {
    logger.info('🔐 [PUSHER AUTH] Starting auth request');

    // Verificar que Pusher esté disponible
    const PusherServer = loadPusherServer();
    if (!PusherServer) {
      logger.error('❌ Pusher server not available');
      return NextResponse.json({ error: 'Pusher not configured' }, { status: 503 });
    }

    logger.info('✅ Pusher server loaded');

    // Verificar que las variables de entorno estén configuradas
    const appId = process.env.PUSHER_APP_ID;
    const key = process.env.PUSHER_KEY;
    const secret = process.env.PUSHER_SECRET;
    const cluster = process.env.PUSHER_CLUSTER;

    logger.info('🔍 [PUSHER ENV CHECK]', {
      hasAppId: !!appId,
      hasKey: !!key,
      hasSecret: !!secret,
      hasCluster: !!cluster,
      appIdLength: appId?.length,
      keyLength: key?.length,
      secretLength: secret?.length,
    });

    if (!appId || !key || !secret) {
      logger.error('❌ Pusher environment variables not configured', {
        hasAppId: !!appId,
        hasKey: !!key,
        hasSecret: !!secret,
      });
      return NextResponse.json({ error: 'Pusher not configured' }, { status: 503 });
    }

    // Autenticar al usuario - verificar si hay token en query params
    const url = new URL(request.url);
    const tokenFromQuery = url.searchParams.get('token');

    if (tokenFromQuery) {
      logger.info('🔑 Token received from query params, setting authorization header');
      // Modificar los headers del request actual
      (request as any).headers.set('authorization', `Bearer ${tokenFromQuery}`);
    }

    const user = await requireAuth(request);
    if (!user) {
      logger.warn('Unauthorized Pusher auth attempt');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Obtener datos del request - pueden venir como JSON, form data o query params
    let socket_id: string;
    let channel_name: string;

    logger.info('🔍 [PUSHER] Request details:', {
      method: request.method,
      contentType: request.headers.get('content-type'),
      url: request.url,
      hasBody: !!request.body,
    });

    try {
      // Intentar primero como JSON (caso normal)
      const jsonData = await request.json();
      socket_id = jsonData.socket_id;
      channel_name = jsonData.channel_name;
      logger.info('📨 Auth data received as JSON');
    } catch (jsonError) {
      logger.info('📨 JSON parsing failed, trying other methods');

      // Intentar como form data
      try {
        const formData = await request.formData();
        socket_id = formData.get('socket_id') as string;
        channel_name = formData.get('channel_name') as string;
        if (socket_id && channel_name) {
          logger.info('📨 Auth data received as Form Data');
        }
      } catch (formError) {
        // Finalmente, intentar como query parameters
        logger.info('📨 Form data parsing failed, trying query params');
        socket_id = url.searchParams.get('socket_id')!;
        channel_name = url.searchParams.get('channel_name')!;
        if (socket_id && channel_name) {
          logger.info('📨 Auth data received as Query Params');
        }
      }
    }

    if (!socket_id || !channel_name) {
      logger.error('❌ Missing socket_id or channel_name', { socket_id, channel_name });
      return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
    }

    logger.info('🔐 [PUSHER] Auth request received', {
      userId: user.id,
      socketId: socket_id,
      channelName: channel_name,
    });

    // Verificar que sea un canal privado de usuario
    if (!channel_name.startsWith('private-user')) {
      logger.warn('❌ Invalid channel name for Pusher auth:', channel_name);
      return NextResponse.json({ error: 'Invalid channel' }, { status: 403 });
    }

    logger.info('✅ Channel validation passed');

    try {
      // Crear instancia de Pusher server
      logger.info('🏗️ Creating Pusher server instance', {
        appId: appId.substring(0, 6) + '...',
        cluster: cluster || 'us2',
      });

      const pusher = new PusherServer({
        appId: appId,
        key: key,
        secret: secret,
        cluster: cluster || 'us2',
        encrypted: true,
      });

      logger.info('✅ Pusher server instance created');

      // Generar respuesta de autenticación
      logger.info('🔑 Generating auth response...');

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
        authResponseKeys: Object.keys(authResponse),
      });

      return NextResponse.json(authResponse);
    } catch (pusherError) {
      logger.error('❌ Pusher authentication error', {
        error: pusherError instanceof Error ? pusherError.message : String(pusherError),
        userId: user.id,
        socketId: socket_id,
        channelName: channel_name,
      });
      return NextResponse.json({ error: 'Pusher authentication failed' }, { status: 500 });
    }
  } catch (error) {
    logger.error('❌ [PUSHER] Auth error:', {
      error: error instanceof Error ? error.message : String(error),
      errorName: error instanceof Error ? error.name : 'Unknown',
      stack: error instanceof Error ? error.stack : undefined,
    });
    return NextResponse.json({ error: 'Authentication failed' }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { logger } from '@/lib/logger-minimal';

/**
 * GET /api/ws-token
 * Devuelve el token JWT para autenticación WebSocket
 * Este endpoint es necesario porque las cookies de auth son httpOnly
 */
export async function GET(request: NextRequest) {
  try {
    // Verificar autenticación del usuario
    const user = await requireAuth(request);

    if (!user) {
      return NextResponse.json({ success: false, error: 'No autenticado' }, { status: 401 });
    }

    // Obtener el token de la cookie (ya verificado por requireAuth)
    const token = request.cookies.get('auth-token')?.value;

    if (!token) {
      return NextResponse.json({ success: false, error: 'Token no encontrado' }, { status: 401 });
    }

    logger.info('🔑 [WS-TOKEN] Token proporcionado para WebSocket', {
      userId: user.id,
      userRole: user.role,
      tokenLength: token.length,
    });

    return NextResponse.json({
      success: true,
      token: token,
      user: {
        id: user.id,
        role: user.role,
      },
    });
  } catch (error) {
    logger.error('❌ [WS-TOKEN] Error obteniendo token para WebSocket', { error });

    return NextResponse.json(
      {
        success: false,
        error: 'Error interno del servidor',
      },
      { status: 500 }
    );
  }
}

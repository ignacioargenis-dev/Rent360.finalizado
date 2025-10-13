import { logger } from '@/lib/logger-minimal';
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifyRefreshToken, generateTokens, setAuthCookies } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const refreshToken = verifyRefreshToken(request);
    
    if (!refreshToken) {
      return NextResponse.json(
        { error: 'Refresh token inválido o expirado' },
        { status: 401 },
      );
    }

    // Buscar usuario en la base de datos
    const user = await db.user.findUnique({
      where: { id: refreshToken.id },
    });

    if (!user || !user.isActive) {
      return NextResponse.json(
        { error: 'Usuario no encontrado o inactivo' },
        { status: 401 },
      );
    }

    // Generar nuevos tokens
    const { accessToken, refreshToken: newRefreshToken } = generateTokens(
      user.id,
      user.email,
      user.role.toLowerCase(),
      user.name,
    );

    // Crear respuesta con cookies
    const response = NextResponse.json({
      message: 'Tokens renovados exitosamente',
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role.toLowerCase(),
        avatar: user.avatar,
      },
    });

    // Establecer cookies HTTP-only
    setAuthCookies(response, accessToken, newRefreshToken);

    return response;
  } catch (error) {
    logger.error('Error en refresh token:', { error: error instanceof Error ? error.message : String(error) });
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 },
    );
  }
}

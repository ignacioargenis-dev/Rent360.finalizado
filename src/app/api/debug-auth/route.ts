import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { logger } from '@/lib/logger';

export async function GET(request: NextRequest) {
  try {
    logger.info('🔍 Debug Auth: Iniciando diagnóstico de autenticación', {
      context: 'debug-auth',
      method: 'GET',
      userAgent: request.headers.get('user-agent'),
      origin: request.headers.get('origin'),
      host: request.headers.get('host'),
    });

    // Verificar cookies presentes
    const cookies = request.cookies;
    const allCookies = cookies.getAll();

    const authToken = cookies.get('auth-token')?.value;
    const refreshToken = cookies.get('refresh-token')?.value;

    logger.info('🔍 Debug Auth: Cookies analizadas', {
      context: 'debug-auth',
      totalCookies: allCookies.length,
      cookieNames: allCookies.map(c => c.name),
      hasAuthToken: !!authToken,
      hasRefreshToken: !!refreshToken,
      authTokenLength: authToken?.length || 0,
      refreshTokenLength: refreshToken?.length || 0,
    });

    // Intentar verificar autenticación
    let authResult = null;
    let authError = null;

    try {
      authResult = await requireAuth(request);
      logger.info('🔍 Debug Auth: Autenticación exitosa', {
        context: 'debug-auth',
        userId: authResult.id,
        userEmail: authResult.email,
        userRole: authResult.role,
      });
    } catch (error) {
      authError = error instanceof Error ? error.message : String(error);
      logger.warn('🔍 Debug Auth: Falló autenticación', {
        context: 'debug-auth',
        error: authError,
      });
    }

    // Verificar headers de seguridad
    const origin = request.headers.get('origin');
    const referer = request.headers.get('referer');
    const userAgent = request.headers.get('user-agent');

    // Respuesta de diagnóstico
    const diagnostic = {
      timestamp: new Date().toISOString(),
      success: !!authResult,
      authenticated: !!authResult,
      cookies: {
        total: allCookies.length,
        names: allCookies.map(c => ({ name: c.name, hasValue: !!c.value })),
        authToken: {
          present: !!authToken,
          length: authToken?.length || 0,
          preview: authToken ? `${authToken.substring(0, 20)}...` : null,
        },
        refreshToken: {
          present: !!refreshToken,
          length: refreshToken?.length || 0,
          preview: refreshToken ? `${refreshToken.substring(0, 20)}...` : null,
        },
      },
      authentication: authResult
        ? {
            userId: authResult.id,
            email: authResult.email,
            role: authResult.role,
          }
        : null,
      error: authError,
      request: {
        origin,
        referer,
        userAgent: userAgent?.substring(0, 100),
        method: request.method,
        url: request.url,
      },
      environment: {
        nodeEnv: process.env.NODE_ENV,
        hasJwtSecret: !!process.env.JWT_SECRET,
        hasRefreshSecret: !!process.env.JWT_REFRESH_SECRET,
      },
    };

    logger.info('🔍 Debug Auth: Diagnóstico completado', {
      context: 'debug-auth',
      success: diagnostic.success,
      authenticated: diagnostic.authenticated,
      error: authError,
    });

    return NextResponse.json(diagnostic, {
      status: authResult ? 200 : 401,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Access-Control-Allow-Origin': origin || '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Credentials': 'true',
      },
    });
  } catch (error) {
    logger.error('🔍 Debug Auth: Error interno', {
      context: 'debug-auth',
      error: error instanceof Error ? error.message : String(error),
    });

    return NextResponse.json(
      {
        success: false,
        error: 'Error interno del servidor',
        details: error instanceof Error ? error.message : String(error),
        timestamp: new Date().toISOString(),
      },
      {
        status: 500,
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
        },
      }
    );
  }
}

export async function OPTIONS(request: NextRequest) {
  const origin = request.headers.get('origin');

  return NextResponse.json(
    {},
    {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': origin || '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Credentials': 'true',
      },
    }
  );
}

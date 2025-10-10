import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { logger } from '@/lib/logger';

export async function GET(request: NextRequest) {
  try {
    logger.info('Test auth endpoint called');

    // Verificar si hay token en las cookies
    const token = request.cookies.get('auth-token')?.value;
    logger.info('Auth token check', { tokenPresent: !!token });

    if (!token) {
      return NextResponse.json(
        {
          authenticated: false,
          error: 'No auth token found',
          cookies: Object.fromEntries(
            request.cookies.getAll().map(c => [c.name, c.value.substring(0, 20) + '...'])
          ),
        },
        { status: 401 }
      );
    }

    // Intentar autenticar
    const user = await requireAuth(request);

    logger.info('User authenticated successfully:', {
      id: user.id,
      email: user.email,
      role: user.role,
    });

    return NextResponse.json({
      authenticated: true,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    logger.error('Auth test failed:', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });

    return NextResponse.json(
      {
        authenticated: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        hasToken: !!request.cookies.get('auth-token')?.value,
      },
      { status: 401 }
    );
  }
}

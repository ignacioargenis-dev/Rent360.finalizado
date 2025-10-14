import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    // Obtener información del usuario autenticado
    const user = await requireAuth(request);

    // Obtener el token raw para comparar
    const token = request.cookies.get('auth-token')?.value;

    return NextResponse.json({
      success: true,
      debug: {
        userFromRequireAuth: {
          id: user.id,
          email: user.email,
          role: user.role,
          roleType: typeof user.role,
          roleLength: user.role?.length,
        },
        cookies: {
          hasAuthToken: !!token,
          tokenPreview: token ? `${token.substring(0, 20)}...` : null,
        },
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : String(error),
        timestamp: new Date().toISOString(),
      },
      { status: 401 }
    );
  }
}

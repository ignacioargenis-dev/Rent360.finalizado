import { NextRequest, NextResponse } from 'next/server';
import * as jwt from 'jsonwebtoken';

export async function GET(request: NextRequest) {
  try {
    // Buscar token en múltiples fuentes
    let token = request.cookies.get('auth-token')?.value ||
               request.cookies.get('next-auth.session-token')?.value ||
               request.headers.get('authorization')?.replace('Bearer ', '');

    // Si no hay token, devolver error de no autorizado
    if (!token) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }

    // Verificar que JWT_SECRET esté configurado
    if (!process.env.JWT_SECRET) {
      return NextResponse.json(
        { error: 'Configuración de autenticación incompleta' },
        { status: 500 }
      );
    }

    // Verificar token JWT
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET) as any;
    } catch (jwtError) {
      return NextResponse.json(
        { error: 'Token inválido o expirado' },
        { status: 401 }
      );
    }

    // Verificar que el usuario existe y tiene datos válidos
    if (!decoded || !decoded.id || !decoded.role) {
      // Token JWT no contiene datos de usuario válidos
      return NextResponse.json(
        { error: 'Token inválido' },
        { status: 401 }
      );
    }

    // Devolver información del usuario autenticado
    return NextResponse.json({
      user: {
        id: decoded.id,
        email: decoded.email,
        name: decoded.name,
        role: decoded.role,
        avatar: decoded.avatar,
        rut: decoded.rut,
        rutVerified: decoded.rutVerified,
        isActive: decoded.isActive,
        emailVerified: decoded.emailVerified,
        phoneVerified: decoded.phoneVerified,
        createdAt: decoded.createdAt,
        updatedAt: new Date().toISOString(),
      }
    });

  } catch (error) {
    return NextResponse.json(
      {
        error: 'Error interno del servidor',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}

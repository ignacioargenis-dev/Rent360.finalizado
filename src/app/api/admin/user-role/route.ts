import { NextRequest, NextResponse } from 'next/server';
import * as jwt from 'jsonwebtoken';

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('auth-token')?.value;

    if (!token || !process.env.JWT_SECRET) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET) as any;

    return NextResponse.json({
      user: {
        id: decoded.id,
        role: decoded.role,
        name: decoded.name,
        email: decoded.email,
      }
    });

  } catch (error) {
    // Error verificando rol de usuario
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get('auth-token')?.value;

    if (!token || !process.env.JWT_SECRET) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { role } = body;

    if (!role || !['ADMIN', 'TENANT', 'OWNER', 'BROKER', 'PROVIDER', 'MAINTENANCE', 'RUNNER', 'SUPPORT'].includes(role.toUpperCase())) {
      return NextResponse.json(
        { error: 'Rol inválido' },
        { status: 400 }
      );
    }

    // Verificar token actual
    const decoded = jwt.verify(token, process.env.JWT_SECRET) as any;

    // Crear nuevo token con el rol corregido
    const newToken = jwt.sign(
      {
        id: decoded.id,
        email: decoded.email,
        name: decoded.name,
        role: role.toUpperCase(),
        createdAt: decoded.createdAt,
      },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Crear response con nueva cookie
    const response = NextResponse.json({
      success: true,
      message: 'Rol actualizado correctamente',
      user: {
        id: decoded.id,
        role: role,
        name: decoded.name,
        email: decoded.email,
      }
    });

    // Configurar nueva cookie
    response.cookies.set('auth-token', newToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60, // 7 días
      path: '/',
    });

    return response;

  } catch (error) {
    // Error actualizando rol de usuario
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

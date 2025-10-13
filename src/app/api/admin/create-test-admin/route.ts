import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger-edge-runtime';
import * as bcrypt from 'bcryptjs';

export async function POST(request: NextRequest) {
  try {
    // Solo permitir en desarrollo o para testing
    if (process.env.NODE_ENV === 'production') {
      return NextResponse.json(
        { error: 'Este endpoint solo está disponible en desarrollo' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { email, password, name } = body;

    if (!email || !password || !name) {
      return NextResponse.json(
        { error: 'Email, password y name son requeridos' },
        { status: 400 }
      );
    }

    // Verificar que el email sea válido para admin
    if (!email.includes('admin')) {
      return NextResponse.json(
        { error: 'El email debe contener "admin" para crear un usuario administrador' },
        { status: 400 }
      );
    }

    // Hash del password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Datos del usuario admin de prueba
    const adminUser = {
      id: 'test-admin-' + Date.now(),
      email,
      name,
      role: 'admin',
      password: hashedPassword,
      isActive: true,
      emailVerified: true,
      rutVerified: false,
      phoneVerified: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    logger.info('Usuario admin de prueba creado:', { userId: adminUser.id, email: adminUser.email });

    return NextResponse.json({
      success: true,
      message: 'Usuario admin de prueba creado exitosamente',
      user: {
        id: adminUser.id,
        email: adminUser.email,
        name: adminUser.name,
        role: adminUser.role,
        isActive: adminUser.isActive,
      }
    });

  } catch (error) {
    logger.error('Error creando usuario admin de prueba:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

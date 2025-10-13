import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { db } from '@/lib/db';
import { logger } from '@/lib/logger-minimal';

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request);

    if (!user?.id) {
      logger.error('Usuario no encontrado en requireAuth');
      return NextResponse.json(
        { error: 'Usuario no autenticado' },
        { status: 401 }
      );
    }

    // Verificar conexión a la base de datos
    try {
      await db.$connect();
    } catch (dbError) {
      logger.error('Error conectando a la base de datos:', { error: dbError });
      return NextResponse.json(
        { error: 'Error de conexión a la base de datos' },
        { status: 500 }
      );
    }

    // Obtener el perfil del usuario desde la base de datos
    const userProfile = await db.user.findUnique({
      where: { id: user.id },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        avatar: true,
        rut: true,
        rutVerified: true,
        dateOfBirth: true,
        gender: true,
        address: true,
        city: true,
        commune: true,
        region: true,
        phoneSecondary: true,
        emergencyContact: true,
        emergencyPhone: true,
        isActive: true,
        emailVerified: true,
        phoneVerified: true,
        lastLogin: true,
        createdAt: true,
        updatedAt: true,
      }
    });

    if (!userProfile) {
      return NextResponse.json(
        { error: 'Usuario no encontrado' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      user: userProfile
    });

  } catch (error) {
    logger.error('Error obteniendo perfil de usuario:', { error: error instanceof Error ? error.message : String(error) });

    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const user = await requireAuth(request);

    const body = await request.json();
    const { name, phone, avatar, address, city, commune, region, phoneSecondary, emergencyContact, emergencyPhone } = body;

    // Actualizar el perfil del usuario
    const updatedUser = await db.user.update({
      where: { id: user.id },
      data: {
        ...(name && { name }),
        ...(phone && { phone }),
        ...(avatar && { avatar }),
        ...(address !== undefined && { address }),
        ...(city !== undefined && { city }),
        ...(commune !== undefined && { commune }),
        ...(region !== undefined && { region }),
        ...(phoneSecondary !== undefined && { phoneSecondary }),
        ...(emergencyContact !== undefined && { emergencyContact }),
        ...(emergencyPhone !== undefined && { emergencyPhone }),
        updatedAt: new Date()
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        avatar: true,
        address: true,
        city: true,
        commune: true,
        region: true,
        phoneSecondary: true,
        emergencyContact: true,
        emergencyPhone: true,
        updatedAt: true
      }
    });

    logger.info('Perfil de usuario actualizado:', { userId: user.id });

    return NextResponse.json({
      success: true,
      user: updatedUser,
      message: 'Perfil actualizado correctamente'
    });

  } catch (error) {
    logger.error('Error actualizando perfil de usuario:', { error: error instanceof Error ? error.message : String(error) });

    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

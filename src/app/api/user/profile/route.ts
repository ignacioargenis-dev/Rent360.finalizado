import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { db } from '@/lib/db';
import { logger } from '@/lib/logger';

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request);

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
        createdAt: true,
        updatedAt: true,
        // Información adicional según el rol
        tenant: {
          select: {
            id: true,
            documentNumber: true,
            documentType: true,
          }
        },
        owner: {
          select: {
            id: true,
            businessName: true,
          }
        },
        broker: {
          select: {
            id: true,
            licenseNumber: true,
          }
        },
        provider: {
          select: {
            id: true,
            serviceType: true,
            licenseNumber: true,
          }
        },
        runner: {
          select: {
            id: true,
            vehicleType: true,
            licensePlate: true,
          }
        }
      }
    });

    if (!user) {
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
    const { name, phone, avatar } = body;

    // Actualizar el perfil del usuario
    const updatedUser = await db.user.update({
      where: { id: user.id },
      data: {
        ...(name && { name }),
        ...(phone && { phone }),
        ...(avatar && { avatar }),
        updatedAt: new Date()
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        avatar: true,
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

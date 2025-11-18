import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { logger } from '@/lib/logger-minimal';
import { requireAuth } from '@/lib/auth';

// Forzar renderizado dinámico
export const dynamic = 'force-dynamic';

/**
 * GET /api/users/[id]
 * Obtiene información completa de un usuario por ID
 * Requiere autenticación y rol ADMIN
 */
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    // Verificar autenticación y permisos
    const currentUser = await requireAuth(request);

    // Solo admins pueden ver detalles completos de usuarios
    if (currentUser.role !== 'ADMIN') {
      return NextResponse.json(
        {
          success: false,
          error: 'No autorizado. Solo administradores pueden ver detalles de usuarios.',
        },
        { status: 403 }
      );
    }

    const userId = params.id;

    const user = await db.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        avatar: true,
        bio: true,
        address: true,
        isActive: true,
        emailVerified: true,
        rutVerified: true,
        createdAt: true,
        updatedAt: true,
        lastLogin: true,
        maintenanceProvider: {
          select: {
            id: true,
            businessName: true,
            specialty: true,
            status: true,
            isVerified: true,
            documents: true,
          },
        },
        serviceProvider: {
          select: {
            id: true,
            businessName: true,
            serviceType: true,
            status: true,
            isVerified: true,
            documents: true,
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          error: 'Usuario no encontrado',
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      user,
    });
  } catch (error) {
    logger.error('Error obteniendo usuario:', {
      error: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json(
      {
        success: false,
        error: 'Error interno del servidor',
      },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { db } from '@/lib/db';
import { logger } from '@/lib/logger-minimal';
import { handleApiError } from '@/lib/api-error-handler';

// Forzar renderizado dinámico
export const dynamic = 'force-dynamic';

export async function DELETE(request: NextRequest) {
  try {
    const user = await requireAuth(request);

    // Solo administradores pueden eliminar usuarios
    if (user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Acceso denegado. Solo administradores pueden eliminar usuarios.' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email');

    if (!email) {
      return NextResponse.json({ error: 'Se requiere el parámetro email' }, { status: 400 });
    }

    logger.info('Eliminando usuario', { email, deletedBy: user.id });

    // Buscar el usuario
    const userToDelete = await db.user.findUnique({
      where: { email },
      include: {
        serviceProvider: true,
        maintenanceProvider: true,
      },
    });

    if (!userToDelete) {
      return NextResponse.json(
        { error: `No se encontró usuario con email: ${email}` },
        { status: 404 }
      );
    }

    // Eliminar el usuario (esto eliminará automáticamente los perfiles relacionados por cascade)
    await db.user.delete({
      where: { email },
    });

    logger.info('Usuario eliminado exitosamente', {
      email,
      userId: userToDelete.id,
      role: userToDelete.role,
      deletedBy: user.id,
    });

    return NextResponse.json({
      success: true,
      message: `Usuario ${email} eliminado exitosamente`,
      deletedUser: {
        id: userToDelete.id,
        name: userToDelete.name,
        email: userToDelete.email,
        role: userToDelete.role,
      },
    });
  } catch (error) {
    logger.error('Error eliminando usuario:', {
      error: error instanceof Error ? error.message : String(error),
    });
    const errorResponse = handleApiError(error);
    return errorResponse;
  }
}

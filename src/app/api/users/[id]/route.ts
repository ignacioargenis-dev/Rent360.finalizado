import { logger } from '@/lib/logger';
import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, requireRole } from '@/lib/auth';
import { db } from '@/lib/db';

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await requireAuth(request);
    const userId = params.id;

    // Solo admin puede ver otros usuarios, los usuarios solo pueden verse a sí mismos
    if (user.role !== 'admin' && user.id !== userId) {
      return NextResponse.json(
        { error: 'No tienes permisos para ver este usuario' },
        { status: 403 }
      );
    }

    const targetUser = await db.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        phone: true,
        avatar: true,
        isActive: true,
        emailVerified: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!targetUser) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });
    }

    return NextResponse.json({ user: targetUser });
  } catch (error) {
    logger.error('Error al obtener usuario:', {
      error: error instanceof Error ? error.message : String(error),
    });
    if (error instanceof Error && error.message.includes('No autorizado')) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await requireAuth(request);
    const userId = params.id;

    // Verificar permisos
    if (user.role !== 'admin' && user.id !== userId) {
      return NextResponse.json(
        { error: 'No tienes permisos para actualizar este usuario' },
        { status: 403 }
      );
    }

    const data = await request.json();
    const { name, email, isActive } = data;

    // Verificar si el usuario existe
    const existingUser = await db.user.findUnique({
      where: { id: userId },
      select: { id: true },
    });

    if (!existingUser) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });
    }

    // Preparar datos de actualización
    const updateData: any = {};
    if (name !== undefined) {
      updateData.name = name;
    }
    if (email !== undefined) {
      updateData.email = email;
    }
    if (isActive !== undefined) {
      updateData.isActive = isActive;
    }

    // Actualizar usuario
    const updatedUser = await db.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        phone: true,
        avatar: true,
        isActive: true,
        emailVerified: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return NextResponse.json({
      message: 'Usuario actualizado exitosamente',
      user: updatedUser,
    });
  } catch (error) {
    logger.error('Error al actualizar usuario:', {
      error: error instanceof Error ? error.message : String(error),
    });
    if (error instanceof Error && error.message.includes('No autorizado')) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await requireRole(request, 'admin');
    const userId = params.id;

    const data = await request.json();

    // Verificar si el usuario existe
    const targetUser = await db.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true },
    });

    if (!targetUser) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });
    }

    // No permitir modificar al propio usuario admin
    if (user.id === userId) {
      return NextResponse.json({ error: 'No puedes modificar tu propio usuario' }, { status: 400 });
    }

    // Preparar datos de actualización
    const updateData: any = {};
    if (data.name !== undefined) {
      updateData.name = data.name;
    }
    if (data.email !== undefined) {
      updateData.email = data.email;
    }
    if (data.role !== undefined) {
      updateData.role = data.role;
    }
    if (data.isActive !== undefined) {
      updateData.isActive = data.isActive;
    }

    // Actualizar usuario
    const updatedUser = await db.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        phone: true,
        avatar: true,
        isActive: true,
        emailVerified: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return NextResponse.json({
      message: 'Usuario actualizado exitosamente',
      user: updatedUser,
    });
  } catch (error) {
    logger.error('Error al actualizar usuario:', {
      error: error instanceof Error ? error.message : String(error),
    });
    if (error instanceof Error && error.message.includes('No autorizado')) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    logger.info('Iniciando eliminación de usuario', { params });

    const user = await requireRole(request, 'admin');
    const userId = params.id;

    logger.info('Usuario autenticado', {
      userId: user.id,
      userRole: user.role,
      targetUserId: userId,
    });

    // Verificar si el usuario existe
    const targetUser = await db.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true, role: true, isActive: true },
    });

    if (!targetUser) {
      logger.warn('Usuario no encontrado para eliminación', { userId });
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });
    }

    logger.info('Usuario objetivo encontrado', {
      targetUserId: targetUser.id,
      targetUserRole: targetUser.role,
      targetUserActive: targetUser.isActive,
    });

    // No permitir eliminar al propio usuario admin
    if (user.id === userId) {
      logger.warn('Intento de auto-eliminación', { userId: user.id });
      return NextResponse.json({ error: 'No puedes eliminar tu propio usuario' }, { status: 400 });
    }

    // Verificar que no sea el último admin (soft delete)
    if (targetUser.role === 'admin') {
      const adminCount = await db.user.count({
        where: { role: 'admin', isActive: true },
      });

      logger.info('Conteo de admins activos', { adminCount });

      if (adminCount <= 1) {
        logger.warn('Intento de eliminar último admin activo', { adminCount });
        return NextResponse.json(
          { error: 'No se puede eliminar el último administrador activo' },
          { status: 400 }
        );
      }
    }

    // Soft delete - marcar como inactivo en lugar de eliminar
    await db.user.update({
      where: { id: userId },
      data: { isActive: false },
    });

    logger.info('Usuario eliminado (soft delete)', {
      adminId: user.id,
      deletedUserId: userId,
      deletedUserRole: targetUser.role,
    });

    return NextResponse.json({
      message: 'Usuario eliminado exitosamente',
    });
  } catch (error) {
    logger.error('Error al eliminar usuario:', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      params,
    });

    if (error instanceof Error) {
      if (error.message.includes('No autorizado')) {
        return NextResponse.json({ error: error.message }, { status: 401 });
      }
      if (error.message.includes('Acceso denegado')) {
        return NextResponse.json({ error: error.message }, { status: 403 });
      }
    }

    return NextResponse.json(
      {
        error: 'Error interno del servidor',
        details: error instanceof Error ? error.message : 'Error desconocido',
      },
      { status: 500 }
    );
  }
}

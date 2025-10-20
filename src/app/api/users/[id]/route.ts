import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { db } from '@/lib/db';
import { handleApiError } from '@/lib/api-error-handler';
import { logger } from '@/lib/logger-minimal';

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await requireAuth(request);
    const userId = params.id;

    // Buscar el usuario
    const targetUser = await db.user.findUnique({
      where: { id: userId },
      include: {
        properties: {
          select: {
            id: true,
            title: true,
            status: true,
            price: true,
            city: true,
            commune: true,
          },
        },
      },
    });

    if (!targetUser) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });
    }

    // Verificar permisos - solo admin puede ver perfiles de otros usuarios
    if (user.role !== 'ADMIN' && user.id !== userId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    // Formatear respuesta (excluir información sensible)
    const formattedUser = {
      id: targetUser.id,
      name: targetUser.name,
      email: targetUser.email,
      avatar: targetUser.avatar,
      bio: targetUser.bio,
      phone: targetUser.phone,
      address: targetUser.address,
      role: targetUser.role,
      rutVerified: targetUser.rutVerified,
      createdAt: targetUser.createdAt,
      updatedAt: targetUser.updatedAt,
      lastLogin: targetUser.lastLogin,
      properties: targetUser.properties,
    };

    return NextResponse.json({ user: formattedUser });
  } catch (error) {
    logger.error('Error fetching user:', {
      error: error instanceof Error ? error.message : String(error),
    });
    const errorResponse = handleApiError(error);
    return errorResponse;
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await requireAuth(request);
    const userId = params.id;
    const body = await request.json();

    // Verificar que el usuario existe
    const existingUser = await db.user.findUnique({
      where: { id: userId },
    });

    if (!existingUser) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });
    }

    // Verificar permisos - solo admin puede ver perfiles de otros usuarios
    if (user.role !== 'ADMIN' && user.id !== userId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    // Actualizar el usuario
    const updatedUser = await db.user.update({
      where: { id: userId },
      data: {
        name: body.name,
        bio: body.bio,
        phone: body.phone,
        address: body.address,
        rutVerified: body.rutVerified !== undefined ? body.rutVerified : existingUser.rutVerified,
        updatedAt: new Date(),
      },
      select: {
        id: true,
        name: true,
        email: true,
        avatar: true,
        bio: true,
        phone: true,
        address: true,
        role: true,
        rutVerified: true,
        createdAt: true,
        updatedAt: true,
        lastLogin: true,
      },
    });

    return NextResponse.json({
      message: 'Usuario actualizado exitosamente',
      user: updatedUser,
    });
  } catch (error) {
    logger.error('Error updating user:', {
      error: error instanceof Error ? error.message : String(error),
    });
    const errorResponse = handleApiError(error);
    return errorResponse;
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await requireAuth(request);
    const userId = params.id;

    // Verificar que el usuario existe
    const existingUser = await db.user.findUnique({
      where: { id: userId },
    });

    if (!existingUser) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });
    }

    // Solo admin puede eliminar usuarios
    if (user.role !== 'ADMIN' && user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    // No permitir eliminar el propio usuario
    if (user.id === userId) {
      return NextResponse.json({ error: 'No puedes eliminar tu propia cuenta' }, { status: 400 });
    }

    // Eliminar el usuario
    await db.user.delete({
      where: { id: userId },
    });

    return NextResponse.json({ message: 'Usuario eliminado exitosamente' });
  } catch (error) {
    logger.error('Error deleting user:', {
      error: error instanceof Error ? error.message : String(error),
    });
    const errorResponse = handleApiError(error);
    return errorResponse;
  }
}

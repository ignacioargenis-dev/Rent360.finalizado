import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, requireRole } from '@/lib/auth';
import { db } from '@/lib/db';
import { logger } from '@/lib/logger-edge-runtime';

export async function POST(request: NextRequest) {
  try {
    // Verificar autenticación y permisos de admin
    const user = await requireAuth(request);
    await requireRole(request, 'ADMIN');

    const body = await request.json();
    const { userId, newRole } = body;

    if (!userId || !newRole) {
      return NextResponse.json(
        { error: 'userId y newRole son requeridos' },
        { status: 400 }
      );
    }

    // Validar que el nuevo rol sea válido
    const validRoles = ['admin', 'tenant', 'owner', 'broker', 'provider', 'maintenance', 'runner', 'support'];
    if (!validRoles.includes(newRole.toLowerCase())) {
      return NextResponse.json(
        { error: 'Rol inválido. Roles válidos: ' + validRoles.join(', ') },
        { status: 400 }
      );
    }

    // Buscar el usuario en la base de datos
    const existingUser = await db.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
      },
    });

    if (!existingUser) {
      return NextResponse.json(
        { error: 'Usuario no encontrado' },
        { status: 404 }
      );
    }

    // Actualizar el rol del usuario
    const updatedUser = await db.user.update({
      where: { id: userId },
      data: {
        role: newRole.toLowerCase(),
        updatedAt: new Date(),
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        updatedAt: true,
      },
    });

    logger.info('Rol de usuario actualizado:', {
      adminId: user.id,
      userId: updatedUser.id,
      oldRole: existingUser.role,
      newRole: updatedUser.role
    });

    return NextResponse.json({
      success: true,
      message: 'Rol de usuario actualizado correctamente',
      user: updatedUser
    });

  } catch (error) {
    logger.error('Error actualizando rol de usuario:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    // Verificar autenticación y permisos de admin
    const user = await requireAuth(request);
    await requireRole(request, 'ADMIN');

    const { searchParams } = new URL(request.url);
    const role = searchParams.get('role');
    const status = searchParams.get('status');

    // Construir filtros
    const where: any = {};
    if (role && role !== 'all') {
      where.role = role.toLowerCase();
    }
    if (status === 'active') {
      where.isActive = true;
    } else if (status === 'inactive') {
      where.isActive = false;
    }

    // Obtener usuarios con problemas de roles
    const users = await db.user.findMany({
      where,
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json({
      success: true,
      users,
      total: users.length
    });

  } catch (error) {
    logger.error('Error obteniendo usuarios para corrección de roles:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

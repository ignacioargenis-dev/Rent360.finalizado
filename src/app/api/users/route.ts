import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, requireRole } from '@/lib/auth';
import { db } from '@/lib/db';
import { UserRole } from '@/types';
import { ValidationError, handleApiError } from '@/lib/api-error-handler';
import { getUsersOptimized, dbOptimizer } from '@/lib/db-optimizer';
import { logger } from '@/lib/logger';
import { z } from 'zod';

// Schema para crear usuario
const createUserSchema = z.object({
  name: z
    .string()
    .min(2, 'El nombre debe tener al menos 2 caracteres')
    .max(100, 'El nombre no puede exceder 100 caracteres'),
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
  role: z.nativeEnum(UserRole),
  phone: z.string().optional(),
  avatar: z.string().url().optional(),
  isActive: z.boolean().default(true),
});

// Schema para actualizar usuario
const updateUserSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  email: z.string().email().optional(),
  role: z.nativeEnum(UserRole).optional(),
  phone: z.string().optional(),
  avatar: z.string().url().optional(),
  isActive: z.boolean().optional(),
});

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request);
    const startTime = Date.now();

    // Obtener parámetros de consulta
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const role = searchParams.get('role');
    const search = searchParams.get('search');
    const isActive = searchParams.get('isActive');
    const sortBy = searchParams.get('sortBy') || 'createdAt';
    const sortOrder = searchParams.get('sortOrder') || 'desc';

    const skip = (page - 1) * limit;

    // Construir where clause optimizado
    const where: any = {};

    if (role) {
      where.role = role as UserRole;
    }

    if (isActive !== null && isActive !== undefined) {
      where.isActive = isActive === 'true';
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Lógica de filtrado por estado de usuario
    // isActive=all: mostrar todos los usuarios
    // isActive=true: mostrar solo activos
    // isActive=false: mostrar solo inactivos
    // No especificado: mostrar solo activos por defecto
    if (isActive === 'true') {
      where.isActive = true;
    } else if (isActive === 'false') {
      where.isActive = false;
    } else if (isActive !== 'all') {
      // Por defecto mostrar solo activos
      where.isActive = true;
    }
    // Si isActive === 'all', no aplicar filtro de isActive

    // Construir orderBy
    const orderBy: any = {};
    orderBy[sortBy] = sortOrder;

    // Usar consulta optimizada con caché
    const result = await getUsersOptimized({
      where,
      skip,
      take: limit,
      orderBy,
    });

    const duration = Date.now() - startTime;

    logger.info('Consulta de usuarios optimizada', {
      userId: user.id,
      role: user.role,
      duration,
      filters: { role, search, isActive },
      resultCount: Array.isArray(result) ? result.length : 0,
    });

    // Convertir roles a minúscula para el frontend
    const processedResult = Array.isArray(result)
      ? result.map(user => ({
          ...user,
          role: user.role.toLowerCase(),
        }))
      : result;

    return NextResponse.json({
      users: processedResult,
      total: Array.isArray(processedResult) ? processedResult.length : 0,
      page,
      limit,
    });
  } catch (error) {
    logger.error('Error en consulta optimizada de usuarios', {
      error: error instanceof Error ? error.message : String(error),
    });
    return handleApiError(error, 'GET /api/users');
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(request);
    await requireRole(request, 'admin');

    const body = await request.json();

    // Convertir role a mayúscula para coincidir con el enum de Prisma
    if (body.role) {
      body.role = body.role.toUpperCase();
    }

    // Validar datos del usuario
    const validatedData = createUserSchema.parse(body);

    // Verificar si el email ya existe
    const existingUser = await db.user.findUnique({
      where: { email: validatedData.email },
    });

    if (existingUser) {
      throw new ValidationError('El email ya está registrado');
    }

    // Importar bcrypt para hashear la contraseña
    const bcrypt = await import('bcryptjs');
    const hashedPassword = await bcrypt.hash(validatedData.password, 12);

    // Preparar datos convirtiendo undefined a null para campos opcionales
    const userData = {
      ...validatedData,
      password: hashedPassword,
      phone: validatedData.phone ?? null,
      avatar: validatedData.avatar ?? null,
    };

    // Crear usuario con Prisma
    const newUser = await db.user.create({
      data: userData,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        phone: true,
        avatar: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    // Invalidar caché de usuarios
    // Cache invalidation disabled;

    logger.info('Usuario creado exitosamente', {
      adminId: user.id,
      newUserId: newUser.id,
      newUserRole: newUser.role,
    });

    return NextResponse.json(
      {
        message: 'Usuario creado exitosamente',
        user: {
          ...newUser,
          role: newUser.role.toLowerCase(),
        },
      },
      { status: 201 }
    );
  } catch (error) {
    logger.error('Error creando usuario', {
      error: error instanceof Error ? error.message : String(error),
    });
    return handleApiError(error, 'POST /api/users');
  }
}

export async function PUT(request: NextRequest) {
  try {
    const user = await requireAuth(request);
    await requireRole(request, 'admin');

    const body = await request.json();
    const { id, ...updateData } = body;

    if (!id) {
      throw new ValidationError('ID de usuario requerido');
    }

    // Validar datos de actualización
    const validatedData = updateUserSchema.parse(updateData);

    // Verificar si el usuario existe
    const existingUser = await db.user.findUnique({
      where: { id },
    });

    if (!existingUser) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });
    }

    // Si se está actualizando el email, verificar que no exista
    if (validatedData.email && validatedData.email !== existingUser.email) {
      const emailExists = await db.user.findUnique({
        where: { email: validatedData.email },
      });

      if (emailExists) {
        throw new ValidationError('El email ya está registrado');
      }
    }

    // Construir objeto de actualización compatible con Prisma
    const prismaUpdateData: any = {};
    if (validatedData.name !== undefined) {
      prismaUpdateData.name = validatedData.name;
    }
    if (validatedData.email !== undefined) {
      prismaUpdateData.email = validatedData.email;
    }
    if (validatedData.role !== undefined) {
      prismaUpdateData.role = validatedData.role;
    }
    if (validatedData.phone !== undefined) {
      prismaUpdateData.phone = validatedData.phone;
    }
    if (validatedData.avatar !== undefined) {
      prismaUpdateData.avatar = validatedData.avatar;
    }
    if (validatedData.isActive !== undefined) {
      prismaUpdateData.isActive = validatedData.isActive;
    }

    // Actualizar usuario
    const updatedUser = await db.user.update({
      where: { id },
      data: prismaUpdateData,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        phone: true,
        avatar: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    // Invalidar caché de usuarios
    // Cache invalidation disabled;

    logger.info('Usuario actualizado exitosamente', {
      adminId: user.id,
      updatedUserId: id,
      updatedFields: Object.keys(validatedData),
    });

    return NextResponse.json({
      message: 'Usuario actualizado exitosamente',
      user: updatedUser,
    });
  } catch (error) {
    logger.error('Error actualizando usuario', {
      error: error instanceof Error ? error.message : String(error),
    });
    return handleApiError(error, 'PUT /api/users');
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const user = await requireAuth(request);
    await requireRole(request, 'admin');

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      throw new ValidationError('ID de usuario requerido');
    }

    // Verificar si el usuario existe
    const existingUser = await db.user.findUnique({
      where: { id },
    });

    if (!existingUser) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });
    }

    // Verificar que no se esté eliminando a sí mismo
    if (id === user.id) {
      throw new ValidationError('No puedes eliminar tu propia cuenta');
    }

    // Verificar que no sea el último admin
    if (existingUser.role === UserRole.ADMIN) {
      const adminCount = await db.user.count({
        where: { role: UserRole.ADMIN, isActive: true },
      });

      if (adminCount <= 1) {
        throw new ValidationError('No se puede eliminar el último administrador');
      }
    }

    // Eliminar usuario (soft delete - marcar como inactivo)
    const deletedUser = await db.user.update({
      where: { id },
      data: { isActive: false },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
      },
    });

    // Invalidar caché de usuarios
    // Cache invalidation disabled;

    logger.info('Usuario eliminado exitosamente', {
      adminId: user.id,
      deletedUserId: id,
      deletedUserRole: deletedUser.role,
    });

    return NextResponse.json({
      message: 'Usuario eliminado exitosamente',
      user: deletedUser,
    });
  } catch (error) {
    logger.error('Error eliminando usuario', {
      error: error instanceof Error ? error.message : String(error),
    });
    return handleApiError(error, 'DELETE /api/users');
  }
}

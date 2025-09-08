import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, requireRole } from '@/lib/auth';
import { db } from '@/lib/db';
import { UserRole } from '@/types';
import { ValidationError, handleError } from '@/lib/errors';
import { getUsersOptimized, dbOptimizer } from '@/lib/db-optimizer';
import { logger } from '@/lib/logger';
import { z } from 'zod';

// Schema para crear usuario
const createUserSchema = z.object({
  name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres').max(100, 'El nombre no puede exceder 100 caracteres'),
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
    
    // Si no es admin, solo puede ver usuarios activos
    if (user.role !== UserRole.ADMIN) {
      where.isActive = true;
    }
    
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
    
    return NextResponse.json(result);
  } catch (error) {
    logger.error('Error en consulta optimizada de usuarios', { error: error instanceof Error ? error.message : String(error) });
    const errorResponse = handleError(error);
    return errorResponse;
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(request);
    await requireRole(request, 'ADMIN');
    
    const body = await request.json();
    
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
    
    // Crear usuario con Prisma
    const newUser = await db.user.create({
      data: {
        ...validatedData,
        password: hashedPassword,
      },
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
    
    return NextResponse.json({
      message: 'Usuario creado exitosamente',
      user: newUser,
    }, { status: 201 });
  } catch (error) {
    logger.error('Error creando usuario', { error: error instanceof Error ? error.message : String(error) });
    const errorResponse = handleError(error);
    return errorResponse;
  }
}

export async function PUT(request: NextRequest) {
  try {
    const user = await requireAuth(request);
    await requireRole(request, 'ADMIN');
    
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
      return NextResponse.json(
        { error: 'Usuario no encontrado' },
        { status: 404 },
      );
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
    
    // Actualizar usuario
    const updatedUser = await db.user.update({
      where: { id },
      data: validatedData,
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
    logger.error('Error actualizando usuario', { error: error instanceof Error ? error.message : String(error) });
    const errorResponse = handleError(error);
    return errorResponse;
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const user = await requireAuth(request);
    await requireRole(request, 'ADMIN');
    
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
      return NextResponse.json(
        { error: 'Usuario no encontrado' },
        { status: 404 },
      );
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
    logger.error('Error eliminando usuario', { error: error instanceof Error ? error.message : String(error) });
    const errorResponse = handleError(error);
    return errorResponse;
  }
}

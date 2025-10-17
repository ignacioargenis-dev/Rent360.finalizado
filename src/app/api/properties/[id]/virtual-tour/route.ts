import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { db } from '@/lib/db';
import { logger } from '@/lib/logger-minimal';
import { handleApiError } from '@/lib/api-error-handler';

interface VirtualTourScene {
  id: string;
  name: string;
  imageUrl: string;
  thumbnailUrl: string;
  description?: string;
  hotspots: Hotspot[];
  audioUrl?: string;
  duration?: number;
}

interface Hotspot {
  id: string;
  x: number;
  y: number;
  type: 'scene' | 'info' | 'link' | 'media';
  targetSceneId?: string;
  title: string;
  description?: string;
  icon?: string;
  mediaUrl?: string;
}

/**
 * GET /api/properties/[id]/virtual-tour
 * Obtiene el tour virtual de una propiedad
 */
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await requireAuth(request);
    const propertyId = params.id;

    if (!propertyId) {
      return NextResponse.json({ error: 'ID de propiedad requerido' }, { status: 400 });
    }

    // Verificar que la propiedad existe y el usuario tiene acceso
    const property = await db.property.findUnique({
      where: { id: propertyId },
      select: {
        id: true,
        title: true,
        ownerId: true,
        brokerId: true,
        virtualTourEnabled: true,
        virtualTourData: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!property) {
      return NextResponse.json({ error: 'Propiedad no encontrada' }, { status: 404 });
    }

    // Verificar permisos (propietario, corredor o admin)
    const hasAccess =
      user.role === 'ADMIN' || property.ownerId === user.id || property.brokerId === user.id;

    if (!hasAccess) {
      return NextResponse.json(
        { error: 'No tienes permisos para acceder a esta propiedad' },
        { status: 403 }
      );
    }

    // Si no hay tour virtual configurado
    if (!property.virtualTourEnabled || !property.virtualTourData) {
      return NextResponse.json({ error: 'Tour virtual no disponible' }, { status: 404 });
    }

    const tourData = JSON.parse(property.virtualTourData);

    logger.info('Tour virtual obtenido', {
      propertyId,
      userId: user.id,
      scenesCount: tourData.scenes?.length || 0,
    });

    return NextResponse.json({
      success: true,
      tour: {
        propertyId: property.id,
        scenes: tourData.scenes || [],
        isEnabled: property.virtualTourEnabled,
        createdAt: property.createdAt,
        updatedAt: property.updatedAt,
      },
    });
  } catch (error) {
    logger.error('Error obteniendo tour virtual:', { error });
    const errorResponse = handleApiError(error);
    return errorResponse;
  }
}

/**
 * POST /api/properties/[id]/virtual-tour
 * Crea un tour virtual para una propiedad
 */
export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await requireAuth(request);
    const propertyId = params.id;
    const body = await request.json();

    if (!propertyId) {
      return NextResponse.json({ error: 'ID de propiedad requerido' }, { status: 400 });
    }

    const { scenes } = body;

    if (!scenes || !Array.isArray(scenes) || scenes.length === 0) {
      return NextResponse.json(
        { error: 'Se requieren escenas para el tour virtual' },
        { status: 400 }
      );
    }

    // Verificar que la propiedad existe y el usuario tiene permisos
    const property = await db.property.findUnique({
      where: { id: propertyId },
      select: {
        id: true,
        title: true,
        ownerId: true,
        brokerId: true,
      },
    });

    if (!property) {
      return NextResponse.json({ error: 'Propiedad no encontrada' }, { status: 404 });
    }

    // Verificar permisos (propietario, corredor o admin)
    const hasAccess =
      user.role === 'ADMIN' || property.ownerId === user.id || property.brokerId === user.id;

    if (!hasAccess) {
      return NextResponse.json(
        { error: 'No tienes permisos para modificar esta propiedad' },
        { status: 403 }
      );
    }

    // Validar escenas
    for (const scene of scenes) {
      if (!scene.id || !scene.name || !scene.imageUrl) {
        return NextResponse.json(
          { error: 'Cada escena debe tener id, name e imageUrl' },
          { status: 400 }
        );
      }
    }

    // Crear el tour virtual
    const tourData = {
      scenes,
      createdAt: new Date().toISOString(),
      createdBy: user.id,
    };

    const updatedProperty = await db.property.update({
      where: { id: propertyId },
      data: {
        virtualTourEnabled: true,
        virtualTourData: JSON.stringify(tourData),
        updatedAt: new Date(),
      },
      select: {
        id: true,
        title: true,
        virtualTourEnabled: true,
        virtualTourData: true,
        updatedAt: true,
      },
    });

    logger.info('Tour virtual creado', {
      propertyId,
      userId: user.id,
      scenesCount: scenes.length,
    });

    return NextResponse.json({
      success: true,
      tour: {
        propertyId: updatedProperty.id,
        scenes,
        isEnabled: updatedProperty.virtualTourEnabled,
        createdAt: new Date(),
        updatedAt: updatedProperty.updatedAt,
      },
      message: 'Tour virtual creado exitosamente',
    });
  } catch (error) {
    logger.error('Error creando tour virtual:', { error });
    const errorResponse = handleApiError(error);
    return errorResponse;
  }
}

/**
 * PUT /api/properties/[id]/virtual-tour
 * Actualiza el tour virtual de una propiedad
 */
export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await requireAuth(request);
    const propertyId = params.id;
    const body = await request.json();

    if (!propertyId) {
      return NextResponse.json({ error: 'ID de propiedad requerido' }, { status: 400 });
    }

    const { scenes } = body;

    if (!scenes || !Array.isArray(scenes)) {
      return NextResponse.json(
        { error: 'Se requieren escenas para el tour virtual' },
        { status: 400 }
      );
    }

    // Verificar que la propiedad existe y el usuario tiene permisos
    const property = await db.property.findUnique({
      where: { id: propertyId },
      select: {
        id: true,
        title: true,
        ownerId: true,
        brokerId: true,
        virtualTourData: true,
      },
    });

    if (!property) {
      return NextResponse.json({ error: 'Propiedad no encontrada' }, { status: 404 });
    }

    // Verificar permisos (propietario, corredor o admin)
    const hasAccess =
      user.role === 'ADMIN' || property.ownerId === user.id || property.brokerId === user.id;

    if (!hasAccess) {
      return NextResponse.json(
        { error: 'No tienes permisos para modificar esta propiedad' },
        { status: 403 }
      );
    }

    // Validar escenas
    for (const scene of scenes) {
      if (!scene.id || !scene.name || !scene.imageUrl) {
        return NextResponse.json(
          { error: 'Cada escena debe tener id, name e imageUrl' },
          { status: 400 }
        );
      }
    }

    // Actualizar el tour virtual
    const existingTourData = property.virtualTourData ? JSON.parse(property.virtualTourData) : {};
    const tourData = {
      ...existingTourData,
      scenes,
      updatedAt: new Date().toISOString(),
      updatedBy: user.id,
    };

    const updatedProperty = await db.property.update({
      where: { id: propertyId },
      data: {
        virtualTourData: JSON.stringify(tourData),
        updatedAt: new Date(),
      },
      select: {
        id: true,
        title: true,
        virtualTourEnabled: true,
        virtualTourData: true,
        updatedAt: true,
      },
    });

    logger.info('Tour virtual actualizado', {
      propertyId,
      userId: user.id,
      scenesCount: scenes.length,
    });

    return NextResponse.json({
      success: true,
      tour: {
        propertyId: updatedProperty.id,
        scenes,
        isEnabled: updatedProperty.virtualTourEnabled,
        createdAt: existingTourData.createdAt ? new Date(existingTourData.createdAt) : new Date(),
        updatedAt: updatedProperty.updatedAt,
      },
      message: 'Tour virtual actualizado exitosamente',
    });
  } catch (error) {
    logger.error('Error actualizando tour virtual:', { error });
    const errorResponse = handleApiError(error);
    return errorResponse;
  }
}

/**
 * DELETE /api/properties/[id]/virtual-tour
 * Elimina el tour virtual de una propiedad
 */
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await requireAuth(request);
    const propertyId = params.id;

    if (!propertyId) {
      return NextResponse.json({ error: 'ID de propiedad requerido' }, { status: 400 });
    }

    // Verificar que la propiedad existe y el usuario tiene permisos
    const property = await db.property.findUnique({
      where: { id: propertyId },
      select: {
        id: true,
        title: true,
        ownerId: true,
        brokerId: true,
      },
    });

    if (!property) {
      return NextResponse.json({ error: 'Propiedad no encontrada' }, { status: 404 });
    }

    // Verificar permisos (propietario, corredor o admin)
    const hasAccess =
      user.role === 'ADMIN' || property.ownerId === user.id || property.brokerId === user.id;

    if (!hasAccess) {
      return NextResponse.json(
        { error: 'No tienes permisos para modificar esta propiedad' },
        { status: 403 }
      );
    }

    // Deshabilitar el tour virtual
    await db.property.update({
      where: { id: propertyId },
      data: {
        virtualTourEnabled: false,
        virtualTourData: null,
        updatedAt: new Date(),
      },
    });

    logger.info('Tour virtual eliminado', {
      propertyId,
      userId: user.id,
    });

    return NextResponse.json({
      success: true,
      message: 'Tour virtual eliminado exitosamente',
    });
  } catch (error) {
    logger.error('Error eliminando tour virtual:', { error });
    const errorResponse = handleApiError(error);
    return errorResponse;
  }
}

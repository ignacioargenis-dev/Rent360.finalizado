import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { logger } from '@/lib/logger-minimal';
import { requireAuth } from '@/lib/auth';
import { rm } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const propertyId = params.id;

    logger.info('Fetching property details', { propertyId });

    // Buscar la propiedad con información del propietario
    const property = await db.property.findUnique({
      where: {
        id: propertyId,
      },
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
          },
        },
        contracts: {
          where: { status: 'ACTIVE' },
          include: {
            tenant: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
        reviews: {
          select: {
            rating: true,
          },
        },
      },
    });

    if (!property) {
      logger.warn('Property not found', { propertyId });
      return NextResponse.json({ error: 'Propiedad no encontrada' }, { status: 404 });
    }

    // Obtener las imágenes de la propiedad
    const originalImages = property.images
      ? Array.isArray(property.images)
        ? property.images
        : JSON.parse(property.images)
      : [];

    // Procesar las imágenes manteniendo URLs de cloud storage y transformando solo las locales
    const transformedImages = originalImages
      .map((img: string) => {
        const imgStr = String(img ?? '');
        const imgNoQuery = (imgStr.split('?')[0] ?? '') as string;

        // Si es una URL de cloud storage, mantenerla tal como está
        if (imgNoQuery.includes('digitaloceanspaces.com') || imgNoQuery.includes('amazonaws.com')) {
          return imgNoQuery;
        }

        // Para URLs locales, transformar a ruta /api/uploads
        let transformedImg = imgNoQuery;
        if (imgNoQuery && imgNoQuery.startsWith('/api/uploads/')) {
          transformedImg = imgNoQuery;
        } else if (imgNoQuery && imgNoQuery.startsWith('/images/')) {
          transformedImg = imgNoQuery.replace('/images/', '/api/uploads/');
        } else if (imgNoQuery && imgNoQuery.startsWith('/uploads/')) {
          transformedImg = imgNoQuery.replace('/uploads/', '/api/uploads/');
        } else if (imgNoQuery && !imgNoQuery.startsWith('http') && !imgNoQuery.startsWith('/')) {
          transformedImg = `/api/uploads/${imgNoQuery}`;
        }
        return transformedImg;
      })
      // Solo filtrar URLs locales que no existen físicamente, mantener URLs de cloud storage
      .filter((imgPath: string) => {
        // Si es URL de cloud storage, siempre incluirla
        if (imgPath.includes('digitaloceanspaces.com') || imgPath.includes('amazonaws.com')) {
          return true;
        }

        // Para URLs locales, verificar si el archivo existe
        try {
          const logical = imgPath.replace(/^\/api\//, '');
          const fullPath = require('path').join(
            process.cwd(),
            'public',
            logical.replace(/^uploads\//, 'uploads/')
          );
          return require('fs').existsSync(fullPath);
        } catch {
          return false;
        }
      })
      // Agregar timestamp único para cache busting solo a URLs locales
      .map((imgPath: string) => {
        // No agregar timestamp a URLs de cloud storage
        if (imgPath.includes('digitaloceanspaces.com') || imgPath.includes('amazonaws.com')) {
          return imgPath;
        }

        // Agregar timestamp solo a URLs locales
        const separator = imgPath.includes('?') ? '&' : '?';
        const uniqueTimestamp = Date.now() + Math.random();
        return `${imgPath}${separator}t=${uniqueTimestamp}`;
      });

    // Formatear la respuesta
    const formattedProperty = {
      id: property.id,
      title: property.title,
      description: property.description,
      address: property.address,
      city: property.city,
      commune: property.commune,
      region: property.region,
      price: property.price,
      deposit: property.deposit,
      bedrooms: property.bedrooms,
      bathrooms: property.bathrooms,
      area: property.area,
      type: property.type,
      status: property.status,
      features: property.features ? JSON.parse(property.features) : [],
      images: transformedImages,
      views: property.views,
      inquiries: property.inquiries,
      owner: property.owner
        ? {
            id: property.owner.id,
            name: property.owner.name,
            email: property.owner.email,
            avatar: property.owner.avatar,
          }
        : null,
      currentTenant: property.contracts[0]?.tenant || null,
      averageRating:
        property.reviews.length > 0
          ? property.reviews.reduce((sum, review) => sum + review.rating, 0) /
            property.reviews.length
          : 0,
      totalReviews: property.reviews.length,
      createdAt: property.createdAt,
      updatedAt: property.updatedAt,

      // Características adicionales
      furnished: property.furnished || false,
      petFriendly: property.petFriendly || false,
      parkingSpaces: property.parkingSpaces || 0,
      availableFrom: property.availableFrom,
      floor: property.floor,
      buildingName: property.buildingName,
      yearBuilt: property.yearBuilt,

      // Características del edificio/servicios
      heating: property.heating || false,
      cooling: property.cooling || false,
      internet: property.internet || false,
      elevator: property.elevator || false,
      balcony: property.balcony || false,
      terrace: property.terrace || false,
      garden: property.garden || false,
      pool: property.pool || false,
      gym: property.gym || false,
      security: property.security || false,
      concierge: property.concierge || false,

      // Campos adicionales
      brokerId: property.brokerId,
      currency: 'CLP', // Valor por defecto
    };

    logger.info('Property details fetched successfully', {
      propertyId,
      hasImages: transformedImages.length > 0,
      imageCount: transformedImages.length,
      images: transformedImages.slice(0, 3), // Mostrar primeras 3 URLs
      ownerId: property.owner?.id,
      brokerId: property.brokerId,
      title: property.title,
      address: property.address,
      price: property.price,
    });

    return NextResponse.json({
      success: true,
      property: formattedProperty,
    });
  } catch (error) {
    logger.error('Error fetching property details', { error, propertyId: params.id });
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

// Endpoint para incrementar vistas
export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const propertyId = params.id;
    const body = await request.json();

    if (body.action === 'increment_views') {
      // Incrementar el contador de vistas
      const updatedProperty = await db.property.update({
        where: { id: propertyId },
        data: {
          views: {
            increment: 1,
          },
        },
      });

      logger.info('Property views incremented', { propertyId, newViews: updatedProperty.views });

      return NextResponse.json({
        success: true,
        views: updatedProperty.views,
      });
    }

    if (body.action === 'increment_inquiries') {
      // Incrementar el contador de consultas
      const updatedProperty = await db.property.update({
        where: { id: propertyId },
        data: {
          inquiries: {
            increment: 1,
          },
        },
      });

      logger.info('Property inquiries incremented', {
        propertyId,
        newInquiries: updatedProperty.inquiries,
      });

      return NextResponse.json({
        success: true,
        inquiries: updatedProperty.inquiries,
      });
    }

    return NextResponse.json({ error: 'Acción no válida' }, { status: 400 });
  } catch (error) {
    logger.error('Error updating property counters', {
      error: error instanceof Error ? error.message : error,
      propertyId: params.id,
    });
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const propertyId = params.id;
    const body = await request.json();

    logger.info('Updating property', { propertyId, fields: Object.keys(body) });

    // Preparar los datos para actualizar (solo campos que existen en el esquema)
    const updateData: any = {
      title: body.title,
      description: body.description,
      address: body.address,
      city: body.city,
      region: body.region,
      type: body.type,
      bedrooms: parseInt(body.bedrooms),
      bathrooms: parseInt(body.bathrooms),
      area: parseFloat(body.area),
      price: parseFloat(body.price),
      status: body.status,
      features: JSON.stringify(body.features || []),
      // Solo actualizar imágenes si se proporcionan explícitamente
      ...(body.images !== undefined && { images: JSON.stringify(body.images) }),

      // Características básicas
      furnished: Boolean(body.furnished),
      petFriendly: Boolean(body.petFriendly),
      parkingSpaces: parseInt(body.parkingSpaces) || 0,
      availableFrom: body.availableFrom ? new Date(body.availableFrom) : null,
      floor: body.floor ? parseInt(body.floor) : null,
      buildingName: body.buildingName || null,
      yearBuilt: body.yearBuilt ? parseInt(body.yearBuilt) : null,

      // Características del edificio/servicios
      heating: Boolean(body.heating),
      cooling: Boolean(body.cooling),
      internet: Boolean(body.internet),
      elevator: Boolean(body.elevator),
      balcony: Boolean(body.balcony),
      terrace: Boolean(body.terrace),
      garden: Boolean(body.garden),
      pool: Boolean(body.pool),
      gym: Boolean(body.gym),
      security: Boolean(body.security),
      concierge: Boolean(body.concierge),

      updatedAt: new Date(),
    };

    // Actualizar la propiedad
    const updatedProperty = await db.property.update({
      where: {
        id: propertyId,
      },
      data: updateData,
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    logger.info('Property updated successfully', { propertyId });

    return NextResponse.json({
      success: true,
      property: updatedProperty,
    });
  } catch (error) {
    logger.error('Error updating property', {
      error: error instanceof Error ? error.message : error,
      stack: error instanceof Error ? error.stack : undefined,
      propertyId: params.id,
    });

    // Proporcionar más detalles del error para debugging
    const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
    return NextResponse.json(
      {
        error: 'Error interno del servidor',
        details: errorMessage,
        propertyId: params.id,
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/properties/[id]
 * Elimina una propiedad y todos sus archivos asociados
 */
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    // Verificar autenticación
    let user;
    try {
      user = await requireAuth(request);
    } catch (authError) {
      logger.error('Authentication error in property deletion', { error: authError });
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const propertyId = params.id;

    if (!propertyId) {
      return NextResponse.json({ error: 'ID de propiedad requerido' }, { status: 400 });
    }

    logger.info('Attempting to delete property', { propertyId, userId: user.id });

    // Verificar que la propiedad existe y el usuario tiene permisos
    const property = await db.property.findUnique({
      where: { id: propertyId },
      select: {
        id: true,
        title: true,
        ownerId: true,
        brokerId: true,
        images: true,
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
        { error: 'No tienes permisos para eliminar esta propiedad' },
        { status: 403 }
      );
    }

    // Verificar si la propiedad tiene contratos activos
    const activeContracts = await db.contract.count({
      where: {
        propertyId: propertyId,
        status: 'ACTIVE',
      },
    });

    if (activeContracts > 0) {
      return NextResponse.json(
        {
          error: 'No se puede eliminar la propiedad porque tiene contratos activos',
          activeContracts,
        },
        { status: 400 }
      );
    }

    // Eliminar archivos físicos asociados
    try {
      const propertyDir = join(process.cwd(), 'public', 'uploads', 'properties', propertyId);

      if (existsSync(propertyDir)) {
        await rm(propertyDir, { recursive: true, force: true });
        logger.info('Property directory deleted', { propertyId, path: propertyDir });
      }

      // Eliminar documentos asociados si existen
      const documentsDir = join(process.cwd(), 'public', 'uploads', 'documents', propertyId);
      if (existsSync(documentsDir)) {
        await rm(documentsDir, { recursive: true, force: true });
        logger.info('Property documents directory deleted', { propertyId, path: documentsDir });
      }

      // Eliminar tour virtual si existe
      const virtualTourDir = join(process.cwd(), 'public', 'uploads', 'virtual-tours', propertyId);
      if (existsSync(virtualTourDir)) {
        await rm(virtualTourDir, { recursive: true, force: true });
        logger.info('Property virtual tour directory deleted', {
          propertyId,
          path: virtualTourDir,
        });
      }
    } catch (fileError) {
      logger.error('Error deleting property files', { error: fileError, propertyId });
      // Continuar con la eliminación de la base de datos aunque falle la eliminación de archivos
    }

    // Eliminar registros relacionados en la base de datos
    await db.$transaction(async tx => {
      // Eliminar reviews
      await tx.review.deleteMany({
        where: { propertyId: propertyId },
      });

      // Eliminar contratos (inactivos)
      await tx.contract.deleteMany({
        where: { propertyId: propertyId },
      });

      // Eliminar recordatorios de pago relacionados
      await tx.paymentReminder.deleteMany({
        where: {
          contract: {
            propertyId: propertyId,
          },
        },
      });

      // Eliminar mensajes relacionados
      await tx.message.deleteMany({
        where: { propertyId: propertyId },
      });

      // Eliminar visitas programadas
      await tx.visit.deleteMany({
        where: { propertyId: propertyId },
      });

      // Eliminar mantenimientos
      await tx.maintenance.deleteMany({
        where: { propertyId: propertyId },
      });

      // Eliminar documentos
      await tx.document.deleteMany({
        where: { propertyId: propertyId },
      });

      // Eliminar favoritos
      await tx.propertyFavorite.deleteMany({
        where: { propertyId: propertyId },
      });

      // Eliminar la propiedad
      await tx.property.delete({
        where: { id: propertyId },
      });
    });

    logger.info('Property deleted successfully', {
      propertyId,
      title: property.title,
      deletedBy: user.id,
      userRole: user.role,
    });

    return NextResponse.json({
      success: true,
      message: 'Propiedad eliminada exitosamente',
      deletedProperty: {
        id: property.id,
        title: property.title,
      },
    });
  } catch (error) {
    logger.error('Error deleting property', {
      error: error instanceof Error ? error.message : error,
      stack: error instanceof Error ? error.stack : undefined,
      propertyId: params.id,
    });

    return NextResponse.json(
      {
        error: 'Error interno del servidor al eliminar la propiedad',
        details: error instanceof Error ? error.message : 'Error desconocido',
      },
      { status: 500 }
    );
  }
}

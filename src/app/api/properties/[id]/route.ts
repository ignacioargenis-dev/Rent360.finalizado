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

    // ✅ CRÍTICO: Log inicial para debugging
    console.log('🔍 [GET_PROPERTY] Iniciando GET /api/properties/[id]', {
      propertyId,
      url: request.url,
      method: request.method,
      hasCookies: !!request.cookies,
      cookieNames: request.cookies.getAll().map(c => c.name),
    });

    logger.info('Fetching property details', { propertyId });

    // ✅ CRÍTICO: Intentar obtener usuario autenticado para verificar permisos de edición
    let currentUser: { id: string; role: string } | null = null;
    try {
      const user = await requireAuth(request);
      currentUser = { id: user.id, role: user.role };
    } catch {
      // Si no hay autenticación, continuar sin usuario (para acceso público)
      currentUser = null;
    }

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
        broker: {
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
        // Incluir documentos de la propiedad
        documents: {
          orderBy: {
            createdAt: 'desc',
          },
          select: {
            id: true,
            name: true,
            type: true,
            fileName: true,
            filePath: true,
            fileSize: true,
            mimeType: true,
            createdAt: true,
          },
        },
      },
    });

    if (!property) {
      console.warn('⚠️ [GET_PROPERTY] Propiedad no encontrada', { propertyId });
      logger.warn('Property not found', { propertyId });
      return NextResponse.json({ error: 'Propiedad no encontrada' }, { status: 404 });
    }

    console.log('✅ [GET_PROPERTY] Propiedad encontrada', {
      propertyId,
      title: property.title,
      ownerId: property.ownerId,
      brokerId: property.brokerId,
      hasImages: !!property.images,
    });

    // Obtener las imágenes de la propiedad
    const originalImages = property.images
      ? Array.isArray(property.images)
        ? property.images
        : JSON.parse(property.images)
      : [];

    // Todas las imágenes ahora usan cloud storage - mantener URLs tal como están
    const transformedImages = originalImages
      .map((img: string) => {
        const imgStr = String(img ?? '');
        // Remover cualquier query parameter de cache busting anterior
        const imgNoQuery = (imgStr.split('?')[0] ?? '') as string;
        return imgNoQuery;
      })
      // Filtrar URLs vacías o inválidas
      .filter((imgPath: string) => imgPath && imgPath.trim().length > 0);

    // Verificar si la propiedad es administrada por algún broker
    const managedProperty = await db.brokerPropertyManagement.findFirst({
      where: {
        propertyId: property.id,
        status: 'ACTIVE',
      },
      select: {
        id: true,
        brokerId: true,
        managementType: true,
      },
    });

    // ✅ CORREGIDO: Determinar si es propia del broker
    // Si hay BrokerPropertyManagement activo, NO es propia (está gestionada)
    // Si NO hay BrokerPropertyManagement Y ownerId === brokerId, es propia
    const isOwned = !managedProperty && property.ownerId === property.brokerId;

    // ✅ CORREGIDO: Determinar si el broker actual está gestionando esta propiedad
    // Un broker puede editar si:
    // 1. Es propiedad propia (isOwned === true)
    // 2. Está gestionando activamente la propiedad (managedProperty.brokerId === currentUser.id)
    const isManagedByCurrentUser =
      currentUser && managedProperty && managedProperty.brokerId === currentUser.id;
    const canEdit = currentUser?.role === 'BROKER' && (isOwned || isManagedByCurrentUser);

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
      // ✅ CRÍTICO: Información de ownership para determinar si se puede editar
      ownerId: property.ownerId,
      brokerId: property.brokerId,
      isOwned: isOwned,
      isManagedByCurrentUser: isManagedByCurrentUser || false,
      canEdit: canEdit || false,
      managementType: managedProperty ? managedProperty.managementType : 'owner',
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
      currency: 'CLP', // Valor por defecto

      // Documentos de la propiedad
      documents: property.documents.map(doc => ({
        id: doc.id,
        name: doc.name,
        type: doc.type,
        uploadDate: doc.createdAt.toISOString().split('T')[0],
        size: formatFileSize(doc.fileSize),
        fileName: doc.fileName,
        filePath: doc.filePath,
        mimeType: doc.mimeType,
      })),
    };

    // Función auxiliar para formatear tamaño de archivo
    function formatFileSize(bytes: number): string {
      if (bytes === 0) {
        return '0 Bytes';
      }
      const k = 1024;
      const sizes = ['Bytes', 'KB', 'MB', 'GB'];
      const i = Math.floor(Math.log(bytes) / Math.log(k));
      return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    console.log('✅ [GET_PROPERTY] Detalles de propiedad obtenidos exitosamente', {
      propertyId,
      title: formattedProperty.title,
      hasImages: transformedImages.length > 0,
      imageCount: transformedImages.length,
      ownerId: property.owner?.id,
      ownerName: property.owner?.name,
      brokerId: property.brokerId,
      price: property.price,
    });

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

    // ✅ NUEVO: Manejar cambios de status de propiedades (para aprobación/rechazo)
    if (body.status) {
      // Verificar autenticación como admin
      const user = await requireAuth(request);

      if (user.role !== 'ADMIN') {
        return NextResponse.json(
          { error: 'Solo los administradores pueden cambiar el status de las propiedades' },
          { status: 403 }
        );
      }

      // Validar que el status sea válido
      const validStatuses = ['PENDING', 'AVAILABLE', 'REJECTED', 'SOLD', 'RENTED'];
      if (!validStatuses.includes(body.status)) {
        return NextResponse.json(
          { error: `Status no válido. Debe ser uno de: ${validStatuses.join(', ')}` },
          { status: 400 }
        );
      }

      // Actualizar el status de la propiedad
      const updatedProperty = await db.property.update({
        where: { id: propertyId },
        data: { status: body.status },
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

      logger.info('Property status updated by admin', {
        propertyId,
        newStatus: body.status,
        adminId: user.id,
        adminEmail: user.email,
      });

      return NextResponse.json({
        success: true,
        message: `Propiedad ${body.status === 'AVAILABLE' ? 'aprobada' : body.status === 'REJECTED' ? 'rechazada' : 'actualizada'} exitosamente`,
        property: {
          id: updatedProperty.id,
          title: updatedProperty.title,
          status: updatedProperty.status,
          owner: updatedProperty.owner,
        },
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

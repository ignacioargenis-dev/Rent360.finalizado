import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { db } from '@/lib/db';
import { logger } from '@/lib/logger-minimal';
import { writeFile } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';
import { ensurePropertyDirectory } from '@/lib/property-directory';

/**
 * POST /api/properties/[id]/images
 * Sube imágenes para una propiedad específica
 */
export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    // Verificar autenticación
    let user;
    try {
      user = await requireAuth(request);
    } catch (authError) {
      logger.error('Authentication error in property image upload', { error: authError });
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

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

    const formData = await request.formData();
    const files = formData.getAll('image') as File[];

    if (!files || files.length === 0) {
      return NextResponse.json({ error: 'No se encontraron archivos para subir' }, { status: 400 });
    }

    // Validar archivos
    const maxFileSize = 10 * 1024 * 1024; // 10MB
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

    for (const file of files) {
      if (file.size > maxFileSize) {
        return NextResponse.json(
          { error: `El archivo ${file.name} excede el tamaño máximo de 10MB` },
          { status: 400 }
        );
      }

      if (!allowedTypes.includes(file.type)) {
        return NextResponse.json(
          { error: `El archivo ${file.name} no es un tipo de imagen válido` },
          { status: 400 }
        );
      }
    }

    // Asegurar que el directorio de la propiedad existe
    const propertyDir = await ensurePropertyDirectory(propertyId);

    const uploadedImages = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];

      if (!file) {
        continue;
      }

      try {
        // Generar nombre único para el archivo
        const timestamp = Date.now();
        const randomId = Math.random().toString(36).substring(2, 15);
        const extension = file.name.split('.').pop() || 'jpg';
        const filename = `image_${i + 1}_${timestamp}_${randomId}.${extension}`;
        const filepath = join(propertyDir, filename);

        // Convertir File a Buffer y guardar
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);
        await writeFile(filepath, buffer);

        // Crear URL accesible desde el navegador
        const imageUrl = `/api/uploads/properties/${propertyId}/${filename}`;

        uploadedImages.push({
          filename,
          imageUrl,
          originalName: file.name,
          size: file.size,
          type: file.type,
        });

        logger.info('Imagen de propiedad subida', {
          propertyId,
          userId: user.id,
          filename,
          originalName: file.name,
          size: file.size,
        });
      } catch (fileError) {
        logger.error('Error subiendo imagen de propiedad:', {
          error: fileError,
          propertyId,
          filename: file.name,
        });
        // Continuar con los otros archivos
      }
    }

    if (uploadedImages.length === 0) {
      return NextResponse.json({ error: 'No se pudieron subir las imágenes' }, { status: 500 });
    }

    // Obtener las imágenes actuales de la propiedad
    const currentProperty = await db.property.findUnique({
      where: { id: propertyId },
      select: { images: true },
    });

    // Combinar imágenes existentes con las nuevas
    const existingImages = currentProperty?.images
      ? Array.isArray(currentProperty.images)
        ? currentProperty.images
        : JSON.parse(currentProperty.images)
      : [];

    const allImages = [...existingImages, ...uploadedImages.map(img => img.imageUrl)];

    // Actualizar la propiedad con las nuevas imágenes
    await db.property.update({
      where: { id: propertyId },
      data: {
        images: JSON.stringify(allImages),
        updatedAt: new Date(),
      },
    });

    logger.info('Propiedad actualizada con nuevas imágenes', {
      propertyId,
      newImagesCount: uploadedImages.length,
      totalImagesCount: allImages.length,
    });

    return NextResponse.json({
      success: true,
      uploadedImages,
      totalImages: allImages.length,
      message: `${uploadedImages.length} imagen(es) subida(s) exitosamente`,
    });
  } catch (error) {
    logger.error('Error subiendo imágenes de propiedad:', { error });
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

/**
 * DELETE /api/properties/[id]/images
 * Elimina una imagen específica de una propiedad
 */
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    // Verificar autenticación
    let user;
    try {
      user = await requireAuth(request);
    } catch (authError) {
      logger.error('Authentication error in property image delete', { error: authError });
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const propertyId = params.id;
    const { searchParams } = new URL(request.url);
    const imageUrl = searchParams.get('imageUrl');

    if (!propertyId || !imageUrl) {
      return NextResponse.json({ error: 'ID de propiedad e imagen requeridos' }, { status: 400 });
    }

    // Verificar que la propiedad existe y el usuario tiene permisos
    const property = await db.property.findUnique({
      where: { id: propertyId },
      select: {
        id: true,
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
        { error: 'No tienes permisos para modificar esta propiedad' },
        { status: 403 }
      );
    }

    // Obtener las imágenes actuales
    const currentImages = property.images
      ? Array.isArray(property.images)
        ? property.images
        : JSON.parse(property.images)
      : [];

    // Filtrar la imagen a eliminar
    const updatedImages = currentImages.filter((img: string) => img !== imageUrl);

    // Actualizar la propiedad
    await db.property.update({
      where: { id: propertyId },
      data: {
        images: JSON.stringify(updatedImages),
        updatedAt: new Date(),
      },
    });

    // Intentar eliminar el archivo físico
    try {
      const filename = imageUrl.split('/').pop();
      if (filename) {
        const filepath = join(
          process.cwd(),
          'public',
          'uploads',
          'properties',
          propertyId,
          filename
        );
        if (existsSync(filepath)) {
          await writeFile(filepath, ''); // Vaciar el archivo
        }
      }
    } catch (fileError) {
      logger.error('Error eliminando archivo físico:', { error: fileError, imageUrl });
    }

    logger.info('Imagen eliminada de propiedad', {
      propertyId,
      userId: user.id,
      imageUrl,
      remainingImages: updatedImages.length,
    });

    return NextResponse.json({
      success: true,
      message: 'Imagen eliminada exitosamente',
      remainingImages: updatedImages.length,
    });
  } catch (error) {
    logger.error('Error eliminando imagen de propiedad:', { error });
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

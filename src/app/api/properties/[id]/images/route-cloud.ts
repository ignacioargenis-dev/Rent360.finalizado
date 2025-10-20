import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { db } from '@/lib/db';
import { logger } from '@/lib/logger-minimal';
import { getCloudStorageService, generateFileKey } from '@/lib/cloud-storage';

const maxFileSize = 10 * 1024 * 1024; // 10MB
const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'];

/**
 * POST /api/properties/[id]/images
 * Sube imágenes para una propiedad específica usando cloud storage
 */
export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  console.log('🖼️ POST /api/properties/[id]/images called for property:', params.id);
  console.log('🔍 Request headers:', Object.fromEntries(request.headers.entries()));
  console.log('🔍 Request method:', request.method);
  console.log('🔍 Request URL:', request.url);

  try {
    // Verificar autenticación
    let user;
    try {
      user = await requireAuth(request);
      console.log('✅ User authenticated:', user.email, 'role:', user.role);
    } catch (authError) {
      console.error('❌ Authentication error in property image upload', { error: authError });
      logger.error('Authentication error in property image upload', { error: authError });
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const propertyId = params.id;
    console.log('🔍 Processing property ID:', propertyId);

    if (!propertyId) {
      console.error('❌ No property ID provided');
      return NextResponse.json({ error: 'ID de propiedad requerido' }, { status: 400 });
    }

    // Verificar que la propiedad existe y el usuario tiene permisos
    console.log('🔍 Looking up property in database...');
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
      console.error('❌ Property not found:', propertyId);
      return NextResponse.json({ error: 'Propiedad no encontrada' }, { status: 404 });
    }

    // Verificar permisos: solo el owner, broker asignado, o admin pueden subir imágenes
    const isOwner = user.id === property.ownerId;
    const isBroker = user.id === property.brokerId;
    const isAdmin = user.role === 'ADMIN';

    if (!isOwner && !isBroker && !isAdmin) {
      console.error('❌ User not authorized to upload images for this property');
      return NextResponse.json(
        { error: 'No autorizado para subir imágenes a esta propiedad' },
        { status: 403 }
      );
    }

    console.log('✅ User authorized to upload images');

    // Parsear FormData
    console.log('📄 Parsing FormData...');
    const formData = await request.formData();
    console.log(
      '📋 FormData entries:',
      Array.from(formData.entries()).map(([key, value]) => ({
        key,
        type: typeof value,
        name: value instanceof File ? value.name : 'not a file',
        size: value instanceof File ? value.size : 'not a file',
      }))
    );

    const files = formData.getAll('image') as File[];

    if (files.length === 0) {
      console.error('❌ No files provided');
      return NextResponse.json({ error: 'No se encontraron archivos para subir' }, { status: 400 });
    }

    if (files.length > 10) {
      console.error('❌ Too many files:', files.length);
      return NextResponse.json({ error: 'Máximo 10 imágenes por propiedad' }, { status: 400 });
    }

    // Validar archivos
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

    console.log(`📤 Starting upload of ${files.length} files to cloud storage...`);
    const cloudStorage = getCloudStorageService();
    const uploadedImages = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];

      if (!file) {
        console.log(`⚠️ File ${i + 1} is null/undefined, skipping`);
        continue;
      }

      console.log(`🔄 Processing file ${i + 1}/${files.length}:`, {
        name: file.name,
        size: file.size,
        type: file.type,
        isFile: file instanceof File,
      });

      try {
        // Generar nombre único para el archivo
        const timestamp = Date.now();
        const randomId = Math.random().toString(36).substring(2, 15);
        const fileNameParts = file.name.split('.');
        const extension = fileNameParts.length > 1 ? fileNameParts.pop() : 'jpg';
        const filename = `image_${i + 1}_${timestamp}_${randomId}.${extension}`;

        // Generar key para cloud storage
        const cloudKey = generateFileKey(propertyId, filename);

        console.log(`📝 Generated filename: ${filename}`);
        console.log(`☁️  Cloud key: ${cloudKey}`);

        logger.info('Preparando subir imagen a cloud', {
          propertyId,
          cloudKey,
          originalName: file.name,
          fileSize: file.size,
        });

        // Subir a cloud storage
        console.log(`📤 Uploading file to cloud storage...`);
        const result = await cloudStorage.uploadFile(file, cloudKey, file.type);

        console.log(`✅ File uploaded successfully: ${result.url}`);

        // Agregar URL a la lista de imágenes subidas
        uploadedImages.push(result.url);

        logger.info('Imagen subida exitosamente a cloud', {
          propertyId,
          cloudKey,
          url: result.url,
          fileSize: file.size,
        });
      } catch (fileError) {
        console.error(`❌ Error uploading file ${file.name}:`, fileError);
        logger.error('Error subiendo imagen a cloud', {
          error: fileError,
          propertyId,
          fileName: file.name,
        });
        // Continuar con otros archivos en lugar de fallar completamente
      }
    }

    if (uploadedImages.length === 0) {
      console.error('❌ No files were uploaded successfully');
      return NextResponse.json({ error: 'No se pudo subir ninguna imagen' }, { status: 500 });
    }

    // Obtener las imágenes actuales de la propiedad
    const currentProperty = await db.property.findUnique({
      where: { id: propertyId },
      select: { images: true },
    });

    const currentImages = currentProperty?.images
      ? Array.isArray(currentProperty.images)
        ? currentProperty.images
        : JSON.parse(currentProperty.images)
      : [];

    // Combinar imágenes existentes con las nuevas
    const allImages = [...currentImages, ...uploadedImages];

    // Actualizar la propiedad en la base de datos
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

    console.log(`✅ Successfully uploaded ${uploadedImages.length} images`);
    console.log(`📊 Property now has ${allImages.length} total images`);

    return NextResponse.json({
      success: true,
      message: `${uploadedImages.length} imagen(es) subida(s) exitosamente`,
      uploadedImages,
      totalImages: allImages.length,
    });
  } catch (error) {
    console.error('❌ Unexpected error in image upload:', error);
    logger.error('Unexpected error in property image upload', { error });
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

/**
 * DELETE /api/properties/[id]/images?imageUrl=...
 * Elimina una imagen específica de una propiedad
 */
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await requireAuth(request);
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
        title: true,
        ownerId: true,
        brokerId: true,
        images: true,
      },
    });

    if (!property) {
      return NextResponse.json({ error: 'Propiedad no encontrada' }, { status: 404 });
    }

    // Verificar permisos
    const isOwner = user.id === property.ownerId;
    const isBroker = user.id === property.brokerId;
    const isAdmin = user.role === 'ADMIN';

    if (!isOwner && !isBroker && !isAdmin) {
      return NextResponse.json({ error: 'No autorizado para eliminar imágenes' }, { status: 403 });
    }

    const currentImages = property.images
      ? Array.isArray(property.images)
        ? property.images
        : JSON.parse(property.images)
      : [];

    // Normalizar URL para comparación (remover query params)
    const normalizedImageUrl = imageUrl.split('?')[0];

    // Filtrar la imagen a eliminar
    const updatedImages = currentImages.filter(
      (img: string) => img?.split('?')[0] !== normalizedImageUrl
    );

    // Si la imagen estaba en cloud storage, intentar eliminarla
    if (
      imageUrl.includes('digitaloceanspaces.com') ||
      imageUrl.includes('s3.') ||
      imageUrl.includes('cloudinary.com')
    ) {
      try {
        const cloudStorage = getCloudStorageService();
        const key = extractKeyFromUrl(imageUrl);

        if (key) {
          await cloudStorage.deleteFile(key);
          logger.info('Imagen eliminada de cloud storage', { key, propertyId });
        }
      } catch (cloudError) {
        logger.warn('Error eliminando imagen de cloud storage', {
          error: cloudError,
          imageUrl,
          propertyId,
        });
        // No bloquear la eliminación de la BD si falla la eliminación en cloud
      }
    }

    // Actualizar la propiedad en la base de datos
    await db.property.update({
      where: { id: propertyId },
      data: {
        images: JSON.stringify(updatedImages),
        updatedAt: new Date(),
      },
    });

    logger.info('Imagen eliminada de propiedad', {
      propertyId,
      imageUrl: normalizedImageUrl,
      remainingImages: updatedImages.length,
    });

    return NextResponse.json({
      success: true,
      message: 'Imagen eliminada exitosamente',
      remainingImages: updatedImages.length,
    });
  } catch (error) {
    logger.error('Error eliminando imagen de propiedad', { error });
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

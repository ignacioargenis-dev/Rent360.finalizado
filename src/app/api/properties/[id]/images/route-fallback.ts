import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { db } from '@/lib/db';
import { logger } from '@/lib/logger-minimal';
import { writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';

const maxFileSize = 10 * 1024 * 1024; // 10MB
const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'];

/**
 * POST /api/properties/[id]/images
 * Sube imágenes para una propiedad específica usando almacenamiento local como fallback
 */
export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  console.log('🖼️ POST /api/properties/[id]/images (fallback) called for property:', params.id);

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

    console.log('✅ Property found:', property.title);

    // Verificar permisos
    const canEdit =
      user.role === 'ADMIN' ||
      user.role === 'SUPER_ADMIN' ||
      (user.role === 'OWNER' && property.ownerId === user.id) ||
      (user.role === 'BROKER' && property.brokerId === user.id);

    if (!canEdit) {
      console.error('❌ User does not have permission to edit this property');
      return NextResponse.json(
        { error: 'No tienes permisos para editar esta propiedad' },
        { status: 403 }
      );
    }

    console.log('✅ User has permission to edit property');

    // Obtener datos del formulario
    const formData = await request.formData();
    const files = formData.getAll('images') as File[];

    console.log('📁 Files received:', files.length);

    if (!files || files.length === 0) {
      console.error('❌ No files provided');
      return NextResponse.json({ error: 'No se proporcionaron archivos' }, { status: 400 });
    }

    const uploadedImages: string[] = [];

    for (const file of files) {
      console.log('📤 Processing file:', file.name, 'size:', file.size, 'type:', file.type);

      // Validar tipo de archivo
      if (!allowedTypes.includes(file.type)) {
        console.error('❌ Invalid file type:', file.type);
        return NextResponse.json(
          {
            error: `Tipo de archivo no permitido: ${file.type}. Tipos permitidos: ${allowedTypes.join(', ')}`,
          },
          { status: 400 }
        );
      }

      // Validar tamaño
      if (file.size > maxFileSize) {
        console.error('❌ File too large:', file.size);
        return NextResponse.json(
          {
            error: `Archivo demasiado grande: ${file.size} bytes. Tamaño máximo: ${maxFileSize} bytes`,
          },
          { status: 400 }
        );
      }

      try {
        // Generar nombre único para el archivo
        const timestamp = Date.now();
        const randomString = Math.random().toString(36).substring(2, 15);
        const fileExtension = path.extname(file.name);
        const fileName = `image_${timestamp}_${randomString}${fileExtension}`;

        // Crear directorio si no existe
        const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'properties', propertyId);
        if (!existsSync(uploadDir)) {
          await mkdir(uploadDir, { recursive: true });
          console.log('📁 Created directory:', uploadDir);
        }

        // Guardar archivo localmente
        const filePath = path.join(uploadDir, fileName);
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        await writeFile(filePath, buffer);
        console.log('✅ File saved locally:', filePath);

        // Generar URL pública
        const publicUrl = `/api/uploads/properties/${propertyId}/${fileName}`;
        uploadedImages.push(publicUrl);
        console.log('🌐 Public URL generated:', publicUrl);
      } catch (fileError) {
        console.error('❌ Error processing file:', file.name, fileError);
        return NextResponse.json(
          {
            error: `Error procesando archivo ${file.name}: ${fileError}`,
          },
          { status: 500 }
        );
      }
    }

    if (uploadedImages.length === 0) {
      console.error('❌ No images were uploaded successfully');
      return NextResponse.json({ error: 'No se pudo subir ninguna imagen' }, { status: 500 });
    }

    // Obtener imágenes existentes
    const existingProperty = await db.property.findUnique({
      where: { id: propertyId },
      select: { images: true },
    });

    let existingImages: string[] = [];
    if (existingProperty?.images) {
      try {
        existingImages = Array.isArray(existingProperty.images)
          ? existingProperty.images
          : JSON.parse(existingProperty.images);
      } catch (error) {
        console.log('⚠️ Error parsing existing images, starting fresh');
        existingImages = [];
      }
    }

    // Combinar imágenes existentes con las nuevas
    const allImages = [...existingImages, ...uploadedImages];

    // Actualizar base de datos
    console.log('💾 Updating database with', allImages.length, 'images');
    await db.property.update({
      where: { id: propertyId },
      data: { images: JSON.stringify(allImages) },
    });

    console.log('✅ Database updated successfully');

    return NextResponse.json({
      success: true,
      message: `${uploadedImages.length} imagen(es) subida(s) exitosamente`,
      images: uploadedImages,
      totalImages: allImages.length,
    });
  } catch (error) {
    console.error('❌ Error in property image upload:', error);
    logger.error('Error in property image upload', { error });
    return NextResponse.json(
      {
        error: 'Error interno del servidor al subir imágenes',
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/properties/[id]/images
 * Elimina una imagen específica de una propiedad
 */
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  console.log('🗑️ DELETE /api/properties/[id]/images called for property:', params.id);

  try {
    // Verificar autenticación
    const user = await requireAuth(request);
    const propertyId = params.id;

    if (!propertyId) {
      return NextResponse.json({ error: 'ID de propiedad requerido' }, { status: 400 });
    }

    // Obtener URL de la imagen a eliminar
    const { searchParams } = new URL(request.url);
    const imageUrl = searchParams.get('url');

    if (!imageUrl) {
      return NextResponse.json({ error: 'URL de imagen requerida' }, { status: 400 });
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

    // Verificar permisos
    const canEdit =
      user.role === 'ADMIN' ||
      user.role === 'SUPER_ADMIN' ||
      (user.role === 'OWNER' && property.ownerId === user.id) ||
      (user.role === 'BROKER' && property.brokerId === user.id);

    if (!canEdit) {
      return NextResponse.json(
        { error: 'No tienes permisos para editar esta propiedad' },
        { status: 403 }
      );
    }

    // Obtener imágenes existentes
    let existingImages: string[] = [];
    if (property.images) {
      try {
        existingImages = Array.isArray(property.images)
          ? property.images
          : JSON.parse(property.images);
      } catch (error) {
        console.log('⚠️ Error parsing existing images');
        return NextResponse.json(
          { error: 'Error procesando imágenes existentes' },
          { status: 500 }
        );
      }
    }

    // Filtrar la imagen a eliminar
    const updatedImages = existingImages.filter(img => img !== imageUrl);

    // Actualizar base de datos
    await db.property.update({
      where: { id: propertyId },
      data: { images: JSON.stringify(updatedImages) },
    });

    console.log('✅ Image deleted from database');

    return NextResponse.json({
      success: true,
      message: 'Imagen eliminada exitosamente',
      remainingImages: updatedImages.length,
    });
  } catch (error) {
    console.error('❌ Error deleting property image:', error);
    logger.error('Error deleting property image', { error });
    return NextResponse.json(
      {
        error: 'Error interno del servidor al eliminar imagen',
      },
      { status: 500 }
    );
  }
}

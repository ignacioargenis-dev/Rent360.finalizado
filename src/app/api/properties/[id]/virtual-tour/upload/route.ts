import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { db } from '@/lib/db';
import { logger } from '@/lib/logger-minimal';
import { handleApiError } from '@/lib/api-error-handler';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';

/**
 * POST /api/properties/[id]/virtual-tour/upload
 * Sube imágenes para el tour virtual de una propiedad
 */
export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    // Verificar autenticación
    let user;
    try {
      user = await requireAuth(request);
    } catch (authError) {
      logger.error('Authentication error in virtual tour upload', { error: authError });
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
    const files = formData.getAll('scenes') as File[];

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

    // Crear directorio para el tour virtual
    const tourDir = join(process.cwd(), 'public', 'uploads', 'virtual-tours', propertyId);
    await mkdir(tourDir, { recursive: true });

    const uploadedScenes = [];

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
        const filename = `scene_${i + 1}_${timestamp}_${randomId}.${extension}`;
        const filepath = join(tourDir, filename);

        // Convertir File a Buffer y guardar
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);
        await writeFile(filepath, buffer);

        // Crear URL accesible desde el navegador
        const imageUrl = `/uploads/virtual-tours/${propertyId}/${filename}`;

        // Crear thumbnail (por simplicidad, usamos la misma imagen)
        const thumbnailUrl = imageUrl;

        uploadedScenes.push({
          id: `scene_${i + 1}`,
          name: `Escena ${i + 1}`,
          imageUrl,
          thumbnailUrl,
          description: `Escena ${i + 1} del tour virtual`,
          hotspots: [],
          originalFilename: file.name,
          size: file.size,
          type: file.type,
        });

        logger.info('Imagen de tour virtual subida', {
          propertyId,
          userId: user.id,
          filename,
          originalName: file.name,
          size: file.size,
        });
      } catch (fileError) {
        logger.error('Error subiendo imagen de tour virtual:', {
          error: fileError,
          propertyId,
          filename: file.name,
        });
        // Continuar con los otros archivos
      }
    }

    if (uploadedScenes.length === 0) {
      return NextResponse.json({ error: 'No se pudieron subir las imágenes' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      uploadedScenes,
      message: `${uploadedScenes.length} imagen(es) subida(s) exitosamente`,
    });
  } catch (error) {
    logger.error('Error subiendo imágenes del tour virtual:', { error });
    const errorResponse = handleApiError(error);
    return errorResponse;
  }
}

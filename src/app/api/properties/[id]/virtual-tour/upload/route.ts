import { NextRequest, NextResponse } from 'next/server';
import { requireAnyRole } from '@/lib/auth';
import { db } from '@/lib/db';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { getCloudStorageService } from '@/lib/cloud-storage';
import { logger } from '@/lib/logger-minimal';

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const propertyId = params.id;
    const decoded = await requireAnyRole(request, ['OWNER', 'BROKER', 'ADMIN']);

    // Verificar que la propiedad existe y pertenece al usuario
    const property = await db.property.findFirst({
      where: {
        id: propertyId,
        OR: [{ ownerId: decoded.id }, { brokerId: decoded.id }],
      },
    });

    if (!property) {
      return NextResponse.json(
        { error: 'Propiedad no encontrada o no tienes acceso' },
        { status: 404 }
      );
    }

    const formData = await request.formData();

    // Soportar tanto 'image' (singular) como 'images' (plural)
    let files: File[] = [];
    const singleFile = formData.get('image') as File | null;
    const multipleFiles = formData.getAll('images') as File[];

    if (singleFile && singleFile instanceof File) {
      files = [singleFile];
    } else if (multipleFiles && multipleFiles.length > 0) {
      files = multipleFiles.filter(f => f instanceof File);
    }

    if (files.length === 0) {
      return NextResponse.json({ error: 'No se encontraron archivos de imagen' }, { status: 400 });
    }

    const uploadedScenes: Array<{
      id: string;
      name: string;
      imageUrl: string;
      thumbnailUrl: string;
      hotspots: any[];
    }> = [];

    // Detectar si estamos en producción
    const isProduction = process.env.NODE_ENV === 'production' || !!process.env.DIGITALOCEAN_APP_ID;
    const hasCloudStorage = process.env.DO_SPACES_ACCESS_KEY && process.env.DO_SPACES_SECRET_KEY;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];

      // Verificar que el archivo existe
      if (!file) {
        continue;
      }

      // Validar tipo de archivo
      if (!file.type.startsWith('image/')) {
        logger.warn('Archivo no es imagen, saltando', { fileName: file.name, type: file.type });
        continue;
      }

      // Validar tamaño del archivo (máximo 10MB)
      if (file.size > 10 * 1024 * 1024) {
        logger.warn('Archivo muy grande, saltando', { fileName: file.name, size: file.size });
        continue;
      }

      // Generar nombre único para el archivo
      const timestamp = Date.now();
      const randomId = Math.random().toString(36).substring(2, 15);
      const extension = file.name.split('.').pop() || 'jpg';
      const filename = `scene_${i + 1}_${timestamp}_${randomId}.${extension}`;
      const sceneId = `scene_${timestamp}_${randomId}`;

      let imageUrl: string;

      if (isProduction && hasCloudStorage) {
        // Usar cloud storage en producción
        try {
          const cloudStorage = getCloudStorageService();
          const cloudKey = `virtual-tours/${propertyId}/${filename}`;
          const result = await cloudStorage.uploadFile(file, cloudKey, file.type);
          imageUrl = result.url;
          logger.info('Virtual tour image uploaded to cloud storage', { propertyId, cloudKey });
        } catch (cloudError) {
          logger.error('Error uploading to cloud storage', { error: cloudError });
          continue;
        }
      } else {
        // Usar almacenamiento local en desarrollo
        const uploadDir = join(process.cwd(), 'public', 'uploads', 'virtual-tours', propertyId);
        try {
          await mkdir(uploadDir, { recursive: true });
        } catch {
          // El directorio ya existe
        }

        const filepath = join(uploadDir, filename);
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);
        await writeFile(filepath, buffer);
        imageUrl = `/uploads/virtual-tours/${propertyId}/${filename}`;
      }

      // Crear escena
      uploadedScenes.push({
        id: sceneId,
        name: `Escena ${uploadedScenes.length + 1}`,
        imageUrl,
        thumbnailUrl: imageUrl,
        hotspots: [],
      });
    }

    if (uploadedScenes.length === 0) {
      return NextResponse.json({ error: 'No se pudo procesar ninguna imagen' }, { status: 400 });
    }

    logger.info('Virtual tour images uploaded', {
      propertyId,
      scenesCount: uploadedScenes.length,
    });

    return NextResponse.json({
      success: true,
      scenes: uploadedScenes,
      message: `${uploadedScenes.length} escena(s) agregada(s) exitosamente`,
    });
  } catch (error) {
    logger.error('Error uploading virtual tour image:', { error });
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { db } from '@/lib/db';
import { logger } from '@/lib/logger-minimal';
import { getCloudStorageService, generateFileKey, extractKeyFromUrl } from '@/lib/cloud-storage';
import { isAnyProvider, isServiceProvider, isMaintenanceProvider } from '@/lib/auth';

const maxFileSize = 10 * 1024 * 1024; // 10MB
const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'];

/**
 * POST /api/provider/services/[id]/images
 * Sube imágenes para un servicio específico usando cloud storage
 */
export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    // Verificar autenticación
    const user = await requireAuth(request);

    if (!isAnyProvider(user.role)) {
      return NextResponse.json(
        { error: 'Acceso denegado. Se requieren permisos de proveedor.' },
        { status: 403 }
      );
    }

    const serviceId = params.id;

    if (!serviceId) {
      return NextResponse.json({ error: 'ID de servicio requerido' }, { status: 400 });
    }

    // Obtener datos completos del usuario
    const fullUser = await db.user.findUnique({
      where: { id: user.id },
      include: {
        serviceProvider: true,
        maintenanceProvider: true,
      },
    });

    if (!fullUser) {
      return NextResponse.json({ error: 'Usuario no encontrado.' }, { status: 404 });
    }

    // Verificar que el servicio existe y pertenece al usuario
    let serviceExists = false;
    let providerId: string | null = null;

    if (isServiceProvider(user.role) && fullUser.serviceProvider) {
      const sp = fullUser.serviceProvider;
      providerId = sp.id;
      const serviceTypes = JSON.parse(sp.serviceTypes || '[]');

      // Buscar el servicio por ID
      for (const item of serviceTypes) {
        if (typeof item === 'object' && item !== null && item.id === serviceId) {
          serviceExists = true;
          break;
        } else if (typeof item === 'string') {
          // Migración: generar ID temporal para servicios legacy
          const legacyId = `svc_${sp.id}_${item.replace(/\s+/g, '_').toLowerCase()}`;
          if (legacyId === serviceId) {
            serviceExists = true;
            break;
          }
        }
      }
    } else if (isMaintenanceProvider(user.role) && fullUser.maintenanceProvider) {
      const mp = fullUser.maintenanceProvider;
      providerId = mp.id;
      const specialties = JSON.parse(mp.specialties || '[]');

      // Buscar el servicio por ID
      for (const item of specialties) {
        if (typeof item === 'object' && item !== null && item.id === serviceId) {
          serviceExists = true;
          break;
        } else if (typeof item === 'string') {
          // Migración: generar ID temporal para servicios legacy
          const legacyId = `mnt_${mp.id}_${item.replace(/\s+/g, '_').toLowerCase()}`;
          if (legacyId === serviceId) {
            serviceExists = true;
            break;
          }
        }
      }
    }

    if (!serviceExists) {
      return NextResponse.json({ error: 'Servicio no encontrado' }, { status: 404 });
    }

    // Parsear FormData
    const formData = await request.formData();
    const files = formData.getAll('image') as File[];

    if (files.length === 0) {
      return NextResponse.json({ error: 'No se encontraron archivos para subir' }, { status: 400 });
    }

    if (files.length > 10) {
      return NextResponse.json({ error: 'Máximo 10 imágenes por servicio' }, { status: 400 });
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

    logger.info(`Subiendo ${files.length} imágenes para servicio ${serviceId}`);

    const cloudStorage = getCloudStorageService();
    const uploadedImages: string[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];

      if (!file) {
        continue;
      }

      try {
        // Generar nombre único para el archivo
        const timestamp = Date.now();
        const randomId = Math.random().toString(36).substring(2, 15);
        const fileNameParts = file.name.split('.');
        const extension = fileNameParts.length > 1 ? fileNameParts.pop() : 'jpg';
        const filename = `service_${serviceId}_${i + 1}_${timestamp}_${randomId}.${extension}`;

        // Generar key para cloud storage
        const cloudKey = generateFileKey(`services/${serviceId}`, filename);

        logger.info('Subiendo imagen de servicio a cloud storage', {
          serviceId,
          cloudKey,
          originalName: file.name,
          fileSize: file.size,
        });

        // Subir a cloud storage
        const result = await cloudStorage.uploadFile(file, cloudKey, file.type);

        uploadedImages.push(result.url);

        logger.info('Imagen de servicio subida exitosamente', {
          serviceId,
          cloudKey,
          url: result.url,
        });
      } catch (fileError) {
        logger.error('Error subiendo imagen de servicio', {
          error: fileError,
          serviceId,
          fileName: file.name,
        });
        // Continuar con otros archivos
      }
    }

    if (uploadedImages.length === 0) {
      return NextResponse.json({ error: 'No se pudo subir ninguna imagen' }, { status: 500 });
    }

    // Obtener el servicio actual y sus imágenes existentes
    let currentImages: string[] = [];

    if (isServiceProvider(user.role) && fullUser.serviceProvider) {
      const sp = fullUser.serviceProvider;
      const serviceTypes = JSON.parse(sp.serviceTypes || '[]');

      // Buscar el servicio y obtener sus imágenes
      for (let i = 0; i < serviceTypes.length; i++) {
        const item = serviceTypes[i];
        if (typeof item === 'object' && item !== null && item.id === serviceId) {
          currentImages = Array.isArray(item.images) ? item.images : [];
          break;
        }
      }

      // Combinar imágenes existentes con las nuevas
      const allImages = [...currentImages, ...uploadedImages];

      // Actualizar el servicio en el array
      for (let i = 0; i < serviceTypes.length; i++) {
        const item = serviceTypes[i];
        if (typeof item === 'object' && item !== null && item.id === serviceId) {
          serviceTypes[i] = {
            ...item,
            images: allImages,
            updatedAt: new Date().toISOString(),
          };
          break;
        }
      }

      // Guardar en la base de datos
      await db.serviceProvider.update({
        where: { id: fullUser.serviceProvider.id },
        data: {
          serviceTypes: JSON.stringify(serviceTypes),
          updatedAt: new Date(),
        },
      });
    } else if (isMaintenanceProvider(user.role) && fullUser.maintenanceProvider) {
      const mp = fullUser.maintenanceProvider;
      const specialties = JSON.parse(mp.specialties || '[]');

      // Buscar el servicio y obtener sus imágenes
      for (let i = 0; i < specialties.length; i++) {
        const item = specialties[i];
        if (typeof item === 'object' && item !== null && item.id === serviceId) {
          currentImages = Array.isArray(item.images) ? item.images : [];
          break;
        }
      }

      // Combinar imágenes existentes con las nuevas
      const allImages = [...currentImages, ...uploadedImages];

      // Actualizar el servicio en el array
      for (let i = 0; i < specialties.length; i++) {
        const item = specialties[i];
        if (typeof item === 'object' && item !== null && item.id === serviceId) {
          specialties[i] = {
            ...item,
            images: allImages,
            updatedAt: new Date().toISOString(),
          };
          break;
        }
      }

      // Guardar en la base de datos
      await db.maintenanceProvider.update({
        where: { id: fullUser.maintenanceProvider.id },
        data: {
          specialties: JSON.stringify(specialties),
          updatedAt: new Date(),
        },
      });
    }

    logger.info('Servicio actualizado con nuevas imágenes', {
      serviceId,
      newImagesCount: uploadedImages.length,
      totalImagesCount: currentImages.length + uploadedImages.length,
    });

    return NextResponse.json({
      success: true,
      message: `${uploadedImages.length} imagen(es) subida(s) exitosamente`,
      uploadedImages,
      totalImages: currentImages.length + uploadedImages.length,
    });
  } catch (error) {
    logger.error('Error subiendo imágenes de servicio', { error });
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

/**
 * DELETE /api/provider/services/[id]/images?imageUrl=...
 * Elimina una imagen específica de un servicio
 */
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await requireAuth(request);

    if (!isAnyProvider(user.role)) {
      return NextResponse.json(
        { error: 'Acceso denegado. Se requieren permisos de proveedor.' },
        { status: 403 }
      );
    }

    const serviceId = params.id;
    const { searchParams } = new URL(request.url);
    const imageUrl = searchParams.get('imageUrl');

    if (!serviceId || !imageUrl) {
      return NextResponse.json({ error: 'ID de servicio e imagen requeridos' }, { status: 400 });
    }

    // Obtener datos completos del usuario
    const fullUser = await db.user.findUnique({
      where: { id: user.id },
      include: {
        serviceProvider: true,
        maintenanceProvider: true,
      },
    });

    if (!fullUser) {
      return NextResponse.json({ error: 'Usuario no encontrado.' }, { status: 404 });
    }

    let serviceUpdated = false;
    let currentImages: string[] = [];

    if (isServiceProvider(user.role) && fullUser.serviceProvider) {
      const sp = fullUser.serviceProvider;
      const serviceTypes = JSON.parse(sp.serviceTypes || '[]');

      // Buscar el servicio y obtener sus imágenes
      for (let i = 0; i < serviceTypes.length; i++) {
        const item = serviceTypes[i];
        if (typeof item === 'object' && item !== null && item.id === serviceId) {
          currentImages = Array.isArray(item.images) ? item.images : [];

          // Normalizar URL para comparación
          const normalizedImageUrl = imageUrl.split('?')[0];
          const updatedImages = currentImages.filter(
            (img: string) => img?.split('?')[0] !== normalizedImageUrl
          );

          // Actualizar el servicio
          serviceTypes[i] = {
            ...item,
            images: updatedImages,
            updatedAt: new Date().toISOString(),
          };

          serviceUpdated = true;
          currentImages = updatedImages;
          break;
        }
      }

      if (serviceUpdated) {
        await db.serviceProvider.update({
          where: { id: sp.id },
          data: {
            serviceTypes: JSON.stringify(serviceTypes),
            updatedAt: new Date(),
          },
        });
      }
    } else if (isMaintenanceProvider(user.role) && fullUser.maintenanceProvider) {
      const mp = fullUser.maintenanceProvider;
      const specialties = JSON.parse(mp.specialties || '[]');

      // Buscar el servicio y obtener sus imágenes
      for (let i = 0; i < specialties.length; i++) {
        const item = specialties[i];
        if (typeof item === 'object' && item !== null && item.id === serviceId) {
          currentImages = Array.isArray(item.images) ? item.images : [];

          // Normalizar URL para comparación
          const normalizedImageUrl = imageUrl.split('?')[0];
          const updatedImages = currentImages.filter(
            (img: string) => img?.split('?')[0] !== normalizedImageUrl
          );

          // Actualizar el servicio
          specialties[i] = {
            ...item,
            images: updatedImages,
            updatedAt: new Date().toISOString(),
          };

          serviceUpdated = true;
          currentImages = updatedImages;
          break;
        }
      }

      if (serviceUpdated) {
        await db.maintenanceProvider.update({
          where: { id: mp.id },
          data: {
            specialties: JSON.stringify(specialties),
            updatedAt: new Date(),
          },
        });
      }
    }

    if (!serviceUpdated) {
      return NextResponse.json({ error: 'Servicio no encontrado' }, { status: 404 });
    }

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
          logger.info('Imagen eliminada de cloud storage', { key, serviceId });
        }
      } catch (cloudError) {
        logger.warn('Error eliminando imagen de cloud storage', {
          error: cloudError,
          imageUrl,
          serviceId,
        });
      }
    }

    logger.info('Imagen eliminada de servicio', {
      serviceId,
      imageUrl: imageUrl.split('?')[0],
      remainingImages: currentImages.length,
    });

    return NextResponse.json({
      success: true,
      message: 'Imagen eliminada exitosamente',
      remainingImages: currentImages.length,
    });
  } catch (error) {
    logger.error('Error eliminando imagen de servicio', { error });
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { db } from '@/lib/db';
import { getCloudStorageService, generateFileKey } from '@/lib/cloud-storage';

const maxFileSize = 10 * 1024 * 1024; // 10MB
const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

/**
 * GET /api/runner/visits/[visitId]/photos
 * Obtiene las fotos de una visita específica
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { visitId: string } }
) {
  try {
    const user = await requireAuth(request);
    if (!user || user.role !== 'RUNNER') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const visit = await db.visit.findUnique({
      where: { id: params.visitId },
      include: {
        property: {
          include: {
            propertyImages: true,
          },
        },
        runner: true,
        tenant: true,
      },
    });

    if (!visit) {
      return NextResponse.json({ error: 'Visita no encontrada' }, { status: 404 });
    }

    // Verificar que el runner es el propietario de la visita
    if (visit.runnerId !== user.id) {
      return NextResponse.json({ error: 'No autorizado para ver esta visita' }, { status: 403 });
    }

    // Obtener fotos asociadas a esta visita
    const visitPhotos = visit.property.propertyImages
      .map((img) => {
        try {
          const metadata = img.alt ? JSON.parse(img.alt) : null;
          if (metadata && metadata.visitId === params.visitId) {
            return {
              id: img.id,
              url: img.url,
              filename: img.url.split('/').pop() || 'image.jpg',
              size: 0,
              uploadedAt: img.createdAt.toISOString(),
              category: metadata.category || 'general',
              description: metadata.description || '',
              isMain: metadata.isMain || false,
            };
          }
          return null;
        } catch {
          return null;
        }
      })
      .filter((photo) => photo !== null);

    return NextResponse.json({
      photos: visitPhotos,
      visit: {
        id: visit.id,
        propertyTitle: visit.property.title,
        propertyAddress: visit.property.address,
        scheduledAt: visit.scheduledAt.toISOString(),
        status: visit.status,
        photosTaken: visit.photosTaken,
      },
    });
  } catch (error: any) {
    console.error('Error fetching visit photos:', error);
    return NextResponse.json(
      { error: 'Error al obtener las fotos de la visita', details: error.message },
      { status: 500 }
    );
  }
}

/**
 * POST /api/runner/visits/[visitId]/photos
 * Sube fotos para una visita específica
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { visitId: string } }
) {
  try {
    const user = await requireAuth(request);
    if (!user || user.role !== 'RUNNER') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    // Verificar que la visita existe y pertenece al runner
    const visit = await db.visit.findUnique({
      where: { id: params.visitId },
      include: {
        property: true,
      },
    });

    if (!visit) {
      return NextResponse.json({ error: 'Visita no encontrada' }, { status: 404 });
    }

    if (visit.runnerId !== user.id) {
      return NextResponse.json(
        { error: 'No autorizado para subir fotos a esta visita' },
        { status: 403 }
      );
    }

    const formData = await request.formData();
    const files = formData.getAll('images') as File[];
    const category = formData.get('category') as string || 'general';
    const description = formData.get('description') as string || '';

    if (files.length === 0) {
      return NextResponse.json({ error: 'No se encontraron archivos para subir' }, { status: 400 });
    }

    if (files.length > 20) {
      return NextResponse.json({ error: 'Máximo 20 imágenes por visita' }, { status: 400 });
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

    const cloudStorage = getCloudStorageService();
    const uploadedImages = [];

    // Subir cada archivo
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (!file) {
        console.warn(`File at index ${i} is undefined, skipping`);
        continue;
      }
      try {
        // Generar nombre único para la imagen
        const timestamp = Date.now();
        const randomId = Math.random().toString(36).substring(2, 15);
        const fileNameParts = file.name.split('.');
        const extension = fileNameParts.length > 1 ? fileNameParts.pop() : 'jpg';
        const filename = `visit_${params.visitId}_${i + 1}_${timestamp}_${randomId}.${extension}`;

        // Generar key para cloud storage
        const cloudKey = generateFileKey(visit.propertyId, filename);

        // Subir a cloud storage
        const result = await cloudStorage.uploadFile(file, cloudKey, file.type);

        // Crear PropertyImage con metadata en el campo 'alt' para asociar con la visita
        const metadata = JSON.stringify({
          visitId: params.visitId,
          category: category,
          description: description,
          isMain: i === 0, // La primera foto es la principal
          uploadedBy: user.id,
        });

        const propertyImage = await db.propertyImage.create({
          data: {
            propertyId: visit.propertyId,
            url: result.url,
            alt: metadata,
            order: uploadedImages.length,
          },
        }) as { id: string; url: string; createdAt: Date };

        uploadedImages.push({
          id: propertyImage.id,
          url: propertyImage.url,
          filename: filename,
          size: file.size,
          uploadedAt: propertyImage.createdAt.toISOString(),
          category: category,
          description: description,
          isMain: i === 0,
        });
      } catch (error: any) {
        console.error(`Error uploading file ${file.name}:`, error);
        // Continuar con el siguiente archivo
        continue;
      }
    }

    if (uploadedImages.length === 0) {
      return NextResponse.json(
        { error: 'No se pudieron subir las imágenes' },
        { status: 500 }
      );
    }

    // Actualizar el contador de fotos en la visita
    const totalPhotos = visit.photosTaken + uploadedImages.length;
    await db.visit.update({
      where: { id: params.visitId },
      data: {
        photosTaken: totalPhotos,
        // Si es la primera vez que se suben fotos, cambiar status a COMPLETED
        status: visit.status === 'SCHEDULED' ? 'COMPLETED' : visit.status,
      },
    });

    return NextResponse.json({
      message: `${uploadedImages.length} foto(s) subida(s) exitosamente`,
      photos: uploadedImages,
      visit: {
        id: visit.id,
        photosTaken: totalPhotos,
      },
    });
  } catch (error: any) {
    console.error('Error uploading visit photos:', error);
    return NextResponse.json(
      { error: 'Error al subir las fotos', details: error.message },
      { status: 500 }
    );
  }
}


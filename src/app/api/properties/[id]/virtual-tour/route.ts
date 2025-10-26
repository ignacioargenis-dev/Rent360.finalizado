import { NextRequest, NextResponse } from 'next/server';
import { requireAnyRole } from '@/lib/auth';
import { db } from '@/lib/db';

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
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

    // Obtener configuración del tour virtual
    const virtualTour = await db.virtualTour.findFirst({
      where: { propertyId },
      include: {
        scenes: {
          include: {
            hotspots: true,
          },
          orderBy: { order: 'asc' },
        },
      },
    });

    if (!virtualTour) {
      return NextResponse.json({
        enabled: false,
        title: '',
        description: '',
        scenes: [],
      });
    }

    return NextResponse.json({
      enabled: virtualTour.enabled,
      title: virtualTour.title,
      description: virtualTour.description,
      scenes: virtualTour.scenes.map(scene => ({
        id: scene.id,
        name: scene.name,
        imageUrl: scene.imageUrl,
        thumbnailUrl: scene.thumbnailUrl,
        description: scene.description,
        audioUrl: scene.audioUrl,
        duration: scene.duration,
        hotspots: scene.hotspots.map(hotspot => ({
          id: hotspot.id,
          x: hotspot.x,
          y: hotspot.y,
          type: hotspot.type,
          targetSceneId: hotspot.targetSceneId,
          title: hotspot.title,
          description: hotspot.description,
          linkUrl: hotspot.linkUrl,
          mediaUrl: hotspot.mediaUrl,
        })),
      })),
    });
  } catch (error) {
    console.error('Error fetching virtual tour:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

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

    const body = await request.json();
    const { enabled, title, description, scenes } = body;

    // Usar una transacción para actualizar el tour virtual
    await db.$transaction(async tx => {
      // Actualizar o crear el tour virtual
      const virtualTour = await tx.virtualTour.upsert({
        where: { propertyId },
        update: {
          enabled,
          title,
          description,
          updatedAt: new Date(),
        },
        create: {
          propertyId,
          enabled,
          title,
          description,
        },
      });

      // Eliminar escenas existentes
      await tx.virtualTourScene.deleteMany({
        where: { virtualTourId: virtualTour.id },
      });

      // Crear nuevas escenas
      if (scenes && scenes.length > 0) {
        for (let i = 0; i < scenes.length; i++) {
          const scene = scenes[i];
          const newScene = await tx.virtualTourScene.create({
            data: {
              virtualTourId: virtualTour.id,
              name: scene.name,
              imageUrl: scene.imageUrl,
              thumbnailUrl: scene.thumbnailUrl,
              description: scene.description,
              audioUrl: scene.audioUrl,
              duration: scene.duration,
              order: i,
            },
          });

          // Crear hotspots si existen
          if (scene.hotspots && scene.hotspots.length > 0) {
            await tx.virtualTourHotspot.createMany({
              data: scene.hotspots.map((hotspot: any) => ({
                sceneId: newScene.id,
                x: hotspot.x,
                y: hotspot.y,
                type: hotspot.type,
                targetSceneId: hotspot.targetSceneId,
                title: hotspot.title,
                description: hotspot.description,
                linkUrl: hotspot.linkUrl,
                mediaUrl: hotspot.mediaUrl,
              })),
            });
          }
        }
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Tour virtual guardado exitosamente',
    });
  } catch (error) {
    console.error('Error saving virtual tour:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

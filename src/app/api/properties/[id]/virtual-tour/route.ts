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
        success: true,
        tour: {
          isEnabled: false,
          title: '',
          description: '',
          scenes: [],
          autoPlay: false,
          showControls: true,
          allowFullscreen: true,
        },
      });
    }

    return NextResponse.json({
      success: true,
      tour: {
        isEnabled: virtualTour.enabled,
        title: virtualTour.title,
        description: virtualTour.description,
        autoPlay: false,
        showControls: true,
        allowFullscreen: true,
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
      },
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
    // Soportar tanto 'enabled' como 'isEnabled' del frontend
    const enabled = body.enabled ?? body.isEnabled ?? false;
    const { title, description, scenes } = body;

    console.log('📺 [VIRTUAL-TOUR] Guardando tour virtual:', {
      propertyId,
      enabled,
      title,
      scenesCount: scenes?.length || 0,
    });

    // Usar una transacción para actualizar el tour virtual
    await db.$transaction(async tx => {
      // Actualizar o crear el tour virtual
      const virtualTour = await tx.virtualTour.upsert({
        where: { propertyId },
        update: {
          enabled: Boolean(enabled),
          title: title || '',
          description: description || '',
          updatedAt: new Date(),
        },
        create: {
          propertyId,
          enabled: Boolean(enabled),
          title: title || '',
          description: description || '',
        },
      });

      console.log('✅ [VIRTUAL-TOUR] Tour creado/actualizado:', virtualTour.id);

      // Eliminar escenas existentes
      await tx.virtualTourScene.deleteMany({
        where: { virtualTourId: virtualTour.id },
      });

      // Crear nuevas escenas
      if (scenes && scenes.length > 0) {
        console.log('🎬 [VIRTUAL-TOUR] Creando', scenes.length, 'escenas');
        for (let i = 0; i < scenes.length; i++) {
          const scene = scenes[i];
          if (!scene) {
            continue;
          }

          const newScene = await tx.virtualTourScene.create({
            data: {
              virtualTourId: virtualTour.id,
              name: scene.name || `Escena ${i + 1}`,
              imageUrl: scene.imageUrl || '',
              thumbnailUrl: scene.thumbnailUrl || scene.imageUrl || '',
              description: scene.description || null,
              audioUrl: scene.audioUrl || null,
              duration: scene.duration || null,
              order: i,
            },
          });

          console.log('✅ [VIRTUAL-TOUR] Escena creada:', newScene.id, newScene.name);

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

    console.log('✅ [VIRTUAL-TOUR] Tour virtual guardado exitosamente');

    return NextResponse.json({
      success: true,
      message: 'Tour virtual guardado exitosamente',
    });
  } catch (error) {
    console.error('❌ [VIRTUAL-TOUR] Error saving virtual tour:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Error interno del servidor',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

// PUT method - alias for POST (update tour configuration)
export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  return POST(request, { params });
}

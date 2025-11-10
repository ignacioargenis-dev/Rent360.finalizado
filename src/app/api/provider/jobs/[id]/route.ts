import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, isAnyProvider } from '@/lib/auth';
import { db } from '@/lib/db';
import { logger } from '@/lib/logger-minimal';
import { handleApiError } from '@/lib/api-error-handler';

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await requireAuth(request);

    if (!isAnyProvider(user.role)) {
      return NextResponse.json(
        { error: 'Acceso no autorizado. Solo para proveedores.' },
        { status: 403 }
      );
    }

    const jobId = params.id;

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

    const providerId = fullUser.serviceProvider?.id || fullUser.maintenanceProvider?.id;

    if (!providerId) {
      return NextResponse.json(
        { error: 'Usuario no tiene un perfil de proveedor válido.' },
        { status: 403 }
      );
    }

    // Buscar el trabajo específico
    const job = await db.serviceJob.findFirst({
      where: {
        id: jobId,
        serviceProviderId: providerId,
      },
      include: {
        requester: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
      },
    });

    if (!job) {
      return NextResponse.json(
        { error: 'Trabajo no encontrado o no tienes acceso a él.' },
        { status: 404 }
      );
    }

    // Transformar datos para el frontend
    const transformedJob = {
      id: job.id,
      title: job.title,
      description: job.description,
      serviceType: job.serviceType,
      status: job.status,
      progress: job.progress || 0,
      price: job.finalPrice || job.basePrice,
      scheduledDate: job.scheduledDate?.toISOString() || job.createdAt.toISOString(),
      createdAt: job.createdAt.toISOString(),
      clientName: job.requester.name || 'Cliente',
      clientEmail: job.requester.email || '',
      clientPhone: job.requester.phone || '',
      notes: job.notes || '',
      images: job.images ? JSON.parse(job.images) : [],
    };

    logger.info('Trabajo obtenido por provider', {
      jobId,
      providerId: user.id,
      status: job.status,
    });

    return NextResponse.json({
      success: true,
      job: transformedJob,
    });
  } catch (error) {
    logger.error('Error obteniendo trabajo específico del provider:', {
      error: error instanceof Error ? error.message : String(error),
      jobId: params.id,
    });
    const errorResponse = handleApiError(error);
    return errorResponse;
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, isAnyProvider } from '@/lib/auth';
import { db } from '@/lib/db';
import { logger } from '@/lib/logger-minimal';
import { NotificationService, NotificationType } from '@/lib/notification-service';

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await requireAuth(request);

    if (!isAnyProvider(user.role)) {
      return NextResponse.json(
        { error: 'Acceso no autorizado. Solo para proveedores.' },
        { status: 403 }
      );
    }

    const jobId = params.id;
    const body = await request.json();
    const { status, progress, notes } = body;

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

    // Verificar que el trabajo pertenece al provider
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

    // Actualizar el trabajo
    const updateData: any = {};
    if (status) {
      updateData.status = status;
    }
    if (progress !== undefined && progress !== null) {
      updateData.progress = progress;
    }
    if (notes) {
      updateData.notes = notes;
    }

    const updatedJob = await db.serviceJob.update({
      where: { id: jobId },
      data: updateData,
    });

    console.log('🚨🚨🚨 [JOB PROGRESS] Trabajo actualizado:', {
      jobId,
      providerId: user.id,
      newStatus: status,
      progress,
      notes,
      updateData,
    });

    // Verificar el estado final del trabajo
    const finalJob = await db.serviceJob.findUnique({
      where: { id: jobId },
      select: { id: true, status: true, progress: true },
    });
    console.log('🚨🚨🚨 [JOB PROGRESS] Estado final en BD:', finalJob);

    // Si el trabajo se completa, enviar notificación al cliente
    if (status === 'COMPLETED') {
      try {
        await NotificationService.create({
          userId: job.requester.id,
          type: 'SERVICE_REQUEST_ACCEPTED', // Usando un tipo existente para trabajos completados
          title: 'Trabajo completado',
          message: `El trabajo "${job.title}" ha sido completado exitosamente.`,
          link: `/tenant/jobs/${jobId}`,
        });
      } catch (notificationError) {
        logger.warn('Error enviando notificación de trabajo completado:', notificationError);
      }
    }

    return NextResponse.json({
      success: true,
      job: {
        id: updatedJob.id,
        status: updatedJob.status,
        progress: updatedJob.progress,
        notes: updatedJob.notes,
      },
    });
  } catch (error) {
    console.error('❌ [JOB PROGRESS] Error actualizando progreso del trabajo:', error);
    logger.error('Error actualizando progreso del trabajo:', {
      error: error instanceof Error ? error.message : String(error),
      jobId: params.id,
    });
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

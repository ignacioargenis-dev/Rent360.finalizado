import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { MaintenancePaymentService } from '@/lib/maintenance-payment-service';
import { logger } from '@/lib/logger-minimal';
import { handleApiError } from '@/lib/api-error-handler';

/**
 * GET /api/maintenance/[id]/payment/status
 * Obtiene el estado del pago asociado a un trabajo de mantenimiento
 */
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await requireAuth(request);
    const maintenanceId = params.id;

    // Verificar que el usuario tiene acceso a este mantenimiento
    const { db } = await import('@/lib/db');
    const maintenance = await db.maintenance.findUnique({
      where: { id: maintenanceId },
      include: {
        property: {
          select: {
            ownerId: true,
            brokerId: true,
          },
        },
      },
    });

    if (!maintenance) {
      return NextResponse.json(
        { error: 'Trabajo de mantenimiento no encontrado' },
        { status: 404 }
      );
    }

    // Verificar permisos: solo owner, broker o admin pueden ver el estado del pago
    const hasPermission =
      user.role === 'ADMIN' ||
      (user.role === 'OWNER' && maintenance.property.ownerId === user.id) ||
      (user.role === 'BROKER' && maintenance.property.brokerId === user.id);

    if (!hasPermission) {
      return NextResponse.json(
        { error: 'No tienes permisos para ver el estado del pago' },
        { status: 403 }
      );
    }

    // Obtener estado del pago
    const paymentStatus = await MaintenancePaymentService.getPaymentStatus(maintenanceId);

    if (!paymentStatus) {
      return NextResponse.json({
        success: true,
        data: null,
        message: 'No hay pago asociado a este trabajo',
      });
    }

    return NextResponse.json({
      success: true,
      data: paymentStatus,
    });
  } catch (error) {
    logger.error('Error obteniendo estado del pago:', {
      maintenanceId: params.id,
      error: error instanceof Error ? error.message : String(error),
    });
    return handleApiError(error);
  }
}

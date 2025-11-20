import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { db } from '@/lib/db';
import { logger } from '@/lib/logger-minimal';
import { handleApiError } from '@/lib/api-error-handler';
import { NotificationService, NotificationType } from '@/lib/notification-service';

/**
 * POST /api/maintenance/[id]/quote/approve
 * Aprobar una cotización de mantenimiento
 */
export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await requireAuth(request);
    const maintenanceId = params.id;

    // Verificar que la solicitud existe
    const maintenance = await db.maintenance.findUnique({
      where: { id: maintenanceId },
      include: {
        property: {
          select: {
            id: true,
            title: true,
            address: true,
            ownerId: true,
            brokerId: true,
          },
        },
        maintenanceProvider: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
        requester: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    if (!maintenance) {
      return NextResponse.json(
        { error: 'Solicitud de mantenimiento no encontrada' },
        { status: 404 }
      );
    }

    // Verificar permisos: solo owner o broker pueden aprobar
    const hasPermission =
      user.role === 'ADMIN' ||
      (user.role === 'OWNER' && maintenance.property.ownerId === user.id) ||
      (user.role === 'BROKER' && maintenance.property.brokerId === user.id);

    if (!hasPermission) {
      return NextResponse.json(
        { error: 'No tienes permisos para aprobar esta cotización' },
        { status: 403 }
      );
    }

    if (maintenance.status !== 'QUOTE_PENDING') {
      return NextResponse.json(
        { error: 'Esta solicitud no tiene una cotización pendiente' },
        { status: 400 }
      );
    }

    // Obtener datos del body para el método de pago (opcional)
    let paymentMethod: 'khipu' | 'stripe' | 'paypal' | 'webpay' | undefined;
    let paymentMethodId: string | undefined;
    try {
      const body = await request.json().catch(() => ({}));
      paymentMethod = body.paymentMethod;
      paymentMethodId = body.paymentMethodId;
    } catch {
      // Si no hay body, continuar sin autorizar pago (se puede hacer después)
    }

    // Si se proporciona método de pago, autorizar el pago
    if (paymentMethod) {
      try {
        const { MaintenancePaymentService } = await import('@/lib/maintenance-payment-service');
        const amount = maintenance.estimatedCost || maintenance.actualCost || 0;
        if (amount > 0) {
          const authResult = await MaintenancePaymentService.authorizePayment({
            maintenanceId,
            clientId: user.id,
            amount,
            paymentMethod,
            ...(paymentMethodId && { paymentMethodId }),
          });

          if (!authResult.success) {
            logger.warn('Error autorizando pago al aprobar cotización:', {
              maintenanceId,
              error: authResult.error,
            });
            // Continuar con la aprobación aunque falle la autorización del pago
          } else if (authResult.paymentUrl) {
            // Si hay URL de pago (Khipu), incluirla en la respuesta
            logger.info('Pago autorizado exitosamente al aprobar cotización', {
              maintenanceId,
              paymentId: authResult.paymentId,
            });
          }
        }
      } catch (paymentError) {
        logger.warn('Error autorizando pago (no crítico):', {
          maintenanceId,
          error: paymentError instanceof Error ? paymentError.message : String(paymentError),
        });
        // Continuar con la aprobación aunque falle la autorización del pago
      }
    }

    // Actualizar el estado a QUOTE_APPROVED
    const updatedMaintenance = await db.maintenance.update({
      where: { id: maintenanceId },
      data: {
        status: 'QUOTE_APPROVED',
        notes: maintenance.notes
          ? `${maintenance.notes}\n\n[${new Date().toLocaleString()}]: Cotización aprobada por ${user.name || 'Sistema'}`
          : `[${new Date().toLocaleString()}]: Cotización aprobada por ${user.name || 'Sistema'}`,
        updatedAt: new Date(),
      },
    });

    // Notificar al proveedor
    if (maintenance.maintenanceProvider?.user) {
      try {
        await NotificationService.create({
          userId: maintenance.maintenanceProvider.user.id,
          type: NotificationType.MAINTENANCE_REQUEST,
          title: 'Cotización Aprobada',
          message: `Tu cotización de $${maintenance.estimatedCost?.toLocaleString('es-CL') || 'N/A'} para "${maintenance.title}" ha sido aprobada. Puedes proceder a programar la visita.`,
          link: `/maintenance/jobs/${maintenanceId}`,
          metadata: {
            maintenanceId: maintenance.id,
            maintenanceTitle: maintenance.title,
            approvedBy: user.name || 'Sistema',
          },
        });
      } catch (notificationError) {
        logger.error('Error enviando notificación al proveedor:', {
          error: notificationError,
        });
      }
    }

    // Notificar al solicitante (inquilino)
    if (maintenance.requester && maintenance.requester.id !== user.id) {
      try {
        await NotificationService.create({
          userId: maintenance.requester.id,
          type: NotificationType.MAINTENANCE_REQUEST,
          title: 'Cotización de Mantenimiento Aprobada',
          message: `La cotización para "${maintenance.title}" ha sido aprobada. El trabajo será programado próximamente.`,
          link: `/tenant/maintenance/${maintenanceId}`,
          metadata: {
            maintenanceId: maintenance.id,
            maintenanceTitle: maintenance.title,
          },
        });
      } catch (notificationError) {
        logger.error('Error enviando notificación al solicitante:', {
          error: notificationError,
        });
      }
    }

    logger.info('Cotización aprobada exitosamente:', {
      maintenanceId,
      approvedBy: user.id,
    });

    return NextResponse.json({
      message: 'Cotización aprobada exitosamente',
      maintenance: updatedMaintenance,
    });
  } catch (error) {
    logger.error('Error aprobando cotización:', {
      maintenanceId: params.id,
      error: error instanceof Error ? error.message : String(error),
    });
    return handleApiError(error);
  }
}

import { logger } from '@/lib/logger';
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { handleApiError } from '@/lib/api-error-handler';
import { SignatureStatus } from '@/lib/signature';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Verificar que es una notificación válida
    if (!body.signatureId || !body.status) {
      return NextResponse.json(
        { error: 'Datos de webhook inválidos' },
        { status: 400 },
      );
    }

    const { signatureId, status, provider, metadata } = body as {
      signatureId: string;
      status: string;
      provider: string;
      metadata?: Record<string, any>;
    };

    // Buscar la firma en la base de datos
    const signature = await db.contractSignature.findUnique({
      where: { id: signatureId },
    });

    if (!signature) {
      return NextResponse.json(
        { error: 'Firma no encontrada' },
        { status: 404 },
      );
    }

    // Mapear el estado del proveedor al estado interno
    let internalStatus: SignatureStatus;
    switch (status.toLowerCase()) {
      case 'completed':
      case 'signed':
        internalStatus = SignatureStatus.COMPLETED;
        break;
      case 'failed':
      case 'error':
        internalStatus = SignatureStatus.FAILED;
        break;
      case 'expired':
        internalStatus = SignatureStatus.EXPIRED;
        break;
      case 'cancelled':
        internalStatus = SignatureStatus.CANCELLED;
        break;
      case 'in_progress':
      case 'pending':
        internalStatus = SignatureStatus.IN_PROGRESS;
        break;
      default:
        internalStatus = SignatureStatus.PENDING;
    }

    // Actualizar el estado de la firma
    await db.contractSignature.update({
      where: { id: signatureId },
      data: {
        signatureData: JSON.stringify({
          status: internalStatus,
          provider,
          metadata: metadata ? metadata as Record<string, any> : {},
          updatedAt: new Date().toISOString(),
        }),
        updatedAt: new Date(),
      },
    });

    // Crear notificación para el usuario
    const notificationData = {
      signatureId,
      status: internalStatus,
      provider,
    };
    
    await db.notification.create({
      data: {
        userId: signature.signerId, // Obtener el ID del firmante del contrato
        type: 'INFO',
        title: 'Actualización de Firma',
        message: `La firma del documento ha sido ${internalStatus}`,
        isRead: false,
        data: JSON.stringify(notificationData),
        createdAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Webhook procesado correctamente',
    });

  } catch (error) {
    logger.error('Error processing signature webhook:', { 
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });
    return handleApiError(error);
  }
}

export async function GET(request: NextRequest) {
  // Endpoint para verificar que el webhook está funcionando
  return NextResponse.json({
    success: true,
    message: 'Signature webhook endpoint is active',
    timestamp: new Date().toISOString(),
  });
}

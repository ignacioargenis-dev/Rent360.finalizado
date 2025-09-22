import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { signatureService } from '@/lib/signature';
import { logger } from '@/lib/logger';
import { db } from '@/lib/db';

/**
 * GET /api/signatures/[id] - Obtener detalles de una firma específica
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireAuth(request);
    const signatureId = params.id;

    // Obtener firma desde la base de datos
    const signature = await db.signatureRequest.findUnique({
      where: { id: signatureId },
      include: {
        signers: true
      }
    });

    if (!signature) {
      return NextResponse.json(
        { error: 'Firma no encontrada' },
        { status: 404 }
      );
    }

    // Verificar permisos (solo firmantes o admin pueden ver)
    const isSigner = signature.signers.some(s => s.email === user.email);
    const isAdmin = user.role === 'ADMIN';

    if (!isSigner && !isAdmin) {
      return NextResponse.json(
        { error: 'No tienes permisos para ver esta firma' },
        { status: 403 }
      );
    }

    // Obtener estado actualizado desde el proveedor si está en progreso
    let currentStatus = signature.status;
    if (signature.status === 'IN_PROGRESS' || signature.status === 'PENDING') {
      try {
        currentStatus = await signatureService.getSignatureStatus(signatureId);

        // Actualizar en BD si cambió
        if (currentStatus !== signature.status) {
          await db.signatureRequest.update({
            where: { id: signatureId },
            data: {
              status: currentStatus
            }
          });
        }
      } catch (error) {
        logger.warn('Error obteniendo estado actualizado de firma:', {
          signatureId,
          error: error instanceof Error ? error.message : String(error)
        });
        // Continuar con el estado de BD si falla la consulta
      }
    }

    logger.info('Detalles de firma consultados:', {
      signatureId,
      userId: user.id,
      status: currentStatus
    });

    return NextResponse.json({
      data: {
        ...signature,
        currentStatus
      }
    });

  } catch (error) {
    logger.error('Error obteniendo firma:', {
      error: error instanceof Error ? error.message : String(error),
      signatureId: params.id
    });

    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/signatures/[id] - Cancelar una firma
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireAuth(request);
    const signatureId = params.id;

    // Obtener firma desde la base de datos
    const signature = await db.signatureRequest.findUnique({
      where: { id: signatureId },
      include: {
        signers: true
      }
    });

    if (!signature) {
      return NextResponse.json(
        { error: 'Firma no encontrada' },
        { status: 404 }
      );
    }

    // Verificar permisos (solo firmantes o admin pueden cancelar)
    const isSigner = signature.signers.some(s => s.email === user.email);
    const isAdmin = user.role === 'ADMIN';

    if (!isSigner && !isAdmin) {
      return NextResponse.json(
        { error: 'No tienes permisos para cancelar esta firma' },
        { status: 403 }
      );
    }

    // Verificar que no esté ya completada
    if (signature.status === 'COMPLETED') {
      return NextResponse.json(
        { error: 'No se puede cancelar una firma completada' },
        { status: 400 }
      );
    }

    // Cancelar en el proveedor
    const cancelResult = await signatureService.cancelSignatureRequest(signatureId);

    if (!cancelResult) {
      logger.warn('Error cancelando firma en proveedor:', { signatureId });
      // Continuar con cancelación en BD aunque falle en proveedor
    }

    // Cancelar en base de datos
    await db.signatureRequest.update({
      where: { id: signatureId },
      data: {
        status: 'CANCELLED',
        cancelledAt: new Date(),
        metadata: {
          ...signature.metadata,
          cancelledBy: user.id,
          cancelledAt: new Date().toISOString()
        }
      }
    });

    // Crear entrada en el log de auditoría
    await db.auditLog.create({
      data: {
        action: 'SIGNATURE_CANCELLED',
        entityType: 'SIGNATURE',
        entityId: signatureId,
        userId: user.id,
        details: {
          provider: signature.provider,
          originalStatus: signature.status
        },
        ipAddress: request.headers.get('x-forwarded-for') || request.ip || 'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown'
      }
    });

    logger.info('Firma cancelada exitosamente:', {
      signatureId,
      userId: user.id,
      provider: signature.provider
    });

    return NextResponse.json({
      success: true,
      message: 'Firma cancelada exitosamente'
    });

  } catch (error) {
    logger.error('Error cancelando firma:', {
      error: error instanceof Error ? error.message : String(error),
      signatureId: params.id
    });

    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

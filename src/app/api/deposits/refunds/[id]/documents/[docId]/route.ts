import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { logger } from '@/lib/logger-minimal';
import { requireAuth } from '@/lib/auth';

// DELETE - Eliminar documento
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; docId: string } }
) {
  try {
    const user = await requireAuth(request);
    const { id: refundId, docId } = params;

    // Verificar que la solicitud de devolución existe
    const refund = await db.depositRefund.findUnique({
      where: { id: refundId },
      include: {
        tenant: true,
        owner: true,
      }
    });

    if (!refund) {
      return NextResponse.json(
        { error: 'Solicitud de devolución no encontrada' },
        { status: 404 }
      );
    }

    // Obtener el documento
    const document = await db.refundDocument.findUnique({
      where: { id: docId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          }
        }
      }
    });

    if (!document) {
      return NextResponse.json(
        { error: 'Documento no encontrado' },
        { status: 404 }
      );
    }

    // Verificar que el documento pertenece a la solicitud
    if (document.refundId !== refundId) {
      return NextResponse.json(
        { error: 'Documento no pertenece a esta solicitud' },
        { status: 400 }
      );
    }

    // Verificar permisos: solo quien subió el documento o admin puede eliminarlo
    if (user.role !== 'ADMIN' && user.id !== document.uploadedBy) {
      return NextResponse.json(
        { error: 'No tienes permisos para eliminar este documento' },
        { status: 403 }
      );
    }

    // Verificar que la solicitud no esté procesada
    if (refund.status === 'PROCESSED') {
      return NextResponse.json(
        { error: 'No se pueden eliminar documentos de una solicitud ya procesada' },
        { status: 400 }
      );
    }

    // Eliminar el documento
    await db.refundDocument.delete({
      where: { id: docId }
    });

    // Crear log de auditoría
    await db.refundAuditLog.create({
      data: {
        refundId,
        userId: user.id,
        action: 'DOCUMENT_DELETED',
        details: `Documento eliminado: ${document.fileName} (${document.documentType})`,
        ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
        userAgent: request.headers.get('user-agent'),
      }
    });

    // Enviar notificación al otro usuario
    const otherPartyId = user.id === refund.tenantId ? refund.ownerId : refund.tenantId;
    
    await db.notification.create({
      data: {
        userId: otherPartyId,
        title: 'Documento Eliminado',
        message: `${user.name} ha eliminado el documento: ${document.fileName}`,
        type: 'WARNING',
        data: JSON.stringify({
          refundId,
          documentId: docId,
          documentType: document.documentType,
          deletedBy: user.name,
        }),
      }
    });

    logger.info('Documento eliminado:', {
      refundId,
      documentId: docId,
      userId: user.id,
      fileName: document.fileName,
      documentType: document.documentType,
    });

    return NextResponse.json({
      success: true,
      message: 'Documento eliminado exitosamente'
    });

  } catch (error) {
    logger.error('Error eliminando documento:', {
      error: error instanceof Error ? error.message : String(error),
      refundId: params.id,
      documentId: params.docId,
      userId: request.headers.get('user-id'),
    });

    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

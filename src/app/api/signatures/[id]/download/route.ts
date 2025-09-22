import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { signatureService } from '@/lib/signature';
import { logger } from '@/lib/logger';
import { db } from '@/lib/db';

/**
 * GET /api/signatures/[id]/download - Descargar documento firmado
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

    // Verificar que la firma esté completada
    if (signature.status !== 'COMPLETED') {
      return NextResponse.json(
        { error: 'La firma no está completada aún' },
        { status: 400 }
      );
    }

    // Verificar permisos (solo el creador, firmantes o admin pueden descargar)
    const isCreator = signature.createdBy === user.id;
    const isSigner = signature.signers.some(s => s.email === user.email);
    const isAdmin = user.role === 'ADMIN';
    const isContractParty = signature.document.contract.ownerId === user.id ||
                           signature.document.contract.tenantId === user.id;

    if (!isCreator && !isSigner && !isAdmin && !isContractParty) {
      return NextResponse.json(
        { error: 'No tienes permisos para descargar este documento' },
        { status: 403 }
      );
    }

    // Descargar documento desde el proveedor
    const documentBuffer = await signatureService.downloadSignedDocument(signatureId);

    if (!documentBuffer) {
      logger.error('Error descargando documento firmado:', { signatureId });
      return NextResponse.json(
        { error: 'Error descargando documento' },
        { status: 500 }
      );
    }

    // Crear entrada en el log de auditoría
    await db.auditLog.create({
      data: {
        action: 'DOCUMENT_DOWNLOADED',
        entityType: 'SIGNATURE',
        entityId: signatureId,
        userId: user.id,
        details: {
          documentId: signature.documentId,
          fileSize: documentBuffer.length,
          provider: signature.provider
        },
        ipAddress: request.headers.get('x-forwarded-for') || request.ip || 'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown'
      }
    });

    logger.info('Documento firmado descargado exitosamente:', {
      signatureId,
      userId: user.id,
      documentId: signature.documentId,
      fileSize: documentBuffer.length,
      provider: signature.provider
    });

    // Retornar el documento como respuesta binaria
    return new NextResponse(documentBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="documento-firmado-${signatureId}.pdf"`,
        'Content-Length': documentBuffer.length.toString(),
        'Cache-Control': 'private, no-cache'
      }
    });

  } catch (error) {
    logger.error('Error descargando documento firmado:', {
      error: error instanceof Error ? error.message : String(error),
      signatureId: params.id
    });

    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

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

    // Verificar permisos (firmantes o admin pueden descargar)
    const isSigner = signature.signers.some(s => s.email === user.email);
    const isAdmin = user.role === 'ADMIN';

    if (!isSigner && !isAdmin) {
      return NextResponse.json(
        { error: 'No tienes permisos para descargar este documento' },
        { status: 403 }
      );
    }

    // La descarga de documentos firmados no está implementada aún
    logger.info('Descarga de documento solicitado:', { signatureId });
    return NextResponse.json(
      { error: 'La descarga de documentos firmados no está implementada aún' },
      { status: 501 }
    );

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

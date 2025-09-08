import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { signatureService } from '@/lib/signature';
import { db } from '@/lib/db';
import { logger } from '@/lib/logger';
import { z } from 'zod';

const sendSignatureSchema = z.object({
  provider: z.string().optional(),
  message: z.string().optional(),
});

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireAuth(request);
    const signatureId = params.id;

    const body = await request.json();
    const validatedData = sendSignatureSchema.parse(body);

    // Verificar que la firma existe y pertenece al usuario
    const signature = await db.SignatureRequest.findUnique({
      where: { id: signatureId },
      include: { signers: true },
    });

    if (!signature) {
      return NextResponse.json(
        { error: 'Firma no encontrada' },
        { status: 404 }
      );
    }

    // Verificar permisos
    if (signature.signers.some(signer => signer.email === user.email) === false && user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'No tienes permisos para enviar esta firma' },
        { status: 403 }
      );
    }

    // Enviar la solicitud de firma usando el servicio
    const result = await signatureService.createSignatureRequest(
      signature.documentId,
      signature.signers.map(s => ({
        email: s.email,
        name: s.name,
        role: s.role || 'SIGNER',
      })),
      validatedData.provider
    );

    if (!result.success) {
      return NextResponse.json(
        { error: result.message },
        { status: 400 }
      );
    }

    logger.info('Firma enviada exitosamente', {
      signatureId,
      userId: user.id,
      provider: result.provider,
    });

    return NextResponse.json({
      success: true,
      message: 'Firma enviada exitosamente',
      signatureId: result.signatureId,
      provider: result.provider,
    });

  } catch (error) {
    logger.error('Error enviando firma:', { error: error instanceof Error ? error.message : String(error) });

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

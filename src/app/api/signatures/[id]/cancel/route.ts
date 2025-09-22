import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { signatureService } from '@/lib/signature';
import { handleApiError } from '@/lib/api-error-handler';
import { db } from '@/lib/db';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    // Verificar autenticación
    const user = requireAuth(request);
    
    const signatureId = params.id;

    // Validar que el signatureId sea válido
    if (!signatureId || signatureId.length < 10) {
      return NextResponse.json({
        success: false,
        error: 'ID de firma inválido',
      }, { status: 400 });
    }

    // Verificar que la firma existe antes de cancelarla
    const existingSignature = await db.contractSignature.findUnique({
      where: { id: signatureId },
    });

    if (!existingSignature) {
      return NextResponse.json({
        success: false,
        error: 'Firma no encontrada',
      }, { status: 404 });
    }

    // Cancelar firma
    await signatureService.cancelSignatureRequest(signatureId);

    return NextResponse.json({
      success: true,
      signatureId,
      status: 'CANCELLED',
      message: 'Firma cancelada exitosamente',
    });
  } catch (error) {
    return handleApiError(error);
  }
}

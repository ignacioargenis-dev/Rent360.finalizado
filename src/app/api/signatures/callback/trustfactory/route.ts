import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger-minimal';
import { db } from '@/lib/db';
import { SignatureStatus } from '@/lib/signature/types';

/**
 * Callback endpoint para TrustFactory
 * Maneja las actualizaciones de estado de firmas electrónicas
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { signatureId, status, eventType, signerData, certificateData } = body;

    logger.info('Callback recibido de TrustFactory:', {
      signatureId,
      status,
      eventType,
      signerCount: signerData?.length || 0,
      hasCertificate: !!certificateData,
    });

    // Validar que el signatureId existe en nuestra base de datos
    const existingSignature = await db.signatureRequest.findUnique({
      where: { id: signatureId },
      include: {
        signers: true,
      },
    });

    if (!existingSignature) {
      logger.warn('Signature ID no encontrado en callback TrustFactory:', { signatureId });
      return NextResponse.json({ error: 'Signature not found' }, { status: 404 });
    }

    // Mapear estado de TrustFactory a nuestro estado interno
    const internalStatus = mapTrustFactoryStatus(status);

    // Actualizar el estado de la firma
    const currentMetadata = existingSignature.metadata
      ? JSON.parse(existingSignature.metadata)
      : {};
    const updatedMetadata = {
      ...currentMetadata,
      trustFactoryCallback: {
        receivedAt: new Date().toISOString(),
        eventType,
        status,
        certificateData,
        signerData,
      },
    };

    await db.signatureRequest.update({
      where: { id: signatureId },
      data: {
        status: internalStatus,
        metametadata: JSON.stringify(updatedMetadata),
      },
    });

    // Actualizar el estado de los firmantes si se proporciona información
    if (signerData && Array.isArray(signerData)) {
      for (const signer of signerData) {
        await db.signatureSigner.updateMany({
          where: {
            signatureRequestId: signatureId,
            email: signer.email,
          },
          data: {
            status: signer.status === 'completed' ? 'signed' : 'pending',
            signedAt: signer.signedAt ? new Date(signer.signedAt) : null,
            metametadata: JSON.stringify({
              ...(existingSignature.signers.find(s => s.email === signer.email)?.metadata
                ? JSON.parse(
                    existingSignature.signers.find(s => s.email === signer.email)?.metadata || '{}'
                  )
                : {}),
              trustFactorySignerData: signer,
            }),
          },
        });
      }
    }

    // Nota: La actualización automática de contratos se maneja en otros endpoints
    // El callback solo actualiza el estado de la firma

    // Notificar a los usuarios interesados (implementar sistema de notificaciones)

    return NextResponse.json({
      success: true,
      message: 'Callback processed successfully',
      signatureId,
      status: internalStatus,
    });
  } catch (error) {
    logger.error('Error procesando callback de TrustFactory:', {
      error: error instanceof Error ? error.message : String(error),
      body: await request.json().catch(() => ({})),
    });

    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * Mapear estados de TrustFactory a estados internos
 */
function mapTrustFactoryStatus(trustFactoryStatus: string): SignatureStatus {
  const statusMap: { [key: string]: SignatureStatus } = {
    PENDING: SignatureStatus.PENDING,
    IN_PROGRESS: SignatureStatus.IN_PROGRESS,
    WAITING_FOR_SIGNERS: SignatureStatus.IN_PROGRESS,
    COMPLETED: SignatureStatus.COMPLETED,
    CANCELLED: SignatureStatus.CANCELLED,
    EXPIRED: SignatureStatus.FAILED,
    FAILED: SignatureStatus.FAILED,
    REJECTED: SignatureStatus.FAILED,
  };

  return statusMap[trustFactoryStatus] || SignatureStatus.FAILED;
}

import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger-edge';
import { db } from '@/lib/db';
import { SignatureStatus } from '@/types';

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
      hasCertificate: !!certificateData
    });

    // Validar que el signatureId existe en nuestra base de datos
    const existingSignature = await db.signatureRequest.findUnique({
      where: { id: signatureId },
      include: {
        document: true,
        signers: true
      }
    });

    if (!existingSignature) {
      logger.warn('Signature ID no encontrado en callback TrustFactory:', { signatureId });
      return NextResponse.json({ error: 'Signature not found' }, { status: 404 });
    }

    // Mapear estado de TrustFactory a nuestro estado interno
    const internalStatus = mapTrustFactoryStatus(status);

    // Actualizar el estado de la firma
    await db.signatureRequest.update({
      where: { id: signatureId },
      data: {
        status: internalStatus,
        completedAt: internalStatus === SignatureStatus.COMPLETED ? new Date() : null,
        metadata: {
          ...existingSignature.metadata,
          trustFactoryCallback: {
            receivedAt: new Date().toISOString(),
            eventType,
            status,
            certificateData,
            signerData
          }
        }
      }
    });

    // Actualizar el estado de los firmantes si se proporciona información
    if (signerData && Array.isArray(signerData)) {
      for (const signer of signerData) {
        await db.signatureSigner.updateMany({
          where: {
            signatureRequestId: signatureId,
            email: signer.email
          },
          data: {
            status: signer.status === 'completed' ? 'signed' : 'pending',
            signedAt: signer.signedAt ? new Date(signer.signedAt) : null,
            metadata: {
              ...existingSignature.signers.find(s => s.email === signer.email)?.metadata,
              trustFactorySignerData: signer
            }
          }
        });
      }
    }

    // Si la firma se completó, actualizar el contrato relacionado
    if (internalStatus === SignatureStatus.COMPLETED && existingSignature.document) {
      await db.contract.update({
        where: { id: existingSignature.document.contractId },
        data: {
          status: 'SIGNED',
          signedAt: new Date(),
          metadata: {
            ...existingSignature.document.metadata,
            signatureCompletedAt: new Date().toISOString(),
            signatureProvider: 'TrustFactory',
            certificateData
          }
        }
      });

      // Crear entrada en el log de auditoría
      await db.auditLog.create({
        data: {
          action: 'CONTRACT_SIGNED',
          entityType: 'CONTRACT',
          entityId: existingSignature.document.contractId,
          userId: existingSignature.createdBy,
          details: {
            signatureId,
            provider: 'TrustFactory',
            certificateData,
            compliance: {
              law: '19.799',
              decree: '181/2020'
            }
          },
          ipAddress: request.headers.get('x-forwarded-for') || request.ip || 'unknown',
          userAgent: request.headers.get('user-agent') || 'TrustFactory Callback'
        }
      });

      logger.info('Contrato firmado exitosamente via TrustFactory:', {
        signatureId,
        contractId: existingSignature.document.contractId,
        certificateId: certificateData?.certificateId
      });
    }

    // Notificar a los usuarios interesados (implementar sistema de notificaciones)

    return NextResponse.json({
      success: true,
      message: 'Callback processed successfully',
      signatureId,
      status: internalStatus
    });

  } catch (error) {
    logger.error('Error procesando callback de TrustFactory:', {
      error: error instanceof Error ? error.message : String(error),
      body: await request.json().catch(() => ({}))
    });

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Mapear estados de TrustFactory a estados internos
 */
function mapTrustFactoryStatus(trustFactoryStatus: string): SignatureStatus {
  const statusMap: { [key: string]: SignatureStatus } = {
    'PENDING': SignatureStatus.PENDING,
    'IN_PROGRESS': SignatureStatus.IN_PROGRESS,
    'WAITING_FOR_SIGNERS': SignatureStatus.IN_PROGRESS,
    'COMPLETED': SignatureStatus.COMPLETED,
    'CANCELLED': SignatureStatus.CANCELLED,
    'EXPIRED': SignatureStatus.FAILED,
    'FAILED': SignatureStatus.FAILED,
    'REJECTED': SignatureStatus.FAILED
  };

  return statusMap[trustFactoryStatus] || SignatureStatus.FAILED;
}

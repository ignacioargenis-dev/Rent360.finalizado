import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger-minimal';
import { db } from '@/lib/db';
import { SignatureStatus } from '@/lib/signature/types';

/**
 * Callback endpoint para FirmaPro
 * Maneja las actualizaciones de estado de firmas electrónicas especializadas
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { contractId, status, eventType, signerData, certificateData, contractType } = body;

    logger.info('Callback recibido de FirmaPro:', {
      contractId,
      status,
      eventType,
      contractType,
      signerCount: signerData?.length || 0,
      hasCertificate: !!certificateData,
    });

    // Validar que el contractId existe en nuestra base de datos
    const existingSignature = await db.signatureRequest.findUnique({
      where: { id: contractId },
      include: {
        signers: true,
      },
    });

    if (!existingSignature) {
      logger.warn('Contract ID no encontrado en callback FirmaPro:', { contractId });
      return NextResponse.json({ error: 'Contract not found' }, { status: 404 });
    }

    // Mapear estado de FirmaPro a nuestro estado interno
    const internalStatus = mapFirmaProStatus(status);

    // Actualizar el estado de la firma
    const currentMetadata = existingSignature.metadata
      ? JSON.parse(existingSignature.metadata)
      : {};
    const updatedMetadata = {
      ...currentMetadata,
      firmaProCallback: {
        receivedAt: new Date().toISOString(),
        eventType,
        status,
        contractType,
        certificateData,
        signerData,
      },
    };

    await db.signatureRequest.update({
      where: { id: contractId },
      data: {
        status: internalStatus,
        metadata: JSON.stringify(updatedMetadata),
      },
    });

    // Actualizar el estado de los firmantes si se proporciona información
    if (signerData && Array.isArray(signerData)) {
      for (const signer of signerData) {
        // Mapear roles de FirmaPro a nuestros roles internos
        const role = mapFirmaProRole(signer.role);

        await db.signatureSigner.updateMany({
          where: {
            signatureRequestId: contractId,
            email: signer.email,
          },
          data: {
            status: signer.status === 'signed' ? 'signed' : 'pending',
            signedAt: signer.signedAt ? new Date(signer.signedAt) : null,
            metadata: JSON.stringify({
              ...(existingSignature.signers.find(s => s.email === signer.email)?.metadata
                ? JSON.parse(
                    existingSignature.signers.find(s => s.email === signer.email)?.metadata || '{}'
                  )
                : {}),
              firmaProSignerData: signer,
              signerRole: role,
              contractType: 'ARRIENDO_INMUEBLE',
            }),
          },
        });
      }
    }

    // Verificar si todas las firmas están completas y actualizar el contrato correspondiente
    if (internalStatus === SignatureStatus.COMPLETED) {
      try {
        // Buscar la signature request y verificar si es para un contrato
        const signatureRequest = await db.signatureRequest.findUnique({
          where: { id: contractId },
          include: {
            signers: true,
          },
        });

        if (signatureRequest && signatureRequest.contractId) {
          // Esta firma está relacionada con un contrato
          const contract = await db.contract.findUnique({
            where: { id: signatureRequest.contractId },
          });

          if (contract) {
            // Verificar si todas las firmas requeridas están completas
            const completedSignatures = signatureRequest.signers.filter(
              signer => signer.status === 'signed'
            );
            const requiredSignatures = signatureRequest.signers.filter(signer => {
              const metadata = signer.metadata ? JSON.parse(signer.metadata) : {};
              return metadata.isRequired !== false; // Por defecto son requeridas
            });

            // Si todas las firmas requeridas están completas, activar el contrato
            if (completedSignatures.length >= requiredSignatures.length) {
              await db.contract.update({
                where: { id: contract.id },
                data: {
                  status: 'ACTIVE',
                  signedAt: new Date(),
                },
              });

              logger.info('Contrato activado automáticamente después de firmas completas:', {
                contractId: contract.id,
                signatureId: contractId,
                completedSignatures: completedSignatures.length,
                requiredSignatures: requiredSignatures.length,
              });
            }
          }
        }
      } catch (contractUpdateError) {
        logger.error('Error actualizando contrato después de firmas:', {
          error:
            contractUpdateError instanceof Error
              ? contractUpdateError.message
              : String(contractUpdateError),
          contractId,
        });
      }
    }

    // Notificar a los usuarios interesados (implementar sistema de notificaciones)

    return NextResponse.json({
      success: true,
      message: 'Callback processed successfully',
      contractId,
      status: internalStatus,
      contractType,
    });
  } catch (error) {
    logger.error('Error procesando callback de FirmaPro:', {
      error: error instanceof Error ? error.message : String(error),
      body: await request.json().catch(() => ({})),
    });

    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * Mapear estados de FirmaPro a estados internos
 */
function mapFirmaProStatus(firmaProStatus: string): SignatureStatus {
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

  return statusMap[firmaProStatus] || SignatureStatus.FAILED;
}

/**
 * Mapear roles de FirmaPro a roles internos
 */
function mapFirmaProRole(firmaProRole: string): string {
  const roleMap: { [key: string]: string } = {
    ARRENDADOR: 'OWNER',
    ARRENDATARIO: 'TENANT',
    FIADOR: 'GUARANTOR',
    OWNER: 'OWNER',
    TENANT: 'TENANT',
    GUARANTOR: 'GUARANTOR',
  };

  return roleMap[firmaProRole] || firmaProRole;
}

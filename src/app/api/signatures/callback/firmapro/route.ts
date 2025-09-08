import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';
import { db } from '@/lib/db';
import { SignatureStatus } from '@/types';

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
      hasCertificate: !!certificateData
    });

    // Validar que el contractId existe en nuestra base de datos
    const existingSignature = await db.signatureRequest.findUnique({
      where: { id: contractId },
      include: {
        document: true,
        signers: true
      }
    });

    if (!existingSignature) {
      logger.warn('Contract ID no encontrado en callback FirmaPro:', { contractId });
      return NextResponse.json({ error: 'Contract not found' }, { status: 404 });
    }

    // Mapear estado de FirmaPro a nuestro estado interno
    const internalStatus = mapFirmaProStatus(status);

    // Actualizar el estado de la firma
    await db.signatureRequest.update({
      where: { id: contractId },
      data: {
        status: internalStatus,
        completedAt: internalStatus === SignatureStatus.COMPLETED ? new Date() : null,
        metadata: {
          ...existingSignature.metadata,
          firmaProCallback: {
            receivedAt: new Date().toISOString(),
            eventType,
            status,
            contractType,
            certificateData,
            signerData
          }
        }
      }
    });

    // Actualizar el estado de los firmantes si se proporciona información
    if (signerData && Array.isArray(signerData)) {
      for (const signer of signerData) {
        // Mapear roles de FirmaPro a nuestros roles internos
        const role = mapFirmaProRole(signer.role);

        await db.signatureSigner.updateMany({
          where: {
            signatureRequestId: contractId,
            email: signer.email
          },
          data: {
            status: signer.status === 'signed' ? 'signed' : 'pending',
            signedAt: signer.signedAt ? new Date(signer.signedAt) : null,
            metadata: {
              ...existingSignature.signers.find(s => s.email === signer.email)?.metadata,
              firmaProSignerData: signer,
              signerRole: role,
              contractType: 'ARRIENDO_INMUEBLE'
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
            signatureProvider: 'FirmaPro',
            contractType: 'ARRIENDO_INMUEBLE',
            certificateData,
            specializedCompliance: {
              law: '19.799',
              decree: '181/2020',
              specialized: true
            }
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
            signatureId: contractId,
            provider: 'FirmaPro',
            contractType: 'ARRIENDO_INMUEBLE',
            certificateData,
            compliance: {
              law: '19.799',
              decree: '181/2020',
              specialized: true
            }
          },
          ipAddress: request.headers.get('x-forwarded-for') || request.ip || 'unknown',
          userAgent: request.headers.get('user-agent') || 'FirmaPro Callback'
        }
      });

      logger.info('Contrato de arriendo firmado exitosamente via FirmaPro:', {
        contractId,
        contractType: 'ARRIENDO_INMUEBLE',
        realContractId: existingSignature.document.contractId,
        certificateId: certificateData?.certificateId
      });
    }

    // Notificar a los usuarios interesados (implementar sistema de notificaciones)

    return NextResponse.json({
      success: true,
      message: 'Callback processed successfully',
      contractId,
      status: internalStatus,
      contractType
    });

  } catch (error) {
    logger.error('Error procesando callback de FirmaPro:', {
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
 * Mapear estados de FirmaPro a estados internos
 */
function mapFirmaProStatus(firmaProStatus: string): SignatureStatus {
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

  return statusMap[firmaProStatus] || SignatureStatus.FAILED;
}

/**
 * Mapear roles de FirmaPro a roles internos
 */
function mapFirmaProRole(firmaProRole: string): string {
  const roleMap: { [key: string]: string } = {
    'ARRENDADOR': 'OWNER',
    'ARRENDATARIO': 'TENANT',
    'FIADOR': 'GUARANTOR',
    'OWNER': 'OWNER',
    'TENANT': 'TENANT',
    'GUARANTOR': 'GUARANTOR'
  };

  return roleMap[firmaProRole] || firmaProRole;
}

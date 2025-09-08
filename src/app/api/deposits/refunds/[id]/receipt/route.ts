import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { logger } from '@/lib/logger';
import { requireAuth } from '@/lib/auth';

// GET - Generar recibo digital
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireAuth(request);
    const { id } = params;

    // Verificar que la solicitud de devolución existe
    const refund = await db.depositRefund.findUnique({
      where: { id },
      include: {
        contract: {
          include: {
            tenant: true,
            owner: true,
            property: true,
          }
        },
        tenant: true,
        owner: true,
        documents: {
          orderBy: { createdAt: 'desc' },
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
        },
        disputes: {
          orderBy: { createdAt: 'desc' },
          include: {
            initiator: {
              select: {
                id: true,
                name: true,
                email: true,
                role: true,
              }
            },
            resolver: {
              select: {
                id: true,
                name: true,
                email: true,
                role: true,
              }
            }
          }
        },
        approvals: {
          orderBy: { approvedAt: 'desc' },
          include: {
            approver: {
              select: {
                id: true,
                name: true,
                email: true,
                role: true,
              }
            }
          }
        },
        auditLogs: {
          orderBy: { createdAt: 'desc' },
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
        },
      }
    });

    if (!refund) {
      return NextResponse.json(
        { error: 'Solicitud de devolución no encontrada' },
        { status: 404 }
      );
    }

    // Verificar permisos
    if (user.role !== 'ADMIN' && 
        user.id !== refund.tenantId && 
        user.id !== refund.ownerId) {
      return NextResponse.json(
        { error: 'No tienes permisos para ver el recibo de esta devolución' },
        { status: 403 }
      );
    }

    // Verificar que la devolución esté procesada
    if (refund.status !== 'PROCESSED') {
      return NextResponse.json(
        { error: 'Solo se puede generar recibo para devoluciones procesadas' },
        { status: 400 }
      );
    }

    // Calcular montos
    const totalClaimed = refund.tenantClaimed + refund.ownerClaimed;
    const netRefund = refund.approvedAmount || 0;
    const deductions = refund.originalDeposit - netRefund;

    // Generar datos del recibo
    const receiptData = {
      receiptNumber: `REC-${refund.refundNumber}`,
      refundNumber: refund.refundNumber,
      generatedAt: new Date().toISOString(),
      generatedBy: user.name,
      
      // Información del contrato
      contract: {
        id: refund.contract.id,
        startDate: refund.contract.startDate,
        endDate: refund.contract.endDate,
        property: {
          address: refund.contract.property.address,
          commune: refund.contract.property.commune,
          type: refund.contract.property.type,
        }
      },
      
      // Partes involucradas
      tenant: {
        name: refund.tenant.name,
        email: refund.tenant.email,
        phone: refund.tenant.phone,
      },
      owner: {
        name: refund.owner.name,
        email: refund.owner.email,
        phone: refund.owner.phone,
      },
      
      // Montos
      originalDeposit: refund.originalDeposit,
      tenantClaimed: refund.tenantClaimed,
      ownerClaimed: refund.ownerClaimed,
      totalClaimed,
      deductions,
      netRefund,
      
      // Estado y fechas
      status: refund.status,
      createdAt: refund.createdAt,
      processedAt: refund.processedAt,
      
      // Documentos adjuntos
      documents: refund.documents.map(doc => ({
        id: doc.id,
        type: doc.documentType,
        fileName: doc.fileName,
        uploadedBy: doc.user.name,
        uploadedAt: doc.createdAt,
        amount: doc.amount,
        description: doc.description,
      })),
      
      // Disputas
      disputes: refund.disputes.map(dispute => ({
        id: dispute.id,
        type: dispute.disputeType,
        description: dispute.description,
        amount: dispute.amount,
        status: dispute.status,
        initiatedBy: dispute.initiator.name,
        initiatedAt: dispute.createdAt,
        resolution: dispute.resolution,
        resolvedBy: dispute.resolver?.name,
        resolvedAt: dispute.resolvedAt,
      })),
      
      // Aprobaciones
      approvals: refund.approvals.map(approval => ({
        id: approval.id,
        type: approval.approvalType,
        approved: approval.approved,
        approver: approval.approver.name,
        approvedAt: approval.approvedAt,
        comments: approval.comments,
      })),
      
      // Log de auditoría
      auditLog: refund.auditLogs.map(log => ({
        id: log.id,
        action: log.action,
        details: log.details,
        user: log.user.name,
        timestamp: log.createdAt,
        ipAddress: log.ipAddress,
      })),
      
      // Firmas digitales (simuladas)
      digitalSignatures: {
        tenant: {
          name: refund.tenant.name,
          signed: refund.tenantApproved,
          signedAt: refund.approvals.find(a => a.approvalType === 'TENANT_APPROVAL')?.approvedAt,
        },
        owner: {
          name: refund.owner.name,
          signed: refund.ownerApproved,
          signedAt: refund.approvals.find(a => a.approvalType === 'OWNER_APPROVAL')?.approvedAt,
        },
        admin: {
          name: user.role === 'ADMIN' ? user.name : 'Administrador del Sistema',
          signed: true,
          signedAt: refund.processedAt,
        }
      },
      
      // Resumen ejecutivo
      summary: {
        totalDocuments: refund.documents.length,
        totalDisputes: refund.disputes.length,
        resolvedDisputes: refund.disputes.filter(d => d.status === 'RESOLVED').length,
        totalApprovals: refund.approvals.length,
        processingTime: refund.processedAt ? 
          Math.ceil((refund.processedAt.getTime() - refund.createdAt.getTime()) / (1000 * 60 * 60 * 24)) : 0, // días
      }
    };

    // Crear log de auditoría
    await db.refundAuditLog.create({
      data: {
        refundId: id,
        userId: user.id,
        action: 'RECEIPT_GENERATED',
        details: `Recibo digital generado por ${user.name}`,
        ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
        userAgent: request.headers.get('user-agent'),
      }
    });

    logger.info('Recibo digital generado:', {
      refundId: id,
      userId: user.id,
      receiptNumber: receiptData.receiptNumber,
    });

    return NextResponse.json({
      success: true,
      data: receiptData,
      message: 'Recibo digital generado exitosamente'
    });

  } catch (error) {
    logger.error('Error generando recibo digital:', {
      error: error instanceof Error ? error.message : String(error),
      refundId: params.id,
      userId: request.headers.get('user-id'),
    });

    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

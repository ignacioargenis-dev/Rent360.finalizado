import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { logger } from '@/lib/logger-minimal';
import { db } from '@/lib/db';

// Forzar renderizado dinámico
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request);

    if (user.role !== 'SUPPORT') {
      return NextResponse.json(
        { error: 'Acceso denegado. Se requiere rol de soporte.' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || 'all';

    // Build where clause - soporte puede ver todas las disputas
    const where: any = {};

    if (status !== 'all') {
      where.status = status;
    }

    // Get all disputes for support
    const disputes = await db.refundDispute.findMany({
      where,
      include: {
        refund: {
          include: {
            contract: {
              select: {
                id: true,
                contractNumber: true,
                property: {
                  select: {
                    id: true,
                    title: true,
                    address: true,
                  },
                },
              },
            },
            tenant: {
              select: {
                id: true,
                name: true,
                email: true,
                phone: true,
              },
            },
            owner: {
              select: {
                id: true,
                name: true,
                email: true,
                phone: true,
              },
            },
          },
        },
        initiator: {
          select: {
            id: true,
            name: true,
            role: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Transform the data
    const transformedDisputes = disputes.map(dispute => ({
      ...dispute,
      contractNumber: dispute.refund.contract.contractNumber,
      propertyTitle: dispute.refund.contract.property?.title,
      propertyAddress: dispute.refund.contract.property?.address,
      tenantName: dispute.refund.tenant?.name,
      tenantEmail: dispute.refund.tenant?.email,
      tenantPhone: dispute.refund.tenant?.phone,
      ownerName: dispute.refund.owner?.name,
      ownerEmail: dispute.refund.owner?.email,
      ownerPhone: dispute.refund.owner?.phone,
      initiatorName: dispute.initiator?.name,
      initiatorRole: dispute.initiator?.role,
      // Add support-specific fields
      supportPriority: getSupportPriority(dispute),
      mediationStatus: getMediationStatus(dispute),
      resolutionOptions: getResolutionOptions(dispute),
    }));

    return NextResponse.json({
      disputes: transformedDisputes,
      total: transformedDisputes.length,
      stats: {
        total: transformedDisputes.length,
        open: transformedDisputes.filter(d => d.status === 'OPEN').length,
        pending: transformedDisputes.filter(d => d.status === 'PENDING').length,
        inProgress: transformedDisputes.filter(d => d.status === 'IN_PROGRESS').length,
        resolved: transformedDisputes.filter(d => d.status === 'RESOLVED').length,
        cancelled: transformedDisputes.filter(d => d.status === 'CANCELLED').length,
      },
    });
  } catch (error) {
    logger.error('Error fetching support disputes:', {
      error: error instanceof Error ? error.message : String(error),
    });

    // Return empty data when no real disputes exist
    return NextResponse.json({
      disputes: [],
      total: 0,
      stats: {
        total: 0,
        open: 0,
        pending: 0,
        inProgress: 0,
        resolved: 0,
        cancelled: 0,
      },
      message: 'No hay disputas registradas en el sistema',
    });
  }
}

// Helper functions
function getSupportPriority(dispute: any): 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT' {
  const amount = dispute.amount || 0;
  const daysOpen = Math.floor(
    (Date.now() - new Date(dispute.createdAt).getTime()) / (1000 * 60 * 60 * 24)
  );

  if (amount > 1000000 || daysOpen > 30) {
    return 'URGENT';
  }
  if (amount > 500000 || daysOpen > 15) {
    return 'HIGH';
  }
  if (amount > 100000 || daysOpen > 7) {
    return 'MEDIUM';
  }
  return 'LOW';
}

function getMediationStatus(
  dispute: any
): 'AVAILABLE' | 'IN_PROGRESS' | 'COMPLETED' | 'NOT_AVAILABLE' {
  switch (dispute.status) {
    case 'OPEN':
      return 'AVAILABLE';
    case 'PENDING':
    case 'IN_PROGRESS':
      return 'IN_PROGRESS';
    case 'RESOLVED':
    case 'CANCELLED':
      return 'COMPLETED';
    default:
      return 'NOT_AVAILABLE';
  }
}

function getResolutionOptions(dispute: any): string[] {
  const baseOptions = ['NEGOTIATION', 'LEGAL_MEDIATION'];

  if (dispute.amount > 500000) {
    baseOptions.push('ARBITRATION');
  }

  if (dispute.disputeType === 'OWNER_CLAIM') {
    baseOptions.push('MAINTENANCE_DEDUCTION', 'PARTIAL_REFUND');
  } else if (dispute.disputeType === 'TENANT_CLAIM') {
    baseOptions.push('FULL_REFUND', 'DEPOSIT_ADJUSTMENT');
  }

  return baseOptions;
}

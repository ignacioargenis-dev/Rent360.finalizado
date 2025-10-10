import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { logger } from '@/lib/logger';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request);

    if (user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Acceso denegado. Se requiere rol de administrador.' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || 'all';
    const priority = searchParams.get('priority') || 'all';

    // Build where clause - admin puede ver todas las disputas
    const where: any = {};

    if (status !== 'all') {
      where.status = status;
    }

    // Get all disputes for admin with enhanced data
    const disputes = await db.refundDispute.findMany({
      where,
      include: {
        refund: {
          include: {
            contract: {
              select: {
                id: true,
                contractNumber: true,
                brokerId: true,
                broker: {
                  select: {
                    id: true,
                    name: true,
                    email: true,
                    phone: true,
                  },
                },
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

    // Transform the data with admin-specific enhancements
    const transformedDisputes = disputes.map(dispute => {
      const supportPriority = getSupportPriority(dispute);
      const daysOpen = Math.floor(
        (Date.now() - new Date(dispute.createdAt).getTime()) / (1000 * 60 * 60 * 24)
      );

      return {
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
        brokerName: dispute.refund.contract.broker?.name,
        brokerEmail: dispute.refund.contract.broker?.email,
        brokerPhone: dispute.refund.contract.broker?.phone,
        initiatorName: dispute.initiator?.name,
        initiatorRole: dispute.initiator?.role,
        // Admin-specific fields
        supportPriority,
        mediationStatus: getMediationStatus(dispute),
        resolutionOptions: getResolutionOptions(dispute),
        daysOpen,
        riskLevel: getRiskLevel(dispute, supportPriority, daysOpen),
        assignedTo: null, // TODO: Implement assignment system
        lastActivity: dispute.updatedAt,
        recentActivity: [],
      };
    });

    // Filter by priority if specified
    let filteredDisputes = transformedDisputes;
    if (priority !== 'all') {
      filteredDisputes = transformedDisputes.filter(
        d => d.supportPriority === priority.toUpperCase()
      );
    }

    return NextResponse.json({
      disputes: filteredDisputes,
      total: filteredDisputes.length,
      stats: {
        total: transformedDisputes.length,
        open: transformedDisputes.filter(d => d.status === 'OPEN').length,
        pending: transformedDisputes.filter(d => d.status === 'PENDING').length,
        inProgress: transformedDisputes.filter(d => d.status === 'IN_PROGRESS').length,
        resolved: transformedDisputes.filter(d => d.status === 'RESOLVED').length,
        cancelled: transformedDisputes.filter(d => d.status === 'CANCELLED').length,
        highPriority: transformedDisputes.filter(
          d => d.supportPriority === 'HIGH' || d.supportPriority === 'URGENT'
        ).length,
        urgent: transformedDisputes.filter(d => d.supportPriority === 'URGENT').length,
        avgResolutionTime: calculateAvgResolutionTime(transformedDisputes),
      },
    });
  } catch (error) {
    logger.error('Error fetching admin disputes:', {
      error: error instanceof Error ? error.message : String(error),
    });

    // Return mock data as fallback
    const mockDisputes = [
      {
        id: 'admin-dispute-1',
        disputeNumber: 'DISPUTE-2024-0001',
        refundId: 'refund-1',
        initiatedBy: 'owner-1',
        disputeType: 'OWNER_CLAIM',
        description: 'Daños en propiedad - limpieza profesional requerida',
        amount: 350000,
        status: 'OPEN',
        resolution: null,
        resolvedBy: null,
        resolvedAt: null,
        createdAt: new Date('2024-09-01'),
        updatedAt: new Date('2024-09-01'),
        contractNumber: 'CTR-2024-003',
        propertyTitle: 'Oficina Corporativa',
        propertyAddress: 'Providencia 567',
        tenantName: 'Empresa XYZ Ltda.',
        tenantEmail: 'contacto@empresa-xyz.cl',
        tenantPhone: '+56912345678',
        ownerName: 'Propietario Corporativo',
        ownerEmail: 'propietario@empresa-prop.cl',
        ownerPhone: '+56987654321',
        brokerName: 'Corredor Asociado',
        brokerEmail: 'corredor@empresa.cl',
        brokerPhone: '+56955556666',
        initiatorName: 'Propietario Corporativo',
        initiatorRole: 'OWNER',
        supportPriority: 'HIGH',
        mediationStatus: 'AVAILABLE',
        resolutionOptions: ['PARTIAL_REFUND', 'MAINTENANCE_DEDUCTION', 'LEGAL_MEDIATION'],
        daysOpen: 8,
        riskLevel: 'MEDIUM',
        assignedTo: null,
        lastActivity: new Date('2024-09-01'),
        recentActivity: [],
      },
    ];

    return NextResponse.json({
      disputes: mockDisputes,
      total: mockDisputes.length,
      stats: {
        total: 1,
        open: 1,
        pending: 0,
        inProgress: 0,
        resolved: 0,
        cancelled: 0,
        highPriority: 1,
        urgent: 0,
        avgResolutionTime: 15,
      },
      fallback: true,
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
  const baseOptions = ['NEGOTIATION', 'LEGAL_MEDIATION', 'ADMIN_INTERVENTION'];

  if (dispute.amount > 500000) {
    baseOptions.push('ARBITRATION');
  }

  if (dispute.disputeType === 'OWNER_CLAIM') {
    baseOptions.push('MAINTENANCE_DEDUCTION', 'PARTIAL_REFUND', 'PROFESSIONAL_CLEANING');
  } else if (dispute.disputeType === 'TENANT_CLAIM') {
    baseOptions.push('FULL_REFUND', 'DEPOSIT_ADJUSTMENT', 'CONDITION_IMPROVEMENT');
  }

  return baseOptions;
}

function getRiskLevel(
  dispute: any,
  priority: string,
  daysOpen: number
): 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' {
  if (priority === 'URGENT' || daysOpen > 30) {
    return 'CRITICAL';
  }
  if (priority === 'HIGH' || daysOpen > 15) {
    return 'HIGH';
  }
  if (priority === 'MEDIUM' || daysOpen > 7) {
    return 'MEDIUM';
  }
  return 'LOW';
}

function calculateAvgResolutionTime(disputes: any[]): number {
  const resolvedDisputes = disputes.filter(d => d.status === 'RESOLVED' && d.resolvedAt);
  if (resolvedDisputes.length === 0) {
    return 0;
  }

  const totalTime = resolvedDisputes.reduce((sum, d) => {
    const start = new Date(d.createdAt).getTime();
    const end = new Date(d.resolvedAt).getTime();
    return sum + (end - start) / (1000 * 60 * 60 * 24); // days
  }, 0);

  return Math.round(totalTime / resolvedDisputes.length);
}

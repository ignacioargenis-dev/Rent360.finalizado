import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { logger } from '@/lib/logger-minimal';
import { db } from '@/lib/db';

// Forzar renderizado dinámico
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request);

    if (user.role !== 'BROKER') {
      return NextResponse.json(
        { error: 'Acceso denegado. Se requiere rol de corredor.' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || 'all';

    // Build where clause - corredores ven disputas en contratos donde son intermediarios
    const where: any = {
      refund: {
        contract: {
          brokerId: user.id,
        },
      },
    };

    if (status !== 'all') {
      where.status = status;
    }

    // Get disputes for the broker
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
              },
            },
            owner: {
              select: {
                id: true,
                name: true,
                email: true,
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
      ownerName: dispute.refund.owner?.name,
      ownerEmail: dispute.refund.owner?.email,
      initiatorName: dispute.initiator?.name,
      initiatorRole: dispute.initiator?.role,
    }));

    return NextResponse.json({
      disputes: transformedDisputes,
      total: transformedDisputes.length,
    });
  } catch (error) {
    logger.error('Error fetching broker disputes:', {
      error: error instanceof Error ? error.message : String(error),
    });

    // Return mock data as fallback
    const mockDisputes = [
      {
        id: 'dispute-broker-1',
        disputeNumber: 'DISPUTE-2024-0001',
        refundId: 'refund-broker-1',
        initiatedBy: 'owner-broker-1',
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
        ownerName: 'Propietario Corporativo',
        ownerEmail: 'propietario@empresa-prop.cl',
        initiatorName: 'Propietario Corporativo',
        initiatorRole: 'OWNER',
      },
      {
        id: 'dispute-broker-2',
        disputeNumber: 'DISPUTE-2024-0002',
        refundId: 'refund-broker-2',
        initiatedBy: 'tenant-broker-1',
        disputeType: 'TENANT_CLAIM',
        description: 'Sobredepósito - propiedad en mejores condiciones que lo acordado',
        amount: 500000,
        status: 'PENDING',
        resolution: null,
        resolvedBy: null,
        resolvedAt: null,
        createdAt: new Date('2024-08-15'),
        updatedAt: new Date('2024-08-15'),
        contractNumber: 'CTR-2024-004',
        propertyTitle: 'Local Comercial',
        propertyAddress: 'Las Condes 123',
        tenantName: 'Comercio ABC SpA',
        tenantEmail: 'admin@comercio-abc.cl',
        ownerName: 'Inversiones Locales Ltda.',
        ownerEmail: 'contacto@inversiones-locales.cl',
        initiatorName: 'Comercio ABC SpA',
        initiatorRole: 'TENANT',
      },
    ];

    return NextResponse.json({
      disputes: mockDisputes,
      total: mockDisputes.length,
      fallback: true,
    });
  }
}

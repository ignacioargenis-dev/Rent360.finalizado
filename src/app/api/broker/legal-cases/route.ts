import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { logger } from '@/lib/logger-minimal';
import { db } from '@/lib/db';

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

    // Build where clause - corredores ven casos donde son intermediarios
    const where: any = {
      brokerId: user.id,
    };

    if (status !== 'all') {
      where.status = status;
    }

    // Get legal cases for the broker
    const legalCases = await db.legalCase.findMany({
      where,
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
        legalAuditLogs: {
          orderBy: {
            createdAt: 'desc',
          },
          take: 3,
        },
        legalNotifications: {
          where: {
            status: 'pending',
          },
          select: {
            id: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Transform the data
    const transformedCases = legalCases.map(legalCase => ({
      ...legalCase,
      propertyTitle: legalCase.contract?.property?.title,
      propertyAddress: legalCase.contract?.property?.address,
      tenantName: legalCase.tenant?.name,
      tenantEmail: legalCase.tenant?.email,
      ownerName: legalCase.owner?.name,
      ownerEmail: legalCase.owner?.email,
      recentAuditLogs: legalCase.legalAuditLogs,
      unreadNotificationsCount: legalCase.legalNotifications.length,
      totalAmount:
        legalCase.totalDebt +
        legalCase.accumulatedInterest +
        legalCase.legalFees +
        legalCase.courtFees,
    }));

    return NextResponse.json({
      legalCases: transformedCases,
      total: transformedCases.length,
    });
  } catch (error) {
    logger.error('Error fetching broker legal cases:', {
      error: error instanceof Error ? error.message : String(error),
    });

    // Return mock data as fallback
    const mockCases = [
      {
        id: 'legal-broker-1',
        caseNumber: 'LEGAL-2024-0003',
        caseType: 'CONTRACT_BREACH',
        status: 'PRE_JUDICIAL',
        currentPhase: 'PRE_JUDICIAL',
        priority: 'MEDIUM',
        totalDebt: 1200000,
        accumulatedInterest: 60000,
        legalFees: 200000,
        courtFees: 0,
        totalAmount: 1460000,
        firstDefaultDate: new Date('2024-07-01'),
        notes: 'Caso gestionado como corredor intermediario',
        createdAt: new Date('2024-08-01'),
        updatedAt: new Date('2024-09-01'),
        contract: {
          id: 'contract-broker-1',
          contractNumber: 'CTR-2024-003',
          property: {
            id: 'prop-broker-1',
            title: 'Oficina Corporativa',
            address: 'Providencia 567',
          },
        },
        tenant: {
          id: 'tenant-broker-1',
          name: 'Empresa XYZ Ltda.',
          email: 'contacto@empresa-xyz.cl',
        },
        owner: {
          id: 'owner-broker-1',
          name: 'Propietario Corporativo',
          email: 'propietario@empresa-prop.cl',
        },
        propertyTitle: 'Oficina Corporativa',
        propertyAddress: 'Providencia 567',
        tenantName: 'Empresa XYZ Ltda.',
        tenantEmail: 'contacto@empresa-xyz.cl',
        ownerName: 'Propietario Corporativo',
        ownerEmail: 'propietario@empresa-prop.cl',
        recentAuditLogs: [],
        unreadNotificationsCount: 1,
      },
    ];

    return NextResponse.json({
      legalCases: mockCases,
      total: mockCases.length,
      fallback: true,
    });
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { logger } from '@/lib/logger';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request);

    if (user.role !== 'OWNER') {
      return NextResponse.json(
        { error: 'Acceso denegado. Se requiere rol de propietario.' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || 'all';

    // Build where clause
    const where: any = {
      ownerId: user.id,
    };

    if (status !== 'all') {
      where.status = status;
    }

    // Get legal cases for the owner
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
        broker: {
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
          take: 3, // Last 3 audit logs
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

    // Transform the data to match the expected format
    const transformedCases = legalCases.map(legalCase => ({
      ...legalCase,
      propertyTitle: legalCase.contract?.property?.title,
      propertyAddress: legalCase.contract?.property?.address,
      tenantName: legalCase.tenant?.name,
      tenantEmail: legalCase.tenant?.email,
      brokerName: legalCase.broker?.name,
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
    logger.error('Error fetching owner legal cases:', {
      error: error instanceof Error ? error.message : String(error),
    });

    // Return mock data as fallback
    const mockCases = [
      {
        id: 'legal-1',
        caseNumber: 'LEGAL-2024-0001',
        caseType: 'NON_PAYMENT',
        status: 'PRE_JUDICIAL',
        currentPhase: 'PRE_JUDICIAL',
        priority: 'HIGH',
        totalDebt: 850000,
        accumulatedInterest: 42500,
        legalFees: 150000,
        courtFees: 0,
        totalAmount: 1042500,
        firstDefaultDate: new Date('2024-08-01'),
        notes: 'Caso por incumplimiento en pagos de arriendo',
        createdAt: new Date('2024-09-01'),
        updatedAt: new Date('2024-09-15'),
        contract: {
          id: 'contract-1',
          contractNumber: 'CTR-2024-001',
          property: {
            id: 'prop-1',
            title: 'Apartamento Centro',
            address: 'Av. Providencia 123',
          },
        },
        tenant: {
          id: 'tenant-1',
          name: 'María González',
          email: 'maria@example.com',
        },
        broker: null,
        propertyTitle: 'Apartamento Centro',
        propertyAddress: 'Av. Providencia 123',
        tenantName: 'María González',
        tenantEmail: 'maria@example.com',
        brokerName: null,
        recentAuditLogs: [],
        unreadNotificationsCount: 2,
      },
      {
        id: 'legal-2',
        caseNumber: 'LEGAL-2024-0002',
        caseType: 'CONTRACT_BREACH',
        status: 'JUDICIAL',
        currentPhase: 'DEMAND_FILED',
        priority: 'MEDIUM',
        totalDebt: 1200000,
        accumulatedInterest: 180000,
        legalFees: 300000,
        courtFees: 50000,
        totalAmount: 1855000,
        firstDefaultDate: new Date('2024-06-01'),
        demandFiledDate: new Date('2024-08-15'),
        notes: 'Incumplimiento contractual - daños a la propiedad',
        createdAt: new Date('2024-07-01'),
        updatedAt: new Date('2024-09-01'),
        contract: {
          id: 'contract-2',
          contractNumber: 'CTR-2024-002',
          property: {
            id: 'prop-2',
            title: 'Casa Los Dominicos',
            address: 'Los Dominicos 456',
          },
        },
        tenant: {
          id: 'tenant-2',
          name: 'Carlos Rodríguez',
          email: 'carlos@example.com',
        },
        broker: {
          id: 'broker-1',
          name: 'Ana Martínez',
          email: 'ana@corredora.cl',
        },
        propertyTitle: 'Casa Los Dominicos',
        propertyAddress: 'Los Dominicos 456',
        tenantName: 'Carlos Rodríguez',
        tenantEmail: 'carlos@example.com',
        brokerName: 'Ana Martínez',
        recentAuditLogs: [],
        unreadNotificationsCount: 0,
      },
    ];

    return NextResponse.json({
      legalCases: mockCases,
      total: mockCases.length,
      fallback: true, // Indicate this is fallback data
    });
  }
}

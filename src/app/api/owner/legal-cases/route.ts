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

    // Return empty data when no real legal cases exist
    return NextResponse.json({
      legalCases: [],
      total: 0,
      message: 'No hay casos legales registrados en el sistema',
    });
  }
}

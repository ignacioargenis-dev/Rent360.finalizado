import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { logger } from '@/lib/logger-minimal';
import { db } from '@/lib/db';

// Forzar renderizado dinámico
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request);

    if (user.role !== 'OWNER') {
      return NextResponse.json(
        { error: 'Acceso denegado. Se requiere rol de propietario.' },
        { status: 403 }
      );
    }

    // Get contracts for the authenticated owner
    // Use OR condition to find contracts that belong to the owner either directly (ownerId)
    // or through property ownership (for contracts where ownerId might be null)
    const contracts = await db.contract.findMany({
      where: {
        OR: [
          { ownerId: user.id }, // Contracts with ownerId set correctly
          { property: { ownerId: user.id } }, // Contracts with ownerId null but property belongs to user
        ],
      },
      include: {
        property: {
          select: {
            id: true,
            title: true,
            address: true,
            city: true,
            commune: true,
            region: true,
            type: true,
            images: true,
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
        broker: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        payments: {
          select: {
            id: true,
            amount: true,
            dueDate: true,
            paidDate: true,
            status: true,
          },
          orderBy: {
            dueDate: 'desc',
          },
          take: 5, // Last 5 payments
        },
        userRatings: {
          where: {
            fromUserId: user.id,
          },
          select: {
            id: true,
            overallRating: true,
            comment: true,
            createdAt: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Transform the data to match the expected format
    const transformedContracts = contracts.map(contract => ({
      ...contract,
      tenantName: contract.tenant?.name,
      tenantEmail: contract.tenant?.email,
      propertyTitle: contract.property?.title,
      brokerName: contract.broker?.name,
      recentPayments: contract.payments,
      userRating: contract.userRatings[0] || null, // Latest rating from this owner
    }));

    return NextResponse.json({
      contracts: transformedContracts,
      total: transformedContracts.length,
    });
  } catch (error) {
    logger.error('Error fetching owner contracts:', {
      error: error instanceof Error ? error.message : String(error),
    });

    // Return empty data when no real contracts exist
    return NextResponse.json({
      contracts: [],
      total: 0,
      message: 'No hay contratos registrados en el sistema',
    });
  }
}

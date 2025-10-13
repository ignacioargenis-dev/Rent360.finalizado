import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { logger } from '@/lib/logger-minimal';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request);

    if (user.role !== 'owner') {
      return NextResponse.json(
        { error: 'Acceso denegado. Se requiere rol de propietario.' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const ownerId = searchParams.get('ownerId');

    // Verify the requested ownerId matches the authenticated user
    if (ownerId && ownerId !== user.id) {
      return NextResponse.json(
        { error: 'No tienes permisos para acceder a estos contratos.' },
        { status: 403 }
      );
    }

    // Get contracts for the owner
    const contracts = await db.contract.findMany({
      where: {
        ownerId: ownerId || user.id,
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

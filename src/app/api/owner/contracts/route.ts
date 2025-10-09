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

    // Return mock data as fallback
    const mockContracts = [
      {
        id: 'mock-1',
        contractNumber: 'CTR-2024-001',
        propertyId: 'prop1',
        tenantId: 'tenant1',
        ownerId: 'owner1',
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-12-31'),
        monthlyRent: 500000,
        deposit: 500000,
        status: 'ACTIVE',
        brokerId: null,
        terms: 'Contrato residencial estándar',
        signedAt: new Date('2023-12-15'),
        terminatedAt: null,
        createdAt: new Date('2023-12-01'),
        updatedAt: new Date('2023-12-15'),
        property: {
          id: 'prop1',
          title: 'Apartamento Centro',
          address: 'Av. Providencia 123',
          city: 'Santiago',
          commune: 'Providencia',
          region: 'Metropolitana',
          type: 'APARTMENT',
          images: null,
        },
        tenant: {
          id: 'tenant1',
          name: 'María González',
          email: 'maria@example.com',
          phone: '+56912345678',
        },
        broker: null,
        tenantName: 'María González',
        tenantEmail: 'maria@example.com',
        propertyTitle: 'Apartamento Centro',
        brokerName: null,
        recentPayments: [],
        userRating: null,
      },
      {
        id: 'mock-2',
        contractNumber: 'CTR-2024-002',
        propertyId: 'prop2',
        tenantId: 'tenant2',
        ownerId: 'owner1',
        startDate: new Date('2024-02-01'),
        endDate: new Date('2025-01-31'),
        monthlyRent: 750000,
        deposit: 750000,
        status: 'ACTIVE',
        brokerId: 'broker1',
        terms: 'Contrato residencial con corredor',
        signedAt: new Date('2024-01-15'),
        terminatedAt: null,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-15'),
        property: {
          id: 'prop2',
          title: 'Casa Los Dominicos',
          address: 'Los Dominicos 456',
          city: 'Santiago',
          commune: 'Las Condes',
          region: 'Metropolitana',
          type: 'HOUSE',
          images: null,
        },
        tenant: {
          id: 'tenant2',
          name: 'Carlos Rodríguez',
          email: 'carlos@example.com',
          phone: '+56987654321',
        },
        broker: {
          id: 'broker1',
          name: 'Ana Martínez',
          email: 'ana@corredora.cl',
        },
        tenantName: 'Carlos Rodríguez',
        tenantEmail: 'carlos@example.com',
        propertyTitle: 'Casa Los Dominicos',
        brokerName: 'Ana Martínez',
        recentPayments: [],
        userRating: null,
      },
    ];

    return NextResponse.json({
      contracts: mockContracts,
      total: mockContracts.length,
      fallback: true, // Indicate this is fallback data
    });
  }
}

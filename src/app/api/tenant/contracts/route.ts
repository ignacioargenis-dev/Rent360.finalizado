import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { db } from '@/lib/db';
import { logger } from '@/lib/logger-minimal';

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request);

    if (user.role !== 'TENANT') {
      return NextResponse.json(
        { error: 'Acceso denegado. Se requieren permisos de inquilino.' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || 'all';
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Construir filtros
    const whereClause: any = {
      tenantId: user.id,
    };

    if (status !== 'all') {
      whereClause.status = status.toUpperCase();
    }

    // Obtener contratos del inquilino
    const contracts = await db.contract.findMany({
      where: whereClause,
      include: {
        property: {
          select: {
            id: true,
            title: true,
            description: true,
            address: true,
            city: true,
            commune: true,
            region: true,
            price: true,
            deposit: true,
            bedrooms: true,
            bathrooms: true,
            area: true,
            status: true,
            type: true,
            images: true,
            features: true,
            furnished: true,
            petFriendly: true,
            parkingSpaces: true,
            availableFrom: true,
            floor: true,
            buildingName: true,
            yearBuilt: true,
            heating: true,
            cooling: true,
            internet: true,
            elevator: true,
            balcony: true,
            terrace: true,
            concierge: true,
            virtualTourEnabled: true,
            virtualTourData: true,
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
        broker: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: limit,
      skip: offset,
    });

    // Transformar datos al formato esperado
    const transformedContracts = contracts.map(contract => {
      const propertyImages = contract.property.images ? JSON.parse(contract.property.images) : [];
      const propertyFeatures = contract.property.features
        ? JSON.parse(contract.property.features)
        : [];

      return {
        id: contract.id,
        contractNumber: `CTR-${contract.id.slice(-8).toUpperCase()}`,
        propertyId: contract.property.id,
        tenantId: contract.tenantId || '',
        ownerId: contract.ownerId || '',
        startDate: contract.startDate ? new Date(contract.startDate).toISOString() : null,
        endDate: contract.endDate ? new Date(contract.endDate).toISOString() : null,
        monthlyRent: contract.monthlyRent,
        deposit: contract.depositAmount,
        status: contract.status,
        brokerId: contract.brokerId,
        terms: contract.terms,
        signedAt: contract.signedAt ? new Date(contract.signedAt).toISOString() : null,
        terminatedAt: contract.terminatedAt ? new Date(contract.terminatedAt).toISOString() : null,
        createdAt: contract.createdAt ? new Date(contract.createdAt).toISOString() : null,
        updatedAt: contract.updatedAt ? new Date(contract.updatedAt).toISOString() : null,
        property: {
          id: contract.property.id,
          title: contract.property.title,
          description: contract.property.description,
          address: contract.property.address,
          city: contract.property.city,
          commune: contract.property.commune,
          region: contract.property.region,
          price: contract.property.price,
          deposit: contract.property.deposit,
          bedrooms: contract.property.bedrooms,
          bathrooms: contract.property.bathrooms,
          area: contract.property.area,
          status: contract.property.status,
          type: contract.property.type,
          images: propertyImages,
          features: propertyFeatures,
          furnished: contract.property.furnished,
          petFriendly: contract.property.petFriendly,
          parkingSpaces: contract.property.parkingSpaces,
          availableFrom: contract.property.availableFrom ? new Date(contract.property.availableFrom).toISOString() : null,
          floor: contract.property.floor,
          buildingName: contract.property.buildingName,
          yearBuilt: contract.property.yearBuilt,
          heating: contract.property.heating,
          cooling: contract.property.cooling,
          internet: contract.property.internet,
          elevator: contract.property.elevator,
          balcony: contract.property.balcony,
          terrace: contract.property.terrace,
          concierge: contract.property.concierge,
          virtualTourEnabled: contract.property.virtualTourEnabled || false,
          virtualTourData: contract.property.virtualTourData,
        },
        owner: contract.owner
          ? {
              id: contract.owner.id,
              name: contract.owner.name,
              email: contract.owner.email,
              phone: contract.owner.phone,
            }
          : null,
        broker: contract.broker
          ? {
              id: contract.broker.id,
              name: contract.broker.name,
              email: contract.broker.email,
              phone: contract.broker.phone,
            }
          : null,
      };
    });

    logger.info('Contratos de inquilino obtenidos', {
      tenantId: user.id,
      count: transformedContracts.length,
      status,
      limit,
      offset,
    });

    return NextResponse.json({
      success: true,
      data: transformedContracts,
      pagination: {
        limit,
        offset,
        total: contracts.length,
        hasMore: contracts.length === limit,
      },
    });
  } catch (error) {
    logger.error('Error obteniendo contratos de inquilino:', {
      error: error instanceof Error ? error.message : String(error),
    });

    return NextResponse.json(
      {
        success: false,
        error: 'Error interno del servidor',
      },
      { status: 500 }
    );
  }
}

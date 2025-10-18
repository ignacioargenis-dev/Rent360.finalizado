import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { db } from '@/lib/db';
import { logger } from '@/lib/logger-minimal';

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request);
    
    if (user.role !== 'BROKER') {
      return NextResponse.json(
        { error: 'Acceso denegado. Se requieren permisos de corredor.' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || 'all';
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Construir filtros
    const whereClause: any = {
      brokerId: user.id
    };
    
    if (status !== 'all') {
      whereClause.status = status.toUpperCase();
    }

    // Obtener propiedades del broker
    const properties = await db.property.findMany({
      where: whereClause,
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          }
        },
        contracts: {
          where: {
            status: 'ACTIVE'
          },
          include: {
            tenant: {
              select: {
                id: true,
                name: true,
                email: true,
                phone: true,
              }
            }
          },
          take: 1,
          orderBy: {
            createdAt: 'desc'
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: limit,
      skip: offset,
    });

    // Transformar datos al formato esperado
    const transformedProperties = properties.map(property => {
      const images = property.images ? JSON.parse(property.images) : [];
      const features = property.features ? JSON.parse(property.features) : [];

      return {
        id: property.id,
        title: property.title,
        address: property.address,
        city: property.city,
        region: property.region,
        type: property.type,
        bedrooms: property.bedrooms,
        bathrooms: property.bathrooms,
        area: property.area,
        price: property.price,
        currency: 'CLP',
        status: property.status.toLowerCase(),
        ownerName: property.owner.name,
        ownerEmail: property.owner.email,
        ownerPhone: property.owner.phone,
        description: property.description,
        features,
        images,
        currentTenant: property.contracts[0]?.tenant ? {
          name: property.contracts[0].tenant.name,
          email: property.contracts[0].tenant.email,
          phone: property.contracts[0].tenant.phone,
          leaseStart: property.contracts[0].startDate.toISOString().split('T')[0],
          leaseEnd: property.contracts[0].endDate.toISOString().split('T')[0],
          monthlyRent: property.contracts[0].monthlyRent,
        } : null,
        maintenanceHistory: [], // Se puede implementar después
        paymentHistory: [], // Se puede implementar después
        // Información adicional
        furnished: property.furnished,
        petFriendly: property.petFriendly,
        parkingSpaces: property.parkingSpaces,
        availableFrom: property.availableFrom?.toISOString().split('T')[0],
        floor: property.floor,
        buildingName: property.buildingName,
        yearBuilt: property.yearBuilt,
        heating: property.heating,
        cooling: property.cooling,
        internet: property.internet,
        elevator: property.elevator,
        balcony: property.balcony,
        terrace: property.terrace,
        concierge: property.concierge,
        virtualTourEnabled: property.virtualTourEnabled,
        virtualTourData: property.virtualTourData,
      };
    });

    logger.info('Propiedades de broker obtenidas', {
      brokerId: user.id,
      count: transformedProperties.length,
      status
    });

    return NextResponse.json({
      success: true,
      data: transformedProperties,
      pagination: {
        limit,
        offset,
        total: properties.length,
        hasMore: properties.length === limit
      }
    });

  } catch (error) {
    logger.error('Error obteniendo propiedades de broker:', {
      error: error instanceof Error ? error.message : String(error),
    });

    return NextResponse.json(
      { 
        success: false,
        error: 'Error interno del servidor'
      },
      { status: 500 }
    );
  }
}
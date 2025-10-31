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

    // Construir filtros para propiedades gestionadas
    const managedPropertiesWhere: any = {
      brokerId: user.id,
      status: 'ACTIVE', // Solo gestión activa
    };

    // Obtener propiedades gestionadas por el broker
    const managedPropertyRecords = await db.brokerPropertyManagement.findMany({
      where: managedPropertiesWhere,
      include: {
        property: {
          include: {
            owner: {
              select: {
                id: true,
                name: true,
                email: true,
                phone: true,
              },
            },
            contracts: {
              where: {
                status: 'ACTIVE',
              },
              include: {
                tenant: {
                  select: {
                    id: true,
                    name: true,
                    email: true,
                    phone: true,
                  },
                },
              },
              take: 1,
              orderBy: {
                createdAt: 'desc',
              },
            },
          },
        },
        client: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                phone: true,
              },
            },
          },
        },
      },
      orderBy: {
        startDate: 'desc',
      },
    });

    // Filtrar por status si se especificó
    let filteredManagedProperties = managedPropertyRecords;
    if (status !== 'all') {
      const statusFilter = status.toUpperCase();
      filteredManagedProperties = managedPropertyRecords.filter(
        record => record.property.status === statusFilter
      );
    }

    // Transformar propiedades gestionadas (sin paginación aún, lo haremos después de combinar)
    const transformedManagedProperties = filteredManagedProperties.map(record => {
      const property = record.property;
      const images = property.images ? JSON.parse(property.images) : [];
      const features = property.features ? JSON.parse(property.features) : [];

      // Obtener el propietario: primero de la propiedad, si no del cliente que gestiona
      const ownerInfo = property.owner || record.client?.user || null;

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
        ownerName: ownerInfo?.name || 'No asignado',
        ownerEmail: ownerInfo?.email || 'No asignado',
        ownerPhone: ownerInfo?.phone || 'No asignado',
        description: property.description,
        features,
        images,
        managementType: record.managementType,
        commissionRate: record.commissionRate,
        exclusivity: record.exclusivity,
        managementStartDate: record.startDate.toISOString(),
        currentTenant: property.contracts[0]?.tenant
          ? {
              name: property.contracts[0].tenant.name,
              email: property.contracts[0].tenant.email,
              phone: property.contracts[0].tenant.phone,
              leaseStart: property.contracts[0].startDate.toISOString().split('T')[0],
              leaseEnd: property.contracts[0].endDate.toISOString().split('T')[0],
              monthlyRent: property.contracts[0].monthlyRent,
            }
          : null,
        maintenanceHistory: [],
        paymentHistory: [],
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
        virtualTourEnabled: property.virtualTourEnabled || false,
        virtualTourData: property.virtualTourData,
      };
    });

    // Obtener propiedades propias del broker (si las tiene)
    const ownPropertiesWhere: any = {
      ownerId: user.id,
    };

    if (status !== 'all') {
      ownPropertiesWhere.status = status.toUpperCase();
    }

    // Obtener todas las propiedades propias
    const allOwnProperties = await db.property.findMany({
      where: ownPropertiesWhere,
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
        contracts: {
          where: {
            status: 'ACTIVE',
          },
          include: {
            tenant: {
              select: {
                id: true,
                name: true,
                email: true,
                phone: true,
              },
            },
          },
          take: 1,
          orderBy: {
            createdAt: 'desc',
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Filtrar por status si se especificó
    let filteredOwnProperties = allOwnProperties;
    if (status !== 'all') {
      const statusFilter = status.toUpperCase();
      filteredOwnProperties = allOwnProperties.filter(
        property => property.status === statusFilter
      );
    }

    // Transformar propiedades gestionadas y propias a un formato común para ordenar
    const transformedManagedForSort = filteredManagedProperties.map(record => ({
      id: record.property.id,
      property: record.property,
      isManaged: true,
      sortDate: record.startDate,
    }));

    const transformedOwnForSort = filteredOwnProperties.map(property => ({
      id: property.id,
      property,
      isManaged: false,
      sortDate: property.createdAt,
    }));

    // Combinar, ordenar por fecha y paginar
    const allCombinedForSort = [...transformedManagedForSort, ...transformedOwnForSort]
      .sort((a, b) => b.sortDate.getTime() - a.sortDate.getTime());

    // Aplicar paginación
    const paginatedCombined = allCombinedForSort.slice(offset, offset + limit);

    // Separar propiedades gestionadas y propias del rango paginado
    const paginatedManaged = paginatedCombined
      .filter(item => item.isManaged)
      .map(item => {
        const found = filteredManagedProperties.find(mp => mp.property.id === item.id);
        if (!found) {
          logger.warn('Property not found in filteredManagedProperties', { propertyId: item.id });
        }
        return found;
      })
      .filter(Boolean) as typeof filteredManagedProperties;

    const paginatedOwn = paginatedCombined
      .filter(item => !item.isManaged)
      .map(item => {
        const found = filteredOwnProperties.find(p => p.id === item.id);
        if (!found) {
          logger.warn('Property not found in filteredOwnProperties', { propertyId: item.id });
        }
        return found;
      })
      .filter(Boolean) as typeof filteredOwnProperties;

    // Transformar propiedades propias del rango paginado
    const transformedOwnProperties = paginatedOwn.map(property => {
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
        ownerName: property.owner?.name || 'Propia',
        ownerEmail: property.owner?.email || 'Propia',
        ownerPhone: property.owner?.phone || 'Propia',
        description: property.description,
        features,
        images,
        managementType: 'owner', // Propiedad propia
        commissionRate: 0,
        exclusivity: false,
        managementStartDate: property.createdAt.toISOString(),
        currentTenant: property.contracts[0]?.tenant
          ? {
              name: property.contracts[0].tenant.name,
              email: property.contracts[0].tenant.email,
              phone: property.contracts[0].tenant.phone,
              leaseStart: property.contracts[0].startDate.toISOString().split('T')[0],
              leaseEnd: property.contracts[0].endDate.toISOString().split('T')[0],
              monthlyRent: property.contracts[0].monthlyRent,
            }
          : null,
        maintenanceHistory: [],
        paymentHistory: [],
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
        virtualTourEnabled: property.virtualTourEnabled || false,
        virtualTourData: property.virtualTourData,
      };
    });

    // Combinar ambas listas (ya están paginadas y ordenadas)
    const transformedManagedPaginated = paginatedManaged.map(record => {
      const property = record.property;
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
        ownerName: property.owner?.name || record.client?.user?.name || 'No asignado',
        ownerEmail: property.owner?.email || record.client?.user?.email || 'No asignado',
        ownerPhone: property.owner?.phone || record.client?.user?.phone || 'No asignado',
        description: property.description,
        features,
        images,
        managementType: record.managementType,
        commissionRate: record.commissionRate,
        exclusivity: record.exclusivity,
        managementStartDate: record.startDate.toISOString(),
        currentTenant: property.contracts[0]?.tenant
          ? {
              name: property.contracts[0].tenant.name,
              email: property.contracts[0].tenant.email,
              phone: property.contracts[0].tenant.phone,
              leaseStart: property.contracts[0].startDate.toISOString().split('T')[0],
              leaseEnd: property.contracts[0].endDate.toISOString().split('T')[0],
              monthlyRent: property.contracts[0].monthlyRent,
            }
          : null,
        maintenanceHistory: [],
        paymentHistory: [],
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
        virtualTourEnabled: property.virtualTourEnabled || false,
        virtualTourData: property.virtualTourData,
      };
    });

    // Combinar ambas listas (ya están paginadas y ordenadas)
    const allProperties = [...transformedManagedPaginated, ...transformedOwnProperties];

    // Calcular total para paginación (ya tenemos los filtrados arriba)
    const totalManagedCount = filteredManagedProperties.length;
    const totalOwnCount = filteredOwnProperties.length;
    const totalCount = totalManagedCount + totalOwnCount;

    logger.info('Propiedades de broker obtenidas', {
      brokerId: user.id,
      count: allProperties.length,
      managedCount: transformedManagedPaginated.length,
      ownCount: transformedOwnProperties.length,
      totalManaged: filteredManagedProperties.length,
      totalOwn: filteredOwnProperties.length,
      paginatedManagedCount: paginatedManaged.length,
      paginatedOwnCount: paginatedOwn.length,
      status,
      offset,
      limit,
    });

    return NextResponse.json({
      success: true,
      data: allProperties,
      pagination: {
        limit,
        offset,
        total: totalCount,
        hasMore: allProperties.length === limit,
      },
    });
  } catch (error) {
    logger.error('Error obteniendo propiedades de broker:', {
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

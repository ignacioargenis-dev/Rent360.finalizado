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
    const type = searchParams.get('type') || 'all';
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Construir filtros
    const whereClause: any = {
      OR: [
        // Clientes que tienen contratos con este broker
        {
          contracts: {
            some: {
              brokerId: user.id
            }
          }
        },
        // Clientes que han sido asignados a este broker
        {
          brokerId: user.id
        }
      ]
    };
    
    if (status !== 'all') {
      whereClause.isActive = status === 'active';
    }

    if (type !== 'all') {
      whereClause.role = type.toUpperCase();
    }

    // Obtener clientes del broker
    const clients = await db.user.findMany({
      where: whereClause,
      include: {
        contracts: {
          where: {
            brokerId: user.id
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
                price: true,
                type: true,
              }
            }
          },
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
    const transformedClients = clients.map(client => ({
      id: client.id,
      name: client.name,
      email: client.email,
      phone: client.phone,
      type: client.role.toLowerCase(),
      status: client.isActive ? 'active' : 'inactive',
      registrationDate: client.createdAt.toISOString().split('T')[0],
      lastContact: client.updatedAt.toISOString().split('T')[0],
      preferredContactMethod: 'email', // Por defecto
      budget: {
        min: 0,
        max: 0,
        currency: 'CLP',
      },
      preferences: {
        propertyType: [],
        bedrooms: 0,
        bathrooms: 0,
        location: [],
        features: [],
      },
      documents: [], // Se puede implementar después
      interactions: [], // Se puede implementar después
      contracts: client.contracts.map(contract => ({
        id: contract.id,
        propertyTitle: contract.property.title,
        propertyAddress: `${contract.property.address}, ${contract.property.commune}, ${contract.property.city}`,
        monthlyRent: contract.monthlyRent,
        startDate: contract.startDate.toISOString().split('T')[0],
        endDate: contract.endDate.toISOString().split('T')[0],
        status: contract.status.toLowerCase(),
        commission: 0, // Calcular basado en configuración
      })),
    }));

    logger.info('Clientes de broker obtenidos', {
      brokerId: user.id,
      count: transformedClients.length,
      status,
      type
    });

    return NextResponse.json({
      success: true,
      data: transformedClients,
      pagination: {
        limit,
        offset,
        total: clients.length,
        hasMore: clients.length === limit
      }
    });

  } catch (error) {
    logger.error('Error obteniendo clientes de broker:', {
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

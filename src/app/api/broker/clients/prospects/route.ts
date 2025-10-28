import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { db } from '@/lib/db';
import { logger } from '@/lib/logger-minimal';

// Forzar renderizado dinámico
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 [PROSPECTS] Iniciando GET /api/broker/clients/prospects');

    const user = await requireAuth(request);
    console.log('✅ [PROSPECTS] Usuario autenticado:', {
      id: user.id,
      email: user.email,
      role: user.role,
    });

    if (user.role !== 'BROKER') {
      console.log('❌ [PROSPECTS] Usuario no es BROKER');
      return NextResponse.json(
        { error: 'Acceso denegado. Se requieren permisos de corredor.' },
        { status: 403 }
      );
    }

    // Obtener parámetros de búsqueda
    const { searchParams } = new URL(request.url);
    const searchQuery = searchParams.get('search') || '';
    const limit = parseInt(searchParams.get('limit') || '100');

    console.log('📋 [PROSPECTS] Parámetros de búsqueda:', { searchQuery, limit });

    // Construir condiciones de búsqueda
    const whereConditions: any = {
      // Excluir el broker mismo y otros brokers
      role: {
        in: ['OWNER', 'TENANT'],
      },
      isActive: true,
    };

    // Si hay búsqueda, filtrar por nombre o email
    if (searchQuery.trim()) {
      whereConditions.OR = [
        { name: { contains: searchQuery, mode: 'insensitive' } },
        { email: { contains: searchQuery, mode: 'insensitive' } },
      ];
    }

    console.log(
      '🔎 [PROSPECTS] Condiciones de búsqueda:',
      JSON.stringify(whereConditions, null, 2)
    );

    // Consultar TODOS los usuarios activos del sistema (OWNER y TENANT) como prospects potenciales
    const prospectsRaw = await db.user.findMany({
      where: whereConditions,
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        avatar: true,
        role: true,
        createdAt: true,
        updatedAt: true,
        // Obtener estadísticas de interacciones
        _count: {
          select: {
            properties: true,
            contractsAsOwner: true,
            contractsAsTenant: true,
          },
        },
        // Obtener propiedades para análisis
        properties: {
          select: {
            id: true,
            type: true,
            city: true,
            commune: true,
            price: true,
            status: true,
          },
          take: 5,
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: limit,
    });

    console.log('📊 [PROSPECTS] Usuarios encontrados:', prospectsRaw.length);
    console.log(
      '👥 [PROSPECTS] Primeros 3 usuarios:',
      prospectsRaw.slice(0, 3).map(p => ({
        id: p.id,
        name: p.name,
        email: p.email,
        role: p.role,
        properties: p._count.properties,
        contracts: p._count.contractsAsOwner + p._count.contractsAsTenant,
      }))
    );

    // Transformar los datos al formato esperado por el frontend
    const prospects = prospectsRaw.map(prospect => {
      // Calcular ubicaciones preferidas basadas en propiedades existentes
      const locations = prospect.properties
        .map(p => p.commune || p.city)
        .filter((v, i, a) => v && a.indexOf(v) === i);
      const preferredLocation = locations.length > 0 ? locations[0] : '';

      // Calcular tipos de propiedades de interés
      const interestedIn = prospect.properties
        .map(p => p.type.toLowerCase())
        .filter((v, i, a) => v && a.indexOf(v) === i);

      // Calcular presupuesto basado en propiedades existentes
      const prices = prospect.properties.map(p => Number(p.price) || 0).filter(p => p > 0);
      const budget = {
        min: prices.length > 0 ? Math.min(...prices) : 0,
        max: prices.length > 0 ? Math.max(...prices) : 0,
      };

      return {
        id: prospect.id,
        name: prospect.name,
        email: prospect.email,
        phone: prospect.phone || '',
        role: prospect.role, // OWNER or TENANT
        interestedIn: interestedIn.length > 0 ? interestedIn : ['apartment'],
        budget,
        preferredLocation,
        status: 'active',
        source: 'platform',
        createdAt: prospect.createdAt.toISOString(),
        lastContact: prospect.updatedAt.toISOString(),
        notes: `Usuario ${prospect.role} en Rent360`,
        avatar: prospect.avatar,
        // Información específica por rol
        ...(prospect.role === 'OWNER'
          ? {
              // Para propietarios: información de su portafolio
              portfolioStats: {
                totalProperties: prospect._count.properties,
                totalValue: prospect.properties.reduce((sum, p) => sum + (Number(p.price) || 0), 0),
                averagePrice:
                  prospect._count.properties > 0
                    ? prospect.properties.reduce((sum, p) => sum + (Number(p.price) || 0), 0) /
                      prospect._count.properties
                    : 0,
                activeListings: prospect.properties.filter(p => p.status === 'AVAILABLE').length,
              },
              recentProperties: prospect.properties.slice(0, 3).map(p => ({
                id: p.id,
                title: p.title,
                address: p.address,
                price: p.price,
                status: p.status,
                type: p.type,
              })),
            }
          : {
              // Para inquilinos: información de búsqueda
              searchProfile: {
                totalContracts: prospect._count.contractsAsTenant,
                activeTenancies: prospect.contractsAsTenant.filter(c => c.status === 'ACTIVE')
                  .length,
                rentalHistory: prospect.contractsAsTenant.length,
              },
            }),
      };
    });

    console.log('✅ [PROSPECTS] Prospects transformados:', prospects.length);
    console.log('📤 [PROSPECTS] Enviando respuesta JSON');

    logger.info('Prospects obtenidos para broker', {
      brokerId: user.id,
      count: prospects.length,
    });

    return NextResponse.json({
      success: true,
      data: prospects,
      pagination: {
        limit: limit,
        offset: 0,
        total: prospects.length,
        hasMore: false,
      },
    });
  } catch (error) {
    console.error('❌ [PROSPECTS] Error:', error);
    logger.error('Error obteniendo prospects:', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });

    return NextResponse.json(
      {
        success: false,
        error: 'Error interno del servidor',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(request);

    if (user.role !== 'BROKER') {
      return NextResponse.json(
        { error: 'Acceso denegado. Se requieren permisos de corredor.' },
        { status: 403 }
      );
    }

    const data = await request.json();

    // Validar datos básicos
    const { name, email, phone } = data;

    if (!name || !email || !phone) {
      return NextResponse.json(
        { error: 'Nombre, email y teléfono son requeridos' },
        { status: 400 }
      );
    }

    // Por ahora, solo loggear ya que no hay modelo de prospects
    // En el futuro, esto debería crear un registro en la tabla de prospects
    logger.info('Nuevo prospect creado', {
      brokerId: user.id,
      prospectData: {
        name,
        email,
        phone,
        interestedIn: data.interestedIn || [],
        budget: data.budget || {},
        preferredLocation: data.preferredLocation || '',
        source: data.source || 'website',
      },
    });

    // Devolver respuesta mock por ahora
    const newProspect = {
      id: `temp_${Date.now()}`,
      name,
      email,
      phone,
      interestedIn: data.interestedIn || [],
      budget: data.budget || { min: 0, max: 0 },
      preferredLocation: data.preferredLocation || '',
      status: 'active',
      source: data.source || 'website',
      createdAt: new Date().toISOString(),
      lastContact: new Date().toISOString(),
      notes: data.notes || '',
    };

    return NextResponse.json({
      success: true,
      data: newProspect,
      message: 'Prospect creado exitosamente',
    });
  } catch (error) {
    logger.error('Error creando prospect:', {
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

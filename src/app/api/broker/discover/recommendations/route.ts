import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { z } from 'zod';
import { logger } from '@/lib/logger';

/**
 * API para recomendaciones inteligentes de leads
 * El sistema genera recomendaciones automáticas basadas en múltiples factores
 */

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ success: false, error: 'No autenticado' }, { status: 401 });
    }

    if (session.user.role !== 'BROKER') {
      return NextResponse.json(
        { success: false, error: 'Solo corredores pueden acceder a esta función' },
        { status: 403 }
      );
    }

    const brokerId = session.user.id;
    const params = {
      status: request.nextUrl.searchParams.get('status') || undefined,
      limit: parseInt(request.nextUrl.searchParams.get('limit') || '10'),
    };

    logger.info('📊 Fetching recommendations for broker', { brokerId, params });

    // Filtros
    const where: any = {
      brokerId,
      expiresAt: {
        gte: new Date(), // Solo recomendaciones vigentes
      },
    };

    if (params.status) {
      where.status = params.status;
    }

    // Obtener recomendaciones existentes
    const recommendations = await db.brokerLeadRecommendation.findMany({
      where,
      take: params.limit,
      orderBy: [{ matchScore: 'desc' }, { createdAt: 'desc' }],
      include: {
        recommendedUser: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            role: true,
            city: true,
            commune: true,
            region: true,
            avatar: true,
            createdAt: true,
            lastLogin: true,
            _count: {
              select: {
                properties: true,
                contractsAsOwner: true,
                contractsAsTenant: true,
              },
            },
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: recommendations,
      meta: {
        total: recommendations.length,
        new: recommendations.filter(r => r.status === 'NEW').length,
        viewed: recommendations.filter(r => r.status === 'VIEWED').length,
      },
    });
  } catch (error: any) {
    logger.error('Error fetching recommendations', {
      error: error.message,
      stack: error.stack,
    });

    return NextResponse.json(
      { success: false, error: 'Error al obtener recomendaciones' },
      { status: 500 }
    );
  }
}

/**
 * POST - Generar nuevas recomendaciones
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ success: false, error: 'No autenticado' }, { status: 401 });
    }

    if (session.user.role !== 'BROKER') {
      return NextResponse.json(
        { success: false, error: 'Solo corredores pueden acceder a esta función' },
        { status: 403 }
      );
    }

    const brokerId = session.user.id;

    logger.info('🤖 Generating recommendations for broker', { brokerId });

    // Obtener información del corredor
    const broker = await db.user.findUnique({
      where: { id: brokerId },
      select: {
        city: true,
        commune: true,
        region: true,
        brokerClients: {
          where: { status: 'ACTIVE' },
          select: { clientType: true },
        },
      },
    });

    if (!broker) {
      return NextResponse.json(
        { success: false, error: 'Corredor no encontrado' },
        { status: 404 }
      );
    }

    // Buscar propietarios sin corredor activo
    const potentialOwners = await db.user.findMany({
      where: {
        role: 'OWNER',
        isActive: true,
        id: { not: brokerId },
        // Sin relación activa con corredor
        clientRelationships: {
          none: {
            status: 'ACTIVE',
          },
        },
        // Que tengan propiedades
        properties: {
          some: {
            isActive: true,
          },
        },
      },
      take: 50,
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        city: true,
        commune: true,
        region: true,
        createdAt: true,
        lastLogin: true,
        _count: {
          select: {
            properties: true,
            contractsAsOwner: true,
          },
        },
        properties: {
          where: { isActive: true },
          take: 5,
          select: {
            id: true,
            title: true,
            propertyType: true,
            city: true,
            commune: true,
            price: true,
            status: true,
          },
        },
      },
    });

    // Buscar inquilinos activos sin corredor
    const potentialTenants = await db.user.findMany({
      where: {
        role: 'TENANT',
        isActive: true,
        id: { not: brokerId },
        clientRelationships: {
          none: {
            status: 'ACTIVE',
          },
        },
        // Que hayan mostrado interés reciente
        OR: [
          {
            propertyFavorites: {
              some: {
                createdAt: {
                  gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Últimos 30 días
                },
              },
            },
          },
          {
            visitsAsTenant: {
              some: {
                createdAt: {
                  gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
                },
              },
            },
          },
        ],
      },
      take: 50,
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        city: true,
        commune: true,
        region: true,
        createdAt: true,
        lastLogin: true,
        _count: {
          select: {
            propertyFavorites: true,
            visitsAsTenant: true,
            contractsAsTenant: true,
          },
        },
      },
    });

    // Calcular match scores y crear recomendaciones
    const newRecommendations = [];

    // Procesar propietarios
    for (const owner of potentialOwners) {
      let matchScore = 50;
      const reasons = [];

      // Matching por ubicación
      if (broker.city && owner.city === broker.city) {
        matchScore += 15;
        reasons.push('Misma ciudad');
      }
      if (broker.commune && owner.commune === broker.commune) {
        matchScore += 10;
        reasons.push('Misma comuna');
      }

      // Bonus por propiedades
      const propertyCount = owner._count.properties;
      if (propertyCount >= 3) {
        matchScore += 20;
        reasons.push(`${propertyCount} propiedades`);
      } else if (propertyCount >= 1) {
        matchScore += 10;
        reasons.push(`${propertyCount} propiedad(es)`);
      }

      // Bonus por propiedades sin gestión activa
      const unmanaged = owner.properties.filter(
        p => p.status === 'AVAILABLE' || p.status === 'PENDING'
      );
      if (unmanaged.length > 0) {
        matchScore += 15;
        reasons.push(`${unmanaged.length} propiedad(es) sin gestión`);
      }

      // Usuario reciente
      const daysSinceRegistration =
        (Date.now() - owner.createdAt.getTime()) / (1000 * 60 * 60 * 24);
      if (daysSinceRegistration < 30) {
        matchScore += 10;
        reasons.push('Usuario reciente');
      }

      // Verificar que no exista recomendación previa
      const existing = await db.brokerLeadRecommendation.findUnique({
        where: {
          brokerId_recommendedUserId: {
            brokerId,
            recommendedUserId: owner.id,
          },
        },
      });

      if (!existing && matchScore >= 60) {
        newRecommendations.push({
          brokerId,
          recommendedUserId: owner.id,
          leadType: 'OWNER_LEAD',
          matchScore: Math.min(100, matchScore),
          reasons: JSON.stringify(reasons),
          userData: JSON.stringify({
            name: owner.name,
            email: owner.email,
            phone: owner.phone,
            city: owner.city,
            commune: owner.commune,
            properties: owner.properties.length,
            contracts: owner._count.contractsAsOwner,
          }),
          expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 días
          status: 'NEW',
        });
      }
    }

    // Procesar inquilinos
    for (const tenant of potentialTenants) {
      let matchScore = 50;
      const reasons = [];

      // Matching por ubicación
      if (broker.city && tenant.city === broker.city) {
        matchScore += 15;
        reasons.push('Misma ciudad');
      }

      // Bonus por actividad reciente
      if (tenant._count.propertyFavorites > 0) {
        matchScore += 10;
        reasons.push(`${tenant._count.propertyFavorites} favoritos recientes`);
      }
      if (tenant._count.visitsAsTenant > 0) {
        matchScore += 15;
        reasons.push(`${tenant._count.visitsAsTenant} visitas realizadas`);
      }

      // Sin contratos activos (busca activamente)
      if (tenant._count.contractsAsTenant === 0) {
        matchScore += 10;
        reasons.push('Sin contrato actual');
      }

      const existing = await db.brokerLeadRecommendation.findUnique({
        where: {
          brokerId_recommendedUserId: {
            brokerId,
            recommendedUserId: tenant.id,
          },
        },
      });

      if (!existing && matchScore >= 60) {
        newRecommendations.push({
          brokerId,
          recommendedUserId: tenant.id,
          leadType: 'TENANT_LEAD',
          matchScore: Math.min(100, matchScore),
          reasons: JSON.stringify(reasons),
          userData: JSON.stringify({
            name: tenant.name,
            email: tenant.email,
            phone: tenant.phone,
            city: tenant.city,
            commune: tenant.commune,
            favorites: tenant._count.propertyFavorites,
            visits: tenant._count.visitsAsTenant,
          }),
          expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 días
          status: 'NEW',
        });
      }
    }

    // Crear recomendaciones en batch
    if (newRecommendations.length > 0) {
      await db.brokerLeadRecommendation.createMany({
        data: newRecommendations,
      });
    }

    logger.info('✅ Recommendations generated', {
      brokerId,
      generated: newRecommendations.length,
    });

    return NextResponse.json({
      success: true,
      data: {
        generated: newRecommendations.length,
        owners: newRecommendations.filter(r => r.leadType === 'OWNER_LEAD').length,
        tenants: newRecommendations.filter(r => r.leadType === 'TENANT_LEAD').length,
      },
      message: `Se generaron ${newRecommendations.length} nuevas recomendaciones`,
    });
  } catch (error: any) {
    logger.error('Error generating recommendations', {
      error: error.message,
      stack: error.stack,
    });

    return NextResponse.json(
      { success: false, error: 'Error al generar recomendaciones' },
      { status: 500 }
    );
  }
}

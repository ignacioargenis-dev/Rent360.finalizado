import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { z } from 'zod';
import { logger } from '@/lib/logger';

/**
 * API del Marketplace de Solicitudes de Servicio
 * Los corredores pueden ver solicitudes abiertas de propietarios e inquilinos
 */

/**
 * GET - Listar solicitudes abiertas en el marketplace
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ success: false, error: 'No autenticado' }, { status: 401 });
    }

    if (session.user.role !== 'BROKER') {
      return NextResponse.json(
        { success: false, error: 'Solo corredores pueden acceder al marketplace' },
        { status: 403 }
      );
    }

    const brokerId = session.user.id;

    // Parámetros de filtro
    const userType = request.nextUrl.searchParams.get('userType');
    const requestType = request.nextUrl.searchParams.get('requestType');
    const urgency = request.nextUrl.searchParams.get('urgency');
    const city = request.nextUrl.searchParams.get('city');
    const commune = request.nextUrl.searchParams.get('commune');
    const limit = parseInt(request.nextUrl.searchParams.get('limit') || '20');
    const offset = parseInt(request.nextUrl.searchParams.get('offset') || '0');

    logger.info('🏪 Broker accessing marketplace', {
      brokerId,
      filters: { userType, requestType, urgency, city },
    });

    // Filtros
    const where: any = {
      status: 'OPEN', // Solo solicitudes abiertas
      expiresAt: {
        gte: new Date(), // No expiradas
      },
    };

    if (userType) {
      where.userType = userType;
    }
    if (requestType) {
      where.requestType = requestType;
    }
    if (urgency) {
      where.urgency = urgency;
    }

    // Obtener solicitudes
    const requests = await db.brokerServiceRequest.findMany({
      where,
      take: limit,
      skip: offset,
      orderBy: [
        { urgency: 'desc' }, // Urgentes primero
        { createdAt: 'desc' },
      ],
      include: {
        user: {
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
            _count: {
              select: {
                properties: true,
                contractsAsOwner: true,
                contractsAsTenant: true,
              },
            },
          },
        },
        responses: {
          where: {
            brokerId,
          },
          select: {
            id: true,
            status: true,
            createdAt: true,
          },
        },
        _count: {
          select: {
            responses: true,
          },
        },
      },
    });

    // Filtrar por ciudad/comuna si se especifica
    let filteredRequests = requests;
    if (city || commune) {
      filteredRequests = requests.filter(req => {
        if (city && req.user.city !== city) {
          return false;
        }
        if (commune && req.user.commune !== commune) {
          return false;
        }
        return true;
      });
    }

    // Calcular match score para cada solicitud
    const requestsWithScore = filteredRequests.map(req => {
      let matchScore = 50;

      // Bonus por urgencia
      if (req.urgency === 'URGENT') {
        matchScore += 20;
      } else if (req.urgency === 'HIGH') {
        matchScore += 10;
      }

      // Bonus por tipo de solicitud (priorizar gestión de propiedades)
      if (req.requestType === 'PROPERTY_MANAGEMENT') {
        matchScore += 15;
      }

      // Bonus por solicitud reciente
      const hoursSinceCreated = (Date.now() - req.createdAt.getTime()) / (1000 * 60 * 60);
      if (hoursSinceCreated < 24) {
        matchScore += 10;
      }

      // Penalty por muchas respuestas ya recibidas
      if (req._count.responses > 5) {
        matchScore -= 15;
      }

      // Ya respondí a esta solicitud
      const alreadyResponded = req.responses.length > 0;

      return {
        ...req,
        matchScore: Math.max(0, Math.min(100, matchScore)),
        alreadyResponded,
        userStats: {
          properties: req.user._count.properties,
          contractsAsOwner: req.user._count.contractsAsOwner,
          contractsAsTenant: req.user._count.contractsAsTenant,
        },
      };
    });

    // Ordenar por match score
    requestsWithScore.sort((a, b) => b.matchScore - a.matchScore);

    const total = await db.brokerServiceRequest.count({ where });

    // Estadísticas
    const stats = {
      total,
      byType: await db.brokerServiceRequest.groupBy({
        by: ['requestType'],
        where,
        _count: true,
      }),
      byUrgency: await db.brokerServiceRequest.groupBy({
        by: ['urgency'],
        where,
        _count: true,
      }),
    };

    return NextResponse.json({
      success: true,
      data: requestsWithScore,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + requestsWithScore.length < total,
      },
      stats,
    });
  } catch (error: any) {
    logger.error('Error fetching marketplace requests', {
      error: error.message,
      stack: error.stack,
    });

    return NextResponse.json(
      { success: false, error: 'Error al obtener solicitudes del marketplace' },
      { status: 500 }
    );
  }
}

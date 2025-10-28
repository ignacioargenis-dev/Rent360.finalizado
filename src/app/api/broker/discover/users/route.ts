import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { z } from 'zod';
import { logger } from '@/lib/logger';

/**
 * API para búsqueda inteligente de usuarios (propietarios e inquilinos)
 * para que los corredores descubran clientes potenciales
 */

const searchSchema = z.object({
  userType: z.enum(['OWNER', 'TENANT', 'BOTH']).optional(),
  city: z.string().optional(),
  commune: z.string().optional(),
  region: z.string().optional(),
  hasProperties: z.boolean().optional(),
  noBroker: z.boolean().optional().default(true), // Por defecto, solo usuarios sin corredor
  minProperties: z.number().optional(),
  maxProperties: z.number().optional(),
  registeredAfter: z.string().optional(), // ISO date
  lastLoginBefore: z.string().optional(), // ISO date (usuarios inactivos)
  search: z.string().optional(), // Búsqueda por nombre, email
  limit: z.number().min(1).max(100).optional().default(20),
  offset: z.number().min(0).optional().default(0),
  sortBy: z.enum(['recent', 'properties', 'activity', 'match']).optional().default('match'),
});

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

    // Parsear parámetros de búsqueda
    const searchParams = Object.fromEntries(request.nextUrl.searchParams.entries());

    // Convertir strings booleanos
    if (searchParams.hasProperties) {
      searchParams.hasProperties = searchParams.hasProperties === 'true';
    }
    if (searchParams.noBroker) {
      searchParams.noBroker = searchParams.noBroker === 'true';
    }
    if (searchParams.minProperties) {
      searchParams.minProperties = parseInt(searchParams.minProperties);
    }
    if (searchParams.maxProperties) {
      searchParams.maxProperties = parseInt(searchParams.maxProperties);
    }
    if (searchParams.limit) {
      searchParams.limit = parseInt(searchParams.limit);
    }
    if (searchParams.offset) {
      searchParams.offset = parseInt(searchParams.offset);
    }

    const params = searchSchema.parse(searchParams);

    logger.info('🔍 Broker searching for users', {
      brokerId: session.user.id,
      params,
    });

    // Construir filtros
    const where: any = {
      isActive: true,
      emailVerified: true,
      id: {
        not: session.user.id, // Excluir al corredor actual
      },
    };

    // Filtro por tipo de usuario
    if (params.userType === 'OWNER') {
      where.role = 'OWNER';
    } else if (params.userType === 'TENANT') {
      where.role = 'TENANT';
    } else if (params.userType === 'BOTH') {
      where.role = {
        in: ['OWNER', 'TENANT'],
      };
    } else {
      // Por defecto, OWNER y TENANT
      where.role = {
        in: ['OWNER', 'TENANT'],
      };
    }

    // Filtro por ubicación
    if (params.city) {
      where.city = {
        contains: params.city,
        mode: 'insensitive',
      };
    }
    if (params.commune) {
      where.commune = {
        contains: params.commune,
        mode: 'insensitive',
      };
    }
    if (params.region) {
      where.region = {
        contains: params.region,
        mode: 'insensitive',
      };
    }

    // Filtro de búsqueda de texto
    if (params.search) {
      where.OR = [
        {
          name: {
            contains: params.search,
            mode: 'insensitive',
          },
        },
        {
          email: {
            contains: params.search,
            mode: 'insensitive',
          },
        },
      ];
    }

    // Filtro por fecha de registro
    if (params.registeredAfter) {
      where.createdAt = {
        gte: new Date(params.registeredAfter),
      };
    }

    // Filtro por última actividad
    if (params.lastLoginBefore) {
      where.lastLogin = {
        lte: new Date(params.lastLoginBefore),
      };
    }

    // Filtro: solo usuarios sin corredor asignado
    if (params.noBroker) {
      where.clientRelationships = {
        none: {
          status: 'ACTIVE',
        },
      };
    }

    // Obtener usuarios con conteo de propiedades
    const users = await db.user.findMany({
      where,
      take: params.limit,
      skip: params.offset,
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        rut: true,
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
            propertyFavorites: true,
          },
        },
      },
      orderBy:
        params.sortBy === 'recent'
          ? { createdAt: 'desc' }
          : params.sortBy === 'activity'
            ? { lastLogin: 'desc' }
            : params.sortBy === 'properties'
              ? { properties: { _count: 'desc' } }
              : { createdAt: 'desc' }, // default
    });

    // Filtrar por cantidad de propiedades si se especifica
    let filteredUsers = users;
    if (params.minProperties !== undefined || params.maxProperties !== undefined) {
      filteredUsers = users.filter(user => {
        const propCount = user._count.properties;
        if (params.minProperties !== undefined && propCount < params.minProperties) {
          return false;
        }
        if (params.maxProperties !== undefined && propCount > params.maxProperties) {
          return false;
        }
        return true;
      });
    }

    // Calcular match score básico
    const usersWithScore = filteredUsers.map(user => {
      let matchScore = 50; // Score base

      // Bonus si tiene propiedades
      if (user._count.properties > 0) {
        matchScore += Math.min(user._count.properties * 5, 20);
      }

      // Bonus si tiene contratos
      const totalContracts = user._count.contractsAsOwner + user._count.contractsAsTenant;
      if (totalContracts > 0) {
        matchScore += Math.min(totalContracts * 3, 15);
      }

      // Bonus si está en la misma ciudad que el corredor
      // (asumiendo que tenemos la ciudad del corredor en session)

      // Penalty si lleva mucho tiempo sin login
      if (user.lastLogin) {
        const daysSinceLogin = (Date.now() - user.lastLogin.getTime()) / (1000 * 60 * 60 * 24);
        if (daysSinceLogin > 90) {
          matchScore -= 10;
        }
      }

      // Bonus si es reciente
      const daysSinceRegistration = (Date.now() - user.createdAt.getTime()) / (1000 * 60 * 60 * 24);
      if (daysSinceRegistration < 30) {
        matchScore += 10;
      }

      return {
        ...user,
        matchScore: Math.max(0, Math.min(100, matchScore)),
        stats: {
          properties: user._count.properties,
          contractsAsOwner: user._count.contractsAsOwner,
          contractsAsTenant: user._count.contractsAsTenant,
          favorites: user._count.propertyFavorites,
        },
        _count: undefined,
      };
    });

    // Re-ordenar por score si sortBy es 'match'
    if (params.sortBy === 'match') {
      usersWithScore.sort((a, b) => b.matchScore - a.matchScore);
    }

    // Contar total
    const total = await db.user.count({ where });

    return NextResponse.json({
      success: true,
      data: usersWithScore,
      pagination: {
        total,
        limit: params.limit,
        offset: params.offset,
        hasMore: params.offset + usersWithScore.length < total,
      },
    });
  } catch (error: any) {
    logger.error('Error searching users for broker', {
      error: error.message,
      stack: error.stack,
    });

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Parámetros de búsqueda inválidos', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, error: 'Error al buscar usuarios' },
      { status: 500 }
    );
  }
}

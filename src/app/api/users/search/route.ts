import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { db } from '@/lib/db';
import { logger } from '@/lib/logger-minimal';

// Forzar renderizado dinámico
export const dynamic = 'force-dynamic';

/**
 * GET /api/users/search
 * Busca usuarios por nombre, email o ID
 */
export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request);
    const { searchParams } = new URL(request.url);

    const query = searchParams.get('query')?.trim();
    const role = searchParams.get('role');
    const limit = parseInt(searchParams.get('limit') || '20');

    if (!query || query.length < 2) {
      return NextResponse.json({
        success: true,
        users: [],
        message: 'Query debe tener al menos 2 caracteres',
      });
    }

    // Construir filtros
    const where: any = {
      isActive: true,
      OR: [
        {
          name: {
            contains: query,
            mode: 'insensitive',
          },
        },
        {
          email: {
            contains: query,
            mode: 'insensitive',
          },
        },
        {
          id: query, // Búsqueda exacta por ID
        },
      ],
    };

    // Filtrar por rol si se especifica
    if (role) {
      const searchRole = role.toUpperCase();

      // ✅ COMPATIBILIDAD: Mapear roles unificados a los esperados por el sistema
      const roleMapping: { [key: string]: string[] } = {
        PROVIDER: ['PROVIDER', 'SERVICEPROVIDER'], // Aceptar ambos
        MAINTENANCE: ['MAINTENANCE', 'MAINTENANCEPROVIDER'], // Aceptar ambos
        SERVICEPROVIDER: ['PROVIDER', 'SERVICEPROVIDER'], // Alias para PROVIDER
        MAINTENANCEPROVIDER: ['MAINTENANCE', 'MAINTENANCEPROVIDER'], // Alias para MAINTENANCE
      };

      // Si hay un mapeo, usar OR con los roles equivalentes
      if (roleMapping[searchRole]) {
        where.role = { in: roleMapping[searchRole] };
      } else {
        where.role = searchRole;
      }
    }

    // Los usuarios no pueden buscar usuarios con rol superior o igual
    const currentUserRole = user.role;
    const roleHierarchy = {
      OWNER: 1,
      TENANT: 1,
      BROKER: 2,
      PROVIDER: 1,
      SERVICEPROVIDER: 1, // Alias de PROVIDER
      MAINTENANCE: 1,
      MAINTENANCEPROVIDER: 1, // Alias de MAINTENANCE
      RUNNER: 1,
      ADMIN: 3,
      SUPPORT: 2,
    };

    const currentRoleLevel = roleHierarchy[currentUserRole as keyof typeof roleHierarchy] || 0;

    // Restringir búsqueda según el rol del usuario actual
    if (currentUserRole === 'OWNER') {
      // Propietarios pueden buscar corredores, proveedores, soporte, mantenimiento, runners e inquilinos (para comunicación)
      where.role = {
        in: [
          'BROKER',
          'PROVIDER',
          'SERVICEPROVIDER',
          'SUPPORT',
          'MAINTENANCE',
          'MAINTENANCEPROVIDER',
          'RUNNER',
          'TENANT',
        ],
      };
    } else if (currentUserRole === 'TENANT') {
      // ✅ CORRECCIÓN: Inquilinos ahora pueden buscar otros inquilinos, corredores, proveedores y soporte
      // Esto permite la comunicación entre inquilinos para temas relacionados con alquileres
      where.role = {
        in: [
          'BROKER',
          'PROVIDER',
          'SERVICEPROVIDER',
          'SUPPORT',
          'MAINTENANCE',
          'MAINTENANCEPROVIDER',
          'RUNNER',
          'TENANT',
        ],
      };
    } else if (currentUserRole === 'BROKER') {
      // Corredores pueden buscar propietarios, inquilinos y proveedores
      where.role = {
        in: [
          'OWNER',
          'TENANT',
          'PROVIDER',
          'SERVICEPROVIDER',
          'SUPPORT',
          'MAINTENANCE',
          'MAINTENANCEPROVIDER',
          'RUNNER',
        ],
      };
    } else if (
      currentUserRole === 'PROVIDER' ||
      currentUserRole === 'SERVICEPROVIDER' ||
      currentUserRole === 'MAINTENANCE' ||
      currentUserRole === 'MAINTENANCEPROVIDER' ||
      currentUserRole === 'RUNNER'
    ) {
      // Proveedores y mantenimiento solo pueden buscar propietarios, inquilinos y corredores
      where.role = {
        in: ['OWNER', 'TENANT', 'BROKER', 'SUPPORT'],
      };
    } else if (currentUserRole === 'SUPPORT') {
      // Soporte puede buscar todos los roles
      // No aplicar restricciones adicionales
    }

    // Excluir al propio usuario de los resultados
    where.id = {
      not: user.id,
    };

    const users = await db.user.findMany({
      where,
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        avatar: true,
        city: true,
        commune: true,
        createdAt: true,
      },
      orderBy: [
        {
          name: 'asc',
        },
      ],
      take: Math.min(limit, 50), // Máximo 50 resultados
    });

    logger.info('User search completed', {
      query,
      role,
      resultsCount: users.length,
      searcherRole: currentUserRole,
    });

    return NextResponse.json({
      success: true,
      users,
      count: users.length,
    });
  } catch (error) {
    logger.error('Error searching users:', {
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

import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, requireRole } from '@/lib/auth';
import { getUsersOptimized } from '@/lib/db-optimizer';
import { logger } from '@/lib/logger';

export async function GET(request: NextRequest) {
  try {
    logger.info('🔍 Debug Users: Iniciando diagnóstico de API users', {
      context: 'debug-users',
      method: 'GET',
      url: request.url,
      userAgent: request.headers.get('user-agent'),
    });

    // Verificar autenticación primero
    let user;
    try {
      user = await requireAuth(request);
      logger.info('🔍 Debug Users: Usuario autenticado', {
        context: 'debug-users',
        userId: user.id,
        userEmail: user.email,
        userRole: user.role,
      });
    } catch (error) {
      const authError = error instanceof Error ? error.message : String(error);
      logger.warn('🔍 Debug Users: Falló autenticación', {
        context: 'debug-users',
        error: authError,
      });

      return NextResponse.json(
        {
          success: false,
          error: 'No autorizado',
          details: authError,
          timestamp: new Date().toISOString(),
        },
        {
          status: 401,
          headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
          },
        }
      );
    }

    // Verificar permisos de admin
    try {
      await requireRole(request, 'admin');
      logger.info('🔍 Debug Users: Permisos de admin verificados', {
        context: 'debug-users',
        userId: user.id,
        userRole: user.role,
      });
    } catch (error) {
      const roleError = error instanceof Error ? error.message : String(error);
      logger.warn('🔍 Debug Users: Fallaron permisos de admin', {
        context: 'debug-users',
        error: roleError,
        userRole: user.role,
      });

      return NextResponse.json(
        {
          success: false,
          error: 'Acceso denegado',
          details: roleError,
          userRole: user.role,
          timestamp: new Date().toISOString(),
        },
        {
          status: 403,
          headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
          },
        }
      );
    }

    // Obtener parámetros de consulta
    const { searchParams } = new URL(request.url);
    const role = searchParams.get('role');
    const isActive = searchParams.get('isActive');
    const search = searchParams.get('search');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');

    logger.info('🔍 Debug Users: Parámetros de consulta', {
      context: 'debug-users',
      role,
      isActive,
      search,
      page,
      limit,
    });

    // Construir filtros
    const where: any = {};

    if (role && role !== 'all') {
      where.role = role;
    }

    if (isActive === 'true') {
      where.isActive = true;
    } else if (isActive === 'false') {
      where.isActive = false;
    } else if (isActive === 'all') {
      // No filtrar por isActive
    } else {
      // Por defecto, mostrar solo usuarios activos
      where.isActive = true;
    }

    if (search) {
      where.OR = [
        { email: { contains: search, mode: 'insensitive' } },
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
      ];
    }

    logger.info('🔍 Debug Users: Filtros aplicados', {
      context: 'debug-users',
      where: JSON.stringify(where),
    });

    // Obtener usuarios
    let users;
    let total;
    try {
      const result = await getUsersOptimized({
        where,
        page,
        limit,
        orderBy: { createdAt: 'desc' },
      });

      users = result.users;
      total = result.total;

      logger.info('🔍 Debug Users: Usuarios obtenidos exitosamente', {
        context: 'debug-users',
        userCount: users.length,
        totalCount: total,
        page,
        limit,
      });
    } catch (error) {
      const dbError = error instanceof Error ? error.message : String(error);
      logger.error('🔍 Debug Users: Error en base de datos', {
        context: 'debug-users',
        error: dbError,
        where: JSON.stringify(where),
      });

      return NextResponse.json(
        {
          success: false,
          error: 'Error en base de datos',
          details: dbError,
          timestamp: new Date().toISOString(),
        },
        {
          status: 500,
          headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
          },
        }
      );
    }

    // Respuesta exitosa
    const response = {
      success: true,
      users,
      total,
      page,
      limit,
      filters: {
        role,
        isActive,
        search,
      },
      diagnostic: {
        authenticatedUser: {
          id: user.id,
          email: user.email,
          role: user.role,
        },
        queryFilters: where,
        pagination: { page, limit, total },
        timestamp: new Date().toISOString(),
      },
    };

    logger.info('🔍 Debug Users: Respuesta enviada exitosamente', {
      context: 'debug-users',
      userCount: users.length,
      totalCount: total,
    });

    return NextResponse.json(response, {
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
    });
  } catch (error) {
    const internalError = error instanceof Error ? error.message : String(error);
    logger.error('🔍 Debug Users: Error interno del servidor', {
      context: 'debug-users',
      error: internalError,
    });

    return NextResponse.json(
      {
        success: false,
        error: 'Error interno del servidor',
        details: internalError,
        timestamp: new Date().toISOString(),
      },
      {
        status: 500,
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
        },
      }
    );
  }
}

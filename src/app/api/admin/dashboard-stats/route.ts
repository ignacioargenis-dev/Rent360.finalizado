import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { db } from '@/lib/db';
import { logger } from '@/lib/logger-minimal';

export async function GET(request: NextRequest) {
  try {
    // Verificar autenticación
    const user = await requireAuth(request);
    if (user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Acceso denegado. Se requieren permisos de administrador.' },
        { status: 403 }
      );
    }

    logger.info('GET /api/admin/dashboard-stats - Iniciando consulta de estadísticas...');

    // Obtener estadísticas reales de la base de datos
    const [totalUsers, totalProperties, activeContracts, totalPayments, pendingTickets] =
      await Promise.all([
        // Contar solo usuarios activos
        db.user.count({
          where: { isActive: true },
        }),
        // Contar todas las propiedades
        db.property.count(),
        // Contar contratos activos (aquellos con status 'active' o similares)
        db.contract.count({
          where: {
            status: 'active', // Ajustar según el enum real de contratos
          },
        }),
        // Contar todos los pagos (para calcular revenue mensual)
        db.payment.count(),
        // Contar tickets pendientes (aquellos con status 'open' o 'pending')
        db.ticket?.count({
          where: {
            status: 'open', // Ajustar según el enum real de tickets
          },
        }) || 0, // Fallback si no existe tabla de tickets
      ]);

    // Calcular revenue mensual (últimos 30 días)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const monthlyRevenue = await db.payment.aggregate({
      where: {
        status: 'completed', // Ajustar según el enum real de pagos
        createdAt: {
          gte: thirtyDaysAgo,
        },
      },
      _sum: {
        amount: true,
      },
    });

    const revenue = monthlyRevenue._sum.amount || 0;

    // Determinar estado de salud del sistema basado en las métricas
    let systemHealth = 'good';
    if (pendingTickets > 10) {
      systemHealth = 'warning';
    }
    if (pendingTickets > 50 || totalUsers === 0) {
      systemHealth = 'critical';
    }

    const stats = {
      totalUsers,
      totalProperties,
      activeContracts,
      monthlyRevenue: revenue,
      pendingTickets,
      systemHealth,
    };

    logger.info('Estadísticas del dashboard obtenidas', {
      totalUsers,
      totalProperties,
      activeContracts,
      monthlyRevenue: revenue,
      pendingTickets,
      systemHealth,
    });

    return NextResponse.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    logger.error('Error obteniendo estadísticas del dashboard:', {
      error: error instanceof Error ? error.message : String(error),
    });

    // En caso de error, devolver estadísticas básicas con valores en 0
    return NextResponse.json({
      success: true,
      data: {
        totalUsers: 0,
        totalProperties: 0,
        activeContracts: 0,
        monthlyRevenue: 0,
        pendingTickets: 0,
        systemHealth: 'unknown',
      },
      error: 'Error obteniendo estadísticas. Mostrando valores por defecto.',
    });
  }
}

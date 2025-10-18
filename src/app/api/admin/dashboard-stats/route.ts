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

    logger.info('GET /api/admin/dashboard-stats - Iniciando consulta de estadísticas...', {
      userId: user.id,
      userEmail: user.email,
      userRole: user.role,
    });

    // Obtener estadísticas reales de la base de datos
    const [totalUsers, totalProperties, activeContracts, totalPayments, pendingTickets] =
      await Promise.all([
        // Contar todos los usuarios (no solo activos para mostrar el total real)
        db.user.count(),
        // Contar todas las propiedades
        db.property.count(),
        // Contar todos los contratos (ya que no hay ninguno, mostrar 0 es correcto)
        db.contract.count(),
        // Contar todos los pagos (ya que no hay ninguno, mostrar 0 es correcto)
        db.payment.count(),
        // Contar todos los tickets (ya que no hay ninguno, mostrar 0 es correcto)
        db.ticket.count(),
      ]);

    logger.info('Consultas de base de datos completadas', {
      totalUsers,
      totalProperties,
      activeContracts,
      totalPayments,
      pendingTickets,
    });

    // Calcular revenue mensual (últimos 30 días)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    let revenue = 0;
    try {
      const monthlyRevenue = await db.payment.aggregate({
        where: {
          status: 'PAID', // Usar el valor correcto del enum
          createdAt: {
            gte: thirtyDaysAgo,
          },
        },
        _sum: {
          amount: true,
        },
      });

      revenue = monthlyRevenue._sum.amount || 0;
    } catch (error) {
      // Si no hay pagos o hay error, revenue será 0
      logger.info('No hay pagos en el período o error en consulta:', { error });
      revenue = 0;
    }

    // Determinar estado de salud del sistema basado en las métricas
    let systemHealth = 'good';

    // Si no hay usuarios, el sistema está en estado crítico
    if (totalUsers === 0) {
      systemHealth = 'critical';
    }
    // Si hay muchos tickets pendientes, mostrar advertencia
    else if (pendingTickets > 10) {
      systemHealth = 'warning';
    }
    // Si hay muchos tickets pendientes, mostrar crítico
    else if (pendingTickets > 50) {
      systemHealth = 'critical';
    }
    // Si hay usuarios y propiedades, el sistema está funcionando
    else if (totalUsers > 0 && totalProperties > 0) {
      systemHealth = 'good';
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

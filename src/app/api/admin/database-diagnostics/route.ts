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

    logger.info('GET /api/admin/database-diagnostics - Iniciando diagnóstico...');

    // Obtener estadísticas detalladas de la base de datos
    const [
      totalUsers,
      activeUsers,
      totalProperties,
      propertiesByStatus,
      totalContracts,
      contractsByStatus,
      totalPayments,
      paymentsByStatus,
      totalTickets,
      ticketsByStatus,
      recentUsers,
      recentProperties,
      recentContracts,
      recentPayments,
    ] = await Promise.all([
      // Usuarios
      db.user.count(),
      db.user.count({ where: { isActive: true } }),

      // Propiedades
      db.property.count(),
      db.property.groupBy({
        by: ['status'],
        _count: { status: true },
      }),

      // Contratos
      db.contract.count(),
      db.contract.groupBy({
        by: ['status'],
        _count: { status: true },
      }),

      // Pagos
      db.payment.count(),
      db.payment.groupBy({
        by: ['status'],
        _count: { status: true },
      }),

      // Tickets
      db.ticket.count(),
      db.ticket.groupBy({
        by: ['status'],
        _count: { status: true },
      }),

      // Datos recientes
      db.user.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          isActive: true,
          createdAt: true,
        },
      }),

      db.property.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          title: true,
          address: true,
          status: true,
          price: true,
          createdAt: true,
        },
      }),

      db.contract.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          contractNumber: true,
          status: true,
          monthlyRent: true,
          createdAt: true,
        },
      }),

      db.payment.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          amount: true,
          status: true,
          createdAt: true,
        },
      }),
    ]);

    // Calcular revenue mensual
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const monthlyRevenue = await db.payment.aggregate({
      where: {
        status: 'PAID',
        createdAt: {
          gte: thirtyDaysAgo,
        },
      },
      _sum: {
        amount: true,
      },
    });

    const diagnostics = {
      summary: {
        totalUsers,
        activeUsers,
        totalProperties,
        totalContracts,
        totalPayments,
        totalTickets,
        monthlyRevenue: monthlyRevenue._sum.amount || 0,
      },
      breakdown: {
        propertiesByStatus,
        contractsByStatus,
        paymentsByStatus,
        ticketsByStatus,
      },
      recent: {
        users: recentUsers,
        properties: recentProperties,
        contracts: recentContracts,
        payments: recentPayments,
      },
      timestamp: new Date().toISOString(),
    };

    logger.info('Diagnóstico de base de datos completado', {
      totalUsers,
      totalProperties,
      totalContracts,
      totalPayments,
      totalTickets,
    });

    return NextResponse.json({
      success: true,
      data: diagnostics,
    });
  } catch (error) {
    logger.error('Error en diagnóstico de base de datos:', {
      error: error instanceof Error ? error.message : String(error),
    });

    return NextResponse.json(
      {
        success: false,
        error: 'Error obteniendo diagnóstico de base de datos',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

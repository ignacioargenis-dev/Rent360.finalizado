import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { logger } from '@/lib/logger-minimal';
import { requireAuth } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    // Verificar autenticación de admin
    const user = await requireAuth(request);
    if (user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 });
    }

    // Obtener todos los usuarios con estadísticas
    const users = await db.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        avatar: true,
        _count: {
          select: {
            properties: true,
            contractsAsOwner: true,
            contractsAsTenant: true,
            payments: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Calcular estadísticas adicionales para cada usuario
    const userReports = await Promise.all(
      users.map(async user => {
        // Calcular revenue total del usuario (pagos recibidos)
        const revenueResult = await db.payment.aggregate({
          where: {
            OR: [
              { contract: { ownerId: user.id } }, // Pagos a propietarios
              { userId: user.id }, // Pagos directos al usuario
            ],
            status: 'COMPLETED',
          },
          _sum: { amount: true },
        });

        // Calcular contratos activos
        const activeContracts = await db.contract.count({
          where: {
            OR: [{ ownerId: user.id }, { tenantId: user.id }],
            status: 'ACTIVE',
          },
        });

        // Calcular score de actividad (basado en actividad reciente)
        const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        const recentActivity = await db.user.count({
          where: {
            id: user.id,
            updatedAt: { gte: thirtyDaysAgo },
          },
        });

        const activityScore = Math.min(
          100,
          Math.max(
            0,
            recentActivity * 20 +
              user._count.properties * 10 +
              activeContracts * 15 +
              user._count.payments * 5
          )
        );

        return {
          id: user.id,
          name: user.name || 'Sin nombre',
          email: user.email,
          role: user.role,
          status: user.isActive ? 'active' : 'inactive',
          createdAt: user.createdAt.toISOString(),
          lastLogin: user.updatedAt.toISOString(), // Usamos updatedAt como aproximación
          propertiesCount: user._count.properties,
          contractsCount: user._count.contractsAsOwner + user._count.contractsAsTenant,
          totalRevenue: revenueResult._sum.amount || 0,
          activityScore,
          verified: true, // Asumimos que todos los usuarios registrados están verificados
        };
      })
    );

    // Calcular estadísticas generales
    const totalUsers = userReports.length;
    const activeUsers = userReports.filter(u => u.status === 'active').length;

    // Nuevos usuarios este mes
    const thisMonth = new Date();
    thisMonth.setDate(1);
    const newUsersThisMonth = userReports.filter(u => new Date(u.createdAt) >= thisMonth).length;

    // Usuarios por rol
    const usersByRole: { [key: string]: number } = {};
    userReports.forEach(u => {
      usersByRole[u.role] = (usersByRole[u.role] || 0) + 1;
    });

    // Tasa de verificación (todos los usuarios registrados se consideran verificados)
    const verificationRate = 100;

    // Score promedio de actividad
    const averageActivityScore =
      userReports.length > 0
        ? userReports.reduce((sum, u) => sum + u.activityScore, 0) / userReports.length
        : 0;

    // Top 5 usuarios más activos
    const topActiveUsers = [...userReports]
      .sort((a, b) => b.activityScore - a.activityScore)
      .slice(0, 5);

    // Tendencia de crecimiento de usuarios (últimos 6 meses)
    const userGrowthTrend = [];
    for (let i = 5; i >= 0; i--) {
      const monthStart = new Date();
      monthStart.setMonth(monthStart.getMonth() - i, 1);
      const monthEnd = new Date(monthStart.getFullYear(), monthStart.getMonth() + 1, 0);

      const usersInMonth = await db.user.count({
        where: {
          createdAt: {
            gte: monthStart,
            lte: monthEnd,
          },
        },
      });

      userGrowthTrend.push({
        month: monthStart.toLocaleDateString('es-ES', { month: 'short' }),
        count: usersInMonth,
      });
    }

    const userStats = {
      totalUsers,
      activeUsers,
      newUsersThisMonth,
      usersByRole,
      verificationRate,
      averageActivityScore: Math.round(averageActivityScore * 10) / 10,
      topActiveUsers,
      userGrowthTrend,
    };

    const response = {
      userReports,
      userStats,
      summary: {
        generatedAt: new Date().toISOString(),
        totalUsers,
        activeUsers,
        averageActivityScore: Math.round(averageActivityScore * 10) / 10,
      },
    };

    logger.info('User reports generated', {
      adminId: user.id,
      totalUsers,
      activeUsers,
    });

    return NextResponse.json(response);
  } catch (error) {
    logger.error('Error generating user reports:', {
      error: error instanceof Error ? error.message : String(error),
    });

    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

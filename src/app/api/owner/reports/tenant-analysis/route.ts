import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { db } from '@/lib/db';
import { logger } from '@/lib/logger-minimal';

/**
 * GET /api/owner/reports/tenant-analysis
 * Obtiene análisis completo de inquilinos para reportes
 */
export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request);

    if (user.role !== 'OWNER') {
      return NextResponse.json(
        { error: 'Acceso denegado. Solo para propietarios.' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || '30d';

    // Calcular fechas según el período
    const now = new Date();
    let startDate = new Date();

    switch (period) {
      case '7d':
        startDate.setDate(now.getDate() - 7);
        break;
      case '30d':
        startDate.setDate(now.getDate() - 30);
        break;
      case '90d':
        startDate.setDate(now.getDate() - 90);
        break;
      case '1y':
        startDate.setFullYear(now.getFullYear() - 1);
        break;
      default:
        startDate.setDate(now.getDate() - 30);
    }

    // Obtener contratos activos del propietario
    const activeContracts = await db.contract.findMany({
      where: {
        ownerId: user.id,
        status: 'ACTIVE',
      },
      include: {
        tenant: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        property: {
          select: {
            id: true,
            title: true,
          },
        },
      },
    });

    // Calcular permanencia promedio (en meses)
    const totalTenureMonths = activeContracts.reduce((sum, contract) => {
      const contractStart = new Date(contract.startDate);
      const months = Math.floor(
        (now.getTime() - contractStart.getTime()) / (1000 * 60 * 60 * 24 * 30)
      );
      return sum + Math.max(0, months);
    }, 0);
    const averageTenure =
      activeContracts.length > 0
        ? Math.round((totalTenureMonths / activeContracts.length) * 10) / 10
        : 0;

    // Calcular tasa de retención
    // Contratos que terminaron y fueron renovados o extendidos
    const endedContracts = await db.contract.findMany({
      where: {
        ownerId: user.id,
        status: { in: ['ENDED', 'TERMINATED'] },
        endDate: { gte: startDate },
      },
    });

    const renewedContracts = await db.contract.findMany({
      where: {
        ownerId: user.id,
        status: 'ACTIVE',
        startDate: { gte: startDate },
      },
      include: {
        tenant: true,
      },
    });

    // Contar renovaciones (mismo tenant, misma propiedad)
    let renewals = 0;
    for (const ended of endedContracts) {
      const renewed = renewedContracts.find(
        r => r.tenantId === ended.tenantId && r.propertyId === ended.propertyId
      );
      if (renewed) {
        renewals++;
      }
    }

    const retentionRate =
      endedContracts.length > 0 ? Math.round((renewals / endedContracts.length) * 100) : 100;

    // Obtener calificaciones de inquilinos
    const tenantIds = activeContracts
      .map(c => c.tenantId)
      .filter((id): id is string => id !== null && id !== undefined);

    const tenantRatings = await db.userRating.findMany({
      where: {
        toUserId: { in: tenantIds },
        createdAt: { gte: startDate },
      },
      include: {
        fromUser: {
          select: {
            name: true,
          },
        },
      },
    });

    // Calcular satisfacción promedio
    const satisfactionScore =
      tenantRatings.length > 0
        ? tenantRatings.reduce((sum, r) => sum + r.overallRating, 0) / tenantRatings.length
        : 0;

    // Top performers (inquilinos con mejor calificación y pagos puntuales)
    const tenantPerformance = await Promise.all(
      activeContracts.map(async contract => {
        if (!contract.tenantId) {
          return null;
        }

        const ratings = await db.userRating.findMany({
          where: {
            toUserId: contract.tenantId,
            createdAt: { gte: startDate },
          },
        });

        const payments = await db.payment.findMany({
          where: {
            contractId: contract.id,
            createdAt: { gte: startDate },
          },
        });

        const onTimePayments = payments.filter(p => {
          const dueDate = new Date(p.dueDate);
          const paidDate = p.paidAt ? new Date(p.paidAt) : null;
          return paidDate && paidDate <= dueDate;
        }).length;

        const avgRating =
          ratings.length > 0
            ? ratings.reduce((sum, r) => sum + r.overallRating, 0) / ratings.length
            : 0;

        const onTimeRate = payments.length > 0 ? (onTimePayments / payments.length) * 100 : 100;

        return {
          tenantId: contract.tenantId,
          tenantName: contract.tenant?.name || 'Sin nombre',
          rating: avgRating,
          onTimeRate,
          score: avgRating * 20 + onTimeRate * 0.8, // Score combinado
        };
      })
    );

    const topPerformers = tenantPerformance
      .filter(t => t !== null)
      .sort((a, b) => (b?.score || 0) - (a?.score || 0))
      .slice(0, 5)
      .map(t => t?.tenantName || '');

    // Inquilinos en riesgo (pagos atrasados o calificaciones bajas)
    const atRiskTenants = await Promise.all(
      activeContracts.map(async contract => {
        if (!contract.tenantId) {
          return null;
        }

        const overduePayments = await db.payment.count({
          where: {
            contractId: contract.id,
            status: 'PENDING',
            dueDate: { lt: now },
          },
        });

        const recentRatings = await db.userRating.findMany({
          where: {
            toUserId: contract.tenantId,
            createdAt: { gte: startDate },
          },
        });

        const avgRating =
          recentRatings.length > 0
            ? recentRatings.reduce((sum, r) => sum + r.overallRating, 0) / recentRatings.length
            : 5;

        if (overduePayments > 0 || avgRating < 3) {
          return contract.tenant?.name || 'Sin nombre';
        }

        return null;
      })
    );

    return NextResponse.json({
      success: true,
      data: {
        totalTenants: activeContracts.length,
        averageTenure,
        retentionRate,
        satisfactionScore: Math.round(satisfactionScore * 10) / 10,
        topPerformers: topPerformers.filter(Boolean),
        atRiskTenants: atRiskTenants.filter(Boolean),
      },
    });
  } catch (error) {
    logger.error('Error obteniendo análisis de inquilinos:', {
      error: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json(
      { error: 'Error al obtener el análisis de inquilinos' },
      { status: 500 }
    );
  }
}

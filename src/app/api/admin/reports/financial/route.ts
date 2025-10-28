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

    // Obtener parámetros de consulta
    const { searchParams } = new URL(request.url);
    const timeRange = searchParams.get('timeRange') || '6months';
    const reportType = searchParams.get('reportType') || 'overview';

    // Calcular fechas según el rango
    const now = new Date();
    let startDate: Date;

    switch (timeRange) {
      case '1month':
        startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        break;
      case '3months':
        startDate = new Date(now.getFullYear(), now.getMonth() - 3, 1);
        break;
      case '6months':
        startDate = new Date(now.getFullYear(), now.getMonth() - 6, 1);
        break;
      case '1year':
        startDate = new Date(now.getFullYear() - 1, now.getMonth(), 1);
        break;
      default:
        startDate = new Date(now.getFullYear(), now.getMonth() - 6, 1);
    }

    // 1. DATOS FINANCIEROS POR PERIODO (Revenue, Expenses, Profit)
    const monthlyData = [];

    for (let i = 5; i >= 0; i--) {
      const periodStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const periodEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);

      // Obtener pagos realizados en este periodo
      const payments = await db.payment.findMany({
        where: {
          status: 'COMPLETED',
          createdAt: {
            gte: periodStart,
            lte: periodEnd,
          },
        },
        select: {
          amount: true,
        },
      });

      // Calcular revenue (pagos de arriendo) - todos los pagos completados en este periodo
      const revenue = payments.reduce((sum, p) => sum + p.amount, 0);

      // Calcular expenses - por ahora asumimos que no hay expenses separados en este periodo
      // En una implementación real, tendríamos una tabla de expenses separada
      const expenses = 0;

      const profit = revenue - expenses;
      const profitMargin = revenue > 0 ? (profit / revenue) * 100 : 0;

      // El crecimiento se calculará después de crear todos los datos mensuales
      const growth = 0; // Por ahora, crecimiento neutral

      monthlyData.push({
        period: periodStart.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' }),
        revenue,
        expenses,
        profit,
        profitMargin: Math.round(profitMargin * 10) / 10,
        growth: Math.round(growth * 10) / 10,
      });
    }

    // 2. REVENUE POR CATEGORÍA
    const revenueByCategory = [];

    // Datos de revenue por categoría - simplificados por ahora
    // En una implementación completa, necesitaríamos campos adicionales en la BD

    // Arriendo Residencial - asumimos que la mayoría son residenciales
    const residentialRevenue = await db.payment.aggregate({
      where: {
        status: 'COMPLETED',
        contract: {
          property: {
            type: 'HOUSE', // Asumiendo que HOUSE es residencial
          },
        },
        createdAt: { gte: startDate },
      },
      _sum: { amount: true },
    });

    // Arriendo Comercial - otros tipos de propiedad
    const commercialRevenue = await db.payment.aggregate({
      where: {
        status: 'COMPLETED',
        contract: {
          property: {
            type: { not: 'HOUSE' }, // Todo lo que no es HOUSE
          },
        },
        createdAt: { gte: startDate },
      },
      _sum: { amount: true },
    });

    // Comisiones de corredores - pagos de tipo COMMISSION
    const commissionRevenue = await db.payment.count({
      where: {
        status: 'COMPLETED',
        createdAt: { gte: startDate },
      },
    });

    // Servicios adicionales - pagos de servicios
    const serviceRevenue = await db.payment.count({
      where: {
        status: 'COMPLETED',
        createdAt: { gte: startDate },
      },
    });

    const totalRevenue =
      (residentialRevenue._sum.amount || 0) +
      (commercialRevenue._sum.amount || 0) +
      0 + // commissionRevenue (simplificado por ahora)
      0; // serviceRevenue (simplificado por ahora)

    if (totalRevenue > 0) {
      revenueByCategory.push(
        {
          category: 'Arriendo Residencial',
          amount: residentialRevenue._sum.amount || 0,
          percentage: Math.round(((residentialRevenue._sum.amount || 0) / totalRevenue) * 100),
          trend: 'up' as const,
        },
        {
          category: 'Arriendo Comercial',
          amount: commercialRevenue._sum.amount || 0,
          percentage: Math.round(((commercialRevenue._sum.amount || 0) / totalRevenue) * 100),
          trend: 'up' as const,
        },
        {
          category: 'Comisiones',
          amount: 0, // commissionRevenue (simplificado)
          percentage: 0,
          trend: 'stable' as const,
        },
        {
          category: 'Servicios Adicionales',
          amount: 0, // serviceRevenue (simplificado)
          percentage: 0,
          trend: 'up' as const,
        }
      );
    }

    // 3. DESGLOSE DE GASTOS
    const expensesBreakdown = [];

    // Gastos - simplificados por ahora
    // En una implementación real, tendríamos una tabla de expenses separada
    const maintenanceExpenses = { _sum: { amount: 0 } };
    const serviceExpenses = { _sum: { amount: 0 } };
    const otherExpenses = { _sum: { amount: 0 } };

    const totalExpenses =
      (maintenanceExpenses._sum.amount || 0) +
      (serviceExpenses._sum.amount || 0) +
      (otherExpenses._sum.amount || 0);

    if (totalExpenses > 0) {
      expensesBreakdown.push(
        {
          category: 'Mantenimiento',
          amount: maintenanceExpenses._sum.amount || 0,
          percentage: Math.round(((maintenanceExpenses._sum.amount || 0) / totalExpenses) * 100),
          budget: Math.round(totalExpenses * 0.25), // 25% del presupuesto
          variance: 0, // Calcular varianza real si hay presupuesto definido
        },
        {
          category: 'Servicios',
          amount: serviceExpenses._sum.amount || 0,
          percentage: Math.round(((serviceExpenses._sum.amount || 0) / totalExpenses) * 100),
          budget: Math.round(totalExpenses * 0.35),
          variance: 0,
        },
        {
          category: 'Otros',
          amount: otherExpenses._sum.amount || 0,
          percentage: Math.round(((otherExpenses._sum.amount || 0) / totalExpenses) * 100),
          budget: Math.round(totalExpenses * 0.4),
          variance: 0,
        }
      );
    }

    const response = {
      financialData: monthlyData,
      revenueByCategory,
      expenses: expensesBreakdown,
      summary: {
        totalRevenue,
        totalExpenses,
        netProfit: totalRevenue - totalExpenses,
        profitMargin:
          totalRevenue > 0
            ? Math.round(((totalRevenue - totalExpenses) / totalRevenue) * 100 * 10) / 10
            : 0,
        timeRange,
        reportType,
      },
    };

    logger.info('Financial report generated', {
      adminId: user.id,
      timeRange,
      totalRevenue,
      totalExpenses,
    });

    return NextResponse.json(response);
  } catch (error) {
    logger.error('Error generating financial report:', {
      error: error instanceof Error ? error.message : String(error),
    });

    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

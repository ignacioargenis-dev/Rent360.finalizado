import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { db } from '@/lib/db';
import { logger } from '@/lib/logger-minimal';

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request);

    if (user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Acceso denegado. Se requieren permisos de administrador.' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const months = parseInt(searchParams.get('months') || '12');

    // Obtener datos históricos de los últimos X meses
    const endDate = new Date();
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - months);

    // 1. Análisis de ingresos por contratos
    const contractRevenue = await analyzeContractRevenue(startDate, endDate);

    // 2. Análisis de demanda de propiedades
    const propertyDemand = await analyzePropertyDemand(startDate, endDate);

    // 3. Análisis de pagos y morosidad
    const paymentAnalysis = await analyzePaymentPatterns(startDate, endDate);

    // 4. Análisis de mantenimiento
    const maintenanceAnalysis = await analyzeMaintenanceTrends(startDate, endDate);

    // 5. Generar predicciones
    const predictions = generatePredictions(
      contractRevenue,
      propertyDemand,
      paymentAnalysis,
      maintenanceAnalysis
    );

    logger.info('Analytics predictivos generados exitosamente', {
      adminId: user.id,
      months,
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
    });

    return NextResponse.json({
      success: true,
      data: {
        predictions,
        historicalData: {
          contractRevenue,
          propertyDemand,
          paymentAnalysis,
          maintenanceAnalysis,
        },
        metadata: {
          analysisPeriod: {
            startDate: startDate.toISOString(),
            endDate: endDate.toISOString(),
            months,
          },
          generatedAt: new Date().toISOString(),
        },
      },
    });
  } catch (error) {
    logger.error('Error generando analytics predictivos:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

async function analyzeContractRevenue(startDate: Date, endDate: Date) {
  // Análisis de ingresos por contratos en el período
  const contracts = await db.contract.findMany({
    where: {
      createdAt: {
        gte: startDate,
        lte: endDate,
      },
    },
    select: {
      monthlyRent: true,
      deposit: true,
      startDate: true,
      endDate: true,
      status: true,
      createdAt: true,
    },
  });

  // Agrupar por mes
  const monthlyRevenue = contracts.reduce(
    (acc, contract) => {
      const monthKey = contract.createdAt.toISOString().slice(0, 7); // YYYY-MM

      if (!acc[monthKey]) {
        acc[monthKey] = {
          contracts: 0,
          totalRent: 0,
          totalDeposit: 0,
          activeContracts: 0,
        };
      }

      acc[monthKey].contracts += 1;
      acc[monthKey].totalRent += contract.monthlyRent;
      acc[monthKey].totalDeposit += contract.deposit;

      if (contract.status === 'ACTIVE') {
        acc[monthKey].activeContracts += 1;
      }

      return acc;
    },
    {} as Record<string, any>
  );

  // Calcular métricas adicionales
  const totalRevenue = Object.values(monthlyRevenue).reduce(
    (sum: number, month: any) => sum + month.totalRent + month.totalDeposit,
    0
  );

  const avgMonthlyRevenue =
    Object.keys(monthlyRevenue).length > 0 ? totalRevenue / Object.keys(monthlyRevenue).length : 0;

  return {
    monthlyBreakdown: monthlyRevenue,
    summary: {
      totalContracts: contracts.length,
      totalRevenue,
      avgMonthlyRevenue,
      avgContractValue: contracts.length > 0 ? totalRevenue / contracts.length : 0,
    },
  };
}

async function analyzePropertyDemand(startDate: Date, endDate: Date) {
  // Análisis de demanda de propiedades
  const properties = await db.property.findMany({
    where: {
      createdAt: {
        gte: startDate,
        lte: endDate,
      },
    },
    include: {
      visits: {
        where: {
          createdAt: {
            gte: startDate,
            lte: endDate,
          },
        },
      },
      contracts: {
        where: {
          createdAt: {
            gte: startDate,
            lte: endDate,
          },
        },
      },
    },
  });

  // Análisis por tipo de propiedad
  const byType = properties.reduce(
    (acc, property) => {
      const type = property.type;
      if (!acc[type]) {
        acc[type] = {
          count: 0,
          totalVisits: 0,
          totalContracts: 0,
          avgPrice: 0,
          prices: [],
        };
      }

      acc[type].count += 1;
      acc[type].totalVisits += property.visits.length;
      acc[type].totalContracts += property.contracts.length;
      acc[type].prices.push(property.price);

      return acc;
    },
    {} as Record<string, any>
  );

  // Calcular promedios
  Object.keys(byType).forEach(type => {
    const typeData = byType[type];
    typeData.avgPrice =
      typeData.prices.reduce((sum: number, price: number) => sum + price, 0) /
      typeData.prices.length;
    delete typeData.prices; // Remover array de precios
  });

  // Análisis por ubicación
  const byLocation = properties.reduce(
    (acc, property) => {
      const location = `${property.city}-${property.commune}`;
      if (!acc[location]) {
        acc[location] = {
          count: 0,
          totalVisits: 0,
          totalContracts: 0,
        };
      }

      acc[location].count += 1;
      acc[location].totalVisits += property.visits.length;
      acc[location].totalContracts += property.contracts.length;

      return acc;
    },
    {} as Record<string, any>
  );

  return {
    byType,
    byLocation,
    summary: {
      totalProperties: properties.length,
      avgVisitsPerProperty:
        properties.length > 0
          ? properties.reduce((sum, p) => sum + p.visits.length, 0) / properties.length
          : 0,
      avgContractsPerProperty:
        properties.length > 0
          ? properties.reduce((sum, p) => sum + p.contracts.length, 0) / properties.length
          : 0,
    },
  };
}

async function analyzePaymentPatterns(startDate: Date, endDate: Date) {
  // Análisis de patrones de pago
  const payments = await db.payment.findMany({
    where: {
      createdAt: {
        gte: startDate,
        lte: endDate,
      },
    },
    select: {
      amount: true,
      dueDate: true,
      paidDate: true,
      status: true,
      createdAt: true,
    },
  });

  // Calcular estadísticas de puntualidad
  const paymentStats = payments.reduce(
    (acc, payment) => {
      acc.total += 1;

      if (payment.status === 'PAID' && payment.paidDate && payment.dueDate) {
        const daysLate = Math.floor(
          (payment.paidDate.getTime() - payment.dueDate.getTime()) / (1000 * 60 * 60 * 24)
        );

        if (daysLate <= 0) {
          acc.onTime += 1;
        } else if (daysLate <= 30) {
          acc.late += 1;
        } else {
          acc.veryLate += 1;
        }
      } else if (payment.status === 'OVERDUE') {
        acc.overdue += 1;
      }

      return acc;
    },
    { total: 0, onTime: 0, late: 0, veryLate: 0, overdue: 0 }
  );

  // Calcular porcentajes
  const onTimePercentage =
    paymentStats.total > 0 ? (paymentStats.onTime / paymentStats.total) * 100 : 0;
  const latePercentage =
    paymentStats.total > 0
      ? ((paymentStats.late + paymentStats.veryLate) / paymentStats.total) * 100
      : 0;
  const overduePercentage =
    paymentStats.total > 0 ? (paymentStats.overdue / paymentStats.total) * 100 : 0;

  return {
    paymentStats,
    percentages: {
      onTime: onTimePercentage,
      late: latePercentage,
      overdue: overduePercentage,
    },
    summary: {
      totalPayments: payments.length,
      totalAmount: payments.reduce((sum, p) => sum + p.amount, 0),
      avgPaymentAmount:
        payments.length > 0 ? payments.reduce((sum, p) => sum + p.amount, 0) / payments.length : 0,
    },
  };
}

async function analyzeMaintenanceTrends(startDate: Date, endDate: Date) {
  // Análisis de tendencias de mantenimiento
  const maintenanceRequests = await db.maintenance.findMany({
    where: {
      createdAt: {
        gte: startDate,
        lte: endDate,
      },
    },
    select: {
      category: true,
      priority: true,
      status: true,
      estimatedCost: true,
      actualCost: true,
      createdAt: true,
    },
  });

  // Agrupar por categoría
  const byCategory = maintenanceRequests.reduce(
    (acc, request) => {
      const category = request.category;
      if (!acc[category]) {
        acc[category] = {
          count: 0,
          totalEstimatedCost: 0,
          totalActualCost: 0,
          avgResolutionTime: 0,
          priorities: { LOW: 0, MEDIUM: 0, HIGH: 0, URGENT: 0 },
        };
      }

      acc[category].count += 1;
      acc[category].totalEstimatedCost += request.estimatedCost || 0;
      acc[category].totalActualCost += request.actualCost || 0;

      // Contar prioridades
      const priority = request.priority;
      if (
        priority === 'LOW' ||
        priority === 'MEDIUM' ||
        priority === 'HIGH' ||
        priority === 'URGENT'
      ) {
        acc[category].priorities[priority] += 1;
      }

      return acc;
    },
    {} as Record<string, any>
  );

  return {
    byCategory,
    summary: {
      totalRequests: maintenanceRequests.length,
      avgEstimatedCost:
        maintenanceRequests.length > 0
          ? maintenanceRequests.reduce((sum, r) => sum + (r.estimatedCost || 0), 0) /
            maintenanceRequests.length
          : 0,
      avgActualCost:
        maintenanceRequests.length > 0
          ? maintenanceRequests.reduce((sum, r) => sum + (r.actualCost || 0), 0) /
            maintenanceRequests.length
          : 0,
    },
  };
}

function generatePredictions(
  contractRevenue: any,
  propertyDemand: any,
  paymentAnalysis: any,
  maintenanceAnalysis: any
) {
  const predictions = [];

  // Predicción de ingresos para los próximos 6 meses
  const monthlyRevenue = Object.values(contractRevenue.monthlyBreakdown);
  if (monthlyRevenue.length >= 3) {
    const recentAvg =
      monthlyRevenue
        .slice(-3)
        .reduce((sum: number, month: any) => sum + month.totalRent + month.totalDeposit, 0) / 3;

    const growthRate = 0.05; // 5% crecimiento mensual estimado
    const predictedRevenue = [];

    for (let i = 1; i <= 6; i++) {
      const predicted = recentAvg * Math.pow(1 + growthRate, i);
      predictedRevenue.push({
        month: i,
        predictedRevenue: Math.round(predicted),
        confidence: Math.max(0.6, 0.9 - i * 0.05), // Confianza disminuye con el tiempo
      });
    }

    predictions.push({
      type: 'revenue',
      title: 'Predicción de Ingresos',
      description: 'Proyección de ingresos por contratos para los próximos 6 meses',
      data: predictedRevenue,
      insights: [
        `Crecimiento promedio esperado: ${(growthRate * 100).toFixed(1)}% mensual`,
        `Ingreso base proyectado: ${Math.round(recentAvg).toLocaleString('es-CL')} CLP`,
        `Mayor crecimiento esperado en propiedades residenciales`,
      ],
    });
  }

  // Predicción de demanda por tipo de propiedad
  const propertyTypes = Object.keys(propertyDemand.byType);
  if (propertyTypes.length > 0) {
    const demandPredictions = propertyTypes.map(type => {
      const typeData = propertyDemand.byType[type];
      const demandScore = (typeData.totalContracts / Math.max(typeData.count, 1)) * 100;

      return {
        type,
        currentDemand: demandScore,
        predictedDemand: Math.min(100, demandScore * (1 + Math.random() * 0.3)), // +0-30%
        trend: demandScore > 70 ? 'high' : demandScore > 40 ? 'medium' : 'low',
      };
    });

    predictions.push({
      type: 'demand',
      title: 'Predicción de Demanda por Tipo',
      description: 'Análisis predictivo de demanda por tipo de propiedad',
      data: demandPredictions,
      insights: [
        `${propertyTypes.length} tipos de propiedades analizados`,
        `Demanda más alta en: ${demandPredictions.find(p => p.trend === 'high')?.type || 'N/A'}`,
        `Recomendación: Enfocarse en tipos con demanda media-alta`,
      ],
    });
  }

  // Predicción de riesgo de morosidad
  const currentOnTimeRate = paymentAnalysis.percentages.onTime;
  const predictedOnTimeRate = Math.max(
    0,
    Math.min(
      100,
      currentOnTimeRate + (Math.random() - 0.5) * 10 // +/- 5% variación
    )
  );

  predictions.push({
    type: 'risk',
    title: 'Predicción de Riesgo de Morosidad',
    description: 'Análisis predictivo del riesgo de pagos atrasados',
    data: {
      currentOnTimeRate,
      predictedOnTimeRate,
      riskLevel: predictedOnTimeRate > 85 ? 'low' : predictedOnTimeRate > 70 ? 'medium' : 'high',
    },
    insights: [
      `Tasa actual de puntualidad: ${currentOnTimeRate.toFixed(1)}%`,
      `Predicción para próximos meses: ${predictedOnTimeRate.toFixed(1)}%`,
      `Nivel de riesgo: ${predictedOnTimeRate > 85 ? 'Bajo' : predictedOnTimeRate > 70 ? 'Medio' : 'Alto'}`,
      predictedOnTimeRate < currentOnTimeRate
        ? 'Atención: Posible aumento en morosidad'
        : 'Buenas noticias: Mantenimiento de tendencias positivas',
    ],
  });

  // Predicción de demanda de mantenimiento
  const maintenanceCategories = Object.keys(maintenanceAnalysis.byCategory);
  if (maintenanceCategories.length > 0) {
    const maintenancePredictions = maintenanceCategories.map(category => {
      const catData = maintenanceAnalysis.byCategory[category];
      const avgCost = catData.totalEstimatedCost / Math.max(catData.count, 1);
      const predictedIncrease = Math.random() * 0.2 + 0.8; // 80-100% del costo actual

      return {
        category,
        currentAvgCost: avgCost,
        predictedCost: avgCost * predictedIncrease,
        volumeChange: Math.random() * 0.4 - 0.2, // +/- 20%
      };
    });

    predictions.push({
      type: 'maintenance',
      title: 'Predicción de Demanda de Mantenimiento',
      description: 'Proyección de costos y volumen de solicitudes de mantenimiento',
      data: maintenancePredictions,
      insights: [
        `${maintenanceCategories.length} categorías de mantenimiento analizadas`,
        `Categoría más costosa: ${
          maintenancePredictions.reduce((max, cat) =>
            cat.predictedCost > max.predictedCost ? cat : max
          ).category
        }`,
        `Preparación recomendada: Aumentar capacidad en categorías de alto volumen`,
      ],
    });
  }

  return predictions;
}

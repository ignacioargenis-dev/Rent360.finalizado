import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { db } from '@/lib/db';
import { logger } from '@/lib/logger-minimal';
import { handleApiError } from '@/lib/api-error-handler';
import { UserRatingService } from '@/lib/user-rating-service';

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request);

    if (user.role !== 'MAINTENANCE') {
      return NextResponse.json({ error: 'Acceso no autorizado' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || 'month';

    // Obtener datos completos del usuario
    const fullUser = await db.user.findUnique({
      where: { id: user.id },
      include: {
        maintenanceProvider: true,
      },
    });

    if (!fullUser || !fullUser.maintenanceProvider) {
      return NextResponse.json({
        success: true,
        data: {
          period:
            period === 'month'
              ? new Date().toLocaleDateString('es-CL', { month: 'long', year: 'numeric' })
              : new Date().getFullYear().toString(),
          totalJobs: 0,
          completedJobs: 0,
          revenue: 0,
          averageRating: 0,
          topServices: [],
          monthlyTrend: [],
        },
      });
    }

    const now = new Date();
    let startDate: Date;
    let endDate: Date = now;

    switch (period) {
      case 'week':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case 'quarter':
        const quarter = Math.floor(now.getMonth() / 3);
        startDate = new Date(now.getFullYear(), quarter * 3, 1);
        break;
      case 'year':
        startDate = new Date(now.getFullYear(), 0, 1);
        break;
      default:
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    }

    const maintenanceProviderId = fullUser.maintenanceProvider.id;

    // Obtener trabajos del período
    const allJobs = await db.maintenance.findMany({
      where: {
        maintenanceProviderId,
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      include: {
        property: true,
      },
    });

    const completedJobs = allJobs.filter(job => job.status === 'COMPLETED');
    const totalJobs = allJobs.length;
    const revenue = completedJobs.reduce(
      (sum, job) => sum + (job.actualCost || job.estimatedCost || 0),
      0
    );

    // Obtener calificación promedio
    const ratingSummary = await UserRatingService.getUserRatingSummary(user.id);
    const averageRating = ratingSummary?.averageRating || 0;

    // Top servicios por categoría
    const serviceCounts: Record<string, { count: number; revenue: number }> = {};
    completedJobs.forEach(job => {
      const category = job.category || 'OTHER';
      if (!serviceCounts[category]) {
        serviceCounts[category] = { count: 0, revenue: 0 };
      }
      serviceCounts[category].count++;
      serviceCounts[category].revenue += job.actualCost || job.estimatedCost || 0;
    });

    const topServices = Object.entries(serviceCounts)
      .map(([type, data]) => ({
        type: mapCategoryToLabel(type),
        count: data.count,
        revenue: data.revenue,
      }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);

    // Tendencia mensual (últimos 4 meses)
    const monthlyTrend = [];
    for (let i = 3; i >= 0; i--) {
      const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);

      const monthJobs = allJobs.filter(
        job => job.createdAt >= monthStart && job.createdAt <= monthEnd
      );
      const monthCompleted = monthJobs.filter(job => job.status === 'COMPLETED');
      const monthRevenue = monthCompleted.reduce(
        (sum, job) => sum + (job.actualCost || job.estimatedCost || 0),
        0
      );

      monthlyTrend.push({
        month: monthStart.toLocaleDateString('es-CL', { month: 'short' }),
        jobs: monthCompleted.length,
        revenue: monthRevenue,
      });
    }

    const periodLabel =
      period === 'month'
        ? new Date().toLocaleDateString('es-CL', { month: 'long', year: 'numeric' })
        : period === 'week'
          ? 'Esta semana'
          : period === 'quarter'
            ? 'Este trimestre'
            : new Date().getFullYear().toString();

    return NextResponse.json({
      success: true,
      data: {
        period: periodLabel,
        totalJobs,
        completedJobs: completedJobs.length,
        revenue,
        averageRating,
        topServices,
        monthlyTrend,
      },
    });
  } catch (error) {
    logger.error('Error obteniendo reportes de mantenimiento:', {
      error: error instanceof Error ? error.message : String(error),
    });
    const errorResponse = handleApiError(error);
    return errorResponse;
  }
}

function mapCategoryToLabel(category: string): string {
  const categoryMap: Record<string, string> = {
    PLUMBING: 'Plomería',
    ELECTRICAL: 'Eléctrica',
    STRUCTURAL: 'Estructural',
    CLEANING: 'Limpieza',
    HVAC: 'Climatización',
    OTHER: 'Otro',
  };
  return categoryMap[category.toUpperCase()] || 'Otro';
}

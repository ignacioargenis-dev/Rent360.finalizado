import { db } from './db';
import { logger } from './logger';
import { DatabaseError, BusinessLogicError } from './errors';
import { RunnerPayoutService } from './payout-service';
import { NotificationService, NotificationType } from './notification-service';
import { UserRatingService } from './user-rating-service';

export interface RunnerPerformanceMetrics {
  runnerId: string;
  runnerName: string;

  // Métricas de visitas
  totalVisits: number;
  completedVisits: number;
  cancelledVisits: number;
  completionRate: number;

  // Métricas de ganancias
  totalEarnings: number;
  averageEarningsPerVisit: number;
  monthlyEarnings: number;
  earningsThisWeek: number;
  earningsLastWeek: number;
  earningsGrowth: number;

  // Métricas de tiempo
  averageVisitDuration: number;
  onTimeRate: number;
  responseTimeAverage: number;

  // Métricas de calidad
  averageRating: number;
  ratingDistribution: { [key: number]: number };
  clientSatisfactionScore: number;

  // Métricas de eficiencia
  visitsPerDay: number;
  distanceTraveled: number; // km aproximados
  fuelEfficiency: number;

  // Rankings
  overallRanking: number;
  weeklyRanking: number;
  monthlyRanking: number;

  // Tendencias
  trendDirection: 'up' | 'down' | 'stable';
  improvementAreas: string[];
  strengths: string[];

  // Información adicional
  favoritePropertyTypes: string[];
  mostActiveHours: string[];
  topClientTypes: string[];

  // Métricas de actividad real
  totalPhotos: number;
  reportsSubmitted: number;
  tasksCompleted: number;
}

export interface RunnerWeeklyReport {
  runnerId: string;
  weekStart: Date;
  weekEnd: Date;

  // Resumen semanal
  visitsCompleted: number;
  earningsGenerated: number;
  averageRating: number;
  rankingPosition: number;

  // Detalles diarios
  dailyPerformance: {
    date: string;
    visits: number;
    earnings: number;
    rating: number;
    duration: number;
  }[];

  // Comparación con semana anterior
  previousWeekVisits: number;
  previousWeekEarnings: number;
  visitsChange: number;
  earningsChange: number;

  // Logros de la semana
  achievements: {
    name: string;
    description: string;
    icon: string;
  }[];

  // Recomendaciones
  recommendations: string[];

  // Próximas visitas programadas
  upcomingVisits: {
    date: string;
    time: string;
    propertyAddress: string;
    clientName: string;
  }[];
}

export interface RunnerRankingData {
  runnerId: string;
  runnerName: string;
  position: number;
  previousPosition: number;
  score: number;
  visitsThisWeek: number;
  earningsThisWeek: number;
  averageRating: number;
  trend: 'up' | 'down' | 'stable';
}

/**
 * Servicio avanzado de reportes y análisis para runners
 */
export class RunnerReportsService {
  /**
   * Genera métricas de rendimiento completas para un runner
   */
  static async generateRunnerPerformanceMetrics(
    runnerId: string,
    periodStart?: Date,
    periodEnd?: Date
  ): Promise<RunnerPerformanceMetrics> {
    try {
      const runner = await db.user.findUnique({
        where: { id: runnerId },
        select: {
          id: true,
          name: true,
          email: true,
        },
      });

      if (!runner) {
        throw new BusinessLogicError('Runner no encontrado');
      }

      // Definir período de análisis
      const endDate = periodEnd || new Date();
      const startDate = periodStart || new Date(endDate.getTime() - 30 * 24 * 60 * 60 * 1000);

      // Obtener visitas del período con información completa
      const visits = await db.visit.findMany({
        where: {
          runnerId: runnerId,
          createdAt: {
            gte: startDate,
            lte: endDate,
          },
        },
        include: {
          property: {
            select: {
              id: true,
              price: true,
              type: true,
              propertyImages: {
                where: {
                  alt: {
                    contains: runnerId,
                  },
                },
                select: {
                  id: true,
                  alt: true,
                  createdAt: true,
                },
              },
            },
          },
        },
      });

      // Calcular métricas básicas
      const totalVisits = visits.length;
      const completedVisits = visits.filter(
        v => v.status?.toUpperCase() === 'COMPLETED' || v.status === 'completed'
      ).length;
      const cancelledVisits = visits.filter(
        v => v.status?.toUpperCase() === 'CANCELLED' || v.status === 'cancelled'
      ).length;
      const completionRate = totalVisits > 0 ? (completedVisits / totalVisits) * 100 : 0;

      // Calcular ganancias
      const totalEarnings = visits.reduce((sum, visit) => sum + (visit.earnings || 0), 0);
      const averageEarningsPerVisit = completedVisits > 0 ? totalEarnings / completedVisits : 0;

      // Calcular ganancias mensuales (mes actual)
      const monthStart = new Date(endDate.getFullYear(), endDate.getMonth(), 1);
      const monthlyEarnings = visits
        .filter(v => {
          const visitDate = v.scheduledAt || v.createdAt;
          return visitDate >= monthStart && v.status === 'COMPLETED';
        })
        .reduce((sum, v) => sum + (v.earnings || 0), 0);

      // Calcular ganancias semanales
      const weekAgo = new Date(endDate.getTime() - 7 * 24 * 60 * 60 * 1000);
      const twoWeeksAgo = new Date(endDate.getTime() - 14 * 24 * 60 * 60 * 1000);

      const earningsThisWeek = visits
        .filter(v => v.createdAt >= weekAgo)
        .reduce((sum, v) => sum + (v.earnings || 0), 0);

      const earningsLastWeek = visits
        .filter(v => v.createdAt >= twoWeeksAgo && v.createdAt < weekAgo)
        .reduce((sum, v) => sum + (v.earnings || 0), 0);

      const earningsGrowth =
        earningsLastWeek > 0
          ? ((earningsThisWeek - earningsLastWeek) / earningsLastWeek) * 100
          : earningsThisWeek > 0
            ? 100
            : 0;

      // Calcular métricas de tiempo
      const completedVisitsData = visits.filter(
        v => v.status?.toUpperCase() === 'COMPLETED' || v.status === 'completed'
      );
      const averageVisitDuration =
        completedVisitsData.length > 0
          ? completedVisitsData.reduce((sum, v) => sum + (v.duration || 0), 0) /
            completedVisitsData.length
          : 0;

      // Obtener calificaciones de puntualidad desde UserRating para calcular onTimeRate
      const punctualityRatings = await db.userRating.findMany({
        where: {
          toUserId: runnerId,
          punctualityRating: {
            not: null,
          },
          createdAt: {
            gte: startDate,
            lte: endDate,
          },
        },
        select: {
          punctualityRating: true,
        },
      });

      // Calcular onTimeRate basado en calificaciones de puntualidad (1-5, donde 5 = siempre puntual)
      const onTimeRate =
        punctualityRatings.length > 0
          ? (punctualityRatings.reduce((sum, r) => sum + (r.punctualityRating || 0), 0) /
              punctualityRatings.length) *
            20 // Convertir de 1-5 a porcentaje (5 = 100%)
          : 95; // Default si no hay datos

      // Calcular tiempo de respuesta promedio desde mensajes (si están disponibles)
      // Por ahora, usar un cálculo basado en visitas completadas y tiempo promedio
      // En el futuro, se puede mejorar calculando desde Message timestamps
      const responseTimeAverage =
        completedVisitsData.length > 0
          ? Math.max(5, Math.min(30, 15 + completedVisitsData.length / 10)) // Estimación basada en volumen
          : 15; // Default

      // Obtener calificación promedio real desde UserRatingService (incluye todas las calificaciones)
      const ratingSummary = await UserRatingService.getUserRatingSummary(runnerId);
      const averageRating = ratingSummary?.averageRating || 0;
      const ratingDistribution = ratingSummary?.ratingDistribution || {
        1: 0,
        2: 0,
        3: 0,
        4: 0,
        5: 0,
      };

      // Calcular eficiencia
      const daysInPeriod = Math.max(
        1,
        Math.ceil((endDate.getTime() - startDate.getTime()) / (24 * 60 * 60 * 1000))
      );
      const visitsPerDay = totalVisits / daysInPeriod;

      // Rankings (placeholder - implementar comparación con otros runners)
      const overallRanking = 5;
      const weeklyRanking = 3;
      const monthlyRanking = 4;

      // Determinar tendencia
      const trendDirection = earningsGrowth > 5 ? 'up' : earningsGrowth < -5 ? 'down' : 'stable';

      // Áreas de mejora y fortalezas
      const improvementAreas = this.calculateImprovementAreas({
        completionRate,
        averageRating,
        visitsPerDay,
      });

      const strengths = this.calculateStrengths({
        completionRate,
        averageRating,
        earningsGrowth,
      });

      // Análisis de tipos de propiedad favoritos
      const propertyTypeCounts = visits.reduce(
        (acc, visit) => {
          const type = visit.property?.type || 'unknown';
          acc[type] = (acc[type] || 0) + 1;
          return acc;
        },
        {} as Record<string, number>
      );

      const favoritePropertyTypes = Object.entries(propertyTypeCounts)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 3)
        .map(([type]) => type);

      // Calcular horas más activas desde visitas reales
      const hourCounts: Record<string, number> = {};
      visits.forEach(visit => {
        if (visit.scheduledAt) {
          const hour = visit.scheduledAt.getHours();
          let hourRange = '';
          if (hour >= 6 && hour < 9) {
            hourRange = '06:00-09:00';
          } else if (hour >= 9 && hour < 12) {
            hourRange = '09:00-12:00';
          } else if (hour >= 12 && hour < 15) {
            hourRange = '12:00-15:00';
          } else if (hour >= 15 && hour < 18) {
            hourRange = '15:00-18:00';
          } else if (hour >= 18 && hour < 21) {
            hourRange = '18:00-21:00';
          } else {
            hourRange = '21:00-06:00';
          }
          hourCounts[hourRange] = (hourCounts[hourRange] || 0) + 1;
        }
      });

      const mostActiveHours = Object.entries(hourCounts)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 3)
        .map(([hour]) => hour);

      // Calcular totalPhotos: contar PropertyImage asociadas a visitas del runner
      let totalPhotos = 0;
      const visitIds = visits.map(v => v.id);

      // Obtener todas las PropertyImage que pertenecen a visitas del runner
      if (visitIds.length > 0) {
        // Buscar imágenes que tengan metadata con visitId en el campo alt
        const allPropertyImages = await db.propertyImage.findMany({
          where: {
            alt: {
              not: null,
            },
          },
          select: {
            id: true,
            alt: true,
          },
        });

        // Filtrar imágenes que realmente pertenecen a visitas del runner
        totalPhotos = allPropertyImages.filter(img => {
          if (!img.alt) {
            return false;
          }
          try {
            const metadata = JSON.parse(img.alt);
            return metadata && metadata.visitId && visitIds.includes(metadata.visitId);
          } catch {
            // Si no se puede parsear, verificar si el alt contiene algún visitId como string
            return visitIds.some(vid => img.alt?.includes(vid));
          }
        }).length;
      }

      // Calcular reportsSubmitted: visitas completadas con notas o fotos
      const reportsSubmitted = completedVisitsData.filter(v => {
        const hasNotes = v.notes && v.notes.trim().length > 0;
        const hasPhotos = v.photosTaken && v.photosTaken > 0;
        return hasNotes || hasPhotos;
      }).length;

      // tasksCompleted es igual a completedVisits
      const tasksCompleted = completedVisits;

      return {
        runnerId,
        runnerName: runner.name || 'Runner',

        // Métricas de visitas
        totalVisits,
        completedVisits,
        cancelledVisits,
        completionRate,

        // Métricas de ganancias
        totalEarnings,
        averageEarningsPerVisit,
        monthlyEarnings,
        earningsThisWeek,
        earningsLastWeek,
        earningsGrowth,

        // Métricas de tiempo
        averageVisitDuration,
        onTimeRate: Math.round(onTimeRate * 10) / 10,
        responseTimeAverage: Math.round(responseTimeAverage * 10) / 10,

        // Métricas de calidad
        averageRating,
        ratingDistribution,
        clientSatisfactionScore: averageRating * 20,

        // Métricas de eficiencia
        visitsPerDay,
        distanceTraveled: visitsPerDay * 25, // Estimación
        fuelEfficiency: 12, // km/l

        // Rankings
        overallRanking,
        weeklyRanking,
        monthlyRanking,

        // Tendencias
        trendDirection,
        improvementAreas,
        strengths,

        // Información adicional
        favoritePropertyTypes,
        mostActiveHours: mostActiveHours.length > 0 ? mostActiveHours : [],
        topClientTypes: [], // Los runners360 no hacen conversiones, eliminar

        // Métricas de actividad real
        totalPhotos,
        reportsSubmitted,
        tasksCompleted,
      };
    } catch (error) {
      logger.error('Error generando métricas de rendimiento:', error as Error);
      throw error;
    }
  }

  /**
   * Genera datos de rendimiento mensual para un runner
   */
  static async generateMonthlyPerformance(
    runnerId: string,
    months: number = 6
  ): Promise<
    Array<{
      month: string;
      rating: number;
      visits: number;
      earnings: number;
      onTimeRate: number;
      responseTime: number;
    }>
  > {
    try {
      const monthlyData = [];
      const now = new Date();

      for (let i = months - 1; i >= 0; i--) {
        const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0, 23, 59, 59);

        // Obtener visitas del mes
        const monthVisits = await db.visit.findMany({
          where: {
            runnerId: runnerId,
            scheduledAt: {
              gte: monthStart,
              lte: monthEnd,
            },
          },
          include: {
            runnerRatings: {
              select: {
                overallRating: true,
                punctualityRating: true,
              },
            },
          },
        });

        const completedVisits = monthVisits.filter(v => v.status === 'COMPLETED');
        const visits = completedVisits.length;
        const earnings = completedVisits.reduce((sum, v) => sum + (v.earnings || 0), 0);

        // Obtener calificaciones del mes desde UserRating
        const monthRatings = await db.userRating.findMany({
          where: {
            toUserId: runnerId,
            createdAt: {
              gte: monthStart,
              lte: monthEnd,
            },
          },
          select: {
            overallRating: true,
            punctualityRating: true,
          },
        });

        const rating =
          monthRatings.length > 0
            ? monthRatings.reduce((sum, r) => sum + r.overallRating, 0) / monthRatings.length
            : 0;

        // Calcular puntualidad promedio
        const punctualityRatings = monthRatings
          .map(r => r.punctualityRating)
          .filter((r): r is number => r !== null && r !== undefined && r > 0);
        const onTimeRate =
          punctualityRatings.length > 0
            ? (punctualityRatings.reduce((sum, r) => sum + r, 0) / punctualityRatings.length) * 20
            : 95; // Default si no hay datos

        // Tiempo de respuesta (usar promedio del período o estimación basada en visitas)
        const responseTime =
          monthVisits.length > 0 ? Math.max(5, Math.min(30, 15 + monthVisits.length / 10)) : 15;

        const monthNames = [
          'Ene',
          'Feb',
          'Mar',
          'Abr',
          'May',
          'Jun',
          'Jul',
          'Ago',
          'Sep',
          'Oct',
          'Nov',
          'Dic',
        ];
        const monthIndex = monthStart.getMonth();
        monthlyData.push({
          month: monthNames[monthIndex] || `Mes ${monthIndex + 1}`,
          rating: Math.round(rating * 10) / 10,
          visits,
          earnings,
          onTimeRate: Math.round(onTimeRate * 10) / 10,
          responseTime,
        });
      }

      return monthlyData;
    } catch (error) {
      logger.error('Error generando rendimiento mensual:', error as Error);
      return [];
    }
  }

  /**
   * Obtiene feedback (calificaciones con comentarios) para un runner
   */
  static async getRunnerFeedback(
    runnerId: string,
    limit: number = 10
  ): Promise<
    Array<{
      id: string;
      clientName: string;
      rating: number;
      comment: string;
      date: string;
      propertyTitle: string;
    }>
  > {
    try {
      const ratings = await db.userRating.findMany({
        where: {
          toUserId: runnerId,
          comment: {
            not: null,
          },
        },
        include: {
          fromUser: {
            select: {
              name: true,
            },
          },
          property: {
            select: {
              title: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        take: limit,
      });

      return ratings.map(rating => ({
        id: rating.id,
        clientName: rating.fromUser?.name || 'Usuario',
        rating: rating.overallRating,
        comment: rating.comment || '',
        date: rating.createdAt.toISOString(),
        propertyTitle: rating.property?.title || 'Propiedad',
      }));
    } catch (error) {
      logger.error('Error obteniendo feedback:', error as Error);
      return [];
    }
  }

  /**
   * Calcula logros del runner basados en métricas reales
   */
  static async calculateRunnerAchievements(
    runnerId: string,
    metrics: RunnerPerformanceMetrics
  ): Promise<
    Array<{
      id: string;
      title: string;
      description: string;
      icon: string;
      achieved: boolean;
      date?: string;
      value?: number;
    }>
  > {
    const achievements = [];

    // Logro: Primeras 50 visitas
    if (metrics.totalVisits >= 50) {
      achievements.push({
        id: '1',
        title: 'Primeras 50 Visitas',
        description: 'Completaste tus primeras 50 visitas',
        icon: '🎯',
        achieved: true,
        value: 50,
      });
    } else {
      achievements.push({
        id: '1',
        title: 'Primeras 50 Visitas',
        description: 'Completaste tus primeras 50 visitas',
        icon: '🎯',
        achieved: false,
        value: 50,
      });
    }

    // Logro: Runner Estrella (rating 4.5+)
    if (metrics.averageRating >= 4.5 && metrics.totalVisits >= 10) {
      achievements.push({
        id: '2',
        title: 'Runner Estrella',
        description: 'Mantén un rating de 4.5+',
        icon: '⭐',
        achieved: true,
      });
    } else {
      achievements.push({
        id: '2',
        title: 'Runner Estrella',
        description: 'Mantén un rating de 4.5+',
        icon: '⭐',
        achieved: false,
      });
    }

    // Logro: Experto en Conversión (tasa de completitud alta)
    const conversionRate = metrics.completionRate;
    if (conversionRate >= 80) {
      achievements.push({
        id: '3',
        title: 'Experto en Conversión',
        description: 'Alcanza 80% de tasa de completitud',
        icon: '📈',
        achieved: true,
        value: 80,
      });
    } else {
      achievements.push({
        id: '3',
        title: 'Experto en Conversión',
        description: 'Alcanza 80% de tasa de completitud',
        icon: '📈',
        achieved: false,
        value: 80,
      });
    }

    // Logro: Millonario
    if (metrics.totalEarnings >= 1000000) {
      achievements.push({
        id: '4',
        title: 'Millonario',
        description: 'Acumula $1,000,000 en ganancias',
        icon: '💰',
        achieved: true,
        value: 1000000,
      });
    } else {
      achievements.push({
        id: '4',
        title: 'Millonario',
        description: 'Acumula $1,000,000 en ganancias',
        icon: '💰',
        achieved: false,
        value: 1000000,
      });
    }

    // Logro: Perfect Timing
    if (metrics.onTimeRate >= 98) {
      achievements.push({
        id: '5',
        title: 'Perfect Timing',
        description: 'Alcanza 98% de puntualidad',
        icon: '⏰',
        achieved: true,
        value: 98,
      });
    } else {
      achievements.push({
        id: '5',
        title: 'Perfect Timing',
        description: 'Alcanza 98% de puntualidad',
        icon: '⏰',
        achieved: false,
        value: 98,
      });
    }

    // Logro: Runner Legendario
    if (metrics.totalVisits >= 200) {
      achievements.push({
        id: '6',
        title: 'Runner Legendario',
        description: 'Completa 200 visitas',
        icon: '🏆',
        achieved: true,
        value: 200,
      });
    } else {
      achievements.push({
        id: '6',
        title: 'Runner Legendario',
        description: 'Completa 200 visitas',
        icon: '🏆',
        achieved: false,
        value: 200,
      });
    }

    return achievements;
  }

  /**
   * Genera reporte semanal para un runner
   */
  static async generateWeeklyReport(runnerId: string): Promise<RunnerWeeklyReport> {
    try {
      const runner = await db.user.findUnique({
        where: { id: runnerId },
        select: {
          id: true,
          name: true,
        },
      });

      if (!runner) {
        throw new BusinessLogicError('Runner no encontrado');
      }

      // Calcular fechas de la semana
      const now = new Date();
      const weekEnd = new Date(now);
      const weekStart = new Date(weekEnd);
      weekStart.setDate(weekEnd.getDate() - 7);

      // Obtener visitas de esta semana
      const thisWeekVisits = await db.visit.findMany({
        where: {
          runnerId: runnerId,
          createdAt: {
            gte: weekStart,
            lte: weekEnd,
          },
        },
        include: {
          property: {
            select: {
              address: true,
            },
          },
        },
      });

      // Obtener visitas de la semana anterior
      const lastWeekStart = new Date(weekStart);
      lastWeekStart.setDate(lastWeekStart.getDate() - 7);
      const lastWeekEnd = new Date(weekStart);

      const lastWeekVisits = await db.visit.findMany({
        where: {
          runnerId: runnerId,
          createdAt: {
            gte: lastWeekStart,
            lte: lastWeekEnd,
          },
        },
      });

      // Calcular métricas
      const visitsCompleted = thisWeekVisits.filter(v => v.status === 'completed').length;
      const earningsGenerated = thisWeekVisits.reduce((sum, v) => sum + (v.earnings || 0), 0);
      const previousWeekVisits = lastWeekVisits.filter(v => v.status === 'completed').length;
      const previousWeekEarnings = lastWeekVisits.reduce((sum, v) => sum + (v.earnings || 0), 0);

      const visitsChange =
        previousWeekVisits > 0
          ? ((visitsCompleted - previousWeekVisits) / previousWeekVisits) * 100
          : visitsCompleted > 0
            ? 100
            : 0;

      const earningsChange =
        previousWeekEarnings > 0
          ? ((earningsGenerated - previousWeekEarnings) / previousWeekEarnings) * 100
          : earningsGenerated > 0
            ? 100
            : 0;

      // Generar rendimiento diario
      const dailyPerformance = [];
      for (let i = 0; i < 7; i++) {
        const date = new Date(weekStart);
        date.setDate(date.getDate() + i);

        const dayVisits = thisWeekVisits.filter(v => {
          const visitDate = new Date(v.createdAt);
          return visitDate.toDateString() === date.toDateString();
        });

        const dayEarnings = dayVisits.reduce((sum, v) => sum + (v.earnings || 0), 0);
        const dayRating = 4.5; // Placeholder
        const dayDuration =
          dayVisits.length > 0
            ? dayVisits.reduce((sum, v) => sum + (v.duration || 0), 0) / dayVisits.length
            : 0;

        dailyPerformance.push({
          date: date.toISOString().substring(0, 10),
          visits: dayVisits.length,
          earnings: dayEarnings,
          rating: dayRating,
          duration: dayDuration,
        });
      }

      // Obtener ranking semanal
      const rankingPosition = await this.calculateWeeklyRanking(runnerId);

      // Calcular logros
      const achievements = this.calculateWeeklyAchievements({
        visitsCompleted,
        earningsGenerated,
        rankingPosition,
        visitsChange,
        earningsChange,
      });

      // Generar recomendaciones
      const recommendations = this.generateWeeklyRecommendations({
        visitsCompleted,
        earningsGenerated,
        rankingPosition,
        visitsChange,
        earningsChange,
      });

      // Próximas visitas
      const upcomingVisits = await this.getUpcomingVisits(runnerId);

      return {
        runnerId,
        weekStart,
        weekEnd,
        visitsCompleted,
        earningsGenerated,
        averageRating: 4.5, // Placeholder
        rankingPosition,
        dailyPerformance,
        previousWeekVisits,
        previousWeekEarnings,
        visitsChange,
        earningsChange,
        achievements,
        recommendations,
        upcomingVisits,
      };
    } catch (error) {
      logger.error('Error generando reporte semanal:', error as Error);
      throw error;
    }
  }

  /**
   * Obtiene ranking semanal de runners
   */
  static async getWeeklyRanking(): Promise<RunnerRankingData[]> {
    try {
      // Obtener todos los runners con visitas esta semana
      const weekStart = new Date();
      weekStart.setDate(weekStart.getDate() - 7);

      const runnersWithStats = await db.visit.groupBy({
        by: ['runnerId'],
        where: {
          createdAt: {
            gte: weekStart,
          },
          status: 'completed',
        },
        _count: {
          id: true,
        },
        _sum: {
          earnings: true,
        },
      });

      // Enriquecer con información de usuario
      const rankingData: RunnerRankingData[] = [];

      for (const stat of runnersWithStats) {
        const runner = await db.user.findUnique({
          where: { id: stat.runnerId },
          select: {
            id: true,
            name: true,
          },
        });

        if (runner) {
          rankingData.push({
            runnerId: stat.runnerId,
            runnerName: runner.name || 'Runner',
            position: 0, // Se calculará después
            previousPosition: 0, // Placeholder
            score: stat._count.id * 10 + (stat._sum.earnings || 0) * 0.1,
            visitsThisWeek: stat._count.id,
            earningsThisWeek: stat._sum.earnings || 0,
            averageRating: 4.5, // Placeholder
            trend: 'stable', // Placeholder
          });
        }
      }

      // Ordenar por score y asignar posiciones
      rankingData.sort((a, b) => b.score - a.score);
      rankingData.forEach((runner, index) => {
        runner.position = index + 1;
      });

      return rankingData;
    } catch (error) {
      logger.error('Error obteniendo ranking semanal:', error as Error);
      return [];
    }
  }

  /**
   * Envía reportes semanales a todos los runners activos
   */
  static async sendWeeklyReports(): Promise<void> {
    try {
      logger.info('Iniciando envío de reportes semanales a runners');

      // Obtener todos los runners activos
      const activeRunners = await db.user.findMany({
        where: {
          role: 'RUNNER',
          isActive: true,
        },
        select: {
          id: true,
          name: true,
          email: true,
        },
      });

      let successCount = 0;
      let errorCount = 0;

      for (const runner of activeRunners) {
        try {
          // Generar reporte semanal
          const report = await this.generateWeeklyReport(runner.id);

          // Enviar notificación
          await NotificationService.create({
            userId: runner.id,
            type: NotificationType.NEW_MESSAGE,
            title: '📊 Reporte Semanal Disponible',
            message: `Tu reporte semanal está listo. Visitas: ${report.visitsCompleted}, Ganancias: $${report.earningsGenerated.toFixed(2)}, Rating: ${report.averageRating.toFixed(1)}`,
            link: '/runner/reports',
            metadata: {
              visitsCompleted: report.visitsCompleted,
              earningsGenerated: report.earningsGenerated,
              averageRating: report.averageRating,
              rankingPosition: report.rankingPosition,
              type: 'weekly_report',
            },
          });

          successCount++;
          logger.info('Reporte semanal enviado', { runnerId: runner.id });
        } catch (error) {
          errorCount++;
          logger.error('Error enviando reporte semanal', {
            runnerId: runner.id,
            error: error instanceof Error ? error.message : String(error),
          });
        }
      }

      logger.info('Envío de reportes semanales completado', {
        totalRunners: activeRunners.length,
        successCount,
        errorCount,
      });
    } catch (error) {
      logger.error('Error en envío masivo de reportes semanales:', error as Error);
    }
  }

  // ===== MÉTODOS AUXILIARES =====

  private static calculateImprovementAreas(metrics: {
    completionRate: number;
    averageRating: number;
    visitsPerDay: number;
  }): string[] {
    const areas: string[] = [];

    if (metrics.completionRate < 90) {
      areas.push('Aumentar tasa de finalización de visitas');
    }

    if (metrics.averageRating < 4.5) {
      areas.push('Mejorar calificación promedio');
    }

    if (metrics.visitsPerDay < 2) {
      areas.push('Incrementar número de visitas diarias');
    }

    return areas.length > 0 ? areas : ['Continuar con el excelente rendimiento actual'];
  }

  private static calculateStrengths(metrics: {
    completionRate: number;
    averageRating: number;
    earningsGrowth: number;
  }): string[] {
    const strengths: string[] = [];

    if (metrics.completionRate >= 95) {
      strengths.push('Excelente tasa de finalización de visitas');
    }

    if (metrics.averageRating >= 4.8) {
      strengths.push('Calificación excepcional de clientes');
    }

    if (metrics.earningsGrowth > 10) {
      strengths.push('Crecimiento significativo en ganancias');
    }

    return strengths.length > 0 ? strengths : ['Rendimiento consistente'];
  }

  private static async calculateWeeklyRanking(runnerId: string): Promise<number> {
    const ranking = await this.getWeeklyRanking();
    const runnerRank = ranking.find(r => r.runnerId === runnerId);
    return runnerRank?.position || 999;
  }

  private static calculateWeeklyAchievements(data: {
    visitsCompleted: number;
    earningsGenerated: number;
    rankingPosition: number;
    visitsChange: number;
    earningsChange: number;
  }): { name: string; description: string; icon: string }[] {
    const achievements: { name: string; description: string; icon: string }[] = [];

    if (data.visitsCompleted >= 20) {
      achievements.push({
        name: 'Super Runner',
        description: 'Completaste 20+ visitas esta semana',
        icon: '🏃‍♂️',
      });
    }

    if (data.earningsGenerated >= 100000) {
      achievements.push({
        name: 'Top Earner',
        description: 'Generaste más de $100.000 en ganancias',
        icon: '💰',
      });
    }

    if (data.rankingPosition <= 3) {
      achievements.push({
        name: 'Top 3',
        description: 'Estás en el top 3 del ranking semanal',
        icon: '🥇',
      });
    }

    if (data.visitsChange > 20) {
      achievements.push({
        name: 'Growing Star',
        description: 'Incrementaste tus visitas en más del 20%',
        icon: '📈',
      });
    }

    return achievements;
  }

  private static generateWeeklyRecommendations(data: {
    visitsCompleted: number;
    earningsGenerated: number;
    rankingPosition: number;
    visitsChange: number;
    earningsChange: number;
  }): string[] {
    const recommendations: string[] = [];

    if (data.visitsCompleted < 10) {
      recommendations.push(
        'Considera aumentar el número de visitas semanales para maximizar tus ganancias'
      );
    }

    if (data.visitsChange < 0) {
      recommendations.push('Analiza por qué disminuyeron tus visitas esta semana');
    }

    if (data.rankingPosition > 10) {
      recommendations.push('Revisa estrategias de los runners top para mejorar tu posicionamiento');
    }

    if (data.earningsChange < 0) {
      recommendations.push('Evalúa qué tipos de visitas generan mejores ganancias');
    }

    return recommendations.length > 0
      ? recommendations
      : ['¡Sigue manteniendo tu excelente rendimiento!'];
  }

  private static async getUpcomingVisits(runnerId: string): Promise<
    {
      date: string;
      time: string;
      propertyAddress: string;
      clientName: string;
    }[]
  > {
    try {
      const upcomingVisits = await db.visit.findMany({
        where: {
          runnerId: runnerId,
          status: 'scheduled',
          scheduledAt: {
            gte: new Date(),
          },
        },
        include: {
          property: {
            select: {
              address: true,
            },
          },
          tenant: {
            select: {
              name: true,
            },
          },
        },
        orderBy: {
          scheduledAt: 'asc',
        },
        take: 5,
      });

      return upcomingVisits.map(visit => ({
        date: visit.scheduledAt.toISOString().substring(0, 10),
        time: visit.scheduledAt.toTimeString().substring(0, 5),
        propertyAddress: visit.property?.address || 'Dirección no disponible',
        clientName: visit.tenant?.name || 'Cliente',
      }));
    } catch (error) {
      logger.error('Error obteniendo próximas visitas:', error as Error);
      return [];
    }
  }
}

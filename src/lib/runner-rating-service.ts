import { db } from './db';
import { logger } from './logger';
import { DatabaseError, BusinessLogicError, ValidationError } from './errors';
import { NotificationService } from './notification-service';

export interface RunnerRating {
  id: string;
  visitId: string;
  runnerId: string;
  clientId: string;
  clientName: string;
  clientEmail: string;

  // Calificaciones
  overallRating: number; // 1-5
  punctualityRating: number; // 1-5
  professionalismRating: number; // 1-5
  communicationRating: number; // 1-5
  propertyKnowledgeRating: number; // 1-5

  // Feedback detallado
  comment: string;
  positiveFeedback: string[];
  improvementAreas: string[];

  // Información de contexto
  propertyAddress: string;
  visitDate: Date;
  visitDuration: number;
  propertyType: string;

  // Metadata
  isAnonymous: boolean;
  isVerified: boolean; // Verificado por sistema (no fake)
  createdAt: Date;
  updatedAt: Date;
}

export interface RunnerRatingSummary {
  runnerId: string;
  runnerName: string;

  // Estadísticas generales
  totalRatings: number;
  averageRating: number;
  ratingDistribution: { [key: number]: number };

  // Promedios por categoría
  averagePunctuality: number;
  averageProfessionalism: number;
  averageCommunication: number;
  averagePropertyKnowledge: number;

  // Tendencias
  ratingTrend: 'improving' | 'declining' | 'stable';
  last30DaysAverage: number;
  previous30DaysAverage: number;

  // Análisis de feedback
  commonPositiveFeedback: string[];
  commonImprovementAreas: string[];

  // Métricas de calidad
  responseRate: number; // Porcentaje de visitas que reciben calificación
  verifiedRatingsPercentage: number;

  // Rankings
  currentRanking: number;
  bestCategory: string;
  worstCategory: string;
}

export interface RatingCriteria {
  name: string;
  weight: number;
  description: string;
}

/**
 * Servicio de calificaciones para runners basado en desempeño
 */
export class RunnerRatingService {
  private static readonly RATING_CRITERIA: RatingCriteria[] = [
    {
      name: 'overall',
      weight: 0.4,
      description: 'Calificación general del servicio'
    },
    {
      name: 'punctuality',
      weight: 0.25,
      description: 'Puntualidad en las citas'
    },
    {
      name: 'professionalism',
      weight: 0.2,
      description: 'Profesionalismo y actitud'
    },
    {
      name: 'communication',
      weight: 0.1,
      description: 'Calidad de la comunicación'
    },
    {
      name: 'property_knowledge',
      weight: 0.05,
      description: 'Conocimiento de propiedades'
    }
  ];

  /**
   * Crea una nueva calificación para un runner
   */
  static async createRunnerRating(ratingData: {
    visitId: string;
    runnerId: string;
    clientId: string;
    overallRating: number;
    punctualityRating: number;
    professionalismRating: number;
    communicationRating: number;
    propertyKnowledgeRating: number;
    comment?: string;
    positiveFeedback?: string[];
    improvementAreas?: string[];
    isAnonymous?: boolean;
  }): Promise<RunnerRating> {
    try {
      // Validar que la visita existe y pertenece al runner
      const visit = await db.visit.findUnique({
        where: { id: ratingData.visitId },
        include: {
          runner: {
            select: {
              id: true,
              name: true,
              email: true
            }
          },
          property: {
            select: {
              address: true,
              type: true
            }
          },
          tenant: {
            select: {
              id: true,
              name: true,
              email: true
            }
          }
        }
      });

      if (!visit) {
        throw new BusinessLogicError('Visita no encontrada');
      }

      if (visit.runnerId !== ratingData.runnerId) {
        throw new BusinessLogicError('La visita no pertenece al runner especificado');
      }

      if (visit.status !== 'completed') {
        throw new BusinessLogicError('Solo se pueden calificar visitas completadas');
      }

      // Verificar que no exista ya una calificación para esta visita por este cliente
      const existingRating = await db.runnerRating.findUnique({
        where: {
          visitId_clientId: {
            visitId: ratingData.visitId,
            clientId: ratingData.clientId
          }
        }
      });

      if (existingRating) {
        throw new BusinessLogicError('Ya existe una calificación para esta visita');
      }

      // Validar rangos de calificación
      const ratings = [
        ratingData.overallRating,
        ratingData.punctualityRating,
        ratingData.professionalismRating,
        ratingData.communicationRating,
        ratingData.propertyKnowledgeRating
      ];

      for (const rating of ratings) {
        if (rating < 1 || rating > 5) {
          throw new ValidationError('Las calificaciones deben estar entre 1 y 5');
        }
      }

      // Obtener información del cliente
      const client = await db.user.findUnique({
        where: { id: ratingData.clientId },
        select: {
          id: true,
          name: true,
          email: true
        }
      });

      if (!client) {
        throw new BusinessLogicError('Cliente no encontrado');
      }

      // Crear la calificación
      const rating = await db.runnerRating.create({
        data: {
          visitId: ratingData.visitId,
          runnerId: ratingData.runnerId,
          clientId: ratingData.clientId,
          clientName: client.name || 'Cliente',
          clientEmail: client.email || '',
          overallRating: ratingData.overallRating,
          punctualityRating: ratingData.punctualityRating,
          professionalismRating: ratingData.professionalismRating,
          communicationRating: ratingData.communicationRating,
          propertyKnowledgeRating: ratingData.propertyKnowledgeRating,
          comment: ratingData.comment || '',
          positiveFeedback: ratingData.positiveFeedback || [],
          improvementAreas: ratingData.improvementAreas || [],
          propertyAddress: visit.property?.address || '',
          visitDate: visit.createdAt,
          visitDuration: visit.actualDuration || visit.estimatedDuration || 0,
          propertyType: visit.property?.type || 'unknown',
          isAnonymous: ratingData.isAnonymous || false,
          isVerified: true, // Asumimos verificado por ahora
          createdAt: new Date(),
          updatedAt: new Date()
        }
      });

      logger.info('Nueva calificación de runner creada', {
        ratingId: rating.id,
        runnerId: ratingData.runnerId,
        visitId: ratingData.visitId,
        overallRating: ratingData.overallRating
      });

      // Enviar notificación al runner sobre la nueva calificación
      await this.notifyRunnerOfRating(rating);

      // Verificar si se alcanzan incentivos por rating
      await this.checkRatingBasedIncentives(ratingData.runnerId);

      return rating;

    } catch (error) {
      logger.error('Error creando calificación de runner:', error as Error);
      throw error;
    }
  }

  /**
   * Obtiene el resumen de calificaciones de un runner
   */
  static async getRunnerRatingSummary(
    runnerId: string,
    periodStart?: Date,
    periodEnd?: Date
  ): Promise<RunnerRatingSummary> {
    try {
      const runner = await db.user.findUnique({
        where: { id: runnerId },
        select: {
          id: true,
          name: true
        }
      });

      if (!runner) {
        throw new BusinessLogicError('Runner no encontrado');
      }

      const endDate = periodEnd || new Date();
      const startDate = periodStart || new Date(endDate.getTime() - 90 * 24 * 60 * 60 * 1000);

      // Obtener todas las calificaciones del período
      const ratings = await db.runnerRating.findMany({
        where: {
          runnerId: runnerId,
          createdAt: {
            gte: startDate,
            lte: endDate
          }
        },
        orderBy: {
          createdAt: 'desc'
        }
      });

      if (ratings.length === 0) {
        return {
          runnerId,
          runnerName: runner.name || 'Runner',
          totalRatings: 0,
          averageRating: 0,
          ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
          averagePunctuality: 0,
          averageProfessionalism: 0,
          averageCommunication: 0,
          averagePropertyKnowledge: 0,
          ratingTrend: 'stable',
          last30DaysAverage: 0,
          previous30DaysAverage: 0,
          commonPositiveFeedback: [],
          commonImprovementAreas: [],
          responseRate: 0,
          verifiedRatingsPercentage: 0,
          currentRanking: 0,
          bestCategory: '',
          worstCategory: ''
        };
      }

      // Calcular estadísticas básicas
      const totalRatings = ratings.length;
      const averageRating = ratings.reduce((sum, r) => sum + r.overallRating, 0) / totalRatings;

      // Distribución de calificaciones
      const ratingDistribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
      ratings.forEach(rating => {
        ratingDistribution[rating.overallRating as keyof typeof ratingDistribution]++;
      });

      // Promedios por categoría
      const averagePunctuality = ratings.reduce((sum, r) => sum + r.punctualityRating, 0) / totalRatings;
      const averageProfessionalism = ratings.reduce((sum, r) => sum + r.professionalismRating, 0) / totalRatings;
      const averageCommunication = ratings.reduce((sum, r) => sum + r.communicationRating, 0) / totalRatings;
      const averagePropertyKnowledge = ratings.reduce((sum, r) => sum + r.propertyKnowledgeRating, 0) / totalRatings;

      // Calcular tendencias (últimos 30 días vs 30 días anteriores)
      const last30Days = new Date(endDate.getTime() - 30 * 24 * 60 * 60 * 1000);
      const previous30Days = new Date(last30Days.getTime() - 30 * 24 * 60 * 60 * 1000);

      const last30DaysRatings = ratings.filter(r => r.createdAt >= last30Days);
      const previous30DaysRatings = ratings.filter(r =>
        r.createdAt >= previous30Days && r.createdAt < last30Days
      );

      const last30DaysAverage = last30DaysRatings.length > 0
        ? last30DaysRatings.reduce((sum, r) => sum + r.overallRating, 0) / last30DaysRatings.length
        : 0;

      const previous30DaysAverage = previous30DaysRatings.length > 0
        ? previous30DaysRatings.reduce((sum, r) => sum + r.overallRating, 0) / previous30DaysRatings.length
        : 0;

      const ratingTrend = last30DaysAverage > previous30DaysAverage + 0.1 ? 'improving'
        : last30DaysAverage < previous30DaysAverage - 0.1 ? 'declining'
        : 'stable';

      // Análisis de feedback
      const allPositiveFeedback = ratings.flatMap(r => r.positiveFeedback || []);
      const allImprovementAreas = ratings.flatMap(r => r.improvementAreas || []);

      const commonPositiveFeedback = this.getMostCommonItems(allPositiveFeedback, 3);
      const commonImprovementAreas = this.getMostCommonItems(allImprovementAreas, 3);

      // Calcular tasa de respuesta (porcentaje de visitas que reciben calificación)
      const totalVisits = await db.visit.count({
        where: {
          runnerId: runnerId,
          status: 'completed',
          createdAt: {
            gte: startDate,
            lte: endDate
          }
        }
      });

      const responseRate = totalVisits > 0 ? (totalRatings / totalVisits) * 100 : 0;

      // Porcentaje de calificaciones verificadas
      const verifiedRatings = ratings.filter(r => r.isVerified).length;
      const verifiedRatingsPercentage = totalRatings > 0 ? (verifiedRatings / totalRatings) * 100 : 0;

      // Ranking actual (placeholder - implementar comparación real)
      const currentRanking = 5;

      // Mejor y peor categoría
      const categoryAverages = {
        punctuality: averagePunctuality,
        professionalism: averageProfessionalism,
        communication: averageCommunication,
        propertyKnowledge: averagePropertyKnowledge
      };

      const sortedCategories = Object.entries(categoryAverages)
        .sort(([,a], [,b]) => b - a);

      const bestCategory = sortedCategories.length > 0 ? sortedCategories[0]![0] : '';
      const worstCategory = sortedCategories.length > 0 ? sortedCategories[sortedCategories.length - 1]![0] : '';

      return {
        runnerId,
        runnerName: runner.name || 'Runner',
        totalRatings,
        averageRating,
        ratingDistribution,
        averagePunctuality,
        averageProfessionalism,
        averageCommunication,
        averagePropertyKnowledge,
        ratingTrend,
        last30DaysAverage,
        previous30DaysAverage,
        commonPositiveFeedback,
        commonImprovementAreas,
        responseRate,
        verifiedRatingsPercentage,
        currentRanking,
        bestCategory,
        worstCategory
      };

    } catch (error) {
      logger.error('Error obteniendo resumen de calificaciones:', error as Error);
      throw error;
    }
  }

  /**
   * Obtiene todas las calificaciones de un runner
   */
  static async getRunnerRatings(
    runnerId: string,
    limit: number = 10,
    offset: number = 0
  ): Promise<RunnerRating[]> {
    try {
      const ratings = await db.runnerRating.findMany({
        where: { runnerId },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset
      });

      return ratings;
    } catch (error) {
      logger.error('Error obteniendo calificaciones de runner:', error as Error);
      throw error;
    }
  }

  /**
   * Calcula el ranking global de runners basado en calificaciones
   */
  static async calculateRunnerRanking(limit: number = 50): Promise<{
    runnerId: string;
    runnerName: string;
    averageRating: number;
    totalRatings: number;
    rankingScore: number;
    position: number;
  }[]> {
    try {
      // Obtener estadísticas de todos los runners
      const runnerStats = await db.runnerRating.groupBy({
        by: ['runnerId'],
        _count: {
          id: true
        },
        _avg: {
          overallRating: true,
          punctualityRating: true,
          professionalismRating: true,
          communicationRating: true,
          propertyKnowledgeRating: true
        },
        having: {
          id: {
            _count: {
              gt: 4 // Solo runners con al menos 5 calificaciones
            }
          }
        }
      });

      // Enriquecer con nombres de runners
      const ranking = [];

      for (const stat of runnerStats) {
        const runner = await db.user.findUnique({
          where: { id: stat.runnerId },
          select: {
            id: true,
            name: true
          }
        });

        if (runner) {
          // Calcular score ponderado
          const avg = stat._avg;
          const score = (
            (avg.overallRating || 0) * 0.4 +
            (avg.punctualityRating || 0) * 0.25 +
            (avg.professionalismRating || 0) * 0.2 +
            (avg.communicationRating || 0) * 0.1 +
            (avg.propertyKnowledgeRating || 0) * 0.05
          );

          ranking.push({
            runnerId: stat.runnerId,
            runnerName: runner.name || 'Runner',
            averageRating: avg.overallRating || 0,
            totalRatings: stat._count.id,
            rankingScore: score,
            position: 0 // Se asignará después de ordenar
          });
        }
      }

      // Ordenar por score y asignar posiciones
      ranking.sort((a, b) => b.rankingScore - a.rankingScore);
      ranking.forEach((runner, index) => {
        runner.position = index + 1;
      });

      return ranking.slice(0, limit);

    } catch (error) {
      logger.error('Error calculando ranking de runners:', error as Error);
      return [];
    }
  }

  // ===== MÉTODOS AUXILIARES =====

  private static getMostCommonItems(items: string[], limit: number = 5): string[] {
    const frequency: { [key: string]: number } = {};

    items.forEach(item => {
      if (item.trim()) {
        frequency[item] = (frequency[item] || 0) + 1;
      }
    });

    return Object.entries(frequency)
      .sort(([,a], [,b]) => b - a)
      .slice(0, limit)
      .map(([item]) => item);
  }

  private static async notifyRunnerOfRating(rating: RunnerRating): Promise<void> {
    try {
      // Obtener rating anterior promedio
      const summary = await this.getRunnerRatingSummary(rating.runnerId);
      const previousRating = summary.averageRating;

      await NotificationService.notifyRunnerRatingUpdated({
        runnerId: rating.runnerId,
        newRating: summary.averageRating,
        previousRating: previousRating,
        clientName: rating.clientName,
        propertyAddress: rating.propertyAddress,
        clientFeedback: rating.comment
      });

    } catch (error) {
      logger.error('Error notificando calificación:', error as Error);
    }
  }

  private static async checkRatingBasedIncentives(runnerId: string): Promise<void> {
    try {
      const summary = await this.getRunnerRatingSummary(runnerId);

      // Verificar si alcanza incentivo por rating promedio
      if (summary.averageRating >= 4.8 && summary.totalRatings >= 10) {
        await NotificationService.notifyRunnerIncentiveAchieved({
          runnerId,
          incentiveName: 'Top Rater',
          incentiveLevel: 'Gold',
          rewardDescription: 'Badge especial "Top Rater" y prioridad en asignación de visitas premium',
          visitCount: summary.totalRatings,
          averageRating: summary.averageRating
        });
      }

      // Verificar si mejora significativamente su rating
      if (summary.ratingTrend === 'improving' && summary.last30DaysAverage >= 4.5) {
        await NotificationService.notifyRunnerIncentiveAchieved({
          runnerId,
          incentiveName: 'Rising Star',
          incentiveLevel: 'Silver',
          rewardDescription: 'Badge "Rising Star" por mejora significativa en calificaciones',
          visitCount: summary.totalRatings,
          averageRating: summary.averageRating
        });
      }

    } catch (error) {
      logger.error('Error verificando incentivos por rating:', error as Error);
    }
  }

  /**
   * Valida que una visita pueda ser calificada
   */
  static async canRateVisit(visitId: string, clientId: string): Promise<boolean> {
    try {
      const visit = await db.visit.findUnique({
        where: { id: visitId },
        include: {
          tenant: true
        }
      });

      if (!visit) return false;

      // Solo visitas completadas pueden ser calificadas
      if (visit.status !== 'completed') return false;

      // Solo el tenant de la visita puede calificar
      if (visit.tenant?.id !== clientId) return false;

      // La visita debe haber terminado hace al menos 1 hora
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
      if (visit.updatedAt > oneHourAgo) return false;

      // No debe existir ya una calificación
      const existingRating = await db.runnerRating.findUnique({
        where: { visitId }
      });

      return !existingRating;

    } catch (error) {
      logger.error('Error validando si se puede calificar visita:', error as Error);
      return false;
    }
  }
}

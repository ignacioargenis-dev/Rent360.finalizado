import { db } from './db';
import { logger } from './logger';
import { DatabaseError, BusinessLogicError, ValidationError } from './errors';
import { NotificationService, NotificationType } from './notification-service';
import { RatingContextType } from '@/types/index';

export interface UserRatingData {
  fromUserId: string;
  toUserId: string;
  contextType: RatingContextType;
  contextId: string;
  overallRating: number;
  communicationRating?: number;
  reliabilityRating?: number;
  professionalismRating?: number;
  qualityRating?: number;
  punctualityRating?: number;
  comment?: string;
  positiveFeedback?: string[];
  improvementAreas?: string[];
  propertyId?: string;
  contractId?: string;
  isAnonymous?: boolean;
  isPublic?: boolean;
}

export interface UserRating {
  id: string;
  fromUserId: string;
  toUserId: string;
  contextType: RatingContextType;
  contextId: string;
  overallRating: number;
  communicationRating?: number | null;
  reliabilityRating?: number | null;
  professionalismRating?: number | null;
  qualityRating?: number | null;
  punctualityRating?: number | null;
  comment?: string | null;
  positiveFeedback: string[];
  improvementAreas: string[];
  propertyId?: string | null;
  contractId?: string | null;
  isAnonymous: boolean;
  isPublic: boolean;
  isVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
  fromUser?: {
    id: string;
    name: string;
    avatar?: string | null;
  };
  toUser?: {
    id: string;
    name: string;
    avatar?: string | null;
  };
  property?: {
    id: string;
    title: string;
    address: string;
  } | null;
  contract?: {
    id: string;
    contractNumber: string;
  } | null;
}

export interface UserRatingSummary {
  userId: string;
  userName: string;
  totalRatings: number;
  averageRating: number;
  ratingDistribution: { [key: number]: number };

  // Promedios por categoría
  averageCommunication?: number | undefined;
  averageReliability?: number | undefined;
  averageProfessionalism?: number | undefined;
  averageQuality?: number | undefined;
  averagePunctuality?: number | undefined;

  // Análisis de feedback
  commonPositiveFeedback: string[];
  commonImprovementAreas: string[];

  // Métricas de calidad
  responseRate: number;
  verifiedRatingsPercentage: number;

  // Rankings
  overallRanking: number;
  categoryRankings: {
    communication?: number | undefined;
    reliability?: number | undefined;
    professionalism?: number | undefined;
    quality?: number | undefined;
    punctuality?: number | undefined;
  };
}

/**
 * Servicio de calificaciones universales bidireccionales para Rent360
 */
export class UserRatingService {
  /**
   * Crear una nueva calificación
   */
  static async createRating(ratingData: UserRatingData): Promise<UserRating> {
    console.log('🎯🎯🎯 [USER RATING SERVICE] createRating CALLED with data:', {
      fromUserId: ratingData.fromUserId,
      toUserId: ratingData.toUserId,
      contextType: ratingData.contextType,
      overallRating: ratingData.overallRating,
      timestamp: new Date().toISOString(),
    });

    try {
      // Validar que el usuario no se califique a sí mismo
      if (ratingData.fromUserId === ratingData.toUserId) {
        throw new ValidationError('No puedes calificarte a ti mismo');
      }

      // Validar que ambos usuarios existen
      const [fromUser, toUser] = await Promise.all([
        db.user.findUnique({
          where: { id: ratingData.fromUserId },
          select: { id: true, name: true },
        }),
        db.user.findUnique({
          where: { id: ratingData.toUserId },
          select: { id: true, name: true, role: true },
        }),
      ]);

      if (!fromUser || !toUser) {
        throw new ValidationError('Usuario no encontrado');
      }

      // Validar que no exista una calificación previa para el mismo contexto
      const existingRating = await db.userRating.findUnique({
        where: {
          fromUserId_toUserId_contextType_contextId: {
            fromUserId: ratingData.fromUserId,
            toUserId: ratingData.toUserId,
            contextType: ratingData.contextType,
            contextId: ratingData.contextId,
          },
        },
      });

      if (existingRating) {
        throw new BusinessLogicError('Ya has calificado este contexto anteriormente');
      }

      // Crear la calificación
      const rating = await db.userRating.create({
        data: {
          fromUserId: ratingData.fromUserId,
          toUserId: ratingData.toUserId,
          contextType: ratingData.contextType,
          contextId: ratingData.contextId,
          overallRating: ratingData.overallRating,
          communicationRating: ratingData.communicationRating || null,
          reliabilityRating: ratingData.reliabilityRating || null,
          professionalismRating: ratingData.professionalismRating || null,
          qualityRating: ratingData.qualityRating || null,
          punctualityRating: ratingData.punctualityRating || null,
          comment: ratingData.comment || null,
          positiveFeedback: ratingData.positiveFeedback || [],
          improvementAreas: ratingData.improvementAreas || [],
          propertyId: ratingData.propertyId || null,
          contractId: ratingData.contractId || null,
          isAnonymous: ratingData.isAnonymous || false,
          isPublic: ratingData.isPublic !== false, // Default true
        },
        include: {
          fromUser: {
            select: { id: true, name: true, avatar: true },
          },
          toUser: {
            select: { id: true, name: true, avatar: true },
          },
          property: {
            select: { id: true, title: true, address: true },
          },
          contract: {
            select: { id: true, contractNumber: true },
          },
        },
      });

      // Actualizar estadísticas del proveedor si es un proveedor de mantenimiento
      if (ratingData.contextType === 'MAINTENANCE' && toUser.role === 'MAINTENANCE') {
        try {
          const maintenanceProvider = await db.maintenanceProvider.findUnique({
            where: { userId: ratingData.toUserId },
            select: { id: true, rating: true, totalRatings: true },
          });

          if (maintenanceProvider) {
            // Calcular nuevo promedio
            const currentTotal =
              (maintenanceProvider.rating || 0) * (maintenanceProvider.totalRatings || 0);
            const newTotal = currentTotal + ratingData.overallRating;
            const newCount = (maintenanceProvider.totalRatings || 0) + 1;
            const newAverage = newTotal / newCount;

            await db.maintenanceProvider.update({
              where: { id: maintenanceProvider.id },
              data: {
                rating: newAverage,
                totalRatings: newCount,
              },
            });

            logger.info('Estadísticas de proveedor de mantenimiento actualizadas', {
              providerId: maintenanceProvider.id,
              newRating: newAverage,
              newTotalRatings: newCount,
            });
          }
        } catch (updateError) {
          logger.warn('Error actualizando estadísticas del proveedor', { error: updateError });
        }
      }

      // Enviar notificación al usuario calificado
      try {
        await NotificationService.create({
          userId: ratingData.toUserId,
          type: NotificationType.RUNNER_RATING_UPDATED,
          title: '⭐ Nueva Calificación Recibida',
          message: `Has recibido una calificación de ${ratingData.overallRating} estrellas de ${fromUser.name || 'un usuario'}`,
          link: '/profile/ratings',
          metadata: {
            raterId: ratingData.fromUserId,
            raterName: fromUser.name,
            rating: ratingData.overallRating,
            contextType: ratingData.contextType,
            ratingId: rating.id,
            type: 'rating_received',
          },
        });
      } catch (notificationError) {
        logger.warn('Error sending rating notification', { error: notificationError });
      }

      logger.info('Nueva calificación creada', {
        ratingId: rating.id,
        fromUserId: ratingData.fromUserId,
        toUserId: ratingData.toUserId,
        contextType: ratingData.contextType,
        overallRating: ratingData.overallRating,
      });

      return rating;
    } catch (error) {
      logger.error('Error creando calificación:', {
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  /**
   * Obtener calificaciones de un usuario
   */
  static async getUserRatings(
    userId: string,
    filters?: {
      contextType?: RatingContextType;
      isPublic?: boolean;
      limit?: number;
      offset?: number;
      given?: boolean; // Nuevo filtro: si true, buscar calificaciones dadas por el usuario
    }
  ): Promise<{ ratings: UserRating[]; total: number }> {
    try {
      // Si given=true, buscar calificaciones dadas por el usuario (fromUserId)
      // Si given=false o undefined, buscar calificaciones recibidas por el usuario (toUserId)
      const where: any = filters?.given ? { fromUserId: userId } : { toUserId: userId };

      if (filters?.contextType) {
        where.contextType = filters.contextType;
      }

      if (filters?.isPublic !== undefined) {
        where.isPublic = filters.isPublic;
      }

      const [ratings, total] = await Promise.all([
        db.userRating.findMany({
          where,
          include: {
            fromUser: {
              select: { id: true, name: true, avatar: true },
            },
            toUser: {
              select: { id: true, name: true, avatar: true },
            },
            property: {
              select: { id: true, title: true, address: true },
            },
            contract: {
              select: { id: true, contractNumber: true },
            },
          },
          orderBy: { createdAt: 'desc' },
          skip: filters?.offset || 0,
          take: filters?.limit || 10,
        }),
        db.userRating.count({ where }),
      ]);

      return { ratings, total };
    } catch (error) {
      logger.error('Error obteniendo calificaciones del usuario:', {
        error: error instanceof Error ? error.message : String(error),
      });
      throw new DatabaseError('Error obteniendo calificaciones');
    }
  }

  /**
   * Obtener resumen de calificaciones de un usuario
   */
  static async getUserRatingSummary(userId: string): Promise<UserRatingSummary | null> {
    try {
      // Verificar que el usuario existe
      const user = await db.user.findUnique({
        where: { id: userId },
        select: { id: true, name: true },
      });

      if (!user) {
        return null;
      }

      // Obtener todas las calificaciones públicas del usuario
      const ratings = await db.userRating.findMany({
        where: {
          toUserId: userId,
          isPublic: true,
        },
        select: {
          overallRating: true,
          communicationRating: true,
          reliabilityRating: true,
          professionalismRating: true,
          qualityRating: true,
          punctualityRating: true,
          positiveFeedback: true,
          improvementAreas: true,
          isVerified: true,
        },
      });

      if (ratings.length === 0) {
        return {
          userId,
          userName: user.name,
          totalRatings: 0,
          averageRating: 0,
          ratingDistribution: {},
          commonPositiveFeedback: [],
          commonImprovementAreas: [],
          responseRate: 0,
          verifiedRatingsPercentage: 0,
          overallRanking: 0,
          categoryRankings: {},
        };
      }

      // Calcular estadísticas
      const totalRatings = ratings.length;
      const averageRating = ratings.reduce((sum, r) => sum + r.overallRating, 0) / totalRatings;

      // Distribución de calificaciones
      const ratingDistribution: { [key: number]: number } = {};
      for (let i = 1; i <= 5; i++) {
        ratingDistribution[i] = ratings.filter(r => r.overallRating === i).length;
      }

      // Promedios por categoría
      const averageCommunication = this.calculateAverage(
        ratings.map(r => r.communicationRating).filter(Boolean)
      );
      const averageReliability = this.calculateAverage(
        ratings.map(r => r.reliabilityRating).filter(Boolean)
      );
      const averageProfessionalism = this.calculateAverage(
        ratings.map(r => r.professionalismRating).filter(Boolean)
      );
      const averageQuality = this.calculateAverage(
        ratings.map(r => r.qualityRating).filter(Boolean)
      );
      const averagePunctuality = this.calculateAverage(
        ratings.map(r => r.punctualityRating).filter(Boolean)
      );

      // Análisis de feedback
      const allPositiveFeedback = ratings.flatMap(r => r.positiveFeedback);
      const allImprovementAreas = ratings.flatMap(r => r.improvementAreas);

      const commonPositiveFeedback = this.getMostCommonItems(allPositiveFeedback, 5);
      const commonImprovementAreas = this.getMostCommonItems(allImprovementAreas, 5);

      // Métricas de calidad
      const verifiedRatingsCount = ratings.filter(r => r.isVerified).length;
      const verifiedRatingsPercentage = (verifiedRatingsCount / totalRatings) * 100;

      // Calcular ranking general (esto sería más complejo en producción)
      const overallRanking = Math.floor(Math.random() * 100) + 1; // Mock para demo

      return {
        userId,
        userName: user.name,
        totalRatings,
        averageRating: Math.round(averageRating * 10) / 10,
        ratingDistribution,
        averageCommunication,
        averageReliability,
        averageProfessionalism,
        averageQuality,
        averagePunctuality,
        commonPositiveFeedback,
        commonImprovementAreas,
        responseRate: 85 + Math.random() * 15, // Mock
        verifiedRatingsPercentage: Math.round(verifiedRatingsPercentage),
        overallRanking,
        categoryRankings: {
          ...(averageCommunication && { communication: Math.floor(Math.random() * 100) + 1 }),
          ...(averageReliability && { reliability: Math.floor(Math.random() * 100) + 1 }),
          ...(averageProfessionalism && { professionalism: Math.floor(Math.random() * 100) + 1 }),
          ...(averageQuality && { quality: Math.floor(Math.random() * 100) + 1 }),
          ...(averagePunctuality && { punctuality: Math.floor(Math.random() * 100) + 1 }),
        },
      };
    } catch (error) {
      logger.error('Error obteniendo resumen de calificaciones:', {
        error: error instanceof Error ? error.message : String(error),
      });
      throw new DatabaseError('Error obteniendo resumen de calificaciones');
    }
  }

  /**
   * Actualizar una calificación
   */
  static async updateRating(
    ratingId: string,
    userId: string,
    updateData: Partial<UserRatingData>
  ): Promise<UserRating> {
    try {
      // Verificar que la calificación existe y pertenece al usuario
      const existingRating = await db.userRating.findUnique({
        where: { id: ratingId },
        select: { fromUserId: true, id: true },
      });

      if (!existingRating || existingRating.fromUserId !== userId) {
        throw new ValidationError('Calificación no encontrada o no tienes permisos para editarla');
      }

      // Actualizar la calificación
      const updatePayload: any = {};

      if (updateData.overallRating !== undefined) {
        updatePayload.overallRating = updateData.overallRating;
      }
      if (updateData.communicationRating !== undefined) {
        updatePayload.communicationRating = updateData.communicationRating;
      }
      if (updateData.reliabilityRating !== undefined) {
        updatePayload.reliabilityRating = updateData.reliabilityRating;
      }
      if (updateData.professionalismRating !== undefined) {
        updatePayload.professionalismRating = updateData.professionalismRating;
      }
      if (updateData.qualityRating !== undefined) {
        updatePayload.qualityRating = updateData.qualityRating;
      }
      if (updateData.punctualityRating !== undefined) {
        updatePayload.punctualityRating = updateData.punctualityRating;
      }
      if (updateData.comment !== undefined) {
        updatePayload.comment = updateData.comment;
      }
      if (updateData.positiveFeedback !== undefined) {
        updatePayload.positiveFeedback = updateData.positiveFeedback;
      }
      if (updateData.improvementAreas !== undefined) {
        updatePayload.improvementAreas = updateData.improvementAreas;
      }
      if (updateData.isAnonymous !== undefined) {
        updatePayload.isAnonymous = updateData.isAnonymous;
      }
      if (updateData.isPublic !== undefined) {
        updatePayload.isPublic = updateData.isPublic;
      }

      const updatedRating = await db.userRating.update({
        where: { id: ratingId },
        data: updatePayload,
        include: {
          fromUser: {
            select: { id: true, name: true, avatar: true },
          },
          toUser: {
            select: { id: true, name: true, avatar: true },
          },
          property: {
            select: { id: true, title: true, address: true },
          },
          contract: {
            select: { id: true, contractNumber: true },
          },
        },
      });

      logger.info('Calificación actualizada', {
        ratingId,
        userId,
        overallRating: updateData.overallRating,
      });

      return updatedRating;
    } catch (error) {
      logger.error('Error actualizando calificación:', {
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  /**
   * Eliminar una calificación
   */
  static async deleteRating(ratingId: string, userId: string): Promise<void> {
    try {
      // Verificar que la calificación existe y pertenece al usuario
      const existingRating = await db.userRating.findUnique({
        where: { id: ratingId },
        select: { fromUserId: true, id: true },
      });

      if (!existingRating || existingRating.fromUserId !== userId) {
        throw new ValidationError(
          'Calificación no encontrada o no tienes permisos para eliminarla'
        );
      }

      await db.userRating.delete({
        where: { id: ratingId },
      });

      logger.info('Calificación eliminada', { ratingId, userId });
    } catch (error) {
      logger.error('Error eliminando calificación:', {
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  // Métodos auxiliares

  private static calculateAverage(values: (number | null | undefined)[]): number | undefined {
    const validValues = values.filter((v): v is number => v !== null && v !== undefined);
    if (validValues.length === 0) {
      return undefined;
    }
    return Math.round((validValues.reduce((sum, v) => sum + v, 0) / validValues.length) * 10) / 10;
  }

  private static getMostCommonItems(items: string[], limit: number): string[] {
    const frequency: { [key: string]: number } = {};
    items.forEach(item => {
      if (item && item.trim()) {
        frequency[item] = (frequency[item] || 0) + 1;
      }
    });

    return Object.entries(frequency)
      .sort(([, a], [, b]) => b - a)
      .slice(0, limit)
      .map(([item]) => item);
  }
}

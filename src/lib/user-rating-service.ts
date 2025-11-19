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
  response?: string | null;
  responseDate?: Date | null;
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

      // Actualizar estadísticas según el rol del usuario calificado
      await this.updateRoleStatistics(
        ratingData.toUserId,
        toUser.role,
        ratingData.contextType,
        ratingData.overallRating
      );

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
      minRating?: number; // Filtro: calificación mínima (1-5)
      maxRating?: number; // Filtro: calificación máxima (1-5)
      startDate?: Date; // Filtro: fecha de inicio
      endDate?: Date; // Filtro: fecha de fin
      hasResponse?: boolean; // Filtro: solo calificaciones con/sin respuesta
      hasComment?: boolean; // Filtro: solo calificaciones con/sin comentario
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

      // Filtros avanzados
      if (filters?.minRating !== undefined) {
        where.overallRating = { ...where.overallRating, gte: filters.minRating };
      }

      if (filters?.maxRating !== undefined) {
        where.overallRating = { ...where.overallRating, lte: filters.maxRating };
      }

      if (filters?.startDate || filters?.endDate) {
        where.createdAt = {};
        if (filters.startDate) {
          where.createdAt.gte = filters.startDate;
        }
        if (filters.endDate) {
          where.createdAt.lte = filters.endDate;
        }
      }

      if (filters?.hasResponse !== undefined) {
        if (filters.hasResponse) {
          where.response = { not: null };
        } else {
          where.response = null;
        }
      }

      if (filters?.hasComment !== undefined) {
        if (filters.hasComment) {
          where.comment = { not: null };
        } else {
          where.comment = null;
        }
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

  /**
   * Actualizar estadísticas según el rol del usuario calificado
   */
  private static async updateRoleStatistics(
    userId: string,
    userRole: string,
    contextType: RatingContextType,
    overallRating: number
  ): Promise<void> {
    try {
      // Actualizar estadísticas de proveedor de mantenimiento
      if (contextType === 'MAINTENANCE' && userRole === 'MAINTENANCE') {
        const maintenanceProvider = await db.maintenanceProvider.findUnique({
          where: { userId },
          select: { id: true, rating: true, totalRatings: true },
        });

        if (maintenanceProvider) {
          const currentTotal =
            (maintenanceProvider.rating || 0) * (maintenanceProvider.totalRatings || 0);
          const newTotal = currentTotal + overallRating;
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
      }

      // Actualizar estadísticas de proveedor de servicios (futuro)
      if (contextType === 'SERVICE' && userRole === 'PROVIDER') {
        const serviceProvider = await db.serviceProvider.findUnique({
          where: { userId },
          select: { id: true, rating: true, totalRatings: true },
        });

        if (serviceProvider) {
          const currentTotal = (serviceProvider.rating || 0) * (serviceProvider.totalRatings || 0);
          const newTotal = currentTotal + overallRating;
          const newCount = (serviceProvider.totalRatings || 0) + 1;
          const newAverage = newTotal / newCount;

          await db.serviceProvider.update({
            where: { id: serviceProvider.id },
            data: {
              rating: newAverage,
              totalRatings: newCount,
            },
          });

          logger.info('Estadísticas de proveedor de servicios actualizadas', {
            providerId: serviceProvider.id,
            newRating: newAverage,
            newTotalRatings: newCount,
          });
        }
      }

      // Para runners, las estadísticas se calculan dinámicamente desde UserRating
      // No necesitamos actualizar una tabla separada
    } catch (updateError) {
      logger.warn('Error actualizando estadísticas del rol', {
        error: updateError,
        userId,
        userRole,
        contextType,
      });
    }
  }

  /**
   * Crear calificación de runner (migrado desde RunnerRatingService)
   * Este método mantiene compatibilidad con el sistema anterior
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
  }): Promise<UserRating> {
    try {
      // Validar que la visita existe y pertenece al runner
      const visit = await db.visit.findUnique({
        where: { id: ratingData.visitId },
        include: {
          runner: { select: { id: true } },
          property: { select: { id: true } },
        },
      });

      if (!visit) {
        throw new BusinessLogicError('Visita no encontrada');
      }

      if (visit.runnerId !== ratingData.runnerId) {
        throw new BusinessLogicError('La visita no pertenece al runner especificado');
      }

      // Verificar que la visita esté completada
      const visitStatus = (visit.status || '').toString().toUpperCase();
      if (visitStatus !== 'COMPLETED') {
        throw new BusinessLogicError(
          `Solo se pueden calificar visitas completadas. Estado actual: ${visit.status}`
        );
      }

      // Validar rangos de calificación
      const ratings = [
        ratingData.overallRating,
        ratingData.punctualityRating,
        ratingData.professionalismRating,
        ratingData.communicationRating,
        ratingData.propertyKnowledgeRating,
      ];

      for (const rating of ratings) {
        if (rating < 1 || rating > 5) {
          throw new ValidationError('Las calificaciones deben estar entre 1 y 5');
        }
      }

      // Crear calificación usando el sistema unificado
      // Mapear propertyKnowledgeRating a qualityRating para compatibilidad
      const ratingPayload: UserRatingData = {
        fromUserId: ratingData.clientId,
        toUserId: ratingData.runnerId,
        contextType: 'PROPERTY_VISIT',
        contextId: ratingData.visitId,
        overallRating: ratingData.overallRating,
        punctualityRating: ratingData.punctualityRating,
        professionalismRating: ratingData.professionalismRating,
        communicationRating: ratingData.communicationRating,
        qualityRating: ratingData.propertyKnowledgeRating, // Mapeo de campo
        positiveFeedback: ratingData.positiveFeedback || [],
        improvementAreas: ratingData.improvementAreas || [],
        isAnonymous: ratingData.isAnonymous || false,
        isPublic: true,
      };

      // Solo agregar campos opcionales si tienen valor
      if (ratingData.comment) {
        ratingPayload.comment = ratingData.comment;
      }
      if (visit.propertyId) {
        ratingPayload.propertyId = visit.propertyId;
      }

      const unifiedRating = await this.createRating(ratingPayload);

      logger.info('Calificación de runner creada (sistema unificado)', {
        ratingId: unifiedRating.id,
        runnerId: ratingData.runnerId,
        visitId: ratingData.visitId,
        overallRating: ratingData.overallRating,
      });

      return unifiedRating;
    } catch (error) {
      logger.error('Error creando calificación de runner:', {
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  /**
   * Obtener resumen de calificaciones de runner (compatibilidad)
   */
  static async getRunnerRatingSummary(
    runnerId: string,
    periodStart?: Date,
    periodEnd?: Date
  ): Promise<{
    runnerId: string;
    runnerName: string;
    totalRatings: number;
    averageRating: number;
    ratingDistribution: { [key: number]: number };
    averagePunctuality: number;
    averageProfessionalism: number;
    averageCommunication: number;
    averagePropertyKnowledge: number;
    ratingTrend: 'improving' | 'declining' | 'stable';
    last30DaysAverage: number;
    previous30DaysAverage: number;
    commonPositiveFeedback: string[];
    commonImprovementAreas: string[];
    responseRate: number;
    verifiedRatingsPercentage: number;
    currentRanking: number;
    bestCategory: string;
    worstCategory: string;
  }> {
    try {
      const runner = await db.user.findUnique({
        where: { id: runnerId },
        select: { id: true, name: true },
      });

      if (!runner) {
        throw new BusinessLogicError('Runner no encontrado');
      }

      const endDate = periodEnd || new Date();
      const startDate = periodStart || new Date(endDate.getTime() - 90 * 24 * 60 * 60 * 1000);

      // Obtener calificaciones del runner con contexto PROPERTY_VISIT
      const ratings = await db.userRating.findMany({
        where: {
          toUserId: runnerId,
          contextType: 'PROPERTY_VISIT',
          createdAt: {
            gte: startDate,
            lte: endDate,
          },
        },
        orderBy: { createdAt: 'desc' },
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
          worstCategory: '',
        };
      }

      // Calcular estadísticas
      const totalRatings = ratings.length;
      const averageRating = ratings.reduce((sum, r) => sum + r.overallRating, 0) / totalRatings;

      // Distribución
      const ratingDistribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
      ratings.forEach(rating => {
        ratingDistribution[rating.overallRating as keyof typeof ratingDistribution]++;
      });

      // Promedios por categoría (mapear qualityRating a propertyKnowledge)
      const averagePunctuality = this.calculateAverage(ratings.map(r => r.punctualityRating)) || 0;
      const averageProfessionalism =
        this.calculateAverage(ratings.map(r => r.professionalismRating)) || 0;
      const averageCommunication =
        this.calculateAverage(ratings.map(r => r.communicationRating)) || 0;
      const averagePropertyKnowledge =
        this.calculateAverage(
          ratings.map(r => r.qualityRating) // Mapeo inverso
        ) || 0;

      // Tendencias
      const last30Days = new Date(endDate.getTime() - 30 * 24 * 60 * 60 * 1000);
      const previous30Days = new Date(last30Days.getTime() - 30 * 24 * 60 * 60 * 1000);

      const last30DaysRatings = ratings.filter(r => r.createdAt >= last30Days);
      const previous30DaysRatings = ratings.filter(
        r => r.createdAt >= previous30Days && r.createdAt < last30Days
      );

      const last30DaysAverage =
        last30DaysRatings.length > 0
          ? last30DaysRatings.reduce((sum, r) => sum + r.overallRating, 0) /
            last30DaysRatings.length
          : 0;

      const previous30DaysAverage =
        previous30DaysRatings.length > 0
          ? previous30DaysRatings.reduce((sum, r) => sum + r.overallRating, 0) /
            previous30DaysRatings.length
          : 0;

      const ratingTrend =
        last30DaysAverage > previous30DaysAverage + 0.1
          ? 'improving'
          : last30DaysAverage < previous30DaysAverage - 0.1
            ? 'declining'
            : 'stable';

      // Análisis de feedback
      const allPositiveFeedback = ratings.flatMap(r => r.positiveFeedback || []);
      const allImprovementAreas = ratings.flatMap(r => r.improvementAreas || []);

      const commonPositiveFeedback = this.getMostCommonItems(allPositiveFeedback, 3);
      const commonImprovementAreas = this.getMostCommonItems(allImprovementAreas, 3);

      // Tasa de respuesta
      const totalVisits = await db.visit.count({
        where: {
          runnerId: runnerId,
          status: 'completed',
          createdAt: {
            gte: startDate,
            lte: endDate,
          },
        },
      });

      const responseRate = totalVisits > 0 ? (totalRatings / totalVisits) * 100 : 0;

      // Porcentaje de calificaciones verificadas
      const verifiedRatings = ratings.filter(r => r.isVerified).length;
      const verifiedRatingsPercentage =
        totalRatings > 0 ? (verifiedRatings / totalRatings) * 100 : 0;

      // Categorías
      const categoryAverages = {
        punctuality: averagePunctuality,
        professionalism: averageProfessionalism,
        communication: averageCommunication,
        propertyKnowledge: averagePropertyKnowledge,
      };

      const sortedCategories = Object.entries(categoryAverages).sort(([, a], [, b]) => b - a);
      const bestCategory = sortedCategories.length > 0 ? sortedCategories[0]![0] : '';
      const worstCategory =
        sortedCategories.length > 0 ? sortedCategories[sortedCategories.length - 1]![0] : '';

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
        currentRanking: 0, // Se calcularía comparando con otros runners
        bestCategory,
        worstCategory,
      };
    } catch (error) {
      logger.error('Error obteniendo resumen de calificaciones de runner:', {
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  /**
   * Validar si un usuario puede calificar un contexto específico
   */
  static async canRateContext(
    fromUserId: string,
    toUserId: string,
    contextType: RatingContextType,
    contextId: string
  ): Promise<{ canRate: boolean; reason?: string }> {
    try {
      // Validar que no se califique a sí mismo
      if (fromUserId === toUserId) {
        return { canRate: false, reason: 'No puedes calificarte a ti mismo' };
      }

      // Validar que no exista una calificación previa
      const existingRating = await db.userRating.findUnique({
        where: {
          fromUserId_toUserId_contextType_contextId: {
            fromUserId,
            toUserId,
            contextType,
            contextId,
          },
        },
      });

      if (existingRating) {
        return { canRate: false, reason: 'Ya has calificado este contexto anteriormente' };
      }

      // Validaciones específicas por contexto
      if (contextType === 'PROPERTY_VISIT') {
        const visit = await db.visit.findUnique({
          where: { id: contextId },
          include: {
            runner: { select: { id: true } },
            property: { select: { ownerId: true } },
          },
        });

        if (!visit) {
          return { canRate: false, reason: 'Visita no encontrada' };
        }

        // Solo el tenant, owner o broker pueden calificar al runner
        const isTenant = visit.tenantId === fromUserId;
        const isOwner = visit.property?.ownerId === fromUserId;
        // Verificar si es broker (necesitaría relación adicional)

        if (!isTenant && !isOwner && visit.runnerId !== fromUserId) {
          // Si es el runner, puede calificar al owner
          if (visit.runnerId === fromUserId && visit.property?.ownerId === toUserId) {
            return { canRate: true };
          }
          return { canRate: false, reason: 'No tienes permiso para calificar esta visita' };
        }

        // Verificar que la visita esté completada
        if (visit.status?.toUpperCase() !== 'COMPLETED') {
          return {
            canRate: false,
            reason: `Solo se pueden calificar visitas completadas. Estado actual: ${visit.status}`,
          };
        }
      }

      return { canRate: true };
    } catch (error) {
      logger.error('Error validando si se puede calificar:', {
        error: error instanceof Error ? error.message : String(error),
      });
      return { canRate: false, reason: 'Error al validar permisos' };
    }
  }

  /**
   * Calcular ranking global de runners basado en calificaciones
   */
  static async calculateRunnerRanking(limit: number = 50): Promise<
    {
      runnerId: string;
      runnerName: string;
      averageRating: number;
      totalRatings: number;
      rankingScore: number;
      position: number;
    }[]
  > {
    try {
      // Obtener todos los runners con calificaciones
      const runnerRatings = await db.userRating.groupBy({
        by: ['toUserId'],
        where: {
          contextType: 'PROPERTY_VISIT',
          toUser: {
            role: 'RUNNER',
          },
        },
        _count: {
          id: true,
        },
        _avg: {
          overallRating: true,
          punctualityRating: true,
          professionalismRating: true,
          communicationRating: true,
          qualityRating: true,
        },
        having: {
          id: {
            _count: {
              gt: 4, // Solo runners con al menos 5 calificaciones
            },
          },
        },
      });

      // Enriquecer con nombres de runners
      const ranking = [];

      for (const stat of runnerRatings) {
        const runner = await db.user.findUnique({
          where: { id: stat.toUserId },
          select: {
            id: true,
            name: true,
          },
        });

        if (runner) {
          // Calcular score ponderado
          const avg = stat._avg;
          const score =
            (avg.overallRating || 0) * 0.4 +
            (avg.punctualityRating || 0) * 0.25 +
            (avg.professionalismRating || 0) * 0.2 +
            (avg.communicationRating || 0) * 0.1 +
            (avg.qualityRating || 0) * 0.05; // qualityRating mapea a propertyKnowledge

          ranking.push({
            runnerId: stat.toUserId,
            runnerName: runner.name || 'Runner',
            averageRating: avg.overallRating || 0,
            totalRatings: stat._count.id,
            rankingScore: score,
            position: 0, // Se asignará después de ordenar
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
      logger.error('Error calculando ranking de runners:', {
        error: error instanceof Error ? error.message : String(error),
      });
      return [];
    }
  }
}

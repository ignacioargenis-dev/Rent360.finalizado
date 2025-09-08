import { logger } from '@/lib/logger';

/**
 * Tipos de rating disponibles
 */
export enum RatingType {
  OVERALL = 'overall',
  PUNCTUALITY = 'punctuality',
  PROFESSIONALISM = 'professionalism',
  COMMUNICATION = 'communication',
  PROPERTY_KNOWLEDGE = 'property_knowledge',
  CLEANLINESS = 'cleanliness',
  QUALITY_OF_WORK = 'quality_of_work'
}

/**
 * Estructura de un rating individual
 */
export interface ProviderRating {
  id: string;
  providerId: string;
  providerType: 'MAINTENANCE' | 'SERVICE';
  clientId: string;
  jobId: string;
  ratings: Record<RatingType, number>; // 1-5 estrellas
  comments?: string;
  isAnonymous: boolean;
  createdAt: Date;
  updatedAt?: Date;
  isVerified: boolean; // Solo después de completar el trabajo
}

/**
 * Resumen de ratings de un proveedor
 */
export interface ProviderRatingSummary {
  providerId: string;
  totalRatings: number;
  averageRatings: Record<RatingType, number>;
  overallAverage: number;
  ratingDistribution: Record<RatingType, { 1: number; 2: number; 3: number; 4: number; 5: number }>;
  recentRatings: ProviderRating[];
  lastUpdated: Date;
  trustScore: number; // 0-100 basado en varios factores
}

/**
 * Criterios de evaluación para ratings automáticos
 */
export interface RatingCriteria {
  onTimeDelivery: boolean;
  professionalAttitude: boolean;
  workQuality: boolean;
  communicationQuality: boolean;
  completionOnTime: boolean;
  followUpProvided: boolean;
}

/**
 * Servicio de ratings y reseñas para proveedores
 */
export class RatingService {
  private static instance: RatingService;
  private ratings: Map<string, ProviderRating[]> = new Map();
  private summaries: Map<string, ProviderRatingSummary> = new Map();

  private constructor() {}

  static getInstance(): RatingService {
    if (!RatingService.instance) {
      RatingService.instance = new RatingService();
    }
    return RatingService.instance;
  }

  /**
   * Crea un nuevo rating para un proveedor
   */
  async createRating(rating: Omit<ProviderRating, 'id' | 'createdAt'>): Promise<ProviderRating> {
    try {
      // Verificar que el cliente puede calificar este trabajo
      const canRate = await this.canRateProvider(rating.clientId, rating.jobId);
      if (!canRate) {
        throw new Error('No tienes permiso para calificar este trabajo');
      }

      const newRating: ProviderRating = {
        ...rating,
        id: this.generateRatingId(),
        createdAt: new Date(),
        isVerified: true // Asumimos verificación por ahora
      };

      // Guardar el rating
      if (!this.ratings.has(rating.providerId)) {
        this.ratings.set(rating.providerId, []);
      }
      this.ratings.get(rating.providerId)!.push(newRating);

      // Actualizar resumen del proveedor
      await this.updateProviderSummary(rating.providerId);

      logger.info('Rating creado exitosamente:', {
        providerId: rating.providerId,
        clientId: rating.clientId,
        jobId: rating.jobId,
        overallRating: rating.ratings.overall
      });

      return newRating;
    } catch (error) {
      logger.error('Error creando rating:', error);
      throw error;
    }
  }

  /**
   * Genera ratings automáticos basados en criterios objetivos
   */
  async createAutomaticRating(
    providerId: string,
    jobId: string,
    clientId: string,
    criteria: RatingCriteria
  ): Promise<ProviderRating> {
    const automaticRatings: Record<RatingType, number> = {
      [RatingType.OVERALL]: this.calculateOverallRating(criteria),
      [RatingType.PUNCTUALITY]: criteria.onTimeDelivery ? 5 : criteria.completionOnTime ? 4 : 2,
      [RatingType.PROFESSIONALISM]: criteria.professionalAttitude ? 5 : 4,
      [RatingType.COMMUNICATION]: criteria.communicationQuality ? 5 : 3,
      [RatingType.PROPERTY_KNOWLEDGE]: 4, // Asumimos conocimiento básico
      [RatingType.CLEANLINESS]: criteria.workQuality ? 5 : 4,
      [RatingType.QUALITY_OF_WORK]: criteria.workQuality ? 5 : 3
    };

    const comments = this.generateAutomaticComments(criteria);

    return this.createRating({
      providerId,
      providerType: 'MAINTENANCE', // Por ahora asumimos mantenimiento
      clientId,
      jobId,
      ratings: automaticRatings,
      comments,
      isAnonymous: true,
      isVerified: true
    });
  }

  /**
   * Calcula rating general basado en criterios
   */
  private calculateOverallRating(criteria: RatingCriteria): number {
    const scores = [
      criteria.onTimeDelivery ? 5 : 3,
      criteria.professionalAttitude ? 5 : 4,
      criteria.workQuality ? 5 : 3,
      criteria.communicationQuality ? 5 : 4,
      criteria.completionOnTime ? 5 : 2,
      criteria.followUpProvided ? 5 : 3
    ];

    const average = scores.reduce((sum, score) => sum + score, 0) / scores.length;
    return Math.round(average);
  }

  /**
   * Genera comentarios automáticos basados en criterios
   */
  private generateAutomaticComments(criteria: RatingCriteria): string {
    const comments: string[] = [];

    if (criteria.onTimeDelivery && criteria.completionOnTime) {
      comments.push('Trabajo completado a tiempo');
    }

    if (criteria.professionalAttitude) {
      comments.push('Actitud profesional excelente');
    }

    if (criteria.workQuality) {
      comments.push('Calidad del trabajo sobresaliente');
    }

    if (criteria.communicationQuality) {
      comments.push('Excelente comunicación durante el proceso');
    }

    if (criteria.followUpProvided) {
      comments.push('Seguimiento post-servicio adecuado');
    }

    return comments.length > 0 ? comments.join('. ') : 'Servicio completado satisfactoriamente';
  }

  /**
   * Verifica si un cliente puede calificar un trabajo específico
   */
  async canRateProvider(clientId: string, jobId: string): Promise<boolean> {
    // En una implementación real, verificaríamos:
    // 1. Que el cliente contrató el servicio
    // 2. Que el trabajo está completado
    // 3. Que no ha calificado antes
    // 4. Que está dentro del período de calificación (ej: 30 días)

    // Por ahora, retornamos true para desarrollo
    return true;
  }

  /**
   * Obtiene el resumen de ratings de un proveedor
   */
  async getProviderSummary(providerId: string): Promise<ProviderRatingSummary | null> {
    return this.summaries.get(providerId) || null;
  }

  /**
   * Obtiene todos los ratings de un proveedor
   */
  async getProviderRatings(providerId: string, limit: number = 50): Promise<ProviderRating[]> {
    const providerRatings = this.ratings.get(providerId) || [];
    return providerRatings
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, limit);
  }

  /**
   * Actualiza el resumen de ratings de un proveedor
   */
  private async updateProviderSummary(providerId: string): Promise<void> {
    const ratings = this.ratings.get(providerId) || [];

    if (ratings.length === 0) {
      this.summaries.delete(providerId);
      return;
    }

    const summary: ProviderRatingSummary = {
      providerId,
      totalRatings: ratings.length,
      averageRatings: {} as Record<RatingType, number>,
      overallAverage: 0,
      ratingDistribution: {} as Record<RatingType, { 1: number; 2: number; 3: number; 4: number; 5: number }>,
      recentRatings: ratings.slice(0, 10),
      lastUpdated: new Date(),
      trustScore: this.calculateTrustScore(ratings)
    };

    // Calcular promedios por tipo de rating
    const ratingTypes = Object.values(RatingType);
    ratingTypes.forEach(type => {
      const typeRatings = ratings.map(r => r.ratings[type]).filter(r => r !== undefined);
      summary.averageRatings[type] = typeRatings.length > 0
        ? typeRatings.reduce((sum, rating) => sum + rating, 0) / typeRatings.length
        : 0;

      // Distribución de ratings
      summary.ratingDistribution[type] = {
        1: typeRatings.filter(r => r === 1).length,
        2: typeRatings.filter(r => r === 2).length,
        3: typeRatings.filter(r => r === 3).length,
        4: typeRatings.filter(r => r === 4).length,
        5: typeRatings.filter(r => r === 5).length
      };
    });

    // Rating general
    summary.overallAverage = summary.averageRatings[RatingType.OVERALL] || 0;

    this.summaries.set(providerId, summary);

    logger.info('Resumen de ratings actualizado:', {
      providerId,
      totalRatings: summary.totalRatings,
      overallAverage: summary.overallAverage,
      trustScore: summary.trustScore
    });
  }

  /**
   * Calcula el trust score basado en múltiples factores
   */
  private calculateTrustScore(ratings: ProviderRating[]): number {
    if (ratings.length === 0) return 0;

    const summary = this.summaries.get(ratings[0].providerId);
    if (!summary) return 0;

    // Factores que influyen en el trust score:
    // 1. Rating promedio (40%)
    // 2. Número de ratings (20%)
    // 3. Consistencia en ratings altos (20%)
    // 4. Ratings recientes (10%)
    // 5. Variedad de aspectos calificados (10%)

    const avgRating = summary.overallAverage;
    const ratingCount = ratings.length;
    const recentRatings = ratings.slice(0, 10);

    // 1. Rating promedio (normalizado a 0-40)
    const ratingScore = (avgRating / 5) * 40;

    // 2. Número de ratings (más ratings = más confianza, hasta cierto punto)
    const countScore = Math.min(ratingCount * 2, 20);

    // 3. Consistencia (coeficiente de variación inverso)
    const recentAvg = recentRatings.reduce((sum, r) => sum + r.ratings.overall, 0) / recentRatings.length;
    const variance = recentRatings.reduce((sum, r) => sum + Math.pow(r.ratings.overall - recentAvg, 2), 0) / recentRatings.length;
    const consistencyScore = Math.max(0, 20 - Math.sqrt(variance) * 4);

    // 4. Ratings recientes positivos
    const recentPositive = recentRatings.filter(r => r.ratings.overall >= 4).length / recentRatings.length;
    const recentScore = recentPositive * 10;

    // 5. Variedad de aspectos calificados
    const aspectsRated = Object.values(RatingType).filter(type =>
      ratings.some(r => r.ratings[type] !== undefined)
    ).length;
    const varietyScore = (aspectsRated / Object.values(RatingType).length) * 10;

    const totalScore = ratingScore + countScore + consistencyScore + recentScore + varietyScore;

    return Math.min(100, Math.round(totalScore));
  }

  /**
   * Obtiene el top de proveedores por rating
   */
  async getTopRatedProviders(limit: number = 10): Promise<Array<{
    providerId: string;
    summary: ProviderRatingSummary;
  }>> {
    const allSummaries = Array.from(this.summaries.entries())
      .map(([providerId, summary]) => ({ providerId, summary }))
      .filter(item => item.summary.totalRatings >= 5) // Mínimo 5 ratings
      .sort((a, b) => {
        // Ordenar por trust score primero, luego por rating promedio
        if (a.summary.trustScore !== b.summary.trustScore) {
          return b.summary.trustScore - a.summary.trustScore;
        }
        return b.summary.overallAverage - a.summary.overallAverage;
      });

    return allSummaries.slice(0, limit);
  }

  /**
   * Genera ID único para ratings
   */
  private generateRatingId(): string {
    return `rating_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Reporta rating inapropiado
   */
  async reportRating(ratingId: string, reason: string, reportedBy: string): Promise<void> {
    logger.warn('Rating reportado:', {
      ratingId,
      reason,
      reportedBy
    });

    // En una implementación real, esto guardaría el reporte para revisión
  }

  /**
   * Obtiene estadísticas generales del sistema de ratings
   */
  async getSystemStats(): Promise<{
    totalRatings: number;
    totalProviders: number;
    averageRating: number;
    topCategories: Array<{ category: string; averageRating: number; count: number }>;
  }> {
    const allRatings: ProviderRating[] = [];
    this.ratings.forEach(ratings => allRatings.push(...ratings));

    const totalRatings = allRatings.length;
    const totalProviders = this.ratings.size;
    const averageRating = totalRatings > 0
      ? allRatings.reduce((sum, r) => sum + r.ratings.overall, 0) / totalRatings
      : 0;

    return {
      totalRatings,
      totalProviders,
      averageRating: Math.round(averageRating * 10) / 10,
      topCategories: [] // Por ahora vacío, se implementaría con categorías de servicios
    };
  }
}

/**
 * Instancia global del servicio de ratings
 */
export const ratingService = RatingService.getInstance();

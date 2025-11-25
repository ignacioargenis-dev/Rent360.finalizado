/**
 * Lead Scoring Service
 *
 * Calcula automáticamente el lead score (0-100) y probabilidad de conversión
 * para prospects basándose en múltiples factores y actividades.
 */

import { db } from './db';
import { logger } from './logger-minimal';

export interface LeadScoreFactors {
  // Factores demográficos (0-20 puntos)
  hasCompleteInfo: number; // Tiene todos los datos requeridos
  hasRUT: number; // RUT verificado

  // Factores de engagement (0-40 puntos)
  activityLevel: number; // Frecuencia de interacciones
  propertiesViewed: number; // Cuántas propiedades vio
  responseTime: number; // Qué tan rápido responde
  emailOpens: number; // Abre emails compartidos

  // Factores de intención (0-30 puntos)
  budget: number; // Tiene presupuesto definido
  preferredLocations: number; // Tiene ubicaciones definidas
  timeToDecision: number; // Urgencia en tomar decisión

  // Factores de confianza (0-10 puntos)
  referralSource: number; // Cómo llegó (referido > orgánico > ads)
  brokerInteractions: number; // Interacciones con el broker
}

export class LeadScoringService {
  /**
   * Calcula el lead score completo para un prospect
   */
  static async calculateLeadScore(prospectId: string): Promise<{
    leadScore: number;
    conversionProbability: number;
    factors: LeadScoreFactors;
    recommendations: string[];
  }> {
    try {
      logger.info('Calculando lead score para prospect', { prospectId });

      // Obtener datos del prospect
      const prospect = await db.brokerProspect.findUnique({
        where: { id: prospectId },
        include: {
          activities: {
            orderBy: { createdAt: 'desc' },
            take: 50,
          },
          sharedProperties: {
            include: {
              property: true,
            },
          },
          user: {
            select: {
              rut: true,
              rutVerified: true,
            },
          },
        },
      });

      if (!prospect) {
        throw new Error('Prospect no encontrado');
      }

      // Calcular factores individuales
      const factors: LeadScoreFactors = {
        hasCompleteInfo: this.calculateCompleteInfoScore(prospect),
        hasRUT: this.calculateRUTScore(prospect),
        activityLevel: this.calculateActivityLevelScore(prospect),
        propertiesViewed: this.calculatePropertiesViewedScore(prospect),
        responseTime: this.calculateResponseTimeScore(prospect),
        emailOpens: this.calculateEmailOpensScore(prospect),
        budget: this.calculateBudgetScore(prospect),
        preferredLocations: this.calculatePreferredLocationsScore(prospect),
        timeToDecision: this.calculateTimeToDecisionScore(prospect),
        referralSource: this.calculateReferralSourceScore(prospect),
        brokerInteractions: this.calculateBrokerInteractionsScore(prospect),
      };

      // Calcular score total
      const leadScore = Math.min(
        100,
        Math.round(
          factors.hasCompleteInfo +
            factors.hasRUT +
            factors.activityLevel +
            factors.propertiesViewed +
            factors.responseTime +
            factors.emailOpens +
            factors.budget +
            factors.preferredLocations +
            factors.timeToDecision +
            factors.referralSource +
            factors.brokerInteractions
        )
      );

      // Calcular probabilidad de conversión (0-100%)
      const conversionProbability = this.calculateConversionProbability(
        leadScore,
        prospect,
        factors
      );

      // Generar recomendaciones
      const recommendations = this.generateRecommendations(prospect, factors, leadScore);

      logger.info('Lead score calculado exitosamente', {
        prospectId,
        leadScore,
        conversionProbability,
      });

      return {
        leadScore,
        conversionProbability,
        factors,
        recommendations,
      };
    } catch (error) {
      logger.error('Error calculando lead score', {
        error: error instanceof Error ? error.message : String(error),
        prospectId,
      });
      throw error;
    }
  }

  /**
   * Actualiza el lead score de un prospect en la base de datos
   */
  static async updateProspectScore(prospectId: string): Promise<void> {
    const result = await this.calculateLeadScore(prospectId);

    await db.brokerProspect.update({
      where: { id: prospectId },
      data: {
        leadScore: result.leadScore,
        conversionProbability: result.conversionProbability,
        updatedAt: new Date(),
      },
    });

    logger.info('Lead score actualizado en BD', {
      prospectId,
      leadScore: result.leadScore,
      conversionProbability: result.conversionProbability,
    });
  }

  /**
   * Recalcula scores para todos los prospects activos de un broker
   */
  static async recalculateAllScores(brokerId: string): Promise<number> {
    const prospects = await db.brokerProspect.findMany({
      where: {
        brokerId,
        status: {
          notIn: ['CONVERTED', 'LOST'],
        },
      },
      select: { id: true },
    });

    let updated = 0;
    for (const prospect of prospects) {
      try {
        await this.updateProspectScore(prospect.id);
        updated++;
      } catch (error) {
        logger.error('Error actualizando score de prospect', {
          prospectId: prospect.id,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }

    logger.info('Scores recalculados', { brokerId, totalUpdated: updated });
    return updated;
  }

  // ============================================================================
  // CÁLCULO DE FACTORES INDIVIDUALES
  // ============================================================================

  private static calculateCompleteInfoScore(prospect: any): number {
    let score = 0;
    const maxScore = 10;

    // Información básica (5 puntos)
    if (prospect.name && prospect.email && prospect.phone) {
      score += 5;
    }

    // Información adicional (5 puntos)
    if (prospect.interestedIn && JSON.parse(prospect.interestedIn || '[]').length > 0) {
      score += 2;
    }
    if (prospect.budget) {
      score += 2;
    }
    if (prospect.preferredLocations && JSON.parse(prospect.preferredLocations || '[]').length > 0) {
      score += 1;
    }

    return Math.min(score, maxScore);
  }

  private static calculateRUTScore(prospect: any): number {
    if (prospect.user?.rutVerified) {
      return 10;
    }
    if (prospect.rut) {
      return 5;
    }
    return 0;
  }

  private static calculateActivityLevelScore(prospect: any): number {
    const activities = prospect.activities || [];
    const maxScore = 15;

    if (activities.length === 0) {
      return 0;
    }
    if (activities.length >= 10) {
      return maxScore;
    }

    return Math.min(Math.round((activities.length / 10) * maxScore), maxScore);
  }

  private static calculatePropertiesViewedScore(prospect: any): number {
    const sharedProperties = prospect.sharedProperties || [];
    const maxScore = 10;

    if (sharedProperties.length === 0) {
      return 0;
    }
    if (sharedProperties.length >= 5) {
      return maxScore;
    }

    return Math.min(Math.round((sharedProperties.length / 5) * maxScore), maxScore);
  }

  private static calculateResponseTimeScore(prospect: any): number {
    const activities = prospect.activities || [];
    if (activities.length < 2) {
      return 0;
    }

    // Calcular tiempo promedio entre actividades (más rápido = mejor score)
    const timeDiffs: number[] = [];
    for (let i = 1; i < Math.min(activities.length, 10); i++) {
      const diff =
        new Date(activities[i - 1].createdAt).getTime() -
        new Date(activities[i].createdAt).getTime();
      timeDiffs.push(diff);
    }

    const avgDiff = timeDiffs.reduce((a, b) => a + b, 0) / timeDiffs.length;
    const avgDays = avgDiff / (1000 * 60 * 60 * 24);

    // Menos de 1 día = 10 puntos, más de 7 días = 0 puntos
    if (avgDays <= 1) {
      return 10;
    }
    if (avgDays >= 7) {
      return 0;
    }

    return Math.round(10 - ((avgDays - 1) / 6) * 10);
  }

  private static calculateEmailOpensScore(prospect: any): number {
    const sharedProperties = prospect.sharedProperties || [];
    const viewedProperties = sharedProperties.filter((sp: any) => sp.viewCount > 0);
    const maxScore = 5;

    if (viewedProperties.length === 0) {
      return 0;
    }
    if (viewedProperties.length >= sharedProperties.length) {
      return maxScore;
    }

    const ratio = viewedProperties.length / sharedProperties.length;
    return Math.round(ratio * maxScore);
  }

  private static calculateBudgetScore(prospect: any): number {
    if (!prospect.budget) {
      return 0;
    }

    try {
      const budget =
        typeof prospect.budget === 'string' ? JSON.parse(prospect.budget) : prospect.budget;

      if (budget.min && budget.max) {
        return 10;
      }
      if (budget.min || budget.max) {
        return 5;
      }
    } catch {
      // Si hay error parseando, asumir que no tiene budget
    }

    return 0;
  }

  private static calculatePreferredLocationsScore(prospect: any): number {
    if (!prospect.preferredLocations) {
      return 0;
    }

    try {
      const locations =
        typeof prospect.preferredLocations === 'string'
          ? JSON.parse(prospect.preferredLocations)
          : prospect.preferredLocations;

      if (locations.length === 0) {
        return 0;
      }
      if (locations.length >= 3) {
        return 10;
      }

      return Math.round((locations.length / 3) * 10);
    } catch {
      return 0;
    }
  }

  private static calculateTimeToDecisionScore(prospect: any): number {
    const daysSinceCreated =
      (Date.now() - new Date(prospect.createdAt).getTime()) / (1000 * 60 * 60 * 24);

    // Prospects más recientes con alta actividad = mayor urgencia
    const activities = prospect.activities || [];
    const recentActivities = activities.filter((a: any) => {
      const daysSinceActivity =
        (Date.now() - new Date(a.createdAt).getTime()) / (1000 * 60 * 60 * 24);
      return daysSinceActivity <= 7;
    });

    if (daysSinceCreated <= 7 && recentActivities.length >= 3) {
      return 10;
    }
    if (daysSinceCreated <= 14 && recentActivities.length >= 2) {
      return 7;
    }
    if (daysSinceCreated <= 30 && recentActivities.length >= 1) {
      return 4;
    }

    return 0;
  }

  private static calculateReferralSourceScore(prospect: any): number {
    const source = prospect.source?.toLowerCase() || '';

    // Referidos son los mejores leads
    if (source.includes('referral') || source.includes('referido')) {
      return 10;
    }

    // Leads orgánicos son buenos
    if (source.includes('organic') || source.includes('platform')) {
      return 7;
    }

    // Ads pagados son OK
    if (source.includes('ad') || source.includes('campaign')) {
      return 5;
    }

    // Otros o desconocidos
    return 3;
  }

  private static calculateBrokerInteractionsScore(prospect: any): number {
    const activities = prospect.activities || [];
    const brokerActivities = activities.filter((a: any) =>
      ['call', 'meeting', 'email', 'message'].includes(a.activityType)
    );

    if (brokerActivities.length === 0) {
      return 0;
    }
    if (brokerActivities.length >= 5) {
      return 10;
    }

    return Math.round((brokerActivities.length / 5) * 10);
  }

  // ============================================================================
  // PROBABILIDAD DE CONVERSIÓN
  // ============================================================================

  private static calculateConversionProbability(
    leadScore: number,
    prospect: any,
    factors: LeadScoreFactors
  ): number {
    // Modelo básico de conversión basado en lead score y otros factores

    let probability = leadScore; // Base del lead score

    // Ajustes por estado
    const statusMultipliers: Record<string, number> = {
      NEW: 0.3,
      CONTACTED: 0.5,
      QUALIFIED: 0.7,
      MEETING_SCHEDULED: 0.85,
      PROPOSAL_SENT: 0.9,
      NEGOTIATING: 0.95,
    };

    const statusMultiplier = statusMultipliers[prospect.status] || 0.5;
    probability *= statusMultiplier;

    // Ajuste por prioridad
    const priorityBonus: Record<string, number> = {
      urgent: 10,
      high: 5,
      medium: 0,
      low: -5,
    };

    probability += priorityBonus[prospect.priority] || 0;

    // Ajuste por tipo (owners tienden a convertir mejor)
    if (prospect.prospectType === 'OWNER_LEAD') {
      probability *= 1.1;
    }

    // Normalizar entre 0-100
    return Math.min(100, Math.max(0, Math.round(probability)));
  }

  // ============================================================================
  // RECOMENDACIONES
  // ============================================================================

  private static generateRecommendations(
    prospect: any,
    factors: LeadScoreFactors,
    leadScore: number
  ): string[] {
    const recommendations: string[] = [];

    // Recomendaciones por lead score
    if (leadScore >= 80) {
      recommendations.push('🔥 Lead caliente - Contactar inmediatamente');
      recommendations.push('Programar reunión presencial lo antes posible');
    } else if (leadScore >= 60) {
      recommendations.push('👍 Lead prometedor - Mantener seguimiento activo');
      recommendations.push('Compartir propiedades que coincidan con sus preferencias');
    } else if (leadScore >= 40) {
      recommendations.push('⚠️ Lead tibio - Requiere más calificación');
      recommendations.push('Hacer llamada para entender mejor sus necesidades');
    } else {
      recommendations.push('❄️ Lead frío - Nurturing de largo plazo');
      recommendations.push('Agregar a campaña de email marketing');
    }

    // Recomendaciones específicas por factores bajos
    if (factors.hasCompleteInfo < 5) {
      recommendations.push('📝 Completar información del prospect');
    }

    if (factors.budget < 5) {
      recommendations.push('💰 Definir presupuesto del cliente');
    }

    if (factors.preferredLocations < 5) {
      recommendations.push('📍 Identificar ubicaciones de interés');
    }

    if (factors.propertiesViewed === 0) {
      recommendations.push('🏠 Compartir propiedades relevantes');
    }

    if (factors.brokerInteractions < 5) {
      recommendations.push('📞 Aumentar frecuencia de contacto');
    }

    // Recomendaciones por tiempo sin actividad
    const daysSinceLastContact = prospect.lastContactDate
      ? (Date.now() - new Date(prospect.lastContactDate).getTime()) / (1000 * 60 * 60 * 24)
      : 999;

    if (daysSinceLastContact > 7) {
      recommendations.push('⏰ Hace más de 7 días sin contacto - Seguimiento urgente');
    }

    // Recomendaciones por estado
    if (prospect.status === 'NEGOTIATING') {
      recommendations.push('💼 En negociación - Cerrar el trato pronto');
    }

    if (prospect.status === 'PROPOSAL_SENT') {
      recommendations.push('📄 Propuesta enviada - Hacer seguimiento de respuesta');
    }

    return recommendations.slice(0, 5); // Máximo 5 recomendaciones
  }
}

/**
 * SERVICIO DE FEEDBACK PARA CHATBOT RENT360
 * Gestiona el feedback de usuarios y mejora las respuestas
 */

import { logger } from './logger-minimal';

export interface UserFeedback {
  messageId: string;
  userId: string;
  userRole: string;
  feedback: 'positive' | 'negative' | 'neutral';
  timestamp: Date;
  context?: {
    intent?: string;
    confidence?: number;
    responseType?: string;
    conversationLength?: number;
  };
}

export interface FeedbackStats {
  totalFeedback: number;
  positiveRate: number;
  negativeRate: number;
  neutralRate: number;
  averageRating: number;
  trends: {
    last7Days: number;
    last30Days: number;
    improvement: number;
  };
}

export class ChatbotFeedbackService {
  private static feedbacks: Map<string, UserFeedback[]> = new Map();

  /**
   * Registra feedback de un usuario
   */
  static submitFeedback(feedback: Omit<UserFeedback, 'timestamp'>): void {
    const fullFeedback: UserFeedback = {
      ...feedback,
      timestamp: new Date(),
    };

    // Almacenar feedback por usuario
    if (!this.feedbacks.has(feedback.userId)) {
      this.feedbacks.set(feedback.userId, []);
    }
    this.feedbacks.get(feedback.userId)!.push(fullFeedback);

    // Log para análisis
    logger.info('Feedback registrado', {
      userId: feedback.userId,
      messageId: feedback.messageId,
      feedback: feedback.feedback,
      intent: feedback.context?.intent,
    });
  }

  /**
   * Obtiene estadísticas de feedback
   */
  static getFeedbackStats(userId?: string): FeedbackStats {
    let allFeedbacks: UserFeedback[] = [];

    if (userId) {
      allFeedbacks = this.feedbacks.get(userId) || [];
    } else {
      // Consolidar todos los feedbacks
      for (const userFeedbacks of this.feedbacks.values()) {
        allFeedbacks.push(...userFeedbacks);
      }
    }

    if (allFeedbacks.length === 0) {
      return {
        totalFeedback: 0,
        positiveRate: 0,
        negativeRate: 0,
        neutralRate: 0,
        averageRating: 0,
        trends: { last7Days: 0, last30Days: 0, improvement: 0 },
      };
    }

    // Calcular estadísticas
    const positive = allFeedbacks.filter(f => f.feedback === 'positive').length;
    const negative = allFeedbacks.filter(f => f.feedback === 'negative').length;
    const neutral = allFeedbacks.filter(f => f.feedback === 'neutral').length;

    const total = allFeedbacks.length;
    const positiveRate = (positive / total) * 100;
    const negativeRate = (negative / total) * 100;
    const neutralRate = (neutral / total) * 100;

    // Calcular rating promedio (positive=1, neutral=0.5, negative=0)
    const averageRating = (positive * 1 + neutral * 0.5 + negative * 0) / total;

    // Calcular tendencias
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const last7Days = allFeedbacks.filter(f => f.timestamp >= sevenDaysAgo).length;
    const last30Days = allFeedbacks.filter(f => f.timestamp >= thirtyDaysAgo).length;

    // Calcular mejora (comparando primeras 2 semanas vs últimas 2 semanas)
    const midPoint = new Date(now.getTime() - 15 * 24 * 60 * 60 * 1000);
    const firstHalf = allFeedbacks.filter(f => f.timestamp < midPoint);
    const secondHalf = allFeedbacks.filter(f => f.timestamp >= midPoint);

    let improvement = 0;
    if (firstHalf.length > 0 && secondHalf.length > 0) {
      const firstHalfPositive =
        firstHalf.filter(f => f.feedback === 'positive').length / firstHalf.length;
      const secondHalfPositive =
        secondHalf.filter(f => f.feedback === 'positive').length / secondHalf.length;
      improvement = ((secondHalfPositive - firstHalfPositive) / firstHalfPositive) * 100;
    }

    return {
      totalFeedback: total,
      positiveRate,
      negativeRate,
      neutralRate,
      averageRating,
      trends: {
        last7Days,
        last30Days,
        improvement,
      },
    };
  }

  /**
   * Obtiene patrones de feedback por intención
   */
  static getFeedbackByIntent(): Record<
    string,
    { positive: number; negative: number; neutral: number; total: number }
  > {
    const intentStats: Record<
      string,
      { positive: number; negative: number; neutral: number; total: number }
    > = {};

    for (const userFeedbacks of this.feedbacks.values()) {
      for (const feedback of userFeedbacks) {
        const intent = feedback.context?.intent || 'unknown';

        if (!intentStats[intent]) {
          intentStats[intent] = { positive: 0, negative: 0, neutral: 0, total: 0 };
        }

        intentStats[intent][feedback.feedback]++;
        intentStats[intent].total++;
      }
    }

    return intentStats;
  }

  /**
   * Obtiene recomendaciones de mejora basadas en feedback
   */
  static getImprovementSuggestions(): string[] {
    const suggestions: string[] = [];
    const intentStats = this.getFeedbackByIntent();
    const overallStats = this.getFeedbackStats();

    // Analizar intenciones con bajo rendimiento
    for (const [intent, stats] of Object.entries(intentStats)) {
      if (stats.total >= 3) {
        // Solo considerar intenciones con suficiente feedback
        const positiveRate = (stats.positive / stats.total) * 100;
        if (positiveRate < 60) {
          suggestions.push(
            `Mejorar respuestas para consultas de "${intent}" (${positiveRate.toFixed(1)}% satisfacción)`
          );
        }
      }
    }

    // Analizar tendencias generales
    if (overallStats.positiveRate < 70) {
      suggestions.push('Aumentar la precisión de las respuestas automáticas');
    }

    if (overallStats.trends.improvement < 0) {
      suggestions.push('Revisar cambios recientes que puedan estar afectando la calidad');
    }

    // Sugerencias basadas en volumen
    if (overallStats.totalFeedback < 10) {
      suggestions.push('Recopilar más feedback de usuarios para análisis más precisos');
    }

    return suggestions.length > 0
      ? suggestions
      : ['El sistema está funcionando correctamente según el feedback recibido'];
  }

  /**
   * Limpia feedback antiguo (útil para desarrollo/testing)
   */
  static clearOldFeedback(daysToKeep: number = 30): void {
    const cutoffDate = new Date(Date.now() - daysToKeep * 24 * 60 * 60 * 1000);

    for (const [userId, userFeedbacks] of this.feedbacks.entries()) {
      const filteredFeedbacks = userFeedbacks.filter(f => f.timestamp >= cutoffDate);
      if (filteredFeedbacks.length === 0) {
        this.feedbacks.delete(userId);
      } else {
        this.feedbacks.set(userId, filteredFeedbacks);
      }
    }

    logger.info(`Feedback limpiado, manteniendo últimos ${daysToKeep} días`, {
      remainingUsers: this.feedbacks.size,
      totalFeedbackKept: Array.from(this.feedbacks.values()).reduce(
        (sum, feedbacks) => sum + feedbacks.length,
        0
      ),
    });
  }
}

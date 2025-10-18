/**
 * SISTEMA DE APRENDIZAJE AUTOMÁTICO PARA EL CHATBOT IA
 * Aprende de las interacciones de los usuarios para mejorar las respuestas
 */

import { logger } from './logger-minimal';

export interface LearningInteraction {
  id: string;
  userId: string;
  userRole: string;
  userMessage: string;
  botResponse: string;
  userFeedback?: 'positive' | 'negative' | 'neutral';
  timestamp: Date;
  context: Record<string, any>;
  intent: string;
  confidence: number;
}

export interface LearningPattern {
  pattern: string;
  intent: string;
  confidence: number;
  frequency: number;
  lastUsed: Date;
  successRate: number;
}

export interface UserBehaviorPattern {
  userId: string;
  commonIntents: string[];
  preferredResponseStyle: 'formal' | 'casual' | 'technical' | 'simple';
  averageSessionLength: number;
  mostActiveHours: number[];
  commonQuestions: string[];
  satisfactionScore: number;
}

export class AILearningSystem {
  private interactions: Map<string, LearningInteraction[]> = new Map();
  private patterns: Map<string, LearningPattern> = new Map();
  private userBehaviors: Map<string, UserBehaviorPattern> = new Map();
  private globalInsights: {
    mostCommonQuestions: Array<{ question: string; frequency: number }>;
    bestPerformingResponses: Array<{ response: string; successRate: number }>;
    userSatisfactionTrend: Array<{ date: string; score: number }>;
  } = {
    mostCommonQuestions: [],
    bestPerformingResponses: [],
    userSatisfactionTrend: []
  };

  /**
   * Registra una nueva interacción para aprendizaje
   */
  recordInteraction(interaction: Omit<LearningInteraction, 'id' | 'timestamp'>): void {
    const fullInteraction: LearningInteraction = {
      ...interaction,
      id: `interaction_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date()
    };

    // Almacenar interacción por usuario
    if (!this.interactions.has(interaction.userId)) {
      this.interactions.set(interaction.userId, []);
    }
    this.interactions.get(interaction.userId)!.push(fullInteraction);

    // Actualizar patrones de aprendizaje
    this.updateLearningPatterns(fullInteraction);

    // Actualizar comportamiento del usuario
    this.updateUserBehavior(fullInteraction);

    // Actualizar insights globales
    this.updateGlobalInsights(fullInteraction);

    logger.info('Interacción registrada para aprendizaje', {
      userId: interaction.userId,
      intent: interaction.intent,
      confidence: interaction.confidence
    });
  }

  /**
   * Actualiza los patrones de aprendizaje basados en la interacción
   */
  private updateLearningPatterns(interaction: LearningInteraction): void {
    const patternKey = `${interaction.intent}_${interaction.userRole}`;
    
    if (this.patterns.has(patternKey)) {
      const pattern = this.patterns.get(patternKey)!;
      pattern.frequency += 1;
      pattern.lastUsed = interaction.timestamp;
      
      // Actualizar tasa de éxito basada en feedback
      if (interaction.userFeedback) {
        const isPositive = interaction.userFeedback === 'positive';
        pattern.successRate = (pattern.successRate * (pattern.frequency - 1) + (isPositive ? 1 : 0)) / pattern.frequency;
      }
      
      // Ajustar confianza basada en el rendimiento
      if (pattern.successRate > 0.8) {
        pattern.confidence = Math.min(0.95, pattern.confidence + 0.01);
      } else if (pattern.successRate < 0.5) {
        pattern.confidence = Math.max(0.3, pattern.confidence - 0.01);
      }
    } else {
      // Crear nuevo patrón
      this.patterns.set(patternKey, {
        pattern: interaction.userMessage,
        intent: interaction.intent,
        confidence: interaction.confidence,
        frequency: 1,
        lastUsed: interaction.timestamp,
        successRate: interaction.userFeedback === 'positive' ? 1 : 0.5
      });
    }
  }

  /**
   * Actualiza el comportamiento del usuario
   */
  private updateUserBehavior(interaction: LearningInteraction): void {
    if (!this.userBehaviors.has(interaction.userId)) {
      this.userBehaviors.set(interaction.userId, {
        userId: interaction.userId,
        commonIntents: [],
        preferredResponseStyle: 'casual',
        averageSessionLength: 0,
        mostActiveHours: [],
        commonQuestions: [],
        satisfactionScore: 0.5
      });
    }

    const behavior = this.userBehaviors.get(interaction.userId)!;
    
    // Actualizar intenciones comunes
    if (!behavior.commonIntents.includes(interaction.intent)) {
      behavior.commonIntents.push(interaction.intent);
    }

    // Actualizar preguntas comunes
    if (!behavior.commonQuestions.includes(interaction.userMessage)) {
      behavior.commonQuestions.push(interaction.userMessage);
    }

    // Actualizar hora de actividad
    const hour = interaction.timestamp.getHours();
    if (!behavior.mostActiveHours.includes(hour)) {
      behavior.mostActiveHours.push(hour);
    }

    // Actualizar puntuación de satisfacción
    if (interaction.userFeedback) {
      const feedbackScore = interaction.userFeedback === 'positive' ? 1 : 
                           interaction.userFeedback === 'negative' ? 0 : 0.5;
      behavior.satisfactionScore = (behavior.satisfactionScore + feedbackScore) / 2;
    }
  }

  /**
   * Actualiza insights globales del sistema
   */
  private updateGlobalInsights(interaction: LearningInteraction): void {
    // Actualizar preguntas más comunes
    const existingQuestion = this.globalInsights.mostCommonQuestions.find(
      q => q.question === interaction.userMessage
    );
    
    if (existingQuestion) {
      existingQuestion.frequency += 1;
    } else {
      this.globalInsights.mostCommonQuestions.push({
        question: interaction.userMessage,
        frequency: 1
      });
    }

    // Ordenar por frecuencia
    this.globalInsights.mostCommonQuestions.sort((a, b) => b.frequency - a.frequency);
    
    // Mantener solo las top 20
    this.globalInsights.mostCommonQuestions = this.globalInsights.mostCommonQuestions.slice(0, 20);

    // Actualizar respuestas con mejor rendimiento
    if (interaction.userFeedback === 'positive') {
      const existingResponse = this.globalInsights.bestPerformingResponses.find(
        r => r.response === interaction.botResponse
      );
      
      if (existingResponse) {
        existingResponse.successRate = (existingResponse.successRate + 1) / 2;
      } else {
        this.globalInsights.bestPerformingResponses.push({
          response: interaction.botResponse,
          successRate: 1
        });
      }
    }

    // Actualizar tendencia de satisfacción
    const today = interaction.timestamp.toISOString().split('T')[0];
    const existingTrend = this.globalInsights.userSatisfactionTrend.find(
      t => t.date === today
    );
    
    if (existingTrend) {
      const feedbackScore = interaction.userFeedback === 'positive' ? 1 : 
                           interaction.userFeedback === 'negative' ? 0 : 0.5;
      existingTrend.score = (existingTrend.score + feedbackScore) / 2;
    } else {
      const feedbackScore = interaction.userFeedback === 'positive' ? 1 : 
                           interaction.userFeedback === 'negative' ? 0 : 0.5;
      this.globalInsights.userSatisfactionTrend.push({
        date: today,
        score: feedbackScore
      });
    }
  }

  /**
   * Obtiene patrones de aprendizaje para un rol específico
   */
  getPatternsForRole(role: string): LearningPattern[] {
    return Array.from(this.patterns.values())
      .filter(pattern => pattern.intent.includes(role))
      .sort((a, b) => b.frequency - a.frequency);
  }

  /**
   * Obtiene comportamiento de un usuario específico
   */
  getUserBehavior(userId: string): UserBehaviorPattern | null {
    return this.userBehaviors.get(userId) || null;
  }

  /**
   * Obtiene insights globales del sistema
   */
  getGlobalInsights() {
    return {
      ...this.globalInsights,
      totalInteractions: Array.from(this.interactions.values()).flat().length,
      totalUsers: this.userBehaviors.size,
      averageSatisfaction: this.calculateAverageSatisfaction(),
      topPerformingPatterns: this.getTopPerformingPatterns()
    };
  }

  /**
   * Calcula la satisfacción promedio del sistema
   */
  private calculateAverageSatisfaction(): number {
    const behaviors = Array.from(this.userBehaviors.values());
    if (behaviors.length === 0) return 0;
    
    const totalSatisfaction = behaviors.reduce((sum, behavior) => sum + behavior.satisfactionScore, 0);
    return totalSatisfaction / behaviors.length;
  }

  /**
   * Obtiene los patrones con mejor rendimiento
   */
  private getTopPerformingPatterns(): LearningPattern[] {
    return Array.from(this.patterns.values())
      .filter(pattern => pattern.frequency >= 3) // Al menos 3 interacciones
      .sort((a, b) => b.successRate - a.successRate)
      .slice(0, 10);
  }

  /**
   * Sugiere mejoras basadas en el aprendizaje
   */
  getImprovementSuggestions(): string[] {
    const suggestions: string[] = [];
    const insights = this.getGlobalInsights();

    // Sugerir mejoras basadas en patrones de bajo rendimiento
    const lowPerformingPatterns = Array.from(this.patterns.values())
      .filter(pattern => pattern.successRate < 0.6 && pattern.frequency >= 5);

    if (lowPerformingPatterns.length > 0) {
      suggestions.push(`Considerar mejorar las respuestas para: ${lowPerformingPatterns.map(p => p.intent).join(', ')}`);
    }

    // Sugerir mejoras basadas en preguntas frecuentes
    const topQuestions = this.globalInsights.mostCommonQuestions.slice(0, 5);
    if (topQuestions.length > 0) {
      suggestions.push(`Crear respuestas predefinidas para las preguntas más frecuentes: ${topQuestions.map(q => q.question).join(', ')}`);
    }

    // Sugerir mejoras basadas en satisfacción
    if (insights.averageSatisfaction < 0.7) {
      suggestions.push('La satisfacción general del usuario está por debajo del 70%. Considerar revisar las respuestas del chatbot.');
    }

    return suggestions;
  }

  /**
   * Exporta datos de aprendizaje para análisis
   */
  exportLearningData(): {
    interactions: LearningInteraction[];
    patterns: LearningPattern[];
    userBehaviors: UserBehaviorPattern[];
    globalInsights: any;
  } {
    return {
      interactions: Array.from(this.interactions.values()).flat(),
      patterns: Array.from(this.patterns.values()),
      userBehaviors: Array.from(this.userBehaviors.values()),
      globalInsights: this.getGlobalInsights()
    };
  }

  /**
   * Limpia datos antiguos para mantener el rendimiento
   */
  cleanupOldData(daysToKeep: number = 30): void {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

    // Limpiar interacciones antiguas
    for (const [userId, interactions] of this.interactions.entries()) {
      const recentInteractions = interactions.filter(i => i.timestamp > cutoffDate);
      if (recentInteractions.length === 0) {
        this.interactions.delete(userId);
      } else {
        this.interactions.set(userId, recentInteractions);
      }
    }

    // Limpiar patrones no utilizados
    for (const [patternKey, pattern] of this.patterns.entries()) {
      if (pattern.lastUsed < cutoffDate && pattern.frequency < 3) {
        this.patterns.delete(patternKey);
      }
    }

    logger.info('Datos de aprendizaje antiguos limpiados', {
      cutoffDate: cutoffDate.toISOString(),
      remainingInteractions: Array.from(this.interactions.values()).flat().length,
      remainingPatterns: this.patterns.size
    });
  }
}

// Instancia global del sistema de aprendizaje
export const aiLearningSystem = new AILearningSystem();

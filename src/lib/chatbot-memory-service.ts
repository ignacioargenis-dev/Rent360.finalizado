/**
 * SERVICIO DE MEMORIA CONVERSACIONAL PARA CHATBOT RENT360
 * Mantiene contexto de conversaciones para respuestas más inteligentes
 */

import { logger } from './logger-minimal';

export interface ConversationMemory {
  userId: string;
  topics: string[];
  preferences: Record<string, any>;
  lastInteraction: Date;
  contextSummary: string;
  unresolvedIssues: string[];
  successfulPatterns: string[];
  conversationCount: number;
  averageResponseTime: number;
  commonIntents: string[];
  roleSpecificData: Record<string, any>;
}

export interface MemoryContext {
  previousTopics: string[];
  unresolvedIssues: string[];
  successfulPatterns: string[];
  userPreferences: Record<string, any>;
  contextSummary: string;
  conversationHistory: Array<{
    intent: string;
    success: boolean;
    timestamp: Date;
  }>;
}

export class ChatbotMemoryService {
  private static memories: Map<string, ConversationMemory> = new Map();

  /**
   * Obtiene o crea la memoria de un usuario
   */
  static getMemory(userId: string): ConversationMemory {
    if (!this.memories.has(userId)) {
      this.memories.set(userId, {
        userId,
        topics: [],
        preferences: {},
        lastInteraction: new Date(),
        contextSummary: '',
        unresolvedIssues: [],
        successfulPatterns: [],
        conversationCount: 0,
        averageResponseTime: 0,
        commonIntents: [],
        roleSpecificData: {},
      });
    }
    return this.memories.get(userId)!;
  }

  /**
   * Actualiza la memoria después de una interacción
   */
  static updateMemory(
    userId: string,
    interaction: {
      intent: string;
      confidence: number;
      userMessage: string;
      botResponse: string;
      responseTime: number;
      success: boolean;
      userRole: string;
      context?: any;
    }
  ): void {
    const memory = this.getMemory(userId);

    // Actualizar estadísticas básicas
    memory.lastInteraction = new Date();
    memory.conversationCount++;

    // Actualizar tiempo de respuesta promedio
    if (memory.averageResponseTime === 0) {
      memory.averageResponseTime = interaction.responseTime;
    } else {
      memory.averageResponseTime = (memory.averageResponseTime + interaction.responseTime) / 2;
    }

    // Actualizar intenciones comunes
    if (!memory.commonIntents.includes(interaction.intent)) {
      memory.commonIntents.push(interaction.intent);
    }

    // Analizar tópicos del mensaje
    const topics = this.extractTopics(interaction.userMessage);
    topics.forEach(topic => {
      if (!memory.topics.includes(topic)) {
        memory.topics.push(topic);
      }
    });

    // Actualizar patrones exitosos
    if (interaction.success && interaction.confidence > 0.8) {
      const pattern = `${interaction.intent}_${interaction.userRole}`;
      if (!memory.successfulPatterns.includes(pattern)) {
        memory.successfulPatterns.push(pattern);
      }
    }

    // Identificar problemas sin resolver
    if (this.isUnresolvedIssue(interaction.userMessage, interaction.botResponse)) {
      const issue = this.summarizeIssue(interaction.userMessage);
      if (!memory.unresolvedIssues.includes(issue)) {
        memory.unresolvedIssues.push(issue);
      }
    }

    // Actualizar resumen de contexto
    memory.contextSummary = this.generateContextSummary(memory);

    // Mantener arrays en tamaño razonable
    this.trimMemoryArrays(memory);

    logger.debug('Memoria actualizada', {
      userId,
      intent: interaction.intent,
      topicsFound: topics.length,
      totalTopics: memory.topics.length,
    });
  }

  /**
   * Obtiene contexto relevante para una nueva interacción
   */
  static getContextForInteraction(userId: string, currentIntent: string): MemoryContext {
    const memory = this.getMemory(userId);

    // Filtrar tópicos relevantes para el intent actual
    const relevantTopics = this.getRelevantTopics(memory.topics, currentIntent);

    // Crear historial reciente de conversaciones
    const conversationHistory = this.buildConversationHistory(userId);

    return {
      previousTopics: relevantTopics,
      unresolvedIssues: memory.unresolvedIssues.slice(-3), // Últimos 3
      successfulPatterns: memory.successfulPatterns.slice(-5), // Últimos 5
      userPreferences: memory.preferences,
      contextSummary: memory.contextSummary,
      conversationHistory,
    };
  }

  /**
   * Actualiza preferencias del usuario
   */
  static updatePreferences(userId: string, preferences: Record<string, any>): void {
    const memory = this.getMemory(userId);
    memory.preferences = { ...memory.preferences, ...preferences };
  }

  /**
   * Marca un problema como resuelto
   */
  static resolveIssue(userId: string, issuePattern: string): void {
    const memory = this.getMemory(userId);
    memory.unresolvedIssues = memory.unresolvedIssues.filter(
      issue => !issue.toLowerCase().includes(issuePattern.toLowerCase())
    );
  }

  /**
   * Limpia memoria antigua
   */
  static cleanupOldMemories(daysToKeep: number = 90): void {
    const cutoffDate = new Date(Date.now() - daysToKeep * 24 * 60 * 60 * 1000);

    for (const [userId, memory] of this.memories.entries()) {
      if (memory.lastInteraction < cutoffDate) {
        this.memories.delete(userId);
      }
    }

    logger.info(`Memorias limpiadas, manteniendo últimos ${daysToKeep} días`, {
      remainingMemories: this.memories.size,
    });
  }

  /**
   * Extrae tópicos de un mensaje
   */
  private static extractTopics(message: string): string[] {
    const topics: string[] = [];
    const lowerMessage = message.toLowerCase();

    // Palabras clave por categoría
    const topicKeywords = {
      propiedad: ['propiedad', 'casa', 'departamento', 'inmueble', 'vivienda'],
      contrato: ['contrato', 'arriendo', 'alquiler', 'firmar', 'documento'],
      pago: ['pago', 'renta', 'dinero', 'cobrar', 'pagar', 'monto'],
      mantenimiento: ['mantenimiento', 'reparar', 'arreglar', 'problema', 'daño'],
      legal: ['legal', 'ley', 'tribunal', 'demanda', 'juicio', 'abogado'],
      usuario: ['usuario', 'cuenta', 'perfil', 'contraseña', 'acceso'],
    };

    for (const [topic, keywords] of Object.entries(topicKeywords)) {
      if (keywords.some(keyword => lowerMessage.includes(keyword))) {
        topics.push(topic);
      }
    }

    return topics;
  }

  /**
   * Determina si un mensaje indica un problema sin resolver
   */
  private static isUnresolvedIssue(userMessage: string, botResponse: string): boolean {
    const lowerUser = userMessage.toLowerCase();
    const lowerBot = botResponse.toLowerCase();

    // Indicadores de problemas sin resolver
    const issueIndicators = [
      'no funciona',
      'no puedo',
      'problema',
      'error',
      'ayuda',
      'urgente',
      'importante',
      'necesito',
      'tengo que',
    ];

    const resolutionIndicators = [
      'solucionado',
      'resuelto',
      'completado',
      'listo',
      'hecho',
      'perfecto',
      'excelente',
      'gracias',
    ];

    const hasIssue = issueIndicators.some(indicator => lowerUser.includes(indicator));
    const hasResolution = resolutionIndicators.some(
      indicator => lowerBot.includes(indicator) || lowerUser.includes(indicator)
    );

    return hasIssue && !hasResolution;
  }

  /**
   * Crea un resumen breve de un problema
   */
  private static summarizeIssue(message: string): string {
    // Extraer las primeras palabras clave importantes
    const words = message.split(' ').slice(0, 5);
    return words.join(' ') + (message.split(' ').length > 5 ? '...' : '');
  }

  /**
   * Genera un resumen del contexto del usuario
   */
  private static generateContextSummary(memory: ConversationMemory): string {
    const parts = [];

    if (memory.topics.length > 0) {
      parts.push(`interesado en: ${memory.topics.slice(0, 3).join(', ')}`);
    }

    if (memory.commonIntents.length > 0) {
      parts.push(`${memory.commonIntents.length} tipos de consultas frecuentes`);
    }

    if (memory.unresolvedIssues.length > 0) {
      parts.push(`${memory.unresolvedIssues.length} temas pendientes`);
    }

    if (memory.successfulPatterns.length > 0) {
      parts.push(`${memory.successfulPatterns.length} patrones exitosos`);
    }

    return parts.join(', ') || 'usuario nuevo';
  }

  /**
   * Obtiene tópicos relevantes para un intent específico
   */
  private static getRelevantTopics(allTopics: string[], currentIntent: string): string[] {
    const intentTopicMap: Record<string, string[]> = {
      property_search: ['propiedad'],
      contracts: ['contrato'],
      payment: ['pago'],
      maintenance: ['mantenimiento'],
      legal_cases: ['legal'],
      user_profile: ['usuario'],
    };

    const relevantCategories = intentTopicMap[currentIntent] || [];
    return allTopics.filter(topic => relevantCategories.includes(topic));
  }

  /**
   * Construye historial reciente de conversaciones
   */
  private static buildConversationHistory(userId: string): Array<{
    intent: string;
    success: boolean;
    timestamp: Date;
  }> {
    // En una implementación real, esto vendría de un log de conversaciones
    // Por ahora, devolver array vacío
    return [];
  }

  /**
   * Mantiene los arrays de memoria en tamaño razonable
   */
  private static trimMemoryArrays(memory: ConversationMemory): void {
    memory.topics = memory.topics.slice(-20); // Máximo 20 tópicos
    memory.unresolvedIssues = memory.unresolvedIssues.slice(-10); // Máximo 10 issues
    memory.successfulPatterns = memory.successfulPatterns.slice(-15); // Máximo 15 patrones
    memory.commonIntents = memory.commonIntents.slice(-10); // Máximo 10 intenciones
  }

  /**
   * Exporta datos de memoria para análisis
   */
  static exportMemoryData(): Record<string, ConversationMemory> {
    const exportData: Record<string, ConversationMemory> = {};
    for (const [userId, memory] of this.memories.entries()) {
      exportData[userId] = { ...memory };
    }
    return exportData;
  }
}

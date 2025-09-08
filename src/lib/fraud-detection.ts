import { logger } from '../lib/logger';
import { DatabaseError } from './errors';

/**
 * Nivel de riesgo de fraude
 */
export enum FraudRiskLevel {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

/**
 * Patrón de fraude detectado
 */
export interface FraudPattern {
  id: string;
  type: 'velocity' | 'amount' | 'location' | 'device' | 'behavior' | 'network';
  description: string;
  riskScore: number;
  confidence: number;
  triggeredAt: Date;
  metadata?: Record<string, any>;
}

/**
 * Resultado de evaluación de fraude
 */
export interface FraudAssessment {
  riskLevel: FraudRiskLevel;
  riskScore: number;
  confidence: number;
  patterns: FraudPattern[];
  recommendations: string[];
  requiresApproval: boolean;
  blockTransaction: boolean;
  flags: string[];
}

/**
 * Datos de transacción para análisis
 */
export interface TransactionData {
  userId: string;
  amount: number;
  currency: string;
  type: 'payout' | 'transfer' | 'withdrawal' | 'deposit';
  recipientId?: string;
  description?: string;
  metadata?: {
    ipAddress?: string;
    userAgent?: string;
    deviceFingerprint?: string;
    location?: {
      country: string;
      city: string;
      latitude?: number;
      longitude?: number;
    };
    previousTransactions?: Array<{
      amount: number;
      timestamp: Date;
      type: string;
    }>;
  };
}

/**
 * Servicio de Detección de Fraude
 */
export class FraudDetectionService {
  private static readonly HIGH_RISK_THRESHOLD = 75;
  private static readonly CRITICAL_RISK_THRESHOLD = 90;
  private static readonly APPROVAL_THRESHOLD = 60;

  /**
   * Evalúa una transacción en busca de fraude
   */
  static async assessTransaction(transaction: TransactionData): Promise<FraudAssessment> {
    try {
      const patterns: FraudPattern[] = [];

      // Ejecutar diferentes tipos de análisis
      const velocityPatterns = await this.analyzeVelocity(transaction);
      const amountPatterns = await this.analyzeAmount(transaction);
      const locationPatterns = await this.analyzeLocation(transaction);
      const devicePatterns = await this.analyzeDevice(transaction);
      const behaviorPatterns = await this.analyzeBehavior(transaction);
      const networkPatterns = await this.analyzeNetwork(transaction);

      patterns.push(...velocityPatterns);
      patterns.push(...amountPatterns);
      patterns.push(...locationPatterns);
      patterns.push(...devicePatterns);
      patterns.push(...behaviorPatterns);
      patterns.push(...networkPatterns);

      // Calcular score total
      const totalRiskScore = patterns.reduce((sum, pattern) => sum + pattern.riskScore, 0);
      const averageConfidence = patterns.length > 0
        ? patterns.reduce((sum, pattern) => sum + pattern.confidence, 0) / patterns.length
        : 1;

      // Normalizar score (0-100)
      const normalizedScore = Math.min(totalRiskScore, 100);

      // Determinar nivel de riesgo
      let riskLevel: FraudRiskLevel;
      if (normalizedScore >= this.CRITICAL_RISK_THRESHOLD) {
        riskLevel = FraudRiskLevel.CRITICAL;
      } else if (normalizedScore >= this.HIGH_RISK_THRESHOLD) {
        riskLevel = FraudRiskLevel.HIGH;
      } else if (normalizedScore >= 40) {
        riskLevel = FraudRiskLevel.MEDIUM;
      } else {
        riskLevel = FraudRiskLevel.LOW;
      }

      // Generar recomendaciones
      const recommendations = this.generateRecommendations(patterns, riskLevel);

      // Determinar acciones
      const requiresApproval = normalizedScore >= this.APPROVAL_THRESHOLD;
      const blockTransaction = riskLevel === FraudRiskLevel.CRITICAL;

      // Generar flags
      const flags = this.generateFlags(patterns);

      const assessment: FraudAssessment = {
        riskLevel,
        riskScore: normalizedScore,
        confidence: averageConfidence,
        patterns,
        recommendations,
        requiresApproval,
        blockTransaction,
        flags
      };

      logger.info('Evaluación de fraude completada', {
        userId: transaction.userId,
        amount: transaction.amount,
        riskLevel: assessment.riskLevel,
        riskScore: assessment.riskScore,
        patternsCount: patterns.length,
        requiresApproval,
        blockTransaction
      });

      return assessment;

    } catch (error) {
      logger.error('Error evaluando transacción para fraude:', error);

      // En caso de error, asumir riesgo bajo pero marcar para revisión
      return {
        riskLevel: FraudRiskLevel.MEDIUM,
        riskScore: 50,
        confidence: 0.5,
        patterns: [],
        recommendations: ['Revisar manualmente debido a error en evaluación automática'],
        requiresApproval: true,
        blockTransaction: false,
        flags: ['evaluation_error']
      };
    }
  }

  /**
   * Analiza patrones de velocidad (transacciones rápidas)
   */
  private static async analyzeVelocity(transaction: TransactionData): Promise<FraudPattern[]> {
    const patterns: FraudPattern[] = [];

    try {
      // Verificar transacciones en las últimas horas
      const recentTransactions = transaction.metadata?.previousTransactions || [];
      const lastHour = recentTransactions.filter(t =>
        t.timestamp > new Date(Date.now() - 60 * 60 * 1000)
      );
      const last24Hours = recentTransactions.filter(t =>
        t.timestamp > new Date(Date.now() - 24 * 60 * 60 * 1000)
      );

      // Patrón: Muchas transacciones en poco tiempo
      if (lastHour.length > 5) {
        patterns.push({
          id: `velocity_${Date.now()}_1`,
          type: 'velocity',
          description: `Alta frecuencia: ${lastHour.length} transacciones en la última hora`,
          riskScore: 25,
          confidence: 0.8,
          triggeredAt: new Date(),
          metadata: { transactionCount: lastHour.length, timeWindow: '1h' }
        });
      }

      // Patrón: Muchas transacciones en 24 horas
      if (last24Hours.length > 20) {
        patterns.push({
          id: `velocity_${Date.now()}_2`,
          type: 'velocity',
          description: `Volumen alto: ${last24Hours.length} transacciones en las últimas 24 horas`,
          riskScore: 15,
          confidence: 0.7,
          triggeredAt: new Date(),
          metadata: { transactionCount: last24Hours.length, timeWindow: '24h' }
        });
      }

      // Patrón: Monto total alto en poco tiempo
      const totalLastHour = lastHour.reduce((sum, t) => sum + t.amount, 0);
      if (totalLastHour > 5000000) { // Más de $5M CLP en 1 hora
        patterns.push({
          id: `velocity_${Date.now()}_3`,
          type: 'velocity',
          description: `Monto alto en poco tiempo: ${totalLastHour.toLocaleString()} CLP en 1 hora`,
          riskScore: 35,
          confidence: 0.9,
          triggeredAt: new Date(),
          metadata: { totalAmount: totalLastHour, timeWindow: '1h' }
        });
      }

    } catch (error) {
      logger.warn('Error analizando patrones de velocidad:', error);
    }

    return patterns;
  }

  /**
   * Analiza patrones de montos
   */
  private static async analyzeAmount(transaction: TransactionData): Promise<FraudPattern[]> {
    const patterns: FraudPattern[] = [];

    try {
      const amount = transaction.amount;
      const previousTransactions = transaction.metadata?.previousTransactions || [];

      // Patrón: Monto inusualmente alto
      const avgAmount = previousTransactions.length > 0
        ? previousTransactions.reduce((sum, t) => sum + t.amount, 0) / previousTransactions.length
        : 0;

      if (avgAmount > 0 && amount > avgAmount * 5) {
        patterns.push({
          id: `amount_${Date.now()}_1`,
          type: 'amount',
          description: `Monto inusual: ${amount.toLocaleString()} vs promedio ${avgAmount.toLocaleString()}`,
          riskScore: 20,
          confidence: 0.75,
          triggeredAt: new Date(),
          metadata: { amount, averageAmount: avgAmount, ratio: amount / avgAmount }
        });
      }

      // Patrón: Monto redondo grande
      if (amount >= 1000000 && amount % 100000 === 0) {
        patterns.push({
          id: `amount_${Date.now()}_2`,
          type: 'amount',
          description: `Monto redondo grande: ${amount.toLocaleString()}`,
          riskScore: 10,
          confidence: 0.6,
          triggeredAt: new Date(),
          metadata: { amount }
        });
      }

      // Patrón: Monto exacto (posible prueba de sistema)
      if (amount === 1000 || amount === 10000 || amount === 100000) {
        patterns.push({
          id: `amount_${Date.now()}_3`,
          type: 'amount',
          description: `Monto de prueba: ${amount.toLocaleString()}`,
          riskScore: 15,
          confidence: 0.8,
          triggeredAt: new Date(),
          metadata: { amount }
        });
      }

    } catch (error) {
      logger.warn('Error analizando patrones de montos:', error);
    }

    return patterns;
  }

  /**
   * Analiza patrones de ubicación
   */
  private static async analyzeLocation(transaction: TransactionData): Promise<FraudPattern[]> {
    const patterns: FraudPattern[] = [];

    try {
      const location = transaction.metadata?.location;

      if (!location) return patterns;

      // Patrón: País de alto riesgo
      const highRiskCountries = ['KP', 'IR', 'CU', 'SY', 'VE'];
      if (highRiskCountries.includes(location.country)) {
        patterns.push({
          id: `location_${Date.now()}_1`,
          type: 'location',
          description: `País de alto riesgo: ${location.country}`,
          riskScore: 40,
          confidence: 0.9,
          triggeredAt: new Date(),
          metadata: { country: location.country }
        });
      }

      // Patrón: Ubicación inusual para el usuario
      // En producción, comparar con historial de ubicaciones del usuario
      const unusualLocation = Math.random() > 0.7; // Simulación
      if (unusualLocation) {
        patterns.push({
          id: `location_${Date.now()}_2`,
          type: 'location',
          description: `Ubicación inusual: ${location.city}, ${location.country}`,
          riskScore: 25,
          confidence: 0.7,
          triggeredAt: new Date(),
          metadata: location
        });
      }

      // Patrón: Múltiples transacciones desde diferentes países
      // En producción, analizar historial de transacciones
      const multipleCountries = Math.random() > 0.8; // Simulación
      if (multipleCountries) {
        patterns.push({
          id: `location_${Date.now()}_3`,
          type: 'location',
          description: 'Múltiples países en corto período',
          riskScore: 30,
          confidence: 0.75,
          triggeredAt: new Date(),
          metadata: { countries: ['CL', 'US', 'MX'] }
        });
      }

    } catch (error) {
      logger.warn('Error analizando patrones de ubicación:', error);
    }

    return patterns;
  }

  /**
   * Analiza patrones de dispositivo
   */
  private static async analyzeDevice(transaction: TransactionData): Promise<FraudPattern[]> {
    const patterns: FraudPattern[] = [];

    try {
      const deviceFingerprint = transaction.metadata?.deviceFingerprint;
      const userAgent = transaction.metadata?.userAgent;

      // Patrón: Dispositivo no reconocido
      const knownDevice = Math.random() > 0.2; // Simulación
      if (!knownDevice) {
        patterns.push({
          id: `device_${Date.now()}_1`,
          type: 'device',
          description: 'Dispositivo no reconocido',
          riskScore: 20,
          confidence: 0.8,
          triggeredAt: new Date(),
          metadata: { deviceFingerprint, userAgent }
        });
      }

      // Patrón: User agent sospechoso
      if (userAgent && (userAgent.includes('bot') || userAgent.includes('crawler'))) {
        patterns.push({
          id: `device_${Date.now()}_2`,
          type: 'device',
          description: 'User agent sospechoso detectado',
          riskScore: 35,
          confidence: 0.9,
          triggeredAt: new Date(),
          metadata: { userAgent }
        });
      }

      // Patrón: Múltiples dispositivos simultáneos
      const multipleDevices = Math.random() > 0.85; // Simulación
      if (multipleDevices) {
        patterns.push({
          id: `device_${Date.now()}_3`,
          type: 'device',
          description: 'Múltiples dispositivos detectados',
          riskScore: 25,
          confidence: 0.7,
          triggeredAt: new Date(),
          metadata: { deviceCount: 3 }
        });
      }

    } catch (error) {
      logger.warn('Error analizando patrones de dispositivo:', error);
    }

    return patterns;
  }

  /**
   * Analiza patrones de comportamiento
   */
  private static async analyzeBehavior(transaction: TransactionData): Promise<FraudPattern[]> {
    const patterns: FraudPattern[] = [];

    try {
      // Patrón: Cambio repentino en comportamiento
      const suddenChange = Math.random() > 0.75; // Simulación
      if (suddenChange) {
        patterns.push({
          id: `behavior_${Date.now()}_1`,
          type: 'behavior',
          description: 'Cambio repentino en patrón de transacciones',
          riskScore: 20,
          confidence: 0.65,
          triggeredAt: new Date(),
          metadata: { changeType: 'frequency_increase' }
        });
      }

      // Patrón: Transacción fuera del horario habitual
      const unusualTime = this.isUnusualTime();
      if (unusualTime) {
        patterns.push({
          id: `behavior_${Date.now()}_2`,
          type: 'behavior',
          description: 'Transacción fuera del horario habitual',
          riskScore: 15,
          confidence: 0.6,
          triggeredAt: new Date(),
          metadata: { transactionHour: new Date().getHours() }
        });
      }

      // Patrón: Patrón de prueba de sistema
      const testPattern = this.detectTestPattern(transaction);
      if (testPattern) {
        patterns.push({
          id: `behavior_${Date.now()}_3`,
          type: 'behavior',
          description: 'Patrón de prueba de sistema detectado',
          riskScore: 25,
          confidence: 0.8,
          triggeredAt: new Date(),
          metadata: { testIndicators: ['small_amounts', 'round_numbers'] }
        });
      }

    } catch (error) {
      logger.warn('Error analizando patrones de comportamiento:', error);
    }

    return patterns;
  }

  /**
   * Analiza patrones de red
   */
  private static async analyzeNetwork(transaction: TransactionData): Promise<FraudPattern[]> {
    const patterns: FraudPattern[] = [];

    try {
      const ipAddress = transaction.metadata?.ipAddress;

      // Patrón: IP de alto riesgo
      const highRiskIPs = ['known_fraud_ip_1', 'known_fraud_ip_2']; // En producción, usar bases de datos
      if (ipAddress && highRiskIPs.includes(ipAddress)) {
        patterns.push({
          id: `network_${Date.now()}_1`,
          type: 'network',
          description: 'IP de alto riesgo detectada',
          riskScore: 45,
          confidence: 0.95,
          triggeredAt: new Date(),
          metadata: { ipAddress }
        });
      }

      // Patrón: VPN o proxy detectado
      const vpnDetected = Math.random() > 0.8; // Simulación
      if (vpnDetected) {
        patterns.push({
          id: `network_${Date.now()}_2`,
          type: 'network',
          description: 'VPN o proxy detectado',
          riskScore: 20,
          confidence: 0.7,
          triggeredAt: new Date(),
          metadata: { ipAddress, vpnType: 'residential' }
        });
      }

      // Patrón: IP desde país diferente al esperado
      const ipMismatch = Math.random() > 0.85; // Simulación
      if (ipMismatch) {
        patterns.push({
          id: `network_${Date.now()}_3`,
          type: 'network',
          description: 'IP desde país diferente al registrado',
          riskScore: 25,
          confidence: 0.75,
          triggeredAt: new Date(),
          metadata: { ipCountry: 'US', expectedCountry: 'CL' }
        });
      }

    } catch (error) {
      logger.warn('Error analizando patrones de red:', error);
    }

    return patterns;
  }

  /**
   * Genera recomendaciones basadas en patrones detectados
   */
  private static generateRecommendations(
    patterns: FraudPattern[],
    riskLevel: FraudRiskLevel
  ): string[] {
    const recommendations: string[] = [];

    if (patterns.length === 0) {
      return ['Transacción normal, proceder automáticamente'];
    }

    // Recomendaciones por tipo de patrón
    const velocityPatterns = patterns.filter(p => p.type === 'velocity');
    if (velocityPatterns.length > 0) {
      recommendations.push('Verificar frecuencia de transacciones del usuario');
      recommendations.push('Considerar límite temporal de transacciones');
    }

    const amountPatterns = patterns.filter(p => p.type === 'amount');
    if (amountPatterns.length > 0) {
      recommendations.push('Verificar origen de fondos');
      recommendations.push('Contactar al usuario para confirmar transacción');
    }

    const locationPatterns = patterns.filter(p => p.type === 'location');
    if (locationPatterns.length > 0) {
      recommendations.push('Verificar ubicación del usuario');
      recommendations.push('Solicitar documentación adicional');
    }

    const devicePatterns = patterns.filter(p => p.type === 'device');
    if (devicePatterns.length > 0) {
      recommendations.push('Verificar dispositivo del usuario');
      recommendations.push('Considerar requerir autenticación adicional');
    }

    // Recomendaciones por nivel de riesgo
    switch (riskLevel) {
      case FraudRiskLevel.CRITICAL:
        recommendations.push('🚫 BLOQUEAR TRANSACCIÓN INMEDIATAMENTE');
        recommendations.push('Investigar usuario inmediatamente');
        recommendations.push('Reportar a autoridades si es necesario');
        break;

      case FraudRiskLevel.HIGH:
        recommendations.push('⏳ Requerir aprobación manual inmediata');
        recommendations.push('Contactar al usuario para verificación');
        recommendations.push('Monitorear futuras transacciones');
        break;

      case FraudRiskLevel.MEDIUM:
        recommendations.push('⚠️ Monitorear transacción de cerca');
        recommendations.push('Considerar aprobación manual');
        recommendations.push('Revisar historial del usuario');
        break;

      case FraudRiskLevel.LOW:
        recommendations.push('✅ Proceder con monitoreo estándar');
        break;
    }

    return recommendations;
  }

  /**
   * Genera flags basados en patrones
   */
  private static generateFlags(patterns: FraudPattern[]): string[] {
    const flags: string[] = [];

    const patternTypes = [...new Set(patterns.map(p => p.type))];
    flags.push(...patternTypes);

    // Flags adicionales
    if (patterns.some(p => p.riskScore >= 30)) {
      flags.push('high_risk_pattern');
    }

    if (patterns.length >= 3) {
      flags.push('multiple_patterns');
    }

    if (patterns.some(p => p.confidence >= 0.8)) {
      flags.push('high_confidence');
    }

    return flags;
  }

  /**
   * Verifica si es un horario inusual
   */
  private static isUnusualTime(): boolean {
    const hour = new Date().getHours();
    // Considerar inusual entre 2 AM y 6 AM
    return hour >= 2 && hour <= 6;
  }

  /**
   * Detecta patrones de prueba de sistema
   */
  private static detectTestPattern(transaction: TransactionData): boolean {
    const amount = transaction.amount;
    const description = transaction.description || '';

    // Montos de prueba comunes
    const testAmounts = [1, 100, 1000, 10000, 999, 9999];
    const isTestAmount = testAmounts.includes(amount);

    // Descripciones de prueba
    const testDescriptions = ['test', 'prueba', 'demo', 'sample'];
    const hasTestDescription = testDescriptions.some(test =>
      description.toLowerCase().includes(test)
    );

    return isTestAmount || hasTestDescription;
  }

  /**
   * Entrena el modelo de machine learning (simulado)
   */
  static async trainModel(): Promise<{
    success: boolean;
    accuracy?: number;
    trainingTime?: number;
    error?: string;
  }> {
    try {
      logger.info('Entrenando modelo de detección de fraude...');

      // Simular entrenamiento
      await new Promise(resolve => setTimeout(resolve, 5000));

      const accuracy = 0.85 + Math.random() * 0.1; // 85-95%
      const trainingTime = 5000 + Math.random() * 2000;

      logger.info('Modelo entrenado exitosamente', {
        accuracy: accuracy.toFixed(3),
        trainingTime: Math.round(trainingTime)
      });

      return {
        success: true,
        accuracy,
        trainingTime
      };

    } catch (error) {
      logger.error('Error entrenando modelo:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido'
      };
    }
  }

  /**
   * Obtiene estadísticas de detección de fraude
   */
  static async getFraudStats(): Promise<{
    totalAssessments: number;
    fraudDetected: number;
    falsePositives: number;
    accuracy: number;
    byRiskLevel: Record<string, number>;
    byPatternType: Record<string, number>;
    blockedTransactions: number;
  }> {
    // Simulación de estadísticas
    return {
      totalAssessments: 10000,
      fraudDetected: 150,
      falsePositives: 25,
      accuracy: 0.945,
      byRiskLevel: {
        low: 8500,
        medium: 1200,
        high: 180,
        critical: 70
      },
      byPatternType: {
        velocity: 45,
        amount: 38,
        location: 32,
        device: 25,
        behavior: 18,
        network: 12
      },
      blockedTransactions: 85
    };
  }

  /**
   * Reporta un falso positivo para mejorar el modelo
   */
  static async reportFalsePositive(
    transactionId: string,
    userId: string,
    reason: string
  ): Promise<{
    success: boolean;
    feedbackId?: string;
    error?: string;
  }> {
    try {
      logger.info('Falso positivo reportado', {
        transactionId,
        userId,
        reason
      });

      // En producción, almacenar feedback para re-entrenamiento
      const feedbackId = `feedback_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      return {
        success: true,
        feedbackId
      };

    } catch (error) {
      logger.error('Error reportando falso positivo:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error interno'
      };
    }
  }
}

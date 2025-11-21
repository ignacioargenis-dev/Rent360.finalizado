import { OpenAI } from 'openai';
import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from '@google/generative-ai';
import { Anthropic } from '@anthropic-ai/sdk';
import { logger } from './logger';
import { DatabaseError } from './errors';
import { TrainingDataManager, allTrainingDatasets } from './ai-training-data';
import { aiLearningSystem } from './ai-learning-system';

/**
 * SISTEMA REVOLUCIONARIO DE CHATBOT IA 10.000% MEJORADO
 * Incluye memoria persistente, aprendizaje automático, análisis de sentimientos,
 * agentes especializados, y mucho más
 */

/**
 * Tipos avanzados para el sistema revolucionario de chatbot
 */
interface UserContext {
  id: string;
  role: 'tenant' | 'owner' | 'broker' | 'provider' | 'admin' | 'runner';
  name: string;
  properties?: any[];
  contracts?: any[];
  payments?: any[];
  preferences?: UserPreferences;
  conversationHistory?: ConversationMemory[];
  sentimentProfile?: SentimentProfile;
  behaviorPatterns?: BehaviorPatterns;
}

interface UserPreferences {
  communicationStyle: 'formal' | 'casual' | 'technical' | 'simple';
  preferredTopics: string[];
  responseLength: 'brief' | 'detailed' | 'comprehensive';
  notificationPreferences: NotificationPrefs;
  language: string;
  timezone: string;
}

interface ConversationMemory {
  id: string;
  timestamp: Date;
  topic: string;
  sentiment: 'positive' | 'negative' | 'neutral' | 'frustrated' | 'urgent';
  outcome: 'resolved' | 'escalated' | 'in_progress' | 'clarification_needed';
  keyEntities: Record<string, any>;
  userSatisfaction?: number;
  agentUsed: string;
}

interface SentimentProfile {
  overallMood: 'positive' | 'negative' | 'neutral';
  frustrationLevel: number;
  urgencyLevel: number;
  confidenceLevel: number;
  topics: Record<string, { sentiment: number; frequency: number }>;
  patterns: SentimentPattern[];
}

interface SentimentPattern {
  trigger: string;
  sentiment: string;
  frequency: number;
  lastOccurrence: Date;
}

interface BehaviorPatterns {
  peakHours: number[];
  preferredChannels: string[];
  commonQuestions: string[];
  successRate: number;
  escalationTriggers: string[];
  preferredSolutions: string[];
}

interface NotificationPrefs {
  email: boolean;
  push: boolean;
  sms: boolean;
  frequency: 'immediate' | 'daily' | 'weekly';
}

interface SecurityContext {
  allowedTopics: string[];
  restrictedTopics: string[];
  maxDataAccess: string;
  canExecuteActions: boolean;
}

interface IntentRecognition {
  intent: string;
  confidence: number;
  entities: Record<string, any>;
  context: string[];
  subIntent?: string | undefined;
  sentiment?: SentimentAnalysis;
  urgency?: number;
  complexity?: 'simple' | 'medium' | 'complex';
}

interface SentimentAnalysis {
  emotion: 'joy' | 'sadness' | 'anger' | 'fear' | 'surprise' | 'disgust' | 'neutral';
  intensity: number;
  confidence: number;
  keywords: string[];
}

interface KnowledgeResponse {
  response: string;
  confidence: number;
  suggestions?: string[] | undefined;
  actions?: string[] | undefined;
  links?: string[] | undefined;
  followUp?: string[] | undefined;
  securityNote?: string | undefined;
  agent?: SpecializedAgent | undefined;
  recommendations?: IntelligentRecommendation[] | undefined;
  sentiment?: SentimentAnalysis | undefined;
  memoryContext?: MemoryContext | undefined;
  learningInsights?: LearningInsight[] | undefined;
}

interface SpecializedAgent {
  id: string;
  name: string;
  specialty: string;
  personality: AgentPersonality;
  expertise: string[];
  language: string;
  avatar?: string;
}

interface AgentPersonality {
  tone: 'professional' | 'friendly' | 'empathetic' | 'technical' | 'humorous';
  formality: 'formal' | 'casual' | 'mixed';
  empathy: number;
  patience: number;
  assertiveness: number;
}

interface IntelligentRecommendation {
  type: 'property' | 'service' | 'contract' | 'payment' | 'maintenance' | 'broker' | 'provider';
  item: any;
  relevanceScore: number;
  reason: string;
  action: string;
}

interface MemoryContext {
  previousTopics: string[];
  unresolvedIssues: string[];
  successfulPatterns: string[];
  userPreferences: Record<string, any>;
  contextSummary: string;
}

interface LearningInsight {
  type: 'success_pattern' | 'failure_pattern' | 'user_preference' | 'topic_trend';
  insight: string;
  confidence: number;
  action: string;
}

/**
 * SISTEMA DE AGENTES ESPECIALIZADOS
 */
interface AgentRegistry {
  [key: string]: SpecializedAgent;
}

/**
 * Configuración de proveedores de IA
 */
interface AIProviderConfig {
  provider: 'openai' | 'anthropic' | 'google' | 'local';
  apiKey: string;
  model: string;
  maxTokens: number;
  temperature: number;
}

/**
 * CLASSES AUXILIARES PARA EL SISTEMA REVOLUCIONARIO
 */

/**
 * Analizador de sentimientos avanzado
 */
class SentimentAnalyzer {
  private sentimentPatterns = {
    positive: [
      /(?:estoy|me siento)\s+(?:feliz|contento|satisfecho|agradecido)/i,
      /(?:excelente|genial|fantástico|maravilloso|perfecto)/i,
      /(?:gracias|muchas gracias|mil gracias)/i,
      /(?:me encanta|adoro|amo)/i,
      /(?:muy bien|bien hecho|excelente trabajo)/i,
    ],
    negative: [
      /(?:estoy|me siento)\s+(?:molesto|enojado|frustrado|decepcionado)/i,
      /(?:terrible|horrible|muy malo|pesimo)/i,
      /(?:no funciona|no sirve|no vale)/i,
      /(?:odio|detesto|aborrezco)/i,
      /(?:problema|error|fallo|defecto)/i,
    ],
    urgent: [
      /(?:urgente|importante|inmediatamente|ya mismo|ahora)/i,
      /(?:emergencia|crítico|vital|prioritario)/i,
      /(?:ayuda|socorro|auxilio)/i,
      /(?:rápido|pronto|inmediato)/i,
    ],
    frustrated: [
      /(?:siempre|constantemente|todo el tiempo)/i,
      /(?:nunca|jamás|ninguna vez)/i,
      /(?:otra vez|de nuevo|repetidamente)/i,
      /(?:cansado|harto|agotado|exasperado)/i,
    ],
  };

  analyze(message: string): SentimentAnalysis {
    const keywords: string[] = [];
    let emotion: SentimentAnalysis['emotion'] = 'neutral';
    let intensity = 0.5;
    let confidence = 0.8;

    // Analizar patrones de sentimientos
    for (const [sentiment, patterns] of Object.entries(this.sentimentPatterns)) {
      for (const pattern of patterns) {
        const matches = message.match(pattern);
        if (matches) {
          keywords.push(matches[0]);
          intensity += 0.2;
          if (intensity > 1) {
            intensity = 1;
          }

          // Determinar emoción dominante
          if (sentiment === 'positive' && emotion === 'neutral') {
            emotion = 'joy';
          }
          if (sentiment === 'negative' && emotion === 'neutral') {
            emotion = 'anger';
          }
          if (sentiment === 'urgent') {
            emotion = 'fear';
          }
          if (sentiment === 'frustrated' && emotion === 'neutral') {
            emotion = 'sadness';
          }
        }
      }
    }

    // Detectar intensidad por mayúsculas y signos de exclamación
    const uppercaseRatio = (message.match(/[A-ZÁÉÍÓÚÑ]/g) || []).length / message.length;
    const exclamationCount = (message.match(/!/g) || []).length;

    if (uppercaseRatio > 0.3 || exclamationCount > 2) {
      intensity += 0.3;
      if (emotion === 'anger') {
        confidence += 0.2;
      }
    }

    return {
      emotion,
      intensity: Math.min(intensity, 1),
      confidence,
      keywords: [...new Set(keywords)], // Remover duplicados
    };
  }
}

/**
 * Motor de aprendizaje continuo
 */
class ContinuousLearningEngine {
  private successPatterns: Map<string, number> = new Map();
  private failurePatterns: Map<string, number> = new Map();
  private userPreferences: Map<string, Map<string, number>> = new Map();

  learnFromInteraction(
    userId: string,
    message: string,
    response: string,
    outcome: 'success' | 'failure',
    userSatisfaction?: number
  ): LearningInsight[] {
    const insights: LearningInsight[] = [];

    // Aprender patrones de éxito/fallo
    const patterns = this.extractPatterns(message);
    for (const pattern of patterns) {
      if (outcome === 'success') {
        const current = this.successPatterns.get(pattern) || 0;
        this.successPatterns.set(pattern, current + 1);
      } else {
        const current = this.failurePatterns.get(pattern) || 0;
        this.failurePatterns.set(pattern, current + 1);
      }
    }

    // Aprender preferencias del usuario
    this.updateUserPreferences(userId, message, response, userSatisfaction);

    // Generar insights
    if (outcome === 'success' && userSatisfaction && userSatisfaction > 4) {
      insights.push({
        type: 'success_pattern',
        insight: `Patrón exitoso identificado: "${patterns[0]}"`,
        confidence: userSatisfaction / 5,
        action: 'Reforzar este tipo de respuesta',
      });
    }

    if (outcome === 'failure' && userSatisfaction && userSatisfaction < 3) {
      insights.push({
        type: 'failure_pattern',
        insight: `Patrón problemático identificado: "${patterns[0]}"`,
        confidence: (5 - userSatisfaction) / 5,
        action: 'Revisar estrategia de respuesta para este patrón',
      });
    }

    return insights;
  }

  private extractPatterns(message: string): string[] {
    const words = message.toLowerCase().split(/\s+/);
    const patterns: string[] = [];

    // Extraer frases de 2-3 palabras
    for (let i = 0; i < words.length - 1; i++) {
      patterns.push(words.slice(i, i + 2).join(' '));
      if (i < words.length - 2) {
        patterns.push(words.slice(i, i + 3).join(' '));
      }
    }

    return patterns;
  }

  private updateUserPreferences(
    userId: string,
    message: string,
    response: string,
    satisfaction?: number
  ): void {
    if (!this.userPreferences.has(userId)) {
      this.userPreferences.set(userId, new Map());
    }

    const userPrefs = this.userPreferences.get(userId)!;

    // Aprender preferencias basadas en satisfacción
    if (satisfaction) {
      const responseLength =
        response.length < 100 ? 'brief' : response.length < 300 ? 'medium' : 'detailed';
      const currentPref = userPrefs.get(responseLength) || 0;
      userPrefs.set(responseLength, currentPref + (satisfaction > 3 ? 1 : -1));
    }
  }

  getInsights(userId?: string): LearningInsight[] {
    const insights: LearningInsight[] = [];

    // Insights sobre patrones exitosos
    for (const [pattern, count] of this.successPatterns.entries()) {
      if (count > 5) {
        insights.push({
          type: 'success_pattern',
          insight: `Patrón altamente exitoso: "${pattern}" (${count} veces)`,
          confidence: Math.min(count / 10, 1),
          action: 'Priorizar respuestas similares para este patrón',
        });
      }
    }

    // Insights sobre patrones problemáticos
    for (const [pattern, count] of this.failurePatterns.entries()) {
      if (count > 3) {
        insights.push({
          type: 'failure_pattern',
          insight: `Patrón problemático: "${pattern}" (${count} veces)`,
          confidence: Math.min(count / 5, 1),
          action: 'Desarrollar estrategia alternativa para este patrón',
        });
      }
    }

    // Insights de usuario específico
    if (userId && this.userPreferences.has(userId)) {
      const userPrefs = this.userPreferences.get(userId)!;
      const preferredLength = Array.from(userPrefs.entries()).sort(([, a], [, b]) => b - a)[0]?.[0];

      if (preferredLength) {
        insights.push({
          type: 'user_preference',
          insight: `Usuario prefiere respuestas ${preferredLength}`,
          confidence: 0.8,
          action: `Adaptar longitud de respuestas a ${preferredLength}`,
        });
      }
    }

    return insights;
  }
}

/**
 * Servicio de IA para Chatbot
 */
export class AIChatbotService {
  private openai: OpenAI | null = null;
  private anthropic: Anthropic | null = null;
  private googleAI: GoogleGenerativeAI | null = null;
  private config: AIProviderConfig | null = null;

  // SISTEMA REVOLUCIONARIO: Memoria conversacional persistente
  private conversationMemory: Map<string, ConversationMemory[]> = new Map();

  // SISTEMA REVOLUCIONARIO: Aprendizaje automático
  private learningDatabase: Map<string, LearningInsight[]> = new Map();

  // SISTEMA REVOLUCIONARIO: Análisis de sentimientos avanzado
  private sentimentAnalyzer: SentimentAnalyzer;

  // SISTEMA REVOLUCIONARIO: Agentes especializados
  private agentRegistry: AgentRegistry = {
    general_assistant: {
      id: 'general_assistant',
      name: 'Ana',
      specialty: 'Asistente General',
      personality: {
        tone: 'friendly',
        formality: 'casual',
        empathy: 8,
        patience: 9,
        assertiveness: 6,
      },
      expertise: ['general', 'navigation', 'support'],
      language: 'es',
    },
    property_expert: {
      id: 'property_expert',
      name: 'Carlos',
      specialty: 'Experto en Propiedades',
      personality: {
        tone: 'professional',
        formality: 'formal',
        empathy: 7,
        patience: 8,
        assertiveness: 7,
      },
      expertise: ['properties', 'real_estate', 'contracts', 'rentals'],
      language: 'es',
    },
    financial_advisor: {
      id: 'financial_advisor',
      name: 'María',
      specialty: 'Asesora Financiera',
      personality: {
        tone: 'professional',
        formality: 'formal',
        empathy: 8,
        patience: 7,
        assertiveness: 8,
      },
      expertise: ['payments', 'finances', 'contracts', 'commissions'],
      language: 'es',
    },
    technical_support: {
      id: 'technical_support',
      name: 'Diego',
      specialty: 'Soporte Técnico',
      personality: {
        tone: 'technical',
        formality: 'mixed',
        empathy: 6,
        patience: 9,
        assertiveness: 5,
      },
      expertise: ['technical', 'maintenance', 'system', 'troubleshooting'],
      language: 'es',
    },
    maintenance_specialist: {
      id: 'maintenance_specialist',
      name: 'Luis',
      specialty: 'Especialista en Mantenimiento',
      personality: {
        tone: 'empathetic',
        formality: 'casual',
        empathy: 9,
        patience: 8,
        assertiveness: 6,
      },
      expertise: ['maintenance', 'repairs', 'providers', 'emergency'],
      language: 'es',
    },
    broker_consultant: {
      id: 'broker_consultant',
      name: 'Valentina',
      specialty: 'Consultora de Corredores',
      personality: {
        tone: 'professional',
        formality: 'formal',
        empathy: 7,
        patience: 8,
        assertiveness: 8,
      },
      expertise: ['brokers', 'commissions', 'clients', 'market_trends'],
      language: 'es',
    },
    runner_coordinator: {
      id: 'runner_coordinator',
      name: 'Pedro',
      specialty: 'Coordinador Runner360',
      personality: {
        tone: 'friendly',
        formality: 'casual',
        empathy: 8,
        patience: 7,
        assertiveness: 7,
      },
      expertise: ['runner360', 'inspections', 'visits', 'photography'],
      language: 'es',
    },
    legal_expert: {
      id: 'legal_expert',
      name: 'Gabriela',
      specialty: 'Experta Legal',
      personality: {
        tone: 'professional',
        formality: 'formal',
        empathy: 6,
        patience: 9,
        assertiveness: 7,
      },
      expertise: ['legal', 'contracts', 'regulations', 'compliance'],
      language: 'es',
    },
  };

  // SISTEMA REVOLUCIONARIO: Base de aprendizaje continuo
  private continuousLearning: ContinuousLearningEngine;

  constructor() {
    this.sentimentAnalyzer = new SentimentAnalyzer();
    this.continuousLearning = new ContinuousLearningEngine();
    this.initializeAIProviders();
  }

  /**
   * Base de conocimiento expandida para respuestas contextuales
   */
  private knowledgeBase: Record<string, Record<string, any>> = {
    // Registro y autenticación
    register: {
      tenant: {
        responses: [
          'Como inquilino, puedes registrarte gratis en segundos. Solo necesitas email, datos básicos y verificar tu identidad. Una vez registrado, podrás buscar propiedades, contactar propietarios y corredores, y gestionar tus contratos.',
          'Para registrarte como inquilino: 1) Ve a "Crear cuenta" 2) Selecciona "Inquilino" 3) Completa nombre, email y teléfono 4) Verifica tu email 5) Sube documento de identidad. ¡Listo para buscar propiedades!',
        ],
        suggestions: ['Buscar propiedades', 'Ver corredores', 'Preparar documentos'],
        links: ['/properties/search', '/auth/register?role=tenant'],
      },
      owner: {
        responses: [
          'Como propietario, el registro incluye verificación de identidad y propiedades. Necesitarás: RUT, datos de contacto, información bancaria, y detalles de tus propiedades. Esto asegura confianza para inquilinos y corredores.',
          'Para propietarios: 1) Registro con RUT y datos personales 2) Verificación de identidad 3) Registro de propiedades con fotos y detalles 4) Configuración de pagos 5) Definir preferencias de arriendo. Todo verificado para máxima seguridad.',
        ],
        suggestions: ['Registrar propiedad', 'Configurar pagos', 'Ver corredores'],
        links: ['/owner/properties/new', '/auth/register?role=owner'],
      },
      broker: {
        responses: [
          'Los corredores necesitan certificación profesional válida. El registro incluye: certificación de corredor, datos comerciales, especialización, y verificación de antecedentes. Solo corredores certificados pueden publicar ofertas.',
          'Para corredores certificados: 1) Registro profesional 2) Subir certificación vigente 3) Completar perfil comercial 4) Verificación de antecedentes 5) Especialización (residencial/comercial). Es gratis comenzar.',
        ],
        suggestions: ['Ver propiedades', 'Contactar propietarios', 'Actualizar certificación'],
        links: ['/broker/properties', '/auth/register?role=broker'],
      },
      provider: {
        responses: [
          'Para ofrecer servicios de mantenimiento, jardinería, limpieza u otros servicios, necesitas: RUT o documento de identidad, verificación de antecedentes, certificaciones profesionales si aplican (plomero, electricista, etc.), y comprobante de experiencia. El registro es gratuito y te permite aparecer en búsquedas de propietarios.',
          'Documentos para proveedores de servicios: 1) Cédula de identidad/RUT 2) Certificaciones profesionales (si aplican) 3) Comprobante de experiencia laboral 4) Verificación de antecedentes. No necesitas certificación especial para comenzar, pero aumenta tu credibilidad.',
          'Como proveedor de servicios, puedes ofrecer: limpieza, mantenimiento, jardinería, seguridad, etc. El registro incluye verificación de experiencia y certificaciones. Apareces en búsquedas cuando propietarios necesitan servicios.',
          'Proveedores verificados: 1) Registro básico 2) Seleccionar servicios ofrecidos 3) Subir certificaciones 4) Definir precios y disponibilidad 5) Verificación de antecedentes. Gana dinero ofreciendo servicios a la comunidad.',
        ],
        suggestions: ['Ver requisitos completos', 'Comenzar registro', 'Contactar soporte'],
        links: ['/provider/services/new', '/auth/register?role=provider'],
      },
      guest: {
        responses: [
          '¡Perfecto! Sí, puedes ofrecer tus servicios en Rent360. Para registrarte como proveedor de servicios, necesitas: 1) Cédula de identidad (frente y reverso) 2) Certificado de antecedentes penales 3) Certificaciones profesionales si aplican (para electricistas, plomeros, etc.) 4) Comprobante de experiencia laboral (opcional pero recomendado). El registro es gratuito y una vez verificado, aparecerás en búsquedas cuando propietarios necesiten servicios. Puedes ganar dinero ofreciendo tus servicios a la comunidad.',
          '¡Claro que sí! Rent360 es una plataforma donde puedes ofrecer tus servicios profesionales (electricidad, plomería, jardinería, limpieza, mantenimiento, etc.) a propietarios que los necesiten. El proceso es simple: 1) Regístrate como proveedor 2) Sube tus documentos (cédula, antecedentes, certificaciones si las tienes) 3) Define qué servicios ofreces y en qué zonas 4) Establece tus precios 5) Una vez verificado, comenzarás a recibir solicitudes de trabajo. Los pagos son automáticos y seguros. ¿Quieres que te guíe paso a paso en el registro?',
          'Sí, definitivamente puedes ofrecer tus servicios en Rent360. Es una excelente oportunidad para generar ingresos trabajando con propietarios que necesitan servicios profesionales. El registro es gratuito y el proceso es rápido. Una vez verificado, aparecerás en búsquedas y podrás recibir solicitudes de trabajo directamente. Los pagos son automáticos y la plataforma retiene una pequeña comisión (generalmente 8%) por cada trabajo completado. ¿Te gustaría saber más sobre cómo funciona o prefieres comenzar el registro ahora?',
        ],
        suggestions: [
          'Comenzar registro como proveedor',
          'Ver requisitos completos',
          'Contactar soporte',
        ],
        links: ['/auth/register?role=provider', '/help', '/contact'],
      },
    },

    // Búsqueda y visualización de propiedades
    property_search: {
      tenant: {
        responses: [
          'Puedes buscar propiedades por: ubicación, precio, habitaciones, baños, tipo (casa/departamento/oficina), amenities. Usa filtros avanzados y guarda búsquedas. Los corredores y propietarios responden rápido a consultas serias.',
          'Búsqueda inteligente: filtra por zona, presupuesto, características. Contacta directamente propietarios o usa corredores certificados. Runner360 puede hacer visitas presenciales con fotos y videos profesionales.',
        ],
        suggestions: ['Aplicar filtros', 'Contactar corredor', 'Agendar visita'],
        links: ['/properties/search', '/properties/filters'],
      },
      broker: {
        responses: [
          'Como corredor, accedes a propiedades exclusivas y listas privadas. Puedes: publicar ofertas de clientes, buscar propiedades para tus clientes, coordinar visitas con Runner360, gestionar contratos, recibir comisiones automáticas.',
          'Ventajas para corredores: propiedades exclusivas, comisiones garantizadas, contratos digitales, seguimiento automático de pagos, reportes de rendimiento, soporte 24/7.',
        ],
        suggestions: ['Ver propiedades exclusivas', 'Publicar oferta', 'Gestionar contratos'],
        links: ['/broker/properties', '/broker/clients'],
      },
    },

    // Contratos y legales
    contracts: {
      tenant: {
        responses: [
          'Todos los contratos son digitales, legales y seguros con firma TrustFactory. Incluyen: datos completos, cláusulas estándar, firmas electrónicas válidas, almacenamiento seguro, acceso 24/7. Son igual de válidos que contratos en papel.',
          'Contratos digitales: 1) Firma desde cualquier dispositivo 2) Validez legal completa 3) Almacenamiento seguro 4) Copia automática para ambas partes 5) Recordatorios de vencimiento. Más seguro y conveniente que contratos tradicionales.',
        ],
        suggestions: ['Ver mis contratos', 'Firmar contrato', 'Descargar PDF'],
        links: ['/tenant/contracts', '/signatures'],
      },
      owner: {
        responses: [
          'Gestiona contratos digitales con inquilinos y corredores. Incluye: plantillas legales actualizadas, firmas electrónicas válidas, seguimiento automático de pagos, recordatorios de renovación, reportes financieros.',
          'Sistema completo de contratos: generación automática, firmas legales, pagos integrados, renovaciones automáticas, reportes de ingresos, alertas de vencimiento. Todo digital y seguro.',
        ],
        suggestions: ['Crear contrato', 'Ver activos', 'Configurar renovaciones'],
        links: ['/owner/contracts', '/owner/contracts/new'],
      },
    },

    // Pagos y finanzas
    payments: {
      tenant: {
        responses: [
          'Pagos seguros con Khipu: débito automático, recordatorios, recibos digitales. Puedes configurar pago mensual automático, recibir alertas de vencimiento, ver historial completo, y cambiar método de pago cuando quieras.',
          'Sistema de pagos inteligente: 1) Configura débito automático 2) Recibe recordatorios 3) Paga desde app 4) Recibos instantáneos 5) Cambia método fácilmente. Nunca pierdas un pago.',
        ],
        suggestions: ['Configurar débito', 'Ver historial', 'Cambiar método'],
        links: ['/tenant/payments', '/tenant/payments/methods'],
      },
      owner: {
        responses: [
          'Recibes pagos automáticamente el día 5 de cada mes. Sin intermediarios: Khipu transfiere directamente a tu cuenta. Puedes ver reportes detallados, configurar recordatorios para inquilinos, cambiar datos bancarios, y gestionar pagos pendientes.',
          'Gestión financiera completa: pagos automáticos, reportes mensuales, alertas de mora, integración bancaria, múltiples métodos de pago, análisis de ingresos. Todo sin comisiones ocultas.',
        ],
        suggestions: ['Ver ingresos', 'Configurar cuenta', 'Enviar recordatorios'],
        links: ['/owner/payments', '/owner/payments/reports'],
      },
    },

    // Runner360 y visitas
    runner360: {
      tenant: {
        responses: [
          'Runner360 hace visitas presenciales profesionales: fotos de calidad, videos detallados, reportes completos, medición exacta, verificación de estado. Pagan ellos, tú solo eliges la mejor propiedad.',
          'Visitas profesionales: 1) Runner360 verifica propiedades 2) Fotos y videos HD 3) Reportes detallados 4) Medidas exactas 5) Verificación de servicios. Todo gratis para inquilinos, pago por propietarios.',
        ],
        suggestions: ['Agendar visita', 'Ver reportes', 'Comparar propiedades'],
        links: ['/properties/search', '/runner'],
      },
      owner: {
        responses: [
          'Runner360 acelera tus arriendos: visitas profesionales, reportes detallados, más confianza para inquilinos, reducción de tiempo de vacancia. Tú pagas solo por visitas realizadas, precio justo por resultados.',
          'Beneficios Runner360: visitas profesionales, fotos/vídeos de calidad, reportes completos, más interés de inquilinos, arriendos más rápidos, reducción de costos de publicidad.',
        ],
        suggestions: ['Agendar visitas', 'Ver reportes', 'Configurar precios'],
        links: ['/owner/properties', '/runner'],
      },
      broker: {
        responses: [
          'Coordina visitas profesionales con Runner360: integrada en tu flujo de trabajo, reportes automáticos, fotos profesionales, reducción de tiempo en terreno. Tus clientes obtienen mejor servicio, tú cierras más arriendos.',
          'Herramientas para corredores: integración Runner360, coordinación automática de visitas, reportes profesionales, reducción de tiempo de respuesta, mejor satisfacción de clientes.',
        ],
        suggestions: ['Coordinar visitas', 'Ver reportes', 'Configurar agenda'],
        links: ['/broker/appointments', '/runner'],
      },
      runner: {
        responses: [
          'Como Runner360 ganas dinero flexiblemente: cobra por visita completada, horarios flexibles, zona que elijas, soporte completo. Promedio $15.000-25.000 por visita según zona. Sin inversión inicial.',
          'Oportunidades Runner360: ingresos flexibles, trabajo independiente, zonas preferidas, soporte 24/7, pagos semanales, crecimiento ilimitado. Sé parte de la red de confianza de arriendos.',
        ],
        suggestions: ['Ver oportunidades', 'Configurar perfil', 'Ver ganancias'],
        links: ['/runner/dashboard', '/auth/register?role=runner'],
      },
    },

    // Mantenimiento y reparaciones
    maintenance: {
      tenant: {
        responses: [
          'Para problemas de mantenimiento: 1) Reporta desde tu panel 2) Sube fotos/videos 3) Sistema asigna proveedor automáticamente 4) Seguimiento en tiempo real 5) Pagos seguros. Todo coordinado y garantizado.',
          'Servicio de mantenimiento completo: reporta problemas fácilmente, proveedores verificados, seguimiento automático, garantía de trabajo, pagos seguros. No más dolores de cabeza con reparaciones.',
        ],
        suggestions: ['Reportar problema', 'Ver solicitudes', 'Calificar servicio'],
        links: ['/tenant/maintenance', '/tenant/maintenance/new'],
      },
      owner: {
        responses: [
          'Sistema completo de mantenimiento: proveedores verificados, precios competitivos, seguimiento automático, garantía de trabajos, reportes de gastos. Mantén tus propiedades en perfectas condiciones.',
          'Gestión de mantenimiento: red de proveedores verificados, presupuestos automáticos, aprobación de trabajos, seguimiento GPS, reportes detallados, control de costos.',
        ],
        suggestions: ['Ver solicitudes', 'Aprobar presupuestos', 'Ver reportes'],
        links: ['/owner/maintenance', '/owner/maintenance/reports'],
      },
    },

    // Seguridad y verificación
    security: {
      general: {
        responses: [
          'Seguridad total en Rent360: verificación de identidad completa, validación de documentos, contratos legales, pagos seguros, antecedentes verificados. Toda la información está encriptada y protegida.',
          'Sistema de seguridad multi-capa: verificación de usuarios, contratos digitales legales, pagos con Khipu, encriptación de datos, monitoreo 24/7, cumplimiento legal chileno.',
        ],
        suggestions: ['Verificar cuenta', 'Actualizar documentos', 'Configurar seguridad'],
        links: ['/settings/security', '/verification'],
      },
    },

    // Casos legales y procesos jurídicos
    legal_cases: {
      tenant: {
        responses: [
          'Como inquilino, si enfrentas problemas legales relacionados con tu contrato de arriendo, puedes: 1) Revisar tu contrato digital, 2) Contactar al propietario o corredor directamente, 3) Si hay mora injustificada, puedes iniciar un proceso de mediación o demanda por vicios ocultos. Recuerda que según la Ley 18.101, tienes derechos específicos de protección.',
          'Para casos legales como inquilino: puedes reportar problemas de habitabilidad, reclamar por vicios ocultos, o defenderte de demandas de desahucio. Te recomiendo consultar la documentación legal en tu panel o contactar a un abogado especializado en derecho habitacional.',
        ],
        suggestions: [
          'Ver mi contrato',
          'Contactar propietario',
          'Buscar abogado',
          'Ver derechos inquilino',
        ],
        links: ['/tenant/contracts', '/tenant/disputes', '/help/legal'],
      },
      owner: {
        responses: [
          'Como propietario, puedes iniciar casos legales por mora en pagos siguiendo estos pasos: 1) Verifica que el inquilino tenga más de 30 días de atraso, 2) Crea un caso legal en el sistema especificando "Mora en pagos", 3) El sistema generará automáticamente la notificación extrajudicial, 4) Si no hay respuesta en 10 días, puedes proceder a demanda judicial.',
          'Proceso completo para casos por mora: 1) Detección automática de impagos, 2) Notificación extrajudicial automática, 3) Procedimiento monitorio si supera $500.000, 4) Ejecución de garantías, 5) Lanzamiento si es necesario. Todo gestionado desde tu dashboard con asistencia legal integrada.',
        ],
        suggestions: [
          'Crear caso legal',
          'Ver casos activos',
          'Configurar alertas',
          'Calcular intereses',
        ],
        links: ['/owner/legal-cases', '/owner/contracts', '/owner/legal-cases/new'],
        actions: ['Iniciar caso por mora', 'Ver estado de cobranzas', 'Contactar abogado'],
      },
      broker: {
        responses: [
          'Como corredor, puedes gestionar casos legales por cuenta de tus clientes propietarios: 1) Accede a "Casos Legales" en tu panel, 2) Crea un nuevo caso especificando el tipo (mora, daños, ocupación ilegal), 3) El sistema guía automáticamente por las fases legales, 4) Puedes coordinar con abogados y tribunales.',
          'Gestión legal para corredores: casos por mora con cálculo automático de intereses, notificaciones extrajudiciales, seguimiento judicial, y comisiones por recuperación de deudas. Todo integrado con tu flujo de trabajo habitual.',
        ],
        suggestions: [
          'Ver casos legales',
          'Crear nuevo caso',
          'Gestionar clientes',
          'Ver comisiones',
        ],
        links: ['/broker/legal-cases', '/broker/clients', '/broker/legal-cases/new'],
      },
    },

    // Mora en pagos específicamente
    payment_default: {
      tenant: {
        responses: [
          'Si tienes atrasos en pagos, puedes: 1) Configurar pagos automáticos para evitar futuras moras, 2) Negociar planes de pago con tu propietario, 3) Si la mora es por problemas del propietario, puedes retener pagos legalmente (artículo 21 de la Ley 18.101).',
          'Para problemas de mora: revisa las fechas de vencimiento en tu contrato, configura recordatorios automáticos, y si hay dificultades económicas temporales, contacta a tu propietario para acordar un plan de pagos. La ley te protege contra desalojos inmediatos.',
        ],
        suggestions: [
          'Configurar pagos automáticos',
          'Ver historial de pagos',
          'Contactar propietario',
          'Negociar plan de pagos',
        ],
        links: ['/tenant/payments', '/tenant/contracts', '/tenant/disputes'],
      },
      owner: {
        responses: [
          'Para iniciar proceso legal por mora en pagos: 1) Verifica que el atraso supere 30 días, 2) Crea caso legal en el sistema con tipo "Mora en pagos", 3) El sistema calcula automáticamente intereses (3% mensual según ley chilena), 4) Genera notificación extrajudicial automática.',
          'Pasos detallados para mora: 1) Confirmar impago >30 días, 2) Crear caso con monto exacto adeudado, 3) Notificación extrajudicial (10 días de plazo), 4) Si no pago: demanda monitoria si >$500.000 o juicio ordinario, 5) Ejecución con retención de garantías.',
          'Información clave sobre mora: - Intereses legales: 3% mensual (Art. 47 Ley 18.101), - Plazo notificación: 10 días hábiles, - Procedimiento monitorio: para deudas >$500.000, - Gastos legales: recuperables del deudor, - Garantías: pueden aplicarse parcialmente.',
        ],
        suggestions: [
          'Crear caso por mora',
          'Calcular intereses',
          'Generar notificación',
          'Ver garantías disponibles',
        ],
        links: ['/owner/legal-cases', '/owner/payments', '/owner/legal-cases/new'],
        actions: ['Iniciar proceso legal', 'Calcular monto total', 'Enviar notificación'],
      },
      broker: {
        responses: [
          'Como corredor, para casos de mora: 1) Crea el caso legal en nombre del propietario, 2) Especifica tipo "Mora en pagos" con monto exacto, 3) El sistema maneja automáticamente intereses y notificaciones, 4) Coordina con propietario y abogado si es necesario.',
          'Proceso de mora para corredores: - Crear caso con datos del contrato, - Sistema calcula intereses automáticamente, - Notificación extrajudicial programada, - Seguimiento de respuestas, - Coordinación con tribunales si escala.',
        ],
        suggestions: [
          'Crear caso legal',
          'Ver contratos morosos',
          'Coordinar con propietario',
          'Gestionar abogados',
        ],
        links: ['/broker/legal-cases', '/broker/contracts', '/broker/legal-cases/new'],
      },
    },

    // Información legal chilena específica
    legal_info: {
      general: {
        responses: [
          'El sistema Rent360 está diseñado conforme a la legislación chilena, específicamente la **Ley N° 21.461 "Devuélveme Mi Casa"** y la **Ley N° 18.101 de Arrendamientos Urbanos**. Puedo explicarte cómo aplicar estas leyes en casos concretos de mora, desahucio, o disputas contractuales.',
          'Información legal específica de Chile: - **Ley 18.101**: Regula arrendamientos urbanos, intereses por mora (3% mensual), plazos de notificación, garantías. - **Ley 21.461**: Protege derechos de inquilinos contra desalojos irregulares. - **Código Civil**: Aplica para contratos y obligaciones.',
        ],
        suggestions: [
          'Ley de arrendamientos',
          'Intereses por mora',
          'Derechos inquilinos',
          'Proceso desahucio',
        ],
        links: ['/legal-info', '/ley-18101', '/ley-21461', '/derechos-inquilinos'],
      },
    },

    // Navegación y uso del sistema (AMPLIADO)
    navigation: {
      tenant: {
        responses: [
          'Como inquilino, tu panel tiene estas secciones: **Dashboard** (resumen general), **Búsqueda Avanzada** (encuentra propiedades con filtros), **Mis Contratos** (documentos legales y firmas), **Mis Pagos** (renta, métodos, historial), **Mantenimiento** (reportar problemas y seguimiento), **Servicios de Corredores** (solicitar ayuda), **Mensajes** (comunicación con propietarios/corredores), **Calificaciones** (valorar servicios), **Disputas** (reportar problemas), **Mis Tickets** (soporte), **Reportes** (estadísticas de mantenimiento), y **Configuración** (perfil y preferencias).',
          'Navegación completa: Usa la barra lateral izquierda para acceder a todas las funciones. El dashboard muestra resumen de contratos activos, pagos pendientes, solicitudes de mantenimiento, y notificaciones importantes. Cada sección tiene herramientas específicas para gestionar tu experiencia de arriendo.',
        ],
        suggestions: [
          'Ver dashboard',
          'Buscar propiedades',
          'Ver contratos',
          'Realizar pago',
          'Solicitar mantenimiento',
          'Contactar corredor',
        ],
        links: [
          '/tenant/dashboard',
          '/tenant/advanced-search',
          '/tenant/contracts',
          '/tenant/payments',
          '/tenant/maintenance',
          '/tenant/broker-services',
        ],
      },
      owner: {
        responses: [
          'Como propietario, gestionas: **Dashboard** (resumen completo), **Mis Propiedades** (tus inmuebles con detalles), **Mis Inquilinos** (arrendatarios y su historial), **Servicios de Corredores** (delegar gestión), **Runners** (visitas profesionales), **Contratos** (documentos legales y firmas), **Casos Legales** (mora y desahucios), **Pagos** (ingresos y recordatorios), **Recordatorios** (notificaciones de pago), **Mantenimiento** (reparaciones y proveedores), **Mensajes** (comunicación), **Calificaciones** (feedback), **Reportes** (financieros y estadísticas), **Analytics** (métricas y comparaciones), y **Configuración** (perfil y preferencias).',
          'Panel completo de propietario: Dashboard con ingresos mensuales, contratos activos, pagos pendientes, casos legales, y métricas clave. Cada sección tiene herramientas avanzadas: comparación de propiedades, análisis de mercado, gestión de corredores, y más. Todo diseñado para maximizar tus ingresos y simplificar la gestión.',
        ],
        suggestions: [
          'Ver propiedades',
          'Gestionar contratos',
          'Ver ingresos',
          'Casos legales',
          'Usar corredores',
          'Ver analytics',
          'Comparar propiedades',
        ],
        links: [
          '/owner/dashboard',
          '/owner/properties',
          '/owner/contracts',
          '/owner/payments',
          '/owner/broker-services',
          '/owner/analytics',
          '/owner/property-comparison',
        ],
      },
      broker: {
        responses: [
          'Como corredor, administras: **Dashboard** (resumen comercial), **Propiedades** (ofertas y gestión), **Clientes** (todos, potenciales, activos), **Captación de Clientes** (descubrir leads), **Potenciales** (prospects y pipeline), **Citas** (visitas programadas), **Contratos** (cierres y firmas), **Casos Legales** (apoyo a clientes), **Disputas** (resolución de conflictos), **Mantenimiento** (coordinación), **Comisiones** (ganancias y pagos), **Mensajes** (comunicación), **Reportes** (rendimiento), **Analytics** (métricas y análisis de mercado), **Calificaciones** (reputación), y **Configuración** (perfil y alertas).',
          'Herramientas completas de corredor: Sistema CRM completo con gestión de prospects, conversión a clientes, pipeline de ventas, compartir propiedades rastreables, actividades y follow-ups, gestión de propiedades (completa/parcial), comisiones automáticas, analytics avanzados, y más. Todo diseñado para maximizar tus cierres y comisiones.',
        ],
        suggestions: [
          'Ver propiedades',
          'Gestionar clientes',
          'Gestionar prospects',
          'Programar citas',
          'Ver comisiones',
          'Ver analytics',
          'Descubrir clientes',
        ],
        links: [
          '/broker/dashboard',
          '/broker/properties',
          '/broker/clients',
          '/broker/prospects',
          '/broker/appointments',
          '/broker/commissions',
          '/broker/analytics',
          '/broker/discover',
        ],
      },
      provider: {
        responses: [
          'Como proveedor de servicios (FUENTE DE TRABAJO), manejas: **Dashboard** (resumen de trabajos), **Trabajos** (disponibles y asignados), **Servicios** (configurar ofertas), **Clientes** (historial), **Calendario** (horarios y disponibilidad), **Ganancias** (pagos y transacciones), **Estadísticas** (rendimiento), **Calificaciones** (reputación), **Documentos** (verificación), **Mensajes** (comunicación), y **Configuración** (perfil, cuenta bancaria, zona de cobertura).',
          'Plataforma completa de trabajo: Recibe trabajos automáticamente según tus servicios y zona, acepta trabajos que te interesen, coordina con clientes, completa trabajos con evidencia fotográfica, recibe pagos automáticos en tu cuenta bancaria (después de comisión de plataforma), construye reputación con calificaciones, y accede a estadísticas para optimizar tu estrategia. Todo diseñado para maximizar tus oportunidades de trabajo.',
        ],
        suggestions: [
          'Ver trabajos disponibles',
          'Aceptar trabajos',
          'Configurar servicios',
          'Ver ganancias',
          'Configurar cuenta bancaria',
          'Mejorar calificaciones',
          'Ver estadísticas',
        ],
        links: [
          '/provider/dashboard',
          '/provider/jobs',
          '/provider/services',
          '/provider/earnings',
          '/provider/settings',
          '/provider/ratings',
        ],
      },
      runner: {
        responses: [
          'Como Runner360 (FUENTE DE TRABAJO), controlas: **Dashboard** (resumen de tareas), **Tareas** (disponibles y asignadas), **Visitas** (programadas y completadas), **Fotos** (galería de trabajos), **Clientes** (historial), **Horario** (disponibilidad), **Ganancias** (pagos por visita e incentivos), **Incentivos** (bonos por rendimiento), **Mensajes** (comunicación), **Reportes** (rendimiento y estadísticas), **Calificaciones** (reputación), **Perfil** (configuración), y **Configuración** (zona de trabajo, cuenta bancaria).',
          'Sistema completo Runner360: Recibe tareas automáticamente según tu zona, acepta visitas que puedas completar, haz visitas profesionales con fotos y reportes detallados, cobra $15.000-25.000 por visita completada, gana incentivos por volumen y calidad (Super Runner, Top Earner, Perfectionist), administra tu disponibilidad, y construye tu reputación. Todo diseñado para maximizar tus ingresos como trabajo flexible.',
        ],
        suggestions: [
          'Ver tareas disponibles',
          'Aceptar visitas',
          'Completar visitas',
          'Subir fotos',
          'Ver ganancias',
          'Ver incentivos',
          'Mejorar calificación',
          'Ver rendimiento',
        ],
        links: [
          '/runner/dashboard',
          '/runner/tasks',
          '/runner/visits',
          '/runner/photos',
          '/runner/earnings',
          '/runner/incentives',
          '/runner/reports/performance',
        ],
      },
    },

    // Preguntas "cómo hacer" específicas
    how_to: {
      tenant: {
        responses: [
          '**Cómo buscar propiedades:** Ve a "Buscar Propiedades", aplica filtros por zona, precio, habitaciones. Contacta directamente propietarios o corredores. Runner360 puede hacer visitas por ti.',
          '**Cómo pagar la renta:** En "Pagos" configura débito automático o paga online con Khipu. Recibes recordatorios automáticos y comprobantes digitales.',
          '**Cómo reportar problemas:** En "Mantenimiento" crea un ticket con fotos/videos. El sistema asigna automáticamente el proveedor más cercano.',
          '**Cómo calificar servicios:** Después de cada servicio completado, accede a "Calificaciones" para evaluar proveedores y propietarios.',
        ],
        suggestions: [
          'Buscar propiedades',
          'Configurar pagos',
          'Reportar mantenimiento',
          'Dejar calificación',
        ],
      },
      owner: {
        responses: [
          '**Cómo publicar propiedades:** Ve a "Mis Propiedades" → "Agregar Propiedad". Sube fotos, detalla características, establece precio. Los corredores podrán promocionarla.',
          '**Cómo cobrar rentas:** Configura pagos automáticos en "Pagos". El sistema envía recordatorios y procesa cobros. Khipu transfiere directamente a tu cuenta.',
          '**Cómo gestionar mantenimiento:** En "Mantenimiento" recibe solicitudes de inquilinos, aprueba presupuestos, supervisa trabajos, paga automáticamente.',
          '**Cómo ver reportes:** Accede a "Analytics" para ingresos mensuales, ocupación de propiedades, rendimiento de corredores, y métricas financieras.',
        ],
        suggestions: [
          'Publicar propiedad',
          'Configurar cobros',
          'Gestionar mantenimiento',
          'Ver reportes',
        ],
      },
      broker: {
        responses: [
          '**Cómo publicar ofertas:** En "Propiedades" → "Nueva Propiedad". Completa detalles, sube fotos profesionales, establece comisiones. Aparecerá en búsquedas de inquilinos.',
          '**Cómo gestionar clientes:** Usa "Clientes" para organizar prospectos y clientes activos. Programa citas, envía propuestas, cierra contratos.',
          '**Cómo coordinar visitas:** En "Citas" programa inspecciones con Runner360. El sistema genera reportes automáticos con fotos y videos.',
          '**Cómo cobrar comisiones:** Las comisiones se calculan automáticamente al cerrar contratos. Ve a "Comisiones" para ver pagos pendientes y transferencias.',
        ],
        suggestions: [
          'Publicar propiedad',
          'Gestionar clientes',
          'Programar visitas',
          'Ver comisiones',
        ],
      },
      provider: {
        responses: [
          '**Cómo recibir trabajos:** Mantén tu perfil actualizado con servicios ofrecidos y zona de cobertura. Los trabajos llegan automáticamente por email y notificaciones.',
          '**Cómo gestionar trabajos:** En "Trabajos" acepta solicitudes, coordina horarios con clientes, actualiza estado del trabajo, sube evidencia fotográfica.',
          '**Cómo cobrar servicios:** Los pagos se procesan automáticamente al completar trabajos. Ve a "Ganancias" para ver transferencias pendientes.',
          '**Cómo mejorar calificaciones:** Entrega trabajos de calidad, responde rápido, comunica bien con clientes. Las buenas calificaciones atraen más trabajo.',
        ],
        suggestions: [
          'Actualizar perfil',
          'Gestionar trabajos',
          'Ver ganancias',
          'Mejorar calificaciones',
        ],
      },
      runner: {
        responses: [
          '**Cómo aceptar tareas:** En "Tareas" revisa inspecciones disponibles. Acepta las que puedas completar en tu zona y horario.',
          '**Cómo hacer inspecciones:** Ve a la propiedad indicada, toma mínimo 15 fotos profesionales (exterior, interior, detalles), mide ambientes, verifica servicios.',
          '**Cómo subir reportes:** Después de la visita, sube fotos y completa el formulario con medidas, estado de la propiedad y observaciones.',
          '**Cómo ganar más:** Completa más visitas semanales, mantén alta calidad en fotos, responde rápido a solicitudes. Los incentivos se activan automáticamente.',
        ],
        suggestions: [
          'Ver tareas disponibles',
          'Hacer inspección',
          'Subir reporte',
          'Ver incentivos',
        ],
      },
    },

    // Soporte y ayuda
    support: {
      general: {
        responses: [
          '¿Necesitas ayuda? Estoy aquí 24/7. Puedo ayudarte con: registro, propiedades, contratos, pagos, casos legales, Runner360, mantenimiento, seguridad, y cualquier proceso de la plataforma. También puedes contactar soporte humano.',
          'Centro de ayuda completo: documentación detallada, tutoriales paso a paso, soporte por chat, teléfono y email, comunidad de usuarios, base de conocimientos actualizada. Para consultas legales específicas, te recomiendo consultar un abogado.',
        ],
        suggestions: ['Buscar en ayuda', 'Contactar soporte', 'Ver tutoriales', 'Casos legales'],
        links: ['/help', '/support', '/contact', '/legal-help'],
      },
    },

    // Documentos y visibilidad (NUEVO)
    documents_visibility: {
      provider: {
        responses: [
          '**Visibilidad de tus documentos como proveedor:**\n\nTus documentos personales (cédula, antecedentes, certificaciones) son **PRIVADOS** y solo los ve el equipo administrativo de Rent360 para verificación.\n\nSin embargo, cuando tus documentos son **aprobados y verificados** por el administrador, los clientes pueden ver únicamente los documentos aprobados en tu perfil público (como certificado de empresa, certificaciones profesionales verificadas). Esto aumenta la confianza de los clientes.\n\n**Documentos privados (solo admin):**\n- Cédula de identidad completa\n- Antecedentes penales\n- Documentos en proceso de verificación\n\n**Documentos públicos (clientes pueden ver):**\n- Solo documentos aprobados y verificados por el administrador\n- Certificado de empresa (si aplica)\n- Certificaciones profesionales verificadas\n\nPuedes verificar qué documentos están visibles en tu perfil público desde la sección "Configuración" → "Documentos".',
          'Como proveedor de servicios, tus documentos tienen diferentes niveles de visibilidad:\n\n🔒 **Documentos privados:** Solo el equipo administrativo de Rent360 puede ver tus documentos personales durante el proceso de verificación. Esto incluye tu cédula completa y antecedentes penales.\n\n✅ **Documentos aprobados visibles:** Una vez que el administrador aprueba y verifica tus documentos, los clientes pueden ver únicamente los documentos aprobados en tu perfil público. Esto ayuda a generar confianza.\n\n📋 **Para verificar tu estado:** Ve a "Configuración" → "Documentos" para ver qué documentos están aprobados y visibles para clientes.',
        ],
        suggestions: ['Ver mis documentos', 'Configuración de privacidad', 'Contactar soporte'],
        links: ['/provider/settings', '/provider/profile'],
      },
      general: {
        responses: [
          'La visibilidad de documentos depende de tu rol:\n\n**Proveedores:** Solo documentos aprobados por el administrador son visibles para clientes. Documentos personales son privados.\n\n**Propietarios:** Información de propiedades es visible para inquilinos y corredores según configuración.\n\n**Inquilinos:** Información personal es privada, solo compartida con propietarios y corredores cuando hay contratos activos.',
        ],
        suggestions: ['Ver configuración de privacidad', 'Contactar soporte'],
        links: ['/settings', '/support'],
      },
    },

    // Documentos de proveedores (NUEVO)
    provider_documents: {
      provider: {
        responses: [
          '**Documentos requeridos para proveedores de servicios:**\n\n1. **Cédula de Identidad** (frente y reverso)\n2. **Certificado de Antecedentes** (vigente)\n3. **Certificado de Empresa** (si aplica para servicios comerciales)\n4. **Certificaciones profesionales** (plomero, electricista, etc. si aplica)\n\n**Proceso de verificación:**\n- Sube tus documentos desde "Configuración" → "Documentos"\n- El equipo administrativo revisa y verifica\n- Una vez aprobados, los documentos verificados son visibles para clientes\n- Esto aumenta tu credibilidad y atrae más trabajos\n\n**Importante:** Los documentos personales (cédula completa, antecedentes) son privados. Solo documentos aprobados son visibles para clientes.',
          'Para registrarte como proveedor necesitas:\n\n📄 **Documentos obligatorios:**\n- Cédula de identidad (ambos lados)\n- Certificado de antecedentes penales\n\n📋 **Documentos opcionales pero recomendados:**\n- Certificado de empresa (si tienes empresa)\n- Certificaciones profesionales (plomero, electricista, etc.)\n- Comprobante de experiencia laboral\n\nUna vez que subas tus documentos, el equipo administrativo los revisará. Cuando sean aprobados, los documentos verificados aparecerán en tu perfil público para que los clientes puedan verlos y confiar en ti.',
        ],
        suggestions: ['Subir documentos', 'Ver estado de verificación', 'Configuración'],
        links: ['/provider/settings', '/provider/profile'],
      },
      guest: {
        responses: [
          '**Documentos requeridos para proveedores de servicios en Rent360:**\n\nPara ofrecer servicios (mantenimiento, jardinería, plomería, electricidad, limpieza, etc.) necesitas:\n\n1. **Cédula de Identidad** (frente y reverso)\n2. **Certificado de Antecedentes Penales** (vigente)\n3. **Certificado de Empresa** (opcional, si tienes empresa registrada)\n4. **Certificaciones profesionales** (opcional pero recomendado, ej: certificado de plomero, electricista)\n\n**Proceso:**\n1. Regístrate como proveedor\n2. Sube tus documentos\n3. El equipo administrativo verifica\n4. Una vez aprobados, puedes recibir trabajos\n\n**Visibilidad:** Solo documentos aprobados por el administrador son visibles para clientes potenciales. Esto genera confianza.',
        ],
        suggestions: [
          'Registrarse como proveedor',
          'Ver requisitos completos',
          'Contactar soporte',
        ],
        links: ['/auth/register?role=provider', '/help'],
      },
    },

    // Información de comisiones (NUEVO)
    commission_info: {
      general: {
        responses: [
          '**Porcentajes de comisión en Rent360:**\n\n📊 **Corredores:** El porcentaje de comisión es configurable por el administrador y puede variar según el tipo de propiedad y valor. Generalmente oscila entre 3% y 5% del valor del contrato.\n\n🔧 **Proveedores de servicios:** La plataforma retiene un porcentaje configurable (generalmente 8%) del monto del servicio. El resto se deposita al proveedor.\n\n🏃 **Runners (Runner360):** Comisión variable según tipo de visita y zona. Se calcula automáticamente por cada visita completada.\n\n**Nota:** Los porcentajes exactos pueden variar y son configurados por el administrador. Puedes ver tus comisiones específicas en tu panel de usuario.',
        ],
        suggestions: ['Ver mis comisiones', 'Contactar administrador', 'Ver configuración'],
        links: ['/broker/commissions', '/provider/earnings', '/runner/earnings'],
      },
      broker: {
        responses: [
          '**Comisiones para corredores:**\n\nEl porcentaje de comisión se calcula automáticamente según:\n- Tipo de propiedad (departamento, casa, oficina, local)\n- Valor de la propiedad\n- Tipo de contrato\n\nLos porcentajes son configurables por el administrador y generalmente oscilan entre 3% y 5%. Puedes ver el desglose completo de tus comisiones en la sección "Comisiones" de tu panel.',
        ],
        suggestions: ['Ver mis comisiones', 'Ver reportes', 'Contactar administrador'],
        links: ['/broker/commissions', '/broker/reports'],
      },
      provider: {
        responses: [
          '**Comisiones para proveedores de servicios:**\n\nLa plataforma retiene un porcentaje configurable (generalmente 8%) del monto total del servicio como comisión. El resto se deposita directamente en tu cuenta bancaria registrada.\n\n**Ejemplo:** Si completas un trabajo de $100.000:\n- Comisión de plataforma (8%): $8.000\n- Tu pago neto: $92.000\n\nEl porcentaje exacto puede variar según configuración del administrador. Puedes ver el desglose completo en "Ganancias" → "Transacciones".',
        ],
        suggestions: ['Ver mis ganancias', 'Ver transacciones', 'Configurar cuenta bancaria'],
        links: ['/provider/earnings', '/provider/transactions', '/provider/payments/configure'],
      },
      guest: {
        responses: [
          '**Porcentajes de comisión en Rent360:**\n\n- **Corredores:** Entre 3% y 5% del valor del contrato (configurable)\n- **Proveedores de servicios:** Generalmente 8% del monto del servicio\n- **Runners:** Variable según tipo de visita\n\nLos porcentajes exactos son configurables por el administrador y pueden variar. Para información específica sobre comisiones, contacta al soporte o consulta la documentación oficial.',
        ],
        suggestions: ['Registrarse', 'Ver documentación', 'Contactar soporte'],
        links: ['/auth/register', '/help', '/contact'],
      },
    },
  };

  /**
   * Sistema avanzado de reconocimiento de intenciones
   */
  private recognizeIntent(
    message: string,
    userRole: string,
    context: string[] = []
  ): IntentRecognition {
    // Normalizar texto para mejor detección
    const normalizedText = this.normalizeText(message);
    const expandedText = this.expandSynonyms(normalizedText);
    const text = expandedText.toLowerCase().trim();

    // Patrones avanzados de intención con pesos y contexto
    const intentPatterns = [
      {
        intent: 'register',
        patterns: [
          /(?:como|dónde|quiero|necesito)\s+(?:registrarme|crear cuenta|darme de alta)/,
          /(?:registro|registrar|unirme|empezar)/,
          /(?:ser|convertirme en|quiero ser)\s+(?:propietario|inquilino|corredor|proveedor|runner)/,
          /(?:soy|trabajo como|me dedico a)\s+(?:jardinero|plomero|electricista|electrico|gasfiter|limpieza|seguridad|mantenimiento|pintor|carpintero)/,
          /(?:puedo|podría|quiero)\s+(?:publicar|ofrecer|prestar)\s+(?:mis\s+)?servicios/,
          /(?:soy|trabajo como|me dedico a)\s+(?:jardinero|plomero|electricista|electrico|gasfiter|limpieza|seguridad|mantenimiento|pintor|carpintero).*?(?:puedo|podría|quiero)\s+(?:ofrecer|prestar|publicar)/i,
          /(?:como|dónde)\s+(?:ofrecer|brindar|dar)\s+(?:servicios|mantenimiento|trabajo)/,
          /(?:como|dónde)\s+(?:creo|crear|registrar|darme de alta)\s+(?:una\s+)?(?:cuenta|perfil)/,
          /(?:cuenta|perfil|registro)\s+(?:para|de)\s+(?:ofrecer|brindar|dar)\s+servicios/,
          /(?:para|necesito|debo tener|requiero)\s+(?:documento|certificación|certificado|licencia|registro)/,
          /(?:qué|cuáles)\s+(?:documentos|requisitos|certificaciones)\s+(?:necesito|requiero|debo)/,
          /(?:ofrecer|dar|prestar)\s+(?:servicios|mantenimiento)\s+(?:debo|necesito|requiero)/,
          // Patrones mejorados para detectar proveedores de servicios específicos
          /(?:soy|trabajo como|me dedico a)\s+(?:electricista|electrico|plomero|gasfiter|jardinero|limpieza|pintor|carpintero|mantenimiento|seguridad).*?(?:puedo|podría|quiero)\s+(?:ofrecer|prestar|publicar|brindar|dar)\s+(?:mis\s+)?servicios/i,
          /(?:puedo|podría|quiero)\s+(?:ofrecer|prestar|publicar|brindar|dar)\s+(?:mis\s+)?servicios.*?(?:soy|trabajo como|me dedico a)\s+(?:electricista|electrico|plomero|gasfiter|jardinero|limpieza|pintor|carpintero|mantenimiento|seguridad)/i,
        ],
        weight: 1.2, // Aumentar peso para mejor detección
        context: ['auth', 'signup', 'join', 'provider', 'services', 'documents', 'certifications'],
      },
      {
        intent: 'property_search',
        patterns: [
          /(?:buscar|encontrar|ver)\s+(?:propiedad|propiedades|departamento|casa|arriendo)/,
          /(?:quiero|necesito|busco)\s+(?:alquilar|renta|arriendo)/,
          /(?:filtrar|busqueda|search)/,
        ],
        weight: 0.9,
        context: ['properties', 'search', 'rent'],
      },
      {
        intent: 'contracts',
        patterns: [
          /(?:contrato|contratos|firmar|firma|legal|documento)/,
          /(?:como|dónde)\s+(?:firmar|ver|descargar)\s+contrato/,
          /(?:trustfactory|firma electronica|contrato digital)/,
        ],
        weight: 0.95,
        context: ['legal', 'contracts', 'signing'],
      },
      {
        intent: 'payments',
        patterns: [
          /(?:pago|pagos|dinero|pagar|transferencia|banco)/,
          /(?:como|dónde|cuándo)\s+(?:pagar|recibir|transferir)/,
          /(?:khipu|debito|metodo de pago)/,
        ],
        weight: 0.9,
        context: ['finance', 'payments', 'money'],
      },
      {
        intent: 'runner360',
        patterns: [
          /(?:runner|runner360|visita|visitas|recorrido)/,
          /(?:como|dónde|cuándo)\s+(?:visitar|ver)\s+propiedad/,
          /(?:fotos|video|reporte)\s+(?:profesional|visita)/,
        ],
        weight: 0.85,
        context: ['visits', 'inspection', 'runner'],
      },
      {
        intent: 'maintenance',
        patterns: [
          /(?:mantenimiento|reparar|arreglar|problema|daño)/,
          /(?:fuga|electricidad|plomeria|pared|techo)/,
          /(?:proveedor|tecnico|servicio)/,
        ],
        weight: 0.8,
        context: ['repair', 'maintenance', 'fix'],
      },
      {
        intent: 'security',
        patterns: [
          /(?:seguridad|seguro|verificar|verificacion|confianza)/,
          /(?:documento|identidad|antecedente|certificado)/,
          /(?:protegido|proteger|fraude|estafa)/,
        ],
        weight: 0.75,
        context: ['security', 'verification', 'trust'],
      },
      {
        intent: 'legal_cases',
        patterns: [
          /(?:caso legal|casos legales|proceso legal|judicial|demanda|tribunal)/i,
          /(?:desahucio|lanzamiento|expulsión|desalojo)/i,
          /(?:ley|legal|jurídico|abogado|juez)/i,
          /(?:contrato|arriendo|arrendamiento)\s+(?:problema|conflicto|disputa)/i,
          /(?:iniciar|empezar|comenzar)\s+(?:proceso|caso|demanda)\s+legal/i,
          /(?:problemas?\s+(?:habitabilidad|contrato|inquilino|propietario))/i,
          /(?:derechos?\s+(?:inquilino|propietario|arrendador|arrendatario))/i,
        ],
        weight: 0.95,
        context: ['legal', 'court', 'law', 'dispute', 'conflict'],
      },
      {
        intent: 'payment_default',
        patterns: [
          /(?:mora|atraso|impago|no pago|deuda|adeudo|pendiente)/i,
          /(?:no\s+(?:pago|paga|ha pagado)|atrasado\s+(?:en\s+)?pago)/i,
          /(?:inquilino\s+(?:no\s+)?paga|no\s+(?:me\s+)?paga\s+(?:el\s+)?alquiler)/i,
          /(?:retraso\s+(?:en\s+)?pago|pagos?\s+(?:atrasado|retrasado|pendiente))/i,
          /(?:cobrar|recuperar|cobranza)\s+(?:deuda|renta|alquiler)/i,
          /(?:intereses?\s+(?:por\s+)?mora|intereses?\s+legales)/i,
          /(?:garantía|depósito|caución)\s+(?:retener|aplicar|usar)/i,
          /(?:notificación|requerimiento)\s+(?:extrajudicial|de\s+pago)/i,
        ],
        weight: 0.9,
        context: ['payment', 'debt', 'default', 'overdue', 'legal'],
      },
      {
        intent: 'legal_info',
        patterns: [
          /(?:ley|legislación|normativa|codigo civil|codigo de procedimiento)/i,
          /(?:ley\s+(?:18\.?101|21\.?461)|devuelveme mi casa|arrendamientos urbanos)/i,
          /(?:informacion legal|información jurídica|derechos|obligaciones)/i,
          /(?:que dice la ley|según la ley|ley chilena|legislación chilena)/i,
          /(?:contrato de arriendo|arriendo urbano|locación|alquiler)/i,
          /(?:desalojo|desahucio|lanzamiento|expulsión)/i,
          /(?:garantías|caución|depósito|aval)/i,
          /(?:tribunal|juzgado|juez|procedimiento judicial)/i,
        ],
        weight: 0.85,
        context: ['legal', 'law', 'legislation', 'chile', 'rights', 'court'],
      },
      {
        intent: 'navigation',
        patterns: [
          /(?:como|dónde|donde)\s+(?:acceder|entrar|ir|ir a|llegar)/i,
          /(?:dónde|donde)\s+(?:está|esta|encuentro|veo|veo el|la)\s+(?:panel|dashboard|menú|sección)/i,
          /(?:cómo|como)\s+(?:navegar|usar|funciona|manejar)\s+(?:el\s+)?sistema/i,
          /(?:qué|que)\s+(?:secciones|apartados|páginas|opciones)\s+(?:tengo|hay)/i,
          /(?:dónde|donde)\s+(?:buscar|encontrar|ver)\s+(?:propiedad|contrato|pago)/i,
          /(?:cómo|como)\s+(?:llegar|llegar a|acceder a)\s+(?:mi|mis)\s+(?:contrato|pago|propiedad)/i,
          /(?:menú|menu|barra lateral|navegación|navegacion|sidebar)/i,
          /(?:no\s+encuentro|no\s+veo|no\s+sé|no se)\s+(?:dónde|donde|como|cómo)/i,
        ],
        weight: 0.8,
        context: ['navigation', 'menu', 'interface', 'ui', 'access', 'find'],
      },
      {
        intent: 'how_to',
        patterns: [
          /(?:cómo|como)\s+(?:se\s+)?(?:hace|hacer|funciona|uso|usar)/i,
          /(?:cómo|como)\s+(?:puedo|podría|debo)\s+(?:hacer|realizar|ejecutar)/i,
          /(?:qué|que)\s+(?:pasos|proceso|procedimiento)\s+(?:sigo|debo seguir)/i,
          /(?:dime|explícame|enséñame|guíame|ayúdame)\s+(?:a|como|cómo)/i,
          /(?:no\s+sé|no se)\s+(?:cómo|como)\s+(?:hacer|usar|funciona)/i,
          /(?:instrucciones|tutorial|guía|ayuda)\s+(?:para|de)/i,
          /(?:paso\s+a\s+paso|paso por paso)/i,
          /(?:primera\s+vez|por\s+primera\s+vez|nuevo|principiante)/i,
        ],
        weight: 0.75,
        context: ['tutorial', 'guide', 'help', 'instructions', 'how', 'steps'],
      },
      {
        intent: 'documents_visibility',
        patterns: [
          /(?:los\s+otros\s+usuarios|otros\s+usuarios|otras\s+personas|clientes|inquilinos|propietarios)\s+(?:pueden\s+ver|ven|acceden|tienen\s+acceso|visualizan)\s+(?:mis\s+)?(?:documentos|documento|archivos|información|datos|perfil)/i,
          /(?:quién|quiénes|quien|quienes)\s+(?:puede|pueden)\s+(?:ver|acceder|visualizar)\s+(?:mis\s+)?(?:documentos|documento|archivos|información|datos|perfil)/i,
          /(?:mis\s+)?(?:documentos|documento|archivos|información|datos|perfil)\s+(?:son\s+)?(?:visibles|públicos|privados|accesibles)/i,
          /(?:visibilidad|acceso|privacidad)\s+(?:de\s+)?(?:mis\s+)?(?:documentos|documento|archivos|información|datos|perfil)/i,
          /(?:qué|que)\s+(?:documentos|documento|archivos|información|datos)\s+(?:pueden\s+ver|ven|acceden)\s+(?:los\s+)?(?:clientes|usuarios|otros)/i,
          /(?:documentos|documento)\s+(?:aprobados|verificados)\s+(?:visibles|públicos|accesibles)/i,
          /(?:certificado|certificación|cédula|antecedentes)\s+(?:visible|público|accesible)/i,
        ],
        weight: 0.95,
        context: ['documents', 'privacy', 'visibility', 'security', 'provider'],
      },
      {
        intent: 'provider_documents',
        patterns: [
          /(?:documentos|documento)\s+(?:de\s+)?(?:proveedor|provider|servicio)/i,
          /(?:qué|que)\s+(?:documentos|documento)\s+(?:necesito|requiero|debo)\s+(?:como|para)\s+(?:proveedor|provider)/i,
          /(?:certificado|certificación|cédula|antecedentes)\s+(?:proveedor|provider|servicio)/i,
          /(?:verificar|verificación|aprobación)\s+(?:documentos|documento)\s+(?:proveedor|provider)/i,
          /(?:subir|subir|cargar)\s+(?:documentos|documento)\s+(?:proveedor|provider)/i,
        ],
        weight: 0.9,
        context: ['documents', 'provider', 'verification', 'registration'],
      },
      {
        intent: 'commission_info',
        patterns: [
          /(?:porcentaje|porcentajes)\s+(?:de\s+)?(?:comisión|comisiones)/i,
          /(?:cuánto|cuanto|qué|que)\s+(?:porcentaje|porcentajes)\s+(?:de\s+)?(?:comisión|comisiones)/i,
          /(?:comisión|comisiones)\s+(?:para|de)\s+(?:corredor|broker|proveedor|provider|runner)/i,
          /(?:cuánto|cuanto)\s+(?:cobran|cobro|gano|gana)\s+(?:por\s+)?(?:comisión|comisiones)/i,
          /(?:cuál|cuál|que|qué)\s+(?:es\s+)?(?:la\s+)?(?:comisión|comisiones)\s+(?:que\s+)?(?:se\s+)?(?:le\s+)?(?:paga|pagan)\s+(?:a\s+)?(?:un\s+)?(?:corredor|broker)/i,
          /(?:cuánto|cuanto)\s+(?:cobra|cobran)\s+(?:un\s+)?(?:corredor|broker)/i,
          /(?:cuánto|cuanto)\s+(?:es\s+)?(?:la\s+)?(?:comisión|comisiones)\s+(?:de\s+)?(?:corredor|corredores|broker)/i,
          /(?:comision|comisión)\s+(?:corredor|broker)/i,
          /(?:retención|retenciones)\s+(?:plataforma|sistema)/i,
        ],
        weight: 0.9,
        context: ['commissions', 'payments', 'fees', 'financial'],
      },
      {
        intent: 'support',
        patterns: [
          /(?:ayuda|ayudame|problema|soporte|duda|no entiendo)/,
          /(?:como|qué|dónde|cuándo|por qué)/,
          /(?:contactar|llamar|escribir)\s+(?:soporte|ayuda)/,
        ],
        weight: 0.7,
        context: ['help', 'support', 'question'],
      },
      // 🚀 NUEVO: Detección específica para firmas digitales (ALTA PRIORIDAD)
      {
        intent: 'digital_signature',
        patterns: [
          /(?:firma|firmar|firmado|firmas)\s+(?:digital|electronica|electronica|online|en linea|en línea)/i,
          /(?:se\s+)?(?:pueden|puedo|se\s+puede)\s+(?:hacer|hacer|realizar)\s+(?:firmas?|firmar)\s+(?:digital|electronica|electronica|online)/i,
          /(?:hay|tienen|ofrecen)\s+(?:firma|firmas?)\s+(?:digital|electronica|electronica|online)/i,
          /(?:como|como)\s+(?:se\s+)?(?:firman|firma|firmar)\s+(?:los\s+)?(?:contratos?|documentos?)/i,
          /(?:puedo|puede|se\s+puede)\s+(?:firmar|firmas?)\s+(?:online|en linea|en línea|digital)/i,
          /(?:firma|firmas?)\s+(?:electronica|electronica|digital|online)/i,
          /(?:contrato|contratos?|documento|documentos?)\s+(?:digital|electronico|electronico|online)/i,
        ],
        weight: 0.98,
        context: ['contracts', 'signing', 'legal', 'digital'],
      },
      // 🚀 NUEVO: Detección específica para contratar corredores (ALTA PRIORIDAD)
      {
        intent: 'hire_broker',
        patterns: [
          /(?:puedo|puede|se\s+puede)\s+(?:comunicarme|comunicarse|contactar|contratar)\s+(?:con\s+)?(?:un\s+)?(?:corredor|broker|agente)/i,
          /(?:si\s+)?(?:tengo|tiene)\s+(?:una\s+)?(?:casa|departamento|propiedad)\s+(?:para\s+)?(?:arrendar|alquilar|rentar)\s+(?:puedo|puede)\s+(?:comunicarme|contratar)\s+(?:con\s+)?(?:un\s+)?(?:corredor|broker)/i,
          /(?:pero\s+)?(?:puedo|puede)\s+(?:contratar|comunicarme|contactar)\s+(?:a\s+)?(?:un\s+)?(?:corredor|broker)\s+(?:de\s+)?(?:propiedades?)?/i,
          /(?:necesito|quiero|deseo)\s+(?:un\s+)?(?:corredor|broker|agente)\s+(?:para\s+)?(?:administrar|gestionar|administracion|gestion)\s+(?:mi|mis)\s+(?:propiedad|propiedades)/i,
          /(?:corredor|broker)\s+(?:para\s+)?(?:que|que)\s+(?:administre|administrar|gestionar|gestion)/i,
          /(?:contratar|comunicarme|contactar)\s+(?:corredor|broker|agente)/i,
          /(?:que|qué)\s+(?:hace|hacen)\s+(?:un\s+)?(?:corredor|broker|agente)/i,
          /(?:necesito|necesitas)\s+(?:un\s+)?(?:corredor|broker)/i,
          /(?:puedo|puede)\s+(?:arrendar|alquilar)\s+(?:sin\s+)?(?:corredor|broker)/i,
        ],
        weight: 0.97,
        context: ['broker', 'services', 'property_management'],
      },
      // 🚀 NUEVO: Detección para costos y precios
      {
        intent: 'costs_pricing',
        patterns: [
          /(?:cuanto|cuantos?|cuánto|cuántos?)\s+(?:cuesta|cuestan|vale|valen|se\s+paga|se\s+pagan)/i,
          /(?:hay|tienen|existe)\s+(?:que|que)\s+(?:pagar|pagar|costos?|precios?)/i,
          /(?:es|son)\s+(?:gratis|gratuito|sin\s+costo|sin\s+costos?)/i,
          /(?:cuales?|cuáles?)\s+(?:son\s+)?(?:los\s+)?(?:precios?|costos?|tarifas?)/i,
          /(?:cuanto|cuantos?|cuánto|cuántos?)\s+(?:cobran|cobra|se\s+cobra|se\s+cobran)/i,
          /(?:precio|precios?|costo|costos?|tarifa|tarifas?)\s+(?:de|del|de\s+la|de\s+los)/i,
          /(?:cuanto|cuantos?|cuánto|cuántos?)\s+(?:vale|valen|es|son)\s+(?:el|la|los|las)/i,
        ],
        weight: 0.9,
        context: ['pricing', 'costs', 'fees', 'financial'],
      },
      // 🚀 NUEVO: Detección para funcionalidades de la plataforma
      {
        intent: 'platform_features',
        patterns: [
          /(?:que|qué)\s+(?:puedo|puede|se\s+puede)\s+(?:hacer|hacer|realizar)\s+(?:aqui|aquí|en\s+la\s+plataforma|en\s+rent360)/i,
          /(?:que|qué)\s+(?:ofrece|ofrecen|tiene|tienen)\s+(?:la\s+plataforma|rent360|el\s+sistema)/i,
          /(?:que|qué)\s+(?:servicios?|funcionalidades?|caracteristicas?|características?)\s+(?:tiene|tienen|ofrece|ofrecen)/i,
          /(?:cuales?|cuáles?)\s+(?:son\s+)?(?:las\s+)?(?:funcionalidades?|caracteristicas?|características?|servicios?)/i,
          /(?:para\s+)?(?:que|qué)\s+(?:sirve|sirven)\s+(?:rent360|la\s+plataforma|el\s+sistema)/i,
          /(?:que|qué)\s+(?:hace|hacen|puede|pueden)\s+(?:rent360|la\s+plataforma|el\s+sistema)/i,
        ],
        weight: 0.85,
        context: ['features', 'platform', 'capabilities'],
      },
      // 🚀 NUEVO: Detección para seguridad y confianza
      {
        intent: 'security_trust',
        patterns: [
          /(?:es|son)\s+(?:seguro|segura|seguros?|confiable|confiables?)/i,
          /(?:mis|mi)\s+(?:datos?|informacion|información)\s+(?:estan|están|son)\s+(?:protegidos?|seguros?|seguras?)/i,
          /(?:puedo|puede)\s+(?:confiar|confiar|confiar)\s+(?:en|en\s+la\s+plataforma|en\s+rent360)/i,
          /(?:es|son)\s+(?:confiable|confiables?|seguro|segura|seguros?)/i,
          /(?:como|como)\s+(?:protegen|protege)\s+(?:mis|mi)\s+(?:datos?|informacion|información)/i,
          /(?:seguridad|proteccion|protección)\s+(?:de\s+)?(?:datos?|informacion|información)/i,
        ],
        weight: 0.88,
        context: ['security', 'trust', 'privacy', 'data_protection'],
      },
      // 🚀 NUEVO: Detección para verificación de usuarios
      {
        intent: 'verification_time',
        patterns: [
          /(?:cuanto|cuantos?|cuánto|cuántos?)\s+(?:tarda|tardan|demora|demoran)\s+(?:la\s+)?(?:verificacion|verificación|aprobacion|aprobación)/i,
          /(?:cuando|cuándo)\s+(?:estare|estaré|estare|estare)\s+(?:verificado|verificada|aprobado|aprobada)/i,
          /(?:como|como)\s+(?:se|se)\s+(?:si|sí)\s+(?:estoy|está|esta)\s+(?:verificado|verificada|aprobado|aprobada)/i,
          /(?:tiempo|tiempos?)\s+(?:de\s+)?(?:verificacion|verificación|aprobacion|aprobación)/i,
          /(?:cuando|cuándo)\s+(?:me|me)\s+(?:verifican|verifican|aprueban|aprueban)/i,
        ],
        weight: 0.9,
        context: ['verification', 'approval', 'time', 'waiting'],
      },
      // 🚀 NUEVO: Detección para Runner360 (qué es, cómo funciona)
      {
        intent: 'runner360_info',
        patterns: [
          /(?:que|qué)\s+(?:es|es)\s+(?:runner360|runner\s+360|runner)/i,
          /(?:como|como)\s+(?:funciona|funciona)\s+(?:runner360|runner\s+360|runner)/i,
          /(?:que|qué)\s+(?:hace|hacen)\s+(?:runner360|runner\s+360|runner)/i,
          /(?:para\s+)?(?:que|qué)\s+(?:sirve|sirven)\s+(?:runner360|runner\s+360|runner)/i,
          /(?:cuanto|cuantos?|cuánto|cuántos?)\s+(?:cuesta|cuestan|vale|valen)\s+(?:una\s+)?(?:visita|visitas?)\s+(?:de\s+)?(?:runner360|runner\s+360|runner)/i,
          /(?:precio|precios?|costo|costos?)\s+(?:de\s+)?(?:runner360|runner\s+360|runner|visita|visitas?)/i,
        ],
        weight: 0.92,
        context: ['runner360', 'visits', 'inspection', 'pricing'],
      },
      // 🚀 NUEVO: Detección para renovaciones de contratos
      {
        intent: 'contract_renewal',
        patterns: [
          /(?:como|como)\s+(?:renuevo|renueva|renuevan)\s+(?:mi|mis|el|la)\s+(?:contrato|contratos?)/i,
          /(?:puedo|puede|se\s+puede)\s+(?:renovar|renovacion|renovación)\s+(?:automaticamente|automáticamente|automatico|automático)/i,
          /(?:que|qué)\s+(?:pasa|pasa)\s+(?:si|sí)\s+(?:no|no)\s+(?:renuevo|renueva|renuevan)/i,
          /(?:renovacion|renovación|renovar)\s+(?:contrato|contratos?)/i,
          /(?:extender|extender|extender)\s+(?:contrato|contratos?)/i,
        ],
        weight: 0.9,
        context: ['contracts', 'renewal', 'extension'],
      },
      // 🚀 NUEVO: Detección para agendar visitas
      {
        intent: 'schedule_visit',
        patterns: [
          /(?:como|como)\s+(?:agendo|agenda|agendan)\s+(?:una\s+)?(?:visita|visitas?)/i,
          /(?:puedo|puede|se\s+puede)\s+(?:visitar|visitar|ver)\s+(?:la\s+)?(?:propiedad|propiedades?)/i,
          /(?:cuanto|cuantos?|cuánto|cuántos?)\s+(?:cuesta|cuestan|vale|valen)\s+(?:una\s+)?(?:visita|visitas?)/i,
          /(?:agendar|agendar|solicitar)\s+(?:visita|visitas?)/i,
          /(?:solicitar|solicitar|pedir)\s+(?:visita|visitas?)\s+(?:a\s+)?(?:propiedad|propiedades?)/i,
        ],
        weight: 0.88,
        context: ['visits', 'scheduling', 'property_viewing'],
      },
      // 🚀 NUEVO: Detección para calificaciones
      {
        intent: 'ratings_info',
        patterns: [
          /(?:puedo|puede|se\s+puede)\s+(?:ver|ver|ver)\s+(?:las\s+)?(?:calificaciones?|ratings?|reseñas?|reseñas?)/i,
          /(?:como|como)\s+(?:me|me)\s+(?:califican|califican|califican)/i,
          /(?:que|qué)\s+(?:son|son)\s+(?:las\s+)?(?:calificaciones?|ratings?|reseñas?)/i,
          /(?:calificaciones?|ratings?|reseñas?)\s+(?:de|del|de\s+la|de\s+los)/i,
          /(?:ver|ver|ver)\s+(?:calificaciones?|ratings?|reseñas?)/i,
        ],
        weight: 0.87,
        context: ['ratings', 'reviews', 'feedback'],
      },
      // 🚀 NUEVO: Detección para documentos requeridos
      {
        intent: 'required_documents',
        patterns: [
          /(?:que|qué)\s+(?:documentos?|papeles?|archivos?)\s+(?:necesito|requiero|debo|necesitas)/i,
          /(?:que|qué)\s+(?:papeles?|documentos?|archivos?)\s+(?:debo|debo|necesito)\s+(?:subir|cargar|enviar)/i,
          /(?:cuales?|cuáles?)\s+(?:son\s+)?(?:los\s+)?(?:documentos?|papeles?|archivos?)\s+(?:requeridos?|necesarios?)/i,
          /(?:necesito|necesitas|requiero|requieres)\s+(?:certificado|certificados?|certificacion|certificación)/i,
          /(?:documentos?|papeles?)\s+(?:para|para)\s+(?:registrarse|registrar|verificacion|verificación)/i,
        ],
        weight: 0.91,
        context: ['documents', 'requirements', 'registration'],
      },
    ];

    let bestIntent = 'support';
    let bestConfidence = 0;
    let bestEntities: Record<string, any> = {};

    // Evaluar cada patrón
    for (const pattern of intentPatterns) {
      for (const regex of pattern.patterns) {
        const matches = text.match(regex);
        if (matches) {
          let confidence = pattern.weight;

          // Ajustar confianza basado en contexto
          if (context.some(ctx => pattern.context.includes(ctx))) {
            confidence += 0.1;
          }

          // Ajustar confianza basado en rol del usuario
          if (this.isIntentRelevantForRole(pattern.intent, userRole)) {
            confidence += 0.05;
          }

          if (confidence > bestConfidence) {
            bestIntent = pattern.intent;
            bestConfidence = confidence;
            bestEntities = this.extractEntities(text, pattern.intent);
          }
        }
      }
    }

    return {
      intent: bestIntent,
      confidence: Math.min(bestConfidence, 1.0),
      entities: bestEntities,
      context: context,
      subIntent: this.detectSubIntent(text, bestIntent),
    };
  }

  /**
   * Verificar si la intención es relevante para el rol del usuario
   */
  private isIntentRelevantForRole(intent: string, role: string): boolean {
    const roleRelevance: Record<string, string[]> = {
      tenant: [
        'property_search',
        'contracts',
        'payments',
        'maintenance',
        'runner360',
        'legal_cases',
        'payment_default',
        'legal_info',
        'navigation',
        'how_to',
        'documents_visibility',
        'commission_info',
      ],
      owner: [
        'property_search',
        'contracts',
        'payments',
        'maintenance',
        'runner360',
        'legal_cases',
        'payment_default',
        'legal_info',
        'navigation',
        'how_to',
        'documents_visibility',
        'commission_info',
      ],
      broker: [
        'property_search',
        'contracts',
        'payments',
        'runner360',
        'legal_cases',
        'payment_default',
        'legal_info',
        'navigation',
        'how_to',
        'commission_info',
      ],
      provider: [
        'register',
        'maintenance',
        'payments',
        'navigation',
        'how_to',
        'documents_visibility',
        'provider_documents',
        'commission_info',
      ],
      runner: ['navigation', 'how_to', 'commission_info'],
      admin: [
        'security',
        'support',
        'legal_cases',
        'legal_info',
        'navigation',
        'how_to',
        'documents_visibility',
        'commission_info',
      ],
      guest: [
        'register',
        'property_search',
        'navigation',
        'how_to',
        'platform_info',
        'provider_documents',
        'commission_info',
        'platform_fees',
        'payment_system',
        'contracts',
        'runner360',
        'provider_services',
        'security',
        'support',
        'legal_info',
      ],
    };

    return roleRelevance[role]?.includes(intent) || false;
  }

  /**
   * 🚀 FASE 2: Genera resumen contextual basado en datos reales del usuario
   */
  private generateContextSummary(userRole: string, userData: any): string | null {
    if (!userData) {
      return null;
    }

    try {
      switch (userRole) {
        case 'owner':
          const propertyCount = userData.properties?.length || 0;
          const contractCount = userData.contracts?.length || 0;
          const legalCasesCount = userData.legalCases?.length || 0;
          const maintenanceCount = userData.maintenance?.length || 0;

          return `Usuario es propietario con ${propertyCount} propiedades, ${contractCount} contratos activos, ${legalCasesCount} casos legales y ${maintenanceCount} solicitudes de mantenimiento.`;

        case 'tenant':
          const tenantContractCount = userData.contracts?.length || 0;
          const pendingPayments =
            userData.payments?.filter((p: any) => p.status === 'pending').length || 0;
          const tenantMaintenanceCount = userData.maintenance?.length || 0;

          return `Usuario es inquilino con ${tenantContractCount} contratos, ${pendingPayments} pagos pendientes y ${tenantMaintenanceCount} solicitudes de mantenimiento.`;

        case 'broker':
          const brokerContracts = userData.contracts?.length || 0;
          const commissions = userData.commissions?.length || 0;
          const brokerProperties = userData.properties?.length || 0;

          return `Usuario es corredor con ${brokerContracts} contratos gestionados, ${commissions} comisiones activas y ${brokerProperties} propiedades publicadas.`;

        case 'provider':
          const transactions = userData.transactions?.length || 0;
          const jobs = userData.tasks?.length || 0;

          return `Usuario es proveedor con ${jobs} trabajos activos y ${transactions} transacciones completadas.`;

        case 'runner':
          const runnerTasks = userData.tasks?.length || 0;
          const earnings = userData.earnings?.length || 0;

          return `Usuario es runner con ${runnerTasks} tareas pendientes y ${earnings} ganancias registradas.`;

        case 'support':
          const tickets = userData.tickets?.length || 0;
          const supportUsers = userData.users?.length || 0;
          const supportProperties = userData.properties?.length || 0;

          return `Usuario es soporte manejando ${tickets} tickets, ${supportUsers} usuarios y ${supportProperties} propiedades.`;

        case 'admin':
          const adminUsers = userData.users?.length || 0;
          const systemStats = userData.stats;

          return `Usuario es administrador supervisando ${adminUsers} usuarios del sistema.`;

        default:
          return null;
      }
    } catch (error) {
      logger.warn('Error generando resumen contextual', {
        error: error instanceof Error ? error.message : String(error),
      });
      return null;
    }
  }

  /**
   * Extraer entidades del mensaje (roles, propiedades, montos, etc.)
   */
  private extractEntities(text: string, intent: string): Record<string, any> {
    const entities: Record<string, any> = {};

    // Extraer roles mencionados
    const rolePatterns = {
      propietario: /propietario|owner/i,
      inquilino: /inquilino|tenant|renter/i,
      corredor: /corredor|broker|agente/i,
      proveedor: /proveedor|provider|servicio/i,
      runner: /runner/i,
    };

    for (const [role, pattern] of Object.entries(rolePatterns)) {
      if (pattern.test(text)) {
        entities.role = role;
      }
    }

    // Extraer montos de dinero
    const moneyMatch = text.match(/\$?(\d{1,3}(?:\.\d{3})*|\d+)(?:\s*(mil|millones?))?/gi);
    if (moneyMatch) {
      entities.amount = moneyMatch[0];
    }

    // Extraer tipos de propiedad
    const propertyTypes = ['departamento', 'casa', 'oficina', 'local', 'bodega'];
    for (const type of propertyTypes) {
      if (text.includes(type)) {
        entities.propertyType = type;
        break;
      }
    }

    // Extraer ubicaciones
    const locations = ['santiago', 'providencia', 'las condes', 'vitacura', 'ñuñoa', 'la florida'];
    for (const location of locations) {
      if (text.includes(location)) {
        entities.location = location;
        break;
      }
    }

    // Extraer tipos de servicios mencionados (con variantes comunes)
    const serviceTypes = [
      { keywords: ['jardineria', 'jardinero', 'jardinería'], type: 'jardinero' },
      { keywords: ['plomeria', 'plomero', 'plomería', 'gasfiter', 'gasfitería'], type: 'plomero' },
      {
        keywords: ['electricidad', 'electricista', 'electrico', 'eléctrico', 'electrico'],
        type: 'electricista',
      },
      { keywords: ['limpieza', 'limpiador', 'aseo'], type: 'limpieza' },
      { keywords: ['pintura', 'pintor'], type: 'pintura' },
      { keywords: ['carpinteria', 'carpintero', 'carpintería'], type: 'carpinteria' },
      { keywords: ['mantenimiento', 'mantenedor'], type: 'mantenimiento' },
      { keywords: ['seguridad', 'guardia', 'vigilante'], type: 'seguridad' },
    ];
    const foundServices: string[] = [];
    for (const service of serviceTypes) {
      // Buscar cualquiera de las palabras clave
      const found = service.keywords.some(keyword => text.includes(keyword));
      if (found) {
        foundServices.push(service.type);
      }
    }
    if (foundServices.length > 0) {
      entities.services = foundServices;
      // Si se detecta un servicio, también marcar como proveedor
      if (intent === 'register') {
        entities.role = 'proveedor';
      }
    }

    // Extraer palabras clave relacionadas con registro/servicios
    const keywordMatches = text.match(
      /(?:servicios?|cuenta|registro|ofrecer|brindar|dar|jardineria?|plomeria?|electricidad|limpieza|pintura|carpinteria|mantenimiento)/gi
    );
    if (keywordMatches) {
      entities.keywords = keywordMatches;
    }

    return entities;
  }

  /**
   * Detectar sub-intenciones más específicas
   */
  private detectSubIntent(text: string, mainIntent: string): string | undefined {
    const subIntentPatterns: Record<string, RegExp[]> = {
      property_search: [/alquiler|renta|arriendo/i, /venta|comprar/i, /temporal|vacacional/i],
      payments: [/atrasado|mora|vencido/i, /adelantado|avanzado/i, /metodo|cambiar/i],
      contracts: [/renovar|renovacion/i, /terminar|finalizar/i, /modificar|cambiar/i],
    };

    const patterns = subIntentPatterns[mainIntent];
    if (patterns) {
      for (const pattern of patterns) {
        if (pattern.test(text)) {
          return pattern.source.replace(/[/\\^$*+?.()|[\]{}]/g, '').replace(/i$/, '');
        }
      }
    }

    return undefined;
  }

  /**
   * Generar respuesta inteligente basada en intención y conocimiento
   */
  private generateSmartResponse(
    intent: IntentRecognition,
    userRole: string,
    securityContext: SecurityContext
  ): KnowledgeResponse {
    const { intent: mainIntent, confidence, entities, subIntent } = intent;

    // Verificar seguridad primero
    if (this.hasSecurityViolation(intent, securityContext)) {
      return {
        response:
          'Lo siento, no puedo proporcionar información sobre ese tema por restricciones de seguridad.',
        confidence: 1.0,
        securityNote: 'Contenido restringido para este rol de usuario',
      };
    }

    // Obtener conocimiento base para la intención
    const intentKnowledge = this.knowledgeBase[mainIntent];
    if (!intentKnowledge) {
      return this.generateFallbackResponse(userRole);
    }

    // Obtener respuestas específicas del rol
    // Si es guest y quiere registrarse como proveedor, usar respuestas de guest
    let roleResponses = intentKnowledge[userRole] || intentKnowledge['general'];

    // Si es guest preguntando sobre proveedores, asegurar que tenemos respuestas de guest
    if (
      userRole === 'guest' &&
      mainIntent === 'register' &&
      (entities.services || entities.role === 'proveedor')
    ) {
      roleResponses = intentKnowledge['guest'] || roleResponses;
    }

    // Si no hay respuestas para el rol pero hay respuestas de guest y el usuario pregunta sobre registro, usar guest
    if (!roleResponses && mainIntent === 'register' && intentKnowledge['guest']) {
      roleResponses = intentKnowledge['guest'];
    }

    if (!roleResponses) {
      return this.generateFallbackResponse(userRole);
    }

    // Seleccionar respuesta basada en entidades y contexto
    // Si hay servicios detectados y hay múltiples respuestas, elegir una más específica
    let selectedResponse = roleResponses.responses[0];
    let suggestions = roleResponses.suggestions || [];
    let links = roleResponses.links || [];

    // Si se detectó un servicio específico y hay respuestas más específicas, usar una de ellas
    if (entities.services && entities.services.length > 0 && roleResponses.responses.length > 1) {
      // Preferir respuestas que mencionen servicios específicos
      const serviceSpecificResponse = roleResponses.responses.find(
        (resp: string) =>
          resp.toLowerCase().includes('servicios') || resp.toLowerCase().includes('proveedor')
      );
      if (serviceSpecificResponse) {
        selectedResponse = serviceSpecificResponse;
      } else {
        // Usar la segunda respuesta que suele ser más detallada
        selectedResponse = roleResponses.responses[1] || selectedResponse;
      }
    }

    // Personalizar respuesta basada en entidades detectadas
    if (entities.role && entities.role !== userRole) {
      selectedResponse = this.adaptResponseForRole(selectedResponse, entities.role);
    }

    if (entities.location) {
      selectedResponse = selectedResponse.replace(/ubicación/gi, entities.location);
    }

    if (entities.amount) {
      selectedResponse = this.personalizePriceResponse(selectedResponse, entities.amount);
    }

    // Personalizar respuesta basada en tipo de servicio mencionado
    if (entities.services && entities.services.length > 0 && mainIntent === 'register') {
      const serviceType = entities.services[0];
      const serviceNames: Record<string, string> = {
        electricista: 'electricidad',
        electricidad: 'electricidad',
        plomero: 'plomería',
        plomeria: 'plomería',
        gasfiter: 'gasfitería',
        jardinero: 'jardinería',
        jardineria: 'jardinería',
        limpieza: 'limpieza',
        pintura: 'pintura',
        carpinteria: 'carpintería',
        mantenimiento: 'mantenimiento',
        seguridad: 'seguridad',
      };

      const serviceName = serviceNames[serviceType] || serviceType;

      // Si es un guest preguntando sobre servicios específicos, usar respuesta más personalizada
      if (userRole === 'guest' && roleResponses.responses.length > 1) {
        // Seleccionar una respuesta que mencione servicios específicos
        selectedResponse = roleResponses.responses[1] || selectedResponse;
      }

      // Personalizar la respuesta mencionando el servicio específico
      if (selectedResponse.includes('servicios') || selectedResponse.includes('proveedor')) {
        selectedResponse = selectedResponse.replace(
          /(servicios|proveedor de servicios)/gi,
          `servicios de ${serviceName}`
        );
      }

      // Agregar información específica sobre el servicio
      if (serviceType === 'electricista' || serviceType === 'electricidad') {
        selectedResponse +=
          '\n\n💡 **Para electricistas:** Si tienes certificación profesional o licencia, súbela durante el registro. Esto aumenta tu credibilidad y te permite aparecer en búsquedas prioritarias.';
      } else if (
        serviceType === 'plomero' ||
        serviceType === 'plomeria' ||
        serviceType === 'gasfiter'
      ) {
        selectedResponse +=
          '\n\n🔧 **Para plomeros/gasfiteros:** Las certificaciones profesionales son muy valoradas. Si tienes experiencia comprobable, inclúyela en tu perfil para atraer más clientes.';
      }
    }

    // Agregar contexto específico si hay sub-intención
    if (subIntent) {
      const subIntentContext = this.getSubIntentContext(mainIntent, subIntent);
      if (subIntentContext) {
        selectedResponse += '\n\n' + subIntentContext;
        suggestions = [...suggestions, ...subIntentContext.suggestions];
      }
    }

    // Agregar guía paso a paso para casos legales complejos
    if (mainIntent === 'payment_default' && userRole === 'owner') {
      selectedResponse += '\n\n' + this.getDetailedLegalGuide('payment_default_owner');
    } else if (mainIntent === 'legal_cases' && userRole === 'owner') {
      selectedResponse += '\n\n' + this.getDetailedLegalGuide('legal_cases_owner');
    } else if (mainIntent === 'legal_cases' && userRole === 'tenant') {
      selectedResponse += '\n\n' + this.getDetailedLegalGuide('legal_cases_tenant');
    }

    // Generar preguntas de seguimiento inteligentes
    const followUp = this.generateFollowUpQuestions(mainIntent, userRole, entities);

    return {
      response: selectedResponse,
      confidence,
      suggestions,
      links,
      followUp,
      actions: this.getAvailableActions(mainIntent, userRole),
    };
  }

  /**
   * Verificar violaciones de seguridad
   */
  private hasSecurityViolation(
    intent: IntentRecognition,
    securityContext: SecurityContext
  ): boolean {
    const restrictedWords = [
      'admin',
      'sistema',
      'configuración',
      'seguridad',
      'usuario',
      'base de datos',
      'servidor',
      'código',
      'hack',
      'vulnerabilidad',
    ];

    const message = intent.intent.toLowerCase();

    // Verificar palabras restringidas
    const hasRestrictedWords = restrictedWords.some(word => message.includes(word));

    // Verificar si el tema está restringido para este rol
    const hasRestrictedTopic = securityContext.restrictedTopics.some(topic =>
      message.includes(topic)
    );

    // Si es admin, permitir acceso a todo excepto temas marcados como restringidos
    if (securityContext.allowedTopics.includes('todo')) {
      return hasRestrictedTopic;
    }

    return hasRestrictedWords && hasRestrictedTopic;
  }

  /**
   * Adaptar respuesta para rol específico mencionado
   */
  private adaptResponseForRole(response: string, targetRole: string): string {
    const roleDescriptions: Record<string, string> = {
      propietario: 'Como propietario en Rent360',
      inquilino: 'Como inquilino en Rent360',
      corredor: 'Como corredor certificado',
      proveedor: 'Como proveedor de servicios',
      runner: 'Como Runner360',
    };

    return response.replace(
      /Como (inquilino|propietario|corredor|proveedor)/i,
      roleDescriptions[targetRole] || response
    );
  }

  /**
   * Personalizar respuesta basada en precio mencionado
   */
  private personalizePriceResponse(response: string, amount: string): string {
    if (response.includes('precio') || response.includes('pago')) {
      return response.replace(/\$?\d+(?:\.\d{3})*/g, amount);
    }
    return response;
  }

  /**
   * Obtener contexto adicional para sub-intenciones
   */
  private getSubIntentContext(mainIntent: string, subIntent: string): any {
    const subContexts: Record<string, Record<string, any>> = {
      property_search: {
        alquiler: {
          response:
            'Para alquileres, considera: duración del contrato, garantías requeridas, y condiciones especiales.',
          suggestions: ['Ver contratos disponibles', 'Calcular garantías'],
        },
        venta: {
          response:
            'Para ventas, evalúa: tasación oficial, documentos necesarios, y proceso notarial.',
          suggestions: ['Solicitar tasación', 'Preparar documentos'],
        },
      },
      payments: {
        atrasado: {
          response:
            'Para pagos atrasados: contacta inmediatamente a tu administrador, revisa recordatorios, y configura alertas.',
          suggestions: ['Ver estado de pagos', 'Configurar alertas', 'Contactar administrador'],
        },
        metodo: {
          response:
            'Puedes cambiar tu método de pago en cualquier momento desde tu panel de pagos.',
          suggestions: ['Ver métodos disponibles', 'Configurar débito automático'],
        },
      },
      contracts: {
        renovar: {
          response:
            'Para renovar contratos: inicia el proceso 60 días antes del vencimiento para evitar interrupciones.',
          suggestions: ['Ver contratos próximos a vencer', 'Iniciar renovación'],
        },
      },
    };

    return subContexts[mainIntent]?.[subIntent];
  }

  /**
   * Generar preguntas de seguimiento inteligentes
   */
  private generateFollowUpQuestions(
    intent: string,
    userRole: string,
    entities: Record<string, any>
  ): string[] {
    const followUps: Record<string, Record<string, string[]>> = {
      property_search: {
        tenant: [
          '¿En qué zona te gustaría vivir?',
          '¿Cuántas habitaciones necesitas?',
          '¿Cuál es tu presupuesto mensual?',
          '¿Tienes mascotas o niños?',
        ],
        broker: [
          '¿Qué tipo de propiedad busca tu cliente?',
          '¿Cuál es el presupuesto disponible?',
          '¿Necesitas propiedades exclusivas?',
          '¿Quieres coordinar visitas con Runner360?',
        ],
      },
      contracts: {
        tenant: [
          '¿Necesitas ayuda para firmar el contrato?',
          '¿Quieres revisar las cláusulas del contrato?',
          '¿Tienes alguna duda sobre los términos?',
        ],
        owner: [
          '¿Quieres configurar renovaciones automáticas?',
          '¿Necesitas crear un nuevo contrato?',
          '¿Quieres revisar contratos activos?',
        ],
      },
      payments: {
        tenant: [
          '¿Quieres configurar débito automático?',
          '¿Necesitas cambiar tu método de pago?',
          '¿Quieres ver tu historial de pagos?',
        ],
        owner: [
          '¿Quieres configurar recordatorios automáticos?',
          '¿Necesitas cambiar tus datos bancarios?',
          '¿Quieres ver reportes de ingresos?',
        ],
      },
    };

    const roleFollowUps = followUps[intent]?.[userRole] || [];
    return roleFollowUps.slice(0, 2); // Máximo 2 preguntas de seguimiento
  }

  /**
   * Obtener acciones disponibles para la intención
   */
  private getAvailableActions(intent: string, userRole: string): string[] {
    const actions: Record<string, Record<string, string[]>> = {
      property_search: {
        tenant: ['Buscar propiedades', 'Aplicar filtros', 'Contactar corredor', 'Agendar visita'],
        broker: ['Ver propiedades exclusivas', 'Publicar oferta', 'Coordinar visitas'],
      },
      contracts: {
        tenant: ['Ver mis contratos', 'Firmar contrato', 'Descargar PDF'],
        owner: ['Crear contrato', 'Ver contratos activos', 'Configurar renovaciones'],
      },
      payments: {
        tenant: ['Configurar débito automático', 'Ver historial', 'Cambiar método de pago'],
        owner: ['Ver ingresos', 'Configurar cuenta', 'Enviar recordatorios'],
      },
    };

    return actions[intent]?.[userRole] || [];
  }

  /**
   * Generar respuesta de fallback cuando no hay conocimiento específico
   */
  private generateFallbackResponse(userRole: string): KnowledgeResponse {
    const fallbackResponses: Record<string, string> = {
      tenant:
        'Soy tu asistente en Rent360. Puedo ayudarte con propiedades, contratos, pagos, mantenimiento y soporte. ¿En qué puedo ayudarte hoy?',
      owner:
        'Como propietario, puedo ayudarte con tus propiedades, contratos, pagos, inquilinos, mantenimiento y reportes. ¿Qué necesitas gestionar?',
      broker:
        'Como corredor certificado, puedo ayudarte con propiedades, contratos, clientes, comisiones y reportes. ¿Cómo puedo asistirte?',
      provider:
        'Como proveedor de servicios, puedo ayudarte con trabajos, pagos, perfil y clientes. ¿Qué necesitas?',
      admin:
        'Como administrador, tengo acceso completo al sistema. ¿Qué necesitas revisar o configurar?',
    };

    return {
      response:
        fallbackResponses[userRole] || fallbackResponses['tenant'] || '¿En qué puedo ayudarte?',
      confidence: 0.5,
      suggestions: ['Ver ayuda', 'Contactar soporte', 'Explorar plataforma'],
      links: ['/help', '/support'],
    };
  }

  /**
   * 🚀 SISTEMA REVOLUCIONARIO: Procesar mensaje con IA 10.000% mejorada
   * Incluye memoria conversacional, aprendizaje automático, agentes especializados,
   * análisis de sentimientos, recomendaciones inteligentes y mucho más
   */
  async processMessageRevolutionary(
    userMessage: string,
    userRole: string,
    userId: string,
    conversationHistory: any[] = [],
    userContext?: Partial<UserContext>
  ): Promise<{
    response: string;
    confidence: number;
    intent: string;
    agent?: SpecializedAgent | undefined;
    recommendations?: IntelligentRecommendation[] | undefined;
    sentiment?: SentimentAnalysis | undefined;
    memoryContext?: MemoryContext | undefined;
    learningInsights?: LearningInsight[] | undefined;
    suggestions?: string[] | undefined;
    actions?: string[] | undefined;
    links?: string[] | undefined;
    followUp?: string[] | undefined;
    securityNote?: string | undefined;
  }> {
    try {
      // 🔍 PASO 1: Análisis de sentimientos avanzado
      const sentiment = this.sentimentAnalyzer.analyze(userMessage);

      // 🧠 PASO 2: Cargar memoria conversacional del usuario
      const userMemory = this.loadUserMemory(userId);
      const memoryContext = this.buildMemoryContext(userMemory, userMessage);

      // 🎯 PASO 3: Reconocimiento de intención revolucionario
      const intent = this.recognizeIntentRevolutionary(
        userMessage,
        userRole,
        conversationHistory,
        sentiment,
        memoryContext
      );

      // 🔒 PASO 4: Validación de seguridad con contexto de usuario
      const securityContext = this.createSecurityContext(userRole, userId);

      // 🤖 PASO 5: Selección del agente especializado ideal
      const selectedAgent = this.selectSpecializedAgent(
        intent,
        userRole,
        sentiment,
        memoryContext,
        userMessage
      );

      // 📊 PASO 6: Generar recomendaciones inteligentes
      const recommendations = await this.generateIntelligentRecommendations(
        intent,
        userRole,
        userId,
        userContext
      );

      // 💡 PASO 7: Aprendizaje automático - insights del sistema
      const learningInsights = this.continuousLearning.getInsights(userId);

      // 🗣️ PASO 8: Generar respuesta hiper-inteligente
      const smartResponse = await this.generateRevolutionaryResponse(
        intent,
        userRole,
        securityContext,
        selectedAgent,
        sentiment,
        memoryContext,
        recommendations,
        conversationHistory
      );

      // 📈 PASO 9: Aprender de esta interacción para futuras mejoras
      this.learnFromInteraction(userId, userMessage, smartResponse.response, sentiment);

      // 💾 PASO 10: Guardar en memoria conversacional
      this.saveToMemory(userId, {
        id: Date.now().toString(),
        timestamp: new Date(),
        topic: intent.intent,
        sentiment: sentiment.emotion as any,
        outcome: 'resolved', // Se actualizará con feedback posterior
        keyEntities: intent.entities,
        agentUsed: selectedAgent?.id || 'general_assistant',
      });

      return {
        response: smartResponse.response,
        confidence: smartResponse.confidence,
        intent: intent.intent,
        agent: selectedAgent,
        recommendations,
        sentiment,
        memoryContext,
        learningInsights,
        suggestions: smartResponse.suggestions,
        actions: smartResponse.actions,
        links: smartResponse.links,
        followUp: smartResponse.followUp,
        securityNote: smartResponse.securityNote,
      };
    } catch (error) {
      logger.error('Error procesando mensaje revolucionario:', {
        error: error instanceof Error ? error.message : String(error),
        userId,
        userRole,
      });

      // Fallback con agente general
      const fallbackAgent = this.agentRegistry['general_assistant'];
      const fallback = this.generateFallbackResponse(userRole);

      return {
        response: fallback.response,
        confidence: fallback.confidence,
        intent: 'support',
        agent: fallbackAgent,
        suggestions: fallback.suggestions,
        links: fallback.links,
        securityNote: 'Sistema operativo en modo seguro',
      };
    }
  }

  /**
   * 🔍 Reconocimiento de intención revolucionario
   */
  private recognizeIntentRevolutionary(
    message: string,
    userRole: string,
    conversationHistory: any[],
    sentiment: SentimentAnalysis,
    memoryContext: MemoryContext
  ): IntentRecognition {
    const baseIntent = this.recognizeIntent(message, userRole, memoryContext.previousTopics);

    // Mejorar intención basada en sentimiento
    if (sentiment.emotion === 'anger' && baseIntent.intent === 'support') {
      baseIntent.intent = 'urgent_support';
    }

    if (sentiment.emotion === 'fear' && sentiment.keywords.includes('urgente')) {
      baseIntent.urgency = 0.9;
    }

    // Mejorar intención basada en memoria
    if (memoryContext.unresolvedIssues.length > 0) {
      baseIntent.intent = 'follow_up_previous';
      baseIntent.context.push('has_unresolved_issues');
    }

    // Determinar complejidad
    const wordCount = message.split(' ').length;
    if (wordCount < 5) {
      baseIntent.complexity = 'simple';
    } else if (wordCount < 15) {
      baseIntent.complexity = 'medium';
    } else {
      baseIntent.complexity = 'complex';
    }

    baseIntent.sentiment = sentiment;

    return baseIntent;
  }

  /**
   * 🤖 Selección de agente especializado inteligente
   */
  private selectSpecializedAgent(
    intent: IntentRecognition,
    userRole: string,
    sentiment: SentimentAnalysis,
    memoryContext: MemoryContext,
    text: string
  ): SpecializedAgent | undefined {
    let bestAgent = this.agentRegistry['general_assistant'];
    let bestScore = 0;

    // Lógica especial para intención "register" con contexto de servicios/proveedores
    if (
      intent.intent === 'register' &&
      (intent.entities.join(' ').includes('jardinero') ||
        intent.entities.join(' ').includes('jardineria') ||
        intent.entities.join(' ').includes('servicio') ||
        intent.entities.join(' ').includes('mantenimiento') ||
        intent.entities.join(' ').includes('document') ||
        intent.entities.join(' ').includes('certific') ||
        text.includes('servicios de') ||
        text.includes('cuenta para') ||
        text.includes('ofrecer servicios') ||
        userRole === 'guest')
    ) {
      // Para preguntas sobre convertirse en proveedor/servicios/mantenimiento, priorizar agente de mantenimiento
      const maintenanceAgent = this.agentRegistry['maintenance_specialist'];
      if (maintenanceAgent && this.isAgentSuitableForRole(maintenanceAgent, userRole)) {
        return maintenanceAgent;
      }
    }

    for (const agent of Object.values(this.agentRegistry)) {
      let score = 0;

      // Puntaje por expertise en el tema
      if (agent.expertise.includes(intent.intent)) {
        score += 40;
      }
      if (agent.expertise.some(exp => intent.intent.includes(exp))) {
        score += 20;
      }

      // Puntaje por rol del usuario
      if (this.isAgentSuitableForRole(agent, userRole)) {
        score += 15;
      }

      // Puntaje por personalidad y sentimiento
      if (sentiment.emotion === 'anger' && agent.personality.empathy > 7) {
        score += 10;
      }
      if (sentiment.emotion === 'fear' && agent.personality.patience > 8) {
        score += 10;
      }
      if (sentiment.intensity > 0.7 && agent.personality.empathy > 6) {
        score += 5;
      }

      // Puntaje por memoria (continuidad)
      if (
        memoryContext.previousTopics.length > 0 &&
        agent.expertise.some(exp => memoryContext.previousTopics.includes(exp))
      ) {
        score += 10;
      }

      // Bonus por ser especialista vs general
      if (agent.id !== 'general_assistant') {
        score += 5;
      }

      if (score > bestScore) {
        bestScore = score;
        bestAgent = agent;
      }
    }

    return bestAgent;
  }

  /**
   * 📊 Generar recomendaciones inteligentes
   */
  private async generateIntelligentRecommendations(
    intent: IntentRecognition,
    userRole: string,
    userId: string,
    userContext?: Partial<UserContext>
  ): Promise<IntelligentRecommendation[]> {
    const recommendations: IntelligentRecommendation[] = [];

    // Recomendaciones basadas en intención
    if (intent.intent === 'property_search' && userRole === 'tenant') {
      // Buscar propiedades similares a las que ha visto antes
      const recentProperties = userContext?.properties || [];
      if (recentProperties.length > 0) {
        recommendations.push({
          type: 'property',
          item: { similarTo: recentProperties[0] },
          relevanceScore: 0.85,
          reason: 'Basado en tus búsquedas recientes',
          action: 'Ver propiedades similares',
        });
      }
    }

    if (intent.intent === 'payments' && userRole === 'owner') {
      recommendations.push({
        type: 'payment',
        item: { type: 'automatic_collection' },
        relevanceScore: 0.9,
        reason: 'Reduce mora y facilita cobros',
        action: 'Configurar cobros automáticos',
      });
    }

    if (intent.intent === 'maintenance' && userRole === 'tenant') {
      recommendations.push({
        type: 'service',
        item: { category: 'emergency_repair' },
        relevanceScore: 0.8,
        reason: 'Servicio rápido y garantizado',
        action: 'Contactar especialista cercano',
      });
    }

    return recommendations.slice(0, 3); // Máximo 3 recomendaciones
  }

  /**
   * 🗣️ Generar respuesta revolucionaria
   */
  private async generateRevolutionaryResponse(
    intent: IntentRecognition,
    userRole: string,
    securityContext: SecurityContext,
    agent: SpecializedAgent | undefined,
    sentiment: SentimentAnalysis,
    memoryContext: MemoryContext,
    recommendations: IntelligentRecommendation[],
    conversationHistory: any[]
  ): Promise<KnowledgeResponse> {
    // Obtener respuesta base del conocimiento
    let response = this.generateSmartResponse(intent, userRole, securityContext);

    // Personalizar respuesta según el agente
    response = this.personalizeResponseForAgent(response, agent, sentiment, memoryContext);

    // Agregar recomendaciones inteligentes
    if (recommendations.length > 0) {
      response.response += '\n\n💡 **Recomendaciones inteligentes:**';
      for (const rec of recommendations.slice(0, 2)) {
        response.response += `\n• ${rec.action} - ${rec.reason}`;
      }
    }

    // Agregar contexto de memoria si es relevante
    if (memoryContext.unresolvedIssues.length > 0) {
      response.response +=
        '\n\n📋 **Asuntos pendientes:** Recuerda que tenemos temas pendientes de resolver.';
    }

    // Agregar firma del agente
    if (agent) {
      response.response += `\n\n— ${agent.name}, ${agent.specialty}`;
    }

    response.agent = agent;
    response.sentiment = sentiment;
    response.memoryContext = memoryContext;
    response.recommendations = recommendations;

    return response;
  }

  /**
   * 🎭 Personalizar respuesta según personalidad del agente
   */
  private personalizeResponseForAgent(
    baseResponse: KnowledgeResponse,
    agent: SpecializedAgent | undefined,
    sentiment: SentimentAnalysis,
    memoryContext: MemoryContext
  ): KnowledgeResponse {
    let response = baseResponse.response;

    // Ajustar tono según personalidad del agente
    if (agent && agent.personality.empathy > 7 && sentiment.emotion === 'anger') {
      response = `Entiendo tu frustración y quiero ayudarte. ${response}`;
    }

    if (agent && agent.personality.patience > 8 && sentiment.emotion === 'fear') {
      response = `Tómate tu tiempo, estamos aquí para ayudarte. ${response}`;
    }

    if (agent && agent.personality.tone === 'friendly') {
      response = response.replace(/usted/g, 'tú').replace(/Usted/g, 'Tú');
    }

    return { ...baseResponse, response };
  }

  /**
   * 💾 Sistema de memoria conversacional
   */
  private loadUserMemory(userId: string): ConversationMemory[] {
    return this.conversationMemory.get(userId) || [];
  }

  private saveToMemory(userId: string, memory: ConversationMemory): void {
    const userMemories = this.loadUserMemory(userId);
    userMemories.push(memory);

    // Mantener solo las últimas 50 conversaciones
    if (userMemories.length > 50) {
      userMemories.splice(0, userMemories.length - 50);
    }

    this.conversationMemory.set(userId, userMemories);
  }

  private buildMemoryContext(
    memories: ConversationMemory[],
    currentMessage: string
  ): MemoryContext {
    const recentMemories = memories.slice(-10); // Últimas 10 conversaciones

    return {
      previousTopics: [...new Set(recentMemories.map(m => m.topic))],
      unresolvedIssues: recentMemories
        .filter(m => m.outcome === 'in_progress' || m.outcome === 'clarification_needed')
        .map(m => m.topic),
      successfulPatterns: recentMemories.filter(m => m.outcome === 'resolved').map(m => m.topic),
      userPreferences: this.extractUserPreferencesFromMemory(recentMemories),
      contextSummary: this.generateMemorySummary(recentMemories),
    };
  }

  private extractUserPreferencesFromMemory(memories: ConversationMemory[]): Record<string, any> {
    const prefs: Record<string, any> = {};

    // Analizar patrones de éxito
    const successfulTopics = memories.filter(m => m.outcome === 'resolved').map(m => m.topic);

    if (successfulTopics.length > 0) {
      prefs.preferredTopics = successfulTopics;
    }

    return prefs;
  }

  private generateMemorySummary(memories: ConversationMemory[]): string {
    if (memories.length === 0) {
      return 'Nueva conversación';
    }

    const topics = [...new Set(memories.map(m => m.topic))];
    const avgSatisfaction =
      memories
        .filter(m => m.userSatisfaction)
        .reduce((sum, m) => sum + (m.userSatisfaction || 0), 0) / memories.length;

    return `Conversaciones previas sobre: ${topics.join(', ')}. Satisfacción promedio: ${avgSatisfaction?.toFixed(1) || 'N/A'}`;
  }

  /**
   * 📈 Aprendizaje automático continuo
   */
  private learnFromInteraction(
    userId: string,
    message: string,
    response: string,
    sentiment: SentimentAnalysis
  ): void {
    // Aprender de sentimientos negativos para mejorar
    if (sentiment.emotion === 'anger' || sentiment.emotion === 'sadness') {
      this.continuousLearning.learnFromInteraction(
        userId,
        message,
        response,
        'failure',
        sentiment.intensity * 2 // Convertir a escala 1-5
      );
    } else if (sentiment.emotion === 'joy') {
      this.continuousLearning.learnFromInteraction(
        userId,
        message,
        response,
        'success',
        sentiment.intensity * 5
      );
    }
  }

  /**
   * 🛠️ Utilidades auxiliares
   */
  private isAgentSuitableForRole(agent: SpecializedAgent, userRole: string): boolean {
    const roleAgentMapping: Record<string, string[]> = {
      tenant: [
        'general_assistant',
        'property_expert',
        'financial_advisor',
        'maintenance_specialist',
      ],
      owner: [
        'general_assistant',
        'property_expert',
        'financial_advisor',
        'maintenance_specialist',
      ],
      broker: ['general_assistant', 'broker_consultant', 'property_expert', 'financial_advisor'],
      provider: ['general_assistant', 'maintenance_specialist', 'financial_advisor'],
      admin: ['general_assistant', 'technical_support', 'legal_expert'],
      guest: [
        'general_assistant',
        'maintenance_specialist',
        'broker_consultant',
        'property_expert',
      ],
    };

    return roleAgentMapping[userRole]?.includes(agent.id) || false;
  }

  /**
   * Procesar mensaje con IA avanzada (compatibilidad hacia atrás)
   */
  async processMessageAdvanced(
    userMessage: string,
    userRole: string,
    userId: string,
    conversationHistory: any[] = []
  ): Promise<{
    response: string;
    confidence: number;
    intent: string;
    suggestions?: string[] | undefined;
    actions?: string[] | undefined;
    links?: string[] | undefined;
    followUp?: string[] | undefined;
    securityNote?: string | undefined;
  }> {
    try {
      // Crear contexto de seguridad
      const securityContext = this.createSecurityContext(userRole, userId);

      // Reconocer intención del mensaje
      const intent = this.recognizeIntent(userMessage, userRole);

      // Generar respuesta inteligente
      const smartResponse = this.generateSmartResponse(intent, userRole, securityContext);

      // Si la confianza es baja, intentar con IA externa usando el método existente
      if (smartResponse.confidence < 0.7 && this.config?.provider !== 'local') {
        try {
          const aiResult = await this.processMessage(
            userMessage,
            userRole,
            userId,
            conversationHistory
          );
          if (aiResult.response && aiResult.response !== smartResponse.response) {
            // Combinar respuesta local con IA para mejor resultado
            smartResponse.response = this.enhanceWithAI(smartResponse.response, aiResult.response);
            smartResponse.confidence = Math.max(smartResponse.confidence, 0.8);
          }
        } catch (aiError) {
          logger.warn('Error con IA externa, usando respuesta local:', { error: aiError });
        }
      }

      return {
        response: smartResponse.response,
        confidence: smartResponse.confidence,
        intent: intent.intent,
        suggestions: smartResponse.suggestions,
        actions: smartResponse.actions,
        links: smartResponse.links,
        followUp: smartResponse.followUp,
        securityNote: smartResponse.securityNote,
      };
    } catch (error) {
      logger.error('Error procesando mensaje avanzado:', {
        error: error instanceof Error ? error.message : String(error),
      });
      // Generar respuesta de fallback con el formato correcto
      const fallback = this.generateFallbackResponse(userRole);
      return {
        response: fallback.response,
        confidence: fallback.confidence,
        intent: 'support',
        suggestions: fallback.suggestions,
        links: fallback.links,
      };
    }
  }

  /**
   * Mejorar respuesta local con IA externa
   */
  private enhanceWithAI(localResponse: string, aiResponse: string): string {
    // Combinar respuestas de manera inteligente
    if (aiResponse.length > localResponse.length * 0.5) {
      return `${localResponse}\n\n${aiResponse}`;
    }
    return localResponse;
  }

  /**
   * Inicializa los proveedores de IA disponibles
   */
  private async initializeAIProviders(): Promise<void> {
    try {
      // Intentar inicializar OpenAI
      const openaiKey = process.env.OPENAI_API_KEY;
      if (openaiKey) {
        this.openai = new OpenAI({
          apiKey: openaiKey,
        });
        this.config = {
          provider: 'openai',
          apiKey: openaiKey,
          model: process.env.OPENAI_MODEL || 'gpt-3.5-turbo',
          maxTokens: parseInt(process.env.OPENAI_MAX_TOKENS || '1000'),
          temperature: parseFloat(process.env.OPENAI_TEMPERATURE || '0.7'),
        };
        logger.info('OpenAI inicializado para chatbot');
        return;
      }

      // Intentar inicializar Anthropic (Claude)
      const anthropicKey = process.env.ANTHROPIC_API_KEY;
      if (anthropicKey) {
        this.anthropic = new Anthropic({
          apiKey: anthropicKey,
        });
        this.config = {
          provider: 'anthropic',
          apiKey: anthropicKey,
          model: process.env.ANTHROPIC_MODEL || 'claude-3-sonnet-20240229',
          maxTokens: parseInt(process.env.ANTHROPIC_MAX_TOKENS || '1000'),
          temperature: parseFloat(process.env.ANTHROPIC_TEMPERATURE || '0.7'),
        };
        logger.info('Anthropic inicializado para chatbot');
        return;
      }

      // Intentar inicializar Google AI (prioridad alta para modalidad híbrida)
      const googleKey = process.env.GOOGLE_AI_API_KEY;
      if (googleKey && googleKey.trim().length > 0) {
        try {
          this.googleAI = new GoogleGenerativeAI(googleKey);
          this.config = {
            provider: 'google',
            apiKey: googleKey.substring(0, 10) + '...', // Solo log parcial por seguridad
            model: process.env.GOOGLE_MODEL || 'gemini-pro',
            maxTokens: parseInt(process.env.GOOGLE_MAX_TOKENS || '1500'),
            temperature: parseFloat(process.env.GOOGLE_TEMPERATURE || '0.7'),
          };
          logger.info('✅ Google AI (Gemini) inicializado correctamente para chatbot', {
            model: this.config.model,
            maxTokens: this.config.maxTokens,
          });
          return;
        } catch (error) {
          logger.error('Error inicializando Google AI:', {
            error: error instanceof Error ? error.message : String(error),
          });
          // Continuar para intentar otros proveedores o usar local
        }
      }

      // Si no hay proveedores externos, usar lógica local (modalidad híbrida - fallback)
      this.config = {
        provider: 'local',
        apiKey: '',
        model: 'local-logic-enhanced',
        maxTokens: 1000,
        temperature: 0.7,
      };
      logger.info('⚠️ Usando lógica local mejorada para chatbot (modalidad híbrida - fallback)');
    } catch (error) {
      logger.error('Error inicializando proveedores de IA:', {
        error: error instanceof Error ? error.message : String(error),
      });
      // Fallback a lógica local
      this.config = {
        provider: 'local',
        apiKey: '',
        model: 'local-logic',
        maxTokens: 1000,
        temperature: 0.7,
      };
    }
  }

  /**
   * Procesa un mensaje del usuario usando datos de entrenamiento mejorados
   */
  async processMessageWithTrainingData(
    userMessage: string,
    userRole: string,
    userId: string,
    conversationHistory?: Array<{ role: 'user' | 'assistant'; content: string }>,
    context?: {
      userData?: any;
      memoryContext?: any;
      userContext?: any;
    }
  ): Promise<{
    response: string;
    confidence: number;
    intent?: string;
    suggestions?: string[];
    metadata?: Record<string, any>;
    trainingSource?: string;
  }> {
    try {
      // 🚀 SEGURIDAD: NO incluir datos reales del usuario en el prompt para IA externa
      // Solo usar información general y pública
      let enhancedPrompt = userMessage;

      // ⚠️ IMPORTANTE: NO incluir datos confidenciales del usuario en el prompt
      // Solo usar información general sobre el rol y funcionalidades permitidas
      // Los datos reales del usuario NO deben enviarse a IA externa por seguridad

      // 🚀 MODALIDAD HÍBRIDA: Estrategia en 3 niveles

      // NIVEL 1: Intentar con datos de entrenamiento específicos (rápido y preciso)
      const contextualResponse = TrainingDataManager.generateContextualResponse(
        enhancedPrompt,
        userRole,
        'user_query'
      );

      if (contextualResponse) {
        let confidence = TrainingDataManager.calculateConfidence(
          userMessage,
          contextualResponse,
          userRole
        );

        // 🚀 Aumentar confianza si tenemos datos reales del usuario
        if (context?.userData) {
          confidence = Math.min(0.95, confidence + 0.1);
        }

        // Si la confianza es alta (>= 0.8), usar respuesta de entrenamiento
        if (confidence >= 0.8) {
          const suggestions = TrainingDataManager.getSuggestionsByRole(userRole);
          const intentRecognition = this.recognizeIntent(userMessage, userRole);
          const intent = intentRecognition.intent;

          // Validar respuesta por seguridad antes de retornar
          // PERO: Si la respuesta viene de datos de entrenamiento con alta confianza,
          // solo validar información confidencial real, no bloquear por temas generales
          const securityContext = this.createSecurityContext(userRole, userId);
          let validatedResponse = this.validateResponse(contextualResponse, securityContext);

          // Si la validación bloqueó una respuesta de entrenamiento con alta confianza,
          // es probable que sea un falso positivo. Permitir la respuesta original si
          // no contiene información realmente confidencial.
          if (
            validatedResponse.includes('no puedo proporcionar') &&
            validatedResponse.includes('soporte técnico') &&
            !this.containsRealConfidentialInfo(contextualResponse)
          ) {
            logger.warn(
              'Validación bloqueó respuesta de entrenamiento, pero no contiene info confidencial real. Permitiendo respuesta original.',
              {
                userRole,
                intent,
              }
            );
            validatedResponse = contextualResponse;
          }

          aiLearningSystem.recordInteraction({
            userId,
            userRole,
            userMessage,
            botResponse: validatedResponse,
            context: {
              source: 'training_data',
              hasRealData: !!context?.userData,
              memoryTopics: context?.memoryContext?.previousTopics?.length || 0,
            },
            intent: intent || 'unknown',
            confidence,
          });

          logger.info('✅ Respuesta de entrenamiento (alta confianza)', {
            userId,
            userRole,
            intent,
            confidence,
            source: 'training_data',
          });

          return {
            response: validatedResponse,
            confidence,
            intent,
            suggestions,
            metadata: {
              source: 'training_data',
              dataset: 'specialized',
              timestamp: new Date().toISOString(),
            },
            trainingSource: 'specialized_dataset',
          };
        }
        // Si confianza es media (0.6-0.8), continuar a IA real para mejorar
      }

      // NIVEL 2: Usar IA real (Google AI) si está disponible y confianza de entrenamiento es baja
      if (this.config?.provider !== 'local' && this.config?.provider !== undefined) {
        try {
          logger.info('🤖 Usando IA real para generar respuesta', {
            provider: this.config.provider,
            userRole,
          });

          const securityContext = this.createSecurityContext(userRole, userId);
          const aiPrompt = this.createSecurePrompt(
            userMessage,
            securityContext,
            conversationHistory
          );

          let aiResult: { response: string; confidence: number };

          switch (this.config.provider) {
            case 'google':
              aiResult = await this.processWithGoogle(aiPrompt);
              break;
            case 'openai':
              aiResult = await this.processWithOpenAI(aiPrompt);
              break;
            case 'anthropic':
              aiResult = await this.processWithAnthropic(aiPrompt);
              break;
            default:
              throw new Error(`Proveedor ${this.config.provider} no soportado`);
          }

          // Validar respuesta de IA por seguridad
          const validatedAIResponse = this.validateResponse(aiResult.response, securityContext);

          const intentRecognition = this.recognizeIntent(userMessage, userRole);
          const intent = intentRecognition.intent;
          const suggestions = TrainingDataManager.getSuggestionsByRole(userRole);

          aiLearningSystem.recordInteraction({
            userId,
            userRole,
            userMessage,
            botResponse: validatedAIResponse,
            context: {
              source: 'ai_provider',
              provider: this.config.provider,
              hasRealData: !!context?.userData,
            },
            intent: intent || 'unknown',
            confidence: aiResult.confidence,
          });

          logger.info('✅ Respuesta generada por IA real', {
            provider: this.config.provider,
            confidence: aiResult.confidence,
            userRole,
          });

          return {
            response: validatedAIResponse,
            confidence: aiResult.confidence,
            intent,
            suggestions,
            metadata: {
              source: 'ai_provider',
              provider: this.config.provider,
              model: this.config.model,
              timestamp: new Date().toISOString(),
            },
          };
        } catch (error) {
          logger.error('⚠️ Error usando IA real, usando fallback local', {
            error: error instanceof Error ? error.message : String(error),
            provider: this.config?.provider,
          });
          // Continuar a fallback local
        }
      }

      // NIVEL 3: Fallback a lógica local mejorada
      logger.info('📚 Usando lógica local mejorada (fallback)', { userRole });
      const result = await this.processMessage(userMessage, userRole, userId, conversationHistory);

      // Validar respuesta local también
      const securityContext = this.createSecurityContext(userRole, userId);
      const validatedLocalResponse = this.validateResponse(result.response, securityContext);

      return {
        ...result,
        response: validatedLocalResponse,
        metadata: {
          ...result.metadata,
          source: 'local_logic',
          timestamp: new Date().toISOString(),
        },
      };
    } catch (error) {
      logger.error('Error procesando mensaje con datos de entrenamiento:', {
        error: error instanceof Error ? error.message : String(error),
      });
      const result = await this.processMessage(userMessage, userRole, userId, conversationHistory);
      return {
        ...result,
        metadata: result.metadata || {},
      };
    }
  }

  /**
   * Procesa un mensaje del usuario y genera respuesta
   */
  async processMessage(
    userMessage: string,
    userRole: string,
    userId: string,
    conversationHistory?: Array<{ role: 'user' | 'assistant'; content: string }>
  ): Promise<{
    response: string;
    confidence: number;
    intent?: string;
    suggestions?: string[];
    metadata?: Record<string, any> | undefined;
  }> {
    try {
      if (!this.config) {
        throw new Error('Servicio de IA no inicializado');
      }

      // Crear contexto de seguridad
      const securityContext = this.createSecurityContext(userRole, userId);

      // Crear prompt con restricciones de seguridad
      const prompt = this.createSecurePrompt(userMessage, securityContext, conversationHistory);

      let response: string;
      let confidence: number;

      // Usar el proveedor de IA configurado
      switch (this.config.provider) {
        case 'openai':
          ({ response, confidence } = await this.processWithOpenAI(prompt));
          break;

        case 'anthropic':
          ({ response, confidence } = await this.processWithAnthropic(prompt));
          break;

        case 'google':
          ({ response, confidence } = await this.processWithGoogle(prompt));
          break;

        case 'local':
        default:
          ({ response, confidence } = await this.processWithLocalLogic(userMessage, userRole));
          break;
      }

      // Validar respuesta por seguridad
      const validatedResponse = this.validateResponse(response, securityContext);

      // Extraer información adicional
      const intentRecognition = this.recognizeIntent(userMessage, userRole);
      const intent = intentRecognition.intent;
      const suggestions = this.generateSuggestions(userMessage, userRole);

      logger.info('Mensaje procesado por IA', {
        userId,
        userRole,
        intent,
        confidence,
        provider: this.config.provider,
      });

      return {
        response: validatedResponse,
        confidence,
        intent,
        suggestions,
        metadata: {
          provider: this.config.provider,
          model: this.config.model,
          processingTime: Date.now(),
        },
      };
    } catch (error) {
      logger.error('Error procesando mensaje:', {
        error: error instanceof Error ? error.message : String(error),
      });

      // Respuesta de fallback segura
      return {
        response:
          'Lo siento, tuve un problema procesando tu consulta. ¿Podrías reformular tu pregunta?',
        confidence: 0,
        suggestions: ['Buscar propiedades', 'Ver contratos', 'Contactar soporte'],
      };
    }
  }

  /**
   * Procesa con OpenAI
   */
  private async processWithOpenAI(
    prompt: string
  ): Promise<{ response: string; confidence: number }> {
    if (!this.openai) {
      throw new Error('OpenAI no inicializado');
    }

    const completion = await this.openai.chat.completions.create({
      model: this.config!.model,
      messages: [{ role: 'user', content: prompt }],
      max_tokens: this.config!.maxTokens,
      temperature: this.config!.temperature,
    });

    const response =
      completion.choices[0]?.message?.content || 'Lo siento, no pude generar una respuesta.';
    const confidence = 0.85; // OpenAI generalmente tiene alta confianza

    return { response, confidence };
  }

  /**
   * Procesa con Anthropic (Claude)
   */
  private async processWithAnthropic(
    prompt: string
  ): Promise<{ response: string; confidence: number }> {
    if (!this.anthropic) {
      throw new Error('Anthropic no inicializado');
    }

    const message = await this.anthropic.messages.create({
      model: this.config!.model,
      max_tokens: this.config!.maxTokens,
      temperature: this.config!.temperature,
      messages: [{ role: 'user', content: prompt }],
    });

    const response =
      message.content[0]?.type === 'text'
        ? message.content[0]?.text
        : 'Lo siento, no pude generar una respuesta.';
    const confidence = 0.9; // Claude generalmente tiene muy alta confianza

    return { response, confidence };
  }

  /**
   * Procesa con Google AI
   */
  private async processWithGoogle(
    prompt: string
  ): Promise<{ response: string; confidence: number }> {
    if (!this.googleAI) {
      throw new Error('Google AI no inicializado');
    }

    try {
      // 🔒 Configuración del modelo con seguridad reforzada
      const model = this.googleAI.getGenerativeModel({
        model: this.config!.model || 'gemini-pro',
        generationConfig: {
          maxOutputTokens: this.config!.maxTokens || 1000,
          temperature: this.config!.temperature || 0.7,
          topP: 0.8,
          topK: 40,
        },
        // 🛡️ Configuración de seguridad estricta para bloquear contenido peligroso
        safetySettings: [
          {
            category: HarmCategory.HARM_CATEGORY_HARASSMENT,
            threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
          },
          {
            category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
            threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
          },
          {
            category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
            threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
          },
          {
            category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
            threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
          },
        ],
      });

      const result = await model.generateContent(prompt);
      const response = result.response.text();

      // Validar que la respuesta no esté vacía
      if (!response || response.trim().length === 0) {
        throw new Error('Respuesta vacía de Google AI');
      }

      const confidence = 0.85; // Google AI tiene buena confianza

      logger.info('Respuesta generada por Google AI', {
        responseLength: response.length,
        confidence,
      });

      return { response, confidence };
    } catch (error) {
      logger.error('Error procesando con Google AI:', {
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  /**
   * Normaliza texto para mejor detección (elimina acentos, normaliza mayúsculas, etc.)
   */
  private normalizeText(text: string): string {
    return text
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Eliminar acentos
      .trim();
  }

  /**
   * Sistema de sinónimos para mejorar detección
   */
  private expandSynonyms(text: string): string {
    const sinonimosMap: Record<string, string[]> = {
      // Firmas
      firmar: [
        'firma',
        'firmado',
        'firmas',
        'firmación',
        'firmas digitales',
        'firma electrónica',
        'firma electronica',
      ],
      firma: ['firmar', 'firmado', 'firmas', 'firmación'],
      digital: ['electrónica', 'electronica', 'online', 'en línea', 'en linea'],
      electrónica: ['digital', 'electronica', 'online'],
      electronica: ['digital', 'electrónica', 'online'],

      // Pagos
      pago: ['pagar', 'pagos', 'pagado', 'pague', 'pago mensual', 'renta', 'arriendo'],
      pagar: ['pago', 'pagos', 'pagado', 'pague'],
      renta: ['arriendo', 'alquiler', 'pago', 'pago mensual'],
      arriendo: ['renta', 'alquiler', 'pago'],
      alquiler: ['renta', 'arriendo', 'pago'],

      // Contratos
      contrato: [
        'contratos',
        'contratar',
        'contratación',
        'contratacion',
        'documento',
        'documentos',
      ],
      contratos: ['contrato', 'contratar', 'documento'],

      // Propiedades
      propiedad: [
        'propiedades',
        'inmueble',
        'inmuebles',
        'casa',
        'casas',
        'departamento',
        'departamentos',
      ],
      propiedades: ['propiedad', 'inmueble', 'inmuebles'],
      casa: ['casas', 'propiedad', 'vivienda', 'hogar'],
      departamento: ['departamentos', 'depto', 'propiedad', 'apartamento'],

      // Registro
      registro: [
        'registrarse',
        'registrado',
        'registrar',
        'crear cuenta',
        'darse de alta',
        'unirse',
      ],
      registrarse: ['registro', 'registrar', 'crear cuenta', 'darse de alta'],
      crear: ['crear cuenta', 'registrar', 'registrarse', 'darse de alta'],
      cuenta: ['perfil', 'usuario', 'registro'],

      // Servicios/Proveedores
      servicio: ['servicios', 'trabajo', 'trabajos', 'mantenimiento'],
      servicios: ['servicio', 'trabajo', 'trabajos'],
      ofrecer: [
        'ofrecer servicios',
        'prestar servicios',
        'dar servicios',
        'brindar servicios',
        'trabajar',
      ],
      proveedor: ['proveedores', 'provider', 'técnico', 'tecnico', 'profesional'],

      // Corredores
      corredor: [
        'corredores',
        'broker',
        'agente',
        'agente inmobiliario',
        'corredor de propiedades',
      ],
      broker: ['corredor', 'agente', 'agente inmobiliario'],
      administrar: [
        'gestionar',
        'administración',
        'administracion',
        'gestion',
        'gestionar propiedad',
      ],
      gestionar: ['administrar', 'gestion', 'administración'],

      // Mantenimiento
      mantenimiento: [
        'reparar',
        'reparación',
        'reparacion',
        'arreglar',
        'arreglo',
        'problema',
        'problemas',
      ],
      reparar: ['arreglar', 'mantenimiento', 'reparación'],
      arreglar: ['reparar', 'mantenimiento', 'arreglo'],
      problema: ['problemas', 'daño', 'daños', 'avería', 'averias'],

      // Comisiones
      comisión: ['comisiones', 'comision', 'porcentaje', 'retención', 'retencion'],
      comision: ['comisión', 'comisiones', 'porcentaje'],
      porcentaje: ['comisión', 'comisiones', 'retención'],

      // Costos
      costo: [
        'costos',
        'precio',
        'precios',
        'tarifa',
        'tarifas',
        'cuánto cuesta',
        'cuanto cuesta',
        'gratis',
        'gratuito',
      ],
      precio: ['costos', 'tarifa', 'cuánto cuesta'],
      gratis: ['gratuito', 'sin costo', 'sin costos'],

      // Funcionalidades
      funcionalidad: [
        'funcionalidades',
        'características',
        'caracteristicas',
        'servicios',
        'qué ofrece',
        'que ofrece',
      ],
      'qué puedo hacer': ['qué ofrece', 'funcionalidades', 'características'],
      'qué ofrece': ['funcionalidades', 'características', 'qué puedo hacer'],

      // Seguridad
      seguro: ['seguridad', 'protegido', 'confiable', 'confianza', 'es seguro'],
      seguridad: ['seguro', 'protegido', 'confiable'],
      protegido: ['seguro', 'seguridad', 'confiable'],

      // Verificación
      verificación: [
        'verificacion',
        'verificar',
        'verificado',
        'aprobación',
        'aprobacion',
        'cuánto tarda',
        'cuanto tarda',
      ],
      verificar: ['verificación', 'verificado', 'aprobación'],
      verificado: ['verificación', 'verificar', 'aprobado'],

      // Runner360
      runner: ['runner360', 'runner 360', 'visita', 'visitas', 'recorrido', 'recorridos'],
      runner360: ['runner', 'runner 360', 'visita profesional'],
      visita: ['visitas', 'recorrido', 'recorridos', 'runner360'],

      // Calificaciones
      calificación: [
        'calificaciones',
        'calificacion',
        'rating',
        'ratings',
        'reseña',
        'reseñas',
        'comentario',
        'comentarios',
      ],
      calificaciones: ['calificación', 'rating', 'reseñas'],
      rating: ['calificación', 'calificaciones', 'reseña'],

      // Renovaciones
      renovar: ['renovación', 'renovacion', 'renovaciones', 'renovar contrato', 'extender'],
      renovación: ['renovar', 'renovaciones', 'extender'],

      // Documentos
      documento: [
        'documentos',
        'papel',
        'papeles',
        'archivo',
        'archivos',
        'certificado',
        'certificados',
      ],
      documentos: ['documento', 'papeles', 'archivos'],
      certificado: ['certificados', 'certificación', 'certificacion'],
    };

    let expandedText = text;
    for (const [palabra, sinonimosList] of Object.entries(sinonimosMap)) {
      if (expandedText.includes(palabra)) {
        // Agregar sinónimos al texto para mejorar detección
        sinonimosList.forEach((sin: string) => {
          if (!expandedText.includes(sin)) {
            expandedText += ' ' + sin;
          }
        });
      }
    }
    return expandedText;
  }

  /**
   * Procesa con lógica local (sin IA externa)
   * 🚀 REFACTORIZADO: Usa sistema unificado de detección sin duplicación
   */
  private async processWithLocalLogic(
    userMessage: string,
    userRole: string
  ): Promise<{ response: string; confidence: number }> {
    const normalizedInput = this.normalizeText(userMessage);
    const expandedInput = this.expandSynonyms(normalizedInput);
    const input = expandedInput.toLowerCase();

    // 🚀 MEJORADO: Usar reconocimiento de intenciones mejorado (sistema unificado)
    const intent = this.recognizeIntent(userMessage, userRole);

    // Si tenemos una intención específica con alta confianza, usar la base de conocimiento
    if (intent.confidence > 0.7) {
      const securityContext = this.createSecurityContext(userRole, 'anonymous');
      const smartResponse = this.generateSmartResponse(intent, userRole, securityContext);

      if (smartResponse.response && smartResponse.confidence > 0.6) {
        return {
          response: smartResponse.response,
          confidence: smartResponse.confidence,
        };
      }
    }

    // 🚀 NUEVO: Respuestas específicas para nuevas intenciones detectadas
    // Estas respuestas tienen prioridad sobre las detecciones generales
    const specificResponses = this.getSpecificIntentResponses(
      intent.intent,
      input,
      userRole,
      intent.confidence
    );
    if (specificResponses) {
      return specificResponses;
    }

    // Respuesta por defecto mejorada para usuarios guest
    if (userRole === 'guest' || userRole === 'GUEST') {
      return {
        response:
          '¡Hola! Soy el asistente de Rent360. Puedo ayudarte con:\n\n**Información sobre:**\n- Registro y creación de cuenta\n- Tipos de usuarios (propietario, inquilino, proveedor, corredor)\n- Cómo buscar o publicar propiedades\n- Sistema de pagos\n- Cómo ofrecer servicios\n- Contratos digitales\n- Y mucho más\n\n**Ejemplos de preguntas que puedo responder:**\n- "¿Cómo me registro como proveedor?"\n- "¿Cómo busco propiedades?"\n- "¿Cuánto cuesta usar Rent360?"\n- "Soy jardinero, ¿cómo ofrezco mis servicios?"\n\n¿Sobre qué te gustaría saber? Hazme cualquier pregunta y te ayudo.',
        confidence: 0.6,
      };
    }

    // Respuesta por defecto para usuarios registrados
    return {
      response:
        'Entiendo tu consulta. Te puedo ayudar con:\n\n- **Búsqueda y gestión de propiedades**\n- **Gestión de contratos** (crear, ver, renovar)\n- **Pagos** (realizar, configurar automáticos, ver historial)\n- **Mantenimiento** (solicitar, ver estado, comunicarte con proveedores)\n- **Documentos** (subir, ver, gestionar)\n- **Comisiones y ganancias**\n- **Configuración de tu cuenta**\n\n¿Qué te gustaría hacer? Puedes preguntarme algo específico o usar las opciones rápidas del menú.',
      confidence: 0.6,
    };
  }

  /**
   * Crea contexto de seguridad basado en el rol del usuario
   */
  private createSecurityContext(
    userRole: string,
    userId: string
  ): {
    allowedTopics: string[];
    restrictedTopics: string[];
    maxDataAccess: string;
    canExecuteActions: boolean;
  } {
    const context = {
      allowedTopics: [] as string[],
      restrictedTopics: [] as string[],
      maxDataAccess: 'own_data',
      canExecuteActions: false,
    };

    switch (userRole.toUpperCase()) {
      case 'TENANT':
        context.allowedTopics = [
          'propiedades',
          'contratos',
          'pagos',
          'mantenimiento',
          'perfil',
          'notificaciones',
          'soporte',
        ];
        context.restrictedTopics = [
          'sistema',
          'administración',
          'finanzas',
          'usuarios',
          'configuración',
          'seguridad',
          'datos sensibles',
        ];
        break;

      case 'OWNER':
        context.allowedTopics = [
          'propiedades',
          'contratos',
          'pagos',
          'inquilinos',
          'mantenimiento',
          'reportes',
          'perfil',
          'soporte',
        ];
        context.restrictedTopics = [
          'sistema',
          'administración',
          'otros propietarios',
          'datos sensibles',
          'configuración global',
        ];
        break;

      case 'BROKER':
        context.allowedTopics = [
          'propiedades',
          'contratos',
          'clientes',
          'pagos',
          'comisiones',
          'reportes',
          'perfil',
          'soporte',
        ];
        context.restrictedTopics = [
          'sistema',
          'administración',
          'finanzas globales',
          'otros corredores',
          'configuración del sistema',
        ];
        break;

      case 'ADMIN':
        context.allowedTopics = [
          'todo', // Los admins pueden acceder a todo
        ];
        context.restrictedTopics = [];
        context.maxDataAccess = 'all_data';
        context.canExecuteActions = true;
        break;

      case 'GUEST':
      case 'ANONYMOUS':
      case 'guest':
      case 'anonymous':
        // Usuarios guest pueden hacer preguntas generales sobre la plataforma
        context.allowedTopics = [
          'registro',
          'crear cuenta',
          'tipos de usuarios',
          'propiedades',
          'búsqueda',
          'pagos',
          'contratos',
          'servicios',
          'proveedores',
          'corredores',
          'mantenimiento',
          'funcionalidades',
          'comisiones',
          'costos',
          'documentos',
          'verificación',
          'perfil',
          'soporte',
          'ayuda',
          'información general',
          'cómo funciona',
          'qué es rent360',
        ];
        context.restrictedTopics = [
          'datos personales de usuarios',
          'información financiera específica',
          'contraseñas',
          'tokens',
          'api keys',
          'estructura de base de datos',
          'código fuente',
          'configuraciones internas',
          'vulnerabilidades',
        ];
        context.maxDataAccess = 'public_info_only';
        context.canExecuteActions = false;
        break;

      default:
        // Rol desconocido - acceso mínimo pero permitir preguntas generales
        context.allowedTopics = [
          'registro',
          'crear cuenta',
          'propiedades',
          'pagos',
          'contratos',
          'servicios',
          'perfil',
          'soporte',
          'ayuda',
        ];
        context.restrictedTopics = [
          'datos personales',
          'información financiera específica',
          'configuración del sistema',
        ];
        break;
    }

    return context;
  }

  /**
   * Crea prompt seguro con restricciones
   */
  private createSecurePrompt(
    userMessage: string,
    securityContext: any,
    conversationHistory?: Array<{ role: 'user' | 'assistant'; content: string }>
  ): string {
    // Analizar el mensaje para detectar contexto específico
    const messageLower = userMessage.toLowerCase();
    const isProviderQuestion =
      /(?:soy|trabajo como|me dedico a|puedo ofrecer|quiero ofrecer|ofrezco)\s+(?:electricista|plomero|gasfiter|jardinero|limpieza|pintura|carpintero|mantenimiento|seguridad|servicios)/i.test(
        userMessage
      );
    const isRegistrationQuestion =
      /(?:registro|registrarme|crear cuenta|darme de alta|unirme|empezar|comenzar|como|dónde|donde)/i.test(
        userMessage
      );
    const serviceType =
      messageLower.match(
        /(?:soy|trabajo como|me dedico a)\s+(electricista|plomero|gasfiter|jardinero|limpieza|pintura|carpintero|mantenimiento|seguridad)/i
      )?.[1] || '';

    const systemPrompt = `
Eres un asistente virtual especializado en Rent360, una plataforma de gestión inmobiliaria.

🔒 RESTRICCIONES DE SEGURIDAD CRÍTICAS (NUNCA VIOLAR):

**INFORMACIÓN PROHIBIDA - NUNCA COMPARTIR:**
- Datos personales de usuarios (emails, teléfonos, direcciones, RUTs, números de cuenta bancaria)
- Información financiera específica (montos de pagos, saldos, números de tarjeta)
- Contraseñas, tokens, API keys, o credenciales de cualquier tipo
- Información técnica del sistema (estructura de base de datos, código fuente, configuraciones internas)
- Datos de otros usuarios que no sean públicos
- Información de seguridad del sistema (vulnerabilidades, métodos de encriptación)
- Detalles de implementación técnica (nombres de tablas, esquemas de base de datos, endpoints internos)
- Información de configuración del servidor o infraestructura

**ACCESO A DATOS:**
- Solo puedes acceder a información pública y general sobre Rent360
- NO puedes acceder a datos del usuario actual (${securityContext.maxDataAccess})
- NO puedes ejecutar acciones del sistema
- NO puedes modificar configuraciones
- NO puedes acceder a datos de otros usuarios

**TEMAS PERMITIDOS:**
${securityContext.allowedTopics.map((topic: string) => `- ${topic}`).join('\n')}

**TEMAS RESTRINGIDOS (NUNCA RESPONDER):**
${securityContext.restrictedTopics.map((topic: string) => `- ${topic}`).join('\n')}

**CONTEXTO ESPECÍFICO DE LA PREGUNTA:**
${isProviderQuestion ? `- El usuario está preguntando sobre ofrecer servicios como proveedor${serviceType ? ` (específicamente: ${serviceType})` : ''}` : ''}
${isRegistrationQuestion ? '- El usuario está interesado en registrarse o crear una cuenta' : ''}

**INSTRUCCIONES DE RESPUESTA:**
1. **SIEMPRE responde de forma específica y directa a la pregunta del usuario.** No uses respuestas genéricas.
2. Si el usuario pregunta sobre ofrecer servicios (ej: "soy electricista, puedo ofrecer mis servicios?"), responde específicamente sobre cómo registrarse como proveedor de servicios, mencionando el tipo de servicio si fue mencionado.
3. Si el usuario pregunta sobre registro, proporciona pasos claros y específicos según el tipo de usuario que quiere ser.
4. Solo proporciona información general sobre funcionalidades de Rent360
5. NUNCA menciones datos específicos de usuarios, propiedades, contratos o pagos
6. Si se pregunta por información confidencial, responde: "No puedo acceder a información personal. Para consultas específicas, contacta al soporte."
7. Si la pregunta es sobre temas restringidos, redirige al soporte: "Para esa consulta, te recomiendo contactar al soporte técnico."
8. Mantén un tono amigable y profesional
9. Si no sabes la respuesta exacta, proporciona información general útil
10. NUNCA inventes información que no conozcas con certeza
11. NUNCA proporciones pasos técnicos que puedan comprometer la seguridad
12. **IMPORTANTE:** Si el usuario menciona un tipo de servicio específico (electricista, plomero, etc.), personaliza tu respuesta mencionando ese servicio específicamente.

**EJEMPLOS DE RESPUESTAS CORRECTAS:**
- ✅ Usuario: "soy electricista, puedo ofrecer mis servicios?"
  Respuesta: "¡Claro que sí! Puedes registrarte como proveedor de servicios de electricidad en Rent360. El proceso es simple: 1) Ve a 'Crear cuenta' y selecciona 'Proveedor de Servicios', 2) Completa tus datos personales, 3) Sube tu cédula de identidad y certificado de antecedentes, 4) Si tienes certificación profesional de electricista, súbela también, 5) Define qué servicios de electricidad ofreces y en qué zonas trabajas. Una vez verificado, aparecerás en búsquedas cuando propietarios necesiten servicios eléctricos. Los pagos son automáticos y seguros. ¿Quieres que te guíe paso a paso?"

- ✅ "Para registrarte como proveedor, ve a Registrarse y selecciona Proveedor de Servicios"
- ✅ "Los pagos se procesan de forma segura con múltiples métodos disponibles"
- ❌ "Tu saldo actual es $500.000" (NUNCA - información confidencial)
- ❌ "La base de datos usa PostgreSQL con esquema X" (NUNCA - información técnica)

Pregunta del usuario: ${userMessage}

${
  conversationHistory
    ? `Historial de conversación (últimas 3 interacciones):\n${conversationHistory
        .slice(-3)
        .map(msg => `${msg.role}: ${msg.content}`)
        .join('\n')}`
    : ''
}

Recuerda: SIEMPRE prioriza la seguridad y privacidad. Si hay duda, redirige al soporte. **RESPONDE DE FORMA ESPECÍFICA Y DIRECTA A LA PREGUNTA, NO USES RESPUESTAS GENÉRICAS.**

Respuesta (solo información general y pública, pero específica y útil):
`;

    return systemPrompt;
  }

  /**
   * Valida respuesta por seguridad - VERSIÓN MEJORADA CON DETECCIÓN DE INFORMACIÓN CONFIDENCIAL
   */
  private validateResponse(response: string, securityContext: any): string {
    const lowerResponse = response.toLowerCase();

    // 🚨 DETECCIÓN DE INFORMACIÓN CONFIDENCIAL
    const confidentialPatterns = [
      // Datos personales
      /\b\d{8,9}\b/g, // RUTs (8-9 dígitos)
      /\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/g, // Números de tarjeta
      /\b\d{10,}\b/g, // Números de cuenta bancaria
      // Emails específicos (no genéricos)
      /\b[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}\b/gi,
      // Información técnica confidencial
      /\b(password|contraseña|secret|token|api[_\s]?key|credential)\s*[:=]\s*\S+/gi,
      /\b(database|db|schema|table|endpoint|api[_\s]?url)\s*[:=]\s*\S+/gi,
      // Información financiera específica
      /\$\s*\d{1,3}(?:\.\d{3})*(?:,\d{2})?\b/g, // Montos específicos grandes
      // Información de sistema
      /\b(server|servidor|host|ip|port|config|env)\s*[:=]\s*\S+/gi,
    ];

    for (const pattern of confidentialPatterns) {
      if (pattern.test(response)) {
        logger.warn('Respuesta bloqueada por contener información confidencial potencial', {
          pattern: pattern.toString(),
        });
        return 'Lo siento, no puedo proporcionar esa información por razones de seguridad. Para consultas específicas, contacta al soporte técnico.';
      }
    }

    // Verificar si contiene información restringida
    // Solo bloquear si la respuesta contiene información confidencial REAL, no temas generales
    const hasRestrictedContent = securityContext.restrictedTopics.some((topic: string) => {
      const topicLower = topic.toLowerCase();
      // Solo bloquear si el tema restringido aparece en un contexto que indica información confidencial
      // No bloquear si es parte de una explicación general
      const restrictedPatterns = [
        /\b(tu|su|mi|nuestro|vuestro)\s+\w*\s*(email|teléfono|dirección|rut|cuenta|saldo|pago|contraseña|password|token|api key)\b/gi,
        /\b(email|teléfono|dirección|rut|cuenta|saldo|pago|contraseña|password|token|api key)\s*(es|está|fue|será|sería)\s*[:=]\s*\S+/gi,
        /\b(base de datos|database|schema|tabla|endpoint|servidor|server)\s*(es|está|usa|utiliza|tiene)\s*[:=]\s*\S+/gi,
      ];

      // Si el tema restringido está en la lista pero no en un contexto confidencial, permitir
      if (lowerResponse.includes(topicLower)) {
        // Verificar si está en un contexto confidencial
        const isConfidentialContext = restrictedPatterns.some(pattern => pattern.test(response));
        return isConfidentialContext;
      }
      return false;
    });

    if (hasRestrictedContent) {
      logger.warn('Respuesta bloqueada por tema restringido en contexto confidencial', {
        restrictedTopics: securityContext.restrictedTopics,
      });
      return 'Lo siento, no puedo proporcionar información confidencial. Para consultas específicas sobre tu cuenta, inicia sesión o contacta al soporte técnico.';
    }

    // Verificar si intenta ejecutar acciones REALES (no instrucciones informativas)
    // Solo bloquear si la respuesta parece ser un comando directo, no una explicación
    const actionKeywords = [
      'eliminar',
      'borrar',
      'modificar',
      'cambiar',
      'actualizar',
      'crear',
      'ejecutar',
      'correr',
      'run',
      'delete',
      'update',
      'create',
    ];

    // Contextos que indican que es una instrucción informativa, no un comando
    const instructionContexts = [
      'para realizar',
      'puedes realizar',
      'debes realizar',
      'necesitas realizar',
      'te explico',
      'pasos para',
      'cómo realizar',
      'para ejecutar',
      'puedes ejecutar',
      'debes ejecutar',
      'necesitas ejecutar',
      'cómo ejecutar',
      've a',
      'haz clic',
      'selecciona',
      'accede a',
    ];

    const hasActionKeywords = actionKeywords.some(keyword => lowerResponse.includes(keyword));
    const isInstruction = instructionContexts.some(context => lowerResponse.includes(context));

    // Solo bloquear si tiene palabras de acción PERO NO es una instrucción informativa
    if (hasActionKeywords && !isInstruction && !securityContext.canExecuteActions) {
      // Verificar si es una respuesta informativa del chatbot (contiene "te explico", "pasos", etc.)
      const isInformativeResponse =
        lowerResponse.includes('te explico') ||
        lowerResponse.includes('pasos') ||
        lowerResponse.includes('cómo') ||
        lowerResponse.includes('debes') ||
        lowerResponse.includes('puedes') ||
        lowerResponse.includes('necesitas') ||
        lowerResponse.includes('ve a') ||
        lowerResponse.includes('haz clic') ||
        lowerResponse.includes('selecciona');

      // Si es informativa, permitirla
      if (isInformativeResponse) {
        return response;
      }

      // Si no es informativa y parece un comando, bloquear
      return 'Para realizar cambios en tu cuenta o ejecutar acciones, por favor accede directamente a las secciones correspondientes del sistema o contacta al soporte.';
    }

    // 🚨 DETECCIÓN DE INFORMACIÓN DE OTROS USUARIOS
    const otherUserPatterns = [
      /\b(usuario|user|propietario|inquilino)\s+(?:llamado|nombre|es)\s+[A-Z][a-z]+\b/gi,
      /\b(email|correo|teléfono|teléfono)\s+(?:de|del|es)\s+[^\s]+\b/gi,
    ];

    for (const pattern of otherUserPatterns) {
      if (pattern.test(response)) {
        logger.warn('Respuesta bloqueada por posible información de otros usuarios');
        return 'No puedo proporcionar información sobre otros usuarios. Para consultas específicas, contacta al soporte.';
      }
    }

    return response;
  }

  /**
   * 🚀 NUEVO: Obtiene respuestas específicas para intenciones detectadas
   * Este método centraliza las respuestas para evitar duplicación
   */
  private getSpecificIntentResponses(
    intent: string,
    input: string,
    userRole: string,
    confidence: number
  ): { response: string; confidence: number } | null {
    // Solo procesar si la confianza es alta
    if (confidence < 0.85) {
      return null;
    }

    switch (intent) {
      case 'digital_signature':
        return {
          response:
            '¡Sí! Rent360 tiene un sistema completo de **firmas digitales** para contratos. Te explico:\n\n**✅ Firmas Digitales Disponibles:**\n- Los contratos de arriendo se pueden firmar digitalmente\n- Es **legalmente válido** y cumple con la normativa chilena\n- No necesitas imprimir ni escanear documentos\n- Todo el proceso es 100% digital y seguro\n\n**🔐 Seguridad y Validez Legal:**\n- Las firmas digitales tienen validez legal en Chile\n- Utilizamos proveedores certificados (FirmaPro, TrustFactory)\n- Cada firma queda registrada con fecha, hora y ubicación\n- Los documentos firmados son inalterables\n\n**📝 Cómo Funciona:**\n1. **Propietario o Corredor** crea el contrato en el sistema\n2. El sistema genera el documento con todos los términos\n3. Se envía para firma a ambas partes (propietario e inquilino)\n4. Cada parte recibe una notificación por email\n5. Puedes firmar desde cualquier dispositivo (celular, tablet, computador)\n6. Una vez firmado por ambas partes, el contrato queda activo\n7. Recibes una copia digital del contrato firmado\n\n**💡 Ventajas:**\n- Proceso rápido: firmas en minutos, no días\n- Sin necesidad de reunirse presencialmente\n- Documentos almacenados de forma segura en la nube\n- Acceso 24/7 desde cualquier lugar\n- Notificaciones automáticas de cambios o actualizaciones\n\n**📋 Para Propietarios:**\n- Crea contratos desde "Contratos" → "Nuevo Contrato"\n- Envía para firma directamente desde la plataforma\n- Gestiona todos tus contratos en un solo lugar\n\n**🏠 Para Inquilinos:**\n- Recibirás una notificación cuando haya un contrato para firmar\n- Puedes revisar todos los términos antes de firmar\n- Accede a "Mis Contratos" para ver tus documentos firmados\n\n¿Tienes alguna pregunta específica sobre el proceso de firma digital?',
          confidence: 0.95,
        };

      case 'hire_broker':
        return {
          response:
            '¡Perfecto! Sí, puedes contratar un corredor inmobiliario en Rent360 para que administre tu propiedad. Te explico cómo:\n\n**Cómo contratar un corredor en Rent360:**\n\n1. **Regístrate como Propietario**: Si aún no tienes cuenta, crea una cuenta como "Propietario"\n2. **Ve a "Servicios de Corredor"**: En tu panel de propietario, busca la sección "Servicios de Corredor" o "Broker Services"\n3. **Busca corredores disponibles**:\n   - Verás una lista de corredores verificados en tu zona\n   - Cada corredor muestra su experiencia, calificaciones y servicios ofrecidos\n   - Puedes ver sus calificaciones y comentarios de otros propietarios\n4. **Selecciona propiedades**: Elige qué propiedades quieres que el corredor administre\n5. **Envía solicitud**: Contacta directamente al corredor desde la plataforma\n6. **Negocia términos**: El corredor te enviará una propuesta con:\n   - Comisión (generalmente entre 3% y 5% del valor del contrato)\n   - Servicios incluidos (publicación, visitas, gestión de contratos, etc.)\n   - Términos y condiciones\n7. **Acepta la propuesta**: Una vez aceptada, el corredor comenzará a gestionar tu propiedad\n\n**Servicios que puede ofrecer el corredor:**\n- Publicar tu propiedad en múltiples plataformas\n- Gestionar visitas y mostrar la propiedad\n- Negociar con inquilinos potenciales\n- Preparar y gestionar contratos de arriendo\n- Realizar verificaciones de antecedentes\n- Gestionar renovaciones y terminaciones\n- Asesoría en precios de mercado\n\n**Beneficios:**\n- Ahorras tiempo en la gestión\n- Acceso a más inquilinos potenciales\n- Gestión profesional de contratos\n- Mayor seguridad en las transacciones\n\n¿Tienes alguna pregunta específica sobre el proceso o los servicios de corredores?',
          confidence: 0.95,
        };

      case 'costs_pricing':
        return {
          response:
            '**Costos y Precios en Rent360:**\n\n✅ **Rent360 es GRATIS para usuarios básicos**\n- No hay costos de registro\n- No hay costos mensuales\n- No hay costos por publicar propiedades\n\n💰 **Solo pagas cuando hay transacciones exitosas:**\n\n📊 **Corredores:**\n- Comisión del 3% al 5% del valor del contrato (configurable)\n- Solo se cobra cuando se firma un contrato de arriendo\n\n🔧 **Proveedores de Servicios:**\n- Comisión del 8% del monto del servicio\n- Solo se cobra cuando completas un trabajo\n\n🏃 **Runner360 (Visitas Profesionales):**\n- $15.000 - $25.000 por visita\n- Depende del tipo de visita y ubicación\n\n💳 **Métodos de Pago:**\n- Khipu, Stripe, PayPal, WebPay\n- Sin costos adicionales por usar la plataforma de pagos\n\n**Resumen:**\n- ✅ Registro: GRATIS\n- ✅ Publicar propiedades: GRATIS\n- ✅ Buscar propiedades: GRATIS\n- ✅ Usar la plataforma: GRATIS\n- 💰 Solo pagas comisiones cuando hay transacciones exitosas\n\n¿Tienes alguna pregunta específica sobre los costos?',
          confidence: 0.9,
        };

      case 'platform_features':
        return {
          response:
            '**Funcionalidades de Rent360:**\n\n🏠 **Gestión de Propiedades:**\n- Publicar y gestionar propiedades\n- Búsqueda avanzada con filtros\n- Galería de fotos y videos\n- Mapas interactivos\n- Calendario de disponibilidad\n\n📄 **Contratos Digitales:**\n- Crear contratos digitales\n- Firma electrónica legalmente válida\n- Renovaciones automáticas\n- Gestión de documentos\n\n💰 **Sistema de Pagos:**\n- Múltiples métodos de pago (Khipu, Stripe, PayPal, WebPay)\n- Pagos automáticos recurrentes\n- Historial completo de transacciones\n- Reportes financieros\n\n🔧 **Mantenimiento y Servicios:**\n- Solicitar mantenimiento\n- Conectar con proveedores verificados\n- Seguimiento de trabajos\n- Sistema de calificaciones\n\n🏃 **Runner360:**\n- Visitas profesionales a propiedades\n- Reportes detallados con fotos\n- Verificación de estado de propiedades\n\n👥 **Gestión de Usuarios:**\n- Múltiples roles (Propietario, Inquilino, Corredor, Proveedor, Runner)\n- Perfiles verificados\n- Sistema de calificaciones bidireccional\n- Comunicación integrada\n\n📊 **Reportes y Analytics:**\n- Reportes financieros\n- Estadísticas de propiedades\n- Análisis de ingresos\n- Exportación de datos\n\n🔒 **Seguridad:**\n- Encriptación de datos\n- Verificación de usuarios\n- Protección de información personal\n- Cumplimiento legal\n\n¿Qué funcionalidad te interesa más?',
          confidence: 0.88,
        };

      case 'security_trust':
        return {
          response:
            '**Seguridad y Confianza en Rent360:**\n\n🔒 **Protección de Datos:**\n- Todos tus datos están encriptados\n- Cumplimos con estándares internacionales de seguridad\n- No compartimos información personal con terceros\n- Acceso seguro con autenticación de dos factores disponible\n\n✅ **Verificación de Usuarios:**\n- Todos los usuarios son verificados\n- Documentos verificados por el equipo administrativo\n- Sistema de calificaciones para confianza\n- Historial de transacciones transparente\n\n💳 **Seguridad en Pagos:**\n- Procesadores de pago certificados (PCI DSS)\n- No almacenamos datos de tarjetas\n- Transacciones encriptadas\n- Protección contra fraudes\n\n📄 **Documentos Seguros:**\n- Contratos digitales con validez legal\n- Firmas electrónicas certificadas\n- Almacenamiento seguro en la nube\n- Acceso controlado a documentos\n\n🛡️ **Privacidad:**\n- Control sobre quién ve tu información\n- Documentos privados solo visibles para administradores\n- Opciones de privacidad configurables\n- Cumplimiento con normativas de protección de datos\n\n**Puedes confiar en Rent360 porque:**\n- ✅ Somos una plataforma establecida y verificada\n- ✅ Procesamos miles de transacciones de forma segura\n- ✅ Cumplimos con todas las normativas legales\n- ✅ Tu información está protegida con tecnología de última generación\n\n¿Tienes alguna pregunta específica sobre seguridad?',
          confidence: 0.9,
        };

      case 'verification_time':
        return {
          response:
            '**Tiempo de Verificación en Rent360:**\n\n⏱️ **Tiempos Estimados:**\n- **Propietarios e Inquilinos**: 24-48 horas\n- **Proveedores de Servicios**: 2-5 días hábiles\n- **Corredores**: 3-7 días hábiles\n- **Runners**: 1-3 días hábiles\n\n📋 **Proceso de Verificación:**\n1. **Completar perfil**: Toda la información requerida\n2. **Subir documentos**: Cédula, certificaciones, etc.\n3. **Revisión administrativa**: El equipo revisa tu información\n4. **Aprobación**: Recibirás notificación cuando estés verificado\n\n✅ **Cómo Saber si Estás Verificado:**\n- Recibirás un email de confirmación\n- Verás un badge de "Verificado" en tu perfil\n- Podrás acceder a todas las funcionalidades\n\n💡 **Tips para Verificación Rápida:**\n- Completa todos los campos requeridos\n- Sube documentos claros y legibles\n- Asegúrate de que la información sea correcta\n- Responde rápidamente si hay solicitudes de información adicional\n\n**Si tu verificación tarda más:**\n- Revisa tu email por solicitudes de información adicional\n- Contacta al soporte si han pasado más de 7 días\n- Verifica que todos tus documentos estén correctos\n\n¿Tienes alguna pregunta sobre el proceso de verificación?',
          confidence: 0.9,
        };

      case 'runner360_info':
        return {
          response:
            '**¿Qué es Runner360?**\n\n🏃 **Runner360** es nuestro servicio de visitas profesionales a propiedades.\n\n**¿Qué hace Runner360?**\n- Realiza visitas profesionales a propiedades\n- Toma fotos y videos de alta calidad\n- Genera reportes detallados del estado de la propiedad\n- Verifica el estado de mantenimiento\n- Proporciona información objetiva para propietarios e inquilinos\n\n**¿Cuánto cuesta?**\n- **Visita básica**: $15.000 - $20.000\n- **Visita completa con reporte**: $20.000 - $25.000\n- El precio varía según ubicación y tipo de visita\n\n**¿Cómo funciona?**\n1. **Solicita una visita**: Desde tu panel o al contactar un runner\n2. **Agenda la cita**: El runner coordina contigo la fecha y hora\n3. **Visita profesional**: El runner visita la propiedad y documenta todo\n4. **Recibe el reporte**: Obtienes fotos, videos y un reporte detallado\n\n**Beneficios:**\n- ✅ Visitas profesionales y objetivas\n- ✅ Documentación completa de la propiedad\n- ✅ Ahorro de tiempo para propietarios\n- ✅ Transparencia para todas las partes\n- ✅ Reportes detallados con fotos\n\n**¿Quién puede usar Runner360?**\n- Propietarios que quieren documentar sus propiedades\n- Inquilinos que necesitan verificar el estado\n- Corredores que necesitan reportes profesionales\n\n¿Quieres agendar una visita o necesitas más información?',
          confidence: 0.92,
        };

      case 'contract_renewal':
        return {
          response:
            '**Renovación de Contratos en Rent360:**\n\n🔄 **Cómo Renovar:**\n1. **Notificación automática**: El sistema te notifica 30 días antes del vencimiento\n2. **Accede a tu contrato**: Ve a "Contratos" → "Contratos Activos"\n3. **Solicita renovación**: Haz clic en "Renovar Contrato"\n4. **Revisa términos**: Puedes actualizar términos si ambas partes están de acuerdo\n5. **Firma digitalmente**: Ambas partes firman el contrato renovado\n\n✅ **Renovación Automática:**\n- Puedes configurar renovación automática\n- El sistema genera el nuevo contrato automáticamente\n- Solo necesitas confirmar y firmar\n\n📋 **Qué Puedes Actualizar:**\n- Precio de arriendo (con acuerdo de ambas partes)\n- Fechas de vencimiento\n- Términos y condiciones\n- Servicios incluidos\n\n⏰ **Plazos:**\n- Notificación: 30 días antes del vencimiento\n- Tiempo para renovar: Hasta 7 días antes del vencimiento\n- Si no renuevas: El contrato expira automáticamente\n\n**¿Qué pasa si no renuevo?**\n- El contrato expira en la fecha de vencimiento\n- Debes desocupar la propiedad si eres inquilino\n- Debes notificar al inquilino si eres propietario\n\n💡 **Tips:**\n- Renueva con anticipación para evitar problemas\n- Comunícate con la otra parte antes de renovar\n- Revisa todos los términos antes de firmar\n\n¿Necesitas ayuda con una renovación específica?',
          confidence: 0.9,
        };

      case 'schedule_visit':
        return {
          response:
            '**Cómo Agendar una Visita en Rent360:**\n\n📅 **Pasos para Agendar:**\n1. **Busca la propiedad**: Encuentra la propiedad que te interesa\n2. **Solicita visita**: Haz clic en "Solicitar Visita" o "Agendar Visita"\n3. **Selecciona fecha y hora**: Elige un horario disponible\n4. **Confirma**: El propietario o corredor recibirá tu solicitud\n5. **Recibe confirmación**: Te llegará una notificación cuando se confirme\n\n💰 **Costos:**\n- **Visita estándar**: Generalmente GRATIS\n- **Visita con Runner360**: $15.000 - $25.000 (opcional, más profesional)\n\n⏰ **Tiempos:**\n- Las visitas se confirman generalmente en 24-48 horas\n- Puedes cancelar hasta 24 horas antes\n\n🏠 **Tipos de Visita:**\n- **Visita estándar**: Con el propietario o corredor\n- **Visita Runner360**: Visita profesional con reporte detallado\n\n**Para Propietarios/Corredores:**\n- Recibirás notificaciones de solicitudes de visita\n- Puedes confirmar o sugerir otros horarios\n- El sistema gestiona automáticamente el calendario\n\n**Para Inquilinos:**\n- Puedes solicitar visitas a múltiples propiedades\n- Recibe confirmaciones automáticas\n- Cancela o reprograma fácilmente\n\n¿Quieres agendar una visita o necesitas más información?',
          confidence: 0.88,
        };

      case 'ratings_info':
        return {
          response:
            '**Sistema de Calificaciones en Rent360:**\n\n⭐ **¿Qué son las Calificaciones?**\n- Son evaluaciones que los usuarios se dan entre sí después de interactuar\n- Ayudan a construir confianza y reputación en la plataforma\n- Son públicas y visibles para todos los usuarios\n\n👥 **¿Quién Puede Calificar?**\n- **Propietarios** pueden calificar a inquilinos, corredores, proveedores y runners\n- **Inquilinos** pueden calificar a propietarios, corredores, proveedores y runners\n- **Corredores** pueden calificar a propietarios, inquilinos y proveedores\n- **Proveedores** pueden calificar a clientes (propietarios e inquilinos)\n- **Runners** pueden calificar a propietarios e inquilinos\n\n📊 **¿Qué se Califica?**\n- Calidad del servicio\n- Puntualidad\n- Comunicación\n- Profesionalismo\n- Calificación general (1-5 estrellas)\n\n👀 **¿Dónde Puedo Verlas?**\n- En los perfiles de los usuarios\n- En las tarjetas de información pública\n- Al interactuar con otros usuarios\n- En los resultados de búsqueda\n\n💬 **Comentarios y Respuestas:**\n- Puedes dejar comentarios con tu calificación\n- El usuario calificado puede responder a los comentarios\n- Todo es público y transparente\n\n✅ **Beneficios:**\n- Construyes tu reputación en la plataforma\n- Ayudas a otros usuarios a tomar decisiones informadas\n- Recibes feedback para mejorar\n\n¿Tienes alguna pregunta sobre las calificaciones?',
          confidence: 0.87,
        };

      case 'required_documents':
        return {
          response:
            '**Documentos Requeridos en Rent360:**\n\n📋 **Para Todos los Usuarios:**\n- **Cédula de Identidad**: Frente y reverso\n- **Email verificado**: Debes verificar tu correo electrónico\n\n👤 **Para Propietarios:**\n- Cédula de identidad\n- Comprobante de propiedad (opcional, para verificación)\n\n🏠 **Para Inquilinos:**\n- Cédula de identidad\n- Certificado de antecedentes (recomendado)\n- Comprobantes de ingresos (opcional)\n\n🔧 **Para Proveedores de Servicios:**\n- Cédula de identidad (frente y reverso)\n- Certificado de antecedentes\n- Certificaciones profesionales (si aplica)\n- Certificado de empresa (si tienes empresa)\n- Seguro de responsabilidad civil (recomendado)\n\n📊 **Para Corredores:**\n- Cédula de identidad\n- Certificado de corredor inmobiliario\n- Certificado de antecedentes\n- Certificado de empresa (si aplica)\n\n🏃 **Para Runners:**\n- Cédula de identidad\n- Certificado de antecedentes\n- Certificación de conducción (si aplica)\n\n**Proceso:**\n1. Sube los documentos desde "Configuración" → "Documentos"\n2. El equipo administrativo los revisa\n3. Recibirás notificación cuando estén aprobados\n\n**Importante:**\n- Los documentos deben estar claros y legibles\n- Deben estar vigentes\n- La información debe coincidir con tu perfil\n\n¿Qué tipo de usuario eres? Puedo darte información más específica.',
          confidence: 0.91,
        };

      default:
        return null;
    }
  }

  /**
   * Genera sugerencias basadas en el mensaje
   */
  private generateSuggestions(userMessage: string, userRole: string): string[] {
    const suggestions: string[] = [];
    const input = userMessage.toLowerCase();

    if (input.includes('propiedad')) {
      suggestions.push('Buscar propiedades disponibles');
      suggestions.push('Filtrar por zona');
      suggestions.push('Calcular presupuesto');
    }

    if (input.includes('contrato')) {
      suggestions.push('Ver contratos activos');
      suggestions.push('Renovar contrato');
      suggestions.push('Descargar documento');
    }

    if (input.includes('pago')) {
      suggestions.push('Realizar pago');
      suggestions.push('Ver historial');
      suggestions.push('Configurar pagos automáticos');
    }

    if (input.includes('problema') || input.includes('mantenimiento')) {
      suggestions.push('Crear ticket');
      suggestions.push('Ver tickets activos');
      suggestions.push('Contactar soporte');
    }

    // Sugerencias generales si no hay específicas
    if (suggestions.length === 0) {
      suggestions.push('Buscar propiedades');
      suggestions.push('Ver contratos');
      suggestions.push('Realizar pago');
      suggestions.push('Reportar problema');
    }

    return suggestions.slice(0, 3); // Máximo 3 sugerencias
  }

  /**
   * Verifica si hay algún proveedor de IA disponible
   */
  getAvailableProviders(): {
    openai: boolean;
    anthropic: boolean;
    google: boolean;
    local: boolean;
    current: string;
  } {
    return {
      openai: !!this.openai,
      anthropic: !!this.anthropic,
      google: !!this.googleAI,
      local: true,
      current: this.config?.provider || 'local',
    };
  }

  /**
   * Genera guías detalladas paso a paso para procesos legales complejos
   */
  private getDetailedLegalGuide(guideType: string): string {
    const guides: Record<string, string> = {
      payment_default_owner: `
🚨 **GUÍA PASO A PASO: Proceso completo por mora en pagos**

**FASE 1: Verificación y preparación**
• Confirma atraso >30 días (requisito legal)
• Calcula deuda total: renta + intereses (3% mensual) + gastos administrativos
• Revisa contrato: plazos, garantías, cláusulas especiales

**FASE 2: Iniciar caso legal desde contrato**
• Ve a "Mis Contratos" → selecciona contrato moroso
• Busca opción "Iniciar Caso Legal"
• Selecciona tipo "Incumplimiento de pago" (NON_PAYMENT)
• Sistema genera notificación extrajudicial automáticamente

**FASE 3: Espera y seguimiento**
• Inquilino tiene 10 días hábiles para pagar
• Si paga: caso cerrado automáticamente
• Si no paga: puedes escalar a judicial

**FASE 4: Procedimiento judicial (opcional)**
• Demanda monitoria (si deuda >$500.000)
• Juicio ordinario (si deuda menor)
• Aplicación de garantías durante proceso

**💰 Costos aproximados:**
• Notificación extrajudicial: $15.000-25.000
• Demanda monitoria: $50.000-80.000
• Gastos judiciales: 5-10% de deuda recuperada

**⚖️ Marco legal:** Artículos 47 y 55 de la Ley 18.101`,

      legal_cases_owner: `
📋 **FLUJO COMPLETO DE CASOS LEGALES EN RENT360**

**1. CREACIÓN DEL CASO**
• Accede a "Mis Contratos" → selecciona contrato específico
• Busca opción "Iniciar Caso Legal" dentro del contrato
• Selecciona tipo: Incumplimiento de pago, Incumplimiento contractual, Daño a propiedad, Otro
• Sistema valida automáticamente requisitos legales

**2. DOCUMENTACIÓN AUTOMÁTICA**
• Genera contratos, facturas impagas, reportes de daños
• Calcula intereses y montos legalmente
• Prepara antecedentes para tribunal

**3. FASE EXTRAJUDICIAL**
• Notificación automática por carta certificada
• Seguimiento de plazos (10 días hábiles)
• Registro de respuestas y pagos parciales

**4. ESCALAMIENTO JUDICIAL**
• Si no hay respuesta: preparación de demanda
• Coordinación con abogados (si contratados)
• Seguimiento de expediente judicial

**5. EJECUCIÓN Y CIERRE**
• Lanzamiento efectivo (con protección policial)
• Cobro de garantías y deudas
• Cierre del caso con documentación completa

**🎯 TIP: El 70% de casos se resuelven en fase extrajudicial**`,

      legal_cases_tenant: `
🛡️ **GUÍA DE PROTECCIÓN PARA INQUILINOS**

**TUS DERECHOS PRINCIPALES (Ley 18.101 y 21.461):**

**1. CONTRA DESALOJOS IRREGULARES**
• Desalojo requiere notificación judicial previa
• Prohibidos desalojos nocturnos o en días festivos
• No pueden cortarte servicios básicos

**2. EN CASOS DE MORA**
• Protección contra desalojos inmediatos
• Derecho a plan de pagos razonable
• 30 días de gracia antes de intereses de mora

**3. ANTE VICIOS OCULTOS**
• Puedes suspender pagos si propiedad inhabitable
• Derecho a reparaciones urgentes
• Posible resolución o reducción de renta

**4. DURANTE EL CONTRATO**
• Aumento máximo anual (IPC + 3%)
• Protección contra cambios unilaterales
• Derecho a prórroga automática (si no avisado)

**5. AL TERMINAR CONTRATO**
• Inventario de entrega obligatorio
• Devolución de garantías en 60 días
• Derecho a reparaciones por deterioro normal

**📞 ¿Problemas? Contacta inmediatamente a tu propietario**`,
    };

    return guides[guideType] || '';
  }

  /**
   * Cambia el proveedor de IA
   */
  async switchProvider(provider: 'openai' | 'anthropic' | 'google' | 'local'): Promise<boolean> {
    try {
      // Re-inicializar con el nuevo proveedor
      const oldConfig = { ...this.config };

      // Limpiar configuraciones anteriores
      this.openai = null;
      this.anthropic = null;
      this.googleAI = null;

      // Forzar re-inicialización
      await this.initializeAIProviders();

      const success = this.config?.provider === provider;

      if (success) {
        logger.info(`Proveedor de IA cambiado: ${oldConfig.provider} -> ${provider}`);
      } else {
        logger.warn(`No se pudo cambiar a proveedor ${provider}, usando ${this.config?.provider}`);
      }

      return success;
    } catch (error) {
      logger.error('Error cambiando proveedor de IA:', {
        error: error instanceof Error ? error.message : String(error),
      });
      return false;
    }
  }

  /**
   * Verifica si una respuesta contiene información realmente confidencial
   * (no solo palabras clave, sino datos reales)
   */
  private containsRealConfidentialInfo(response: string): boolean {
    const realConfidentialPatterns = [
      // RUTs reales (formato específico)
      /\b\d{1,2}\.\d{3}\.\d{3}[-]?\d{1}\b/g,
      // Números de tarjeta completos
      /\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/g,
      // Emails con formato específico de usuario
      /\b[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}\b/gi,
      // Contraseñas o tokens visibles
      /\b(password|contraseña|secret|token|api[_\s]?key)\s*[:=]\s*[^\s]{6,}\b/gi,
    ];

    return realConfidentialPatterns.some(pattern => pattern.test(response));
  }
}

// Instancia singleton del servicio
export const aiChatbotService = new AIChatbotService();

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
    const text = message.toLowerCase().trim();

    // Patrones avanzados de intención con pesos y contexto
    const intentPatterns = [
      {
        intent: 'register',
        patterns: [
          /(?:como|dónde|quiero|necesito)\s+(?:registrarme|crear cuenta|darme de alta)/,
          /(?:registro|registrar|unirme|empezar)/,
          /(?:ser|convertirme en|quiero ser)\s+(?:propietario|inquilino|corredor|proveedor|runner)/,
          /(?:soy|trabajo como|me dedico a)\s+(?:jardinero|plomero|electricista|gasfiter|limpieza|seguridad|mantenimiento)/,
          /(?:puedo|podría|quiero)\s+(?:publicar|ofrecer|prestar)\s+(?:mis\s+)?servicios/,
          /(?:como|dónde)\s+(?:ofrecer|brindar|dar)\s+(?:servicios|mantenimiento|trabajo)/,
          /(?:como|dónde)\s+(?:creo|crear|registrar|darme de alta)\s+(?:una\s+)?(?:cuenta|perfil)/,
          /(?:cuenta|perfil|registro)\s+(?:para|de)\s+(?:ofrecer|brindar|dar)\s+servicios/,
          /(?:para|necesito|debo tener|requiero)\s+(?:documento|certificación|certificado|licencia|registro)/,
          /(?:qué|cuáles)\s+(?:documentos|requisitos|certificaciones)\s+(?:necesito|requiero|debo)/,
          /(?:ofrecer|dar|prestar)\s+(?:servicios|mantenimiento)\s+(?:debo|necesito|requiero)/,
        ],
        weight: 1.0,
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

    // Extraer tipos de servicios mencionados
    const serviceTypes = [
      'jardineria',
      'jardinero',
      'plomeria',
      'plomero',
      'electricidad',
      'electricista',
      'limpieza',
      'pintura',
      'carpinteria',
      'mantenimiento',
      'seguridad',
      'gasfiter',
    ];
    const foundServices: string[] = [];
    for (const service of serviceTypes) {
      if (text.includes(service)) {
        foundServices.push(service);
      }
    }
    if (foundServices.length > 0) {
      entities.services = foundServices;
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
    const roleResponses = intentKnowledge[userRole] || intentKnowledge['general'];
    if (!roleResponses) {
      return this.generateFallbackResponse(userRole);
    }

    // Seleccionar respuesta basada en entidades y contexto
    let selectedResponse = roleResponses.responses[0];
    let suggestions = roleResponses.suggestions || [];
    let links = roleResponses.links || [];

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
          const intent = this.extractIntent(userMessage);

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

          const intent = this.extractIntent(userMessage);
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
      const intent = this.extractIntent(userMessage);
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
   * Procesa con lógica local (sin IA externa)
   */
  private async processWithLocalLogic(
    userMessage: string,
    userRole: string
  ): Promise<{ response: string; confidence: number }> {
    const input = userMessage.toLowerCase();

    // 🚀 MEJORADO: Usar reconocimiento de intenciones mejorado
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

    // 🚀 NUEVO: Detección específica para contratar corredores / servicios de corredor
    const quiereContratarCorredor =
      (input.includes('corredor') || input.includes('broker')) &&
      (input.includes('contratar') ||
        input.includes('comunicarme') ||
        input.includes('contactar') ||
        input.includes('administre') ||
        input.includes('administrar') ||
        input.includes('administración') ||
        input.includes('gestionar') ||
        input.includes('gestion') ||
        input.includes('servicio'));

    const tienePropiedadParaArrendar =
      (input.includes('casa') || input.includes('departamento') || input.includes('propiedad')) &&
      (input.includes('arrendar') || input.includes('alquilar') || input.includes('rentar'));

    if (quiereContratarCorredor || (tienePropiedadParaArrendar && input.includes('corredor'))) {
      return {
        response:
          '¡Perfecto! Sí, puedes contratar un corredor inmobiliario en Rent360 para que administre tu propiedad. Te explico cómo:\n\n**Cómo contratar un corredor en Rent360:**\n\n1. **Regístrate como Propietario**: Si aún no tienes cuenta, crea una cuenta como "Propietario"\n2. **Ve a "Servicios de Corredor"**: En tu panel de propietario, busca la sección "Servicios de Corredor" o "Broker Services"\n3. **Busca corredores disponibles**:\n   - Verás una lista de corredores verificados en tu zona\n   - Cada corredor muestra su experiencia, calificaciones y servicios ofrecidos\n   - Puedes ver sus calificaciones y comentarios de otros propietarios\n4. **Selecciona propiedades**: Elige qué propiedades quieres que el corredor administre\n5. **Envía solicitud**: Contacta directamente al corredor desde la plataforma\n6. **Negocia términos**: El corredor te enviará una propuesta con:\n   - Comisión (generalmente entre 3% y 5% del valor del contrato)\n   - Servicios incluidos (publicación, visitas, gestión de contratos, etc.)\n   - Términos y condiciones\n7. **Acepta la propuesta**: Una vez aceptada, el corredor comenzará a gestionar tu propiedad\n\n**Servicios que puede ofrecer el corredor:**\n- Publicar tu propiedad en múltiples plataformas\n- Gestionar visitas y mostrar la propiedad\n- Negociar con inquilinos potenciales\n- Preparar y gestionar contratos de arriendo\n- Realizar verificaciones de antecedentes\n- Gestionar renovaciones y terminaciones\n- Asesoría en precios de mercado\n\n**Beneficios:**\n- Ahorras tiempo en la gestión\n- Acceso a más inquilinos potenciales\n- Gestión profesional de contratos\n- Mayor seguridad en las transacciones\n\n¿Tienes alguna pregunta específica sobre el proceso o los servicios de corredores?',
        confidence: 0.95,
      };
    }

    // 🚀 MEJORADO: Detección mejorada de búsqueda de propiedades (solo si NO es sobre contratar corredor)
    if (
      (input.includes('propiedad') ||
        input.includes('casa') ||
        input.includes('departamento') ||
        input.includes('arrendar') ||
        input.includes('buscar') ||
        (input.includes('quiero') && (input.includes('vivir') || input.includes('alquilar')))) &&
      !quiereContratarCorredor &&
      !input.includes('corredor')
    ) {
      return {
        response:
          'Te ayudo a buscar propiedades en Rent360:\n\n**Cómo buscar:**\n1. Usa el buscador principal en la página de inicio\n2. Filtra por:\n   - **Ubicación**: Comuna, ciudad, región\n   - **Tipo**: Casa, departamento, local comercial, etc.\n   - **Precio**: Rango mensual de arriendo\n   - **Características**: Habitaciones, baños, estacionamiento, mascotas permitidas\n\n3. **Explora resultados:**\n   - Ve fotos y detalles completos\n   - Revisa ubicación en mapa\n   - Lee descripciones y características\n   - Contacta directamente al propietario o corredor\n\n4. **Agenda visitas:**\n   - Solicita visitas desde la plataforma\n   - El sistema te conecta con el propietario\n   - Recibe confirmación de la visita\n\n**Tips:**\n- Guarda propiedades como favoritas\n- Recibe notificaciones de nuevas propiedades que coincidan con tus criterios\n- Compara propiedades lado a lado\n\n¿En qué zona te interesa vivir y cuál es tu presupuesto mensual?',
        confidence: 0.95,
      };
    }

    if (
      input.includes('contrato') ||
      input.includes('arriendo') ||
      input.includes('alquiler') ||
      (input.includes('firmar') && input.includes('contrato'))
    ) {
      return {
        response:
          'Te ayudo con los contratos en Rent360:\n\n**Para Inquilinos:**\n- Ve a "Mis Contratos" en tu panel\n- Verás todos tus contratos activos\n- Puedes ver detalles, fechas importantes y términos\n- Descarga copias en PDF\n- Solicita renovación cuando se acerque el vencimiento\n\n**Para Propietarios:**\n- Gestiona contratos desde "Contratos" en tu panel\n- Crea nuevos contratos digitales\n- Envía contratos para firma electrónica\n- Gestiona renovaciones y terminaciones\n- Ver historial completo de contratos\n\n**Firma Electrónica:**\n- Los contratos se pueden firmar digitalmente\n- Es legalmente válido y seguro\n- Recibes notificaciones cuando hay cambios\n\n**Renovaciones:**\n- El sistema te notifica antes del vencimiento\n- Puedes renovar directamente desde la plataforma\n- Los términos se pueden actualizar\n\n¿Necesitas ayuda con algún contrato específico o quieres crear uno nuevo?',
        confidence: 0.9,
      };
    }

    if (
      input.includes('pago') ||
      input.includes('renta') ||
      input.includes('dinero') ||
      input.includes('pagar') ||
      (input.includes('cómo') && input.includes('pago'))
    ) {
      return {
        response:
          'Te ayudo con los pagos en Rent360:\n\n**Métodos de pago disponibles:**\n- **Khipu**: Transferencias y tarjetas (Chile)\n- **Stripe**: Tarjetas internacionales\n- **PayPal**: Billetera digital\n- **WebPay**: Tarjetas (Chile)\n\n**Para Inquilinos:**\n- Ve a "Pagos" en tu panel\n- Verás pagos pendientes con fechas de vencimiento\n- Selecciona el pago y elige tu método\n- Recibe confirmación inmediata\n- Configura pagos automáticos para no preocuparte\n\n**Para Propietarios:**\n- Ve a "Pagos" para ver todos los recibidos\n- Historial completo de pagos\n- Exporta reportes financieros\n- Recibe notificaciones de nuevos pagos\n\n**Seguridad:**\n- Todos los pagos están encriptados\n- No almacenamos datos de tarjetas\n- Cumplimos estándares internacionales de seguridad\n\n**Pagos automáticos:**\n- Configura pagos recurrentes\n- Recibe recordatorios antes de cada pago\n- Modifica o cancela cuando quieras\n\n¿Qué método prefieres usar o necesitas ayuda con algo específico?',
        confidence: 0.85,
      };
    }

    if (
      input.includes('problema') ||
      input.includes('mantenimiento') ||
      input.includes('reparar') ||
      input.includes('arreglar') ||
      (input.includes('necesito') && (input.includes('arreglo') || input.includes('reparación')))
    ) {
      return {
        response:
          'Te ayudo a reportar problemas de mantenimiento:\n\n**Cómo solicitar mantenimiento:**\n1. Ve a "Mantenimiento" o "Solicitar Mantenimiento" en tu panel\n2. Haz clic en "Nueva Solicitud"\n3. Completa:\n   - **Tipo**: Reparación, mantenimiento, emergencia, inspección\n   - **Descripción**: Explica el problema en detalle\n   - **Urgencia**: Baja, Media, Alta, Crítica\n   - **Fotos**: Adjunta fotos (muy recomendado)\n\n**Niveles de urgencia:**\n- **Crítica**: Problemas de seguridad (fuga de gas, sin electricidad)\n- **Alta**: Afecta uso normal (sin agua caliente, calefacción rota)\n- **Media**: Puede esperar (grifo que gotea, puerta que no cierra)\n- **Baja**: Mantenimiento preventivo\n\n**¿Qué pasa después?**\n- Tu propietario recibe notificación\n- El sistema busca proveedores en tu zona\n- El propietario asigna un proveedor\n- Recibes actualizaciones del estado\n- Puedes comunicarte con el proveedor\n\n**Tip:** Mientras más detallada sea tu descripción y más fotos incluyas, más rápido se resolverá el problema.\n\n¿Qué tipo de problema necesitas reportar?',
        confidence: 0.8,
      };
    }

    // 🚀 NUEVO: Detección específica de preguntas sobre documentos
    if (
      input.includes('documento') &&
      (input.includes('ver') ||
        input.includes('visible') ||
        input.includes('acceso') ||
        input.includes('otros'))
    ) {
      if (userRole === 'provider' || userRole === 'PROVIDER') {
        return {
          response:
            '**Visibilidad de tus documentos como proveedor:**\n\nTus documentos personales (cédula, antecedentes) son **PRIVADOS** y solo los ve el equipo administrativo para verificación.\n\nCuando tus documentos son **aprobados y verificados** por el administrador, los clientes pueden ver únicamente los documentos aprobados en tu perfil público. Esto aumenta la confianza.\n\n**Documentos privados (solo admin):**\n- Cédula de identidad completa\n- Antecedentes penales\n- Documentos en proceso de verificación\n\n**Documentos públicos (clientes pueden ver):**\n- Solo documentos aprobados y verificados por el administrador\n- Certificado de empresa (si aplica)\n- Certificaciones profesionales verificadas\n\nPuedes verificar qué documentos están visibles desde "Configuración" → "Documentos".',
          confidence: 0.95,
        };
      }
    }

    // 🚀 MEJORADO: Detección de preguntas sobre comisiones (específica para corredores)
    if (
      (input.includes('comisión') || input.includes('comision')) &&
      (input.includes('corredor') || input.includes('broker'))
    ) {
      return {
        response:
          'Los corredores inmobiliarios en Rent360 reciben una comisión del 3% al 5% del valor total del contrato de arriendo celebrado. Esta comisión se calcula automáticamente cuando se firma un contrato y se paga al corredor una vez que el contrato está activo. El porcentaje exacto puede variar según el acuerdo entre el corredor y el propietario, pero típicamente está en ese rango.',
        confidence: 0.95,
      };
    }

    // Detección general de comisiones
    if (
      input.includes('comisión') ||
      input.includes('comision') ||
      input.includes('porcentaje') ||
      input.includes('retención')
    ) {
      return {
        response:
          '**Porcentajes de comisión en Rent360:**\n\n📊 **Corredores:** Entre 3% y 5% del valor del contrato (configurable)\n🔧 **Proveedores de servicios:** Generalmente 8% del monto del servicio\n🏃 **Runners:** Variable según tipo de visita ($15.000-$25.000 por visita)\n\nLos porcentajes exactos son configurables por el administrador. Rent360 es gratuito para usuarios básicos, solo se cobran comisiones cuando hay transacciones exitosas.',
        confidence: 0.9,
      };
    }

    // 🚀 MEJORADO: Detección específica para registro de proveedores - CASOS ESPECÍFICOS
    // Detectar profesiones específicas
    const profesiones = [
      'jardinero',
      'jardinería',
      'plomero',
      'electricista',
      'carpintero',
      'pintor',
      'gasfiter',
      'albañil',
      'cerrajero',
      'mudanza',
      'mudanzas',
      'fumigador',
      'limpieza',
      'seguridad',
      'carpintería',
      'herrería',
      'techador',
      'instalador',
    ];

    const tieneProfesion = profesiones.some(prof => input.includes(prof));
    const quiereOfrecer =
      input.includes('ofrecer') ||
      input.includes('puedo ofrecer') ||
      input.includes('quiero ofrecer') ||
      (input.includes('puedo') && input.includes('servicio'));
    const preguntaRegistro =
      input.includes('registro') ||
      input.includes('registrarse') ||
      input.includes('crear') ||
      input.includes('cuenta') ||
      input.includes('usuario') ||
      input.includes('debería crear');
    const soyProfesional = input.includes('soy') && tieneProfesion;

    // Caso 1: "soy electricista, puedo ofrecer mis servicios?"
    if (soyProfesional && (quiereOfrecer || preguntaRegistro)) {
      const profesionDetectada = profesiones.find(prof => input.includes(prof)) || 'proveedor';
      return {
        response: `¡Excelente! Como ${profesionDetectada}, puedes ofrecer tus servicios en Rent360. Te explico cómo empezar:\n\n**Pasos para registrarte como Proveedor de Servicios:**\n\n1. **Crear cuenta**: Ve a "Registrarse" en la página principal y selecciona "Proveedor de Servicios"\n2. **Completar datos básicos**: Nombre, email, teléfono y contraseña\n3. **Verificar email**: Confirma tu cuenta desde el correo que recibirás\n4. **Completar perfil**:\n   - Especifica tu especialidad: ${profesionDetectada}\n   - Describe los servicios específicos que ofreces\n   - Indica las zonas donde trabajas (comunas, ciudades)\n   - Configura tus precios (por hora, por servicio o por proyecto)\n   - Sube fotos de trabajos anteriores para mostrar tu experiencia\n5. **Subir documentos**:\n   - Cédula de identidad (frente y reverso)\n   - Certificaciones profesionales si las tienes (especialmente importante para electricistas)\n   - Certificado de antecedentes\n6. **Esperar verificación**: El administrador revisará tu perfil y documentos\n\n**Una vez verificado podrás:**\n- Recibir solicitudes de trabajo de propietarios e inquilinos\n- Ver detalles de cada solicitud (ubicación, urgencia, descripción, fotos)\n- Aceptar o rechazar trabajos según tu disponibilidad\n- Comunicarte directamente con clientes a través de la plataforma\n- Recibir pagos automáticos y seguros después de completar trabajos\n- Ver tus ganancias, comisiones y estadísticas en tu panel\n- Construir tu reputación con calificaciones y comentarios\n\n**Tip para ${profesionDetectada}s:** Las certificaciones profesionales aumentan tu credibilidad y te ayudan a conseguir más trabajos.\n\n¿Tienes alguna pregunta específica sobre el proceso de registro o los servicios que puedes ofrecer?`,
        confidence: 0.95,
      };
    }

    // Caso 2: "quiero ofrecer servicios de mudanza, que usuario deberia crear?"
    if ((input.includes('mudanza') || input.includes('mudanzas')) && preguntaRegistro) {
      return {
        response:
          '¡Perfecto! Para ofrecer servicios de mudanza en Rent360, debes crear una cuenta como **Proveedor de Servicios**. Te explico el proceso:\n\n**Pasos para registrarte:**\n\n1. **Crear cuenta**: Ve a "Registrarse" y selecciona "Proveedor de Servicios"\n2. **Completar datos básicos**: Nombre, email, teléfono y contraseña\n3. **Verificar email**: Confirma tu cuenta desde el correo\n4. **Completar perfil de mudanzas**:\n   - **Especialidad**: Indica "Mudanzas" o "Servicios de Mudanza"\n   - **Descripción**: Detalla los servicios (mudanzas residenciales, comerciales, embalaje, desmontaje de muebles, etc.)\n   - **Zonas de cobertura**: Define las comunas o regiones donde ofreces servicios\n   - **Precios**: Configura tarifas (pueden ser por hora, por volumen, o por distancia)\n   - **Portafolio**: Sube fotos de mudanzas anteriores\n5. **Subir documentos**:\n   - Cédula de identidad\n   - Certificado de antecedentes\n   - Si tienes empresa: Certificado de empresa\n   - Seguro de carga (si aplica)\n6. **Esperar verificación**: El administrador revisará tu perfil\n\n**Una vez verificado podrás:**\n- Recibir solicitudes de mudanza de propietarios e inquilinos\n- Ver detalles de cada solicitud (origen, destino, fecha, tipo de mudanza)\n- Aceptar trabajos según tu disponibilidad\n- Comunicarte con clientes para coordinar detalles\n- Recibir pagos automáticos al completar las mudanzas\n- Gestionar tu calendario y disponibilidad\n\n¿Tienes alguna pregunta específica sobre el registro o los servicios de mudanza?',
        confidence: 0.95,
      };
    }

    // Caso 3: Detección general mejorada
    if (tieneProfesion || (quiereOfrecer && input.includes('servicio'))) {
      if (preguntaRegistro || quiereOfrecer) {
        return {
          response:
            '¡Perfecto! Para ofrecer tus servicios en Rent360, necesitas registrarte como **Proveedor de Servicios**. Te explico el proceso:\n\n**Pasos para registrarte:**\n\n1. **Crear cuenta**: Ve a "Registrarse" en la página principal y selecciona "Proveedor de Servicios"\n2. **Completar datos básicos**: Nombre, email, teléfono y contraseña\n3. **Verificar email**: Confirma tu cuenta desde el correo que recibirás\n4. **Completar perfil**:\n   - Especifica tu especialidad (jardinería, plomería, electricidad, mudanzas, etc.)\n   - Describe los servicios que ofreces en detalle\n   - Indica las zonas donde trabajas\n   - Configura tus precios (por hora, por servicio o por proyecto)\n   - Sube fotos de trabajos anteriores\n5. **Subir documentos**: Cédula de identidad y certificaciones si las tienes\n6. **Esperar verificación**: El administrador revisará tu perfil\n\n**Una vez verificado podrás:**\n- Recibir solicitudes de trabajo de propietarios e inquilinos\n- Ver detalles de cada solicitud (ubicación, urgencia, descripción)\n- Aceptar o rechazar trabajos según tu disponibilidad\n- Comunicarte directamente con clientes\n- Recibir pagos automáticos después de completar trabajos\n- Ver tus ganancias y comisiones en tu panel\n\n¿Qué tipo de servicios ofreces? Puedo darte información más específica.',
          confidence: 0.92,
        };
      }
    }

    // 🚀 MEJORADO: Detección de preguntas sobre registro en general
    if (
      (input.includes('registro') ||
        input.includes('registrarse') ||
        input.includes('crear cuenta')) &&
      (input.includes('proveedor') || input.includes('servicio') || input.includes('trabajar'))
    ) {
      return {
        response:
          'Para registrarte como proveedor de servicios en Rent360:\n\n1. Haz clic en "Registrarse" y selecciona "Proveedor de Servicios"\n2. Completa tus datos básicos (nombre, email, teléfono)\n3. Verifica tu email\n4. Completa tu perfil con información sobre tus servicios\n5. Sube documentos requeridos (cédula, certificaciones)\n6. Espera la verificación del administrador\n\nUna vez verificado, podrás recibir solicitudes de trabajo y comenzar a ofrecer tus servicios. ¿Qué tipo de servicios ofreces?',
        confidence: 0.9,
      };
    }

    // 🚀 MEJORADO: Detección de preguntas de ayuda general
    if (
      input.includes('ayuda') ||
      input.includes('help') ||
      input.includes('información') ||
      input.includes('informacion') ||
      (input.includes('qué') && input.includes('puedo')) ||
      (input.includes('cómo') && input.includes('funciona'))
    ) {
      if (userRole === 'guest' || userRole === 'GUEST') {
        return {
          response:
            '¡Hola! Soy el asistente de Rent360 y estoy aquí para ayudarte. Puedo responder tus preguntas sobre:\n\n**📋 Información General:**\n- ¿Qué es Rent360 y cómo funciona?\n- Tipos de usuarios y roles\n- Costos y comisiones\n- Seguridad y privacidad\n\n**👤 Registro y Cuenta:**\n- Cómo crear tu cuenta\n- Registro como propietario, inquilino, proveedor, corredor\n- Proceso de verificación\n- Documentos requeridos\n\n**🏠 Propiedades:**\n- Cómo buscar propiedades\n- Cómo publicar propiedades\n- Filtros y búsqueda avanzada\n\n**💰 Pagos:**\n- Métodos de pago disponibles\n- Cómo realizar pagos\n- Pagos automáticos\n- Seguridad de pagos\n\n**🔧 Servicios:**\n- Cómo ofrecer servicios (jardinería, plomería, etc.)\n- Cómo solicitar mantenimiento\n- Proceso de trabajo con proveedores\n\n**📄 Contratos:**\n- Contratos digitales\n- Firma electrónica\n- Renovaciones\n\n¿Sobre qué te gustaría saber más? Puedes preguntarme cualquier cosa.',
          confidence: 0.7,
        };
      }
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

**INSTRUCCIONES DE RESPUESTA:**
1. Solo proporciona información general sobre funcionalidades de Rent360
2. NUNCA menciones datos específicos de usuarios, propiedades, contratos o pagos
3. Si se pregunta por información confidencial, responde: "No puedo acceder a información personal. Para consultas específicas, contacta al soporte."
4. Si la pregunta es sobre temas restringidos, redirige al soporte: "Para esa consulta, te recomiendo contactar al soporte técnico."
5. Mantén un tono amigable y profesional
6. Si no sabes la respuesta exacta, proporciona información general útil
7. NUNCA inventes información que no conozcas con certeza
8. NUNCA proporciones pasos técnicos que puedan comprometer la seguridad

**EJEMPLOS DE RESPUESTAS CORRECTAS:**
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

Recuerda: SIEMPRE prioriza la seguridad y privacidad. Si hay duda, redirige al soporte.

Respuesta (solo información general y pública):
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
   * Extrae intención del mensaje
   */
  private extractIntent(userMessage: string): string {
    const input = userMessage.toLowerCase();

    if (input.includes('buscar') || input.includes('encontrar')) {
      return 'search';
    }
    if (input.includes('contrato') || input.includes('arriendo')) {
      return 'contracts';
    }
    if (input.includes('pago') || input.includes('renta')) {
      return 'payments';
    }
    if (input.includes('problema') || input.includes('mantenimiento')) {
      return 'maintenance';
    }
    if (input.includes('configur') || input.includes('ajuste')) {
      return 'settings';
    }
    if (input.includes('ayuda') || input.includes('soporte')) {
      return 'support';
    }

    return 'general';
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

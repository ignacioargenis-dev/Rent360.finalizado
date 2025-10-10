import { OpenAI } from 'openai';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { Anthropic } from '@anthropic-ai/sdk';
import { logger } from './logger';
import { DatabaseError } from './errors';

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

    // Navegación y uso del sistema
    navigation: {
      tenant: {
        responses: [
          'Como inquilino, tu panel principal tiene estas secciones principales: **Dashboard** (resumen general), **Buscar Propiedades** (encuentra arriendo), **Mis Contratos** (documentos legales), **Pagos** (renta y métodos), **Mantenimiento** (reportar problemas), **Mensajes** (comunicación), **Calificaciones** (valorar servicios).',
          'Navegación para inquilinos: Usa la barra lateral izquierda para acceder a todas las funciones. El dashboard te muestra un resumen de tus contratos activos, pagos pendientes y notificaciones importantes.',
        ],
        suggestions: ['Ver dashboard', 'Buscar propiedades', 'Ver contratos', 'Realizar pago'],
        links: ['/tenant/dashboard', '/properties/search', '/tenant/contracts', '/tenant/payments'],
      },
      owner: {
        responses: [
          'Como propietario, gestionas: **Propiedades** (tus inmuebles), **Inquilinos** (tus arrendatarios), **Contratos** (documentos legales), **Casos Legales** (mora y disputas), **Pagos** (ingresos por arriendo), **Mantenimiento** (reparaciones), **Analytics** (reportes y métricas).',
          'Panel de propietario: Desde tu dashboard puedes ver ingresos mensuales, contratos activos, pagos pendientes de inquilinos, y casos legales en curso. La barra lateral te da acceso rápido a todas las funciones.',
        ],
        suggestions: ['Ver propiedades', 'Gestionar contratos', 'Ver ingresos', 'Casos legales'],
        links: ['/owner/dashboard', '/owner/properties', '/owner/contracts', '/owner/payments'],
      },
      broker: {
        responses: [
          'Como corredor, administras: **Propiedades** (ofertas disponibles), **Clientes** (inquilinos y propietarios), **Citas** (visitas programadas), **Contratos** (cierres de negocio), **Comisiones** (ganancias), **Casos Legales** (apoyo a clientes), **Analytics** (rendimiento comercial).',
          'Herramientas de corredor: Publica propiedades, gestiona clientes potenciales, programa citas con Runner360, cierra contratos, cobra comisiones automáticamente, y accede a reportes detallados de tu rendimiento.',
        ],
        suggestions: ['Ver propiedades', 'Gestionar clientes', 'Programar citas', 'Ver comisiones'],
        links: [
          '/broker/dashboard',
          '/broker/properties',
          '/broker/clients',
          '/broker/commissions',
        ],
      },
      provider: {
        responses: [
          'Como proveedor de servicios, manejas: **Dashboard** (trabajos disponibles), **Trabajos** (reparaciones asignadas), **Calendario** (horarios), **Ganancias** (pagos por servicios), **Perfil** (servicios ofrecidos), **Calificaciones** (reputación).',
          'Plataforma para proveedores: Recibe trabajos automáticamente según tu especialidad, coordina horarios con clientes, recibe pagos seguros, construye tu reputación con calificaciones, y accede a estadísticas de tu rendimiento.',
        ],
        suggestions: [
          'Ver trabajos disponibles',
          'Gestionar calendario',
          'Ver ganancias',
          'Actualizar perfil',
        ],
        links: [
          '/provider/dashboard',
          '/maintenance/jobs',
          '/provider/earnings',
          '/provider/profile',
        ],
      },
      runner: {
        responses: [
          'Como Runner360, controlas: **Dashboard** (tareas pendientes), **Visitas** (propiedades que inspeccionar), **Fotos** (galería de trabajos), **Horario** (disponibilidad), **Ganancias** (pagos por visita), **Incentivos** (bonos especiales), **Reportes** (estadísticas).',
          'Sistema Runner360: Acepta tareas de inspección, toma fotos profesionales de propiedades, genera reportes detallados, cobra por visita completada, gana incentivos por rendimiento, y administra tu disponibilidad horaria.',
        ],
        suggestions: ['Ver tareas pendientes', 'Gestionar visitas', 'Ver ganancias', 'Subir fotos'],
        links: ['/runner/dashboard', '/runner/tasks', '/runner/earnings', '/runner/photos'],
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
      ],
      provider: ['register', 'maintenance', 'payments', 'navigation', 'how_to'],
      runner: ['navigation', 'how_to'],
      admin: ['security', 'support', 'legal_cases', 'legal_info', 'navigation', 'how_to'],
    };

    return roleRelevance[role]?.includes(intent) || false;
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

      // Intentar inicializar Google AI
      const googleKey = process.env.GOOGLE_AI_API_KEY;
      if (googleKey) {
        this.googleAI = new GoogleGenerativeAI(googleKey);
        this.config = {
          provider: 'google',
          apiKey: googleKey,
          model: process.env.GOOGLE_MODEL || 'gemini-pro',
          maxTokens: parseInt(process.env.GOOGLE_MAX_TOKENS || '1000'),
          temperature: parseFloat(process.env.GOOGLE_TEMPERATURE || '0.7'),
        };
        logger.info('Google AI inicializado para chatbot');
        return;
      }

      // Si no hay proveedores externos, usar lógica local
      this.config = {
        provider: 'local',
        apiKey: '',
        model: 'local-logic',
        maxTokens: 1000,
        temperature: 0.7,
      };
      logger.info('Usando lógica local para chatbot (sin IA externa)');
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

    const model = this.googleAI.getGenerativeModel({ model: this.config!.model });
    const result = await model.generateContent(prompt);
    const response = result.response.text();

    const confidence = 0.8; // Google AI tiene buena confianza

    return { response, confidence };
  }

  /**
   * Procesa con lógica local (sin IA externa)
   */
  private async processWithLocalLogic(
    userMessage: string,
    userRole: string
  ): Promise<{ response: string; confidence: number }> {
    const input = userMessage.toLowerCase();

    // Lógica simple basada en palabras clave
    if (input.includes('propiedad') || input.includes('casa') || input.includes('departamento')) {
      return {
        response:
          'Te ayudo a buscar propiedades. Puedo mostrarte opciones según tu ubicación, presupuesto y preferencias. ¿En qué zona te interesa vivir y cuál es tu presupuesto mensual?',
        confidence: 0.95,
      };
    }

    if (input.includes('contrato') || input.includes('arriendo') || input.includes('alquiler')) {
      return {
        response:
          'Para gestionar contratos, puedes acceder a la sección "Mis Contratos" donde encontrarás todos tus documentos, fechas de vencimiento y opciones de renovación. ¿Necesitas ayuda con algún contrato específico?',
        confidence: 0.9,
      };
    }

    if (input.includes('pago') || input.includes('renta') || input.includes('dinero')) {
      return {
        response:
          'Para realizar pagos, puedes usar la sección "Pagos" donde encontrarás múltiples métodos de pago seguros. También puedes configurar pagos automáticos para no olvidarte. ¿Qué método prefieres usar?',
        confidence: 0.85,
      };
    }

    if (
      input.includes('problema') ||
      input.includes('mantenimiento') ||
      input.includes('reparar')
    ) {
      return {
        response:
          'Para reportar un problema de mantenimiento, puedes crear un ticket en la sección "Mantenimiento". Te ayudaré a categorizar el problema y asignar la prioridad correcta. ¿Qué tipo de problema tienes?',
        confidence: 0.8,
      };
    }

    // Respuesta por defecto
    return {
      response:
        'Entiendo tu consulta. Te puedo ayudar con búsqueda de propiedades, gestión de contratos, pagos, mantenimiento y configuración de tu cuenta. ¿Qué te gustaría hacer?',
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

      default:
        // Rol desconocido - acceso mínimo
        context.allowedTopics = ['perfil', 'soporte'];
        context.restrictedTopics = ['todo'];
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
Eres un asistente virtual especializado en el sistema Rent360.

INFORMACIÓN DE SEGURIDAD CRÍTICA:
- Solo puedes acceder a datos del usuario actual (${securityContext.maxDataAccess})
- NO puedes ejecutar acciones del sistema
- NO puedes modificar configuraciones
- NO puedes acceder a datos de otros usuarios
- NO puedes proporcionar información sensible del sistema
- SIEMPRE debes mantener la privacidad de los datos

ROL DEL USUARIO: ${securityContext.allowedTopics.join(', ')}
TEMAS PERMITIDOS: ${securityContext.allowedTopics.join(', ')}
TEMAS RESTRINGIDOS: ${securityContext.restrictedTopics.join(', ')}

INSTRUCCIONES:
1. Solo responde preguntas relacionadas con las funcionalidades permitidas para este rol
2. Si la pregunta es sobre temas restringidos, redirige al soporte humano
3. Nunca reveles información técnica interna del sistema
4. Mantén un tono amigable y profesional
5. Si no sabes la respuesta, sugiere contactar al soporte

Pregunta del usuario: ${userMessage}

${conversationHistory ? `Historial de conversación:\n${conversationHistory.map(msg => `${msg.role}: ${msg.content}`).join('\n')}` : ''}

Respuesta:
`;

    return systemPrompt;
  }

  /**
   * Valida respuesta por seguridad
   */
  private validateResponse(response: string, securityContext: any): string {
    const lowerResponse = response.toLowerCase();

    // Verificar si contiene información restringida
    const hasRestrictedContent = securityContext.restrictedTopics.some((topic: string) =>
      lowerResponse.includes(topic.toLowerCase())
    );

    if (hasRestrictedContent) {
      return 'Lo siento, no puedo proporcionar información sobre ese tema. Te recomiendo contactar al soporte técnico para obtener ayuda especializada.';
    }

    // Verificar si intenta ejecutar acciones
    const actionKeywords = ['eliminar', 'borrar', 'modificar', 'cambiar', 'actualizar', 'crear'];
    const hasActionKeywords = actionKeywords.some(keyword => lowerResponse.includes(keyword));

    if (hasActionKeywords && !securityContext.canExecuteActions) {
      return 'Para realizar cambios en tu cuenta o ejecutar acciones, por favor accede directamente a las secciones correspondientes del sistema o contacta al soporte.';
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
}

// Instancia singleton del servicio
export const aiChatbotService = new AIChatbotService();

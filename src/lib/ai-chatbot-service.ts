import { OpenAI } from 'openai';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { Anthropic } from '@anthropic-ai/sdk';
import { logger } from './logger';
import { DatabaseError } from './errors';

/**
 * Tipos para el sistema avanzado de chatbot
 */
interface UserContext {
  id: string;
  role: 'tenant' | 'owner' | 'broker' | 'provider' | 'admin';
  name: string;
  properties?: any[];
  contracts?: any[];
  payments?: any[];
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
}

interface KnowledgeResponse {
  response: string;
  confidence: number;
  suggestions?: string[];
  actions?: string[];
  links?: string[];
  followUp?: string[];
  securityNote?: string;
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
 * Servicio de IA para Chatbot
 */
export class AIChatbotService {
  private openai: OpenAI | null = null;
  private anthropic: Anthropic | null = null;
  private googleAI: GoogleGenerativeAI | null = null;
  private config: AIProviderConfig | null = null;

  constructor() {
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
          'Como proveedor de servicios, puedes ofrecer: limpieza, mantenimiento, jardinería, seguridad, etc. El registro incluye verificación de experiencia y certificaciones. Apareces en búsquedas cuando propietarios necesitan servicios.',
          'Proveedores verificados: 1) Registro básico 2) Seleccionar servicios ofrecidos 3) Subir certificaciones 4) Definir precios y disponibilidad 5) Verificación de antecedentes. Gana dinero ofreciendo servicios a la comunidad.',
        ],
        suggestions: ['Configurar servicios', 'Definir precios', 'Ver oportunidades'],
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

    // Soporte y ayuda
    support: {
      general: {
        responses: [
          '¿Necesitas ayuda? Estoy aquí 24/7. Puedo ayudarte con: registro, propiedades, contratos, pagos, Runner360, mantenimiento, seguridad, y cualquier proceso de la plataforma. También puedes contactar soporte humano.',
          'Centro de ayuda completo: documentación detallada, tutoriales paso a paso, soporte por chat, teléfono y email, comunidad de usuarios, base de conocimientos actualizada.',
        ],
        suggestions: ['Buscar en ayuda', 'Contactar soporte', 'Ver tutoriales'],
        links: ['/help', '/support', '/contact'],
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
        ],
        weight: 1.0,
        context: ['auth', 'signup', 'join'],
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
      tenant: ['property_search', 'contracts', 'payments', 'maintenance', 'runner360'],
      owner: ['property_search', 'contracts', 'payments', 'maintenance', 'runner360'],
      broker: ['property_search', 'contracts', 'payments', 'runner360'],
      provider: ['register', 'maintenance', 'payments'],
      admin: ['security', 'support'],
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
   * Procesar mensaje con IA avanzada
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

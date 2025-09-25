import { OpenAI } from 'openai';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { Anthropic } from '@anthropic-ai/sdk';
import { logger } from './logger';
import { DatabaseError } from './errors';

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
          temperature: parseFloat(process.env.OPENAI_TEMPERATURE || '0.7')
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
          temperature: parseFloat(process.env.ANTHROPIC_TEMPERATURE || '0.7')
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
          temperature: parseFloat(process.env.GOOGLE_TEMPERATURE || '0.7')
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
        temperature: 0.7
      };
      logger.info('Usando lógica local para chatbot (sin IA externa)');

    } catch (error) {
      logger.error('Error inicializando proveedores de IA:', { error: error instanceof Error ? error.message : String(error) });
      // Fallback a lógica local
      this.config = {
        provider: 'local',
        apiKey: '',
        model: 'local-logic',
        maxTokens: 1000,
        temperature: 0.7
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
        provider: this.config.provider
      });

      return {
        response: validatedResponse,
        confidence,
        intent,
        suggestions,
        metadata: {
          provider: this.config.provider,
          model: this.config.model,
          processingTime: Date.now()
        }
      };

    } catch (error) {
      logger.error('Error procesando mensaje:', { error: error instanceof Error ? error.message : String(error) });

      // Respuesta de fallback segura
      return {
        response: 'Lo siento, tuve un problema procesando tu consulta. ¿Podrías reformular tu pregunta?',
        confidence: 0,
        suggestions: ['Buscar propiedades', 'Ver contratos', 'Contactar soporte']
      };
    }
  }

  /**
   * Procesa con OpenAI
   */
  private async processWithOpenAI(prompt: string): Promise<{ response: string; confidence: number }> {
    if (!this.openai) throw new Error('OpenAI no inicializado');

    const completion = await this.openai.chat.completions.create({
      model: this.config!.model,
      messages: [{ role: 'user', content: prompt }],
      max_tokens: this.config!.maxTokens,
      temperature: this.config!.temperature,
    });

    const response = completion.choices[0]?.message?.content || 'Lo siento, no pude generar una respuesta.';
    const confidence = 0.85; // OpenAI generalmente tiene alta confianza

    return { response, confidence };
  }

  /**
   * Procesa con Anthropic (Claude)
   */
  private async processWithAnthropic(prompt: string): Promise<{ response: string; confidence: number }> {
    if (!this.anthropic) throw new Error('Anthropic no inicializado');

    const message = await this.anthropic.messages.create({
      model: this.config!.model,
      max_tokens: this.config!.maxTokens,
      temperature: this.config!.temperature,
      messages: [{ role: 'user', content: prompt }],
    });

    const response = message.content[0]?.type === 'text'
      ? message.content[0].text
      : 'Lo siento, no pude generar una respuesta.';
    const confidence = 0.90; // Claude generalmente tiene muy alta confianza

    return { response, confidence };
  }

  /**
   * Procesa con Google AI
   */
  private async processWithGoogle(prompt: string): Promise<{ response: string; confidence: number }> {
    if (!this.googleAI) throw new Error('Google AI no inicializado');

    const model = this.googleAI.getGenerativeModel({ model: this.config!.model });
    const result = await model.generateContent(prompt);
    const response = result.response.text();

    const confidence = 0.80; // Google AI tiene buena confianza

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
        response: 'Te ayudo a buscar propiedades. Puedo mostrarte opciones según tu ubicación, presupuesto y preferencias. ¿En qué zona te interesa vivir y cuál es tu presupuesto mensual?',
        confidence: 0.95
      };
    }

    if (input.includes('contrato') || input.includes('arriendo') || input.includes('alquiler')) {
      return {
        response: 'Para gestionar contratos, puedes acceder a la sección "Mis Contratos" donde encontrarás todos tus documentos, fechas de vencimiento y opciones de renovación. ¿Necesitas ayuda con algún contrato específico?',
        confidence: 0.90
      };
    }

    if (input.includes('pago') || input.includes('renta') || input.includes('dinero')) {
      return {
        response: 'Para realizar pagos, puedes usar la sección "Pagos" donde encontrarás múltiples métodos de pago seguros. También puedes configurar pagos automáticos para no olvidarte. ¿Qué método prefieres usar?',
        confidence: 0.85
      };
    }

    if (input.includes('problema') || input.includes('mantenimiento') || input.includes('reparar')) {
      return {
        response: 'Para reportar un problema de mantenimiento, puedes crear un ticket en la sección "Mantenimiento". Te ayudaré a categorizar el problema y asignar la prioridad correcta. ¿Qué tipo de problema tienes?',
        confidence: 0.80
      };
    }

    // Respuesta por defecto
    return {
      response: 'Entiendo tu consulta. Te puedo ayudar con búsqueda de propiedades, gestión de contratos, pagos, mantenimiento y configuración de tu cuenta. ¿Qué te gustaría hacer?',
      confidence: 0.60
    };
  }

  /**
   * Crea contexto de seguridad basado en el rol del usuario
   */
  private createSecurityContext(userRole: string, userId: string): {
    allowedTopics: string[];
    restrictedTopics: string[];
    maxDataAccess: string;
    canExecuteActions: boolean;
  } {
    const context = {
      allowedTopics: [] as string[],
      restrictedTopics: [] as string[],
      maxDataAccess: 'own_data',
      canExecuteActions: false
    };

    switch (userRole.toUpperCase()) {
      case 'TENANT':
        context.allowedTopics = [
          'propiedades', 'contratos', 'pagos', 'mantenimiento',
          'perfil', 'notificaciones', 'soporte'
        ];
        context.restrictedTopics = [
          'sistema', 'administración', 'finanzas', 'usuarios',
          'configuración', 'seguridad', 'datos sensibles'
        ];
        break;

      case 'OWNER':
        context.allowedTopics = [
          'propiedades', 'contratos', 'pagos', 'inquilinos',
          'mantenimiento', 'reportes', 'perfil', 'soporte'
        ];
        context.restrictedTopics = [
          'sistema', 'administración', 'otros propietarios',
          'datos sensibles', 'configuración global'
        ];
        break;

      case 'BROKER':
        context.allowedTopics = [
          'propiedades', 'contratos', 'clientes', 'pagos',
          'comisiones', 'reportes', 'perfil', 'soporte'
        ];
        context.restrictedTopics = [
          'sistema', 'administración', 'finanzas globales',
          'otros corredores', 'configuración del sistema'
        ];
        break;

      case 'ADMIN':
        context.allowedTopics = [
          'todo' // Los admins pueden acceder a todo
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
    const hasActionKeywords = actionKeywords.some(keyword =>
      lowerResponse.includes(keyword)
    );

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

    if (input.includes('buscar') || input.includes('encontrar')) return 'search';
    if (input.includes('contrato') || input.includes('arriendo')) return 'contracts';
    if (input.includes('pago') || input.includes('renta')) return 'payments';
    if (input.includes('problema') || input.includes('mantenimiento')) return 'maintenance';
    if (input.includes('configur') || input.includes('ajuste')) return 'settings';
    if (input.includes('ayuda') || input.includes('soporte')) return 'support';

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
      current: this.config?.provider || 'local'
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
      logger.error('Error cambiando proveedor de IA:', { error: error instanceof Error ? error.message : String(error) });
      return false;
    }
  }
}

// Instancia singleton del servicio
export const aiChatbotService = new AIChatbotService();

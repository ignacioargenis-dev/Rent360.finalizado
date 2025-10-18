'use client';

import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  MessageSquare,
  Send,
  Bot,
  User,
  Loader2,
  X,
  Minimize2,
  Maximize2,
  Sparkles,
  HelpCircle,
  Building,
  FileText,
  DollarSign,
  Settings,
  Search,
  Scale,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { aiChatbotService } from '@/lib/ai-chatbot-service';
import { useAuth } from '@/components/auth/AuthProviderSimple';
import { logger } from '@/lib/logger-minimal';

interface SpecializedAgent {
  id: string;
  name: string;
  specialty: string;
  personality: any;
  expertise: string[];
  language: string;
  avatar?: string;
}

interface IntelligentRecommendation {
  type: string;
  item: any;
  relevanceScore: number;
  reason: string;
  action: string;
}

interface SentimentAnalysis {
  emotion: string;
  intensity: number;
  confidence: number;
  keywords: string[];
}

interface MemoryContext {
  previousTopics: string[];
  unresolvedIssues: string[];
  successfulPatterns: string[];
  userPreferences: Record<string, any>;
  contextSummary: string;
}

interface LearningInsight {
  type: string;
  insight: string;
  confidence: number;
  action: string;
}

interface ChatbotMessage {
  id: string;
  type: 'user' | 'bot';
  content: string;
  timestamp: Date;
  context?:
    | {
        propertyId?: string | undefined;
        contractId?: string | undefined;
        userId?: string | undefined;
        intent?: string | undefined;
        confidence?: number | undefined;
      }
    | undefined;
  suggestions?: string[] | undefined;
  actions?: string[] | undefined;
  links?: string[] | undefined;
  followUp?: string[] | undefined;
  securityNote?: string | undefined;
  // 🚀 CAMPOS REVOLUCIONARIOS NUEVOS
  agent?: SpecializedAgent;
  recommendations?: IntelligentRecommendation[];
  sentiment?: SentimentAnalysis;
  memoryContext?: MemoryContext;
  learningInsights?: LearningInsight[];
}

interface ChatbotProps {
  className?: string | undefined;
  initialOpen?: boolean | undefined;
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left' | undefined;
}

const QUICK_ACTIONS = [
  { text: 'Buscar propiedades', icon: Search, intent: 'property_search' },
  { text: 'Ver mis contratos', icon: FileText, intent: 'contracts' },
  { text: 'Realizar pago', icon: DollarSign, intent: 'payment' },
  { text: 'Reportar problema', icon: HelpCircle, intent: 'maintenance' },
  { text: 'Casos legales', icon: Scale, intent: 'legal_cases' },
  { text: 'Ayuda navegación', icon: Building, intent: 'navigation' },
  { text: 'Cómo hacer...', icon: User, intent: 'how_to' },
];

const GREETING_MESSAGES = [
  '¡Hola! Soy tu asistente completo de Rent360. ¿En qué puedo ayudarte hoy? Puedo explicarte cómo usar todas las funciones del sistema, guiarte en procesos legales, pagos, contratos, mantenimiento y cualquier funcionalidad.',
  '¡Bienvenido! Soy un experto en el sistema Rent360 y derecho habitacional chileno. ¿Necesitas ayuda para navegar, aprender a usar alguna función, o tienes preguntas sobre contratos, casos legales, o mora en pagos?',
  'Hola, soy tu asistente especializado en Rent360. Puedo ayudarte con: navegación del sistema, procesos legales, gestión de contratos, casos de mora, mantenimiento, pagos, Runner360, y cualquier funcionalidad de la plataforma.',
  '¡Hola! ¿En qué puedo ayudarte? Soy un asistente completo de Rent360 que puede guiarte paso a paso en todos los procesos: desde buscar propiedades hasta manejar casos legales, pasando por pagos, contratos y mantenimiento.',
];

export default function Chatbot({
  className,
  initialOpen = false,
  position = 'bottom-right',
}: ChatbotProps) {
  const auth = useAuth();
  const [isOpen, setIsOpen] = useState(initialOpen);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<ChatbotMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Mensaje de bienvenida inicial
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      const greetingMessage: ChatbotMessage = {
        id: 'welcome',
        type: 'bot',
        content: GREETING_MESSAGES[Math.floor(Math.random() * GREETING_MESSAGES.length)] as string,
        timestamp: new Date(),
        suggestions: QUICK_ACTIONS.map(action => action.text),
      };
      setMessages([greetingMessage]);
    }
  }, [isOpen, messages.length]);

  // Auto-scroll al último mensaje
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Focus en input cuando se abre
  useEffect(() => {
    if (isOpen && !isMinimized) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  }, [isOpen, isMinimized]);

  const simulateTyping = async (response: string) => {
    setIsTyping(true);
    const words = response.split(' ');
    let currentText = '';

    for (let i = 0; i < words.length; i++) {
      currentText += words[i]! + ' ';
      setMessages(prev =>
        prev.map(msg => (msg.id === 'typing' ? { ...msg, content: currentText.trim() } : msg))
      );
      await new Promise(resolve => setTimeout(resolve, 50 + Math.random() * 100));
    }
    setIsTyping(false);
  };

  const processUserMessage = async (content: string) => {
    try {
      // Agregar mensaje del usuario
      const userMessage: ChatbotMessage = {
        id: Date.now().toString(),
        type: 'user',
        content,
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, userMessage]);

      // Simular procesamiento de IA
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Determinar respuesta basada en el contenido
      const response = await generateAIResponse(content);

      // Agregar mensaje de "escribiendo"
      const typingMessage: ChatbotMessage = {
        id: 'typing',
        type: 'bot',
        content: '',
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, typingMessage]);

      // Simular escritura
      await simulateTyping(response.content);

      // Reemplazar mensaje de escritura con respuesta final
      const botMessage: ChatbotMessage = {
        id: Date.now().toString(),
        type: 'bot',
        content: response.content,
        timestamp: new Date(),
        context: response.context,
        ...(response.suggestions && { suggestions: response.suggestions }),
        ...(response.actions && { actions: response.actions }),
        ...(response.links && { links: response.links }),
        ...(response.followUp && { followUp: response.followUp }),
        ...(response.securityNote && { securityNote: response.securityNote }),
        // 🚀 CAMPOS REVOLUCIONARIOS NUEVOS
        ...(response.agent && { agent: response.agent }),
        ...(response.recommendations && { recommendations: response.recommendations }),
        ...(response.sentiment && { sentiment: response.sentiment }),
        ...(response.memoryContext && { memoryContext: response.memoryContext }),
        ...(response.learningInsights && { learningInsights: response.learningInsights }),
      };

      setMessages(prev => prev.filter(msg => msg.id !== 'typing').concat(botMessage));

      // IMPORTANTE: Resetear el estado de loading aquí
      setIsLoading(false);
    } catch (error) {
      console.error('Error en processUserMessage:', error);
      // Agregar mensaje de error al chat
      const errorMessage: ChatbotMessage = {
        id: Date.now().toString(),
        type: 'bot',
        content:
          'Lo siento, ocurrió un error al procesar tu mensaje. Por favor, intenta nuevamente.',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
      // IMPORTANTE: Resetear el estado de loading también en caso de error
      setIsLoading(false);
      throw error; // Re-throw para que handleSendMessage lo maneje
    }
  };

  const generateAIResponse = async (
    userInput: string
  ): Promise<{
    content: string;
    context?: any;
    suggestions?: string[] | undefined;
    actions?: string[] | undefined;
    links?: string[] | undefined;
    followUp?: string[] | undefined;
    securityNote?: string | undefined;
    // 🚀 CAMPOS REVOLUCIONARIOS NUEVOS
    agent?: SpecializedAgent | undefined;
    recommendations?: IntelligentRecommendation[] | undefined;
    sentiment?: SentimentAnalysis | undefined;
    memoryContext?: MemoryContext | undefined;
    learningInsights?: LearningInsight[] | undefined;
  }> => {
    // Obtener información del usuario autenticado al inicio
    const user = auth?.user;
    const userRole = user?.role?.toLowerCase() || 'guest';
    const userId = user?.id || 'anonymous';

    try {
      // 🚀 Usar el servicio de IA con datos de entrenamiento mejorados
      const result = await aiChatbotService.processMessageWithTrainingData(
        userInput,
        userRole,
        userId,
        messages.slice(-10).map(msg => ({
          role: msg.type === 'user' ? 'user' : 'assistant',
          content: msg.content,
        }))
      );

      return {
        content: result.response,
        context: {
          intent: result.intent,
          confidence: result.confidence,
        },
        suggestions: result.suggestions,
        actions: result.actions,
        links: result.links,
        followUp: result.followUp,
        securityNote: result.securityNote,
        // 🚀 CAMPOS REVOLUCIONARIOS NUEVOS
        agent: result.agent,
        recommendations: result.recommendations,
        sentiment: result.sentiment,
        memoryContext: result.memoryContext,
        learningInsights: result.learningInsights,
      };
    } catch (error) {
      logger.error('Error generando respuesta de IA:', {
        error: error instanceof Error ? error.message : String(error),
      });

      // Fallback a respuestas programáticas si falla la IA
      const input = userInput.toLowerCase();

      if (input.includes('propiedad') || input.includes('casa') || input.includes('departamento')) {
        return {
          content:
            'Te ayudo a buscar propiedades. Puedo mostrarte opciones según tu ubicación, presupuesto y preferencias. ¿En qué zona te interesa vivir y cuál es tu presupuesto mensual?',
          context: { intent: 'property_search' },
          suggestions: ['Ver propiedades disponibles', 'Filtrar por zona', 'Calcular hipoteca'],
        };
      }

      if (input.includes('contrato') || input.includes('arriendo') || input.includes('alquiler')) {
        return {
          content:
            'Para gestionar contratos, puedes acceder a la sección "Mis Contratos" donde encontrarás todos tus documentos, fechas de vencimiento y opciones de renovación. ¿Necesitas ayuda con algún contrato específico?',
          context: { intent: 'contracts' },
          suggestions: ['Ver contratos activos', 'Renovar contrato', 'Descargar documento'],
        };
      }

      if (input.includes('pago') || input.includes('renta') || input.includes('dinero')) {
        return {
          content:
            'Para realizar pagos, puedes usar la sección "Pagos" donde encontrarás múltiples métodos de pago seguros. También puedes configurar pagos automáticos para no olvidarte. ¿Qué método prefieres usar?',
          context: { intent: 'payment' },
          suggestions: ['Pagar ahora', 'Configurar pago automático', 'Ver historial'],
        };
      }

      if (
        input.includes('problema') ||
        input.includes('mantenimiento') ||
        input.includes('reparar')
      ) {
        return {
          content:
            'Para reportar un problema de mantenimiento, puedes crear un ticket en la sección "Mantenimiento". Te ayudaré a categorizar el problema y asignar la prioridad correcta. ¿Qué tipo de problema tienes?',
          context: { intent: 'maintenance' },
          suggestions: ['Crear ticket', 'Ver tickets activos', 'Contactar soporte'],
        };
      }

      // Consultas legales específicas
      if (
        input.includes('caso legal') ||
        input.includes('proceso legal') ||
        input.includes('demanda') ||
        input.includes('tribunal')
      ) {
        if (userRole === 'owner') {
          return {
            content:
              'Para iniciar un caso legal, accede a "Casos Legales" en tu panel. Puedes crear casos por mora en pagos, daños a la propiedad, u ocupación ilegal. El sistema te guía paso a paso por todo el proceso legal chileno.',
            context: { intent: 'legal_cases' },
            suggestions: ['Crear caso legal', 'Ver casos activos', 'Consultar abogado'],
            actions: ['Iniciar caso por mora', 'Ver estado legal', 'Contactar apoyo legal'],
          };
        }
        if (userRole === 'broker') {
          return {
            content:
              'Como corredor, puedes gestionar casos legales de tus clientes propietarios. Crea el caso especificando el tipo (mora, daños, desahucio) y el sistema maneja automáticamente las notificaciones y seguimiento judicial.',
            context: { intent: 'legal_cases' },
            suggestions: ['Ver casos legales', 'Crear nuevo caso', 'Gestionar clientes'],
          };
        }
        return {
          content:
            'Para consultas legales, puedes acceder a la sección de disputas o casos legales según tu rol. Te recomiendo consultar la documentación legal o contactar a un abogado especializado.',
          context: { intent: 'legal_cases' },
          suggestions: ['Ver disputas', 'Contactar soporte legal', 'Ver derechos'],
        };
      }

      // Consultas sobre mora específicamente
      if (
        input.includes('mora') ||
        input.includes('atraso') ||
        input.includes('no pago') ||
        input.includes('impago') ||
        input.includes('deuda') ||
        input.includes('atrasado')
      ) {
        if (userRole === 'owner') {
          return {
            content:
              '¡Claro! Te explico paso a paso cómo iniciar un caso legal por mora en pagos:\n\n1️⃣ **Verifica el atraso**: Confirma que el inquilino tenga más de 30 días de impago\n2️⃣ **Crea el caso**: Ve a "Casos Legales" → "Crear Caso" → Selecciona "Mora en pagos"\n3️⃣ **Sistema automático**: Calcula intereses (3% mensual según ley chilena) y genera notificación extrajudicial\n4️⃣ **Seguimiento**: Si no paga en 10 días hábiles, puedes escalar a proceso judicial\n\n¿Tu inquilino tiene más de 30 días de atraso? ¿Necesitas ayuda para crear el caso ahora mismo?',
            context: { intent: 'payment_default' },
            suggestions: [
              'Crear caso por mora',
              'Calcular intereses',
              'Ver garantías',
              'Enviar notificación',
            ],
            actions: ['Iniciar proceso legal', 'Calcular monto total', 'Ver estado de pagos'],
            followUp: [
              '¿Cuánto debe el inquilino?',
              '¿Desde cuándo está atrasado?',
              '¿Quieres que te guíe paso a paso?',
            ],
          };
        }
        if (userRole === 'tenant') {
          return {
            content:
              'Si tienes dificultades con pagos, puedes: 1) Configurar pagos automáticos, 2) Negociar un plan de pagos con tu propietario, 3) Si la mora es por problemas de la propiedad, puedes retener pagos legalmente. Recuerda que la ley te protege contra desalojos inmediatos.',
            context: { intent: 'payment_default' },
            suggestions: [
              'Configurar pagos automáticos',
              'Ver historial',
              'Contactar propietario',
              'Negociar plan',
            ],
          };
        }
        return {
          content:
            'Para temas de mora en pagos, el propietario puede iniciar un proceso legal siguiendo los pasos establecidos en la Ley 18.101. Los inquilinos tienen derechos de protección contra desalojos inmediatos.',
          context: { intent: 'payment_default' },
          suggestions: ['Ver contratos', 'Contactar propietario', 'Ver derechos legales'],
        };
      }

      // Consulta específica del usuario sobre iniciar caso legal por mora
      if (
        (input.includes('iniciar') || input.includes('empezar') || input.includes('comenzar')) &&
        (input.includes('caso') || input.includes('proceso') || input.includes('demanda')) &&
        (input.includes('mora') || input.includes('pago') || input.includes('atraso'))
      ) {
        if (userRole === 'owner') {
          return {
            content:
              '¡Excelente pregunta! Como propietario, iniciar un caso legal por mora se hace desde tus contratos específicos. Te guío paso a paso:\n\n🚀 **Proceso en 4 pasos:**\n\n1️⃣ **Ve a tus contratos** → "Mis Contratos" → Selecciona el contrato moroso\n2️⃣ **Inicia caso legal** → Dentro del contrato, busca "Iniciar Caso Legal"\n3️⃣ **Selecciona tipo** → Elige "Incumplimiento de pago" (NON_PAYMENT)\n4️⃣ **Completa información** → El sistema calcula automáticamente:\n   • Monto adeudado\n   • Intereses legales (3% mensual)\n   • Gastos administrativos\n\n⚖️ **Lo que sucede después:**\n• Caso aparece en "Casos Legales" con estado "Pre-judicial"\n• Se genera notificación extrajudicial automáticamente\n• Inquilino tiene 10 días hábiles para pagar\n• Si paga: caso cerrado automáticamente\n• Si no paga: puedes escalar a demanda judicial\n\n¿Quieres que te lleve a ver tus contratos activos? ¿O tienes alguna duda específica sobre el proceso?',
            context: { intent: 'payment_default' },
            suggestions: [
              'Ver mis contratos',
              'Ver contratos activos',
              'Casos legales existentes',
              'Tutorial paso a paso',
            ],
            actions: ['Ir a Mis Contratos', 'Ver contratos morosos', 'Ver tutorial'],
            followUp: [
              '¿Qué contrato específico?',
              '¿Cuántos meses de atraso?',
              '¿Quieres ver un ejemplo?',
              '¿Necesitas ayuda con algún paso?',
            ],
          };
        }
        return {
          content:
            'Entiendo tu consulta sobre iniciar casos legales por mora. Solo los propietarios pueden iniciar estos procesos según la legislación chilena. \n\nSi eres **inquilino** con dificultades de pago:\n• Contacta a tu propietario para negociar un plan de pagos\n• Configura pagos automáticos para evitar futuras moras\n• La ley te protege contra desalojos inmediatos\n\nSi eres **corredor**:\n• Puedes ayudar a tus clientes propietarios con el proceso completo\n• Gestiona casos legales en nombre de ellos\n\n¿Eres propietario, inquilino o corredor? Puedo darte información específica para tu situación.',
          context: { intent: 'payment_default' },
          suggestions: ['Soy propietario', 'Soy inquilino', 'Soy corredor', 'Información general'],
          followUp: [
            '¿Cuál es tu rol en Rent360?',
            '¿Necesitas ayuda con contratos?',
            '¿Quieres información legal general?',
          ],
        };
      }

      if (input.includes('hola') || input.includes('buenos días') || input.includes('buenas')) {
        return {
          content:
            '¡Hola! Soy tu asistente legal inteligente de Rent360. ¿En qué puedo ayudarte hoy? Puedo asistirte con búsqueda de propiedades, gestión de contratos, pagos, casos legales, mantenimiento y más.',
          suggestions: [
            ...QUICK_ACTIONS.map(action => action.text),
            'Casos legales',
            'Información sobre mora',
          ],
        };
      }

      if (input.includes('gracias') || input.includes('thanks')) {
        return {
          content:
            '¡De nada! Estoy aquí para ayudarte con cualquier consulta legal o administrativa. Si tienes más preguntas sobre casos legales, contratos o pagos, no dudes en preguntarme.',
          suggestions: [
            'Buscar propiedades',
            'Ver contratos',
            'Casos legales',
            'Información legal',
          ],
        };
      }

      // Consultas sobre navegación y uso del sistema
      if (
        input.includes('como') &&
        (input.includes('acceder') ||
          input.includes('entrar') ||
          input.includes('ir') ||
          input.includes('llegar') ||
          input.includes('usar') ||
          input.includes('funciona') ||
          input.includes('navegar'))
      ) {
        if (userRole === 'tenant') {
          return {
            content:
              '¡Te ayudo con la navegación! Como inquilino, estas son tus secciones principales:\n\n🏠 **Dashboard**: Resumen de tus contratos, pagos y notificaciones\n🏢 **Buscar Propiedades**: Encuentra arriendos con filtros avanzados\n📄 **Mis Contratos**: Documentos legales y renovaciones\n💳 **Pagos**: Configura rentas y métodos de pago\n🔧 **Mantenimiento**: Reporta problemas de la propiedad\n💬 **Mensajes**: Comunicación con propietarios/corredores\n⭐ **Calificaciones**: Evalúa servicios recibidos\n\n📍 **¿Dónde encontrar cada sección?** Usa la barra lateral izquierda o el menú superior. ¿Qué sección específica necesitas?',
            context: { intent: 'navigation' },
            suggestions: [
              'Ir al dashboard',
              'Buscar propiedades',
              'Ver contratos',
              'Configurar pagos',
            ],
            followUp: [
              '¿Qué sección buscas?',
              '¿Necesitas ayuda con algo específico?',
              '¿Dónde no encuentras algo?',
            ],
          };
        }
        if (userRole === 'owner') {
          return {
            content:
              '¡Hola propietario! Tu panel está organizado así:\n\n📊 **Dashboard**: Ingresos, contratos activos, alertas\n🏢 **Mis Propiedades**: Gestiona tus inmuebles\n👥 **Mis Inquilinos**: Información de arrendatarios\n📄 **Mis Contratos**: Documentos legales y firmas\n⚖️ **Casos Legales**: Seguimiento de procesos judiciales y mora\n💰 **Pagos**: Ingresos y métodos de cobro\n🔧 **Mantenimiento**: Solicitudes de reparaciones\n📈 **Analytics**: Reportes y métricas financieras\n\n💡 **Tip**: Los casos legales se inician desde contratos específicos, no desde la sección "Casos Legales". ¿Qué necesitas gestionar hoy?',
            context: { intent: 'navigation' },
            suggestions: [
              'Ver propiedades',
              'Gestionar contratos',
              'Ver ingresos',
              'Casos legales',
            ],
            followUp: [
              '¿Qué sección te interesa?',
              '¿Necesitas ayuda con alguna función?',
              '¿Dónde está... ?',
            ],
          };
        }
        if (userRole === 'broker') {
          return {
            content:
              'Como corredor certificado, tienes acceso a estas herramientas:\n\n📊 **Dashboard**: Rendimiento y comisiones\n🏢 **Propiedades**: Publica ofertas y busca inmuebles\n👥 **Clientes**: Gestiona prospectos y clientes activos\n📅 **Citas**: Programa visitas con Runner360\n📄 **Contratos**: Cierra negocios y firma documentos\n⚖️ **Casos Legales**: Apoya procesos judiciales\n💰 **Comisiones**: Seguimiento de ganancias\n📈 **Analytics**: Métricas comerciales\n\n🎯 **Función clave**: Usa "Nueva Propiedad" para publicar ofertas exclusivas. ¿Qué herramienta necesitas?',
            context: { intent: 'navigation' },
            suggestions: [
              'Publicar propiedad',
              'Ver clientes',
              'Programar citas',
              'Ver comisiones',
            ],
            followUp: [
              '¿Qué función buscas?',
              '¿Necesitas ayuda con ventas?',
              '¿Dónde gestionar...?',
            ],
          };
        }
        return {
          content:
            'Para navegar en Rent360: usa la barra lateral izquierda para acceder a todas las secciones. Cada rol tiene funciones específicas adaptadas a sus necesidades. ¿Me puedes decir qué rol tienes (inquilino, propietario, corredor, etc.) y qué necesitas hacer?',
          context: { intent: 'navigation' },
          suggestions: ['Soy inquilino', 'Soy propietario', 'Soy corredor', 'Ayuda general'],
          followUp: ['¿Qué rol tienes?', '¿Qué necesitas hacer?', '¿Dónde no encuentras algo?'],
        };
      }

      // Preguntas "cómo hacer" específicas
      if (
        (input.includes('como') || input.includes('cómo')) &&
        (input.includes('hacer') ||
          input.includes('funciona') ||
          input.includes('usar') ||
          input.includes('pasos'))
      ) {
        if (userRole === 'tenant') {
          return {
            content:
              '**Guías prácticas para inquilinos:**\n\n🔍 **Buscar propiedades:**\n1. Ve a "Buscar Propiedades"\n2. Aplica filtros (zona, precio, habitaciones)\n3. Contacta propietarios o corredores\n4. Runner360 puede hacer visitas por ti\n\n💳 **Pagar rentas:**\n1. En "Pagos" configura débito automático\n2. O paga online con Khipu\n3. Recibes recordatorios y comprobantes\n\n🔧 **Reportar mantenimiento:**\n1. "Mantenimiento" → "Nuevo Ticket"\n2. Sube fotos/videos del problema\n3. El sistema asigna proveedor automáticamente\n\n⭐ **Calificar servicios:**\nDespués de cada trabajo, ve a "Calificaciones"\n\n¿Qué proceso específico necesitas que te explique paso a paso?',
            context: { intent: 'how_to' },
            suggestions: [
              'Buscar propiedades',
              'Pagar renta',
              'Reportar problema',
              'Calificar servicio',
            ],
            followUp: [
              '¿Qué necesitas hacer?',
              '¿Qué paso no entiendes?',
              '¿Necesitas más detalles?',
            ],
          };
        }
        if (userRole === 'owner') {
          return {
            content:
              '**Guías prácticas para propietarios:**\n\n🏢 **Publicar propiedades:**\n1. "Mis Propiedades" → "Agregar Propiedad"\n2. Sube fotos profesionales\n3. Completa detalles y precio\n4. Los corredores la promocionarán\n\n💰 **Cobrar rentas:**\n1. "Pagos" → configura cobros automáticos\n2. Khipu procesa pagos directamente\n3. Recibe alertas de mora automática\n\n⚖️ **Manejar casos legales:**\n1. "Mis Contratos" → selecciona contrato específico\n2. Busca "Iniciar Caso Legal" dentro del contrato\n3. Selecciona tipo (incumplimiento, daños, etc.)\n4. Ve a "Casos Legales" para seguimiento\n\n📊 **Ver reportes:**\n"Analytics" → ingresos, ocupación, rendimiento\n\n¿Cuál de estos procesos te interesa que detalle más?',
            context: { intent: 'how_to' },
            suggestions: [
              'Publicar propiedad',
              'Configurar cobros',
              'Crear caso legal',
              'Ver reportes',
            ],
            followUp: [
              '¿Qué necesitas aprender?',
              '¿Qué proceso es nuevo para ti?',
              '¿Necesitas tutorial?',
            ],
          };
        }
        return {
          content:
            '¡Claro! Puedo explicarte cómo hacer cualquier cosa en Rent360. Dependiendo de tu rol (inquilino, propietario, corredor, etc.), los procesos son diferentes. ¿Me puedes decir qué rol tienes y qué específicamente quieres aprender a hacer?',
          context: { intent: 'how_to' },
          suggestions: [
            'Procesos para inquilinos',
            'Procesos para propietarios',
            'Procesos para corredores',
            'Ayuda general',
          ],
          followUp: ['¿Qué rol tienes?', '¿Qué quieres aprender?', '¿Qué no sabes cómo hacer?'],
        };
      }

      // Consultas sobre legislación chilena
      if (
        input.includes('ley') ||
        input.includes('legal') ||
        input.includes('chile') ||
        input.includes('codigo') ||
        input.includes('18.101') ||
        input.includes('21.461') ||
        input.includes('devuelveme')
      ) {
        return {
          content:
            '¡Excelente consulta! El sistema Rent360 está completamente alineado con la legislación chilena:\n\n📋 **Leyes principales aplicables:**\n\n🏠 **Ley N° 18.101 (Arrendamientos Urbanos):**\n• Regula contratos de arriendo urbano\n• Intereses por mora: 3% mensual (Art. 47)\n• Plazos de notificación: 10 días hábiles\n• Garantías: hasta 2 meses de arriendo\n\n⚖️ **Ley N° 21.461 ("Devuélveme Mi Casa"):**\n• Protege contra desalojos irregulares\n• Requiere notificación judicial previa\n• Prohíbe desalojos nocturnos o festivos\n• Establece procedimientos transparentes\n\n📖 **Código Civil:**\n• Aplica para obligaciones contractuales\n• Prescripción de acciones: 3 años\n• Responsabilidad civil por daños\n\n¿Sobre qué aspecto legal específico necesitas información? Puedo explicarte cómo aplicar estas leyes en casos concretos.',
          context: { intent: 'legal_info' },
          suggestions: [
            'Intereses por mora',
            'Proceso de desahucio',
            'Derechos inquilinos',
            'Garantías legales',
          ],
          followUp: [
            '¿Qué ley específica?',
            '¿Tienes un caso concreto?',
            '¿Necesitas procedimiento paso a paso?',
          ],
        };
      }

      // Respuesta por defecto mejorada
      return {
        content:
          'Entiendo tu consulta. Soy un asistente especializado en Rent360 y puedo ayudarte con: búsqueda de propiedades, gestión de contratos, pagos, casos legales, mantenimiento y procesos judiciales conforme a la legislación chilena. ¿Qué te gustaría hacer?',
        suggestions: [
          ...QUICK_ACTIONS.map(action => action.text),
          'Casos legales',
          'Información sobre mora',
          'Leyes chilenas',
        ],
      };
    }
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading) {
      return;
    }

    const message = inputValue.trim();
    setInputValue('');
    setIsLoading(true);

    try {
      await processUserMessage(message);
    } catch (error) {
      console.error('Error procesando mensaje:', error);
      setIsLoading(false);
      // Revertir el input value si hay error
      setInputValue(message);
    }
  };

  const handleQuickAction = async (action: string) => {
    // No bloquear el input, permitir conversaciones continuas
    setInputValue(action);
    // Opcional: auto-enviar después de un breve delay para mejor UX
    setTimeout(() => {
      if (inputValue === action) {
        handleSendMessage();
      }
    }, 500);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const toggleChat = () => {
    setIsOpen(!isOpen);
    if (!isOpen) {
      setIsMinimized(false);
    }
  };

  const toggleMinimize = () => {
    setIsMinimized(!isMinimized);
  };

  const positionClasses = {
    'bottom-right': 'bottom-4 right-4',
    'bottom-left': 'bottom-4 left-4',
    'top-right': 'top-4 right-4',
    'top-left': 'top-4 left-4',
  };

  if (!isOpen) {
    return (
      <div className={cn('fixed z-50', positionClasses[position])}>
        <Button
          onClick={toggleChat}
          size="lg"
          className="rounded-full w-14 h-14 shadow-lg bg-primary hover:bg-primary/90"
        >
          <MessageSquare className="h-6 w-6" />
        </Button>
      </div>
    );
  }

  return (
    <div className={cn('fixed z-50', positionClasses[position])}>
      <Card className={cn('w-96 h-[500px] shadow-xl border-0', isMinimized && 'h-16', className)}>
        <CardHeader className="pb-3 bg-primary text-white rounded-t-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bot className="h-5 w-5" />
              <CardTitle className="text-lg">Chatbot Rent360</CardTitle>
            </div>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleMinimize}
                className="text-white hover:bg-white/20"
              >
                {isMinimized ? (
                  <Maximize2 className="h-4 w-4" />
                ) : (
                  <Minimize2 className="h-4 w-4" />
                )}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleChat}
                className="text-white hover:bg-white/20"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>

        {!isMinimized && (
          <>
            <CardContent className="p-0 flex flex-col h-[400px]">
              <ScrollArea className="flex-1 h-full">
                <div className="p-4">
                  <div className="space-y-4">
                    {messages.map(message => (
                      <div
                        key={message.id}
                        className={cn(
                          'flex gap-3',
                          message.type === 'user' ? 'justify-end' : 'justify-start'
                        )}
                      >
                        {message.type === 'bot' && (
                          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                            <Bot className="h-4 w-4 text-primary" />
                          </div>
                        )}

                        <div
                          className={cn(
                            'max-w-[80%] rounded-lg px-3 py-2',
                            message.type === 'user'
                              ? 'bg-primary text-primary-foreground'
                              : 'bg-muted'
                          )}
                        >
                          <p className="text-sm">{message.content}</p>

                          {/* 🚀 AGENTE ESPECIALIZADO */}
                          {message.agent && (
                            <div className="mt-2 flex items-center gap-2 p-2 bg-blue-50 rounded-lg border border-blue-200">
                              <Bot className="w-4 h-4 text-blue-600" />
                              <div className="flex-1">
                                <span className="text-xs font-semibold text-blue-800">
                                  {message.agent.name}
                                </span>
                                <span className="text-xs text-blue-600 ml-2">
                                  {message.agent.specialty}
                                </span>
                              </div>
                            </div>
                          )}

                          {/* 🚀 RECOMENDACIONES INTELIGENTES */}
                          {message.recommendations && message.recommendations.length > 0 && (
                            <div className="mt-2 space-y-1">
                              <div className="text-xs font-semibold text-green-700 mb-1">
                                💡 Recomendaciones inteligentes:
                              </div>
                              {message.recommendations.slice(0, 2).map((rec, index) => (
                                <Button
                                  key={index}
                                  variant="outline"
                                  size="sm"
                                  className="w-full justify-start text-xs h-7 border-green-200 text-green-700 hover:bg-green-50"
                                  onClick={() => handleQuickAction(rec.action)}
                                >
                                  <Sparkles className="w-3 h-3 mr-1" />
                                  {rec.action}
                                </Button>
                              ))}
                            </div>
                          )}

                          {/* 🚀 ANÁLISIS DE SENTIMIENTOS */}
                          {message.sentiment && message.sentiment.emotion !== 'neutral' && (
                            <div className="mt-2 flex items-center gap-1">
                              <span className="text-xs text-gray-500">
                                {message.sentiment.emotion === 'joy' && '😊'}
                                {message.sentiment.emotion === 'anger' && '😠'}
                                {message.sentiment.emotion === 'fear' && '😨'}
                                {message.sentiment.emotion === 'sadness' && '😢'}
                                {message.sentiment.emotion === 'surprise' && '😮'}
                                Detectado: {message.sentiment.emotion}
                              </span>
                            </div>
                          )}

                          {/* 🚀 CONTEXTO DE MEMORIA */}
                          {message.memoryContext &&
                            message.memoryContext.previousTopics.length > 0 && (
                              <div className="mt-2 text-xs text-gray-500 bg-gray-50 p-2 rounded">
                                📝 Recordando conversaciones previas sobre:{' '}
                                {message.memoryContext.previousTopics.join(', ')}
                              </div>
                            )}

                          {/* 🚀 SUGERENCIAS TRADICIONALES */}
                          {message.suggestions && message.suggestions.length > 0 && (
                            <div className="mt-2 space-y-1">
                              {message.suggestions.map((suggestion, index) => (
                                <Button
                                  key={index}
                                  variant="outline"
                                  size="sm"
                                  className="w-full justify-start text-xs h-7"
                                  onClick={() => handleQuickAction(suggestion)}
                                >
                                  {suggestion}
                                </Button>
                              ))}
                            </div>
                          )}

                          {/* 🚀 NOTA DE SEGURIDAD */}
                          {message.securityNote && (
                            <div className="mt-2 text-xs text-orange-600 bg-orange-50 p-2 rounded border border-orange-200">
                              ⚠️ {message.securityNote}
                            </div>
                          )}

                          {/* 🚀 PREGUNTAS DE SEGUIMIENTO */}
                          {message.followUp && message.followUp.length > 0 && (
                            <div className="mt-2 space-y-1">
                              <div className="text-xs font-semibold text-blue-700 mb-1">
                                💭 Puedes preguntarme:
                              </div>
                              {message.followUp.slice(0, 2).map((question, index) => (
                                <Button
                                  key={index}
                                  variant="outline"
                                  size="sm"
                                  className="w-full justify-start text-xs h-7 border-blue-200 text-blue-700 hover:bg-blue-50"
                                  onClick={() => setInputValue(question)}
                                >
                                  <MessageSquare className="w-3 h-3 mr-1" />
                                  {question}
                                </Button>
                              ))}
                            </div>
                          )}

                          {/* 🚀 INDICADOR DE CONVERSACIÓN CONTINUA */}
                          {message.type === 'bot' && !message.securityNote && (
                            <div className="mt-2 text-xs text-gray-500 flex items-center gap-1">
                              <MessageSquare className="w-3 h-3" />
                              Puedes seguir preguntando, estoy aquí para ayudarte
                            </div>
                          )}
                        </div>

                        {message.type === 'user' && (
                          <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                            <User className="h-4 w-4 text-primary-foreground" />
                          </div>
                        )}
                      </div>
                    ))}

                    {isLoading && (
                      <div className="flex gap-3 justify-start">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                          <Bot className="h-4 w-4 text-primary" />
                        </div>
                        <div className="bg-muted rounded-lg px-3 py-2">
                          <div className="flex items-center gap-2">
                            <Loader2 className="h-4 w-4 animate-spin" />
                            <span className="text-sm">Pensando...</span>
                          </div>
                        </div>
                      </div>
                    )}

                    <div ref={messagesEndRef} />
                  </div>
                </div>
              </ScrollArea>

              <div className="p-4 border-t">
                <div className="flex gap-2">
                  <Input
                    ref={inputRef}
                    value={inputValue}
                    onChange={e => setInputValue(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Pregúntame sobre casos legales, contratos, mora en pagos..."
                    className="flex-1"
                    disabled={isLoading}
                  />
                  <Button
                    onClick={handleSendMessage}
                    disabled={!inputValue.trim() || isLoading}
                    size="icon"
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </>
        )}
      </Card>
    </div>
  );
}

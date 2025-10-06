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
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { aiChatbotService } from '@/lib/ai-chatbot-service';
import { useAuth } from '@/components/auth/AuthProvider';
import { logger } from '@/lib/logger';

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
  { text: 'Configuración', icon: Settings, intent: 'settings' },
];

const GREETING_MESSAGES = [
  '¡Hola! Soy tu asistente virtual de Rent360. ¿En qué puedo ayudarte hoy?',
  '¡Bienvenido a Rent360! Estoy aquí para ayudarte con cualquier consulta sobre propiedades, contratos o pagos.',
  'Hola, soy tu asistente inteligente. Puedo ayudarte a buscar propiedades, gestionar contratos y mucho más.',
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
    try {
      // Obtener información del usuario autenticado
      const user = auth?.user;
      const userRole = user?.role?.toLowerCase() || 'guest';
      const userId = user?.id || 'anonymous';

      // 🚀 Usar el servicio de IA revolucionario 10.000% mejorado
      const result = await aiChatbotService.processMessageRevolutionary(
        userInput,
        userRole,
        userId,
        messages.slice(-10).map(msg => ({
          role: msg.type === 'user' ? 'user' : 'assistant',
          content: msg.content,
        })),
        // Contexto adicional del usuario
        user
          ? {
              name: user.name || 'Usuario',
              preferences: {
                communicationStyle: 'casual',
                preferredTopics: ['general', 'support'],
                responseLength: 'detailed',
                notificationPreferences: {
                  email: true,
                  push: false,
                  sms: false,
                  frequency: 'immediate',
                },
                language: 'es',
                timezone: 'America/Santiago',
              },
            }
          : undefined
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

      if (input.includes('hola') || input.includes('buenos días') || input.includes('buenas')) {
        return {
          content:
            '¡Hola! ¿En qué puedo ayudarte hoy? Puedo asistirte con búsqueda de propiedades, gestión de contratos, pagos, mantenimiento y más.',
          suggestions: QUICK_ACTIONS.map(action => action.text),
        };
      }

      if (input.includes('gracias') || input.includes('thanks')) {
        return {
          content:
            '¡De nada! Estoy aquí para ayudarte. Si tienes más preguntas, no dudes en preguntarme.',
          suggestions: ['Buscar propiedades', 'Ver contratos', 'Realizar pago'],
        };
      }

      // Respuesta por defecto
      return {
        content:
          'Entiendo tu consulta. Te puedo ayudar con búsqueda de propiedades, gestión de contratos, pagos, mantenimiento y configuración de tu cuenta. ¿Qué te gustaría hacer?',
        suggestions: QUICK_ACTIONS.map(action => action.text),
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
    setIsLoading(true);
    try {
      await processUserMessage(action);
    } catch (error) {
      console.error('Error procesando acción rápida:', error);
    } finally {
      setIsLoading(false);
    }
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
                    placeholder="Escribe tu mensaje..."
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

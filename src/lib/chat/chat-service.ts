import { logger } from '@/lib/logger-minimal';

/**
 * Tipos de participantes en el chat
 */
export enum ChatParticipantType {
  OWNER = 'OWNER',
  TENANT = 'TENANT',
  MAINTENANCE_PROVIDER = 'MAINTENANCE_PROVIDER',
  SERVICE_PROVIDER = 'SERVICE_PROVIDER',
  ADMIN = 'ADMIN'
}

/**
 * Estados del chat
 */
export enum ChatStatus {
  ACTIVE = 'ACTIVE',
  CLOSED = 'CLOSED',
  ARCHIVED = 'ARCHIVED'
}

/**
 * Tipos de mensajes
 */
export enum MessageType {
  TEXT = 'TEXT',
  IMAGE = 'IMAGE',
  FILE = 'FILE',
  QUOTE_REQUEST = 'QUOTE_REQUEST',
  QUOTE_RESPONSE = 'QUOTE_RESPONSE',
  SCHEDULE_REQUEST = 'SCHEDULE_REQUEST',
  SCHEDULE_CONFIRMATION = 'SCHEDULE_CONFIRMATION',
  PAYMENT_REQUEST = 'PAYMENT_REQUEST',
  PAYMENT_CONFIRMATION = 'PAYMENT_CONFIRMATION',
  SYSTEM = 'SYSTEM'
}

/**
 * Participante del chat
 */
export interface ChatParticipant {
  userId: string;
  userType: ChatParticipantType;
  userName: string;
  avatar?: string | undefined;
  joinedAt: Date;
  lastSeen?: Date | undefined;
  isOnline: boolean;
}

/**
 * Mensaje del chat
 */
export interface ChatMessage {
  id: string;
  chatId: string;
  senderId: string;
  senderType: ChatParticipantType;
  senderName: string;
  content: string;
  messageType: MessageType;
  timestamp: Date;
  isRead: boolean;
  readBy: string[]; // IDs de usuarios que han leído el mensaje
  attachments?: ChatAttachment[] | undefined;
  metadata?: Record<string, any> | undefined; // Para datos específicos del tipo de mensaje
}

/**
 * Archivo adjunto al mensaje
 */
export interface ChatAttachment {
  id: string;
  fileName: string;
  fileUrl: string;
  fileType: string;
  fileSize: number;
  uploadedAt: Date;
}

/**
 * Conversación de chat
 */
export interface ChatConversation {
  id: string;
  title: string;
  description?: string | undefined;
  participants: ChatParticipant[];
  status: ChatStatus;
  createdAt: Date;
  updatedAt: Date;
  lastMessage?: ChatMessage | undefined;
  propertyId?: string | undefined;
  jobId?: string | undefined;
  unreadCount: Record<string, number>; // Conteo de mensajes no leídos por usuario
  tags: string[]; // Etiquetas para categorización
}

/**
 * Configuración de notificaciones del chat
 */
export interface ChatNotificationSettings {
  userId: string;
  emailNotifications: boolean;
  pushNotifications: boolean;
  soundNotifications: boolean;
  quietHours: {
    enabled: boolean;
    start: string; // HH:mm
    end: string; // HH:mm
  };
}

/**
 * Servicio de chat integrado
 */
export class ChatService {
  private static instance: ChatService;
  private conversations: Map<string, ChatConversation> = new Map();
  private messages: Map<string, ChatMessage[]> = new Map(); // chatId -> messages
  private onlineUsers: Map<string, Date> = new Map(); // userId -> lastSeen
  private notificationSettings: Map<string, ChatNotificationSettings> = new Map();

  private constructor() {
    this.initializeMockData();
  }

  static getInstance(): ChatService {
    if (!ChatService.instance) {
      ChatService.instance = new ChatService();
    }
    return ChatService.instance;
  }

  /**
   * Crea una nueva conversación de chat
   */
  async createConversation(
    title: string,
    participants: Omit<ChatParticipant, 'joinedAt' | 'isOnline'>[],
    options: {
      propertyId?: string | undefined;
      jobId?: string | undefined;
      description?: string | undefined;
      tags?: string[] | undefined;
    } = {}
  ): Promise<ChatConversation> {
    try {
      const conversationId = this.generateConversationId();
      const now = new Date();

      const conversation: ChatConversation = {
        id: conversationId,
        title,
        description: options.description,
        participants: participants.map(p => ({
          ...p,
          joinedAt: now,
          isOnline: this.isUserOnline(p.userId)
        })),
        status: ChatStatus.ACTIVE,
        createdAt: now,
        updatedAt: now,
        propertyId: options.propertyId,
        jobId: options.jobId,
        unreadCount: {},
        tags: options.tags || []
      };

      // Inicializar conteo de mensajes no leídos
      participants.forEach(p => {
        conversation.unreadCount[p.userId] = 0;
      });

      this.conversations.set(conversationId, conversation);
      this.messages.set(conversationId, []);

      // Agregar mensaje de sistema
      await this.addSystemMessage(
        conversationId,
        `Conversación creada: ${title}`,
        { createdBy: participants[0]?.userId || 'system' }
      );

      logger.info('Conversación creada:', {
        conversationId,
        participantCount: participants.length,
        title
      });

      return conversation;
    } catch (error) {
      logger.error('Error creando conversación', { error: error instanceof Error ? error.message : String(error) });
      throw error;
    }
  }

  /**
   * Envía un mensaje a una conversación
   */
  async sendMessage(
    chatId: string,
    senderId: string,
    content: string,
    messageType: MessageType = MessageType.TEXT,
    options: {
      attachments?: Omit<ChatAttachment, 'id' | 'uploadedAt'>[] | undefined;
      metadata?: Record<string, any> | undefined;
    } = {}
  ): Promise<ChatMessage> {
    try {
      const conversation = this.conversations.get(chatId);
      if (!conversation) {
        throw new Error('Conversación no encontrada');
      }

      const sender = conversation.participants.find(p => p.userId === senderId);
      if (!sender) {
        throw new Error('Usuario no es participante de la conversación');
      }

      const message: ChatMessage = {
        id: this.generateMessageId(),
        chatId,
        senderId,
        senderType: sender.userType,
        senderName: sender.userName,
        content,
        messageType,
        timestamp: new Date(),
        isRead: false,
        readBy: [senderId],
        attachments: options.attachments?.map(att => ({
          ...att,
          id: this.generateAttachmentId(),
          uploadedAt: new Date()
        })),
        metadata: options.metadata
      };

      // Agregar mensaje
      if (!this.messages.has(chatId)) {
        this.messages.set(chatId, []);
      }
      this.messages.get(chatId)!.push(message);

      // Actualizar conversación
      conversation.updatedAt = new Date();
      conversation.lastMessage = message;

      // Incrementar contador de mensajes no leídos para otros participantes
      conversation.participants.forEach(participant => {
        if (participant.userId !== senderId) {
          conversation.unreadCount[participant.userId] =
            (conversation.unreadCount[participant.userId] || 0) + 1;
        }
      });

      // Enviar notificaciones
      await this.sendMessageNotifications(message, conversation.participants);

      logger.info('Mensaje enviado:', {
        chatId,
        messageId: message.id,
        senderId,
        messageType
      });

      return message;
    } catch (error) {
      logger.error('Error enviando mensaje', { error: error instanceof Error ? error.message : String(error) });
      throw error;
    }
  }

  /**
   * Marca mensajes como leídos
   */
  async markMessagesAsRead(chatId: string, userId: string, messageIds: string[]): Promise<void> {
    try {
      const conversation = this.conversations.get(chatId);
      if (!conversation) {
        throw new Error('Conversación no encontrada');
      }

      const messages = this.messages.get(chatId) || [];
      let updatedCount = 0;

      messageIds.forEach(messageId => {
        const message = messages.find(m => m.id === messageId);
        if (message && !message.readBy.includes(userId)) {
          message.readBy.push(userId);
          updatedCount++;
        }
      });

      // Actualizar contador de mensajes no leídos
      if (updatedCount > 0) {
        conversation.unreadCount[userId] = Math.max(0,
          (conversation.unreadCount[userId] || 0) - updatedCount
        );
      }

      logger.info('Mensajes marcados como leídos:', {
        chatId,
        userId,
        messageCount: messageIds.length
      });

    } catch (error) {
      logger.error('Error marcando mensajes como leídos', { error: error instanceof Error ? error.message : String(error) });
      throw error;
    }
  }

  /**
   * Obtiene conversaciones de un usuario
   */
  async getUserConversations(userId: string): Promise<ChatConversation[]> {
    try {
      const userConversations: ChatConversation[] = [];

      for (const [chatId, conversation] of this.conversations) {
        if (conversation.participants.some(p => p.userId === userId)) {
          // Actualizar estado online del usuario
          const participant = conversation.participants.find(p => p.userId === userId);
          if (participant) {
            participant.isOnline = this.isUserOnline(userId);
            participant.lastSeen = this.onlineUsers.get(userId);
          }

          userConversations.push(conversation);
        }
      }

      // Ordenar por último mensaje
      userConversations.sort((a, b) => {
        const aTime = a.lastMessage?.timestamp?.getTime() || a.createdAt.getTime();
        const bTime = b.lastMessage?.timestamp?.getTime() || b.createdAt.getTime();
        return bTime - aTime;
      });

      return userConversations;
    } catch (error) {
      logger.error('Error obteniendo conversaciones del usuario', { error: error instanceof Error ? error.message : String(error) });
      throw error;
    }
  }

  /**
   * Obtiene mensajes de una conversación
   */
  async getConversationMessages(
    chatId: string,
    userId: string,
    options: {
      limit?: number | undefined;
      offset?: number | undefined;
      before?: Date | undefined;
    } = {}
  ): Promise<ChatMessage[]> {
    try {
      const conversation = this.conversations.get(chatId);
      if (!conversation) {
        throw new Error('Conversación no encontrada');
      }

      // Verificar que el usuario es participante
      if (!conversation.participants.some(p => p.userId === userId)) {
        throw new Error('Usuario no autorizado para ver esta conversación');
      }

      let messages = this.messages.get(chatId) || [];

      // Aplicar filtros
      if (options.before) {
        messages = messages.filter(m => m.timestamp < options.before!);
      }

      // Ordenar por timestamp (más reciente primero)
      messages.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

      // Aplicar paginación
      const offset = options.offset || 0;
      const limit = options.limit || 50;
      messages = messages.slice(offset, offset + limit);

      // Marcar mensajes como leídos
      const unreadMessageIds = messages
        .filter(m => !m.readBy.includes(userId))
        .map(m => m.id);

      if (unreadMessageIds.length > 0) {
        await this.markMessagesAsRead(chatId, userId, unreadMessageIds);
      }

      return messages.reverse(); // Más antiguo primero para mostrar
    } catch (error) {
      logger.error('Error obteniendo mensajes de conversación', { error: error instanceof Error ? error.message : String(error) });
      throw error;
    }
  }

  /**
   * Agrega un participante a una conversación
   */
  async addParticipant(chatId: string, participant: Omit<ChatParticipant, 'joinedAt' | 'isOnline'>): Promise<void> {
    try {
      const conversation = this.conversations.get(chatId);
      if (!conversation) {
        throw new Error('Conversación no encontrada');
      }

      // Verificar que no esté ya en la conversación
      if (conversation.participants.some(p => p.userId === participant.userId)) {
        throw new Error('Usuario ya es participante de la conversación');
      }

      const newParticipant: ChatParticipant = {
        ...participant,
        joinedAt: new Date(),
        isOnline: this.isUserOnline(participant.userId)
      };

      conversation.participants.push(newParticipant);
      conversation.unreadCount[participant.userId] = 0;
      conversation.updatedAt = new Date();

      // Agregar mensaje de sistema
      await this.addSystemMessage(
        chatId,
        `${participant.userName} se unió a la conversación`,
        { joinedUserId: participant.userId }
      );

      logger.info('Participante agregado a conversación:', {
        chatId,
        userId: participant.userId
      });

    } catch (error) {
      logger.error('Error agregando participante', { error: error instanceof Error ? error.message : String(error) });
      throw error;
    }
  }

  /**
   * Cierra una conversación
   */
  async closeConversation(chatId: string, closedBy: string): Promise<void> {
    try {
      const conversation = this.conversations.get(chatId);
      if (!conversation) {
        throw new Error('Conversación no encontrada');
      }

      conversation.status = ChatStatus.CLOSED;
      conversation.updatedAt = new Date();

      // Agregar mensaje de sistema
      await this.addSystemMessage(
        chatId,
        'Conversación cerrada',
        { closedBy }
      );

      logger.info('Conversación cerrada:', { chatId, closedBy });

    } catch (error) {
      logger.error('Error cerrando conversación', { error: error instanceof Error ? error.message : String(error) });
      throw error;
    }
  }

  /**
   * Actualiza configuración de notificaciones
   */
  async updateNotificationSettings(userId: string, settings: Partial<ChatNotificationSettings>): Promise<void> {
    try {
      const existingSettings = this.notificationSettings.get(userId) || {
        userId,
        emailNotifications: true,
        pushNotifications: true,
        soundNotifications: true,
        quietHours: { enabled: false, start: '22:00', end: '08:00' }
      };

      const updatedSettings = { ...existingSettings, ...settings };
      this.notificationSettings.set(userId, updatedSettings);

      logger.info('Configuración de notificaciones actualizada:', { userId });

    } catch (error) {
      logger.error('Error actualizando configuración de notificaciones', { error: error instanceof Error ? error.message : String(error) });
      throw error;
    }
  }

  /**
   * Actualiza estado online de usuario
   */
  async updateUserOnlineStatus(userId: string, isOnline: boolean): Promise<void> {
    try {
      if (isOnline) {
        this.onlineUsers.set(userId, new Date());
      } else {
        this.onlineUsers.delete(userId);
      }

      // Actualizar estado en todas las conversaciones del usuario
      for (const [chatId, conversation] of this.conversations) {
        const participant = conversation.participants.find(p => p.userId === userId);
        if (participant) {
          participant.isOnline = isOnline;
          if (!isOnline) {
            participant.lastSeen = new Date();
          }
        }
      }

      logger.info('Estado online actualizado:', { userId, isOnline });

    } catch (error) {
      logger.error('Error actualizando estado online', { error: error instanceof Error ? error.message : String(error) });
      throw error;
    }
  }

  /**
   * Envía notificaciones por mensaje
   */
  private async sendMessageNotifications(message: ChatMessage, participants: ChatParticipant[]): Promise<void> {
    try {
      const recipients = participants.filter(p => p.userId !== message.senderId);

      for (const recipient of recipients) {
        const settings = this.notificationSettings.get(recipient.userId);
        if (!settings) continue;

        // Verificar horas tranquilas
        if (this.isQuietHour(settings)) continue;

        // Enviar notificaciones según configuración
        if (settings.pushNotifications) {
          await this.sendPushNotification(recipient, message);
        }

        if (settings.emailNotifications) {
          await this.sendEmailNotification(recipient, message);
        }
      }
    } catch (error) {
      logger.error('Error enviando notificaciones', { error: error instanceof Error ? error.message : String(error) });
    }
  }

  /**
   * Verifica si es hora tranquila para el usuario
   */
  private isQuietHour(settings: ChatNotificationSettings): boolean {
    if (!settings.quietHours.enabled) return false;

    const now = new Date();
    const currentTime = now.getHours() * 60 + now.getMinutes();
    const startTime = this.timeToMinutes(settings.quietHours.start);
    const endTime = this.timeToMinutes(settings.quietHours.end);

    if (startTime < endTime) {
      // Misma día
      return currentTime >= startTime && currentTime <= endTime;
    } else {
      // Cruza medianoche
      return currentTime >= startTime || currentTime <= endTime;
    }
  }

  /**
   * Convierte tiempo HH:mm a minutos
   */
  private timeToMinutes(time: string): number {
    const parts = time.split(':');
    if (parts.length !== 2) {
      return 0; // Valor por defecto si el formato es inválido
    }
    const hours = Number(parts[0]!);
    const minutes = Number(parts[1]!);
    if (isNaN(hours) || isNaN(minutes)) {
      return 0; // Valor por defecto si no son números válidos
    }
    return hours * 60 + minutes;
  }

  /**
   * Envía notificación push (simulada)
   */
  private async sendPushNotification(recipient: ChatParticipant, message: ChatMessage): Promise<void> {
    logger.info('Notificación push enviada:', {
      recipientId: recipient.userId,
      messageId: message.id
    });
    // En implementación real, integrar con servicio de notificaciones push
  }

  /**
   * Envía notificación por email (simulada)
   */
  private async sendEmailNotification(recipient: ChatParticipant, message: ChatMessage): Promise<void> {
    logger.info('Notificación email enviada:', {
      recipientId: recipient.userId,
      messageId: message.id
    });
    // En implementación real, integrar con servicio de email
  }

  /**
   * Agrega mensaje de sistema
   */
  private async addSystemMessage(chatId: string, content: string, metadata?: Record<string, any>): Promise<void> {
    await this.sendMessage(chatId, 'SYSTEM', content, MessageType.SYSTEM, { metadata });
  }

  /**
   * Verifica si un usuario está online
   */
  private isUserOnline(userId: string): boolean {
    const lastSeen = this.onlineUsers.get(userId);
    if (!lastSeen) return false;

    // Considerar online si ha estado activo en los últimos 5 minutos
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    return lastSeen > fiveMinutesAgo;
  }

  /**
   * Genera ID único para conversación
   */
  private generateConversationId(): string {
    return `chat_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Genera ID único para mensaje
   */
  private generateMessageId(): string {
    return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Genera ID único para adjunto
   */
  private generateAttachmentId(): string {
    return `att_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Inicializa datos de ejemplo
   */
  private initializeMockData(): void {
    // Configuraciones de notificación por defecto
    const defaultSettings: ChatNotificationSettings = {
      userId: 'user_001',
      emailNotifications: true,
      pushNotifications: true,
      soundNotifications: true,
      quietHours: { enabled: false, start: '22:00', end: '08:00' }
    };

    this.notificationSettings.set('user_001', defaultSettings);
    this.notificationSettings.set('prov_001', defaultSettings);
    this.notificationSettings.set('prov_002', defaultSettings);

    logger.info('Datos de chat inicializados');
  }

  /**
   * Obtiene estadísticas del servicio de chat
   */
  async getServiceStats(): Promise<{
    totalConversations: number;
    activeConversations: number;
    totalMessages: number;
    onlineUsers: number;
    averageMessagesPerConversation: number;
  }> {
    const conversations = Array.from(this.conversations.values());
    const activeConversations = conversations.filter(c => c.status === ChatStatus.ACTIVE);
    const totalMessages = Array.from(this.messages.values()).reduce((sum, msgs) => sum + msgs.length, 0);

    return {
      totalConversations: conversations.length,
      activeConversations: activeConversations.length,
      totalMessages,
      onlineUsers: this.onlineUsers.size,
      averageMessagesPerConversation: conversations.length > 0 ? totalMessages / conversations.length : 0
    };
  }
}

/**
 * Instancia global del servicio de chat
 */
export const chatService = ChatService.getInstance();

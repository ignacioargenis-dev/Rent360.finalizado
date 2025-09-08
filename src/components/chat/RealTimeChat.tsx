'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import {
  Send,
  MessageCircle,
  Users,
  User,
  Phone,
  Video,
  MoreVertical,
  Smile,
  Paperclip,
  Check,
  CheckCheck,
  Clock
} from 'lucide-react';
import { useWebSocket } from '@/lib/websocket/socket-client';
import { useToast } from '@/components/notifications/NotificationSystem';

interface Message {
  id: string;
  senderId: string;
  senderName: string;
  content: string;
  timestamp: Date;
  status: 'sending' | 'sent' | 'delivered' | 'read';
  type: 'text' | 'image' | 'file';
}

interface Conversation {
  id: string;
  participants: {
    id: string;
    name: string;
    avatar?: string;
    isOnline: boolean;
  }[];
  lastMessage?: Message;
  unreadCount: number;
  updatedAt: Date;
}

interface RealTimeChatProps {
  currentUserId: string;
  currentUserName: string;
}

export default function RealTimeChat({ currentUserId, currentUserName }: RealTimeChatProps) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversation, setActiveConversation] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set());

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { isConnected, sendMessage: sendWebSocketMessage } = useWebSocket();
  const { success, error: showError } = useToast();

  // Cargar conversaciones guardadas
  useEffect(() => {
    const savedConversations = localStorage.getItem('rent360_conversations');
    if (savedConversations) {
      try {
        const parsed = JSON.parse(savedConversations);
        setConversations(parsed.map((conv: any) => ({
          ...conv,
          updatedAt: new Date(conv.updatedAt),
          lastMessage: conv.lastMessage ? {
            ...conv.lastMessage,
            timestamp: new Date(conv.lastMessage.timestamp)
          } : undefined
        })));
      } catch (err) {
        showError('Error al cargar las conversaciones');
      }
    }
  }, []);

  // Auto-scroll a mensajes nuevos
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Simular carga de conversaciones iniciales
  useEffect(() => {
    if (conversations.length === 0) {
      const mockConversations: Conversation[] = [
        {
          id: 'conv_1',
          participants: [
            {
              id: 'user_2',
              name: 'María González',
              avatar: '/avatars/maria.jpg',
              isOnline: true
            }
          ],
          unreadCount: 2,
          updatedAt: new Date(Date.now() - 1000 * 60 * 30), // 30 minutos atrás
          lastMessage: {
            id: 'msg_1',
            senderId: 'user_2',
            senderName: 'María González',
            content: 'Hola, ¿está disponible la propiedad que vi?',
            timestamp: new Date(Date.now() - 1000 * 60 * 30),
            status: 'read',
            type: 'text'
          }
        },
        {
          id: 'conv_2',
          participants: [
            {
              id: 'user_3',
              name: 'Carlos Ramírez',
              avatar: '/avatars/carlos.jpg',
              isOnline: false
            }
          ],
          unreadCount: 0,
          updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 horas atrás
          lastMessage: {
            id: 'msg_2',
            senderId: currentUserId,
            senderName: currentUserName,
            content: 'Gracias por la información',
            timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2),
            status: 'read',
            type: 'text'
          }
        }
      ];

      setConversations(mockConversations);
    }
  }, [conversations.length, currentUserId, currentUserName]);

  const handleSendMessage = () => {
    if (!newMessage.trim() || !activeConversation) return;

    const message: Message = {
      id: `msg_${Date.now()}_${Math.random()}`,
      senderId: currentUserId,
      senderName: currentUserName,
      content: newMessage.trim(),
      timestamp: new Date(),
      status: 'sending',
      type: 'text'
    };

    // Agregar mensaje localmente
    setMessages(prev => [...prev, message]);
    setNewMessage('');

    // Enviar por WebSocket
    const conversation = conversations.find(c => c.id === activeConversation);
    if (conversation && isConnected) {
      const recipientId = conversation.participants.find(p => p.id !== currentUserId)?.id;
      if (recipientId) {
        sendWebSocketMessage(recipientId, message.content, activeConversation);

        // Actualizar estado del mensaje
        setTimeout(() => {
          setMessages(prev =>
            prev.map(msg =>
              msg.id === message.id ? { ...msg, status: 'sent' } : msg
            )
          );
        }, 1000);
      }
    } else {
      // Simular envío exitoso sin WebSocket
      setTimeout(() => {
        setMessages(prev =>
          prev.map(msg =>
            msg.id === message.id ? { ...msg, status: 'sent' } : msg
          )
        );
      }, 500);
    }

    // Actualizar conversación
    setConversations(prev =>
      prev.map(conv =>
        conv.id === activeConversation
          ? {
              ...conv,
              lastMessage: message,
              updatedAt: new Date(),
              unreadCount: 0
            }
          : conv
      )
    );

    success('Mensaje enviado');
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const selectConversation = (conversationId: string) => {
    setActiveConversation(conversationId);

    // Cargar mensajes de la conversación (simulado)
    const mockMessages: Message[] = [
      {
        id: 'msg_initial_1',
        senderId: 'user_2',
        senderName: 'María González',
        content: 'Hola, me gustaría obtener más información sobre la propiedad.',
        timestamp: new Date(Date.now() - 1000 * 60 * 60),
        status: 'read',
        type: 'text'
      },
      {
        id: 'msg_initial_2',
        senderId: currentUserId,
        senderName: currentUserName,
        content: '¡Hola! Claro, ¿qué te gustaría saber específicamente?',
        timestamp: new Date(Date.now() - 1000 * 60 * 45),
        status: 'read',
        type: 'text'
      },
      {
        id: 'msg_initial_3',
        senderId: 'user_2',
        senderName: 'María González',
        content: '¿Cuál es el precio del arriendo y qué incluye?',
        timestamp: new Date(Date.now() - 1000 * 60 * 30),
        status: 'read',
        type: 'text'
      }
    ];

    setMessages(mockMessages);

    // Marcar como leída
    setConversations(prev =>
      prev.map(conv =>
        conv.id === conversationId
          ? { ...conv, unreadCount: 0 }
          : conv
      )
    );
  };

  const formatTime = (timestamp: Date) => {
    return timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const getMessageStatusIcon = (status: string) => {
    switch (status) {
      case 'sending':
        return <Clock className="h-3 w-3 text-gray-400" />;
      case 'sent':
        return <Check className="h-3 w-3 text-gray-400" />;
      case 'delivered':
        return <CheckCheck className="h-3 w-3 text-gray-400" />;
      case 'read':
        return <CheckCheck className="h-3 w-3 text-blue-500" />;
      default:
        return null;
    }
  };

  const activeConv = conversations.find(c => c.id === activeConversation);

  return (
    <div className="flex h-[600px] border rounded-lg overflow-hidden bg-white dark:bg-gray-900">
      {/* Lista de conversaciones */}
      <div className="w-80 border-r bg-gray-50 dark:bg-gray-800">
        <div className="p-4 border-b">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold flex items-center gap-2">
              <MessageCircle className="h-4 w-4" />
              Mensajes
            </h3>
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
              <span className="text-xs text-gray-600">
                {isConnected ? 'En línea' : 'Offline'}
              </span>
            </div>
          </div>
        </div>

        <ScrollArea className="flex-1">
          <div className="p-2">
            {conversations.map((conversation) => {
              const otherParticipant = conversation.participants.find(p => p.id !== currentUserId);

              return (
                <div
                  key={conversation.id}
                  className={`p-3 mb-2 rounded-lg cursor-pointer transition-colors ${
                    activeConversation === conversation.id
                      ? 'bg-blue-100 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800'
                      : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                  onClick={() => selectConversation(conversation.id)}
                >
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={otherParticipant?.avatar} />
                        <AvatarFallback>
                          {otherParticipant?.name.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      {otherParticipant?.isOnline && (
                        <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 border-2 border-white rounded-full" />
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium text-sm truncate">
                          {otherParticipant?.name}
                        </h4>
                        <span className="text-xs text-gray-500">
                          {conversation.lastMessage ?
                            formatTime(conversation.lastMessage.timestamp) :
                            formatTime(conversation.updatedAt)
                          }
                        </span>
                      </div>

                      <div className="flex items-center justify-between mt-1">
                        <p className="text-xs text-gray-600 dark:text-gray-400 truncate">
                          {conversation.lastMessage?.content || 'Nueva conversación'}
                        </p>
                        {conversation.unreadCount > 0 && (
                          <Badge variant="destructive" className="h-5 w-5 flex items-center justify-center p-0 text-xs">
                            {conversation.unreadCount}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </ScrollArea>
      </div>

      {/* Área de chat */}
      <div className="flex-1 flex flex-col">
        {activeConv ? (
          <>
            {/* Header del chat */}
            <div className="p-4 border-b bg-white dark:bg-gray-900">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Avatar>
                    <AvatarImage src={activeConv.participants.find(p => p.id !== currentUserId)?.avatar} />
                    <AvatarFallback>
                      {activeConv.participants.find(p => p.id !== currentUserId)?.name.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h4 className="font-medium">
                      {activeConv.participants.find(p => p.id !== currentUserId)?.name}
                    </h4>
                    <p className="text-sm text-gray-600">
                      {activeConv.participants.find(p => p.id !== currentUserId)?.isOnline ? 'En línea' : 'Offline'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="sm">
                    <Phone className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm">
                    <Video className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Mensajes */}
            <ScrollArea className="flex-1 p-4">
              <div className="space-y-4">
                {messages.map((message) => {
                  const isOwnMessage = message.senderId === currentUserId;

                  return (
                    <div
                      key={message.id}
                      className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                          isOwnMessage
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100'
                        }`}
                      >
                        <p className="text-sm">{message.content}</p>
                        <div className={`flex items-center justify-end gap-1 mt-1 ${
                          isOwnMessage ? 'text-blue-200' : 'text-gray-500'
                        }`}>
                          <span className="text-xs">{formatTime(message.timestamp)}</span>
                          {isOwnMessage && getMessageStatusIcon(message.status)}
                        </div>
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>

            {/* Input de mensaje */}
            <div className="p-4 border-t bg-white dark:bg-gray-900">
              {isTyping && (
                <div className="text-xs text-gray-500 mb-2">
                  El otro usuario está escribiendo...
                </div>
              )}

              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm">
                  <Paperclip className="h-4 w-4" />
                </Button>

                <Input
                  placeholder="Escribe un mensaje..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  className="flex-1"
                />

                <Button variant="ghost" size="sm">
                  <Smile className="h-4 w-4" />
                </Button>

                <Button
                  onClick={handleSendMessage}
                  disabled={!newMessage.trim()}
                  size="sm"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>

              {!isConnected && (
                <div className="text-xs text-orange-600 mt-2 flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  Mensaje se enviará cuando recuperes la conexión
                </div>
              )}
            </div>
          </>
        ) : (
          /* Estado vacío */
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <MessageCircle className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                Selecciona una conversación
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Elige una conversación de la lista para comenzar a chatear
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

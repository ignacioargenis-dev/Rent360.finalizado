'use client';

import { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { logger } from '@/lib/logger-minimal';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  MessageSquare,
  Send,
  Search,
  MoreVertical,
  Phone,
  Video,
  Paperclip,
  Smile,
  Image,
  File,
  User as UserIcon,
  Home,
  Wrench,
  DollarSign,
  Calendar,
  Check,
  CheckCheck,
  Clock,
} from 'lucide-react';
import { User } from '@/types';
import UnifiedDashboardLayout from '@/components/layout/UnifiedDashboardLayout';

interface ChatMessage {
  id: string;
  senderId: string;
  receiverId: string;
  content: string;
  timestamp: string;
  read: boolean;
  messageType: 'text' | 'image' | 'file';
  fileUrl?: string;
  fileName?: string;
}

interface Conversation {
  id: string;
  participant: {
    id: string;
    name: string;
    email: string;
    avatar?: string;
    role: 'tenant' | 'broker' | 'runner' | 'maintenance_provider';
  };
  lastMessage: ChatMessage;
  unreadCount: number;
  propertyId: string | undefined;
  propertyTitle?: string;
  contractId?: string;
  updatedAt: string;
}

export default function ChatPage() {
  const searchParams = useSearchParams();
  const [user, setUser] = useState<User | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [onlineUserIcons, setOnlineUserIcons] = useState<Set<string>>(new Set());

  // Load conversations and user data
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);

        // Load user data
        const userResponse = await fetch('/api/auth/me');
        // TODO: Implementar setUserIcon cuando sea necesario

        // Load conversations
        await loadConversations();

        // Check for new message from URL params
        const recipientId = searchParams.get('recipientId');
        const propertyId = searchParams.get('propertyId');
        const prefillMessage = searchParams.get('prefillMessage');

        if (recipientId) {
          await startNewConversation(
            recipientId,
            propertyId,
            prefillMessage ? decodeURIComponent(prefillMessage) : undefined
          );
        }
      } catch (error) {
        logger.error('Error loading data:', { error });
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  // Load conversations
  const loadConversations = async () => {
    try {
      // Mock conversations data - in production, this would come from API
      const mockConversations: Conversation[] = [
        {
          id: 'conv1',
          participant: {
            id: 'tenant1',
            name: 'María González',
            email: 'maria.gonzalez@email.com',
            role: 'tenant',
          },
          lastMessage: {
            id: 'msg1',
            senderId: 'tenant1',
            receiverId: user?.id || 'owner1',
            content: 'Hola, tengo un problema con la llave del baño',
            timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
            read: false,
            messageType: 'text',
          },
          unreadCount: 2,
          propertyId: 'prop1',
          propertyTitle: 'Apartamento Centro',
          updatedAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
        },
        {
          id: 'conv2',
          participant: {
            id: 'tenant2',
            name: 'Carlos Rodríguez',
            email: 'carlos.rodriguez@email.com',
            role: 'tenant',
          },
          lastMessage: {
            id: 'msg2',
            senderId: 'tenant2',
            receiverId: user?.id || 'owner1',
            content: '¿Puedo renovar mi contrato?',
            timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
            read: true,
            messageType: 'text',
          },
          unreadCount: 0,
          propertyId: 'prop2',
          propertyTitle: 'Casa Los Dominicos',
          updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
        },
        {
          id: 'conv3',
          participant: {
            id: 'broker1',
            name: 'Ana Martínez',
            email: 'ana.martinez@corredora.cl',
            role: 'broker',
          },
          lastMessage: {
            id: 'msg3',
            senderId: 'broker1',
            receiverId: user?.id || 'owner1',
            content: 'Tengo un interesado en tu propiedad',
            timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
            read: true,
            messageType: 'text',
          },
          unreadCount: 1,
          propertyId: 'prop3',
          propertyTitle: 'Oficina Las Condes',
          updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
        },
      ];

      setConversations(mockConversations);
    } catch (error) {
      logger.error('Error loading conversations:', { error });
    }
  };

  // Start new conversation
  const startNewConversation = async (
    recipientId: string,
    propertyId?: string | null,
    prefillMessage?: string
  ) => {
    // Check if conversation already exists
    const existingConv = conversations.find(conv => conv.participant.id === recipientId);
    if (existingConv) {
      setSelectedConversation(existingConv);
      await loadChatMessages(existingConv.id);
      return;
    }

    // Mock participant data - in production, fetch from API
    const mockParticipant = {
      id: recipientId,
      name: 'Nuevo Contacto',
      email: `${recipientId}@example.com`,
      role: 'tenant' as const,
    };

    const newConversation: Conversation = {
      id: `conv_${Date.now()}`,
      participant: mockParticipant,
      lastMessage: {
        id: `msg_${Date.now()}`,
        senderId: user?.id || 'owner1',
        receiverId: recipientId,
        content: prefillMessage || 'Hola, me gustaría contactarte',
        timestamp: new Date().toISOString(),
        read: true,
        messageType: 'text',
      },
      unreadCount: 0,
      propertyId: propertyId || undefined,
      updatedAt: new Date().toISOString(),
    };

    setConversations(prev => [newConversation, ...prev]);
    setSelectedConversation(newConversation);

    // Set prefilled message if provided
    if (prefillMessage) {
      setNewMessage(prefillMessage);
    }

    await loadChatMessages(newConversation.id);
  };

  // Load messages for a conversation
  const loadChatMessages = async (conversationId: string) => {
    try {
      // Mock messages for the conversation
      const mockMessages: ChatMessage[] = [
        {
          id: 'msg1',
          senderId: selectedConversation?.participant.id || 'tenant1',
          receiverId: user?.id || 'owner1',
          content: 'Hola, tengo una consulta sobre la propiedad',
          timestamp: new Date(Date.now() - 1000 * 60 * 10).toISOString(),
          read: true,
          messageType: 'text',
        },
        {
          id: 'msg2',
          senderId: user?.id || 'owner1',
          receiverId: selectedConversation?.participant.id || 'tenant1',
          content: '¡Hola! Claro, ¿en qué puedo ayudarte?',
          timestamp: new Date(Date.now() - 1000 * 60 * 9).toISOString(),
          read: true,
          messageType: 'text',
        },
        {
          id: 'msg3',
          senderId: selectedConversation?.participant.id || 'tenant1',
          receiverId: user?.id || 'owner1',
          content: 'Me gustaría saber si puedo renovar el contrato',
          timestamp: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
          read: false,
          messageType: 'text',
        },
      ];

      setChatMessages(mockMessages);
    } catch (error) {
      logger.error('Error loading chat messages:', { error });
    }
  };

  // Send message
  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation || sending) {
      return;
    }

    try {
      setSending(true);

      const message: ChatMessage = {
        id: `msg_${Date.now()}`,
        senderId: user?.id || 'owner1',
        receiverId: selectedConversation.participant.id,
        content: newMessage.trim(),
        timestamp: new Date().toISOString(),
        read: false,
        messageType: 'text',
      };

      // Add message to chat
      setChatMessages(prev => [...prev, message]);

      // Update conversation
      setConversations(prev =>
        prev.map(conv =>
          conv.id === selectedConversation.id
            ? {
                ...conv,
                lastMessage: message,
                updatedAt: message.timestamp,
              }
            : conv
        )
      );

      setNewMessage('');

      // Scroll to bottom
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    } catch (error) {
      logger.error('Error sending message:', { error });
    } finally {
      setSending(false);
    }
  };

  // Handle conversation selection
  const handleConversationSelect = async (conversation: Conversation) => {
    setSelectedConversation(conversation);
    await loadChatMessages(conversation.id);

    // Mark conversation as read
    setConversations(prev =>
      prev.map(conv => (conv.id === conversation.id ? { ...conv, unreadCount: 0 } : conv))
    );
  };

  // Handle Enter key press
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // Filter conversations
  const filteredConversations = conversations.filter(
    conv =>
      conv.participant.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      conv.participant.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (conv.propertyTitle && conv.propertyTitle.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  // Format message time
  const formatMessageTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 1) {
      return 'Ahora';
    }
    if (diffMins < 60) {
      return `Hace ${diffMins}m`;
    }
    if (diffHours < 24) {
      return `Hace ${diffHours}h`;
    }
    if (diffDays < 7) {
      return `Hace ${diffDays}d`;
    }

    return date.toLocaleDateString('es-CL', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Get participant role icon
  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'tenant':
        return <UserIcon className="w-4 h-4" />;
      case 'broker':
        return <UserIcon className="w-4 h-4" />;
      case 'runner':
        return <Calendar className="w-4 h-4" />;
      case 'maintenance_provider':
        return <Wrench className="w-4 h-4" />;
      default:
        return <UserIcon className="w-4 h-4" />;
    }
  };

  // Get participant role color
  const getRoleColor = (role: string) => {
    switch (role) {
      case 'tenant':
        return 'bg-blue-100 text-blue-800';
      case 'broker':
        return 'bg-green-100 text-green-800';
      case 'runner':
        return 'bg-purple-100 text-purple-800';
      case 'maintenance_provider':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <UnifiedDashboardLayout>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Cargando mensajes...</p>
          </div>
        </div>
      </UnifiedDashboardLayout>
    );
  }

  return (
    <UnifiedDashboardLayout>
      <div className="h-screen flex bg-gray-50">
        {/* Conversations Sidebar */}
        <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
          {/* Header */}
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Mensajes</h2>
              <Button size="sm" className="rounded-full">
                <MessageSquare className="w-4 h-4" />
              </Button>
            </div>

            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Buscar conversaciones..."
                className="pl-10 bg-gray-50 border-gray-200"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          {/* Conversations List */}
          <ScrollArea className="flex-1">
            <div className="p-2">
              {filteredConversations.length === 0 ? (
                <div className="text-center py-8">
                  <MessageSquare className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500 text-sm">No hay conversaciones</p>
                </div>
              ) : (
                filteredConversations.map(conversation => (
                  <div
                    key={conversation.id}
                    className={`p-3 mb-1 rounded-lg cursor-pointer transition-colors ${
                      selectedConversation?.id === conversation.id
                        ? 'bg-blue-50 border-blue-200'
                        : 'hover:bg-gray-50'
                    }`}
                    onClick={() => handleConversationSelect(conversation)}
                  >
                    <div className="flex items-start gap-3">
                      <Avatar className="w-10 h-10">
                        <AvatarImage src={conversation.participant.avatar} />
                        <AvatarFallback>{conversation.participant.name.charAt(0)}</AvatarFallback>
                      </Avatar>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <h3 className="font-medium text-gray-900 truncate">
                            {conversation.participant.name}
                          </h3>
                          <span className="text-xs text-gray-500">
                            {formatMessageTime(conversation.lastMessage.timestamp)}
                          </span>
                        </div>

                        {conversation.propertyTitle && (
                          <div className="flex items-center gap-1 mb-1">
                            <Home className="w-3 h-3 text-gray-400" />
                            <span className="text-xs text-gray-500 truncate">
                              {conversation.propertyTitle}
                            </span>
                          </div>
                        )}

                        <div className="flex items-center justify-between">
                          <p className="text-sm text-gray-600 truncate flex-1 mr-2">
                            {conversation.lastMessage.content}
                          </p>

                          <div className="flex items-center gap-1">
                            {conversation.unreadCount > 0 && (
                              <Badge className="bg-blue-600 text-white text-xs px-1.5 py-0.5">
                                {conversation.unreadCount}
                              </Badge>
                            )}
                            {conversation.lastMessage.read &&
                              conversation.lastMessage.senderId === user?.id && (
                                <CheckCheck className="w-3 h-3 text-gray-400" />
                              )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </ScrollArea>
        </div>

        {/* Chat Area */}
        <div className="flex-1 flex flex-col">
          {selectedConversation ? (
            <>
              {/* Chat Header */}
              <div className="bg-white border-b border-gray-200 px-6 py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar className="w-10 h-10">
                      <AvatarImage src={selectedConversation.participant.avatar} />
                      <AvatarFallback>
                        {selectedConversation.participant.name.charAt(0)}
                      </AvatarFallback>
                    </Avatar>

                    <div>
                      <h3 className="font-medium text-gray-900">
                        {selectedConversation.participant.name}
                      </h3>
                      <div className="flex items-center gap-2">
                        <Badge
                          className={`text-xs ${getRoleColor(selectedConversation.participant.role)}`}
                        >
                          {getRoleIcon(selectedConversation.participant.role)}
                          <span className="ml-1 capitalize">
                            {selectedConversation.participant.role === 'tenant'
                              ? 'Inquilino'
                              : selectedConversation.participant.role === 'broker'
                                ? 'Corredor'
                                : selectedConversation.participant.role === 'runner'
                                  ? 'Runner'
                                  : selectedConversation.participant.role === 'maintenance_provider'
                                    ? 'Mantención'
                                    : selectedConversation.participant.role}
                          </span>
                        </Badge>
                        {onlineUserIcons.has(selectedConversation.participant.id) && (
                          <span className="text-xs text-green-600 flex items-center gap-1">
                            <div className="w-2 h-2 bg-green-600 rounded-full"></div>
                            En línea
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm">
                      <Phone className="w-4 h-4" />
                    </Button>
                    <Button variant="outline" size="sm">
                      <Video className="w-4 h-4" />
                    </Button>
                    <Button variant="outline" size="sm">
                      <MoreVertical className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                {selectedConversation.propertyTitle && (
                  <div className="mt-3 flex items-center gap-2 text-sm text-gray-600">
                    <Home className="w-4 h-4" />
                    <span>Propiedad: {selectedConversation.propertyTitle}</span>
                  </div>
                )}
              </div>

              {/* Messages Area */}
              <ScrollArea className="flex-1 p-4">
                <div className="space-y-4">
                  {chatMessages.map(message => {
                    const isOwnMessage = message.senderId === user?.id;
                    return (
                      <div
                        key={message.id}
                        className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                            isOwnMessage
                              ? 'bg-blue-600 text-white'
                              : 'bg-white border border-gray-200 text-gray-900'
                          }`}
                        >
                          <p className="text-sm">{message.content}</p>
                          <div
                            className={`flex items-center justify-end gap-1 mt-1 text-xs ${
                              isOwnMessage ? 'text-blue-200' : 'text-gray-500'
                            }`}
                          >
                            <span>{formatMessageTime(message.timestamp)}</span>
                            {isOwnMessage && message.read && <CheckCheck className="w-3 h-3" />}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  <div ref={messagesEndRef} />
                </div>
              </ScrollArea>

              {/* Message Input */}
              <div className="bg-white border-t border-gray-200 px-6 py-4">
                <div className="flex items-end gap-3">
                  <div className="flex-1">
                    <div className="relative">
                      <Input
                        placeholder="Escribe un mensaje..."
                        className="pr-12 py-3 bg-gray-50 border-gray-200 rounded-full"
                        value={newMessage}
                        onChange={e => setNewMessage(e.target.value)}
                        onKeyPress={handleKeyPress}
                        disabled={sending}
                      />
                      <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex items-center gap-2">
                        <Button variant="ghost" size="sm" className="p-1">
                          <Smile className="w-4 h-4 text-gray-400" />
                        </Button>
                        <Button variant="ghost" size="sm" className="p-1">
                          <Paperclip className="w-4 h-4 text-gray-400" />
                        </Button>
                      </div>
                    </div>
                  </div>

                  <Button
                    onClick={sendMessage}
                    disabled={!newMessage.trim() || sending}
                    className="rounded-full w-12 h-12 p-0"
                  >
                    {sending ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    ) : (
                      <Send className="w-5 h-5" />
                    )}
                  </Button>
                </div>

                <div className="flex items-center justify-between mt-2 text-xs text-gray-500">
                  <span>Presiona Enter para enviar</span>
                  <span>Shift + Enter para nueva línea</span>
                </div>
              </div>
            </>
          ) : (
            /* Empty State */
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <MessageSquare className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Selecciona una conversación
                </h3>
                <p className="text-gray-500">
                  Elige una conversación de la lista para comenzar a chatear
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </UnifiedDashboardLayout>
  );
}

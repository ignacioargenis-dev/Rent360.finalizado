'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { logger } from '@/lib/logger-minimal';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  MessageCircle,
  Send,
  Phone,
  Mail,
  Search,
  Paperclip,
  CheckCircle,
  Clock,
  AlertCircle,
  Plus,
} from 'lucide-react';
import { useAuth } from '@/components/auth/AuthProviderSimple';

interface Message {
  id: string;
  content: string;
  senderId: string;
  senderName: string;
  senderRole: string;
  timestamp: string;
  isRead: boolean;
  type: 'text' | 'image' | 'file';
}

interface Conversation {
  id: string;
  participantId: string;
  participantName: string;
  participantRole: string;
  participantAvatar?: string;
  lastMessage: {
    content: string;
    timestamp: string;
    senderName: string;
  };
  unreadCount: number;
  status: 'active' | 'archived';
  propertyAddress?: string;
  propertyTitle?: string;
}

interface UnifiedMessagingSystemProps {
  title?: string;
  subtitle?: string;
  showNewChatButton?: boolean;
  showCallButton?: boolean;
  showEmailButton?: boolean;
  showResolveButton?: boolean;
  onResolve?: (conversationId: string) => void;
  onCall?: (conversationId: string) => void;
  onEmail?: (conversationId: string) => void;
}

export default function UnifiedMessagingSystem({
  title = 'Mensajes',
  subtitle = 'Comunícate con inquilinos, proveedores y el equipo',
  showNewChatButton = true,
  showCallButton = true,
  showEmailButton = true,
  showResolveButton = false,
  onResolve,
  onCall,
  onEmail,
}: UnifiedMessagingSystemProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Estados principales
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);

  // Estadísticas
  const [stats, setStats] = useState({
    totalConversations: 0,
    unreadMessages: 0,
    activeToday: 0,
    avgResponseTime: '2.5h',
  });

  useEffect(() => {
    loadPageData();

    // Check if we need to create a new conversation
    const isNewConversation = searchParams?.get('new') === 'true';
    if (isNewConversation) {
      handleNewConversation();
    }
  }, [searchParams]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadPageData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Cargar conversaciones
      const conversationsResponse = await fetch('/api/messages/conversations', {
        method: 'GET',
        credentials: 'include',
        headers: {
          Accept: 'application/json',
        },
      });

      if (!conversationsResponse.ok) {
        throw new Error(
          `Error ${conversationsResponse.status}: ${conversationsResponse.statusText}`
        );
      }

      const conversationsData = await conversationsResponse.json();

      if (conversationsData.success && conversationsData.data) {
        // Transformar datos de la API al formato esperado
        const transformedConversations: Conversation[] = conversationsData.data.map(
          (conv: any) => ({
            id: conv.participant.id,
            participantId: conv.participant.id,
            participantName: conv.participant.name || 'Usuario desconocido',
            participantRole: conv.participant.role || 'USER',
            participantAvatar: conv.participant.avatar,
            lastMessage: {
              content: conv.lastMessage?.content || 'Sin contenido',
              timestamp: conv.lastMessage?.timestamp || new Date().toISOString(),
              senderName: conv.participant.name || 'Usuario desconocido',
            },
            unreadCount: conv.unreadCount || 0,
            status: 'active',
            propertyAddress: conv.property?.address || 'Dirección no disponible',
            propertyTitle: conv.property?.title || 'Propiedad',
          })
        );

        setConversations(transformedConversations);

        // Calcular estadísticas
        const totalUnread = transformedConversations.reduce(
          (sum, conv) => sum + conv.unreadCount,
          0
        );
        const activeToday = transformedConversations.filter(conv => {
          const lastActivity = new Date(conv.lastMessage.timestamp);
          const today = new Date();
          return lastActivity.toDateString() === today.toDateString();
        }).length;

        setStats({
          totalConversations: transformedConversations.length,
          unreadMessages: totalUnread,
          activeToday,
          avgResponseTime: '2.5h',
        });

        // Seleccionar la primera conversación si hay alguna
        if (transformedConversations.length > 0 && !selectedConversation) {
          setSelectedConversation(transformedConversations[0] || null);
        }
      } else {
        setConversations([]);
      }
    } catch (error) {
      logger.error('Error loading page data:', {
        error: error instanceof Error ? error.message : String(error),
      });
      setError('Error al cargar los datos');
    } finally {
      setLoading(false);
    }
  };

  const handleNewConversation = () => {
    try {
      // Get recipient data from sessionStorage
      const recipientDataStr = sessionStorage.getItem('newMessageRecipient');
      if (!recipientDataStr) {
        logger.warn('No recipient data found in sessionStorage');
        return;
      }

      const recipientData = JSON.parse(recipientDataStr);

      // Create a new conversation object
      const newConversation: Conversation = {
        id: `new_${Date.now()}`,
        participantId: recipientData.id,
        participantName: recipientData.name,
        participantRole: recipientData.type,
        lastMessage: {
          content: `Nueva conversación sobre: ${recipientData.propertyTitle || 'servicio'}`,
          timestamp: new Date().toISOString(),
          senderName: user?.name || 'Usuario',
        },
        unreadCount: 0,
        status: 'active',
        propertyAddress: recipientData.propertyAddress,
        propertyTitle: recipientData.propertyTitle,
      };

      // Add to conversations list
      setConversations(prev => [newConversation, ...prev]);

      // Select the new conversation
      setSelectedConversation(newConversation);

      // Clear sessionStorage
      sessionStorage.removeItem('newMessageRecipient');

      // Update URL to remove the new parameter
      const newUrl = new URL(window.location.href);
      newUrl.searchParams.delete('new');
      window.history.replaceState({}, '', newUrl.toString());
    } catch (error) {
      logger.error('Error handling new conversation:', { error });
    }
  };

  const loadConversationMessages = async (conversationId: string) => {
    try {
      const response = await fetch(`/api/messages?receiverId=${conversationId}&limit=50`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

      if (data.success && data.messages) {
        const transformedMessages: Message[] = data.messages.map((message: any) => ({
          id: message.id,
          content: message.content || 'Sin contenido',
          senderId: message.senderId || 'unknown',
          senderName: message.sender?.name || 'Usuario desconocido',
          senderRole: message.sender?.role || 'USER',
          timestamp: message.createdAt?.split('T')[0] || new Date().toISOString().split('T')[0],
          isRead: message.isRead || false,
          type: 'text',
        }));

        setMessages(transformedMessages);
      }
    } catch (error) {
      logger.error('Error loading conversation messages:', {
        error: error instanceof Error ? error.message : String(error),
      });
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation || sendingMessage) {
      return;
    }

    try {
      setSendingMessage(true);
      const response = await fetch('/api/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          content: newMessage,
          receiverId: selectedConversation.participantId,
        }),
      });

      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }

      setNewMessage('');

      // Reload messages for the current conversation
      if (selectedConversation) {
        loadConversationMessages(selectedConversation.participantId);
      }

      // Reload conversations to update last message
      loadPageData();
    } catch (error) {
      logger.error('Error sending message:', {
        error: error instanceof Error ? error.message : String(error),
      });
    } finally {
      setSendingMessage(false);
    }
  };

  const handleConversationSelect = (conversation: Conversation) => {
    setSelectedConversation(conversation);
    loadConversationMessages(conversation.participantId);
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role.toLowerCase()) {
      case 'tenant':
      case 'inquilino':
        return 'bg-green-100 text-green-800';
      case 'owner':
      case 'propietario':
        return 'bg-blue-100 text-blue-800';
      case 'provider':
      case 'proveedor':
        return 'bg-purple-100 text-purple-800';
      case 'broker':
      case 'corredor':
        return 'bg-orange-100 text-orange-800';
      case 'admin':
      case 'administrador':
        return 'bg-red-100 text-red-800';
      case 'support':
      case 'soporte':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getRoleDisplayName = (role: string) => {
    switch (role.toLowerCase()) {
      case 'tenant':
        return 'Inquilino';
      case 'owner':
        return 'Propietario';
      case 'provider':
        return 'Proveedor';
      case 'broker':
        return 'Corredor';
      case 'admin':
        return 'Administrador';
      case 'support':
        return 'Soporte';
      default:
        return role;
    }
  };

  const formatTimeAgo = (timestamp: string) => {
    const now = new Date();
    const messageTime = new Date(timestamp);
    const diffInMinutes = Math.floor((now.getTime() - messageTime.getTime()) / (1000 * 60));

    if (diffInMinutes < 1) {
      return 'Ahora';
    }
    if (diffInMinutes < 60) {
      return `Hace ${diffInMinutes}m`;
    }

    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) {
      return `Hace ${diffInHours}h`;
    }

    const diffInDays = Math.floor(diffInHours / 24);
    return `Hace ${diffInDays}d`;
  };

  const filteredConversations = conversations.filter(
    conv =>
      conv.participantName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      conv.propertyAddress?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      conv.lastMessage.content.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2">Cargando mensajes...</span>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{title}</h1>
          <p className="text-gray-600 mt-2">{subtitle}</p>
        </div>
        {showNewChatButton && (
          <Button className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Nuevo Chat
          </Button>
        )}
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <MessageCircle className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Conversaciones</p>
                <p className="text-2xl font-bold">{stats.totalConversations}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-100 rounded-lg">
                <Clock className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">No Leídos</p>
                <p className="text-2xl font-bold">{stats.unreadMessages}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircle className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Activos Hoy</p>
                <p className="text-2xl font-bold">{stats.activeToday}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Clock className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Tiempo Respuesta</p>
                <p className="text-2xl font-bold">{stats.avgResponseTime}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex gap-6 min-h-0">
        {/* Left Panel - Conversations */}
        <Card className="w-1/3 flex flex-col">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2">
              <MessageCircle className="h-5 w-5" />
              Conversaciones
            </CardTitle>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col p-0">
            {/* Search */}
            <div className="p-4 border-b">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Buscar conversa..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Conversations List */}
            <div className="flex-1 overflow-y-auto">
              {filteredConversations.map(conversation => (
                <div
                  key={conversation.id}
                  className={`p-4 border-b cursor-pointer hover:bg-gray-50 transition-colors ${
                    selectedConversation?.id === conversation.id ? 'bg-blue-50 border-blue-200' : ''
                  }`}
                  onClick={() => handleConversationSelect(conversation)}
                >
                  <div className="flex items-start gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={conversation.participantAvatar} />
                      <AvatarFallback>
                        {conversation.participantName
                          .split(' ')
                          .map(n => n[0])
                          .join('')
                          .toUpperCase()}
                      </AvatarFallback>
                    </Avatar>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-medium text-sm truncate">
                          {conversation.participantName}
                        </p>
                        <Badge
                          className={`text-xs ${getRoleBadgeColor(conversation.participantRole)}`}
                        >
                          {getRoleDisplayName(conversation.participantRole)}
                        </Badge>
                      </div>

                      <p className="text-xs text-gray-500 mb-1">
                        {formatTimeAgo(conversation.lastMessage.timestamp)}
                      </p>

                      <p className="text-sm text-gray-600 truncate">
                        {conversation.lastMessage.content}
                      </p>

                      {conversation.propertyAddress && (
                        <div className="flex items-center gap-1 mt-1">
                          <div className="h-3 w-3 bg-gray-400 rounded-full"></div>
                          <p className="text-xs text-gray-500 truncate">
                            {conversation.propertyAddress}
                          </p>
                        </div>
                      )}
                    </div>

                    {conversation.unreadCount > 0 && (
                      <div className="bg-blue-600 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                        {conversation.unreadCount}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Right Panel - Chat */}
        <Card className="flex-1 flex flex-col">
          {selectedConversation ? (
            <>
              {/* Chat Header */}
              <CardHeader className="pb-3 border-b">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={selectedConversation.participantAvatar} />
                      <AvatarFallback>
                        {selectedConversation.participantName
                          .split(' ')
                          .map(n => n[0])
                          .join('')
                          .toUpperCase()}
                      </AvatarFallback>
                    </Avatar>

                    <div>
                      <p className="font-medium">{selectedConversation.participantName}</p>
                      <div className="flex items-center gap-2">
                        <Badge
                          className={`text-xs ${getRoleBadgeColor(selectedConversation.participantRole)}`}
                        >
                          {getRoleDisplayName(selectedConversation.participantRole)}
                        </Badge>
                        {selectedConversation.propertyAddress && (
                          <div className="flex items-center gap-1">
                            <div className="h-3 w-3 bg-gray-400 rounded-full"></div>
                            <span className="text-sm text-gray-500">
                              {selectedConversation.propertyAddress}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {showCallButton && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onCall?.(selectedConversation.id)}
                      >
                        <Phone className="h-4 w-4" />
                      </Button>
                    )}
                    {showEmailButton && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onEmail?.(selectedConversation.id)}
                      >
                        <Mail className="h-4 w-4" />
                      </Button>
                    )}
                    {showResolveButton && (
                      <Button
                        size="sm"
                        className="bg-green-600 hover:bg-green-700"
                        onClick={() => onResolve?.(selectedConversation.id)}
                      >
                        Resuelta
                      </Button>
                    )}
                  </div>
                </div>
              </CardHeader>

              {/* Messages */}
              <CardContent className="flex-1 overflow-y-auto p-4">
                <div className="space-y-4">
                  {messages.map(message => (
                    <div
                      key={message.id}
                      className={`flex ${message.senderId === user?.id ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                          message.senderId === user?.id
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-100 text-gray-900'
                        }`}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-medium">{message.senderName}</span>
                          <span className="text-xs opacity-75">
                            {formatTimeAgo(message.timestamp)}
                          </span>
                        </div>
                        <p className="text-sm">{message.content}</p>
                      </div>
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>
              </CardContent>

              {/* Message Input */}
              <div className="p-4 border-t">
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm">
                    <Paperclip className="h-4 w-4" />
                  </Button>
                  <Input
                    placeholder="Escribe tu mensaje..."
                    value={newMessage}
                    onChange={e => setNewMessage(e.target.value)}
                    onKeyPress={e => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSendMessage();
                      }
                    }}
                    className="flex-1"
                  />
                  <Button
                    onClick={handleSendMessage}
                    disabled={!newMessage.trim() || sendingMessage}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <Send className="h-4 w-4" />
                    Enviar
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <CardContent className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <MessageCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Selecciona una conversación
                </h3>
                <p className="text-gray-600">
                  Elige una conversación del panel izquierdo para comenzar a chatear.
                </p>
              </div>
            </CardContent>
          )}
        </Card>
      </div>
    </div>
  );
}

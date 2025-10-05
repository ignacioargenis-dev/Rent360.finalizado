'use client';

import React, { useState, useEffect, useRef } from 'react';
import { logger } from '@/lib/logger';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import UnifiedDashboardLayout from '@/components/layout/UnifiedDashboardLayout';
import {
  MessageCircle,
  Send,
  User,
  Phone,
  Mail,
  Clock,
  Check,
  CheckCheck,
  MoreVertical,
  Search,
  Plus,
  Paperclip,
  Smile,
} from 'lucide-react';
import { User as UserType } from '@/types';

interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  senderAvatar?: string;
  content: string;
  timestamp: string;
  read: boolean;
  type: 'text' | 'image' | 'file';
  fileUrl?: string;
  fileName?: string;
}

interface ChatConversation {
  id: string;
  participants: {
    id: string;
    name: string;
    avatar?: string;
    role: 'owner' | 'tenant' | 'provider' | 'admin';
    phone?: string;
    email?: string;
  }[];
  lastMessage: ChatMessage;
  unreadCount: number;
  updatedAt: string;
  status: 'active' | 'archived' | 'resolved';
  propertyId?: string;
  propertyTitle?: string;
}

interface ChatStats {
  totalConversations: number;
  unreadMessages: number;
  activeToday: number;
  responseTime: string;
}

export default function ChatPage() {
  const [user, setUser] = useState<UserType | null>(null);
  const [conversations, setConversations] = useState<ChatConversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [stats, setStats] = useState<ChatStats>({
    totalConversations: 0,
    unreadMessages: 0,
    activeToday: 0,
    responseTime: '2.5h',
  });
  const [loading, setLoading] = useState(true);
  const [showNewChatDialog, setShowNewChatDialog] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredConversations, setFilteredConversations] = useState<ChatConversation[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const loadUserData = async () => {
      try {
        const response = await fetch('/api/auth/me');
        if (response.ok) {
          const data = await response.json();
          setUser(data.user);
        }
      } catch (error) {
        logger.error('Error loading user data:', {
          error: error instanceof Error ? error.message : String(error),
        });
      }
    };

    const loadChatData = async () => {
      try {
        // Mock conversations data
        const mockConversations: ChatConversation[] = [
          {
            id: 'conv1',
            participants: [
              {
                id: 'user1',
                name: 'María González',
                role: 'tenant',
                phone: '+56912345678',
                email: 'maria@example.com',
              },
              {
                id: 'user2',
                name: 'Juan Pérez',
                role: 'owner',
                phone: '+56987654321',
                email: 'juan@example.com',
              },
            ],
            lastMessage: {
              id: 'msg1',
              senderId: 'user1',
              senderName: 'María González',
              content: '¿Podría revisar la fuga en la cocina esta semana?',
              timestamp: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
              read: false,
              type: 'text',
            },
            unreadCount: 2,
            updatedAt: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
            status: 'active',
            propertyId: 'prop1',
            propertyTitle: 'Apartamento Centro',
          },
          {
            id: 'conv2',
            participants: [
              {
                id: 'user3',
                name: 'Carlos Rodríguez',
                role: 'provider',
                phone: '+56955556666',
                email: 'carlos@example.com',
              },
              {
                id: 'user2',
                name: 'Juan Pérez',
                role: 'owner',
                phone: '+56987654321',
                email: 'juan@example.com',
              },
            ],
            lastMessage: {
              id: 'msg2',
              senderId: 'user3',
              senderName: 'Carlos Rodríguez',
              content: 'El mantenimiento del aire acondicionado está programado para mañana.',
              timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
              read: true,
              type: 'text',
            },
            unreadCount: 0,
            updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
            status: 'active',
            propertyId: 'prop2',
            propertyTitle: 'Casa Los Dominicos',
          },
          {
            id: 'conv3',
            participants: [
              {
                id: 'user4',
                name: 'Ana López',
                role: 'tenant',
                phone: '+56977778888',
                email: 'ana@example.com',
              },
              {
                id: 'user2',
                name: 'Juan Pérez',
                role: 'owner',
                phone: '+56987654321',
                email: 'juan@example.com',
              },
            ],
            lastMessage: {
              id: 'msg3',
              senderId: 'user4',
              senderName: 'Ana López',
              content: '¿Cuándo estarán listos los documentos del contrato?',
              timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
              read: true,
              type: 'text',
            },
            unreadCount: 0,
            updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
            status: 'resolved',
            propertyId: 'prop3',
            propertyTitle: 'Oficina Las Condes',
          },
        ];

        // Mock messages for first conversation
        const mockMessages: ChatMessage[] = [
          {
            id: 'msg1',
            senderId: 'user1',
            senderName: 'María González',
            content: 'Hola, ¿cómo está? Necesito que alguien revise una fuga en la cocina.',
            timestamp: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
            read: true,
            type: 'text',
          },
          {
            id: 'msg2',
            senderId: 'user2',
            senderName: 'Juan Pérez',
            content: 'Hola María, claro. ¿Podría ser esta semana?',
            timestamp: new Date(Date.now() - 1000 * 60 * 35).toISOString(),
            read: true,
            type: 'text',
          },
          {
            id: 'msg3',
            senderId: 'user1',
            senderName: 'María González',
            content: 'Sí, cualquier día entre lunes y viernes me viene bien.',
            timestamp: new Date(Date.now() - 1000 * 60 * 25).toISOString(),
            read: true,
            type: 'text',
          },
          {
            id: 'msg4',
            senderId: 'user2',
            senderName: 'Juan Pérez',
            content: 'Perfecto, coordinaré con el proveedor. Le aviso cuando esté confirmado.',
            timestamp: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
            read: false,
            type: 'text',
          },
        ];

        setConversations(mockConversations);
        setMessages(mockMessages);

        // Calculate stats
        const totalConversations = mockConversations.length;
        const unreadMessages = mockConversations.reduce((sum, conv) => sum + conv.unreadCount, 0);
        const activeToday = mockConversations.filter(
          conv => new Date(conv.updatedAt) > new Date(Date.now() - 1000 * 60 * 60 * 24)
        ).length;

        const chatStats: ChatStats = {
          totalConversations,
          unreadMessages,
          activeToday,
          responseTime: '2.5h',
        };

        setStats(chatStats);
        setFilteredConversations(mockConversations);
        setLoading(false);
      } catch (error) {
        logger.error('Error loading chat data:', {
          error: error instanceof Error ? error.message : String(error),
        });
        setLoading(false);
      }
    };

    loadUserData();
    loadChatData();
  }, []);

  // Filter conversations based on search query
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredConversations(conversations);
    } else {
      const filtered = conversations.filter(
        conv =>
          conv.participants.some(p => p.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
          conv.propertyTitle?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          conv.lastMessage.content.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredConversations(filtered);
    }
  }, [conversations, searchQuery]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation) {
      return;
    }

    const message: ChatMessage = {
      id: Date.now().toString(),
      senderId: user?.id || 'current_user',
      senderName: user?.name || 'Usuario',
      content: newMessage,
      timestamp: new Date().toISOString(),
      read: true,
      type: 'text',
    };

    setMessages(prev => [...prev, message]);
    setNewMessage('');

    // Update conversation's last message
    setConversations(prev =>
      prev.map(conv =>
        conv.id === selectedConversation
          ? {
              ...conv,
              lastMessage: message,
              updatedAt: new Date().toISOString(),
            }
          : conv
      )
    );

    // Simulate typing indicator
    setTimeout(() => {
      const autoReply: ChatMessage = {
        id: (Date.now() + 1).toString(),
        senderId: 'auto_reply',
        senderName: 'Sistema',
        content: 'Mensaje recibido. Nos pondremos en contacto pronto.',
        timestamp: new Date().toISOString(),
        read: false,
        type: 'text',
      };
      setMessages(prev => [...prev, autoReply]);
    }, 2000);
  };

  const handleNewChat = () => {
    setShowNewChatDialog(true);
  };

  const handleArchiveConversation = async () => {
    if (!selectedConversation) {
      return;
    }

    // Mark conversation as archived
    setConversations(prev =>
      prev.map(conv =>
        conv.id === selectedConversation ? { ...conv, status: 'archived' as const } : conv
      )
    );

    setSelectedConversation(null);
    alert('Conversación archivada exitosamente');
  };

  const handleResolveConversation = async () => {
    if (!selectedConversation) {
      return;
    }

    // Mark conversation as resolved
    setConversations(prev =>
      prev.map(conv =>
        conv.id === selectedConversation ? { ...conv, status: 'resolved' as const } : conv
      )
    );

    setSelectedConversation(null);
    alert('Conversación marcada como resuelta');
  };

  const handleCallContact = (conversation: ChatConversation) => {
    const contact = conversation.participants.find(p => p.id !== user?.id);
    if (contact?.phone) {
      window.open(`tel:${contact.phone}`);
    } else {
      alert('No hay número de teléfono disponible para este contacto');
    }
  };

  const handleEmailContact = (conversation: ChatConversation) => {
    const contact = conversation.participants.find(p => p.id !== user?.id);
    if (contact?.email) {
      const subject = `Seguimiento conversación - ${conversation.propertyTitle || 'Propiedad'}`;
      window.open(`mailto:${contact.email}?subject=${encodeURIComponent(subject)}`);
    } else {
      alert('No hay dirección de email disponible para este contacto');
    }
  };

  const handleConversationSelect = (conversationId: string) => {
    setSelectedConversation(conversationId);
    // Mark conversation as read
    setConversations(prev =>
      prev.map(conv => (conv.id === conversationId ? { ...conv, unreadCount: 0 } : conv))
    );
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

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
      month: 'short',
      day: 'numeric',
    });
  };

  const getParticipantNames = (participants: ChatConversation['participants']) => {
    return participants
      .filter(p => p.id !== user?.id)
      .map(p => p.name)
      .join(', ');
  };

  const getRoleBadge = (role: string) => {
    const colors = {
      owner: 'bg-blue-100 text-blue-800',
      tenant: 'bg-green-100 text-green-800',
      provider: 'bg-purple-100 text-purple-800',
      admin: 'bg-red-100 text-red-800',
    };

    const labels = {
      owner: 'Propietario',
      tenant: 'Inquilino',
      provider: 'Proveedor',
      admin: 'Admin',
    };

    return (
      <Badge className={colors[role as keyof typeof colors] || colors.admin}>
        {labels[role as keyof typeof labels] || role}
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando mensajes...</p>
        </div>
      </div>
    );
  }

  const selectedConv = conversations.find(c => c.id === selectedConversation);

  return (
    <UnifiedDashboardLayout
      title="Mensajes"
      subtitle="Comunícate con inquilinos, proveedores y el equipo"
    >
      <div className="container mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-6 gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Mensajes</h1>
            <p className="text-gray-600">Centro de comunicación unificado</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleNewChat}>
              <Plus className="w-4 h-4 mr-2" />
              Nuevo Chat
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Conversaciones</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.totalConversations}</p>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <MessageCircle className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">No Leídos</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.unreadMessages}</p>
                </div>
                <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                  <Clock className="w-6 h-6 text-orange-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Activos Hoy</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.activeToday}</p>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <Check className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Tiempo Respuesta</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.responseTime}</p>
                </div>
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                  <Clock className="w-6 h-6 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Chat Interface */}
        <div className="grid lg:grid-cols-4 gap-6 h-[600px]">
          {/* Conversations List */}
          <div className="lg:col-span-1">
            <Card className="h-full">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageCircle className="w-5 h-5" />
                  Conversaciones
                </CardTitle>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    placeholder="Buscar conversaciones..."
                    className="pl-10"
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                  />
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <div className="space-y-1 overflow-y-auto max-h-[480px]">
                  {filteredConversations.map(conversation => (
                    <div
                      key={conversation.id}
                      className={`p-3 cursor-pointer hover:bg-gray-50 transition-colors ${
                        selectedConversation === conversation.id
                          ? 'bg-blue-50 border-r-2 border-blue-500'
                          : ''
                      }`}
                      onClick={() => handleConversationSelect(conversation.id)}
                    >
                      <div className="flex items-center gap-3 mb-2">
                        <Avatar className="w-10 h-10">
                          <AvatarFallback>
                            {conversation.participants
                              .filter(p => p.id !== user?.id)
                              .map(p => p.name.charAt(0))
                              .join('')}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <p className="font-medium text-sm text-gray-900 truncate">
                              {getParticipantNames(conversation.participants)}
                            </p>
                            <span className="text-xs text-gray-500">
                              {formatTime(conversation.updatedAt)}
                            </span>
                          </div>
                          <p className="text-xs text-gray-600 truncate">
                            {conversation.lastMessage.content}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex gap-1">
                          {conversation.participants
                            .filter(p => p.id !== user?.id)
                            .map(p => (
                              <span key={p.id} className="text-xs">
                                {getRoleBadge(p.role)}
                              </span>
                            ))}
                        </div>
                        {conversation.unreadCount > 0 && (
                          <Badge className="bg-blue-500 text-white text-xs">
                            {conversation.unreadCount}
                          </Badge>
                        )}
                      </div>
                      {conversation.propertyTitle && (
                        <p className="text-xs text-gray-500 mt-1 truncate">
                          📍 {conversation.propertyTitle}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Chat Area */}
          <div className="lg:col-span-3">
            {selectedConv ? (
              <Card className="h-full flex flex-col">
                {/* Chat Header */}
                <CardHeader className="border-b">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Avatar className="w-10 h-10">
                        <AvatarFallback>
                          {selectedConv.participants
                            .filter(p => p.id !== user?.id)
                            .map(p => p.name.charAt(0))
                            .join('')}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <h3 className="font-semibold text-gray-900">
                          {getParticipantNames(selectedConv.participants)}
                        </h3>
                        <div className="flex gap-2">
                          {selectedConv.participants
                            .filter(p => p.id !== user?.id)
                            .map(p => getRoleBadge(p.role))}
                        </div>
                        {selectedConv.propertyTitle && (
                          <p className="text-sm text-gray-600">📍 {selectedConv.propertyTitle}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2 flex-wrap">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleCallContact(selectedConv)}
                      >
                        <Phone className="w-4 h-4 mr-2" />
                        Llamar
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEmailContact(selectedConv)}
                      >
                        <Mail className="w-4 h-4 mr-2" />
                        Email
                      </Button>
                      {selectedConv.status === 'active' && (
                        <>
                          <Button variant="outline" size="sm" onClick={handleArchiveConversation}>
                            Archivar
                          </Button>
                          <Button variant="default" size="sm" onClick={handleResolveConversation}>
                            <Check className="w-4 h-4 mr-2" />
                            Resolver
                          </Button>
                        </>
                      )}
                      {selectedConv.status === 'archived' && (
                        <Badge variant="secondary">Archivada</Badge>
                      )}
                      {selectedConv.status === 'resolved' && (
                        <Badge className="bg-green-100 text-green-800">Resuelta</Badge>
                      )}
                    </div>
                  </div>
                </CardHeader>

                {/* Messages */}
                <CardContent className="flex-1 overflow-y-auto p-4 space-y-4">
                  {messages.map(message => (
                    <div
                      key={message.id}
                      className={`flex items-start gap-3 ${
                        message.senderId === user?.id ? 'justify-end' : ''
                      }`}
                    >
                      {message.senderId !== user?.id && (
                        <Avatar className="w-8 h-8">
                          <AvatarFallback className="text-xs">
                            {message.senderName.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                      )}
                      <div
                        className={`max-w-[70%] p-3 rounded-lg ${
                          message.senderId === user?.id
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-100 text-gray-900'
                        }`}
                      >
                        <p className="text-sm">{message.content}</p>
                        <div
                          className={`flex items-center gap-1 mt-1 text-xs ${
                            message.senderId === user?.id ? 'text-blue-200' : 'text-gray-500'
                          }`}
                        >
                          <span>{formatTime(message.timestamp)}</span>
                          {message.senderId === user?.id &&
                            (message.read ? (
                              <CheckCheck className="w-3 h-3" />
                            ) : (
                              <Check className="w-3 h-3" />
                            ))}
                        </div>
                      </div>
                      {message.senderId === user?.id && (
                        <Avatar className="w-8 h-8">
                          <AvatarFallback className="text-xs">
                            {user?.name?.charAt(0) || 'U'}
                          </AvatarFallback>
                        </Avatar>
                      )}
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </CardContent>

                {/* Message Input */}
                <div className="border-t p-4">
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm">
                      <Paperclip className="w-4 h-4" />
                    </Button>
                    <Textarea
                      placeholder="Escribe tu mensaje..."
                      value={newMessage}
                      onChange={e => setNewMessage(e.target.value)}
                      onKeyPress={e => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleSendMessage();
                        }
                      }}
                      className="flex-1 resize-none"
                      rows={1}
                    />
                    <Button
                      onClick={handleSendMessage}
                      disabled={!newMessage.trim()}
                      className="px-6"
                    >
                      <Send className="w-4 h-4 mr-2" />
                      Enviar
                    </Button>
                  </div>
                </div>
              </Card>
            ) : (
              <Card className="h-full flex items-center justify-center">
                <div className="text-center">
                  <MessageCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    Selecciona una conversación
                  </h3>
                  <p className="text-gray-600 mb-4">
                    Elige una conversación de la lista para comenzar a chatear
                  </p>
                  <Button onClick={handleNewChat}>
                    <Plus className="w-4 h-4 mr-2" />
                    Iniciar Nueva Conversación
                  </Button>
                </div>
              </Card>
            )}
          </div>
        </div>
      </div>
    </UnifiedDashboardLayout>
  );
}

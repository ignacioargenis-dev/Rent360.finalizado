'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { logger } from '@/lib/logger';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import UnifiedDashboardLayout from '@/components/layout/UnifiedDashboardLayout';
import {
  MessageSquare,
  Send,
  User,
  Clock,
  Phone,
  Mail,
  AlertCircle,
  CheckCircle,
  Eye,
  Reply,
  Plus,
  Search,
} from 'lucide-react';
import { User as UserType } from '@/types';

interface Message {
  id: string;
  senderId: string;
  senderName: string;
  senderType: 'client' | 'admin' | 'system';
  subject: string;
  content: string;
  timestamp: string;
  read: boolean;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  relatedPropertyId?: string;
  relatedPropertyTitle?: string;
  type: 'inquiry' | 'update' | 'complaint' | 'confirmation' | 'system';
}

interface Conversation {
  id: string;
  clientId: string;
  clientName: string;
  clientPhone: string;
  clientEmail: string;
  propertyTitle: string;
  lastMessage: string;
  lastMessageTime: string;
  unreadCount: number;
  status: 'active' | 'archived' | 'resolved';
  priority: 'low' | 'medium' | 'high' | 'urgent';
}

interface MessageStats {
  totalMessages: number;
  unreadMessages: number;
  activeConversations: number;
  urgentMessages: number;
}

export default function RunnerMessagesPage() {
  const [user, setUser] = useState<UserType | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [stats, setStats] = useState<MessageStats>({
    totalMessages: 0,
    unreadMessages: 0,
    activeConversations: 0,
    urgentMessages: 0,
  });
  const [loading, setLoading] = useState(true);
  const [successMessage, setSuccessMessage] = useState('');

  const router = useRouter();

  const handleNewMessage = () => {
    // Navigate to new message composition
    router.push('/runner/messages/new');
  };

  const handleArchiveConversation = () => {
    setSuccessMessage('Conversación archivada exitosamente');
    setTimeout(() => setSuccessMessage(''), 3000);
  };

  const handleResolveConversation = () => {
    setSuccessMessage('Conversación marcada como resuelta');
    setTimeout(() => setSuccessMessage(''), 3000);
  };

  const handleReplyToMessage = (messageId: string) => {
    const reply = prompt('Escribe tu respuesta:');
    if (reply && reply.trim()) {
      setSuccessMessage(`Respuesta enviada al mensaje ${messageId}`);
      setTimeout(() => setSuccessMessage(''), 3000);
    }
  };

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

    const loadMessagesData = async () => {
      try {
        // Mock conversations data
        const mockConversations: Conversation[] = [
          {
            id: '1',
            clientId: 'c1',
            clientName: 'María González',
            clientPhone: '+56912345678',
            clientEmail: 'maria@example.com',
            propertyTitle: 'Apartamento Centro',
            lastMessage: '¿Cuándo puede venir a revisar el sistema eléctrico?',
            lastMessageTime: new Date(Date.now() - 1000 * 60 * 30).toISOString(), // 30 minutes ago
            unreadCount: 2,
            status: 'active',
            priority: 'high',
          },
          {
            id: '2',
            clientId: 'c2',
            clientName: 'Carlos Rodríguez',
            clientPhone: '+56987654321',
            clientEmail: 'carlos@example.com',
            propertyTitle: 'Casa Los Dominicos',
            lastMessage: 'La reparación de la fuga está completada',
            lastMessageTime: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), // 2 hours ago
            unreadCount: 0,
            status: 'active',
            priority: 'medium',
          },
          {
            id: '3',
            clientId: 'c3',
            clientName: 'Ana López',
            clientPhone: '+56955556666',
            clientEmail: 'ana@example.com',
            propertyTitle: 'Oficina Las Condes',
            lastMessage: 'Sistema de climatización instalado exitosamente',
            lastMessageTime: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), // 1 day ago
            unreadCount: 1,
            status: 'resolved',
            priority: 'low',
          },
          {
            id: '4',
            clientId: 'system',
            clientName: 'Sistema Rent360',
            clientPhone: '',
            clientEmail: 'system@rent360.cl',
            propertyTitle: 'Notificación del Sistema',
            lastMessage: 'Nuevo trabajo asignado: Inspección anual',
            lastMessageTime: new Date(Date.now() - 1000 * 60 * 60 * 6).toISOString(), // 6 hours ago
            unreadCount: 1,
            status: 'active',
            priority: 'urgent',
          },
        ];

        // Mock messages for the first conversation
        const mockMessages: Message[] = [
          {
            id: 'm1',
            senderId: 'c1',
            senderName: 'María González',
            senderType: 'client',
            subject: 'Consulta sobre mantenimiento',
            content:
              'Hola, necesito que alguien revise el sistema eléctrico de mi apartamento. Hay un enchufe que no funciona.',
            timestamp: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
            read: true,
            priority: 'medium',
            relatedPropertyId: 'p1',
            relatedPropertyTitle: 'Apartamento Centro',
            type: 'inquiry',
          },
          {
            id: 'm2',
            senderId: 'runner',
            senderName: 'Juan Pérez (Corredor)',
            senderType: 'client', // This would be the runner responding
            subject: 'Re: Consulta sobre mantenimiento',
            content: 'Hola María, puedo ir mañana a las 10:00 AM. ¿Le parece bien?',
            timestamp: new Date(Date.now() - 1000 * 60 * 35).toISOString(),
            read: true,
            priority: 'medium',
            relatedPropertyId: 'p1',
            relatedPropertyTitle: 'Apartamento Centro',
            type: 'confirmation',
          },
          {
            id: 'm3',
            senderId: 'c1',
            senderName: 'María González',
            senderType: 'client',
            subject: 'Re: Consulta sobre mantenimiento',
            content: 'Perfecto, lo espero mañana. Gracias.',
            timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
            read: false,
            priority: 'medium',
            relatedPropertyId: 'p1',
            relatedPropertyTitle: 'Apartamento Centro',
            type: 'confirmation',
          },
        ];

        setConversations(mockConversations);
        setMessages(mockMessages);

        // Calculate stats
        const messageStats: MessageStats = {
          totalMessages:
            mockConversations.reduce((sum, conv) => sum + conv.unreadCount, 0) +
            mockMessages.length,
          unreadMessages: mockConversations.reduce((sum, conv) => sum + conv.unreadCount, 0),
          activeConversations: mockConversations.filter(c => c.status === 'active').length,
          urgentMessages: mockConversations.filter(c => c.priority === 'urgent').length,
        };

        setStats(messageStats);
        setLoading(false);
      } catch (error) {
        logger.error('Error loading messages data:', {
          error: error instanceof Error ? error.message : String(error),
        });
        setLoading(false);
      }
    };

    loadUserData();
    loadMessagesData();
  }, []);

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation) {
      return;
    }

    const message: Message = {
      id: Date.now().toString(),
      senderId: user?.id || 'runner',
      senderName: user?.name || 'Corredor',
      senderType: 'client', // Runner responding
      subject: 'Respuesta',
      content: newMessage,
      timestamp: new Date().toISOString(),
      read: true,
      priority: 'medium',
      type: 'update',
    };

    setMessages(prev => [...prev, message]);
    setNewMessage('');

    // Update conversation's last message
    setConversations(prev =>
      prev.map(conv =>
        conv.id === selectedConversation
          ? {
              ...conv,
              lastMessage: newMessage,
              lastMessageTime: new Date().toISOString(),
              unreadCount: 0,
            }
          : conv
      )
    );

    setSuccessMessage('Mensaje enviado exitosamente');
    setTimeout(() => setSuccessMessage(''), 3000);
  };

  const handleConversationSelect = (conversationId: string) => {
    setSelectedConversation(conversationId);
    // Mark messages as read
    setConversations(prev =>
      prev.map(conv => (conv.id === conversationId ? { ...conv, unreadCount: 0 } : conv))
    );
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return <Badge className="bg-red-100 text-red-800">Urgente</Badge>;
      case 'high':
        return <Badge className="bg-orange-100 text-orange-800">Alta</Badge>;
      case 'medium':
        return <Badge className="bg-yellow-100 text-yellow-800">Media</Badge>;
      case 'low':
        return <Badge className="bg-green-100 text-green-800">Baja</Badge>;
      default:
        return <Badge>Normal</Badge>;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) {
      return `Hace ${diffMins} minutos`;
    }
    if (diffHours < 24) {
      return `Hace ${diffHours} horas`;
    }
    if (diffDays < 7) {
      return `Hace ${diffDays} días`;
    }

    return date.toLocaleDateString('es-CL');
  };

  const getSelectedConversation = () => {
    return conversations.find(conv => conv.id === selectedConversation);
  };

  const getConversationMessages = () => {
    return messages.filter(msg => {
      const conv = getSelectedConversation();
      return conv && (msg.senderId === conv.clientId || msg.senderId === user?.id);
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando mensajes y comunicaciones...</p>
        </div>
      </div>
    );
  }

  return (
    <UnifiedDashboardLayout
      title="Mensajes"
      subtitle="Gestión de mensajes y comunicaciones con clientes"
    >
      <div className="container mx-auto px-4 py-6">
        {/* Success Message */}
        {successMessage && (
          <Card className="mb-6 border-green-200 bg-green-50">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <span className="text-green-800">{successMessage}</span>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Header with actions */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-6 gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Mensajes</h1>
            <p className="text-gray-600">Gestiona tus conversaciones con clientes y el equipo</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleNewMessage}>
              <Plus className="w-4 h-4 mr-2" />
              Nuevo Mensaje
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Mensajes</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.totalMessages}</p>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <MessageSquare className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Mensajes No Leídos</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.unreadMessages}</p>
                </div>
                <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                  <AlertCircle className="w-6 h-6 text-orange-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Conversaciones Activas</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.activeConversations}</p>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <CheckCircle className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Mensajes Urgentes</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.urgentMessages}</p>
                </div>
                <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                  <AlertCircle className="w-6 h-6 text-red-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Area */}
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Conversation List */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="w-5 h-5" />
                  Conversaciones
                </CardTitle>
                <CardDescription>Lista de todas tus conversaciones</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex gap-2 mb-4">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input placeholder="Buscar conversación..." className="pl-10" />
                  </div>
                </div>

                <div className="space-y-3">
                  {conversations.length === 0 ? (
                    <p className="text-center text-gray-500">No hay conversaciones.</p>
                  ) : (
                    conversations.map(conv => (
                      <div
                        key={conv.id}
                        className={`p-3 rounded-lg cursor-pointer transition-colors ${
                          selectedConversation === conv.id
                            ? 'bg-blue-50 border border-blue-200'
                            : 'hover:bg-gray-50'
                        }`}
                        onClick={() => handleConversationSelect(conv.id)}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <h4 className="font-medium text-gray-900">{conv.clientName}</h4>
                          {conv.unreadCount > 0 && (
                            <Badge className="bg-blue-500 text-white">{conv.unreadCount}</Badge>
                          )}
                        </div>
                        <p className="text-sm text-gray-600 line-clamp-1">{conv.lastMessage}</p>
                        <div className="flex items-center justify-between text-xs text-gray-500 mt-1">
                          <span>{formatDate(conv.lastMessageTime)}</span>
                          {getPriorityBadge(conv.priority)}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Message Detail / Reply */}
          <div className="lg:col-span-2">
            {selectedConversation ? (
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <User className="w-5 h-5" />
                      {getSelectedConversation()?.clientName}
                    </CardTitle>
                    <CardDescription className="flex items-center gap-2 mt-1">
                      <Mail className="w-4 h-4" />
                      {getSelectedConversation()?.clientEmail}
                      <Phone className="w-4 h-4 ml-4" />
                      {getSelectedConversation()?.clientPhone}
                    </CardDescription>
                    <p className="text-sm text-gray-600 mt-1">
                      Propiedad: {getSelectedConversation()?.propertyTitle}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    {getSelectedConversation()?.status === 'active' && (
                      <>
                        <Button variant="outline" size="sm" onClick={handleArchiveConversation}>
                          Archivar
                        </Button>
                        <Button variant="default" size="sm" onClick={handleResolveConversation}>
                          <CheckCircle className="w-4 h-4 mr-2" />
                          Resolver
                        </Button>
                      </>
                    )}
                    {getSelectedConversation()?.status === 'archived' && (
                      <Badge variant="secondary">Archivada</Badge>
                    )}
                    {getSelectedConversation()?.status === 'resolved' && (
                      <Badge className="bg-green-100 text-green-800">Resuelta</Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="max-h-96 overflow-y-auto p-4 border rounded-lg bg-gray-50">
                    {getConversationMessages().map(msg => (
                      <div
                        key={msg.id}
                        className={`flex items-start gap-3 mb-4 ${
                          msg.senderId === user?.id ? 'justify-end' : ''
                        }`}
                      >
                        {msg.senderId !== user?.id && (
                          <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center text-sm font-medium">
                            {msg.senderName.charAt(0)}
                          </div>
                        )}
                        <div
                          className={`p-3 rounded-lg max-w-[70%] ${
                            msg.senderId === user?.id
                              ? 'bg-blue-600 text-white'
                              : 'bg-white border text-gray-800'
                          }`}
                        >
                          <p className="font-medium text-sm mb-1">
                            {msg.senderId === user?.id ? 'Tú' : msg.senderName}
                          </p>
                          <p className="text-sm">{msg.content}</p>
                          <p
                            className={`text-xs mt-1 ${
                              msg.senderId === user?.id ? 'text-blue-200' : 'text-gray-500'
                            }`}
                          >
                            {formatDate(msg.timestamp)}
                          </p>
                        </div>
                        {msg.senderId === user?.id && (
                          <div className="w-8 h-8 bg-blue-200 rounded-full flex items-center justify-center text-sm font-medium">
                            {user?.name?.charAt(0) || 'R'}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>

                  <div className="flex items-center gap-2">
                    <Textarea
                      placeholder="Escribe tu respuesta..."
                      value={newMessage}
                      onChange={e => setNewMessage(e.target.value)}
                      rows={3}
                      className="flex-1"
                    />
                    <Button onClick={handleSendMessage}>
                      <Send className="w-4 h-4 mr-2" />
                      Enviar
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="pt-8 pb-8 text-center">
                  <MessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    Selecciona una conversación
                  </h3>
                  <p className="text-gray-600">
                    Elige una conversación de la lista para ver los mensajes y responder.
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </UnifiedDashboardLayout>
  );
}

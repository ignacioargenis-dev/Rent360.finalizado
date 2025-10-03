'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { QuickActionButton } from '@/components/dashboard/QuickActionButton';
import { Badge } from '@/components/ui/badge';
import {
  MessageCircle,
  Send,
  Search,
  Plus,
  User as UserIcon,
  Clock,
  CheckCircle,
  AlertCircle,
  Paperclip,
  MoreHorizontal,
  Star,
  Phone,
  Mail,
  Building,
  Info,
} from 'lucide-react';
import { User } from '@/types';
import DashboardLayout from '@/components/layout/DashboardLayout';
import DashboardHeader from '@/components/dashboard/DashboardHeader';
import { useUserState } from '@/hooks/useUserState';

interface Message {
  id: string;
  subject: string;
  content: string;
  senderId: string;
  senderName: string;
  senderRole: string;
  receiverId: string;
  receiverName: string;
  propertyTitle?: string;
  status: 'read' | 'unread' | 'replied' | 'archived';
  priority: 'low' | 'medium' | 'high';
  createdAt: string;
  readAt?: string;
  attachments?: string[];
}

interface Conversation {
  id: string;
  participant: {
    id: string;
    name: string;
    role: string;
    avatar?: string;
  };
  property?: {
    id: string;
    title: string;
  };
  lastMessage: {
    content: string;
    timestamp: string;
    isOwn: boolean;
  };
  unreadCount: number;
  status: 'active' | 'archived';
}

export default function TenantMessagesPage() {
  const router = useRouter();
  const { user, loading: userLoading } = useUserState();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState<string>('all');

  useEffect(() => {
    // Mock data for demo
    setTimeout(() => {
      setConversations([
        {
          id: '1',
          participant: {
            id: '2',
            name: 'María González',
            role: 'owner',
          },
          property: {
            id: '1',
            title: 'Departamento Las Condes',
          },
          lastMessage: {
            content: 'Hola, ¿cómo está todo con el departamento? ¿Necesitas algo?',
            timestamp: '2024-03-15 14:30',
            isOwn: false,
          },
          unreadCount: 1,
          status: 'active',
        },
        {
          id: '2',
          participant: {
            id: '3',
            name: 'Carlos Ramírez',
            role: 'broker',
          },
          lastMessage: {
            content: 'Gracias por tu interés en la propiedad. Te enviaré más información.',
            timestamp: '2024-03-14 16:45',
            isOwn: false,
          },
          unreadCount: 0,
          status: 'active',
        },
        {
          id: '3',
          participant: {
            id: '4',
            name: 'Soporte Rent360',
            role: 'support',
          },
          lastMessage: {
            content:
              'Tu problema de pago ha sido resuelto. ¿Hay algo más en lo que podamos ayudarte?',
            timestamp: '2024-03-13 10:20',
            isOwn: false,
          },
          unreadCount: 0,
          status: 'active',
        },
      ]);

      setMessages([
        {
          id: '1',
          subject: 'Consulta sobre departamento',
          content: 'Hola, ¿cómo está todo con el departamento? ¿Necesitas algo?',
          senderId: '2',
          senderName: 'María González',
          senderRole: 'owner',
          receiverId: '1',
          receiverName: user?.name || '',
          propertyTitle: 'Departamento Las Condes',
          status: 'unread',
          priority: 'medium',
          createdAt: '2024-03-15 14:30',
        },
        {
          id: '2',
          subject: 'Información de propiedad',
          content: 'Gracias por tu interés en la propiedad. Te enviaré más información.',
          senderId: '3',
          senderName: 'Carlos Ramírez',
          senderRole: 'broker',
          receiverId: '1',
          receiverName: user?.name || '',
          status: 'read',
          priority: 'low',
          createdAt: '2024-03-14 16:45',
        },
        {
          id: '3',
          subject: 'Problema de pago resuelto',
          content:
            'Tu problema de pago ha sido resuelto. ¿Hay algo más en lo que podamos ayudarte?',
          senderId: '4',
          senderName: 'Soporte Rent360',
          senderRole: 'support',
          receiverId: '1',
          receiverName: user?.name || '',
          status: 'read',
          priority: 'high',
          createdAt: '2024-03-13 10:20',
        },
      ]);

      setLoading(false);
    }, 1000);
  }, [user?.name]);

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('es-CL', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatRelativeTime = (dateString: string) => {
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

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'unread':
        return <Badge className="bg-blue-100 text-blue-800">No leído</Badge>;
      case 'read':
        return <Badge className="bg-gray-100 text-gray-800">Leído</Badge>;
      case 'replied':
        return <Badge className="bg-green-100 text-green-800">Respondido</Badge>;
      case 'archived':
        return <Badge className="bg-yellow-100 text-yellow-800">Archivado</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'high':
        return <Badge className="bg-red-100 text-red-800">Alta</Badge>;
      case 'medium':
        return <Badge className="bg-yellow-100 text-yellow-800">Media</Badge>;
      case 'low':
        return <Badge className="bg-green-100 text-green-800">Baja</Badge>;
      default:
        return <Badge>{priority}</Badge>;
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'owner':
        return <Building className="w-4 h-4" />;
      case 'broker':
        return <UserIcon className="w-4 h-4" />;
      case 'support':
        return <MessageCircle className="w-4 h-4" />;
      default:
        return <UserIcon className="w-4 h-4" />;
    }
  };

  const getRoleDisplayName = (role: string) => {
    switch (role) {
      case 'owner':
        return 'Propietario';
      case 'broker':
        return 'Corredor';
      case 'support':
        return 'Soporte';
      case 'tenant':
        return 'Inquilino';
      default:
        return role;
    }
  };

  const filteredConversations = conversations.filter(conv => {
    const matchesSearch =
      conv.participant.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      conv.property?.title.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter =
      filter === 'all' ||
      (filter === 'unread' && conv.unreadCount > 0) ||
      (filter === 'archived' && conv.status === 'archived');
    return matchesSearch && matchesFilter;
  });

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

  return (
    <DashboardLayout>
      <DashboardHeader
        user={user}
        title="Mensajes"
        subtitle="Comunícate con propietarios y corredores"
      />

      <div className="container mx-auto px-4 py-6">
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Mensajes</p>
                  <p className="text-2xl font-bold text-gray-900">{messages.length}</p>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <MessageCircle className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">No Leídos</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {messages.filter(m => m.status === 'unread').length}
                  </p>
                </div>
                <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                  <AlertCircle className="w-6 h-6 text-red-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Conversaciones</p>
                  <p className="text-2xl font-bold text-gray-900">{conversations.length}</p>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <UserIcon className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Respuestas Rápidas</p>
                  <p className="text-2xl font-bold text-gray-900">5</p>
                </div>
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                  <Send className="w-6 h-6 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Conversations List */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle>Conversaciones</CardTitle>
                  <Button size="sm">
                    <Plus className="w-4 h-4 mr-2" />
                    Nuevo
                  </Button>
                </div>
                <CardDescription>Tus conversaciones recientes</CardDescription>
              </CardHeader>
              <CardContent>
                {/* Search and Filter */}
                <div className="space-y-3 mb-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input
                      type="text"
                      placeholder="Buscar conversaciones..."
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                      value={searchTerm}
                      onChange={e => setSearchTerm(e.target.value)}
                    />
                  </div>
                  <select
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                    value={filter}
                    onChange={e => setFilter(e.target.value)}
                  >
                    <option value="all">Todas las conversaciones</option>
                    <option value="unread">No leídas</option>
                    <option value="archived">Archivadas</option>
                  </select>
                </div>

                {/* Conversations List */}
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {filteredConversations.map(conversation => (
                    <div
                      key={conversation.id}
                      className={`p-3 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors ${
                        selectedConversation === conversation.id ? 'border-blue-500 bg-blue-50' : ''
                      }`}
                      onClick={() => setSelectedConversation(conversation.id)}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                            {getRoleIcon(conversation.participant.role)}
                          </div>
                          <div>
                            <h4 className="font-medium text-sm">{conversation.participant.name}</h4>
                            <p className="text-xs text-gray-600">
                              {getRoleDisplayName(conversation.participant.role)}
                            </p>
                          </div>
                        </div>
                        {conversation.unreadCount > 0 && (
                          <Badge className="bg-red-100 text-red-800 text-xs">
                            {conversation.unreadCount}
                          </Badge>
                        )}
                      </div>

                      {conversation.property && (
                        <p className="text-xs text-gray-600 mb-2 flex items-center gap-1">
                          <Building className="w-3 h-3" />
                          {conversation.property.title}
                        </p>
                      )}

                      <p className="text-sm text-gray-700 truncate mb-1">
                        {conversation.lastMessage.content}
                      </p>
                      <p className="text-xs text-gray-500">
                        {formatRelativeTime(conversation.lastMessage.timestamp)}
                      </p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Messages Area */}
          <div className="lg:col-span-2">
            <Card className="h-full">
              <CardHeader>
                {selectedConversation ? (
                  <>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                          <UserIcon className="w-5 h-5" />
                        </div>
                        <div>
                          <CardTitle className="text-lg">
                            {
                              conversations.find(c => c.id === selectedConversation)?.participant
                                .name
                            }
                          </CardTitle>
                          <CardDescription>
                            {getRoleDisplayName(
                              conversations.find(c => c.id === selectedConversation)?.participant
                                .role || ''
                            )}
                          </CardDescription>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline">
                          <Phone className="w-4 h-4 mr-2" />
                          Llamar
                        </Button>
                        <Button size="sm" variant="outline">
                          <Mail className="w-4 h-4 mr-2" />
                          Email
                        </Button>
                        <Button size="sm" variant="outline">
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    <CardTitle>Selecciona una conversación</CardTitle>
                    <CardDescription>Elige una conversación para ver los mensajes</CardDescription>
                  </>
                )}
              </CardHeader>
              <CardContent>
                {selectedConversation ? (
                  <div className="space-y-4">
                    {/* Messages */}
                    <div className="space-y-3 max-h-96 overflow-y-auto mb-4">
                      {messages
                        .filter(m => {
                          const conv = conversations.find(c => c.id === selectedConversation);
                          return (
                            conv &&
                            (m.senderName === conv.participant.name ||
                              m.receiverName === conv.participant.name)
                          );
                        })
                        .map(message => (
                          <div
                            key={message.id}
                            className={`flex ${message.senderName === user?.name ? 'justify-end' : 'justify-start'}`}
                          >
                            <div
                              className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                                message.senderName === user?.name
                                  ? 'bg-blue-600 text-white'
                                  : 'bg-gray-100 text-gray-900'
                              }`}
                            >
                              <p className="text-sm mb-1">{message.content}</p>
                              <div className="flex items-center justify-between gap-2">
                                <p className="text-xs opacity-70">
                                  {formatDateTime(message.createdAt)}
                                </p>
                                {message.senderName === user?.name && (
                                  <CheckCircle className="w-3 h-3 opacity-70" />
                                )}
                              </div>
                              {message.attachments && message.attachments.length > 0 && (
                                <div className="mt-2">
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    className="p-0 h-auto text-xs opacity-70 hover:opacity-100"
                                  >
                                    <Paperclip className="w-3 h-3 mr-1" />
                                    {message.attachments.length} archivo(s)
                                  </Button>
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                    </div>

                    {/* Message Input */}
                    <div className="border-t pt-4">
                      <div className="flex gap-2">
                        <input
                          type="text"
                          placeholder="Escribe un mensaje..."
                          className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                        <Button>
                          <Send className="w-4 h-4 mr-2" />
                          Enviar
                        </Button>
                      </div>
                      <div className="flex gap-2 mt-2">
                        <Button size="sm" variant="outline">
                          <Paperclip className="w-4 h-4 mr-2" />
                          Adjuntar
                        </Button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <MessageCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      No hay conversación seleccionada
                    </h3>
                    <p className="text-gray-600 mb-4">
                      Selecciona una conversación de la lista para empezar a chatear
                    </p>
                    <Button>
                      <Plus className="w-4 h-4 mr-2" />
                      Nueva Conversación
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

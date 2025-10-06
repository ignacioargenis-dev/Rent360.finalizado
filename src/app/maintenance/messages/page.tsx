'use client';

import React, { useState, useEffect } from 'react';
import { logger } from '@/lib/logger';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  MessageCircle,
  Send,
  User,
  Phone,
  Mail,
  Clock,
  Search,
  Filter,
  AlertCircle,
  CheckCircle,
  RefreshCw,
  MapPin,
  Wrench,
} from 'lucide-react';
import UnifiedDashboardLayout from '@/components/layout/UnifiedDashboardLayout';

interface Message {
  id: string;
  senderName: string;
  senderType: 'owner' | 'tenant';
  propertyAddress: string;
  subject: string;
  content: string;
  timestamp: string;
  read: boolean;
  priority: 'low' | 'medium' | 'high';
  jobId?: string;
  jobTitle?: string;
}

interface Conversation {
  id: string;
  participantName: string;
  participantType: 'owner' | 'tenant';
  propertyAddress: string;
  lastMessage: string;
  lastMessageTime: string;
  unreadCount: number;
  status: 'active' | 'archived' | 'resolved';
  messages: Message[];
}

export default function MaintenanceMessagesPage() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [filteredConversations, setFilteredConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    loadConversations();
  }, []);

  useEffect(() => {
    filterConversations();
  }, [conversations, searchTerm, statusFilter]);

  const loadConversations = async () => {
    try {
      setLoading(true);
      setError(null);

      // Mock data for demonstration
      const mockConversations: Conversation[] = [
        {
          id: '1',
          participantName: 'María González',
          participantType: 'owner',
          propertyAddress: 'Av. Las Condes 1234, Depto 5B',
          lastMessage: '¿Cuándo estará listo el trabajo de plomería?',
          lastMessageTime: '2024-01-15T10:30:00',
          unreadCount: 2,
          status: 'active',
          messages: [
            {
              id: '1',
              senderName: 'María González',
              senderType: 'owner',
              propertyAddress: 'Av. Las Condes 1234, Depto 5B',
              subject: 'Estado del trabajo de plomería',
              content:
                'Hola, quería saber cómo va el trabajo de reparación de la cañería en el baño principal.',
              timestamp: '2024-01-15T09:00:00',
              read: true,
              priority: 'medium',
              jobId: 'JOB001',
              jobTitle: 'Reparación de cañería',
            },
            {
              id: '2',
              senderName: 'Técnico Mantenimiento',
              senderType: 'tenant', // En este caso somos el técnico
              propertyAddress: 'Av. Las Condes 1234, Depto 5B',
              subject: 'Re: Estado del trabajo de plomería',
              content:
                'Buenos días María. El trabajo está avanzando bien, esperamos terminarlo mañana por la tarde.',
              timestamp: '2024-01-15T09:30:00',
              read: true,
              priority: 'medium',
            },
            {
              id: '3',
              senderName: 'María González',
              senderType: 'owner',
              propertyAddress: 'Av. Las Condes 1234, Depto 5B',
              subject: 'Re: Estado del trabajo de plomería',
              content: '¿Cuándo estará listo el trabajo de plomería?',
              timestamp: '2024-01-15T10:30:00',
              read: false,
              priority: 'medium',
            },
          ],
        },
        {
          id: '2',
          participantName: 'Carlos Rodríguez',
          participantType: 'owner',
          propertyAddress: 'Providencia 567, Oficina 301',
          lastMessage: 'Necesito que revisen el aire acondicionado urgentemente',
          lastMessageTime: '2024-01-14T16:45:00',
          unreadCount: 1,
          status: 'active',
          messages: [
            {
              id: '4',
              senderName: 'Carlos Rodríguez',
              senderType: 'owner',
              propertyAddress: 'Providencia 567, Oficina 301',
              subject: 'Problema con aire acondicionado',
              content:
                'El aire acondicionado de la oficina principal no está funcionando correctamente.',
              timestamp: '2024-01-14T14:00:00',
              read: true,
              priority: 'high',
              jobId: 'JOB002',
              jobTitle: 'Reparación aire acondicionado',
            },
            {
              id: '5',
              senderName: 'Carlos Rodríguez',
              senderType: 'owner',
              propertyAddress: 'Providencia 567, Oficina 301',
              subject: 'Re: Problema con aire acondicionado',
              content:
                'Necesito que revisen el aire acondicionado urgentemente, hace mucho calor en la oficina.',
              timestamp: '2024-01-14T16:45:00',
              read: false,
              priority: 'high',
            },
          ],
        },
        {
          id: '3',
          participantName: 'Ana López',
          participantType: 'owner',
          propertyAddress: 'Ñuñoa 890, Casa Principal',
          lastMessage: 'Gracias por la limpieza, quedó perfecta',
          lastMessageTime: '2024-01-10T11:20:00',
          unreadCount: 0,
          status: 'resolved',
          messages: [
            {
              id: '6',
              senderName: 'Ana López',
              senderType: 'owner',
              propertyAddress: 'Ñuñoa 890, Casa Principal',
              subject: 'Trabajo de limpieza completado',
              content:
                'Gracias por la limpieza, quedó perfecta. Los inquilinos están muy contentos.',
              timestamp: '2024-01-10T11:20:00',
              read: true,
              priority: 'low',
              jobId: 'JOB003',
              jobTitle: 'Limpieza general post-desocupación',
            },
          ],
        },
      ];

      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      setConversations(mockConversations);
    } catch (error) {
      logger.error('Error loading conversations:', {
        error: error instanceof Error ? error.message : String(error),
      });
      setError('Error al cargar las conversaciones');
    } finally {
      setLoading(false);
    }
  };

  const filterConversations = () => {
    let filtered = conversations;

    if (searchTerm) {
      filtered = filtered.filter(
        conv =>
          conv.participantName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          conv.propertyAddress.toLowerCase().includes(searchTerm.toLowerCase()) ||
          conv.lastMessage.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(conv => conv.status === statusFilter);
    }

    setFilteredConversations(filtered);
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation) {
      return;
    }

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));

      const newMsg: Message = {
        id: Date.now().toString(),
        senderName: 'Técnico Mantenimiento',
        senderType: 'tenant', // Somos el técnico
        propertyAddress: selectedConversation.propertyAddress,
        subject: `Re: ${selectedConversation.messages[0]?.subject || 'Consulta'}`,
        content: newMessage,
        timestamp: new Date().toISOString(),
        read: true,
        priority: 'medium',
      };

      // Update conversation
      setConversations(prev =>
        prev.map(conv =>
          conv.id === selectedConversation.id
            ? {
                ...conv,
                lastMessage: newMessage,
                lastMessageTime: new Date().toISOString(),
                messages: [...conv.messages, newMsg],
              }
            : conv
        )
      );

      // Update selected conversation
      setSelectedConversation(prev =>
        prev
          ? {
              ...prev,
              lastMessage: newMessage,
              lastMessageTime: new Date().toISOString(),
              messages: [...prev.messages, newMsg],
            }
          : null
      );

      setNewMessage('');
      setSuccessMessage('Mensaje enviado exitosamente');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      logger.error('Error sending message:', {
        error: error instanceof Error ? error.message : String(error),
      });
      setErrorMessage('Error al enviar el mensaje');
    }
  };

  const markAsRead = (conversationId: string) => {
    setConversations(prev =>
      prev.map(conv =>
        conv.id === conversationId
          ? {
              ...conv,
              unreadCount: 0,
              messages: conv.messages.map(msg => ({ ...msg, read: true })),
            }
          : conv
      )
    );
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      active: { label: 'Activa', color: 'bg-blue-100 text-blue-800' },
      archived: { label: 'Archivada', color: 'bg-gray-100 text-gray-800' },
      resolved: { label: 'Resuelta', color: 'bg-green-100 text-green-800' },
    };
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.active;
    return <Badge className={config.color}>{config.label}</Badge>;
  };

  const getPriorityBadge = (priority: string) => {
    const priorityConfig = {
      low: { label: 'Baja', color: 'bg-gray-100 text-gray-800' },
      medium: { label: 'Media', color: 'bg-blue-100 text-blue-800' },
      high: { label: 'Alta', color: 'bg-orange-100 text-orange-800' },
    };
    const config = priorityConfig[priority as keyof typeof priorityConfig] || priorityConfig.medium;
    return <Badge className={config.color}>{config.label}</Badge>;
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = diffMs / (1000 * 60 * 60);

    if (diffHours < 24) {
      return date.toLocaleTimeString('es-CL', {
        hour: '2-digit',
        minute: '2-digit',
      });
    } else {
      return date.toLocaleDateString('es-CL', {
        day: '2-digit',
        month: '2-digit',
      });
    }
  };

  if (loading) {
    return (
      <UnifiedDashboardLayout title="Mensajes" subtitle="Cargando conversaciones...">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Cargando mensajes...</p>
          </div>
        </div>
      </UnifiedDashboardLayout>
    );
  }

  if (error) {
    return (
      <UnifiedDashboardLayout title="Mensajes" subtitle="Error al cargar la página">
        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Error</h3>
              <p className="text-gray-600 mb-4">{error}</p>
              <Button onClick={loadConversations}>
                <RefreshCw className="w-4 h-4 mr-2" />
                Reintentar
              </Button>
            </div>
          </CardContent>
        </Card>
      </UnifiedDashboardLayout>
    );
  }

  return (
    <UnifiedDashboardLayout title="Mensajes" subtitle="Comunicación con propietarios e inquilinos">
      <div className="space-y-6">
        {/* Success Message */}
        {successMessage && (
          <Card className="border-green-200 bg-green-50">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <span className="text-green-800">{successMessage}</span>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Error Message */}
        {errorMessage && (
          <Card className="border-red-200 bg-red-50">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <AlertCircle className="w-5 h-5 text-red-600" />
                <span className="text-red-800">{errorMessage}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setErrorMessage('')}
                  className="ml-auto text-red-600 hover:text-red-800"
                >
                  ×
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Conversations List */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageCircle className="w-5 h-5" />
                  Conversaciones ({filteredConversations.length})
                </CardTitle>
                <CardDescription>Mensajes con propietarios e inquilinos</CardDescription>
              </CardHeader>
              <CardContent>
                {/* Search and Filters */}
                <div className="space-y-4 mb-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Buscar conversaciones..."
                      value={searchTerm}
                      onChange={e => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>

                {/* Conversations */}
                <ScrollArea className="h-96">
                  <div className="space-y-2">
                    {filteredConversations.map(conversation => (
                      <div
                        key={conversation.id}
                        className={`p-4 rounded-lg border cursor-pointer transition-all hover:shadow-md ${
                          selectedConversation?.id === conversation.id
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                        onClick={() => {
                          setSelectedConversation(conversation);
                          markAsRead(conversation.id);
                        }}
                      >
                        <div className="flex justify-between items-start mb-2">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="font-semibold text-gray-900 truncate">
                                {conversation.participantName}
                              </h3>
                              {conversation.unreadCount > 0 && (
                                <Badge className="bg-red-100 text-red-800 text-xs">
                                  {conversation.unreadCount}
                                </Badge>
                              )}
                            </div>
                            <div className="flex items-center gap-1 text-sm text-gray-600 mb-1">
                              <MapPin className="w-3 h-3" />
                              <span className="truncate">{conversation.propertyAddress}</span>
                            </div>
                          </div>
                          {getStatusBadge(conversation.status)}
                        </div>

                        <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                          {conversation.lastMessage}
                        </p>

                        <div className="flex justify-between items-center text-xs text-gray-500">
                          <span>{formatTime(conversation.lastMessageTime)}</span>
                          {conversation.participantType === 'owner' && (
                            <Badge variant="outline" className="text-xs">
                              Propietario
                            </Badge>
                          )}
                        </div>
                      </div>
                    ))}

                    {filteredConversations.length === 0 && (
                      <div className="text-center py-8">
                        <MessageCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 mb-2">
                          No hay conversaciones
                        </h3>
                        <p className="text-gray-600">
                          {conversations.length === 0
                            ? 'Aún no tienes conversaciones activas.'
                            : 'No se encontraron conversaciones que coincidan con la búsqueda.'}
                        </p>
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>

          {/* Message Thread */}
          <div className="lg:col-span-2">
            {selectedConversation ? (
              <Card className="h-full">
                <CardHeader className="border-b">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <User className="w-5 h-5" />
                        {selectedConversation.participantName}
                        <Badge variant="outline">
                          {selectedConversation.participantType === 'owner'
                            ? 'Propietario'
                            : 'Inquilino'}
                        </Badge>
                      </CardTitle>
                      <CardDescription className="flex items-center gap-1">
                        <MapPin className="w-4 h-4" />
                        {selectedConversation.propertyAddress}
                      </CardDescription>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm">
                        <Phone className="w-4 h-4 mr-1" />
                        Llamar
                      </Button>
                      <Button variant="outline" size="sm">
                        <Mail className="w-4 h-4 mr-1" />
                        Email
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  {/* Messages */}
                  <ScrollArea className="h-80 p-4">
                    <div className="space-y-4">
                      {selectedConversation.messages.map(message => (
                        <div
                          key={message.id}
                          className={`flex ${
                            message.senderType === 'tenant' ? 'justify-end' : 'justify-start'
                          }`}
                        >
                          <div
                            className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                              message.senderType === 'tenant'
                                ? 'bg-blue-600 text-white'
                                : 'bg-gray-100 text-gray-900'
                            }`}
                          >
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-semibold text-sm">{message.senderName}</span>
                              {getPriorityBadge(message.priority)}
                            </div>
                            <p className="text-sm">{message.content}</p>
                            <div className="flex items-center justify-between mt-2 text-xs opacity-70">
                              <span>{formatTime(message.timestamp)}</span>
                              {message.jobId && (
                                <div className="flex items-center gap-1">
                                  <Wrench className="w-3 h-3" />
                                  <span>{message.jobTitle}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>

                  {/* Message Input */}
                  <div className="border-t p-4">
                    <div className="flex gap-2">
                      <Textarea
                        value={newMessage}
                        onChange={e => setNewMessage(e.target.value)}
                        placeholder="Escribe tu mensaje..."
                        className="flex-1 min-h-[80px]"
                        onKeyDown={e => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            handleSendMessage();
                          }
                        }}
                      />
                      <Button
                        onClick={handleSendMessage}
                        disabled={!newMessage.trim()}
                        className="self-end"
                      >
                        <Send className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card className="h-full">
                <CardContent className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <MessageCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      Selecciona una conversación
                    </h3>
                    <p className="text-gray-600">
                      Elige una conversación de la lista para ver los mensajes
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </UnifiedDashboardLayout>
  );
}

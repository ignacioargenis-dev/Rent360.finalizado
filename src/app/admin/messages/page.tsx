'use client';

import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { logger } from '@/lib/logger-minimal';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import UnifiedDashboardLayout from '@/components/layout/UnifiedDashboardLayout';
import {
  MessageSquare,
  Users,
  Building,
  Calendar,
  Clock,
  Eye,
  Send,
  Search,
  Filter,
  Phone,
  Mail,
  AlertCircle,
  CheckCircle,
  User,
} from 'lucide-react';
import { User as UserType } from '@/types';

interface Message {
  id: string;
  senderName: string;
  senderType: 'owner' | 'tenant' | 'prospect' | 'provider' | 'broker' | 'admin';
  recipientName: string;
  recipientType: 'owner' | 'tenant' | 'prospect' | 'provider' | 'broker' | 'admin';
  subject: string;
  content: string;
  propertyTitle?: string;
  propertyAddress?: string;
  type: 'inquiry' | 'update' | 'complaint' | 'payment' | 'maintenance' | 'general' | 'support';
  status: 'unread' | 'read' | 'replied' | 'archived';
  priority: 'low' | 'normal' | 'high' | 'urgent';
  createdAt: string;
  repliedAt?: string;
  hasAttachments: boolean;
}

interface MessageStats {
  totalMessages: number;
  unreadMessages: number;
  todayMessages: number;
  urgentMessages: number;
  responseRate: number;
  averageResponseTime: number;
}

export default function AdminMessagesPage() {
  const searchParams = useSearchParams();
  const [user, setUser] = useState<UserType | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [stats, setStats] = useState<MessageStats>({
    totalMessages: 0,
    unreadMessages: 0,
    todayMessages: 0,
    urgentMessages: 0,
    responseRate: 0,
    averageResponseTime: 0,
  });
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterType, setFilterType] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [newMessageContent, setNewMessageContent] = useState('');
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);

  useEffect(() => {
    loadPageData();
  }, []);

  const loadPageData = async () => {
    try {
      setLoading(true);

      // Load user data
      const userResponse = await fetch('/api/auth/me');
      if (userResponse.ok) {
        const userData = await userResponse.json();
        setUser(userData.user);
      }

      // Load messages data
      const response = await fetch('/api/messages?limit=100', {
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

      // Transform API data to match our interface
      const transformedMessages: Message[] =
        data.messages?.map((message: any) => ({
          id: message.id,
          senderName: message.sender?.name || 'Usuario desconocido',
          senderType: message.sender?.role?.toLowerCase() || 'user',
          recipientName: message.receiver?.name || 'Usuario desconocido',
          recipientType: message.receiver?.role?.toLowerCase() || 'user',
          subject: message.subject || 'Sin asunto',
          content: message.content || 'Sin contenido',
          propertyTitle: message.property?.title || '',
          propertyAddress: message.property?.address || '',
          type: message.type || 'general',
          status: message.isRead ? 'read' : 'unread',
          priority: message.priority || 'normal',
          createdAt: message.createdAt || new Date().toISOString(),
          repliedAt: message.repliedAt,
          hasAttachments: message.hasAttachments || false,
        })) || [];

      setMessages(transformedMessages);

      // Calculate stats
      const totalMessages = transformedMessages.length;
      const unreadMessages = transformedMessages.filter(m => m.status === 'unread').length;
      const todayMessages = transformedMessages.filter(m => {
        const today = new Date().toDateString();
        const messageDate = new Date(m.createdAt).toDateString();
        return today === messageDate;
      }).length;
      const urgentMessages = transformedMessages.filter(m => m.priority === 'urgent').length;

      setStats({
        totalMessages,
        unreadMessages,
        todayMessages,
        urgentMessages,
        responseRate: 95, // TODO: Calculate from real data
        averageResponseTime: 2.5, // TODO: Calculate from real data
      });

      logger.debug('Datos de mensajería de admin cargados', {
        totalMessages,
        unreadMessages,
        todayMessages,
        urgentMessages,
      });
    } catch (error) {
      logger.error('Error loading admin messages data:', {
        error: error instanceof Error ? error.message : String(error),
      });
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsRead = async (messageId: string) => {
    try {
      const response = await fetch(`/api/messages/${messageId}/read`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }

      // Update local state
      setMessages(prev =>
        prev.map(msg => (msg.id === messageId ? { ...msg, status: 'read' } : msg))
      );
      setStats(prev => ({ ...prev, unreadMessages: prev.unreadMessages - 1 }));
    } catch (error) {
      logger.error('Error marking message as read:', { error });
    }
  };

  const handleSendMessage = async () => {
    if (!newMessageContent.trim()) {
      alert('Por favor escribe un mensaje antes de enviar');
      return;
    }

    // Check if we have recipient data from sessionStorage (from contact buttons)
    const recipientData = sessionStorage.getItem('newMessageRecipient');
    let receiverId = 'system_broadcast';
    let recipientName = 'Sistema';
    let recipientType: 'owner' | 'tenant' | 'prospect' | 'provider' | 'broker' | 'admin' = 'admin';

    if (recipientData) {
      try {
        const recipient = JSON.parse(recipientData);
        receiverId = recipient.id;
        recipientName = recipient.name;
        recipientType = recipient.type;
        // Clear the session storage after use
        sessionStorage.removeItem('newMessageRecipient');
      } catch (error) {
        logger.error('Error parsing recipient data:', { error });
      }
    }

    try {
      // Send message via API
      const response = await fetch('/api/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          receiverId: receiverId,
          subject: recipientData ? 'Mensaje del administrador' : 'Mensaje del sistema',
          content: newMessageContent,
          type: 'direct',
        }),
      });

      if (response.ok) {
        const data = await response.json();

        if (data.success) {
          // Add message to list
          const newMessageObj: Message = {
            id: data.data.id,
            senderName: user?.name || 'Administrador',
            senderType: 'admin',
            recipientName: recipientName,
            recipientType: recipientType,
            subject: recipientData ? 'Mensaje del administrador' : 'Mensaje del sistema',
            content: newMessageContent,
            propertyTitle: '',
            propertyAddress: '',
            type: 'general',
            status: 'unread',
            priority: 'normal',
            createdAt: new Date().toISOString(),
            hasAttachments: false,
          };

          setMessages(prev => [newMessageObj, ...prev]);
          setNewMessageContent('');

          // Update stats
          setStats(prev => ({
            ...prev,
            totalMessages: prev.totalMessages + 1,
            todayMessages: prev.todayMessages + 1,
          }));

          alert('Mensaje enviado exitosamente');
        } else {
          throw new Error(data.error || 'Error al enviar mensaje');
        }
      } else {
        const error = await response.json();
        alert(`Error al enviar mensaje: ${error.error || 'Error desconocido'}`);
      }
    } catch (error) {
      logger.error('Error sending message:', { error });
      alert('Error al enviar mensaje. Por favor intenta nuevamente.');
    }
  };

  const filteredMessages = messages.filter(message => {
    const matchesSearch =
      message.senderName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      message.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
      message.content.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = filterStatus === 'all' || message.status === filterStatus;
    const matchesType = filterType === 'all' || message.type === filterType;

    return matchesSearch && matchesStatus && matchesType;
  });

  if (loading) {
    return (
      <UnifiedDashboardLayout
        user={user}
        title="Mensajes"
        subtitle="Gestión de mensajes del sistema"
      >
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Cargando mensajes...</p>
          </div>
        </div>
      </UnifiedDashboardLayout>
    );
  }

  return (
    <UnifiedDashboardLayout user={user} title="Mensajes" subtitle="Gestión de mensajes del sistema">
      <div className="space-y-6">
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Mensajes</CardTitle>
              <MessageSquare className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalMessages}</div>
              <p className="text-xs text-muted-foreground">+{stats.todayMessages} hoy</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Sin Leer</CardTitle>
              <AlertCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.unreadMessages}</div>
              <p className="text-xs text-muted-foreground">Requieren atención</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Urgentes</CardTitle>
              <AlertCircle className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{stats.urgentMessages}</div>
              <p className="text-xs text-muted-foreground">Prioridad alta</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Tasa de Respuesta</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.responseRate}%</div>
              <p className="text-xs text-muted-foreground">
                Tiempo promedio: {stats.averageResponseTime}h
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Filters and Search */}
        <Card>
          <CardHeader>
            <CardTitle>Filtros y Búsqueda</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Buscar mensajes..."
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Estado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="unread">Sin leer</SelectItem>
                  <SelectItem value="read">Leídos</SelectItem>
                  <SelectItem value="replied">Respondidos</SelectItem>
                </SelectContent>
              </Select>
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="inquiry">Consultas</SelectItem>
                  <SelectItem value="complaint">Quejas</SelectItem>
                  <SelectItem value="support">Soporte</SelectItem>
                  <SelectItem value="general">General</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Messages List */}
        <Card>
          <CardHeader>
            <CardTitle>Mensajes ({filteredMessages.length})</CardTitle>
            <CardDescription>Gestiona todos los mensajes del sistema</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {filteredMessages.length === 0 ? (
                <div className="text-center py-12">
                  <MessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No hay mensajes</h3>
                  <p className="text-gray-600">
                    No se encontraron mensajes que coincidan con los filtros seleccionados.
                  </p>
                </div>
              ) : (
                filteredMessages.map(message => (
                  <div
                    key={message.id}
                    className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                      message.status === 'unread'
                        ? 'bg-blue-50 border-blue-200'
                        : 'hover:bg-gray-50'
                    }`}
                    onClick={() => {
                      setSelectedMessage(message);
                      if (message.status === 'unread') {
                        handleMarkAsRead(message.id);
                      }
                    }}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-medium text-gray-900">{message.subject}</h3>
                          {message.status === 'unread' && (
                            <Badge variant="destructive" className="text-xs">
                              Sin leer
                            </Badge>
                          )}
                          {message.priority === 'urgent' && (
                            <Badge variant="destructive" className="text-xs">
                              Urgente
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-gray-600 mb-2">{message.content}</p>
                        <div className="flex items-center gap-4 text-xs text-gray-500">
                          <span className="flex items-center gap-1">
                            <User className="w-3 h-3" />
                            {message.senderName} → {message.recipientName}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {new Date(message.createdAt).toLocaleDateString('es-CL')}
                          </span>
                          {message.propertyTitle && (
                            <span className="flex items-center gap-1">
                              <Building className="w-3 h-3" />
                              {message.propertyTitle}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={e => {
                            e.stopPropagation();
                            if (message.status === 'unread') {
                              handleMarkAsRead(message.id);
                            }
                          }}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* New Message */}
        <Card>
          <CardHeader>
            <CardTitle>Nuevo Mensaje</CardTitle>
            <CardDescription>Envía un mensaje a usuarios del sistema</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Mensaje</label>
                <textarea
                  className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={4}
                  placeholder="Escribe tu mensaje aquí..."
                  value={newMessageContent}
                  onChange={e => setNewMessageContent(e.target.value)}
                />
              </div>
              <div className="flex justify-end">
                <Button onClick={handleSendMessage} disabled={!newMessageContent.trim()}>
                  <Send className="w-4 h-4 mr-2" />
                  Enviar Mensaje
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </UnifiedDashboardLayout>
  );
}

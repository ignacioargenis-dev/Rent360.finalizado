'use client';

import React, { useState, useEffect } from 'react';
import { logger } from '@/lib/logger';
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
} from 'lucide-react';
import Link from 'next/link';
import { User as UserType } from '@/types';

interface Message {
  id: string;
  senderName: string;
  senderType: 'owner' | 'tenant' | 'prospect' | 'provider' | 'broker';
  recipientName: string;
  recipientType: 'owner' | 'tenant' | 'prospect' | 'provider' | 'broker';
  subject: string;
  content: string;
  propertyTitle?: string;
  propertyAddress?: string;
  type: 'inquiry' | 'update' | 'complaint' | 'payment' | 'maintenance' | 'general';
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

export default function BrokerMessagesPage() {
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
        // Mock messages data
        const mockMessages: Message[] = [
          {
            id: '1',
            senderName: 'María González',
            senderType: 'owner',
            recipientName: 'Corredor',
            recipientType: 'broker',
            subject: 'Consulta sobre disponibilidad de departamento',
            content:
              'Hola, me gustaría saber si el departamento de Providencia está disponible para arriendo. ¿Podrías darme más información sobre las condiciones?',
            propertyTitle: 'Departamento Moderno Providencia',
            propertyAddress: 'Av. Providencia 123, Providencia',
            type: 'inquiry',
            status: 'unread',
            priority: 'normal',
            createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
            hasAttachments: false,
          },
          {
            id: '2',
            senderName: 'Carlos Ramírez',
            senderType: 'tenant',
            recipientName: 'Corredor',
            recipientType: 'broker',
            subject: 'Recordatorio de pago mensual',
            content:
              'Te recuerdo que el pago del arriendo vence este viernes. ¿Has recibido el depósito?',
            propertyTitle: 'Casa Familiar Las Condes',
            propertyAddress: 'Calle Las Condes 456, Las Condes',
            type: 'payment',
            status: 'read',
            priority: 'high',
            createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 1).toISOString(),
            repliedAt: new Date(Date.now() - 1000 * 60 * 60 * 20).toISOString(),
            hasAttachments: true,
          },
          {
            id: '3',
            senderName: 'Ana López',
            senderType: 'prospect',
            recipientName: 'Corredor',
            recipientType: 'broker',
            subject: 'Fuga de agua en baño principal',
            content:
              'Hay una fuga importante en el baño principal. Necesito que venga alguien urgentemente.',
            propertyTitle: 'Oficina Corporativa Centro',
            propertyAddress: 'Av. Libertador 789, Santiago Centro',
            type: 'maintenance',
            status: 'unread',
            priority: 'urgent',
            createdAt: new Date(Date.now() - 1000 * 60 * 60 * 1).toISOString(),
            hasAttachments: true,
          },
          {
            id: '4',
            senderName: 'Patricia Soto',
            senderType: 'owner',
            recipientName: 'Corredor',
            recipientType: 'broker',
            subject: 'Actualización mensual de propiedades',
            content:
              'Aquí te envío el resumen mensual de todas mis propiedades. Por favor revisa y confirma recepción.',
            type: 'update',
            status: 'replied',
            priority: 'low',
            createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(),
            repliedAt: new Date(
              Date.now() - 1000 * 60 * 60 * 24 * 2 + 1000 * 60 * 30
            ).toISOString(),
            hasAttachments: true,
          },
        ];

        setMessages(mockMessages);

        // Calculate stats
        const unreadMessages = mockMessages.filter(m => m.status === 'unread').length;
        const todayMessages = mockMessages.filter(m => {
          const today = new Date();
          const messageDate = new Date(m.createdAt);
          return messageDate.toDateString() === today.toDateString();
        }).length;
        const urgentMessages = mockMessages.filter(m => m.priority === 'urgent').length;
        const repliedMessages = mockMessages.filter(m => m.repliedAt).length;
        const responseRate =
          mockMessages.length > 0 ? (repliedMessages / mockMessages.length) * 100 : 0;

        const messageStats: MessageStats = {
          totalMessages: mockMessages.length,
          unreadMessages,
          todayMessages,
          urgentMessages,
          responseRate,
          averageResponseTime: 2.5, // horas promedio
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

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      unread: { label: 'No leído', color: 'bg-blue-100 text-blue-800' },
      read: { label: 'Leído', color: 'bg-gray-100 text-gray-800' },
      replied: { label: 'Respondido', color: 'bg-green-100 text-green-800' },
      archived: { label: 'Archivado', color: 'bg-yellow-100 text-yellow-800' },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.unread;

    return <Badge className={config.color}>{config.label}</Badge>;
  };

  const getPriorityBadge = (priority: string) => {
    const priorityConfig = {
      low: { label: 'Baja', color: 'bg-gray-100 text-gray-800' },
      normal: { label: 'Normal', color: 'bg-blue-100 text-blue-800' },
      high: { label: 'Alta', color: 'bg-orange-100 text-orange-800' },
      urgent: { label: 'Urgente', color: 'bg-red-100 text-red-800' },
    };

    const config = priorityConfig[priority as keyof typeof priorityConfig] || priorityConfig.normal;

    return (
      <Badge variant="outline" className={config.color}>
        {config.label}
      </Badge>
    );
  };

  const getTypeBadge = (type: string) => {
    const typeConfig = {
      inquiry: { label: 'Consulta', color: 'bg-blue-100 text-blue-800' },
      update: { label: 'Actualización', color: 'bg-green-100 text-green-800' },
      complaint: { label: 'Queja', color: 'bg-red-100 text-red-800' },
      payment: { label: 'Pago', color: 'bg-purple-100 text-purple-800' },
      maintenance: { label: 'Mantenimiento', color: 'bg-orange-100 text-orange-800' },
      general: { label: 'General', color: 'bg-gray-100 text-gray-800' },
    };

    const config = typeConfig[type as keyof typeof typeConfig] || typeConfig.general;

    return (
      <Badge variant="outline" className={config.color}>
        {config.label}
      </Badge>
    );
  };

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

  const handleViewMessage = (messageId: string) => {
    console.log('View message:', messageId);
  };

  const handleReplyMessage = (messageId: string) => {
    console.log('Reply to message:', messageId);
  };

  const handleMarkAsRead = (messageId: string) => {
    console.log('Mark as read:', messageId);
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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando mensajes...</p>
        </div>
      </div>
    );
  }

  return (
    <UnifiedDashboardLayout
      title="Mensajes"
      subtitle="Gestiona tu comunicación con clientes y proveedores"
    >
      <div className="container mx-auto px-4 py-6">
        {/* Header with actions */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-6 gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Centro de Mensajes</h1>
            <p className="text-gray-600">
              Mantén la comunicación con propietarios, inquilinos y proveedores
            </p>
          </div>
          <div className="flex gap-2">
            <Button>
              <Send className="w-4 h-4 mr-2" />
              Nuevo Mensaje
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
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
                  <p className="text-sm font-medium text-gray-600">No Leídos</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.unreadMessages}</p>
                </div>
                <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                  <AlertCircle className="w-6 h-6 text-red-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Urgentes</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.urgentMessages}</p>
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
                  <p className="text-sm font-medium text-gray-600">Tasa de Respuesta</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {stats.responseRate.toFixed(1)}%
                  </p>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <CheckCircle className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Buscar mensajes por remitente, asunto o contenido..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="unread">No leídos</SelectItem>
                <SelectItem value="read">Leídos</SelectItem>
                <SelectItem value="replied">Respondidos</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="inquiry">Consultas</SelectItem>
                <SelectItem value="payment">Pagos</SelectItem>
                <SelectItem value="maintenance">Mantenimiento</SelectItem>
                <SelectItem value="update">Actualizaciones</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Messages List */}
        <div className="space-y-4">
          {filteredMessages.map(message => (
            <Card
              key={message.id}
              className={`border-l-4 ${message.status === 'unread' ? 'border-l-blue-500' : message.priority === 'urgent' ? 'border-l-red-500' : 'border-l-gray-400'}`}
            >
              <CardContent className="pt-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4 flex-1">
                    <div
                      className={`p-3 rounded-lg ${message.status === 'unread' ? 'bg-blue-50' : 'bg-gray-50'}`}
                    >
                      <MessageSquare className="w-6 h-6 text-current" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-semibold text-gray-900">{message.subject}</h3>
                        {getStatusBadge(message.status)}
                        {getPriorityBadge(message.priority)}
                        {getTypeBadge(message.type)}
                        {message.hasAttachments && (
                          <Badge variant="outline" className="bg-purple-100 text-purple-800">
                            📎 Adjunto
                          </Badge>
                        )}
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                        <div>
                          <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
                            <Users className="w-4 h-4" />
                            <span>
                              De: {message.senderName} (
                              {message.senderType === 'owner'
                                ? 'Propietario'
                                : message.senderType === 'tenant'
                                  ? 'Inquilino'
                                  : message.senderType === 'prospect'
                                    ? 'Prospecto'
                                    : message.senderType === 'broker'
                                      ? 'Corredor'
                                      : 'Proveedor'}
                              )
                            </span>
                          </div>
                          {message.propertyTitle && (
                            <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
                              <Building className="w-4 h-4" />
                              <span>{message.propertyTitle}</span>
                            </div>
                          )}
                          {message.propertyAddress && (
                            <p className="text-sm text-gray-600 ml-6">{message.propertyAddress}</p>
                          )}
                        </div>

                        <div>
                          <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
                            <Calendar className="w-4 h-4" />
                            <span>Enviado: {formatRelativeTime(message.createdAt)}</span>
                          </div>
                          {message.repliedAt && (
                            <div className="flex items-center gap-2 text-sm text-green-600">
                              <CheckCircle className="w-4 h-4" />
                              <span>Respondido: {formatRelativeTime(message.repliedAt)}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      <p className="text-sm text-gray-600 line-clamp-2">{message.content}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 ml-4">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleViewMessage(message.id)}
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleReplyMessage(message.id)}
                    >
                      <Send className="w-4 h-4" />
                    </Button>
                    {message.status === 'unread' && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleMarkAsRead(message.id)}
                      >
                        <CheckCircle className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredMessages.length === 0 && (
          <div className="text-center py-12">
            <MessageSquare className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No hay mensajes</h3>
            <p className="text-gray-600">
              Los mensajes aparecerán aquí cuando llegue nueva comunicación
            </p>
          </div>
        )}
      </div>
    </UnifiedDashboardLayout>
  );
}

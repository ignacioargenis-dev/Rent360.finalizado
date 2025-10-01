'use client';

import { logger } from '@/lib/logger';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Bell,
  Eye,
  FileText,
  Filter,
  Search,
  Download,
  Upload,
  Plus,
  Edit,
  Trash2,
  Calendar,
  Clock,
  User,
  Settings,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Info,
  Target,
  Building,
  DollarSign,
  Brain,
  TrendingUp,
  Mail,
  Smartphone,
  Globe,
  MessageCircle,
  Slack,
  Users,
  Phone,
  Wifi,
  WifiOff,
  Save,
  RefreshCw } from 'lucide-react';
import Link from 'next/link';
import { User as UserType } from '@/types';
import DashboardLayout from '@/components/layout/DashboardLayout';

interface Notification {
  id: string;
  type: 'system' | 'user' | 'property' | 'payment' | 'contract' | 'security' | 'ai_prediction' | 'market_alert';
  title: string;
  message: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  status: 'unread' | 'read' | 'archived';
  createdAt: string;
  readAt?: string;
  userId?: string;
  propertyId?: string;
  actionUrl?: string;
  channel: 'web' | 'email' | 'sms' | 'push' | 'webhook';
  aiInsight?: string;
  predictedImpact?: 'low' | 'medium' | 'high';
}

interface NotificationRule {
  id: string;
  name: string;
  description: string;
  type: string;
  channel: string[];
  active: boolean;
  conditions: any[];
  actions: any[];
}

interface Integration {
  id: string;
  name: string;
  type: 'slack' | 'discord' | 'teams' | 'webhook' | 'email' | 'sms';
  status: 'connected' | 'disconnected' | 'error';
  lastSync: string;
  webhookUrl?: string;
}

interface NotificationStats {
  total: number;
  unread: number;
  read: number;
  archived: number;
  critical: number;
  high: number;
  medium: number;
  low: number;
  responseTime: number;
  aiPredicted: number;
  channels: {
    web: number;
    email: number;
    sms: number;
    push: number;
    webhook: number;
  };
}

export default function AdminNotificationsEnhanced() {

  const [user, setUser] = useState<UserType | null>(null);

  const [notifications, setNotifications] = useState<Notification[]>([]);

  const [stats, setStats] = useState<NotificationStats>({
    total: 0,
    unread: 0,
    read: 0,
    archived: 0,
    critical: 0,
    high: 0,
    medium: 0,
    low: 0,
    responseTime: 0,
    aiPredicted: 0,
    channels: {
      web: 0,
      email: 0,
      sms: 0,
      push: 0,
      webhook: 0,
    },
  });

  const [rules, setRules] = useState<NotificationRule[]>([]);

  const [integrations, setIntegrations] = useState<Integration[]>([]);

  const [loading, setLoading] = useState(true);

  const [filter, setFilter] = useState('all');

  const [searchTerm, setSearchTerm] = useState('');

  const [realTimeEnabled, setRealTimeEnabled] = useState(true);

  const [aiEnabled, setAiEnabled] = useState(true);

  useEffect(() => {
    const loadUserData = async () => {
      try {
        const response = await fetch('/api/auth/me');
        if (response.ok) {
          const data = await response.json();
          setUser(data.user);
        }
      } catch (error) {
        logger.error('Error loading user data:', { error: error instanceof Error ? error.message : String(error) });
      }
    };

    const loadNotifications = async () => {
      try {
        // Enhanced mock notifications with AI predictions and multi-channel support
        const mockNotifications: Notification[] = [
          {
            id: '1',
            type: 'ai_prediction',
            title: 'Predicción de Abandono de Usuario',
            message: 'El modelo de IA predice que el usuario Juan Pérez tiene 82% de probabilidad de abandonar la plataforma en los próximos 30 días.',
            severity: 'high',
            status: 'unread',
            createdAt: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
            userId: 'user123',
            channel: 'web',
            aiInsight: 'Usuario inactivo por 45 días, sin contratos activos. Recomendación: Enviar oferta de reactivación.',
            predictedImpact: 'high',
          },
          {
            id: '2',
            type: 'market_alert',
            title: 'Oportunidad de Mercado Detectada',
            message: 'Análisis de mercado identifica aumento del 15% en demanda de propiedades en la zona centro. Recomendado ajustar precios.',
            severity: 'medium',
            status: 'unread',
            createdAt: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
            channel: 'web',
            aiInsight: 'Tendencia basada en datos de los últimos 90 días. Oportunidad para 23 propiedades.',
            predictedImpact: 'high',
          },
          {
            id: '3',
            type: 'system',
            title: 'Actualización del Sistema',
            message: 'Se ha completado la actualización a la versión 2.1.0 con nuevas mejoras de seguridad y analíticas predictivas.',
            severity: 'medium',
            status: 'unread',
            createdAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
            channel: 'email',
          },
          {
            id: '4',
            type: 'user',
            title: 'Nuevo Usuario Registrado',
            message: 'María García se ha registrado como Propietario en el sistema.',
            severity: 'low',
            status: 'unread',
            createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
            userId: 'user456',
            channel: 'web',
          },
          {
            id: '5',
            type: 'property',
            title: 'Propiedad Reportada - Riesgo Alto',
            message: 'La propiedad "Departamento Centro" ha sido reportada por contenido inapropiado. Análisis de IA sugiere revisión inmediata.',
            severity: 'critical',
            status: 'unread',
            createdAt: new Date(Date.now() - 1000 * 60 * 60 * 4).toISOString(),
            propertyId: 'prop789',
            channel: 'web',
            aiInsight: 'Análisis de sentimiento detecta 87% de probabilidad de contenido inapropiado.',
            predictedImpact: 'high',
          },
          {
            id: '6',
            type: 'payment',
            title: 'Pago Fallido - Acción Requerida',
            message: 'El pago del contrato #123 ha fallado. Análisis predictivo sugiere alto riesgo de morosidad.',
            severity: 'high',
            status: 'read',
            createdAt: new Date(Date.now() - 1000 * 60 * 60 * 6).toISOString(),
            channel: 'sms',
            aiInsight: 'Historial de pagos muestra patrón de retrasos. Recomendación: Contactar inmediatamente.',
            predictedImpact: 'medium',
          },
        ];

        setNotifications(mockNotifications);

        // Calculate enhanced stats
        const notificationStats = mockNotifications.reduce((acc, notification) => {
          acc.total++;
          acc[notification.status]++;
          acc[notification.severity]++;
          acc.channels[notification.channel]++;
          if (notification.type === 'ai_prediction' || notification.type === 'market_alert') {
            acc.aiPredicted++;
          }
          return acc;
        }, {
          total: 0,
          unread: 0,
          read: 0,
          archived: 0,
          critical: 0,
          high: 0,
          medium: 0,
          low: 0,
          responseTime: 4.2,
          aiPredicted: 0,
          channels: {
            web: 0,
            email: 0,
            sms: 0,
            push: 0,
            webhook: 0,
          },
        } as NotificationStats);

        setStats(notificationStats);

        // Mock notification rules
        const mockRules: NotificationRule[] = [
          {
            id: '1',
            name: 'Alertas de Pago Fallido',
            description: 'Notificar inmediatamente cuando un pago falla',
            type: 'payment',
            channel: ['email', 'sms', 'web'],
            active: true,
            conditions: [{ field: 'status', operator: 'equals', value: 'failed' }],
            actions: [{ type: 'notify', recipients: ['admin', 'owner'] }],
          },
          {
            id: '2',
            name: 'Predicciones de Abandono',
            description: 'Alertas de IA para usuarios en riesgo de abandono',
            type: 'ai_prediction',
            channel: ['web', 'email'],
            active: true,
            conditions: [{ field: 'probability', operator: 'greater_than', value: 70 }],
            actions: [{ type: 'notify', recipients: ['admin'] }],
          },
          {
            id: '3',
            name: 'Oportunidades de Mercado',
            description: 'Notificar sobre tendencias y oportunidades de mercado',
            type: 'market_alert',
            channel: ['web', 'webhook'],
            active: true,
            conditions: [{ field: 'impact', operator: 'equals', value: 'high' }],
            actions: [{ type: 'notify', recipients: ['admin', 'broker'] }],
          },
        ];

        setRules(mockRules);

        // Mock integrations
        const mockIntegrations: Integration[] = [
          {
            id: '1',
            name: 'Slack Workspace',
            type: 'slack',
            status: 'connected',
            lastSync: new Date(Date.now() - 1000 * 60 * 10).toISOString(),
            webhookUrl: 'https://hooks.slack.com/services/...',
          },
          {
            id: '2',
            name: 'Email SMTP',
            type: 'email',
            status: 'connected',
            lastSync: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
          },
          {
            id: '3',
            name: 'SMS Gateway',
            type: 'sms',
            status: 'disconnected',
            lastSync: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
          },
          {
            id: '4',
            name: 'Custom Webhook',
            type: 'webhook',
            status: 'connected',
            lastSync: new Date(Date.now() - 1000 * 60 * 2).toISOString(),
            webhookUrl: 'https://api.example.com/webhooks/notifications',
          },
        ];

        setIntegrations(mockIntegrations);
        setLoading(false);
      } catch (error) {
        logger.error('Error loading notifications:', { error: error instanceof Error ? error.message : String(error) });
        setLoading(false);
      }
    };

    loadUserData();
    loadNotifications();
  }, []);

  const markAsRead = async (notificationId: string) => {
    setNotifications(prev => prev.map(notification => 
      notification.id === notificationId 
        ? { ...notification, status: 'read' as const, readAt: new Date().toISOString() }
        : notification,
    ));
  };

  const markAllAsRead = async () => {
    setNotifications(prev => prev.map(notification => 
      notification.status === 'unread' 
        ? { ...notification, status: 'read' as const, readAt: new Date().toISOString() }
        : notification,
    ));
  };

  const deleteNotification = async (notificationId: string) => {
    setNotifications(prev => prev.filter(notification => notification.id !== notificationId));
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'system':
        return <Settings className="w-5 h-5" />;
      case 'user':
        return <User className="w-5 h-5" />;
      case 'property':
        return <Building className="w-5 h-5" />;
      case 'payment':
        return <DollarSign className="w-5 h-5" />;
      case 'contract':
        return <FileText className="w-5 h-5" />;
      case 'security':
        return <AlertTriangle className="w-5 h-5" />;
      case 'ai_prediction':
        return <Brain className="w-5 h-5" />;
      case 'market_alert':
        return <TrendingUp className="w-5 h-5" />;
      default:
        return <Bell className="w-5 h-5" />;
    }
  };

  const getChannelIcon = (channel: string) => {
    switch (channel) {
      case 'email':
        return <Mail className="w-4 h-4" />;
      case 'sms':
        return <Smartphone className="w-4 h-4" />;
      case 'push':
        return <Smartphone className="w-4 h-4" />;
      case 'webhook':
        return <Globe className="w-4 h-4" />;
      default:
        return <MessageCircle className="w-4 h-4" />;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'text-red-600 bg-red-50 border-red-200';
      case 'high':
        return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'medium':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'low':
        return 'text-green-600 bg-green-50 border-green-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case 'critical':
        return <Badge className="bg-red-100 text-red-800">Crítico</Badge>;
      case 'high':
        return <Badge className="bg-orange-100 text-orange-800">Alto</Badge>;
      case 'medium':
        return <Badge className="bg-yellow-100 text-yellow-800">Medio</Badge>;
      case 'low':
        return <Badge className="bg-green-100 text-green-800">Bajo</Badge>;
      default:
        return <Badge>Desconocido</Badge>;
    }
  };

  const getIntegrationIcon = (type: string) => {
    switch (type) {
      case 'slack':
        return <Slack className="w-5 h-5" />;
      case 'discord':
        return <MessageCircle className="w-5 h-5" />;
      case 'teams':
        return <Users className="w-5 h-5" />;
      case 'email':
        return <Mail className="w-5 h-5" />;
      case 'sms':
        return <Phone className="w-5 h-5" />;
      case 'webhook':
        return <Globe className="w-5 h-5" />;
      default:
        return <Settings className="w-5 h-5" />;
    }
  };

  const getIntegrationStatusBadge = (status: string) => {
    switch (status) {
      case 'connected':
        return <Badge className="bg-green-100 text-green-800">Conectado</Badge>;
      case 'disconnected':
        return <Badge className="bg-red-100 text-red-800">Desconectado</Badge>;
      case 'error':
        return <Badge className="bg-yellow-100 text-yellow-800">Error</Badge>;
      default:
        return <Badge>Desconocido</Badge>;
    }
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

  const filteredNotifications = notifications.filter(notification => {
    const matchesFilter = filter === 'all' || notification.status === filter || notification.severity === filter;
    const matchesSearch = notification.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         notification.message.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando notificaciones avanzadas...</p>
        </div>
      </div>
    );
  }

  return (
    <DashboardLayout
      user={user}
      title="Notificaciones Avanzadas"
      subtitle="Sistema de notificaciones en tiempo real con IA"
      notificationCount={stats.unread}
    >
      <div className="container mx-auto px-4 py-6">
        {/* Header with real-time status */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-6 gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Centro de Notificaciones Avanzado</h1>
            <p className="text-gray-600">Sistema inteligente con análisis predictivo y multi-canal</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              {realTimeEnabled ? (
                <><Wifi className="w-4 h-4 text-green-600" /><span className="text-sm text-green-600">Tiempo Real</span></>
              ) : (
                <><WifiOff className="w-4 h-4 text-red-600" /><span className="text-sm text-red-600">Offline</span></>
              )}
            </div>
            <div className="flex items-center gap-2">
              {aiEnabled ? (
                <><Brain className="w-4 h-4 text-blue-600" /><span className="text-sm text-blue-600">IA Activa</span></>
              ) : (
                <><Brain className="w-4 h-4 text-gray-400" /><span className="text-sm text-gray-400">IA Inactiva</span></>
              )}
            </div>
            <Button variant="outline" size="sm" onClick={markAllAsRead}>
              <CheckCircle className="w-4 h-4 mr-2" />
              Marcar todas como leídas
            </Button>
            <Button size="sm">
              <Plus className="w-4 h-4 mr-2" />
              Crear Notificación
            </Button>
          </div>
        </div>

        {/* Enhanced Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4 mb-6">
          <Card>
            <CardContent className="pt-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
                <p className="text-xs text-gray-600">Total</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-blue-600">{stats.unread}</p>
                <p className="text-xs text-gray-600">No leídas</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-green-600">{stats.read}</p>
                <p className="text-xs text-gray-600">Leídas</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-red-600">{stats.critical}</p>
                <p className="text-xs text-gray-600">Críticas</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-purple-600">{stats.aiPredicted}</p>
                <p className="text-xs text-gray-600">IA</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-orange-600">{stats.channels.email}</p>
                <p className="text-xs text-gray-600">Email</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-cyan-600">{stats.channels.sms}</p>
                <p className="text-xs text-gray-600">SMS</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-indigo-600">{stats.responseTime}s</p>
                <p className="text-xs text-gray-600">Respuesta</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="notifications" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="notifications">Notificaciones</TabsTrigger>
            <TabsTrigger value="rules">Reglas</TabsTrigger>
            <TabsTrigger value="integrations">Integraciones</TabsTrigger>
            <TabsTrigger value="analytics">Analíticas</TabsTrigger>
          </TabsList>

          <TabsContent value="notifications">
            {/* Filters and Search */}
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    placeholder="Buscar notificaciones..."
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <select 
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-md text-sm"
                >
                  <option value="all">Todas</option>
                  <option value="unread">No leídas</option>
                  <option value="read">Leídas</option>
                  <option value="critical">Críticas</option>
                  <option value="high">Altas</option>
                  <option value="medium">Medias</option>
                  <option value="low">Bajas</option>
                </select>
                <Button variant="outline" size="sm">
                  <Filter className="w-4 h-4 mr-2" />
                  Filtros
                </Button>
              </div>
            </div>

            {/* Enhanced Notifications List */}
            <div className="space-y-4">
              {filteredNotifications.length === 0 ? (
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-center py-8">
                      <Bell className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-500">No se encontraron notificaciones</p>
                      <p className="text-sm text-gray-400">Intenta ajustar tus filtros de búsqueda</p>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                filteredNotifications.map((notification) => (
                  <Card 
                    key={notification.id} 
                    className={`border-l-4 ${getSeverityColor(notification.severity)} ${
                      notification.status === 'unread' ? 'shadow-md' : ''
                    }`}
                  >
                    <CardContent className="pt-4">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3 flex-1">
                          <div className={`p-2 rounded-lg ${getSeverityColor(notification.severity)}`}>
                            {getNotificationIcon(notification.type)}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="font-semibold text-gray-900">{notification.title}</h3>
                              {getSeverityBadge(notification.severity)}
                              {notification.status === 'unread' && (
                                <Badge className="bg-blue-100 text-blue-800">Nueva</Badge>
                              )}
                              {(notification.type === 'ai_prediction' || notification.type === 'market_alert') && (
                                <Badge className="bg-purple-100 text-purple-800">IA</Badge>
                              )}
                              <div className="flex items-center gap-1 text-xs text-gray-500">
                                {getChannelIcon(notification.channel)}
                                <span>{notification.channel}</span>
                              </div>
                            </div>
                            <p className="text-gray-600 text-sm mb-2">{notification.message}</p>
                            
                            {/* AI Insights */}
                            {notification.aiInsight && (
                              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-2">
                                <div className="flex items-center gap-2 mb-1">
                                  <Brain className="w-4 h-4 text-blue-600" />
                                  <span className="text-sm font-medium text-blue-800">Insight de IA</span>
                                </div>
                                <p className="text-xs text-blue-700">{notification.aiInsight}</p>
                              </div>
                            )}
                            
                            <div className="flex items-center gap-4 text-xs text-gray-500">
                              <span className="flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {formatRelativeTime(notification.createdAt)}
                              </span>
                              {notification.predictedImpact && (
                                <span className="flex items-center gap-1">
                                  <Target className="w-3 h-3" />
                                  Impacto: {notification.predictedImpact}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {notification.status === 'unread' && (
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => markAsRead(notification.id)}
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                          )}
                          {notification.actionUrl && (
                            <Link href={notification.actionUrl}>
                              <Button size="sm">Ver</Button>
                            </Link>
                          )}
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => deleteNotification(notification.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>

          <TabsContent value="rules">
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">Reglas de Notificación</h3>
                <Button size="sm">
                  <Plus className="w-4 h-4 mr-2" />
                  Nueva Regla
                </Button>
              </div>
              
              {rules.map((rule) => (
                <Card key={rule.id}>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-semibold">{rule.name}</h3>
                          <Badge className={rule.active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
                            {rule.active ? 'Activa' : 'Inactiva'}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-600 mb-2">{rule.description}</p>
                        <div className="flex items-center gap-4 text-xs text-gray-500">
                          <span>Tipo: {rule.type}</span>
                          <span>Canales: {rule.channel.join(', ')}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm">
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button size="sm">
                          <Save className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="integrations">
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">Integraciones Externas</h3>
                <Button size="sm">
                  <Plus className="w-4 h-4 mr-2" />
                  Nueva Integración
                </Button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {integrations.map((integration) => (
                  <Card key={integration.id}>
                    <CardContent className="pt-6">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-gray-100 rounded-lg">
                            {getIntegrationIcon(integration.type)}
                          </div>
                          <div>
                            <h3 className="font-semibold">{integration.name}</h3>
                            <p className="text-sm text-gray-600">{integration.type}</p>
                          </div>
                        </div>
                        {getIntegrationStatusBadge(integration.status)}
                      </div>
                      
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Última sincronización:</span>
                          <span>{formatRelativeTime(integration.lastSync)}</span>
                        </div>
                        {integration.webhookUrl && (
                          <div className="flex justify-between">
                            <span className="text-gray-600">Webhook:</span>
                            <span className="text-xs text-blue-600 truncate">{integration.webhookUrl}</span>
                          </div>
                        )}
                      </div>
                      
                      <div className="flex gap-2 mt-4">
                        <Button variant="outline" size="sm" className="flex-1">
                          <RefreshCw className="w-4 h-4 mr-2" />
                          Probar
                        </Button>
                        <Button variant="outline" size="sm">
                          <Settings className="w-4 h-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="analytics">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Rendimiento del Sistema</CardTitle>
                  <CardDescription>Métricas de notificaciones en tiempo real</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-4 bg-green-50 rounded-lg">
                      <p className="text-2xl font-bold text-green-600">98.5%</p>
                      <p className="text-sm text-green-700">Tasa de Entrega</p>
                    </div>
                    <div className="text-center p-4 bg-blue-50 rounded-lg">
                      <p className="text-2xl font-bold text-blue-600">{stats.responseTime}s</p>
                      <p className="text-sm text-blue-700">Tiempo de Respuesta</p>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <h4 className="font-medium">Distribución por Canal</h4>
                    <div className="space-y-2">
                      {Object.entries(stats.channels).map(([channel, count]) => (
                        <div key={channel} className="flex items-center justify-between">
                          <span className="text-sm capitalize">{channel}</span>
                          <div className="flex items-center gap-2">
                            <div className="w-24 bg-gray-200 rounded-full h-2">
                              <div 
                                className="bg-blue-600 h-2 rounded-full" 
                                style={{ width: `${(count / stats.total) * 100}%` }}
                              ></div>
                            </div>
                            <span className="text-sm text-gray-600">{count}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Impacto de IA</CardTitle>
                  <CardDescription>Efectividad de las predicciones y automatización</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-4 bg-purple-50 rounded-lg">
                      <p className="text-2xl font-bold text-purple-600">{stats.aiPredicted}</p>
                      <p className="text-sm text-purple-700">Alertas de IA</p>
                    </div>
                    <div className="text-center p-4 bg-orange-50 rounded-lg">
                      <p className="text-2xl font-bold text-orange-600">94%</p>
                      <p className="text-sm text-orange-700">Precisión</p>
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Reducción de tiempo de respuesta</span>
                      <span className="text-sm font-medium text-green-600">-67%</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Aumento en eficiencia</span>
                      <span className="text-sm font-medium text-green-600">+45%</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Alertas preventivas generadas</span>
                      <span className="text-sm font-medium text-blue-600">127</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout
  );
}

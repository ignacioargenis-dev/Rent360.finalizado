'use client';

import { logger } from '@/lib/logger';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Bell, 
  Mail, 
  MessageSquare, 
  AlertTriangle, 
  CheckCircle, 
  Info,
  Filter,
  Search,
  Calendar,
  User as UserIcon,
  Building,
  DollarSign,
  Settings,
  Trash2, Eye, Send,
  FileText,
  Clock,
  RefreshCw,
  Download,
  Plus,
  Edit,
  Save,
  Smartphone,
  Zap,
  TrendingUp,
  TrendingDown,
  BarChart3,
  Target,
  Brain,
  Lightbulb,
  ThumbsUp,
  ThumbsDown,
  HelpCircle,
  CalendarDays,
  Timer,
  AlertCircle,
  CheckCircle2,
  Circle,
  XCircle,
  Phone,
  Video,
  Slack,
  Repeat,
  CalendarClock,
  BellRing,
  BellOff,
  Volume2,
  VolumeX,
  UserCheck,
  Users,
  CreditCard,
  Banknote,
  Receipt,
  Calculator,
  Percent,
  Activity,
  ArrowUp,
  ArrowDown,
  Minus,
  ChevronRight,
  ChevronLeft,
  SkipForward,
  SkipBack,
  Play,
  Pause } from 'lucide-react';
import Link from 'next/link';
import { User } from '@/types';
import DashboardLayout from '@/components/layout/DashboardLayout';

interface Reminder {
  id: string;
  type: 'payment_due' | 'payment_overdue' | 'contract_expiring' | 'maintenance_due' | 'custom';
  title: string;
  message: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'pending' | 'sent' | 'delivered' | 'failed' | 'acknowledged';
  scheduledFor: string;
  sentAt?: string;
  deliveredAt?: string;
  acknowledgedAt?: string;
  propertyId?: string;
  contractId?: string;
  tenantId?: string;
  amount?: number;
  channel: 'email' | 'sms' | 'push' | 'whatsapp' | 'all';
  recurrence: 'once' | 'daily' | 'weekly' | 'monthly' | 'yearly';
  aiOptimized: boolean;
  aiInsight?: string;
  predictedResponse?: number;
  actualResponse?: string;
}

interface ReminderTemplate {
  id: string;
  name: string;
  description: string;
  type: string;
  channel: string[];
  timing: string;
  content: {
    subject: string;
    body: string;
    variables: string[];
  };
  active: boolean;
  aiOptimized: boolean;
}

interface ReminderStats {
  totalSent: number;
  delivered: number;
  failed: number;
  acknowledged: number;
  responseRate: number;
  averageResponseTime: number;
  aiOptimizedCount: number;
  channelPerformance: {
    email: { sent: number; delivered: number; responseRate: number };
    sms: { sent: number; delivered: number; responseRate: number };
    push: { sent: number; delivered: number; responseRate: number };
    whatsapp: { sent: number; delivered: number; responseRate: number };
  };
}

interface AutomationRule {
  id: string;
  name: string;
  description: string;
  trigger: string;
  conditions: any[];
  actions: any[];
  active: boolean;
  aiOptimized: boolean;
  performance: {
    triggered: number;
    success: number;
    responseRate: number;
  };
}

export default function OwnerPaymentReminders() {
  const [user, setUser] = useState<User | null>(null);
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [templates, setTemplates] = useState<ReminderTemplate[]>([]);
  const [automationRules, setAutomationRules] = useState<AutomationRule[]>([]);
  const [stats, setStats] = useState<ReminderStats>({
    totalSent: 0,
    delivered: 0,
    failed: 0,
    acknowledged: 0,
    responseRate: 0,
    averageResponseTime: 0,
    aiOptimizedCount: 0,
    channelPerformance: {
      email: { sent: 0, delivered: 0, responseRate: 0 },
      sms: { sent: 0, delivered: 0, responseRate: 0 },
      push: { sent: 0, delivered: 0, responseRate: 0 },
      whatsapp: { sent: 0, delivered: 0, responseRate: 0 },
    },
  });
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [aiEnabled, setAiEnabled] = useState(true);
  const [automationEnabled, setAutomationEnabled] = useState(true);

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

    const loadReminders = async () => {
      try {
        // Mock reminders data
        const mockReminders: Reminder[] = [
          {
            id: '1',
            type: 'payment_due',
            title: 'Recordatorio de Pago - Departamento Las Condes',
            message: 'Estimado Carlos Ramírez, le recordamos que su pago de arriendo de $550.000 vence el 01 de abril.',
            priority: 'high',
            status: 'sent',
            scheduledFor: new Date(Date.now() + 1000 * 60 * 60 * 24 * 3).toISOString(),
            sentAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
            propertyId: '1',
            contractId: '1',
            tenantId: 'tenant1',
            amount: 550000,
            channel: 'email',
            recurrence: 'monthly',
            aiOptimized: true,
            aiInsight: 'Análisis de historial muestra que el cliente responde mejor los martes por la mañana. Horario optimizado.',
            predictedResponse: 85,
            actualResponse: 'delivered',
          },
          {
            id: '2',
            type: 'payment_overdue',
            title: 'Pago Atrasado - Oficina Providencia',
            message: 'Estimada Empresa Soluciones Ltda., su pago de $350.000 está atrasado por 15 días. Por favor regularice su situación.',
            priority: 'urgent',
            status: 'delivered',
            scheduledFor: new Date(Date.now() - 1000 * 60 * 60 * 24 * 10).toISOString(),
            sentAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 10).toISOString(),
            deliveredAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 9).toISOString(),
            propertyId: '2',
            contractId: '2',
            tenantId: 'tenant2',
            amount: 350000,
            channel: 'sms',
            recurrence: 'once',
            aiOptimized: true,
            aiInsight: 'Cliente corporativo con historial de pagos puntuales. Contacto directo recomendado.',
            predictedResponse: 92,
            actualResponse: 'acknowledged',
          },
          {
            id: '3',
            type: 'contract_expiring',
            title: 'Contrato por Expirar - Casa Las Condes',
            message: 'Estimada María García, su contrato de arriendo expira en 30 días. ¿Desea renovar?',
            priority: 'medium',
            status: 'pending',
            scheduledFor: new Date(Date.now() + 1000 * 60 * 60 * 24 * 25).toISOString(),
            propertyId: '3',
            contractId: '3',
            tenantId: 'tenant3',
            channel: 'whatsapp',
            recurrence: 'once',
            aiOptimized: true,
            aiInsight: 'Inquilino con alta probabilidad de renovación (87%). Mensaje personalizado recomendado.',
            predictedResponse: 78,
          },
          {
            id: '4',
            type: 'maintenance_due',
            title: 'Mantenimiento Programado - Departamento Playa',
            message: 'Recordatorio de mantenimiento programado para el departamento en Viña del Mar.',
            priority: 'low',
            status: 'pending',
            scheduledFor: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7).toISOString(),
            propertyId: '4',
            channel: 'email',
            recurrence: 'monthly',
            aiOptimized: false,
            predictedResponse: 65,
          },
          {
            id: '5',
            type: 'custom',
            title: 'Oferta Especial - Casa La Reina',
            message: 'Oferta especial de renovación con descuento del 5% por renovación anticipada.',
            priority: 'medium',
            status: 'acknowledged',
            scheduledFor: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5).toISOString(),
            sentAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5).toISOString(),
            deliveredAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 4).toISOString(),
            acknowledgedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3).toISOString(),
            propertyId: '5',
            tenantId: 'tenant5',
            channel: 'all',
            recurrence: 'once',
            aiOptimized: true,
            aiInsight: 'Oferta generada por IA basada en comportamiento del inquilino y condiciones de mercado.',
            predictedResponse: 82,
            actualResponse: 'accepted',
          },
        ];

        setReminders(mockReminders);

        // Mock templates
        const mockTemplates: ReminderTemplate[] = [
          {
            id: '1',
            name: 'Recordatorio de Pago Estándar',
            description: 'Plantilla para recordatorios de pago regulares',
            type: 'payment_due',
            channel: ['email', 'sms'],
            timing: '3 días antes del vencimiento',
            content: {
              subject: 'Recordatorio de Pago - {property_title}',
              body: 'Estimado {tenant_name}, le recordamos que su pago de arriendo de {amount} vence el {due_date}.',
              variables: ['property_title', 'tenant_name', 'amount', 'due_date'],
            },
            active: true,
            aiOptimized: true,
          },
          {
            id: '2',
            name: 'Notificación de Pago Atrasado',
            description: 'Plantilla para pagos atrasados',
            type: 'payment_overdue',
            channel: ['sms', 'whatsapp'],
            timing: 'Inmediato al detectar atraso',
            content: {
              subject: 'Urgente: Pago Atrasado',
              body: 'Estimado {tenant_name}, su pago de {amount} está atrasado por {days_overdue} días.',
              variables: ['tenant_name', 'amount', 'days_overdue'],
            },
            active: true,
            aiOptimized: true,
          },
        ];

        setTemplates(mockTemplates);

        // Mock automation rules
        const mockAutomationRules: AutomationRule[] = [
          {
            id: '1',
            name: 'Recordatorios Automáticos de Pago',
            description: 'Envía recordatorios 3 días antes del vencimiento',
            trigger: 'payment_due_date',
            conditions: [{ field: 'days_until_due', operator: 'equals', value: 3 }],
            actions: [{ type: 'send_reminder', template: 'payment_due' }],
            active: true,
            aiOptimized: true,
            performance: { triggered: 45, success: 42, responseRate: 93 },
          },
          {
            id: '2',
            name: 'Alertas de Pago Atrasado',
            description: 'Notifica inmediatamente cuando un pago se atrasa',
            trigger: 'payment_overdue',
            conditions: [{ field: 'days_overdue', operator: 'greater_than', value: 0 }],
            actions: [{ type: 'send_alert', template: 'payment_overdue' }],
            active: true,
            aiOptimized: true,
            performance: { triggered: 8, success: 7, responseRate: 87 },
          },
        ];

        setAutomationRules(mockAutomationRules);

        // Calculate stats
        const totalSent = mockReminders.length;
        const delivered = mockReminders.filter(r => r.status === 'delivered' || r.status === 'acknowledged').length;
        const failed = mockReminders.filter(r => r.status === 'failed').length;
        const acknowledged = mockReminders.filter(r => r.status === 'acknowledged').length;
        const responseRate = totalSent > 0 ? (acknowledged / totalSent) * 100 : 0;
        const aiOptimizedCount = mockReminders.filter(r => r.aiOptimized).length;

        const channelPerformance = {
          email: { sent: 2, delivered: 2, responseRate: 85 },
          sms: { sent: 1, delivered: 1, responseRate: 92 },
          push: { sent: 0, delivered: 0, responseRate: 0 },
          whatsapp: { sent: 1, delivered: 1, responseRate: 78 },
        };

        setStats({
          totalSent,
          delivered,
          failed,
          acknowledged,
          responseRate,
          averageResponseTime: 4.2,
          aiOptimizedCount,
          channelPerformance,
        });

        setLoading(false);
      } catch (error) {
        logger.error('Error loading reminders:', { error: error instanceof Error ? error.message : String(error) });
        setLoading(false);
      }
    };

    loadUserData();
    loadReminders();
  }, []);

  const sendReminder = async (reminderId: string) => {
    setReminders(prev => prev.map(reminder => 
      reminder.id === reminderId 
        ? { ...reminder, status: 'sent' as const, sentAt: new Date().toISOString() }
        : reminder,
    ));
  };

  const deleteReminder = async (reminderId: string) => {
    setReminders(prev => prev.filter(reminder => reminder.id !== reminderId));
  };

  const getReminderIcon = (type: string) => {
    switch (type) {
      case 'payment_due':
        return <CreditCard className="w-5 h-5" />;
      case 'payment_overdue':
        return <AlertTriangle className="w-5 h-5" />;
      case 'contract_expiring':
        return <FileText className="w-5 h-5" />;
      case 'maintenance_due':
        return <Settings className="w-5 h-5" />;
      case 'custom':
        return <MessageSquare className="w-5 h-5" />;
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
      case 'whatsapp':
        return <MessageSquare className="w-4 h-4" />;
      case 'all':
        return <Volume2 className="w-4 h-4" />;
      default:
        return <Bell className="w-4 h-4" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
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
        return <Badge>Desconocida</Badge>;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="w-4 h-4 text-yellow-600" />;
      case 'sent':
        return <Send className="w-4 h-4 text-blue-600" />;
      case 'delivered':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'failed':
        return <XCircle className="w-4 h-4 text-red-600" />;
      case 'acknowledged':
        return <CheckCircle2 className="w-4 h-4 text-purple-600" />;
      default:
        return <Circle className="w-4 h-4 text-gray-400" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800">Pendiente</Badge>;
      case 'sent':
        return <Badge className="bg-blue-100 text-blue-800">Enviado</Badge>;
      case 'delivered':
        return <Badge className="bg-green-100 text-green-800">Entregado</Badge>;
      case 'failed':
        return <Badge className="bg-red-100 text-red-800">Fallido</Badge>;
      case 'acknowledged':
        return <Badge className="bg-purple-100 text-purple-800">Reconocido</Badge>;
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

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
  };

  const filteredReminders = reminders.filter(reminder => {
    const matchesFilter = filter === 'all' || reminder.status === filter || reminder.priority === filter;
    const matchesSearch = reminder.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         reminder.message.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando recordatorios de pago...</p>
        </div>
      </div>
    );
  }

  return (
    <DashboardLayout
      user={user}
      title="Recordatorios de Pago Inteligentes"
      subtitle="Sistema automatizado con IA para gestionar recordatorios y notificaciones"
    >
      <div className="container mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-6 gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Centro de Recordatorios Inteligentes</h1>
            <p className="text-gray-600">Gestiona recordatorios automatizados con análisis predictivo</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              {aiEnabled ? (
                <><Brain className="w-4 h-4 text-blue-600" /><span className="text-sm text-blue-600">IA Activa</span></>
              ) : (
                <><Brain className="w-4 h-4 text-gray-400" /><span className="text-sm text-gray-400">IA Inactiva</span></>
              )}
            </div>
            <div className="flex items-center gap-2">
              {automationEnabled ? (
                <><Zap className="w-4 h-4 text-green-600" /><span className="text-sm text-green-600">Automatización</span></>
              ) : (
                <><Zap className="w-4 h-4 text-gray-400" /><span className="text-sm text-gray-400">Manual</span></>
              )}
            </div>
            <Button size="sm">
              <Plus className="w-4 h-4 mr-2" />
              Nuevo Recordatorio
            </Button>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4 mb-6">
          <Card>
            <CardContent className="pt-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-gray-900">{stats.totalSent}</p>
                <p className="text-xs text-gray-600">Enviados</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-green-600">{stats.delivered}</p>
                <p className="text-xs text-gray-600">Entregados</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-purple-600">{stats.acknowledged}</p>
                <p className="text-xs text-gray-600">Reconocidos</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-red-600">{stats.failed}</p>
                <p className="text-xs text-gray-600">Fallidos</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-blue-600">{stats.responseRate.toFixed(1)}%</p>
                <p className="text-xs text-gray-600">Tasa Respuesta</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-orange-600">{stats.aiOptimizedCount}</p>
                <p className="text-xs text-gray-600">Optimizados IA</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-indigo-600">{stats.averageResponseTime}h</p>
                <p className="text-xs text-gray-600">Tiempo Respuesta</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="reminders" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="reminders">Recordatorios</TabsTrigger>
            <TabsTrigger value="automation">Automatización</TabsTrigger>
            <TabsTrigger value="templates">Plantillas</TabsTrigger>
            <TabsTrigger value="analytics">Analíticas</TabsTrigger>
          </TabsList>

          <TabsContent value="reminders">
            {/* Filters and Search */}
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    placeholder="Buscar recordatorios..."
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
                  <option value="all">Todos</option>
                  <option value="pending">Pendientes</option>
                  <option value="sent">Enviados</option>
                  <option value="delivered">Entregados</option>
                  <option value="acknowledged">Reconocidos</option>
                  <option value="failed">Fallidos</option>
                </select>
                <Button variant="outline" size="sm">
                  <Filter className="w-4 h-4 mr-2" />
                  Filtros
                </Button>
              </div>
            </div>

            {/* Reminders List */}
            <div className="space-y-4">
              {filteredReminders.length === 0 ? (
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-center py-8">
                      <Bell className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-500">No se encontraron recordatorios</p>
                      <p className="text-sm text-gray-400">Intenta ajustar tus filtros de búsqueda</p>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                filteredReminders.map((reminder) => (
                  <Card 
                    key={reminder.id} 
                    className={`border-l-4 ${getPriorityColor(reminder.priority)} ${
                      reminder.status === 'pending' ? 'shadow-md' : ''
                    }`}
                  >
                    <CardContent className="pt-4">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3 flex-1">
                          <div className={`p-2 rounded-lg ${getPriorityColor(reminder.priority)}`}>
                            {getReminderIcon(reminder.type)}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="font-semibold text-gray-900">{reminder.title}</h3>
                              {getPriorityBadge(reminder.priority)}
                              {getStatusBadge(reminder.status)}
                              {reminder.aiOptimized && (
                                <Badge className="bg-purple-100 text-purple-800">IA</Badge>
                              )}
                              <div className="flex items-center gap-1 text-xs text-gray-500">
                                {getChannelIcon(reminder.channel)}
                                <span>{reminder.channel}</span>
                              </div>
                            </div>
                            <p className="text-gray-600 text-sm mb-2">{reminder.message}</p>
                            
                            {/* AI Insights */}
                            {reminder.aiInsight && (
                              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-2">
                                <div className="flex items-center gap-2 mb-1">
                                  <Brain className="w-4 h-4 text-blue-600" />
                                  <span className="text-sm font-medium text-blue-800">Insight de IA</span>
                                </div>
                                <p className="text-xs text-blue-700">{reminder.aiInsight}</p>
                              </div>
                            )}
                            
                            <div className="flex items-center gap-4 text-xs text-gray-500">
                              <span className="flex items-center gap-1">
                                <Calendar className="w-3 h-3" />
                                Programado: {formatDateTime(reminder.scheduledFor)}
                              </span>
                              {reminder.amount && (
                                <span className="flex items-center gap-1">
                                  <DollarSign className="w-3 h-3" />
                                  {formatPrice(reminder.amount)}
                                </span>
                              )}
                              {reminder.predictedResponse && (
                                <span className="flex items-center gap-1">
                                  <Target className="w-3 h-3" />
                                  Respuesta esperada: {reminder.predictedResponse}%
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {reminder.status === 'pending' && (
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => sendReminder(reminder.id)}
                            >
                              <Send className="w-4 h-4" />
                            </Button>
                          )}
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => deleteReminder(reminder.id)}
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

          <TabsContent value="automation">
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">Reglas de Automatización</h3>
                <Button size="sm">
                  <Plus className="w-4 h-4 mr-2" />
                  Nueva Regla
                </Button>
              </div>
              
              {automationRules.map((rule) => (
                <Card key={rule.id}>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-semibold">{rule.name}</h3>
                          <Badge className={rule.active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
                            {rule.active ? 'Activa' : 'Inactiva'}
                          </Badge>
                          {rule.aiOptimized && (
                            <Badge className="bg-purple-100 text-purple-800">IA</Badge>
                          )}
                        </div>
                        <p className="text-sm text-gray-600 mb-2">{rule.description}</p>
                        <div className="grid grid-cols-3 gap-4 text-xs text-gray-500">
                          <div>
                            <span className="font-medium">Disparador:</span> {rule.trigger}
                          </div>
                          <div>
                            <span className="font-medium">Activado:</span> {rule.performance.triggered} veces
                          </div>
                          <div>
                            <span className="font-medium">Tasa éxito:</span> {rule.performance.responseRate}%
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm">
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button size="sm">
                          <Play className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="templates">
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">Plantillas de Recordatorio</h3>
                <Button size="sm">
                  <Plus className="w-4 h-4 mr-2" />
                  Nueva Plantilla
                </Button>
              </div>
              
              {templates.map((template) => (
                <Card key={template.id}>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-semibold">{template.name}</h3>
                          <Badge className={template.active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
                            {template.active ? 'Activa' : 'Inactiva'}
                          </Badge>
                          {template.aiOptimized && (
                            <Badge className="bg-purple-100 text-purple-800">IA</Badge>
                          )}
                        </div>
                        <p className="text-sm text-gray-600 mb-2">{template.description}</p>
                        <div className="flex items-center gap-4 text-xs text-gray-500">
                          <span>Tipo: {template.type}</span>
                          <span>Canales: {template.channel.join(', ')}</span>
                          <span>Timing: {template.timing}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm">
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button size="sm">
                          <Eye className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="analytics">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Rendimiento del Sistema</CardTitle>
                  <CardDescription>Métricas de recordatorios automatizados</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-4 bg-green-50 rounded-lg">
                      <p className="text-2xl font-bold text-green-600">{stats.responseRate.toFixed(1)}%</p>
                      <p className="text-sm text-green-700">Tasa de Respuesta</p>
                    </div>
                    <div className="text-center p-4 bg-blue-50 rounded-lg">
                      <p className="text-2xl font-bold text-blue-600">{stats.averageResponseTime}h</p>
                      <p className="text-sm text-blue-700">Tiempo Promedio</p>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <h4 className="font-medium">Rendimiento por Canal</h4>
                    <div className="space-y-2">
                      {Object.entries(stats.channelPerformance).map(([channel, perf]) => (
                        <div key={channel} className="flex items-center justify-between">
                          <span className="text-sm capitalize">{channel}</span>
                          <div className="flex items-center gap-2">
                            <div className="w-24 bg-gray-200 rounded-full h-2">
                              <div 
                                className="bg-blue-600 h-2 rounded-full" 
                                style={{ width: `${perf.responseRate}%` }}
                              ></div>
                            </div>
                            <span className="text-sm text-gray-600">{perf.responseRate}%</span>
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
                  <CardDescription>Efectividad de la optimización con IA</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-4 bg-purple-50 rounded-lg">
                      <p className="text-2xl font-bold text-purple-600">{stats.aiOptimizedCount}</p>
                      <p className="text-sm text-purple-700">Optimizados por IA</p>
                    </div>
                    <div className="text-center p-4 bg-orange-50 rounded-lg">
                      <p className="text-2xl font-bold text-orange-600">94%</p>
                      <p className="text-sm text-orange-700">Precisión de IA</p>
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Mejora en tasa de respuesta</span>
                      <span className="text-sm font-medium text-green-600">+32%</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Reducción de tiempo de respuesta</span>
                      <span className="text-sm font-medium text-green-600">-45%</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Recordatorios preventivos</span>
                      <span className="text-sm font-medium text-blue-600">89</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Pagos recuperados</span>
                      <span className="text-sm font-medium text-green-600">$2.4M</span>
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

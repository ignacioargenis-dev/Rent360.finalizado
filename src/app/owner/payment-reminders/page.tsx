'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { logger } from '@/lib/logger-minimal';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import UnifiedDashboardLayout from '@/components/layout/UnifiedDashboardLayout';
import {
  Bell,
  Mail,
  Phone,
  Calendar,
  Clock,
  Send,
  CheckCircle,
  AlertTriangle,
  Users,
  DollarSign,
  TrendingUp,
  Settings,
  Eye,
} from 'lucide-react';
import { User } from '@/types';

interface PaymentReminder {
  id: string;
  tenantId: string;
  tenantName: string;
  tenantEmail: string;
  tenantPhone: string;
  propertyId: string;
  propertyTitle: string;
  amount: number;
  dueDate: string;
  reminderType: 'first' | 'second' | 'final' | 'urgent';
  sentDate: string;
  status: 'sent' | 'delivered' | 'opened' | 'failed';
  channel: 'email' | 'sms' | 'both';
  response?: 'paid' | 'contacted' | 'ignored' | 'pending';
}

interface ReminderStats {
  totalSent: number;
  delivered: number;
  opened: number;
  responses: number;
  successRate: number;
  pendingAmount: number;
}

interface ReminderSettings {
  autoReminders: boolean;
  firstReminderDays: number;
  secondReminderDays: number;
  finalReminderDays: number;
  emailTemplates: boolean;
  smsEnabled: boolean;
}

export default function OwnerPaymentRemindersPage() {
  const [user, setUser] = useState<User | null>(null);
  const [reminders, setReminders] = useState<PaymentReminder[]>([]);
  const [filteredReminders, setFilteredReminders] = useState<PaymentReminder[]>([]);
  const [stats, setStats] = useState<ReminderStats>({
    totalSent: 0,
    delivered: 0,
    opened: 0,
    responses: 0,
    successRate: 0,
    pendingAmount: 0,
  });
  const [settings, setSettings] = useState<ReminderSettings>({
    autoReminders: true,
    firstReminderDays: 3,
    secondReminderDays: 7,
    finalReminderDays: 14,
    emailTemplates: true,
    smsEnabled: false,
  });
  const [statusFilter, setStatusFilter] = useState('all');
  const [channelFilter, setChannelFilter] = useState('all');
  const [loading, setLoading] = useState(true);

  // Modal states
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showBulkSendModal, setShowBulkSendModal] = useState(false);
  const [selectedReminder, setSelectedReminder] = useState<PaymentReminder | null>(null);

  // Success/Error states
  const [successMessage, setSuccessMessage] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [showNotificationDialog, setShowNotificationDialog] = useState(false);
  const [notificationTitle, setNotificationTitle] = useState('');
  const [notificationMessage, setNotificationMessage] = useState('');
  const [notificationType, setNotificationType] = useState<'success' | 'error'>('success');

  const showNotification = (
    title: string,
    message: string,
    type: 'success' | 'error' = 'success'
  ) => {
    setNotificationTitle(title);
    setNotificationMessage(message);
    setNotificationType(type);
    setShowNotificationDialog(true);
  };

  // Configuration states
  const [reminderConfig, setReminderConfig] = useState({
    autoSendFirst: true,
    daysBeforeDueFirst: 10,
    autoSendSecond: true,
    daysBeforeDueSecond: 5,
    autoSendFinal: true,
    daysBeforeDueFinal: 1,
    autoSendUrgent: false,
    daysAfterDue: 3,
    emailTemplate: 'default',
    smsTemplate: 'default',
    includePropertyInfo: true,
    includeOwnerContact: true,
  });

  // Bulk send states
  const [bulkSendConfig, setBulkSendConfig] = useState({
    reminderType: 'first',
    channel: 'both',
    message: '',
    selectedTenants: [] as string[],
    selectAll: false,
  });

  const handleConfigureReminders = () => {
    setShowConfigModal(true);
  };

  const handleSendBulkReminders = async () => {
    try {
      setLoading(true);
      logger.info('Enviando recordatorios masivos de pago');

      // Obtener recordatorios pendientes para enviar masivamente
      const pendingReminders = reminders.filter(r => r.status === 'sent');

      if (pendingReminders.length === 0) {
        showNotification(
          'Sin Recordatorios Pendientes',
          'No hay recordatorios pendientes para enviar.',
          'error'
        );
        return;
      }

      let sentCount = 0;
      let failedCount = 0;

      // Enviar cada recordatorio individualmente
      for (const reminder of pendingReminders) {
        try {
          const response = await fetch('/api/owner/payment-reminders/send', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              reminderId: reminder.id,
              tenantId: reminder.tenantId,
              propertyId: reminder.propertyId,
              amount: reminder.amount,
              dueDate: reminder.dueDate,
              reminderType: reminder.reminderType,
              channel: reminder.channel,
            }),
          });

          if (response.ok) {
            sentCount++;
            // Actualizar estado local
            setReminders(prevReminders =>
              prevReminders.map(r =>
                r.id === reminder.id
                  ? { ...r, status: 'sent' as any, sentAt: new Date().toISOString() }
                  : r
              )
            );
          } else {
            failedCount++;
            logger.error(`Error enviando recordatorio ${reminder.id}:`, {
              error: await response.text(),
            });
          }
        } catch (reminderError) {
          failedCount++;
          logger.error(`Error enviando recordatorio ${reminder.id}:`, { error: reminderError });
        }
      }

      if (sentCount > 0) {
        showNotification(
          'Recordatorios Masivos Enviados',
          `Se enviaron ${sentCount} recordatorios exitosamente${failedCount > 0 ? ` (${failedCount} fallaron)` : ''}.`,
          sentCount === pendingReminders.length ? 'success' : 'error'
        );
      } else {
        showNotification(
          'Error en Envío Masivo',
          'No se pudo enviar ningún recordatorio. Por favor, inténtalo nuevamente.',
          'error'
        );
      }
    } catch (error) {
      logger.error('Error enviando recordatorios masivos:', {
        error: error instanceof Error ? error.message : String(error),
      });
      showNotification(
        'Error al Enviar Recordatorios',
        'Ha ocurrido un error al enviar los recordatorios masivos. Por favor, inténtalo nuevamente.',
        'error'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleViewReminderDetails = (reminderId: string) => {
    const reminder = reminders.find(r => r.id === reminderId);
    if (reminder) {
      setSelectedReminder(reminder);
      setShowDetailsModal(true);
    } else {
      showNotification(
        'Recordatorio No Encontrado',
        'No se pudo encontrar el recordatorio solicitado.',
        'error'
      );
    }
  };

  const handleResendReminder = async (reminderId: string) => {
    try {
      const reminder = reminders.find(r => r.id === reminderId);
      if (!reminder) {
        showNotification(
          'Recordatorio No Encontrado',
          'No se pudo encontrar el recordatorio para reenviar.',
          'error'
        );
        return;
      }

      logger.info('Reenviando recordatorio:', { reminderId });

      // Enviar recordatorio usando la API
      const response = await fetch('/api/owner/payment-reminders/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          reminderId: reminder.id,
          tenantId: reminder.tenantId,
          propertyId: reminder.propertyId,
          amount: reminder.amount,
          dueDate: reminder.dueDate,
          reminderType: 'urgent', // Reenvío es urgente
          channel: reminder.channel,
          customMessage: 'Reenvío de recordatorio de pago pendiente.',
        }),
      });

      if (response.ok) {
        const data = await response.json();

        // Actualizar estado local
        setReminders(prevReminders =>
          prevReminders.map(r =>
            r.id === reminderId
              ? { ...r, status: 'sent' as any, sentAt: new Date().toISOString() }
              : r
          )
        );

        showNotification(
          'Recordatorio Reenviado',
          `El recordatorio para ${reminder.tenantName} ha sido reenviado exitosamente.`,
          'success'
        );
      } else {
        const errorData = await response.json();
        showNotification(
          'Error al Reenviar',
          errorData.error || 'Ha ocurrido un error al reenviar el recordatorio.',
          'error'
        );
      }
    } catch (error) {
      logger.error('Error reenviando recordatorio:', {
        error: error instanceof Error ? error.message : String(error),
      });
      showNotification(
        'Error al Reenviar',
        'Ha ocurrido un error al reenviar el recordatorio. Por favor, inténtalo nuevamente.',
        'error'
      );
    }
  };

  const handleCancelReminder = async (reminderId: string) => {
    try {
      const reminder = reminders.find(r => r.id === reminderId);
      if (!reminder) {
        showNotification(
          'Recordatorio No Encontrado',
          'No se pudo encontrar el recordatorio para cancelar.',
          'error'
        );
        return;
      }

      logger.info('Cancelando recordatorio:', { reminderId });

      // Cancelar recordatorio usando la API
      const response = await fetch(`/api/owner/payment-reminders/${reminderId}/cancel`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();

        // Actualizar estado local
        setReminders(prevReminders =>
          prevReminders.map(r => (r.id === reminderId ? { ...r, status: 'cancelled' as any } : r))
        );

        showNotification(
          'Recordatorio Cancelado',
          `El recordatorio para ${reminder.tenantName} ha sido cancelado exitosamente.`,
          'success'
        );
      } else {
        const errorData = await response.json();
        showNotification(
          'Error al Cancelar',
          errorData.error || 'Ha ocurrido un error al cancelar el recordatorio.',
          'error'
        );
      }
    } catch (error) {
      logger.error('Error cancelando recordatorio:', {
        error: error instanceof Error ? error.message : String(error),
      });
      showNotification(
        'Error al Cancelar',
        'Ha ocurrido un error al cancelar el recordatorio. Por favor, inténtalo nuevamente.',
        'error'
      );
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

    const loadRemindersData = async () => {
      try {
        // Mock reminders data
        const mockReminders: PaymentReminder[] = [
          {
            id: 'r1',
            tenantId: 't1',
            tenantName: 'María González',
            tenantEmail: 'maria@example.com',
            tenantPhone: '+56912345678',
            propertyId: 'p1',
            propertyTitle: 'Apartamento Centro',
            amount: 850000,
            dueDate: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5).toISOString(),
            reminderType: 'first',
            sentDate: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(),
            status: 'delivered',
            channel: 'email',
            response: 'pending',
          },
          {
            id: 'r2',
            tenantId: 't2',
            tenantName: 'Carlos Rodríguez',
            tenantEmail: 'carlos@example.com',
            tenantPhone: '+56987654321',
            propertyId: 'p2',
            propertyTitle: 'Casa Los Dominicos',
            amount: 1200000,
            dueDate: new Date(Date.now() - 1000 * 60 * 60 * 24 * 12).toISOString(),
            reminderType: 'second',
            sentDate: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5).toISOString(),
            status: 'opened',
            channel: 'both',
            response: 'contacted',
          },
          {
            id: 'r3',
            tenantId: 't3',
            tenantName: 'Ana López',
            tenantEmail: 'ana@example.com',
            tenantPhone: '+56955556666',
            propertyId: 'p3',
            propertyTitle: 'Oficina Las Condes',
            amount: 75000,
            dueDate: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(),
            reminderType: 'first',
            sentDate: new Date(Date.now() - 1000 * 60 * 60 * 24 * 1).toISOString(),
            status: 'sent',
            channel: 'email',
            response: 'pending',
          },
          {
            id: 'r4',
            tenantId: 't1',
            tenantName: 'María González',
            tenantEmail: 'maria@example.com',
            tenantPhone: '+56912345678',
            propertyId: 'p1',
            propertyTitle: 'Apartamento Centro',
            amount: 850000,
            dueDate: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5).toISOString(),
            reminderType: 'final',
            sentDate: new Date(Date.now() - 1000 * 60 * 60 * 24 * 1).toISOString(),
            status: 'failed',
            channel: 'email',
            response: 'pending',
          },
          {
            id: 'r5',
            tenantId: 't4',
            tenantName: 'Pedro Martínez',
            tenantEmail: 'pedro@example.com',
            tenantPhone: '+56977778888',
            propertyId: 'p4',
            propertyTitle: 'Local Vitacura',
            amount: 500000,
            dueDate: new Date(Date.now() - 1000 * 60 * 60 * 24 * 8).toISOString(),
            reminderType: 'urgent',
            sentDate: new Date(Date.now() - 1000 * 60 * 60 * 24 * 1).toISOString(),
            status: 'delivered',
            channel: 'both',
            response: 'paid',
          },
        ];

        setReminders(mockReminders);
        setFilteredReminders(mockReminders);

        // Calculate stats
        const totalSent = mockReminders.length;
        const delivered = mockReminders.filter(r => r.status === 'delivered').length;
        const opened = mockReminders.filter(r => r.status === 'opened').length;
        const responses = mockReminders.filter(r => r.response && r.response !== 'pending').length;
        const successRate = responses > 0 ? (responses / totalSent) * 100 : 0;
        const pendingAmount = mockReminders
          .filter(r => r.response !== 'paid')
          .reduce((sum, r) => sum + r.amount, 0);

        const reminderStats: ReminderStats = {
          totalSent,
          delivered,
          opened,
          responses,
          successRate,
          pendingAmount,
        };

        setStats(reminderStats);
        setLoading(false);
      } catch (error) {
        logger.error('Error loading reminders data:', {
          error: error instanceof Error ? error.message : String(error),
        });
        setLoading(false);
      }
    };

    loadUserData();
    loadRemindersData();
  }, []);

  useEffect(() => {
    let filtered = reminders;

    // Filter by status
    if (statusFilter !== 'all') {
      filtered = filtered.filter(reminder => reminder.status === statusFilter);
    }

    // Filter by channel
    if (channelFilter !== 'all') {
      filtered = filtered.filter(reminder => reminder.channel === channelFilter);
    }

    setFilteredReminders(filtered);
  }, [reminders, statusFilter, channelFilter]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'sent':
        return <Badge className="bg-blue-100 text-blue-800">Enviado</Badge>;
      case 'delivered':
        return <Badge className="bg-green-100 text-green-800">Entregado</Badge>;
      case 'opened':
        return <Badge className="bg-purple-100 text-purple-800">Abierto</Badge>;
      case 'failed':
        return <Badge className="bg-red-100 text-red-800">Fallido</Badge>;
      default:
        return <Badge>Desconocido</Badge>;
    }
  };

  const getChannelBadge = (channel: string) => {
    switch (channel) {
      case 'email':
        return <Badge variant="outline">Email</Badge>;
      case 'sms':
        return <Badge variant="outline">SMS</Badge>;
      case 'both':
        return <Badge variant="outline">Email + SMS</Badge>;
      default:
        return <Badge variant="outline">{channel}</Badge>;
    }
  };

  const getResponseBadge = (response?: string) => {
    switch (response) {
      case 'paid':
        return <Badge className="bg-green-100 text-green-800">Pagado</Badge>;
      case 'contacted':
        return <Badge className="bg-blue-100 text-blue-800">Contactado</Badge>;
      case 'ignored':
        return <Badge className="bg-gray-100 text-gray-800">Ignorado</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800">Pendiente</Badge>;
      default:
        return <Badge variant="outline">Sin respuesta</Badge>;
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-CL', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleSendReminder = async (reminder: PaymentReminder) => {
    alert(`Enviando recordatorio a ${reminder.tenantName} por ${formatCurrency(reminder.amount)}`);
    // In a real app, this would send the reminder
  };

  const handleUpdateSettings = async () => {
    alert('Configuración de recordatorios actualizada');
    // In a real app, this would save the settings
  };

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
    <UnifiedDashboardLayout
      title="Recordatorios de Pago"
      subtitle="Gestiona los recordatorios automáticos de pagos pendientes"
    >
      <div className="container mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-6 gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Recordatorios de Pago</h1>
            <p className="text-gray-600">
              Monitorea y gestiona los recordatorios de pagos enviados a tus inquilinos
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleConfigureReminders}>
              <Settings className="w-4 h-4 mr-2" />
              Configuración
            </Button>
            <Button onClick={handleSendBulkReminders}>
              <Send className="w-4 h-4 mr-2" />
              Enviar Recordatorios
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4 mb-8">
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Enviados</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.totalSent}</p>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Send className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Entregados</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.delivered}</p>
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
                  <p className="text-sm font-medium text-gray-600">Abiertos</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.opened}</p>
                </div>
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                  <Mail className="w-6 h-6 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Respuestas</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.responses}</p>
                </div>
                <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                  <Bell className="w-6 h-6 text-orange-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Tasa Éxito</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {stats.successRate.toFixed(1)}%
                  </p>
                </div>
                <div className="w-12 h-12 bg-teal-100 rounded-lg flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-teal-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Monto Pendiente</p>
                  <p className="text-lg font-bold text-gray-900">
                    {formatCurrency(stats.pendingAmount)}
                  </p>
                </div>
                <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                  <DollarSign className="w-6 h-6 text-red-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="flex gap-2">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los estados</SelectItem>
                <SelectItem value="sent">Enviado</SelectItem>
                <SelectItem value="delivered">Entregado</SelectItem>
                <SelectItem value="opened">Abierto</SelectItem>
                <SelectItem value="failed">Fallido</SelectItem>
              </SelectContent>
            </Select>

            <Select value={channelFilter} onValueChange={setChannelFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Canal" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los canales</SelectItem>
                <SelectItem value="email">Email</SelectItem>
                <SelectItem value="sms">SMS</SelectItem>
                <SelectItem value="both">Ambos</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Reminders List */}
        <div className="space-y-4">
          {filteredReminders.length === 0 ? (
            <Card>
              <CardContent className="pt-8 pb-8 text-center">
                <Bell className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No hay recordatorios</h3>
                <p className="text-gray-600">
                  No se encontraron recordatorios con los filtros seleccionados.
                </p>
              </CardContent>
            </Card>
          ) : (
            filteredReminders.map(reminder => (
              <Card key={reminder.id} className="hover:shadow-md transition-shadow">
                <CardContent className="pt-6">
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                          <span className="text-gray-600 font-semibold text-sm">
                            {reminder.tenantName.charAt(0)}
                          </span>
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900">
                            {reminder.tenantName}
                          </h3>
                          <p className="text-sm text-gray-600">{reminder.propertyTitle}</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm text-gray-600 mb-3">
                        <div>
                          <span className="font-medium">Monto:</span>
                          <p className="text-lg font-bold text-gray-900">
                            {formatCurrency(reminder.amount)}
                          </p>
                        </div>
                        <div>
                          <span className="font-medium">Vencimiento:</span>
                          <p>{formatDate(reminder.dueDate)}</p>
                        </div>
                        <div>
                          <span className="font-medium">Tipo:</span>
                          <div className="mt-1">
                            <Badge variant="outline" className="capitalize">
                              {reminder.reminderType === 'first'
                                ? '1er Recordatorio'
                                : reminder.reminderType === 'second'
                                  ? '2do Recordatorio'
                                  : reminder.reminderType === 'final'
                                    ? 'Recordatorio Final'
                                    : 'Urgente'}
                            </Badge>
                          </div>
                        </div>
                        <div>
                          <span className="font-medium">Estado:</span>
                          <div className="mt-1 flex gap-2">
                            {getStatusBadge(reminder.status)}
                            {getChannelBadge(reminder.channel)}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-xs text-gray-500">
                        <span>Enviado: {formatDate(reminder.sentDate)}</span>
                        <div className="flex items-center gap-2">
                          <span>Respuesta:</span>
                          {getResponseBadge(reminder.response)}
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col gap-2 lg:min-w-[200px]">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleViewReminderDetails(reminder.id)}
                      >
                        <Eye className="w-4 h-4 mr-2" />
                        Ver Detalles
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleResendReminder(reminder.id)}
                      >
                        <Send className="w-4 h-4 mr-2" />
                        Reenviar
                      </Button>
                      {reminder.status !== 'delivered' && reminder.status !== 'failed' && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleCancelReminder(reminder.id)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <AlertTriangle className="w-4 h-4 mr-2" />
                          Cancelar
                        </Button>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.open(`mailto:${reminder.tenantEmail}`)}
                      >
                        <Mail className="w-4 h-4 mr-2" />
                        Email
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.open(`tel:${reminder.tenantPhone}`)}
                      >
                        <Phone className="w-4 h-4 mr-2" />
                        Llamar
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>

      {/* Notification Dialog */}
      <Dialog open={showNotificationDialog} onOpenChange={setShowNotificationDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {notificationType === 'success' ? (
                <CheckCircle className="w-5 h-5 text-green-600" />
              ) : (
                <AlertTriangle className="w-5 h-5 text-red-600" />
              )}
              {notificationTitle}
            </DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-gray-600">{notificationMessage}</p>
          </div>
          <DialogFooter>
            <Button
              onClick={() => setShowNotificationDialog(false)}
              className={
                notificationType === 'success'
                  ? 'bg-green-600 hover:bg-green-700'
                  : 'bg-red-600 hover:bg-red-700'
              }
            >
              Aceptar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </UnifiedDashboardLayout>
  );
}

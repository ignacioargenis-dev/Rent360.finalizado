'use client';

// Build fix - force update

import React, { useState, useEffect } from 'react';
import { logger } from '@/lib/logger';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import UnifiedDashboardLayout from '@/components/layout/UnifiedDashboardLayout';
import {
  Bell,
  Mail,
  Smartphone,
  MessageSquare,
  CreditCard,
  FileText,
  Wrench,
  Star,
  Clock,
  Save,
} from 'lucide-react';
import Link from 'next/link';
import { User } from '@/types';

interface NotificationSettings {
  email: {
    enabled: boolean;
    frequency: 'immediate' | 'daily' | 'weekly';
    payments: boolean;
    contracts: boolean;
    maintenance: boolean;
    messages: boolean;
    ratings: boolean;
    system: boolean;
  };
  push: {
    enabled: boolean;
    payments: boolean;
    contracts: boolean;
    maintenance: boolean;
    messages: boolean;
    system: boolean;
  };
  sms: {
    enabled: boolean;
    payments: boolean;
    urgent: boolean;
    system: boolean;
  };
  reminders: {
    paymentDue: boolean;
    contractExpiry: boolean;
    maintenanceScheduled: boolean;
    daysBefore: number;
  };
}

interface NotificationCategory {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  emailEnabled: boolean;
  pushEnabled: boolean;
  smsEnabled: boolean;
}

export default function NotificationsSettingsPage() {
  const [user, setUser] = useState<User | null>(null);
  const [settings, setSettings] = useState<NotificationSettings>({
    email: {
      enabled: true,
      frequency: 'immediate',
      payments: true,
      contracts: true,
      maintenance: true,
      messages: true,
      ratings: true,
      system: false,
    },
    push: {
      enabled: true,
      payments: true,
      contracts: true,
      maintenance: true,
      messages: true,
      system: true,
    },
    sms: {
      enabled: false,
      payments: true,
      urgent: true,
      system: false,
    },
    reminders: {
      paymentDue: true,
      contractExpiry: true,
      maintenanceScheduled: true,
      daysBefore: 3,
    },
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

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

    const loadNotificationSettings = async () => {
      try {
        // Mock settings loading - in real app, this would come from API
        setSettings({
          email: {
            enabled: true,
            frequency: 'immediate',
            payments: true,
            contracts: true,
            maintenance: true,
            messages: true,
            ratings: true,
            system: false,
          },
          push: {
            enabled: true,
            payments: true,
            contracts: true,
            maintenance: true,
            messages: true,
            system: true,
          },
          sms: {
            enabled: false,
            payments: true,
            urgent: true,
            system: false,
          },
          reminders: {
            paymentDue: true,
            contractExpiry: true,
            maintenanceScheduled: true,
            daysBefore: 3,
          },
        });
        setLoading(false);
      } catch (error) {
        logger.error('Error loading notification settings:', {
          error: error instanceof Error ? error.message : String(error),
        });
        setLoading(false);
      }
    };

    loadUserData();
    loadNotificationSettings();
  }, []);

  const handleSaveSettings = async () => {
    setSaving(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      alert('Configuración de notificaciones guardada exitosamente');
    } catch (error) {
      logger.error('Error saving notification settings:', {
        error: error instanceof Error ? error.message : String(error),
      });
      alert('Error al guardar la configuración');
    } finally {
      setSaving(false);
    }
  };

  const updateEmailSetting = (
    key: keyof NotificationSettings['email'],
    value: boolean | string
  ) => {
    setSettings(prev => ({
      ...prev,
      email: {
        ...prev.email,
        [key]: value,
      },
    }));
  };

  const updatePushSetting = (key: keyof NotificationSettings['push'], value: boolean) => {
    setSettings(prev => ({
      ...prev,
      push: {
        ...prev.push,
        [key]: value,
      },
    }));
  };

  const updateSmsSetting = (key: keyof NotificationSettings['sms'], value: boolean) => {
    setSettings(prev => ({
      ...prev,
      sms: {
        ...prev.sms,
        [key]: value,
      },
    }));
  };

  const updateReminderSetting = (
    key: keyof NotificationSettings['reminders'],
    value: boolean | number
  ) => {
    setSettings(prev => ({
      ...prev,
      reminders: {
        ...prev.reminders,
        [key]: value,
      },
    }));
  };

  const categories: NotificationCategory[] = [
    {
      id: 'payments',
      name: 'Pagos',
      description: 'Notificaciones sobre pagos, facturas y transacciones',
      icon: <CreditCard className="w-5 h-5" />,
      emailEnabled: settings.email.payments,
      pushEnabled: settings.push.payments,
      smsEnabled: settings.sms.payments,
    },
    {
      id: 'contracts',
      name: 'Contratos',
      description: 'Actualizaciones sobre contratos y documentos legales',
      icon: <FileText className="w-5 h-5" />,
      emailEnabled: settings.email.contracts,
      pushEnabled: settings.push.contracts,
      smsEnabled: false,
    },
    {
      id: 'maintenance',
      name: 'Mantenimiento',
      description: 'Solicitudes de mantenimiento y actualizaciones',
      icon: <Wrench className="w-5 h-5" />,
      emailEnabled: settings.email.maintenance,
      pushEnabled: settings.push.maintenance,
      smsEnabled: false,
    },
    {
      id: 'messages',
      name: 'Mensajes',
      description: 'Mensajes y comunicaciones del sistema',
      icon: <MessageSquare className="w-5 h-5" />,
      emailEnabled: settings.email.messages,
      pushEnabled: settings.push.messages,
      smsEnabled: false,
    },
    {
      id: 'ratings',
      name: 'Calificaciones',
      description: 'Nuevas calificaciones y reseñas',
      icon: <Star className="w-5 h-5" />,
      emailEnabled: settings.email.ratings,
      pushEnabled: false,
      smsEnabled: false,
    },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando configuración de notificaciones...</p>
        </div>
      </div>
    );
  }

  return (
    <UnifiedDashboardLayout
      title="Configuración de Notificaciones"
      subtitle="Gestiona tus preferencias de notificaciones"
    >
      <div className="container mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-8 gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Configuración de Notificaciones</h1>
            <p className="text-gray-600">
              Personaliza cómo y cuándo quieres recibir notificaciones
            </p>
          </div>
          <Button onClick={handleSaveSettings} disabled={saving}>
            <Save className="w-4 h-4 mr-2" />
            {saving ? 'Guardando...' : 'Guardar Cambios'}
          </Button>
        </div>

        {/* General Settings */}
        <div className="grid lg:grid-cols-3 gap-6 mb-8">
          {/* Email Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="w-5 h-5" />
                Notificaciones por Email
              </CardTitle>
              <CardDescription>
                Recibe notificaciones importantes por correo electrónico
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="email-enabled">Habilitar notificaciones por email</Label>
                <Switch
                  id="email-enabled"
                  checked={settings.email.enabled}
                  onCheckedChange={checked => updateEmailSetting('enabled', checked)}
                />
              </div>

              {settings.email.enabled && (
                <>
                  <div className="space-y-2">
                    <Label>Frecuencia de envío</Label>
                    <Select
                      value={settings.email.frequency}
                      onValueChange={(value: 'immediate' | 'daily' | 'weekly') =>
                        updateEmailSetting('frequency', value)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="immediate">Inmediato</SelectItem>
                        <SelectItem value="daily">Resumen diario</SelectItem>
                        <SelectItem value="weekly">Resumen semanal</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Push Notifications */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Smartphone className="w-5 h-5" />
                Notificaciones Push
              </CardTitle>
              <CardDescription>
                Recibe notificaciones en tiempo real en tu dispositivo
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <Label htmlFor="push-enabled">Habilitar notificaciones push</Label>
                <Switch
                  id="push-enabled"
                  checked={settings.push.enabled}
                  onCheckedChange={checked => updatePushSetting('enabled', checked)}
                />
              </div>
            </CardContent>
          </Card>

          {/* SMS Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="w-5 h-5" />
                Notificaciones SMS
              </CardTitle>
              <CardDescription>Recibe alertas críticas por mensaje de texto</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <Label htmlFor="sms-enabled">Habilitar notificaciones SMS</Label>
                <Switch
                  id="sms-enabled"
                  checked={settings.sms.enabled}
                  onCheckedChange={checked => updateSmsSetting('enabled', checked)}
                />
              </div>
              <p className="text-xs text-gray-500 mt-2">
                Solo para notificaciones urgentes y de seguridad
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Category-specific Settings */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Notificaciones por Categoría</CardTitle>
            <CardDescription>Elige qué tipos de notificaciones quieres recibir</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {categories.map(category => (
                <div
                  key={category.id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                      {category.icon}
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900">{category.name}</h4>
                      <p className="text-sm text-gray-600">{category.description}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    {settings.email.enabled && (
                      <div className="flex items-center gap-2">
                        <Mail className="w-4 h-4 text-gray-400" />
                        <Switch
                          checked={category.emailEnabled}
                          onCheckedChange={checked => {
                            const key = `${category.id}` as keyof NotificationSettings['email'];
                            updateEmailSetting(key, checked);
                          }}
                        />
                      </div>
                    )}

                    {settings.push.enabled && (
                      <div className="flex items-center gap-2">
                        <Smartphone className="w-4 h-4 text-gray-400" />
                        <Switch
                          checked={category.pushEnabled}
                          onCheckedChange={checked => {
                            const key = `${category.id}` as keyof NotificationSettings['push'];
                            updatePushSetting(key, checked);
                          }}
                        />
                      </div>
                    )}

                    {settings.sms.enabled && category.smsEnabled !== false && (
                      <div className="flex items-center gap-2">
                        <MessageSquare className="w-4 h-4 text-gray-400" />
                        <Switch
                          checked={category.smsEnabled}
                          onCheckedChange={checked => {
                            const key = `${category.id}` as keyof NotificationSettings['sms'];
                            updateSmsSetting(key, checked);
                          }}
                        />
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Reminders */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5" />
              Recordatorios Automáticos
            </CardTitle>
            <CardDescription>Configura recordatorios para eventos importantes</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="payment-reminder">Recordatorios de pagos</Label>
                    <p className="text-sm text-gray-600">Notificaciones antes de vencimiento</p>
                  </div>
                  <Switch
                    id="payment-reminder"
                    checked={settings.reminders.paymentDue}
                    onCheckedChange={checked => updateReminderSetting('paymentDue', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="contract-reminder">Recordatorios de contratos</Label>
                    <p className="text-sm text-gray-600">Alertas de renovación</p>
                  </div>
                  <Switch
                    id="contract-reminder"
                    checked={settings.reminders.contractExpiry}
                    onCheckedChange={checked => updateReminderSetting('contractExpiry', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="maintenance-reminder">Recordatorios de mantenimiento</Label>
                    <p className="text-sm text-gray-600">Citas programadas</p>
                  </div>
                  <Switch
                    id="maintenance-reminder"
                    checked={settings.reminders.maintenanceScheduled}
                    onCheckedChange={checked =>
                      updateReminderSetting('maintenanceScheduled', checked)
                    }
                  />
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <Label>Días de anticipación</Label>
                  <Select
                    value={settings.reminders.daysBefore.toString()}
                    onValueChange={value => updateReminderSetting('daysBefore', parseInt(value))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">1 día antes</SelectItem>
                      <SelectItem value="3">3 días antes</SelectItem>
                      <SelectItem value="7">1 semana antes</SelectItem>
                      <SelectItem value="14">2 semanas antes</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="p-4 bg-blue-50 rounded-lg">
                  <div className="flex items-start gap-2">
                    <Bell className="w-5 h-5 text-blue-600 mt-0.5" />
                    <div>
                      <h4 className="font-medium text-blue-900">Consejo</h4>
                      <p className="text-sm text-blue-700">
                        Los recordatorios te ayudan a mantenerte al día con tus obligaciones.
                        Recomendamos activar al menos los recordatorios de pagos.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </UnifiedDashboardLayout>
  );
}

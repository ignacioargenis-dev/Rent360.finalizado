'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Bell,
  BellOff,
  Clock,
  Smartphone,
  CreditCard,
  MessageSquare,
  Briefcase,
  Star,
  Gift,
  CheckCircle,
  AlertCircle,
  Settings,
  Save,
  TestTube
} from 'lucide-react';
import EnhancedDashboardLayout from '@/components/dashboard/EnhancedDashboardLayout';
import DashboardHeader from '@/components/dashboard/DashboardHeader';
import { firebaseNotificationService, type NotificationSettings } from '@/lib/notifications/firebase-service';
import { logger } from '@/lib/logger';

interface NotificationCategory {
  id: string;
  name: string;
  description: string;
  icon: React.ComponentType<any>;
  enabled: boolean;
}

export default function NotificationSettingsPage() {
  const [user, setUser] = useState<any>(null);
  const [settings, setSettings] = useState<NotificationSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [permissionStatus, setPermissionStatus] = useState<NotificationPermission>('default');
  const [firebaseToken, setFirebaseToken] = useState<string | null>(null);
  const [testNotificationSent, setTestNotificationSent] = useState(false);

  const categories: NotificationCategory[] = [
    {
      id: 'payments',
      name: 'Pagos y Transacciones',
      description: 'Notificaciones sobre aprobaciones de pago, transferencias y cobros',
      icon: CreditCard,
      enabled: settings?.categories.payments || false
    },
    {
      id: 'messages',
      name: 'Mensajes',
      description: 'Nuevos mensajes en conversaciones y chats',
      icon: MessageSquare,
      enabled: settings?.categories.messages || false
    },
    {
      id: 'jobs',
      name: 'Trabajos y Servicios',
      description: 'Actualizaciones de estado de trabajos, citas y servicios',
      icon: Briefcase,
      enabled: settings?.categories.jobs || false
    },
    {
      id: 'ratings',
      name: 'Calificaciones y Reseñas',
      description: 'Nuevas calificaciones y reseñas de servicios',
      icon: Star,
      enabled: settings?.categories.ratings || false
    },
    {
      id: 'promotions',
      name: 'Promociones y Ofertas',
      description: 'Ofertas especiales, descuentos y promociones',
      icon: Gift,
      enabled: settings?.categories.promotions || false
    }
  ];

  useEffect(() => {
    loadData();
    checkNotificationPermission();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);

      // Obtener información del usuario
      const userResponse = await fetch('/api/auth/me');
      if (userResponse.ok) {
        const userData = await userResponse.json();
        setUser(userData.user);
      }

      // Cargar configuración de notificaciones
      const settingsResponse = await fetch('/api/notifications/settings');
      if (settingsResponse.ok) {
        const settingsData = await settingsResponse.json();
        setSettings(settingsData.settings);
      } else {
        // Configuración por defecto si no existe
        setSettings({
          userId: user?.id || '',
          enabled: true,
          topics: ['general'],
          quietHours: {
            enabled: false,
            start: '22:00',
            end: '08:00'
          },
          categories: {
            payments: true,
            messages: true,
            jobs: true,
            ratings: true,
            promotions: false
          }
        });
      }

    } catch (error) {
      logger.error('Error cargando configuración de notificaciones:', { error: error instanceof Error ? error.message : String(error) });
    } finally {
      setLoading(false);
    }
  };

  const checkNotificationPermission = async () => {
    if ('Notification' in window) {
      setPermissionStatus(Notification.permission);
    }
  };

  const requestNotificationPermission = async () => {
    try {
      const permission = await firebaseNotificationService.requestPermission();
      if (permission) {
        const token = await firebaseNotificationService.getToken();
        setFirebaseToken(token);
        setPermissionStatus('granted');
      } else {
        setPermissionStatus('denied');
      }
    } catch (error) {
      logger.error('Error requesting notification permission:', { error: error instanceof Error ? error.message : String(error) });
      setPermissionStatus('denied');
    }
  };

  const handleSaveSettings = async () => {
    if (!settings) return;

    try {
      setSaving(true);

      const response = await fetch('/api/notifications/settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ settings }),
      });

      if (response.ok) {
        alert('Configuración guardada exitosamente');
      } else {
        throw new Error('Error al guardar configuración');
      }

    } catch (error) {
      logger.error('Error guardando configuración:', { error: error instanceof Error ? error.message : String(error) });
      alert('Error al guardar la configuración');
    } finally {
      setSaving(false);
    }
  };

  const handleSendTestNotification = async () => {
    if (!firebaseToken) {
      alert('Primero debes habilitar las notificaciones');
      return;
    }

    try {
      const success = await firebaseNotificationService.sendNotification(firebaseToken, {
        title: '¡Notificación de Prueba!',
        body: 'Esta es una notificación de prueba para verificar que todo funciona correctamente.',
        icon: '/icon-test.png',
        data: {
          type: 'test',
          url: '/settings/notifications'
        }
      });

      if (success) {
        setTestNotificationSent(true);
        setTimeout(() => setTestNotificationSent(false), 3000);
      } else {
        alert('Error al enviar la notificación de prueba');
      }

    } catch (error) {
      logger.error('Error sending test notification:', { error: error instanceof Error ? error.message : String(error) });
      alert('Error al enviar la notificación de prueba');
    }
  };

  const updateCategorySetting = (categoryId: string, enabled: boolean) => {
    if (!settings) return;

    setSettings({
      ...settings,
      categories: {
        ...settings.categories,
        [categoryId]: enabled
      }
    });
  };

  const updateQuietHours = (field: 'start' | 'end', value: string) => {
    if (!settings) return;

    setSettings({
      ...settings,
      quietHours: {
        ...settings.quietHours,
        [field]: value
      }
    });
  };

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
    <EnhancedDashboardLayout
      user={user}
      title="Configuración de Notificaciones"
      subtitle="Gestiona tus preferencias de notificaciones"
    >
      <DashboardHeader
        user={user}
        title="🔔 Configuración de Notificaciones"
        subtitle="Gestiona tus preferencias de notificaciones push"
      />

      <div className="container mx-auto px-4 py-6 max-w-4xl space-y-6">
        {/* Estado de Permisos */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Smartphone className="w-5 h-5" />
              Estado de Notificaciones Push
            </CardTitle>
            <CardDescription>
              Configura el acceso a notificaciones push en tu dispositivo
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {permissionStatus === 'granted' ? (
                  <CheckCircle className="w-8 h-8 text-green-500" />
                ) : permissionStatus === 'denied' ? (
                  <AlertCircle className="w-8 h-8 text-red-500" />
                ) : (
                  <Bell className="w-8 h-8 text-gray-400" />
                )}

                <div>
                  <div className="font-medium">
                    {permissionStatus === 'granted' && 'Notificaciones habilitadas'}
                    {permissionStatus === 'denied' && 'Notificaciones bloqueadas'}
                    {permissionStatus === 'default' && 'Notificaciones no configuradas'}
                  </div>
                  <div className="text-sm text-gray-600">
                    {permissionStatus === 'granted' && 'Recibirás notificaciones push en este dispositivo'}
                    {permissionStatus === 'denied' && 'Las notificaciones están bloqueadas en tu navegador'}
                    {permissionStatus === 'default' && 'Haz clic en "Habilitar" para recibir notificaciones'}
                  </div>
                </div>
              </div>

              <div className="flex gap-2">
                {permissionStatus !== 'granted' && (
                  <Button onClick={requestNotificationPermission}>
                    <Bell className="w-4 h-4 mr-2" />
                    Habilitar
                  </Button>
                )}

                {firebaseToken && (
                  <Button
                    variant="outline"
                    onClick={handleSendTestNotification}
                    disabled={testNotificationSent}
                  >
                    <TestTube className="w-4 h-4 mr-2" />
                    {testNotificationSent ? 'Enviada' : 'Probar'}
                  </Button>
                )}
              </div>
            </div>

            {testNotificationSent && (
              <Alert className="mt-4">
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>
                  ¡Notificación de prueba enviada! Revisa tu dispositivo.
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>

        {/* Configuración General */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="w-5 h-5" />
              Configuración General
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-base">Notificaciones habilitadas</Label>
                <div className="text-sm text-gray-600">
                  Activa o desactiva todas las notificaciones push
                </div>
              </div>
              <Switch
                checked={settings?.enabled || false}
                onCheckedChange={(checked) =>
                  setSettings(prev => prev ? { ...prev, enabled: checked } : null)
                }
              />
            </div>

            <Separator />

            {/* Horas de Silencio */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-base flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    Horas de silencio
                  </Label>
                  <div className="text-sm text-gray-600">
                    No recibir notificaciones durante estas horas
                  </div>
                </div>
                <Switch
                  checked={settings?.quietHours.enabled || false}
                  onCheckedChange={(checked) =>
                    setSettings(prev => prev ? {
                      ...prev,
                      quietHours: { ...prev.quietHours, enabled: checked }
                    } : null)
                  }
                />
              </div>

              {settings?.quietHours.enabled && (
                <div className="grid grid-cols-2 gap-4 pl-6">
                  <div>
                    <Label htmlFor="quiet-start">Hora de inicio</Label>
                    <Input
                      id="quiet-start"
                      type="time"
                      value={settings.quietHours.start}
                      onChange={(e) => updateQuietHours('start', e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="quiet-end">Hora de fin</Label>
                    <Input
                      id="quiet-end"
                      type="time"
                      value={settings.quietHours.end}
                      onChange={(e) => updateQuietHours('end', e.target.value)}
                    />
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Categorías de Notificaciones */}
        <Card>
          <CardHeader>
            <CardTitle>Categorías de Notificaciones</CardTitle>
            <CardDescription>
              Elige qué tipos de notificaciones quieres recibir
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {categories.map((category) => {
                const IconComponent = category.icon;
                return (
                  <div key={category.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                        <IconComponent className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <div className="font-medium">{category.name}</div>
                        <div className="text-sm text-gray-600">{category.description}</div>
                      </div>
                    </div>
                    <Switch
                      checked={category.enabled}
                      onCheckedChange={(checked) => updateCategorySetting(category.id, checked)}
                      disabled={!settings?.enabled}
                    />
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Información Adicional */}
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="pt-6">
            <div className="flex items-start gap-4">
              <Bell className="w-6 h-6 text-blue-600 mt-0.5" />
              <div>
                <h4 className="font-medium text-blue-900 mb-2">
                  ¿Cómo funcionan las notificaciones?
                </h4>
                <div className="text-sm text-blue-800 space-y-1">
                  <p>• Las notificaciones push llegan instantáneamente a tu dispositivo</p>
                  <p>• Respeta tus horas de silencio configuradas</p>
                  <p>• Puedes personalizar qué tipos de notificaciones recibir</p>
                  <p>• Las notificaciones importantes (como pagos) tienen mayor prioridad</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Botón de Guardar */}
        <div className="flex justify-end">
          <Button
            onClick={handleSaveSettings}
            disabled={saving}
            size="lg"
            className="bg-blue-600 hover:bg-blue-700"
          >
            {saving ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Guardando...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Guardar Configuración
              </>
            )}
          </Button>
        </div>
      </div>
    </EnhancedDashboardLayout>
  );
}

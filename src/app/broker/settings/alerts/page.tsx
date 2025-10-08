'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
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
  MessageSquare,
  Smartphone,
  TrendingDown,
  TrendingUp,
  AlertTriangle,
  Save,
  ArrowLeft,
} from 'lucide-react';
import Link from 'next/link';
import { logger } from '@/lib/logger';
import { User } from '@/types';

interface AlertSettings {
  // Performance Alerts
  lowViewsAlert: boolean;
  lowInquiriesAlert: boolean;
  lowConversionAlert: boolean;
  slowResponseAlert: boolean;

  // Thresholds
  viewsThreshold: number;
  inquiriesThreshold: number;
  conversionThreshold: number;
  responseTimeThreshold: number;

  // Communication Preferences
  emailAlerts: boolean;
  pushAlerts: boolean;
  smsAlerts: boolean;

  // Frequency
  alertFrequency: 'immediate' | 'daily' | 'weekly';

  // Maintenance Alerts
  maintenanceDueAlert: boolean;
  contractExpiryAlert: boolean;
  paymentReminderAlert: boolean;
}

export default function BrokerAlertsSettingsPage() {
  const [user, setUser] = useState<User | null>(null);
  const [settings, setSettings] = useState<AlertSettings>({
    // Performance Alerts
    lowViewsAlert: true,
    lowInquiriesAlert: true,
    lowConversionAlert: true,
    slowResponseAlert: true,

    // Thresholds
    viewsThreshold: 50,
    inquiriesThreshold: 5,
    conversionThreshold: 5,
    responseTimeThreshold: 2,

    // Communication Preferences
    emailAlerts: true,
    pushAlerts: true,
    smsAlerts: false,

    // Frequency
    alertFrequency: 'daily',

    // Maintenance Alerts
    maintenanceDueAlert: true,
    contractExpiryAlert: true,
    paymentReminderAlert: true,
  });
  const [loading, setLoading] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    const loadUserData = async () => {
      try {
        const response = await fetch('/api/auth/me');
        if (response.ok) {
          const data = await response.json();
          setUser(data.user);
        }
      } catch (error) {
        logger.error('Error loading user data:', { error });
      }
    };

    const loadAlertSettings = async () => {
      try {
        const response = await fetch('/api/broker/settings/alerts');
        if (response.ok) {
          const data = await response.json();
          setSettings(prev => ({ ...prev, ...data.settings }));
        }
      } catch (error) {
        logger.error('Error loading alert settings:', { error });
        // Continue with default settings
      }
    };

    loadUserData();
    loadAlertSettings();
  }, []);

  const handleSaveSettings = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/broker/settings/alerts', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ settings }),
      });

      if (response.ok) {
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
      } else {
        alert('Error al guardar configuración');
      }
    } catch (error) {
      logger.error('Error saving alert settings:', { error });
      alert('Error al guardar configuración');
    } finally {
      setLoading(false);
    }
  };

  const updateSetting = (key: keyof AlertSettings, value: any) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  return (
    <UnifiedDashboardLayout
      title="Configuración de Alertas"
      subtitle="Personaliza las notificaciones y alertas de rendimiento"
    >
      <div className="container mx-auto px-4 py-6 max-w-4xl">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Link href="/broker/analytics">
            <Button variant="outline" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Volver a Analytics
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Configuración de Alertas</h1>
            <p className="text-gray-600">Personaliza cuándo y cómo recibir notificaciones</p>
          </div>
        </div>

        {/* Success Message */}
        {saveSuccess && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-3">
            <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
              <span className="text-white text-xs">✓</span>
            </div>
            <span className="text-green-800">Configuración guardada correctamente</span>
          </div>
        )}

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Performance Alerts */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-blue-600" />
                Alertas de Rendimiento
              </CardTitle>
              <CardDescription>
                Recibe notificaciones cuando tus métricas bajen de lo esperado
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="lowViewsAlert">Alertas de bajas vistas</Label>
                  <p className="text-sm text-gray-500">Notificar cuando las vistas bajen</p>
                </div>
                <Switch
                  id="lowViewsAlert"
                  checked={settings.lowViewsAlert}
                  onCheckedChange={checked => updateSetting('lowViewsAlert', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="lowInquiriesAlert">Alertas de bajas consultas</Label>
                  <p className="text-sm text-gray-500">Notificar cuando las consultas bajen</p>
                </div>
                <Switch
                  id="lowInquiriesAlert"
                  checked={settings.lowInquiriesAlert}
                  onCheckedChange={checked => updateSetting('lowInquiriesAlert', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="lowConversionAlert">Alertas de baja conversión</Label>
                  <p className="text-sm text-gray-500">Notificar cuando la conversión baje</p>
                </div>
                <Switch
                  id="lowConversionAlert"
                  checked={settings.lowConversionAlert}
                  onCheckedChange={checked => updateSetting('lowConversionAlert', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="slowResponseAlert">Alertas de respuesta lenta</Label>
                  <p className="text-sm text-gray-500">Notificar cuando tardes en responder</p>
                </div>
                <Switch
                  id="slowResponseAlert"
                  checked={settings.slowResponseAlert}
                  onCheckedChange={checked => updateSetting('slowResponseAlert', checked)}
                />
              </div>
            </CardContent>
          </Card>

          {/* Threshold Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-orange-600" />
                Umbrales de Alerta
              </CardTitle>
              <CardDescription>Define los valores mínimos para activar alertas</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="viewsThreshold">Umbral de vistas mensuales</Label>
                <Input
                  id="viewsThreshold"
                  type="number"
                  value={settings.viewsThreshold}
                  onChange={e => updateSetting('viewsThreshold', parseInt(e.target.value) || 0)}
                  className="mt-1"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Mínimo de vistas por mes para no alertar
                </p>
              </div>

              <div>
                <Label htmlFor="inquiriesThreshold">Umbral de consultas semanales</Label>
                <Input
                  id="inquiriesThreshold"
                  type="number"
                  value={settings.inquiriesThreshold}
                  onChange={e => updateSetting('inquiriesThreshold', parseInt(e.target.value) || 0)}
                  className="mt-1"
                />
                <p className="text-xs text-gray-500 mt-1">Mínimo de consultas por semana</p>
              </div>

              <div>
                <Label htmlFor="conversionThreshold">Umbral de conversión (%)</Label>
                <Input
                  id="conversionThreshold"
                  type="number"
                  value={settings.conversionThreshold}
                  onChange={e =>
                    updateSetting('conversionThreshold', parseFloat(e.target.value) || 0)
                  }
                  className="mt-1"
                />
                <p className="text-xs text-gray-500 mt-1">Porcentaje mínimo de conversión</p>
              </div>

              <div>
                <Label htmlFor="responseTimeThreshold">Tiempo máximo de respuesta (horas)</Label>
                <Input
                  id="responseTimeThreshold"
                  type="number"
                  value={settings.responseTimeThreshold}
                  onChange={e =>
                    updateSetting('responseTimeThreshold', parseFloat(e.target.value) || 0)
                  }
                  className="mt-1"
                />
                <p className="text-xs text-gray-500 mt-1">Tiempo máximo para responder consultas</p>
              </div>
            </CardContent>
          </Card>

          {/* Communication Preferences */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="w-5 h-5 text-green-600" />
                Preferencias de Comunicación
              </CardTitle>
              <CardDescription>Elige cómo quieres recibir las alertas</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-blue-600" />
                  <Label htmlFor="emailAlerts">Notificaciones por email</Label>
                </div>
                <Switch
                  id="emailAlerts"
                  checked={settings.emailAlerts}
                  onCheckedChange={checked => updateSetting('emailAlerts', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Smartphone className="w-4 h-4 text-purple-600" />
                  <Label htmlFor="pushAlerts">Notificaciones push</Label>
                </div>
                <Switch
                  id="pushAlerts"
                  checked={settings.pushAlerts}
                  onCheckedChange={checked => updateSetting('pushAlerts', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-green-600" />
                  <Label htmlFor="smsAlerts">Mensajes SMS</Label>
                </div>
                <Switch
                  id="smsAlerts"
                  checked={settings.smsAlerts}
                  onCheckedChange={checked => updateSetting('smsAlerts', checked)}
                />
              </div>
            </CardContent>
          </Card>

          {/* Alert Frequency */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="w-5 h-5 text-indigo-600" />
                Frecuencia de Alertas
              </CardTitle>
              <CardDescription>¿Cuándo quieres recibir las alertas?</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="alertFrequency">Frecuencia de alertas</Label>
                <Select
                  value={settings.alertFrequency}
                  onValueChange={(value: any) => updateSetting('alertFrequency', value)}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="immediate">Inmediatamente</SelectItem>
                    <SelectItem value="daily">Resumen diario</SelectItem>
                    <SelectItem value="weekly">Resumen semanal</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-3 pt-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="maintenanceDueAlert">Alertas de mantenimiento</Label>
                    <p className="text-sm text-gray-500">
                      Recordatorios de mantenimientos pendientes
                    </p>
                  </div>
                  <Switch
                    id="maintenanceDueAlert"
                    checked={settings.maintenanceDueAlert}
                    onCheckedChange={checked => updateSetting('maintenanceDueAlert', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="contractExpiryAlert">Vencimiento de contratos</Label>
                    <p className="text-sm text-gray-500">Alertas de contratos por vencer</p>
                  </div>
                  <Switch
                    id="contractExpiryAlert"
                    checked={settings.contractExpiryAlert}
                    onCheckedChange={checked => updateSetting('contractExpiryAlert', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="paymentReminderAlert">Recordatorios de pago</Label>
                    <p className="text-sm text-gray-500">Alertas de pagos pendientes</p>
                  </div>
                  <Switch
                    id="paymentReminderAlert"
                    checked={settings.paymentReminderAlert}
                    onCheckedChange={checked => updateSetting('paymentReminderAlert', checked)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Save Button */}
        <div className="mt-6 flex justify-end">
          <Button onClick={handleSaveSettings} disabled={loading}>
            <Save className="w-4 h-4 mr-2" />
            {loading ? 'Guardando...' : 'Guardar Configuración'}
          </Button>
        </div>

        {/* Help Text */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>💡 Consejos para las Alertas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm text-gray-600">
              <p>
                • <strong>Alertas inmediatas:</strong> Útiles para respuestas rápidas, pero pueden
                ser abrumadoras.
              </p>
              <p>
                • <strong>Resúmenes diarios:</strong> Recomendado para la mayoría de corredores.
                Recibe un resumen diario de todas las alertas.
              </p>
              <p>
                • <strong>Umbrales realistas:</strong> Ajusta los umbrales según tu volumen de
                negocio actual.
              </p>
              <p>
                • <strong>Múltiples canales:</strong> Activa email y push para no perderte alertas
                importantes.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </UnifiedDashboardLayout>
  );
}

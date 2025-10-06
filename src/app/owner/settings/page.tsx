'use client';

import React, { useState, useEffect } from 'react';
import { logger } from '@/lib/logger';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import UnifiedDashboardLayout from '@/components/layout/UnifiedDashboardLayout';
import {
  User,
  Bell,
  Shield,
  CreditCard,
  Mail,
  Phone,
  MapPin,
  Save,
  Eye,
  EyeOff,
  Key,
  CheckCircle,
  AlertTriangle,
} from 'lucide-react';
import { User as UserType } from '@/types';

interface OwnerSettings {
  profile: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    address: string;
    city: string;
    region: string;
    description: string;
  };
  notifications: {
    emailNotifications: boolean;
    paymentReminders: boolean;
    maintenanceAlerts: boolean;
    contractUpdates: boolean;
    marketingEmails: boolean;
  };
  security: {
    twoFactorEnabled: boolean;
    sessionTimeout: number;
    passwordLastChanged: string;
  };
  business: {
    taxId: string;
    businessType: string;
    commissionRate: number;
    paymentTerms: string;
  };
}

export default function OwnerSettingsPage() {
  const [user, setUser] = useState<UserType | null>(null);
  const [settings, setSettings] = useState<OwnerSettings>({
    profile: {
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      address: '',
      city: '',
      region: '',
      description: '',
    },
    notifications: {
      emailNotifications: true,
      paymentReminders: true,
      maintenanceAlerts: true,
      contractUpdates: true,
      marketingEmails: false,
    },
    security: {
      twoFactorEnabled: false,
      sessionTimeout: 30,
      passwordLastChanged: '',
    },
    business: {
      taxId: '',
      businessType: 'individual',
      commissionRate: 5.0,
      paymentTerms: '15 días',
    },
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('profile');
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);

        // Load user data
        const userResponse = await fetch('/api/auth/me');
        if (userResponse.ok) {
          const userData = await userResponse.json();
          setUser(userData.user);

          // Initialize settings with user data
          setSettings(prev => ({
            ...prev,
            profile: {
              ...prev.profile,
              firstName: userData.user.firstName || '',
              lastName: userData.user.lastName || '',
              email: userData.user.email || '',
              phone: userData.user.phone || '',
            },
          }));
        }

        // Load settings (mock for now)
        await loadSettings();
      } catch (error) {
        logger.error('Error loading data:', {
          error: error instanceof Error ? error.message : String(error),
        });
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const loadSettings = async () => {
    try {
      // Mock settings data - in real app this would come from API
      const mockSettings: Partial<OwnerSettings> = {
        profile: {
          firstName: 'Juan',
          lastName: 'P�rez',
          email: 'juan.perez@email.com',
          phone: '+56987654321',
          address: 'Av. Providencia 1234',
          city: 'Santiago',
          region: 'Metropolitana',
          description:
            'Propietario de propiedades residenciales con m�s de 10 a�os de experiencia.',
        },
        security: {
          twoFactorEnabled: false,
          sessionTimeout: 30,
          passwordLastChanged: '2024-01-15',
        },
        business: {
          taxId: '12.345.678-9',
          businessType: 'company',
          commissionRate: 5.0,
          paymentTerms: '30 d�as',
        },
      };

      setSettings(prev => ({
        ...prev,
        ...mockSettings,
        profile: { ...prev.profile, ...mockSettings.profile },
        security: { ...prev.security, ...mockSettings.security },
        business: { ...prev.business, ...mockSettings.business },
      }));
    } catch (error) {
      logger.error('Error loading settings:', {
        error: error instanceof Error ? error.message : String(error),
      });
    }
  };

  const handleSaveSettings = async () => {
    try {
      setSaving(true);

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));

      setSuccessMessage('Configuraci�n guardada exitosamente');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      logger.error('Error saving settings:', {
        error: error instanceof Error ? error.message : String(error),
      });
      setErrorMessage('Error al guardar la configuraci�n. Por favor, int�ntalo nuevamente.');
      setTimeout(() => setErrorMessage(''), 5000);
    } finally {
      setSaving(false);
    }
  };

  const updateProfile = (field: string, value: string) => {
    setSettings(prev => ({
      ...prev,
      profile: {
        ...prev.profile,
        [field]: value,
      },
    }));
  };

  const updateNotifications = (field: string, value: boolean) => {
    setSettings(prev => ({
      ...prev,
      notifications: {
        ...prev.notifications,
        [field]: value,
      },
    }));
  };

  const updateSecurity = (field: string, value: any) => {
    setSettings(prev => ({
      ...prev,
      security: {
        ...prev.security,
        [field]: value,
      },
    }));
  };

  const updateBusiness = (field: string, value: any) => {
    setSettings(prev => ({
      ...prev,
      business: {
        ...prev.business,
        [field]: value,
      },
    }));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando configuraci�n...</p>
        </div>
      </div>
    );
  }

  return (
    <UnifiedDashboardLayout
      title="Configuración"
      subtitle="Gestiona tu perfil y preferencias de propietario"
    >
      <div className="container mx-auto px-4 py-6 max-w-4xl">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Configuración</h1>
          <p className="text-gray-600">
            Administra tu perfil, preferencias de notificaciones y configuración de seguridad
          </p>
        </div>

        {/* Success Message */}
        {successMessage && (
          <Card className="mb-6 border-green-200 bg-green-50">
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
          <Card className="mb-6 border-red-200 bg-red-50">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <AlertTriangle className="w-5 h-5 text-red-600" />
                <span className="text-red-800">{errorMessage}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setErrorMessage('')}
                  className="ml-auto text-red-600 hover:text-red-800"
                >
                  �
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="profile">Perfil</TabsTrigger>
            <TabsTrigger value="notifications">Notificaciones</TabsTrigger>
            <TabsTrigger value="security">Seguridad</TabsTrigger>
            <TabsTrigger value="business">Negocio</TabsTrigger>
          </TabsList>

          {/* Profile Tab */}
          <TabsContent value="profile" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="w-5 h-5" />
                  Información Personal
                </CardTitle>
                <CardDescription>Actualiza tu información personal y de contacto</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="firstName">Nombre</Label>
                    <Input
                      id="firstName"
                      value={settings.profile.firstName}
                      onChange={e => updateProfile('firstName', e.target.value)}
                      placeholder="Tu nombre"
                    />
                  </div>
                  <div>
                    <Label htmlFor="lastName">Apellido</Label>
                    <Input
                      id="lastName"
                      value={settings.profile.lastName}
                      onChange={e => updateProfile('lastName', e.target.value)}
                      placeholder="Tu apellido"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="email">Correo Electrónico</Label>
                  <Input
                    id="email"
                    type="email"
                    value={settings.profile.email}
                    onChange={e => updateProfile('email', e.target.value)}
                    placeholder="tu@email.com"
                  />
                </div>

                <div>
                  <Label htmlFor="phone">Teléfono</Label>
                  <Input
                    id="phone"
                    value={settings.profile.phone}
                    onChange={e => updateProfile('phone', e.target.value)}
                    placeholder="+56 9 1234 5678"
                  />
                </div>

                <div>
                  <Label htmlFor="address">Dirección</Label>
                  <Input
                    id="address"
                    value={settings.profile.address}
                    onChange={e => updateProfile('address', e.target.value)}
                    placeholder="Tu dirección completa"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="city">Ciudad</Label>
                    <Input
                      id="city"
                      value={settings.profile.city}
                      onChange={e => updateProfile('city', e.target.value)}
                      placeholder="Ciudad"
                    />
                  </div>
                  <div>
                    <Label htmlFor="region">Región</Label>
                    <Select
                      value={settings.profile.region}
                      onValueChange={value => updateProfile('region', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona región" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Metropolitana">Metropolitana</SelectItem>
                        <SelectItem value="Valparaíso">Valparaíso</SelectItem>
                        <SelectItem value="Biobío">Biobío</SelectItem>
                        <SelectItem value="Maule">Maule</SelectItem>
                        <SelectItem value="Araucanía">Araucanía</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label htmlFor="description">Descripción</Label>
                  <Textarea
                    id="description"
                    value={settings.profile.description}
                    onChange={e => updateProfile('description', e.target.value)}
                    placeholder="Cuéntanos sobre ti y tu experiencia como propietario..."
                    rows={4}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Notifications Tab */}
          <TabsContent value="notifications" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="w-5 h-5" />
                  Preferencias de Notificaciones
                </CardTitle>
                <CardDescription>
                  Configura cómo y cuándo quieres recibir notificaciones
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="email-notifications">Notificaciones por Email</Label>
                    <p className="text-sm text-gray-600">
                      Recibe actualizaciones importantes por correo
                    </p>
                  </div>
                  <Switch
                    id="email-notifications"
                    checked={settings.notifications.emailNotifications}
                    onCheckedChange={checked => updateNotifications('emailNotifications', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="payment-reminders">Recordatorios de Pago</Label>
                    <p className="text-sm text-gray-600">Recibe alertas sobre pagos pendientes</p>
                  </div>
                  <Switch
                    id="payment-reminders"
                    checked={settings.notifications.paymentReminders}
                    onCheckedChange={checked => updateNotifications('paymentReminders', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="maintenance-alerts">Alertas de Mantenimiento</Label>
                    <p className="text-sm text-gray-600">
                      Notificaciones sobre solicitudes de mantenimiento
                    </p>
                  </div>
                  <Switch
                    id="maintenance-alerts"
                    checked={settings.notifications.maintenanceAlerts}
                    onCheckedChange={checked => updateNotifications('maintenanceAlerts', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="contract-updates">Actualizaciones de Contratos</Label>
                    <p className="text-sm text-gray-600">Cambios en contratos y renovaciones</p>
                  </div>
                  <Switch
                    id="contract-updates"
                    checked={settings.notifications.contractUpdates}
                    onCheckedChange={checked => updateNotifications('contractUpdates', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="marketing-emails">Emails de Marketing</Label>
                    <p className="text-sm text-gray-600">Ofertas y novedades de Rent360</p>
                  </div>
                  <Switch
                    id="marketing-emails"
                    checked={settings.notifications.marketingEmails}
                    onCheckedChange={checked => updateNotifications('marketingEmails', checked)}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Security Tab */}
          <TabsContent value="security" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="w-5 h-5" />
                  Seguridad de la Cuenta
                </CardTitle>
                <CardDescription>Gestiona la seguridad de tu cuenta</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="two-factor">Autenticación de Dos Factores</Label>
                    <p className="text-sm text-gray-600">Añade una capa extra de seguridad</p>
                  </div>
                  <Switch
                    id="two-factor"
                    checked={settings.security.twoFactorEnabled}
                    onCheckedChange={checked => updateSecurity('twoFactorEnabled', checked)}
                  />
                </div>

                <div>
                  <Label htmlFor="session-timeout">Tiempo de Sesión (minutos)</Label>
                  <Select
                    value={settings.security.sessionTimeout.toString()}
                    onValueChange={value => updateSecurity('sessionTimeout', parseInt(value))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="15">15 minutos</SelectItem>
                      <SelectItem value="30">30 minutos</SelectItem>
                      <SelectItem value="60">1 hora</SelectItem>
                      <SelectItem value="240">4 horas</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Último Cambio de Contraseña</Label>
                  <p className="text-sm text-gray-600">
                    {settings.security.passwordLastChanged
                      ? new Date(settings.security.passwordLastChanged).toLocaleDateString('es-CL')
                      : 'Nunca'}
                  </p>
                  <Button
                    variant="outline"
                    className="mt-2"
                    onClick={() => {
                      // Implementar cambio de contraseña
                      alert('Funcionalidad de cambio de contraseña próximamente disponible');
                    }}
                  >
                    <Key className="w-4 h-4 mr-2" />
                    Cambiar Contraseña
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Business Tab */}
          <TabsContent value="business" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="w-5 h-5" />
                  Información Empresarial
                </CardTitle>
                <CardDescription>Configura tu información fiscal y de negocio</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="tax-id">RUT / ID Fiscal</Label>
                  <Input
                    id="tax-id"
                    value={settings.business.taxId}
                    onChange={e => updateBusiness('taxId', e.target.value)}
                    placeholder="12.345.678-9"
                  />
                </div>

                <div>
                  <Label htmlFor="business-type">Tipo de Negocio</Label>
                  <Select
                    value={settings.business.businessType}
                    onValueChange={value => updateBusiness('businessType', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="individual">Persona Natural</SelectItem>
                      <SelectItem value="company">Empresa</SelectItem>
                      <SelectItem value="partnership">Sociedad</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="commission-rate">Tasa de Comisión (%)</Label>
                  <Input
                    id="commission-rate"
                    type="number"
                    step="0.1"
                    value={settings.business.commissionRate}
                    onChange={e =>
                      updateBusiness('commissionRate', parseFloat(e.target.value) || 0)
                    }
                    readOnly
                    className="bg-gray-50"
                  />
                  <p className="text-xs text-gray-600 mt-1">
                    Esta tasa es configurada por el administrador del sistema
                  </p>
                </div>

                <div>
                  <Label htmlFor="payment-terms">Términos de Pago</Label>
                  <Input
                    id="payment-terms"
                    value={settings.business.paymentTerms}
                    onChange={e => updateBusiness('paymentTerms', e.target.value)}
                    placeholder="Ej: 30 días"
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <div className="flex justify-end mt-6">
          <Button onClick={handleSaveSettings} disabled={saving}>
            {saving ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Guardando...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Guardar Cambios
              </>
            )}
          </Button>
        </div>
      </div>
    </UnifiedDashboardLayout>
  );
}

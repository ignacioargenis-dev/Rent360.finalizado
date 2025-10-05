'use client';

// Build fix - force update

import React, { useState, useEffect } from 'react';
import { logger } from '@/lib/logger';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import UnifiedDashboardLayout from '@/components/layout/UnifiedDashboardLayout';
import {
  User as UserIcon,
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
import type { User } from '@/types';

interface TenantSettings {
  profile: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    emergencyContact: string;
    emergencyPhone: string;
  };
  notifications: {
    emailNotifications: boolean;
    smsNotifications: boolean;
    maintenanceReminders: boolean;
    paymentReminders: boolean;
    leaseUpdates: boolean;
  };
  privacy: {
    profileVisibility: 'public' | 'private';
    contactInfoVisible: boolean;
    activityVisible: boolean;
  };
}

export default function TenantSettingsPage() {
  const [user, setUser] = useState<User | null>(null);
  const [settings, setSettings] = useState<TenantSettings>({
    profile: {
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      emergencyContact: '',
      emergencyPhone: '',
    },
    notifications: {
      emailNotifications: true,
      smsNotifications: false,
      maintenanceReminders: true,
      paymentReminders: true,
      leaseUpdates: true,
    },
    privacy: {
      profileVisibility: 'private',
      contactInfoVisible: false,
      activityVisible: false,
    },
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    const loadUserData = async () => {
      try {
        const response = await fetch('/api/auth/me');
        if (response.ok) {
          const data = await response.json();
          setUser(data.user);

          // Load settings from localStorage or API
          const savedSettings = localStorage.getItem('tenant-settings');
          if (savedSettings) {
            setSettings(JSON.parse(savedSettings));
          } else {
            // Initialize with user data
            setSettings(prev => ({
              ...prev,
              profile: {
                firstName: data.user?.firstName || '',
                lastName: data.user?.lastName || '',
                email: data.user?.email || '',
                phone: data.user?.phone || '',
                emergencyContact: '',
                emergencyPhone: '',
              },
            }));
          }
        }
      } catch (error) {
        logger.error('Error loading user data:', {
          error: error instanceof Error ? error.message : String(error),
        });
      } finally {
        setLoading(false);
      }
    };

    loadUserData();
  }, []);

  const handleSaveSettings = async () => {
    setSaving(true);
    setSuccessMessage('');
    setErrorMessage('');

    try {
      // Save to localStorage (in a real app, this would be an API call)
      localStorage.setItem('tenant-settings', JSON.stringify(settings));

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));

      setSuccessMessage('Configuración guardada exitosamente.');
    } catch (error) {
      logger.error('Error saving settings:', {
        error: error instanceof Error ? error.message : String(error),
      });
      setErrorMessage('Error al guardar la configuración. Intente nuevamente.');
    } finally {
      setSaving(false);
    }
  };

  const updateProfile = (field: keyof TenantSettings['profile'], value: string) => {
    setSettings(prev => ({
      ...prev,
      profile: {
        ...prev.profile,
        [field]: value,
      },
    }));
  };

  const updateNotifications = (field: keyof TenantSettings['notifications'], value: boolean) => {
    setSettings(prev => ({
      ...prev,
      notifications: {
        ...prev.notifications,
        [field]: value,
      },
    }));
  };

  const updatePrivacy = (
    field: keyof TenantSettings['privacy'],
    value: boolean | 'public' | 'private'
  ) => {
    setSettings(prev => ({
      ...prev,
      privacy: {
        ...prev.privacy,
        [field]: value,
      },
    }));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando configuración...</p>
        </div>
      </div>
    );
  }

  return (
    <UnifiedDashboardLayout title="Configuración" subtitle="Gestiona tu perfil y preferencias">
      <div className="container mx-auto px-4 py-6">
        {/* Success/Error Messages */}
        {successMessage && (
          <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-green-600" />
            <span className="text-green-800">{successMessage}</span>
          </div>
        )}

        {errorMessage && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-red-600" />
            <span className="text-red-800">{errorMessage}</span>
          </div>
        )}

        <Tabs defaultValue="profile" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="profile">Perfil</TabsTrigger>
            <TabsTrigger value="notifications">Notificaciones</TabsTrigger>
            <TabsTrigger value="privacy">Privacidad</TabsTrigger>
          </TabsList>

          {/* Profile Tab */}
          <TabsContent value="profile" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <UserIcon className="w-5 h-5" />
                  Información Personal
                </CardTitle>
                <CardDescription>
                  Actualiza tu información personal y datos de contacto
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">Nombre</Label>
                    <Input
                      id="firstName"
                      value={settings.profile.firstName}
                      onChange={e => updateProfile('firstName', e.target.value)}
                      placeholder="Ingresa tu nombre"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Apellido</Label>
                    <Input
                      id="lastName"
                      value={settings.profile.lastName}
                      onChange={e => updateProfile('lastName', e.target.value)}
                      placeholder="Ingresa tu apellido"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Correo Electrónico</Label>
                    <Input
                      id="email"
                      type="email"
                      value={settings.profile.email}
                      onChange={e => updateProfile('email', e.target.value)}
                      placeholder="tu@email.com"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Teléfono</Label>
                    <Input
                      id="phone"
                      value={settings.profile.phone}
                      onChange={e => updateProfile('phone', e.target.value)}
                      placeholder="+56 9 1234 5678"
                    />
                  </div>
                </div>

                <div className="pt-4 border-t">
                  <h3 className="text-lg font-medium mb-4 flex items-center gap-2">
                    <Shield className="w-5 h-5" />
                    Contacto de Emergencia
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="emergencyContact">Nombre del Contacto</Label>
                      <Input
                        id="emergencyContact"
                        value={settings.profile.emergencyContact}
                        onChange={e => updateProfile('emergencyContact', e.target.value)}
                        placeholder="Nombre del contacto de emergencia"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="emergencyPhone">Teléfono de Emergencia</Label>
                      <Input
                        id="emergencyPhone"
                        value={settings.profile.emergencyPhone}
                        onChange={e => updateProfile('emergencyPhone', e.target.value)}
                        placeholder="+56 9 1234 5678"
                      />
                    </div>
                  </div>
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
                  Controla cómo y cuándo quieres recibir notificaciones
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <Label htmlFor="email-notifications">Notificaciones por Email</Label>
                      <p className="text-sm text-gray-600">
                        Recibe actualizaciones importantes por correo electrónico
                      </p>
                    </div>
                    <Switch
                      id="email-notifications"
                      checked={settings.notifications.emailNotifications}
                      onCheckedChange={checked =>
                        updateNotifications('emailNotifications', checked)
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <Label htmlFor="sms-notifications">Notificaciones por SMS</Label>
                      <p className="text-sm text-gray-600">
                        Recibe alertas urgentes por mensaje de texto
                      </p>
                    </div>
                    <Switch
                      id="sms-notifications"
                      checked={settings.notifications.smsNotifications}
                      onCheckedChange={checked => updateNotifications('smsNotifications', checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <Label htmlFor="maintenance-reminders">Recordatorios de Mantenimiento</Label>
                      <p className="text-sm text-gray-600">
                        Recibe recordatorios sobre mantenimientos programados
                      </p>
                    </div>
                    <Switch
                      id="maintenance-reminders"
                      checked={settings.notifications.maintenanceReminders}
                      onCheckedChange={checked =>
                        updateNotifications('maintenanceReminders', checked)
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <Label htmlFor="payment-reminders">Recordatorios de Pago</Label>
                      <p className="text-sm text-gray-600">
                        Recibe notificaciones sobre fechas de pago próximas
                      </p>
                    </div>
                    <Switch
                      id="payment-reminders"
                      checked={settings.notifications.paymentReminders}
                      onCheckedChange={checked => updateNotifications('paymentReminders', checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <Label htmlFor="lease-updates">Actualizaciones de Contrato</Label>
                      <p className="text-sm text-gray-600">
                        Recibe notificaciones sobre cambios en tu contrato de arrendamiento
                      </p>
                    </div>
                    <Switch
                      id="lease-updates"
                      checked={settings.notifications.leaseUpdates}
                      onCheckedChange={checked => updateNotifications('leaseUpdates', checked)}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Privacy Tab */}
          <TabsContent value="privacy" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="w-5 h-5" />
                  Configuración de Privacidad
                </CardTitle>
                <CardDescription>
                  Controla la visibilidad de tu información personal
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="space-y-3">
                    <Label>Visibilidad del Perfil</Label>
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <input
                          type="radio"
                          id="private"
                          name="profileVisibility"
                          value="private"
                          checked={settings.privacy.profileVisibility === 'private'}
                          onChange={e =>
                            updatePrivacy(
                              'profileVisibility',
                              e.target.value as 'public' | 'private'
                            )
                          }
                          className="w-4 h-4 text-blue-600"
                        />
                        <Label htmlFor="private" className="text-sm">
                          <strong>Privado</strong> - Solo tú puedes ver tu perfil completo
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <input
                          type="radio"
                          id="public"
                          name="profileVisibility"
                          value="public"
                          checked={settings.privacy.profileVisibility === 'public'}
                          onChange={e =>
                            updatePrivacy(
                              'profileVisibility',
                              e.target.value as 'public' | 'private'
                            )
                          }
                          className="w-4 h-4 text-blue-600"
                        />
                        <Label htmlFor="public" className="text-sm">
                          <strong>Público</strong> - Tu perfil es visible para propietarios
                        </Label>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t">
                    <div className="space-y-1">
                      <Label htmlFor="contact-visible">Información de Contacto Visible</Label>
                      <p className="text-sm text-gray-600">
                        Permite que los propietarios vean tu información de contacto
                      </p>
                    </div>
                    <Switch
                      id="contact-visible"
                      checked={settings.privacy.contactInfoVisible}
                      onCheckedChange={checked => updatePrivacy('contactInfoVisible', checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <Label htmlFor="activity-visible">Actividad Visible</Label>
                      <p className="text-sm text-gray-600">
                        Muestra tu historial de actividades a otros usuarios
                      </p>
                    </div>
                    <Switch
                      id="activity-visible"
                      checked={settings.privacy.activityVisible}
                      onCheckedChange={checked => updatePrivacy('activityVisible', checked)}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Save Button */}
        <div className="flex justify-end pt-6">
          <Button onClick={handleSaveSettings} disabled={saving}>
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
    </UnifiedDashboardLayout>
  );
}

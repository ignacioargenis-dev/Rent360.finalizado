'use client';

import React, { useState, useEffect } from 'react';
import { logger } from '@/lib/logger';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertCircle,
  Save,
  User,
  Bell,
  Shield,
  CreditCard,
  Wrench,
  Clock,
  MapPin,
  DollarSign,
  CheckCircle,
} from 'lucide-react';
import UnifiedDashboardLayout from '@/components/layout/UnifiedDashboardLayout';
import { QuickActionButton } from '@/components/dashboard/QuickActionButton';

interface MaintenanceSettings {
  // Profile settings
  companyName: string;
  description: string;
  phone: string;
  email: string;
  website: string;

  // Service settings
  specialties: string[];
  workingHours: {
    monday: { start: string; end: string; enabled: boolean };
    tuesday: { start: string; end: string; enabled: boolean };
    wednesday: { start: string; end: string; enabled: boolean };
    thursday: { start: string; end: string; enabled: boolean };
    friday: { start: string; end: string; enabled: boolean };
    saturday: { start: string; end: string; enabled: boolean };
    sunday: { start: string; end: string; enabled: boolean };
  };

  // Business settings
  serviceRadius: number;
  emergencyService: boolean;
  insuranceCoverage: boolean;

  // Notification settings
  emailNotifications: boolean;
  smsNotifications: boolean;
  pushNotifications: boolean;

  // Payment settings
  paymentMethods: string[];
  minimumJobValue: number;
  depositRequired: boolean;
  depositPercentage: number;
}

export default function MaintenanceSettingsPage() {
  const [settings, setSettings] = useState<MaintenanceSettings>({
    companyName: 'Servicios de Mantenimiento XYZ',
    description:
      'Especialistas en reparaciones y mantenimiento de propiedades residenciales y comerciales.',
    phone: '+56912345678',
    email: 'contacto@mantenimiento.cl',
    website: 'https://mantenimiento.cl',

    specialties: ['plumbing', 'electrical', 'cleaning'],
    workingHours: {
      monday: { start: '08:00', end: '18:00', enabled: true },
      tuesday: { start: '08:00', end: '18:00', enabled: true },
      wednesday: { start: '08:00', end: '18:00', enabled: true },
      thursday: { start: '08:00', end: '18:00', enabled: true },
      friday: { start: '08:00', end: '18:00', enabled: true },
      saturday: { start: '09:00', end: '14:00', enabled: true },
      sunday: { start: '', end: '', enabled: false },
    },

    serviceRadius: 25,
    emergencyService: true,
    insuranceCoverage: true,

    emailNotifications: true,
    smsNotifications: false,
    pushNotifications: true,

    paymentMethods: ['cash', 'bank_transfer', 'credit_card'],
    minimumJobValue: 15000,
    depositRequired: true,
    depositPercentage: 30,
  });

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('profile');

  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const handleSave = async () => {
    try {
      setSaving(true);

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));

      setSuccessMessage('Configuración guardada exitosamente');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      logger.error('Error saving settings:', {
        error: error instanceof Error ? error.message : String(error),
      });
      setErrorMessage('Error al guardar la configuración. Por favor, inténtalo nuevamente.');
      setTimeout(() => setErrorMessage(''), 5000);
    } finally {
      setSaving(false);
    }
  };

  const updateSetting = (key: string, value: any) => {
    setSettings(prev => ({
      ...prev,
      [key]: value,
    }));
  };

  const updateWorkingHour = (day: string, field: string, value: any) => {
    setSettings(prev => ({
      ...prev,
      workingHours: {
        ...prev.workingHours,
        [day]: {
          ...prev.workingHours[day as keyof typeof prev.workingHours],
          [field]: value,
        },
      },
    }));
  };

  const toggleSpecialty = (specialty: string) => {
    setSettings(prev => ({
      ...prev,
      specialties: prev.specialties.includes(specialty)
        ? prev.specialties.filter(s => s !== specialty)
        : [...prev.specialties, specialty],
    }));
  };

  const togglePaymentMethod = (method: string) => {
    setSettings(prev => ({
      ...prev,
      paymentMethods: prev.paymentMethods.includes(method)
        ? prev.paymentMethods.filter(m => m !== method)
        : [...prev.paymentMethods, method],
    }));
  };

  return (
    <UnifiedDashboardLayout
      title="Configuración"
      subtitle="Personaliza tu perfil y preferencias de servicio"
    >
      <div className="space-y-6">
        {/* Success Message */}
        {successMessage && (
          <Card className="border-green-200 bg-green-50">
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
          <Card className="border-red-200 bg-red-50">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <AlertCircle className="w-5 h-5 text-red-600" />
                <span className="text-red-800">{errorMessage}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setErrorMessage('')}
                  className="ml-auto text-red-600 hover:text-red-800"
                >
                  ×
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="profile">Perfil</TabsTrigger>
            <TabsTrigger value="services">Servicios</TabsTrigger>
            <TabsTrigger value="schedule">Horarios</TabsTrigger>
            <TabsTrigger value="notifications">Notificaciones</TabsTrigger>
            <TabsTrigger value="payments">Pagos</TabsTrigger>
          </TabsList>

          {/* Profile Tab */}
          <TabsContent value="profile" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="w-5 h-5" />
                  Información del Perfil
                </CardTitle>
                <CardDescription>Información básica de tu empresa de mantenimiento</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="companyName">Nombre de la Empresa</Label>
                    <Input
                      id="companyName"
                      value={settings.companyName}
                      onChange={e => updateSetting('companyName', e.target.value)}
                    />
                  </div>

                  <div>
                    <Label htmlFor="phone">Teléfono</Label>
                    <Input
                      id="phone"
                      value={settings.phone}
                      onChange={e => updateSetting('phone', e.target.value)}
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={settings.email}
                    onChange={e => updateSetting('email', e.target.value)}
                  />
                </div>

                <div>
                  <Label htmlFor="website">Sitio Web</Label>
                  <Input
                    id="website"
                    value={settings.website}
                    onChange={e => updateSetting('website', e.target.value)}
                  />
                </div>

                <div>
                  <Label htmlFor="description">Descripción</Label>
                  <Textarea
                    id="description"
                    value={settings.description}
                    onChange={e => updateSetting('description', e.target.value)}
                    rows={3}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Services Tab */}
          <TabsContent value="services" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Wrench className="w-5 h-5" />
                  Especialidades y Servicios
                </CardTitle>
                <CardDescription>Configura las especialidades que ofreces</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {[
                    { id: 'plumbing', label: 'Plomería' },
                    { id: 'electrical', label: 'Eléctrica' },
                    { id: 'structural', label: 'Estructural' },
                    { id: 'cleaning', label: 'Limpieza' },
                    { id: 'painting', label: 'Pintura' },
                    { id: 'carpentry', label: 'Carpintería' },
                  ].map(specialty => (
                    <div key={specialty.id} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id={specialty.id}
                        checked={settings.specialties.includes(specialty.id)}
                        onChange={() => toggleSpecialty(specialty.id)}
                        className="rounded"
                      />
                      <Label htmlFor={specialty.id}>{specialty.label}</Label>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="w-5 h-5" />
                  Área de Servicio
                </CardTitle>
                <CardDescription>
                  Configura tu radio de servicio y opciones adicionales
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="serviceRadius">Radio de Servicio (km)</Label>
                  <Input
                    id="serviceRadius"
                    type="number"
                    value={settings.serviceRadius}
                    onChange={e => updateSetting('serviceRadius', parseInt(e.target.value))}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="emergencyService">Servicio de Emergencia 24/7</Label>
                    <p className="text-sm text-gray-600">Disponible para reparaciones urgentes</p>
                  </div>
                  <Switch
                    id="emergencyService"
                    checked={settings.emergencyService}
                    onCheckedChange={checked => updateSetting('emergencyService', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="insuranceCoverage">Cobertura de Seguro</Label>
                    <p className="text-sm text-gray-600">Trabajos con seguro de responsabilidad</p>
                  </div>
                  <Switch
                    id="insuranceCoverage"
                    checked={settings.insuranceCoverage}
                    onCheckedChange={checked => updateSetting('insuranceCoverage', checked)}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Schedule Tab */}
          <TabsContent value="schedule" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="w-5 h-5" />
                  Horarios de Trabajo
                </CardTitle>
                <CardDescription>Configura tus horarios de atención</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {Object.entries(settings.workingHours).map(([day, hours]) => (
                    <div key={day} className="flex items-center gap-4 p-4 border rounded-lg">
                      <div className="w-20 capitalize">{day}</div>
                      <Switch
                        checked={hours.enabled}
                        onCheckedChange={checked => updateWorkingHour(day, 'enabled', checked)}
                      />
                      {hours.enabled && (
                        <>
                          <Input
                            type="time"
                            value={hours.start}
                            onChange={e => updateWorkingHour(day, 'start', e.target.value)}
                            className="w-32"
                          />
                          <span>a</span>
                          <Input
                            type="time"
                            value={hours.end}
                            onChange={e => updateWorkingHour(day, 'end', e.target.value)}
                            className="w-32"
                          />
                        </>
                      )}
                    </div>
                  ))}
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
                <CardDescription>Configura cómo quieres recibir notificaciones</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="emailNotifications">Notificaciones por Email</Label>
                    <p className="text-sm text-gray-600">
                      Recibe actualizaciones por correo electrónico
                    </p>
                  </div>
                  <Switch
                    id="emailNotifications"
                    checked={settings.emailNotifications}
                    onCheckedChange={checked => updateSetting('emailNotifications', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="smsNotifications">Notificaciones por SMS</Label>
                    <p className="text-sm text-gray-600">
                      Recibe alertas importantes por mensaje de texto
                    </p>
                  </div>
                  <Switch
                    id="smsNotifications"
                    checked={settings.smsNotifications}
                    onCheckedChange={checked => updateSetting('smsNotifications', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="pushNotifications">Notificaciones Push</Label>
                    <p className="text-sm text-gray-600">Recibe notificaciones en la aplicación</p>
                  </div>
                  <Switch
                    id="pushNotifications"
                    checked={settings.pushNotifications}
                    onCheckedChange={checked => updateSetting('pushNotifications', checked)}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Payments Tab */}
          <TabsContent value="payments" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="w-5 h-5" />
                  Configuración de Pagos
                </CardTitle>
                <CardDescription>Gestiona métodos de pago y políticas de cobro</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Métodos de Pago Aceptados</Label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-2">
                    {[
                      { id: 'cash', label: 'Efectivo' },
                      { id: 'bank_transfer', label: 'Transferencia' },
                      { id: 'credit_card', label: 'Tarjeta de Crédito' },
                      { id: 'debit_card', label: 'Tarjeta de Débito' },
                      { id: 'check', label: 'Cheque' },
                    ].map(method => (
                      <div key={method.id} className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id={method.id}
                          checked={settings.paymentMethods.includes(method.id)}
                          onChange={() => togglePaymentMethod(method.id)}
                          className="rounded"
                        />
                        <Label htmlFor={method.id}>{method.label}</Label>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="minimumJobValue">Valor Mínimo de Trabajo</Label>
                    <Input
                      id="minimumJobValue"
                      type="number"
                      value={settings.minimumJobValue}
                      onChange={e => updateSetting('minimumJobValue', parseInt(e.target.value))}
                    />
                  </div>

                  <div>
                    <Label htmlFor="depositPercentage">Porcentaje de Anticipo (%)</Label>
                    <Input
                      id="depositPercentage"
                      type="number"
                      value={settings.depositPercentage}
                      onChange={e => updateSetting('depositPercentage', parseInt(e.target.value))}
                      disabled={!settings.depositRequired}
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="depositRequired">Requiere Anticipo</Label>
                    <p className="text-sm text-gray-600">Solicitar pago anticipado para trabajos</p>
                  </div>
                  <Switch
                    id="depositRequired"
                    checked={settings.depositRequired}
                    onCheckedChange={checked => updateSetting('depositRequired', checked)}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Save Button */}
        <div className="flex justify-end">
          <Button onClick={handleSave} disabled={saving}>
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

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Acciones Rápidas</CardTitle>
            <CardDescription>Herramientas adicionales de configuración</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <QuickActionButton
                icon={Shield}
                label="Privacidad"
                description="Configurar privacidad"
                onClick={() => {
                  setSuccessMessage('Configuración de privacidad próximamente disponible');
                  setTimeout(() => setSuccessMessage(''), 3000);
                }}
              />

              <QuickActionButton
                icon={CheckCircle}
                label="Verificación"
                description="Estado de verificación"
                onClick={() => {
                  setSuccessMessage('Cuenta verificada - Estado: Activo');
                  setTimeout(() => setSuccessMessage(''), 3000);
                }}
              />

              <QuickActionButton
                icon={DollarSign}
                label="Facturación"
                description="Configurar facturación"
                onClick={() => {
                  setSuccessMessage('Configuración de facturación próximamente disponible');
                  setTimeout(() => setSuccessMessage(''), 3000);
                }}
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </UnifiedDashboardLayout>
  );
}

'use client';

// Build fix - force update

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
import UnifiedDashboardLayout from '@/components/layout/UnifiedDashboardLayout';
import {
  User,
  MapPin,
  Clock,
  Car,
  Wrench,
  DollarSign,
  Bell,
  Save,
  Camera,
  Phone,
  Mail,
} from 'lucide-react';
import Link from 'next/link';
import { User as UserType } from '@/types';

interface RunnerSettings {
  personal: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    avatar?: string;
  };
  workArea: {
    regions: string[];
    maxDistance: number;
    preferredTimes: {
      morning: boolean;
      afternoon: boolean;
      evening: boolean;
      weekend: boolean;
    };
  };
  services: {
    emergency: boolean;
    maintenance: boolean;
    installation: boolean;
    repair: boolean;
    cleaning: boolean;
  };
  vehicle: {
    type: string;
    model: string;
    year: number;
    licensePlate: string;
    tools: string[];
  };
  notifications: {
    newJobs: boolean;
    jobUpdates: boolean;
    payments: boolean;
    messages: boolean;
    marketing: boolean;
  };
  payment: {
    bankAccount: string;
    paymentMethod: 'transfer' | 'cash' | 'wallet';
    taxId: string;
  };
}

export default function RunnerSettingsPage() {
  const [user, setUser] = useState<UserType | null>(null);
  const [settings, setSettings] = useState<RunnerSettings>({
    personal: {
      firstName: 'Juan',
      lastName: 'Pérez',
      email: 'juan.perez@ejemplo.com',
      phone: '+56912345678',
      avatar: '',
    },
    workArea: {
      regions: ['Santiago Centro', 'Providencia', 'Las Condes'],
      maxDistance: 25,
      preferredTimes: {
        morning: true,
        afternoon: true,
        evening: false,
        weekend: true,
      },
    },
    services: {
      emergency: true,
      maintenance: true,
      installation: true,
      repair: true,
      cleaning: false,
    },
    vehicle: {
      type: 'Camioneta',
      model: 'Toyota Hilux',
      year: 2020,
      licensePlate: 'AB-CD-12',
      tools: ['Llaves Allen', 'Destornilladores', 'Multímetro', 'Soldador'],
    },
    notifications: {
      newJobs: true,
      jobUpdates: true,
      payments: true,
      messages: true,
      marketing: false,
    },
    payment: {
      bankAccount: '001234567890',
      paymentMethod: 'transfer',
      taxId: '12.345.678-9',
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

    const loadSettingsData = async () => {
      try {
        // Mock settings loading - in real app, this would come from API
        setLoading(false);
      } catch (error) {
        logger.error('Error loading settings data:', {
          error: error instanceof Error ? error.message : String(error),
        });
        setLoading(false);
      }
    };

    loadUserData();
    loadSettingsData();
  }, []);

  const handleSaveSettings = async () => {
    setSaving(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      alert('Configuración guardada exitosamente');
    } catch (error) {
      logger.error('Error saving settings:', {
        error: error instanceof Error ? error.message : String(error),
      });
      alert('Error al guardar la configuración');
    } finally {
      setSaving(false);
    }
  };

  const updatePersonalInfo = (field: keyof RunnerSettings['personal'], value: string) => {
    setSettings(prev => ({
      ...prev,
      personal: {
        ...prev.personal,
        [field]: value,
      },
    }));
  };

  const updateWorkArea = (field: keyof RunnerSettings['workArea'], value: any) => {
    setSettings(prev => ({
      ...prev,
      workArea: {
        ...prev.workArea,
        [field]: value,
      },
    }));
  };

  const updateServices = (field: keyof RunnerSettings['services'], value: boolean) => {
    setSettings(prev => ({
      ...prev,
      services: {
        ...prev.services,
        [field]: value,
      },
    }));
  };

  const updateVehicle = (field: keyof RunnerSettings['vehicle'], value: any) => {
    setSettings(prev => ({
      ...prev,
      vehicle: {
        ...prev.vehicle,
        [field]: value,
      },
    }));
  };

  const updateNotifications = (field: keyof RunnerSettings['notifications'], value: boolean) => {
    setSettings(prev => ({
      ...prev,
      notifications: {
        ...prev.notifications,
        [field]: value,
      },
    }));
  };

  const updatePayment = (field: keyof RunnerSettings['payment'], value: string) => {
    setSettings(prev => ({
      ...prev,
      payment: {
        ...prev.payment,
        [field]: value,
      },
    }));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando configuración del corredor...</p>
        </div>
      </div>
    );
  }

  return (
    <UnifiedDashboardLayout
      title="Configuración del Corredor"
      subtitle="Gestión de perfil y preferencias"
    >
      <div className="container mx-auto px-4 py-6">
        {/* Header with actions */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-6 gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Configuración del Corredor</h1>
            <p className="text-gray-600">Personaliza tu perfil y preferencias de trabajo</p>
          </div>
          <Button onClick={handleSaveSettings} disabled={saving}>
            <Save className="w-4 h-4 mr-2" />
            {saving ? 'Guardando...' : 'Guardar Cambios'}
          </Button>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Personal Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5" />
                Información Personal
              </CardTitle>
              <CardDescription>Datos básicos de contacto y perfil</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="firstName">Nombre</Label>
                  <Input
                    id="firstName"
                    value={settings.personal.firstName}
                    onChange={e => updatePersonalInfo('firstName', e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="lastName">Apellido</Label>
                  <Input
                    id="lastName"
                    value={settings.personal.lastName}
                    onChange={e => updatePersonalInfo('lastName', e.target.value)}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="email">Correo electrónico</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    id="email"
                    type="email"
                    className="pl-10"
                    value={settings.personal.email}
                    onChange={e => updatePersonalInfo('email', e.target.value)}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="phone">Teléfono</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    id="phone"
                    className="pl-10"
                    value={settings.personal.phone}
                    onChange={e => updatePersonalInfo('phone', e.target.value)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Work Area */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="w-5 h-5" />
                Área de Trabajo
              </CardTitle>
              <CardDescription>Define tu zona de cobertura y disponibilidad</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Regiones de cobertura</Label>
                <Textarea
                  placeholder="Ej: Santiago Centro, Providencia, Las Condes"
                  value={settings.workArea.regions.join(', ')}
                  onChange={e =>
                    updateWorkArea(
                      'regions',
                      e.target.value.split(',').map(r => r.trim())
                    )
                  }
                />
              </div>

              <div>
                <Label htmlFor="maxDistance">Distancia máxima (km)</Label>
                <Input
                  id="maxDistance"
                  type="number"
                  value={settings.workArea.maxDistance}
                  onChange={e => updateWorkArea('maxDistance', parseInt(e.target.value))}
                />
              </div>

              <div>
                <Label>Horarios preferidos</Label>
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="morning"
                      checked={settings.workArea.preferredTimes.morning}
                      onCheckedChange={checked =>
                        updateWorkArea('preferredTimes', {
                          ...settings.workArea.preferredTimes,
                          morning: checked,
                        })
                      }
                    />
                    <Label htmlFor="morning">Mañana</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="afternoon"
                      checked={settings.workArea.preferredTimes.afternoon}
                      onCheckedChange={checked =>
                        updateWorkArea('preferredTimes', {
                          ...settings.workArea.preferredTimes,
                          afternoon: checked,
                        })
                      }
                    />
                    <Label htmlFor="afternoon">Tarde</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="evening"
                      checked={settings.workArea.preferredTimes.evening}
                      onCheckedChange={checked =>
                        updateWorkArea('preferredTimes', {
                          ...settings.workArea.preferredTimes,
                          evening: checked,
                        })
                      }
                    />
                    <Label htmlFor="evening">Noche</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="weekend"
                      checked={settings.workArea.preferredTimes.weekend}
                      onCheckedChange={checked =>
                        updateWorkArea('preferredTimes', {
                          ...settings.workArea.preferredTimes,
                          weekend: checked,
                        })
                      }
                    />
                    <Label htmlFor="weekend">Fin de semana</Label>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Services */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Wrench className="w-5 h-5" />
                Servicios Ofrecidos
              </CardTitle>
              <CardDescription>
                Selecciona los tipos de servicios que puedes realizar
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                {Object.entries({
                  emergency: 'Emergencias',
                  maintenance: 'Mantenimiento',
                  installation: 'Instalaciones',
                  repair: 'Reparaciones',
                  cleaning: 'Limpieza',
                }).map(([key, label]) => (
                  <div key={key} className="flex items-center space-x-2">
                    <Switch
                      id={key}
                      checked={settings.services[key as keyof RunnerSettings['services']]}
                      onCheckedChange={checked =>
                        updateServices(key as keyof RunnerSettings['services'], checked)
                      }
                    />
                    <Label htmlFor={key}>{label}</Label>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Vehicle */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Car className="w-5 h-5" />
                Vehículo y Herramientas
              </CardTitle>
              <CardDescription>
                Información de tu vehículo y herramientas disponibles
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="vehicleType">Tipo de vehículo</Label>
                  <Select
                    value={settings.vehicle.type}
                    onValueChange={value => updateVehicle('type', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Camioneta">Camioneta</SelectItem>
                      <SelectItem value="Furgón">Furgón</SelectItem>
                      <SelectItem value="Auto">Auto</SelectItem>
                      <SelectItem value="Moto">Moto</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="model">Modelo</Label>
                  <Input
                    id="model"
                    value={settings.vehicle.model}
                    onChange={e => updateVehicle('model', e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="year">Año</Label>
                  <Input
                    id="year"
                    type="number"
                    value={settings.vehicle.year}
                    onChange={e => updateVehicle('year', parseInt(e.target.value))}
                  />
                </div>
                <div>
                  <Label htmlFor="licensePlate">Patente</Label>
                  <Input
                    id="licensePlate"
                    value={settings.vehicle.licensePlate}
                    onChange={e => updateVehicle('licensePlate', e.target.value)}
                  />
                </div>
              </div>

              <div>
                <Label>Herramientas disponibles</Label>
                <Textarea
                  placeholder="Ej: Llaves Allen, Destornilladores, Multímetro, Soldador"
                  value={settings.vehicle.tools.join(', ')}
                  onChange={e =>
                    updateVehicle(
                      'tools',
                      e.target.value.split(',').map(t => t.trim())
                    )
                  }
                />
              </div>
            </CardContent>
          </Card>

          {/* Notifications */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="w-5 h-5" />
                Notificaciones
              </CardTitle>
              <CardDescription>Configura cómo quieres recibir las notificaciones</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {Object.entries({
                  newJobs: 'Nuevos trabajos disponibles',
                  jobUpdates: 'Actualizaciones de trabajos',
                  payments: 'Pagos y comisiones',
                  messages: 'Mensajes del sistema',
                  marketing: 'Promociones y ofertas',
                }).map(([key, label]) => (
                  <div key={key} className="flex items-center justify-between">
                    <Label htmlFor={`notif-${key}`}>{label}</Label>
                    <Switch
                      id={`notif-${key}`}
                      checked={settings.notifications[key as keyof RunnerSettings['notifications']]}
                      onCheckedChange={checked =>
                        updateNotifications(key as keyof RunnerSettings['notifications'], checked)
                      }
                    />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Payment Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="w-5 h-5" />
                Información de Pago
              </CardTitle>
              <CardDescription>Datos bancarios para recibir tus pagos</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="bankAccount">Cuenta bancaria</Label>
                <Input
                  id="bankAccount"
                  placeholder="Número de cuenta"
                  value={settings.payment.bankAccount}
                  onChange={e => updatePayment('bankAccount', e.target.value)}
                />
              </div>

              <div>
                <Label>Método de pago preferido</Label>
                <Select
                  value={settings.payment.paymentMethod}
                  onValueChange={(value: 'transfer' | 'cash' | 'wallet') =>
                    updatePayment('paymentMethod', value)
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="transfer">Transferencia bancaria</SelectItem>
                    <SelectItem value="cash">Efectivo</SelectItem>
                    <SelectItem value="wallet">Billetera digital</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="taxId">RUT</Label>
                <Input
                  id="taxId"
                  placeholder="12.345.678-9"
                  value={settings.payment.taxId}
                  onChange={e => updatePayment('taxId', e.target.value)}
                />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </UnifiedDashboardLayout>
  );
}

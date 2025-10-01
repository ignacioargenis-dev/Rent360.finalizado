'use client';

import { logger } from '@/lib/logger';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Settings, 
  User, 
  Bell, 
  Shield, 
  CreditCard,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Clock,
  CheckCircle,
  AlertTriangle,
  Upload,
  Download,
  Save,
  RefreshCw, 
  EyeOff,
  Lock,
  Unlock,
  Smartphone,
  Monitor,
  Globe,
  FileText,
  Image,
  Video,
  BarChart3,
  Star, 
  Info, 
  Eye
} from 'lucide-react';
import Link from 'next/link';
import { User as UserType } from '@/types';
import EnhancedDashboardLayout from '@/components/dashboard/EnhancedDashboardLayout';

interface BrokerSettings {
  profile: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    bio: string;
    avatar: string;
    license: string;
    specialization: string[];
    languages: string[];
    experience: number;
  };
  notifications: {
    email: boolean;
    sms: boolean;
    push: boolean;
    newInquiries: boolean;
    appointmentReminders: boolean;
    contractUpdates: boolean;
    paymentNotifications: boolean;
    marketingEmails: boolean;
  };
  privacy: {
    profileVisibility: 'public' | 'private' | 'agents_only';
    showContactInfo: boolean;
    showStats: boolean;
    allowReviews: boolean;
  };
  payment: {
    bankAccount: string;
    bankName: string;
    accountType: string;
    taxId: string;
    commissionRate: number;
    paymentMethod: 'bank_transfer' | 'check' | 'both';
  };
  appearance: {
    theme: 'light' | 'dark' | 'auto';
    language: 'es' | 'en';
    dateFormat: 'dd/mm/yyyy' | 'mm/dd/yyyy' | 'yyyy-mm-dd';
    timezone: string;
  };
  goals: {
    monthlyProperties: number;
    monthlyRevenue: number;
    monthlyClients: number;
    yearlyProperties: number;
    yearlyRevenue: number;
    yearlyClients: number;
    commissionTarget: number;
    notificationsEnabled: boolean;
  };
}

export default function BrokerSettings() {
  const [user, setUser] = useState<UserType | null>(null);
  const [settings, setSettings] = useState<BrokerSettings>({
    profile: {
      firstName: 'Carlos',
      lastName: 'Rodríguez',
      email: 'carlos.rodriguez@rent360.cl',
      phone: '+56 9 1234 5678',
      bio: 'Corredor de propiedades con más de 8 años de experiencia en el mercado inmobiliario. Especializado en propiedades residenciales y comerciales en Santiago.',
      avatar: '/avatar.jpg',
      license: 'COR-12345',
      specialization: ['Residencial', 'Comercial', 'Inversiones'],
      languages: ['Español', 'Inglés'],
      experience: 8,
    },
    notifications: {
      email: true,
      sms: true,
      push: true,
      newInquiries: true,
      appointmentReminders: true,
      contractUpdates: true,
      paymentNotifications: true,
      marketingEmails: false,
    },
    privacy: {
      profileVisibility: 'public',
      showContactInfo: true,
      showStats: true,
      allowReviews: true,
    },
    payment: {
      bankAccount: '1234567890',
      bankName: 'Banco de Chile',
      accountType: 'Cuenta Corriente',
      taxId: '12.345.678-9',
      commissionRate: 4.5,
      paymentMethod: 'bank_transfer',
    },
    appearance: {
      theme: 'light',
      language: 'es',
      dateFormat: 'dd/mm/yyyy',
      timezone: 'America/Santiago',
    },
    goals: {
      monthlyProperties: 5,
      monthlyRevenue: 15000000,
      monthlyClients: 8,
      yearlyProperties: 60,
      yearlyRevenue: 180000000,
      yearlyClients: 96,
      commissionTarget: 500000,
      notificationsEnabled: true,
    },
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('profile');

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

    loadUserData();
    setLoading(false);
  }, []);

  const saveSettings = async () => {
    setSaving(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      // Show success message
      alert('Configuración guardada exitosamente');
    } catch (error) {
      logger.error('Error saving settings:', { error: error instanceof Error ? error.message : String(error) });
      alert('Error al guardar la configuración');
    } finally {
      setSaving(false);
    }
  };

  const updateProfile = (field: string, value: any) => {
    setSettings(prev => ({
      ...prev,
      profile: { ...prev.profile, [field]: value },
    }));
  };

  const updateNotifications = (field: string, value: boolean) => {
    setSettings(prev => ({
      ...prev,
      notifications: { ...prev.notifications, [field]: value },
    }));
  };

  const updatePrivacy = (field: string, value: any) => {
    setSettings(prev => ({
      ...prev,
      privacy: { ...prev.privacy, [field]: value },
    }));
  };

  const updatePayment = (field: string, value: any) => {
    setSettings(prev => ({
      ...prev,
      payment: { ...prev.payment, [field]: value },
    }));
  };

  const updateAppearance = (field: string, value: any) => {
    setSettings(prev => ({
      ...prev,
      appearance: { ...prev.appearance, [field]: value },
    }));
  };

  const updateGoals = (field: string, value: any) => {
    setSettings(prev => ({
      ...prev,
      goals: { ...prev.goals, [field]: value },
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
    <EnhancedDashboardLayout
      user={user}
      title="Configuración"
      subtitle="Personaliza tu cuenta y preferencias"
    >
      <div className="container mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-6 gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Configuración de Cuenta</h1>
            <p className="text-gray-600">Administra tu perfil y preferencias</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm">
              <RefreshCw className="w-4 h-4 mr-2" />
              Restablecer
            </Button>
            <Button size="sm" onClick={saveSettings} disabled={saving}>
              <Save className="w-4 h-4 mr-2" />
              {saving ? 'Guardando...' : 'Guardar Cambios'}
            </Button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex flex-wrap gap-2 mb-6 border-b">
          <Button
            variant={activeTab === 'profile' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setActiveTab('profile')}
            className="flex items-center gap-2"
          >
            <User className="w-4 h-4" />
            Perfil
          </Button>
          <Button
            variant={activeTab === 'notifications' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setActiveTab('notifications')}
            className="flex items-center gap-2"
          >
            <Bell className="w-4 h-4" />
            Notificaciones
          </Button>
          <Button
            variant={activeTab === 'privacy' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setActiveTab('privacy')}
            className="flex items-center gap-2"
          >
            <Shield className="w-4 h-4" />
            Privacidad
          </Button>
          <Button
            variant={activeTab === 'payment' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setActiveTab('payment')}
            className="flex items-center gap-2"
          >
            <CreditCard className="w-4 h-4" />
            Pagos
          </Button>
          <Button
            variant={activeTab === 'appearance' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setActiveTab('appearance')}
            className="flex items-center gap-2"
          >
            <Monitor className="w-4 h-4" />
            Apariencia
          </Button>
          <Button
            variant={activeTab === 'goals' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setActiveTab('goals')}
            className="flex items-center gap-2"
          >
            <Target className="w-4 h-4" />
            Metas
          </Button>
        </div>

        {/* Tab Content */}
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2">
            {activeTab === 'profile' && (
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Información Personal</CardTitle>
                    <CardDescription>Actualiza tu información de perfil</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Nombre
                        </label>
                        <input
                          type="text"
                          value={settings.profile.firstName}
                          onChange={(e) => updateProfile('firstName', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Apellido
                        </label>
                        <input
                          type="text"
                          value={settings.profile.lastName}
                          onChange={(e) => updateProfile('lastName', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Email
                        </label>
                        <input
                          type="email"
                          value={settings.profile.email}
                          onChange={(e) => updateProfile('email', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Teléfono
                        </label>
                        <input
                          type="tel"
                          value={settings.profile.phone}
                          onChange={(e) => updateProfile('phone', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Biografía
                      </label>
                      <textarea
                        value={settings.profile.bio}
                        onChange={(e) => updateProfile('bio', e.target.value)}
                        rows={4}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Licencia
                        </label>
                        <input
                          type="text"
                          value={settings.profile.license}
                          onChange={(e) => updateProfile('license', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Años de Experiencia
                        </label>
                        <input
                          type="number"
                          value={settings.profile.experience}
                          onChange={(e) => updateProfile('experience', parseInt(e.target.value))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Foto de Perfil</CardTitle>
                    <CardDescription>Actualiza tu foto de perfil</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-4">
                      <div className="w-20 h-20 bg-gray-200 rounded-full flex items-center justify-center">
                        <User className="w-8 h-8 text-gray-400" />
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline">
                          <Upload className="w-4 h-4 mr-2" />
                          Subir Foto
                        </Button>
                        <Button size="sm" variant="outline">
                          <Eye className="w-4 h-4 mr-2" />
                          Ver
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {activeTab === 'notifications' && (
              <Card>
                <CardHeader>
                  <CardTitle>Preferencias de Notificación</CardTitle>
                  <CardDescription>Configura cómo y cuándo recibir notificaciones</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Mail className="w-5 h-5 text-gray-600" />
                        <div>
                          <p className="font-medium">Notificaciones por Email</p>
                          <p className="text-sm text-gray-600">Recibir notificaciones importantes por correo</p>
                        </div>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={settings.notifications.email}
                          onChange={(e) => updateNotifications('email', e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Smartphone className="w-5 h-5 text-gray-600" />
                        <div>
                          <p className="font-medium">Notificaciones SMS</p>
                          <p className="text-sm text-gray-600">Recibir alertas importantes por mensaje de texto</p>
                        </div>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={settings.notifications.sms}
                          onChange={(e) => updateNotifications('sms', e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Bell className="w-5 h-5 text-gray-600" />
                        <div>
                          <p className="font-medium">Notificaciones Push</p>
                          <p className="text-sm text-gray-600">Recibir notificaciones en tu dispositivo móvil</p>
                        </div>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={settings.notifications.push}
                          onChange={(e) => updateNotifications('push', e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                    </div>

                    <div className="border-t pt-4">
                      <h4 className="font-medium mb-3">Tipos de Notificaciones</h4>
                      
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <p className="font-medium">Nuevas Consultas</p>
                          <p className="text-sm text-gray-600">Cuando recibas nuevas consultas de clientes</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={settings.notifications.newInquiries}
                            onChange={(e) => updateNotifications('newInquiries', e.target.checked)}
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                        </label>
                      </div>

                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <p className="font-medium">Recordatorios de Citas</p>
                          <p className="text-sm text-gray-600">Recordatorios de visitas y reuniones programadas</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={settings.notifications.appointmentReminders}
                            onChange={(e) => updateNotifications('appointmentReminders', e.target.checked)}
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                        </label>
                      </div>

                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <p className="font-medium">Actualizaciones de Contratos</p>
                          <p className="text-sm text-gray-600">Notificaciones sobre cambios en contratos</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={settings.notifications.contractUpdates}
                            onChange={(e) => updateNotifications('contractUpdates', e.target.checked)}
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                        </label>
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">Notificaciones de Pagos</p>
                          <p className="text-sm text-gray-600">Alertas sobre comisiones y pagos</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={settings.notifications.paymentNotifications}
                            onChange={(e) => updateNotifications('paymentNotifications', e.target.checked)}
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                        </label>
                      </div>
                    </div>

                    <div className="border-t pt-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">Emails de Marketing</p>
                          <p className="text-sm text-gray-600">Recibir novedades y promociones</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={settings.notifications.marketingEmails}
                            onChange={(e) => updateNotifications('marketingEmails', e.target.checked)}
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                        </label>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {activeTab === 'privacy' && (
              <Card>
                <CardHeader>
                  <CardTitle>Configuración de Privacidad</CardTitle>
                  <CardDescription>Controla la visibilidad de tu información</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Eye className="w-5 h-5 text-gray-600" />
                        <div>
                          <p className="font-medium">Visibilidad del Perfil</p>
                          <p className="text-sm text-gray-600">Quién puede ver tu perfil</p>
                        </div>
                      </div>
                      <select
                        value={settings.privacy.profileVisibility}
                        onChange={(e) => updatePrivacy('profileVisibility', e.target.value)}
                        className="px-3 py-2 border border-gray-300 rounded-md text-sm"
                      >
                        <option value="public">Público</option>
                        <option value="private">Privado</option>
                        <option value="agents_only">Solo Agentes</option>
                      </select>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Phone className="w-5 h-5 text-gray-600" />
                        <div>
                          <p className="font-medium">Mostrar Información de Contacto</p>
                          <p className="text-sm text-gray-600">Mostrar teléfono y email en tu perfil</p>
                        </div>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={settings.privacy.showContactInfo}
                          onChange={(e) => updatePrivacy('showContactInfo', e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <BarChart3 className="w-5 h-5 text-gray-600" />
                        <div>
                          <p className="font-medium">Mostrar Estadísticas</p>
                          <p className="text-sm text-gray-600">Mostrar métricas de rendimiento en tu perfil</p>
                        </div>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={settings.privacy.showStats}
                          onChange={(e) => updatePrivacy('showStats', e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Star className="w-5 h-5 text-gray-600" />
                        <div>
                          <p className="font-medium">Permitir Reseñas</p>
                          <p className="text-sm text-gray-600">Permitir que clientes dejen reseñas</p>
                        </div>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={settings.privacy.allowReviews}
                          onChange={(e) => updatePrivacy('allowReviews', e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {activeTab === 'payment' && (
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Información de Pago</CardTitle>
                    <CardDescription>Configura tus datos para recibir comisiones</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Banco
                        </label>
                        <input
                          type="text"
                          value={settings.payment.bankName}
                          onChange={(e) => updatePayment('bankName', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Tipo de Cuenta
                        </label>
                        <select
                          value={settings.payment.accountType}
                          onChange={(e) => updatePayment('accountType', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        >
                          <option value="Cuenta Corriente">Cuenta Corriente</option>
                          <option value="Cuenta Ahorro">Cuenta Ahorro</option>
                          <option value="Cuenta Vista">Cuenta Vista</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Número de Cuenta
                      </label>
                      <input
                        type="text"
                        value={settings.payment.bankAccount}
                        onChange={(e) => updatePayment('bankAccount', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        RUT
                      </label>
                      <input
                        type="text"
                        value={settings.payment.taxId}
                        onChange={(e) => updatePayment('taxId', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Tasa de Comisión (%)
                        </label>
                        <input
                          type="number"
                          step="0.1"
                          value={settings.payment.commissionRate}
                          onChange={(e) => updatePayment('commissionRate', parseFloat(e.target.value))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Método de Pago
                        </label>
                        <select
                          value={settings.payment.paymentMethod}
                          onChange={(e) => updatePayment('paymentMethod', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        >
                          <option value="bank_transfer">Transferencia Bancaria</option>
                          <option value="check">Cheque</option>
                          <option value="both">Ambos</option>
                        </select>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {activeTab === 'appearance' && (
              <Card>
                <CardHeader>
                  <CardTitle>Apariencia y Preferencias</CardTitle>
                  <CardDescription>Personaliza la interfaz y configuración regional</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Tema
                      </label>
                      <select
                        value={settings.appearance.theme}
                        onChange={(e) => updateAppearance('theme', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="light">Claro</option>
                        <option value="dark">Oscuro</option>
                        <option value="auto">Automático</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Idioma
                      </label>
                      <select
                        value={settings.appearance.language}
                        onChange={(e) => updateAppearance('language', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="es">Español</option>
                        <option value="en">English</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Formato de Fecha
                      </label>
                      <select
                        value={settings.appearance.dateFormat}
                        onChange={(e) => updateAppearance('dateFormat', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="dd/mm/yyyy">DD/MM/YYYY</option>
                        <option value="mm/dd/yyyy">MM/DD/YYYY</option>
                        <option value="yyyy-mm-dd">YYYY-MM-DD</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Zona Horaria
                      </label>
                      <select
                        value={settings.appearance.timezone}
                        onChange={(e) => updateAppearance('timezone', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="America/Santiago">Santiago (GMT-3)</option>
                        <option value="America/New_York">New York (GMT-5)</option>
                        <option value="Europe/Madrid">Madrid (GMT+1)</option>
                      </select>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {activeTab === 'goals' && (
              <Card>
                <CardHeader>
                  <CardTitle>Metas y Objetivos</CardTitle>
                  <CardDescription>Establece tus metas mensuales y anuales para mejorar tu rendimiento</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Metas Mensuales */}
                  <div>
                    <h4 className="text-lg font-semibold mb-4 text-emerald-700">Metas Mensuales</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Propiedades por Mes
                        </label>
                        <input
                          type="number"
                          value={settings.goals.monthlyProperties}
                          onChange={(e) => updateGoals('monthlyProperties', parseInt(e.target.value) || 0)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                          min="0"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Ingresos Mensuales ($)
                        </label>
                        <input
                          type="number"
                          value={settings.goals.monthlyRevenue}
                          onChange={(e) => updateGoals('monthlyRevenue', parseInt(e.target.value) || 0)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                          min="0"
                          step="100000"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Clientes por Mes
                        </label>
                        <input
                          type="number"
                          value={settings.goals.monthlyClients}
                          onChange={(e) => updateGoals('monthlyClients', parseInt(e.target.value) || 0)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                          min="0"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Metas Anuales */}
                  <div>
                    <h4 className="text-lg font-semibold mb-4 text-blue-700">Metas Anuales</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Propiedades por Año
                        </label>
                        <input
                          type="number"
                          value={settings.goals.yearlyProperties}
                          onChange={(e) => updateGoals('yearlyProperties', parseInt(e.target.value) || 0)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          min="0"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Ingresos Anuales ($)
                        </label>
                        <input
                          type="number"
                          value={settings.goals.yearlyRevenue}
                          onChange={(e) => updateGoals('yearlyRevenue', parseInt(e.target.value) || 0)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          min="0"
                          step="1000000"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Clientes por Año
                        </label>
                        <input
                          type="number"
                          value={settings.goals.yearlyClients}
                          onChange={(e) => updateGoals('yearlyClients', parseInt(e.target.value) || 0)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          min="0"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Meta de Comisión */}
                  <div>
                    <h4 className="text-lg font-semibold mb-4 text-purple-700">Meta de Comisión</h4>
                    <div className="max-w-md">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Comisión Mensual Objetivo ($)
                      </label>
                      <input
                        type="number"
                        value={settings.goals.commissionTarget}
                        onChange={(e) => updateGoals('commissionTarget', parseInt(e.target.value) || 0)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                        min="0"
                        step="10000"
                      />
                      <p className="text-sm text-gray-500 mt-1">
                        Monto objetivo de comisión que deseas alcanzar mensualmente
                      </p>
                    </div>
                  </div>

                  {/* Notificaciones */}
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <h4 className="font-medium">Notificaciones de Metas</h4>
                      <p className="text-sm text-gray-600">
                        Recibe notificaciones cuando alcances o te acerques a tus metas
                      </p>
                    </div>
                    <label className="flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={settings.goals.notificationsEnabled}
                        onChange={(e) => updateGoals('notificationsEnabled', e.target.checked)}
                        className="sr-only"
                      />
                      <div className={`relative inline-block w-10 h-6 rounded-full transition-colors ${
                        settings.goals.notificationsEnabled ? 'bg-emerald-500' : 'bg-gray-300'
                      }`}>
                        <span className={`absolute left-1 top-1 w-4 h-4 bg-white rounded-full transition-transform ${
                          settings.goals.notificationsEnabled ? 'translate-x-4' : 'translate-x-0'
                        }`} />
                      </div>
                    </label>
                  </div>

                  {/* Resumen de Metas */}
                  <div className="bg-gradient-to-r from-emerald-50 to-blue-50 p-4 rounded-lg">
                    <h4 className="font-semibold mb-3 text-gray-800">Resumen de Metas</h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <div className="text-gray-600">Propiedades</div>
                        <div className="font-semibold text-emerald-600">
                          {settings.goals.monthlyProperties}/mes
                        </div>
                        <div className="text-xs text-gray-500">
                          {settings.goals.yearlyProperties}/año
                        </div>
                      </div>
                      <div>
                        <div className="text-gray-600">Ingresos</div>
                        <div className="font-semibold text-emerald-600">
                          ${(settings.goals.monthlyRevenue / 1000000).toFixed(1)}M/mes
                        </div>
                        <div className="text-xs text-gray-500">
                          ${(settings.goals.yearlyRevenue / 1000000).toFixed(0)}M/año
                        </div>
                      </div>
                      <div>
                        <div className="text-gray-600">Clientes</div>
                        <div className="font-semibold text-emerald-600">
                          {settings.goals.monthlyClients}/mes
                        </div>
                        <div className="text-xs text-gray-500">
                          {settings.goals.yearlyClients}/año
                        </div>
                      </div>
                      <div>
                        <div className="text-gray-600">Comisión</div>
                        <div className="font-semibold text-purple-600">
                          ${(settings.goals.commissionTarget / 1000).toFixed(0)}K/mes
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Profile Summary */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Resumen del Perfil</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center mb-4">
                  <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-2">
                    <User className="w-8 h-8 text-gray-400" />
                  </div>
                  <h3 className="font-medium">{settings.profile.firstName} {settings.profile.lastName}</h3>
                  <p className="text-sm text-gray-600">Corredor de Propiedades</p>
                </div>
                
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-gray-500" />
                    <span>{settings.profile.email}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-gray-500" />
                    <span>{settings.profile.phone}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-gray-500" />
                    <span>Licencia: {settings.profile.license}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-gray-500" />
                    <span>{settings.profile.experience} años de experiencia</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Quick Stats */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Estadísticas Rápidas</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Propiedades</span>
                    <Badge>24</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Clientes</span>
                    <Badge>156</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Contratos</span>
                    <Badge>89</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Rating</span>
                    <div className="flex items-center gap-1">
                      <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                      <span className="text-sm">4.8</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Account Status */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Estado de Cuenta</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    <span className="text-sm">Cuenta verificada</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    <span className="text-sm">Perfil completo</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    <span className="text-sm">Pagos activos</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5 text-yellow-600" />
                    <span className="text-sm">2 documentos pendientes</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </EnhancedDashboardLayout>
  );
}

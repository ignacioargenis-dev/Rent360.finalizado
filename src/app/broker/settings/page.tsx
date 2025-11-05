'use client';

import { logger } from '@/lib/logger-minimal';

// ✅ CORREGIDO: 'use client' no puede usar export const dynamic o revalidate
// Las páginas del cliente se renderizan dinámicamente por defecto en el navegador
// Los datos se cargan mediante fetch en useEffect, no durante el build

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Settings,
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
  Eye,
  XCircle,
  AlertCircle,
  Target,
  Plus,
  Building,
  Loader2,
} from 'lucide-react';
import Link from 'next/link';
import { User as UserType } from '@/types';
import UnifiedDashboardLayout from '@/components/layout/UnifiedDashboardLayout';

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
  documents: {
    idCard: {
      name: string;
      url: string;
      status: 'pending' | 'uploaded' | 'approved' | 'rejected';
      uploadedAt?: string;
    };
    criminalRecord: {
      name: string;
      url: string;
      status: 'pending' | 'uploaded' | 'approved' | 'rejected';
      uploadedAt?: string;
    };
    professionalTitle: {
      name: string;
      url: string;
      status: 'pending' | 'uploaded' | 'approved' | 'rejected';
      uploadedAt?: string;
    };
    brokerRegistration: {
      name: string;
      url: string;
      status: 'pending' | 'uploaded' | 'approved' | 'rejected';
      uploadedAt?: string;
    };
    courseCertificates: {
      name: string;
      url: string;
      status: 'pending' | 'uploaded' | 'approved' | 'rejected';
      uploadedAt?: string;
    }[];
    companyDocuments: {
      name: string;
      url: string;
      status: 'pending' | 'uploaded' | 'approved' | 'rejected';
      uploadedAt?: string;
    }[];
  };
}

export default function BrokerSettings() {
  const [user, setUser] = useState<UserType | null>(null);
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [settings, setSettings] = useState<BrokerSettings>({
    profile: {
      firstName: 'Carlos',
      lastName: 'Rodríguez',
      email: 'carlos.rodriguez@rent360.cl',
      phone: '+56 9 1234 5678',
      bio: 'Corredor de propiedades con más de 8 años de experiencia en el mercado inmobiliario. Especializado en propiedades residenciales y comerciales en Santiago.',
      avatar: '',
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
    documents: {
      idCard: { name: '', url: '', status: 'pending' },
      criminalRecord: { name: '', url: '', status: 'pending' },
      professionalTitle: { name: '', url: '', status: 'pending' },
      brokerRegistration: { name: '', url: '', status: 'pending' },
      courseCertificates: [],
      companyDocuments: [],
    },
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [activeTab, setActiveTab] = useState('profile');
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    const loadData = async () => {
      try {
        // Cargar datos del usuario
        const userResponse = await fetch('/api/auth/me');
        if (userResponse.ok) {
          const userData = await userResponse.json();
          setUser(userData.user);

          // Actualizar settings con datos reales del usuario
          setSettings(prevSettings => ({
            ...prevSettings,
            profile: {
              ...prevSettings.profile,
              firstName: userData.user.name?.split(' ')[0] || 'Sin nombre',
              lastName: userData.user.name?.split(' ').slice(1).join(' ') || 'Sin apellido',
              email: userData.user.email || '',
              phone: userData.user.phone || '',
              avatar: userData.user.avatar || '',
            },
          }));
        }

        // Cargar datos del dashboard del corredor
        const dashboardResponse = await fetch('/api/broker/dashboard', {
          method: 'GET',
          credentials: 'include',
          headers: {
            Accept: 'application/json',
          },
        });

        if (dashboardResponse.ok) {
          const dashboardInfo = await dashboardResponse.json();
          setDashboardData(dashboardInfo.data);
        }
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

  const saveSettings = async () => {
    setSaving(true);
    try {
      // Guardar configuración del perfil usando la API correcta
      const response = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          name: `${settings.profile.firstName} ${settings.profile.lastName}`,
          phone: settings.profile.phone,
          avatar: settings.profile.avatar,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al guardar la configuración');
      }

      // Guardar datos bancarios si están configurados
      if (settings.payment.bankName && settings.payment.bankAccount && settings.payment.taxId) {
        const bankResponse = await fetch('/api/broker/bank-account', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify({
            bankName: settings.payment.bankName,
            accountType: settings.payment.accountType,
            accountNumber: settings.payment.bankAccount,
            accountHolderName: `${settings.profile.firstName} ${settings.profile.lastName}`,
            rut: settings.payment.taxId,
          }),
        });

        if (!bankResponse.ok) {
          logger.warn('Error al guardar datos bancarios, pero otras configuraciones se guardaron');
        }
      }

      // Show success message
      setSuccessMessage('Configuración guardada exitosamente');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      logger.error('Error saving settings:', {
        error: error instanceof Error ? error.message : String(error),
      });
      setErrorMessage(
        error instanceof Error
          ? error.message
          : 'Error al guardar la configuración. Por favor, inténtalo nuevamente.'
      );
      setTimeout(() => setErrorMessage(''), 5000);
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

  const handleFileUpload = async (documentType: string, file: File) => {
    try {
      logger.info('Subiendo documento:', { documentType, fileName: file.name });

      // Crear FormData para la subida
      const formData = new FormData();
      formData.append('files', file);
      formData.append('title', file.name);
      formData.append('category', 'professional');
      formData.append(
        'type',
        documentType === 'idCard'
          ? 'IDENTIFICATION'
          : documentType === 'criminalRecord'
            ? 'CRIMINAL_RECORD'
            : documentType === 'professionalTitle'
              ? 'PROFESSIONAL_TITLE'
              : documentType === 'brokerRegistration'
                ? 'BROKER_REGISTRATION'
                : 'OTHER_DOCUMENT'
      );

      // Subir archivo usando la API real
      const response = await fetch('/api/documents/upload', {
        method: 'POST',
        body: formData,
        credentials: 'include',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al subir el documento');
      }

      const data = await response.json();

      if (data.files && data.files.length > 0) {
        const uploadedFile = data.files[0];
        const uploadedAt = new Date().toISOString();

        setSettings(prev => ({
          ...prev,
          documents: {
            ...prev.documents,
            [documentType]: {
              name: uploadedFile.name,
              url: uploadedFile.url,
              status: 'uploaded' as const,
              uploadedAt,
            },
          },
        }));

        logger.info('Documento subido exitosamente:', { documentType, fileName: file.name });
        setSuccessMessage(`Documento "${file.name}" subido exitosamente`);
        setTimeout(() => setSuccessMessage(''), 3000);
      } else {
        throw new Error('No se recibió información del archivo subido');
      }
    } catch (error) {
      logger.error('Error subiendo documento:', {
        error: error instanceof Error ? error.message : String(error),
      });
      setErrorMessage(
        error instanceof Error
          ? error.message
          : 'Error al subir el documento. Por favor, inténtalo nuevamente.'
      );
      setTimeout(() => setErrorMessage(''), 5000);
    }
  };

  const handleAddCertificate = async (file: File) => {
    try {
      logger.info('Agregando certificado de curso:', { fileName: file.name });

      await new Promise(resolve => setTimeout(resolve, 1000));

      const newCert = {
        name: file.name,
        url: `/uploads/${file.name}`,
        status: 'uploaded' as const,
        uploadedAt: new Date().toISOString(),
      };

      setSettings(prev => ({
        ...prev,
        documents: {
          ...prev.documents,
          courseCertificates: [...prev.documents.courseCertificates, newCert],
        },
      }));

      logger.info('Certificado agregado exitosamente');
      setSuccessMessage('Certificado agregado exitosamente');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      logger.error('Error agregando certificado:', {
        error: error instanceof Error ? error.message : String(error),
      });
      setErrorMessage('Error al agregar el certificado. Por favor, inténtalo nuevamente.');
      setTimeout(() => setErrorMessage(''), 5000);
    }
  };

  const handleAddCompanyDocument = async (file: File) => {
    try {
      logger.info('Agregando documento de empresa:', { fileName: file.name });

      await new Promise(resolve => setTimeout(resolve, 1000));

      const newDoc = {
        name: file.name,
        url: `/uploads/${file.name}`,
        status: 'uploaded' as const,
        uploadedAt: new Date().toISOString(),
      };

      setSettings(prev => ({
        ...prev,
        documents: {
          ...prev.documents,
          companyDocuments: [...prev.documents.companyDocuments, newDoc],
        },
      }));

      logger.info('Documento de empresa agregado exitosamente');
      setSuccessMessage('Documento de empresa agregado exitosamente');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      logger.error('Error agregando documento de empresa:', {
        error: error instanceof Error ? error.message : String(error),
      });
      setErrorMessage('Error al agregar el documento de empresa. Por favor, inténtalo nuevamente.');
      setTimeout(() => setErrorMessage(''), 5000);
    }
  };

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    // Validar tipo de archivo
    if (!file.type.startsWith('image/')) {
      setErrorMessage('Solo se permiten archivos de imagen (JPG, PNG, GIF)');
      setTimeout(() => setErrorMessage(''), 5000);
      return;
    }

    // Validar tamaño (5MB máximo)
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      setErrorMessage('El archivo es demasiado grande. Máximo 5MB permitido.');
      setTimeout(() => setErrorMessage(''), 5000);
      return;
    }

    setUploadingAvatar(true);
    try {
      logger.info('Subiendo avatar:', { fileName: file.name, size: file.size });

      const formData = new FormData();
      formData.append('avatar', file);

      const response = await fetch('/api/user/avatar', {
        method: 'POST',
        body: formData,
        credentials: 'include',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al subir el avatar');
      }

      const data = await response.json();

      // Actualizar el usuario en el estado local
      if (user) {
        setUser({
          ...user,
          avatar: data.avatar.url,
        });
      }

      logger.info('Avatar subido exitosamente');
      setSuccessMessage('Foto de perfil actualizada exitosamente');
      setTimeout(() => setSuccessMessage(''), 3000);

      // Resetear el input file
      event.target.value = '';
    } catch (error) {
      logger.error('Error subiendo avatar:', {
        error: error instanceof Error ? error.message : String(error),
      });
      setErrorMessage(
        error instanceof Error
          ? error.message
          : 'Error al subir la foto de perfil. Por favor, inténtalo nuevamente.'
      );
      setTimeout(() => setErrorMessage(''), 5000);
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleAvatarDelete = async () => {
    if (!confirm('¿Estás seguro de que quieres eliminar tu foto de perfil?')) {
      return;
    }

    setUploadingAvatar(true);
    try {
      logger.info('Eliminando avatar');

      const response = await fetch('/api/user/avatar', {
        method: 'DELETE',
        credentials: 'include',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al eliminar el avatar');
      }

      // Actualizar el usuario en el estado local
      if (user) {
        setUser({
          ...user,
          avatar: null,
        });
      }

      logger.info('Avatar eliminado exitosamente');
      setSuccessMessage('Foto de perfil eliminada exitosamente');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      logger.error('Error eliminando avatar:', {
        error: error instanceof Error ? error.message : String(error),
      });
      setErrorMessage(
        error instanceof Error
          ? error.message
          : 'Error al eliminar la foto de perfil. Por favor, inténtalo nuevamente.'
      );
      setTimeout(() => setErrorMessage(''), 5000);
    } finally {
      setUploadingAvatar(false);
    }
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
    <UnifiedDashboardLayout
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
                  ×
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

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
          <Button
            variant={activeTab === 'documents' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setActiveTab('documents')}
            className="flex items-center gap-2"
          >
            <FileText className="w-4 h-4" />
            Documentos
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
                        <Input
                          type="text"
                          value={settings.profile.firstName}
                          onChange={e => updateProfile('firstName', e.target.value)}
                          placeholder="Ingresa tu nombre"
                          className="bg-white text-gray-900 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Apellido
                        </label>
                        <Input
                          type="text"
                          value={settings.profile.lastName}
                          onChange={e => updateProfile('lastName', e.target.value)}
                          placeholder="Ingresa tu apellido"
                          className="bg-white text-gray-900 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Email
                        </label>
                        <Input
                          type="email"
                          value={settings.profile.email}
                          onChange={e => updateProfile('email', e.target.value)}
                          placeholder="correo@ejemplo.com"
                          className="bg-white text-gray-900 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Teléfono
                        </label>
                        <Input
                          type="tel"
                          value={settings.profile.phone}
                          onChange={e => updateProfile('phone', e.target.value)}
                          placeholder="+56912345678"
                          className="bg-white text-gray-900 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Biografía
                      </label>
                      <Textarea
                        value={settings.profile.bio}
                        onChange={e => updateProfile('bio', e.target.value)}
                        rows={4}
                        placeholder="Describe tu experiencia y especialización inmobiliaria..."
                        className="bg-white text-gray-900 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Licencia
                        </label>
                        <Input
                          type="text"
                          value={settings.profile.license}
                          onChange={e => updateProfile('license', e.target.value)}
                          placeholder="Número de licencia"
                          className="bg-white text-gray-900 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Años de Experiencia
                        </label>
                        <Input
                          type="number"
                          value={settings.profile.experience}
                          onChange={e => updateProfile('experience', parseInt(e.target.value))}
                          placeholder="Años de experiencia"
                          className="bg-white text-gray-900 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
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
                      <div className="relative">
                        {user?.avatar && user.avatar.trim() !== '' ? (
                          <img
                            src={user.avatar}
                            alt="Foto de perfil"
                            className="w-20 h-20 rounded-full object-cover border-2 border-gray-200"
                          />
                        ) : (
                          <div className="w-20 h-20 bg-gray-200 rounded-full flex items-center justify-center">
                            <User className="w-8 h-8 text-gray-400" />
                          </div>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <label className="cursor-pointer">
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleAvatarUpload}
                            className="hidden"
                            disabled={uploadingAvatar}
                          />
                          <Button size="sm" variant="outline" disabled={uploadingAvatar} asChild>
                            <span>
                              {uploadingAvatar ? (
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              ) : (
                                <Upload className="w-4 h-4 mr-2" />
                              )}
                              {uploadingAvatar ? 'Subiendo...' : 'Subir Foto'}
                            </span>
                          </Button>
                        </label>
                        {user?.avatar && user.avatar.trim() !== '' && (
                          <>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() =>
                                user.avatar &&
                                user.avatar.trim() !== '' &&
                                window.open(user.avatar, '_blank')
                              }
                            >
                              <Eye className="w-4 h-4 mr-2" />
                              Ver
                            </Button>
                            <Button size="sm" variant="outline" onClick={handleAvatarDelete}>
                              <XCircle className="w-4 h-4 mr-2" />
                              Eliminar
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                    <div className="mt-3 text-xs text-gray-500">
                      Formatos permitidos: JPG, PNG, GIF. Tamaño máximo: 5MB.
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
                          <p className="text-sm text-gray-600">
                            Recibir notificaciones importantes por correo
                          </p>
                        </div>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={settings.notifications.email}
                          onChange={e => updateNotifications('email', e.target.checked)}
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
                          <p className="text-sm text-gray-600">
                            Recibir alertas importantes por mensaje de texto
                          </p>
                        </div>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={settings.notifications.sms}
                          onChange={e => updateNotifications('sms', e.target.checked)}
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
                          <p className="text-sm text-gray-600">
                            Recibir notificaciones en tu dispositivo móvil
                          </p>
                        </div>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={settings.notifications.push}
                          onChange={e => updateNotifications('push', e.target.checked)}
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
                          <p className="text-sm text-gray-600">
                            Cuando recibas nuevas consultas de clientes
                          </p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={settings.notifications.newInquiries}
                            onChange={e => updateNotifications('newInquiries', e.target.checked)}
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                        </label>
                      </div>

                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <p className="font-medium">Recordatorios de Citas</p>
                          <p className="text-sm text-gray-600">
                            Recordatorios de visitas y reuniones programadas
                          </p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={settings.notifications.appointmentReminders}
                            onChange={e =>
                              updateNotifications('appointmentReminders', e.target.checked)
                            }
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                        </label>
                      </div>

                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <p className="font-medium">Actualizaciones de Contratos</p>
                          <p className="text-sm text-gray-600">
                            Notificaciones sobre cambios en contratos
                          </p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={settings.notifications.contractUpdates}
                            onChange={e => updateNotifications('contractUpdates', e.target.checked)}
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
                            onChange={e =>
                              updateNotifications('paymentNotifications', e.target.checked)
                            }
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
                            onChange={e => updateNotifications('marketingEmails', e.target.checked)}
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
                        onChange={e => updatePrivacy('profileVisibility', e.target.value)}
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
                          <p className="text-sm text-gray-600">
                            Mostrar teléfono y email en tu perfil
                          </p>
                        </div>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={settings.privacy.showContactInfo}
                          onChange={e => updatePrivacy('showContactInfo', e.target.checked)}
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
                          <p className="text-sm text-gray-600">
                            Mostrar métricas de rendimiento en tu perfil
                          </p>
                        </div>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={settings.privacy.showStats}
                          onChange={e => updatePrivacy('showStats', e.target.checked)}
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
                          <p className="text-sm text-gray-600">
                            Permitir que clientes dejen reseñas
                          </p>
                        </div>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={settings.privacy.allowReviews}
                          onChange={e => updatePrivacy('allowReviews', e.target.checked)}
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
                        <Select
                          value={settings.payment.bankName}
                          onValueChange={value => updatePayment('bankName', value)}
                        >
                          <SelectTrigger className="bg-white text-gray-900 border-gray-300 focus:border-blue-500 focus:ring-blue-500">
                            <SelectValue placeholder="Seleccionar banco" />
                          </SelectTrigger>
                          <SelectContent className="max-h-[300px] overflow-y-auto">
                            <SelectItem value="Banco de Chile">Banco de Chile</SelectItem>
                            <SelectItem value="Banco Estado">Banco Estado</SelectItem>
                            <SelectItem value="Banco Santander">Banco Santander</SelectItem>
                            <SelectItem value="Banco de Crédito e Inversiones">
                              Banco de Crédito e Inversiones
                            </SelectItem>
                            <SelectItem value="Banco Itaú">Banco Itaú</SelectItem>
                            <SelectItem value="Scotiabank">Scotiabank</SelectItem>
                            <SelectItem value="Banco Security">Banco Security</SelectItem>
                            <SelectItem value="Banco Falabella">Banco Falabella</SelectItem>
                            <SelectItem value="Banco Ripley">Banco Ripley</SelectItem>
                            <SelectItem value="Banco Consorcio">Banco Consorcio</SelectItem>
                            <SelectItem value="Banco BICE">Banco BICE</SelectItem>
                            <SelectItem value="Banco BTG Pactual">Banco BTG Pactual</SelectItem>
                            <SelectItem value="Banco Internacional">Banco Internacional</SelectItem>
                            <SelectItem value="Banco del Desarrollo">
                              Banco del Desarrollo
                            </SelectItem>
                            <SelectItem value="Banco Coopeuch">Banco Coopeuch</SelectItem>
                            <SelectItem value="Banco Condell">Banco Condell</SelectItem>
                            <SelectItem value="Banco Edwards">Banco Edwards</SelectItem>
                            <SelectItem value="Banco de la Nación">Banco de la Nación</SelectItem>
                            <SelectItem value="Banco París">Banco París</SelectItem>
                            <SelectItem value="Banco BBVA">Banco BBVA</SelectItem>
                            <SelectItem value="Banco HSBC">Banco HSBC</SelectItem>
                            <SelectItem value="Banco CorpBanca">Banco CorpBanca</SelectItem>
                            <SelectItem value="Banco CrediChile">Banco CrediChile</SelectItem>
                            <SelectItem value="Banco del Sur">Banco del Sur</SelectItem>
                            <SelectItem value="Banco Hipotecario">Banco Hipotecario</SelectItem>
                            <SelectItem value="Banco Unión">Banco Unión</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Tipo de Cuenta
                        </label>
                        <Select
                          value={settings.payment.accountType}
                          onValueChange={value => updatePayment('accountType', value)}
                        >
                          <SelectTrigger className="bg-white text-gray-900 border-gray-300 focus:border-blue-500 focus:ring-blue-500">
                            <SelectValue placeholder="Seleccionar tipo de cuenta" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Cuenta Corriente">Cuenta Corriente</SelectItem>
                            <SelectItem value="Cuenta Ahorro">Cuenta Ahorro</SelectItem>
                            <SelectItem value="Cuenta Vista">Cuenta Vista</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Número de Cuenta
                      </label>
                      <Input
                        type="text"
                        value={settings.payment.bankAccount}
                        onChange={e => updatePayment('bankAccount', e.target.value)}
                        placeholder="Número de cuenta bancaria"
                        className="bg-white text-gray-900 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">RUT</label>
                      <Input
                        type="text"
                        value={settings.payment.taxId}
                        onChange={e => updatePayment('taxId', e.target.value)}
                        placeholder="12.345.678-9"
                        className="bg-white text-gray-900 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Tasa de Comisión (%)
                        </label>
                        <Input
                          type="number"
                          step="0.1"
                          value={settings.payment.commissionRate}
                          readOnly
                          className="bg-gray-50 cursor-not-allowed"
                        />
                        <p className="text-xs text-gray-500 mt-1">
                          La tasa de comisión es configurada por el administrador y no puede ser
                          modificada por el corredor.
                        </p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Método de Pago
                        </label>
                        <Select
                          value={settings.payment.paymentMethod}
                          onValueChange={value => updatePayment('paymentMethod', value)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Selecciona método de pago" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="bank_transfer">Transferencia Bancaria</SelectItem>
                            <SelectItem value="check">Cheque</SelectItem>
                            <SelectItem value="both">Ambos</SelectItem>
                          </SelectContent>
                        </Select>
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
                  <CardDescription>
                    Personaliza la interfaz y configuración regional
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Tema</label>
                      <Select
                        value={settings.appearance.theme}
                        onValueChange={value => updateAppearance('theme', value)}
                      >
                        <SelectTrigger className="bg-white text-gray-900 border-gray-300 focus:border-blue-500 focus:ring-blue-500">
                          <SelectValue placeholder="Seleccionar tema" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="light">Claro</SelectItem>
                          <SelectItem value="dark">Oscuro</SelectItem>
                          <SelectItem value="auto">Automático</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Idioma</label>
                      <Select
                        value={settings.appearance.language}
                        onValueChange={value => updateAppearance('language', value)}
                      >
                        <SelectTrigger className="bg-white text-gray-900 border-gray-300 focus:border-blue-500 focus:ring-blue-500">
                          <SelectValue placeholder="Seleccionar idioma" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="es">Español</SelectItem>
                          <SelectItem value="en">English</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Formato de Fecha
                      </label>
                      <Select
                        value={settings.appearance.dateFormat}
                        onValueChange={value => updateAppearance('dateFormat', value)}
                      >
                        <SelectTrigger className="bg-white text-gray-900 border-gray-300 focus:border-blue-500 focus:ring-blue-500">
                          <SelectValue placeholder="Seleccionar formato" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="dd/mm/yyyy">DD/MM/YYYY</SelectItem>
                          <SelectItem value="mm/dd/yyyy">MM/DD/YYYY</SelectItem>
                          <SelectItem value="yyyy-mm-dd">YYYY-MM-DD</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Zona Horaria
                      </label>
                      <Select
                        value={settings.appearance.timezone}
                        onValueChange={value => updateAppearance('timezone', value)}
                      >
                        <SelectTrigger className="bg-white text-gray-900 border-gray-300 focus:border-blue-500 focus:ring-blue-500">
                          <SelectValue placeholder="Seleccionar zona horaria" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="America/Santiago">Santiago (GMT-3)</SelectItem>
                          <SelectItem value="America/New_York">New York (GMT-5)</SelectItem>
                          <SelectItem value="Europe/Madrid">Madrid (GMT+1)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {activeTab === 'goals' && (
              <Card>
                <CardHeader>
                  <CardTitle>Metas y Objetivos</CardTitle>
                  <CardDescription>
                    Establece tus metas mensuales y anuales para mejorar tu rendimiento
                  </CardDescription>
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
                          onChange={e =>
                            updateGoals('monthlyProperties', parseInt(e.target.value) || 0)
                          }
                          className="w-full px-3 py-2 bg-white text-gray-900 border border-gray-300 rounded-md focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
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
                          onChange={e =>
                            updateGoals('monthlyRevenue', parseInt(e.target.value) || 0)
                          }
                          className="w-full px-3 py-2 bg-white text-gray-900 border border-gray-300 rounded-md focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
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
                          onChange={e =>
                            updateGoals('monthlyClients', parseInt(e.target.value) || 0)
                          }
                          className="w-full px-3 py-2 bg-white text-gray-900 border border-gray-300 rounded-md focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
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
                          onChange={e =>
                            updateGoals('yearlyProperties', parseInt(e.target.value) || 0)
                          }
                          className="w-full px-3 py-2 bg-white text-gray-900 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
                          onChange={e =>
                            updateGoals('yearlyRevenue', parseInt(e.target.value) || 0)
                          }
                          className="w-full px-3 py-2 bg-white text-gray-900 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
                          onChange={e =>
                            updateGoals('yearlyClients', parseInt(e.target.value) || 0)
                          }
                          className="w-full px-3 py-2 bg-white text-gray-900 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
                        onChange={e =>
                          updateGoals('commissionTarget', parseInt(e.target.value) || 0)
                        }
                        className="w-full px-3 py-2 bg-white text-gray-900 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
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
                        onChange={e => updateGoals('notificationsEnabled', e.target.checked)}
                        className="sr-only"
                      />
                      <div
                        className={`relative inline-block w-10 h-6 rounded-full transition-colors ${
                          settings.goals.notificationsEnabled ? 'bg-emerald-500' : 'bg-gray-300'
                        }`}
                      >
                        <span
                          className={`absolute left-1 top-1 w-4 h-4 bg-white rounded-full transition-transform ${
                            settings.goals.notificationsEnabled ? 'translate-x-4' : 'translate-x-0'
                          }`}
                        />
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

            {activeTab === 'documents' && (
              <Card>
                <CardHeader>
                  <CardTitle>Documentos Requeridos</CardTitle>
                  <CardDescription>
                    Sube y gestiona los documentos necesarios para tu aprobación como corredor de
                    propiedades
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Documentos Personales Obligatorios */}
                  <div>
                    <h4 className="text-lg font-semibold mb-4 text-emerald-700">
                      Documentos Personales Obligatorios
                    </h4>
                    <div className="space-y-4">
                      {/* Cédula de Identidad */}
                      <div className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <div
                            className={`p-2 rounded-lg ${settings.documents.idCard.status === 'approved' ? 'bg-green-100' : settings.documents.idCard.status === 'uploaded' ? 'bg-blue-100' : 'bg-gray-100'}`}
                          >
                            {settings.documents.idCard.status === 'approved' ? (
                              <CheckCircle className="w-5 h-5 text-green-600" />
                            ) : settings.documents.idCard.status === 'uploaded' ? (
                              <Upload className="w-5 h-5 text-blue-600" />
                            ) : (
                              <AlertCircle className="w-5 h-5 text-gray-600" />
                            )}
                          </div>
                          <div>
                            <h5 className="font-medium">Cédula de Identidad</h5>
                            <p className="text-sm text-gray-600">
                              {settings.documents.idCard.name ||
                                'Documento requerido para verificación de identidad'}
                            </p>
                            {settings.documents.idCard.uploadedAt && (
                              <p className="text-xs text-gray-500">
                                Subido:{' '}
                                {new Date(settings.documents.idCard.uploadedAt).toLocaleDateString(
                                  'es-ES'
                                )}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {settings.documents.idCard.status === 'pending' ? (
                            <label className="cursor-pointer">
                              <input
                                type="file"
                                accept=".pdf,.jpg,.jpeg,.png"
                                onChange={e =>
                                  e.target.files?.[0] &&
                                  handleFileUpload('idCard', e.target.files[0])
                                }
                                className="hidden"
                              />
                              <Button size="sm" variant="outline">
                                <Upload className="w-4 h-4 mr-2" />
                                Subir
                              </Button>
                            </label>
                          ) : (
                            <div className="flex gap-2">
                              {settings.documents.idCard.url && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() =>
                                    window.open(settings.documents.idCard.url, '_blank')
                                  }
                                >
                                  <Eye className="w-4 h-4 mr-2" />
                                  Ver
                                </Button>
                              )}
                              <Badge
                                variant={
                                  settings.documents.idCard.status === 'approved'
                                    ? 'default'
                                    : settings.documents.idCard.status === 'uploaded'
                                      ? 'secondary'
                                      : 'outline'
                                }
                              >
                                {settings.documents.idCard.status === 'approved'
                                  ? 'Aprobado'
                                  : settings.documents.idCard.status === 'uploaded'
                                    ? 'Pendiente de revisión'
                                    : 'Pendiente'}
                              </Badge>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Certificado de Antecedentes */}
                      <div className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <div
                            className={`p-2 rounded-lg ${settings.documents.criminalRecord.status === 'approved' ? 'bg-green-100' : settings.documents.criminalRecord.status === 'uploaded' ? 'bg-blue-100' : 'bg-gray-100'}`}
                          >
                            {settings.documents.criminalRecord.status === 'approved' ? (
                              <CheckCircle className="w-5 h-5 text-green-600" />
                            ) : settings.documents.criminalRecord.status === 'uploaded' ? (
                              <Upload className="w-5 h-5 text-blue-600" />
                            ) : (
                              <AlertCircle className="w-5 h-5 text-gray-600" />
                            )}
                          </div>
                          <div>
                            <h5 className="font-medium">Certificado de Antecedentes</h5>
                            <p className="text-sm text-gray-600">
                              {settings.documents.criminalRecord.name ||
                                'Certificado de antecedentes penales (vigencia máxima 3 meses)'}
                            </p>
                            {settings.documents.criminalRecord.uploadedAt && (
                              <p className="text-xs text-gray-500">
                                Subido:{' '}
                                {new Date(
                                  settings.documents.criminalRecord.uploadedAt
                                ).toLocaleDateString('es-ES')}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {settings.documents.criminalRecord.status === 'pending' ? (
                            <label className="cursor-pointer">
                              <input
                                type="file"
                                accept=".pdf,.jpg,.jpeg,.png"
                                onChange={e =>
                                  e.target.files?.[0] &&
                                  handleFileUpload('criminalRecord', e.target.files[0])
                                }
                                className="hidden"
                              />
                              <Button size="sm" variant="outline">
                                <Upload className="w-4 h-4 mr-2" />
                                Subir
                              </Button>
                            </label>
                          ) : (
                            <div className="flex gap-2">
                              {settings.documents.criminalRecord.url && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() =>
                                    window.open(settings.documents.criminalRecord.url, '_blank')
                                  }
                                >
                                  <Eye className="w-4 h-4 mr-2" />
                                  Ver
                                </Button>
                              )}
                              <Badge
                                variant={
                                  settings.documents.criminalRecord.status === 'approved'
                                    ? 'default'
                                    : settings.documents.criminalRecord.status === 'uploaded'
                                      ? 'secondary'
                                      : 'outline'
                                }
                              >
                                {settings.documents.criminalRecord.status === 'approved'
                                  ? 'Aprobado'
                                  : settings.documents.criminalRecord.status === 'uploaded'
                                    ? 'Pendiente de revisión'
                                    : 'Pendiente'}
                              </Badge>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Título Profesional */}
                      <div className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <div
                            className={`p-2 rounded-lg ${settings.documents.professionalTitle.status === 'approved' ? 'bg-green-100' : settings.documents.professionalTitle.status === 'uploaded' ? 'bg-blue-100' : 'bg-gray-100'}`}
                          >
                            {settings.documents.professionalTitle.status === 'approved' ? (
                              <CheckCircle className="w-5 h-5 text-green-600" />
                            ) : settings.documents.professionalTitle.status === 'uploaded' ? (
                              <Upload className="w-5 h-5 text-blue-600" />
                            ) : (
                              <AlertCircle className="w-5 h-5 text-gray-600" />
                            )}
                          </div>
                          <div>
                            <h5 className="font-medium">Título Profesional</h5>
                            <p className="text-sm text-gray-600">
                              {settings.documents.professionalTitle.name ||
                                'Fotocopia legalizada del título universitario'}
                            </p>
                            {settings.documents.professionalTitle.uploadedAt && (
                              <p className="text-xs text-gray-500">
                                Subido:{' '}
                                {new Date(
                                  settings.documents.professionalTitle.uploadedAt
                                ).toLocaleDateString('es-ES')}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {settings.documents.professionalTitle.status === 'pending' ? (
                            <label className="cursor-pointer">
                              <input
                                type="file"
                                accept=".pdf,.jpg,.jpeg,.png"
                                onChange={e =>
                                  e.target.files?.[0] &&
                                  handleFileUpload('professionalTitle', e.target.files[0])
                                }
                                className="hidden"
                              />
                              <Button size="sm" variant="outline">
                                <Upload className="w-4 h-4 mr-2" />
                                Subir
                              </Button>
                            </label>
                          ) : (
                            <div className="flex gap-2">
                              {settings.documents.professionalTitle.url && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() =>
                                    window.open(settings.documents.professionalTitle.url, '_blank')
                                  }
                                >
                                  <Eye className="w-4 h-4 mr-2" />
                                  Ver
                                </Button>
                              )}
                              <Badge
                                variant={
                                  settings.documents.professionalTitle.status === 'approved'
                                    ? 'default'
                                    : settings.documents.professionalTitle.status === 'uploaded'
                                      ? 'secondary'
                                      : 'outline'
                                }
                              >
                                {settings.documents.professionalTitle.status === 'approved'
                                  ? 'Aprobado'
                                  : settings.documents.professionalTitle.status === 'uploaded'
                                    ? 'Pendiente de revisión'
                                    : 'Pendiente'}
                              </Badge>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Registro de Corredor */}
                      <div className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <div
                            className={`p-2 rounded-lg ${settings.documents.brokerRegistration.status === 'approved' ? 'bg-green-100' : settings.documents.brokerRegistration.status === 'uploaded' ? 'bg-blue-100' : 'bg-gray-100'}`}
                          >
                            {settings.documents.brokerRegistration.status === 'approved' ? (
                              <CheckCircle className="w-5 h-5 text-green-600" />
                            ) : settings.documents.brokerRegistration.status === 'uploaded' ? (
                              <Upload className="w-5 h-5 text-blue-600" />
                            ) : (
                              <AlertCircle className="w-5 h-5 text-gray-600" />
                            )}
                          </div>
                          <div>
                            <h5 className="font-medium">Registro de Corredor</h5>
                            <p className="text-sm text-gray-600">
                              {settings.documents.brokerRegistration.name ||
                                'Registro oficial como corredor de propiedades'}
                            </p>
                            {settings.documents.brokerRegistration.uploadedAt && (
                              <p className="text-xs text-gray-500">
                                Subido:{' '}
                                {new Date(
                                  settings.documents.brokerRegistration.uploadedAt
                                ).toLocaleDateString('es-ES')}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {settings.documents.brokerRegistration.status === 'pending' ? (
                            <label className="cursor-pointer">
                              <input
                                type="file"
                                accept=".pdf,.jpg,.jpeg,.png"
                                onChange={e =>
                                  e.target.files?.[0] &&
                                  handleFileUpload('brokerRegistration', e.target.files[0])
                                }
                                className="hidden"
                              />
                              <Button size="sm" variant="outline">
                                <Upload className="w-4 h-4 mr-2" />
                                Subir
                              </Button>
                            </label>
                          ) : (
                            <div className="flex gap-2">
                              {settings.documents.brokerRegistration.url && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() =>
                                    window.open(settings.documents.brokerRegistration.url, '_blank')
                                  }
                                >
                                  <Eye className="w-4 h-4 mr-2" />
                                  Ver
                                </Button>
                              )}
                              <Badge
                                variant={
                                  settings.documents.brokerRegistration.status === 'approved'
                                    ? 'default'
                                    : settings.documents.brokerRegistration.status === 'uploaded'
                                      ? 'secondary'
                                      : 'outline'
                                }
                              >
                                {settings.documents.brokerRegistration.status === 'approved'
                                  ? 'Aprobado'
                                  : settings.documents.brokerRegistration.status === 'uploaded'
                                    ? 'Pendiente de revisión'
                                    : 'Pendiente'}
                              </Badge>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Certificados de Cursos */}
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="text-lg font-semibold text-blue-700">
                        Certificados de Cursos
                      </h4>
                      <label className="cursor-pointer">
                        <input
                          type="file"
                          accept=".pdf,.jpg,.jpeg,.png"
                          multiple
                          onChange={e => {
                            if (e.target.files) {
                              Array.from(e.target.files).forEach(file =>
                                handleAddCertificate(file)
                              );
                            }
                          }}
                          className="hidden"
                        />
                        <Button size="sm" variant="outline">
                          <Plus className="w-4 h-4 mr-2" />
                          Agregar Certificado
                        </Button>
                      </label>
                    </div>
                    <div className="space-y-2">
                      {settings.documents.courseCertificates.length === 0 ? (
                        <div className="text-center py-8 text-gray-500">
                          <FileText className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                          <p>No hay certificados de cursos subidos</p>
                          <p className="text-sm">
                            Agrega certificados de cursos relacionados con bienes raíces
                          </p>
                        </div>
                      ) : (
                        settings.documents.courseCertificates.map((cert, index) => (
                          <div
                            key={index}
                            className="flex items-center justify-between p-3 border rounded-lg"
                          >
                            <div className="flex items-center gap-3">
                              <div
                                className={`p-2 rounded-lg ${cert.status === 'approved' ? 'bg-green-100' : cert.status === 'uploaded' ? 'bg-blue-100' : 'bg-gray-100'}`}
                              >
                                {cert.status === 'approved' ? (
                                  <CheckCircle className="w-4 h-4 text-green-600" />
                                ) : (
                                  <Upload className="w-4 h-4 text-blue-600" />
                                )}
                              </div>
                              <div>
                                <p className="font-medium text-sm">{cert.name}</p>
                                <p className="text-xs text-gray-500">
                                  Subido: {new Date(cert.uploadedAt!).toLocaleDateString('es-ES')}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => window.open(cert.url, '_blank')}
                              >
                                <Eye className="w-4 h-4" />
                              </Button>
                              <Badge variant={cert.status === 'approved' ? 'default' : 'secondary'}>
                                {cert.status === 'approved' ? 'Aprobado' : 'Pendiente'}
                              </Badge>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  {/* Documentos de Empresa */}
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="text-lg font-semibold text-purple-700">
                        Documentos de Empresa
                      </h4>
                      <label className="cursor-pointer">
                        <input
                          type="file"
                          accept=".pdf,.jpg,.jpeg,.png"
                          multiple
                          onChange={e => {
                            if (e.target.files) {
                              Array.from(e.target.files).forEach(file =>
                                handleAddCompanyDocument(file)
                              );
                            }
                          }}
                          className="hidden"
                        />
                        <Button size="sm" variant="outline">
                          <Plus className="w-4 h-4 mr-2" />
                          Agregar Documento
                        </Button>
                      </label>
                    </div>
                    <div className="space-y-2">
                      {settings.documents.companyDocuments.length === 0 ? (
                        <div className="text-center py-8 text-gray-500">
                          <Building className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                          <p>No hay documentos de empresa subidos</p>
                          <p className="text-sm">
                            Agrega documentos como RUT de empresa, registro comercial, etc.
                          </p>
                        </div>
                      ) : (
                        settings.documents.companyDocuments.map((doc, index) => (
                          <div
                            key={index}
                            className="flex items-center justify-between p-3 border rounded-lg"
                          >
                            <div className="flex items-center gap-3">
                              <div
                                className={`p-2 rounded-lg ${doc.status === 'approved' ? 'bg-green-100' : doc.status === 'uploaded' ? 'bg-blue-100' : 'bg-gray-100'}`}
                              >
                                {doc.status === 'approved' ? (
                                  <CheckCircle className="w-4 h-4 text-green-600" />
                                ) : (
                                  <Upload className="w-4 h-4 text-blue-600" />
                                )}
                              </div>
                              <div>
                                <p className="font-medium text-sm">{doc.name}</p>
                                <p className="text-xs text-gray-500">
                                  Subido: {new Date(doc.uploadedAt!).toLocaleDateString('es-ES')}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => window.open(doc.url, '_blank')}
                              >
                                <Eye className="w-4 h-4" />
                              </Button>
                              <Badge variant={doc.status === 'approved' ? 'default' : 'secondary'}>
                                {doc.status === 'approved' ? 'Aprobado' : 'Pendiente'}
                              </Badge>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  {/* Estado General */}
                  <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-4 rounded-lg">
                    <h4 className="font-semibold mb-3 text-gray-800">Estado de Documentación</h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <div className="text-gray-600">Documentos Obligatorios</div>
                        <div className="font-semibold">
                          {[
                            settings.documents.idCard.status !== 'pending' ? 1 : 0,
                            settings.documents.criminalRecord.status !== 'pending' ? 1 : 0,
                            settings.documents.professionalTitle.status !== 'pending' ? 1 : 0,
                            settings.documents.brokerRegistration.status !== 'pending' ? 1 : 0,
                          ].reduce((a, b) => a + b, 0)}
                          /4
                        </div>
                      </div>
                      <div>
                        <div className="text-gray-600">Certificados</div>
                        <div className="font-semibold">
                          {settings.documents.courseCertificates.length}
                        </div>
                      </div>
                      <div>
                        <div className="text-gray-600">Docs Empresa</div>
                        <div className="font-semibold">
                          {settings.documents.companyDocuments.length}
                        </div>
                      </div>
                      <div>
                        <div className="text-gray-600">Estado General</div>
                        <div className="font-semibold text-emerald-600">
                          {[
                            settings.documents.idCard.status === 'approved' ? 1 : 0,
                            settings.documents.criminalRecord.status === 'approved' ? 1 : 0,
                            settings.documents.professionalTitle.status === 'approved' ? 1 : 0,
                            settings.documents.brokerRegistration.status === 'approved' ? 1 : 0,
                          ].reduce((a, b) => a + b, 0) === 4
                            ? 'Completo'
                            : 'Pendiente'}
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
                  <h3 className="font-medium">
                    {settings.profile.firstName} {settings.profile.lastName}
                  </h3>
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
                    <Badge>{dashboardData?.stats?.totalProperties || 0}</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Contratos Activos</span>
                    <Badge>{dashboardData?.stats?.activeContracts || 0}</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Comisiones ($)</span>
                    <Badge>
                      {new Intl.NumberFormat('es-CL', {
                        style: 'currency',
                        currency: 'CLP',
                        minimumFractionDigits: 0,
                      }).format(dashboardData?.stats?.pendingCommissions || 0)}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Valor Portafolio</span>
                    <Badge>
                      {new Intl.NumberFormat('es-CL', {
                        style: 'currency',
                        currency: 'CLP',
                        minimumFractionDigits: 0,
                      }).format(dashboardData?.stats?.portfolioValue || 0)}
                    </Badge>
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
                    {dashboardData?.stats?.activeContracts > 0 ? (
                      <CheckCircle className="w-5 h-5 text-green-600" />
                    ) : (
                      <AlertTriangle className="w-5 h-5 text-yellow-600" />
                    )}
                    <span className="text-sm">
                      {dashboardData?.stats?.activeContracts > 0
                        ? `${dashboardData.stats.activeContracts} contratos activos`
                        : 'Sin contratos activos'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    {dashboardData?.stats?.pendingCommissions > 0 ? (
                      <CheckCircle className="w-5 h-5 text-blue-600" />
                    ) : (
                      <AlertTriangle className="w-5 h-5 text-gray-400" />
                    )}
                    <span className="text-sm">
                      {dashboardData?.stats?.pendingCommissions > 0
                        ? `Comisiones pendientes: ${new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', minimumFractionDigits: 0 }).format(dashboardData.stats.pendingCommissions)}`
                        : 'Sin comisiones pendientes'}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </UnifiedDashboardLayout>
  );
}

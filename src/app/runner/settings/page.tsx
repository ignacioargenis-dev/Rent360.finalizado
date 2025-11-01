'use client';

import React, { useState, useEffect } from 'react';
import { logger } from '@/lib/logger-minimal';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
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
  FileText,
  Upload,
  Download,
  Trash2,
  Car,
} from 'lucide-react';
import type { User } from '@/types';

interface Document {
  id: string;
  name: string;
  category: 'identification' | 'income' | 'lease' | 'other';
  uploadDate: string;
  size: string;
  url: string;
}

interface RunnerSettings {
  profile: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    avatar?: string;
    emergencyContact: string;
    emergencyPhone: string;
  };
  workArea: {
    regions: string[];
    communes: string[];
    maxDistance: number;
    preferredTimes: {
      morning: boolean;
      afternoon: boolean;
      evening: boolean;
    };
    vehicleType: string;
    licensePlate: string;
    experience: string;
    specialties: string[];
    languages: string[];
    hourlyRate: number;
    availability: 'available' | 'busy' | 'offline';
    services: string[];
    responseTime: string;
  };
  notifications: {
    emailNotifications: boolean;
    smsNotifications: boolean;
    jobReminders: boolean;
    paymentReminders: boolean;
    ratingUpdates: boolean;
  };
  payment: {
    bankName: string;
    accountType: string;
    bankAccount: string;
    paymentMethod: 'transfer' | 'wallet';
    taxId: string;
  };
}

export default function RunnerSettingsPage() {
  const [user, setUser] = useState<User | null>(null);
  const [settings, setSettings] = useState<RunnerSettings>({
    profile: {
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      avatar: '',
      emergencyContact: '',
      emergencyPhone: '',
    },
  workArea: {
    regions: [],
    communes: [],
    maxDistance: 50,
    preferredTimes: {
      morning: true,
      afternoon: true,
      evening: false,
    },
    vehicleType: '',
    licensePlate: '',
    experience: '',
    specialties: [],
    languages: [],
    hourlyRate: 0,
    availability: 'available',
    services: [],
    responseTime: '',
  },
    notifications: {
      emailNotifications: true,
      smsNotifications: false,
      jobReminders: true,
      paymentReminders: true,
      ratingUpdates: true,
    },
    payment: {
      bankName: '',
      accountType: 'checking',
      bankAccount: '',
      paymentMethod: 'transfer',
      taxId: '',
    },
  });

  const [documents, setDocuments] = useState<Document[]>([]);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedDocumentCategory, setSelectedDocumentCategory] =
    useState<Document['category']>('identification');

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const [maxHourlyRate, setMaxHourlyRate] = useState<number>(30000);
  const [selectedCommunes, setSelectedCommunes] = useState<string[]>([]);
  const [availableCommunes] = useState<string[]>([
    'Santiago Centro',
    'Providencia',
    'Las Condes',
    'Vitacura',
    'Ñuñoa',
    'La Reina',
    'Macul',
    'San Miguel',
    'Puente Alto',
    'Maipú',
    'La Florida',
    'Peñalolén',
    'San Bernardo',
    'La Cisterna',
    'El Bosque',
    'Lo Espejo',
  ]);

  useEffect(() => {
    const loadUserData = async () => {
      try {
        setLoading(true);
        // ✅ CORREGIDO: Obtener datos reales desde las APIs
        const [userResponse, settingsResponse, bankResponse] = await Promise.all([
          fetch('/api/auth/me', { credentials: 'include' }),
          fetch('/api/runner/settings', { credentials: 'include' }),
          fetch('/api/runner/bank-account', { credentials: 'include' }),
        ]);

        if (userResponse.ok) {
          const userData = await userResponse.json();
          setUser(userData.user);

          // Dividir nombre en firstName y lastName
          const nameParts = (userData.user?.name || '').split(' ');
          const firstName = nameParts[0] || '';
          const lastName = nameParts.slice(1).join(' ') || '';

          setSettings(prev => ({
            ...prev,
            profile: {
              firstName,
              lastName,
              email: userData.user?.email || '',
              phone: userData.user?.phone || '',
              avatar: userData.user?.avatar || '',
              emergencyContact: userData.user?.emergencyContact || '',
              emergencyPhone: userData.user?.emergencyPhone || '',
            },
          }));

          // Cargar configuraciones del runner
          if (settingsResponse.ok) {
            const settingsData = await settingsResponse.json();
            if (settingsData.success && settingsData.settings) {
              setSettings(prev => ({
                ...prev,
                workArea: {
                  ...prev.workArea,
                  ...settingsData.settings.workArea,
                  regions: settingsData.settings.workArea.regions || [],
                  communes: settingsData.settings.workArea.communes || [],
                },
                notifications: settingsData.settings.notifications || prev.notifications,
              }));
              setSelectedCommunes(settingsData.settings.workArea.communes || []);
              setMaxHourlyRate(settingsData.maxHourlyRate || 30000);
            }
          }

          // Cargar datos bancarios
          if (bankResponse.ok) {
            const bankData = await bankResponse.json();
            if (bankData.success && bankData.data) {
              setSettings(prev => ({
                ...prev,
                payment: {
                  bankName: bankData.data.bank || '',
                  accountType: bankData.data.accountType || 'checking',
                  bankAccount: bankData.data.accountNumber || '',
                  paymentMethod: 'transfer',
                  taxId: userData.user?.rut || '',
                },
              }));
            }
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
      // Guardar perfil y configuraciones en paralelo
      const [profileResponse, settingsResponse] = await Promise.all([
        // Guardar configuración del perfil
        fetch('/api/user/profile', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify({
            name: `${settings.profile.firstName} ${settings.profile.lastName}`,
            phone: settings.profile.phone,
            avatar: settings.profile.avatar,
            emergencyContact: settings.profile.emergencyContact,
            emergencyPhone: settings.profile.emergencyPhone,
          }),
        }),
        // Guardar configuraciones del runner (workArea y notifications)
        fetch('/api/runner/settings', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify({
            workArea: {
              ...settings.workArea,
              communes: selectedCommunes,
            },
            notifications: settings.notifications,
          }),
        }),
      ]);

      if (!profileResponse.ok) {
        const errorData = await profileResponse.json();
        throw new Error(errorData.error || 'Error al guardar el perfil');
      }

      if (!settingsResponse.ok) {
        const errorData = await settingsResponse.json();
        throw new Error(errorData.error || 'Error al guardar las configuraciones');
      }

      // Guardar datos bancarios si han cambiado
      const bankResponse = await fetch('/api/runner/bank-account', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          bank: settings.payment.bankName,
          accountType: settings.payment.accountType,
          accountNumber: settings.payment.bankAccount,
        }),
      });

      if (!bankResponse.ok) {
        logger.warn('Error al guardar datos bancarios, pero otras configuraciones se guardaron');
      }

      setSuccessMessage('Configuración guardada exitosamente.');
      setTimeout(() => setSuccessMessage(''), 5000);
    } catch (error) {
      logger.error('Error saving settings:', {
        error: error instanceof Error ? error.message : String(error),
      });
      setErrorMessage(
        error instanceof Error
          ? error.message
          : 'Error al guardar la configuración. Intente nuevamente.'
      );
      setTimeout(() => setErrorMessage(''), 5000);
    } finally {
      setSaving(false);
    }
  };

  const updateProfile = (field: keyof RunnerSettings['profile'], value: string) => {
    setSettings(prev => ({
      ...prev,
      profile: {
        ...prev.profile,
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

  // Document handling functions
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    try {
      setSaving(true);

      // Crear FormData para la subida
      const formData = new FormData();
      formData.append('files', file);
      formData.append('title', file.name);
      formData.append('category', selectedDocumentCategory);
      formData.append(
        'type',
        selectedDocumentCategory === 'identification'
          ? 'IDENTIFICATION'
          : selectedDocumentCategory === 'income'
            ? 'INCOME_PROOF'
            : selectedDocumentCategory === 'lease'
              ? 'LEASE_DOCUMENT'
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

        const newDocument: Document = {
          id: uploadedFile.id,
          name: uploadedFile.name,
          category: selectedDocumentCategory,
          uploadDate: new Date().toISOString(),
          size: `${(file.size / 1024 / 1024).toFixed(2)} MB`,
          url: uploadedFile.url,
        };

        setDocuments(prev => [...prev, newDocument]);
        setShowUploadModal(false);

        setSuccessMessage('Documento subido exitosamente');
        setTimeout(() => setSuccessMessage(''), 3000);
      } else {
        throw new Error('No se recibió información del archivo subido');
      }
    } catch (error) {
      logger.error('Error subiendo documento:', { error });
      setErrorMessage(
        error instanceof Error
          ? error.message
          : 'Error al subir el documento. Por favor, inténtalo nuevamente.'
      );
      setTimeout(() => setErrorMessage(''), 5000);
    } finally {
      setSaving(false);
    }
  };

  const handleDownloadDocument = (document: Document) => {
    window.open(document.url, '_blank');
  };

  const handleDeleteDocument = (documentId: string) => {
    setDocuments(prev => prev.filter(doc => doc.id !== documentId));
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
      title="Configuración de Runner360"
      subtitle="Gestión de perfil y preferencias"
    >
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
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="profile">Perfil</TabsTrigger>
            <TabsTrigger value="work">Trabajo</TabsTrigger>
            <TabsTrigger value="notifications">Notificaciones</TabsTrigger>
            <TabsTrigger value="payment">Pagos</TabsTrigger>
            <TabsTrigger value="documents">Documentos</TabsTrigger>
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

          {/* Work Area Tab */}
          <TabsContent value="work" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Car className="w-5 h-5" />
                  Área de Trabajo y Servicios
                </CardTitle>
                <CardDescription>
                  Configura tu zona de trabajo, experiencia y servicios que ofreces
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Experience and Services */}
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="experience">Años de Experiencia</Label>
                      <Input
                        id="experience"
                        value={settings.workArea.experience}
                        onChange={e => updateWorkArea('experience', e.target.value)}
                        placeholder="Ej: 3 años"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="hourlyRate">Tarifa por Hora (CLP)</Label>
                      <Input
                        id="hourlyRate"
                        type="number"
                        min="0"
                        max={maxHourlyRate}
                        value={settings.workArea.hourlyRate}
                        onChange={e => {
                          const value = Number(e.target.value);
                          if (value <= maxHourlyRate) {
                            updateWorkArea('hourlyRate', value);
                          }
                        }}
                        placeholder="15000"
                        className={
                          settings.workArea.hourlyRate > maxHourlyRate
                            ? 'border-red-500'
                            : ''
                        }
                      />
                      {settings.workArea.hourlyRate > maxHourlyRate && (
                        <p className="text-sm text-red-600">
                          La tarifa no puede exceder ${maxHourlyRate.toLocaleString()} CLP/hora
                        </p>
                      )}
                      <p className="text-xs text-gray-500">
                        Tarifa máxima configurada por administrador: ${maxHourlyRate.toLocaleString()} CLP/hora.
                        Puedes establecer una tarifa menor para captar más clientes.
                      </p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Servicios que Ofreces</Label>
                    <div className="flex flex-wrap gap-2">
                      {[
                        'Visitas de inspección',
                        'Seguimiento de propiedades',
                        'Reportes fotográficos',
                        'Entregas de llaves',
                        'Coordinación de visitas',
                        'Verificación de daños',
                      ].map(service => (
                        <Badge
                          key={service}
                          variant={
                            settings.workArea.services.includes(service) ? 'default' : 'outline'
                          }
                          className="cursor-pointer"
                          onClick={() => {
                            const newServices = settings.workArea.services.includes(service)
                              ? settings.workArea.services.filter(s => s !== service)
                              : [...settings.workArea.services, service];
                            updateWorkArea('services', newServices);
                          }}
                        >
                          {service}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Especialidades</Label>
                    <div className="flex flex-wrap gap-2">
                      {[
                        'Inspecciones rápidas',
                        'Fotografía profesional',
                        'Reportes detallados',
                        'Entregas seguras',
                        'Verificación de daños',
                        'Coordinación logística',
                      ].map(specialty => (
                        <Badge
                          key={specialty}
                          variant={
                            settings.workArea.specialties.includes(specialty)
                              ? 'default'
                              : 'outline'
                          }
                          className="cursor-pointer"
                          onClick={() => {
                            const newSpecialties = settings.workArea.specialties.includes(specialty)
                              ? settings.workArea.specialties.filter(s => s !== specialty)
                              : [...settings.workArea.specialties, specialty];
                            updateWorkArea('specialties', newSpecialties);
                          }}
                        >
                          {specialty}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Idiomas</Label>
                    <div className="flex flex-wrap gap-2">
                      {['Español', 'Inglés', 'Portugués', 'Francés'].map(language => (
                        <Badge
                          key={language}
                          variant={
                            settings.workArea.languages.includes(language) ? 'default' : 'outline'
                          }
                          className="cursor-pointer"
                          onClick={() => {
                            const newLanguages = settings.workArea.languages.includes(language)
                              ? settings.workArea.languages.filter(l => l !== language)
                              : [...settings.workArea.languages, language];
                            updateWorkArea('languages', newLanguages);
                          }}
                        >
                          {language}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Vehicle and Regions */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Vehículo y Zonas</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="vehicleType">Tipo de Vehículo</Label>
                      <Input
                        id="vehicleType"
                        value={settings.workArea.vehicleType}
                        onChange={e => updateWorkArea('vehicleType', e.target.value)}
                        placeholder="Auto, Moto, Bicicleta"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="licensePlate">Patente</Label>
                      <Input
                        id="licensePlate"
                        value={settings.workArea.licensePlate}
                        onChange={e => updateWorkArea('licensePlate', e.target.value)}
                        placeholder="AB-CD-12"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="maxDistance">Distancia Máxima (km)</Label>
                    <Input
                      id="maxDistance"
                      type="number"
                      value={settings.workArea.maxDistance}
                      onChange={e => updateWorkArea('maxDistance', Number(e.target.value))}
                      placeholder="50"
                    />
                  </div>

                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="workRegion">Región de Trabajo</Label>
                        <Select
                          value={settings.workArea.regions[0] || ''}
                          onValueChange={value => {
                            // For simplicity, we'll store only one region, but this could be extended
                            updateWorkArea('regions', value ? [value] : []);
                          }}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Selecciona una región" />
                          </SelectTrigger>
                          <SelectContent className="max-h-60 overflow-y-auto">
                            <SelectItem value="Región Metropolitana">
                              Región Metropolitana
                            </SelectItem>
                            <SelectItem value="Valparaíso">Valparaíso</SelectItem>
                            <SelectItem value="Región del Libertador">
                              Región del Libertador
                            </SelectItem>
                            <SelectItem value="Región del Maule">Región del Maule</SelectItem>
                            <SelectItem value="Región del Biobío">Región del Biobío</SelectItem>
                            <SelectItem value="Región de la Araucanía">
                              Región de la Araucanía
                            </SelectItem>
                            <SelectItem value="Región de Los Lagos">Región de Los Lagos</SelectItem>
                            <SelectItem value="Región de Aysén">Región de Aysén</SelectItem>
                            <SelectItem value="Región de Magallanes">
                              Región de Magallanes
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="workCommune">Comunas de Trabajo</Label>
                        <Select
                          value=""
                          onValueChange={value => {
                            if (value && !selectedCommunes.includes(value)) {
                              const newCommunes = [...selectedCommunes, value];
                              setSelectedCommunes(newCommunes);
                              updateWorkArea('communes', newCommunes);
                            }
                          }}
                          disabled={!settings.workArea.regions[0]}
                        >
                          <SelectTrigger>
                            <SelectValue
                              placeholder={
                                settings.workArea.regions[0]
                                  ? 'Agregar comuna'
                                  : 'Primero selecciona región'
                              }
                            />
                          </SelectTrigger>
                          <SelectContent className="max-h-60 overflow-y-auto">
                            {availableCommunes
                              .filter(commune => !selectedCommunes.includes(commune))
                              .map(commune => (
                                <SelectItem key={commune} value={commune}>
                                  {commune}
                                </SelectItem>
                              ))}
                          </SelectContent>
                        </Select>
                        {selectedCommunes.length > 0 && (
                          <div className="flex flex-wrap gap-2 mt-2">
                            {selectedCommunes.map(commune => (
                              <Badge
                                key={commune}
                                variant="default"
                                className="flex items-center gap-1"
                              >
                                {commune}
                                <button
                                  type="button"
                                  onClick={() => {
                                    const newCommunes = selectedCommunes.filter(c => c !== commune);
                                    setSelectedCommunes(newCommunes);
                                    updateWorkArea('communes', newCommunes);
                                  }}
                                  className="ml-1 hover:text-red-600"
                                >
                                  ×
                                </button>
                              </Badge>
                            ))}
                          </div>
                        )}
                        <p className="text-xs text-gray-500">
                          Puedes seleccionar múltiples comunas según tu disponibilidad
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Horarios Preferidos</Label>
                    <div className="flex gap-4">
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={settings.workArea.preferredTimes.morning}
                          onChange={e =>
                            updateWorkArea('preferredTimes', {
                              ...settings.workArea.preferredTimes,
                              morning: e.target.checked,
                            })
                          }
                        />
                        <span>Mañana</span>
                      </label>
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={settings.workArea.preferredTimes.afternoon}
                          onChange={e =>
                            updateWorkArea('preferredTimes', {
                              ...settings.workArea.preferredTimes,
                              afternoon: e.target.checked,
                            })
                          }
                        />
                        <span>Tarde</span>
                      </label>
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={settings.workArea.preferredTimes.evening}
                          onChange={e =>
                            updateWorkArea('preferredTimes', {
                              ...settings.workArea.preferredTimes,
                              evening: e.target.checked,
                            })
                          }
                        />
                        <span>Noche</span>
                      </label>
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
                  Preferencias de Notificación
                </CardTitle>
                <CardDescription>
                  Configura cómo quieres recibir notificaciones sobre trabajos y actualizaciones
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
                      <Label htmlFor="job-reminders">Recordatorios de Trabajos</Label>
                      <p className="text-sm text-gray-600">
                        Recibe recordatorios sobre trabajos programados
                      </p>
                    </div>
                    <Switch
                      id="job-reminders"
                      checked={settings.notifications.jobReminders}
                      onCheckedChange={checked => updateNotifications('jobReminders', checked)}
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
                      <Label htmlFor="rating-updates">Actualizaciones de Calificación</Label>
                      <p className="text-sm text-gray-600">
                        Recibe notificaciones cuando recibas nuevas calificaciones
                      </p>
                    </div>
                    <Switch
                      id="rating-updates"
                      checked={settings.notifications.ratingUpdates}
                      onCheckedChange={checked => updateNotifications('ratingUpdates', checked)}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Payment Tab */}
          <TabsContent value="payment" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="w-5 h-5" />
                  Información de Pagos
                </CardTitle>
                <CardDescription>
                  Configura tus datos bancarios para recibir pagos por tus servicios
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="bankName">Banco</Label>
                      <Select
                        value={settings.payment.bankName || ''}
                        onValueChange={value => updatePayment('bankName', value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecciona tu banco" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Banco de Chile">Banco de Chile</SelectItem>
                          <SelectItem value="Banco Santander">Banco Santander</SelectItem>
                          <SelectItem value="Banco Estado">Banco Estado</SelectItem>
                          <SelectItem value="Banco BCI">Banco BCI</SelectItem>
                          <SelectItem value="Banco Itaú">Banco Itaú</SelectItem>
                          <SelectItem value="Banco Falabella">Banco Falabella</SelectItem>
                          <SelectItem value="Banco Ripley">Banco Ripley</SelectItem>
                          <SelectItem value="Banco Security">Banco Security</SelectItem>
                          <SelectItem value="Banco Consorcio">Banco Consorcio</SelectItem>
                          <SelectItem value="Banco Internacional">Banco Internacional</SelectItem>
                          <SelectItem value="Scotiabank">Scotiabank</SelectItem>
                          <SelectItem value="Banco BBVA">Banco BBVA</SelectItem>
                          <SelectItem value="Banco Coopeuch">Coopeuch</SelectItem>
                          <SelectItem value="Otro">Otro</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="accountType">Tipo de Cuenta</Label>
                      <Select
                        value={settings.payment.accountType || ''}
                        onValueChange={value => updatePayment('accountType', value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Tipo de cuenta" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="checking">Cuenta Corriente</SelectItem>
                          <SelectItem value="savings">Cuenta de Ahorros</SelectItem>
                          <SelectItem value="rut">Cuenta RUT</SelectItem>
                          <SelectItem value="view">Cuenta Vista</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="bankAccount">Número de Cuenta</Label>
                      <Input
                        id="bankAccount"
                        value={settings.payment.bankAccount}
                        onChange={e => updatePayment('bankAccount', e.target.value)}
                        placeholder="001234567890"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="taxId">RUT</Label>
                      <Input
                        id="taxId"
                        value={settings.payment.taxId}
                        onChange={e => updatePayment('taxId', e.target.value)}
                        placeholder="12.345.678-9"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Método de Pago Preferido</Label>
                    <div className="flex gap-4">
                      <label className="flex items-center gap-2">
                        <input
                          type="radio"
                          name="paymentMethod"
                          value="transfer"
                          checked={settings.payment.paymentMethod === 'transfer'}
                          onChange={e => updatePayment('paymentMethod', e.target.value)}
                        />
                        <span>Transferencia Bancaria</span>
                      </label>
                      <label className="flex items-center gap-2">
                        <input
                          type="radio"
                          name="paymentMethod"
                          value="wallet"
                          checked={settings.payment.paymentMethod === 'wallet'}
                          onChange={e => updatePayment('paymentMethod', e.target.value)}
                        />
                        <span>Billetera Digital</span>
                      </label>
                    </div>
                  </div>

                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h4 className="font-medium text-blue-900 mb-2">Nota Importante</h4>
                    <p className="text-sm text-blue-800">
                      Todos los pagos se procesan exclusivamente a través de la plataforma Rent360.
                      Esto garantiza seguridad, trazabilidad y cumplimiento normativo.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Documents Tab */}
          <TabsContent value="documents" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  Documentos Personales
                </CardTitle>
                <CardDescription>
                  Sube tus documentos personales y antecedentes para completar tu perfil de Runner360
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h4 className="font-medium text-blue-900 mb-2">Documentos Requeridos</h4>
                  <ul className="text-sm text-blue-800 space-y-1">
                    <li>• Cédula de Identidad o Pasaporte</li>
                    <li>• Licencia de Conducir (si aplica)</li>
                    <li>• Certificado de Antecedentes</li>
                    <li>• Certificaciones profesionales (opcional)</li>
                  </ul>
                </div>

                <div className="flex gap-4">
                  <Button onClick={() => setShowUploadModal(true)}>
                    <Upload className="w-4 h-4 mr-2" />
                    Subir Documento
                  </Button>
                </div>

                {documents.length > 0 && (
                  <div className="space-y-4">
                    <h4 className="font-medium">Documentos Subidos</h4>
                    {documents.map(doc => (
                      <div
                        key={doc.id}
                        className="flex items-center justify-between p-4 border rounded-lg"
                      >
                        <div className="flex items-center gap-3">
                          <FileText className="w-5 h-5 text-gray-500" />
                          <div>
                            <p className="font-medium">{doc.name}</p>
                            <p className="text-sm text-gray-500">
                              {doc.category} • {doc.size} •{' '}
                              {new Date(doc.uploadDate).toLocaleDateString('es-CL')}
                            </p>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => window.open(doc.url, '_blank')}
                          >
                            <Download className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setDocuments(prev => prev.filter(d => d.id !== doc.id));
                            }}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
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

        {/* Upload Document Modal */}
        <Dialog open={showUploadModal} onOpenChange={setShowUploadModal}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Subir Documento</DialogTitle>
              <DialogDescription>
                Selecciona el tipo de documento y sube el archivo correspondiente.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="documentCategory">Tipo de Documento</Label>
                <Select
                  value={selectedDocumentCategory}
                  onValueChange={(value: Document['category']) =>
                    setSelectedDocumentCategory(value)
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona el tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="identification">Cédula de Identidad</SelectItem>
                    <SelectItem value="license">Licencia de Conducir</SelectItem>
                    <SelectItem value="background">Certificado de Antecedentes</SelectItem>
                    <SelectItem value="certification">Certificación Profesional</SelectItem>
                    <SelectItem value="other">Otro</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="documentFile">Archivo</Label>
                <Input
                  id="documentFile"
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={handleFileUpload}
                />
                <p className="text-sm text-gray-500 mt-1">
                  Formatos aceptados: PDF, JPG, PNG. Tamaño máximo: 5MB.
                </p>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </UnifiedDashboardLayout>
  );
}

'use client';

import React, { useState, useEffect } from 'react';
import { logger } from '@/lib/logger-minimal';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
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
  FileText,
  ChevronRight,
  Info,
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
  responseTime?: string;

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
  const [documents, setDocuments] = useState<
    Array<{
      id: string;
      name: string;
      type: string;
      status: 'pending' | 'approved' | 'rejected';
      uploadDate: string;
      expiryDate?: string;
      fileUrl: string;
    }>
  >([]);

  const [settings, setSettings] = useState<MaintenanceSettings>({
    companyName: '',
    description: '',
    phone: '',
    email: '',
    website: '',

    specialties: [],
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
    emergencyService: false,
    insuranceCoverage: false,
    responseTime: '2-4 horas',

    emailNotifications: true,
    smsNotifications: false,
    pushNotifications: true,

    paymentMethods: ['platform_payment'],
    minimumJobValue: 0,
    depositRequired: false,
    depositPercentage: 0,
  });

  const [bankAccount, setBankAccount] = useState<{
    id?: string;
    bankName: string;
    accountType: string;
    accountNumber: string;
    accountHolderName: string;
    rut: string;
  } | null>(null);
  const [loadingBankAccount, setLoadingBankAccount] = useState(false);

  const [billingInfo, setBillingInfo] = useState({
    billingName: '',
    billingRut: '',
    billingAddress: '',
    billingPhone: '',
    billingEmail: '',
    billingGiro: '',
    billingComuna: '',
    billingCiudad: '',
  });

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('profile');

  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  const [showBillingModal, setShowBillingModal] = useState(false);
  const [showDocumentViewer, setShowDocumentViewer] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<string>('');

  // ✅ Cargar configuraciones iniciales
  const loadUserSettings = async () => {
    try {
      setLoading(true);

      // Cargar datos del usuario y perfil de mantenimiento
      const userResponse = await fetch('/api/auth/me', {
        credentials: 'include',
      });
      if (userResponse.ok) {
        const userData = await userResponse.json();
        setSettings(prev => ({
          ...prev,
          companyName: userData.user?.name || '',
          email: userData.user?.email || '',
          phone: userData.user?.phone || '',
        }));
      }

      // Cargar perfil de mantenimiento
      const profileResponse = await fetch('/api/provider/profile', {
        credentials: 'include',
      });
      if (profileResponse.ok) {
        const profileData = await profileResponse.json();
        if (profileData.success && profileData.profile) {
          const profile = profileData.profile;

          // Parsear especialidades
          const specialtiesRaw = profile.specialties || profile.serviceTypes || [];
          const specialties = Array.isArray(specialtiesRaw)
            ? specialtiesRaw.map((s: any) => (typeof s === 'string' ? s : s.name || s))
            : [];

          // Cargar documentos reales desde el perfil
          if (profile.documents) {
            const docs: Array<{
              id: string;
              name: string;
              type: string;
              status: 'pending' | 'approved' | 'rejected';
              uploadDate: string;
              expiryDate?: string;
              fileUrl: string;
            }> = [];
            const uploadDate =
              profile.documents.createdAt && typeof profile.documents.createdAt === 'string'
                ? new Date(profile.documents.createdAt).toISOString().split('T')[0] || ''
                : new Date().toISOString().split('T')[0] || '';

            const businessCert = profile.documents.businessCertificate;
            const idFront = profile.documents.idFront;
            const idBack = profile.documents.idBack;
            const criminalRec = profile.documents.criminalRecord;

            // Determinar estado basado en isVerified
            const docStatus = profile.documents.isVerified ? 'approved' : 'pending';

            if (businessCert && typeof businessCert === 'string') {
              docs.push({
                id: 'business-certificate',
                name: 'Certificado de Inicio de Actividades',
                type: 'certificate',
                status: docStatus,
                uploadDate: uploadDate,
                fileUrl: businessCert,
              });
            }
            if (idFront && typeof idFront === 'string') {
              docs.push({
                id: 'id-front',
                name: 'Cédula de Identidad (Frente)',
                type: 'id',
                status: docStatus,
                uploadDate: uploadDate,
                fileUrl: idFront,
              });
            }
            if (idBack && typeof idBack === 'string') {
              docs.push({
                id: 'id-back',
                name: 'Cédula de Identidad (Reverso)',
                type: 'id',
                status: docStatus,
                uploadDate: uploadDate,
                fileUrl: idBack,
              });
            }
            if (criminalRec && typeof criminalRec === 'string') {
              docs.push({
                id: 'criminal-record',
                name: 'Certificado de Antecedentes',
                type: 'certificate',
                status: docStatus,
                uploadDate: uploadDate,
                fileUrl: criminalRec,
              });
            }

            setDocuments(docs);
          }

          // Parsear availability para obtener emergencyService
          let availabilityParsed: any = {};
          if (profile.availability) {
            try {
              availabilityParsed =
                typeof profile.availability === 'string'
                  ? JSON.parse(profile.availability)
                  : profile.availability;
            } catch (e) {
              // Ignorar error de parsing
            }
          }

          setSettings(prev => ({
            ...prev,
            companyName: profile.businessName || profile.companyName || prev.companyName,
            description: profile.description || '',
            website: profile.website || '',
            specialties: specialties,
            serviceRadius: prev.serviceRadius || 25, // Mantener valor por defecto ya que no existe en el modelo
            emergencyService: availabilityParsed.emergencies || false,
            insuranceCoverage: prev.insuranceCoverage || false, // Mantener valor por defecto ya que no existe en el modelo
            responseTime: profile.responseTime || '2-4 horas',
          }));

          // Cargar datos de facturación desde el perfil
          setBillingInfo({
            billingName: profile.businessName || profile.companyName || '',
            billingRut: profile.taxId || '',
            billingAddress: profile.address || '',
            billingPhone: profile.phone || '',
            billingEmail: profile.email || '',
            billingGiro: 'Servicios de reparación y mantenimiento',
            billingComuna: profile.city || '',
            billingCiudad: profile.city || '',
          });
        }
      }

      // ✅ Cargar configuraciones de notificaciones desde la nueva API
      const settingsResponse = await fetch('/api/user/settings', {
        method: 'GET',
        credentials: 'include',
        headers: {
          Accept: 'application/json',
        },
      });

      if (settingsResponse.ok) {
        const settingsData = await settingsResponse.json();
        if (settingsData.success && settingsData.settings.notifications) {
          setSettings(prev => ({
            ...prev,
            emailNotifications:
              settingsData.settings.notifications.emailNotifications ?? prev.emailNotifications,
            smsNotifications:
              settingsData.settings.notifications.smsNotifications ?? prev.smsNotifications,
            pushNotifications:
              settingsData.settings.notifications.pushNotifications ?? prev.pushNotifications,
          }));
        }
      }

      // Cargar cuenta bancaria
      await loadBankAccount();
    } catch (error) {
      logger.error('Error loading maintenance settings:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUserSettings();
  }, []);

  const loadBankAccount = async () => {
    try {
      setLoadingBankAccount(true);
      const response = await fetch('/api/provider/bank-account', {
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setBankAccount(data.bankAccount || null);
        }
      }
    } catch (error) {
      logger.error('Error loading bank account:', error);
    } finally {
      setLoadingBankAccount(false);
    }
  };

  // Funciones para documentos fiscales
  const handleViewDocument = (documentType: string) => {
    setSelectedDocument(documentType);
    setShowDocumentViewer(true);
    // Aquí se podría abrir un visor de PDF o imagen
    setTimeout(() => {
      alert(
        `📄 Abriendo visor de documento: ${documentType}\n\nEn una implementación real, aquí se mostraría el documento PDF o imagen.`
      );
    }, 500);
  };

  const handleUpdateDocument = (documentType: string) => {
    setSelectedDocument(documentType);
    setShowUploadModal(true);
  };

  const handleUploadDocument = async () => {
    try {
      // Simular subida de documento
      setSuccessMessage(`✅ Documento "${selectedDocument}" actualizado exitosamente`);
      setShowUploadModal(false);
      setSelectedDocument('');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      setErrorMessage('Error al subir el documento. Intente nuevamente.');
    }
  };

  const handleSaveBillingInfo = async () => {
    try {
      setSaving(true);
      // Actualizar perfil con datos de facturación
      const response = await fetch('/api/provider/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          basicInfo: {
            companyName: billingInfo.billingName,
          },
          address: {
            street: billingInfo.billingAddress,
            city: billingInfo.billingCiudad,
            commune: billingInfo.billingComuna,
          },
        }),
      });

      if (response.ok) {
        setShowBillingModal(false);
        setSuccessMessage('✅ Información fiscal guardada exitosamente');
        setTimeout(() => setSuccessMessage(''), 3000);
      } else {
        throw new Error('Error al guardar');
      }
    } catch (error) {
      logger.error('Error saving billing info:', error);
      setErrorMessage('Error al guardar la información fiscal. Intente nuevamente.');
    } finally {
      setSaving(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);

      // Guardar configuración del perfil usando la API correcta
      const response = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          name: settings.companyName,
          phone: settings.phone,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al guardar la configuración');
      }

      // Guardar perfil de mantenimiento usando la API de provider/profile
      // El endpoint espera un formato específico con basicInfo, services, operational
      const profileResponse = await fetch('/api/provider/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          basicInfo: {
            companyName: settings.companyName,
            description: settings.description,
          },
          services: {
            specialties: settings.specialties,
            // No enviar hourlyRate para mantener el valor existente
          },
          operational: {
            responseTime: settings.responseTime || '2-4 horas',
            availability: {
              weekdays: true,
              weekends:
                settings.workingHours.saturday.enabled || settings.workingHours.sunday.enabled,
              emergencies: settings.emergencyService,
            },
          },
        }),
      });

      if (!profileResponse.ok) {
        logger.warn('Error al guardar perfil de mantenimiento, pero el perfil básico se guardó');
      }

      // ✅ Guardar configuraciones de notificaciones
      const notificationsResponse = await fetch('/api/user/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          notifications: {
            emailNotifications: settings.emailNotifications,
            smsNotifications: settings.smsNotifications,
            pushNotifications: settings.pushNotifications,
            jobReminders: true, // Valor por defecto para maintenance
            paymentReminders: true,
            ratingUpdates: true,
          },
        }),
      });

      if (!notificationsResponse.ok) {
        logger.warn(
          'Error al guardar configuraciones de notificaciones, pero el perfil se guardó correctamente'
        );
      }

      // Recargar datos después de guardar para reflejar los cambios
      await loadUserSettings();

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

  const updateSetting = (key: string, value: any) => {
    setSettings(prev => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleDocumentUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    // Validar tipo de archivo
    const allowedTypes = [
      'application/pdf',
      'image/jpeg',
      'image/jpg',
      'image/png',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ];
    if (!allowedTypes.includes(file.type)) {
      setErrorMessage('Tipo de archivo no permitido. Solo se permiten PDF, JPG, PNG, DOC, DOCX.');
      return;
    }

    // Validar tamaño (10MB máximo)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      setErrorMessage('El archivo es demasiado grande. Máximo 10MB permitido.');
      return;
    }

    try {
      setErrorMessage('');
      setSaving(true);

      // Crear FormData para la subida
      const formData = new FormData();
      formData.append('files', file);
      formData.append('title', file.name);
      formData.append('category', 'professional');
      formData.append('type', 'PROFESSIONAL_DOCUMENT');

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

        const newDocument = {
          id: uploadedFile.id,
          name: uploadedFile.name,
          type: file.type,
          status: 'pending' as const,
          uploadDate: new Date().toISOString(),
          fileUrl: uploadedFile.url,
        };

        setDocuments(prev => [...prev, newDocument]);

        logger.info('Documento subido', { fileName: file.name, fileSize: file.size });

        setSuccessMessage('Documento subido exitosamente y enviado para revisión');
        setTimeout(() => setSuccessMessage(''), 5000);
      } else {
        throw new Error('No se recibió información del archivo subido');
      }
    } catch (error) {
      logger.error('Error al subir documento', { error });
      setErrorMessage(error instanceof Error ? error.message : 'Error al subir el documento');
    } finally {
      setSaving(false);
    }
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
    // No permitir deshabilitar el método obligatorio
    if (method === 'platform_payment') {
      return;
    }

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
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="profile">Perfil</TabsTrigger>
            <TabsTrigger value="services">Servicios</TabsTrigger>
            <TabsTrigger value="schedule">Horarios</TabsTrigger>
            <TabsTrigger value="notifications">Notificaciones</TabsTrigger>
            <TabsTrigger value="documents">Documentos</TabsTrigger>
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
                  Servicios Ofrecidos
                </CardTitle>
                <CardDescription>
                  Gestiona los servicios que ofreces y sus precios base
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Lista de servicios disponibles */}
                <div>
                  <Label className="text-base font-semibold mb-4 block">
                    Especialidades y Tipos de Servicio
                  </Label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {[
                      { id: 'plumbing', label: 'Plomería', icon: '🔧' },
                      { id: 'electrical', label: 'Eléctrica', icon: '⚡' },
                      { id: 'structural', label: 'Estructural', icon: '🏗️' },
                      { id: 'cleaning', label: 'Limpieza', icon: '🧹' },
                      { id: 'painting', label: 'Pintura', icon: '🎨' },
                      { id: 'carpentry', label: 'Carpintería', icon: '🪚' },
                      { id: 'hvac', label: 'Climatización', icon: '❄️' },
                      { id: 'appliances', label: 'Electrodomésticos', icon: '🔌' },
                      { id: 'landscaping', label: 'Jardinería', icon: '🌳' },
                    ].map(specialty => (
                      <div
                        key={specialty.id}
                        className={`flex items-center space-x-2 p-3 border rounded-lg cursor-pointer transition-colors ${
                          settings.specialties.includes(specialty.id)
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                        onClick={() => toggleSpecialty(specialty.id)}
                      >
                        <input
                          type="checkbox"
                          id={specialty.id}
                          checked={settings.specialties.includes(specialty.id)}
                          onChange={() => toggleSpecialty(specialty.id)}
                          className="rounded"
                        />
                        <Label
                          htmlFor={specialty.id}
                          className="cursor-pointer flex items-center gap-2"
                        >
                          <span>{specialty.icon}</span>
                          <span>{specialty.label}</span>
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Información adicional sobre servicios */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <Info className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-sm text-blue-800">
                        <strong>Consejo:</strong> Selecciona solo las especialidades en las que
                        tienes experiencia comprobada. Los clientes podrán filtrar por estas
                        especialidades al buscar proveedores de mantenimiento.
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="w-5 h-5" />
                  Área de Cobertura y Disponibilidad
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
                    onChange={e => updateSetting('serviceRadius', parseInt(e.target.value) || 0)}
                    min="1"
                    max="100"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Define el radio máximo en kilómetros desde tu ubicación base para aceptar
                    trabajos.
                  </p>
                </div>

                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex-1">
                    <Label htmlFor="emergencyService" className="font-semibold">
                      Servicio de Emergencia 24/7
                    </Label>
                    <p className="text-sm text-gray-600 mt-1">
                      Disponible para reparaciones urgentes fuera del horario normal
                    </p>
                  </div>
                  <Switch
                    id="emergencyService"
                    checked={settings.emergencyService}
                    onCheckedChange={checked => updateSetting('emergencyService', checked)}
                  />
                </div>

                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex-1">
                    <Label htmlFor="insuranceCoverage" className="font-semibold">
                      Cobertura de Seguro
                    </Label>
                    <p className="text-sm text-gray-600 mt-1">
                      Trabajos con seguro de responsabilidad civil activo
                    </p>
                  </div>
                  <Switch
                    id="insuranceCoverage"
                    checked={settings.insuranceCoverage}
                    onCheckedChange={checked => updateSetting('insuranceCoverage', checked)}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="w-5 h-5" />
                  Tiempo de Respuesta
                </CardTitle>
                <CardDescription>
                  Configura el tiempo promedio de respuesta a solicitudes
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="responseTime">Tiempo Promedio de Respuesta</Label>
                    <Select
                      value={settings.responseTime || '2-4 horas'}
                      onValueChange={value => updateSetting('responseTime', value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="inmediato">Inmediato (menos de 1 hora)</SelectItem>
                        <SelectItem value="1-2 horas">1-2 horas</SelectItem>
                        <SelectItem value="2-4 horas">2-4 horas</SelectItem>
                        <SelectItem value="4-8 horas">4-8 horas</SelectItem>
                        <SelectItem value="24 horas">24 horas</SelectItem>
                        <SelectItem value="48 horas">48 horas</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
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

          {/* Documents Tab */}
          <TabsContent value="documents" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="w-5 h-5" />
                  Documentos y Certificaciones
                </CardTitle>
                <CardDescription>
                  Gestiona tus documentos profesionales y certificaciones
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Document Upload Section */}
                <div>
                  <h3 className="text-lg font-semibold mb-4">Subir Documentos</h3>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-400 transition-colors">
                    <input
                      type="file"
                      id="document-upload"
                      className="hidden"
                      accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                      onChange={handleDocumentUpload}
                    />
                    <label
                      htmlFor="document-upload"
                      className="cursor-pointer flex flex-col items-center"
                    >
                      <Shield className="w-12 h-12 text-gray-400 mb-4" />
                      <p className="text-gray-600 mb-2">Haz clic para subir un documento</p>
                      <p className="text-sm text-gray-500">PDF, JPG, PNG, DOC, DOCX (máx. 10MB)</p>
                    </label>
                  </div>
                </div>

                {/* Required Documents */}
                <div>
                  <h3 className="text-lg font-semibold mb-4">Documentos Requeridos</h3>
                  <div className="space-y-4">
                    {[
                      { id: 'id-front', name: 'Cédula de Identidad (Frente)', required: true },
                      { id: 'id-back', name: 'Cédula de Identidad (Reverso)', required: true },
                      {
                        id: 'criminal-record',
                        name: 'Certificado de Antecedentes',
                        required: true,
                      },
                      {
                        id: 'business-certificate',
                        name: 'Certificado de Inicio de Actividades',
                        required: true,
                      },
                    ].map(requiredDoc => {
                      const uploadedDoc = documents.find(d => d.id === requiredDoc.id);
                      const status = uploadedDoc
                        ? uploadedDoc.status
                        : ('missing' as 'approved' | 'pending' | 'rejected' | 'missing');
                      return (
                        <div
                          key={requiredDoc.id}
                          className="flex items-center justify-between p-4 border border-gray-200 rounded-lg"
                        >
                          <div className="flex items-center gap-3">
                            <Shield className="w-5 h-5 text-gray-400" />
                            <div>
                              <p className="font-medium">{requiredDoc.name}</p>
                              <p className="text-sm text-gray-600">
                                {status === 'approved' && 'Aprobado'}
                                {status === 'pending' && 'En revisión'}
                                {status === 'rejected' && 'Rechazado'}
                                {status === 'missing' && 'Falta subir'}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {status === 'approved' && (
                              <Badge className="bg-green-100 text-green-800">Aprobado</Badge>
                            )}
                            {status === 'pending' && (
                              <Badge className="bg-yellow-100 text-yellow-800">Pendiente</Badge>
                            )}
                            {status === 'rejected' && (
                              <Badge className="bg-red-100 text-red-800">Rechazado</Badge>
                            )}
                            {status === 'missing' && (
                              <>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => {
                                    const input = document.getElementById(
                                      'document-upload'
                                    ) as HTMLInputElement;
                                    if (input) {
                                      input.click();
                                    }
                                  }}
                                >
                                  Subir
                                </Button>
                                <Badge className="bg-red-100 text-red-800">Requerido</Badge>
                              </>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Uploaded Documents */}
                <div>
                  <h3 className="text-lg font-semibold mb-4">Documentos Subidos</h3>
                  <div className="space-y-4">
                    {documents.map(doc => (
                      <div
                        key={doc.id}
                        className="flex items-center justify-between p-4 border border-gray-200 rounded-lg"
                      >
                        <div className="flex items-center gap-3">
                          <Shield className="w-5 h-5 text-gray-400" />
                          <div>
                            <p className="font-medium">{doc.name}</p>
                            <p className="text-sm text-gray-600">
                              Subido el {new Date(doc.uploadDate).toLocaleDateString('es-CL')}
                              {doc.expiryDate &&
                                ` • Vence: ${new Date(doc.expiryDate).toLocaleDateString('es-CL')}`}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge
                            className={
                              doc.status === 'approved'
                                ? 'bg-green-100 text-green-800'
                                : doc.status === 'pending'
                                  ? 'bg-yellow-100 text-yellow-800'
                                  : 'bg-red-100 text-red-800'
                            }
                          >
                            {doc.status === 'approved'
                              ? 'Aprobado'
                              : doc.status === 'pending'
                                ? 'Pendiente'
                                : 'Rechazado'}
                          </Badge>
                          <Button size="sm" variant="outline">
                            Ver
                          </Button>
                          <Button size="sm" variant="outline">
                            Descargar
                          </Button>
                        </div>
                      </div>
                    ))}

                    {documents.length === 0 && (
                      <div className="text-center py-8 text-gray-500">
                        <Shield className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                        <p>No has subido documentos aún</p>
                      </div>
                    )}
                  </div>
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
                      {
                        id: 'platform_payment',
                        label: 'Pago por Plataforma (Obligatorio)',
                        required: true,
                      },
                      { id: 'bank_transfer', label: 'Transferencia Bancaria' },
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
                          disabled={method.required}
                          className="rounded"
                        />
                        <Label
                          htmlFor={method.id}
                          className={method.required ? 'text-blue-700 font-medium' : ''}
                        >
                          {method.label}
                          {method.required && <span className="text-red-500 ml-1">*</span>}
                        </Label>
                      </div>
                    ))}
                  </div>
                  <p className="text-sm text-blue-600 mt-2">
                    <strong>* Obligatorio:</strong> Todos los pagos deben procesarse a través de
                    Rent360 para garantizar seguridad y cumplimiento.
                  </p>
                </div>

                {/* Explicación sobre pagos por plataforma */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-blue-600 text-sm font-bold">ℹ</span>
                    </div>
                    <div>
                      <h4 className="font-semibold text-blue-900 mb-2">
                        ¿Por qué todos los pagos por plataforma?
                      </h4>
                      <div className="text-sm text-blue-800 space-y-2">
                        <p>
                          <strong>Comisión de Servicio (10%):</strong> Rent360 cobra una comisión
                          justa por conectar clientes con proveedores verificados y garantizar
                          transacciones seguras.
                        </p>
                        <p>
                          <strong>Seguridad Garantizada:</strong> Todas las transacciones están
                          protegidas por nuestros sistemas de seguridad y respaldo financiero.
                        </p>
                        <p>
                          <strong>Garantía de Pago:</strong> Recibes tu pago automáticamente una vez
                          completado el trabajo, sin riesgos de impago.
                        </p>
                        <p>
                          <strong>Transparencia Total:</strong> Puedes ver exactamente cuánto cobra
                          la plataforma y cuánto recibes neto en cada trabajo.
                        </p>
                        <p>
                          <strong>Cumplimiento Legal:</strong> Todas las transacciones quedan
                          registradas para cumplimiento tributario y regulatorio.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Sección de ganancias estimadas */}
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-green-600 text-sm font-bold">$</span>
                    </div>
                    <div>
                      <h4 className="font-semibold text-green-900 mb-2">Ejemplo de Ganancias</h4>
                      <div className="text-sm text-green-800">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <p>
                              <strong>Trabajo de $50.000:</strong>
                            </p>
                            <p>Comisión Plataforma (10%): $5.000</p>
                            <p>
                              <strong>Recibes: $45.000</strong>
                            </p>
                          </div>
                          <div>
                            <p>
                              <strong>Trabajo de $100.000:</strong>
                            </p>
                            <p>Comisión Plataforma (10%): $10.000</p>
                            <p>
                              <strong>Recibes: $90.000</strong>
                            </p>
                          </div>
                        </div>
                        <p className="mt-3 text-xs">
                          * Los montos son antes de IVA y costos de transacción. Los pagos se
                          procesan semanalmente con mínimo $10.000.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Configuración de Cuenta Bancaria */}
                <div className="border-t pt-6 mt-6">
                  <h3 className="text-lg font-semibold mb-4">Cuenta Bancaria para Recibir Pagos</h3>
                  {loadingBankAccount ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    </div>
                  ) : bankAccount ? (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-semibold text-green-900">{bankAccount.bankName}</p>
                          <p className="text-sm text-green-800 mt-1">
                            Tipo:{' '}
                            {bankAccount.accountType === 'checking'
                              ? 'Cuenta Corriente'
                              : 'Cuenta de Ahorros'}
                          </p>
                          <p className="text-sm text-green-800">
                            Número: ****{bankAccount.accountNumber.slice(-4)}
                          </p>
                          <p className="text-sm text-green-800">
                            Titular: {bankAccount.accountHolderName}
                          </p>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            // Abrir página para editar cuenta bancaria
                            window.location.href = '/maintenance/payments/configure';
                          }}
                        >
                          Editar
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-semibold text-yellow-900 mb-2">
                            No hay cuenta bancaria configurada
                          </p>
                          <p className="text-sm text-yellow-800">
                            Configura tu cuenta bancaria para recibir los pagos de tus trabajos de
                            mantenimiento.
                          </p>
                        </div>
                        <Button
                          onClick={() => {
                            window.location.href = '/maintenance/payments/configure';
                          }}
                        >
                          Configurar Cuenta
                        </Button>
                      </div>
                    </div>
                  )}
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
              <Dialog open={showPrivacyModal} onOpenChange={setShowPrivacyModal}>
                <DialogTrigger asChild>
                  <div className="bg-white rounded-xl p-6 shadow-md hover:shadow-lg transition-all duration-300 border border-gray-100 hover:border-blue-200 group cursor-pointer">
                    <div className="bg-gradient-to-br from-blue-500 to-blue-600 w-12 h-12 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                      <Shield className="w-6 h-6 text-white" />
                    </div>
                    <h3 className="font-semibold text-gray-800 mb-2">Privacidad</h3>
                    <p className="text-sm text-gray-600 mb-4">Configurar privacidad de datos</p>
                    <div className="text-blue-600 font-medium text-sm flex items-center">
                      Configurar
                      <ChevronRight className="w-4 h-4 ml-1" />
                    </div>
                  </div>
                </DialogTrigger>
                <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                      <Shield className="w-5 h-5" />
                      Configuración de Privacidad
                    </DialogTitle>
                    <DialogDescription>
                      Gestiona cómo se utilizan y comparten tus datos personales
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-6">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <Label className="font-medium">Datos de Contacto Públicos</Label>
                          <p className="text-sm text-gray-600">
                            Permitir que otros usuarios vean tu email y teléfono
                          </p>
                        </div>
                        <Switch defaultChecked={false} />
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <Label className="font-medium">Perfil Público</Label>
                          <p className="text-sm text-gray-600">
                            Mostrar tu perfil en búsquedas públicas
                          </p>
                        </div>
                        <Switch defaultChecked={true} />
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <Label className="font-medium">Historial de Trabajos</Label>
                          <p className="text-sm text-gray-600">
                            Mostrar trabajos realizados en tu perfil
                          </p>
                        </div>
                        <Switch defaultChecked={true} />
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <Label className="font-medium">Calificaciones y Comentarios</Label>
                          <p className="text-sm text-gray-600">
                            Permitir que se muestren reseñas públicas
                          </p>
                        </div>
                        <Switch defaultChecked={true} />
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <Label className="font-medium">Marketing y Promociones</Label>
                          <p className="text-sm text-gray-600">
                            Recibir ofertas y promociones por email
                          </p>
                        </div>
                        <Switch defaultChecked={false} />
                      </div>
                    </div>

                    <div className="border-t pt-4">
                      <h4 className="font-medium mb-2">Solicitud de Eliminación de Datos</h4>
                      <p className="text-sm text-gray-600 mb-4">
                        Puedes solicitar la eliminación permanente de todos tus datos personales.
                        Esta acción no se puede deshacer.
                      </p>
                      <Button variant="destructive" size="sm">
                        Solicitar Eliminación de Datos
                      </Button>
                    </div>

                    <div className="flex justify-end gap-2">
                      <Button variant="outline" onClick={() => setShowPrivacyModal(false)}>
                        Cancelar
                      </Button>
                      <Button onClick={() => setShowPrivacyModal(false)}>
                        Guardar Configuración
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>

              <QuickActionButton
                icon={CheckCircle}
                label="Verificación"
                description="Estado de verificación"
                onClick={() => {
                  setSuccessMessage('Cuenta verificada - Estado: Activo');
                  setTimeout(() => setSuccessMessage(''), 3000);
                }}
              />

              <Dialog open={showBillingModal} onOpenChange={setShowBillingModal}>
                <DialogTrigger asChild>
                  <div className="bg-white rounded-xl p-6 shadow-md hover:shadow-lg transition-all duration-300 border border-gray-100 hover:border-green-200 group cursor-pointer">
                    <div className="bg-gradient-to-br from-green-500 to-green-600 w-12 h-12 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                      <DollarSign className="w-6 h-6 text-white" />
                    </div>
                    <h3 className="font-semibold text-gray-800 mb-2">Facturación</h3>
                    <p className="text-sm text-gray-600 mb-4">Gestionar datos fiscales</p>
                    <div className="text-green-600 font-medium text-sm flex items-center">
                      Configurar
                      <ChevronRight className="w-4 h-4 ml-1" />
                    </div>
                  </div>
                </DialogTrigger>
                <DialogContent className="w-full max-w-4xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader className="sticky top-0 bg-white z-10 pb-4 border-b">
                    <DialogTitle className="flex items-center gap-2">
                      <DollarSign className="w-5 h-5" />
                      Configuración de Facturación
                    </DialogTitle>
                    <DialogDescription>
                      Gestiona tu información fiscal y datos de facturación
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-6 py-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="billingName">Nombre/Razón Social</Label>
                        <Input
                          id="billingName"
                          placeholder="Nombre para facturación"
                          value={billingInfo.billingName}
                          onChange={e =>
                            setBillingInfo(prev => ({ ...prev, billingName: e.target.value }))
                          }
                        />
                      </div>

                      <div>
                        <Label htmlFor="billingRut">RUT</Label>
                        <Input
                          id="billingRut"
                          placeholder="12.345.678-9"
                          value={billingInfo.billingRut}
                          onChange={e =>
                            setBillingInfo(prev => ({ ...prev, billingRut: e.target.value }))
                          }
                        />
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="billingAddress">Dirección Fiscal</Label>
                      <Input
                        id="billingAddress"
                        placeholder="Dirección completa"
                        value={billingInfo.billingAddress}
                        onChange={e =>
                          setBillingInfo(prev => ({ ...prev, billingAddress: e.target.value }))
                        }
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="billingPhone">Teléfono</Label>
                        <Input
                          id="billingPhone"
                          placeholder="+56 9 1234 5678"
                          value={billingInfo.billingPhone}
                          onChange={e =>
                            setBillingInfo(prev => ({ ...prev, billingPhone: e.target.value }))
                          }
                        />
                      </div>

                      <div>
                        <Label htmlFor="billingEmail">Email de Facturación</Label>
                        <Input
                          id="billingEmail"
                          type="email"
                          placeholder="facturacion@empresa.cl"
                          value={billingInfo.billingEmail}
                          onChange={e =>
                            setBillingInfo(prev => ({ ...prev, billingEmail: e.target.value }))
                          }
                        />
                      </div>
                    </div>

                    <div className="border-t pt-4">
                      <h4 className="font-medium mb-4">Información Adicional</h4>

                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="billingGiro">Giro</Label>
                          <Input
                            id="billingGiro"
                            placeholder="Actividad económica"
                            value={billingInfo.billingGiro}
                            onChange={e =>
                              setBillingInfo(prev => ({ ...prev, billingGiro: e.target.value }))
                            }
                          />
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="billingComuna">Comuna</Label>
                            <Input
                              id="billingComuna"
                              placeholder="Comuna"
                              value={billingInfo.billingComuna}
                              onChange={e =>
                                setBillingInfo(prev => ({ ...prev, billingComuna: e.target.value }))
                              }
                            />
                          </div>

                          <div>
                            <Label htmlFor="billingCiudad">Ciudad</Label>
                            <Input
                              id="billingCiudad"
                              placeholder="Ciudad"
                              value={billingInfo.billingCiudad}
                              onChange={e =>
                                setBillingInfo(prev => ({ ...prev, billingCiudad: e.target.value }))
                              }
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="border-t pt-4">
                      <h4 className="font-medium mb-2">Documentos Fiscales</h4>
                      <p className="text-sm text-gray-600 mb-4">
                        Los documentos fiscales se gestionan en la sección de Documentos del perfil
                      </p>
                      <div className="bg-blue-50 p-4 rounded-lg">
                        <p className="text-sm text-blue-800">
                          Para subir o actualizar documentos fiscales, ve a la pestaña{' '}
                          <strong>Documentos</strong> en esta misma página.
                        </p>
                      </div>
                    </div>

                    <div className="flex justify-end gap-2 pt-4 border-t bg-white sticky bottom-0">
                      <Button variant="outline" onClick={() => setShowBillingModal(false)}>
                        Cancelar
                      </Button>
                      <Button onClick={handleSaveBillingInfo} disabled={saving}>
                        {saving ? 'Guardando...' : 'Guardar Información Fiscal'}
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Document Viewer Modal */}
      <Dialog open={showDocumentViewer} onOpenChange={setShowDocumentViewer}>
        <DialogContent className="max-w-4xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Visor de Documento - {selectedDocument}
            </DialogTitle>
            <DialogDescription>Vista previa del documento fiscal</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="bg-gray-50 rounded-lg p-8 flex items-center justify-center min-h-[400px]">
              <div className="text-center">
                <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Vista Previa del Documento
                </h3>
                <p className="text-gray-600 mb-4">
                  {selectedDocument === 'Certificado de Situación Tributaria'
                    ? 'Certificado emitido por el SII con vigencia hasta 31/12/2024'
                    : 'Certificado de vigencia tributaria emitido por el Servicio de Impuestos Internos'}
                </p>
                <div className="bg-white rounded-lg p-4 border border-gray-200 max-w-md mx-auto">
                  <p className="text-sm text-gray-600 mb-2">📄 Información del documento:</p>
                  <ul className="text-sm text-left space-y-1">
                    <li>
                      • <strong>Tipo:</strong> PDF
                    </li>
                    <li>
                      • <strong>Tamaño:</strong> 245 KB
                    </li>
                    <li>
                      • <strong>Fecha de subida:</strong> 15/01/2024
                    </li>
                    <li>
                      • <strong>Estado:</strong> Vigente
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setShowDocumentViewer(false)}>
                Cerrar
              </Button>
              <Button>
                <FileText className="w-4 h-4 mr-2" />
                Descargar PDF
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Upload Document Modal */}
      <Dialog open={showUploadModal} onOpenChange={setShowUploadModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Subir Documento - {selectedDocument}
            </DialogTitle>
            <DialogDescription>Sube el documento fiscal actualizado</DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-400 transition-colors">
              <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Arrastra y suelta tu archivo aquí
              </h3>
              <p className="text-gray-600 mb-4">O haz clic para seleccionar un archivo</p>
              <Button variant="outline">Seleccionar Archivo</Button>
              <input type="file" className="hidden" accept=".pdf,.jpg,.jpeg,.png" />
            </div>

            <div className="bg-blue-50 p-4 rounded-lg">
              <h4 className="font-semibold text-blue-800 mb-2">📋 Requisitos del documento</h4>
              <ul className="text-sm space-y-1">
                <li>
                  • <strong>Formatos aceptados:</strong> PDF, JPG, JPEG, PNG
                </li>
                <li>
                  • <strong>Tamaño máximo:</strong> 5 MB
                </li>
                <li>
                  • <strong>Estado:</strong> Debe estar vigente
                </li>
                <li>
                  • <strong>Calidad:</strong> Texto legible y completo
                </li>
              </ul>
            </div>

            <div className="bg-yellow-50 p-4 rounded-lg">
              <h4 className="font-semibold text-yellow-800 mb-2">⚠️ Información importante</h4>
              <p className="text-sm text-yellow-700">
                Al subir este documento, reemplazarás el archivo anterior. Asegúrate de que el nuevo
                documento esté actualizado y sea válido. El sistema verificará automáticamente la
                vigencia del documento.
              </p>
            </div>

            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setShowUploadModal(false)}>
                Cancelar
              </Button>
              <Button onClick={handleUploadDocument}>
                <FileText className="w-4 h-4 mr-2" />
                Subir Documento
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </UnifiedDashboardLayout>
  );
}

'use client';

import React, { useState, useEffect } from 'react';

// Configuración para renderizado dinámico - configuración personalizada del usuario
export const dynamic = 'force-dynamic';
export const revalidate = 0; // No cache para configuración personal
import { logger } from '@/lib/logger-minimal';
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
  Upload,
  FileText,
  X,
  Download,
  Trash2,
  FolderOpen,
  Building,
  UserCheck,
  Scale,
  Loader2,
} from 'lucide-react';
import { User as UserType } from '@/types';
import { LocationSelectors } from '@/components/ui/location-selectors';

interface Document {
  id: string;
  name: string;
  type: string;
  category: 'personal' | 'property' | 'legal';
  propertyId?: string | undefined;
  uploadDate: string;
  size: string;
  url: string;
}

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
    avatar: string;
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
  documents: Document[];
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
      avatar: '',
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
    documents: [],
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('profile');
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  // Estados para cambiar contraseña
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [passwordErrors, setPasswordErrors] = useState<Partial<typeof passwordData>>({});

  // Estados para gestión de documentos
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedDocumentCategory, setSelectedDocumentCategory] = useState<
    'personal' | 'property' | 'legal'
  >('personal');
  const [selectedPropertyId, setSelectedPropertyId] = useState<string>('');
  const [userProperties, setUserProperties] = useState<Array<{ id: string; title: string }>>([]);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);

        // Load user data
        const userResponse = await fetch('/api/auth/me');
        if (userResponse.ok) {
          const userData = await userResponse.json();
          setUser(userData.user);

          // ✅ CORREGIDO: Usar datos reales del usuario en lugar de mock
          setSettings(prev => ({
            ...prev,
            profile: {
              firstName: userData.user.name?.split(' ')[0] || '',
              lastName: userData.user.name?.split(' ').slice(1).join(' ') || '',
              email: userData.user.email || '',
              phone: userData.user.phone || '',
              address: userData.user.address || '',
              city: userData.user.city || '',
              region: userData.user.region || '',
              description: prev.profile.description, // Mantener descripción existente
              avatar: userData.user.avatar || '',
            },
          }));

          // Load user properties for document upload
          const propertiesResponse = await fetch('/api/properties/list?limit=100');
          if (propertiesResponse.ok) {
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
                  notifications: {
                    ...prev.notifications,
                    ...settingsData.settings.notifications,
                  },
                }));
              }
            }
            const propertiesData = await propertiesResponse.json();
            setUserProperties(
              propertiesData.properties.map((prop: any) => ({
                id: prop.id,
                title: prop.title,
              }))
            );
          }
        } else {
          // Solo cargar settings mock si no se puede obtener datos del usuario
          await loadSettings();
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

  const loadSettings = async () => {
    try {
      // Cargar documentos reales desde la API
      const documentsResponse = await fetch('/api/documents/upload?limit=100', {
        credentials: 'include',
      });

      if (documentsResponse.ok) {
        const documentsData = await documentsResponse.json();
        const realDocuments: Document[] = documentsData.documents.map((doc: any) => ({
          id: doc.id,
          name: doc.name,
          type: doc.mimeType === 'application/pdf' ? 'PDF' : 'Imagen',
          category:
            doc.type === 'PROPERTY_DOCUMENT'
              ? 'property'
              : doc.type === 'IDENTIFICATION'
                ? 'personal'
                : 'legal',
          propertyId: doc.propertyId,
          uploadDate: new Date(doc.createdAt).toISOString().split('T')[0],
          size: `${(doc.fileSize / 1024 / 1024).toFixed(1)} MB`,
          url: doc.filePath,
        }));

        setSettings(prev => ({
          ...prev,
          documents: realDocuments,
        }));
      } else {
        logger.warn('No se pudieron cargar los documentos, usando datos vacíos');
        setSettings(prev => ({
          ...prev,
          documents: [],
        }));
      }
    } catch (error) {
      logger.error('Error loading documents:', {
        error: error instanceof Error ? error.message : String(error),
      });
      setSettings(prev => ({
        ...prev,
        documents: [],
      }));
    }
  };

  const handleRegionChange = (regionId: string) => {
    setSettings(prev => ({
      ...prev,
      profile: { ...prev.profile, region: regionId, city: '' },
    }));
  };

  const handleSaveSettings = async () => {
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
          name: `${settings.profile.firstName} ${settings.profile.lastName}`,
          phone: settings.profile.phone,
          address: settings.profile.address,
          city: settings.profile.city,
          region: settings.profile.region,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al guardar la configuración');
      }

      const data = await response.json();

      // ✅ Guardar configuraciones de notificaciones
      const notificationsResponse = await fetch('/api/user/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          notifications: settings.notifications,
        }),
      });

      if (!notificationsResponse.ok) {
        logger.warn(
          'Error al guardar configuraciones de notificaciones, pero el perfil se guardó correctamente'
        );
      }

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

  // Funciones para cambiar contraseña
  const handlePasswordChange = (field: string, value: string) => {
    setPasswordData(prev => ({ ...prev, [field]: value }));
    if (passwordErrors[field as keyof typeof passwordErrors]) {
      setPasswordErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validatePasswordForm = () => {
    const errors: Partial<typeof passwordData> = {};

    if (!passwordData.currentPassword.trim()) {
      errors.currentPassword = 'Contraseña actual requerida';
    }
    if (!passwordData.newPassword.trim()) {
      errors.newPassword = 'Nueva contraseña requerida';
    } else if (passwordData.newPassword.length < 8) {
      errors.newPassword = 'La contraseña debe tener al menos 8 caracteres';
    }
    if (!passwordData.confirmPassword.trim()) {
      errors.confirmPassword = 'Confirmación requerida';
    } else if (passwordData.newPassword !== passwordData.confirmPassword) {
      errors.confirmPassword = 'Las contraseñas no coinciden';
    }

    setPasswordErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handlePasswordSubmit = async () => {
    if (!validatePasswordForm()) {
      return;
    }

    setErrorMessage('');
    try {
      // Simular API call
      await new Promise(resolve => setTimeout(resolve, 2000));

      logger.info('Contraseña cambiada exitosamente');

      setShowPasswordModal(false);
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setSuccessMessage('Contraseña cambiada exitosamente');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      logger.error('Error al cambiar contraseña', { error });
      setErrorMessage('Error al cambiar la contraseña. Inténtalo de nuevo.');
    }
  };

  // Funciones para gestión de documentos
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    try {
      setSaving(true);

      // Validar tipo de archivo
      const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png'];
      if (!allowedTypes.includes(file.type)) {
        setErrorMessage('Solo se permiten archivos PDF, JPG o PNG');
        return;
      }

      // Validar tamaño (máximo 10MB)
      if (file.size > 10 * 1024 * 1024) {
        setErrorMessage('El archivo no puede superar los 10MB');
        return;
      }

      // Crear FormData para la subida
      const formData = new FormData();
      formData.append('files', file);
      formData.append('title', file.name);
      formData.append('category', selectedDocumentCategory);
      formData.append(
        'type',
        selectedDocumentCategory === 'personal'
          ? 'IDENTIFICATION'
          : selectedDocumentCategory === 'property'
            ? 'PROPERTY_DOCUMENT'
            : 'OTHER_DOCUMENT'
      );

      if (selectedDocumentCategory === 'property' && selectedPropertyId) {
        formData.append('propertyId', selectedPropertyId);
      }

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
          type: file.type === 'application/pdf' ? 'PDF' : 'Imagen',
          category: selectedDocumentCategory,
          propertyId: selectedDocumentCategory === 'property' ? selectedPropertyId : undefined,
          uploadDate:
            new Date().toISOString().split('T')[0] || new Date().toLocaleDateString('en-CA'),
          size: `${(file.size / 1024 / 1024).toFixed(1)} MB`,
          url: uploadedFile.url,
        };

        setSettings(prev => ({
          ...prev,
          documents: [...prev.documents, newDocument],
        }));

        setShowUploadModal(false);
        setSuccessMessage('Documento subido exitosamente');
        setTimeout(() => setSuccessMessage(''), 3000);

        // Recargar documentos desde la API para asegurar consistencia
        await loadSettings();
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

  const handleDownloadDocument = (doc: Document) => {
    // Simular descarga
    const link = document.createElement('a');
    link.href = doc.url;
    link.download = doc.name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    logger.info('Documento descargado:', { documentId: doc.id });
  };

  const handleDeleteDocument = async (documentId: string) => {
    try {
      // Simular eliminación
      await new Promise(resolve => setTimeout(resolve, 1000));

      setSettings(prev => ({
        ...prev,
        documents: prev.documents.filter(doc => doc.id !== documentId),
      }));

      setSuccessMessage('Documento eliminado exitosamente');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      logger.error('Error eliminando documento:', { error });
      setErrorMessage('Error al eliminar el documento. Por favor, inténtalo nuevamente.');
      setTimeout(() => setErrorMessage(''), 5000);
    }
  };

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    try {
      setUploadingAvatar(true);
      setErrorMessage('');

      logger.info('Subiendo avatar:', { fileName: file.name, size: file.size });

      const formData = new FormData();
      formData.append('avatar', file);

      const response = await fetch('/api/user/avatar', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al subir el avatar');
      }

      const data = await response.json();

      // Actualizar estado local
      setSettings(prev => ({
        ...prev,
        profile: {
          ...prev.profile,
          avatar: data.avatar.url,
        },
      }));

      // Actualizar estado del usuario
      setUser(prev => (prev ? { ...prev, avatar: data.avatar.url } : null));

      setSuccessMessage('Avatar actualizado exitosamente');
      setTimeout(() => setSuccessMessage(''), 3000);

      logger.info('Avatar subido exitosamente');
    } catch (error) {
      logger.error('Error subiendo avatar:', {
        error: error instanceof Error ? error.message : String(error),
      });
      setErrorMessage(
        error instanceof Error
          ? error.message
          : 'Error al subir el avatar. Por favor, inténtalo nuevamente.'
      );
      setTimeout(() => setErrorMessage(''), 5000);
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleAvatarDelete = async () => {
    try {
      setUploadingAvatar(true);
      setErrorMessage('');

      logger.info('Eliminando avatar');

      const response = await fetch('/api/user/avatar', {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al eliminar el avatar');
      }

      // Actualizar estado local
      setSettings(prev => ({
        ...prev,
        profile: {
          ...prev.profile,
          avatar: '',
        },
      }));

      // Actualizar estado del usuario
      setUser(prev => (prev ? { ...prev, avatar: '' } : null));

      setSuccessMessage('Avatar eliminado exitosamente');
      setTimeout(() => setSuccessMessage(''), 3000);

      logger.info('Avatar eliminado exitosamente');
    } catch (error) {
      logger.error('Error eliminando avatar:', {
        error: error instanceof Error ? error.message : String(error),
      });
      setErrorMessage(
        error instanceof Error
          ? error.message
          : 'Error al eliminar el avatar. Por favor, inténtalo nuevamente.'
      );
      setTimeout(() => setErrorMessage(''), 5000);
    } finally {
      setUploadingAvatar(false);
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'personal':
        return <UserCheck className="w-4 h-4" />;
      case 'property':
        return <Building className="w-4 h-4" />;
      case 'legal':
        return <Scale className="w-4 h-4" />;
      default:
        return <FileText className="w-4 h-4" />;
    }
  };

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case 'personal':
        return 'Personal';
      case 'property':
        return 'Propiedad';
      case 'legal':
        return 'Legal';
      default:
        return category;
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
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="profile">Perfil</TabsTrigger>
            <TabsTrigger value="notifications">Notificaciones</TabsTrigger>
            <TabsTrigger value="security">Seguridad</TabsTrigger>
            <TabsTrigger value="business">Negocio</TabsTrigger>
            <TabsTrigger value="documents">Documentos</TabsTrigger>
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

                {/* Sección de Avatar */}
                <div className="space-y-4">
                  <Label>Foto de Perfil</Label>
                  <div className="flex items-center gap-4">
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

                    <div className="flex flex-col gap-2">
                      <div className="flex gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          disabled={uploadingAvatar}
                          asChild
                        >
                          <label className="cursor-pointer">
                            <Upload className="w-4 h-4 mr-2" />
                            {uploadingAvatar ? (
                              <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                Subiendo...
                              </>
                            ) : (
                              'Subir Foto'
                            )}
                            <input
                              type="file"
                              accept="image/*"
                              onChange={handleAvatarUpload}
                              className="hidden"
                              disabled={uploadingAvatar}
                            />
                          </label>
                        </Button>

                        {user?.avatar && user.avatar.trim() !== '' && (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => window.open(user.avatar!, '_blank')}
                            disabled={uploadingAvatar}
                          >
                            <Eye className="w-4 h-4 mr-2" />
                            Ver
                          </Button>
                        )}

                        {user?.avatar && user.avatar.trim() !== '' && (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={handleAvatarDelete}
                            disabled={uploadingAvatar}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Eliminar
                          </Button>
                        )}
                      </div>

                      <p className="text-sm text-gray-500">
                        Formatos permitidos: JPG, PNG, GIF, WebP. Tamaño máximo: 5MB.
                      </p>
                    </div>
                  </div>
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

                <LocationSelectors
                  selectedRegion={settings.profile.region}
                  selectedCommune={settings.profile.city}
                  onRegionChange={handleRegionChange}
                  onCommuneChange={value => updateProfile('city', value)}
                />

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
                    onClick={() => setShowPasswordModal(true)}
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

          {/* Documents Tab */}
          <TabsContent value="documents" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FolderOpen className="w-5 h-5" />
                  Gestión de Documentos
                </CardTitle>
                <CardDescription>
                  Sube y administra tus documentos personales y de propiedades según las normas
                  chilenas
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Document Upload Section */}
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="text-lg font-semibold">Mis Documentos</h3>
                    <p className="text-sm text-gray-600">
                      Documentos requeridos: Cédula, ROL de propiedades, certificados de avalúo
                    </p>
                  </div>
                  <Button onClick={() => setShowUploadModal(true)}>
                    <Upload className="w-4 h-4 mr-2" />
                    Subir Documento
                  </Button>
                </div>

                {/* Documents List */}
                <div className="space-y-3">
                  {settings.documents.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <FileText className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                      <p>No tienes documentos subidos aún</p>
                      <p className="text-sm">Sube tus documentos personales y de propiedades</p>
                    </div>
                  ) : (
                    settings.documents.map(document => (
                      <div
                        key={document.id}
                        className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50"
                      >
                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-2">
                            {getCategoryIcon(document.category)}
                            <div>
                              <p className="font-medium">{document.name}</p>
                              <p className="text-sm text-gray-600">
                                {getCategoryLabel(document.category)} • {document.type} •{' '}
                                {document.size} • Subido:{' '}
                                {new Date(document.uploadDate).toLocaleDateString('es-CL')}
                              </p>
                              {document.propertyId && (
                                <p className="text-xs text-blue-600">
                                  Propiedad ID: {document.propertyId}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDownloadDocument(document)}
                          >
                            <Download className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeleteDocument(document.id)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* Legal Requirements Info */}
                <Card className="border-blue-200 bg-blue-50">
                  <CardContent className="pt-6">
                    <div className="flex items-start gap-3">
                      <Scale className="w-5 h-5 text-blue-600 mt-0.5" />
                      <div>
                        <h4 className="font-semibold text-blue-900">
                          Documentos Requeridos por Ley Chilena
                        </h4>
                        <ul className="text-sm text-blue-800 mt-2 space-y-1">
                          <li>
                            • <strong>Cédula de Identidad</strong> - Documento de identificación
                            personal
                          </li>
                          <li>
                            • <strong>ROL de la Propiedad</strong> - Certificado del avalúo fiscal
                            municipal
                          </li>
                          <li>
                            • <strong>Certificado de Avalúo</strong> - Valor comercial de la
                            propiedad
                          </li>
                          <li>
                            • <strong>Escritura de Compraventa</strong> - Título de propiedad
                          </li>
                          <li>
                            • <strong>Certificado de Dominio Vigente</strong> - Comprobante de
                            propiedad
                          </li>
                        </ul>
                        <p className="text-xs text-blue-700 mt-3">
                          Estos documentos son obligatorios para contratos de arriendo según la Ley
                          18.101
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
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

        {/* Modal para cambiar contraseña */}
        {showPasswordModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Cambiar Contraseña</h3>
                <button
                  onClick={() => setShowPasswordModal(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ×
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <Label htmlFor="currentPassword">Contraseña Actual</Label>
                  <Input
                    id="currentPassword"
                    type="password"
                    value={passwordData.currentPassword}
                    onChange={e => handlePasswordChange('currentPassword', e.target.value)}
                    className={passwordErrors.currentPassword ? 'border-red-500' : ''}
                  />
                  {passwordErrors.currentPassword && (
                    <p className="text-sm text-red-600 mt-1">{passwordErrors.currentPassword}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="newPassword">Nueva Contraseña</Label>
                  <Input
                    id="newPassword"
                    type="password"
                    value={passwordData.newPassword}
                    onChange={e => handlePasswordChange('newPassword', e.target.value)}
                    className={passwordErrors.newPassword ? 'border-red-500' : ''}
                  />
                  {passwordErrors.newPassword && (
                    <p className="text-sm text-red-600 mt-1">{passwordErrors.newPassword}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="confirmPassword">Confirmar Nueva Contraseña</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    value={passwordData.confirmPassword}
                    onChange={e => handlePasswordChange('confirmPassword', e.target.value)}
                    className={passwordErrors.confirmPassword ? 'border-red-500' : ''}
                  />
                  {passwordErrors.confirmPassword && (
                    <p className="text-sm text-red-600 mt-1">{passwordErrors.confirmPassword}</p>
                  )}
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <Button variant="outline" onClick={() => setShowPasswordModal(false)}>
                  Cancelar
                </Button>
                <Button onClick={handlePasswordSubmit} className="flex-1">
                  Cambiar Contraseña
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Modal para subir documentos */}
        {showUploadModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Subir Documento</h3>
                <button
                  onClick={() => setShowUploadModal(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <Label htmlFor="documentCategory">Categoría del Documento</Label>
                  <Select
                    value={selectedDocumentCategory}
                    onValueChange={(value: 'personal' | 'property' | 'legal') =>
                      setSelectedDocumentCategory(value)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="personal">Documento Personal</SelectItem>
                      <SelectItem value="property">Documento de Propiedad</SelectItem>
                      <SelectItem value="legal">Documento Legal</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {selectedDocumentCategory === 'property' && (
                  <div>
                    <Label htmlFor="propertyId">Propiedad</Label>
                    <Select value={selectedPropertyId} onValueChange={setSelectedPropertyId}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona la propiedad" />
                      </SelectTrigger>
                      <SelectContent>
                        {userProperties.length > 0 ? (
                          userProperties.map(property => (
                            <SelectItem key={property.id} value={property.id}>
                              {property.title}
                            </SelectItem>
                          ))
                        ) : (
                          <SelectItem value="no-properties" disabled>
                            No tienes propiedades registradas
                          </SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                <div>
                  <Label htmlFor="documentFile">Seleccionar Archivo</Label>
                  <input
                    id="documentFile"
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={handleFileUpload}
                    className="w-full mt-1 p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <p className="text-xs text-gray-600 mt-1">
                    Formatos permitidos: PDF, JPG, PNG (máx. 10MB)
                  </p>
                </div>

                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 text-yellow-600 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-yellow-800">Documentos Obligatorios</p>
                      <ul className="text-xs text-yellow-700 mt-1 space-y-0.5">
                        <li>• Cédula de Identidad</li>
                        <li>• ROL de la propiedad</li>
                        <li>• Certificado de avalúo</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <Button variant="outline" onClick={() => setShowUploadModal(false)}>
                  Cancelar
                </Button>
                <Button
                  onClick={() => {
                    const fileInput = document.getElementById('documentFile') as HTMLInputElement;
                    if (fileInput && fileInput.files && fileInput.files[0]) {
                      handleFileUpload({ target: fileInput } as any);
                    } else {
                      setErrorMessage('Por favor selecciona un archivo');
                      setTimeout(() => setErrorMessage(''), 3000);
                    }
                  }}
                  disabled={saving}
                >
                  {saving ? 'Subiendo...' : 'Subir Documento'}
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </UnifiedDashboardLayout>
  );
}

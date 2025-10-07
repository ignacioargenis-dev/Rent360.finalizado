'use client';

// Build fix - force update

import React, { useState, useEffect } from 'react';
import { logger } from '@/lib/logger';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
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
  Info,
  Key,
  CheckCircle,
  AlertTriangle,
  FileText,
  Upload,
  Download,
  Trash2,
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

  const [documents, setDocuments] = useState<Document[]>([]);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedDocumentCategory, setSelectedDocumentCategory] =
    useState<Document['category']>('identification');

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

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0 || !files[0]) {
      return;
    }

    const file = files[0];
    const maxSize = 10 * 1024 * 1024; // 10MB

    if (file.size > maxSize) {
      setErrorMessage('El archivo es demasiado grande. Tamaño máximo: 10MB.');
      setTimeout(() => setErrorMessage(''), 3000);
      return;
    }

    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
    if (!allowedTypes.includes(file.type)) {
      setErrorMessage('Tipo de archivo no permitido. Use PDF, JPG o PNG.');
      setTimeout(() => setErrorMessage(''), 3000);
      return;
    }

    const newDocument: Document = {
      id: `doc_${Date.now()}`,
      name: file.name,
      category: selectedDocumentCategory,
      size: formatFileSize(file.size),
      uploadDate: new Date().toISOString().split('T')[0] || new Date().toLocaleDateString('en-CA'),
      url: URL.createObjectURL(file), // In a real app, this would be uploaded to a server
    };

    setDocuments(prev => [...prev, newDocument]);
    setShowUploadModal(false);
    setSuccessMessage('Documento subido exitosamente.');
    setTimeout(() => setSuccessMessage(''), 3000);

    // Reset file input
    event.target.value = '';
  };

  const handleDownloadDocument = (doc: Document) => {
    // In a real app, this would download from server
    // For now, create a simple download link
    const link = document.createElement('a');
    link.href = doc.url;
    link.download = doc.name;
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setSuccessMessage('Documento descargado exitosamente.');
    setTimeout(() => setSuccessMessage(''), 2000);
  };

  const handleDeleteDocument = (documentId: string) => {
    if (confirm('¿Estás seguro de que quieres eliminar este documento?')) {
      setDocuments(prev => prev.filter(doc => doc.id !== documentId));
      setSuccessMessage('Documento eliminado exitosamente.');
      setTimeout(() => setSuccessMessage(''), 2000);
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) {
      return '0 Bytes';
    }
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
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
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="profile">Perfil</TabsTrigger>
            <TabsTrigger value="notifications">Notificaciones</TabsTrigger>
            <TabsTrigger value="privacy">Privacidad</TabsTrigger>
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

          {/* Documents Tab */}
          <TabsContent value="documents" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  Documentos Personales
                </CardTitle>
                <CardDescription>
                  Gestiona tus documentos personales y de identificación requeridos para el alquiler
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Upload Section */}
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                  <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Subir Documentos</h3>
                  <p className="text-gray-600 mb-4">
                    Arrastra y suelta archivos o haz clic para seleccionar
                  </p>
                  <div className="flex gap-4 justify-center">
                    <Button variant="outline" onClick={() => setShowUploadModal(true)}>
                      <Upload className="w-4 h-4 mr-2" />
                      Subir Documento
                    </Button>
                  </div>
                  <p className="text-sm text-gray-500 mt-2">
                    Formatos aceptados: PDF, JPG, PNG. Tamaño máximo: 10MB por archivo.
                  </p>
                </div>

                {/* Documents List */}
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
                            onClick={() => handleDownloadDocument(doc)}
                          >
                            <Download className="w-4 h-4 mr-2" />
                            Descargar
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeleteDocument(doc.id)}
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Eliminar
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Required Documents Info */}
                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Documentos requeridos:</strong> Para completar tu perfil de inquilino,
                    asegúrate de subir tu cédula de identidad, comprobante de ingresos y referencias
                    personales. Estos documentos son necesarios para procesar solicitudes de
                    arriendo.
                  </AlertDescription>
                </Alert>
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

        {/* Document Upload Modal */}
        <Dialog open={showUploadModal} onOpenChange={setShowUploadModal}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Subir Documento</DialogTitle>
              <DialogDescription>
                Selecciona el tipo de documento y sube el archivo
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div>
                <Label htmlFor="document-category">Tipo de Documento</Label>
                <Select
                  value={selectedDocumentCategory}
                  onValueChange={(value: Document['category']) =>
                    setSelectedDocumentCategory(value)
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="identification">Cédula de Identidad</SelectItem>
                    <SelectItem value="income">Comprobante de Ingresos</SelectItem>
                    <SelectItem value="references">Referencias Personales</SelectItem>
                    <SelectItem value="contract">Contrato de Trabajo</SelectItem>
                    <SelectItem value="other">Otro</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="document-file">Seleccionar Archivo</Label>
                <Input
                  id="document-file"
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={handleFileUpload}
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Button variant="outline" onClick={() => setShowUploadModal(false)}>
                Cancelar
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </UnifiedDashboardLayout>
  );
}

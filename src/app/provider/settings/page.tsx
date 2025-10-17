'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { logger } from '@/lib/logger-minimal';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import {
  Shield,
  Bell,
  RefreshCw,
  AlertTriangle,
  AlertCircle,
  Save,
  User,
  Settings,
  Zap,
  Info,
  Lock,
  Camera,
  Wrench,
  DollarSign,
  Mail,
  Phone,
  MapPin,
  Clock,
  CheckCircle,
  FileText,
  Upload,
  Download,
  Eye,
  Trash2,
} from 'lucide-react';
import UnifiedDashboardLayout from '@/components/layout/UnifiedDashboardLayout';

export default function ProviderSettingsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [profileData, setProfileData] = useState({
    companyName: 'Servicios Profesionales SpA',
    contactName: 'María González',
    email: 'contacto@serviciosprofesionales.cl',
    phone: '+56 9 8765 4321',
    address: 'Providencia 1234, Santiago',
    description:
      'Empresa especializada en mantenimiento de propiedades residenciales y comerciales.',
    website: 'www.serviciosprofesionales.cl',
    taxId: '76.543.210-8',
  });
  const [servicesData, setServicesData] = useState({
    availableServices: [
      { id: '1', name: 'Mantenimiento Eléctrico', active: true, price: 25000 },
      { id: '2', name: 'Reparaciones Plomería', active: true, price: 30000 },
      { id: '3', name: 'Pintura y Acabados', active: false, price: 45000 },
      { id: '4', name: 'Jardinería', active: true, price: 35000 },
    ],
    responseTime: '2-4 horas',
    emergencyService: true,
    weekendService: true,
  });
  const [notificationsData, setNotificationsData] = useState({
    newJobs: true,
    jobUpdates: true,
    payments: true,
    reviews: true,
    marketing: false,
    emailNotifications: true,
    smsNotifications: false,
    pushNotifications: true,
  });
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const [securityData, setSecurityData] = useState({
    twoFactorEnabled: false,
    sessionTimeout: 30,
    passwordLastChanged: '2024-01-15',
    loginAlerts: true,
    deviceTracking: true,
  });
  const [documentsData, setDocumentsData] = useState({
    documents: [
      {
        id: '1',
        name: 'Certificado de Empresa',
        type: 'certificate',
        status: 'approved',
        uploadDate: '2024-01-15',
        expiryDate: '2025-01-15',
        fileUrl: '/api/documents/certificado-empresa.pdf',
      },
      {
        id: '2',
        name: 'Licencia Municipal',
        type: 'license',
        status: 'pending',
        uploadDate: '2024-01-20',
        expiryDate: '2025-01-20',
        fileUrl: '/api/documents/licencia-municipal.pdf',
      },
      {
        id: '3',
        name: 'Seguro de Responsabilidad Civil',
        type: 'insurance',
        status: 'approved',
        uploadDate: '2024-01-10',
        expiryDate: '2024-12-10',
        fileUrl: '/api/documents/seguro-rc.pdf',
      },
    ],
  });

  // Estados para cambiar contraseña
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [passwordErrors, setPasswordErrors] = useState<Partial<typeof passwordData>>({});

  // Estados para subir documentos
  const [uploadingDocument, setUploadingDocument] = useState(false);
  const [fileInputRef, setFileInputRef] = useState<HTMLInputElement | null>(null);

  useEffect(() => {
    loadPageData();
  }, []);

  const loadPageData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Mock settings data for provider
      const mockSettings = {
        overview: {
          activeConfigs: 18,
          configuredServices: 12,
          activeNotifications: 6,
          integrations: 3,
        },
      };

      setData(mockSettings);
    } catch (error) {
      logger.error('Error loading page data:', {
        error: error instanceof Error ? error.message : String(error),
      });
      setError('Error al cargar los datos');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSettings = async (section: string) => {
    try {
      setUploadingDocument(true);

      // Guardar configuración del perfil usando la API correcta
      const response = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          name: profileData.contactName,
          phone: profileData.phone,
          address: profileData.address,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al guardar la configuración');
      }

      const data = await response.json();

      setSuccessMessage(`Configuración de ${section} guardada exitosamente`);
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
      setUploadingDocument(false);
    }
  };

  const handleInputChange = (section: string, field: string, value: any) => {
    switch (section) {
      case 'profile':
        setProfileData(prev => ({ ...prev, [field]: value }));
        break;
      case 'services':
        setServicesData(prev => ({ ...prev, [field]: value }));
        break;
      case 'notifications':
        setNotificationsData(prev => ({ ...prev, [field]: value }));
        break;
      case 'security':
        setSecurityData(prev => ({ ...prev, [field]: value }));
        break;
    }
  };

  const toggleService = (serviceId: string) => {
    setServicesData(prev => ({
      ...prev,
      availableServices: prev.availableServices.map(service =>
        service.id === serviceId ? { ...service, active: !service.active } : service
      ),
    }));
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

  // Funciones para subir documentos
  const handleDocumentUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    // Validar tipo de archivo
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
    if (!allowedTypes.includes(file.type)) {
      setErrorMessage('Tipo de archivo no válido. Solo se permiten PDF e imágenes.');
      return;
    }

    // Validar tamaño (máximo 10MB)
    if (file.size > 10 * 1024 * 1024) {
      setErrorMessage('El archivo es demasiado grande. Máximo 10MB.');
      return;
    }

    setUploadingDocument(true);
    setErrorMessage('');

    try {
      // Simular subida de archivo
      await new Promise(resolve => setTimeout(resolve, 2000));

      const newDocument = {
        id: Date.now().toString(),
        name: file.name,
        type: 'other' as const,
        status: 'pending' as const,
        uploadDate: new Date().toISOString().split('T')[0],
        expiryDate: undefined as string | undefined,
        fileUrl: `/api/documents/${file.name}`,
      };

      setDocumentsData(prev => ({
        ...prev,
        documents: [...prev.documents, newDocument as any],
      }));

      setSuccessMessage('Documento subido exitosamente. Está pendiente de revisión.');
      setTimeout(() => setSuccessMessage(''), 3000);

      logger.info('Documento subido', { fileName: file.name, fileSize: file.size });
    } catch (error) {
      logger.error('Error al subir documento', { error });
      setErrorMessage('Error al subir el documento. Inténtalo de nuevo.');
    } finally {
      setUploadingDocument(false);
      // Reset file input
      if (event.target) {
        event.target.value = '';
      }
    }
  };

  const handleUploadButtonClick = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.pdf,.jpg,.jpeg,.png';
    input.onchange = e => handleDocumentUpload(e as any);
    input.click();
  };

  if (loading) {
    return (
      <UnifiedDashboardLayout
        title="Configuración del Proveedor"
        subtitle="Cargando información..."
      >
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Cargando...</p>
          </div>
        </div>
      </UnifiedDashboardLayout>
    );
  }

  if (error) {
    return (
      <UnifiedDashboardLayout
        title="Configuración del Proveedor"
        subtitle="Error al cargar la página"
      >
        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Error</h3>
              <p className="text-gray-600 mb-4">{error}</p>
              <Button onClick={loadPageData}>
                <RefreshCw className="w-4 h-4 mr-2" />
                Reintentar
              </Button>
            </div>
          </CardContent>
        </Card>
      </UnifiedDashboardLayout>
    );
  }

  return (
    <UnifiedDashboardLayout
      title="Configuración del Proveedor"
      subtitle="Configura tu perfil y preferencias como proveedor"
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

        {/* Header con estadísticas */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Configuraciones Activas</CardTitle>
              <Settings className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{data?.overview.activeConfigs || 18}</div>
              <p className="text-xs text-muted-foreground">+2 desde el mes pasado</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Servicios Configurados</CardTitle>
              <Wrench className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{data?.overview.configuredServices || 12}</div>
              <p className="text-xs text-muted-foreground">+1 desde el mes pasado</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Notificaciones Activas</CardTitle>
              <Bell className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{data?.overview.activeNotifications || 6}</div>
              <p className="text-xs text-muted-foreground">+1 desde el mes pasado</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Integraciones</CardTitle>
              <Zap className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{data?.overview.integrations || 3}</div>
              <p className="text-xs text-muted-foreground">+0 desde el mes pasado</p>
            </CardContent>
          </Card>
        </div>

        {/* Configuración por pestañas */}
        <Tabs defaultValue="profile" className="space-y-4">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="profile">Perfil</TabsTrigger>
            <TabsTrigger value="services">Servicios</TabsTrigger>
            <TabsTrigger value="documents">Documentos</TabsTrigger>
            <TabsTrigger value="notifications">Notificaciones</TabsTrigger>
            <TabsTrigger value="security">Seguridad</TabsTrigger>
          </TabsList>

          {/* Pestaña Perfil */}
          <TabsContent value="profile">
            <Card>
              <CardHeader>
                <CardTitle>Información del Perfil</CardTitle>
                <CardDescription>
                  Actualiza la información básica de tu empresa y servicios
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="companyName">Nombre de la Empresa</Label>
                    <Input
                      id="companyName"
                      value={profileData.companyName}
                      onChange={e => handleInputChange('profile', 'companyName', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="contactName">Nombre de Contacto</Label>
                    <Input
                      id="contactName"
                      value={profileData.contactName}
                      onChange={e => handleInputChange('profile', 'contactName', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Correo Electrónico</Label>
                    <Input
                      id="email"
                      type="email"
                      value={profileData.email}
                      onChange={e => handleInputChange('profile', 'email', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Teléfono</Label>
                    <Input
                      id="phone"
                      value={profileData.phone}
                      onChange={e => handleInputChange('profile', 'phone', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="address">Dirección</Label>
                    <Input
                      id="address"
                      value={profileData.address}
                      onChange={e => handleInputChange('profile', 'address', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="taxId">RUT</Label>
                    <Input
                      id="taxId"
                      value={profileData.taxId}
                      onChange={e => handleInputChange('profile', 'taxId', e.target.value)}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Descripción de Servicios</Label>
                  <Textarea
                    id="description"
                    value={profileData.description}
                    onChange={e => handleInputChange('profile', 'description', e.target.value)}
                    rows={3}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="website">Sitio Web</Label>
                  <Input
                    id="website"
                    value={profileData.website}
                    onChange={e => handleInputChange('profile', 'website', e.target.value)}
                  />
                </div>
                <Button onClick={() => handleSaveSettings('perfil')}>
                  <Save className="w-4 h-4 mr-2" />
                  Guardar Cambios
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Pestaña Servicios */}
          <TabsContent value="services">
            <Card>
              <CardHeader>
                <CardTitle>Configuración de Servicios</CardTitle>
                <CardDescription>Gestiona los servicios que ofreces y sus precios</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Servicios Disponibles</h3>
                  {servicesData.availableServices.map(service => (
                    <div
                      key={service.id}
                      className="flex items-center justify-between p-4 border rounded-lg"
                    >
                      <div className="flex items-center space-x-3">
                        <Switch
                          checked={service.active}
                          onCheckedChange={() => toggleService(service.id)}
                        />
                        <div>
                          <div className="font-medium">{service.name}</div>
                          <div className="text-sm text-gray-600">
                            ${service.price.toLocaleString('es-CL')} CLP
                          </div>
                        </div>
                      </div>
                      <Badge variant={service.active ? 'default' : 'secondary'}>
                        {service.active ? 'Activo' : 'Inactivo'}
                      </Badge>
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="responseTime">Tiempo de Respuesta</Label>
                    <Input
                      id="responseTime"
                      value={servicesData.responseTime}
                      onChange={e => handleInputChange('services', 'responseTime', e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Disponibilidad</h3>
                  <div className="space-y-3">
                    <div className="flex items-center space-x-2">
                      <Switch
                        checked={servicesData.emergencyService}
                        onCheckedChange={checked =>
                          handleInputChange('services', 'emergencyService', checked)
                        }
                      />
                      <Label>Servicio de Emergencia 24/7</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch
                        checked={servicesData.weekendService}
                        onCheckedChange={checked =>
                          handleInputChange('services', 'weekendService', checked)
                        }
                      />
                      <Label>Servicio los Fines de Semana</Label>
                    </div>
                  </div>
                </div>

                <Button onClick={() => handleSaveSettings('servicios')}>
                  <Save className="w-4 h-4 mr-2" />
                  Guardar Servicios
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Pestaña Documentos */}
          <TabsContent value="documents">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  Documentos y Certificaciones
                </CardTitle>
                <CardDescription>
                  Gestiona tus documentos legales, certificados y licencias requeridas
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-medium">Documentos Subidos</h3>
                    <Button
                      variant="outline"
                      onClick={handleUploadButtonClick}
                      disabled={uploadingDocument}
                    >
                      {uploadingDocument ? (
                        <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <Upload className="w-4 h-4 mr-2" />
                      )}
                      {uploadingDocument ? 'Subiendo...' : 'Subir Documento'}
                    </Button>
                  </div>

                  <div className="space-y-3">
                    {documentsData.documents.map(document => (
                      <div
                        key={document.id}
                        className="flex items-center justify-between p-4 border rounded-lg"
                      >
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-blue-100 rounded-lg">
                            <FileText className="w-5 h-5 text-blue-600" />
                          </div>
                          <div>
                            <h4 className="font-medium">{document.name}</h4>
                            <p className="text-sm text-gray-600">
                              Subido: {new Date(document.uploadDate).toLocaleDateString('es-CL')}
                              {document.expiryDate &&
                                ` • Vence: ${new Date(document.expiryDate).toLocaleDateString('es-CL')}`}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <Badge
                            variant={
                              document.status === 'approved'
                                ? 'default'
                                : document.status === 'pending'
                                  ? 'secondary'
                                  : 'destructive'
                            }
                          >
                            {document.status === 'approved'
                              ? 'Aprobado'
                              : document.status === 'pending'
                                ? 'Pendiente'
                                : 'Rechazado'}
                          </Badge>
                          <div className="flex gap-2">
                            <Button variant="outline" size="sm">
                              <Eye className="w-4 h-4 mr-2" />
                              Ver
                            </Button>
                            <Button variant="outline" size="sm">
                              <Download className="w-4 h-4 mr-2" />
                              Descargar
                            </Button>
                            <Button variant="outline" size="sm">
                              <Trash2 className="w-4 h-4 mr-2" />
                              Eliminar
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Documentos Requeridos</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 border rounded-lg">
                      <h4 className="font-medium text-green-600">✓ Certificado de Empresa</h4>
                      <p className="text-sm text-gray-600">Documento obligatorio para operar</p>
                    </div>
                    <div className="p-4 border rounded-lg">
                      <h4 className="font-medium text-yellow-600">⚠ Licencia Municipal</h4>
                      <p className="text-sm text-gray-600">En revisión por el administrador</p>
                    </div>
                    <div className="p-4 border rounded-lg">
                      <h4 className="font-medium text-green-600">
                        ✓ Seguro de Responsabilidad Civil
                      </h4>
                      <p className="text-sm text-gray-600">Vence en diciembre 2024</p>
                    </div>
                    <div className="p-4 border rounded-lg border-dashed">
                      <h4 className="font-medium text-gray-400">○ Certificado de Antecedentes</h4>
                      <p className="text-sm text-gray-600">Documento faltante</p>
                      <Button
                        variant="outline"
                        size="sm"
                        className="mt-2"
                        onClick={handleUploadButtonClick}
                        disabled={uploadingDocument}
                      >
                        <Upload className="w-4 h-4 mr-2" />
                        Subir
                      </Button>
                    </div>
                  </div>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <Info className="w-5 h-5 text-blue-600 mt-0.5" />
                    <div>
                      <h4 className="font-medium text-blue-800">Información Importante</h4>
                      <p className="text-sm text-blue-700 mt-1">
                        Todos los documentos son revisados por nuestro equipo administrativo. Los
                        documentos aprobados son visibles para los clientes potenciales. Asegúrate
                        de que todos los documentos estén vigentes.
                      </p>
                    </div>
                  </div>
                </div>

                <Button onClick={() => handleSaveSettings('documentos')}>
                  <Save className="w-4 h-4 mr-2" />
                  Guardar Cambios en Documentos
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Pestaña Notificaciones */}
          <TabsContent value="notifications">
            <Card>
              <CardHeader>
                <CardTitle>Preferencias de Notificaciones</CardTitle>
                <CardDescription>
                  Configura cómo quieres recibir las notificaciones del sistema
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Notificaciones por Email</h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label>Nuevos trabajos disponibles</Label>
                      <Switch
                        checked={notificationsData.newJobs}
                        onCheckedChange={checked =>
                          handleInputChange('notifications', 'newJobs', checked)
                        }
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label>Actualizaciones de trabajos</Label>
                      <Switch
                        checked={notificationsData.jobUpdates}
                        onCheckedChange={checked =>
                          handleInputChange('notifications', 'jobUpdates', checked)
                        }
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label>Notificaciones de pagos</Label>
                      <Switch
                        checked={notificationsData.payments}
                        onCheckedChange={checked =>
                          handleInputChange('notifications', 'payments', checked)
                        }
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label>Reseñas y calificaciones</Label>
                      <Switch
                        checked={notificationsData.reviews}
                        onCheckedChange={checked =>
                          handleInputChange('notifications', 'reviews', checked)
                        }
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label>Marketing y promociones</Label>
                      <Switch
                        checked={notificationsData.marketing}
                        onCheckedChange={checked =>
                          handleInputChange('notifications', 'marketing', checked)
                        }
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Métodos de Notificación</h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label>Notificaciones por Email</Label>
                      <Switch
                        checked={notificationsData.emailNotifications}
                        onCheckedChange={checked =>
                          handleInputChange('notifications', 'emailNotifications', checked)
                        }
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label>Notificaciones SMS</Label>
                      <Switch
                        checked={notificationsData.smsNotifications}
                        onCheckedChange={checked =>
                          handleInputChange('notifications', 'smsNotifications', checked)
                        }
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label>Notificaciones Push</Label>
                      <Switch
                        checked={notificationsData.pushNotifications}
                        onCheckedChange={checked =>
                          handleInputChange('notifications', 'pushNotifications', checked)
                        }
                      />
                    </div>
                  </div>
                </div>

                <Button onClick={() => handleSaveSettings('notificaciones')}>
                  <Save className="w-4 h-4 mr-2" />
                  Guardar Preferencias
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Pestaña Seguridad */}
          <TabsContent value="security">
            <Card>
              <CardHeader>
                <CardTitle>Configuración de Seguridad</CardTitle>
                <CardDescription>
                  Gestiona la seguridad de tu cuenta y acceso al sistema
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Autenticación</h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label>Autenticación de Dos Factores</Label>
                        <p className="text-sm text-gray-600">Añade una capa extra de seguridad</p>
                      </div>
                      <Switch
                        checked={securityData.twoFactorEnabled}
                        onCheckedChange={checked =>
                          handleInputChange('security', 'twoFactorEnabled', checked)
                        }
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Sesión</h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label>Tiempo de expiración de sesión (minutos)</Label>
                      <Input
                        type="number"
                        value={securityData.sessionTimeout}
                        onChange={e =>
                          handleInputChange('security', 'sessionTimeout', parseInt(e.target.value))
                        }
                        className="w-20"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Alertas de Seguridad</h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label>Alertas de inicio de sesión</Label>
                      <Switch
                        checked={securityData.loginAlerts}
                        onCheckedChange={checked =>
                          handleInputChange('security', 'loginAlerts', checked)
                        }
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label>Rastreo de dispositivos</Label>
                      <Switch
                        checked={securityData.deviceTracking}
                        onCheckedChange={checked =>
                          handleInputChange('security', 'deviceTracking', checked)
                        }
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Información de Seguridad</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <Label>Último cambio de contraseña</Label>
                      <p className="text-gray-600">
                        {new Date(securityData.passwordLastChanged).toLocaleDateString('es-CL')}
                      </p>
                    </div>
                    <div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowPasswordModal(true)}
                      >
                        <Lock className="w-4 h-4 mr-2" />
                        Cambiar Contraseña
                      </Button>
                    </div>
                  </div>
                </div>

                <Button onClick={() => handleSaveSettings('seguridad')}>
                  <Save className="w-4 h-4 mr-2" />
                  Guardar Configuración de Seguridad
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Acciones rápidas */}
        <Card>
          <CardHeader>
            <CardTitle>Acciones Rápidas</CardTitle>
            <CardDescription>Accede rápidamente a las funciones más utilizadas</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-4">
              <Button
                variant="outline"
                className="h-20 flex flex-col items-center justify-center"
                onClick={() => router.push('/provider/profile')}
              >
                <User className="w-6 h-6 mb-2" />
                <span>Ver Perfil Público</span>
              </Button>

              <Button
                variant="outline"
                className="h-20 flex flex-col items-center justify-center"
                onClick={() => router.push('/provider/earnings')}
              >
                <DollarSign className="w-6 h-6 mb-2" />
                <span>Ver Ganancias</span>
              </Button>

              <Button
                variant="outline"
                className="h-20 flex flex-col items-center justify-center"
                onClick={() => router.push('/provider/ratings')}
              >
                <CheckCircle className="w-6 h-6 mb-2" />
                <span>Ver Reseñas</span>
              </Button>

              <Button
                variant="outline"
                className="h-20 flex flex-col items-center justify-center"
                onClick={() => router.push('/provider/dashboard')}
              >
                <Settings className="w-6 h-6 mb-2" />
                <span>Ir al Dashboard</span>
              </Button>

              <Button
                variant="outline"
                className="h-20 flex flex-col items-center justify-center"
                onClick={() => router.push('/provider/services')}
              >
                <Wrench className="w-6 h-6 mb-2" />
                <span>Gestionar Servicios</span>
              </Button>

              <Button
                variant="outline"
                className="h-20 flex flex-col items-center justify-center"
                onClick={loadPageData}
              >
                <RefreshCw className="w-6 h-6 mb-2" />
                <span>Actualizar Datos</span>
              </Button>
            </div>
          </CardContent>
        </Card>

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
      </div>
    </UnifiedDashboardLayout>
  );
}

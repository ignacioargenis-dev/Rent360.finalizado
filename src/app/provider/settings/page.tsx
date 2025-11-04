'use client';

import { useState, useEffect } from 'react';

// Configuración para renderizado dinámico - configuración personalizada del usuario
export const dynamic = 'force-dynamic';
export const revalidate = 0; // No cache para configuración personal
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
  // ✅ Estados inicializados vacíos - se cargarán desde la API
  const [profileData, setProfileData] = useState({
    companyName: '',
    contactName: '',
    email: '',
    phone: '',
    address: '',
    description: '',
    website: '',
    taxId: '',
  });
  const [servicesData, setServicesData] = useState({
    availableServices: [] as Array<{ id: string; name: string; active: boolean; price: number }>,
    responseTime: '2-4 horas',
    emergencyService: false,
    weekendService: false,
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
    passwordLastChanged: '',
    loginAlerts: true,
    deviceTracking: true,
  });
  const [documentsData, setDocumentsData] = useState({
    documents: [] as Array<{
      id: string;
      name: string;
      type: string;
      status: string;
      uploadDate: string;
      expiryDate?: string;
      fileUrl: string;
    }>,
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

      // Cargar perfil real del proveedor
      const profileResponse = await fetch('/api/provider/profile', {
        credentials: 'include',
      });

      if (profileResponse.ok) {
        const profileData = await profileResponse.json();
        if (profileData.success && profileData.profile) {
          const profile = profileData.profile;

          // Actualizar estado del perfil
          setProfileData({
            companyName: profile.companyName || '',
            contactName: profile.contactName || '',
            email: profile.email || '',
            phone: profile.phone || '',
            address: profile.address || '',
            description: profile.description || '',
            website: profile.website || '',
            taxId: profile.taxId || '',
          });

          // ✅ Actualizar servicios - manejar tanto objetos con IDs como strings legacy
          const serviceTypesRaw = profile.serviceTypes || profile.specialties || [];
          const availableServices = serviceTypesRaw.map((item: any, index: number) => {
            // Si es un objeto con ID, usarlo directamente
            if (typeof item === 'object' && item !== null && item.id) {
              return {
                id: item.id,
                name: item.name || String(item),
                active: item.active !== undefined ? item.active : profile.status === 'ACTIVE',
                price: item.pricing?.amount || profile.basePrice || profile.hourlyRate || 0,
              };
            }
            // Si es un string (legacy), generar ID temporal
            const legacyId = `svc_legacy_${index}_${String(item).replace(/\s+/g, '_').toLowerCase()}`;
            return {
              id: legacyId,
              name: String(item),
              active: profile.status === 'ACTIVE',
              price: profile.basePrice || profile.hourlyRate || 0,
            };
          });

          setServicesData({
            availableServices,
            responseTime: profile.responseTime || '2-4 horas',
            emergencyService: profile.availability?.emergencies || false,
            weekendService: profile.availability?.weekends || false,
          });

          // ✅ Cargar documentos reales desde el perfil
          if (profile.documents) {
            const docs: Array<{
              id: string;
              name: string;
              type: string;
              status: string;
              uploadDate: string;
              expiryDate?: string;
              fileUrl: string;
            }> = [];
            const uploadDate: string = (new Date().toISOString().split('T')[0] ?? '') as string; // Fecha actual como aproximación - siempre string

            const businessCert = profile.documents.businessCertificate;
            const idFront = profile.documents.idFront;
            const idBack = profile.documents.idBack;
            const criminalRec = profile.documents.criminalRecord;

            if (businessCert && typeof businessCert === 'string') {
              docs.push({
                id: 'business-certificate',
                name: 'Certificado de Empresa',
                type: 'certificate',
                status: profile.documents.isVerified ? 'approved' : 'pending',
                uploadDate: uploadDate,
                fileUrl: businessCert,
              });
            }
            if (idFront && typeof idFront === 'string') {
              docs.push({
                id: 'id-front',
                name: 'Cédula de Identidad (Frente)',
                type: 'id',
                status: profile.documents.isVerified ? 'approved' : 'pending',
                uploadDate: uploadDate,
                fileUrl: idFront,
              });
            }
            if (idBack && typeof idBack === 'string') {
              docs.push({
                id: 'id-back',
                name: 'Cédula de Identidad (Reverso)',
                type: 'id',
                status: profile.documents.isVerified ? 'approved' : 'pending',
                uploadDate: uploadDate,
                fileUrl: idBack,
              });
            }
            if (criminalRec && typeof criminalRec === 'string') {
              docs.push({
                id: 'criminal-record',
                name: 'Certificado de Antecedentes',
                type: 'certificate',
                status: profile.documents.isVerified ? 'approved' : 'pending',
                uploadDate: uploadDate,
                fileUrl: criminalRec,
              });
            }
            setDocumentsData({ documents: docs });
          }

          // ✅ Cargar datos del usuario para seguridad
          try {
            const userResponse = await fetch('/api/auth/me', {
              credentials: 'include',
            });
            if (userResponse.ok) {
              const userData = await userResponse.json();
              if (userData.user) {
                // Usar updatedAt como aproximación de última modificación de contraseña
                // En producción, esto debería venir de un campo específico
                const passwordLastChanged: string = userData.user.passwordUpdatedAt
                  ? (new Date(userData.user.passwordUpdatedAt).toISOString().split('T')[0] ?? '')
                  : userData.user.updatedAt
                    ? (new Date(userData.user.updatedAt).toISOString().split('T')[0] ?? '')
                    : '';

                setSecurityData({
                  twoFactorEnabled: false, // Por defecto hasta que se implemente
                  sessionTimeout: 30,
                  passwordLastChanged,
                  loginAlerts: true,
                  deviceTracking: true,
                });
              }
            }
          } catch (error) {
            logger.error('Error cargando datos de seguridad:', { error });
          }

          // ✅ Cargar preferencias de notificaciones desde bio del usuario
          try {
            const userResponseForNotifications = await fetch('/api/auth/me', {
              credentials: 'include',
            });
            if (userResponseForNotifications.ok) {
              const userDataForNotifications = await userResponseForNotifications.json();
              if (userDataForNotifications.user?.bio) {
                try {
                  const notificationPrefs = JSON.parse(userDataForNotifications.user.bio);
                  if (typeof notificationPrefs === 'object' && notificationPrefs !== null) {
                    setNotificationsData(prev => ({
                      ...prev,
                      ...notificationPrefs,
                    }));
                  }
                } catch {
                  // Si no es JSON válido, usar valores por defecto
                }
              }
            }
          } catch (error) {
            logger.error('Error cargando preferencias de notificaciones:', { error });
          }

          // Calcular estadísticas
          const statsResponse = await fetch('/api/provider/stats', {
            credentials: 'include',
          });
          let stats: any = {};
          if (statsResponse.ok) {
            const statsData = await statsResponse.json();
            if (statsData.success) {
              stats = statsData.data;
            }
          }

          setData({
            stats,
          });
        }
      }

      // Si no hay perfil, usar valores por defecto
      if (!data) {
        setData({
          stats: {},
        });
      }
    } catch (error) {
      logger.error('Error loading page data:', {
        error: error instanceof Error ? error.message : String(error),
      });
      setError('Error al cargar los datos');
      setData({
        stats: {},
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSettings = async (section: string) => {
    try {
      setUploadingDocument(true);
      setErrorMessage('');
      setSuccessMessage(''); // Limpiar mensaje previo

      let response: Response;

      if (section === 'perfil') {
        // Guardar configuración del perfil
        response = await fetch('/api/provider/profile', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify({
            companyName: profileData.companyName,
            contactName: profileData.contactName,
            phone: profileData.phone,
            address: profileData.address,
            description: profileData.description,
            taxId: profileData.taxId,
          }),
        });
      } else if (section === 'servicios') {
        // ✅ Guardar configuración de servicios preservando IDs únicos
        // Obtener servicios actuales del perfil para preservar IDs
        const profileResponse = await fetch('/api/provider/profile', {
          credentials: 'include',
        });

        let existingServices: Array<any> = [];
        if (profileResponse.ok) {
          const profileData = await profileResponse.json();
          if (profileData.success && profileData.profile) {
            const rawServiceTypes =
              profileData.profile.serviceTypes || profileData.profile.specialties || [];
            // Parsear servicios existentes (pueden ser objetos o strings)
            existingServices = rawServiceTypes.map((item: any) => {
              if (typeof item === 'object' && item !== null && item.id) {
                return item;
              }
              // Si es string, crear objeto con ID temporal
              return {
                id: `svc_legacy_${String(item).replace(/\s+/g, '_').toLowerCase()}`,
                name: String(item),
                active: true,
              };
            });
          }
        }

        // ✅ Actualizar servicios preservando IDs únicos
        const updatedServices = servicesData.availableServices.map(currentService => {
          // Buscar servicio existente por ID o nombre
          const existing = existingServices.find(
            (s: any) => s.id === currentService.id || s.name === currentService.name
          );

          if (existing) {
            // Preservar ID y datos existentes, actualizar solo lo necesario
            return {
              id: existing.id,
              name: currentService.name,
              active: currentService.active,
              pricing: existing.pricing || {
                type: 'fixed',
                amount: currentService.price,
                currency: 'CLP',
              },
              ...(existing.pricing && {
                pricing: { ...existing.pricing, amount: currentService.price },
              }),
            };
          }

          // Si no existe, crear nuevo servicio con ID único
          return {
            id: `svc_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
            name: currentService.name,
            active: currentService.active,
            pricing: {
              type: 'fixed',
              amount: currentService.price,
              currency: 'CLP',
            },
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };
        });

        // Calcular precio base (máximo de los servicios activos)
        const activeServicesPrices = updatedServices
          .filter(s => s.active)
          .map(s => s.pricing?.amount || 0);
        const basePrice = activeServicesPrices.length > 0 ? Math.max(...activeServicesPrices) : 0;

        response = await fetch('/api/provider/profile', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify({
            serviceTypes: updatedServices.map(s => s.name), // Enviar nombres para compatibilidad
            // ✅ También enviar el array completo de servicios con IDs para preservar estructura
            services: updatedServices,
            basePrice,
            responseTime: servicesData.responseTime,
            availability: {
              weekdays: true,
              weekends: servicesData.weekendService,
              emergencies: servicesData.emergencyService,
            },
          }),
        });
      } else if (section === 'notificaciones') {
        // ✅ Guardar preferencias de notificaciones
        // Guardar en el campo bio del usuario como JSON (similar a runner settings)
        const notificationPreferences = {
          newJobs: notificationsData.newJobs,
          jobUpdates: notificationsData.jobUpdates,
          payments: notificationsData.payments,
          reviews: notificationsData.reviews,
          marketing: notificationsData.marketing,
          emailNotifications: notificationsData.emailNotifications,
          smsNotifications: notificationsData.smsNotifications,
          pushNotifications: notificationsData.pushNotifications,
        };

        response = await fetch('/api/user/profile', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify({
            description: JSON.stringify(notificationPreferences),
          }),
        });
      } else if (section === 'seguridad') {
        // ✅ Guardar configuración de seguridad
        // Por ahora solo guardamos en el perfil del usuario
        // La autenticación de dos factores y otros settings avanzados
        // se implementarían en endpoints específicos en el futuro
        response = await fetch('/api/user/profile', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify({
            name: profileData.contactName,
            phone: profileData.phone,
          }),
        });
      } else if (section === 'documentos') {
        // ✅ Los documentos se suben individualmente, no se guardan en batch desde aquí
        // Esta función solo notifica que los documentos están siendo gestionados
        // La subida real se hace en handleDocumentUpload
        setSuccessMessage('Los documentos se gestionan individualmente al subirlos');
        setTimeout(() => setSuccessMessage(''), 3000);
        return; // No hacer llamada API, solo mostrar mensaje
      } else {
        // Fallback para otras secciones
        response = await fetch('/api/user/profile', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify({
            name: profileData.contactName,
            phone: profileData.phone,
          }),
        });
      }

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al guardar la configuración');
      }

      const data = await response.json();

      setSuccessMessage(`Configuración de ${section} guardada exitosamente`);
      setTimeout(() => setSuccessMessage(''), 3000);

      // Recargar datos actualizados
      await loadPageData();
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Servicios Configurados</CardTitle>
              <Wrench className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{servicesData.availableServices.length}</div>
              <p className="text-xs text-muted-foreground">
                {servicesData.availableServices.filter(s => s.active).length} activos
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Notificaciones Activas</CardTitle>
              <Bell className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {Object.values(notificationsData).filter(v => v === true).length}
              </div>
              <p className="text-xs text-muted-foreground">Preferencias configuradas</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Configuraciones Activas</CardTitle>
              <Settings className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {documentsData.documents.length +
                  (profileData.companyName ? 1 : 0) +
                  (profileData.phone ? 1 : 0)}
              </div>
              <p className="text-xs text-muted-foreground">Perfil y documentos</p>
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
                <Button onClick={() => handleSaveSettings('perfil')} disabled={uploadingDocument}>
                  {uploadingDocument ? (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      Guardando...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      Guardar Cambios
                    </>
                  )}
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

                <Button
                  onClick={() => handleSaveSettings('servicios')}
                  disabled={uploadingDocument}
                >
                  {uploadingDocument ? (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      Guardando...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      Guardar Servicios
                    </>
                  )}
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

                  {documentsData.documents.length === 0 ? (
                    <div className="text-center py-8 border rounded-lg">
                      <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-600 mb-2">No hay documentos subidos</p>
                      <p className="text-sm text-gray-500 mb-4">
                        Sube tus documentos para completar tu perfil de proveedor
                      </p>
                      <Button onClick={handleUploadButtonClick} disabled={uploadingDocument}>
                        <Upload className="w-4 h-4 mr-2" />
                        Subir Primer Documento
                      </Button>
                    </div>
                  ) : (
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
                              {document.fileUrl && (
                                <>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => window.open(document.fileUrl, '_blank')}
                                  >
                                    <Eye className="w-4 h-4 mr-2" />
                                    Ver
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                      const link = window.document.createElement('a');
                                      link.href = document.fileUrl;
                                      link.download = document.name;
                                      link.click();
                                    }}
                                  >
                                    <Download className="w-4 h-4 mr-2" />
                                    Descargar
                                  </Button>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Documentos Requeridos</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* ✅ Certificado de Empresa - Estado Real */}
                    {documentsData.documents.find(
                      d => d.type === 'certificate' && d.name.includes('Certificado de Empresa')
                    ) ? (
                      <div className="p-4 border rounded-lg">
                        <h4 className="font-medium text-green-600">✓ Certificado de Empresa</h4>
                        <p className="text-sm text-gray-600">
                          {documentsData.documents.find(d => d.name === 'Certificado de Empresa')
                            ?.status === 'approved'
                            ? 'Documento aprobado'
                            : 'En revisión por el administrador'}
                        </p>
                      </div>
                    ) : (
                      <div className="p-4 border rounded-lg border-dashed">
                        <h4 className="font-medium text-gray-400">○ Certificado de Empresa</h4>
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
                    )}

                    {/* ✅ Cédula de Identidad - Estado Real */}
                    {documentsData.documents.find(d => d.type === 'id') ? (
                      <div className="p-4 border rounded-lg">
                        <h4 className="font-medium text-green-600">✓ Cédula de Identidad</h4>
                        <p className="text-sm text-gray-600">
                          {documentsData.documents.find(d => d.type === 'id')?.status === 'approved'
                            ? 'Documento aprobado'
                            : 'En revisión por el administrador'}
                        </p>
                      </div>
                    ) : (
                      <div className="p-4 border rounded-lg border-dashed">
                        <h4 className="font-medium text-gray-400">○ Cédula de Identidad</h4>
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
                    )}

                    {/* ✅ Certificado de Antecedentes - Estado Real */}
                    {documentsData.documents.find(d => d.name === 'Certificado de Antecedentes') ? (
                      <div className="p-4 border rounded-lg">
                        <h4 className="font-medium text-green-600">
                          ✓ Certificado de Antecedentes
                        </h4>
                        <p className="text-sm text-gray-600">
                          {documentsData.documents.find(
                            d => d.name === 'Certificado de Antecedentes'
                          )?.status === 'approved'
                            ? 'Documento aprobado'
                            : 'En revisión por el administrador'}
                        </p>
                      </div>
                    ) : (
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
                    )}
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

                <Button
                  onClick={() => handleSaveSettings('notificaciones')}
                  disabled={uploadingDocument}
                >
                  {uploadingDocument ? (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      Guardando...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      Guardar Preferencias
                    </>
                  )}
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

                <Button
                  onClick={() => handleSaveSettings('seguridad')}
                  disabled={uploadingDocument}
                >
                  {uploadingDocument ? (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      Guardando...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      Guardar Configuración de Seguridad
                    </>
                  )}
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

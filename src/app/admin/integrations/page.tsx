'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { logger } from '@/lib/logger';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { QuickActionButton } from '@/components/dashboard/QuickActionButton';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Building,
  Users,
  FileText,
  CreditCard,
  Star,
  Settings,
  Bell,
  TrendingUp,
  DollarSign,
  AlertTriangle,
  AlertCircle,
  CheckCircle,
  BarChart3,
  UserPlus,
  Eye,
  Edit,
  Trash2,
  MessageSquare,
  Ticket,
  Database,
  Shield,
  Clock,
  Search,
  Calendar,
  MapPin,
  Wrench,
  Camera,
  Target,
  Activity,
  PieChart,
  LineChart,
  Info,
  Plus,
  Filter,
  Download,
  Upload,
  RefreshCw,
  Zap,
  Mail,
  Phone,
  Globe,
  Key,
} from 'lucide-react';
import UnifiedDashboardLayout from '@/components/layout/UnifiedDashboardLayout';

export default function IntegracionesPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const [integrations, setIntegrations] = useState<any[]>([
    {
      id: '1',
      name: 'Khipu Pagos',
      description: 'Sistema de pagos en línea chileno',
      category: 'Pagos',
      icon: 'CreditCard',
      status: 'active',
      lastSync: '2024-01-15T10:30:00',
      totalTransactions: 1247,
      successRate: 98.5,
      apiKey: 'khp_************1234',
      webhookUrl: 'https://api.rent360.cl/webhooks/khipu',
      config: {
        merchantId: '123456789',
        secretKey: 'sk_************abcd',
      },
    },
    {
      id: '2',
      name: 'SendGrid Email',
      description: 'Servicio de envío de correos electrónicos',
      category: 'Comunicación',
      icon: 'Mail',
      status: 'active',
      lastSync: '2024-01-15T09:15:00',
      totalTransactions: 3562,
      successRate: 99.2,
      apiKey: 'SG.************.xyz',
      webhookUrl: null,
      config: {
        apiKey: 'SG.************.xyz',
        fromEmail: 'noreply@rent360.cl',
      },
    },
    {
      id: '3',
      name: 'Google Maps',
      description: 'Servicios de mapas y geolocalización',
      category: 'Ubicación',
      icon: 'MapPin',
      status: 'active',
      lastSync: '2024-01-14T16:45:00',
      totalTransactions: 892,
      successRate: 97.8,
      apiKey: 'AIza************9876',
      webhookUrl: null,
      config: {
        apiKey: 'AIza************9876',
        libraries: ['places', 'geometry'],
      },
    },
    {
      id: '4',
      name: 'Banco Estado',
      description: 'Integración con servicios bancarios',
      category: 'Bancario',
      icon: 'Building',
      status: 'pending',
      lastSync: null,
      totalTransactions: 0,
      successRate: 0,
      apiKey: null,
      webhookUrl: null,
      config: {
        clientId: null,
        clientSecret: null,
        environment: 'sandbox',
      },
    },
    {
      id: '5',
      name: 'Twilio SMS',
      description: 'Servicio de envío de mensajes de texto',
      category: 'Comunicación',
      icon: 'Phone',
      status: 'inactive',
      lastSync: '2024-01-10T12:00:00',
      totalTransactions: 234,
      successRate: 95.6,
      apiKey: 'AC************5678',
      webhookUrl: null,
      config: {
        accountSid: 'AC************5678',
        authToken: 'sk_************efgh',
        fromNumber: '+56987654321',
      },
    },
    {
      id: '6',
      name: 'MercadoPago',
      description: 'Plataforma de pagos MercadoPago',
      category: 'Pagos',
      icon: 'DollarSign',
      status: 'configuring',
      lastSync: null,
      totalTransactions: 0,
      successRate: 0,
      apiKey: 'APP_USR-************-123',
      webhookUrl: 'https://api.rent360.cl/webhooks/mercadopago',
      config: {
        accessToken: 'APP_USR-************-123',
        publicKey: 'TEST-************-456',
      },
    },
    {
      id: '7',
      name: 'Sentry Monitoring',
      description: 'Monitoreo de errores y rendimiento',
      category: 'Monitoreo',
      icon: 'Activity',
      status: 'active',
      lastSync: '2024-01-15T11:00:00',
      totalTransactions: 456,
      successRate: 100,
      apiKey: 'https://************@sentry.io/1234567',
      webhookUrl: null,
      config: {
        dsn: 'https://************@sentry.io/1234567',
        environment: 'production',
      },
    },
    {
      id: '8',
      name: 'Cloudinary Media',
      description: 'Gestión y optimización de imágenes',
      category: 'Media',
      icon: 'Camera',
      status: 'active',
      lastSync: '2024-01-15T08:30:00',
      totalTransactions: 1247,
      successRate: 99.8,
      apiKey: '************_cloudinary',
      webhookUrl: null,
      config: {
        cloudName: 'rent360',
        apiKey: '************',
        apiSecret: '************',
      },
    },
  ]);

  const [selectedIntegration, setSelectedIntegration] = useState<any>(null);
  const [showConfigDialog, setShowConfigDialog] = useState(false);

  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    // Cargar datos de la página
    loadPageData();
  }, []);

  const loadPageData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Mock integrations overview data
      const overviewData = {
        totalIntegrations: integrations.length,
        activeIntegrations: integrations.filter(i => i.status === 'active').length,
        pendingIntegrations: integrations.filter(
          i => i.status === 'pending' || i.status === 'configuring'
        ).length,
        totalTransactions: integrations.reduce((sum, i) => sum + i.totalTransactions, 0),
      };

      setData(overviewData);
    } catch (error) {
      logger.error('Error loading page data:', {
        error: error instanceof Error ? error.message : String(error),
      });
      setError('Error al cargar los datos');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleIntegration = (integrationId: string) => {
    setIntegrations(prev =>
      prev.map(integration =>
        integration.id === integrationId
          ? {
              ...integration,
              status: integration.status === 'active' ? 'inactive' : 'active',
              lastSync: integration.status === 'active' ? null : new Date().toISOString(),
            }
          : integration
      )
    );
  };

  const handleTestIntegration = (integrationId: string) => {
    const integration = integrations.find(i => i.id === integrationId);
    if (integration) {
      setSuccessMessage(`Probando conexión con ${integration.name}...`);
      // Simular test
      setTimeout(() => {
        setSuccessMessage(`✅ Conexión exitosa con ${integration.name}`);
        setTimeout(() => setSuccessMessage(''), 3000);
      }, 1000);
    }
  };

  const handleExportIntegrations = () => {
    const csvContent = [
      [
        'Nombre',
        'Categoría',
        'Estado',
        'Última Sincronización',
        'Total Transacciones',
        'Tasa de Éxito',
      ],
    ];

    integrations.forEach(integration => {
      csvContent.push([
        integration.name,
        integration.category,
        integration.status,
        integration.lastSync ? new Date(integration.lastSync).toLocaleDateString('es-CL') : 'Nunca',
        integration.totalTransactions.toString(),
        integration.successRate > 0 ? `${integration.successRate}%` : 'N/A',
      ]);
    });

    const csvString = csvContent.map(row => row.map(field => `"${field}"`).join(',')).join('\n');
    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `integraciones_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      active: { label: 'Activo', color: 'bg-green-100 text-green-800' },
      inactive: { label: 'Inactivo', color: 'bg-red-100 text-red-800' },
      pending: { label: 'Pendiente', color: 'bg-yellow-100 text-yellow-800' },
      configuring: { label: 'Configurando', color: 'bg-blue-100 text-blue-800' },
    };
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
    return <Badge className={config.color}>{config.label}</Badge>;
  };

  const getCategoryIcon = (category: string) => {
    const icons = {
      Pagos: CreditCard,
      Comunicación: Mail,
      Ubicación: MapPin,
      Bancario: Building,
      Monitoreo: Activity,
      Media: Camera,
    };
    const IconComponent = icons[category as keyof typeof icons] || Zap;
    return <IconComponent className="w-5 h-5" />;
  };

  const getCategoryBadge = (category: string) => {
    const colors = {
      Pagos: 'bg-blue-100 text-blue-800',
      Comunicación: 'bg-purple-100 text-purple-800',
      Ubicación: 'bg-green-100 text-green-800',
      Bancario: 'bg-orange-100 text-orange-800',
      Monitoreo: 'bg-red-100 text-red-800',
      Media: 'bg-pink-100 text-pink-800',
    };
    return (
      <Badge className={colors[category as keyof typeof colors] || 'bg-gray-100 text-gray-800'}>
        {category}
      </Badge>
    );
  };

  if (loading) {
    return (
      <UnifiedDashboardLayout title="Integraciones" subtitle="Cargando información...">
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
      <UnifiedDashboardLayout title="Integraciones" subtitle="Error al cargar la página">
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
    <UnifiedDashboardLayout title="Integraciones" subtitle="Gestiona las integraciones del sistema">
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
              <CardTitle className="text-sm font-medium">Total Integraciones</CardTitle>
              <Zap className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{data?.totalIntegrations || 0}</div>
              <p className="text-xs text-muted-foreground">+2 desde el mes pasado</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Activas</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{data?.activeIntegrations || 0}</div>
              <p className="text-xs text-muted-foreground">Funcionando correctamente</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pendientes</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{data?.pendingIntegrations || 0}</div>
              <p className="text-xs text-muted-foreground">Requieren configuración</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Transacciones</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {data?.totalTransactions?.toLocaleString() || 0}
              </div>
              <p className="text-xs text-muted-foreground">Procesadas este mes</p>
            </CardContent>
          </Card>
        </div>

        {/* Gestión de integraciones por pestañas */}
        <Tabs defaultValue="all" className="space-y-4">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="all">Todas</TabsTrigger>
            <TabsTrigger value="active">Activas</TabsTrigger>
            <TabsTrigger value="inactive">Inactivas</TabsTrigger>
            <TabsTrigger value="pending">Pendientes</TabsTrigger>
            <TabsTrigger value="pagos">Pagos</TabsTrigger>
            <TabsTrigger value="comunicacion">Comunicación</TabsTrigger>
          </TabsList>

          {['all', 'active', 'inactive', 'pending', 'pagos', 'comunicacion'].map(tabValue => (
            <TabsContent key={tabValue} value={tabValue}>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {integrations
                  .filter(integration => {
                    if (tabValue === 'all') {
                      return true;
                    }
                    if (tabValue === 'active') {
                      return integration.status === 'active';
                    }
                    if (tabValue === 'inactive') {
                      return integration.status === 'inactive';
                    }
                    if (tabValue === 'pending') {
                      return (
                        integration.status === 'pending' || integration.status === 'configuring'
                      );
                    }
                    if (tabValue === 'pagos') {
                      return integration.category === 'Pagos';
                    }
                    if (tabValue === 'comunicacion') {
                      return integration.category === 'Comunicación';
                    }
                    return true;
                  })
                  .map(integration => (
                    <Card key={integration.id} className="hover:shadow-md transition-shadow">
                      <CardContent className="pt-6">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-center gap-3 flex-1">
                            <div className="p-2 bg-gray-100 rounded-lg">
                              {getCategoryIcon(integration.category)}
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <h3 className="font-semibold text-lg">{integration.name}</h3>
                                {getStatusBadge(integration.status)}
                              </div>
                              <p className="text-gray-600 text-sm mb-2">
                                {integration.description}
                              </p>
                              {getCategoryBadge(integration.category)}
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <Switch
                              checked={integration.status === 'active'}
                              onCheckedChange={() => handleToggleIntegration(integration.id)}
                              disabled={integration.status === 'pending'}
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4 text-sm text-gray-600 mb-4">
                          <div className="flex items-center gap-2">
                            <Activity className="w-4 h-4" />
                            <span>{integration.totalTransactions} transacciones</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <TrendingUp className="w-4 h-4" />
                            <span>
                              {integration.successRate > 0
                                ? `${integration.successRate}% éxito`
                                : 'Sin datos'}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 col-span-2">
                            <Clock className="w-4 h-4" />
                            <span>
                              Última sync:{' '}
                              {integration.lastSync
                                ? new Date(integration.lastSync).toLocaleDateString('es-CL')
                                : 'Nunca'}
                            </span>
                          </div>
                        </div>

                        {integration.apiKey && (
                          <div className="mb-3 p-2 bg-gray-50 rounded text-xs font-mono">
                            API Key: {integration.apiKey}
                          </div>
                        )}

                        {integration.webhookUrl && (
                          <div className="mb-3 p-2 bg-blue-50 rounded text-xs">
                            <strong>Webhook:</strong> {integration.webhookUrl}
                          </div>
                        )}

                        <div className="flex gap-2">
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setSelectedIntegration(integration)}
                              >
                                <Eye className="w-4 h-4 mr-2" />
                                Ver Config
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-2xl">
                              <DialogHeader>
                                <DialogTitle>Configuración de {integration.name}</DialogTitle>
                              </DialogHeader>
                              <div className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  {Object.entries(integration.config).map(([key, value]) => (
                                    <div key={key} className="space-y-2">
                                      <Label
                                        htmlFor={key}
                                        className="text-sm font-medium capitalize"
                                      >
                                        {key.replace(/([A-Z])/g, ' $1').trim()}
                                      </Label>
                                      <Input
                                        id={key}
                                        value={value ? String(value) : ''}
                                        placeholder="No configurado"
                                        readOnly
                                        className="font-mono text-xs"
                                      />
                                    </div>
                                  ))}
                                </div>
                                <div className="flex gap-2 justify-end">
                                  <Button
                                    variant="outline"
                                    onClick={() =>
                                      router.push(`/admin/integrations/${integration.id}/edit`)
                                    }
                                  >
                                    <Edit className="w-4 h-4 mr-2" />
                                    Editar Configuración
                                  </Button>
                                  <Button onClick={() => handleTestIntegration(integration.id)}>
                                    <Zap className="w-4 h-4 mr-2" />
                                    Probar Conexión
                                  </Button>
                                </div>
                              </div>
                            </DialogContent>
                          </Dialog>

                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleTestIntegration(integration.id)}
                          >
                            <Zap className="w-4 h-4 mr-2" />
                            Probar
                          </Button>

                          {integration.status !== 'pending' && (
                            <Button
                              size="sm"
                              onClick={() =>
                                router.push(`/admin/integrations/${integration.id}/logs`)
                              }
                            >
                              <BarChart3 className="w-4 h-4 mr-2" />
                              Logs
                            </Button>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
              </div>
            </TabsContent>
          ))}
        </Tabs>

        {/* Acciones rápidas */}
        <Card>
          <CardHeader>
            <CardTitle>Acciones Rápidas</CardTitle>
            <CardDescription>Accede rápidamente a las funciones más utilizadas</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <QuickActionButton
                icon={Plus}
                label="Nueva Integración"
                description="Conectar servicio"
                onClick={() => router.push('/admin/integrations/new')}
              />

              <QuickActionButton
                icon={Search}
                label="Buscar"
                description="Buscar integraciones"
                onClick={() => {
                  // Focus on search input or open search dialog
                  const searchInput = document.querySelector(
                    'input[placeholder*="Buscar"]'
                  ) as HTMLInputElement;
                  if (searchInput) {
                    searchInput.focus();
                  }
                }}
              />

              <QuickActionButton
                icon={Download}
                label="Exportar"
                description="Descargar configuración"
                onClick={handleExportIntegrations}
              />

              <QuickActionButton
                icon={BarChart3}
                label="Reportes"
                description="Estadísticas de uso"
                onClick={() => router.push('/admin/reports/integrations')}
              />

              <QuickActionButton
                icon={Shield}
                label="Seguridad"
                description="Revisar permisos"
                onClick={() => router.push('/admin/security')}
              />

              <QuickActionButton
                icon={RefreshCw}
                label="Actualizar"
                description="Recargar datos"
                onClick={() => loadPageData()}
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </UnifiedDashboardLayout>
  );
}

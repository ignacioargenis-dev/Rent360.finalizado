'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Zap,
  Settings,
  TestTube,
  Webhook,
  Shield,
  CheckCircle,
  XCircle,
  AlertTriangle,
  RefreshCw,
  Plus,
} from 'lucide-react';
import UnifiedDashboardLayout from '@/components/layout/UnifiedDashboardLayout';
import { useAuth } from '@/components/auth/AuthProvider';
import { logger } from '@/lib/logger';

interface Integration {
  id: string;
  name: string;
  type: 'payment' | 'communication' | 'analytics' | 'storage' | 'other';
  provider: string;
  status: 'active' | 'inactive' | 'error' | 'configuring';
  lastSync: string;
  apiKey?: string;
  webhookUrl?: string;
  config: Record<string, any>;
}

interface IntegrationStats {
  total: number;
  active: number;
  inactive: number;
  error: number;
}

export default function AdminIntegrationsPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedIntegration, setSelectedIntegration] = useState<Integration | null>(null);
  const [showConfigDialog, setShowConfigDialog] = useState(false);
  const [configData, setConfigData] = useState<Record<string, any>>({});

  // Mock integrations data
  const mockIntegrations: Integration[] = [
    {
      id: '1',
      name: 'Stripe Payment Gateway',
      type: 'payment',
      provider: 'Stripe',
      status: 'active',
      lastSync: '2024-12-15 14:30:00',
      apiKey: 'sk_test_...',
      config: {
        mode: 'test',
        currency: 'CLP',
        webhookSecret: 'whsec_...',
      },
    },
    {
      id: '2',
      name: 'Twilio SMS',
      type: 'communication',
      provider: 'Twilio',
      status: 'active',
      lastSync: '2024-12-15 14:25:00',
      config: {
        accountSid: 'AC...',
        authToken: 'SK...',
        phoneNumber: '+1234567890',
      },
    },
    {
      id: '3',
      name: 'SendGrid Email',
      type: 'communication',
      provider: 'SendGrid',
      status: 'error',
      lastSync: '2024-12-15 12:00:00',
      config: {
        apiKey: 'SG...',
        fromEmail: 'noreply@rent360.com',
      },
    },
    {
      id: '4',
      name: 'Google Analytics',
      type: 'analytics',
      provider: 'Google',
      status: 'inactive',
      lastSync: '2024-12-10 10:00:00',
      config: {
        trackingId: 'GA_MEASUREMENT_ID',
        apiSecret: 'G-...',
      },
    },
    {
      id: '5',
      name: 'AWS S3 Storage',
      type: 'storage',
      provider: 'Amazon',
      status: 'active',
      lastSync: '2024-12-15 14:20:00',
      config: {
        accessKeyId: 'AKIA...',
        secretAccessKey: '***',
        region: 'us-east-1',
        bucketName: 'rent360-storage',
      },
    },
  ];

  useEffect(() => {
    loadIntegrations();
  }, []);

  const loadIntegrations = async () => {
    setIsLoading(true);
    try {
      // Simular API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      setIntegrations(mockIntegrations);
    } catch (error) {
      logger.error('Error al cargar integraciones', { error });
    } finally {
      setIsLoading(false);
    }
  };

  const getStats = (): IntegrationStats => {
    return {
      total: integrations.length,
      active: integrations.filter(i => i.status === 'active').length,
      inactive: integrations.filter(i => i.status === 'inactive').length,
      error: integrations.filter(i => i.status === 'error').length,
    };
  };

  const handleToggleIntegration = (integrationId: string) => {
    setIntegrations(prev =>
      prev.map(integration =>
        integration.id === integrationId
          ? {
              ...integration,
              status: integration.status === 'active' ? 'inactive' : 'active',
            }
          : integration
      )
    );

    logger.info('Estado de integración cambiado', { integrationId });
  };

  const handleTestConnection = async (integrationId: string) => {
    try {
      // Simular test de conexión
      await new Promise(resolve => setTimeout(resolve, 2000));

      setIntegrations(prev =>
        prev.map(integration =>
          integration.id === integrationId
            ? { ...integration, status: 'active', lastSync: new Date().toISOString() }
            : integration
        )
      );

      logger.info('Conexión de integración probada exitosamente', { integrationId });
      alert('Conexión probada exitosamente.');
    } catch (error) {
      logger.error('Error al probar conexión', { integrationId, error });
      alert('Error al probar la conexión.');
    }
  };

  const handleViewConfig = (integration: Integration) => {
    setSelectedIntegration(integration);
    setConfigData(integration.config);
    setShowConfigDialog(true);
  };

  const handleSaveConfig = () => {
    if (!selectedIntegration) {
      return;
    }

    setIntegrations(prev =>
      prev.map(integration =>
        integration.id === selectedIntegration.id
          ? { ...integration, config: configData }
          : integration
      )
    );

    setShowConfigDialog(false);
    setSelectedIntegration(null);
    setConfigData({});

    logger.info('Configuración de integración guardada', { integrationId: selectedIntegration.id });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-500">Activa</Badge>;
      case 'inactive':
        return <Badge variant="secondary">Inactiva</Badge>;
      case 'error':
        return <Badge variant="destructive">Error</Badge>;
      case 'configuring':
        return (
          <Badge variant="outline" className="text-blue-600 border-blue-600">
            Configurando
          </Badge>
        );
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'payment':
        return <Zap className="w-5 h-5 text-yellow-600" />;
      case 'communication':
        return <Settings className="w-5 h-5 text-blue-600" />;
      case 'analytics':
        return <TestTube className="w-5 h-5 text-green-600" />;
      case 'storage':
        return <Shield className="w-5 h-5 text-purple-600" />;
      default:
        return <Settings className="w-5 h-5 text-gray-600" />;
    }
  };

  const stats = getStats();

  if (isLoading) {
    return (
      <UnifiedDashboardLayout>
        <div className="flex items-center justify-center min-h-screen">
          <RefreshCw className="w-8 h-8 animate-spin mr-2" />
          <span>Cargando integraciones...</span>
        </div>
      </UnifiedDashboardLayout>
    );
  }

  return (
    <UnifiedDashboardLayout>
      <div className="container mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Integraciones</h1>
            <p className="text-gray-600">Gestión de integraciones de terceros</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={loadIntegrations} disabled={isLoading}>
              <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Actualizar
            </Button>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Nueva Integración
            </Button>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
                </div>
                <Settings className="w-8 h-8 text-gray-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Activas</p>
                  <p className="text-2xl font-bold text-green-600">{stats.active}</p>
                </div>
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Inactivas</p>
                  <p className="text-2xl font-bold text-gray-600">{stats.inactive}</p>
                </div>
                <XCircle className="w-8 h-8 text-gray-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Errores</p>
                  <p className="text-2xl font-bold text-red-600">{stats.error}</p>
                </div>
                <AlertTriangle className="w-8 h-8 text-red-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview">Resumen</TabsTrigger>
            <TabsTrigger value="payment">Pagos</TabsTrigger>
            <TabsTrigger value="communication">Comunicación</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Todas las Integraciones</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nombre</TableHead>
                      <TableHead>Proveedor</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead>Última Sincronización</TableHead>
                      <TableHead>Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {integrations.map(integration => (
                      <TableRow key={integration.id}>
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            {getTypeIcon(integration.type)}
                            {integration.name}
                          </div>
                        </TableCell>
                        <TableCell>{integration.provider}</TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {integration.type === 'payment'
                              ? 'Pago'
                              : integration.type === 'communication'
                                ? 'Comunicación'
                                : integration.type === 'analytics'
                                  ? 'Analytics'
                                  : integration.type === 'storage'
                                    ? 'Almacenamiento'
                                    : integration.type}
                          </Badge>
                        </TableCell>
                        <TableCell>{getStatusBadge(integration.status)}</TableCell>
                        <TableCell>{integration.lastSync}</TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleToggleIntegration(integration.id)}
                            >
                              {integration.status === 'active' ? 'Desactivar' : 'Activar'}
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleTestConnection(integration.id)}
                            >
                              <TestTube className="w-4 h-4 mr-2" />
                              Probar
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleViewConfig(integration)}
                            >
                              <Settings className="w-4 h-4 mr-2" />
                              Config
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="payment" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Integraciones de Pago</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {integrations
                    .filter(i => i.type === 'payment')
                    .map(integration => (
                      <div
                        key={integration.id}
                        className="flex items-center justify-between p-4 border border-gray-200 rounded-lg"
                      >
                        <div className="flex items-center gap-4">
                          {getTypeIcon(integration.type)}
                          <div>
                            <p className="font-medium">{integration.name}</p>
                            <p className="text-sm text-gray-600">{integration.provider}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          {getStatusBadge(integration.status)}
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleTestConnection(integration.id)}
                          >
                            <TestTube className="w-4 h-4 mr-2" />
                            Probar
                          </Button>
                        </div>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="communication" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Integraciones de Comunicación</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {integrations
                    .filter(i => i.type === 'communication')
                    .map(integration => (
                      <div
                        key={integration.id}
                        className="flex items-center justify-between p-4 border border-gray-200 rounded-lg"
                      >
                        <div className="flex items-center gap-4">
                          {getTypeIcon(integration.type)}
                          <div>
                            <p className="font-medium">{integration.name}</p>
                            <p className="text-sm text-gray-600">{integration.provider}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          {getStatusBadge(integration.status)}
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleTestConnection(integration.id)}
                          >
                            <TestTube className="w-4 h-4 mr-2" />
                            Probar
                          </Button>
                        </div>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Configuration Dialog */}
        <Dialog open={showConfigDialog} onOpenChange={setShowConfigDialog}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Configuración de {selectedIntegration?.name}</DialogTitle>
              <DialogDescription>Configura los parámetros de la integración</DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              {selectedIntegration &&
                Object.entries(selectedIntegration.config).map(([key, value]) => (
                  <div key={key}>
                    <Label htmlFor={key}>
                      {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                    </Label>
                    <Input
                      id={key}
                      value={configData[key] || ''}
                      onChange={e => setConfigData(prev => ({ ...prev, [key]: e.target.value }))}
                      type={
                        key.toLowerCase().includes('secret') || key.toLowerCase().includes('key')
                          ? 'password'
                          : 'text'
                      }
                    />
                  </div>
                ))}
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowConfigDialog(false)}>
                Cancelar
              </Button>
              <Button onClick={handleSaveConfig}>Guardar Configuración</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </UnifiedDashboardLayout>
  );
}

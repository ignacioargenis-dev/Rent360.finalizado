'use client';


import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import UnifiedDashboardLayout from '@/components/layout/UnifiedDashboardLayout';
import {
  CreditCard,
  CheckCircle,
  AlertTriangle,
  Settings,
  Save,
  TestTube,
  DollarSign,
  Globe,
  Shield,
  Zap
} from 'lucide-react';
import { useToast } from '@/components/notifications/NotificationSystem';

import { useAuth } from '@/components/auth/AuthProvider';

interface PaymentProvider {
  name: string;
  type: 'international' | 'chilean' | 'crypto';
  enabled: boolean;
  configured: boolean;
  features: {
    creditCards: boolean;
    bankTransfer: boolean;
    digitalWallet: boolean;
    recurringPayments: boolean;
    refunds: boolean;
    webhooks: boolean;
  };
  config: {
    apiKey?: string;
    apiSecret?: string;
    webhookSecret?: string;
    environment?: string;
    receiverId?: string;
    commerceCode?: string;
  };
}

export default function PaymentsAdminPage() {
  const { user } = useAuth();
  const [providers, setProviders] = useState<PaymentProvider[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { success, error } = useToast();

  // Proveedores de pago disponibles
  const availableProviders: PaymentProvider[] = [
    {
      name: 'Stripe',
      type: 'international',
      enabled: false,
      configured: false,
      features: {
        creditCards: true,
        bankTransfer: true,
        digitalWallet: true,
        recurringPayments: true,
        refunds: true,
        webhooks: true
      },
      config: {
        apiKey: '',
        apiSecret: '',
        webhookSecret: '',
        environment: 'test'
      }
    },
    {
      name: 'PayPal',
      type: 'international',
      enabled: false,
      configured: false,
      features: {
        creditCards: true,
        bankTransfer: false,
        digitalWallet: true,
        recurringPayments: true,
        refunds: true,
        webhooks: true
      },
      config: {
        apiKey: '',
        apiSecret: '',
        environment: 'sandbox'
      }
    },
    {
      name: 'Khipu',
      type: 'chilean',
      enabled: false,
      configured: false,
      features: {
        creditCards: true,
        bankTransfer: true,
        digitalWallet: false,
        recurringPayments: false,
        refunds: true,
        webhooks: true
      },
      config: {
        apiKey: '',
        apiSecret: '',
        receiverId: '',
        environment: 'test'
      }
    },
    {
      name: 'WebPay',
      type: 'chilean',
      enabled: false,
      configured: false,
      features: {
        creditCards: true,
        bankTransfer: false,
        digitalWallet: false,
        recurringPayments: false,
        refunds: true,
        webhooks: true
      },
      config: {
        apiKey: '',
        commerceCode: '',
        environment: 'integration'
      }
    }
  ];

  useEffect(() => {
    loadProvidersConfig();
  }, []);

  const loadProvidersConfig = async () => {
    try {
      setLoading(true);

      // Cargar configuración desde variables de entorno y base de datos
      const loadedProviders = availableProviders.map(provider => {
        const envPrefix = provider.name.toUpperCase();

        return {
          ...provider,
          enabled: !!process.env[`${envPrefix}_API_KEY`],
          configured: !!(
            process.env[`${envPrefix}_API_KEY`] &&
            process.env[`${envPrefix}_API_SECRET`]
          ),
          config: {
            ...provider.config,
            apiKey: process.env[`${envPrefix}_API_KEY`] || '',
            apiSecret: process.env[`${envPrefix}_API_SECRET`] || '',
            webhookSecret: process.env[`${envPrefix}_WEBHOOK_SECRET`] || '',
            environment: process.env[`${envPrefix}_ENVIRONMENT`] || provider.config.environment || 'test',
            receiverId: process.env[`${envPrefix}_RECEIVER_ID`] || '',
            commerceCode: process.env[`${envPrefix}_COMMERCE_CODE`] || ''
          }
        };
      });

      setProviders(loadedProviders);
    } catch (err) {
      error('Error al cargar configuración', 'No se pudo cargar la configuración de proveedores de pago');
    } finally {
      setLoading(false);
    }
  };

  const updateProviderConfig = (providerName: string, field: string, value: any) => {
    setProviders(prev => prev.map(provider =>
      provider.name === providerName
        ? {
            ...provider,
            config: { ...provider.config, [field]: value },
            configured: !!(
              provider.config.apiKey && 
              provider.config.apiSecret &&
              (provider.name === 'WebPay' ? provider.config.commerceCode : true)
            )
          }
        : provider
    ));
  };

  const toggleProvider = (providerName: string) => {
    setProviders(prev => prev.map(provider =>
      provider.name === providerName
        ? { ...provider, enabled: !provider.enabled }
        : provider
    ));
  };

  const saveConfiguration = async () => {
    try {
      setSaving(true);

      const response = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          settings: providers.map(provider => ({
            key: `${provider.name.toUpperCase()}_API_KEY`,
            value: provider.config.apiKey || '',
            category: 'payment',
            isEncrypted: true,
            isPublic: false
          })).concat(
            providers.map(provider => ({
              key: `${provider.name.toUpperCase()}_API_SECRET`,
              value: provider.config.apiSecret || '',
              category: 'payment',
              isEncrypted: true,
              isPublic: false
            }))
          ).concat(
            providers.map(provider => ({
              key: `${provider.name.toUpperCase()}_ENVIRONMENT`,
              value: provider.config.environment || 'test',
              category: 'payment',
              isEncrypted: false,
              isPublic: false
            }))
          )
        })
      });

      if (!response.ok) {
        throw new Error('Error guardando configuración');
      }

      success('Configuración guardada', 'Los proveedores de pago se han configurado correctamente');
    } catch (err) {
      error('Error guardando configuración', 'No se pudo guardar la configuración de proveedores de pago');
    } finally {
      setSaving(false);
    }
  };

  const testProvider = async (providerName: string) => {
    try {
      const response = await fetch(`/api/admin/payments/test/${providerName.toLowerCase()}`, {
        method: 'POST'
      });

      if (response.ok) {
        success('Prueba exitosa', `El proveedor ${providerName} está funcionando correctamente`);
      } else {
        error('Prueba fallida', `El proveedor ${providerName} no está configurado correctamente`);
      }
    } catch (err) {
      error('Error en prueba', 'No se pudo probar la conexión con el proveedor');
    }
  };

  const getProviderIcon = (provider: PaymentProvider) => {
    switch (provider.name) {
      case 'Stripe':
        return <CreditCard className="h-5 w-5 text-blue-600" />;
      case 'PayPal':
        return <Globe className="h-5 w-5 text-blue-500" />;
      case 'Khipu':
        return <DollarSign className="h-5 w-5 text-green-600" />;
      case 'WebPay':
        return <Shield className="h-5 w-5 text-red-600" />;
      default:
        return <CreditCard className="h-5 w-5" />;
    }
  };

  const getTypeBadge = (type: string) => {
    switch (type) {
      case 'international':
        return <Badge variant="outline" className="text-blue-600">Internacional</Badge>;
      case 'chilean':
        return <Badge variant="outline" className="text-green-600">Chileno</Badge>;
      case 'crypto':
        return <Badge variant="outline" className="text-purple-600">Cripto</Badge>;
      default:
        return <Badge variant="outline">{type}</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <UnifiedDashboardLayout title="Configuración de Pagos" subtitle="Administra proveedores de pago y configuraciones">
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Configuración de Pagos</h1>
            <p className="text-gray-600">Gestiona los proveedores de pago y sus configuraciones</p>
          </div>
          <Button onClick={saveConfiguration} disabled={saving} className="flex items-center gap-2">
            <Save className="h-4 w-4" />
            {saving ? 'Guardando...' : 'Guardar Configuración'}
          </Button>
        </div>

        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Las credenciales de los proveedores de pago se almacenan de forma encriptada en la base de datos.
            Solo los administradores pueden ver y modificar estas configuraciones.
          </AlertDescription>
        </Alert>

        <div className="grid gap-6">
          {providers.map((provider) => (
            <Card key={provider.name} className="overflow-hidden">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {getProviderIcon(provider)}
                    <div>
                      <CardTitle className="text-xl">{provider.name}</CardTitle>
                      <CardDescription className="flex items-center gap-2">
                        {getTypeBadge(provider.type)}
                        {provider.configured ? (
                          <Badge variant="default" className="bg-green-100 text-green-800">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Configurado
                          </Badge>
                        ) : (
                          <Badge variant="secondary">
                            <AlertTriangle className="h-3 w-3 mr-1" />
                            No configurado
                          </Badge>
                        )}
                      </CardDescription>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={provider.enabled}
                      onCheckedChange={() => toggleProvider(provider.name)}
                      disabled={!provider.configured}
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => testProvider(provider.name)}
                      disabled={!provider.configured}
                    >
                      <TestTube className="h-4 w-4 mr-1" />
                      Probar
                    </Button>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor={`${provider.name}-apiKey`}>API Key</Label>
                    <Input
                      id={`${provider.name}-apiKey`}
                      type="password"
                      value={provider.config.apiKey || ''}
                      onChange={(e) => updateProviderConfig(provider.name, 'apiKey', e.target.value)}
                      placeholder="Ingresa tu API Key"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor={`${provider.name}-apiSecret`}>API Secret</Label>
                    <Input
                      id={`${provider.name}-apiSecret`}
                      type="password"
                      value={provider.config.apiSecret || ''}
                      onChange={(e) => updateProviderConfig(provider.name, 'apiSecret', e.target.value)}
                      placeholder="Ingresa tu API Secret"
                    />
                  </div>

                  {provider.name === 'Stripe' && (
                    <div className="space-y-2">
                      <Label htmlFor={`${provider.name}-webhookSecret`}>Webhook Secret</Label>
                      <Input
                        id={`${provider.name}-webhookSecret`}
                        type="password"
                        value={provider.config.webhookSecret || ''}
                        onChange={(e) => updateProviderConfig(provider.name, 'webhookSecret', e.target.value)}
                        placeholder="Ingresa tu Webhook Secret"
                      />
                    </div>
                  )}

                  {provider.name === 'Khipu' && (
                    <div className="space-y-2">
                      <Label htmlFor={`${provider.name}-receiverId`}>Receiver ID</Label>
                      <Input
                        id={`${provider.name}-receiverId`}
                        value={provider.config.receiverId || ''}
                        onChange={(e) => updateProviderConfig(provider.name, 'receiverId', e.target.value)}
                        placeholder="Ingresa tu Receiver ID"
                      />
                    </div>
                  )}

                  {provider.name === 'WebPay' && (
                    <div className="space-y-2">
                      <Label htmlFor={`${provider.name}-commerceCode`}>Commerce Code</Label>
                      <Input
                        id={`${provider.name}-commerceCode`}
                        value={provider.config.commerceCode || ''}
                        onChange={(e) => updateProviderConfig(provider.name, 'commerceCode', e.target.value)}
                        placeholder="Ingresa tu Commerce Code"
                      />
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor={`${provider.name}-environment`}>Entorno</Label>
                    <select
                      id={`${provider.name}-environment`}
                      value={provider.config.environment || 'test'}
                      onChange={(e) => updateProviderConfig(provider.name, 'environment', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="test">Pruebas</option>
                      <option value="live">Producción</option>
                    </select>
                  </div>
                </div>

                <Separator />

                <div className="space-y-2">
                  <Label className="text-sm font-medium">Características disponibles</Label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {Object.entries(provider.features).map(([feature, available]) => (
                      <div key={feature} className="flex items-center gap-2">
                        {available ? (
                          <CheckCircle className="h-4 w-4 text-green-500" />
                        ) : (
                          <AlertTriangle className="h-4 w-4 text-gray-400" />
                        )}
                        <span className="text-sm capitalize">
                          {feature.replace(/([A-Z])/g, ' $1').trim()}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </UnifiedDashboardLayout>
  );
}




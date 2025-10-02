'use client';


import React from 'react';
import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Mail,
  MessageSquare,
  CheckCircle,
  AlertTriangle,
  Settings,
  Save,
  TestTube,
  Send,
  Phone,
  Bell
} from 'lucide-react';
import { useToast } from '@/components/notifications/NotificationSystem';


interface NotificationProvider {
  name: string;
  type: 'email' | 'sms' | 'push';
  enabled: boolean;
  configured: boolean;
  features: {
    templates: boolean;
    scheduling: boolean;
    tracking: boolean;
    bulk: boolean;
    personalization: boolean;
    webhooks: boolean;
  };
  config: {
    apiKey?: string;
    apiSecret?: string;
    fromEmail?: string;
    fromName?: string;
    phoneNumber?: string;
    environment?: string;
  };
}

export default function NotificationsAdminPage() {
  const [providers, setProviders] = useState<NotificationProvider[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { success, error } = useToast();

  // Proveedores de notificaciones disponibles
  const availableProviders: NotificationProvider[] = [
    {
      name: 'SendGrid',
      type: 'email',
      enabled: false,
      configured: false,
      features: {
        templates: true,
        scheduling: true,
        tracking: true,
        bulk: true,
        personalization: true,
        webhooks: true
      },
      config: {
        apiKey: '',
        fromEmail: 'noreply@rent360.cl',
        fromName: 'Rent360',
        environment: 'test'
      }
    },
    {
      name: 'Twilio',
      type: 'sms',
      enabled: false,
      configured: false,
      features: {
        templates: true,
        scheduling: true,
        tracking: true,
        bulk: true,
        personalization: true,
        webhooks: true
      },
      config: {
        apiKey: '',
        apiSecret: '',
        phoneNumber: '+56912345678',
        environment: 'test'
      }
    },
    {
      name: 'Firebase',
      type: 'push',
      enabled: false,
      configured: false,
      features: {
        templates: true,
        scheduling: true,
        tracking: true,
        bulk: true,
        personalization: true,
        webhooks: true
      },
      config: {
        apiKey: '',
        apiSecret: '',
        environment: 'test'
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
            (provider.type === 'email' ? process.env[`${envPrefix}_FROM_EMAIL`] : true) &&
            (provider.type === 'sms' ? process.env[`${envPrefix}_PHONE_NUMBER`] : true)
          ),
          config: {
            ...provider.config,
            apiKey: process.env[`${envPrefix}_API_KEY`] || '',
            apiSecret: process.env[`${envPrefix}_API_SECRET`] || '',
            fromEmail: process.env[`${envPrefix}_FROM_EMAIL`] || provider.config.fromEmail || '',
            fromName: process.env[`${envPrefix}_FROM_NAME`] || provider.config.fromName || '',
            phoneNumber: process.env[`${envPrefix}_PHONE_NUMBER`] || provider.config.phoneNumber || '',
            environment: process.env[`${envPrefix}_ENVIRONMENT`] || provider.config.environment || 'test'
          }
        };
      });

      setProviders(loadedProviders);
    } catch (err) {
      error('Error al cargar configuración', 'No se pudo cargar la configuración de proveedores de notificaciones');
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
              (provider.type === 'email' ? provider.config.fromEmail : true) &&
              (provider.type === 'sms' ? provider.config.phoneNumber : true)
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
            category: 'email',
            isEncrypted: true,
            isPublic: false
          })).concat(
            providers.map(provider => ({
              key: `${provider.name.toUpperCase()}_API_SECRET`,
              value: provider.config.apiSecret || '',
              category: 'email',
              isEncrypted: true,
              isPublic: false
            }))
          ).concat(
            providers.map(provider => ({
              key: `${provider.name.toUpperCase()}_ENVIRONMENT`,
              value: provider.config.environment || 'test',
              category: 'email',
              isEncrypted: false,
              isPublic: false
            }))
          )
        })
      });

      if (!response.ok) {
        throw new Error('Error guardando configuración');
      }

      success('Configuración guardada', 'Los proveedores de notificaciones se han configurado correctamente');
    } catch (err) {
      error('Error guardando configuración', 'No se pudo guardar la configuración de proveedores de notificaciones');
    } finally {
      setSaving(false);
    }
  };

  const testProvider = async (providerName: string) => {
    try {
      const response = await fetch(`/api/admin/notifications/test/${providerName.toLowerCase()}`, {
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

  const getProviderIcon = (provider: NotificationProvider) => {
    switch (provider.type) {
      case 'email':
        return <Mail className="h-5 w-5 text-blue-600" />;
      case 'sms':
        return <Phone className="h-5 w-5 text-green-600" />;
      case 'push':
        return <Bell className="h-5 w-5 text-purple-600" />;
      default:
        return <MessageSquare className="h-5 w-5" />;
    }
  };

  const getTypeBadge = (type: string) => {
    switch (type) {
      case 'email':
        return <Badge variant="outline" className="text-blue-600">Email</Badge>;
      case 'sms':
        return <Badge variant="outline" className="text-green-600">SMS</Badge>;
      case 'push':
        return <Badge variant="outline" className="text-purple-600">Push</Badge>;
      default:
        return <Badge variant="outline">{type}</Badge>;
    }
  };

  if (loading) {
    return (
          <div className="min-h-screen bg-gray-50">
      <div className="flex">
        <div className="w-64 bg-white shadow-lg">
          <div className="p-4">
            <h2 className="text-lg font-semibold">Rent360 Admin</h2>
          </div>
        </div>
        <div className="flex-1">
          <div className="p-6">>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </div></div></div></div>
    );
  }

  return (
        <div className="min-h-screen bg-gray-50">
      <div className="flex">
        <div className="w-64 bg-white shadow-lg">
          <div className="p-4">
            <h2 className="text-lg font-semibold">Rent360 Admin</h2>
          </div>
        </div>
        <div className="flex-1">
          <div className="p-6">>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Configuración de Notificaciones</h1>
            <p className="text-gray-600">Gestiona los proveedores de notificaciones y sus configuraciones</p>
          </div>
          <Button onClick={saveConfiguration} disabled={saving} className="flex items-center gap-2">
            <Save className="h-4 w-4" />
            {saving ? 'Guardando...' : 'Guardar Configuración'}
          </Button>
        </div>

        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Las credenciales de los proveedores de notificaciones se almacenan de forma encriptada en la base de datos.
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

                  {provider.type === 'sms' && (
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
                  )}

                  {provider.type === 'email' && (
                    <>
                      <div className="space-y-2">
                        <Label htmlFor={`${provider.name}-fromEmail`}>Email de Envío</Label>
                        <Input
                          id={`${provider.name}-fromEmail`}
                          type="email"
                          value={provider.config.fromEmail || ''}
                          onChange={(e) => updateProviderConfig(provider.name, 'fromEmail', e.target.value)}
                          placeholder="noreply@rent360.cl"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor={`${provider.name}-fromName`}>Nombre de Envío</Label>
                        <Input
                          id={`${provider.name}-fromName`}
                          value={provider.config.fromName || ''}
                          onChange={(e) => updateProviderConfig(provider.name, 'fromName', e.target.value)}
                          placeholder="Rent360"
                        />
                      </div>
                    </>
                  )}

                  {provider.type === 'sms' && (
                    <div className="space-y-2">
                      <Label htmlFor={`${provider.name}-phoneNumber`}>Número de Teléfono</Label>
                      <Input
                        id={`${provider.name}-phoneNumber`}
                        value={provider.config.phoneNumber || ''}
                        onChange={(e) => updateProviderConfig(provider.name, 'phoneNumber', e.target.value)}
                        placeholder="+56912345678"
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
    </div></div></div></div>
  );
}




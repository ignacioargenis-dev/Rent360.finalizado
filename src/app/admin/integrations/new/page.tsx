'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Save, TestTube, Zap, Settings, Key, Webhook, Shield } from 'lucide-react';
import UnifiedDashboardLayout from '@/components/layout/UnifiedDashboardLayout';
import { useUserState } from '@/hooks/useUserState';
import { logger } from '@/lib/logger';

export default function NewIntegrationPage() {
  const router = useRouter();
  const { user } = useUserState();

  const [formData, setFormData] = useState({
    name: '',
    type: '',
    provider: '',
    description: '',
    apiKey: '',
    apiSecret: '',
    baseUrl: '',
    webhookUrl: '',
    clientId: '',
    clientSecret: '',
    username: '',
    password: '',
    additionalConfig: '',
    isActive: false,
    testConnection: false,
  });

  const [connectionStatus, setConnectionStatus] = useState<
    'idle' | 'testing' | 'success' | 'error'
  >('idle');
  const [testResults, setTestResults] = useState<string>('');
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));

    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};

    if (!formData.name) {
      newErrors.name = 'Debe ingresar un nombre para la integración';
    }
    if (!formData.type) {
      newErrors.type = 'Debe seleccionar un tipo de integración';
    }
    if (!formData.provider) {
      newErrors.provider = 'Debe seleccionar un proveedor';
    }

    // Validaciones específicas por tipo
    if (formData.type === 'payment' || formData.type === 'banking') {
      if (!formData.apiKey) {
        newErrors.apiKey = 'La clave API es requerida';
      }
      if (!formData.apiSecret) {
        newErrors.apiSecret = 'El secreto API es requerido';
      }
    }

    if (formData.type === 'communication') {
      if (!formData.apiKey) {
        newErrors.apiKey = 'La clave API es requerida';
      }
      if (formData.provider === 'Twilio' && !formData.webhookUrl) {
        newErrors.webhookUrl = 'La URL de webhook es requerida para Twilio';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const testConnection = async () => {
    setConnectionStatus('testing');
    setTestResults('');

    try {
      // Simular test de conexión
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Simular resultado basado en datos válidos
      const isValid = formData.apiKey && formData.type;

      if (isValid) {
        setConnectionStatus('success');
        setTestResults('✅ Conexión exitosa. Todos los servicios funcionan correctamente.');
      } else {
        setConnectionStatus('error');
        setTestResults('❌ Error de conexión. Verifique las credenciales.');
      }
    } catch (error) {
      setConnectionStatus('error');
      setTestResults('❌ Error al probar la conexión. Intente nuevamente.');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMessage('');
    setErrorMessage('');

    if (!validateForm()) {
      setErrorMessage('Por favor complete todos los campos requeridos');
      return;
    }

    setIsSubmitting(true);

    try {
      // Si se solicita test de conexión, ejecutarlo primero
      if (formData.testConnection) {
        await testConnection();
        if (connectionStatus === 'error') {
          setErrorMessage('La conexión falló. No se puede guardar la integración.');
          setIsSubmitting(false);
          return;
        }
      }

      // Simular API call para guardar
      await new Promise(resolve => setTimeout(resolve, 1500));

      logger.info('Integración creada exitosamente', {
        name: formData.name,
        type: formData.type,
        provider: formData.provider,
        isActive: formData.isActive,
      });

      setSuccessMessage('Integración creada exitosamente');

      setTimeout(() => {
        router.push('/admin/integrations');
      }, 2000);
    } catch (error) {
      logger.error('Error al crear integración', { error });
      setErrorMessage('Error al crear la integración. Por favor intente nuevamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    router.push('/admin/integrations');
  };

  const getProviderOptions = (type: string) => {
    switch (type) {
      case 'payment':
        return ['Stripe', 'Mercado Pago', 'PayPal', 'Transbank', 'WebPay'];
      case 'banking':
        return ['Banco Estado', 'Banco de Chile', 'Santander', 'BCI', 'Itau'];
      case 'communication':
        return ['Twilio', 'SendGrid', 'Mailchimp', 'Slack', 'WhatsApp Business'];
      case 'analytics':
        return ['Google Analytics', 'Mixpanel', 'Amplitude', 'Firebase', 'Hotjar'];
      default:
        return [];
    }
  };

  const getRequiredFields = (type: string, provider: string) => {
    const commonFields = ['name', 'type', 'provider', 'description'];

    switch (type) {
      case 'payment':
      case 'banking':
        return [...commonFields, 'apiKey', 'apiSecret', 'webhookUrl'];
      case 'communication':
        if (provider === 'Twilio') {
          return [...commonFields, 'apiKey', 'apiSecret', 'webhookUrl'];
        }
        return [...commonFields, 'apiKey', 'webhookUrl'];
      case 'analytics':
        return [...commonFields, 'apiKey', 'clientId', 'clientSecret'];
      default:
        return commonFields;
    }
  };

  const requiredFields = getRequiredFields(formData.type, formData.provider);

  return (
    <UnifiedDashboardLayout>
      <div className="container mx-auto px-4 py-6">
        <div className="flex items-center gap-4 mb-6">
          <Button variant="outline" size="sm" onClick={handleCancel}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Volver
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Nueva Integración</h1>
            <p className="text-gray-600">Configurar una nueva integración con servicios externos</p>
          </div>
        </div>

        {successMessage && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-green-800">{successMessage}</p>
              </div>
            </div>
          </div>
        )}

        {errorMessage && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-red-800">{errorMessage}</p>
              </div>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Información Básica */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="w-5 h-5" />
                  Información Básica
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="name">Nombre de la Integración *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={e => handleInputChange('name', e.target.value)}
                    placeholder="Ej: Stripe Payments"
                  />
                  {errors.name && <p className="text-sm text-red-600 mt-1">{errors.name}</p>}
                </div>

                <div>
                  <Label htmlFor="type">Tipo de Integración *</Label>
                  <Select
                    value={formData.type}
                    onValueChange={value => handleInputChange('type', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccione tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="payment">Pagos</SelectItem>
                      <SelectItem value="banking">Bancario</SelectItem>
                      <SelectItem value="communication">Comunicación</SelectItem>
                      <SelectItem value="analytics">Analítica</SelectItem>
                      <SelectItem value="other">Otro</SelectItem>
                    </SelectContent>
                  </Select>
                  {errors.type && <p className="text-sm text-red-600 mt-1">{errors.type}</p>}
                </div>

                <div>
                  <Label htmlFor="provider">Proveedor *</Label>
                  <Select
                    value={formData.provider}
                    onValueChange={value => handleInputChange('provider', value)}
                    disabled={!formData.type}
                  >
                    <SelectTrigger>
                      <SelectValue
                        placeholder={
                          formData.type ? 'Seleccione proveedor' : 'Primero seleccione tipo'
                        }
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {getProviderOptions(formData.type).map(provider => (
                        <SelectItem key={provider} value={provider}>
                          {provider}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.provider && (
                    <p className="text-sm text-red-600 mt-1">{errors.provider}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="description">Descripción</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={e => handleInputChange('description', e.target.value)}
                    placeholder="Describa el propósito de esta integración..."
                    rows={3}
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="isActive"
                    checked={formData.isActive}
                    onCheckedChange={checked => handleInputChange('isActive', checked)}
                  />
                  <Label htmlFor="isActive">Integración activa</Label>
                </div>
              </CardContent>
            </Card>

            {/* Configuración de API */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Key className="w-5 h-5" />
                  Configuración de API
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {(requiredFields.includes('apiKey') || formData.type) && (
                  <div>
                    <Label htmlFor="apiKey" className="flex items-center gap-2">
                      <Key className="w-4 h-4" />
                      Clave API {requiredFields.includes('apiKey') ? '*' : ''}
                    </Label>
                    <Input
                      id="apiKey"
                      type="password"
                      value={formData.apiKey}
                      onChange={e => handleInputChange('apiKey', e.target.value)}
                      placeholder="sk_live_..."
                    />
                    {errors.apiKey && <p className="text-sm text-red-600 mt-1">{errors.apiKey}</p>}
                  </div>
                )}

                {(requiredFields.includes('apiSecret') ||
                  formData.type === 'payment' ||
                  formData.type === 'banking') && (
                  <div>
                    <Label htmlFor="apiSecret" className="flex items-center gap-2">
                      <Shield className="w-4 h-4" />
                      Secreto API {requiredFields.includes('apiSecret') ? '*' : ''}
                    </Label>
                    <Input
                      id="apiSecret"
                      type="password"
                      value={formData.apiSecret}
                      onChange={e => handleInputChange('apiSecret', e.target.value)}
                      placeholder="sk_secret_..."
                    />
                    {errors.apiSecret && (
                      <p className="text-sm text-red-600 mt-1">{errors.apiSecret}</p>
                    )}
                  </div>
                )}

                <div>
                  <Label htmlFor="baseUrl">URL Base (opcional)</Label>
                  <Input
                    id="baseUrl"
                    value={formData.baseUrl}
                    onChange={e => handleInputChange('baseUrl', e.target.value)}
                    placeholder="https://api.ejemplo.com"
                  />
                </div>

                {(requiredFields.includes('webhookUrl') || formData.type === 'communication') && (
                  <div>
                    <Label htmlFor="webhookUrl" className="flex items-center gap-2">
                      <Webhook className="w-4 h-4" />
                      URL de Webhook {requiredFields.includes('webhookUrl') ? '*' : ''}
                    </Label>
                    <Input
                      id="webhookUrl"
                      value={formData.webhookUrl}
                      onChange={e => handleInputChange('webhookUrl', e.target.value)}
                      placeholder="https://tuapp.com/webhooks"
                    />
                    {errors.webhookUrl && (
                      <p className="text-sm text-red-600 mt-1">{errors.webhookUrl}</p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Autenticación Adicional */}
            {(formData.type === 'analytics' || requiredFields.includes('clientId')) && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="w-5 h-5" />
                    Autenticación OAuth
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="clientId">
                        Client ID {requiredFields.includes('clientId') ? '*' : ''}
                      </Label>
                      <Input
                        id="clientId"
                        value={formData.clientId}
                        onChange={e => handleInputChange('clientId', e.target.value)}
                        placeholder="client_id"
                      />
                    </div>
                    <div>
                      <Label htmlFor="clientSecret">
                        Client Secret {requiredFields.includes('clientSecret') ? '*' : ''}
                      </Label>
                      <Input
                        id="clientSecret"
                        type="password"
                        value={formData.clientSecret}
                        onChange={e => handleInputChange('clientSecret', e.target.value)}
                        placeholder="client_secret"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Autenticación Básica */}
            <Card>
              <CardHeader>
                <CardTitle>Autenticación Básica (opcional)</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="username">Usuario</Label>
                    <Input
                      id="username"
                      value={formData.username}
                      onChange={e => handleInputChange('username', e.target.value)}
                      placeholder="usuario"
                    />
                  </div>
                  <div>
                    <Label htmlFor="password">Contraseña</Label>
                    <Input
                      id="password"
                      type="password"
                      value={formData.password}
                      onChange={e => handleInputChange('password', e.target.value)}
                      placeholder="contraseña"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Configuración Adicional */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Configuración Adicional</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="additionalConfig">Configuración JSON (opcional)</Label>
                  <Textarea
                    id="additionalConfig"
                    value={formData.additionalConfig}
                    onChange={e => handleInputChange('additionalConfig', e.target.value)}
                    placeholder='{"timeout": 30000, "retries": 3}'
                    rows={4}
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    Configuración adicional en formato JSON para parámetros específicos del
                    proveedor.
                  </p>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="testConnection"
                    checked={formData.testConnection}
                    onCheckedChange={checked => handleInputChange('testConnection', checked)}
                  />
                  <Label htmlFor="testConnection">Probar conexión antes de guardar</Label>
                </div>

                {formData.testConnection && (
                  <div className="space-y-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={testConnection}
                      disabled={connectionStatus === 'testing'}
                    >
                      {connectionStatus === 'testing' ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600 mr-2"></div>
                          Probando...
                        </>
                      ) : (
                        <>
                          <TestTube className="w-4 h-4 mr-2" />
                          Probar Conexión
                        </>
                      )}
                    </Button>

                    {testResults && (
                      <div
                        className={`p-4 rounded-lg ${
                          connectionStatus === 'success'
                            ? 'bg-green-50 border border-green-200'
                            : connectionStatus === 'error'
                              ? 'bg-red-50 border border-red-200'
                              : 'bg-gray-50 border border-gray-200'
                        }`}
                      >
                        <pre className="text-sm whitespace-pre-wrap">{testResults}</pre>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Resumen de Configuración */}
          <Card>
            <CardHeader>
              <CardTitle>Resumen de Configuración</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <Label className="text-sm font-medium text-gray-700">Nombre</Label>
                  <p className="text-sm text-gray-600">{formData.name || 'No especificado'}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-700">Tipo</Label>
                  <p className="text-sm text-gray-600">{formData.type || 'No especificado'}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-700">Proveedor</Label>
                  <p className="text-sm text-gray-600">{formData.provider || 'No especificado'}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-700">Estado</Label>
                  <div className="mt-1">
                    <Badge variant={formData.isActive ? 'default' : 'secondary'}>
                      {formData.isActive ? 'Activo' : 'Inactivo'}
                    </Badge>
                  </div>
                </div>
              </div>

              <div className="mt-4">
                <Label className="text-sm font-medium text-gray-700">Campos Configurados</Label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {formData.apiKey && <Badge variant="outline">API Key</Badge>}
                  {formData.apiSecret && <Badge variant="outline">API Secret</Badge>}
                  {formData.webhookUrl && <Badge variant="outline">Webhook</Badge>}
                  {formData.clientId && <Badge variant="outline">Client ID</Badge>}
                  {formData.clientSecret && <Badge variant="outline">Client Secret</Badge>}
                  {formData.username && <Badge variant="outline">Usuario</Badge>}
                  {formData.password && <Badge variant="outline">Contraseña</Badge>}
                  {formData.baseUrl && <Badge variant="outline">URL Base</Badge>}
                  {formData.additionalConfig && <Badge variant="outline">Config Extra</Badge>}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Botones de Acción */}
          <div className="flex justify-end gap-4">
            <Button type="button" variant="outline" onClick={handleCancel} disabled={isSubmitting}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Creando Integración...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Crear Integración
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </UnifiedDashboardLayout>
  );
}

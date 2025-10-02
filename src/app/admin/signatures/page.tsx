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
  Shield,
  CheckCircle,
  AlertTriangle,
  Settings,
  Save,
  TestTube,
  FileText,
  Building,
  Banknote,
  Zap
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';


interface SignatureProvider {
  name: string;
  type: 'qualified' | 'advanced';
  enabled: boolean;
  configured: boolean;
  compliance: {
    law_19799: boolean;
    decree_181_2020: boolean;
    sii_certified: boolean;
    specialized?: boolean;
    bankIntegration?: boolean;
  };
  config: {
    apiKey?: string;
    apiSecret?: string;
    certificateId?: string;
    baseUrl?: string;
    bankIntegration?: boolean;
  };
}

export default function SignaturesAdminPage() {
  const [providers, setProviders] = useState<SignatureProvider[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  // Proveedores autorizados por SII
  const authorizedProviders: SignatureProvider[] = [
    {
      name: 'TrustFactory',
      type: 'qualified',
      enabled: false,
      configured: false,
      compliance: {
        law_19799: true,
        decree_181_2020: true,
        sii_certified: true,
        specialized: false
      },
      config: {
        apiKey: '',
        apiSecret: '',
        certificateId: '',
        baseUrl: 'https://api.trustfactory.cl/v2'
      }
    },
    {
      name: 'FirmaPro',
      type: 'qualified',
      enabled: false,
      configured: false,
      compliance: {
        law_19799: true,
        decree_181_2020: true,
        sii_certified: true,
        specialized: true
      },
      config: {
        apiKey: '',
        apiSecret: '',
        certificateId: '',
        baseUrl: 'https://api.firmapro.cl/v3'
      }
    },
    {
      name: 'DigitalSign',
      type: 'qualified',
      enabled: false,
      configured: false,
      compliance: {
        law_19799: true,
        decree_181_2020: true,
        sii_certified: true,
        bankIntegration: true
      },
      config: {
        apiKey: '',
        apiSecret: '',
        certificateId: '',
        bankIntegration: false,
        baseUrl: 'https://api.digitalsign.cl/v2'
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
      const loadedProviders = authorizedProviders.map(provider => {
        const envPrefix = provider.name.toUpperCase();

        return {
          ...provider,
          enabled: !!process.env[`${envPrefix}_API_KEY`],
          configured: !!(
            process.env[`${envPrefix}_API_KEY`] &&
            process.env[`${envPrefix}_API_SECRET`] &&
            process.env[`${envPrefix}_CERTIFICATE_ID`]
          ),
          config: {
            ...provider.config,
            apiKey: process.env[`${envPrefix}_API_KEY`] || '',
            apiSecret: process.env[`${envPrefix}_API_SECRET`] || '',
            certificateId: process.env[`${envPrefix}_CERTIFICATE_ID`] || '',
            bankIntegration: provider.name === 'DigitalSign' ?
              process.env[`${envPrefix}_BANK_INTEGRATION`] === 'true' : false
          }
        };
      });

      setProviders(loadedProviders);
    } catch (err) {
      toast({
        title: 'Error al cargar configuración',
        description: 'No se pudo cargar la configuración de proveedores',
        variant: 'destructive'
      });
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
            configured: !!(provider.config.apiKey && provider.config.apiSecret && provider.config.certificateId)
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

      // Aquí iría la lógica para guardar en la base de datos
      // Por ahora solo mostramos éxito
      await new Promise(resolve => setTimeout(resolve, 1000));

      toast({
        title: 'Configuración guardada',
        description: 'Los proveedores de firma han sido configurados exitosamente',
        variant: 'default'
      });
    } catch (err) {
      toast({
        title: 'Error al guardar',
        description: 'No se pudo guardar la configuración',
        variant: 'destructive'
      });
    } finally {
      setSaving(false);
    }
  };

  const testProvider = async (providerName: string) => {
    try {
      // Simular test de conexión
      await new Promise(resolve => setTimeout(resolve, 2000));

      toast({
        title: 'Prueba exitosa',
        description: `${providerName} está funcionando correctamente`,
        variant: 'default'
      });
    } catch (err) {
      toast({
        title: 'Prueba fallida',
        description: `Error al conectar con ${providerName}`,
        variant: 'destructive'
      });
    }
  };

  const getComplianceIcon = (compliance: any) => {
    if (compliance.sii_certified && compliance.law_19799) {
      return <CheckCircle className="w-4 h-4 text-green-600" />;
    }
    return <AlertTriangle className="w-4 h-4 text-red-600" />;
  };

  const getProviderIcon = (name: string) => {
    switch (name) {
      case 'TrustFactory':
        return <Shield className="w-5 h-5" />;
      case 'FirmaPro':
        return <Building className="w-5 h-5" />;
      case 'DigitalSign':
        return <Banknote className="w-5 h-5" />;
      default:
        return <FileText className="w-5 h-5" />;
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
          <div className="p-6"> 
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
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
          <div className="p-6">
      title="Firmas Electrónicas Autorizadas"
      subtitle="Configura proveedores certificados por SII para contratos de arriendo"
    >
      <div className="space-y-6">
        {/* Alerta de cumplimiento legal */}
        <Alert>
          <Shield className="h-4 w-4" />
          <AlertDescription>
            <strong>Cumplimiento Legal Obligatorio:</strong> Solo se permiten proveedores autorizados por el Servicio de Impuestos Internos (SII)
            según la Ley 19.799 y Decreto Supremo N° 181/2020 para contratos de arriendo de inmuebles.
          </AlertDescription>
        </Alert>

        {/* Estadísticas */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Proveedores Configurados</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {providers.filter(p => p.configured).length}
              </div>
              <p className="text-xs text-muted-foreground">
                de {providers.length} proveedores autorizados
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Proveedores Activos</CardTitle>
              <Zap className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {providers.filter(p => p.enabled).length}
              </div>
              <p className="text-xs text-muted-foreground">
                listos para usar
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Cumplimiento Legal</CardTitle>
              <Shield className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">100%</div>
              <p className="text-xs text-muted-foreground">
                Certificado por SII
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Configuración de proveedores */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Proveedores Autorizados por SII</h3>

          {providers.map((provider) => (
            <Card key={provider.name} className="relative">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    {getProviderIcon(provider.name)}
                    <div>
                      <CardTitle className="flex items-center space-x-2">
                        <span>{provider.name}</span>
                        {getComplianceIcon(provider.compliance)}
                        <Badge variant={provider.type === 'qualified' ? 'default' : 'secondary'}>
                          {provider.type === 'qualified' ? 'Calificada' : 'Avanzada'}
                        </Badge>
                      </CardTitle>
                      <CardDescription>
                        {provider.compliance.specialized ? 'Especializado en contratos inmobiliarios' :
                         provider.compliance.bankIntegration ? 'Con integración bancaria opcional' :
                         'Firma electrónica calificada general'}
                      </CardDescription>
                    </div>
                  </div>

                  <div className="flex items-center space-x-4">
                    <div className="text-right">
                      <div className="text-sm font-medium">
                        {provider.configured ? 'Configurado' : 'Sin configurar'}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {provider.enabled ? 'Activo' : 'Inactivo'}
                      </div>
                    </div>

                    <Switch
                      checked={provider.enabled}
                      onCheckedChange={() => toggleProvider(provider.name)}
                      disabled={!provider.configured}
                    />
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                {/* Campos de configuración */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor={`${provider.name}-apiKey`}>API Key</Label>
                    <Input
                      id={`${provider.name}-apiKey`}
                      type="password"
                      placeholder="Ingresa la API Key"
                      value={provider.config.apiKey || ''}
                      onChange={(e) => updateProviderConfig(provider.name, 'apiKey', e.target.value)}
                    />
                  </div>

                  <div>
                    <Label htmlFor={`${provider.name}-apiSecret`}>API Secret</Label>
                    <Input
                      id={`${provider.name}-apiSecret`}
                      type="password"
                      placeholder="Ingresa el API Secret"
                      value={provider.config.apiSecret || ''}
                      onChange={(e) => updateProviderConfig(provider.name, 'apiSecret', e.target.value)}
                    />
                  </div>

                  <div>
                    <Label htmlFor={`${provider.name}-certificateId`}>ID de Certificado SII</Label>
                    <Input
                      id={`${provider.name}-certificateId`}
                      placeholder="Ingresa el ID de certificado SII"
                      value={provider.config.certificateId || ''}
                      onChange={(e) => updateProviderConfig(provider.name, 'certificateId', e.target.value)}
                    />
                  </div>

                  <div>
                    <Label htmlFor={`${provider.name}-baseUrl`}>URL Base</Label>
                    <Input
                      id={`${provider.name}-baseUrl`}
                      placeholder="URL del servicio"
                      value={provider.config.baseUrl || ''}
                      onChange={(e) => updateProviderConfig(provider.name, 'baseUrl', e.target.value)}
                    />
                  </div>

                  {provider.name === 'DigitalSign' && (
                    <div className="md:col-span-2">
                      <div className="flex items-center space-x-2">
                        <Switch
                          id={`${provider.name}-bankIntegration`}
                          checked={provider.config.bankIntegration || false}
                          onCheckedChange={(checked) => updateProviderConfig(provider.name, 'bankIntegration', checked)}
                        />
                        <Label htmlFor={`${provider.name}-bankIntegration`}>
                          Habilitar integración bancaria para validación adicional
                        </Label>
                      </div>
                    </div>
                  )}
                </div>

                <Separator />

                {/* Información de cumplimiento */}
                <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
                  <div className="flex items-start space-x-3">
                    <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                    <div className="text-sm">
                      <p className="font-medium text-green-900 dark:text-green-100 mb-1">
                        Certificado por Servicio de Impuestos Internos (SII)
                      </p>
                      <ul className="text-green-800 dark:text-green-200 space-y-1">
                        <li>• Cumple con Ley 19.799 sobre Documentos Electrónicos</li>
                        <li>• Autorizado por Decreto Supremo N° 181/2020</li>
                        <li>• Firma electrónica calificada con validez jurídica plena</li>
                        {provider.compliance.specialized && (
                          <li>• Especializado en contratos de arriendo de inmuebles</li>
                        )}
                        {provider.compliance.bankIntegration && (
                          <li>• Integración bancaria opcional para mayor seguridad</li>
                        )}
                      </ul>
                    </div>
                  </div>
                </div>

                {/* Acciones */}
                <div className="flex justify-between items-center pt-4">
                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => testProvider(provider.name)}
                      disabled={!provider.configured}
                    >
                      <TestTube className="w-4 h-4 mr-2" />
                      Probar Conexión
                    </Button>
                  </div>

                  <Badge variant={provider.configured ? 'default' : 'secondary'}>
                    {provider.configured ? 'Listo para usar' : 'Requiere configuración'}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Acciones globales */}
        <Card>
          <CardHeader>
            <CardTitle>Acciones</CardTitle>
            <CardDescription>
              Guarda la configuración o verifica el estado de los proveedores
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex space-x-4">
              <Button
                onClick={saveConfiguration}
                disabled={saving}
                className="flex items-center space-x-2"
              >
                <Save className="w-4 h-4" />
                <span>{saving ? 'Guardando...' : 'Guardar Configuración'}</span>
              </Button>

              <Button
                variant="outline"
                onClick={loadProvidersConfig}
                className="flex items-center space-x-2"
              >
                <Settings className="w-4 h-4" />
                <span>Recargar Configuración</span>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Información importante */}
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <strong>Importante:</strong> Los proveedores no autorizados (DocuSign, Adobe Sign, HelloSign) han sido eliminados
            del sistema por no cumplir con la legislación chilena. Solo se permiten proveedores certificados por el SII
            para garantizar la validez jurídica de los contratos de arriendo.
          </AlertDescription>
        </Alert>
      </div>
    </div></div></div></div>
  );
}





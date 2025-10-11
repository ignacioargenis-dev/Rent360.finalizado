'use client';

import React, { useState, useEffect } from 'react';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  Shield,
  Lock,
  Eye,
  EyeOff,
  Key,
  AlertTriangle,
  CheckCircle,
  XCircle,
  RefreshCw,
  Save,
  Settings,
  Activity,
  Users,
  Database,
  Server,
} from 'lucide-react';
import UnifiedDashboardLayout from '@/components/layout/UnifiedDashboardLayout';
import { useAuth } from '@/components/auth/AuthProvider';
import { logger } from '@/lib/logger';

interface SecuritySettings {
  twoFactorEnabled: boolean;
  sessionTimeout: number;
  passwordPolicy: {
    minLength: number;
    requireUppercase: boolean;
    requireLowercase: boolean;
    requireNumbers: boolean;
    requireSpecialChars: boolean;
    preventReuse: number;
  };
  loginAttempts: {
    maxAttempts: number;
    lockoutDuration: number;
    progressiveDelay: boolean;
  };
  ipWhitelist: string[];
  encryptionLevel: 'basic' | 'standard' | 'high';
  auditLogging: boolean;
  dataRetention: number;
}

interface SecurityEvent {
  id: string;
  type:
    | 'login'
    | 'failed_login'
    | 'password_change'
    | 'permission_change'
    | 'suspicious_activity'
    | 'system_access';
  user: string;
  ip: string;
  timestamp: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  resolved: boolean;
}

interface SecurityMetrics {
  totalUsers: number;
  activeUsers: number;
  failedLoginAttempts: number;
  suspiciousActivities: number;
  activeSessions: number;
  encryptionStatus: 'secure' | 'warning' | 'critical';
}

export default function SecurityPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('settings');
  const [settings, setSettings] = useState<SecuritySettings>({
    twoFactorEnabled: true,
    sessionTimeout: 30,
    passwordPolicy: {
      minLength: 8,
      requireUppercase: true,
      requireLowercase: true,
      requireNumbers: true,
      requireSpecialChars: false,
      preventReuse: 5,
    },
    loginAttempts: {
      maxAttempts: 5,
      lockoutDuration: 30,
      progressiveDelay: true,
    },
    ipWhitelist: ['192.168.1.0/24', '10.0.0.0/8'],
    encryptionLevel: 'high',
    auditLogging: true,
    dataRetention: 365,
  });

  const [events, setEvents] = useState<SecurityEvent[]>([]);
  const [metrics, setMetrics] = useState<SecurityMetrics>({
    totalUsers: 0,
    activeUsers: 0,
    failedLoginAttempts: 0,
    suspiciousActivities: 0,
    activeSessions: 0,
    encryptionStatus: 'secure',
  });

  const [newIp, setNewIp] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  // Mock data for security events
  const mockEvents: SecurityEvent[] = [
    {
      id: '1',
      type: 'login',
      user: 'admin@rent360.cl',
      ip: '192.168.1.100',
      timestamp: '2024-12-05T10:30:00Z',
      description: 'Inicio de sesión exitoso',
      severity: 'low',
      resolved: true,
    },
    {
      id: '2',
      type: 'failed_login',
      user: 'unknown',
      ip: '203.0.113.195',
      timestamp: '2024-12-05T09:15:00Z',
      description: 'Intento de login fallido - usuario no existe',
      severity: 'medium',
      resolved: false,
    },
    {
      id: '3',
      type: 'password_change',
      user: 'juan@broker.cl',
      ip: '192.168.1.150',
      timestamp: '2024-12-05T08:45:00Z',
      description: 'Cambio de contraseña exitoso',
      severity: 'low',
      resolved: true,
    },
    {
      id: '4',
      type: 'suspicious_activity',
      user: 'maria@owner.cl',
      ip: '198.51.100.23',
      timestamp: '2024-12-04T22:30:00Z',
      description: 'Acceso desde ubicación inusual',
      severity: 'high',
      resolved: false,
    },
    {
      id: '5',
      type: 'permission_change',
      user: 'admin@rent360.cl',
      ip: '192.168.1.100',
      timestamp: '2024-12-04T14:20:00Z',
      description: 'Cambio de permisos para usuario soporte',
      severity: 'medium',
      resolved: true,
    },
  ];

  useEffect(() => {
    loadSecurityData();
  }, []);

  const loadSecurityData = async () => {
    setIsLoading(true);
    try {
      // Simular API calls
      await new Promise(resolve => setTimeout(resolve, 1000));

      setEvents(mockEvents);
      setMetrics({
        totalUsers: 245,
        activeUsers: 189,
        failedLoginAttempts: 23,
        suspiciousActivities: 7,
        activeSessions: 45,
        encryptionStatus: 'secure',
      });
    } catch (error) {
      logger.error('Error al cargar datos de seguridad', { error });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSettingChange = (field: string, value: any) => {
    if (field.includes('.')) {
      const [parent, child] = field.split('.');
      setSettings(prev => ({
        ...prev,
        [parent as keyof typeof prev]: {
          ...(prev[parent as keyof typeof prev] as any),
          [child as any]: value,
        },
      }));
    } else {
      setSettings(prev => ({ ...prev, [field]: value }));
    }
  };

  const addIpToWhitelist = () => {
    if (newIp.trim() && !settings.ipWhitelist.includes(newIp.trim())) {
      setSettings(prev => ({
        ...prev,
        ipWhitelist: [...prev.ipWhitelist, newIp.trim()],
      }));
      setNewIp('');
    }
  };

  const removeIpFromWhitelist = (ip: string) => {
    setSettings(prev => ({
      ...prev,
      ipWhitelist: prev.ipWhitelist.filter(item => item !== ip),
    }));
  };

  const saveSettings = async () => {
    setIsLoading(true);
    setSuccessMessage('');
    setErrorMessage('');

    try {
      // Simular API call
      await new Promise(resolve => setTimeout(resolve, 1500));

      logger.info('Configuración de seguridad actualizada', { settings });
      setSuccessMessage('Configuración de seguridad guardada exitosamente');
    } catch (error) {
      logger.error('Error al guardar configuración de seguridad', { error });
      setErrorMessage('Error al guardar la configuración. Por favor intente nuevamente.');
    } finally {
      setIsLoading(false);
    }
  };

  const resolveSecurityEvent = async (eventId: string) => {
    try {
      setEvents(prev =>
        prev.map(event => (event.id === eventId ? { ...event, resolved: true } : event))
      );

      logger.info('Evento de seguridad resuelto', { eventId });
    } catch (error) {
      logger.error('Error al resolver evento de seguridad', { error, eventId });
    }
  };

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case 'low':
        return (
          <Badge variant="outline" className="text-blue-600 border-blue-600">
            Baja
          </Badge>
        );
      case 'medium':
        return (
          <Badge variant="outline" className="text-yellow-600 border-yellow-600">
            Media
          </Badge>
        );
      case 'high':
        return (
          <Badge variant="outline" className="text-orange-600 border-orange-600">
            Alta
          </Badge>
        );
      case 'critical':
        return <Badge variant="destructive">Crítica</Badge>;
      default:
        return <Badge variant="secondary">{severity}</Badge>;
    }
  };

  const getEventTypeLabel = (type: string) => {
    switch (type) {
      case 'login':
        return 'Inicio de Sesión';
      case 'failed_login':
        return 'Login Fallido';
      case 'password_change':
        return 'Cambio de Contraseña';
      case 'permission_change':
        return 'Cambio de Permisos';
      case 'suspicious_activity':
        return 'Actividad Sospechosa';
      case 'system_access':
        return 'Acceso al Sistema';
      default:
        return type;
    }
  };

  const getEncryptionStatusBadge = (status: string) => {
    switch (status) {
      case 'secure':
        return <Badge className="bg-green-500">Seguro</Badge>;
      case 'warning':
        return (
          <Badge variant="outline" className="text-yellow-600 border-yellow-600">
            Advertencia
          </Badge>
        );
      case 'critical':
        return <Badge variant="destructive">Crítico</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  return (
    <UnifiedDashboardLayout>
      <div className="container mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Seguridad del Sistema</h1>
            <p className="text-gray-600">Gestión de seguridad, autenticación y monitoreo</p>
          </div>
          <Button onClick={loadSecurityData} disabled={isLoading}>
            <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Actualizar
          </Button>
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

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="settings">Configuración</TabsTrigger>
            <TabsTrigger value="monitoring">Monitoreo</TabsTrigger>
            <TabsTrigger value="events">Eventos</TabsTrigger>
            <TabsTrigger value="encryption">Encriptación</TabsTrigger>
          </TabsList>

          <TabsContent value="settings" className="space-y-6">
            {/* Autenticación */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="w-5 h-5" />
                  Autenticación y Sesiones
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label htmlFor="twoFactor">Autenticación de Dos Factores</Label>
                        <p className="text-sm text-gray-500">Requiere verificación adicional</p>
                      </div>
                      <Switch
                        id="twoFactor"
                        checked={settings.twoFactorEnabled}
                        onCheckedChange={checked =>
                          handleSettingChange('twoFactorEnabled', checked)
                        }
                      />
                    </div>

                    <div>
                      <Label htmlFor="sessionTimeout">Tiempo de Sesión (minutos)</Label>
                      <Input
                        id="sessionTimeout"
                        type="number"
                        value={settings.sessionTimeout}
                        onChange={e =>
                          handleSettingChange('sessionTimeout', parseInt(e.target.value))
                        }
                        min="5"
                        max="480"
                      />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <Label>Lista Blanca de IPs</Label>
                      <div className="flex gap-2 mb-2">
                        <Input
                          value={newIp}
                          onChange={e => setNewIp(e.target.value)}
                          placeholder="Ej: 192.168.1.0/24"
                          onKeyPress={e =>
                            e.key === 'Enter' && (e.preventDefault(), addIpToWhitelist())
                          }
                        />
                        <Button type="button" onClick={addIpToWhitelist} size="sm">
                          Agregar
                        </Button>
                      </div>
                      {settings.ipWhitelist.length > 0 && (
                        <div className="space-y-1">
                          {settings.ipWhitelist.map(ip => (
                            <div
                              key={ip}
                              className="flex items-center justify-between p-2 bg-gray-50 rounded"
                            >
                              <span className="text-sm font-mono">{ip}</span>
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => removeIpFromWhitelist(ip)}
                              >
                                <XCircle className="w-4 h-4" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Política de Contraseñas */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Key className="w-5 h-5" />
                  Política de Contraseñas
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="minLength">Longitud Mínima</Label>
                      <Input
                        id="minLength"
                        type="number"
                        value={settings.passwordPolicy.minLength}
                        onChange={e =>
                          handleSettingChange('passwordPolicy.minLength', parseInt(e.target.value))
                        }
                        min="6"
                        max="32"
                      />
                    </div>

                    <div>
                      <Label htmlFor="preventReuse">Prevenir Reutilización (últimas)</Label>
                      <Input
                        id="preventReuse"
                        type="number"
                        value={settings.passwordPolicy.preventReuse}
                        onChange={e =>
                          handleSettingChange(
                            'passwordPolicy.preventReuse',
                            parseInt(e.target.value)
                          )
                        }
                        min="0"
                        max="10"
                      />
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="requireUppercase"
                        checked={settings.passwordPolicy.requireUppercase}
                        onCheckedChange={checked =>
                          handleSettingChange('passwordPolicy.requireUppercase', checked)
                        }
                      />
                      <Label htmlFor="requireUppercase">Requiere mayúsculas</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="requireLowercase"
                        checked={settings.passwordPolicy.requireLowercase}
                        onCheckedChange={checked =>
                          handleSettingChange('passwordPolicy.requireLowercase', checked)
                        }
                      />
                      <Label htmlFor="requireLowercase">Requiere minúsculas</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="requireNumbers"
                        checked={settings.passwordPolicy.requireNumbers}
                        onCheckedChange={checked =>
                          handleSettingChange('passwordPolicy.requireNumbers', checked)
                        }
                      />
                      <Label htmlFor="requireNumbers">Requiere números</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="requireSpecialChars"
                        checked={settings.passwordPolicy.requireSpecialChars}
                        onCheckedChange={checked =>
                          handleSettingChange('passwordPolicy.requireSpecialChars', checked)
                        }
                      />
                      <Label htmlFor="requireSpecialChars">Requiere caracteres especiales</Label>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Intentos de Login */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lock className="w-5 h-5" />
                  Protección contra Ataques
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <Label htmlFor="maxAttempts">Máximo Intentos de Login</Label>
                    <Input
                      id="maxAttempts"
                      type="number"
                      value={settings.loginAttempts.maxAttempts}
                      onChange={e =>
                        handleSettingChange('loginAttempts.maxAttempts', parseInt(e.target.value))
                      }
                      min="3"
                      max="10"
                    />
                  </div>

                  <div>
                    <Label htmlFor="lockoutDuration">Tiempo de Bloqueo (minutos)</Label>
                    <Input
                      id="lockoutDuration"
                      type="number"
                      value={settings.loginAttempts.lockoutDuration}
                      onChange={e =>
                        handleSettingChange(
                          'loginAttempts.lockoutDuration',
                          parseInt(e.target.value)
                        )
                      }
                      min="5"
                      max="1440"
                    />
                  </div>

                  <div className="flex items-center space-x-2">
                    <Switch
                      id="progressiveDelay"
                      checked={settings.loginAttempts.progressiveDelay}
                      onCheckedChange={checked =>
                        handleSettingChange('loginAttempts.progressiveDelay', checked)
                      }
                    />
                    <Label htmlFor="progressiveDelay">Retraso Progresivo</Label>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Configuración General */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="w-5 h-5" />
                  Configuración General
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <Label htmlFor="encryptionLevel">Nivel de Encriptación</Label>
                    <Select
                      value={settings.encryptionLevel}
                      onValueChange={value => handleSettingChange('encryptionLevel', value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="basic">Básico</SelectItem>
                        <SelectItem value="standard">Estándar</SelectItem>
                        <SelectItem value="high">Alto</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="dataRetention">Retención de Datos (días)</Label>
                    <Input
                      id="dataRetention"
                      type="number"
                      value={settings.dataRetention}
                      onChange={e => handleSettingChange('dataRetention', parseInt(e.target.value))}
                      min="30"
                      max="2555"
                    />
                  </div>

                  <div className="flex items-center space-x-2">
                    <Switch
                      id="auditLogging"
                      checked={settings.auditLogging}
                      onCheckedChange={checked => handleSettingChange('auditLogging', checked)}
                    />
                    <Label htmlFor="auditLogging">Registro de Auditoría</Label>
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button onClick={saveSettings} disabled={isLoading}>
                    {isLoading ? (
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
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="monitoring" className="space-y-6">
            {/* Métricas de Seguridad */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card>
                <CardContent className="pt-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Usuarios Totales</p>
                      <p className="text-2xl font-bold text-gray-900">{metrics.totalUsers}</p>
                    </div>
                    <Users className="w-12 h-12 text-blue-600" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Usuarios Activos</p>
                      <p className="text-2xl font-bold text-green-600">{metrics.activeUsers}</p>
                    </div>
                    <CheckCircle className="w-12 h-12 text-green-600" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Sesiones Activas</p>
                      <p className="text-2xl font-bold text-purple-600">{metrics.activeSessions}</p>
                    </div>
                    <Activity className="w-12 h-12 text-purple-600" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Estado Encriptación</p>
                      <div className="mt-1">
                        {getEncryptionStatusBadge(metrics.encryptionStatus)}
                      </div>
                    </div>
                    <Shield className="w-12 h-12 text-green-600" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Alertas de Seguridad */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardContent className="pt-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">
                        Intentos Fallidos de Login
                      </p>
                      <p className="text-2xl font-bold text-red-600">
                        {metrics.failedLoginAttempts}
                      </p>
                      <p className="text-xs text-gray-500">Últimas 24 horas</p>
                    </div>
                    <AlertTriangle className="w-8 h-8 text-red-600" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Actividades Sospechosas</p>
                      <p className="text-2xl font-bold text-orange-600">
                        {metrics.suspiciousActivities}
                      </p>
                      <p className="text-xs text-gray-500">Requieren atención</p>
                    </div>
                    <AlertTriangle className="w-8 h-8 text-orange-600" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Estado del Sistema */}
            <Card>
              <CardHeader>
                <CardTitle>Estado del Sistema de Seguridad</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Autenticación de Dos Factores</span>
                    <Badge className={settings.twoFactorEnabled ? 'bg-green-500' : 'bg-red-500'}>
                      {settings.twoFactorEnabled ? 'Habilitado' : 'Deshabilitado'}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Registro de Auditoría</span>
                    <Badge className={settings.auditLogging ? 'bg-green-500' : 'bg-red-500'}>
                      {settings.auditLogging ? 'Activo' : 'Inactivo'}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Lista Blanca de IPs</span>
                    <Badge variant="outline">{settings.ipWhitelist.length} IPs configuradas</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Nivel de Encriptación</span>
                    <Badge variant="outline" className="capitalize">
                      {settings.encryptionLevel}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="events" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Registro de Eventos de Seguridad</CardTitle>
              </CardHeader>
              <CardContent>
                {events.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    No hay eventos de seguridad registrados
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Tipo</TableHead>
                          <TableHead>Usuario</TableHead>
                          <TableHead>IP</TableHead>
                          <TableHead>Severidad</TableHead>
                          <TableHead>Fecha/Hora</TableHead>
                          <TableHead>Estado</TableHead>
                          <TableHead>Acciones</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {events.map(event => (
                          <TableRow key={event.id}>
                            <TableCell>
                              <Badge variant="outline">{getEventTypeLabel(event.type)}</Badge>
                            </TableCell>
                            <TableCell className="font-medium">{event.user}</TableCell>
                            <TableCell className="font-mono text-sm">{event.ip}</TableCell>
                            <TableCell>{getSeverityBadge(event.severity)}</TableCell>
                            <TableCell>
                              <div className="text-sm">
                                {new Date(event.timestamp).toLocaleString('es-CL')}
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant={event.resolved ? 'default' : 'secondary'}>
                                {event.resolved ? 'Resuelto' : 'Pendiente'}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              {!event.resolved && (
                                <AlertDialog>
                                  <AlertDialogTrigger asChild>
                                    <Button variant="outline" size="sm">
                                      Resolver
                                    </Button>
                                  </AlertDialogTrigger>
                                  <AlertDialogContent>
                                    <AlertDialogHeader>
                                      <AlertDialogTitle>Resolver Evento</AlertDialogTitle>
                                      <AlertDialogDescription>
                                        ¿Está seguro de que desea marcar este evento como resuelto?
                                      </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                      <AlertDialogAction
                                        onClick={() => resolveSecurityEvent(event.id)}
                                      >
                                        Resolver
                                      </AlertDialogAction>
                                    </AlertDialogFooter>
                                  </AlertDialogContent>
                                </AlertDialog>
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="encryption" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Estado de Encriptación */}
              <Card>
                <CardHeader>
                  <CardTitle>Estado de Encriptación</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Datos en Reposo</span>
                      <Badge className="bg-green-500">Encriptado AES-256</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Datos en Tránsito</span>
                      <Badge className="bg-green-500">TLS 1.3</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Base de Datos</span>
                      <Badge className="bg-green-500">Encriptada</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Backups</span>
                      <Badge className="bg-green-500">Encriptados</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Claves API</span>
                      <Badge className="bg-green-500">Encriptadas</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Certificados SSL */}
              <Card>
                <CardHeader>
                  <CardTitle>Certificados SSL/TLS</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Estado del Certificado</span>
                      <Badge className="bg-green-500">Válido</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Emisor</span>
                      <span className="text-sm font-medium">Let&apos;s Encrypt</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Válido Hasta</span>
                      <span className="text-sm font-medium">2025-03-15</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Días Restantes</span>
                      <span className="text-sm font-medium text-green-600">98 días</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Configuración de Encriptación */}
            <Card>
              <CardHeader>
                <CardTitle>Configuración de Encriptación</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <Label htmlFor="encryptionLevel">Nivel de Encriptación</Label>
                    <Select
                      value={settings.encryptionLevel}
                      onValueChange={value => handleSettingChange('encryptionLevel', value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="basic">Básico (AES-128)</SelectItem>
                        <SelectItem value="standard">Estándar (AES-192)</SelectItem>
                        <SelectItem value="high">Alto (AES-256)</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-sm text-gray-500 mt-1">
                      Recomendado: Alto para máxima seguridad
                    </p>
                  </div>

                  <div>
                    <Label>Rotación de Claves</Label>
                    <div className="space-y-2">
                      <Button variant="outline" size="sm">
                        Rotar Claves de API
                      </Button>
                      <Button variant="outline" size="sm">
                        Rotar Claves de Base de Datos
                      </Button>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button onClick={saveSettings} disabled={isLoading}>
                    <Save className="w-4 h-4 mr-2" />
                    Aplicar Cambios
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </UnifiedDashboardLayout>
  );
}

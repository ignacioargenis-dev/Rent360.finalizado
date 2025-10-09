'use client';

import { useState, useEffect } from 'react';
import { logger } from '@/lib/logger';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  RefreshCw,
  AlertTriangle,
  Settings,
  Shield,
  Bell,
  Zap,
  Info,
  Save,
  Mail,
  Database,
  Lock,
  Clock,
  Target,
  Users,
  MessageSquare,
  Bot,
  FileText,
  Eye,
  EyeOff,
  Plus,
  Trash2,
  Edit,
  Check,
  X,
  Download,
  Upload,
  Globe,
} from 'lucide-react';
import UnifiedDashboardLayout from '@/components/layout/UnifiedDashboardLayout';

interface SLAConfig {
  urgent: { response: number; resolution: number };
  high: { response: number; resolution: number };
  medium: { response: number; resolution: number };
  low: { response: number; resolution: number };
}

interface AutoResponseTemplate {
  id: string;
  name: string;
  trigger: string;
  subject: string;
  message: string;
  enabled: boolean;
}

interface SupportConfig {
  general: {
    workingHours: { start: string; end: string; timezone: string };
    autoAssignEnabled: boolean;
    maxTicketsPerAgent: number;
    language: string;
  };
  notifications: {
    emailEnabled: boolean;
    smsEnabled: boolean;
    pushEnabled: boolean;
    slackEnabled: boolean;
    escalationAlerts: boolean;
    slaAlerts: boolean;
  };
  automation: {
    autoCloseResolved: boolean;
    autoCloseDays: number;
    escalationEnabled: boolean;
    escalationHours: number;
    reassignStaleTickets: boolean;
    staleTicketHours: number;
  };
  sla: SLAConfig;
  templates: AutoResponseTemplate[];
}

export default function SupportSettingsPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [config, setConfig] = useState<SupportConfig | null>(null);
  const [editingTemplate, setEditingTemplate] = useState<AutoResponseTemplate | null>(null);
  const [showAddTemplate, setShowAddTemplate] = useState(false);

  useEffect(() => {
    loadPageData();
  }, []);

  const loadPageData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Generar datos de configuración simulados
      const mockConfig: SupportConfig = {
        general: {
          workingHours: { start: '09:00', end: '18:00', timezone: 'America/Santiago' },
          autoAssignEnabled: true,
          maxTicketsPerAgent: 25,
          language: 'es',
        },
        notifications: {
          emailEnabled: true,
          smsEnabled: false,
          pushEnabled: true,
          slackEnabled: false,
          escalationAlerts: true,
          slaAlerts: true,
        },
        automation: {
          autoCloseResolved: false,
          autoCloseDays: 7,
          escalationEnabled: true,
          escalationHours: 24,
          reassignStaleTickets: true,
          staleTicketHours: 48,
        },
        sla: {
          urgent: { response: 60, resolution: 240 }, // 1h respuesta, 4h resolución
          high: { response: 120, resolution: 480 }, // 2h respuesta, 8h resolución
          medium: { response: 240, resolution: 1440 }, // 4h respuesta, 24h resolución
          low: { response: 480, resolution: 2880 }, // 8h respuesta, 48h resolución
        },
        templates: [
          {
            id: '1',
            name: 'Confirmación de recepción',
            trigger: 'ticket_created',
            subject: 'Ticket recibido - #{ticketId}',
            message: 'Hemos recibido tu solicitud y estamos trabajando en ella. Te mantendremos informado del progreso.',
            enabled: true,
          },
          {
            id: '2',
            name: 'Actualización de progreso',
            trigger: 'ticket_updated',
            subject: 'Actualización de tu ticket #{ticketId}',
            message: 'Tu ticket ha sido actualizado. Puedes revisar los detalles en tu panel de soporte.',
            enabled: true,
          },
          {
            id: '3',
            name: 'SLA próximo a vencer',
            trigger: 'sla_warning',
            subject: 'Urgente: Tu ticket #{ticketId} requiere atención inmediata',
            message: 'Tu solicitud está próxima a vencer el tiempo de respuesta garantizado. Estamos trabajando para resolverla.',
            enabled: true,
          },
        ],
      };

      setConfig(mockConfig);
      await new Promise(resolve => setTimeout(resolve, 800));
    } catch (error) {
      logger.error('Error loading page data:', {
        error: error instanceof Error ? error.message : String(error),
      });
      setError('Error al cargar los datos');
    } finally {
      setLoading(false);
    }
  };

  const saveConfiguration = async (section: string, data: any) => {
    try {
      setSuccessMessage(null);
      setError(null);

      // Simular guardado en API
      await new Promise(resolve => setTimeout(resolve, 500));

      // Actualizar configuración local
      if (config) {
        setConfig({ ...config, [section]: data });
      }

      logger.info(`Configuración ${section} guardada exitosamente`);
      setSuccessMessage(`Configuración de ${section} guardada exitosamente`);

      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (error) {
      logger.error(`Error guardando configuración ${section}:`, {
        error: error instanceof Error ? error.message : String(error),
      });
      setError(`Error al guardar la configuración ${section}`);
    }
  };

  const updateSLA = (priority: keyof SLAConfig, type: 'response' | 'resolution', value: number) => {
    if (!config) return;

    const newSLA = {
      ...config.sla,
      [priority]: {
        ...config.sla[priority],
        [type]: value,
      },
    };

    setConfig({ ...config, sla: newSLA });
  };

  const addTemplate = () => {
    if (!config) return;

    const newTemplate: AutoResponseTemplate = {
      id: Date.now().toString(),
      name: '',
      trigger: 'ticket_created',
      subject: '',
      message: '',
      enabled: true,
    };

    setConfig({
      ...config,
      templates: [...config.templates, newTemplate],
    });
    setEditingTemplate(newTemplate);
    setShowAddTemplate(false);
  };

  const updateTemplate = (templateId: string, updates: Partial<AutoResponseTemplate>) => {
    if (!config) return;

    const updatedTemplates = config.templates.map(template =>
      template.id === templateId ? { ...template, ...updates } : template
    );

    setConfig({ ...config, templates: updatedTemplates });
  };

  const deleteTemplate = (templateId: string) => {
    if (!config) return;

    const filteredTemplates = config.templates.filter(template => template.id !== templateId);
    setConfig({ ...config, templates: filteredTemplates });
  };

  const exportSettings = () => {
    if (!config) return;

    const settingsJson = JSON.stringify(config, null, 2);
    const blob = new Blob([settingsJson], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `configuracion-soporte-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <UnifiedDashboardLayout title="Configuración Avanzada de Soporte" subtitle="Cargando configuraciones...">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Cargando configuración del sistema de soporte...</p>
          </div>
        </div>
      </UnifiedDashboardLayout>
    );
  }

  if (error) {
    return (
      <UnifiedDashboardLayout title="Configuración Avanzada de Soporte" subtitle="Error al cargar">
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
      title="Configuración Avanzada de Soporte"
      subtitle="Administra todas las configuraciones del sistema de soporte técnico"
    >
      <div className="space-y-6">
        {/* Mensajes de éxito/error */}
        {successMessage && (
          <Card className="border-green-200 bg-green-50">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <Check className="w-5 h-5 text-green-600" />
                <span className="text-green-800">{successMessage}</span>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Header con acciones principales */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Configuración del Sistema</h1>
            <p className="text-gray-600">Configuraciones avanzadas para optimizar el soporte</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={exportSettings}>
              <Download className="w-4 h-4 mr-2" />
              Exportar Config
            </Button>
            <Button variant="outline" onClick={loadPageData}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Recargar
            </Button>
          </div>
        </div>

        {/* Tabs de configuración */}
        <Tabs defaultValue="general" className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="general">General</TabsTrigger>
            <TabsTrigger value="sla">SLA</TabsTrigger>
            <TabsTrigger value="automation">Automatización</TabsTrigger>
            <TabsTrigger value="templates">Plantillas</TabsTrigger>
            <TabsTrigger value="notifications">Notificaciones</TabsTrigger>
          </TabsList>

          {/* Configuración General */}
          <TabsContent value="general" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Configuración General</CardTitle>
                <CardDescription>Parámetros básicos del sistema de soporte</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Horarios de trabajo */}
                <div>
                  <h4 className="font-medium mb-3">Horarios de Trabajo</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <Label>Hora de Inicio</Label>
                      <Input
                        type="time"
                        value={config?.general.workingHours.start || ''}
                        onChange={(e) => {
                          if (config) {
                            setConfig({
                              ...config,
                              general: {
                                ...config.general,
                                workingHours: { ...config.general.workingHours, start: e.target.value }
                              }
                            });
                          }
                        }}
                      />
                    </div>
                    <div>
                      <Label>Hora de Fin</Label>
                      <Input
                        type="time"
                        value={config?.general.workingHours.end || ''}
                        onChange={(e) => {
                          if (config) {
                            setConfig({
                              ...config,
                              general: {
                                ...config.general,
                                workingHours: { ...config.general.workingHours, end: e.target.value }
                              }
                            });
                          }
                        }}
                      />
                    </div>
                    <div>
                      <Label>Zona Horaria</Label>
                      <Select
                        value={config?.general.workingHours.timezone || ''}
                        onValueChange={(value) => {
                          if (config) {
                            setConfig({
                              ...config,
                              general: {
                                ...config.general,
                                workingHours: { ...config.general.workingHours, timezone: value }
                              }
                            });
                          }
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="America/Santiago">Chile (Santiago)</SelectItem>
                          <SelectItem value="America/Buenos_Aires">Argentina</SelectItem>
                          <SelectItem value="America/Lima">Perú</SelectItem>
                          <SelectItem value="America/Bogota">Colombia</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Opciones de sistema */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Asignación Automática de Tickets</Label>
                      <p className="text-sm text-gray-500">Distribuir tickets automáticamente entre agentes</p>
                    </div>
                    <Switch
                      checked={config?.general.autoAssignEnabled || false}
                      onCheckedChange={(checked) => {
                        if (config) {
                          setConfig({
                            ...config,
                            general: { ...config.general, autoAssignEnabled: checked }
                          });
                        }
                      }}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label>Máximo de Tickets por Agente</Label>
                      <Input
                        type="number"
                        value={config?.general.maxTicketsPerAgent || 25}
                        onChange={(e) => {
                          if (config) {
                            setConfig({
                              ...config,
                              general: { ...config.general, maxTicketsPerAgent: parseInt(e.target.value) }
                            });
                          }
                        }}
                      />
                    </div>
                    <div>
                      <Label>Idioma del Sistema</Label>
                      <Select
                        value={config?.general.language || 'es'}
                        onValueChange={(value) => {
                          if (config) {
                            setConfig({
                              ...config,
                              general: { ...config.general, language: value }
                            });
                          }
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="es">Español</SelectItem>
                          <SelectItem value="en">English</SelectItem>
                          <SelectItem value="pt">Português</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button onClick={() => saveConfiguration('general', config?.general)}>
                    <Save className="w-4 h-4 mr-2" />
                    Guardar Configuración General
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Configuración SLA */}
          <TabsContent value="sla" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Configuración de SLA (Service Level Agreement)</CardTitle>
                <CardDescription>Tiempos de respuesta y resolución por prioridad</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {config?.sla && (
                  <div className="space-y-4">
                    {Object.entries(config.sla).map(([priority, times]) => (
                      <div key={priority} className="p-4 border rounded-lg">
                        <div className="flex items-center gap-3 mb-3">
                          <Badge className={`${
                            priority === 'urgent' ? 'bg-red-100 text-red-800' :
                            priority === 'high' ? 'bg-orange-100 text-orange-800' :
                            priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-green-100 text-green-800'
                          }`}>
                            {priority === 'urgent' ? 'Urgente' :
                             priority === 'high' ? 'Alta' :
                             priority === 'medium' ? 'Media' : 'Baja'}
                          </Badge>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <Label>Tiempo de Primera Respuesta (min)</Label>
                            <Input
                              type="number"
                              value={times.response}
                              onChange={(e) => updateSLA(priority as keyof SLAConfig, 'response', parseInt(e.target.value))}
                            />
                          </div>
                          <div>
                            <Label>Tiempo de Resolución (min)</Label>
                            <Input
                              type="number"
                              value={times.resolution}
                              onChange={(e) => updateSLA(priority as keyof SLAConfig, 'resolution', parseInt(e.target.value))}
                            />
                          </div>
                        </div>

                        <div className="mt-2 text-sm text-gray-600">
                          Primera respuesta: {Math.floor(times.response / 60)}h {times.response % 60}min |
                          Resolución completa: {Math.floor(times.resolution / 60)}h {times.resolution % 60}min
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <div className="flex justify-end">
                  <Button onClick={() => saveConfiguration('sla', config?.sla)}>
                    <Save className="w-4 h-4 mr-2" />
                    Guardar Configuración SLA
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Automatización */}
          <TabsContent value="automation" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Automatización de Procesos</CardTitle>
                <CardDescription>Reglas automáticas para optimizar el flujo de trabajo</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Cierre Automático de Tickets Resueltos</Label>
                      <p className="text-sm text-gray-500">Cerrar automáticamente tickets marcados como resueltos</p>
                    </div>
                    <Switch
                      checked={config?.automation.autoCloseResolved || false}
                      onCheckedChange={(checked) => {
                        if (config) {
                          setConfig({
                            ...config,
                            automation: { ...config.automation, autoCloseResolved: checked }
                          });
                        }
                      }}
                    />
                  </div>

                  {config?.automation.autoCloseResolved && (
                    <div className="ml-6">
                      <Label>Días para cierre automático</Label>
                      <Input
                        type="number"
                        value={config.automation.autoCloseDays}
                        onChange={(e) => {
                          if (config) {
                            setConfig({
                              ...config,
                              automation: { ...config.automation, autoCloseDays: parseInt(e.target.value) }
                            });
                          }
                        }}
                      />
                    </div>
                  )}

                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Escalamiento Automático</Label>
                      <p className="text-sm text-gray-500">Escalar tickets que excedan el tiempo límite</p>
                    </div>
                    <Switch
                      checked={config?.automation.escalationEnabled || false}
                      onCheckedChange={(checked) => {
                        if (config) {
                          setConfig({
                            ...config,
                            automation: { ...config.automation, escalationEnabled: checked }
                          });
                        }
                      }}
                    />
                  </div>

                  {config?.automation.escalationEnabled && (
                    <div className="ml-6">
                      <Label>Horas para escalamiento</Label>
                      <Input
                        type="number"
                        value={config.automation.escalationHours}
                        onChange={(e) => {
                          if (config) {
                            setConfig({
                              ...config,
                              automation: { ...config.automation, escalationHours: parseInt(e.target.value) }
                            });
                          }
                        }}
                      />
                    </div>
                  )}

                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Reasignación de Tickets Estancados</Label>
                      <p className="text-sm text-gray-500">Reasignar tickets sin actividad reciente</p>
                    </div>
                    <Switch
                      checked={config?.automation.reassignStaleTickets || false}
                      onCheckedChange={(checked) => {
                        if (config) {
                          setConfig({
                            ...config,
                            automation: { ...config.automation, reassignStaleTickets: checked }
                          });
                        }
                      }}
                    />
                  </div>

                  {config?.automation.reassignStaleTickets && (
                    <div className="ml-6">
                      <Label>Horas sin actividad para reasignar</Label>
                      <Input
                        type="number"
                        value={config.automation.staleTicketHours}
                        onChange={(e) => {
                          if (config) {
                            setConfig({
                              ...config,
                              automation: { ...config.automation, staleTicketHours: parseInt(e.target.value) }
                            });
                          }
                        }}
                      />
                    </div>
                  )}
                </div>

                <div className="flex justify-end">
                  <Button onClick={() => saveConfiguration('automation', config?.automation)}>
                    <Save className="w-4 h-4 mr-2" />
                    Guardar Automatización
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Plantillas de respuesta automática */}
          <TabsContent value="templates" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle>Plantillas de Respuesta Automática</CardTitle>
                    <CardDescription>Plantillas para respuestas automáticas del sistema</CardDescription>
                  </div>
                  <Button onClick={() => setShowAddTemplate(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Nueva Plantilla
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {config?.templates.map((template) => (
                  <div key={template.id} className="p-4 border rounded-lg">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h4 className="font-medium">{template.name}</h4>
                          <Badge variant={template.enabled ? 'default' : 'secondary'}>
                            {template.enabled ? 'Activa' : 'Inactiva'}
                          </Badge>
                          <Badge variant="outline">{template.trigger}</Badge>
                        </div>
                        <div className="space-y-2 text-sm text-gray-600">
                          <p><strong>Asunto:</strong> {template.subject}</p>
                          <p><strong>Mensaje:</strong> {template.message.substring(0, 100)}...</p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setEditingTemplate(template)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => deleteTemplate(template.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}

                <div className="flex justify-end">
                  <Button onClick={() => saveConfiguration('templates', config?.templates)}>
                    <Save className="w-4 h-4 mr-2" />
                    Guardar Plantillas
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Notificaciones */}
          <TabsContent value="notifications" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Configuración de Notificaciones</CardTitle>
                <CardDescription>Canales y tipos de notificaciones del sistema</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Notificaciones por Email</Label>
                      <p className="text-sm text-gray-500">Enviar notificaciones por correo electrónico</p>
                    </div>
                    <Switch
                      checked={config?.notifications.emailEnabled || false}
                      onCheckedChange={(checked) => {
                        if (config) {
                          setConfig({
                            ...config,
                            notifications: { ...config.notifications, emailEnabled: checked }
                          });
                        }
                      }}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Notificaciones por SMS</Label>
                      <p className="text-sm text-gray-500">Enviar notificaciones por mensaje de texto</p>
                    </div>
                    <Switch
                      checked={config?.notifications.smsEnabled || false}
                      onCheckedChange={(checked) => {
                        if (config) {
                          setConfig({
                            ...config,
                            notifications: { ...config.notifications, smsEnabled: checked }
                          });
                        }
                      }}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Notificaciones Push</Label>
                      <p className="text-sm text-gray-500">Enviar notificaciones push en la aplicación</p>
                    </div>
                    <Switch
                      checked={config?.notifications.pushEnabled || false}
                      onCheckedChange={(checked) => {
                        if (config) {
                          setConfig({
                            ...config,
                            notifications: { ...config.notifications, pushEnabled: checked }
                          });
                        }
                      }}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Integración con Slack</Label>
                      <p className="text-sm text-gray-500">Enviar notificaciones al canal de Slack</p>
                    </div>
                    <Switch
                      checked={config?.notifications.slackEnabled || false}
                      onCheckedChange={(checked) => {
                        if (config) {
                          setConfig({
                            ...config,
                            notifications: { ...config.notifications, slackEnabled: checked }
                          });
                        }
                      }}
                    />
                  </div>

                  <Separator />

                  <div className="space-y-4">
                    <h4 className="font-medium">Alertas del Sistema</h4>

                    <div className="flex items-center justify-between">
                      <div>
                        <Label>Alertas de Escalamiento</Label>
                        <p className="text-sm text-gray-500">Notificar cuando un ticket es escalado</p>
                      </div>
                      <Switch
                        checked={config?.notifications.escalationAlerts || false}
                        onCheckedChange={(checked) => {
                          if (config) {
                            setConfig({
                              ...config,
                              notifications: { ...config.notifications, escalationAlerts: checked }
                            });
                          }
                        }}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <Label>Alertas de SLA</Label>
                        <p className="text-sm text-gray-500">Notificar cuando un SLA está próximo a vencerse</p>
                      </div>
                      <Switch
                        checked={config?.notifications.slaAlerts || false}
                        onCheckedChange={(checked) => {
                          if (config) {
                            setConfig({
                              ...config,
                              notifications: { ...config.notifications, slaAlerts: checked }
                            });
                          }
                        }}
                      />
                    </div>
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button onClick={() => saveConfiguration('notifications', config?.notifications)}>
                    <Save className="w-4 h-4 mr-2" />
                    Guardar Notificaciones
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Modal para editar plantilla */}
        {editingTemplate && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-2xl">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">
                  {editingTemplate.id.startsWith('template-') ? 'Nueva Plantilla' : 'Editar Plantilla'}
                </h3>
                <Button variant="ghost" size="sm" onClick={() => setEditingTemplate(null)}>
                  <X className="w-4 h-4" />
                </Button>
              </div>

              <div className="space-y-4">
                <div>
                  <Label>Nombre de la Plantilla</Label>
                  <Input
                    value={editingTemplate.name}
                    onChange={(e) => setEditingTemplate({ ...editingTemplate, name: e.target.value })}
                  />
                </div>

                <div>
                  <Label>Disparador</Label>
                  <Select
                    value={editingTemplate.trigger}
                    onValueChange={(value) => setEditingTemplate({ ...editingTemplate, trigger: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ticket_created">Ticket Creado</SelectItem>
                      <SelectItem value="ticket_updated">Ticket Actualizado</SelectItem>
                      <SelectItem value="sla_warning">Advertencia SLA</SelectItem>
                      <SelectItem value="ticket_resolved">Ticket Resuelto</SelectItem>
                      <SelectItem value="ticket_closed">Ticket Cerrado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Asunto del Email</Label>
                  <Input
                    value={editingTemplate.subject}
                    onChange={(e) => setEditingTemplate({ ...editingTemplate, subject: e.target.value })}
                  />
                </div>

                <div>
                  <Label>Mensaje</Label>
                  <Textarea
                    rows={6}
                    value={editingTemplate.message}
                    onChange={(e) => setEditingTemplate({ ...editingTemplate, message: e.target.value })}
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    Puedes usar variables como {'{ticketId}'}, {'{userName}'}, etc.
                  </p>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    checked={editingTemplate.enabled}
                    onCheckedChange={(checked) => setEditingTemplate({ ...editingTemplate, enabled: checked })}
                  />
                  <Label>Plantilla activa</Label>
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <Button variant="outline" onClick={() => setEditingTemplate(null)}>
                  Cancelar
                </Button>
                <Button onClick={() => {
                  updateTemplate(editingTemplate.id, editingTemplate);
                  setEditingTemplate(null);
                }}>
                  <Save className="w-4 h-4 mr-2" />
                  Guardar Plantilla
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Modal para agregar plantilla */}
        {showAddTemplate && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">Nueva Plantilla</h3>
                <Button variant="ghost" size="sm" onClick={() => setShowAddTemplate(false)}>
                  <X className="w-4 h-4" />
                </Button>
              </div>

              <div className="space-y-4">
                <div>
                  <Label>Nombre de la Plantilla</Label>
                  <Input
                    placeholder="Ej: Confirmación de recepción"
                    value={editingTemplate?.name || ''}
                    onChange={(e) => {
                      if (editingTemplate) {
                        setEditingTemplate({ ...editingTemplate, name: e.target.value });
                      }
                    }}
                  />
                </div>

                <div>
                  <Label>Disparador</Label>
                  <Select
                    value={editingTemplate?.trigger || 'ticket_created'}
                    onValueChange={(value) => {
                      if (editingTemplate) {
                        setEditingTemplate({ ...editingTemplate, trigger: value });
                      }
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ticket_created">Ticket Creado</SelectItem>
                      <SelectItem value="ticket_updated">Ticket Actualizado</SelectItem>
                      <SelectItem value="sla_warning">Advertencia SLA</SelectItem>
                      <SelectItem value="ticket_resolved">Ticket Resuelto</SelectItem>
                      <SelectItem value="ticket_closed">Ticket Cerrado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <Button variant="outline" onClick={() => setShowAddTemplate(false)}>
                  Cancelar
                </Button>
                <Button onClick={addTemplate}>
                  <Plus className="w-4 h-4 mr-2" />
                  Crear Plantilla
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </UnifiedDashboardLayout>
  );
}

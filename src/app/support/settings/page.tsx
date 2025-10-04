'use client';

import { useState, useEffect } from 'react';
import { logger } from '@/lib/logger';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
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
} from 'lucide-react';
import UnifiedDashboardLayout from '@/components/layout/UnifiedDashboardLayout';

export default function SupportSettingsPage() {
  const [loading, setLoading] = useState(true);
  const [activeSection, setActiveSection] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Estados para configuraciones
  const [notificationsConfig, setNotificationsConfig] = useState({
    emailEnabled: true,
    smsEnabled: false,
    pushEnabled: true,
    autoResponseEnabled: true,
  });

  const [automationConfig, setAutomationConfig] = useState({
    autoAssignTickets: true,
    autoCloseResolved: false,
    escalationEnabled: true,
    slaMonitoring: true,
  });

  const [permissionsConfig, setPermissionsConfig] = useState({
    canCreateUsers: false, // Soporte NO puede crear administradores
    canEditSettings: false,
    canViewReports: true,
    canManageTickets: true,
  });

  useEffect(() => {
    loadPageData();
  }, []);

  const loadPageData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Cargar configuraciones desde API (simulado por ahora)
      // TODO: Implementar API real para cargar configuraciones
      // const response = await fetch('/api/support/settings');
      // const result = await response.json();
      // setNotificationsConfig(result.notifications);
      // setAutomationConfig(result.automation);
      // setPermissionsConfig(result.permissions);

      // Simular carga
      await new Promise(resolve => setTimeout(resolve, 1000));
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
      // TODO: Implementar API real para guardar configuraciones
      // const response = await fetch('/api/support/settings', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ section, data })
      // });

      // Simular guardado
      await new Promise(resolve => setTimeout(resolve, 500));

      logger.info(`Configuración ${section} guardada exitosamente`);
      setActiveSection(null); // Cerrar la sección después de guardar
    } catch (error) {
      logger.error(`Error guardando configuración ${section}:`, {
        error: error instanceof Error ? error.message : String(error),
      });
      setError(`Error al guardar la configuración ${section}`);
    }
  };

  if (loading) {
    return (
      <UnifiedDashboardLayout title="Configuración de Soporte" subtitle="Cargando información...">
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
      <UnifiedDashboardLayout title="Configuración de Soporte" subtitle="Error al cargar la página">
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
      title="Configuración de Soporte"
      subtitle="Configura las opciones y parámetros del sistema de soporte"
    >
      <div className="space-y-6">
        {/* Header con estadísticas */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Configuraciones Activas</CardTitle>
              <Settings className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">24</div>
              <p className="text-xs text-muted-foreground">+2 desde el mes pasado</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Permisos Configurados</CardTitle>
              <Shield className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">156</div>
              <p className="text-xs text-muted-foreground">+12 desde el mes pasado</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Notificaciones</CardTitle>
              <Bell className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">8</div>
              <p className="text-xs text-muted-foreground">+1 desde el mes pasado</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Integraciones</CardTitle>
              <Zap className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">5</div>
              <p className="text-xs text-muted-foreground">+1 desde el mes pasado</p>
            </CardContent>
          </Card>
        </div>

        {/* Contenido principal */}
        <Card>
          <CardHeader>
            <CardTitle>Configuración de Soporte</CardTitle>
            <CardDescription>
              Configura las opciones y parámetros del sistema de soporte Rent360.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-12">
              <Settings className="w-12 h-12 text-blue-500 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Configuración del Sistema de Soporte
              </h3>
              <p className="text-gray-600 mb-4">
                Administra configuraciones del sistema de tickets, notificaciones y
                automatizaciones.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                <Button
                  variant={activeSection === 'notifications' ? 'default' : 'outline'}
                  className="flex flex-col items-center p-6"
                  onClick={() =>
                    setActiveSection(activeSection === 'notifications' ? null : 'notifications')
                  }
                >
                  <Mail className="w-8 h-8 text-green-500 mb-2" />
                  <span className="font-medium">Notificaciones</span>
                  <span className="text-sm text-gray-500">Configurar emails</span>
                </Button>
                <Button
                  variant={activeSection === 'automation' ? 'default' : 'outline'}
                  className="flex flex-col items-center p-6"
                  onClick={() =>
                    setActiveSection(activeSection === 'automation' ? null : 'automation')
                  }
                >
                  <Settings className="w-8 h-8 text-blue-500 mb-2" />
                  <span className="font-medium">Automatizaciones</span>
                  <span className="text-sm text-gray-500">Reglas y flujos</span>
                </Button>
                <Button
                  variant={activeSection === 'permissions' ? 'default' : 'outline'}
                  className="flex flex-col items-center p-6"
                  onClick={() =>
                    setActiveSection(activeSection === 'permissions' ? null : 'permissions')
                  }
                >
                  <Shield className="w-8 h-8 text-purple-500 mb-2" />
                  <span className="font-medium">Permisos</span>
                  <span className="text-sm text-gray-500">Roles y accesos</span>
                </Button>
              </div>

              {/* Sección de Notificaciones */}
              {activeSection === 'notifications' && (
                <div className="mt-6 p-4 border rounded-lg bg-gray-50">
                  <h4 className="font-semibold mb-4">Configuración de Notificaciones</h4>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="email-notifications">Notificaciones por Email</Label>
                      <Switch
                        id="email-notifications"
                        checked={notificationsConfig.emailEnabled}
                        onCheckedChange={checked =>
                          setNotificationsConfig({ ...notificationsConfig, emailEnabled: checked })
                        }
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label htmlFor="sms-notifications">Notificaciones por SMS</Label>
                      <Switch
                        id="sms-notifications"
                        checked={notificationsConfig.smsEnabled}
                        onCheckedChange={checked =>
                          setNotificationsConfig({ ...notificationsConfig, smsEnabled: checked })
                        }
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label htmlFor="push-notifications">Notificaciones Push</Label>
                      <Switch
                        id="push-notifications"
                        checked={notificationsConfig.pushEnabled}
                        onCheckedChange={checked =>
                          setNotificationsConfig({ ...notificationsConfig, pushEnabled: checked })
                        }
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label htmlFor="auto-response">Respuesta Automática</Label>
                      <Switch
                        id="auto-response"
                        checked={notificationsConfig.autoResponseEnabled}
                        onCheckedChange={checked =>
                          setNotificationsConfig({
                            ...notificationsConfig,
                            autoResponseEnabled: checked,
                          })
                        }
                      />
                    </div>
                    <Separator />
                    <Button
                      onClick={() => saveConfiguration('notifications', notificationsConfig)}
                      className="w-full"
                    >
                      <Save className="w-4 h-4 mr-2" />
                      Guardar Configuración
                    </Button>
                  </div>
                </div>
              )}

              {/* Sección de Automatizaciones */}
              {activeSection === 'automation' && (
                <div className="mt-6 p-4 border rounded-lg bg-gray-50">
                  <h4 className="font-semibold mb-4">Configuración de Automatizaciones</h4>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="auto-assign">Asignación Automática de Tickets</Label>
                      <Switch
                        id="auto-assign"
                        checked={automationConfig.autoAssignTickets}
                        onCheckedChange={checked =>
                          setAutomationConfig({ ...automationConfig, autoAssignTickets: checked })
                        }
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label htmlFor="auto-close">Cierre Automático de Tickets Resueltos</Label>
                      <Switch
                        id="auto-close"
                        checked={automationConfig.autoCloseResolved}
                        onCheckedChange={checked =>
                          setAutomationConfig({ ...automationConfig, autoCloseResolved: checked })
                        }
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label htmlFor="escalation">Escalamiento Automático</Label>
                      <Switch
                        id="escalation"
                        checked={automationConfig.escalationEnabled}
                        onCheckedChange={checked =>
                          setAutomationConfig({ ...automationConfig, escalationEnabled: checked })
                        }
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label htmlFor="sla-monitoring">Monitoreo de SLA</Label>
                      <Switch
                        id="sla-monitoring"
                        checked={automationConfig.slaMonitoring}
                        onCheckedChange={checked =>
                          setAutomationConfig({ ...automationConfig, slaMonitoring: checked })
                        }
                      />
                    </div>
                    <Separator />
                    <Button
                      onClick={() => saveConfiguration('automation', automationConfig)}
                      className="w-full"
                    >
                      <Save className="w-4 h-4 mr-2" />
                      Guardar Configuración
                    </Button>
                  </div>
                </div>
              )}

              {/* Sección de Permisos */}
              {activeSection === 'permissions' && (
                <div className="mt-6 p-4 border rounded-lg bg-gray-50">
                  <h4 className="font-semibold mb-4">Configuración de Permisos</h4>
                  <div className="space-y-4">
                    <div className="p-3 bg-yellow-50 border border-yellow-200 rounded">
                      <p className="text-sm text-yellow-800">
                        <strong>Nota:</strong> Como usuario de soporte, no puedes crear usuarios
                        administradores por seguridad.
                      </p>
                    </div>
                    <div className="flex items-center justify-between">
                      <Label htmlFor="create-users">Crear Usuarios</Label>
                      <Switch
                        id="create-users"
                        checked={permissionsConfig.canCreateUsers}
                        onCheckedChange={checked =>
                          setPermissionsConfig({ ...permissionsConfig, canCreateUsers: checked })
                        }
                        disabled={true} // Deshabilitado para soporte
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label htmlFor="edit-settings">Editar Configuraciones</Label>
                      <Switch
                        id="edit-settings"
                        checked={permissionsConfig.canEditSettings}
                        onCheckedChange={checked =>
                          setPermissionsConfig({ ...permissionsConfig, canEditSettings: checked })
                        }
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label htmlFor="view-reports">Ver Reportes</Label>
                      <Switch
                        id="view-reports"
                        checked={permissionsConfig.canViewReports}
                        onCheckedChange={checked =>
                          setPermissionsConfig({ ...permissionsConfig, canViewReports: checked })
                        }
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label htmlFor="manage-tickets">Gestionar Tickets</Label>
                      <Switch
                        id="manage-tickets"
                        checked={permissionsConfig.canManageTickets}
                        onCheckedChange={checked =>
                          setPermissionsConfig({ ...permissionsConfig, canManageTickets: checked })
                        }
                      />
                    </div>
                    <Separator />
                    <Button
                      onClick={() => saveConfiguration('permissions', permissionsConfig)}
                      className="w-full"
                    >
                      <Save className="w-4 h-4 mr-2" />
                      Guardar Configuración
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Acciones rápidas */}
        <Card>
          <CardHeader>
            <CardTitle>Acciones Rápidas</CardTitle>
            <CardDescription>Accede rápidamente a las funciones más utilizadas</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <Button variant="outline" className="h-20 flex flex-col items-center justify-center">
                <Shield className="w-6 h-6 mb-2" />
                <span>Permisos</span>
              </Button>

              <Button variant="outline" className="h-20 flex flex-col items-center justify-center">
                <Bell className="w-6 h-6 mb-2" />
                <span>Notificaciones</span>
              </Button>

              <Button variant="outline" className="h-20 flex flex-col items-center justify-center">
                <Database className="w-6 h-6 mb-2" />
                <span>Base de Datos</span>
              </Button>

              <Button variant="outline" className="h-20 flex flex-col items-center justify-center">
                <Zap className="w-6 h-6 mb-2" />
                <span>Integraciones</span>
              </Button>

              <Button variant="outline" className="h-20 flex flex-col items-center justify-center">
                <Lock className="w-6 h-6 mb-2" />
                <span>Seguridad</span>
              </Button>

              <Button variant="outline" className="h-20 flex flex-col items-center justify-center">
                <RefreshCw className="w-6 h-6 mb-2" />
                <span>Actualizar</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </UnifiedDashboardLayout>
  );
}

'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import UnifiedDashboardLayout from '@/components/layout/UnifiedDashboardLayout';
import { logger } from '@/lib/logger-minimal';
import {
  Zap,
  Play,
  Pause,
  Settings,
  Plus,
  Edit,
  Trash2,
  Clock,
  Mail,
  MessageSquare,
  AlertTriangle,
  CheckCircle,
  Users,
  Calendar,
  TrendingUp,
  Save,
  X,
} from 'lucide-react';
import { User } from '@/types';

interface AutomationRule {
  id: string;
  name: string;
  description: string;
  trigger: {
    type: 'ticket_created' | 'ticket_updated' | 'time_based' | 'user_action';
    conditions: any[];
  };
  actions: {
    type: 'send_email' | 'send_notification' | 'assign_agent' | 'update_status' | 'create_task';
    config: any;
  }[];
  isActive: boolean;
  priority: 'low' | 'medium' | 'high';
  createdAt: string;
  updatedAt: string;
  executionCount: number;
  lastExecuted?: string;
}

export default function AutomationsPage() {
  const [user, setUser] = useState<User | null>(null);
  const [automations, setAutomations] = useState<AutomationRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editingAutomation, setEditingAutomation] = useState<AutomationRule | null>(null);
  const [newAutomation, setNewAutomation] = useState<Partial<AutomationRule>>({
    name: '',
    description: '',
    trigger: { type: 'ticket_created', conditions: [] },
    actions: [],
    isActive: false,
    priority: 'medium',
  });

  useEffect(() => {
    const loadData = async () => {
      try {
        // Load user data
        const response = await fetch('/api/auth/me');
        if (response.ok) {
          const data = await response.json();
          setUser(data.user);
        }

        // Load automations data
        const mockAutomations: AutomationRule[] = [
          {
            id: '1',
            name: 'Bienvenida automática',
            description: 'Envía mensaje de bienvenida cuando se crea un ticket nuevo',
            trigger: {
              type: 'ticket_created',
              conditions: [{ field: 'category', operator: 'equals', value: 'technical' }],
            },
            actions: [
              {
                type: 'send_notification',
                config: {
                  message: '¡Gracias por contactarnos! Un agente revisará tu consulta pronto.',
                  channel: 'in_app',
                },
              },
            ],
            isActive: true,
            priority: 'high',
            createdAt: '2024-01-15T10:00:00Z',
            updatedAt: '2024-01-15T10:00:00Z',
            executionCount: 245,
            lastExecuted: '2024-01-20T14:30:00Z',
          },
          {
            id: '2',
            name: 'Escalado automático de tickets urgentes',
            description: 'Escala tickets marcados como urgentes a supervisores',
            trigger: {
              type: 'ticket_updated',
              conditions: [{ field: 'priority', operator: 'equals', value: 'urgent' }],
            },
            actions: [
              {
                type: 'assign_agent',
                config: { role: 'supervisor' },
              },
              {
                type: 'send_email',
                config: {
                  to: 'supervisor@rent360.cl',
                  subject: 'Ticket urgente requiere atención inmediata',
                  body: 'Un ticket ha sido escalado automáticamente.',
                },
              },
            ],
            isActive: true,
            priority: 'high',
            createdAt: '2024-01-10T09:00:00Z',
            updatedAt: '2024-01-18T11:00:00Z',
            executionCount: 12,
            lastExecuted: '2024-01-19T16:45:00Z',
          },
          {
            id: '3',
            name: 'Recordatorio de tickets sin respuesta',
            description:
              'Envía recordatorio a agentes sobre tickets sin respuesta por más de 24 horas',
            trigger: {
              type: 'time_based',
              conditions: [{ field: 'last_response', operator: 'older_than', value: '24h' }],
            },
            actions: [
              {
                type: 'send_notification',
                config: {
                  message: 'Tienes tickets pendientes de respuesta',
                  channel: 'email',
                },
              },
            ],
            isActive: false,
            priority: 'medium',
            createdAt: '2024-01-08T08:00:00Z',
            updatedAt: '2024-01-08T08:00:00Z',
            executionCount: 0,
          },
          {
            id: '4',
            name: 'Cierre automático de tickets resueltos',
            description: 'Cierra automáticamente tickets resueltos después de 7 días sin actividad',
            trigger: {
              type: 'time_based',
              conditions: [
                { field: 'status', operator: 'equals', value: 'resolved' },
                { field: 'last_activity', operator: 'older_than', value: '7d' },
              ],
            },
            actions: [
              {
                type: 'update_status',
                config: { status: 'closed', reason: 'Cerrado automáticamente por inactividad' },
              },
              {
                type: 'send_email',
                config: {
                  subject: 'Tu ticket ha sido cerrado automáticamente',
                  body: 'Gracias por usar nuestro servicio de soporte.',
                },
              },
            ],
            isActive: true,
            priority: 'low',
            createdAt: '2024-01-05T07:00:00Z',
            updatedAt: '2024-01-12T10:00:00Z',
            executionCount: 89,
            lastExecuted: '2024-01-20T12:00:00Z',
          },
        ];

        setAutomations(mockAutomations);
      } catch (error) {
        logger.error('Error loading automations data:', { error });
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const handleToggleAutomation = async (automationId: string, isActive: boolean) => {
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));

      setAutomations(prev =>
        prev.map(auto =>
          auto.id === automationId
            ? { ...auto, isActive, updatedAt: new Date().toISOString() }
            : auto
        )
      );
    } catch (error) {
      logger.error('Error toggling automation:', { error });
    }
  };

  const handleCreateAutomation = async () => {
    if (!newAutomation.name || !newAutomation.description) {
      return;
    }

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));

      const automation: AutomationRule = {
        id: `auto_${Date.now()}`,
        name: newAutomation.name!,
        description: newAutomation.description!,
        trigger: newAutomation.trigger!,
        actions: newAutomation.actions!,
        isActive: newAutomation.isActive || false,
        priority: newAutomation.priority || 'medium',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        executionCount: 0,
      };

      setAutomations(prev => [...prev, automation]);
      setShowCreateDialog(false);
      setNewAutomation({
        name: '',
        description: '',
        trigger: { type: 'ticket_created', conditions: [] },
        actions: [],
        isActive: false,
        priority: 'medium',
      });
    } catch (error) {
      logger.error('Error creating automation:', { error });
    }
  };

  const handleEditAutomation = (automation: AutomationRule) => {
    setEditingAutomation(automation);
    setNewAutomation({
      name: automation.name,
      description: automation.description,
      trigger: automation.trigger,
      actions: automation.actions,
      isActive: automation.isActive,
      priority: automation.priority,
    });
    setShowEditDialog(true);
  };

  const handleUpdateAutomation = async () => {
    if (!editingAutomation || !newAutomation.name || !newAutomation.description) {
      return;
    }

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));

      setAutomations(prev =>
        prev.map(auto =>
          auto.id === editingAutomation.id
            ? {
                ...auto,
                name: newAutomation.name!,
                description: newAutomation.description!,
                trigger: newAutomation.trigger!,
                actions: newAutomation.actions!,
                isActive: newAutomation.isActive || false,
                priority: newAutomation.priority || 'medium',
                updatedAt: new Date().toISOString(),
              }
            : auto
        )
      );

      setShowEditDialog(false);
      setEditingAutomation(null);
      setNewAutomation({
        name: '',
        description: '',
        trigger: { type: 'ticket_created', conditions: [] },
        actions: [],
        isActive: false,
        priority: 'medium',
      });
    } catch (error) {
      logger.error('Error updating automation:', { error });
    }
  };

  const handleDeleteAutomation = async (automationId: string) => {
    if (!confirm('¿Estás seguro de que quieres eliminar esta automatización?')) {
      return;
    }

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));

      setAutomations(prev => prev.filter(auto => auto.id !== automationId));
    } catch (error) {
      logger.error('Error deleting automation:', { error });
    }
  };

  const getTriggerIcon = (type: string) => {
    switch (type) {
      case 'ticket_created':
        return Plus;
      case 'ticket_updated':
        return Edit;
      case 'time_based':
        return Clock;
      case 'user_action':
        return Users;
      default:
        return Zap;
    }
  };

  const getTriggerLabel = (type: string) => {
    switch (type) {
      case 'ticket_created':
        return 'Ticket Creado';
      case 'ticket_updated':
        return 'Ticket Actualizado';
      case 'time_based':
        return 'Basado en Tiempo';
      case 'user_action':
        return 'Acción de Usuario';
      default:
        return 'Desconocido';
    }
  };

  const getActionIcon = (type: string) => {
    switch (type) {
      case 'send_email':
        return Mail;
      case 'send_notification':
        return MessageSquare;
      case 'assign_agent':
        return Users;
      case 'update_status':
        return Edit;
      case 'create_task':
        return Plus;
      default:
        return Zap;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'destructive';
      case 'medium':
        return 'default';
      case 'low':
        return 'secondary';
      default:
        return 'default';
    }
  };

  if (loading) {
    return (
      <UnifiedDashboardLayout title="Automatizaciones" subtitle="Cargando...">
        <div className="flex items-center justify-center min-h-[50vh]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </UnifiedDashboardLayout>
    );
  }

  return (
    <UnifiedDashboardLayout
      title="Automatizaciones"
      subtitle="Gestiona reglas automáticas para optimizar el flujo de trabajo de soporte"
    >
      <div className="container mx-auto px-4 py-6 space-y-6">
        {/* Header Actions */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold">Automatizaciones</h1>
            <p className="text-gray-600">
              Configura reglas automáticas para mejorar la eficiencia del soporte
            </p>
          </div>
          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <Button className="flex items-center gap-2">
                <Plus className="w-4 h-4" />
                Nueva Automatización
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Crear Nueva Automatización</DialogTitle>
                <DialogDescription>
                  Configura una nueva regla automática para optimizar el flujo de trabajo
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nombre</Label>
                  <Input
                    id="name"
                    value={newAutomation.name || ''}
                    onChange={e => setNewAutomation(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Ej: Bienvenida automática"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Descripción</Label>
                  <Textarea
                    id="description"
                    value={newAutomation.description || ''}
                    onChange={e =>
                      setNewAutomation(prev => ({ ...prev, description: e.target.value }))
                    }
                    placeholder="Describe qué hace esta automatización"
                    rows={3}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Disparador</Label>
                  <Select
                    value={newAutomation.trigger?.type || 'ticket_created'}
                    onValueChange={(value: any) =>
                      setNewAutomation(prev => ({
                        ...prev,
                        trigger: { ...prev.trigger!, type: value },
                      }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ticket_created">Cuando se crea un ticket</SelectItem>
                      <SelectItem value="ticket_updated">Cuando se actualiza un ticket</SelectItem>
                      <SelectItem value="time_based">Basado en tiempo</SelectItem>
                      <SelectItem value="user_action">Acción de usuario</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Prioridad</Label>
                  <Select
                    value={newAutomation.priority || 'medium'}
                    onValueChange={(value: any) =>
                      setNewAutomation(prev => ({ ...prev, priority: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Baja</SelectItem>
                      <SelectItem value="medium">Media</SelectItem>
                      <SelectItem value="high">Alta</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="active"
                    checked={newAutomation.isActive || false}
                    onCheckedChange={checked =>
                      setNewAutomation(prev => ({ ...prev, isActive: checked }))
                    }
                  />
                  <Label htmlFor="active">Activar automatización</Label>
                </div>

                <div className="flex gap-2 pt-4">
                  <Button onClick={handleCreateAutomation} className="flex-1">
                    <Save className="w-4 h-4 mr-2" />
                    Crear Automatización
                  </Button>
                  <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                    <X className="w-4 h-4 mr-2" />
                    Cancelar
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          {/* Edit Automation Dialog */}
          <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Editar Automatización</DialogTitle>
                <DialogDescription>
                  Modifica la configuración de esta automatización
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-name">Nombre</Label>
                  <Input
                    id="edit-name"
                    value={newAutomation.name || ''}
                    onChange={e => setNewAutomation(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Ej: Bienvenida automática"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-description">Descripción</Label>
                  <Textarea
                    id="edit-description"
                    value={newAutomation.description || ''}
                    onChange={e =>
                      setNewAutomation(prev => ({ ...prev, description: e.target.value }))
                    }
                    placeholder="Describe qué hace esta automatización"
                    rows={3}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Disparador</Label>
                  <Select
                    value={newAutomation.trigger?.type || 'ticket_created'}
                    onValueChange={(value: any) =>
                      setNewAutomation(prev => ({
                        ...prev,
                        trigger: { ...prev.trigger!, type: value },
                      }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ticket_created">Cuando se crea un ticket</SelectItem>
                      <SelectItem value="ticket_updated">Cuando se actualiza un ticket</SelectItem>
                      <SelectItem value="time_based">Basado en tiempo</SelectItem>
                      <SelectItem value="user_action">Acción de usuario</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Prioridad</Label>
                  <Select
                    value={newAutomation.priority || 'medium'}
                    onValueChange={(value: any) =>
                      setNewAutomation(prev => ({ ...prev, priority: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Baja</SelectItem>
                      <SelectItem value="medium">Media</SelectItem>
                      <SelectItem value="high">Alta</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="edit-active"
                    checked={newAutomation.isActive || false}
                    onCheckedChange={checked =>
                      setNewAutomation(prev => ({ ...prev, isActive: checked }))
                    }
                  />
                  <Label htmlFor="edit-active">Activar automatización</Label>
                </div>

                <div className="flex gap-2 pt-4">
                  <Button onClick={handleUpdateAutomation} className="flex-1">
                    <Save className="w-4 h-4 mr-2" />
                    Actualizar Automatización
                  </Button>
                  <Button variant="outline" onClick={() => setShowEditDialog(false)}>
                    <X className="w-4 h-4 mr-2" />
                    Cancelar
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{automations.length}</div>
                <div className="text-sm text-gray-600">Automatizaciones</div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {automations.filter(a => a.isActive).length}
                </div>
                <div className="text-sm text-gray-600">Activas</div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">
                  {automations.reduce((sum, a) => sum + a.executionCount, 0)}
                </div>
                <div className="text-sm text-gray-600">Ejecuciones Totales</div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">
                  {automations.filter(a => a.priority === 'high').length}
                </div>
                <div className="text-sm text-gray-600">Alta Prioridad</div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Automations List */}
        <Card>
          <CardHeader>
            <CardTitle>Reglas de Automatización</CardTitle>
            <CardDescription>
              Lista de todas las automatizaciones configuradas en el sistema
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {automations.map(automation => (
                <Card key={automation.id} className="border-l-4 border-l-blue-500">
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-semibold">{automation.name}</h3>
                          <Badge variant={getPriorityColor(automation.priority)}>
                            {automation.priority === 'high'
                              ? 'Alta'
                              : automation.priority === 'medium'
                                ? 'Media'
                                : 'Baja'}
                          </Badge>
                          {automation.isActive ? (
                            <Badge variant="default" className="bg-green-100 text-green-800">
                              <CheckCircle className="w-3 h-3 mr-1" />
                              Activa
                            </Badge>
                          ) : (
                            <Badge variant="secondary">
                              <Pause className="w-3 h-3 mr-1" />
                              Inactiva
                            </Badge>
                          )}
                        </div>

                        <p className="text-gray-600 mb-3">{automation.description}</p>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                          <div className="flex items-center gap-2">
                            {React.createElement(getTriggerIcon(automation.trigger.type), {
                              className: 'w-4 h-4 text-blue-600',
                            })}
                            <span>
                              <strong>Disparador:</strong>{' '}
                              {getTriggerLabel(automation.trigger.type)}
                            </span>
                          </div>

                          <div className="flex items-center gap-2">
                            <Zap className="w-4 h-4 text-purple-600" />
                            <span>
                              <strong>Ejecuciones:</strong> {automation.executionCount}
                            </span>
                          </div>

                          {automation.lastExecuted && (
                            <div className="flex items-center gap-2">
                              <Clock className="w-4 h-4 text-gray-600" />
                              <span>
                                <strong>Última:</strong>{' '}
                                {new Date(automation.lastExecuted).toLocaleDateString()}
                              </span>
                            </div>
                          )}
                        </div>

                        <div className="mt-3">
                          <h4 className="text-sm font-medium mb-2">Acciones:</h4>
                          <div className="flex flex-wrap gap-2">
                            {automation.actions.map((action, index) => (
                              <Badge
                                key={index}
                                variant="outline"
                                className="flex items-center gap-1"
                              >
                                {React.createElement(getActionIcon(action.type), {
                                  className: 'w-3 h-3',
                                })}
                                {action.type === 'send_email'
                                  ? 'Enviar Email'
                                  : action.type === 'send_notification'
                                    ? 'Enviar Notificación'
                                    : action.type === 'assign_agent'
                                      ? 'Asignar Agente'
                                      : action.type === 'update_status'
                                        ? 'Actualizar Estado'
                                        : action.type === 'create_task'
                                          ? 'Crear Tarea'
                                          : 'Acción'}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 ml-4">
                        <Switch
                          checked={automation.isActive}
                          onCheckedChange={checked =>
                            handleToggleAutomation(automation.id, checked)
                          }
                        />
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditAutomation(automation)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteAutomation(automation.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </UnifiedDashboardLayout>
  );
}

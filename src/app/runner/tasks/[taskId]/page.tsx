'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  ArrowLeft,
  MapPin,
  User,
  Phone,
  Mail,
  Calendar,
  Clock,
  CheckCircle,
  AlertTriangle,
  Camera,
  FileText,
  MessageSquare,
  Send,
} from 'lucide-react';
import UnifiedDashboardLayout from '@/components/layout/UnifiedDashboardLayout';
import { useAuth } from '@/components/auth/AuthProviderSimple';
import { logger } from '@/lib/logger-minimal';

interface TaskDetails {
  id: string;
  propertyId: string;
  propertyAddress: string;
  tenantName: string;
  tenantPhone: string;
  tenantEmail: string;
  taskType: 'visit' | 'maintenance' | 'inspection' | 'delivery' | 'other';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  scheduledDate: string;
  scheduledTime: string;
  actualStartTime?: string;
  actualEndTime?: string;
  estimatedDuration: string;
  description: string;
  specialInstructions?: string;
  contactMethod: 'call' | 'whatsapp' | 'email';
  notes?: string;
  photos?: string[];
  createdAt: string;
  updatedAt: string;
}

interface TaskUpdate {
  status?: TaskDetails['status'];
  notes?: string;
  photos?: string[];
}

export default function TaskDetailPage() {
  const router = useRouter();
  const params = useParams();
  const taskId = params?.taskId as string;
  const { user } = useAuth();

  const [task, setTask] = useState<TaskDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [updateNotes, setUpdateNotes] = useState('');
  const [showNotesForm, setShowNotesForm] = useState(false);


  useEffect(() => {
    loadTask();
  }, [taskId]);

  const loadTask = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/runner/tasks/${taskId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });

      if (!response.ok) {
        if (response.status === 404) {
          logger.warn('Tarea no encontrada', { taskId });
          setTask(null);
        } else {
          throw new Error(`Error ${response.status}: ${response.statusText}`);
        }
        return;
      }

      const data = await response.json();

      if (data.success && data.data) {
        // Transformar datos de la API al formato esperado por el componente
        const taskData = data.data;
        setTask({
          id: taskData.id,
          propertyId: taskData.propertyId,
          propertyAddress: taskData.propertyAddress,
          tenantName: taskData.tenantName,
          tenantPhone: taskData.tenantPhone || '',
          tenantEmail: taskData.tenantEmail || '',
          taskType: 'visit', // La API devuelve 'property_visit' pero el componente espera 'visit'
          priority: taskData.priority || 'medium',
          status: taskData.status as TaskDetails['status'],
          scheduledDate: taskData.scheduledDate,
          scheduledTime: taskData.scheduledTime,
          estimatedDuration: String(taskData.estimatedDuration || 60),
          description: taskData.description || '',
          specialInstructions: taskData.specialInstructions || undefined,
          contactMethod: taskData.contactMethod || 'phone',
          notes: taskData.specialInstructions || undefined,
          createdAt: taskData.createdAt,
          updatedAt: taskData.updatedAt,
        });
      } else {
        throw new Error(data.error || 'Error al cargar la tarea');
      }
    } catch (error) {
      logger.error('Error al cargar tarea', { error, taskId });
      setTask(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleStatusUpdate = async (newStatus: TaskDetails['status']) => {
    if (!task) {
      return;
    }

    setIsUpdating(true);
    try {
      const response = await fetch(`/api/runner/tasks/${taskId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          status: newStatus.toUpperCase(),
        }),
      });

      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

      if (data.success) {
        // Recargar la tarea para obtener los datos actualizados
        await loadTask();
        logger.info('Estado de tarea actualizado', { taskId, newStatus });
      } else {
        throw new Error(data.error || 'Error al actualizar la tarea');
      }
    } catch (error) {
      logger.error('Error al actualizar tarea', { error, taskId });
      alert('Error al actualizar el estado de la tarea. Por favor intente nuevamente.');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleAddNotes = async () => {
    if (!task || !updateNotes.trim()) {
      return;
    }

    setIsUpdating(true);
    try {
      const newNotes = task.notes
        ? `${task.notes}\n\n${new Date().toLocaleString('es-CL')}: ${updateNotes}`
        : `${new Date().toLocaleString('es-CL')}: ${updateNotes}`;

      const response = await fetch(`/api/runner/tasks/${taskId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          notes: newNotes,
        }),
      });

      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

      if (data.success) {
        // Recargar la tarea para obtener los datos actualizados
        await loadTask();
        setUpdateNotes('');
        setShowNotesForm(false);
        logger.info('Notas agregadas a tarea', { taskId });
      } else {
        throw new Error(data.error || 'Error al agregar las notas');
      }
    } catch (error) {
      logger.error('Error al agregar notas', { error, taskId });
      alert('Error al agregar las notas. Por favor intente nuevamente.');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleContactTenant = (method: 'phone' | 'whatsapp' | 'email') => {
    if (!task) {
      return;
    }

    switch (method) {
      case 'phone':
        window.open(`tel:${task.tenantPhone}`);
        break;
      case 'whatsapp':
        const message = encodeURIComponent(
          `Hola ${task.tenantName}, soy el runner asignado a tu propiedad. ¿Podemos coordinar la visita?`
        );
        window.open(`https://wa.me/${task.tenantPhone.replace('+', '')}?text=${message}`);
        break;
      case 'email':
        window.open(
          `mailto:${task.tenantEmail}?subject=Coordinación de Visita&body=Hola ${task.tenantName},%0A%0ASoy el runner asignado a tu propiedad. Me gustaría coordinar la visita programada.`
        );
        break;
    }

    logger.info('Contacto iniciado con inquilino', { taskId, method });
  };

  const handleBack = () => {
    router.push('/runner/tasks');
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="secondary">Pendiente</Badge>;
      case 'in_progress':
        return <Badge className="bg-blue-500">En Progreso</Badge>;
      case 'completed':
        return <Badge className="bg-green-500">Completada</Badge>;
      case 'cancelled':
        return <Badge variant="destructive">Cancelada</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'high':
        return <Badge variant="destructive">Alta</Badge>;
      case 'medium':
        return (
          <Badge variant="outline" className="text-yellow-600 border-yellow-600">
            Media
          </Badge>
        );
      case 'low':
        return (
          <Badge variant="outline" className="text-blue-600 border-blue-600">
            Baja
          </Badge>
        );
      case 'urgent':
        return <Badge variant="destructive">Urgente</Badge>;
      default:
        return <Badge variant="secondary">{priority}</Badge>;
    }
  };

  const getTaskTypeLabel = (type: string) => {
    switch (type) {
      case 'visit':
        return 'Visita';
      case 'maintenance':
        return 'Mantenimiento';
      case 'inspection':
        return 'Inspección';
      case 'delivery':
        return 'Entrega';
      case 'other':
        return 'Otro';
      default:
        return type;
    }
  };

  if (isLoading) {
    return (
      <UnifiedDashboardLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-2">Cargando tarea...</span>
        </div>
      </UnifiedDashboardLayout>
    );
  }

  if (!task) {
    return (
      <UnifiedDashboardLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <AlertTriangle className="w-16 h-16 text-red-600 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Tarea no encontrada</h2>
            <p className="text-gray-600 mb-4">La tarea solicitada no existe o ha sido eliminada.</p>
            <Button onClick={handleBack}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Volver a Tareas
            </Button>
          </div>
        </div>
      </UnifiedDashboardLayout>
    );
  }

  return (
    <UnifiedDashboardLayout>
      <div className="container mx-auto px-4 py-6">
        <div className="flex items-center gap-4 mb-6">
          <Button variant="outline" onClick={handleBack}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Volver
          </Button>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-gray-900">Tarea #{task.id}</h1>
            <p className="text-gray-600">
              {getTaskTypeLabel(task.taskType)} - {task.propertyAddress}
            </p>
          </div>
          <div className="flex gap-2">
            {getStatusBadge(task.status)}
            {getPriorityBadge(task.priority)}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Task Status and Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Estado y Acciones</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-sm text-gray-600">Estado actual</p>
                    {getStatusBadge(task.status)}
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    {(() => {
                      const statusLower = task.status?.toLowerCase() || '';
                      const isPending = statusLower === 'pending' || statusLower === 'scheduled' || statusLower === 'SCHEDULED'.toLowerCase();
                      return isPending && (
                        <Button
                          onClick={() => handleStatusUpdate('in_progress')}
                          disabled={isUpdating}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white"
                        >
                          <Clock className="w-4 h-4 mr-2" />
                          Iniciar Tarea
                        </Button>
                      );
                    })()}
                    {(() => {
                      const statusLower = task.status?.toLowerCase() || '';
                      const isInProgress = statusLower === 'in_progress' || statusLower === 'IN_PROGRESS'.toLowerCase();
                      return isInProgress && (
                        <>
                          <Button 
                            onClick={() => handleStatusUpdate('completed')} 
                            disabled={isUpdating}
                            className="bg-green-600 hover:bg-green-700 text-white"
                          >
                            <CheckCircle className="w-4 h-4 mr-2" />
                            Completar Tarea
                          </Button>
                          <Button
                            variant="outline"
                            onClick={() => router.push(`/runner/photos/upload?visitId=${task.id}`)}
                            className="border-emerald-600 text-emerald-600 hover:bg-emerald-50"
                          >
                            <Camera className="w-4 h-4 mr-2" />
                            Subir Fotos
                          </Button>
                        </>
                      );
                    })()}
                    {(() => {
                      const statusLower = task.status?.toLowerCase() || '';
                      const isCompleted = statusLower === 'completed' || statusLower === 'COMPLETED'.toLowerCase();
                      return isCompleted && (
                        <Button
                          variant="outline"
                          onClick={() => router.push(`/runner/photos?visitId=${task.id}`)}
                          className="border-purple-600 text-purple-600 hover:bg-purple-50"
                        >
                          <Camera className="w-4 h-4 mr-2" />
                          Ver Fotos
                        </Button>
                      );
                    })()}
                    {task.propertyId && (
                      <Button
                        variant="outline"
                        onClick={() => router.push(`/properties/${task.propertyId}`)}
                        className="border-blue-600 text-blue-600 hover:bg-blue-50"
                      >
                        <MapPin className="w-4 h-4 mr-2" />
                        Ver Propiedad
                      </Button>
                    )}
                  </div>
                </div>

                {/* Progress Timeline */}
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-3 h-3 rounded-full ${task.status !== 'pending' ? 'bg-green-500' : 'bg-gray-300'}`}
                    ></div>
                    <span
                      className={`text-sm ${task.status !== 'pending' ? 'text-green-600 font-medium' : 'text-gray-500'}`}
                    >
                      Creada - {new Date(task.createdAt).toLocaleString('es-CL')}
                    </span>
                  </div>
                  {task.actualStartTime && (
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-3 h-3 rounded-full ${['in_progress', 'completed'].includes(task.status) ? 'bg-green-500' : 'bg-gray-300'}`}
                      ></div>
                      <span
                        className={`text-sm ${['in_progress', 'completed'].includes(task.status) ? 'text-green-600 font-medium' : 'text-gray-500'}`}
                      >
                        Iniciada - {new Date(task.actualStartTime).toLocaleString('es-CL')}
                      </span>
                    </div>
                  )}
                  {task.actualEndTime && (
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-3 h-3 rounded-full ${task.status === 'completed' ? 'bg-green-500' : 'bg-gray-300'}`}
                      ></div>
                      <span
                        className={`text-sm ${task.status === 'completed' ? 'text-green-600 font-medium' : 'text-gray-500'}`}
                      >
                        Completada - {new Date(task.actualEndTime).toLocaleString('es-CL')}
                      </span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Task Description */}
            <Card>
              <CardHeader>
                <CardTitle>Descripción de la Tarea</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700 mb-4">{task.description}</p>

                {task.specialInstructions && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <h4 className="font-medium text-yellow-800 mb-2 flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4" />
                      Instrucciones Especiales
                    </h4>
                    <p className="text-yellow-700">{task.specialInstructions}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Notes */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  Notas y Observaciones
                </CardTitle>
              </CardHeader>
              <CardContent>
                {task.notes ? (
                  <div className="space-y-3">
                    {task.notes.split('\n\n').map((note, index) => (
                      <div key={index} className="bg-gray-50 rounded-lg p-3">
                        <p className="text-sm text-gray-700 whitespace-pre-line">{note}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-4">No hay notas registradas</p>
                )}

                {!showNotesForm ? (
                  <Button
                    variant="outline"
                    onClick={() => setShowNotesForm(true)}
                    className="w-full mt-4"
                  >
                    <MessageSquare className="w-4 h-4 mr-2" />
                    Agregar Nota
                  </Button>
                ) : (
                  <div className="mt-4 space-y-3">
                    <div>
                      <Label htmlFor="updateNotes">Nueva Nota</Label>
                      <Textarea
                        id="updateNotes"
                        value={updateNotes}
                        onChange={e => setUpdateNotes(e.target.value)}
                        placeholder="Agregar observaciones sobre la tarea..."
                        rows={3}
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button onClick={handleAddNotes} disabled={!updateNotes.trim() || isUpdating}>
                        <Send className="w-4 h-4 mr-2" />
                        Agregar Nota
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => {
                          setShowNotesForm(false);
                          setUpdateNotes('');
                        }}
                      >
                        Cancelar
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Property and Tenant Info */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="w-5 h-5" />
                  Información de la Propiedad
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h3 className="font-medium">{task.propertyAddress}</h3>
                </div>

                <div className="space-y-3">
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Inquilino</h4>
                    <div className="flex items-center gap-2 text-sm">
                      <User className="w-4 h-4 text-gray-600" />
                      <span>{task.tenantName}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600 mt-1">
                      <Phone className="w-4 h-4" />
                      <span>{task.tenantPhone}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Mail className="w-4 h-4" />
                      <span>{task.tenantEmail}</span>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleContactTenant('whatsapp')}
                      className="flex-1"
                    >
                      <MessageSquare className="w-4 h-4 mr-2" />
                      WhatsApp
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleContactTenant('phone')}
                      className="flex-1"
                    >
                      <Phone className="w-4 h-4 mr-2" />
                      Llamar
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Schedule Info */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="w-5 h-5" />
                  Programación
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="w-4 h-4 text-gray-600" />
                  <span>Fecha: {new Date(task.scheduledDate).toLocaleDateString('es-CL')}</span>
                </div>

                <div className="flex items-center gap-2 text-sm">
                  <Clock className="w-4 h-4 text-gray-600" />
                  <span>Hora: {task.scheduledTime}</span>
                </div>

                <div className="flex items-center gap-2 text-sm">
                  <Clock className="w-4 h-4 text-gray-600" />
                  <span>Duración estimada: {task.estimatedDuration} min</span>
                </div>

                <div className="pt-2 border-t">
                  <p className="text-xs text-gray-500">
                    Creada: {new Date(task.createdAt).toLocaleString('es-CL')}
                  </p>
                  <p className="text-xs text-gray-500">
                    Actualizada: {new Date(task.updatedAt).toLocaleString('es-CL')}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Task Details */}
            <Card>
              <CardHeader>
                <CardTitle>Detalles de la Tarea</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Tipo:</span>
                  <Badge variant="outline">{getTaskTypeLabel(task.taskType)}</Badge>
                </div>

                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Prioridad:</span>
                  {getPriorityBadge(task.priority)}
                </div>

                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Método de contacto:</span>
                  <span className="text-sm capitalize">{task.contactMethod}</span>
                </div>

                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Estado:</span>
                  {getStatusBadge(task.status)}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </UnifiedDashboardLayout>
  );
}

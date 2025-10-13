'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { logger } from '@/lib/logger-minimal';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import UnifiedDashboardLayout from '@/components/layout/UnifiedDashboardLayout';
import {
  ArrowLeft,
  Wrench,
  User,
  Calendar,
  DollarSign,
  AlertTriangle,
  CheckCircle,
  Clock,
  XCircle,
  MessageSquare,
  Save,
  Send,
  Phone,
  Mail,
} from 'lucide-react';
import { User as UserType } from '@/types';

interface MaintenanceRequest {
  id: string;
  title: string;
  description: string;
  category: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  status: 'OPEN' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED' | 'ASSIGNED' | 'SCHEDULED';
  estimatedCost?: number;
  actualCost?: number;
  requestedBy: string;
  requesterRole: string;
  assignedTo?: string;
  scheduledDate?: string;
  scheduledTime?: string;
  visitDuration?: number;
  visitNotes?: string;
  completedDate?: string;
  createdAt: string;
  updatedAt: string;
  images: string[];
  notes?: string;
  property: {
    id: string;
    title: string;
    address: string;
    city: string;
  };
  requester: {
    name: string;
    email: string;
  };
  assignedProvider?: {
    id: string;
    businessName: string;
    specialty: string;
    hourlyRate: number;
    user: {
      phone: string;
      email: string;
    };
  };
}

export default function BrokerMaintenanceDetailPage() {
  const router = useRouter();
  const params = useParams();
  const maintenanceId = params.id as string;

  const [user, setUser] = useState<UserType | null>(null);
  const [maintenanceRequest, setMaintenanceRequest] = useState<MaintenanceRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [comment, setComment] = useState('');
  const [statusUpdate, setStatusUpdate] = useState('');
  const [actualCost, setActualCost] = useState('');
  const [showAssignProvider, setShowAssignProvider] = useState(false);
  const [showScheduleVisit, setShowScheduleVisit] = useState(false);
  const [availableProviders, setAvailableProviders] = useState<any[]>([]);
  const [selectedProvider, setSelectedProvider] = useState('');
  const [visitData, setVisitData] = useState({
    scheduledDate: '',
    scheduledTime: '',
    estimatedDuration: 120,
    contactPerson: '',
    contactPhone: '',
    specialInstructions: '',
  });

  useEffect(() => {
    const loadUserData = async () => {
      try {
        const response = await fetch('/api/auth/me');
        if (response.ok) {
          const data = await response.json();
          setUser(data.user);
        }
      } catch (error) {
        logger.error('Error loading user data:', { error });
      }
    };

    loadUserData();
  }, []);

  useEffect(() => {
    if (user && maintenanceId) {
      loadMaintenanceRequest();
    }
  }, [user, maintenanceId]);

  const loadMaintenanceRequest = async () => {
    try {
      setLoading(true);
      // For now, simulate loading - in a real app this would fetch from API
      // const response = await fetch(`/api/maintenance/${maintenanceId}`);
      // const data = await response.json();
      // setMaintenanceRequest(data);

      // Mock data for demonstration
      setTimeout(() => {
        setMaintenanceRequest({
          id: maintenanceId,
          title: 'Reparación de grifería en baño principal',
          description:
            'El grifo del lavamanos tiene una fuga constante. Necesita reparación urgente.',
          category: 'plumbing',
          priority: 'HIGH',
          status: 'OPEN',
          estimatedCost: 45000,
          requestedBy: 'user-1',
          requesterRole: 'TENANT',
          createdAt: '2024-01-15T10:30:00Z',
          updatedAt: '2024-01-15T10:30:00Z',
          images: [],
          property: {
            id: 'prop-1',
            title: 'Departamento Las Condes',
            address: 'Av. Las Condes 1234',
            city: 'Santiago',
          },
          requester: {
            name: 'María González',
            email: 'maria@example.com',
          },
        });
        setLoading(false);
      }, 1000);
    } catch (error) {
      logger.error('Error loading maintenance request:', { error });
      setLoading(false);
    }
  };

  const handleUpdateStatus = async () => {
    if (!statusUpdate || !maintenanceRequest) {
      return;
    }

    try {
      setUpdating(true);
      // Mock API call - in real app this would update via API
      await new Promise(resolve => setTimeout(resolve, 1000));

      setMaintenanceRequest(prev =>
        prev
          ? {
              ...prev,
              status: statusUpdate as any,
              updatedAt: new Date().toISOString(),
            }
          : null
      );

      setStatusUpdate('');
      alert('Estado actualizado exitosamente');
    } catch (error) {
      logger.error('Error updating status:', { error });
      alert('Error al actualizar el estado');
    } finally {
      setUpdating(false);
    }
  };

  const handleUpdateCost = async () => {
    if (!actualCost || !maintenanceRequest) {
      return;
    }

    try {
      setUpdating(true);
      // Mock API call - in real app this would update via API
      await new Promise(resolve => setTimeout(resolve, 1000));

      setMaintenanceRequest(prev =>
        prev
          ? {
              ...prev,
              actualCost: parseInt(actualCost),
              updatedAt: new Date().toISOString(),
            }
          : null
      );

      setActualCost('');
      alert('Costo actualizado exitosamente');
    } catch (error) {
      logger.error('Error updating cost:', { error });
      alert('Error al actualizar el costo');
    } finally {
      setUpdating(false);
    }
  };

  const handleAddComment = async () => {
    if (!comment.trim()) {
      return;
    }

    try {
      setUpdating(true);
      // Mock API call - in real app this would add comment via API
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Update the request with new notes
      setMaintenanceRequest(prev =>
        prev
          ? {
              ...prev,
              notes: (prev.notes || '') + `\n[${new Date().toLocaleString()}]: ${comment}`,
              updatedAt: new Date().toISOString(),
            }
          : null
      );

      setComment('');
      alert('Comentario agregado exitosamente');
    } catch (error) {
      logger.error('Error adding comment:', { error });
      alert('Error al agregar comentario');
    } finally {
      setUpdating(false);
    }
  };

  const handleAssignContractor = async () => {
    if (!maintenanceRequest) {
      return;
    }

    try {
      setUpdating(true);
      const response = await fetch(`/api/maintenance/${maintenanceId}/available-providers`);
      if (response.ok) {
        const data = await response.json();
        setAvailableProviders(data.availableProviders);
        setShowAssignProvider(true);
      } else {
        alert('Error al cargar prestadores disponibles');
      }
    } catch (error) {
      logger.error('Error loading available providers:', { error });
      alert('Error al cargar prestadores disponibles');
    } finally {
      setUpdating(false);
    }
  };

  const handleContactRequester = () => {
    if (!maintenanceRequest) {
      return;
    }

    // Store contact info in sessionStorage for messaging
    sessionStorage.setItem(
      'newMessageRecipient',
      JSON.stringify({
        id: maintenanceRequest.requestedBy,
        name: maintenanceRequest.requester.name,
        email: maintenanceRequest.requester.email,
        type: 'maintenance_requester',
        propertyTitle: maintenanceRequest.property.title,
      })
    );

    router.push('/broker/messages?new=true');
  };

  const handleScheduleVisit = async () => {
    if (!maintenanceRequest?.assignedProvider) {
      alert('Debe asignar un prestador antes de programar la visita');
      return;
    }

    // Pre-llenar datos de contacto
    setVisitData(prev => ({
      ...prev,
      contactPerson: maintenanceRequest.requester.name,
      contactPhone: maintenanceRequest.requester.email, // Usar email como fallback
    }));

    setShowScheduleVisit(true);
  };

  const handleConfirmProviderAssignment = async () => {
    if (!selectedProvider) {
      alert('Por favor selecciona un prestador');
      return;
    }

    try {
      setUpdating(true);
      const response = await fetch(`/api/maintenance/${maintenanceId}/assign-provider`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          providerId: selectedProvider,
          notes: `Asignado por ${user?.name || 'Corredor'}`,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setMaintenanceRequest(prev =>
          prev
            ? {
                ...prev,
                status: 'ASSIGNED',
                assignedProvider: data.maintenance.maintenanceProvider,
                updatedAt: new Date().toISOString(),
              }
            : null
        );
        setShowAssignProvider(false);
        setSelectedProvider('');
        alert('Prestador asignado exitosamente');
      } else {
        const error = await response.json();
        alert(`Error: ${error.error || 'Error al asignar prestador'}`);
      }
    } catch (error) {
      logger.error('Error assigning provider:', { error });
      alert('Error al asignar prestador');
    } finally {
      setUpdating(false);
    }
  };

  const handleConfirmVisitSchedule = async () => {
    if (!visitData.scheduledDate || !visitData.scheduledTime) {
      alert('Fecha y hora son obligatorios');
      return;
    }

    try {
      setUpdating(true);
      const response = await fetch(`/api/maintenance/${maintenanceId}/schedule-visit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          providerId: maintenanceRequest?.assignedProvider?.id,
          ...visitData,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setMaintenanceRequest(prev =>
          prev
            ? {
                ...prev,
                status: 'SCHEDULED',
                scheduledDate: visitData.scheduledDate,
                updatedAt: new Date().toISOString(),
              }
            : null
        );
        setShowScheduleVisit(false);
        setVisitData({
          scheduledDate: '',
          scheduledTime: '',
          estimatedDuration: 120,
          contactPerson: '',
          contactPhone: '',
          specialInstructions: '',
        });
        alert('Visita programada exitosamente');
      } else {
        const error = await response.json();
        alert(`Error: ${error.error || 'Error al programar visita'}`);
      }
    } catch (error) {
      logger.error('Error scheduling visit:', { error });
      alert('Error al programar visita');
    } finally {
      setUpdating(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'OPEN':
        return <Badge className="bg-blue-100 text-blue-800">Abierto</Badge>;
      case 'ASSIGNED':
        return <Badge className="bg-purple-100 text-purple-800">Prestador Asignado</Badge>;
      case 'SCHEDULED':
        return <Badge className="bg-indigo-100 text-indigo-800">Visita Programada</Badge>;
      case 'IN_PROGRESS':
        return <Badge className="bg-yellow-100 text-yellow-800">En Progreso</Badge>;
      case 'COMPLETED':
        return <Badge className="bg-green-100 text-green-800">Completado</Badge>;
      case 'CANCELLED':
        return <Badge className="bg-red-100 text-red-800">Cancelado</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800">{status}</Badge>;
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'LOW':
        return <Badge className="bg-gray-100 text-gray-800">Baja</Badge>;
      case 'MEDIUM':
        return <Badge className="bg-blue-100 text-blue-800">Media</Badge>;
      case 'HIGH':
        return <Badge className="bg-orange-100 text-orange-800">Alta</Badge>;
      case 'URGENT':
        return <Badge className="bg-red-100 text-red-800">Urgente</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800">{priority}</Badge>;
    }
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'URGENT':
        return <AlertTriangle className="w-5 h-5 text-red-500" />;
      case 'HIGH':
        return <AlertTriangle className="w-5 h-5 text-orange-500" />;
      case 'MEDIUM':
        return <Clock className="w-5 h-5 text-blue-500" />;
      default:
        return <CheckCircle className="w-5 h-5 text-gray-500" />;
    }
  };

  if (loading || !maintenanceRequest) {
    return (
      <UnifiedDashboardLayout title="Detalles de Mantenimiento" subtitle="Cargando...">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </UnifiedDashboardLayout>
    );
  }

  return (
    <UnifiedDashboardLayout
      title="Detalles de Mantenimiento"
      subtitle={`Solicitud #${maintenanceRequest.id}`}
    >
      <div className="container mx-auto px-4 py-6">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="flex items-center gap-4 mb-6">
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push('/broker/maintenance')}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Volver
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{maintenanceRequest.title}</h1>
              <p className="text-gray-600">Propiedad: {maintenanceRequest.property.title}</p>
            </div>
          </div>

          <div className="grid lg:grid-cols-3 gap-6">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Request Details */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Wrench className="w-5 h-5" />
                    Detalles de la Solicitud
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm font-medium">Prioridad</Label>
                      <div className="flex items-center gap-2 mt-1">
                        {getPriorityIcon(maintenanceRequest.priority)}
                        {getPriorityBadge(maintenanceRequest.priority)}
                      </div>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Estado</Label>
                      <div className="mt-1">{getStatusBadge(maintenanceRequest.status)}</div>
                    </div>
                  </div>

                  <div>
                    <Label className="text-sm font-medium">Categoría</Label>
                    <p className="mt-1 capitalize">
                      {maintenanceRequest.category.replace('_', ' ')}
                    </p>
                  </div>

                  <div>
                    <Label className="text-sm font-medium">Descripción</Label>
                    <p className="mt-1 text-gray-700">{maintenanceRequest.description}</p>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm font-medium">Costo Estimado</Label>
                      <p className="mt-1 font-medium">
                        {maintenanceRequest.estimatedCost
                          ? `$${maintenanceRequest.estimatedCost.toLocaleString()}`
                          : 'No especificado'}
                      </p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Costo Real</Label>
                      <p className="mt-1 font-medium">
                        {maintenanceRequest.actualCost
                          ? `$${maintenanceRequest.actualCost.toLocaleString()}`
                          : 'Pendiente'}
                      </p>
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm font-medium">Fecha de Creación</Label>
                      <p className="mt-1">
                        {new Date(maintenanceRequest.createdAt).toLocaleString('es-CL')}
                      </p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Última Actualización</Label>
                      <p className="mt-1">
                        {new Date(maintenanceRequest.updatedAt).toLocaleString('es-CL')}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Images */}
              {maintenanceRequest.images && maintenanceRequest.images.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Imágenes Adjuntas</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      {maintenanceRequest.images.map((image, index) => (
                        <img
                          key={index}
                          src={image}
                          alt={`Imagen ${index + 1}`}
                          className="w-full h-32 object-cover rounded-lg cursor-pointer hover:opacity-80"
                          onClick={() => window.open(image, '_blank')}
                        />
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Notes/Comments */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MessageSquare className="w-5 h-5" />
                    Notas y Comentarios
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {maintenanceRequest.notes && (
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <pre className="text-sm whitespace-pre-wrap">{maintenanceRequest.notes}</pre>
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="comment">Agregar comentario</Label>
                    <Textarea
                      id="comment"
                      placeholder="Escribe un comentario..."
                      value={comment}
                      onChange={e => setComment(e.target.value)}
                    />
                    <Button
                      onClick={handleAddComment}
                      disabled={!comment.trim() || updating}
                      size="sm"
                    >
                      <Send className="w-4 h-4 mr-2" />
                      Agregar Comentario
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Property Info */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Propiedad</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <h4 className="font-medium">{maintenanceRequest.property.title}</h4>
                    <p className="text-sm text-gray-600">{maintenanceRequest.property.address}</p>
                    <p className="text-sm text-gray-600">{maintenanceRequest.property.city}</p>
                  </div>
                </CardContent>
              </Card>

              {/* Requester Info */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <User className="w-4 h-4" />
                    Solicitante
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <h4 className="font-medium">{maintenanceRequest.requester.name}</h4>
                    <p className="text-sm text-gray-600">{maintenanceRequest.requester.email}</p>
                    <Badge className="text-xs">
                      {maintenanceRequest.requesterRole === 'OWNER'
                        ? 'Propietario'
                        : maintenanceRequest.requesterRole === 'TENANT'
                          ? 'Inquilino'
                          : maintenanceRequest.requesterRole === 'BROKER'
                            ? 'Corredor'
                            : 'Admin'}
                    </Badge>
                  </div>
                  <div className="mt-4 space-y-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full"
                      onClick={handleContactRequester}
                    >
                      <Mail className="w-4 h-4 mr-2" />
                      Contactar
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Actions */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Acciones</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {/* Status Update */}
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Actualizar Estado</Label>
                    <Select value={statusUpdate} onValueChange={setStatusUpdate}>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar estado" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="OPEN">Abierto</SelectItem>
                        <SelectItem value="IN_PROGRESS">En Progreso</SelectItem>
                        <SelectItem value="COMPLETED">Completado</SelectItem>
                        <SelectItem value="CANCELLED">Cancelado</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button
                      onClick={handleUpdateStatus}
                      disabled={!statusUpdate || updating}
                      size="sm"
                      className="w-full"
                    >
                      <Save className="w-4 h-4 mr-2" />
                      Actualizar Estado
                    </Button>
                  </div>

                  {/* Cost Update */}
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Actualizar Costo Real</Label>
                    <Input
                      type="number"
                      placeholder="Costo en CLP"
                      value={actualCost}
                      onChange={e => setActualCost(e.target.value)}
                    />
                    <Button
                      onClick={handleUpdateCost}
                      disabled={!actualCost || updating}
                      size="sm"
                      className="w-full"
                      variant="outline"
                    >
                      <DollarSign className="w-4 h-4 mr-2" />
                      Actualizar Costo
                    </Button>
                  </div>

                  {/* Other Actions */}
                  <div className="space-y-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full"
                      onClick={handleAssignContractor}
                    >
                      <Wrench className="w-4 h-4 mr-2" />
                      Asignar Prestador
                    </Button>

                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full"
                      onClick={handleScheduleVisit}
                    >
                      <Calendar className="w-4 h-4 mr-2" />
                      Agendar Visita
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>

      {/* Modal para asignar prestador */}
      <Dialog open={showAssignProvider} onOpenChange={setShowAssignProvider}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Asignar Prestador de Servicios</DialogTitle>
            <DialogDescription>
              Selecciona un prestador disponible para esta solicitud de mantenimiento.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {availableProviders.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-600">No hay prestadores disponibles en este momento.</p>
              </div>
            ) : (
              <RadioGroup value={selectedProvider} onValueChange={setSelectedProvider}>
                <div className="space-y-3">
                  {availableProviders.map(provider => (
                    <div
                      key={provider.id}
                      className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                        selectedProvider === provider.id
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      onClick={() => setSelectedProvider(provider.id)}
                    >
                      <div className="flex items-start space-x-3">
                        <RadioGroupItem value={provider.id} className="mt-1" />
                        <div className="flex-1">
                          <div className="flex items-start justify-between">
                            <div>
                              <h4 className="font-medium text-gray-900">{provider.businessName}</h4>
                              <p className="text-sm text-gray-600">
                                {provider.specialty} • {provider.distance}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="font-medium text-green-600">
                                ${provider.hourlyRate}/hora
                              </p>
                              <p className="text-sm text-gray-600">
                                Est. ${provider.estimatedCost}
                              </p>
                            </div>
                          </div>

                          <div className="mt-2 flex items-center space-x-4 text-sm text-gray-600">
                            <span>
                              ⭐ {provider.rating.toFixed(1)} ({provider.totalRatings})
                            </span>
                            <span>📞 {provider.user.phone}</span>
                            <span>✅ {provider.completedJobs} trabajos</span>
                            <span>⏱️ {provider.responseTime}h respuesta</span>
                          </div>

                          {provider.description && (
                            <p className="mt-2 text-sm text-gray-700">{provider.description}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </RadioGroup>
            )}
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <Button variant="outline" onClick={() => setShowAssignProvider(false)}>
              Cancelar
            </Button>
            <Button
              onClick={handleConfirmProviderAssignment}
              disabled={!selectedProvider || updating}
            >
              {updating ? 'Asignando...' : 'Asignar Prestador'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal para programar visita */}
      <Dialog open={showScheduleVisit} onOpenChange={setShowScheduleVisit}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Programar Visita de Mantenimiento</DialogTitle>
            <DialogDescription>
              Programa la fecha y hora para la visita del prestador asignado.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="scheduledDate">Fecha de Visita</Label>
              <Input
                id="scheduledDate"
                type="date"
                value={visitData.scheduledDate}
                onChange={e => setVisitData(prev => ({ ...prev, scheduledDate: e.target.value }))}
                min={new Date().toISOString().split('T')[0]}
              />
            </div>

            <div>
              <Label htmlFor="scheduledTime">Hora de Visita</Label>
              <Input
                id="scheduledTime"
                type="time"
                value={visitData.scheduledTime}
                onChange={e => setVisitData(prev => ({ ...prev, scheduledTime: e.target.value }))}
              />
            </div>

            <div>
              <Label htmlFor="estimatedDuration">Duración Estimada (minutos)</Label>
              <Input
                id="estimatedDuration"
                type="number"
                value={visitData.estimatedDuration}
                onChange={e =>
                  setVisitData(prev => ({
                    ...prev,
                    estimatedDuration: parseInt(e.target.value) || 120,
                  }))
                }
                min="30"
                max="480"
              />
            </div>

            <div>
              <Label htmlFor="contactPerson">Persona de Contacto</Label>
              <Input
                id="contactPerson"
                value={visitData.contactPerson}
                onChange={e => setVisitData(prev => ({ ...prev, contactPerson: e.target.value }))}
                placeholder="Nombre de la persona a contactar"
              />
            </div>

            <div>
              <Label htmlFor="contactPhone">Teléfono de Contacto</Label>
              <Input
                id="contactPhone"
                value={visitData.contactPhone}
                onChange={e => setVisitData(prev => ({ ...prev, contactPhone: e.target.value }))}
                placeholder="Número telefónico"
              />
            </div>

            <div>
              <Label htmlFor="specialInstructions">Instrucciones Especiales</Label>
              <Textarea
                id="specialInstructions"
                value={visitData.specialInstructions}
                onChange={e =>
                  setVisitData(prev => ({ ...prev, specialInstructions: e.target.value }))
                }
                placeholder="Instrucciones adicionales para el prestador..."
                rows={3}
              />
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <Button variant="outline" onClick={() => setShowScheduleVisit(false)}>
              Cancelar
            </Button>
            <Button
              onClick={handleConfirmVisitSchedule}
              disabled={!visitData.scheduledDate || !visitData.scheduledTime || updating}
            >
              {updating ? 'Programando...' : 'Programar Visita'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </UnifiedDashboardLayout>
  );
}

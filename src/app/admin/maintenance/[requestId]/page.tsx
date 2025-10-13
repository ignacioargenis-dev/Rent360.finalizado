'use client';

// Forzar renderizado dinámico para evitar prerendering de páginas protegidas
export const dynamic = 'force-dynamic';


import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  ArrowLeft,
  MapPin,
  User,
  Phone,
  Mail,
  Calendar,
  Clock,
  AlertTriangle,
  CheckCircle,
  UserCheck,
  MessageSquare,
  Send,
  FileText,
} from 'lucide-react';
import UnifiedDashboardLayout from '@/components/layout/UnifiedDashboardLayout';
import { useAuth } from '@/components/auth/AuthProviderSimple';
import { logger } from '@/lib/logger-minimal';

interface MaintenanceRequest {
  id: string;
  propertyId: string;
  propertyAddress: string;
  propertyOwnerName: string;
  propertyOwnerEmail: string;
  propertyOwnerPhone: string;
  tenantName?: string;
  tenantEmail?: string;
  tenantPhone?: string;
  title: string;
  description: string;
  category: 'plumbing' | 'electrical' | 'structural' | 'painting' | 'cleaning' | 'other';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'pending' | 'assigned' | 'in_progress' | 'completed' | 'cancelled';
  urgency: 'low' | 'medium' | 'high' | 'critical';
  reportedDate: string;
  preferredDate?: string;
  estimatedCost?: number;
  assignedProvider?: {
    id: string;
    name: string;
    email: string;
    phone: string;
    rating: number;
    specializations: string[];
  };
  assignedDate?: string;
  completedDate?: string;
  notes: string[];
  attachments?: string[];
  createdAt: string;
  updatedAt: string;
}

interface Provider {
  id: string;
  name: string;
  email: string;
  phone: string;
  rating: number;
  specializations: string[];
  availability: 'available' | 'busy' | 'unavailable';
  responseTime: string;
}

export default function MaintenanceRequestDetailPage() {
  const router = useRouter();
  const params = useParams();
  const requestId = params.requestId as string;
  const { user } = useAuth();

  const [request, setRequest] = useState<MaintenanceRequest | null>(null);
  const [providers, setProviders] = useState<Provider[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [showAssignDialog, setShowAssignDialog] = useState(false);
  const [selectedProviderId, setSelectedProviderId] = useState('');
  const [newNote, setNewNote] = useState('');
  const [showNotesForm, setShowNotesForm] = useState(false);

  // Mock request data
  const mockRequest: MaintenanceRequest = {
    id: requestId,
    propertyId: '1',
    propertyAddress: 'Av. Providencia 1234, Las Condes, Santiago',
    propertyOwnerName: 'Carlos Martínez',
    propertyOwnerEmail: 'carlos@email.com',
    propertyOwnerPhone: '+56912345678',
    tenantName: 'María González',
    tenantEmail: 'maria@email.com',
    tenantPhone: '+56987654321',
    title: 'Fuga en grifería del baño principal',
    description:
      'Hay una fuga constante en el grifo del lavamanos del baño principal. El agua gotea continuamente causando aumento en la cuenta del agua.',
    category: 'plumbing',
    priority: 'high',
    status: 'pending',
    urgency: 'medium',
    reportedDate: '2024-12-10',
    preferredDate: '2024-12-15',
    estimatedCost: 35000,
    notes: [
      '2024-12-10 09:30: Solicitud creada por inquilino María González',
      '2024-12-10 10:15: Verificada la urgencia del problema',
    ],
    createdAt: '2024-12-10T09:30:00Z',
    updatedAt: '2024-12-10T10:15:00Z',
  };

  // Mock providers data
  const mockProviders: Provider[] = [
    {
      id: '1',
      name: 'Fontanería Express',
      email: 'contacto@fontaneriaexpress.cl',
      phone: '+56911111111',
      rating: 4.8,
      specializations: ['plumbing', 'electrical'],
      availability: 'available',
      responseTime: '2 horas',
    },
    {
      id: '2',
      name: 'Servicios Eléctricos Ltda',
      email: 'contacto@electricos.cl',
      phone: '+56922222222',
      rating: 4.6,
      specializations: ['electrical'],
      availability: 'available',
      responseTime: '4 horas',
    },
    {
      id: '3',
      name: 'Reparaciones Rápidas',
      email: 'contacto@reparaciones.cl',
      phone: '+56933333333',
      rating: 4.4,
      specializations: ['plumbing', 'painting', 'cleaning'],
      availability: 'busy',
      responseTime: '6 horas',
    },
  ];

  useEffect(() => {
    loadRequest();
    loadProviders();
  }, [requestId]);

  const loadRequest = async () => {
    try {
      // Simular API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      setRequest(mockRequest);
    } catch (error) {
      logger.error('Error al cargar solicitud de mantenimiento', { error, requestId });
    } finally {
      setIsLoading(false);
    }
  };

  const loadProviders = async () => {
    try {
      // Simular API call
      await new Promise(resolve => setTimeout(resolve, 500));
      setProviders(mockProviders);
    } catch (error) {
      logger.error('Error al cargar proveedores', { error });
    }
  };

  const handleAssignProvider = async () => {
    if (!request || !selectedProviderId) {
      return;
    }

    setIsUpdating(true);
    try {
      // Simular API call
      await new Promise(resolve => setTimeout(resolve, 1500));

      const provider = providers.find(p => p.id === selectedProviderId);
      if (provider) {
        setRequest(prev =>
          prev
            ? {
                ...prev,
                status: 'assigned',
                assignedProvider: {
                  id: provider.id,
                  name: provider.name,
                  email: provider.email,
                  phone: provider.phone,
                  rating: provider.rating,
                  specializations: provider.specializations,
                },
                assignedDate: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
              }
            : null
        );
      }

      setShowAssignDialog(false);
      setSelectedProviderId('');

      logger.info('Proveedor asignado a solicitud', { requestId, providerId: selectedProviderId });
    } catch (error) {
      logger.error('Error al asignar proveedor', {
        error,
        requestId,
        providerId: selectedProviderId,
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleStatusUpdate = async (newStatus: MaintenanceRequest['status']) => {
    if (!request) {
      return;
    }

    setIsUpdating(true);
    try {
      // Simular API call
      await new Promise(resolve => setTimeout(resolve, 1000));

      const updates: Partial<MaintenanceRequest> = {
        status: newStatus,
        updatedAt: new Date().toISOString(),
      };

      if (newStatus === 'completed') {
        updates.completedDate = new Date().toISOString();
      }

      setRequest(prev => (prev ? { ...prev, ...updates } : null));

      logger.info('Estado de solicitud actualizado', { requestId, newStatus });
    } catch (error) {
      logger.error('Error al actualizar estado', { error, requestId });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleAddNote = async () => {
    if (!request || !newNote.trim()) {
      return;
    }

    setIsUpdating(true);
    try {
      // Simular API call
      await new Promise(resolve => setTimeout(resolve, 1000));

      const note = `${new Date().toLocaleString('es-CL')}: ${newNote}`;
      setRequest(prev =>
        prev
          ? {
              ...prev,
              notes: [...prev.notes, note],
              updatedAt: new Date().toISOString(),
            }
          : null
      );

      setNewNote('');
      setShowNotesForm(false);

      logger.info('Nota agregada a solicitud', { requestId });
    } catch (error) {
      logger.error('Error al agregar nota', { error, requestId });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleContactUser = (
    userType: 'owner' | 'tenant' | 'provider',
    method: 'email' | 'phone'
  ) => {
    if (!request) {
      return;
    }

    let contactInfo = { email: '', phone: '', name: '' };

    switch (userType) {
      case 'owner':
        contactInfo = {
          email: request.propertyOwnerEmail,
          phone: request.propertyOwnerPhone,
          name: request.propertyOwnerName,
        };
        break;
      case 'tenant':
        if (request.tenantEmail && request.tenantPhone && request.tenantName) {
          contactInfo = {
            email: request.tenantEmail,
            phone: request.tenantPhone,
            name: request.tenantName,
          };
        }
        break;
      case 'provider':
        if (request.assignedProvider) {
          contactInfo = {
            email: request.assignedProvider.email,
            phone: request.assignedProvider.phone,
            name: request.assignedProvider.name,
          };
        }
        break;
    }

    if (method === 'email') {
      window.open(
        `mailto:${contactInfo.email}?subject=Solicitud de Mantenimiento ${request.id}&body=Hola ${contactInfo.name},`
      );
    } else {
      window.open(`tel:${contactInfo.phone}`);
    }

    logger.info('Contacto iniciado', { requestId, userType, method });
  };

  const handleBack = () => {
    router.push('/admin/maintenance');
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="secondary">Pendiente</Badge>;
      case 'assigned':
        return (
          <Badge variant="outline" className="text-blue-600 border-blue-600">
            Asignada
          </Badge>
        );
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

  const getUrgencyBadge = (urgency: string) => {
    switch (urgency) {
      case 'critical':
        return <Badge variant="destructive">Crítica</Badge>;
      case 'high':
        return <Badge variant="destructive">Alta</Badge>;
      case 'medium':
        return (
          <Badge variant="outline" className="text-orange-600 border-orange-600">
            Media
          </Badge>
        );
      case 'low':
        return (
          <Badge variant="outline" className="text-blue-600 border-blue-600">
            Baja
          </Badge>
        );
      default:
        return <Badge variant="secondary">{urgency}</Badge>;
    }
  };

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case 'plumbing':
        return 'Fontanería';
      case 'electrical':
        return 'Eléctrica';
      case 'structural':
        return 'Estructural';
      case 'painting':
        return 'Pintura';
      case 'cleaning':
        return 'Limpieza';
      case 'other':
        return 'Otro';
      default:
        return category;
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
    }).format(amount);
  };

  if (isLoading) {
    return (
      <UnifiedDashboardLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-2">Cargando solicitud...</span>
        </div>
      </UnifiedDashboardLayout>
    );
  }

  if (!request) {
    return (
      <UnifiedDashboardLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <AlertTriangle className="w-16 h-16 text-red-600 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Solicitud no encontrada</h2>
            <p className="text-gray-600 mb-4">
              La solicitud de mantenimiento solicitada no existe.
            </p>
            <Button onClick={handleBack}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Volver
            </Button>
          </div>
        </div>
      </UnifiedDashboardLayout>
    );
  }

  return (
    <UnifiedDashboardLayout>
      <div className="container mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Button variant="outline" onClick={handleBack}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Volver
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Solicitud #{request.id}</h1>
              <p className="text-gray-600">{request.title}</p>
            </div>
          </div>
          <div className="flex gap-2">
            {getStatusBadge(request.status)}
            {getPriorityBadge(request.priority)}
            {getUrgencyBadge(request.urgency)}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Request Details */}
            <Card>
              <CardHeader>
                <CardTitle>Detalles de la Solicitud</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h3 className="font-medium text-lg mb-2">{request.title}</h3>
                  <p className="text-gray-700">{request.description}</p>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <Label className="text-sm text-gray-600">Categoría</Label>
                    <p className="font-medium">{getCategoryLabel(request.category)}</p>
                  </div>
                  <div>
                    <Label className="text-sm text-gray-600">Fecha Reporte</Label>
                    <p className="font-medium">
                      {new Date(request.reportedDate).toLocaleDateString('es-CL')}
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm text-gray-600">Fecha Preferida</Label>
                    <p className="font-medium">
                      {request.preferredDate
                        ? new Date(request.preferredDate).toLocaleDateString('es-CL')
                        : 'No especificada'}
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm text-gray-600">Costo Estimado</Label>
                    <p className="font-medium text-green-600">
                      {request.estimatedCost
                        ? formatCurrency(request.estimatedCost)
                        : 'No estimado'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Assigned Provider */}
            {request.assignedProvider && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <UserCheck className="w-5 h-5" />
                    Proveedor Asignado
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium">{request.assignedProvider.name}</h3>
                      <p className="text-sm text-gray-600">
                        Rating: {request.assignedProvider.rating.toFixed(1)} ⭐
                      </p>
                      <p className="text-sm text-gray-600">
                        Especialidades:{' '}
                        {request.assignedProvider.specializations
                          .map(s => getCategoryLabel(s))
                          .join(', ')}
                      </p>
                      {request.assignedDate && (
                        <p className="text-xs text-gray-500 mt-1">
                          Asignado: {new Date(request.assignedDate).toLocaleString('es-CL')}
                        </p>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleContactUser('provider', 'email')}
                      >
                        <Mail className="w-4 h-4 mr-2" />
                        Email
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleContactUser('provider', 'phone')}
                      >
                        <Phone className="w-4 h-4 mr-2" />
                        Llamar
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Status Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Acciones</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-3">
                  {request.status === 'pending' && (
                    <Dialog open={showAssignDialog} onOpenChange={setShowAssignDialog}>
                      <DialogTrigger asChild>
                        <Button>
                          <UserCheck className="w-4 h-4 mr-2" />
                          Asignar Proveedor
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Asignar Proveedor</DialogTitle>
                          <DialogDescription>
                            Selecciona un proveedor disponible para esta solicitud de mantenimiento.
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div>
                            <Label htmlFor="provider">Proveedor</Label>
                            <Select
                              value={selectedProviderId}
                              onValueChange={setSelectedProviderId}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Seleccionar proveedor" />
                              </SelectTrigger>
                              <SelectContent>
                                {providers
                                  .filter(p => p.specializations.includes(request.category))
                                  .map(provider => (
                                    <SelectItem key={provider.id} value={provider.id}>
                                      <div>
                                        <div className="font-medium">{provider.name}</div>
                                        <div className="text-sm text-gray-600">
                                          Rating: {provider.rating.toFixed(1)} •{' '}
                                          {provider.responseTime}
                                        </div>
                                      </div>
                                    </SelectItem>
                                  ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="flex justify-end gap-2">
                            <Button variant="outline" onClick={() => setShowAssignDialog(false)}>
                              Cancelar
                            </Button>
                            <Button
                              onClick={handleAssignProvider}
                              disabled={!selectedProviderId || isUpdating}
                            >
                              Asignar Proveedor
                            </Button>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                  )}

                  {request.status === 'assigned' && (
                    <Button onClick={() => handleStatusUpdate('in_progress')} disabled={isUpdating}>
                      <Clock className="w-4 h-4 mr-2" />
                      Iniciar Trabajo
                    </Button>
                  )}

                  {request.status === 'in_progress' && (
                    <Button onClick={() => handleStatusUpdate('completed')} disabled={isUpdating}>
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Marcar Completada
                    </Button>
                  )}

                  {request.status !== 'completed' && request.status !== 'cancelled' && (
                    <Button
                      variant="outline"
                      onClick={() => handleStatusUpdate('cancelled')}
                      disabled={isUpdating}
                    >
                      Cancelar Solicitud
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Notes */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  Notas y Comentarios
                </CardTitle>
              </CardHeader>
              <CardContent>
                {request.notes.length > 0 ? (
                  <div className="space-y-3 mb-4">
                    {request.notes.map((note, index) => (
                      <div key={index} className="bg-gray-50 rounded-lg p-3">
                        <p className="text-sm text-gray-700">{note}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 mb-4">No hay notas registradas</p>
                )}

                {!showNotesForm ? (
                  <Button variant="outline" onClick={() => setShowNotesForm(true)}>
                    <MessageSquare className="w-4 h-4 mr-2" />
                    Agregar Nota
                  </Button>
                ) : (
                  <div className="space-y-3">
                    <div>
                      <Label htmlFor="newNote">Nueva Nota</Label>
                      <Textarea
                        id="newNote"
                        value={newNote}
                        onChange={e => setNewNote(e.target.value)}
                        placeholder="Agregar comentario sobre la solicitud..."
                        rows={3}
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button onClick={handleAddNote} disabled={!newNote.trim() || isUpdating}>
                        <Send className="w-4 h-4 mr-2" />
                        Agregar Nota
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => {
                          setShowNotesForm(false);
                          setNewNote('');
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
            {/* Property Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="w-5 h-5" />
                  Información de la Propiedad
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h3 className="font-medium">{request.propertyAddress}</h3>
                </div>

                <div className="space-y-3">
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Propietario</h4>
                    <div className="flex items-center gap-2 text-sm">
                      <User className="w-4 h-4 text-gray-600" />
                      <span>{request.propertyOwnerName}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600 mt-1">
                      <Mail className="w-4 h-4" />
                      <span>{request.propertyOwnerEmail}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Phone className="w-4 h-4" />
                      <span>{request.propertyOwnerPhone}</span>
                    </div>
                    <div className="flex gap-2 mt-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleContactUser('owner', 'email')}
                        className="flex-1"
                      >
                        <Mail className="w-4 h-4 mr-2" />
                        Email
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleContactUser('owner', 'phone')}
                        className="flex-1"
                      >
                        <Phone className="w-4 h-4 mr-2" />
                        Llamar
                      </Button>
                    </div>
                  </div>

                  {request.tenantName && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 mb-2">Inquilino</h4>
                      <div className="flex items-center gap-2 text-sm">
                        <User className="w-4 h-4 text-gray-600" />
                        <span>{request.tenantName}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600 mt-1">
                        <Mail className="w-4 h-4" />
                        <span>{request.tenantEmail}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Phone className="w-4 h-4" />
                        <span>{request.tenantPhone}</span>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Request Timeline */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="w-5 h-5" />
                  Cronología
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-blue-600 rounded-full mt-2"></div>
                    <div>
                      <p className="text-sm font-medium">Solicitud Creada</p>
                      <p className="text-xs text-gray-500">
                        {new Date(request.createdAt).toLocaleString('es-CL')}
                      </p>
                    </div>
                  </div>

                  {request.assignedDate && (
                    <div className="flex items-start gap-3">
                      <div className="w-2 h-2 bg-green-600 rounded-full mt-2"></div>
                      <div>
                        <p className="text-sm font-medium">Proveedor Asignado</p>
                        <p className="text-xs text-gray-500">
                          {new Date(request.assignedDate).toLocaleString('es-CL')}
                        </p>
                      </div>
                    </div>
                  )}

                  {request.completedDate && (
                    <div className="flex items-start gap-3">
                      <div className="w-2 h-2 bg-green-600 rounded-full mt-2"></div>
                      <div>
                        <p className="text-sm font-medium">Trabajo Completado</p>
                        <p className="text-xs text-gray-500">
                          {new Date(request.completedDate).toLocaleString('es-CL')}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Request Details */}
            <Card>
              <CardHeader>
                <CardTitle>Detalles</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">ID:</span>
                  <span className="text-sm font-mono">{request.id}</span>
                </div>

                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Estado:</span>
                  {getStatusBadge(request.status)}
                </div>

                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Prioridad:</span>
                  {getPriorityBadge(request.priority)}
                </div>

                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Urgencia:</span>
                  {getUrgencyBadge(request.urgency)}
                </div>

                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Categoría:</span>
                  <span className="text-sm">{getCategoryLabel(request.category)}</span>
                </div>

                <div className="pt-2 border-t">
                  <p className="text-xs text-gray-500">
                    Creada: {new Date(request.createdAt).toLocaleString('es-CL')}
                  </p>
                  <p className="text-xs text-gray-500">
                    Actualizada: {new Date(request.updatedAt).toLocaleString('es-CL')}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </UnifiedDashboardLayout>
  );
}

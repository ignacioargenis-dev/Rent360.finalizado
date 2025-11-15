'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import UnifiedDashboardLayout from '@/components/layout/UnifiedDashboardLayout';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import {
  Plus,
  Send,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Mail,
  Phone,
  User,
  MessageSquare,
  TrendingUp,
  Eye,
  Check,
  X,
} from 'lucide-react';

export default function TenantBrokerServicesPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('invitations');
  const [loading, setLoading] = useState(false);
  const [showNewRequestDialog, setShowNewRequestDialog] = useState(false);

  // Estado para solicitudes
  const [myRequests, setMyRequests] = useState([]);

  // Estado para invitaciones
  const [invitations, setInvitations] = useState([]);
  const [invitationsLoading, setInvitationsLoading] = useState(false);

  // Estado para nueva solicitud
  const [newRequest, setNewRequest] = useState({
    requestType: 'PROPERTY_SEARCH',
    title: '',
    description: '',
    urgency: 'NORMAL',
    expiresInDays: 30,
  });

  // Cargar mis solicitudes
  const loadMyRequests = async () => {
    setLoading(true);
    try {
      console.log('[TENANT BROKER SERVICES] Cargando solicitudes...');
      const res = await fetch('/api/service-requests');
      const data = await res.json();
      console.log('[TENANT BROKER SERVICES] Respuesta solicitudes:', data);

      if (data.success) {
        setMyRequests(data.data || []);
        console.log('[TENANT BROKER SERVICES] Solicitudes cargadas:', data.data?.length || 0);
      } else {
        console.error('[TENANT BROKER SERVICES] Error en API:', data.error);
        toast.error(data.error);
      }
    } catch (error) {
      console.error('[TENANT BROKER SERVICES] Error de red:', error);
      toast.error('Error al cargar solicitudes');
    } finally {
      setLoading(false);
    }
  };

  // Funciones para manejar invitaciones
  const loadInvitations = async () => {
    setInvitationsLoading(true);
    try {
      console.log('[TENANT BROKER SERVICES] Cargando invitaciones...');
      const res = await fetch('/api/invitations');
      const data = await res.json();
      console.log('[TENANT BROKER SERVICES] Respuesta invitaciones:', data);

      if (data.success) {
        setInvitations(data.data || []);
        console.log('[TENANT BROKER SERVICES] Invitaciones cargadas:', data.data?.length || 0);
      } else {
        console.error('[TENANT BROKER SERVICES] Error en API invitaciones:', data.error);
        toast.error(data.error || 'Error al cargar invitaciones');
      }
    } catch (error) {
      console.error('[TENANT BROKER SERVICES] Error de red invitaciones:', error);
      toast.error('Error al cargar invitaciones');
    } finally {
      setInvitationsLoading(false);
    }
  };

  const handleAcceptInvitation = async (invitationId: string) => {
    try {
      const res = await fetch(`/api/invitations/${invitationId}/accept`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });

      const data = await res.json();

      if (data.success) {
        toast.success('Invitación aceptada exitosamente');

        // Redirigir a selección de propiedades si se proporciona la URL
        if (data.redirectTo) {
          router.push(data.redirectTo);
        } else {
          loadInvitations(); // Recargar invitaciones como fallback
        }
      } else {
        toast.error(data.error || 'Error al aceptar invitación');
      }
    } catch (error) {
      toast.error('Error al aceptar invitación');
    }
  };

  const handleRejectInvitation = async (invitationId: string) => {
    try {
      const res = await fetch(`/api/invitations/${invitationId}/reject`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });

      const data = await res.json();

      if (data.success) {
        toast.success('Invitación rechazada');
        loadInvitations(); // Recargar invitaciones
      } else {
        toast.error(data.error || 'Error al rechazar invitación');
      }
    } catch (error) {
      toast.error('Error al rechazar invitación');
    }
  };

  useEffect(() => {
    loadMyRequests();
    loadInvitations();
  }, []);

  // Recarga silenciosa cada 30 segundos para actualizar respuestas
  useEffect(() => {
    if (activeTab === 'my-requests') {
      const interval = setInterval(() => {
        loadMyRequests();
      }, 30000); // 30 segundos

      return () => clearInterval(interval);
    }
    return undefined;
  }, [activeTab]);

  // Crear nueva solicitud
  const createRequest = async () => {
    if (newRequest.title.length < 10) {
      toast.error('El título debe tener al menos 10 caracteres');
      return;
    }
    if (newRequest.description.length < 50) {
      toast.error('La descripción debe tener al menos 50 caracteres');
      return;
    }

    try {
      const res = await fetch('/api/service-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newRequest),
      });

      const data = await res.json();

      if (data.success) {
        toast.success(data.message);
        setShowNewRequestDialog(false);
        setNewRequest({
          requestType: 'PROPERTY_SEARCH',
          title: '',
          description: '',
          urgency: 'NORMAL',
          expiresInDays: 30,
        });
        loadMyRequests();
      } else {
        toast.error(data.error);
      }
    } catch (error) {
      toast.error('Error al crear solicitud');
    }
  };

  // Gestionar respuesta
  const handleResponse = async (requestId: string, responseId: string, action: string) => {
    try {
      const res = await fetch(`/api/service-requests/${requestId}/responses/${responseId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      });
      const data = await res.json();

      if (data.success) {
        toast.success(data.message);
        loadMyRequests();
      } else {
        toast.error(data.error);
      }
    } catch (error) {
      toast.error('Error al procesar respuesta');
    }
  };

  // Cancelar solicitud
  const cancelRequest = async (requestId: string) => {
    if (!confirm('¿Seguro que quieres cancelar esta solicitud?')) {
      return;
    }

    try {
      const res = await fetch(`/api/service-requests/${requestId}`, {
        method: 'DELETE',
      });
      const data = await res.json();

      if (data.success) {
        toast.success(data.message);
        loadMyRequests();
      } else {
        toast.error(data.error);
      }
    } catch (error) {
      toast.error('Error al cancelar solicitud');
    }
  };

  const getRequestTypeLabel = (type: string) => {
    const labels: any = {
      PROPERTY_MANAGEMENT: 'Gestión de Propiedad',
      PROPERTY_SALE: 'Venta de Propiedad',
      PROPERTY_SEARCH: 'Búsqueda de Propiedad',
      TENANT_SEARCH: 'Búsqueda de Inquilinos',
      CONSULTATION: 'Consultoría',
    };
    return labels[type] || type;
  };

  const getStatusBadge = (status: string) => {
    const variants: any = {
      OPEN: { variant: 'default', icon: AlertCircle, label: 'Abierta' },
      IN_PROGRESS: { variant: 'secondary', icon: Clock, label: 'En Progreso' },
      ASSIGNED: { variant: 'default', icon: CheckCircle, label: 'Asignada' },
      CLOSED: { variant: 'secondary', icon: CheckCircle, label: 'Cerrada' },
      CANCELLED: { variant: 'destructive', icon: XCircle, label: 'Cancelada' },
    };
    const config = variants[status] || variants.OPEN;
    const Icon = config.icon;

    return (
      <Badge variant={config.variant as any}>
        <Icon className="h-3 w-3 mr-1" />
        {config.label}
      </Badge>
    );
  };

  const getUrgencyBadge = (urgency: string) => {
    const variants: any = {
      LOW: 'secondary',
      NORMAL: 'outline',
      HIGH: 'default',
      URGENT: 'destructive',
    };
    return <Badge variant={variants[urgency] as any}>{urgency}</Badge>;
  };

  return (
    <UnifiedDashboardLayout
      title="🏠 Servicios de Corretaje"
      subtitle="Encuentra corredores profesionales para ayudarte con tu búsqueda de vivienda"
    >
      <div className="flex justify-end mb-8">
        <Dialog open={showNewRequestDialog} onOpenChange={setShowNewRequestDialog}>
          <DialogTrigger asChild>
            <Button size="lg">
              <Plus className="h-4 w-4 mr-2" />
              Nueva Solicitud
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Solicitar Servicio de Corretaje</DialogTitle>
              <DialogDescription>
                Describe lo que necesitas y los corredores podrán enviarte propuestas
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Tipo de Servicio</label>
                <Select
                  value={newRequest.requestType}
                  onValueChange={value => setNewRequest({ ...newRequest, requestType: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PROPERTY_SEARCH">Búsqueda de Propiedad</SelectItem>
                    <SelectItem value="CONSULTATION">Consultoría</SelectItem>
                    <SelectItem value="PROPERTY_MANAGEMENT">Gestión de Propiedad</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Título de la Solicitud</label>
                <Input
                  placeholder="Ej: Busco departamento 2D+2B en Providencia"
                  value={newRequest.title}
                  onChange={e => setNewRequest({ ...newRequest, title: e.target.value })}
                />
                <p className="text-xs text-gray-500 mt-1">Mínimo 10 caracteres</p>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Descripción Detallada</label>
                <Textarea
                  placeholder="Describe en detalle lo que buscas: ubicación, presupuesto, características deseadas, etc."
                  rows={6}
                  value={newRequest.description}
                  onChange={e => setNewRequest({ ...newRequest, description: e.target.value })}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Mínimo 50 caracteres ({newRequest.description.length}/50)
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Urgencia</label>
                  <Select
                    value={newRequest.urgency}
                    onValueChange={value => setNewRequest({ ...newRequest, urgency: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="LOW">Baja</SelectItem>
                      <SelectItem value="NORMAL">Normal</SelectItem>
                      <SelectItem value="HIGH">Alta</SelectItem>
                      <SelectItem value="URGENT">Urgente</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Expira en (días)</label>
                  <Input
                    type="number"
                    min="1"
                    max="90"
                    value={newRequest.expiresInDays}
                    onChange={e =>
                      setNewRequest({ ...newRequest, expiresInDays: parseInt(e.target.value) })
                    }
                  />
                </div>
              </div>

              <div className="flex gap-2">
                <Button onClick={createRequest} className="flex-1">
                  <Send className="h-4 w-4 mr-2" />
                  Publicar Solicitud
                </Button>
                <Button variant="outline" onClick={() => setShowNewRequestDialog(false)}>
                  Cancelar
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="invitations">Invitaciones</TabsTrigger>
          <TabsTrigger value="my-requests">Mis Solicitudes</TabsTrigger>
          <TabsTrigger value="help">¿Cómo Funciona?</TabsTrigger>
        </TabsList>

        <TabsContent value="invitations" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Invitaciones de Corredores</h3>
          </div>

          {invitationsLoading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="text-gray-600 mt-4">Cargando invitaciones...</p>
            </div>
          ) : invitations.length === 0 ? (
            <div className="text-center py-12">
              <Mail className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No tienes invitaciones pendientes
              </h3>
              <p className="text-gray-600">
                Los corredores te enviarán invitaciones cuando estén interesados en trabajar
                contigo.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {invitations.map((invitation: any) => (
                <Card key={invitation.id} className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-3">
                      <div className="flex-shrink-0">
                        <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                          <User className="h-5 w-5 text-blue-600" />
                        </div>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <h4 className="text-sm font-medium text-gray-900">
                            {invitation.broker?.name || 'Corredor'}
                          </h4>
                          <Badge variant="outline" className="text-xs">
                            {invitation.invitationType === 'SERVICE_OFFER'
                              ? 'Oferta de Servicios'
                              : invitation.invitationType === 'PROPERTY_SEARCH'
                                ? 'Búsqueda de Propiedades'
                                : invitation.invitationType === 'PROPERTY_VIEWING'
                                  ? 'Visita de Propiedades'
                                  : invitation.invitationType === 'CONSULTATION'
                                    ? 'Consultoría'
                                    : invitation.invitationType}
                          </Badge>
                          <Badge variant="secondary" className="text-xs">
                            {invitation.status === 'SENT'
                              ? 'Pendiente'
                              : invitation.status === 'ACCEPTED'
                                ? 'Aceptada'
                                : invitation.status === 'REJECTED'
                                  ? 'Rechazada'
                                  : invitation.status}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-600 mt-1">{invitation.subject}</p>
                        <p className="text-sm text-gray-700 mt-2">{invitation.message}</p>
                        {invitation.proposedRate && (
                          <p className="text-sm text-green-600 mt-1">
                            Comisión propuesta: {invitation.proposedRate}%
                          </p>
                        )}
                        <p className="text-xs text-gray-500 mt-2">
                          Enviada el {new Date(invitation.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      {invitation.status === 'SENT' && (
                        <>
                          <Button
                            size="sm"
                            onClick={() => handleAcceptInvitation(invitation.id)}
                            className="bg-green-600 hover:bg-green-700"
                          >
                            <Check className="h-4 w-4 mr-1" />
                            Aceptar
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleRejectInvitation(invitation.id)}
                            className="border-red-300 text-red-600 hover:bg-red-50"
                          >
                            <X className="h-4 w-4 mr-1" />
                            Rechazar
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="my-requests" className="space-y-4">
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="text-gray-600 mt-4">Cargando solicitudes...</p>
            </div>
          ) : myRequests.length === 0 ? (
            <Card className="p-12 text-center">
              <AlertCircle className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">No tienes solicitudes aún</h3>
              <p className="text-gray-600 mb-4">
                Crea una solicitud y los corredores te enviarán propuestas
              </p>
              <Button onClick={() => setShowNewRequestDialog(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Crear Primera Solicitud
              </Button>
            </Card>
          ) : (
            <div className="space-y-4">
              {myRequests.map((request: any) => (
                <Card key={request.id} className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="text-xl font-semibold">{request.title}</h3>
                        {getStatusBadge(request.status)}
                        {getUrgencyBadge(request.urgency)}
                      </div>
                      <p className="text-sm text-gray-600 mb-2">
                        {getRequestTypeLabel(request.requestType)}
                      </p>
                      <p className="text-gray-700">{request.description}</p>
                    </div>
                  </div>

                  {/* Estadísticas */}
                  <div className="grid grid-cols-3 gap-4 mb-4 p-4 bg-gray-50 rounded-lg">
                    <div className="text-center">
                      <p className="text-2xl font-bold text-blue-600">{request._count.responses}</p>
                      <p className="text-sm text-gray-600">Respuestas</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-green-600">{request.viewCount}</p>
                      <p className="text-sm text-gray-600">Vistas</p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm text-gray-600">
                        {request.expiresAt
                          ? `Expira: ${new Date(request.expiresAt).toLocaleDateString()}`
                          : 'Sin expiración'}
                      </p>
                    </div>
                  </div>

                  {/* Corredor Asignado */}
                  {request.assignedBroker && (
                    <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                      <p className="text-sm font-medium text-green-800 mb-2">
                        ✅ Corredor Asignado:
                      </p>
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-green-200 flex items-center justify-center">
                          <User className="h-5 w-5 text-green-700" />
                        </div>
                        <div>
                          <p className="font-semibold">{request.assignedBroker.name}</p>
                          <div className="flex items-center gap-3 text-sm text-gray-600">
                            <span className="flex items-center gap-1">
                              <Mail className="h-3 w-3" />
                              {request.assignedBroker.email}
                            </span>
                            {request.assignedBroker.phone && (
                              <span className="flex items-center gap-1">
                                <Phone className="h-3 w-3" />
                                {request.assignedBroker.phone}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Respuestas de Corredores */}
                  {request.responses && request.responses.length > 0 && (
                    <div className="space-y-3">
                      <h4 className="font-semibold flex items-center gap-2">
                        <MessageSquare className="h-4 w-4" />
                        Propuestas Recibidas ({request.responses.length})
                      </h4>
                      {request.responses.map((response: any) => (
                        <div
                          key={response.id}
                          className="p-4 border rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors"
                        >
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex items-center gap-3">
                              <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                                <User className="h-5 w-5 text-blue-600" />
                              </div>
                              <div>
                                <p className="font-semibold">{response.broker.name}</p>
                                <div className="flex items-center gap-2 text-sm text-gray-600">
                                  <Mail className="h-3 w-3" />
                                  {response.broker.email}
                                  {response.broker.phone && (
                                    <>
                                      <span>•</span>
                                      <Phone className="h-3 w-3" />
                                      {response.broker.phone}
                                    </>
                                  )}
                                </div>
                              </div>
                            </div>
                            <Badge
                              variant={
                                response.status === 'ACCEPTED'
                                  ? 'default'
                                  : response.status === 'REJECTED'
                                    ? 'destructive'
                                    : 'secondary'
                              }
                            >
                              {response.status}
                            </Badge>
                          </div>

                          <p className="text-gray-700 mb-3">{response.message}</p>

                          {response.proposedRate && (
                            <div className="flex items-center gap-2 text-sm text-gray-600 mb-3">
                              <TrendingUp className="h-4 w-4" />
                              <span>Comisión propuesta: {response.proposedRate}%</span>
                            </div>
                          )}

                          {response.status === 'SENT' && (
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                onClick={() => handleResponse(request.id, response.id, 'accept')}
                              >
                                <Check className="h-4 w-4 mr-1" />
                                Aceptar
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleResponse(request.id, response.id, 'view')}
                              >
                                <Eye className="h-4 w-4 mr-1" />
                                Marcar Vista
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  // Crear conversación con el broker usando el sistema de mensajería
                                  const recipientData = {
                                    id: response.broker.id,
                                    name: response.broker.name,
                                    email: response.broker.email,
                                    phone: response.broker.phone,
                                    type: 'broker' as const,
                                    requestId: request.id,
                                    responseId: response.id,
                                  };
                                  sessionStorage.setItem(
                                    'newMessageRecipient',
                                    JSON.stringify(recipientData)
                                  );
                                  router.push('/tenant/messages?new=true');
                                }}
                              >
                                <MessageSquare className="h-4 w-4 mr-1" />
                                Contactar
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => handleResponse(request.id, response.id, 'reject')}
                              >
                                <X className="h-4 w-4 mr-1" />
                                Rechazar
                              </Button>
                            </div>
                          )}

                          <p className="text-xs text-gray-500 mt-2">
                            Enviada: {new Date(response.createdAt).toLocaleString()}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Acciones */}
                  {request.status === 'OPEN' && (
                    <div className="flex gap-2 mt-4 pt-4 border-t">
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => cancelRequest(request.id)}
                      >
                        <XCircle className="h-4 w-4 mr-1" />
                        Cancelar Solicitud
                      </Button>
                    </div>
                  )}
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="help">
          <Card className="p-8">
            <h3 className="text-2xl font-bold mb-6">¿Cómo Funciona?</h3>

            <div className="space-y-6">
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center font-bold text-blue-600">
                  1
                </div>
                <div>
                  <h4 className="font-semibold mb-2">Crea una Solicitud</h4>
                  <p className="text-gray-600">
                    Describe qué tipo de propiedad buscas: ubicación, presupuesto, características,
                    etc.
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-shrink-0 w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center font-bold text-blue-600">
                  2
                </div>
                <div>
                  <h4 className="font-semibold mb-2">Los Corredores Te Encuentran</h4>
                  <p className="text-gray-600">
                    Tu solicitud aparecerá en el marketplace donde corredores profesionales podrán
                    verla y enviarte propuestas con opciones de propiedades.
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-shrink-0 w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center font-bold text-blue-600">
                  3
                </div>
                <div>
                  <h4 className="font-semibold mb-2">Recibe Propuestas</h4>
                  <p className="text-gray-600">
                    Revisa las propuestas que recibas. Podrás ver el perfil del corredor, las
                    propiedades sugeridas y las condiciones.
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-shrink-0 w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center font-bold text-blue-600">
                  4
                </div>
                <div>
                  <h4 className="font-semibold mb-2">Elige al Mejor</h4>
                  <p className="text-gray-600">
                    Acepta la propuesta que más te convenga. El corredor será asignado
                    automáticamente y podrán coordinar visitas y siguientes pasos.
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-800">
                <strong>💡 Consejo:</strong> Sé específico en tu solicitud. Incluye detalles como
                ubicación preferida, rango de presupuesto, número de habitaciones y cualquier
                requisito especial para recibir propuestas más precisas.
              </p>
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </UnifiedDashboardLayout>
  );
}

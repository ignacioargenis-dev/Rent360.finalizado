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

interface VisitProposal {
  id: string;
  scheduledDate: string | null;
  scheduledTime: string | null;
  estimatedDuration?: number | null;
  status?: string | null;
  proposedBy?: string | null;
  contactPerson?: string | null;
  contactPhone?: string | null;
  specialInstructions?: string | null;
  acceptedAt?: string | null;
  acceptedBy?: string | null;
}

interface MaintenanceRequest {
  id: string;
  title: string;
  description: string;
  category: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  status:
    | 'OPEN'
    | 'IN_PROGRESS'
    | 'COMPLETED'
    | 'CANCELLED'
    | 'ASSIGNED'
    | 'SCHEDULED'
    | 'PENDING'
    | 'QUOTE_PENDING'
    | 'QUOTE_APPROVED'
    | 'PENDING_CONFIRMATION'
    | 'REJECTED';
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
  visitProposal?: VisitProposal;
}

export default function BrokerMaintenanceDetailPage() {
  const router = useRouter();
  const params = useParams();
  const maintenanceId = params?.id as string;

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
  const [providerFilters, setProviderFilters] = useState({
    specialty: 'all',
    sortBy: 'rating',
    location: 'all',
  });
  const [proposalActionRequestId, setProposalActionRequestId] = useState<string | null>(null);
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
      const response = await fetch(`/api/maintenance/${maintenanceId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      const normalized: MaintenanceRequest = {
        ...data.maintenanceRequest,
        visitProposal: data.maintenanceRequest.visitProposal || undefined,
      };

      setMaintenanceRequest(normalized);
    } catch (error) {
      logger.error('Error loading maintenance request:', { error });
      alert('No se pudo cargar la solicitud de mantenimiento');
    } finally {
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

  const getSortedProviders = (providers: any[]) => {
    const sorted = [...providers];
    switch (providerFilters.sortBy) {
      case 'rating':
        sorted.sort((a, b) => (b.rating || 0) - (a.rating || 0));
        break;
      case 'price_low':
        sorted.sort((a, b) => (a.hourlyRate || 0) - (b.hourlyRate || 0));
        break;
      case 'price_high':
        sorted.sort((a, b) => (b.hourlyRate || 0) - (a.hourlyRate || 0));
        break;
      case 'experience':
        sorted.sort((a, b) => {
          const expA = parseInt(a.experience?.split(' ')[0] || '0');
          const expB = parseInt(b.experience?.split(' ')[0] || '0');
          return expB - expA;
        });
        break;
      default:
        break;
    }
    return sorted;
  };

  const loadAvailableProviders = async () => {
    if (!maintenanceRequest) {
      return;
    }

    try {
      // Construir URL con parámetros de filtro
      const params = new URLSearchParams();
      if (providerFilters.location && providerFilters.location !== 'all') {
        params.append('location', providerFilters.location);
      }
      if (providerFilters.specialty && providerFilters.specialty !== 'all') {
        params.append('specialty', providerFilters.specialty);
      }

      const url = `/api/maintenance/${maintenanceId}/available-providers${
        params.toString() ? `?${params.toString()}` : ''
      }`;

      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        const providers = data.availableProviders || [];
        // Aplicar ordenamiento
        const sortedProviders = getSortedProviders(providers);
        setAvailableProviders(sortedProviders);
      } else {
        logger.error('Error loading available providers:', { status: response.status });
        setAvailableProviders([]);
      }
    } catch (error) {
      logger.error('Error loading available providers:', { error });
      setAvailableProviders([]);
    }
  };

  const handleAssignContractor = async () => {
    if (!maintenanceRequest) {
      return;
    }

    try {
      setUpdating(true);
      await loadAvailableProviders();
      setShowAssignProvider(true);
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

    openScheduleDialog();
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
    if (!maintenanceRequest?.assignedProvider?.id) {
      alert('Debes tener un proveedor asignado antes de proponer una visita.');
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
        await loadMaintenanceRequest();
        setShowScheduleVisit(false);
        setVisitData({
          scheduledDate: '',
          scheduledTime: '',
          estimatedDuration: 120,
          contactPerson: '',
          contactPhone: '',
          specialInstructions: '',
        });
        alert('Propuesta enviada. Esperando confirmación del proveedor.');
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
      case 'PENDING':
        return <Badge className="bg-yellow-100 text-yellow-800">Pendiente</Badge>;
      case 'ASSIGNED':
        return <Badge className="bg-blue-100 text-blue-800">Prestador asignado</Badge>;
      case 'QUOTE_PENDING':
        return <Badge className="bg-orange-100 text-orange-800">Cotización pendiente</Badge>;
      case 'QUOTE_APPROVED':
        return <Badge className="bg-purple-100 text-purple-800">Cotización aprobada</Badge>;
      case 'APPROVED':
        return <Badge className="bg-blue-100 text-blue-800">Aprobada</Badge>;
      case 'SCHEDULED':
        return <Badge className="bg-indigo-100 text-indigo-800">Visita programada</Badge>;
      case 'IN_PROGRESS':
        return <Badge className="bg-emerald-100 text-emerald-800">En progreso</Badge>;
      case 'PENDING_CONFIRMATION':
        return <Badge className="bg-yellow-100 text-yellow-800">Esperando confirmación</Badge>;
      case 'COMPLETED':
        return <Badge className="bg-green-100 text-green-800">Completada</Badge>;
      case 'REJECTED':
      case 'CANCELLED':
        return <Badge className="bg-red-100 text-red-800">Rechazada</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
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

  const formatDate = (value?: string | null) => {
    if (!value) {
      return 'No definido';
    }
    try {
      return new Date(value).toLocaleDateString('es-CL', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      });
    } catch {
      return value;
    }
  };

  const isWaitingForProviderResponse = (request?: MaintenanceRequest | null) =>
    !!request?.visitProposal &&
    request.visitProposal.status === 'PROPOSED' &&
    (request.visitProposal.proposedBy === 'OWNER' ||
      request.visitProposal.proposedBy === 'BROKER' ||
      request.visitProposal.proposedBy === 'ADMIN' ||
      !request.visitProposal.proposedBy);

  const isWaitingForOwnerResponse = (request?: MaintenanceRequest | null) =>
    !!request?.visitProposal &&
    request.visitProposal.status === 'PROPOSED' &&
    request.visitProposal.proposedBy === 'PROVIDER';

  const openScheduleDialog = (options?: { prefillFromProposal?: boolean }) => {
    if (!maintenanceRequest) {
      return;
    }

    let nextVisitData = {
      scheduledDate: '',
      scheduledTime: '',
      estimatedDuration: 120,
      contactPerson: maintenanceRequest.requester.name || '',
      contactPhone: maintenanceRequest.requester.email || '',
      specialInstructions: '',
    };

    if (options?.prefillFromProposal && maintenanceRequest.visitProposal) {
      const proposalDate = maintenanceRequest.visitProposal.scheduledDate ?? '';
      nextVisitData = {
        scheduledDate: String(proposalDate).split('T')[0] || '',
        scheduledTime: maintenanceRequest.visitProposal.scheduledTime || '',
        estimatedDuration: maintenanceRequest.visitProposal.estimatedDuration || 120,
        contactPerson:
          maintenanceRequest.visitProposal.contactPerson || maintenanceRequest.requester.name || '',
        contactPhone:
          maintenanceRequest.visitProposal.contactPhone || maintenanceRequest.requester.email || '',
        specialInstructions: maintenanceRequest.visitProposal.specialInstructions || '',
      };
    }

    setVisitData(nextVisitData);
    setShowScheduleVisit(true);
  };

  const handleAcceptProviderProposal = async () => {
    if (!maintenanceRequest?.visitProposal) {
      return;
    }

    try {
      setProposalActionRequestId(maintenanceRequest.id);
      const response = await fetch(
        `/api/maintenance/${maintenanceRequest.id}/accept-visit-proposal`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify({
            action: 'accept',
            proposalId: maintenanceRequest.visitProposal.id,
          }),
        }
      );

      if (response.ok) {
        alert('Fecha de visita confirmada');
        await loadMaintenanceRequest();
      } else {
        const error = await response.json();
        alert(error.error || 'Error al aceptar la propuesta del proveedor');
      }
    } catch (error) {
      logger.error('Error aceptando propuesta del proveedor:', { error });
      alert('Error al aceptar la propuesta de visita');
    } finally {
      setProposalActionRequestId(null);
    }
  };

  const renderVisitProposalInfo = () => {
    if (!maintenanceRequest?.visitProposal) {
      return null;
    }

    const proposal = maintenanceRequest.visitProposal;
    const isLoading = proposalActionRequestId === maintenanceRequest.id;

    if (isWaitingForProviderResponse(maintenanceRequest)) {
      return (
        <div className="mt-3 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h4 className="font-semibold text-blue-900 mb-1 flex items-center gap-2">
            <Clock className="w-4 h-4" />
            Propuesta enviada
          </h4>
          <p className="text-sm text-blue-800">
            El proveedor debe confirmar o sugerir un nuevo horario para la visita propuesta.
          </p>
          <p className="text-sm text-blue-700 mt-2">
            {formatDate(proposal.scheduledDate)} · {proposal.scheduledTime || '--:--'} hrs (
            {proposal.estimatedDuration || 120} min)
          </p>
        </div>
      );
    }

    if (isWaitingForOwnerResponse(maintenanceRequest)) {
      return (
        <div className="mt-3 p-4 bg-orange-50 border border-orange-200 rounded-lg">
          <h4 className="font-semibold text-orange-900 mb-1 flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            El proveedor propuso una nueva fecha
          </h4>
          <div className="text-sm text-orange-900 space-y-1">
            <p>
              <strong>Fecha:</strong> {formatDate(proposal.scheduledDate)}
            </p>
            <p>
              <strong>Hora:</strong> {proposal.scheduledTime || '--:--'} hrs
            </p>
            <p>
              <strong>Duración estimada:</strong> {proposal.estimatedDuration || 120} minutos
            </p>
            {proposal.specialInstructions && (
              <p className="text-xs text-orange-700">
                <strong>Notas:</strong> {proposal.specialInstructions}
              </p>
            )}
          </div>
          <div className="flex flex-wrap gap-3 pt-3">
            <Button
              size="sm"
              className="bg-emerald-600 hover:bg-emerald-700"
              disabled={isLoading}
              onClick={handleAcceptProviderProposal}
            >
              {isLoading ? 'Procesando...' : 'Aceptar Fecha'}
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => openScheduleDialog({ prefillFromProposal: true })}
            >
              <Calendar className="w-4 h-4 mr-2" />
              Proponer otra fecha
            </Button>
          </div>
        </div>
      );
    }

    if (proposal.status === 'ACCEPTED') {
      return (
        <div className="mt-3 p-4 bg-emerald-50 border border-emerald-200 rounded-lg">
          <h4 className="font-semibold text-emerald-900 mb-1 flex items-center gap-2">
            <CheckCircle className="w-4 h-4" />
            Visita confirmada
          </h4>
          <p className="text-sm text-emerald-900">
            {formatDate(proposal.scheduledDate)} · {proposal.scheduledTime || '--:--'} hrs (
            {proposal.estimatedDuration || 120} min)
          </p>
        </div>
      );
    }

    return null;
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

                  {renderVisitProposalInfo()}
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
                          onLoad={() => {
                            console.log('✅ Imagen cargada exitosamente (maintenance):', image);
                          }}
                          onError={e => {
                            console.error('❌ Error cargando imagen (maintenance):', image);
                            e.currentTarget.style.display = 'none';
                          }}
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
                      disabled={isWaitingForProviderResponse(maintenanceRequest)}
                      title={
                        isWaitingForProviderResponse(maintenanceRequest)
                          ? 'Ya hay una propuesta pendiente. Espera la respuesta del proveedor.'
                          : undefined
                      }
                      onClick={handleScheduleVisit}
                    >
                      <Calendar className="w-4 h-4 mr-2" />
                      {isWaitingForProviderResponse(maintenanceRequest)
                        ? 'Propuesta enviada'
                        : 'Proponer Visita'}
                    </Button>

                    {isWaitingForOwnerResponse(maintenanceRequest) && (
                      <Button
                        size="sm"
                        className="w-full bg-emerald-600 hover:bg-emerald-700"
                        onClick={handleAcceptProviderProposal}
                        disabled={proposalActionRequestId === maintenanceRequest.id}
                      >
                        {proposalActionRequestId === maintenanceRequest.id
                          ? 'Confirmando...'
                          : 'Aceptar Fecha del Proveedor'}
                      </Button>
                    )}
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

          {/* Filtros de búsqueda */}
          <div className="bg-gray-50 p-4 rounded-lg mb-4">
            <h4 className="text-md font-semibold mb-3">Buscar y Filtrar Proveedores</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="specialty-filter" className="text-sm font-medium">
                  Especialidad
                </Label>
                <Select
                  value={providerFilters.specialty}
                  onValueChange={value => {
                    setProviderFilters(prev => ({ ...prev, specialty: value }));
                    setTimeout(() => {
                      loadAvailableProviders();
                    }, 100);
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Todas las especialidades" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas las especialidades</SelectItem>
                    <SelectItem value="Mantenimiento General">Mantenimiento General</SelectItem>
                    <SelectItem value="Plomería">Plomería</SelectItem>
                    <SelectItem value="Eléctrica">Reparaciones Eléctricas</SelectItem>
                    <SelectItem value="Jardinería">Jardinería</SelectItem>
                    <SelectItem value="Limpieza">Limpieza Profesional</SelectItem>
                    <SelectItem value="Pintura">Pintura y Decoración</SelectItem>
                    <SelectItem value="Carpintería">Carpintería</SelectItem>
                    <SelectItem value="Estructural">Estructural</SelectItem>
                    <SelectItem value="Electrodomésticos">Electrodomésticos</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="location-filter" className="text-sm font-medium">
                  Ubicación
                </Label>
                <Select
                  value={providerFilters.location}
                  onValueChange={value => {
                    setProviderFilters(prev => ({ ...prev, location: value }));
                    setTimeout(() => {
                      loadAvailableProviders();
                    }, 100);
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Todas las ubicaciones" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas las ubicaciones</SelectItem>
                    <SelectItem value="same_city">Misma ciudad</SelectItem>
                    <SelectItem value="same_region">Misma región</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="sort-filter" className="text-sm font-medium">
                  Ordenar por
                </Label>
                <Select
                  value={providerFilters.sortBy}
                  onValueChange={value => {
                    setProviderFilters(prev => ({ ...prev, sortBy: value }));
                    // Reordenar proveedores cuando cambie el criterio
                    const sorted = getSortedProviders(availableProviders);
                    setAvailableProviders(sorted);
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Ordenar por..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="rating">Calificación más alta</SelectItem>
                    <SelectItem value="price_low">Precio más bajo</SelectItem>
                    <SelectItem value="price_high">Precio más alto</SelectItem>
                    <SelectItem value="experience">Más experiencia</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-semibold">
              Proveedores Disponibles ({availableProviders.length})
            </h3>
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
                              <h4 className="font-medium text-gray-900">
                                {provider.name || provider.businessName}
                              </h4>
                              <p className="text-sm text-gray-600">
                                {provider.specialty} • {provider.distance || provider.location}
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

      {/* Modal para proponer visita */}
      <Dialog open={showScheduleVisit} onOpenChange={setShowScheduleVisit}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Proponer Visita de Mantenimiento</DialogTitle>
            <DialogDescription>
              Envía una fecha sugerida. El proveedor podrá aceptarla o proponer otra alternativa.
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
              className="bg-emerald-600 hover:bg-emerald-700"
              onClick={handleConfirmVisitSchedule}
              disabled={!visitData.scheduledDate || !visitData.scheduledTime || updating}
            >
              {updating ? 'Enviando...' : 'Enviar Propuesta'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </UnifiedDashboardLayout>
  );
}

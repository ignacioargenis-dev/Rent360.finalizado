'use client';

import { useState, useEffect, useCallback } from 'react';
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
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
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
  AlertTriangle,
  Calendar,
  DollarSign,
  User,
  Home,
  Clock,
  CheckCircle,
  XCircle,
  Eye,
  MessageSquare,
  Scale,
  Users,
  Building,
  HeartHandshake,
  Phone,
  Mail,
  FileText,
  TrendingUp,
  AlertCircle,
  CheckSquare,
  X,
  Send,
} from 'lucide-react';
import UnifiedDashboardLayout from '@/components/layout/UnifiedDashboardLayout';
import { logger } from '@/lib/logger';

interface Dispute {
  id: string;
  disputeNumber: string;
  refundId: string;
  initiatedBy: string;
  disputeType: string;
  description: string;
  amount: number;
  status: string;
  resolution?: string;
  resolvedBy?: string;
  resolvedAt?: string;
  createdAt: string;
  updatedAt: string;
  contractNumber?: string;
  propertyTitle?: string;
  propertyAddress?: string;
  tenantName?: string;
  tenantEmail?: string;
  tenantPhone?: string;
  ownerName?: string;
  ownerEmail?: string;
  ownerPhone?: string;
  initiatorName?: string;
  initiatorRole?: string;
  supportPriority: string;
  mediationStatus: string;
  resolutionOptions: string[];
}

interface DisputeStats {
  total: number;
  open: number;
  pending: number;
  inProgress: number;
  resolved: number;
  cancelled: number;
}

export default function SupportDisputesPage() {
  const [disputes, setDisputes] = useState<Dispute[]>([]);
  const [stats, setStats] = useState<DisputeStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedDispute, setSelectedDispute] = useState<Dispute | null>(null);
  const [mediationDialogOpen, setMediationDialogOpen] = useState(false);
  const [resolutionDialogOpen, setResolutionDialogOpen] = useState(false);
  const [disputeDetailsModalOpen, setDisputeDetailsModalOpen] = useState(false);
  const [contactModalOpen, setContactModalOpen] = useState(false);
  const [contactParty, setContactParty] = useState<'tenant' | 'owner'>('tenant');
  const [mediationNotes, setMediationNotes] = useState('');
  const [resolutionType, setResolutionType] = useState('');
  const [resolutionNotes, setResolutionNotes] = useState('');

  useEffect(() => {
    loadDisputes();
  }, [loadDisputes]);

  const loadDisputes = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/support/disputes?status=${statusFilter}`);
      if (response.ok) {
        const data = await response.json();
        setDisputes(data.disputes || []);
        setStats(data.stats || null);
      } else {
        logger.error('Error loading disputes:', { error: await response.text() });
      }
    } catch (error) {
      logger.error('Error loading disputes:', { error });
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'OPEN':
        return <Badge className="bg-yellow-100 text-yellow-800">Abierta</Badge>;
      case 'PENDING':
        return <Badge className="bg-blue-100 text-blue-800">Pendiente</Badge>;
      case 'IN_PROGRESS':
        return <Badge className="bg-orange-100 text-orange-800">En Progreso</Badge>;
      case 'RESOLVED':
        return <Badge className="bg-green-100 text-green-800">Resuelta</Badge>;
      case 'CANCELLED':
        return <Badge className="bg-gray-100 text-gray-800">Cancelada</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'LOW':
        return (
          <Badge variant="outline" className="border-green-300 text-green-700">
            Baja
          </Badge>
        );
      case 'MEDIUM':
        return (
          <Badge variant="outline" className="border-yellow-300 text-yellow-700">
            Media
          </Badge>
        );
      case 'HIGH':
        return (
          <Badge variant="outline" className="border-orange-300 text-orange-700">
            Alta
          </Badge>
        );
      case 'URGENT':
        return (
          <Badge variant="outline" className="border-red-300 text-red-700">
            Urgente
          </Badge>
        );
      default:
        return <Badge variant="outline">{priority}</Badge>;
    }
  };

  const getDisputeTypeLabel = (disputeType: string) => {
    switch (disputeType) {
      case 'OWNER_CLAIM':
        return 'Reclamo del Propietario';
      case 'TENANT_CLAIM':
        return 'Reclamo del Inquilino';
      case 'MUTUAL_AGREEMENT':
        return 'Acuerdo Mutuo';
      default:
        return disputeType;
    }
  };

  const getResolutionOptionLabel = (option: string) => {
    const labels: { [key: string]: string } = {
      NEGOTIATION: 'Negociación Directa',
      LEGAL_MEDIATION: 'Mediación Legal',
      ARBITRATION: 'Arbitraje',
      MAINTENANCE_DEDUCTION: 'Deducción por Mantención',
      PARTIAL_REFUND: 'Reembolso Parcial',
      PROFESSIONAL_CLEANING: 'Limpieza Profesional',
      FULL_REFUND: 'Reembolso Total',
      DEPOSIT_ADJUSTMENT: 'Ajuste de Depósito',
      CONDITION_IMPROVEMENT: 'Mejora de Condiciones',
    };
    return labels[option] || option;
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-CL', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getDaysOpen = (createdAt: string) => {
    const created = new Date(createdAt);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - created.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const handleViewDisputeDetails = (dispute: Dispute) => {
    setSelectedDispute(dispute);
    setDisputeDetailsModalOpen(true);
  };

  const handleStartMediation = (dispute: Dispute) => {
    setSelectedDispute(dispute);
    setMediationNotes('');
    setMediationDialogOpen(true);
  };

  const handleResolveDispute = (dispute: Dispute) => {
    setSelectedDispute(dispute);
    setResolutionType('');
    setResolutionNotes('');
    setResolutionDialogOpen(true);
  };

  const submitMediation = async () => {
    if (!selectedDispute || !mediationNotes.trim()) {
      return;
    }

    try {
      // TODO: Implement mediation API call
      alert(
        `Mediación iniciada para disputa ${selectedDispute.disputeNumber}\n\nNotas: ${mediationNotes}`
      );

      setMediationDialogOpen(false);
      setSelectedDispute(null);
      setMediationNotes('');

      // Refresh disputes
      await loadDisputes();
    } catch (error) {
      logger.error('Error starting mediation:', { error });
      alert('Error al iniciar mediación. Intente nuevamente.');
    }
  };

  const submitResolution = async () => {
    if (!selectedDispute || !resolutionType || !resolutionNotes.trim()) {
      return;
    }

    try {
      // TODO: Implement resolution API call
      alert(
        `Resolución aplicada a disputa ${selectedDispute.disputeNumber}\n\nTipo: ${getResolutionOptionLabel(resolutionType)}\nNotas: ${resolutionNotes}`
      );

      setResolutionDialogOpen(false);
      setSelectedDispute(null);
      setResolutionType('');
      setResolutionNotes('');

      // Refresh disputes
      await loadDisputes();
    } catch (error) {
      logger.error('Error resolving dispute:', { error });
      alert('Error al resolver disputa. Intente nuevamente.');
    }
  };

  const handleContactParty = (dispute: Dispute, party: 'tenant' | 'owner') => {
    setSelectedDispute(dispute);
    setContactParty(party);
    setContactModalOpen(true);
  };

  const submitContactMessage = async () => {
    if (!selectedDispute) {
      return;
    }

    const contactInfo =
      contactParty === 'tenant'
        ? {
            name: selectedDispute.tenantName,
            email: selectedDispute.tenantEmail,
            phone: selectedDispute.tenantPhone,
          }
        : {
            name: selectedDispute.ownerName,
            email: selectedDispute.ownerEmail,
            phone: selectedDispute.ownerPhone,
          };

    const subject = `Disputa ${selectedDispute.disputeNumber} - ${getDisputeTypeLabel(selectedDispute.disputeType)}`;
    const body = `Estimado/a ${contactInfo.name},

Le escribo respecto a la disputa ${selectedDispute.disputeNumber} relacionada con el contrato ${selectedDispute.contractNumber} y la propiedad &quot;${selectedDispute.propertyTitle}&quot;.

Como equipo de soporte de Rent360, estamos trabajando para resolver esta situación de manera eficiente y justa.

¿Podríamos agendar una reunión o llamada para discutir los detalles?

Atentamente,
Equipo de Soporte Rent360`;

    try {
      // Abrir cliente de email con mensaje pre-llenado
      window.open(
        `mailto:${contactInfo.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
      );

      // Mostrar confirmación
      alert(
        `📧 Mensaje preparado para ${contactInfo.name}\n\nCliente de email abierto con mensaje pre-llenado.`
      );

      setContactModalOpen(false);
      setSelectedDispute(null);
    } catch (error) {
      logger.error('Error sending contact message:', { error });
      alert('Error al preparar mensaje de contacto. Intente nuevamente.');
    }
  };

  if (loading) {
    return (
      <UnifiedDashboardLayout title="Mediación de Disputas" subtitle="Cargando información...">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Cargando disputas...</p>
          </div>
        </div>
      </UnifiedDashboardLayout>
    );
  }

  return (
    <UnifiedDashboardLayout
      title="Mediación de Disputas"
      subtitle="Gestiona y media en disputas de depósito de garantía"
    >
      <div className="container mx-auto px-4 py-6 max-w-7xl">
        {/* Header with comprehensive stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Disputas</CardTitle>
              <AlertTriangle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.total || 0}</div>
              <p className="text-xs text-muted-foreground">En gestión</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Abiertas</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">{stats?.open || 0}</div>
              <p className="text-xs text-muted-foreground">Requieren atención</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">En Mediación</CardTitle>
              <HeartHandshake className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{stats?.inProgress || 0}</div>
              <p className="text-xs text-muted-foreground">Proceso activo</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Resueltas</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats?.resolved || 0}</div>
              <p className="text-xs text-muted-foreground">Este mes</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Prioridad Alta</CardTitle>
              <AlertCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                {
                  disputes.filter(
                    d => d.supportPriority === 'HIGH' || d.supportPriority === 'URGENT'
                  ).length
                }
              </div>
              <p className="text-xs text-muted-foreground">Atención inmediata</p>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-4 mb-6">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">Filtrar por estado:</span>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas las disputas</SelectItem>
                <SelectItem value="OPEN">Abiertas</SelectItem>
                <SelectItem value="PENDING">Pendientes</SelectItem>
                <SelectItem value="IN_PROGRESS">En Progreso</SelectItem>
                <SelectItem value="RESOLVED">Resueltas</SelectItem>
                <SelectItem value="CANCELLED">Canceladas</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Disputes List */}
        <div className="space-y-4">
          {disputes.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <HeartHandshake className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No hay disputas</h3>
                <p className="text-gray-600">
                  No se encontraron disputas con los filtros seleccionados.
                </p>
              </CardContent>
            </Card>
          ) : (
            disputes.map(dispute => (
              <Card
                key={dispute.id}
                className={`hover:shadow-md transition-shadow ${
                  dispute.supportPriority === 'URGENT'
                    ? 'border-red-300 bg-red-50'
                    : dispute.supportPriority === 'HIGH'
                      ? 'border-orange-300 bg-orange-50'
                      : ''
                }`}
              >
                <CardContent className="pt-6">
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="text-lg font-semibold text-gray-900">
                              Disputa {dispute.disputeNumber}
                            </h3>
                            {getStatusBadge(dispute.status)}
                            {getPriorityBadge(dispute.supportPriority)}
                          </div>
                          <p className="text-sm text-gray-600 mb-2">
                            {getDisputeTypeLabel(dispute.disputeType)} •{' '}
                            {getDaysOpen(dispute.createdAt)} días abierta
                          </p>
                          <p className="text-xs text-gray-500 mb-2">
                            Contrato: {dispute.contractNumber}
                          </p>
                        </div>
                        {dispute.mediationStatus === 'IN_PROGRESS' && (
                          <Badge className="bg-blue-100 text-blue-800">Mediación Activa</Badge>
                        )}
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm text-gray-600 mb-3">
                        <div className="flex items-center gap-2">
                          <Home className="w-4 h-4 text-gray-400" />
                          <div>
                            <span className="font-medium">Propiedad:</span>
                            <p className="truncate">{dispute.propertyTitle}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4 text-gray-400" />
                          <div>
                            <span className="font-medium">Inquilino:</span>
                            <p className="truncate">{dispute.tenantName}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Users className="w-4 h-4 text-gray-400" />
                          <div>
                            <span className="font-medium">Propietario:</span>
                            <p className="truncate">{dispute.ownerName}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <DollarSign className="w-4 h-4 text-gray-400" />
                          <div>
                            <span className="font-medium">Monto Disputado:</span>
                            <p className="font-semibold text-gray-900">
                              {formatCurrency(dispute.amount)}
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="mb-3">
                        <span className="text-sm font-medium text-gray-700">Descripción:</span>
                        <p className="text-sm text-gray-600 mt-1">{dispute.description}</p>
                      </div>

                      <div className="flex items-center justify-between text-xs text-gray-500">
                        <span>Iniciada: {formatDate(dispute.createdAt)}</span>
                        <span>
                          Iniciador: {dispute.initiatorName} ({dispute.initiatorRole})
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-col gap-2 lg:min-w-[250px]">
                      <div className="flex gap-2 mb-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleViewDisputeDetails(dispute)}
                          className="flex-1"
                        >
                          <Eye className="w-4 h-4 mr-2" />
                          Ver Detalles
                        </Button>
                      </div>

                      <div className="flex gap-2 mb-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleContactParty(dispute, 'tenant')}
                          className="flex-1"
                        >
                          <Mail className="w-4 h-4 mr-2" />
                          Contactar Inquilino
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleContactParty(dispute, 'owner')}
                          className="flex-1"
                        >
                          <Mail className="w-4 h-4 mr-2" />
                          Contactar Propietario
                        </Button>
                      </div>

                      <div className="flex gap-2">
                        {dispute.status === 'OPEN' && (
                          <Button
                            variant="default"
                            size="sm"
                            onClick={() => handleStartMediation(dispute)}
                            className="flex-1 bg-green-600 hover:bg-green-700"
                          >
                            <HeartHandshake className="w-4 h-4 mr-2" />
                            Iniciar Mediación
                          </Button>
                        )}
                        {dispute.mediationStatus === 'AVAILABLE' && (
                          <Button
                            variant="default"
                            size="sm"
                            onClick={() => handleResolveDispute(dispute)}
                            className="flex-1 bg-blue-600 hover:bg-blue-700"
                          >
                            <CheckSquare className="w-4 h-4 mr-2" />
                            Resolver
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* Mediation Dialog */}
        <Dialog open={mediationDialogOpen} onOpenChange={setMediationDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Iniciar Mediación</DialogTitle>
              <DialogDescription>
                Configure la mediación para la disputa {selectedDispute?.disputeNumber}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Notas de Mediación</label>
                <Textarea
                  placeholder="Describe el plan de mediación, pasos a seguir, y cualquier información relevante..."
                  value={mediationNotes}
                  onChange={e => setMediationNotes(e.target.value)}
                  className="mt-1"
                  rows={4}
                />
              </div>

              <div className="bg-blue-50 p-4 rounded-lg">
                <h4 className="font-medium text-blue-900 mb-2">Plan de Mediación Sugerido:</h4>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• Contactar a ambas partes para confirmar disponibilidad</li>
                  <li>• Programar reunión virtual o presencial</li>
                  <li>• Revisar documentos y evidencia presentada</li>
                  <li>• Facilitar diálogo constructivo entre las partes</li>
                  <li>• Proponer soluciones mutuamente beneficiosas</li>
                </ul>
              </div>
            </div>

            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setMediationDialogOpen(false)}>
                Cancelar
              </Button>
              <Button
                onClick={submitMediation}
                disabled={!mediationNotes.trim()}
                className="bg-green-600 hover:bg-green-700"
              >
                <HeartHandshake className="w-4 h-4 mr-2" />
                Iniciar Mediación
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Resolution Dialog */}
        <Dialog open={resolutionDialogOpen} onOpenChange={setResolutionDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Resolver Disputa</DialogTitle>
              <DialogDescription>
                Aplique una resolución a la disputa {selectedDispute?.disputeNumber}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Tipo de Resolución</label>
                <Select value={resolutionType} onValueChange={setResolutionType}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Seleccione el tipo de resolución" />
                  </SelectTrigger>
                  <SelectContent>
                    {selectedDispute?.resolutionOptions.map(option => (
                      <SelectItem key={option} value={option}>
                        {getResolutionOptionLabel(option)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium">Notas de Resolución</label>
                <Textarea
                  placeholder="Describa los detalles de la resolución acordada..."
                  value={resolutionNotes}
                  onChange={e => setResolutionNotes(e.target.value)}
                  className="mt-1"
                  rows={4}
                />
              </div>

              {resolutionType && (
                <div className="bg-green-50 p-4 rounded-lg">
                  <h4 className="font-medium text-green-900 mb-2">
                    Resolución Seleccionada: {getResolutionOptionLabel(resolutionType)}
                  </h4>
                  <p className="text-sm text-green-800">
                    Esta resolución será aplicada y las partes serán notificadas automáticamente.
                  </p>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setResolutionDialogOpen(false)}>
                Cancelar
              </Button>
              <Button
                onClick={submitResolution}
                disabled={!resolutionType || !resolutionNotes.trim()}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <CheckSquare className="w-4 h-4 mr-2" />
                Aplicar Resolución
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Dispute Details Modal */}
        <Dialog open={disputeDetailsModalOpen} onOpenChange={setDisputeDetailsModalOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold text-blue-600">
                📋 Detalles Completos de la Disputa
              </DialogTitle>
              <DialogDescription>
                Información detallada y acciones disponibles para la disputa{' '}
                {selectedDispute?.disputeNumber}
              </DialogDescription>
            </DialogHeader>

            {selectedDispute && (
              <div className="space-y-6">
                {/* Dispute Overview */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-2">
                        Información de la Disputa
                      </h4>
                      <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                        <p>
                          <span className="font-medium">Número:</span>{' '}
                          {selectedDispute.disputeNumber}
                        </p>
                        <p>
                          <span className="font-medium">Tipo:</span>{' '}
                          {getDisputeTypeLabel(selectedDispute.disputeType)}
                        </p>
                        <p>
                          <span className="font-medium">Estado:</span> {selectedDispute.status}
                        </p>
                        <p>
                          <span className="font-medium">Monto Disputado:</span>{' '}
                          {formatCurrency(selectedDispute.amount)}
                        </p>
                        <p>
                          <span className="font-medium">Fecha de Inicio:</span>{' '}
                          {formatDate(selectedDispute.createdAt)}
                        </p>
                        <p>
                          <span className="font-medium">Días Abierta:</span>{' '}
                          {getDaysOpen(selectedDispute.createdAt)} días
                        </p>
                      </div>
                    </div>

                    <div>
                      <h4 className="font-semibold text-gray-900 mb-2">Iniciador</h4>
                      <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                        <p>
                          <span className="font-medium">Nombre:</span>{' '}
                          {selectedDispute.initiatorName}
                        </p>
                        <p>
                          <span className="font-medium">Rol:</span>{' '}
                          {selectedDispute.initiatorRole === 'TENANT'
                            ? 'Inquilino'
                            : selectedDispute.initiatorRole === 'OWNER'
                              ? 'Propietario'
                              : 'Corredor'}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-2">Propiedad y Contrato</h4>
                      <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                        <p>
                          <span className="font-medium">Propiedad:</span>{' '}
                          {selectedDispute.propertyTitle}
                        </p>
                        <p>
                          <span className="font-medium">Dirección:</span>{' '}
                          {selectedDispute.propertyAddress}
                        </p>
                        <p>
                          <span className="font-medium">Contrato:</span>{' '}
                          {selectedDispute.contractNumber}
                        </p>
                      </div>
                    </div>

                    <div>
                      <h4 className="font-semibold text-gray-900 mb-2">Partes Involucradas</h4>
                      <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                        <p>
                          <span className="font-medium">Inquilino:</span>{' '}
                          {selectedDispute.tenantName}
                        </p>
                        <p>
                          <span className="font-medium">Email Inquilino:</span>{' '}
                          {selectedDispute.tenantEmail}
                        </p>
                        <p>
                          <span className="font-medium">Propietario:</span>{' '}
                          {selectedDispute.ownerName}
                        </p>
                        <p>
                          <span className="font-medium">Email Propietario:</span>{' '}
                          {selectedDispute.ownerEmail}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Description */}
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">Descripción de la Disputa</h4>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-gray-700">{selectedDispute.description}</p>
                  </div>
                </div>

                {/* Mediation Status */}
                {selectedDispute.mediationStatus && (
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">Estado de Mediación</h4>
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <p className="text-blue-800">
                        <span className="font-medium">Estado:</span>{' '}
                        {selectedDispute.mediationStatus === 'IN_PROGRESS'
                          ? 'En Progreso'
                          : 'Completada'}
                      </p>
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="flex flex-wrap gap-3 pt-4 border-t">
                  <Button
                    onClick={() => handleContactParty(selectedDispute, 'tenant')}
                    className="flex-1 min-w-[150px] bg-blue-600 hover:bg-blue-700"
                  >
                    <Mail className="w-4 h-4 mr-2" />
                    Contactar Inquilino
                  </Button>
                  <Button
                    onClick={() => handleContactParty(selectedDispute, 'owner')}
                    className="flex-1 min-w-[150px] bg-blue-600 hover:bg-blue-700"
                  >
                    <Mail className="w-4 h-4 mr-2" />
                    Contactar Propietario
                  </Button>
                  {selectedDispute.status === 'OPEN' && (
                    <Button
                      onClick={() => handleStartMediation(selectedDispute)}
                      className="flex-1 min-w-[150px] bg-green-600 hover:bg-green-700"
                    >
                      <HeartHandshake className="w-4 h-4 mr-2" />
                      Iniciar Mediación
                    </Button>
                  )}
                  <Button
                    onClick={() => handleResolveDispute(selectedDispute)}
                    variant="outline"
                    className="flex-1 min-w-[150px]"
                  >
                    <CheckSquare className="w-4 h-4 mr-2" />
                    Resolver Disputa
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Contact Party Modal */}
        <Dialog open={contactModalOpen} onOpenChange={setContactModalOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold text-purple-600">
                📬 Contactar Parte Involucrada
              </DialogTitle>
              <DialogDescription>
                Enviar mensaje a {contactParty === 'tenant' ? 'inquilino' : 'propietario'} de la
                disputa {selectedDispute?.disputeNumber}
              </DialogDescription>
            </DialogHeader>

            {selectedDispute && (
              <div className="space-y-6">
                {/* Contact Information */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-gray-900 mb-3">Información de Contacto</h4>
                  <div className="space-y-2">
                    <p>
                      <span className="font-medium">Nombre:</span>{' '}
                      {contactParty === 'tenant'
                        ? selectedDispute.tenantName
                        : selectedDispute.ownerName}
                    </p>
                    <p>
                      <span className="font-medium">Email:</span>{' '}
                      {contactParty === 'tenant'
                        ? selectedDispute.tenantEmail
                        : selectedDispute.ownerEmail}
                    </p>
                    <p>
                      <span className="font-medium">Disputa:</span> {selectedDispute.disputeNumber}
                    </p>
                    <p>
                      <span className="font-medium">Tipo:</span>{' '}
                      {getDisputeTypeLabel(selectedDispute.disputeType)}
                    </p>
                  </div>
                </div>

                {/* Message Preview */}
                <div>
                  <h4 className="font-semibold text-gray-900 mb-3">Mensaje que se enviará</h4>
                  <div className="bg-blue-50 p-4 rounded-lg border-l-4 border-blue-400">
                    <div className="text-sm space-y-2">
                      <p>
                        <strong>Asunto:</strong> Disputa {selectedDispute.disputeNumber} -{' '}
                        {getDisputeTypeLabel(selectedDispute.disputeType)}
                      </p>
                      <div className="bg-white p-3 rounded text-sm">
                        Estimado/a{' '}
                        {contactParty === 'tenant'
                          ? selectedDispute.tenantName
                          : selectedDispute.ownerName}
                        ,<br />
                        <br />
                        Le escribo respecto a la disputa {selectedDispute.disputeNumber} relacionada
                        con el contrato {selectedDispute.contractNumber} y la propiedad &quot;
                        {selectedDispute.propertyTitle}&quot;.
                        <br />
                        <br />
                        Como equipo de soporte de Rent360, estamos trabajando para resolver esta
                        situación de manera eficiente y justa.
                        <br />
                        <br />
                        ¿Podríamos agendar una reunión o llamada para discutir los detalles?
                        <br />
                        <br />
                        Atentamente,
                        <br />
                        Equipo de Soporte Rent360
                      </div>
                    </div>
                  </div>
                </div>

                {/* Contact Options */}
                <div>
                  <h4 className="font-semibold text-gray-900 mb-3">Opciones de Contacto</h4>
                  <div className="grid grid-cols-1 gap-3">
                    <Button
                      variant="outline"
                      className="justify-start h-auto p-4"
                      onClick={() => {
                        const phone =
                          contactParty === 'tenant'
                            ? selectedDispute.tenantPhone
                            : selectedDispute.ownerPhone;
                        window.open(`tel:${phone}`);
                        alert(`📞 Llamando a ${phone}...`);
                      }}
                    >
                      <div className="flex items-center gap-3 w-full">
                        <Phone className="w-5 h-5 text-green-600" />
                        <div className="text-left">
                          <div className="font-medium">Llamada Telefónica</div>
                          <div className="text-sm text-gray-600">Llamar directamente</div>
                        </div>
                      </div>
                    </Button>

                    <Button
                      variant="outline"
                      className="justify-start h-auto p-4"
                      onClick={() => {
                        const phone =
                          contactParty === 'tenant'
                            ? selectedDispute.tenantPhone
                            : selectedDispute.ownerPhone;
                        if (!phone) {
                          alert('Número de teléfono no disponible para este contacto.');
                          return;
                        }
                        const name =
                          contactParty === 'tenant'
                            ? selectedDispute.tenantName
                            : selectedDispute.ownerName;
                        const message = `Hola ${name}, me contacto desde Rent360 Soporte para conversar sobre la disputa ${selectedDispute.disputeNumber}.`;
                        const whatsappUrl = `https://wa.me/${phone.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`;
                        window.open(whatsappUrl, '_blank');
                      }}
                    >
                      <div className="flex items-center gap-3 w-full">
                        <MessageSquare className="w-5 h-5 text-green-600" />
                        <div className="text-left">
                          <div className="font-medium">WhatsApp</div>
                          <div className="text-sm text-gray-600">Enviar mensaje por WhatsApp</div>
                        </div>
                      </div>
                    </Button>

                    <Button
                      className="justify-start h-auto p-4 bg-blue-600 hover:bg-blue-700"
                      onClick={submitContactMessage}
                    >
                      <div className="flex items-center gap-3 w-full">
                        <Mail className="w-5 h-5 text-white" />
                        <div className="text-left">
                          <div className="font-medium">Correo Electrónico</div>
                          <div className="text-sm text-blue-100">
                            Abrir cliente de email con mensaje preparado
                          </div>
                        </div>
                      </div>
                    </Button>
                  </div>
                </div>

                <div className="bg-yellow-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-yellow-800 mb-2">💡 Recomendaciones</h4>
                  <ul className="text-sm space-y-1">
                    <li>• Mantenga un tono profesional y neutral en todas las comunicaciones</li>
                    <li>• Documente todas las conversaciones y acuerdos</li>
                    <li>• Ofrezca soluciones constructivas para resolver el conflicto</li>
                    <li>• Si es necesario, involucre a mediadores certificados</li>
                  </ul>
                </div>

                <div className="flex justify-end gap-3">
                  <Button variant="outline" onClick={() => setContactModalOpen(false)}>
                    Cerrar
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </UnifiedDashboardLayout>
  );
}

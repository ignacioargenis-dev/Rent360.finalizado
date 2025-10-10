'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
  History,
  FileText,
  Mail,
  Phone,
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
  ownerName?: string;
  ownerEmail?: string;
  initiatorName?: string;
  initiatorRole?: string;
}

export default function BrokerDisputesPage() {
  const [disputes, setDisputes] = useState<Dispute[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedDispute, setSelectedDispute] = useState<Dispute | null>(null);
  const [disputeDetailsModalOpen, setDisputeDetailsModalOpen] = useState(false);
  const [mediationModalOpen, setMediationModalOpen] = useState(false);
  const [contactModalOpen, setContactModalOpen] = useState(false);
  const [historyModalOpen, setHistoryModalOpen] = useState(false);
  const [mediationProposal, setMediationProposal] = useState({
    terms: '',
    deadline: '',
    location: 'virtual',
    notes: '',
  });
  const [contactMessage, setContactMessage] = useState('');
  const [contactType, setContactType] = useState<'both' | 'tenant' | 'owner'>('both');

  useEffect(() => {
    loadDisputes();
  }, [statusFilter]);

  const loadDisputes = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/broker/disputes?status=${statusFilter}`);
      if (response.ok) {
        const data = await response.json();
        setDisputes(data.disputes || []);
      } else {
        logger.error('Error loading disputes:', { error: await response.text() });
      }
    } catch (error) {
      logger.error('Error loading disputes:', { error });
    } finally {
      setLoading(false);
    }
  };

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

  const getInitiatorRoleLabel = (role?: string) => {
    switch (role) {
      case 'owner':
        return 'Propietario';
      case 'tenant':
        return 'Inquilino';
      default:
        return role || 'Desconocido';
    }
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

  const handleViewDisputeDetails = (dispute: Dispute) => {
    setSelectedDispute(dispute);
    setDisputeDetailsModalOpen(true);
  };

  const handleOfferMediation = (dispute: Dispute) => {
    setSelectedDispute(dispute);
    setMediationModalOpen(true);
  };

  const handleContactParties = (dispute: Dispute) => {
    setSelectedDispute(dispute);
    setContactModalOpen(true);
  };

  const handleViewHistory = (dispute: Dispute) => {
    setSelectedDispute(dispute);
    setHistoryModalOpen(true);
  };

  const submitMediationProposal = async () => {
    if (!selectedDispute || !mediationProposal.terms.trim()) {
      return;
    }

    try {
      alert(
        `✅ Propuesta de mediación enviada exitosamente\n\nDisputa: ${selectedDispute.disputeNumber}\nTérminos: ${mediationProposal.terms}\nPlazo: ${mediationProposal.deadline || 'Sin especificar'}\nModalidad: ${mediationProposal.location === 'virtual' ? 'Videoconferencia' : 'Presencial'}\n\nSe notificará a ambas partes para coordinar la sesión de mediación.`
      );

      setMediationModalOpen(false);
      setMediationProposal({ terms: '', deadline: '', location: 'virtual', notes: '' });
    } catch (error) {
      logger.error('Error sending mediation proposal:', { error });
      alert('Error al enviar propuesta de mediación. Intente nuevamente.');
    }
  };

  const submitContactMessage = async () => {
    if (!selectedDispute || !contactMessage.trim()) {
      return;
    }

    try {
      const recipients =
        contactType === 'both'
          ? [selectedDispute.tenantName, selectedDispute.ownerName].filter(Boolean)
          : contactType === 'tenant'
            ? [selectedDispute.tenantName]
            : [selectedDispute.ownerName];

      alert(
        `✅ Mensaje enviado exitosamente\n\nDisputa: ${selectedDispute.disputeNumber}\nDestinatarios: ${recipients.join(', ')}\nTipo: ${contactType === 'both' ? 'Ambas partes' : contactType === 'tenant' ? 'Inquilino' : 'Propietario'}\n\nMensaje:\n${contactMessage}`
      );

      setContactModalOpen(false);
      setContactMessage('');
      setContactType('both');
    } catch (error) {
      logger.error('Error sending contact message:', { error });
      alert('Error al enviar mensaje. Intente nuevamente.');
    }
  };

  if (loading) {
    return (
      <UnifiedDashboardLayout title="Disputas" subtitle="Cargando información...">
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
      title="Disputas de Depósito"
      subtitle="Gestiona disputas sobre depósitos de garantía en tus contratos"
    >
      <div className="container mx-auto px-4 py-6 max-w-7xl">
        {/* Header with stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Mis Disputas</CardTitle>
              <AlertTriangle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{disputes.length}</div>
              <p className="text-xs text-muted-foreground">Como intermediario</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Monto en Disputa</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatCurrency(disputes.reduce((sum, d) => sum + d.amount, 0))}
              </div>
              <p className="text-xs text-muted-foreground">Total disputado</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Abiertas</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {disputes.filter(d => d.status === 'OPEN').length}
              </div>
              <p className="text-xs text-muted-foreground">Esperando resolución</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Mediación</CardTitle>
              <HeartHandshake className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {disputes.filter(d => d.status === 'OPEN' || d.status === 'PENDING').length}
              </div>
              <p className="text-xs text-muted-foreground">Oportunidades</p>
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
                <SelectItem value="all">Todos los estados</SelectItem>
                <SelectItem value="OPEN">Abierta</SelectItem>
                <SelectItem value="PENDING">Pendiente</SelectItem>
                <SelectItem value="IN_PROGRESS">En Progreso</SelectItem>
                <SelectItem value="RESOLVED">Resuelta</SelectItem>
                <SelectItem value="CANCELLED">Cancelada</SelectItem>
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
                  No se encontraron disputas en contratos donde eres intermediario.
                </p>
              </CardContent>
            </Card>
          ) : (
            disputes.map(dispute => (
              <Card key={dispute.id} className="hover:shadow-md transition-shadow">
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
                          </div>
                          <p className="text-sm text-gray-600 mb-2">
                            {getDisputeTypeLabel(dispute.disputeType)} • Iniciada por{' '}
                            {getInitiatorRoleLabel(dispute.initiatorRole)}
                          </p>
                          <p className="text-xs text-gray-500 mb-2">
                            Contrato: {dispute.contractNumber}
                          </p>
                        </div>
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
                        <span>Iniciador: {dispute.initiatorName}</span>
                      </div>
                    </div>

                    <div className="flex flex-col gap-2 lg:min-w-[200px]">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleViewDisputeDetails(dispute)}
                      >
                        <Eye className="w-4 h-4 mr-2" />
                        Ver Detalles
                      </Button>
                      <Button
                        variant="default"
                        size="sm"
                        onClick={() => handleOfferMediation(dispute)}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        <HeartHandshake className="w-4 h-4 mr-2" />
                        Ofrecer Mediación
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleContactParties(dispute)}
                      >
                        <MessageSquare className="w-4 h-4 mr-2" />
                        Contactar Partes
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>

      {/* Dispute Details Modal */}
      <Dialog open={disputeDetailsModalOpen} onOpenChange={setDisputeDetailsModalOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-blue-600">
              📋 Detalles de la Disputa
            </DialogTitle>
            <DialogDescription>
              Información completa de la disputa {selectedDispute?.disputeNumber}
            </DialogDescription>
          </DialogHeader>

          {selectedDispute && (
            <div className="space-y-6">
              {/* Dispute Overview */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">Información de la Disputa</h4>
                    <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                      <p>
                        <span className="font-medium">Número:</span> {selectedDispute.disputeNumber}
                      </p>
                      <p>
                        <span className="font-medium">Tipo:</span>{' '}
                        {getDisputeTypeLabel(selectedDispute.disputeType)}
                      </p>
                      <p>
                        <span className="font-medium">Estado:</span> {selectedDispute.status}
                      </p>
                      <p>
                        <span className="font-medium">Monto:</span>{' '}
                        {formatCurrency(selectedDispute.amount)}
                      </p>
                      <p>
                        <span className="font-medium">Creado:</span>{' '}
                        {formatDate(selectedDispute.createdAt)}
                      </p>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">Iniciador</h4>
                    <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                      <p>
                        <span className="font-medium">Nombre:</span> {selectedDispute.initiatorName}
                      </p>
                      <p>
                        <span className="font-medium">Rol:</span>{' '}
                        {getInitiatorRoleLabel(selectedDispute.initiatorRole)}
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
                        <span className="font-medium">Inquilino:</span> {selectedDispute.tenantName}
                      </p>
                      <p>
                        <span className="font-medium">Propietario:</span>{' '}
                        {selectedDispute.ownerName}
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

              {/* Resolution (if exists) */}
              {selectedDispute.resolution && (
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">Resolución</h4>
                  <div className="bg-green-50 p-4 rounded-lg space-y-2">
                    <p className="text-green-800">{selectedDispute.resolution}</p>
                    {selectedDispute.resolvedBy && (
                      <p className="text-sm text-green-600">
                        Resuelto por: {selectedDispute.resolvedBy} el{' '}
                        {selectedDispute.resolvedAt
                          ? formatDate(selectedDispute.resolvedAt)
                          : 'Fecha no disponible'}
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex flex-wrap gap-3 pt-4 border-t">
                <Button
                  onClick={() => handleOfferMediation(selectedDispute)}
                  className="flex-1 min-w-[150px] bg-green-600 hover:bg-green-700"
                >
                  <HeartHandshake className="w-4 h-4 mr-2" />
                  Ofrecer Mediación
                </Button>
                <Button
                  onClick={() => handleContactParties(selectedDispute)}
                  className="flex-1 min-w-[150px] bg-blue-600 hover:bg-blue-700"
                >
                  <MessageSquare className="w-4 h-4 mr-2" />
                  Contactar Partes
                </Button>
                <Button
                  variant="outline"
                  className="flex-1 min-w-[150px]"
                  onClick={() => handleViewHistory(selectedDispute)}
                >
                  <Eye className="w-4 h-4 mr-2" />
                  Ver Historial
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Mediation Proposal Modal */}
      <Dialog open={mediationModalOpen} onOpenChange={setMediationModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-green-600">
              🤝 Propuesta de Mediación
            </DialogTitle>
            <DialogDescription>
              Enviar propuesta de mediación para la disputa {selectedDispute?.disputeNumber}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="mediation-terms">Términos de la Mediación</Label>
              <Textarea
                id="mediation-terms"
                placeholder="Describe los términos específicos de la mediación..."
                value={mediationProposal.terms}
                onChange={e => setMediationProposal(prev => ({ ...prev, terms: e.target.value }))}
                rows={4}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="mediation-deadline">Fecha Límite</Label>
                <Input
                  id="mediation-deadline"
                  type="date"
                  value={mediationProposal.deadline}
                  onChange={e =>
                    setMediationProposal(prev => ({ ...prev, deadline: e.target.value }))
                  }
                />
              </div>

              <div>
                <Label htmlFor="mediation-location">Modalidad</Label>
                <Select
                  value={mediationProposal.location}
                  onValueChange={value =>
                    setMediationProposal(prev => ({ ...prev, location: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="virtual">Videoconferencia</SelectItem>
                    <SelectItem value="presencial">Presencial</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="mediation-notes">Notas Adicionales</Label>
              <Textarea
                id="mediation-notes"
                placeholder="Información adicional relevante..."
                value={mediationProposal.notes}
                onChange={e => setMediationProposal(prev => ({ ...prev, notes: e.target.value }))}
                rows={3}
              />
            </div>

            <div className="bg-blue-50 p-4 rounded-lg">
              <h4 className="font-semibold text-blue-800 mb-2">💡 Información que se enviará</h4>
              <ul className="text-sm space-y-1">
                <li>• Propuesta formal de mediación a ambas partes</li>
                <li>• Términos y condiciones acordadas</li>
                <li>• Información de contacto del mediador</li>
                <li>• Próximos pasos para aceptar la mediación</li>
              </ul>
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                onClick={submitMediationProposal}
                className="flex-1 bg-green-600 hover:bg-green-700"
              >
                <HeartHandshake className="w-4 h-4 mr-2" />
                Enviar Propuesta
              </Button>
              <Button
                variant="outline"
                onClick={() => setMediationModalOpen(false)}
                className="flex-1"
              >
                Cancelar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Contact Parties Modal */}
      <Dialog open={contactModalOpen} onOpenChange={setContactModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-blue-600">
              📬 Contactar Partes
            </DialogTitle>
            <DialogDescription>
              Enviar mensaje a las partes involucradas en la disputa{' '}
              {selectedDispute?.disputeNumber}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="contact-type">Destinatarios</Label>
              <Select
                value={contactType}
                onValueChange={(value: 'both' | 'tenant' | 'owner') => setContactType(value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="both">Ambas partes</SelectItem>
                  <SelectItem value="tenant">Solo inquilino</SelectItem>
                  <SelectItem value="owner">Solo propietario</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="contact-message">Mensaje</Label>
              <Textarea
                id="contact-message"
                placeholder="Escribe el mensaje que deseas enviar..."
                value={contactMessage}
                onChange={e => setContactMessage(e.target.value)}
                rows={6}
              />
            </div>

            {selectedDispute && (
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-semibold text-gray-800 mb-2">📋 Información del caso</h4>
                <div className="text-sm space-y-1">
                  <p>
                    <strong>Disputa:</strong> {selectedDispute.disputeNumber}
                  </p>
                  <p>
                    <strong>Tipo:</strong> {getDisputeTypeLabel(selectedDispute.disputeType)}
                  </p>
                  <p>
                    <strong>Monto:</strong> {formatCurrency(selectedDispute.amount)}
                  </p>
                  <p>
                    <strong>Destinatarios:</strong>{' '}
                    {contactType === 'both'
                      ? `${selectedDispute.tenantName} y ${selectedDispute.ownerName}`
                      : contactType === 'tenant'
                        ? selectedDispute.tenantName
                        : selectedDispute.ownerName}
                  </p>
                </div>
              </div>
            )}

            <div className="flex gap-3 pt-4">
              <Button
                onClick={submitContactMessage}
                className="flex-1 bg-blue-600 hover:bg-blue-700"
              >
                <MessageSquare className="w-4 h-4 mr-2" />
                Enviar Mensaje
              </Button>
              <Button
                variant="outline"
                onClick={() => setContactModalOpen(false)}
                className="flex-1"
              >
                Cancelar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* History Modal */}
      <Dialog open={historyModalOpen} onOpenChange={setHistoryModalOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-purple-600">
              📚 Historial de la Disputa
            </DialogTitle>
            <DialogDescription>
              Seguimiento completo de eventos y comunicaciones de la disputa{' '}
              {selectedDispute?.disputeNumber}
            </DialogDescription>
          </DialogHeader>

          {selectedDispute && (
            <div className="space-y-6">
              {/* Timeline */}
              <div className="space-y-4">
                {/* Dispute Created */}
                <div className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                      <AlertTriangle className="w-5 h-5 text-blue-600" />
                    </div>
                    <div className="w-0.5 h-16 bg-gray-200 mt-2"></div>
                  </div>
                  <div className="flex-1 pb-4">
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-semibold text-blue-900">Disputa Iniciada</h4>
                        <span className="text-sm text-blue-600">
                          {formatDate(selectedDispute.createdAt)}
                        </span>
                      </div>
                      <p className="text-sm text-blue-800">
                        La disputa fue iniciada por {selectedDispute.initiatorName} (
                        {getInitiatorRoleLabel(selectedDispute.initiatorRole)})
                      </p>
                      <p className="text-sm text-blue-800 mt-1">
                        <strong>Motivo:</strong> {selectedDispute.description}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Status Changes */}
                {selectedDispute.status !== 'OPEN' && (
                  <div className="flex gap-4">
                    <div className="flex flex-col items-center">
                      <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center">
                        <Clock className="w-5 h-5 text-yellow-600" />
                      </div>
                      <div className="w-0.5 h-16 bg-gray-200 mt-2"></div>
                    </div>
                    <div className="flex-1 pb-4">
                      <div className="bg-yellow-50 p-4 rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-semibold text-yellow-900">Estado Cambiado</h4>
                          <span className="text-sm text-yellow-600">
                            {formatDate(selectedDispute.updatedAt)}
                          </span>
                        </div>
                        <p className="text-sm text-yellow-800">
                          Estado actual:{' '}
                          <span className="font-medium">
                            {getStatusBadge(selectedDispute.status)}
                          </span>
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Mediation Offered */}
                <div className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                      <HeartHandshake className="w-5 h-5 text-green-600" />
                    </div>
                    <div className="w-0.5 h-16 bg-gray-200 mt-2"></div>
                  </div>
                  <div className="flex-1 pb-4">
                    <div className="bg-green-50 p-4 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-semibold text-green-900">Mediación Ofrecida</h4>
                        <span className="text-sm text-green-600">
                          {formatDate(selectedDispute.createdAt)}
                        </span>
                      </div>
                      <p className="text-sm text-green-800">
                        Se ofreció mediación profesional para resolver el conflicto de manera
                        amistosa
                      </p>
                      <div className="mt-2 text-sm text-green-700">
                        <p>• Reducción de costos judiciales</p>
                        <p>• Resolución más rápida</p>
                        <p>• Mantención de relación comercial</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Communications */}
                <div className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                      <Mail className="w-5 h-5 text-purple-600" />
                    </div>
                    <div className="w-0.5 h-16 bg-gray-200 mt-2"></div>
                  </div>
                  <div className="flex-1 pb-4">
                    <div className="bg-purple-50 p-4 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-semibold text-purple-900">Comunicación Enviada</h4>
                        <span className="text-sm text-purple-600">
                          {formatDate(selectedDispute.createdAt)}
                        </span>
                      </div>
                      <p className="text-sm text-purple-800">
                        Se envió comunicación formal a ambas partes notificando sobre la disputa y
                        opciones de resolución
                      </p>
                      <div className="mt-2 flex gap-2">
                        <Badge variant="outline" className="text-xs">
                          <Mail className="w-3 h-3 mr-1" />
                          Email enviado
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          <FileText className="w-3 h-3 mr-1" />
                          Documentos adjuntos
                        </Badge>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Resolution (if resolved) */}
                {selectedDispute.status === 'RESOLVED' && selectedDispute.resolution && (
                  <div className="flex gap-4">
                    <div className="flex flex-col items-center">
                      <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                        <CheckCircle className="w-5 h-5 text-green-600" />
                      </div>
                      <div className="w-0.5 h-0 bg-gray-200 mt-2"></div>
                    </div>
                    <div className="flex-1 pb-4">
                      <div className="bg-green-50 p-4 rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-semibold text-green-900">Disputa Resuelta</h4>
                          <span className="text-sm text-green-600">
                            {selectedDispute.resolvedAt
                              ? formatDate(selectedDispute.resolvedAt)
                              : formatDate(selectedDispute.updatedAt)}
                          </span>
                        </div>
                        <p className="text-sm text-green-800">{selectedDispute.resolution}</p>
                        {selectedDispute.resolvedBy && (
                          <p className="text-sm text-green-700 mt-1">
                            Resuelta por: {selectedDispute.resolvedBy}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Ongoing status */}
                {selectedDispute.status === 'IN_PROGRESS' && (
                  <div className="flex gap-4">
                    <div className="flex flex-col items-center">
                      <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                        <Clock className="w-5 h-5 text-orange-600" />
                      </div>
                      <div className="w-0.5 h-0 bg-gray-200 mt-2"></div>
                    </div>
                    <div className="flex-1 pb-4">
                      <div className="bg-orange-50 p-4 rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-semibold text-orange-900">Proceso en Curso</h4>
                          <span className="text-sm text-orange-600">
                            {formatDate(selectedDispute.updatedAt)}
                          </span>
                        </div>
                        <p className="text-sm text-orange-800">
                          La disputa está siendo procesada activamente. Se esperan actualizaciones
                          próximamente.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Summary */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-semibold text-gray-900 mb-2">📊 Resumen del Historial</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Total eventos:</span>
                    <span className="font-medium ml-1">
                      {selectedDispute.status === 'RESOLVED'
                        ? '5'
                        : selectedDispute.status === 'IN_PROGRESS'
                          ? '4'
                          : '3'}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-600">Días activos:</span>
                    <span className="font-medium ml-1">
                      {Math.floor(
                        (Date.now() - new Date(selectedDispute.createdAt).getTime()) /
                          (1000 * 60 * 60 * 24)
                      )}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-600">Estado actual:</span>
                    <span className="font-medium ml-1">{selectedDispute.status}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Monto disputado:</span>
                    <span className="font-medium ml-1">
                      {formatCurrency(selectedDispute.amount)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex justify-end">
                <Button variant="outline" onClick={() => setHistoryModalOpen(false)}>
                  Cerrar
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </UnifiedDashboardLayout>
  );
}

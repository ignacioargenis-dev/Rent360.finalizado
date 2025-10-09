'use client';

import { useState, useEffect } from 'react';
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
      case 'OWNER':
        return 'Propietario';
      case 'TENANT':
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
    alert(
      `Detalles de la disputa ${dispute.disputeNumber}:\n\nTipo: ${getDisputeTypeLabel(dispute.disputeType)}\nEstado: ${dispute.status}\nMonto: ${formatCurrency(dispute.amount)}\n\nIniciada por: ${dispute.initiatorName} (${getInitiatorRoleLabel(dispute.initiatorRole)})\nDescripción: ${dispute.description}\n\nPropiedad: ${dispute.propertyTitle}\nContrato: ${dispute.contractNumber}\n\nComo corredor intermediario, puedes ofrecer servicios de mediación.`
    );
  };

  const handleOfferMediation = (dispute: Dispute) => {
    alert(
      `Ofreciendo servicios de mediación para la disputa ${dispute.disputeNumber}\n\nSe enviará una propuesta de mediación a ambas partes para resolver el conflicto de manera amistosa.`
    );
  };

  const handleContactParties = (dispute: Dispute) => {
    alert(
      `Iniciando contacto con las partes involucradas en la disputa ${dispute.disputeNumber}\n\nSe enviarán mensajes a ${dispute.tenantName} y ${dispute.ownerName} para coordinar la mediación.`
    );
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
    </UnifiedDashboardLayout>
  );
}

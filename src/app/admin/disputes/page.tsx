'use client';

// Forzar renderizado dinámico para evitar prerendering de páginas protegidas
export const dynamic = 'force-dynamic';


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
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
  Settings,
  BarChart3,
  Shield,
  UserCheck,
  Activity,
  Timer,
} from 'lucide-react';
import UnifiedDashboardLayout from '@/components/layout/UnifiedDashboardLayout';
import { logger } from '@/lib/logger-minimal';

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
  brokerName?: string;
  brokerEmail?: string;
  brokerPhone?: string;
  initiatorName?: string;
  initiatorRole?: string;
  supportPriority: string;
  mediationStatus: string;
  resolutionOptions: string[];
  daysOpen: number;
  riskLevel: string;
  assignedTo?: string;
  lastActivity: string;
  recentActivity: any[];
}

interface DisputeStats {
  total: number;
  open: number;
  pending: number;
  inProgress: number;
  resolved: number;
  cancelled: number;
  highPriority: number;
  urgent: number;
  avgResolutionTime: number;
}

export default function AdminDisputesPage() {
  const [disputes, setDisputes] = useState<Dispute[]>([]);
  const [stats, setStats] = useState<DisputeStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [selectedDispute, setSelectedDispute] = useState<Dispute | null>(null);
  const [mediationDialogOpen, setMediationDialogOpen] = useState(false);
  const [resolutionDialogOpen, setResolutionDialogOpen] = useState(false);
  const [assignmentDialogOpen, setAssignmentDialogOpen] = useState(false);
  const [mediationNotes, setMediationNotes] = useState('');
  const [resolutionType, setResolutionType] = useState('');
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [assignedAgent, setAssignedAgent] = useState('');

  useEffect(() => {
    loadDisputes();
  }, [statusFilter, priorityFilter]);

  const loadDisputes = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `/api/admin/disputes?status=${statusFilter}&priority=${priorityFilter}`
      );
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

  const getRiskBadge = (riskLevel: string) => {
    switch (riskLevel) {
      case 'LOW':
        return (
          <Badge variant="outline" className="border-green-300 text-green-700">
            Riesgo Bajo
          </Badge>
        );
      case 'MEDIUM':
        return (
          <Badge variant="outline" className="border-yellow-300 text-yellow-700">
            Riesgo Medio
          </Badge>
        );
      case 'HIGH':
        return (
          <Badge variant="outline" className="border-orange-300 text-orange-700">
            Riesgo Alto
          </Badge>
        );
      case 'CRITICAL':
        return (
          <Badge variant="outline" className="border-red-300 text-red-700">
            Riesgo Crítico
          </Badge>
        );
      default:
        return <Badge variant="outline">{riskLevel}</Badge>;
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
      ADMIN_INTERVENTION: 'Intervención Administrativa',
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

  const handleViewDisputeDetails = (dispute: Dispute) => {
    setSelectedDispute(dispute);
  };

  const handleAssignAgent = (dispute: Dispute) => {
    setSelectedDispute(dispute);
    setAssignedAgent(dispute.assignedTo || '');
    setAssignmentDialogOpen(true);
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

  const submitAssignment = async () => {
    if (!selectedDispute || !assignedAgent.trim()) {
      return;
    }

    try {
      // TODO: Implement assignment API call
      alert(`Disputa ${selectedDispute.disputeNumber} asignada al agente: ${assignedAgent}`);

      setAssignmentDialogOpen(false);
      setSelectedDispute(null);
      setAssignedAgent('');

      // Refresh disputes
      await loadDisputes();
    } catch (error) {
      logger.error('Error assigning dispute:', { error });
      alert('Error al asignar disputa. Intente nuevamente.');
    }
  };

  const submitMediation = async () => {
    if (!selectedDispute || !mediationNotes.trim()) {
      return;
    }

    try {
      // TODO: Implement mediation API call
      alert(
        `Mediación administrativa iniciada para disputa ${selectedDispute.disputeNumber}\n\nNotas: ${mediationNotes}`
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
        `Resolución administrativa aplicada a disputa ${selectedDispute.disputeNumber}\n\nTipo: ${getResolutionOptionLabel(resolutionType)}\nNotas: ${resolutionNotes}`
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

  const handleContactParty = (dispute: Dispute, party: 'tenant' | 'owner' | 'broker') => {
    let contactInfo: {
      name: string | undefined;
      email: string | undefined;
      phone: string | undefined;
    };

    switch (party) {
      case 'tenant':
        contactInfo = {
          name: dispute.tenantName,
          email: dispute.tenantEmail,
          phone: dispute.tenantPhone,
        };
        break;
      case 'owner':
        contactInfo = {
          name: dispute.ownerName,
          email: dispute.ownerEmail,
          phone: dispute.ownerPhone,
        };
        break;
      case 'broker':
        contactInfo = {
          name: dispute.brokerName,
          email: dispute.brokerEmail,
          phone: dispute.brokerPhone,
        };
        break;
      default:
        return;
    }

    const subject = `Disputa ${dispute.disputeNumber} - ${getDisputeTypeLabel(dispute.disputeType)}`;
    const body = `Estimado/a ${contactInfo.name},

Le escribo como administrador de Rent360 respecto a la disputa ${dispute.disputeNumber} relacionada con el contrato ${dispute.contractNumber} y la propiedad "${dispute.propertyTitle}".

Estamos trabajando activamente para resolver esta situación de manera eficiente y justa.

¿Podríamos coordinar una reunión o llamada para discutir los detalles?

Atentamente,
Administración Rent360`;

    // Open email client
    window.open(
      `mailto:${contactInfo.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
    );
  };

  const getEfficiencyMetrics = () => {
    if (!stats) {
      return null;
    }

    const resolutionRate =
      stats.total > 0 ? ((stats.resolved / stats.total) * 100).toFixed(1) : '0';
    const activeRate =
      stats.total > 0
        ? (((stats.open + stats.pending + stats.inProgress) / stats.total) * 100).toFixed(1)
        : '0';

    return {
      resolutionRate: `${resolutionRate}%`,
      activeRate: `${activeRate}%`,
      avgResolutionTime: `${stats.avgResolutionTime} días`,
      urgentCount: stats.urgent,
    };
  };

  const efficiencyMetrics = getEfficiencyMetrics();

  if (loading) {
    return (
      <UnifiedDashboardLayout title="Administración de Disputas" subtitle="Cargando información...">
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
      title="Administración de Disputas"
      subtitle="Panel administrativo completo para gestión de disputas"
    >
      <div className="container mx-auto px-4 py-6 max-w-7xl">
        {/* Advanced Stats Dashboard */}
        <Tabs defaultValue="overview" className="mb-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview">Vista General</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            <TabsTrigger value="settings">Configuración</TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4 mb-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total</CardTitle>
                  <AlertTriangle className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats?.total || 0}</div>
                  <p className="text-xs text-muted-foreground">Disputas activas</p>
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
                  <CardTitle className="text-sm font-medium">Urgentes</CardTitle>
                  <AlertCircle className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-red-600">{stats?.urgent || 0}</div>
                  <p className="text-xs text-muted-foreground">Atención inmediata</p>
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
                  <CardTitle className="text-sm font-medium">Tiempo Promedio</CardTitle>
                  <Timer className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{efficiencyMetrics?.avgResolutionTime}</div>
                  <p className="text-xs text-muted-foreground">Resolución</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Eficiencia</CardTitle>
                  <BarChart3 className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-blue-600">
                    {efficiencyMetrics?.resolutionRate}
                  </div>
                  <p className="text-xs text-muted-foreground">Tasa de resolución</p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="analytics">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
              <Card>
                <CardHeader>
                  <CardTitle>Métricas de Eficiencia</CardTitle>
                  <CardDescription>Indicadores clave de rendimiento</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Tasa de Resolución:</span>
                    <Badge className="bg-green-100 text-green-800">
                      {efficiencyMetrics?.resolutionRate}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Disputas Activas:</span>
                    <Badge className="bg-blue-100 text-blue-800">
                      {efficiencyMetrics?.activeRate}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Tiempo Promedio:</span>
                    <Badge className="bg-purple-100 text-purple-800">
                      {efficiencyMetrics?.avgResolutionTime}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Casos Urgentes:</span>
                    <Badge className="bg-red-100 text-red-800">
                      {efficiencyMetrics?.urgentCount}
                    </Badge>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Distribución por Riesgo</CardTitle>
                  <CardDescription>Niveles de riesgo actuales</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Riesgo Crítico:</span>
                    <Badge className="bg-red-100 text-red-800">
                      {disputes.filter(d => d.riskLevel === 'CRITICAL').length}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Riesgo Alto:</span>
                    <Badge className="bg-orange-100 text-orange-800">
                      {disputes.filter(d => d.riskLevel === 'HIGH').length}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Riesgo Medio:</span>
                    <Badge className="bg-yellow-100 text-yellow-800">
                      {disputes.filter(d => d.riskLevel === 'MEDIUM').length}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Riesgo Bajo:</span>
                    <Badge className="bg-green-100 text-green-800">
                      {disputes.filter(d => d.riskLevel === 'LOW').length}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="settings">
            <Card>
              <CardHeader>
                <CardTitle>Configuración del Sistema de Disputas</CardTitle>
                <CardDescription>Parámetros y configuraciones administrativas</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">Umbral de Prioridad Alta</label>
                    <Select defaultValue="500000">
                      <SelectTrigger className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="100000">$100.000</SelectItem>
                        <SelectItem value="250000">$250.000</SelectItem>
                        <SelectItem value="500000">$500.000</SelectItem>
                        <SelectItem value="1000000">$1.000.000</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="text-sm font-medium">Tiempo Máximo de Resolución</label>
                    <Select defaultValue="30">
                      <SelectTrigger className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="15">15 días</SelectItem>
                        <SelectItem value="30">30 días</SelectItem>
                        <SelectItem value="45">45 días</SelectItem>
                        <SelectItem value="60">60 días</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="pt-4">
                  <Button className="bg-blue-600 hover:bg-blue-700">
                    <Settings className="w-4 h-4 mr-2" />
                    Guardar Configuración
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Filters */}
        <div className="flex items-center gap-4 mb-6">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">Estado:</span>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los estados</SelectItem>
                <SelectItem value="OPEN">Abiertas</SelectItem>
                <SelectItem value="PENDING">Pendientes</SelectItem>
                <SelectItem value="IN_PROGRESS">En Progreso</SelectItem>
                <SelectItem value="RESOLVED">Resueltas</SelectItem>
                <SelectItem value="CANCELLED">Canceladas</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">Prioridad:</span>
            <Select value={priorityFilter} onValueChange={setPriorityFilter}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas las prioridades</SelectItem>
                <SelectItem value="URGENT">Urgente</SelectItem>
                <SelectItem value="HIGH">Alta</SelectItem>
                <SelectItem value="MEDIUM">Media</SelectItem>
                <SelectItem value="LOW">Baja</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Disputes List */}
        <div className="space-y-4">
          {disputes.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <Shield className="w-16 h-16 text-gray-300 mx-auto mb-4" />
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
                      : dispute.riskLevel === 'CRITICAL'
                        ? 'border-red-400 bg-red-50'
                        : dispute.riskLevel === 'HIGH'
                          ? 'border-orange-400 bg-orange-50'
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
                            {getRiskBadge(dispute.riskLevel)}
                          </div>
                          <p className="text-sm text-gray-600 mb-2">
                            {getDisputeTypeLabel(dispute.disputeType)} • {dispute.daysOpen} días
                            abierta
                          </p>
                          <p className="text-xs text-gray-500 mb-2">
                            Contrato: {dispute.contractNumber} • Broker:{' '}
                            {dispute.brokerName || 'Sin asignar'}
                          </p>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                          {dispute.assignedTo && (
                            <Badge className="bg-purple-100 text-purple-800">
                              Asignado: {dispute.assignedTo}
                            </Badge>
                          )}
                          {dispute.mediationStatus === 'IN_PROGRESS' && (
                            <Badge className="bg-blue-100 text-blue-800">Mediación Activa</Badge>
                          )}
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 text-sm text-gray-600 mb-3">
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
                          <UserCheck className="w-4 h-4 text-gray-400" />
                          <div>
                            <span className="font-medium">Broker:</span>
                            <p className="truncate">{dispute.brokerName || 'N/A'}</p>
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
                        <span>Última actividad: {formatDate(dispute.lastActivity)}</span>
                      </div>
                    </div>

                    <div className="flex flex-col gap-2 lg:min-w-[300px]">
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
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleAssignAgent(dispute)}
                          className="flex-1"
                        >
                          <UserCheck className="w-4 h-4 mr-2" />
                          Asignar
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
                          Inquilino
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleContactParty(dispute, 'owner')}
                          className="flex-1"
                        >
                          <Mail className="w-4 h-4 mr-2" />
                          Propietario
                        </Button>
                        {dispute.brokerName && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleContactParty(dispute, 'broker')}
                            className="flex-1"
                          >
                            <Mail className="w-4 h-4 mr-2" />
                            Broker
                          </Button>
                        )}
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
                            Mediación Admin
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

        {/* Assignment Dialog */}
        <Dialog open={assignmentDialogOpen} onOpenChange={setAssignmentDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Asignar Agente</DialogTitle>
              <DialogDescription>
                Asigne un agente administrativo a la disputa {selectedDispute?.disputeNumber}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Agente Asignado</label>
                <Select value={assignedAgent} onValueChange={setAssignedAgent}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Seleccione un agente" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="agente1">María González (Senior)</SelectItem>
                    <SelectItem value="agente2">Carlos Rodríguez (Senior)</SelectItem>
                    <SelectItem value="agente3">Ana López (Junior)</SelectItem>
                    <SelectItem value="agente4">Pedro Martínez (Supervisor)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setAssignmentDialogOpen(false)}>
                Cancelar
              </Button>
              <Button
                onClick={submitAssignment}
                disabled={!assignedAgent}
                className="bg-purple-600 hover:bg-purple-700"
              >
                <UserCheck className="w-4 h-4 mr-2" />
                Asignar Agente
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Mediation Dialog */}
        <Dialog open={mediationDialogOpen} onOpenChange={setMediationDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Mediación Administrativa</DialogTitle>
              <DialogDescription>
                Configure la mediación administrativa para la disputa{' '}
                {selectedDispute?.disputeNumber}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Plan de Mediación Administrativa</label>
                <Textarea
                  placeholder="Describa el plan de mediación administrativa, incluyendo pasos legales, comunicaciones y plazos..."
                  value={mediationNotes}
                  onChange={e => setMediationNotes(e.target.value)}
                  className="mt-1"
                  rows={6}
                />
              </div>

              <div className="bg-blue-50 p-4 rounded-lg">
                <h4 className="font-medium text-blue-900 mb-2">
                  Proceso de Mediación Administrativa:
                </h4>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• Revisión exhaustiva de la documentación</li>
                  <li>• Contacto con todas las partes involucradas</li>
                  <li>• Evaluación legal de la disputa</li>
                  <li>• Propuesta de resolución administrativa</li>
                  <li>• Seguimiento y aplicación de la resolución</li>
                  <li>• Escalada a arbitraje si es necesario</li>
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
                Iniciar Mediación Admin
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Resolution Dialog */}
        <Dialog open={resolutionDialogOpen} onOpenChange={setResolutionDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Resolución Administrativa</DialogTitle>
              <DialogDescription>
                Aplique una resolución administrativa a la disputa {selectedDispute?.disputeNumber}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Tipo de Resolución Administrativa</label>
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
                <label className="text-sm font-medium">Fundamento y Notas de la Resolución</label>
                <Textarea
                  placeholder="Describa el fundamento legal, los hechos considerados y la resolución administrativa aplicada..."
                  value={resolutionNotes}
                  onChange={e => setResolutionNotes(e.target.value)}
                  className="mt-1"
                  rows={6}
                />
              </div>

              {resolutionType && (
                <div className="bg-green-50 p-4 rounded-lg">
                  <h4 className="font-medium text-green-900 mb-2">
                    Resolución Seleccionada: {getResolutionOptionLabel(resolutionType)}
                  </h4>
                  <p className="text-sm text-green-800">
                    Esta resolución administrativa será aplicada y todas las partes serán
                    notificadas formalmente. La resolución tendrá carácter vinculante según las
                    políticas de Rent360.
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
                Aplicar Resolución Admin
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </UnifiedDashboardLayout>
  );
}

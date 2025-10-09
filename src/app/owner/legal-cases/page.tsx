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
  FileText,
  AlertTriangle,
  Calendar,
  DollarSign,
  User,
  Home,
  Clock,
  CheckCircle,
  XCircle,
  Eye,
  Download,
  MessageSquare,
  TrendingUp,
  Scale,
} from 'lucide-react';
import UnifiedDashboardLayout from '@/components/layout/UnifiedDashboardLayout';
import { logger } from '@/lib/logger';

interface LegalCase {
  id: string;
  caseNumber: string;
  caseType: string;
  status: string;
  currentPhase: string;
  priority: string;
  totalDebt: number;
  accumulatedInterest: number;
  legalFees: number;
  courtFees: number;
  totalAmount: number;
  firstDefaultDate: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  propertyTitle?: string;
  propertyAddress?: string;
  tenantName?: string;
  tenantEmail?: string;
  brokerName?: string;
  recentAuditLogs: any[];
  unreadNotificationsCount: number;
}

export default function LegalCasesPage() {
  const [legalCases, setLegalCases] = useState<LegalCase[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedCase, setSelectedCase] = useState<LegalCase | null>(null);

  useEffect(() => {
    loadLegalCases();
  }, [statusFilter]);

  const loadLegalCases = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/owner/legal-cases?status=${statusFilter}`);
      if (response.ok) {
        const data = await response.json();
        setLegalCases(data.legalCases || []);
      } else {
        logger.error('Error loading legal cases:', { error: await response.text() });
      }
    } catch (error) {
      logger.error('Error loading legal cases:', { error });
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PRE_JUDICIAL':
        return <Badge className="bg-yellow-100 text-yellow-800">Pre-Judicial</Badge>;
      case 'JUDICIAL':
        return <Badge className="bg-orange-100 text-orange-800">Judicial</Badge>;
      case 'EXECUTION':
        return <Badge className="bg-red-100 text-red-800">Ejecución</Badge>;
      case 'CLOSED':
        return <Badge className="bg-green-100 text-green-800">Cerrado</Badge>;
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

  const getCaseTypeLabel = (caseType: string) => {
    switch (caseType) {
      case 'NON_PAYMENT':
        return 'Incumplimiento de Pago';
      case 'CONTRACT_BREACH':
        return 'Incumplimiento Contractual';
      case 'PROPERTY_DAMAGE':
        return 'Daño a la Propiedad';
      case 'OTHER':
        return 'Otro';
      default:
        return caseType;
    }
  };

  const getPhaseLabel = (phase: string) => {
    switch (phase) {
      case 'PRE_JUDICIAL':
        return 'Pre-Judicial';
      case 'EXTRAJUDICIAL_NOTICE':
        return 'Requerimiento Extrajudicial';
      case 'DEMAND_FILED':
        return 'Demanda Presentada';
      case 'HEARING':
        return 'Audiencia';
      case 'JUDGMENT':
        return 'Sentencia';
      case 'EXECUTION':
        return 'Ejecución';
      case 'CLOSED':
        return 'Cerrado';
      default:
        return phase;
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

  const handleViewCaseDetails = (legalCase: LegalCase) => {
    setSelectedCase(legalCase);
    // TODO: Implement modal or navigation to case details
    alert(
      `Detalles del caso ${legalCase.caseNumber}:\n\nTipo: ${getCaseTypeLabel(legalCase.caseType)}\nEstado: ${legalCase.status}\nFase: ${getPhaseLabel(legalCase.currentPhase)}\nMonto Total: ${formatCurrency(legalCase.totalAmount)}\n\nPropiedad: ${legalCase.propertyTitle}\nInquilino: ${legalCase.tenantName}`
    );
  };

  const handleDownloadDocuments = (legalCase: LegalCase) => {
    // TODO: Implement document download
    alert(`Descargando documentos del caso ${legalCase.caseNumber}`);
  };

  const handleSendMessage = (legalCase: LegalCase) => {
    // TODO: Implement messaging to legal team
    alert(`Enviando mensaje sobre el caso ${legalCase.caseNumber}`);
  };

  if (loading) {
    return (
      <UnifiedDashboardLayout title="Casos Legales" subtitle="Cargando información...">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Cargando casos legales...</p>
          </div>
        </div>
      </UnifiedDashboardLayout>
    );
  }

  return (
    <UnifiedDashboardLayout
      title="Casos Legales"
      subtitle="Gestiona tus casos legales y procesos judiciales"
    >
      <div className="container mx-auto px-4 py-6 max-w-7xl">
        {/* Header with stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Casos</CardTitle>
              <Scale className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{legalCases.length}</div>
              <p className="text-xs text-muted-foreground">Casos activos</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Monto Total</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatCurrency(legalCases.reduce((sum, c) => sum + c.totalAmount, 0))}
              </div>
              <p className="text-xs text-muted-foreground">En disputa</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pre-Judiciales</CardTitle>
              <AlertTriangle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {legalCases.filter(c => c.status === 'PRE_JUDICIAL').length}
              </div>
              <p className="text-xs text-muted-foreground">Casos activos</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Notificaciones</CardTitle>
              <MessageSquare className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {legalCases.reduce((sum, c) => sum + c.unreadNotificationsCount, 0)}
              </div>
              <p className="text-xs text-muted-foreground">Sin leer</p>
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
                <SelectItem value="PRE_JUDICIAL">Pre-Judicial</SelectItem>
                <SelectItem value="JUDICIAL">Judicial</SelectItem>
                <SelectItem value="EXECUTION">Ejecución</SelectItem>
                <SelectItem value="CLOSED">Cerrado</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Cases List */}
        <div className="space-y-4">
          {legalCases.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <Scale className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No hay casos legales</h3>
                <p className="text-gray-600">
                  No se encontraron casos legales con los filtros seleccionados.
                </p>
              </CardContent>
            </Card>
          ) : (
            legalCases.map(legalCase => (
              <Card key={legalCase.id} className="hover:shadow-md transition-shadow">
                <CardContent className="pt-6">
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="text-lg font-semibold text-gray-900">
                              Caso {legalCase.caseNumber}
                            </h3>
                            {getStatusBadge(legalCase.status)}
                            {getPriorityBadge(legalCase.priority)}
                          </div>
                          <p className="text-sm text-gray-600 mb-2">
                            {getCaseTypeLabel(legalCase.caseType)} • Fase:{' '}
                            {getPhaseLabel(legalCase.currentPhase)}
                          </p>
                        </div>
                        {legalCase.unreadNotificationsCount > 0 && (
                          <Badge className="bg-red-100 text-red-800">
                            {legalCase.unreadNotificationsCount} nuevas
                          </Badge>
                        )}
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm text-gray-600 mb-3">
                        <div className="flex items-center gap-2">
                          <Home className="w-4 h-4 text-gray-400" />
                          <div>
                            <span className="font-medium">Propiedad:</span>
                            <p className="truncate">{legalCase.propertyTitle}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4 text-gray-400" />
                          <div>
                            <span className="font-medium">Inquilino:</span>
                            <p className="truncate">{legalCase.tenantName}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <DollarSign className="w-4 h-4 text-gray-400" />
                          <div>
                            <span className="font-medium">Monto Total:</span>
                            <p className="font-semibold text-gray-900">
                              {formatCurrency(legalCase.totalAmount)}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-gray-400" />
                          <div>
                            <span className="font-medium">Inicio:</span>
                            <p>{formatDate(legalCase.firstDefaultDate)}</p>
                          </div>
                        </div>
                      </div>

                      {legalCase.notes && (
                        <div className="mb-3">
                          <span className="text-sm font-medium text-gray-700">Notas:</span>
                          <p className="text-sm text-gray-600 mt-1">{legalCase.notes}</p>
                        </div>
                      )}

                      <div className="flex items-center justify-between text-xs text-gray-500">
                        <span>Creado: {formatDate(legalCase.createdAt)}</span>
                        <span>Actualizado: {formatDate(legalCase.updatedAt)}</span>
                      </div>
                    </div>

                    <div className="flex flex-col gap-2 lg:min-w-[200px]">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleViewCaseDetails(legalCase)}
                      >
                        <Eye className="w-4 h-4 mr-2" />
                        Ver Detalles
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDownloadDocuments(legalCase)}
                      >
                        <Download className="w-4 h-4 mr-2" />
                        Documentos
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleSendMessage(legalCase)}
                      >
                        <MessageSquare className="w-4 h-4 mr-2" />
                        Mensaje Legal
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

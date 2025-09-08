'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  AlertTriangle, 
  Clock, 
  DollarSign, 
  FileText, 
  Gavel, 
  Home, 
  Mail, 
  Phone, 
  Search,
  Calendar,
  TrendingUp,
  Users,
  Building2
} from 'lucide-react';

interface LegalCase {
  id: string;
  caseNumber: string;
  caseType: string;
  status: string;
  priority: string;
  totalDebt: number;
  totalAmount: number;
  firstDefaultDate: string;
  nextDeadline: string;
  contract: {
    property: {
      title: string;
      address: string;
      city: string;
    };
    tenant: {
      name: string;
      email: string;
      phone: string;
    };
    owner: {
      name: string;
      email: string;
      phone: string;
    };
  };
  extrajudicialNotices: any[];
  legalDocuments: any[];
  courtProceedings: any[];
}

interface DashboardStats {
  overview: {
    totalCases: number;
    pendingCases: number;
    activeCases: number;
    closedCases: number;
    casesNeedingAttention: number;
  };
  financial: {
    totalDebt: number;
    totalLegalFees: number;
    totalCourtFees: number;
    totalAmount: number;
  };
  performance: {
    averageProcessingDays: number;
    casesByStatus: Record<string, number>;
    casesByType: Record<string, number>;
    casesByPriority: Record<string, number>;
  };
}

const LegalCasesDashboard: React.FC = () => {
  const [legalCases, setLegalCases] = useState<LegalCase[]>([]);
  const [dashboardStats, setDashboardStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState({
    status: '',
    caseType: '',
    priority: '',
    search: '',
    page: 1,
    limit: 10
  });
  const [pagination, setPagination] = useState({
    total: 0,
    pages: 0,
    currentPage: 1
  });

  // Cargar datos del dashboard
  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams({
        page: filters.page.toString(),
        limit: filters.limit.toString(),
        ...(filters.status && { status: filters.status }),
        ...(filters.caseType && { caseType: filters.caseType }),
        ...(filters.priority && { priority: filters.priority }),
        ...(filters.search && { search: filters.search })
      });

      const response = await fetch(`/api/admin/legal-cases?${queryParams}`);
      if (!response.ok) {
        throw new Error('Error al cargar datos del dashboard');
      }

      const data = await response.json();
      setLegalCases(data.data.cases);
      setDashboardStats(data.data.dashboard);
      setPagination({
        total: data.data.pagination.total,
        pages: data.data.pagination.pages,
        currentPage: data.data.pagination.page
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, [filters]);

  // Función para formatear fechas
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-CL', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  // Función para obtener el color del badge según el estado
  const getStatusColor = (status: string) => {
    const statusColors: Record<string, string> = {
      'PRE_JUDICIAL': 'bg-blue-100 text-blue-800',
      'EXTRAJUDICIAL_NOTICE': 'bg-yellow-100 text-yellow-800',
      'WAITING_RESPONSE': 'bg-orange-100 text-orange-800',
      'DEMAND_FILED': 'bg-purple-100 text-purple-800',
      'COURT_PROCESS': 'bg-indigo-100 text-indigo-800',
      'HEARING_SCHEDULED': 'bg-pink-100 text-pink-800',
      'JUDGMENT_ISSUED': 'bg-green-100 text-green-800',
      'EVICTION_ORDERED': 'bg-red-100 text-red-800',
      'CASE_CLOSED': 'bg-gray-100 text-gray-800'
    };
    return statusColors[status] || 'bg-gray-100 text-gray-800';
  };

  // Función para obtener el color del badge según la prioridad
  const getPriorityColor = (priority: string) => {
    const priorityColors: Record<string, string> = {
      'LOW': 'bg-green-100 text-green-800',
      'MEDIUM': 'bg-yellow-100 text-yellow-800',
      'HIGH': 'bg-orange-100 text-orange-800',
      'URGENT': 'bg-red-100 text-red-800',
      'CRITICAL': 'bg-red-200 text-red-900'
    };
    return priorityColors[priority] || 'bg-gray-100 text-gray-800';
  };

  // Función para formatear el tipo de caso
  const formatCaseType = (caseType: string) => {
    const caseTypeLabels: Record<string, string> = {
      'EVICTION_NON_PAYMENT': 'Desahucio por falta de pago',
      'DAMAGE_CLAIM': 'Reclamación por daños',
      'BREACH_OF_CONTRACT': 'Incumplimiento de contrato',
      'ILLEGAL_OCCUPATION': 'Ocupación ilegal',
      'RENT_INCREASE_DISPUTE': 'Disputa por aumento de renta',
      'SECURITY_DEPOSIT_DISPUTE': 'Disputa por depósito de garantía',
      'UTILITY_PAYMENT_DISPUTE': 'Disputa por pago de servicios'
    };
    return caseTypeLabels[caseType] || caseType;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <p className="text-red-600">{error}</p>
          <Button onClick={loadDashboardData} className="mt-4">
            Reintentar
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header del Dashboard */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard de Casos Legales</h1>
          <p className="text-gray-600">Gestión integral de procedimientos legales inmobiliarios</p>
        </div>
        <Button className="bg-blue-600 hover:bg-blue-700">
          <FileText className="h-4 w-4 mr-2" />
          Nuevo Caso Legal
        </Button>
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle>Filtros de Búsqueda</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Input
                placeholder="Buscar por número de caso..."
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value, page: 1 })}
              />
            </div>
            <Select value={filters.status} onValueChange={(value) => setFilters({ ...filters, status: value, page: 1 })}>
              <SelectTrigger>
                <SelectValue placeholder="Estado del caso" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Todos los estados</SelectItem>
                <SelectItem value="PRE_JUDICIAL">Pre-judicial</SelectItem>
                <SelectItem value="EXTRAJUDICIAL_NOTICE">Notificación extrajudicial</SelectItem>
                <SelectItem value="WAITING_RESPONSE">Esperando respuesta</SelectItem>
                <SelectItem value="DEMAND_FILED">Demanda presentada</SelectItem>
                <SelectItem value="COURT_PROCESS">En proceso judicial</SelectItem>
                <SelectItem value="HEARING_SCHEDULED">Audiencia programada</SelectItem>
                <SelectItem value="JUDGMENT_ISSUED">Sentencia emitida</SelectItem>
                <SelectItem value="EVICTION_ORDERED">Lanzamiento ordenado</SelectItem>
                <SelectItem value="CASE_CLOSED">Caso cerrado</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filters.caseType} onValueChange={(value) => setFilters({ ...filters, caseType: value, page: 1 })}>
              <SelectTrigger>
                <SelectValue placeholder="Tipo de caso" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Todos los tipos</SelectItem>
                <SelectItem value="EVICTION_NON_PAYMENT">Desahucio por falta de pago</SelectItem>
                <SelectItem value="DAMAGE_CLAIM">Reclamación por daños</SelectItem>
                <SelectItem value="BREACH_OF_CONTRACT">Incumplimiento de contrato</SelectItem>
                <SelectItem value="ILLEGAL_OCCUPATION">Ocupación ilegal</SelectItem>
                <SelectItem value="RENT_INCREASE_DISPUTE">Disputa por aumento de renta</SelectItem>
                <SelectItem value="SECURITY_DEPOSIT_DISPUTE">Disputa por depósito de garantía</SelectItem>
                <SelectItem value="UTILITY_PAYMENT_DISPUTE">Disputa por pago de servicios</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filters.priority} onValueChange={(value) => setFilters({ ...filters, priority: value, page: 1 })}>
              <SelectTrigger>
                <SelectValue placeholder="Prioridad" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Todas las prioridades</SelectItem>
                <SelectItem value="LOW">Baja</SelectItem>
                <SelectItem value="MEDIUM">Media</SelectItem>
                <SelectItem value="HIGH">Alta</SelectItem>
                <SelectItem value="URGENT">Urgente</SelectItem>
                <SelectItem value="CRITICAL">Crítica</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Estadísticas del Dashboard */}
      {dashboardStats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total de Casos</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{dashboardStats.overview.totalCases}</div>
              <p className="text-xs text-muted-foreground">
                {dashboardStats.overview.casesNeedingAttention} requieren atención
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Casos Activos</CardTitle>
              <Gavel className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{dashboardStats.overview.activeCases}</div>
              <p className="text-xs text-muted-foreground">
                En proceso judicial
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Deuda Total</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                ${dashboardStats.financial.totalDebt.toLocaleString('es-CL')}
              </div>
              <p className="text-xs text-muted-foreground">
                + ${dashboardStats.financial.totalLegalFees.toLocaleString('es-CL')} honorarios
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Tiempo Promedio</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{dashboardStats.performance.averageProcessingDays}</div>
              <p className="text-xs text-muted-foreground">
                días de procesamiento
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Tabs principales */}
      <Tabs defaultValue="cases" className="space-y-4">
        <TabsList>
          <TabsTrigger value="cases">Casos Legales</TabsTrigger>
          <TabsTrigger value="overview">Vista General</TabsTrigger>
          <TabsTrigger value="analytics">Analíticas</TabsTrigger>
        </TabsList>

        {/* Tab: Casos Legales */}
        <TabsContent value="cases" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Lista de Casos Legales</CardTitle>
              <CardDescription>
                {pagination.total} casos encontrados • Página {pagination.currentPage} de {pagination.pages}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[600px]">
                <div className="space-y-4">
                  {legalCases.map((legalCase) => (
                    <Card key={legalCase.id} className="hover:shadow-md transition-shadow">
                      <CardContent className="p-4">
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <h3 className="font-semibold text-lg">{legalCase.caseNumber}</h3>
                            <p className="text-sm text-gray-600">{formatCaseType(legalCase.caseType)}</p>
                          </div>
                          <div className="flex gap-2">
                            <Badge className={getStatusColor(legalCase.status)}>
                              {legalCase.status.replace(/_/g, ' ')}
                            </Badge>
                            <Badge className={getPriorityColor(legalCase.priority)}>
                              {legalCase.priority}
                            </Badge>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                          <div>
                            <h4 className="font-medium text-sm text-gray-700 mb-2">Propiedad</h4>
                            <div className="flex items-center gap-2 text-sm">
                              <Home className="h-4 w-4 text-gray-500" />
                              <span>{legalCase.contract.property.title}</span>
                            </div>
                            <p className="text-sm text-gray-600 ml-6">
                              {legalCase.contract.property.address}, {legalCase.contract.property.city}
                            </p>
                          </div>

                          <div>
                            <h4 className="font-medium text-sm text-gray-700 mb-2">Montos</h4>
                            <div className="space-y-1 text-sm">
                              <div className="flex justify-between">
                                <span>Deuda:</span>
                                <span className="font-medium">${legalCase.totalDebt.toLocaleString('es-CL')}</span>
                              </div>
                              <div className="flex justify-between">
                                <span>Total:</span>
                                <span className="font-medium">${legalCase.totalAmount.toLocaleString('es-CL')}</span>
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                          <div>
                            <h4 className="font-medium text-sm text-gray-700 mb-2">Inquilino</h4>
                            <div className="flex items-center gap-2 text-sm">
                              <Users className="h-4 w-4 text-gray-500" />
                              <span>{legalCase.contract.tenant.name}</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm ml-6">
                              <Mail className="h-3 w-3 text-gray-500" />
                              <span>{legalCase.contract.tenant.email}</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm ml-6">
                              <Phone className="h-3 w-3 text-gray-500" />
                              <span>{legalCase.contract.tenant.phone}</span>
                            </div>
                          </div>

                          <div>
                            <h4 className="font-medium text-sm text-gray-700 mb-2">Propietario</h4>
                            <div className="flex items-center gap-2 text-sm">
                              <Building2 className="h-4 w-4 text-gray-500" />
                              <span>{legalCase.contract.owner.name}</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm ml-6">
                              <Mail className="h-3 w-3 text-gray-500" />
                              <span>{legalCase.contract.owner.email}</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm ml-6">
                              <Phone className="h-3 w-3 text-gray-500" />
                              <span>{legalCase.contract.owner.phone}</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex justify-between items-center pt-3 border-t">
                          <div className="flex gap-4 text-sm text-gray-600">
                            <div className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              <span>Primer impago: {formatDate(legalCase.firstDefaultDate)}</span>
                            </div>
                            {legalCase.nextDeadline && (
                              <div className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                <span>Próximo plazo: {formatDate(legalCase.nextDeadline)}</span>
                              </div>
                            )}
                          </div>
                          <div className="flex gap-2">
                            <Button variant="outline" size="sm">
                              Ver Detalles
                            </Button>
                            <Button variant="outline" size="sm">
                              Actualizar Estado
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </ScrollArea>

              {/* Paginación */}
              {pagination.pages > 1 && (
                <div className="flex justify-center items-center gap-2 mt-6">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={pagination.currentPage === 1}
                    onClick={() => setFilters({ ...filters, page: pagination.currentPage - 1 })}
                  >
                    Anterior
                  </Button>
                  <span className="text-sm text-gray-600">
                    Página {pagination.currentPage} de {pagination.pages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={pagination.currentPage === pagination.pages}
                    onClick={() => setFilters({ ...filters, page: pagination.currentPage + 1 })}
                  >
                    Siguiente
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Vista General */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Casos por Estado */}
            <Card>
              <CardHeader>
                <CardTitle>Casos por Estado</CardTitle>
              </CardHeader>
              <CardContent>
                {dashboardStats && (
                  <div className="space-y-3">
                    {Object.entries(dashboardStats.performance.casesByStatus).map(([status, count]) => (
                      <div key={status} className="flex justify-between items-center">
                        <span className="text-sm capitalize">{status.replace(/_/g, ' ').toLowerCase()}</span>
                        <Badge variant="secondary">{count}</Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Casos por Tipo */}
            <Card>
              <CardHeader>
                <CardTitle>Casos por Tipo</CardTitle>
              </CardHeader>
              <CardContent>
                {dashboardStats && (
                  <div className="space-y-3">
                    {Object.entries(dashboardStats.performance.casesByType).map(([type, count]) => (
                      <div key={type} className="flex justify-between items-center">
                        <span className="text-sm">{formatCaseType(type)}</span>
                        <Badge variant="secondary">{count}</Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Tab: Analíticas */}
        <TabsContent value="analytics" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Métricas de Rendimiento</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-blue-600">
                    {dashboardStats?.performance.averageProcessingDays || 0}
                  </div>
                  <p className="text-sm text-gray-600">Días promedio de procesamiento</p>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-green-600">
                    {dashboardStats?.overview.closedCases || 0}
                  </div>
                  <p className="text-sm text-gray-600">Casos cerrados exitosamente</p>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-orange-600">
                    {dashboardStats?.overview.casesNeedingAttention || 0}
                  </div>
                  <p className="text-sm text-gray-600">Casos que requieren atención</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default LegalCasesDashboard;

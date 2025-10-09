'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Search, 
  Filter, 
  Calendar, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  DollarSign,
  FileText,
  Users,
  Building,
  Phone,
  Mail,
  MapPin,
  Plus,
  Edit,
  Eye,
  MessageSquare
} from 'lucide-react';

interface LegalCase {
  id: string;
  caseNumber: string;
  status: string;
  caseType: string;
  priority: string;
  createdAt: string;
  nextDeadline?: string;
  notes?: string;
  internalNotes?: string;
  assignedTo?: string;
  contract: {
    property: {
      title: string;
      address: string;
      city: string;
      commune: string;
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
    broker?: {
      name: string;
      email: string;
      phone: string;
    };
    payments: Array<{
      amount: number;
      dueDate: string;
      status: string;
      lateFees: number;
    }>;
  };
  extrajudicialNotices: Array<{
    id: string;
    noticeType: string;
    status: string;
    createdAt: string;
  }>;
  legalDocuments: Array<{
    id: string;
    fileName: string;
    documentType: string;
    uploadedAt: string;
  }>;
  courtProceedings: Array<{
    id: string;
    proceedingType: string;
    status: string;
    scheduledDate?: string;
  }>;
}

interface LegalCasesResponse {
  cases: LegalCase[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

const LegalCasesSupportDashboard: React.FC = () => {
  const [legalCases, setLegalCases] = useState<LegalCase[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [priorityFilter, setPriorityFilter] = useState<string>('');
  const [caseTypeFilter, setCaseTypeFilter] = useState<string>('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedCase, setSelectedCase] = useState<LegalCase | null>(null);
  const [showCaseDetails, setShowCaseDetails] = useState(false);
  const [newNote, setNewNote] = useState('');

  // Estados para estadísticas
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    urgent: 0,
    overdue: 0,
    pendingResponse: 0
  });

  useEffect(() => {
    fetchLegalCases();
  }, [currentPage, statusFilter, priorityFilter, caseTypeFilter]);

  const fetchLegalCases = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '10'
      });

      if (statusFilter) params.append('status', statusFilter);
      if (priorityFilter) params.append('priority', priorityFilter);
      if (caseTypeFilter) params.append('caseType', caseTypeFilter);
      if (searchTerm) params.append('search', searchTerm);

      // Intentar obtener datos reales de la API
      try {
        const response = await fetch(`/api/support/legal-cases?${params}`);

        if (response.ok) {
          const responseData = await response.json();
          if (responseData.success && responseData.data) {
            const data: LegalCasesResponse = responseData.data;
            setLegalCases(data.cases || []);
            setTotalPages(data.pagination?.pages || 1);
            calculateStats(data.cases || []);
            return;
          }
        }
      } catch (apiError) {
        console.warn('API no disponible, usando datos simulados:', apiError);
      }

      // Usar datos simulados si la API no está disponible
      const mockData = generateMockLegalCases();
      const filteredCases = filterMockCases(mockData);
      const startIndex = (currentPage - 1) * 10;
      const endIndex = startIndex + 10;

      setLegalCases(filteredCases.slice(startIndex, endIndex));
      setTotalPages(Math.ceil(filteredCases.length / 10));
      calculateStats(filteredCases);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }
  };

  const generateMockLegalCases = (): LegalCase[] => {
    const cases: LegalCase[] = [];
    const statuses = ['PRE_JUDICIAL', 'EXTRAJUDICIAL_NOTICE', 'WAITING_RESPONSE', 'DEMAND_PREPARATION', 'DEMAND_FILED', 'COURT_PROCESS'];
    const priorities = ['LOW', 'MEDIUM', 'HIGH', 'URGENT'];
    const caseTypes = ['EVICTION_NON_PAYMENT', 'DAMAGE_CLAIM', 'BREACH_OF_CONTRACT'];

    for (let i = 0; i < 50; i++) {
      const status = statuses[Math.floor(Math.random() * statuses.length)] || 'PRE_JUDICIAL';
      const priority = priorities[Math.floor(Math.random() * priorities.length)] || 'MEDIUM';
      const caseType = caseTypes[Math.floor(Math.random() * caseTypes.length)] || 'EVICTION_NON_PAYMENT';

      const createdAt = new Date();
      createdAt.setDate(createdAt.getDate() - Math.floor(Math.random() * 90));

      const nextDeadline = new Date(createdAt);
      nextDeadline.setDate(nextDeadline.getDate() + Math.floor(Math.random() * 30) + 7);

      const caseData: LegalCase = {
        id: `case-${i + 1}`,
        caseNumber: `CASE-${String(1000 + i).padStart(4, '0')}`,
        status,
        caseType,
        priority,
        createdAt: createdAt.toISOString(),
        nextDeadline: nextDeadline.toISOString(),
        contract: (() => {
          const contractData: any = {
            property: {
              title: `Propiedad ${i + 1}`,
              address: `Calle ${Math.floor(Math.random() * 100) + 1}`,
              city: 'Santiago',
              commune: ['Providencia', 'Las Condes', 'Ñuñoa', 'La Reina'][Math.floor(Math.random() * 4)] || 'Santiago'
            },
            tenant: {
              name: `Inquilino ${i + 1}`,
              email: `tenant${i + 1}@example.com`,
              phone: `+569${String(Math.floor(Math.random() * 10000000)).padStart(8, '0')}`
            },
            owner: {
              name: `Propietario ${i + 1}`,
              email: `owner${i + 1}@example.com`,
              phone: `+569${String(Math.floor(Math.random() * 10000000)).padStart(8, '0')}`
            },
            payments: [
              {
                amount: Math.floor(Math.random() * 500000) + 200000,
                dueDate: new Date(Date.now() - Math.floor(Math.random() * 30) * 24 * 60 * 60 * 1000).toISOString(),
                status: 'OVERDUE',
                lateFees: Math.floor(Math.random() * 100000)
              }
            ]
          };

          if (Math.random() > 0.5) {
            contractData.broker = {
              name: `Corredor ${i + 1}`,
              email: `broker${i + 1}@example.com`,
              phone: `+569${String(Math.floor(Math.random() * 10000000)).padStart(8, '0')}`
            };
          }

          return contractData;
        })(),
        extrajudicialNotices: status === 'EXTRAJUDICIAL_NOTICE' ? [{
          id: `notice-${i + 1}`,
          noticeType: 'Pago de Rentas',
          status: 'DELIVERED',
          createdAt: new Date(Date.now() - Math.floor(Math.random() * 30) * 24 * 60 * 60 * 1000).toISOString()
        }] : [],
        legalDocuments: [
          {
            id: `doc-${i + 1}`,
            fileName: `contrato-${i + 1}.pdf`,
            documentType: 'CONTRATO',
            uploadedAt: createdAt.toISOString()
          }
        ],
        courtProceedings: status === 'COURT_PROCESS' ? [{
          id: `proceeding-${i + 1}`,
          proceedingType: 'Demanda Civil',
          status: 'PENDING',
          scheduledDate: nextDeadline.toISOString()
        }] : []
      };

      if (Math.random() > 0.3) {
        caseData.assignedTo = `Agent ${Math.floor(Math.random() * 5) + 1}`;
      }

      cases.push(caseData);
    }

    return cases;
  };

  const filterMockCases = (cases: LegalCase[]): LegalCase[] => {
    return cases.filter(caseItem => {
      if (statusFilter && caseItem.status !== statusFilter) return false;
      if (priorityFilter && caseItem.priority !== priorityFilter) return false;
      if (caseTypeFilter && caseItem.caseType !== caseTypeFilter) return false;
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        const matchesSearch =
          caseItem.caseNumber.toLowerCase().includes(searchLower) ||
          caseItem.contract.property.title.toLowerCase().includes(searchLower) ||
          caseItem.contract.tenant.name.toLowerCase().includes(searchLower) ||
          caseItem.contract.owner.name.toLowerCase().includes(searchLower);

        if (!matchesSearch) return false;
      }
      return true;
    });
  };

  const calculateStats = (cases: LegalCase[]) => {
    const total = cases.length;
    const active = cases.filter(c => !['CASE_CLOSED', 'DISMISSED'].includes(c.status)).length;
    const urgent = cases.filter(c => ['URGENT', 'CRITICAL'].includes(c.priority)).length;
    const overdue = cases.filter(c => {
      if (!c.nextDeadline) return false;
      return new Date(c.nextDeadline) < new Date();
    }).length;
    const pendingResponse = cases.filter(c => 
      ['WAITING_RESPONSE', 'EXTRAJUDICIAL_NOTICE'].includes(c.status)
    ).length;

    setStats({ total, active, urgent, overdue, pendingResponse });
  };

  const handleSearch = () => {
    setCurrentPage(1);
    fetchLegalCases();
  };

  const handleClearFilters = () => {
    setSearchTerm('');
    setStatusFilter('');
    setPriorityFilter('');
    setCaseTypeFilter('');
    setCurrentPage(1);
  };

  const handleCaseUpdate = async (caseId: string, updateData: any) => {
    try {
      const response = await fetch('/api/support/legal-cases', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ caseId, ...updateData })
      });

      if (!response.ok) {
        throw new Error('Error al actualizar el caso');
      }

      // Recargar casos
      fetchLegalCases();
      
      // Si hay un caso seleccionado, actualizarlo también
      if (selectedCase && selectedCase.id === caseId) {
        const updatedCase = await response.json();
        setSelectedCase(updatedCase.data);
      }

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al actualizar');
    }
  };

  const handleAddNote = async (caseId: string) => {
    if (!newNote.trim()) return;

    try {
      const response = await fetch(`/api/support/legal-cases/${caseId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ note: newNote, isInternal: true })
      });

      if (!response.ok) {
        throw new Error('Error al agregar nota');
      }

      setNewNote('');
      
      // Recargar casos
      fetchLegalCases();
      
      // Si hay un caso seleccionado, actualizarlo también
      if (selectedCase && selectedCase.id === caseId) {
        const updatedCase = await response.json();
        setSelectedCase(updatedCase.data);
      }

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al agregar nota');
    }
  };

  const getStatusColor = (status: string) => {
    const statusColors: Record<string, string> = {
      'PRE_JUDICIAL': 'bg-blue-100 text-blue-800',
      'EXTRAJUDICIAL_NOTICE': 'bg-yellow-100 text-yellow-800',
      'WAITING_RESPONSE': 'bg-orange-100 text-orange-800',
      'DEMAND_PREPARATION': 'bg-purple-100 text-purple-800',
      'DEMAND_FILED': 'bg-indigo-100 text-indigo-800',
      'COURT_PROCESS': 'bg-red-100 text-red-800',
      'HEARING_SCHEDULED': 'bg-pink-100 text-pink-800',
      'JUDGMENT_PENDING': 'bg-gray-100 text-gray-800',
      'JUDGMENT_ISSUED': 'bg-green-100 text-green-800',
      'EVICTION_ORDERED': 'bg-red-100 text-red-800',
      'EVICTION_COMPLETED': 'bg-green-100 text-green-800',
      'PAYMENT_COLLECTION': 'bg-blue-100 text-blue-800',
      'CASE_CLOSED': 'bg-gray-100 text-gray-800',
      'SETTLEMENT_REACHED': 'bg-green-100 text-green-800',
      'DISMISSED': 'bg-gray-100 text-gray-800'
    };
    return statusColors[status] || 'bg-gray-100 text-gray-800';
  };

  const getPriorityColor = (priority: string) => {
    const priorityColors: Record<string, string> = {
      'LOW': 'bg-green-100 text-green-800',
      'MEDIUM': 'bg-blue-100 text-blue-800',
      'HIGH': 'bg-yellow-100 text-yellow-800',
      'URGENT': 'bg-orange-100 text-orange-800',
      'CRITICAL': 'bg-red-100 text-red-800'
    };
    return priorityColors[priority] || 'bg-gray-100 text-gray-800';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-CL', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP'
    }).format(amount);
  };

  if (loading && legalCases.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Cargando casos legales...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center text-red-600">
          <AlertTriangle className="h-8 w-8 mx-auto mb-2" />
          <p>Error: {error}</p>
          <Button onClick={fetchLegalCases} className="mt-2">
            Reintentar
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header y Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Casos</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Activos</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.active}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Urgentes</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{stats.urgent}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Vencidos</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.overdue}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pendientes</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{stats.pendingResponse}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros y Búsqueda */}
      <Card>
        <CardHeader>
          <CardTitle>Filtros y Búsqueda</CardTitle>
          <CardDescription>
            Filtra y busca casos legales específicos
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <Input
                placeholder="Buscar por número de caso, notas..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              />
            </div>
            
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <option value="">Todos los estados</option>
              <option value="PRE_JUDICIAL">Pre-judicial</option>
              <option value="EXTRAJUDICIAL_NOTICE">Aviso Extrajudicial</option>
              <option value="WAITING_RESPONSE">Esperando Respuesta</option>
              <option value="DEMAND_PREPARATION">Preparando Demanda</option>
              <option value="DEMAND_FILED">Demanda Presentada</option>
              <option value="COURT_PROCESS">Proceso Judicial</option>
              <option value="HEARING_SCHEDULED">Audiencia Programada</option>
              <option value="JUDGMENT_PENDING">Pendiente de Sentencia</option>
              <option value="JUDGMENT_ISSUED">Sentencia Emitida</option>
              <option value="EVICTION_ORDERED">Desalojo Ordenado</option>
              <option value="EVICTION_COMPLETED">Desalojo Completado</option>
              <option value="PAYMENT_COLLECTION">Cobro de Pagos</option>
              <option value="CASE_CLOSED">Caso Cerrado</option>
              <option value="SETTLEMENT_REACHED">Acuerdo Alcanzado</option>
              <option value="DISMISSED">Desestimado</option>
            </select>
            
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <option value="">Todas las prioridades</option>
              <option value="LOW">Baja</option>
              <option value="MEDIUM">Media</option>
              <option value="HIGH">Alta</option>
              <option value="URGENT">Urgente</option>
              <option value="CRITICAL">Crítica</option>
            </select>
            
            <select
              value={caseTypeFilter}
              onChange={(e) => setCaseTypeFilter(e.target.value)}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <option value="">Todos los tipos</option>
              <option value="EVICTION_NON_PAYMENT">Desalojo por No Pago</option>
              <option value="DAMAGE_CLAIM">Reclamo por Daños</option>
              <option value="BREACH_OF_CONTRACT">Incumplimiento de Contrato</option>
              <option value="ILLEGAL_OCCUPATION">Ocupación Ilegal</option>
              <option value="RENT_INCREASE_DISPUTE">Disputa por Aumento de Renta</option>
              <option value="SECURITY_DEPOSIT_DISPUTE">Disputa por Depósito de Garantía</option>
              <option value="UTILITY_PAYMENT_DISPUTE">Disputa por Pagos de Servicios</option>
              <option value="OTHER">Otro</option>
            </select>
          </div>
          
          <div className="flex gap-2 mt-4">
            <Button onClick={handleSearch}>
              <Search className="h-4 w-4 mr-2" />
              Buscar
            </Button>
            <Button variant="outline" onClick={handleClearFilters}>
              <Filter className="h-4 w-4 mr-2" />
              Limpiar Filtros
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Lista de Casos Legales */}
      <Card>
        <CardHeader>
          <CardTitle>Casos Legales</CardTitle>
          <CardDescription>
            {legalCases.length} casos encontrados
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[600px]">
            <div className="space-y-4">
              {legalCases.map((legalCase) => (
                <Card key={legalCase.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-semibold text-lg">
                            Caso #{legalCase.caseNumber}
                          </h3>
                          <Badge className={getStatusColor(legalCase.status)}>
                            {legalCase.status.replace(/_/g, ' ')}
                          </Badge>
                          <Badge className={getPriorityColor(legalCase.priority)}>
                            {legalCase.priority}
                          </Badge>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                          <div>
                            <h4 className="font-medium text-sm text-gray-600 mb-1">Propiedad</h4>
                            <p className="text-sm">{legalCase.contract.property.title}</p>
                            <p className="text-xs text-gray-500">
                              {legalCase.contract.property.address}, {legalCase.contract.property.commune}
                            </p>
                          </div>
                          
                          <div>
                            <h4 className="font-medium text-sm text-gray-600 mb-1">Inquilino</h4>
                            <p className="text-sm">{legalCase.contract.tenant.name}</p>
                            <p className="text-xs text-gray-500">{legalCase.contract.tenant.email}</p>
                          </div>
                        </div>
                        
                        {legalCase.notes && (
                          <div className="mb-3">
                            <h4 className="font-medium text-sm text-gray-600 mb-1">Notas</h4>
                            <p className="text-sm text-gray-700">{legalCase.notes}</p>
                          </div>
                        )}
                        
                        <div className="flex items-center gap-4 text-xs text-gray-500">
                          <span>Creado: {formatDate(legalCase.createdAt)}</span>
                          {legalCase.nextDeadline && (
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              Próximo plazo: {formatDate(legalCase.nextDeadline)}
                            </span>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex flex-col gap-2 ml-4">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setSelectedCase(legalCase);
                            setShowCaseDetails(true);
                          }}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          Ver
                        </Button>
                        
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setSelectedCase(legalCase);
                            setShowCaseDetails(true);
                          }}
                        >
                          <Edit className="h-4 w-4 mr-1" />
                          Editar
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </ScrollArea>
          
          {/* Paginación */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <p className="text-sm text-gray-600">
                Página {currentPage} de {totalPages}
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(currentPage - 1)}
                >
                  Anterior
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage(currentPage + 1)}
                >
                  Siguiente
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal de Detalles del Caso */}
      {showCaseDetails && selectedCase && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold">
                  Caso #{selectedCase.caseNumber}
                </h2>
                <Button
                  variant="outline"
                  onClick={() => setShowCaseDetails(false)}
                >
                  Cerrar
                </Button>
              </div>
              
              <Tabs defaultValue="overview" className="w-full">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="overview">Resumen</TabsTrigger>
                  <TabsTrigger value="details">Detalles</TabsTrigger>
                  <TabsTrigger value="documents">Documentos</TabsTrigger>
                  <TabsTrigger value="notes">Notas</TabsTrigger>
                </TabsList>
                
                <TabsContent value="overview" className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">Información del Caso</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-2">
                        <div className="flex justify-between">
                          <span className="font-medium">Estado:</span>
                          <Badge className={getStatusColor(selectedCase.status)}>
                            {selectedCase.status.replace(/_/g, ' ')}
                          </Badge>
                        </div>
                        <div className="flex justify-between">
                          <span className="font-medium">Prioridad:</span>
                          <Badge className={getPriorityColor(selectedCase.priority)}>
                            {selectedCase.priority}
                          </Badge>
                        </div>
                        <div className="flex justify-between">
                          <span className="font-medium">Tipo:</span>
                          <span>{selectedCase.caseType.replace(/_/g, ' ')}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="font-medium">Creado:</span>
                          <span>{formatDate(selectedCase.createdAt)}</span>
                        </div>
                        {selectedCase.nextDeadline && (
                          <div className="flex justify-between">
                            <span className="font-medium">Próximo plazo:</span>
                            <span className="text-orange-600 font-medium">
                              {formatDate(selectedCase.nextDeadline)}
                            </span>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">Propiedad</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-2">
                        <h4 className="font-medium">{selectedCase.contract.property.title}</h4>
                        <p className="text-sm text-gray-600">
                          {selectedCase.contract.property.address}
                        </p>
                        <p className="text-sm text-gray-600">
                          {selectedCase.contract.property.commune}, {selectedCase.contract.property.city}
                        </p>
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>
                
                <TabsContent value="details" className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">Inquilino</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-2">
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4" />
                          <span className="font-medium">{selectedCase.contract.tenant.name}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Mail className="h-4 w-4" />
                          <span>{selectedCase.contract.tenant.email}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Phone className="h-4 w-4" />
                          <span>{selectedCase.contract.tenant.phone}</span>
                        </div>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">Propietario</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-2">
                        <div className="flex items-center gap-2">
                          <Building className="h-4 w-4" />
                          <span className="font-medium">{selectedCase.contract.owner.name}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Mail className="h-4 w-4" />
                          <span>{selectedCase.contract.owner.email}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Phone className="h-4 w-4" />
                          <span>{selectedCase.contract.owner.phone}</span>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                  
                  {selectedCase.contract.payments.length > 0 && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">Pagos Vencidos</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          {selectedCase.contract.payments.map((payment, index) => (
                            <div key={index} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                              <div>
                                <span className="font-medium">
                                  {formatCurrency(payment.amount)}
                                </span>
                                <span className="text-sm text-gray-600 ml-2">
                                  Vence: {formatDate(payment.dueDate)}
                                </span>
                              </div>
                              <div className="text-right">
                                <Badge variant={payment.status === 'OVERDUE' ? 'destructive' : 'secondary'}>
                                  {payment.status}
                                </Badge>
                                {payment.lateFees > 0 && (
                                  <p className="text-xs text-red-600 mt-1">
                                    Cargos: {formatCurrency(payment.lateFees)}
                                  </p>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </TabsContent>
                
                <TabsContent value="documents" className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {selectedCase.legalDocuments.length > 0 && (
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-lg">Documentos Legales</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-2">
                            {selectedCase.legalDocuments.map((doc) => (
                              <div key={doc.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                                <div className="flex items-center gap-2">
                                  <FileText className="h-4 w-4" />
                                  <span className="text-sm">{doc.fileName}</span>
                                </div>
                                <Badge variant="outline">{doc.documentType}</Badge>
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    )}
                    
                    {selectedCase.extrajudicialNotices.length > 0 && (
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-lg">Avisos Extrajudiciales</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-2">
                            {selectedCase.extrajudicialNotices.map((notice) => (
                              <div key={notice.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                                <div>
                                  <span className="text-sm font-medium">{notice.noticeType}</span>
                                  <p className="text-xs text-gray-600">
                                    {formatDate(notice.createdAt)}
                                  </p>
                                </div>
                                <Badge variant={notice.status === 'DELIVERED' ? 'default' : 'secondary'}>
                                  {notice.status}
                                </Badge>
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    )}
                  </div>
                </TabsContent>
                
                <TabsContent value="notes" className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Notas Internas</CardTitle>
                      <CardDescription>
                        Agregar notas internas para el equipo de soporte
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="flex gap-2">
                          <Input
                            placeholder="Escribir nueva nota..."
                            value={newNote}
                            onChange={(e) => setNewNote(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && handleAddNote(selectedCase.id)}
                          />
                          <Button onClick={() => handleAddNote(selectedCase.id)}>
                            <Plus className="h-4 w-4 mr-2" />
                            Agregar
                          </Button>
                        </div>
                        
                        {selectedCase.internalNotes && (
                          <div className="bg-gray-50 p-4 rounded-lg">
                            <h4 className="font-medium mb-2">Notas Existentes:</h4>
                            <pre className="text-sm whitespace-pre-wrap text-gray-700">
                              {selectedCase.internalNotes}
                            </pre>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LegalCasesSupportDashboard;

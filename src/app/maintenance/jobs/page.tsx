'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { logger } from '@/lib/logger-minimal';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertCircle,
  RefreshCw,
  Wrench,
  CheckCircle,
  Clock,
  DollarSign,
  Info,
  Plus,
  Search,
  Filter,
  Download,
  Calendar,
  MapPin,
  User,
  Phone,
  AlertTriangle,
  PlayCircle,
  PauseCircle,
  Square,
  Send,
  X,
  MessageSquare,
} from 'lucide-react';
import UnifiedDashboardLayout from '@/components/layout/UnifiedDashboardLayout';
import { QuickActionButton } from '@/components/dashboard/QuickActionButton';

interface MaintenanceJob {
  id: string;
  title: string;
  description: string;
  propertyAddress: string;
  propertyOwner: string;
  ownerPhone: string;
  ownerId?: string | null;
  propertyId?: string;
  status:
    | 'pending'
    | 'in_progress'
    | 'completed'
    | 'cancelled'
    | 'quote_pending'
    | 'quote_approved';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  maintenanceType: 'plumbing' | 'electrical' | 'structural' | 'cleaning' | 'other';
  estimatedCost: number;
  actualCost?: number;
  scheduledDate: string;
  completedDate?: string;
  notes?: string;
}

export default function MaintenanceJobsPage() {
  const router = useRouter();
  const [jobs, setJobs] = useState<MaintenanceJob[]>([]);
  const [filteredJobs, setFilteredJobs] = useState<MaintenanceJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');

  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  // Estado para modales
  const [showJobDetailsModal, setShowJobDetailsModal] = useState(false);
  const [selectedJob, setSelectedJob] = useState<MaintenanceJob | null>(null);
  const [showQuoteModal, setShowQuoteModal] = useState(false);
  const [quoteData, setQuoteData] = useState({
    estimatedCost: '',
    estimatedTime: '',
    notes: '',
    materials: '',
    laborCost: '',
    materialsCost: '',
  });

  useEffect(() => {
    loadJobs();
  }, []);

  useEffect(() => {
    filterJobs();
  }, [jobs, searchTerm, statusFilter, typeFilter]);

  const loadJobs = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/maintenance/jobs', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      if (data.success && data.jobs) {
        setJobs(data.jobs);
      } else {
        setJobs([]);
      }
    } catch (error) {
      logger.error('Error loading maintenance jobs:', {
        error: error instanceof Error ? error.message : String(error),
      });
      setError('Error al cargar los trabajos de mantenimiento');
    } finally {
      setLoading(false);
    }
  };

  const filterJobs = () => {
    let filtered = jobs;

    if (searchTerm) {
      filtered = filtered.filter(
        job =>
          job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          job.propertyAddress.toLowerCase().includes(searchTerm.toLowerCase()) ||
          job.propertyOwner.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(job => job.status === statusFilter);
    }

    if (typeFilter !== 'all') {
      filtered = filtered.filter(job => job.maintenanceType === typeFilter);
    }

    setFilteredJobs(filtered);
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { label: 'Pendiente', color: 'bg-yellow-100 text-yellow-800' },
      quote_pending: { label: 'Cotización Pendiente', color: 'bg-orange-100 text-orange-800' },
      quote_approved: { label: 'Cotización Aprobada', color: 'bg-purple-100 text-purple-800' },
      in_progress: { label: 'En Progreso', color: 'bg-blue-100 text-blue-800' },
      completed: { label: 'Completado', color: 'bg-green-100 text-green-800' },
      cancelled: { label: 'Cancelado', color: 'bg-red-100 text-red-800' },
    };
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
    return <Badge className={config.color}>{config.label}</Badge>;
  };

  const getPriorityBadge = (priority: string) => {
    const priorityConfig = {
      low: { label: 'Baja', color: 'bg-gray-100 text-gray-800' },
      medium: { label: 'Media', color: 'bg-blue-100 text-blue-800' },
      high: { label: 'Alta', color: 'bg-orange-100 text-orange-800' },
      urgent: { label: 'Urgente', color: 'bg-red-100 text-red-800' },
    };
    const config = priorityConfig[priority as keyof typeof priorityConfig] || priorityConfig.medium;
    return <Badge className={config.color}>{config.label}</Badge>;
  };

  const getTypeBadge = (type: string) => {
    const typeConfig = {
      plumbing: { label: 'Plomería', color: 'bg-blue-100 text-blue-800' },
      electrical: { label: 'Eléctrica', color: 'bg-yellow-100 text-yellow-800' },
      structural: { label: 'Estructural', color: 'bg-brown-100 text-brown-800' },
      cleaning: { label: 'Limpieza', color: 'bg-green-100 text-green-800' },
      other: { label: 'Otro', color: 'bg-gray-100 text-gray-800' },
    };
    const config = typeConfig[type as keyof typeof typeConfig] || typeConfig.other;
    return <Badge className={config.color}>{config.label}</Badge>;
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const handleStatusChange = (jobId: string, newStatus: string) => {
    setJobs(prevJobs =>
      prevJobs.map(job =>
        job.id === jobId ? { ...job, status: newStatus as MaintenanceJob['status'] } : job
      )
    );
  };

  const handleViewJobDetails = (job: MaintenanceJob) => {
    setSelectedJob(job);
    setShowJobDetailsModal(true);
  };

  const handleSubmitQuote = async () => {
    if (!selectedJob) {
      return;
    }

    if (!quoteData.estimatedCost || parseFloat(quoteData.estimatedCost) <= 0) {
      setErrorMessage('El costo estimado es requerido y debe ser mayor a 0');
      setTimeout(() => setErrorMessage(''), 5000);
      return;
    }

    try {
      const response = await fetch(`/api/maintenance/${selectedJob.id}/quote`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          estimatedCost: parseFloat(quoteData.estimatedCost),
          estimatedTime: quoteData.estimatedTime || undefined,
          notes: quoteData.notes || undefined,
          materials: quoteData.materials || undefined,
          laborCost: quoteData.laborCost ? parseFloat(quoteData.laborCost) : undefined,
          materialsCost: quoteData.materialsCost ? parseFloat(quoteData.materialsCost) : undefined,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Error ${response.status}: ${response.statusText}`);
      }

      setSuccessMessage('Cotización enviada exitosamente');
      setTimeout(() => setSuccessMessage(''), 3000);
      setShowQuoteModal(false);
      setQuoteData({
        estimatedCost: '',
        estimatedTime: '',
        notes: '',
        materials: '',
        laborCost: '',
        materialsCost: '',
      });
      await loadJobs();
    } catch (error) {
      logger.error('Error sending quote:', {
        error: error instanceof Error ? error.message : String(error),
      });
      setErrorMessage(error instanceof Error ? error.message : 'Error al enviar la cotización');
      setTimeout(() => setErrorMessage(''), 5000);
    }
  };

  const handleExportJobs = () => {
    if (filteredJobs.length === 0) {
      setErrorMessage('No hay trabajos para exportar');
      setTimeout(() => setErrorMessage(''), 5000);
      return;
    }

    const csvData = filteredJobs.map(job => ({
      ID: job.id,
      Título: job.title,
      Dirección: job.propertyAddress,
      Propietario: job.propertyOwner,
      Teléfono: job.ownerPhone,
      Estado: getStatusBadge(job.status).props.children,
      Prioridad: getPriorityBadge(job.priority).props.children,
      Tipo: getTypeBadge(job.maintenanceType).props.children,
      'Costo Estimado': formatCurrency(job.estimatedCost),
      'Costo Real': job.actualCost ? formatCurrency(job.actualCost) : '',
      'Fecha Programada': job.scheduledDate,
      'Fecha Completada': job.completedDate || '',
    }));

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      Object.keys(csvData[0]!).join(',') +
      '\n' +
      csvData.map(row => Object.values(row).join(',')).join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute(
      'download',
      `trabajos_mantenimiento_${new Date().toISOString().split('T')[0]}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) {
    return (
      <UnifiedDashboardLayout title="Trabajos de Mantenimiento" subtitle="Cargando información...">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Cargando trabajos de mantenimiento...</p>
          </div>
        </div>
      </UnifiedDashboardLayout>
    );
  }

  if (error) {
    return (
      <UnifiedDashboardLayout
        title="Trabajos de Mantenimiento"
        subtitle="Error al cargar la página"
      >
        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Error</h3>
              <p className="text-gray-600 mb-4">{error}</p>
              <Button onClick={loadJobs}>
                <RefreshCw className="w-4 h-4 mr-2" />
                Reintentar
              </Button>
            </div>
          </CardContent>
        </Card>
      </UnifiedDashboardLayout>
    );
  }

  return (
    <UnifiedDashboardLayout
      title="Trabajos de Mantenimiento"
      subtitle="Gestiona tus trabajos de mantenimiento contratados"
    >
      <div className="space-y-6">
        {/* Success Message */}
        {successMessage && (
          <Card className="border-green-200 bg-green-50">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <span className="text-green-800">{successMessage}</span>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Error Message */}
        {errorMessage && (
          <Card className="border-red-200 bg-red-50">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <AlertCircle className="w-5 h-5 text-red-600" />
                <span className="text-red-800">{errorMessage}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setErrorMessage('')}
                  className="ml-auto text-red-600 hover:text-red-800"
                >
                  ×
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Estadísticas */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Wrench className="h-8 w-8 text-blue-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Trabajos</p>
                  <p className="text-2xl font-bold text-gray-900">{jobs.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Clock className="h-8 w-8 text-yellow-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">En Progreso</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {jobs.filter(job => job.status === 'in_progress').length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <CheckCircle className="h-8 w-8 text-green-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Completados</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {jobs.filter(job => job.status === 'completed').length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <DollarSign className="h-8 w-8 text-green-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Ingresos Totales</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {formatCurrency(
                      jobs.reduce((sum, job) => sum + (job.actualCost || job.estimatedCost), 0)
                    )}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Lista de trabajos */}
        <Card>
          <CardHeader>
            <CardTitle>Trabajos de Mantenimiento ({filteredJobs.length})</CardTitle>
            <CardDescription>
              Lista de trabajos contratados por propietarios y corredores
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* Filtros y búsqueda */}
            <div className="flex flex-col md:flex-row gap-4 mb-6">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Buscar por título, dirección o propietario..."
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full md:w-48">
                  <SelectValue placeholder="Estado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los estados</SelectItem>
                  <SelectItem value="pending">Pendientes</SelectItem>
                  <SelectItem value="in_progress">En Progreso</SelectItem>
                  <SelectItem value="completed">Completados</SelectItem>
                  <SelectItem value="cancelled">Cancelados</SelectItem>
                </SelectContent>
              </Select>

              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-full md:w-48">
                  <SelectValue placeholder="Tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los tipos</SelectItem>
                  <SelectItem value="plumbing">Plomería</SelectItem>
                  <SelectItem value="electrical">Eléctrica</SelectItem>
                  <SelectItem value="structural">Estructural</SelectItem>
                  <SelectItem value="cleaning">Limpieza</SelectItem>
                  <SelectItem value="other">Otro</SelectItem>
                </SelectContent>
              </Select>

              <Button onClick={handleExportJobs} variant="outline">
                <Download className="w-4 h-4 mr-2" />
                Exportar
              </Button>
            </div>
            <ScrollArea className="h-96">
              <div className="space-y-4">
                {filteredJobs.map(job => (
                  <Card key={job.id} className="border-l-4 border-l-blue-500">
                    <CardContent className="p-6">
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="text-lg font-semibold text-gray-900">{job.title}</h3>
                            {getStatusBadge(job.status)}
                            {getPriorityBadge(job.priority)}
                            {getTypeBadge(job.maintenanceType)}
                          </div>

                          <p className="text-gray-600 mb-3">{job.description}</p>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                            <div>
                              <div className="flex items-center gap-2 mb-2">
                                <MapPin className="w-4 h-4 text-gray-400" />
                                <span className="font-medium">{job.propertyAddress}</span>
                              </div>
                              <div className="flex items-center gap-2 mb-2">
                                <User className="w-4 h-4 text-gray-400" />
                                <span>{job.propertyOwner}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Phone className="w-4 h-4 text-gray-400" />
                                <span>{job.ownerPhone}</span>
                              </div>
                            </div>

                            <div>
                              <div className="mb-2">
                                <span className="font-medium">Costo Estimado: </span>
                                <span className="text-green-600 font-semibold">
                                  {formatCurrency(job.estimatedCost)}
                                </span>
                              </div>
                              {job.actualCost && (
                                <div className="mb-2">
                                  <span className="font-medium">Costo Real: </span>
                                  <span className="text-blue-600 font-semibold">
                                    {formatCurrency(job.actualCost)}
                                  </span>
                                </div>
                              )}
                              <div className="mb-2">
                                <span className="font-medium">Fecha Programada: </span>
                                <span>
                                  {new Date(job.scheduledDate).toLocaleDateString('es-CL')}
                                </span>
                              </div>
                              {job.completedDate && (
                                <div>
                                  <span className="font-medium">Fecha Completada: </span>
                                  <span>
                                    {new Date(job.completedDate).toLocaleDateString('es-CL')}
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>

                          {job.notes && (
                            <div className="mt-3 p-3 bg-gray-50 rounded-md">
                              <div className="flex items-start gap-2">
                                <Info className="w-4 h-4 text-gray-400 mt-0.5" />
                                <p className="text-sm text-gray-600">{job.notes}</p>
                              </div>
                            </div>
                          )}
                        </div>

                        <div className="flex flex-col gap-2">
                          {(job.status === 'pending' || job.status === 'quote_approved') && (
                            <>
                              {job.status === 'pending' && (
                                <Button
                                  onClick={() => {
                                    setSelectedJob(job);
                                    setShowQuoteModal(true);
                                  }}
                                  className="bg-green-600 hover:bg-green-700"
                                >
                                  <Send className="w-4 h-4 mr-2" />
                                  Enviar Cotización
                                </Button>
                              )}
                              <Button
                                onClick={() => handleStatusChange(job.id, 'in_progress')}
                                className="bg-blue-600 hover:bg-blue-700"
                              >
                                <PlayCircle className="w-4 h-4 mr-2" />
                                Iniciar
                              </Button>
                            </>
                          )}

                          {job.status === 'quote_pending' && (
                            <Button variant="outline" disabled>
                              <Clock className="w-4 h-4 mr-2" />
                              Esperando Aprobación
                            </Button>
                          )}

                          {job.status === 'in_progress' && (
                            <>
                              <Button
                                onClick={() => handleStatusChange(job.id, 'completed')}
                                className="bg-green-600 hover:bg-green-700"
                              >
                                <CheckCircle className="w-4 h-4 mr-2" />
                                Completar
                              </Button>
                              <Button
                                onClick={() => handleStatusChange(job.id, 'pending')}
                                variant="outline"
                              >
                                <PauseCircle className="w-4 h-4 mr-2" />
                                Pausar
                              </Button>
                            </>
                          )}

                          {job.status === 'completed' && (
                            <Button variant="outline" disabled>
                              <CheckCircle className="w-4 h-4 mr-2" />
                              Completado
                            </Button>
                          )}

                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleViewJobDetails(job)}
                          >
                            <Info className="w-4 h-4 mr-2" />
                            Detalles
                          </Button>

                          {job.ownerId && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                // Abrir mensajería con el propietario
                                window.location.href = `/messages?userId=${job.ownerId}&propertyId=${job.propertyId || ''}`;
                              }}
                              className="border-blue-300 text-blue-700 hover:bg-blue-50"
                            >
                              <MessageSquare className="w-4 h-4 mr-2" />
                              Contactar
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}

                {filteredJobs.length === 0 && (
                  <div className="text-center py-8">
                    <Wrench className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      No hay trabajos encontrados
                    </h3>
                    <p className="text-gray-600">
                      {jobs.length === 0
                        ? 'Aún no tienes trabajos de mantenimiento asignados.'
                        : 'No se encontraron trabajos que coincidan con los filtros aplicados.'}
                    </p>
                  </div>
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Acciones Rápidas */}
        <Card>
          <CardHeader>
            <CardTitle>Acciones Rápidas</CardTitle>
            <CardDescription>Herramientas para gestión de trabajos</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <QuickActionButton
                icon={Plus}
                label="Nuevo Trabajo"
                description="Agendar mantenimiento"
                onClick={() => router.push('/maintenance/jobs/new')}
              />

              <QuickActionButton
                icon={Search}
                label="Buscar"
                description="Buscar trabajos"
                onClick={() => {
                  // Focus on search input
                  const searchInput = document.querySelector(
                    'input[placeholder*="Buscar"]'
                  ) as HTMLInputElement;
                  if (searchInput) {
                    searchInput.focus();
                    searchInput.scrollIntoView({ behavior: 'smooth' });
                  }
                }}
              />

              <QuickActionButton
                icon={Download}
                label="Exportar"
                description="Descargar lista"
                onClick={handleExportJobs}
              />

              <QuickActionButton
                icon={Calendar}
                label="Calendario"
                description="Ver agenda"
                onClick={() => router.push('/maintenance/calendar')}
              />

              <QuickActionButton
                icon={AlertTriangle}
                label="Urgentes"
                description="Trabajos críticos"
                onClick={() => {
                  setStatusFilter('in_progress');
                  setTypeFilter('all');
                  setSuccessMessage('Mostrando trabajos urgentes en progreso');
                  setTimeout(() => setSuccessMessage(''), 3000);
                }}
              />

              <QuickActionButton
                icon={RefreshCw}
                label="Actualizar"
                description="Recargar lista"
                onClick={loadJobs}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Modal de detalles del trabajo */}
      <Dialog open={showJobDetailsModal} onOpenChange={setShowJobDetailsModal}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Info className="w-5 h-5" />
              Detalles del Trabajo de Mantenimiento
            </DialogTitle>
            <DialogDescription>
              Información completa y estado del trabajo seleccionado
            </DialogDescription>
          </DialogHeader>

          {selectedJob && (
            <div className="space-y-6">
              {/* Información básica */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold text-gray-900 mb-3">Información del Trabajo</h4>
                  <div className="space-y-3">
                    <div>
                      <span className="text-sm font-medium text-gray-500">Título:</span>
                      <p className="font-medium">{selectedJob.title}</p>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-500">Estado:</span>
                      <div className="mt-1">{getStatusBadge(selectedJob.status)}</div>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-500">Prioridad:</span>
                      <div className="mt-1">{getPriorityBadge(selectedJob.priority)}</div>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-500">Tipo:</span>
                      <div className="mt-1">{getTypeBadge(selectedJob.maintenanceType)}</div>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold text-gray-900 mb-3">Información Financiera</h4>
                  <div className="space-y-3">
                    <div>
                      <span className="text-sm font-medium text-gray-500">Costo Estimado:</span>
                      <p className="font-medium text-green-600">
                        {formatCurrency(selectedJob.estimatedCost)}
                      </p>
                    </div>
                    {selectedJob.actualCost && (
                      <div>
                        <span className="text-sm font-medium text-gray-500">Costo Real:</span>
                        <p className="font-medium text-blue-600">
                          {formatCurrency(selectedJob.actualCost)}
                        </p>
                      </div>
                    )}
                    <div>
                      <span className="text-sm font-medium text-gray-500">Fecha Programada:</span>
                      <p>{new Date(selectedJob.scheduledDate).toLocaleDateString('es-CL')}</p>
                    </div>
                    {selectedJob.completedDate && (
                      <div>
                        <span className="text-sm font-medium text-gray-500">Fecha Completada:</span>
                        <p>{new Date(selectedJob.completedDate).toLocaleDateString('es-CL')}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Descripción */}
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">Descripción</h4>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-gray-700">{selectedJob.description}</p>
                </div>
              </div>

              {/* Información de propiedad y propietario */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold text-gray-900 mb-3">Propiedad</h4>
                  <div className="space-y-2 p-4 bg-blue-50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-blue-600" />
                      <span className="text-sm">{selectedJob.propertyAddress}</span>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold text-gray-900 mb-3">Propietario</h4>
                  <div className="space-y-2 p-4 bg-green-50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-green-600" />
                      <span className="text-sm font-medium">{selectedJob.propertyOwner}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Phone className="w-4 h-4 text-green-600" />
                      <span className="text-sm">{selectedJob.ownerPhone}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Notas */}
              {selectedJob.notes && (
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">Notas Adicionales</h4>
                  <div className="p-4 bg-yellow-50 rounded-lg">
                    <p className="text-sm text-yellow-800">{selectedJob.notes}</p>
                  </div>
                </div>
              )}

              {/* Historial de estados */}
              <div>
                <h4 className="font-semibold text-gray-900 mb-3">Historial de Estados</h4>
                <div className="space-y-2">
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <div
                      className={`w-3 h-3 rounded-full ${
                        selectedJob.status === 'completed'
                          ? 'bg-green-500'
                          : selectedJob.status === 'in_progress'
                            ? 'bg-blue-500'
                            : selectedJob.status === 'pending'
                              ? 'bg-yellow-500'
                              : 'bg-red-500'
                      }`}
                    ></div>
                    <div className="flex-1">
                      <p className="text-sm font-medium capitalize">
                        {selectedJob.status.replace('_', ' ')}
                      </p>
                      <p className="text-xs text-gray-500">
                        {selectedJob.status === 'completed' && selectedJob.completedDate
                          ? `Completado el ${new Date(selectedJob.completedDate).toLocaleDateString('es-CL')}`
                          : 'Estado actual del trabajo'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Acciones disponibles */}
              <div className="flex justify-end gap-2 pt-4 border-t">
                <Button variant="outline" onClick={() => setShowJobDetailsModal(false)}>
                  Cerrar
                </Button>
                {selectedJob.status === 'pending' && (
                  <Button
                    className="bg-green-600 hover:bg-green-700"
                    onClick={() => {
                      handleStatusChange(selectedJob.id, 'in_progress');
                      setShowJobDetailsModal(false);
                    }}
                  >
                    <PlayCircle className="w-4 h-4 mr-2" />
                    Iniciar Trabajo
                  </Button>
                )}
                {selectedJob.status === 'in_progress' && (
                  <Button
                    className="bg-blue-600 hover:bg-blue-700"
                    onClick={() => {
                      handleStatusChange(selectedJob.id, 'completed');
                      setShowJobDetailsModal(false);
                    }}
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Completar Trabajo
                  </Button>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Modal de Cotización */}
      <Dialog open={showQuoteModal} onOpenChange={setShowQuoteModal}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Send className="w-5 h-5" />
              Enviar Cotización
            </DialogTitle>
            <DialogDescription>{selectedJob && `Para: ${selectedJob.title}`}</DialogDescription>
          </DialogHeader>

          {selectedJob && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="estimatedCost">Costo Estimado (CLP) *</Label>
                <Input
                  id="estimatedCost"
                  type="number"
                  value={quoteData.estimatedCost}
                  onChange={e =>
                    setQuoteData(prev => ({
                      ...prev,
                      estimatedCost: e.target.value,
                    }))
                  }
                  placeholder="0"
                  min="0"
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="estimatedTime">Tiempo Estimado</Label>
                  <Input
                    id="estimatedTime"
                    value={quoteData.estimatedTime}
                    onChange={e =>
                      setQuoteData(prev => ({
                        ...prev,
                        estimatedTime: e.target.value,
                      }))
                    }
                    placeholder="Ej: 2-4 horas"
                  />
                </div>

                <div>
                  <Label htmlFor="laborCost">Costo Mano de Obra (CLP)</Label>
                  <Input
                    id="laborCost"
                    type="number"
                    value={quoteData.laborCost}
                    onChange={e =>
                      setQuoteData(prev => ({
                        ...prev,
                        laborCost: e.target.value,
                      }))
                    }
                    placeholder="0"
                    min="0"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="materialsCost">Costo Materiales (CLP)</Label>
                <Input
                  id="materialsCost"
                  type="number"
                  value={quoteData.materialsCost}
                  onChange={e =>
                    setQuoteData(prev => ({
                      ...prev,
                      materialsCost: e.target.value,
                    }))
                  }
                  placeholder="0"
                  min="0"
                />
              </div>

              <div>
                <Label htmlFor="materials">Materiales Necesarios</Label>
                <Textarea
                  id="materials"
                  value={quoteData.materials}
                  onChange={e =>
                    setQuoteData(prev => ({
                      ...prev,
                      materials: e.target.value,
                    }))
                  }
                  placeholder="Lista de materiales requeridos..."
                  rows={3}
                />
              </div>

              <div>
                <Label htmlFor="notes">Notas Adicionales</Label>
                <Textarea
                  id="notes"
                  value={quoteData.notes}
                  onChange={e =>
                    setQuoteData(prev => ({
                      ...prev,
                      notes: e.target.value,
                    }))
                  }
                  placeholder="Información adicional sobre la cotización..."
                  rows={3}
                />
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowQuoteModal(false);
                    setQuoteData({
                      estimatedCost: '',
                      estimatedTime: '',
                      notes: '',
                      materials: '',
                      laborCost: '',
                      materialsCost: '',
                    });
                  }}
                >
                  Cancelar
                </Button>
                <Button onClick={handleSubmitQuote} className="bg-green-600 hover:bg-green-700">
                  <Send className="w-4 h-4 mr-2" />
                  Enviar Cotización
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </UnifiedDashboardLayout>
  );
}

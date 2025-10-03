'use client';

import React, { useState, useEffect } from 'react';
import { logger } from '@/lib/logger';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
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
} from 'lucide-react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { QuickActionButton } from '@/components/dashboard/QuickActionButton';

interface MaintenanceJob {
  id: string;
  title: string;
  description: string;
  propertyAddress: string;
  propertyOwner: string;
  ownerPhone: string;
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  maintenanceType: 'plumbing' | 'electrical' | 'structural' | 'cleaning' | 'other';
  estimatedCost: number;
  actualCost?: number;
  scheduledDate: string;
  completedDate?: string;
  notes?: string;
}

export default function MaintenanceJobsPage() {
  const [jobs, setJobs] = useState<MaintenanceJob[]>([]);
  const [filteredJobs, setFilteredJobs] = useState<MaintenanceJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');

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

      // Mock data for demonstration
      const mockJobs: MaintenanceJob[] = [
        {
          id: '1',
          title: 'Reparación de cañería',
          description: 'Fuga en baño principal del departamento 5B',
          propertyAddress: 'Av. Las Condes 1234, Las Condes',
          propertyOwner: 'María González',
          ownerPhone: '+56912345678',
          status: 'in_progress',
          priority: 'high',
          maintenanceType: 'plumbing',
          estimatedCost: 45000,
          actualCost: 52000,
          scheduledDate: '2024-01-15',
          notes: 'Cliente solicita reparación urgente',
        },
        {
          id: '2',
          title: 'Mantenimiento eléctrico',
          description: 'Revisión completa del sistema eléctrico',
          propertyAddress: 'Providencia 567, Providencia',
          propertyOwner: 'Carlos Rodríguez',
          ownerPhone: '+56987654321',
          status: 'pending',
          priority: 'medium',
          maintenanceType: 'electrical',
          estimatedCost: 80000,
          scheduledDate: '2024-01-18',
        },
        {
          id: '3',
          title: 'Limpieza general',
          description: 'Limpieza profunda después de desocupación',
          propertyAddress: 'Ñuñoa 890, Ñuñoa',
          propertyOwner: 'Ana López',
          ownerPhone: '+56911223344',
          status: 'completed',
          priority: 'low',
          maintenanceType: 'cleaning',
          estimatedCost: 30000,
          actualCost: 28000,
          scheduledDate: '2024-01-10',
          completedDate: '2024-01-10',
        },
      ];

      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      setJobs(mockJobs);
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

  const handleExportJobs = () => {
    if (filteredJobs.length === 0) {
      alert('No hay trabajos para exportar');
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
      <DashboardLayout title="Trabajos de Mantenimiento" subtitle="Cargando información...">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Cargando trabajos de mantenimiento...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout title="Trabajos de Mantenimiento" subtitle="Error al cargar la página">
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
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout
      title="Trabajos de Mantenimiento"
      subtitle="Gestiona tus trabajos de mantenimiento contratados"
    >
      <div className="space-y-6">
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

        {/* Filtros y búsqueda */}
        <Card>
          <CardHeader>
            <CardTitle>Filtros y Búsqueda</CardTitle>
            <CardDescription>Filtra y busca trabajos de mantenimiento específicos</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row gap-4">
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
                onClick={() =>
                  alert('Funcionalidad: Abrir formulario para nuevo trabajo de mantenimiento')
                }
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
                onClick={() => alert('Funcionalidad: Abrir vista de calendario')}
              />

              <QuickActionButton
                icon={AlertTriangle}
                label="Urgentes"
                description="Trabajos críticos"
                onClick={() => {
                  setStatusFilter('in_progress');
                  setTypeFilter('all');
                  alert('Mostrando trabajos urgentes en progreso');
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

        {/* Lista de trabajos */}
        <Card>
          <CardHeader>
            <CardTitle>Trabajos de Mantenimiento ({filteredJobs.length})</CardTitle>
            <CardDescription>
              Lista de trabajos contratados por propietarios y corredores
            </CardDescription>
          </CardHeader>
          <CardContent>
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
                          {job.status === 'pending' && (
                            <Button
                              onClick={() => handleStatusChange(job.id, 'in_progress')}
                              className="bg-blue-600 hover:bg-blue-700"
                            >
                              <PlayCircle className="w-4 h-4 mr-2" />
                              Iniciar
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

                          <Button variant="outline" size="sm">
                            <Info className="w-4 h-4 mr-2" />
                            Detalles
                          </Button>
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
      </div>
    </DashboardLayout>
  );
}

'use client';

import { useState, useEffect } from 'react';
import { logger } from '@/lib/logger-minimal';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
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
  RefreshCw,
  AlertTriangle,
  Building,
  CheckCircle,
  Clock,
  XCircle,
  Info,
  Plus,
  Search,
  Filter,
  Download,
  Eye,
  MapPin,
  Home,
  DollarSign,
  Calendar,
  Mail,
  User,
  Users,
  AlertCircle,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import UnifiedDashboardLayout from '@/components/layout/UnifiedDashboardLayout';
import { useAuth } from '@/components/auth/AuthProviderSimple';

interface PropertyReport {
  id: string;
  propertyTitle: string;
  propertyAddress: string;
  ownerName: string;
  ownerEmail: string;
  reportedIssues: string[];
  status: 'active' | 'inactive' | 'reported' | 'maintenance';
  lastReportedDate?: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  tenantCount: number;
}

interface PropertyStats {
  totalProperties: number;
  activeProperties: number;
  reportedIssues: number;
  underMaintenance: number;
}

export default function SupportPropertiesPage() {
  const { user, loading: userLoading } = useAuth();
  const [properties, setProperties] = useState<PropertyReport[]>([]);
  const [stats, setStats] = useState<PropertyStats>({
    totalProperties: 0,
    activeProperties: 0,
    reportedIssues: 0,
    underMaintenance: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');

  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  // Estados para el diálogo de exportación
  const [showExportDialog, setShowExportDialog] = useState(false);
  const [exportOptions, setExportOptions] = useState({
    format: 'csv',
    status: 'all',
    startDate: '',
    endDate: '',
  });
  const [selectedProperty, setSelectedProperty] = useState<PropertyReport | null>(null);
  const [showPropertyModal, setShowPropertyModal] = useState(false);
  const [showCreateIssueModal, setShowCreateIssueModal] = useState(false);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    loadPageData();
  }, [statusFilter, priorityFilter, searchTerm]);

  const loadPageData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Intentar obtener datos reales de la API
      try {
        const params = new URLSearchParams();
        if (statusFilter !== 'all') {
          params.append('status', statusFilter);
        }
        if (priorityFilter !== 'all') {
          params.append('priority', priorityFilter);
        }
        if (searchTerm) {
          params.append('search', searchTerm);
        }

        const response = await fetch(`/api/support/properties?${params}`, {
          credentials: 'include',
        });

        if (!response.ok) {
          throw new Error(`Error al cargar propiedades: ${response.status}`);
        }

        const data = await response.json();

        setProperties(data.properties || []);
        setTotalProperties(data.pagination?.total || 0);
        setStats(
          data.stats || {
            totalProperties: 0,
            activeProperties: 0,
            reportedIssues: 0,
            underMaintenance: 0,
          }
        );

        logger.info('Propiedades cargadas desde API:', { count: data.properties?.length || 0 });
        return;
      } catch (apiError) {
        console.warn('API no disponible, usando datos simulados:', apiError);
      }

      // Usar datos simulados si la API no está disponible
      const mockProperties: PropertyReport[] = generateMockProperties();

      const mockStats: PropertyStats = {
        totalProperties: mockProperties.length,
        activeProperties: mockProperties.filter(p => p.status === 'active').length,
        reportedIssues: mockProperties.filter(p => p.reportedIssues.length > 0).length,
        underMaintenance: mockProperties.filter(p => p.status === 'maintenance').length,
      };

      // Filter properties based on search and filters
      let filteredProperties = mockProperties;

      if (searchTerm) {
        filteredProperties = filteredProperties.filter(
          property =>
            property.propertyTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
            property.ownerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            property.propertyAddress.toLowerCase().includes(searchTerm.toLowerCase()) ||
            property.ownerEmail.toLowerCase().includes(searchTerm.toLowerCase())
        );
      }

      if (statusFilter !== 'all') {
        filteredProperties = filteredProperties.filter(
          property => property.status === statusFilter
        );
      }

      if (priorityFilter !== 'all') {
        filteredProperties = filteredProperties.filter(
          property => property.priority === priorityFilter
        );
      }

      setProperties(filteredProperties);
      setStats(mockStats);

      // Simular carga
      await new Promise(resolve => setTimeout(resolve, 1000));
    } catch (error) {
      logger.error('Error loading support properties:', {
        error: error instanceof Error ? error.message : String(error),
      });
      setError('Error al cargar las propiedades');
    } finally {
      setLoading(false);
    }
  };

  const generateMockProperties = (): PropertyReport[] => {
    const properties: PropertyReport[] = [];
    const propertyTypes = ['Casa', 'Departamento', 'Oficina', 'Local comercial', 'Bodega'];
    const communes = [
      'Las Condes',
      'Vitacura',
      'Providencia',
      'Ñuñoa',
      'La Reina',
      'Santiago Centro',
      'Maipú',
      'Pudahuel',
    ];
    const issues = [
      'Fuga de agua',
      'Puerta dañada',
      'Sistema eléctrico defectuoso',
      'Techo con filtraciones',
      'Calefacción no funciona',
      'Puerta de garage atascada',
      'Ventanas rotas',
      'Paredes agrietadas',
      'Problemas de plomería',
      'Sistema de alarma defectuoso',
    ];
    const statuses: PropertyReport['status'][] = ['active', 'inactive', 'reported', 'maintenance'];
    const priorities: PropertyReport['priority'][] = ['low', 'medium', 'high', 'urgent'];

    for (let i = 0; i < 150; i++) {
      const propertyType = propertyTypes[Math.floor(Math.random() * propertyTypes.length)];
      const commune = communes[Math.floor(Math.random() * communes.length)];
      const status = statuses[Math.floor(Math.random() * statuses.length)] || 'active';
      const priority = priorities[Math.floor(Math.random() * priorities.length)] || 'low';

      // Generate random issues based on status
      const reportedIssues: string[] = [];
      if (status === 'reported' || status === 'maintenance') {
        const numIssues = Math.floor(Math.random() * 3) + 1;
        for (let j = 0; j < numIssues; j++) {
          const issue = issues[Math.floor(Math.random() * issues.length)];
          if (issue && !reportedIssues.includes(issue)) {
            reportedIssues.push(issue);
          }
        }
      }

      const lastReportedDate =
        reportedIssues.length > 0
          ? new Date(Date.now() - Math.floor(Math.random() * 30) * 24 * 60 * 60 * 1000)
              .toISOString()
              .split('T')[0]
          : undefined;

      const propertyData: PropertyReport = {
        id: String(i + 1),
        propertyTitle: `${propertyType} en ${commune}`,
        propertyAddress: `Calle ${Math.floor(Math.random() * 1000) + 1}, ${commune}`,
        ownerName: `Propietario ${i + 1}`,
        ownerEmail: `propietario${i + 1}@example.com`,
        reportedIssues,
        status,
        priority,
        tenantCount: Math.floor(Math.random() * 5),
      };

      if (lastReportedDate) {
        propertyData.lastReportedDate = lastReportedDate;
      }

      properties.push(propertyData);
    }

    return properties;
  };

  const handleViewProperty = (propertyId: string) => {
    const property = properties.find(p => p.id === propertyId);
    if (property) {
      setSelectedProperty(property);
      setShowPropertyModal(true);
    }
  };

  const handleCreateIssue = (propertyId: string) => {
    const property = properties.find(p => p.id === propertyId);
    if (property) {
      setSelectedProperty(property);
      setShowCreateIssueModal(true);
    }
  };

  const handleExportProperties = () => {
    logger.info('Abriendo opciones de exportación de propiedades de soporte');
    setShowExportDialog(true);
  };

  const handleConfirmExport = async () => {
    try {
      logger.info('Exportando propiedades de soporte', exportOptions);

      // Construir URL con parámetros
      const params = new URLSearchParams();
      params.append('format', exportOptions.format);
      if (exportOptions.status !== 'all') {
        params.append('status', exportOptions.status);
      }
      if (exportOptions.startDate) {
        params.append('startDate', exportOptions.startDate);
      }
      if (exportOptions.endDate) {
        params.append('endDate', exportOptions.endDate);
      }

      // Crear URL de descarga
      const exportUrl = `/api/support/properties/export?${params.toString()}`;

      // Crear enlace temporal para descarga
      const link = document.createElement('a');
      link.href = exportUrl;
      link.download = `propiedades_soporte_${new Date().toISOString().split('T')[0]}.${exportOptions.format}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      setShowExportDialog(false);

      // Resetear opciones de exportación
      setExportOptions({
        format: 'csv',
        status: 'all',
        startDate: '',
        endDate: '',
      });

      logger.info('Exportación de propiedades completada exitosamente');
    } catch (error) {
      logger.error('Error exportando propiedades:', {
        error: error instanceof Error ? error.message : String(error),
      });
      alert('Error al exportar las propiedades. Por favor, intenta nuevamente.');
    }
  };

  const handleResolveIssue = async (property: PropertyReport, issue: string) => {
    try {
      // Simular API call
      await new Promise(resolve => setTimeout(resolve, 1000));

      setProperties(prevProperties =>
        prevProperties.map(p =>
          p.id === property.id
            ? { ...p, reportedIssues: p.reportedIssues.filter(i => i !== issue) }
            : p
        )
      );

      setSuccessMessage(`Problema "${issue}" resuelto exitosamente`);
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      logger.error('Error resolving issue:', { error });
      setErrorMessage('Error al resolver el problema');
      setTimeout(() => setErrorMessage(''), 3000);
    }
  };

  const handleResolveAllIssues = async (property: PropertyReport) => {
    try {
      if (property.reportedIssues.length === 0) {
        return;
      }

      // Simular API call
      await new Promise(resolve => setTimeout(resolve, 1500));

      setProperties(prevProperties =>
        prevProperties.map(p =>
          p.id === property.id ? { ...p, reportedIssues: [], status: 'active' as const } : p
        )
      );

      setSuccessMessage(`Todos los problemas de "${property.propertyTitle}" han sido resueltos`);
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      logger.error('Error resolving all issues:', { error });
      setErrorMessage('Error al resolver todos los problemas');
      setTimeout(() => setErrorMessage(''), 3000);
    }
  };

  const handleExportData = async () => {
    try {
      setExporting(true);

      // Simular exportación
      await new Promise(resolve => setTimeout(resolve, 2000));

      const csvContent = [
        [
          'ID',
          'Título',
          'Dirección',
          'Propietario',
          'Email',
          'Estado',
          'Prioridad',
          'Problemas Reportados',
        ].join(','),
        ...properties.map(p =>
          [
            p.id,
            p.propertyTitle,
            p.propertyAddress,
            p.ownerName,
            p.ownerEmail,
            p.status,
            p.priority,
            p.reportedIssues.join('; '),
          ].join(',')
        ),
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute(
        'download',
        `propiedades-soporte-${new Date().toISOString().split('T')[0]}.csv`
      );
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      setSuccessMessage('Datos exportados exitosamente');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      logger.error('Error exporting data:', { error });
      setErrorMessage('Error al exportar los datos');
      setTimeout(() => setErrorMessage(''), 3000);
    } finally {
      setExporting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      active: { label: 'Activa', color: 'bg-green-100 text-green-800' },
      inactive: { label: 'Inactiva', color: 'bg-gray-100 text-gray-800' },
      reported: { label: 'Reportada', color: 'bg-red-100 text-red-800' },
      maintenance: { label: 'Mantenimiento', color: 'bg-yellow-100 text-yellow-800' },
    };
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.active;
    return <Badge className={config.color}>{config.label}</Badge>;
  };

  const getPriorityBadge = (priority: string) => {
    const priorityConfig = {
      low: { label: 'Baja', color: 'bg-blue-100 text-blue-800' },
      medium: { label: 'Media', color: 'bg-yellow-100 text-yellow-800' },
      high: { label: 'Alta', color: 'bg-orange-100 text-orange-800' },
      urgent: { label: 'Urgente', color: 'bg-red-100 text-red-800' },
    };
    const config = priorityConfig[priority as keyof typeof priorityConfig] || priorityConfig.low;
    return <Badge className={config.color}>{config.label}</Badge>;
  };

  const filteredProperties = properties.filter(property => {
    const matchesSearch =
      property.propertyTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
      property.ownerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      property.propertyAddress.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || property.status === statusFilter;
    const matchesPriority = priorityFilter === 'all' || property.priority === priorityFilter;
    return matchesSearch && matchesStatus && matchesPriority;
  });

  const handleContactOwner = (ownerEmail: string, propertyTitle: string) => {
    // Open email client
    const subject = encodeURIComponent(`Soporte - Propiedad: ${propertyTitle}`);
    const body = encodeURIComponent(
      `Hola,\n\nMe comunico respecto a la propiedad: ${propertyTitle}\n\nAtentamente,\nEquipo de Soporte Rent360`
    );
    window.open(`mailto:${ownerEmail}?subject=${subject}&body=${body}`);
  };

  if (loading) {
    return (
      <UnifiedDashboardLayout
        title="Propiedades de Soporte"
        subtitle="Cargando información de propiedades..."
      >
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Cargando propiedades...</p>
          </div>
        </div>
      </UnifiedDashboardLayout>
    );
  }

  if (error) {
    return (
      <UnifiedDashboardLayout title="Propiedades de Soporte" subtitle="Error al cargar la página">
        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Error</h3>
              <p className="text-gray-600 mb-4">{error}</p>
              <Button onClick={loadPageData}>
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
      title="Propiedades de Soporte"
      subtitle="Gestiona y supervisa todas las propiedades del sistema"
    >
      <div className="space-y-6">
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

        {/* Estadísticas de Propiedades */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Propiedades</CardTitle>
              <Building className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {stats.totalProperties.toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground">En el sistema</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Propiedades Activas</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {stats.activeProperties.toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground">Funcionando normalmente</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Problemas Reportados</CardTitle>
              <AlertCircle className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{stats.reportedIssues}</div>
              <p className="text-xs text-muted-foreground">Requieren atención</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">En Mantenimiento</CardTitle>
              <Clock className="h-4 w-4 text-yellow-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">{stats.underMaintenance}</div>
              <p className="text-xs text-muted-foreground">Trabajos en curso</p>
            </CardContent>
          </Card>
        </div>

        {/* Filtros y Búsqueda */}
        <Card>
          <CardHeader>
            <CardTitle>Filtros y Búsqueda</CardTitle>
            <CardDescription>Filtra las propiedades por diferentes criterios</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-4">
              <div className="md:col-span-2">
                <Input
                  placeholder="Buscar por propiedad, propietario o dirección..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="w-full"
                />
              </div>

              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Estado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los estados</SelectItem>
                  <SelectItem value="active">Activas</SelectItem>
                  <SelectItem value="inactive">Inactivas</SelectItem>
                  <SelectItem value="reported">Reportadas</SelectItem>
                  <SelectItem value="maintenance">En mantenimiento</SelectItem>
                </SelectContent>
              </Select>

              <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Prioridad" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas las prioridades</SelectItem>
                  <SelectItem value="low">Baja</SelectItem>
                  <SelectItem value="medium">Media</SelectItem>
                  <SelectItem value="high">Alta</SelectItem>
                  <SelectItem value="urgent">Urgente</SelectItem>
                </SelectContent>
              </Select>

              <div className="flex gap-2">
                <Button variant="outline" onClick={loadPageData}>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Actualizar
                </Button>

                <Button variant="outline" onClick={handleExportProperties}>
                  <Download className="w-4 h-4 mr-2" />
                  Exportar
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Lista de Propiedades */}
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle>Propiedades ({filteredProperties.length})</CardTitle>
                <CardDescription>Lista completa de propiedades en el sistema</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[600px]">
              <div className="space-y-4">
                {filteredProperties.length === 0 ? (
                  <div className="text-center py-12">
                    <Building className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      No se encontraron propiedades
                    </h3>
                    <p className="text-gray-600 mb-4">
                      No hay propiedades que coincidan con los criterios de búsqueda.
                    </p>
                    <Button
                      onClick={() => {
                        setSearchTerm('');
                        setStatusFilter('all');
                        setPriorityFilter('all');
                      }}
                    >
                      Limpiar Filtros
                    </Button>
                  </div>
                ) : (
                  filteredProperties.map(property => (
                    <div
                      key={property.id}
                      className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-all duration-300 hover:border-blue-300"
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <Home className="w-5 h-5 text-gray-600" />
                            <h3 className="font-bold text-lg text-gray-800">
                              {property.propertyTitle}
                            </h3>
                            <div className="flex gap-2">
                              {getStatusBadge(property.status)}
                              {getPriorityBadge(property.priority)}
                            </div>
                          </div>

                          <div className="text-sm text-gray-600 mb-3">
                            <MapPin className="w-4 h-4 inline mr-1" />
                            {property.propertyAddress}
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                              <User className="w-4 h-4" />
                              <span className="font-medium">Propietario:</span>
                              {property.ownerName}
                            </div>

                            <div className="flex items-center gap-2 text-sm text-gray-600">
                              <span className="font-medium">Email:</span>
                              {property.ownerEmail}
                            </div>

                            <div className="flex items-center gap-2 text-sm text-gray-600">
                              <span className="font-medium">Inquilinos:</span>
                              {property.tenantCount}
                            </div>

                            {property.lastReportedDate && (
                              <div className="flex items-center gap-2 text-sm text-gray-600">
                                <Calendar className="w-4 h-4" />
                                <span>
                                  Último reporte:{' '}
                                  {new Date(property.lastReportedDate).toLocaleDateString('es-CL')}
                                </span>
                              </div>
                            )}

                            {property.reportedIssues.length > 0 && (
                              <div className="col-span-full">
                                <div className="flex items-center gap-2 text-sm text-red-600">
                                  <AlertCircle className="w-4 h-4" />
                                  <span className="font-medium">Problemas reportados:</span>
                                  <div className="flex flex-wrap gap-1">
                                    {property.reportedIssues.map((issue, index) => (
                                      <Badge
                                        key={index}
                                        variant="outline"
                                        className="text-xs text-red-600 border-red-300"
                                      >
                                        {issue}
                                      </Badge>
                                    ))}
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="flex flex-col gap-2 ml-4">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleViewProperty(property.id)}
                          >
                            <Eye className="w-4 h-4 mr-1" />
                            Ver Detalles
                          </Button>

                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() =>
                              handleContactOwner(property.ownerEmail, property.propertyTitle)
                            }
                          >
                            <User className="w-4 h-4 mr-1" />
                            Contactar Propietario
                          </Button>

                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleCreateIssue(property.id)}
                          >
                            <AlertCircle className="w-4 h-4 mr-1" />
                            Crear Problema
                          </Button>

                          {property.reportedIssues.length > 0 && (
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleResolveAllIssues(property)}
                            >
                              <CheckCircle className="w-4 h-4 mr-1" />
                              Resolver Todos
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Mensajes de éxito y error */}
        {successMessage && (
          <div className="fixed bottom-4 right-4 bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded shadow-lg z-50">
            <div className="flex items-center">
              <CheckCircle className="w-5 h-5 mr-2" />
              <span>{successMessage}</span>
            </div>
          </div>
        )}

        {errorMessage && (
          <div className="fixed bottom-4 right-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded shadow-lg z-50">
            <div className="flex items-center">
              <AlertCircle className="w-5 h-5 mr-2" />
              <span>{errorMessage}</span>
            </div>
          </div>
        )}

        {/* Modal de Detalles de Propiedad */}
        {showPropertyModal && selectedProperty && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto mx-4">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-800">Detalles de Propiedad</h2>
                <Button variant="ghost" size="sm" onClick={() => setShowPropertyModal(false)}>
                  <XCircle className="w-5 h-5" />
                </Button>
              </div>

              <div className="space-y-6">
                <div className="flex items-center gap-2">
                  <Home className="w-6 h-6 text-blue-600" />
                  <h3 className="text-xl font-semibold">{selectedProperty.propertyTitle}</h3>
                  <div className="flex gap-2">
                    {getStatusBadge(selectedProperty.status)}
                    {getPriorityBadge(selectedProperty.priority)}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-medium text-gray-700 mb-2">Información General</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-gray-500" />
                        <span>{selectedProperty.propertyAddress}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-gray-500" />
                        <span>Propietario: {selectedProperty.ownerName}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Mail className="w-4 h-4 text-gray-500" />
                        <span>Email: {selectedProperty.ownerEmail}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4 text-gray-500" />
                        <span>Inquilinos activos: {selectedProperty.tenantCount}</span>
                      </div>
                      {selectedProperty.lastReportedDate && (
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-gray-500" />
                          <span>
                            Último reporte:{' '}
                            {new Date(selectedProperty.lastReportedDate).toLocaleDateString(
                              'es-CL'
                            )}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium text-gray-700 mb-2">Problemas Reportados</h4>
                    {selectedProperty.reportedIssues.length === 0 ? (
                      <p className="text-sm text-gray-500">No hay problemas reportados</p>
                    ) : (
                      <div className="space-y-2">
                        {selectedProperty.reportedIssues.map((issue, index) => (
                          <div
                            key={index}
                            className="flex items-center justify-between p-2 bg-red-50 rounded"
                          >
                            <span className="text-sm text-red-700">{issue}</span>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleResolveIssue(selectedProperty, issue)}
                            >
                              <CheckCircle className="w-4 h-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex gap-3 pt-4 border-t">
                  <Button
                    onClick={() =>
                      handleContactOwner(
                        selectedProperty.ownerEmail,
                        selectedProperty.propertyTitle
                      )
                    }
                    className="flex-1"
                  >
                    <User className="w-4 h-4 mr-2" />
                    Contactar Propietario
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => handleCreateIssue(selectedProperty.id)}
                    className="flex-1"
                  >
                    <AlertCircle className="w-4 h-4 mr-2" />
                    Crear Problema
                  </Button>
                  {selectedProperty.reportedIssues.length > 0 && (
                    <Button
                      variant="destructive"
                      onClick={() => handleResolveAllIssues(selectedProperty)}
                      className="flex-1"
                    >
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Resolver Todos
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Modal de Crear Problema */}
        {showCreateIssueModal && selectedProperty && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-gray-800">Crear Nuevo Problema</h2>
                <Button variant="ghost" size="sm" onClick={() => setShowCreateIssueModal(false)}>
                  <XCircle className="w-5 h-5" />
                </Button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Propiedad</label>
                  <div className="p-3 bg-gray-50 rounded-md">
                    <div className="font-medium">{selectedProperty.propertyTitle}</div>
                    <div className="text-sm text-gray-600">{selectedProperty.propertyAddress}</div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tipo de Problema
                  </label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar tipo de problema" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="plumbing">Problemas de Plomería</SelectItem>
                      <SelectItem value="electrical">Problemas Eléctricos</SelectItem>
                      <SelectItem value="structural">Problemas Estructurales</SelectItem>
                      <SelectItem value="maintenance">Mantenimiento General</SelectItem>
                      <SelectItem value="security">Problemas de Seguridad</SelectItem>
                      <SelectItem value="other">Otro</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Descripción
                  </label>
                  <Textarea placeholder="Describe el problema en detalle..." rows={4} />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Prioridad</label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar prioridad" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Baja</SelectItem>
                      <SelectItem value="medium">Media</SelectItem>
                      <SelectItem value="high">Alta</SelectItem>
                      <SelectItem value="urgent">Urgente</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex gap-3 pt-4">
                  <Button
                    variant="outline"
                    onClick={() => setShowCreateIssueModal(false)}
                    className="flex-1"
                  >
                    Cancelar
                  </Button>
                  <Button className="flex-1">
                    <Plus className="w-4 h-4 mr-2" />
                    Crear Problema
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Export Dialog */}
      <Dialog open={showExportDialog} onOpenChange={setShowExportDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Exportar Propiedades de Soporte</DialogTitle>
            <DialogDescription>
              Selecciona el formato y filtros para exportar las propiedades.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="export-format">Formato</Label>
              <Select
                value={exportOptions.format}
                onValueChange={value => setExportOptions({ ...exportOptions, format: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona formato" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="csv">CSV</SelectItem>
                  <SelectItem value="json">JSON</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="export-status">Estado</Label>
              <Select
                value={exportOptions.status}
                onValueChange={value => setExportOptions({ ...exportOptions, status: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Todos los estados" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los estados</SelectItem>
                  <SelectItem value="ACTIVE">Activa</SelectItem>
                  <SelectItem value="INACTIVE">Inactiva</SelectItem>
                  <SelectItem value="MAINTENANCE">En Mantenimiento</SelectItem>
                  <SelectItem value="SOLD">Vendida</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="start-date">Fecha Desde</Label>
                <Input
                  id="start-date"
                  type="date"
                  value={exportOptions.startDate}
                  onChange={e => setExportOptions({ ...exportOptions, startDate: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="end-date">Fecha Hasta</Label>
                <Input
                  id="end-date"
                  type="date"
                  value={exportOptions.endDate}
                  onChange={e => setExportOptions({ ...exportOptions, endDate: e.target.value })}
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => setShowExportDialog(false)}>
                Cancelar
              </Button>
              <Button onClick={handleConfirmExport}>
                <Download className="h-4 w-4 mr-2" />
                Exportar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </UnifiedDashboardLayout>
  );
}

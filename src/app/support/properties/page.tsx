'use client';

import { useState, useEffect } from 'react';
import { logger } from '@/lib/logger';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
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
  User,
  AlertCircle,
} from 'lucide-react';
import UnifiedDashboardLayout from '@/components/layout/UnifiedDashboardLayout';
import { useUserState } from '@/hooks/useUserState';

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
  const { user, loading: userLoading } = useUserState();
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

  useEffect(() => {
    loadPageData();
  }, []);

  const loadPageData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Mock data for support properties
      const mockProperties: PropertyReport[] = [
        {
          id: '1',
          propertyTitle: 'Casa en Las Condes',
          propertyAddress: 'Av. Las Condes 1234, Las Condes',
          ownerName: 'María González',
          ownerEmail: 'maria@example.com',
          reportedIssues: ['Fuga de agua', 'Puerta dañada'],
          status: 'reported',
          lastReportedDate: '2024-01-15',
          priority: 'high',
          tenantCount: 1,
        },
        {
          id: '2',
          propertyTitle: 'Departamento Vitacura',
          propertyAddress: 'Calle Vitacura 567, Vitacura',
          ownerName: 'Carlos Rodríguez',
          ownerEmail: 'carlos@example.com',
          reportedIssues: [],
          status: 'active',
          priority: 'low',
          tenantCount: 2,
        },
        {
          id: '3',
          propertyTitle: 'Oficina Providencia',
          propertyAddress: 'Providencia 890, Providencia',
          ownerName: 'Ana López',
          ownerEmail: 'ana@example.com',
          reportedIssues: ['Sistema eléctrico defectuoso'],
          status: 'maintenance',
          lastReportedDate: '2024-01-20',
          priority: 'urgent',
          tenantCount: 0,
        },
        {
          id: '4',
          propertyTitle: 'Local Santiago Centro',
          propertyAddress: 'Centro 456, Santiago',
          ownerName: 'Pedro Sánchez',
          ownerEmail: 'pedro@example.com',
          reportedIssues: ['Techo con filtraciones'],
          status: 'reported',
          lastReportedDate: '2024-01-10',
          priority: 'medium',
          tenantCount: 1,
        },
      ];

      const mockStats: PropertyStats = {
        totalProperties: 1250,
        activeProperties: 1180,
        reportedIssues: 45,
        underMaintenance: 25,
      };

      setProperties(mockProperties);
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

  const handleViewProperty = (propertyId: string) => {
    // Navigate to property detail view
    window.open(`/support/properties/${propertyId}`, '_blank');
  };

  const handleContactOwner = (ownerEmail: string, propertyTitle: string) => {
    // Open email client
    const subject = encodeURIComponent(`Soporte - Propiedad: ${propertyTitle}`);
    const body = encodeURIComponent(
      `Hola,\n\nMe comunico respecto a la propiedad: ${propertyTitle}\n\nAtentamente,\nEquipo de Soporte Rent360`
    );
    window.open(`mailto:${ownerEmail}?subject=${subject}&body=${body}`);
  };

  const handleExportProperties = () => {
    // Export properties data to CSV
    if (filteredProperties.length === 0) {
      alert('No hay propiedades para exportar');
      return;
    }

    const csvData = filteredProperties.map(property => ({
      ID: property.id,
      Propiedad: property.propertyTitle,
      Dirección: property.propertyAddress,
      Propietario: property.ownerName,
      Email: property.ownerEmail,
      Estado:
        property.status === 'active'
          ? 'Activa'
          : property.status === 'inactive'
            ? 'Inactiva'
            : property.status === 'reported'
              ? 'Reportada'
              : 'Mantenimiento',
      Prioridad: property.priority,
      'Problemas Reportados': property.reportedIssues.length,
      'Último Reporte': property.lastReportedDate || 'N/A',
      Inquilinos: property.tenantCount,
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
      `propiedades_soporte_${new Date().toISOString().split('T')[0]}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    </UnifiedDashboardLayout>
  );
}

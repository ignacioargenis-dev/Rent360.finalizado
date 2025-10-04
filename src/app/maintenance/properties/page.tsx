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
import {
  AlertCircle,
  RefreshCw,
  Building,
  MapPin,
  User,
  Phone,
  Wrench,
  Calendar,
  DollarSign,
  Search,
  Filter,
  Download,
  Eye,
  CheckCircle,
  Clock,
  AlertTriangle,
} from 'lucide-react';
import UnifiedDashboardLayout from '@/components/layout/UnifiedDashboardLayout';
import { QuickActionButton } from '@/components/dashboard/QuickActionButton';

interface Property {
  id: string;
  address: string;
  commune: string;
  region: string;
  ownerName: string;
  ownerPhone: string;
  ownerEmail: string;
  propertyType: 'house' | 'apartment' | 'office' | 'warehouse';
  bedrooms?: number;
  bathrooms?: number;
  totalJobs: number;
  activeJobs: number;
  completedJobs: number;
  totalRevenue: number;
  lastJobDate?: string;
  nextJobDate?: string;
  status: 'active' | 'inactive' | 'maintenance';
}

export default function MaintenancePropertiesPage() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [filteredProperties, setFilteredProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');

  useEffect(() => {
    loadProperties();
  }, []);

  useEffect(() => {
    filterProperties();
  }, [properties, searchTerm, statusFilter, typeFilter]);

  const loadProperties = async () => {
    try {
      setLoading(true);
      setError(null);

      // Mock data for demonstration
      const mockProperties: Property[] = [
        {
          id: '1',
          address: 'Av. Las Condes 1234, Depto 5B',
          commune: 'Las Condes',
          region: 'Metropolitana',
          ownerName: 'María González Rodríguez',
          ownerPhone: '+56912345678',
          ownerEmail: 'maria.gonzalez@email.com',
          propertyType: 'apartment',
          bedrooms: 2,
          bathrooms: 2,
          totalJobs: 8,
          activeJobs: 1,
          completedJobs: 7,
          totalRevenue: 320000,
          lastJobDate: '2024-01-10',
          nextJobDate: '2024-02-15',
          status: 'active',
        },
        {
          id: '2',
          address: 'Providencia 567',
          commune: 'Providencia',
          region: 'Metropolitana',
          ownerName: 'Carlos Rodríguez Silva',
          ownerPhone: '+56987654321',
          ownerEmail: 'carlos.rodriguez@email.com',
          propertyType: 'house',
          bedrooms: 3,
          bathrooms: 2,
          totalJobs: 5,
          activeJobs: 0,
          completedJobs: 5,
          totalRevenue: 185000,
          lastJobDate: '2024-01-05',
          status: 'active',
        },
        {
          id: '3',
          address: 'Ñuñoa 890, Oficina 201',
          commune: 'Ñuñoa',
          region: 'Metropolitana',
          ownerName: 'Ana López Martínez',
          ownerPhone: '+56911223344',
          ownerEmail: 'ana.lopez@email.com',
          propertyType: 'office',
          bedrooms: 0,
          bathrooms: 1,
          totalJobs: 3,
          activeJobs: 2,
          completedJobs: 1,
          totalRevenue: 95000,
          lastJobDate: '2024-01-12',
          nextJobDate: '2024-01-20',
          status: 'maintenance',
        },
      ];

      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      setProperties(mockProperties);
    } catch (error) {
      logger.error('Error loading maintenance properties:', {
        error: error instanceof Error ? error.message : String(error),
      });
      setError('Error al cargar las propiedades');
    } finally {
      setLoading(false);
    }
  };

  const filterProperties = () => {
    let filtered = properties;

    if (searchTerm) {
      filtered = filtered.filter(
        property =>
          property.address.toLowerCase().includes(searchTerm.toLowerCase()) ||
          property.ownerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          property.commune.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(property => property.status === statusFilter);
    }

    if (typeFilter !== 'all') {
      filtered = filtered.filter(property => property.propertyType === typeFilter);
    }

    setFilteredProperties(filtered);
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      active: { label: 'Activa', color: 'bg-green-100 text-green-800' },
      inactive: { label: 'Inactiva', color: 'bg-gray-100 text-gray-800' },
      maintenance: { label: 'En Mantenimiento', color: 'bg-yellow-100 text-yellow-800' },
    };
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.active;
    return <Badge className={config.color}>{config.label}</Badge>;
  };

  const getTypeBadge = (type: string) => {
    const typeConfig = {
      house: { label: 'Casa', color: 'bg-blue-100 text-blue-800' },
      apartment: { label: 'Departamento', color: 'bg-purple-100 text-purple-800' },
      office: { label: 'Oficina', color: 'bg-orange-100 text-orange-800' },
      warehouse: { label: 'Bodega', color: 'bg-brown-100 text-brown-800' },
    };
    const config = typeConfig[type as keyof typeof typeConfig] || typeConfig.house;
    return <Badge className={config.color}>{config.label}</Badge>;
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const handleExportProperties = () => {
    if (filteredProperties.length === 0) {
      alert('No hay propiedades para exportar');
      return;
    }

    const csvData = filteredProperties.map(property => ({
      ID: property.id,
      Dirección: property.address,
      Comuna: property.commune,
      Región: property.region,
      Propietario: property.ownerName,
      Teléfono: property.ownerPhone,
      Email: property.ownerEmail,
      Tipo: getTypeBadge(property.propertyType).props.children,
      Dormitorios: property.bedrooms || '',
      Baños: property.bathrooms || '',
      'Trabajos Totales': property.totalJobs,
      'Trabajos Activos': property.activeJobs,
      'Trabajos Completados': property.completedJobs,
      'Ingresos Totales': formatCurrency(property.totalRevenue),
      Estado: getStatusBadge(property.status).props.children,
      'Último Trabajo': property.lastJobDate || '',
      'Próximo Trabajo': property.nextJobDate || '',
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
      `propiedades_mantenimiento_${new Date().toISOString().split('T')[0]}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) {
    return (
      <UnifiedDashboardLayout title="Propiedades" subtitle="Cargando información...">
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
      <UnifiedDashboardLayout title="Propiedades" subtitle="Error al cargar la página">
        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Error</h3>
              <p className="text-gray-600 mb-4">{error}</p>
              <Button onClick={loadProperties}>
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
      title="Propiedades"
      subtitle="Propiedades donde realizas trabajos de mantenimiento"
    >
      <div className="space-y-6">
        {/* Estadísticas */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Building className="h-8 w-8 text-blue-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Propiedades</p>
                  <p className="text-2xl font-bold text-gray-900">{properties.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Wrench className="h-8 w-8 text-orange-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Trabajos Activos</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {properties.reduce((sum, prop) => sum + prop.activeJobs, 0)}
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
                  <p className="text-sm font-medium text-gray-600">Trabajos Completados</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {properties.reduce((sum, prop) => sum + prop.completedJobs, 0)}
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
                    {formatCurrency(properties.reduce((sum, prop) => sum + prop.totalRevenue, 0))}
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
            <CardDescription>Filtra y busca propiedades específicas</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Buscar por dirección, propietario o comuna..."
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
                  <SelectItem value="active">Activas</SelectItem>
                  <SelectItem value="inactive">Inactivas</SelectItem>
                  <SelectItem value="maintenance">En Mantenimiento</SelectItem>
                </SelectContent>
              </Select>

              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-full md:w-48">
                  <SelectValue placeholder="Tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los tipos</SelectItem>
                  <SelectItem value="house">Casa</SelectItem>
                  <SelectItem value="apartment">Departamento</SelectItem>
                  <SelectItem value="office">Oficina</SelectItem>
                  <SelectItem value="warehouse">Bodega</SelectItem>
                </SelectContent>
              </Select>

              <Button onClick={handleExportProperties} variant="outline">
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
            <CardDescription>Herramientas para gestión de propiedades</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <QuickActionButton
                icon={Search}
                label="Buscar"
                description="Buscar propiedades"
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
                onClick={handleExportProperties}
              />

              <QuickActionButton
                icon={Wrench}
                label="Trabajos Activos"
                description="Ver trabajos pendientes"
                onClick={() => {
                  // Filter properties with active jobs
                  setStatusFilter('maintenance');
                  alert('Mostrando propiedades con trabajos activos');
                }}
              />

              <QuickActionButton
                icon={Calendar}
                label="Próximos Trabajos"
                description="Agenda futura"
                onClick={() => {
                  alert('Funcionalidad: Mostrar trabajos programados para las próximas semanas');
                }}
              />

              <QuickActionButton
                icon={User}
                label="Contactos"
                description="Lista de propietarios"
                onClick={() => {
                  alert('Funcionalidad: Mostrar lista completa de propietarios con contacto');
                }}
              />

              <QuickActionButton
                icon={RefreshCw}
                label="Actualizar"
                description="Recargar datos"
                onClick={loadProperties}
              />
            </div>
          </CardContent>
        </Card>

        {/* Lista de propiedades */}
        <Card>
          <CardHeader>
            <CardTitle>Propiedades ({filteredProperties.length})</CardTitle>
            <CardDescription>
              Propiedades donde has realizado o tienes trabajos de mantenimiento
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {filteredProperties.map(property => (
                <Card key={property.id} className="border-l-4 border-l-green-500">
                  <CardContent className="p-6">
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-3">
                          <h3 className="text-lg font-semibold text-gray-900">
                            {property.address}
                          </h3>
                          {getStatusBadge(property.status)}
                          {getTypeBadge(property.propertyType)}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm mb-4">
                          <div>
                            <div className="flex items-center gap-2 mb-2">
                              <MapPin className="w-4 h-4 text-gray-400" />
                              <span>
                                {property.commune}, {property.region}
                              </span>
                            </div>
                            <div className="flex items-center gap-2 mb-2">
                              <User className="w-4 h-4 text-gray-400" />
                              <span className="font-medium">{property.ownerName}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Phone className="w-4 h-4 text-gray-400" />
                              <span>{property.ownerPhone}</span>
                            </div>
                          </div>

                          <div>
                            {property.bedrooms && (
                              <div className="mb-1">
                                <span className="font-medium">{property.bedrooms} dormitorios</span>
                              </div>
                            )}
                            {property.bathrooms && (
                              <div className="mb-1">
                                <span className="font-medium">{property.bathrooms} baños</span>
                              </div>
                            )}
                            <div className="mb-1">
                              <span className="font-medium">Trabajos: </span>
                              <span className="text-blue-600">{property.totalJobs} total</span>
                              {property.activeJobs > 0 && (
                                <span className="text-orange-600 ml-1">
                                  ({property.activeJobs} activos)
                                </span>
                              )}
                            </div>
                            <div>
                              <span className="font-medium">Ingresos: </span>
                              <span className="text-green-600 font-semibold">
                                {formatCurrency(property.totalRevenue)}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-4 text-sm text-gray-600">
                          {property.lastJobDate && (
                            <div className="flex items-center gap-1">
                              <Clock className="w-4 h-4" />
                              <span>
                                Último trabajo:{' '}
                                {new Date(property.lastJobDate).toLocaleDateString('es-CL')}
                              </span>
                            </div>
                          )}
                          {property.nextJobDate && (
                            <div className="flex items-center gap-1">
                              <Calendar className="w-4 h-4" />
                              <span>
                                Próximo trabajo:{' '}
                                {new Date(property.nextJobDate).toLocaleDateString('es-CL')}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex flex-col gap-2">
                        <Button variant="outline" size="sm">
                          <Eye className="w-4 h-4 mr-2" />
                          Ver Detalles
                        </Button>
                        <Button variant="outline" size="sm">
                          <Wrench className="w-4 h-4 mr-2" />
                          Ver Trabajos
                        </Button>
                        <Button variant="outline" size="sm">
                          <User className="w-4 h-4 mr-2" />
                          Contactar
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}

              {filteredProperties.length === 0 && (
                <div className="text-center py-8">
                  <Building className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    No hay propiedades encontradas
                  </h3>
                  <p className="text-gray-600">
                    {properties.length === 0
                      ? 'Aún no tienes propiedades asignadas para mantenimiento.'
                      : 'No se encontraron propiedades que coincidan con los filtros aplicados.'}
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </UnifiedDashboardLayout>
  );
}

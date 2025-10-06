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
  MessageCircle,
  ChevronRight,
  Mail,
} from 'lucide-react';
import UnifiedDashboardLayout from '@/components/layout/UnifiedDashboardLayout';
import { QuickActionButton } from '@/components/dashboard/QuickActionButton';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

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

  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [showAgendaModal, setShowAgendaModal] = useState(false);
  const [showContactsModal, setShowContactsModal] = useState(false);

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
      setErrorMessage('No hay propiedades para exportar');
      setTimeout(() => setErrorMessage(''), 5000);
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
                  setSuccessMessage('Mostrando propiedades con trabajos activos');
                  setTimeout(() => setSuccessMessage(''), 3000);
                }}
              />

              <Dialog open={showAgendaModal} onOpenChange={setShowAgendaModal}>
                <DialogTrigger asChild>
                  <div className="bg-white rounded-xl p-6 shadow-md hover:shadow-lg transition-all duration-300 border border-gray-100 hover:border-blue-200 group cursor-pointer">
                    <div className="bg-gradient-to-br from-blue-500 to-blue-600 w-12 h-12 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                      <Calendar className="w-6 h-6 text-white" />
                    </div>
                    <h3 className="font-semibold text-gray-800 mb-2">Próximos Trabajos</h3>
                    <p className="text-sm text-gray-600 mb-4">Agenda de mantenimientos</p>
                    <div className="text-blue-600 font-medium text-sm flex items-center">
                      Ver Agenda
                      <ChevronRight className="w-4 h-4 ml-1" />
                    </div>
                  </div>
                </DialogTrigger>
                <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                      <Calendar className="w-5 h-5" />
                      Agenda de Próximos Trabajos
                    </DialogTitle>
                    <DialogDescription>
                      Trabajos de mantenimiento programados en las próximas semanas
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-6">
                    {/* Upcoming Jobs List */}
                    <div className="space-y-4">
                      {[
                        {
                          id: '1',
                          title: 'Revisión sistema eléctrico',
                          property: 'Av. Las Condes 1234, Depto 5B',
                          owner: 'María González',
                          date: '2024-01-25',
                          time: '10:00',
                          priority: 'high',
                          status: 'scheduled',
                        },
                        {
                          id: '2',
                          title: 'Mantenimiento aire acondicionado',
                          property: 'Providencia 567, Oficina 301',
                          owner: 'Carlos Rodríguez',
                          date: '2024-01-28',
                          time: '14:00',
                          priority: 'medium',
                          status: 'scheduled',
                        },
                        {
                          id: '3',
                          title: 'Inspección estructural',
                          property: 'Ñuñoa 890, Casa Principal',
                          owner: 'Ana López',
                          date: '2024-02-02',
                          time: '09:00',
                          priority: 'high',
                          status: 'scheduled',
                        },
                        {
                          id: '4',
                          title: 'Limpieza general post-desocupación',
                          property: 'Vitacura 1500, Casa 45',
                          owner: 'Pedro Sánchez',
                          date: '2024-02-05',
                          time: '11:00',
                          priority: 'low',
                          status: 'scheduled',
                        },
                      ].map(job => (
                        <div
                          key={job.id}
                          className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors"
                        >
                          <div className="flex justify-between items-start mb-3">
                            <div>
                              <h3 className="font-semibold text-gray-900">{job.title}</h3>
                              <p className="text-sm text-gray-600 flex items-center mt-1">
                                <MapPin className="w-4 h-4 mr-1" />
                                {job.property}
                              </p>
                            </div>
                            <div className="flex gap-2">
                              <Badge
                                className={
                                  job.priority === 'high'
                                    ? 'bg-red-100 text-red-800'
                                    : job.priority === 'medium'
                                      ? 'bg-blue-100 text-blue-800'
                                      : 'bg-gray-100 text-gray-800'
                                }
                              >
                                {job.priority === 'high'
                                  ? 'Alta'
                                  : job.priority === 'medium'
                                    ? 'Media'
                                    : 'Baja'}
                              </Badge>
                              <Badge className="bg-yellow-100 text-yellow-800">Programado</Badge>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-3">
                            <div className="flex items-center gap-2">
                              <Calendar className="w-4 h-4 text-gray-400" />
                              <span className="text-sm">
                                {new Date(job.date).toLocaleDateString('es-CL')}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Clock className="w-4 h-4 text-gray-400" />
                              <span className="text-sm">{job.time}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <User className="w-4 h-4 text-gray-400" />
                              <span className="text-sm">{job.owner}</span>
                            </div>
                            <div className="text-sm text-gray-600">
                              {Math.ceil(
                                (new Date(job.date).getTime() - new Date().getTime()) /
                                  (1000 * 60 * 60 * 24)
                              )}{' '}
                              días
                            </div>
                          </div>

                          <div className="flex gap-2">
                            <Button size="sm" variant="outline">
                              <Eye className="w-4 h-4 mr-1" />
                              Ver Detalles
                            </Button>
                            <Button size="sm" variant="outline">
                              <Phone className="w-4 h-4 mr-1" />
                              Contactar
                            </Button>
                            <Button size="sm" variant="outline">
                              Reprogramar
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Summary */}
                    <div className="border-t pt-4">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="bg-blue-50 rounded-lg p-4 text-center">
                          <div className="text-2xl font-bold text-blue-600">4</div>
                          <div className="text-sm text-blue-800">Próximos 7 días</div>
                        </div>
                        <div className="bg-orange-50 rounded-lg p-4 text-center">
                          <div className="text-2xl font-bold text-orange-600">2</div>
                          <div className="text-sm text-orange-800">Próximas 2 semanas</div>
                        </div>
                        <div className="bg-green-50 rounded-lg p-4 text-center">
                          <div className="text-2xl font-bold text-green-600">12</div>
                          <div className="text-sm text-green-800">Próximo mes</div>
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-end gap-2">
                      <Button variant="outline" onClick={() => setShowAgendaModal(false)}>
                        Cerrar
                      </Button>
                      <Button onClick={() => setShowAgendaModal(false)}>
                        Ir al Calendario Completo
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>

              <Dialog open={showContactsModal} onOpenChange={setShowContactsModal}>
                <DialogTrigger asChild>
                  <div className="bg-white rounded-xl p-6 shadow-md hover:shadow-lg transition-all duration-300 border border-gray-100 hover:border-purple-200 group cursor-pointer">
                    <div className="bg-gradient-to-br from-purple-500 to-purple-600 w-12 h-12 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                      <User className="w-6 h-6 text-white" />
                    </div>
                    <h3 className="font-semibold text-gray-800 mb-2">Contactos</h3>
                    <p className="text-sm text-gray-600 mb-4">Lista de propietarios</p>
                    <div className="text-purple-600 font-medium text-sm flex items-center">
                      Ver Contactos
                      <ChevronRight className="w-4 h-4 ml-1" />
                    </div>
                  </div>
                </DialogTrigger>
                <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                      <User className="w-5 h-5" />
                      Directorio de Contactos
                    </DialogTitle>
                    <DialogDescription>
                      Lista completa de propietarios e inquilinos para contacto directo
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-6">
                    {/* Search and Filter */}
                    <div className="flex gap-4">
                      <Input
                        placeholder="Buscar por nombre, propiedad o comuna..."
                        className="flex-1"
                      />
                      <Select defaultValue="all">
                        <SelectTrigger className="w-48">
                          <SelectValue placeholder="Tipo de contacto" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Todos</SelectItem>
                          <SelectItem value="owner">Propietarios</SelectItem>
                          <SelectItem value="tenant">Inquilinos</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Contacts List */}
                    <div className="space-y-4">
                      {[
                        {
                          id: '1',
                          name: 'María González Rodríguez',
                          type: 'owner',
                          properties: ['Av. Las Condes 1234, Depto 5B'],
                          phone: '+56912345678',
                          email: 'maria.gonzalez@email.com',
                          lastContact: '2024-01-15',
                          totalJobs: 8,
                          activeJobs: 1,
                        },
                        {
                          id: '2',
                          name: 'Carlos Rodríguez Morales',
                          type: 'owner',
                          properties: ['Providencia 567, Oficina 301'],
                          phone: '+56987654321',
                          email: 'carlos.rodriguez@email.com',
                          lastContact: '2024-01-14',
                          totalJobs: 5,
                          activeJobs: 1,
                        },
                        {
                          id: '3',
                          name: 'Ana López García',
                          type: 'owner',
                          properties: ['Ñuñoa 890, Casa Principal'],
                          phone: '+56911223344',
                          email: 'ana.lopez@email.com',
                          lastContact: '2024-01-10',
                          totalJobs: 12,
                          activeJobs: 0,
                        },
                        {
                          id: '4',
                          name: 'Pedro Sánchez Ruiz',
                          type: 'owner',
                          properties: ['Vitacura 1500, Casa 45'],
                          phone: '+56944332211',
                          email: 'pedro.sanchez@email.com',
                          lastContact: '2024-01-12',
                          totalJobs: 6,
                          activeJobs: 1,
                        },
                        {
                          id: '5',
                          name: 'Laura Martínez Silva',
                          type: 'tenant',
                          properties: ['Av. Las Condes 1234, Depto 5B'],
                          phone: '+56955667788',
                          email: 'laura.martinez@email.com',
                          lastContact: '2024-01-08',
                          totalJobs: 0,
                          activeJobs: 0,
                        },
                      ].map(contact => (
                        <div
                          key={contact.id}
                          className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors"
                        >
                          <div className="flex justify-between items-start mb-3">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <h3 className="font-semibold text-gray-900">{contact.name}</h3>
                                <Badge
                                  className={
                                    contact.type === 'owner'
                                      ? 'bg-blue-100 text-blue-800'
                                      : 'bg-green-100 text-green-800'
                                  }
                                >
                                  {contact.type === 'owner' ? 'Propietario' : 'Inquilino'}
                                </Badge>
                              </div>

                              <div className="space-y-1 text-sm text-gray-600">
                                {contact.properties.map((property, index) => (
                                  <div key={index} className="flex items-center gap-1">
                                    <MapPin className="w-3 h-3" />
                                    <span>{property}</span>
                                  </div>
                                ))}
                              </div>
                            </div>

                            <div className="text-right">
                              <div className="text-sm text-gray-600 mb-1">
                                Último contacto:{' '}
                                {new Date(contact.lastContact).toLocaleDateString('es-CL')}
                              </div>
                              <div className="flex gap-2">
                                {contact.activeJobs > 0 && (
                                  <Badge className="bg-orange-100 text-orange-800">
                                    {contact.activeJobs} activo{contact.activeJobs > 1 ? 's' : ''}
                                  </Badge>
                                )}
                                <Badge variant="outline">{contact.totalJobs} total</Badge>
                              </div>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                            <div className="flex items-center gap-2">
                              <Phone className="w-4 h-4 text-gray-400" />
                              <span className="text-sm">{contact.phone}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Mail className="w-4 h-4 text-gray-400" />
                              <span className="text-sm">{contact.email}</span>
                            </div>
                            <div className="text-sm text-gray-600">
                              {contact.type === 'owner'
                                ? 'Trabajos realizados'
                                : 'Sin trabajos activos'}
                            </div>
                          </div>

                          <div className="flex gap-2">
                            <Button size="sm" variant="outline">
                              <Phone className="w-4 h-4 mr-1" />
                              Llamar
                            </Button>
                            <Button size="sm" variant="outline">
                              <Mail className="w-4 h-4 mr-1" />
                              Email
                            </Button>
                            <Button size="sm" variant="outline">
                              <MessageCircle className="w-4 h-4 mr-1" />
                              WhatsApp
                            </Button>
                            <Button size="sm" variant="outline">
                              <Eye className="w-4 h-4 mr-1" />
                              Historial
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Summary Stats */}
                    <div className="border-t pt-4">
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div className="bg-blue-50 rounded-lg p-4 text-center">
                          <div className="text-2xl font-bold text-blue-600">9</div>
                          <div className="text-sm text-blue-800">Total Contactos</div>
                        </div>
                        <div className="bg-green-50 rounded-lg p-4 text-center">
                          <div className="text-2xl font-bold text-green-600">4</div>
                          <div className="text-sm text-green-800">Propietarios</div>
                        </div>
                        <div className="bg-purple-50 rounded-lg p-4 text-center">
                          <div className="text-2xl font-bold text-purple-600">1</div>
                          <div className="text-sm text-purple-800">Inquilinos</div>
                        </div>
                        <div className="bg-orange-50 rounded-lg p-4 text-center">
                          <div className="text-2xl font-bold text-orange-600">3</div>
                          <div className="text-sm text-orange-800">Con Trabajos Activos</div>
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-end gap-2">
                      <Button variant="outline" onClick={() => setShowContactsModal(false)}>
                        Cerrar
                      </Button>
                      <Button onClick={() => setShowContactsModal(false)}>Exportar Lista</Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>

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

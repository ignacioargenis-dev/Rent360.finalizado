'use client';

import React, { useState, useEffect } from 'react';

// Forzar renderizado dinámico para datos actualizados constantemente
export const dynamic = 'force-dynamic';
export const revalidate = 60; // Revalidar cada minuto para propiedades actualizadas
import { logger } from '@/lib/logger-minimal';
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
import UnifiedDashboardLayout from '@/components/layout/UnifiedDashboardLayout';
import { useRouter } from 'next/navigation';
import {
  Eye,
  Edit,
  DollarSign,
  Users,
  TrendingUp,
  Home,
  MapPin,
  Calendar,
  Plus,
  Search,
  Filter,
  Download,
  Trash2,
  AlertTriangle,
  RefreshCw,
} from 'lucide-react';
import Link from 'next/link';
import { User } from '@/types';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';

interface Property {
  id: string;
  title: string;
  address: string;
  city: string;
  price: number;
  rent: number;
  bedrooms: number;
  bathrooms: number;
  area: number;
  status: 'AVAILABLE' | 'RENTED' | 'MAINTENANCE' | 'VACANT';
  type: 'APARTMENT' | 'HOUSE' | 'STUDIO' | 'OFFICE';
  createdAt: string;
  updatedAt: string;
  images: string[];
  views: number;
  inquiries: number;
  currentTenant?: {
    name: string;
    email: string;
    leaseStart: string;
    leaseEnd: string;
  };
}

interface PropertyStats {
  totalProperties: number;
  rentedProperties: number;
  vacantProperties: number;
  totalRentIncome: number;
  occupancyRate: number;
  averageRentPrice: number;
}

export default function OwnerPropertiesPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [properties, setProperties] = useState<Property[]>([]);
  const [filteredProperties, setFilteredProperties] = useState<Property[]>([]);
  const [stats, setStats] = useState<PropertyStats>({
    totalProperties: 0,
    rentedProperties: 0,
    vacantProperties: 0,
    totalRentIncome: 0,
    occupancyRate: 0,
    averageRentPrice: 0,
  });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [showExportDialog, setShowExportDialog] = useState(false);
  const [exportOptions, setExportOptions] = useState({
    format: 'csv', // 'csv', 'json'
    status: 'all', // filtro por estado
  });
  const [justDeletedProperty, setJustDeletedProperty] = useState(false);
  const [deletingPropertyId, setDeletingPropertyId] = useState<string | null>(null);
  const [deleteConfirmProperty, setDeleteConfirmProperty] = useState<Property | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Función para refrescar manualmente
  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    try {
      await loadPropertiesData(true); // Forzar refresh
      alert('✅ Datos actualizados exitosamente.');
    } catch (error) {
      logger.error('Error refreshing data:', error);
      alert('❌ Error al actualizar los datos.');
    } finally {
      setIsRefreshing(false);
    }
  };

  // Polling automático para mantener los datos actualizados
  useEffect(() => {
    const interval = setInterval(async () => {
      // Solo hacer polling si la pestaña está visible y no hay operaciones activas
      if (!document.hidden && !isRefreshing && !loading) {
        try {
          await loadPropertiesData();
        } catch (error) {
          logger.error('Error en polling automático:', error);
        }
      }
    }, 30000); // Actualizar cada 30 segundos

    return () => clearInterval(interval);
  }, [isRefreshing, loading]);

  // Detectar si se regresa de eliminar una propiedad
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const refresh = urlParams.get('refresh');
    const deleted = urlParams.get('deleted');

    if (refresh === 'true' && deleted === 'true') {
      setJustDeletedProperty(true);
      // Limpiar la URL
      window.history.replaceState({}, document.title, window.location.pathname);
      // Recargar datos inmediatamente
      loadPropertiesData();
    }
  }, []);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);

        // Verificar si hay parámetro de refresh en la URL
        const urlParams = new URLSearchParams(window.location.search);
        const shouldRefresh = urlParams.has('refresh');

        // Load user data
        const userResponse = await fetch(
          `${typeof window !== 'undefined' ? '' : process.env.NEXT_PUBLIC_API_URL || ''}/api/auth/me`,
          {
            headers: { Accept: 'application/json' },
          }
        );
        if (userResponse.ok) {
          const data = await userResponse.json();
          setUser(data.user);
        }

        // Load properties data - forzar refresh si viene del parámetro
        await loadPropertiesData(shouldRefresh);

        // Si había parámetro de refresh, mostrar mensaje y limpiarlo de la URL
        if (shouldRefresh) {
          alert(
            '✅ Propiedad creada exitosamente. Los datos se mantienen actualizados automáticamente.'
          );

          const url = new URL(window.location.href);
          url.searchParams.delete('refresh');
          url.searchParams.delete('deleted');
          window.history.replaceState({}, '', url.toString());
        }
      } catch (error) {
        logger.error('Error loading data:', {
          error: error instanceof Error ? error.message : String(error),
        });
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  // Re-cargar datos cuando la ventana obtiene foco (usuario regresa a la página)
  useEffect(() => {
    const handleFocus = () => {
      loadPropertiesData();
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, []);

  useEffect(() => {
    // Filter properties based on search and filters
    let filtered = properties;

    if (searchTerm) {
      filtered = filtered.filter(
        property =>
          property.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          property.address.toLowerCase().includes(searchTerm.toLowerCase()) ||
          property.city.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(property => property.status === statusFilter);
    }

    if (typeFilter !== 'all') {
      filtered = filtered.filter(property => property.type === typeFilter);
    }

    setFilteredProperties(filtered);
  }, [properties, searchTerm, statusFilter, typeFilter]);

  const handleDeleteClick = (property: Property) => {
    setDeleteConfirmProperty(property);
  };

  const handleConfirmDelete = async () => {
    if (!deleteConfirmProperty) {
      return;
    }

    const propertyId = deleteConfirmProperty.id;
    const propertyTitle = deleteConfirmProperty.title;
    const propertyToDelete = deleteConfirmProperty;

    // Cerrar modal
    setDeleteConfirmProperty(null);

    // Eliminar optimísticamente del estado local
    setProperties(prev => prev.filter(p => p.id !== propertyId));
    setDeletingPropertyId(propertyId);

    try {
      const response = await fetch(`/api/properties/${propertyId}`, {
        method: 'DELETE',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        logger.info('Property deleted successfully', { propertyId });
        // Mostrar mensaje de éxito
        alert(`✅ Propiedad "${propertyTitle}" eliminada exitosamente.`);

        // Recargar datos para asegurar consistencia
        await loadPropertiesData();
      } else {
        // Si hay error, restaurar la propiedad
        setProperties(prev =>
          [...prev, propertyToDelete].sort(
            (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          )
        );

        const errorData = await response.json().catch(() => ({}));
        logger.error('Error deleting property', {
          propertyId,
          error: errorData.error || 'Error desconocido',
        });
        alert(`❌ Error al eliminar la propiedad: ${errorData.error || 'Error desconocido'}`);
      }
    } catch (error) {
      // Restaurar la propiedad en caso de error de red
      setProperties(prev =>
        [...prev, propertyToDelete].sort(
          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        )
      );

      logger.error('Error deleting property', { error, propertyId });
      alert('❌ Error de conexión al eliminar la propiedad');
    } finally {
      setDeletingPropertyId(null);
    }
  };

  const loadPropertiesData = async (forceRefresh = false) => {
    try {
      // Cargar propiedades reales desde la API
      // Agregar timestamp para evitar cache y forzar refresh
      const timestamp = Date.now();
      const cacheBuster = forceRefresh ? `&_force=${Math.random()}` : '';
      const response = await fetch(
        `${typeof window !== 'undefined' ? '' : process.env.NEXT_PUBLIC_API_URL || ''}/api/properties/list?limit=100&_t=${timestamp}${cacheBuster}`,
        {
          credentials: 'include',
          headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            Pragma: 'no-cache',
            Expires: '0',
            Accept: 'application/json',
          },
          cache: 'no-store',
        }
      );

      if (response.ok) {
        const data = await response.json();
        const realProperties: Property[] = data.properties.map((prop: any) => ({
          id: prop.id,
          title: prop.title,
          address: prop.address,
          city: prop.city,
          price: prop.price,
          rent: prop.price, // Usar price como rent por ahora, ajustar según necesidad
          bedrooms: prop.bedrooms,
          bathrooms: prop.bathrooms,
          area: prop.area,
          status: prop.status,
          type: prop.type,
          createdAt: prop.createdAt,
          updatedAt: prop.updatedAt,
          images: prop.images || [],
          views: prop.views || 0,
          inquiries: prop.inquiries || 0,
          currentTenant: prop.currentTenant
            ? {
                name: prop.currentTenant.name,
                email: prop.currentTenant.email,
                leaseStart: prop.currentTenant.leaseStart || '2024-01-01',
                leaseEnd: prop.currentTenant.leaseEnd || '2024-12-31',
              }
            : undefined,
        }));

        setProperties(realProperties);

        // Calculate stats
        const rentedProperties = realProperties.filter(p => p.status === 'RENTED');
        const vacantProperties = realProperties.filter(
          p => p.status === 'VACANT' || p.status === 'AVAILABLE'
        );
        const totalRentIncome = rentedProperties.reduce((sum, prop) => sum + prop.rent, 0);
        const occupancyRate =
          realProperties.length > 0 ? (rentedProperties.length / realProperties.length) * 100 : 0;
        const averageRentPrice =
          rentedProperties.length > 0 ? totalRentIncome / rentedProperties.length : 0;

        const propertyStats: PropertyStats = {
          totalProperties: realProperties.length,
          rentedProperties: rentedProperties.length,
          vacantProperties: vacantProperties.length,
          totalRentIncome,
          occupancyRate,
          averageRentPrice,
        };

        setStats(propertyStats);
      } else {
        logger.warn('Failed to load properties from API, falling back to empty state');
        // Si falla la API, mostrar estado vacío en lugar de datos mock
        setProperties([]);
        setStats({
          totalProperties: 0,
          rentedProperties: 0,
          vacantProperties: 0,
          totalRentIncome: 0,
          occupancyRate: 0,
          averageRentPrice: 0,
        });
      }
    } catch (error) {
      logger.error('Error loading properties data:', {
        error: error instanceof Error ? error.message : String(error),
      });
      // En caso de error, mostrar estado vacío
      setProperties([]);
      setStats({
        totalProperties: 0,
        rentedProperties: 0,
        vacantProperties: 0,
        totalRentIncome: 0,
        occupancyRate: 0,
        averageRentPrice: 0,
      });
    }
  };

  const handleViewProperty = (propertyId: string) => {
    router.push(`/owner/properties/${propertyId}`);
  };

  const handleEditProperty = (propertyId: string) => {
    router.push(`/owner/properties/${propertyId}/edit`);
  };

  const handleContactTenant = (tenantEmail: string) => {
    window.open(`mailto:${tenantEmail}`, '_blank');
  };

  const handleExportProperties = () => {
    logger.info('Abriendo opciones de exportación de propiedades');
    setShowExportDialog(true);
  };

  const handleConfirmExport = async () => {
    try {
      logger.info('Exportando propiedades del propietario', exportOptions);

      // Construir URL con parámetros
      const params = new URLSearchParams();
      params.append('format', exportOptions.format);
      if (exportOptions.status !== 'all') {
        params.append('status', exportOptions.status);
      }

      // Crear URL de descarga
      const exportUrl = `/api/owner/properties/export?${params.toString()}`;

      // Crear enlace temporal para descarga
      const link = document.createElement('a');
      link.href = exportUrl;
      link.download = `propiedades_${new Date().toISOString().split('T')[0]}.${exportOptions.format}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      setShowExportDialog(false);

      // Resetear opciones de exportación
      setExportOptions({
        format: 'csv',
        status: 'all',
      });

      logger.info('Exportación de propiedades completada exitosamente');
    } catch (error) {
      logger.error('Error exportando propiedades:', {
        error: error instanceof Error ? error.message : String(error),
      });
      alert('Error al exportar las propiedades. Por favor, intenta nuevamente.');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'RENTED':
        return 'bg-green-100 text-green-800';
      case 'AVAILABLE':
        return 'bg-blue-100 text-blue-800';
      case 'VACANT':
        return 'bg-yellow-100 text-yellow-800';
      case 'MAINTENANCE':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'RENTED':
        return 'Arrendada';
      case 'AVAILABLE':
        return 'Disponible';
      case 'VACANT':
        return 'Vacante';
      case 'MAINTENANCE':
        return 'En Mantenimiento';
      default:
        return status;
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'APARTMENT':
        return <Home className="w-5 h-5" />;
      case 'HOUSE':
        return <Home className="w-5 h-5" />;
      case 'STUDIO':
        return <Home className="w-5 h-5" />;
      case 'OFFICE':
        return <Home className="w-5 h-5" />;
      default:
        return <Home className="w-5 h-5" />;
    }
  };

  const getTypeText = (type: string) => {
    switch (type) {
      case 'APARTMENT':
        return 'Departamento';
      case 'HOUSE':
        return 'Casa';
      case 'STUDIO':
        return 'Estudio';
      case 'OFFICE':
        return 'Oficina';
      default:
        return type;
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando propiedades...</p>
        </div>
      </div>
    );
  }

  return (
    <UnifiedDashboardLayout title="Mis Propiedades" subtitle="Gestiona tu cartera de propiedades">
      <div className="container mx-auto px-4 py-6">
        {/* Header with actions */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-6 gap-4">
          <div>
            <p className="text-sm text-gray-500 mt-1">
              💡 Las nuevas propiedades aparecen automáticamente cada 30 segundos
            </p>
          </div>
          <div className="flex gap-2">
            <Link href="/owner/properties/new">
              <Button size="sm">
                <Plus className="w-4 h-4 mr-2" />
                Nueva Propiedad
              </Button>
            </Link>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Propiedades</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.totalProperties}</p>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Home className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Propiedades Arrendadas</p>
                  <p className="text-2xl font-bold text-green-900">{stats.rentedProperties}</p>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <Users className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Ingresos Mensuales</p>
                  <p className="text-2xl font-bold text-purple-900">
                    {formatCurrency(stats.totalRentIncome)}
                  </p>
                </div>
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                  <DollarSign className="w-6 h-6 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Tasa de Ocupación</p>
                  <p className="text-2xl font-bold text-orange-900">
                    {stats.occupancyRate.toFixed(1)}%
                  </p>
                </div>
                <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-orange-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Buscar por título, dirección o ciudad..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Estado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los estados</SelectItem>
                  <SelectItem value="RENTED">Arrendada</SelectItem>
                  <SelectItem value="AVAILABLE">Disponible</SelectItem>
                  <SelectItem value="VACANT">Vacante</SelectItem>
                  <SelectItem value="MAINTENANCE">En Mantenimiento</SelectItem>
                </SelectContent>
              </Select>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los tipos</SelectItem>
                  <SelectItem value="APARTMENT">Departamento</SelectItem>
                  <SelectItem value="HOUSE">Casa</SelectItem>
                  <SelectItem value="STUDIO">Estudio</SelectItem>
                  <SelectItem value="OFFICE">Oficina</SelectItem>
                </SelectContent>
              </Select>
              <Button onClick={handleExportProperties} variant="outline" size="sm">
                <Download className="w-4 h-4 mr-2" />
                Exportar Datos
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Properties Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProperties.map(property => (
            <Card key={property.id} className="hover:shadow-lg transition-shadow">
              <CardContent className="p-0">
                {/* Property Image */}
                <div className="relative h-48 bg-gray-200 rounded-t-lg overflow-hidden">
                  {property.images.length > 0 ? (
                    <img
                      src={property.images[0]}
                      alt={property.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Home className="w-12 h-12 text-gray-400" />
                    </div>
                  )}
                  <div className="absolute top-2 right-2">
                    <Badge className={getStatusColor(property.status)}>
                      {getStatusText(property.status)}
                    </Badge>
                  </div>
                </div>

                {/* Property Info */}
                <div className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-semibold text-lg text-gray-900 line-clamp-2">
                      {property.title}
                    </h3>
                    {getTypeIcon(property.type)}
                  </div>

                  <div className="flex items-center gap-1 text-gray-600 mb-2">
                    <MapPin className="w-4 h-4" />
                    <span className="text-sm">{property.address}</span>
                  </div>

                  <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
                    <span>{property.bedrooms} hab</span>
                    <span>{property.bathrooms} baños</span>
                    <span>{property.area}m²</span>
                  </div>

                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <p className="text-2xl font-bold text-gray-900">
                        {formatCurrency(property.rent)}
                      </p>
                      <p className="text-sm text-gray-600">por mes</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-600">Valor propiedad</p>
                      <p className="text-lg font-semibold text-gray-900">
                        {formatCurrency(property.price)}
                      </p>
                    </div>
                  </div>

                  {/* Tenant Info */}
                  {property.currentTenant && (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-green-900">
                            Inquilino: {property.currentTenant.name}
                          </p>
                          <p className="text-xs text-green-700">
                            Contrato: {property.currentTenant.leaseStart} -{' '}
                            {property.currentTenant.leaseEnd}
                          </p>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleContactTenant(property.currentTenant!.email)}
                        >
                          <Users className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* Stats */}
                  <div className="flex items-center justify-between text-sm text-gray-600 mb-4">
                    <div className="flex items-center gap-1">
                      <Eye className="w-4 h-4" />
                      <span>{property.views} vistas</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Users className="w-4 h-4" />
                      <span>{property.inquiries} consultas</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => handleViewProperty(property.id)}
                    >
                      <Eye className="w-4 h-4 mr-1" />
                      Ver
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => handleEditProperty(property.id)}
                    >
                      <Edit className="w-4 h-4 mr-1" />
                      Editar
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 bg-red-50 border-red-200 text-red-700 hover:bg-red-100 hover:border-red-300"
                      onClick={() => handleDeleteClick(property)}
                      disabled={deletingPropertyId === property.id}
                    >
                      <Trash2 className="w-4 h-4 mr-1" />
                      {deletingPropertyId === property.id ? 'Eliminando...' : 'Eliminar'}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredProperties.length === 0 && (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-12">
                <Home className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  No se encontraron propiedades
                </h3>
                <p className="text-gray-600 mb-4">
                  {searchTerm || statusFilter !== 'all' || typeFilter !== 'all'
                    ? 'Intenta ajustar los filtros de búsqueda'
                    : 'Aún no tienes propiedades registradas'}
                </p>
                {!searchTerm && statusFilter === 'all' && typeFilter === 'all' && (
                  <Link href="/owner/properties/new">
                    <Button>
                      <Plus className="w-4 h-4 mr-2" />
                      Agregar Primera Propiedad
                    </Button>
                  </Link>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Modal de exportación */}
        <Dialog open={showExportDialog} onOpenChange={setShowExportDialog}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Exportar Propiedades</DialogTitle>
              <DialogDescription>
                Selecciona el formato y filtra las propiedades que deseas exportar.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div>
                <Label htmlFor="export-format">Formato de Archivo</Label>
                <Select
                  value={exportOptions.format}
                  onValueChange={value => setExportOptions(prev => ({ ...prev, format: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar formato" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="csv">CSV (Excel)</SelectItem>
                    <SelectItem value="json">JSON</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="export-status">Filtrar por Estado</Label>
                <Select
                  value={exportOptions.status}
                  onValueChange={value => setExportOptions(prev => ({ ...prev, status: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar estado" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas las propiedades</SelectItem>
                    <SelectItem value="RENTED">Arrendadas</SelectItem>
                    <SelectItem value="AVAILABLE">Disponibles</SelectItem>
                    <SelectItem value="VACANT">Vacantes</SelectItem>
                    <SelectItem value="MAINTENANCE">En Mantenimiento</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="bg-blue-50 p-3 rounded-lg">
                <p className="text-sm text-blue-800">
                  <strong>Nota:</strong> Se exportarán {filteredProperties.length} propiedades
                  {exportOptions.format === 'csv'
                    ? ' en formato CSV compatible con Excel'
                    : ' en formato JSON'}
                  {exportOptions.status !== 'all' &&
                    ` filtradas por estado "${exportOptions.status}"`}
                  .
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Button
                variant="outline"
                onClick={() => {
                  setShowExportDialog(false);
                  setExportOptions({
                    format: 'csv',
                    status: 'all',
                  });
                }}
              >
                Cancelar
              </Button>
              <Button onClick={handleConfirmExport}>
                <Download className="w-4 h-4 mr-2" />
                Exportar Propiedades
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Modal de confirmación de eliminación */}
        <Dialog open={!!deleteConfirmProperty} onOpenChange={() => setDeleteConfirmProperty(null)}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-3">
                <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                  <AlertTriangle className="w-5 h-5 text-red-600" />
                </div>
                Eliminar Propiedad
              </DialogTitle>
              <DialogDescription>
                Esta acción no se puede deshacer. Se eliminarán todos los archivos, imágenes,
                documentos y datos asociados.
              </DialogDescription>
            </DialogHeader>

            <div className="mb-6">
              <p className="text-gray-700 mb-2">
                ¿Estás seguro de que quieres eliminar la propiedad:
              </p>
              <p className="font-semibold text-gray-900">{deleteConfirmProperty?.title}</p>
            </div>

            <div className="flex gap-3 justify-end">
              <Button
                variant="outline"
                onClick={() => setDeleteConfirmProperty(null)}
                disabled={deletingPropertyId !== null}
              >
                Cancelar
              </Button>
              <Button
                variant="destructive"
                onClick={handleConfirmDelete}
                disabled={deletingPropertyId !== null}
                className="bg-red-600 hover:bg-red-700"
              >
                {deletingPropertyId ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Eliminando...
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4 mr-2" />
                    Eliminar
                  </>
                )}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </UnifiedDashboardLayout>
  );
}

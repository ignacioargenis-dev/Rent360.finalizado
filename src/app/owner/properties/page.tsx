'use client';

import { logger } from '@/lib/logger-edge';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Eye,
  Star,
  Plus,
  Search,
  Square,
  Building,
  Home,
  Store,
  Bed,
  Bath,
  DollarSign,
  TrendingUp,
  MapPin,
  Edit,
  Trash2 } from 'lucide-react';
import Link from 'next/link';
import { User, Property } from '@/types';
import EnhancedDashboardLayout from '@/components/dashboard/EnhancedDashboardLayout';

interface PropertyStats {
  totalProperties: number;
  availableProperties: number;
  rentedProperties: number;
  maintenanceProperties: number;
  totalMonthlyRevenue: number;
  totalRevenue: number;
  averageOccupancy: number;
  topPerformingProperty: string;
  propertiesNeedingAttention: number;
}

export default function OwnerProperties() {
  const [user, setUser] = useState<User | null>(null);
  const [properties, setProperties] = useState<Property[]>([]);
  const [stats, setStats] = useState<PropertyStats>({
    totalProperties: 0,
    availableProperties: 0,
    rentedProperties: 0,
    maintenanceProperties: 0,
    totalMonthlyRevenue: 0,
    totalRevenue: 0,
    averageOccupancy: 0,
    topPerformingProperty: '',
    propertiesNeedingAttention: 0,
  });
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const loadUserData = async () => {
      try {
        const response = await fetch('/api/auth/me');
        if (response.ok) {
          const data = await response.json();
          setUser(data.user);
        }
      } catch (error) {
        logger.error('Error loading user data:', { error: error instanceof Error ? error.message : String(error) });
      }
    };

    const loadProperties = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/properties/list?limit=50');
        
        if (response.ok) {
          const data = await response.json();
          setProperties(data.properties);
          setStats({
            totalProperties: data.stats.totalProperties,
            availableProperties: data.properties.filter((p: any) => p.status === 'AVAILABLE').length,
            rentedProperties: data.properties.filter((p: any) => p.status === 'RENTED').length,
            maintenanceProperties: data.properties.filter((p: any) => p.status === 'MAINTENANCE').length,
            totalMonthlyRevenue: data.properties.reduce((acc: number, p: any) => acc + (p.currentTenant ? p.price : 0), 0),
            totalRevenue: data.properties.reduce((acc: number, p: any) => acc + (p.totalRevenue || 0), 0),
            averageOccupancy: data.stats.averageOccupancy || 0,
            topPerformingProperty: data.stats.topPerformingProperty || '',
            propertiesNeedingAttention: data.stats.propertiesNeedingAttention || 0,
          });
        } else {
          logger.error('Error loading properties');
          // Use mock data as fallback
          loadMockData();
        }
      } catch (error) {
        logger.error('Error loading properties:', { error: error instanceof Error ? error.message : String(error) });
        // Use mock data as fallback
        loadMockData();
      } finally {
        setLoading(false);
      }
    };

    const loadMockData = () => {
      const mockProperties = [
        {
          id: '1',
          title: 'Departamento Providencia',
          description: 'Moderno departamento en el corazón de Providencia',
          type: 'APARTMENT',
          address: 'Av. Providencia 1234',
          city: 'Santiago',
          commune: 'Providencia',
          region: 'Metropolitana',
          price: 800000,
          deposit: 800000,
          bedrooms: 2,
          bathrooms: 2,
          area: 85,
          status: 'AVAILABLE',
          images: ['/placeholder1.jpg', '/placeholder2.jpg'],
          features: ['Estacionamiento', 'Seguridad 24h', 'Gimnasio', 'Piscina'],
          ownerId: 'user1',
          createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 30).toISOString(),
          updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5).toISOString(),
        },
        {
          id: '2',
          title: 'Casa Las Condes',
          description: 'Espaciosa casa familiar en Las Condes',
          type: 'HOUSE',
          address: 'Calle El Alba 567',
          city: 'Santiago',
          commune: 'Las Condes',
          region: 'Metropolitana',
          price: 1200000,
          deposit: 1200000,
          bedrooms: 4,
          bathrooms: 3,
          area: 180,
          status: 'RENTED',
          images: ['/placeholder3.jpg', '/placeholder4.jpg'],
          features: ['Jardín', 'Terraza', 'Estacionamiento', 'Seguridad'],
          ownerId: 'user1',
          createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 400).toISOString(),
          updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 10).toISOString(),
        },
      ];

      setProperties(mockProperties as any);
      setStats({
        totalProperties: mockProperties.length,
        availableProperties: mockProperties.filter(p => p.status === 'AVAILABLE').length,
        rentedProperties: mockProperties.filter(p => p.status === 'RENTED').length,
        maintenanceProperties: mockProperties.filter(p => p.status === 'MAINTENANCE').length,
        totalMonthlyRevenue: mockProperties.reduce((sum, p) => sum + (p.status === 'RENTED' ? p.price : 0), 0),
        totalRevenue: mockProperties.reduce((sum, p) => sum + (p.status === 'RENTED' ? p.price * 12 : 0), 0),
        averageOccupancy: 50,
        topPerformingProperty: 'Casa Las Condes',
        propertiesNeedingAttention: 1,
      });
    };

    loadUserData();
    loadProperties();
  }, []);

  const updatePropertyStatus = async (propertyId: string, newStatus: string) => {
    setProperties(prev => prev.map(property => 
      property.id === propertyId 
        ? { ...property, status: newStatus as Property['status'] }
        : property,
    ));
  };

  const deleteProperty = async (propertyId: string) => {
    setProperties(prev => prev.filter(property => property.id !== propertyId));
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'APARTMENT':
        return <Building className="w-5 h-5" />;
      case 'HOUSE':
        return <Home className="w-5 h-5" />;
      case 'STUDIO':
        return <Building className="w-5 h-5" />;
      case 'COMMERCIAL':
        return <Store className="w-5 h-5" />;
      default:
        return <Building className="w-5 h-5" />;
    }
  };

  const getTypeName = (type: string) => {
    switch (type) {
      case 'APARTMENT':
        return 'Departamento';
      case 'HOUSE':
        return 'Casa';
      case 'STUDIO':
        return 'Studio';
      case 'COMMERCIAL':
        return 'Comercial';
      default:
        return 'Otro';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'AVAILABLE':
        return 'text-green-600 bg-green-50 border-green-200';
      case 'RENTED':
        return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'MAINTENANCE':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'PENDING':
        return 'text-orange-600 bg-orange-50 border-orange-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'AVAILABLE':
        return <Badge className="bg-green-100 text-green-800">Disponible</Badge>;
      case 'RENTED':
        return <Badge className="bg-blue-100 text-blue-800">Arrendado</Badge>;
      case 'MAINTENANCE':
        return <Badge className="bg-yellow-100 text-yellow-800">Mantenimiento</Badge>;
      case 'PENDING':
        return <Badge className="bg-orange-100 text-orange-800">Pendiente</Badge>;
      default:
        return <Badge>Desconocido</Badge>;
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
  };

  const filteredProperties = properties.filter(property => {
    const matchesSearch = property.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         property.address.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filter === 'all' || property.status.toLowerCase() === filter;
    return matchesSearch && matchesFilter;
  });

  if (loading) {
    return (
      <EnhancedDashboardLayout user={user} title="Mis Propiedades" subtitle="Gestiona tu cartera de propiedades">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Cargando propiedades...</p>
          </div>
        </div>
      </EnhancedDashboardLayout>
    );
  }

  return (
    <EnhancedDashboardLayout user={user} title="Mis Propiedades" subtitle="Gestiona tu cartera de propiedades">
      <div className="space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Propiedades</CardTitle>
              <Building className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalProperties}</div>
              <p className="text-xs text-muted-foreground">
                {stats.availableProperties} disponibles
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Ingresos Mensuales</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatPrice(stats.totalMonthlyRevenue)}</div>
              <p className="text-xs text-muted-foreground">
                {stats.rentedProperties} propiedades arrendadas
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Ocupación Promedio</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.averageOccupancy}%</div>
              <p className="text-xs text-muted-foreground">
                {stats.propertiesNeedingAttention} necesitan atención
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Mejor Rendimiento</CardTitle>
              <Star className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-sm font-medium">{stats.topPerformingProperty}</div>
              <p className="text-xs text-muted-foreground">
                Propiedad con mayor ingreso
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Filters and Search */}
        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="Buscar propiedades..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <Select value={filter} onValueChange={setFilter}>
                <SelectTrigger className="w-full sm:w-[180px]">
                  <SelectValue placeholder="Filtrar por estado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="available">Disponibles</SelectItem>
                  <SelectItem value="rented">Arrendadas</SelectItem>
                  <SelectItem value="maintenance">Mantenimiento</SelectItem>
                  <SelectItem value="pending">Pendientes</SelectItem>
                </SelectContent>
              </Select>
              <Button asChild>
                <Link href="/owner/properties/new">
                  <Plus className="h-4 w-4 mr-2" />
                  Nueva Propiedad
                </Link>
              </Button>
            </div>
          </CardHeader>
        </Card>

        {/* Properties Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProperties.map((property) => (
            <Card key={property.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-2">
                    {getTypeIcon(property.type)}
                    <div>
                      <CardTitle className="text-lg">{property.title}</CardTitle>
                      <CardDescription className="text-sm">
                        {getTypeName(property.type)} • {property.commune}
                      </CardDescription>
                    </div>
                  </div>
                  {getStatusBadge(property.status)}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-2 text-sm text-gray-600">
                  <MapPin className="h-4 w-4" />
                  <span>{property.address}</span>
                </div>
                
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-1">
                      <Bed className="h-4 w-4" />
                      <span>{property.bedrooms}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Bath className="h-4 w-4" />
                      <span>{property.bathrooms}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Square className="h-4 w-4" />
                      <span>{property.area}m²</span>
                    </div>
                  </div>
                  <div className="text-lg font-semibold text-green-600">
                    {formatPrice(property.price)}
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex space-x-2">
                    <Button variant="outline" size="sm" asChild>
                      <Link href={`/owner/properties/${property.id}`}>
                        <Eye className="h-4 w-4 mr-1" />
                        Ver
                      </Link>
                    </Button>
                    <Button variant="outline" size="sm" asChild>
                      <Link href={`/owner/properties/${property.id}/edit`}>
                        <Edit className="h-4 w-4 mr-1" />
                        Editar
                      </Link>
                    </Button>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => deleteProperty(property.id)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredProperties.length === 0 && (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Building className="h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No se encontraron propiedades</h3>
              <p className="text-gray-600 text-center mb-4">
                {searchTerm || filter !== 'all' 
                  ? 'Intenta ajustar los filtros de búsqueda'
                  : 'Comienza agregando tu primera propiedad'
                }
              </p>
              <Button asChild>
                <Link href="/owner/properties/new">
                  <Plus className="h-4 w-4 mr-2" />
                  Agregar Propiedad
                </Link>
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </EnhancedDashboardLayout>
  );
}

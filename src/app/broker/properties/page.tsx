'use client';

import { logger } from '@/lib/logger';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Building, 
  Plus, 
  Search, 
  Filter, 
  MapPin, 
  DollarSign,
  Users, 
  Eye, 
  Edit,
  Trash2,
  Star,
  Calendar,
  Image,
  Home,
  Briefcase,
  Store,
  Wifi,
  Car,
  Bath,
  Bed,
  Square,
  TrendingUp,
  Activity,
  CheckCircle,
  Clock,
  Download, 
  Info
} from 'lucide-react';
import Link from 'next/link';
import { User, Property } from '@/types';
import EnhancedDashboardLayout from '@/components/dashboard/EnhancedDashboardLayout';


interface PropertyStats {
  totalProperties: number;
  availableProperties: number;
  rentedProperties: number;
  averagePrice: number;
  mostPopularType: string;
  featuredProperties: number;
}

// Extended interface for mock data that includes owner information
interface PropertyWithOwner extends Property {
  ownerName: string;
  ownerEmail: string;
  ownerPhone: string;
}

export default function BrokerProperties() {

  const [user, setUser] = useState<User | null>(null);

  const [properties, setProperties] = useState<PropertyWithOwner[]>([]);

  const [stats, setStats] = useState<PropertyStats>({
    totalProperties: 0,
    availableProperties: 0,
    rentedProperties: 0,
    averagePrice: 0,
    mostPopularType: '',
    featuredProperties: 0,
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
        // Mock properties data
        const mockProperties: PropertyWithOwner[] = [
          {
            id: '1',
            title: 'Departamento Amoblado Centro',
            description: 'Hermoso departamento amoblado en el corazón de Santiago, cerca de todo',
            address: 'Av. Providencia 1234',
            city: 'Santiago',
            commune: 'Providencia',
            region: 'Metropolitana',
            price: 450000,
            deposit: 450000,
            bedrooms: 2,
            bathrooms: 1,
            area: 65,
            status: 'available',
            type: 'apartment',
            features: '["Amoblado", "Estacionamiento", "Gimnasio", "Piscina"]',
            images: '["/placeholder1.jpg", "/placeholder2.jpg"]',
            views: 145,
            inquiries: 23,
            ownerId: 'owner-1',
            ownerName: 'Juan Pérez',
            ownerEmail: 'juan.perez@email.com',
            ownerPhone: '+56912345678',
            createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 15),
            updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2),
          },
          {
            id: '2',
            title: 'Casa Las Condes',
            description: 'Espaciosa casa familiar en Las Condes con jardín y terraza',
            address: 'Calle El Alba 567',
            city: 'Santiago',
            commune: 'Las Condes',
            region: 'Metropolitana',
            price: 1200000,
            deposit: 1200000,
            bedrooms: 4,
            bathrooms: 3,
            area: 180,
            status: 'rented',
            type: 'house',
            features: '["Jardín", "Terraza", "Estacionamiento 2 autos", "Seguridad 24h"]',
            images: '["/placeholder3.jpg", "/placeholder4.jpg"]',
            views: 89,
            inquiries: 12,
            ownerId: 'owner-2',
            ownerName: 'María González',
            ownerEmail: 'maria.gonzalez@email.com',
            ownerPhone: '+56987654321',
            createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 30),
            updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 10),
          },
          {
            id: '3',
            title: 'Oficina Vitacura',
            description: 'Moderna oficina en Vitacura con excelente ubicación',
            address: 'Av. Kennedy 4567',
            city: 'Santiago',
            commune: 'Vitacura',
            region: 'Metropolitana',
            price: 800000,
            deposit: 800000,
            bedrooms: 0,
            bathrooms: 2,
            area: 120,
            status: 'available',
            type: 'office',
            features: '["Aire acondicionado", "Estacionamiento", "Recepción", "Seguridad"]',
            images: '["/placeholder5.jpg", "/placeholder6.jpg"]',
            views: 67,
            inquiries: 8,
            ownerId: 'owner-3',
            ownerName: 'Carlos Rodríguez',
            ownerEmail: 'carlos.rodriguez@email.com',
            ownerPhone: '+56911223344',
            createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 20),
            updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5),
          },
          {
            id: '4',
            title: 'Local Comercial',
            description: 'Local comercial en zona de alto tráfico',
            address: 'Av. Apoquindo 6789',
            city: 'Santiago',
            commune: 'Las Condes',
            region: 'Metropolitana',
            price: 1500000,
            deposit: 1500000,
            bedrooms: 0,
            bathrooms: 1,
            area: 200,
            status: 'available',
            type: 'commercial',
            features: '["Vidrio frontal", "Alarma", "Estacionamiento clientes", "Zona de carga"]',
            images: '["/placeholder7.jpg", "/placeholder8.jpg"]',
            views: 234,
            inquiries: 45,
            ownerId: 'owner-4',
            ownerName: 'Ana López',
            ownerEmail: 'ana.lopez@email.com',
            ownerPhone: '+56955667788',
            createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 25),
            updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3),
          },
          {
            id: '5',
            title: 'Departamento Playa',
            description: 'Departamento con vista al mar en Viña del Mar',
            address: 'Av. Costanera 890',
            city: 'Viña del Mar',
            commune: 'Reñaca',
            region: 'Valparaíso',
            price: 600000,
            deposit: 600000,
            bedrooms: 3,
            bathrooms: 2,
            area: 95,
            status: 'maintenance',
            type: 'apartment',
            features: '["Vista al mar", "Balcón", "Piscina edificio", "Gimnasio"]',
            images: '["/placeholder9.jpg", "/placeholder10.jpg"]',
            views: 178,
            inquiries: 31,
            ownerId: 'owner-5',
            ownerName: 'Pedro Sánchez',
            ownerEmail: 'pedro.sanchez@email.com',
            ownerPhone: '+56999887766',
            createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 40),
            updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 1),
          },
          {
            id: '6',
            title: 'Casa Familiar La Reina',
            description: 'Acogedora casa familiar en La Reina',
            address: 'Calle Los Leones 345',
            city: 'Santiago',
            commune: 'La Reina',
            region: 'Metropolitana',
            price: 900000,
            deposit: 900000,
            bedrooms: 3,
            bathrooms: 2,
            area: 150,
            status: 'available',
            type: 'house',
            features: '["Patio", "Estacionamiento", "Calefacción", "Bodega"]',
            images: '["/placeholder11.jpg", "/placeholder12.jpg"]',
            views: 92,
            inquiries: 15,
            ownerId: 'owner-6',
            ownerName: 'Laura Martínez',
            ownerEmail: 'laura.martinez@email.com',
            ownerPhone: '+56933445566',
            createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 35),
            updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7),
          },
        ];

        setProperties(mockProperties);

        // Calculate stats
        const totalProperties = mockProperties.length;
        const availableProperties = mockProperties.filter(p => p.status === 'available').length;
        const rentedProperties = mockProperties.filter(p => p.status === 'rented').length;
        const averagePrice = mockProperties.reduce((sum, p) => sum + p.price, 0) / totalProperties;
        
        // Find most popular type
        const typeCount = mockProperties.reduce((acc, p) => {
          acc[p.type] = (acc[p.type] || 0) + 1;
          return acc;
        }, {} as Record<string, number>);
        
        const sortedTypes = Object.entries(typeCount)
          .sort(([,a], [,b]) => b - a);
        const mostPopularType = sortedTypes.length > 0 && sortedTypes?.[0] ? sortedTypes[0][0] || 'Sin tipo' : 'Sin tipo';
        
        const featuredProperties = mockProperties.filter(p => p.type === 'apartment').length; // Count apartments as featured for demo

        const propertyStats: PropertyStats = {
          totalProperties,
          availableProperties,
          rentedProperties,
          averagePrice,
          mostPopularType,
          featuredProperties,
        };

        setStats(propertyStats);
        setLoading(false);
      } catch (error) {
        logger.error('Error loading properties:', { error: error instanceof Error ? error.message : String(error) });
        setLoading(false);
      }
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

  const toggleFeatured = async (propertyId: string) => {
    // For demo purposes, we'll toggle between apartment types
    setProperties(prev => prev.map(property =>
      property.id === propertyId
        ? { ...property, type: property.type === 'apartment' ? 'house' : 'apartment' }
        : property,
    ));
  };

  const deleteProperty = async (propertyId: string) => {
    setProperties(prev => prev.filter(property => property.id !== propertyId));
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'apartment':
        return <Building className="w-5 h-5" />;
      case 'house':
        return <Home className="w-5 h-5" />;
      case 'office':
        return <Briefcase className="w-5 h-5" />;
      case 'commercial':
        return <Store className="w-5 h-5" />;
      default:
        return <Building className="w-5 h-5" />;
    }
  };

  const getTypeName = (type: string) => {
    switch (type) {
      case 'apartment':
        return 'Departamento';
      case 'house':
        return 'Casa';
      case 'office':
        return 'Oficina';
      case 'commercial':
        return 'Comercial';
      default:
        return 'Otro';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available':
        return 'text-green-600 bg-green-50 border-green-200';
      case 'rented':
        return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'maintenance':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'unavailable':
        return 'text-red-600 bg-red-50 border-red-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'available':
        return <Badge className="bg-green-100 text-green-800">Disponible</Badge>;
      case 'rented':
        return <Badge className="bg-blue-100 text-blue-800">Arrendado</Badge>;
      case 'maintenance':
        return <Badge className="bg-yellow-100 text-yellow-800">Mantenimiento</Badge>;
      case 'unavailable':
        return <Badge className="bg-red-100 text-red-800">No disponible</Badge>;
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

  const formatRelativeTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    
    if (diffMins < 60) {
return `Hace ${diffMins} minutos`;
}
    if (diffHours < 24) {
return `Hace ${diffHours} horas`;
}
    if (diffDays < 7) {
return `Hace ${diffDays} días`;
}
    
    return date.toLocaleDateString('es-CL');
  };

  const filteredProperties = properties.filter(property => {
    const matchesFilter = filter === 'all' || property.status === filter || property.type === filter;
    const matchesSearch = property.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         property.address.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         property.city.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesFilter && matchesSearch;
  });

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
    <EnhancedDashboardLayout
      user={user}
      title="Propiedades"
      subtitle="Gestiona todas las propiedades a tu cargo"
    >
      <div className="container mx-auto px-4 py-6">
        {/* Header with stats */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-6 gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Panel de Propiedades</h1>
            <p className="text-gray-600">Gestiona todas las propiedades a tu cargo</p>
          </div>
          <div className="flex gap-2">
            <Button size="sm" asChild>
              <Link href="/broker/properties/new">
                <Plus className="w-4 h-4 mr-2" />
                Nueva Propiedad
              </Link>
            </Button>
            <Button variant="outline" size="sm">
              <Download className="w-4 h-4 mr-2" />
              Exportar
            </Button>
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
                  <p className="text-xs text-gray-500 flex items-center mt-1">
                    <Building className="w-3 h-3 mr-1" />
                    {stats.mostPopularType} más popular
                  </p>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Building className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Disponibles</p>
                  <p className="text-2xl font-bold text-green-600">{stats.availableProperties}</p>
                  <p className="text-xs text-green-600 flex items-center mt-1">
                    <TrendingUp className="w-3 h-3 mr-1" />
                    Listas para arrendar
                  </p>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <CheckCircle className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Vistas</p>
                  <p className="text-2xl font-bold text-gray-900">1,250</p>
                  <p className="text-xs text-blue-600 flex items-center mt-1">
                    <Eye className="w-3 h-3 mr-1" />
                    45 consultas
                  </p>
                </div>
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                  <Eye className="w-6 h-6 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Precio Promedio</p>
                  <p className="text-2xl font-bold text-gray-900">{formatPrice(stats.averagePrice)}</p>
                  <p className="text-xs text-orange-600 flex items-center mt-1">
                    <Star className="w-3 h-3 mr-1" />
                    {stats.featuredProperties} destacadas
                  </p>
                </div>
                <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                  <DollarSign className="w-6 h-6 text-orange-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters and Search */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Buscar propiedades..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          <div className="flex gap-2">
            <select 
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm"
            >
              <option value="all">Todas</option>
              <option value="available">Disponibles</option>
              <option value="rented">Arrendadas</option>
              <option value="maintenance">Mantenimiento</option>
              <option value="apartment">Departamentos</option>
              <option value="house">Casas</option>
              <option value="office">Oficinas</option>
              <option value="commercial">Comerciales</option>
            </select>
            <Button variant="outline" size="sm">
              <Filter className="w-4 h-4 mr-2" />
              Filtros
            </Button>
          </div>
        </div>

        {/* Properties Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProperties.length === 0 ? (
            <div className="col-span-full">
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center py-8">
                    <Building className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">No se encontraron propiedades</p>
                    <p className="text-sm text-gray-400">Intenta ajustar tus filtros de búsqueda</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : (
            filteredProperties.map((property) => (
              <Card key={property.id} className={`border-l-4 ${getStatusColor(property.status)}`}>
                <CardContent className="pt-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className={`p-1 rounded ${getStatusColor(property.status)}`}>
                        {getTypeIcon('apartment')}
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900 text-sm">{property.title}</h3>
                        <div className="flex items-center gap-1 mt-1">
                          {getStatusBadge(property.status)}
                          <Badge variant="outline" className="text-xs">
                            {getTypeName('apartment')}
                          </Badge>
                          {property.type === 'apartment' && (
                            <Badge className="bg-yellow-100 text-yellow-800">
                              <Star className="w-3 h-3 mr-1" />
                              Destacada
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <Button size="sm" variant="ghost" onClick={() => toggleFeatured(property.id)}>
                        <Star className={`w-4 h-4 ${property.type === 'apartment' ? 'fill-yellow-400 text-yellow-400' : ''}`} />
                      </Button>
                    </div>
                  </div>

                  {/* Property Image */}
                  <div className="relative h-40 bg-gray-100 rounded-lg mb-3 overflow-hidden">
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Image className="w-16 h-16 text-gray-400" />
                    </div>
                    <div className="absolute top-2 right-2">
                      <Badge className="bg-black bg-opacity-70 text-white text-xs">
                        {property.images ? JSON.parse(property.images).length : 0} fotos
                      </Badge>
                    </div>
                  </div>

                  {/* Property Details */}
                  <div className="space-y-2 mb-3">
                    <div className="flex items-center justify-between">
                      <span className="text-lg font-bold text-gray-900">{formatPrice(property.price)}</span>
                      <span className="text-sm text-gray-600">/mes</span>
                    </div>
                    
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <MapPin className="w-4 h-4" />
                      <span>{property.commune}, {property.city}</span>
                    </div>
                    
                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      {property.bedrooms > 0 && (
                        <div className="flex items-center gap-1">
                          <Bed className="w-4 h-4" />
                          <span>{property.bedrooms}</span>
                        </div>
                      )}
                      {property.bathrooms > 0 && (
                        <div className="flex items-center gap-1">
                          <Bath className="w-4 h-4" />
                          <span>{property.bathrooms}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-1">
                        <Square className="w-4 h-4" />
                        <span>{property.area}m²</span>
                      </div>
                    </div>
                  </div>

                  {/* Features */}
                  <div className="flex flex-wrap gap-1 mb-3">
                    {property.features && (JSON.parse(property.features) as string[]).slice(0, 3).map((feature: string, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {feature}
                      </Badge>
                    ))}
                    {property.features && (JSON.parse(property.features) as string[]).length > 3 && (
                      <Badge variant="outline" className="text-xs">
                        +{(JSON.parse(property.features) as string[]).length - 3}
                      </Badge>
                    )}
                  </div>

                  {/* Stats */}
                  <div className="flex justify-between items-center text-xs text-gray-500 mb-3">
                    <div className="flex items-center gap-1">
                      <Eye className="w-3 h-3" />
                      <span>{property.views} vistas</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Activity className="w-3 h-3" />
                      <span>{property.inquiries} consultas</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      <span>Actualizado {formatRelativeTime(property.updatedAt.toISOString())}</span>
                    </div>
                  </div>

                  {/* Owner Info */}
                  <div className="border-t pt-3 mb-3">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-gray-600">Propietario:</span>
                      <span className="font-medium">{property.ownerName}</span>
                    </div>
                    <div className="flex items-center justify-between text-xs mt-1">
                      <span className="text-gray-600">Email:</span>
                      <span className="font-medium">{property.ownerEmail}</span>
                    </div>
                    <div className="flex items-center justify-between text-xs mt-1">
                      <span className="text-gray-600">Teléfono:</span>
                      <span className="font-medium">{property.ownerPhone}</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" className="flex-1">
                      <Eye className="w-4 h-4 mr-1" />
                      Ver
                    </Button>
                    <Button size="sm" variant="outline" className="flex-1">
                      <Edit className="w-4 h-4 mr-1" />
                      Editar
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => deleteProperty(property.id)}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </EnhancedDashboardLayout>
  );
}

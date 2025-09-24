'use client';

import { logger } from '@/lib/logger';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Building, 
  Search, 
  Filter, 
  Eye, 
  Edit, 
  Plus,
  MapPin,
  DollarSign,
  Users,
  Calendar,
  MoreHorizontal,
  Grid,
  List } from 'lucide-react';
import { User, Property } from '@/types';
import EnhancedDashboardLayout from '@/components/dashboard/EnhancedDashboardLayout';
import RecordModal from '@/components/forms/RecordModal';


export default function AdminPropertiesPage() {

  const [user, setUser] = useState<User | null>(null);

  const [properties, setProperties] = useState<Property[]>([]);

  const [filteredProperties, setFilteredProperties] = useState<Property[]>([]);

  const [searchQuery, setSearchQuery] = useState('');

  const [statusFilter, setStatusFilter] = useState('all');

  const [cityFilter, setCityFilter] = useState('all');

  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const [loading, setLoading] = useState(true);

  const [showCreateModal, setShowCreateModal] = useState(false);

  useEffect(() => {
    // Load user data
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

    // Load properties data
    const loadProperties = async () => {
      try {
        // Mock data for demo
        const emptyImages: string[] = [];
        const emptyFeatures: string[] = [];

        const mockProperties = [
          {
            id: '1',
            title: 'Departamento Las Condes',
            description: 'Hermoso departamento en zona exclusiva',
            address: 'Av. Apoquindo 3400, Las Condes',
            city: 'Santiago',
            commune: 'Las Condes',
            region: 'Metropolitana',
            price: 550000,
            deposit: 550000,
            bedrooms: 2,
            bathrooms: 2,
            area: 85,
            status: 'RENTED',
            images: JSON.stringify(emptyImages),
            features: emptyFeatures,
            ownerId: 'user-owner-1',
            createdAt: new Date('2024-01-15'),
            updatedAt: new Date('2024-03-10'),
          },
          {
            id: '2',
            title: 'Oficina Providencia',
            description: 'Oficina moderna en el corazón de Providencia',
            address: 'Av. Providencia 1245, Providencia',
            city: 'Santiago',
            commune: 'Providencia',
            region: 'Metropolitana',
            price: 350000,
            deposit: 350000,
            bedrooms: 1,
            bathrooms: 1,
            area: 45,
            status: 'RENTED',
            images: JSON.stringify(emptyImages),
            features: emptyFeatures,
            ownerId: 'user-owner-2',
            createdAt: new Date('2024-02-01'),
            updatedAt: new Date('2024-03-15'),
          },
          {
            id: '3',
            title: 'Casa Vitacura',
            description: 'Amplia casa familiar con jardín',
            address: 'Av. Vitacura 8900, Vitacura',
            city: 'Santiago',
            commune: 'Vitacura',
            region: 'Metropolitana',
            price: 1200000,
            deposit: 1200000,
            bedrooms: 4,
            bathrooms: 3,
            area: 180,
            status: 'AVAILABLE',
            images: JSON.stringify(emptyImages),
            features: emptyFeatures,
            ownerId: 'user-owner-3',
            createdAt: new Date('2024-02-15'),
            updatedAt: new Date('2024-03-20'),
          },
          {
            id: '4',
            title: 'Estudio Centro Histórico',
            description: 'Acogedor estudio en el centro histórico',
            address: 'Bandera 123, Santiago Centro',
            city: 'Santiago',
            commune: 'Santiago Centro',
            region: 'Metropolitana',
            price: 280000,
            deposit: 280000,
            bedrooms: 1,
            bathrooms: 1,
            area: 30,
            status: 'MAINTENANCE',
            images: JSON.stringify(emptyImages),
            features: emptyFeatures,
            ownerId: 'user-owner-4',
            createdAt: new Date('2024-01-20'),
            updatedAt: new Date('2024-03-18'),
          },
        ];

        setProperties(mockProperties as unknown as Property[]);
        setFilteredProperties(mockProperties as unknown as Property[]);
        setLoading(false);
      } catch (error) {
        logger.error('Error loading properties:', { error: error instanceof Error ? error.message : String(error) });
        setLoading(false);
      }
    };

    loadUserData();
    loadProperties();
  }, []);

  useEffect(() => {
    // Filter properties based on search and filters
    let filtered = properties;

    if (searchQuery) {
      filtered = filtered.filter(property =>
        property.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        property.address.toLowerCase().includes(searchQuery.toLowerCase()) ||
        property.ownerId.toLowerCase().includes(searchQuery.toLowerCase()) ||
        property.commune.toLowerCase().includes(searchQuery.toLowerCase()),
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(property => property.status === statusFilter);
    }

    if (cityFilter !== 'all') {
      filtered = filtered.filter(property => property.city === cityFilter);
    }

    setFilteredProperties(filtered);
  }, [properties, searchQuery, statusFilter, cityFilter]);

  const handleCreateProperty = async (propertyData: any) => {
    try {
      // Create property object with ID compatible with global Property interface
      const emptyImages: string[] = [];
      const emptyFeatures: string[] = [];

      const newProperty = {
        id: Date.now().toString(),
        title: propertyData.title || 'Nueva Propiedad',
        description: propertyData.description || 'Descripción pendiente',
        address: propertyData.address || 'Dirección pendiente',
        city: propertyData.city || 'Santiago',
        commune: propertyData.commune || 'Centro',
        region: 'Metropolitana',
        price: propertyData.price || 0,
        deposit: propertyData.deposit || 0,
        bedrooms: propertyData.bedrooms || 1,
        bathrooms: propertyData.bathrooms || 1,
        area: propertyData.area || 50,
        type: 'APARTMENT' as const,
        status: 'AVAILABLE' as const,
        images: emptyImages,
        features: emptyFeatures,
        ownerId: user?.id || 'user-admin',
        createdAt: new Date(),
        updatedAt: new Date(),
      } as unknown as Property;

      // Add to properties list
      setProperties([newProperty, ...properties]);
    } catch (error) {
      logger.error('Error creating property:', { error: error instanceof Error ? error.message : String(error) });
      alert('Error al crear propiedad');
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-CL', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'AVAILABLE':
        return <Badge className="bg-green-100 text-green-800">Disponible</Badge>;
      case 'RENTED':
        return <Badge className="bg-blue-100 text-blue-800">Arrendado</Badge>;
      case 'PENDING':
        return <Badge className="bg-yellow-100 text-yellow-800">Pendiente</Badge>;
      case 'MAINTENANCE':
        return <Badge className="bg-red-100 text-red-800">Mantenimiento</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const PropertyCard = ({ property }: { property: Property }) => (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow">
      <div className="aspect-video bg-gray-200 relative">
        <div className="w-full h-full bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center">
          <Building className="w-16 h-16 text-blue-400" />
        </div>
        <div className="absolute top-2 right-2">
          {getStatusBadge(property.status)}
        </div>
      </div>
      
      <CardContent className="p-4">
        <h3 className="font-semibold text-lg mb-2 line-clamp-1">{property.title}</h3>
        
        <div className="flex items-center text-sm text-gray-600 mb-2">
          <MapPin className="w-4 h-4 mr-1" />
          <span className="line-clamp-1">{property.commune}</span>
        </div>
        
        <div className="text-xl font-bold text-blue-600 mb-2">
          {formatPrice(property.price)}
        </div>
        
        <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
          <div className="flex items-center">
            <span className="font-medium">{property.bedrooms}</span>
            <span className="ml-1">dorm</span>
          </div>
          <div className="flex items-center">
            <span className="font-medium">{property.bathrooms}</span>
            <span className="ml-1">baños</span>
          </div>
          <div className="flex items-center">
            <span className="font-medium">{property.area}</span>
            <span className="ml-1">m²</span>
          </div>
        </div>
        
        <div className="text-xs text-gray-500 mb-3">
          <div>Propietario ID: {property.ownerId}</div>
          <div>Estado: {property.status}</div>
        </div>

        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <Eye className="w-3 h-3" />
            <span>Ver detalles</span>
            <Users className="w-3 h-3 ml-2" />
            <span>Propietario</span>
          </div>
          
          <div className="flex gap-1">
            <Button size="sm" variant="ghost">
              <Eye className="w-4 h-4" />
            </Button>
            <Button size="sm" variant="ghost">
              <Edit className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const PropertyListItem = ({ property }: { property: Property }) => (
    <div className="border rounded-lg p-4 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <h3 className="text-lg font-semibold">{property.title}</h3>
            {getStatusBadge(property.status)}
          </div>
          
          <div className="grid md:grid-cols-2 gap-4 mb-3">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <MapPin className="w-4 h-4" />
                <span>{property.address}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Users className="w-4 h-4" />
                <span>Propietario ID: {property.ownerId}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <span>Estado: {property.status}</span>
              </div>
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-4 text-sm">
                <div className="flex items-center">
                  <span className="font-medium">{property.bedrooms}</span>
                  <span className="ml-1">dorm</span>
                </div>
                <div className="flex items-center">
                  <span className="font-medium">{property.bathrooms}</span>
                  <span className="ml-1">baños</span>
                </div>
                <div className="flex items-center">
                  <span className="font-medium">{property.area}</span>
                  <span className="ml-1">m²</span>
                </div>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Calendar className="w-4 h-4" />
                <span>Creado: {formatDate(property.createdAt.toISOString())}</span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-6 text-sm">
            <div className="flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-green-600" />
              <span className="font-medium">{formatPrice(property.price)}</span>
            </div>
            <div className="flex items-center gap-2">
              <Eye className="w-4 h-4 text-blue-600" />
              <span>Ver detalles</span>
            </div>
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-purple-600" />
              <span>Propietario</span>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-2 ml-4">
          <Button size="sm" variant="outline">
            <Eye className="w-4 h-4 mr-2" />
            Ver
          </Button>
          <Button size="sm" variant="outline">
            <Edit className="w-4 h-4 mr-2" />
            Editar
          </Button>
          <Button size="sm" variant="ghost">
            <MoreHorizontal className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );

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
      title="Gestión de Propiedades"
      subtitle="Administra todas las propiedades del sistema"
    >
      <div className="container mx-auto px-4 py-6">
        {/* Header Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Propiedades</p>
                  <p className="text-2xl font-bold text-gray-900">{properties.length}</p>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Building className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Disponibles</p>
                  <p className="text-2xl font-bold text-green-600">
                    {properties.filter(p => p.status === 'AVAILABLE').length}
                  </p>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <Building className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Arrendadas</p>
                  <p className="text-2xl font-bold text-blue-600">
                    {properties.filter(p => p.status === 'RENTED').length}
                  </p>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Building className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Mantenimiento</p>
                  <p className="text-2xl font-bold text-red-600">
                    {properties.filter(p => p.status === 'MAINTENANCE').length}
                  </p>
                </div>
                <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                  <Building className="w-6 h-6 text-red-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters and Actions */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
          <div className="flex flex-col md:flex-row gap-4 flex-1">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <Input
                placeholder="Buscar propiedades..."
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="AVAILABLE">Disponibles</SelectItem>
                <SelectItem value="RENTED">Arrendadas</SelectItem>
                <SelectItem value="PENDING">Pendientes</SelectItem>
                <SelectItem value="MAINTENANCE">Mantenimiento</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={cityFilter} onValueChange={setCityFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Ciudad" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                <SelectItem value="Santiago">Santiago</SelectItem>
                <SelectItem value="Valparaíso">Valparaíso</SelectItem>
                <SelectItem value="Concepción">Concepción</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="flex gap-2">
            <Button variant="outline" size="sm">
              <Filter className="w-4 h-4 mr-2" />
              Filtros
            </Button>
            <Button onClick={() => setShowCreateModal(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Nueva Propiedad
            </Button>
          </div>
        </div>

        {/* View Mode Toggle */}
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">
              {filteredProperties.length} propiedades encontradas
            </span>
          </div>
          <div className="flex gap-2">
            <Button
              variant={viewMode === 'grid' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('grid')}
            >
              <Grid className="w-4 h-4" />
            </Button>
            <Button
              variant={viewMode === 'list' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('list')}
            >
              <List className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Properties List */}
        {viewMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProperties.map((property) => (
              <PropertyCard key={property.id} property={property} />
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            {filteredProperties.map((property) => (
              <PropertyListItem key={property.id} property={property} />
            ))}
          </div>
        )}

        {filteredProperties.length === 0 && (
          <Card>
            <CardContent className="pt-6 text-center">
              <Building className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No se encontraron propiedades</p>
              <Button 
                variant="outline" 
                className="mt-4"
                onClick={() => setShowCreateModal(true)}
              >
                <Plus className="w-4 h-4 mr-2" />
                Crear primera propiedad
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Create Property Modal */}
        <RecordModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          type="property"
          onSubmit={handleCreateProperty}
          mode="create"
        />
      </div>
    </EnhancedDashboardLayout>
  );
}

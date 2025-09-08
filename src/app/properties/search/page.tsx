'use client';

import { logger } from '@/lib/logger';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, 
  MapPin, 
  Bed, 
  Bath, 
  Square, 
  Filter,
  Grid,
  List,
  Heart,
  Share2,
  Home,
  Loader2,
  Eye } from 'lucide-react';
import { Property } from '@/types';

const communes = [
  'Las Condes', 'Vitacura', 'Lo Barnechea', 'Providencia', 'Ñuñoa', 
  'Santiago Centro', 'La Reina', 'Macul', 'San Miguel', 'Estación Central',
];

export default function PropertySearch() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [filteredProperties, setFilteredProperties] = useState<Property[]>([]);
  const [filters, setFilters] = useState<PropertyFilters>({});
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('relevance');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showFilters, setShowFilters] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchProperties();
  }, []);

  useEffect(() => {
    // Fetch properties when filters or search query change
    const timeoutId = setTimeout(() => {
      fetchProperties();
    }, 500); // Debounce to avoid too many API calls

    return () => clearTimeout(timeoutId);
  }, [filters, searchQuery]);

  useEffect(() => {
    // Apply sorting when properties or sort criteria change
    filterAndSortProperties();
  }, [properties, sortBy]);

  const fetchProperties = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        limit: '50',
        status: 'AVAILABLE',
      });

      // Add search query if exists
      if (searchQuery) {
        params.append('search', searchQuery);
      }

      // Add filters to API call
      if (filters.city && filters.city !== 'all') {
        params.append('city', filters.city);
      }
      if (filters.commune && filters.commune !== 'all') {
        params.append('commune', filters.commune);
      }
      if (filters.minPrice) {
        params.append('minPrice', filters.minPrice.toString());
      }
      if (filters.maxPrice) {
        params.append('maxPrice', filters.maxPrice.toString());
      }
      if (filters.bedrooms && (filters.bedrooms as any) !== 'all') {
        params.append('bedrooms', (filters.bedrooms as any).toString());
      }
      if (filters.bathrooms && (filters.bathrooms as any) !== 'all') {
        params.append('bathrooms', (filters.bathrooms as any).toString());
      }
      if (filters.minArea) {
        params.append('minArea', filters.minArea.toString());
      }
      if (filters.maxArea) {
        params.append('maxArea', filters.maxArea.toString());
      }
      if (filters.status && (filters.status as any) !== 'all') {
        params.append('status', (filters.status as any));
      }
      if (filters.type && (filters.type as any) !== 'all') {
        params.append('type', (filters.type as any));
      }

      const response = await fetch(`/api/properties?${params}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al cargar propiedades');
      }

      const data = await response.json();
      setProperties(data.properties || []);
      setError(null);
    } catch (err) {
      logger.error('Error fetching properties:', { error: err instanceof Error ? err.message : String(err) });
      setError(err instanceof Error ? err.message : 'Error al cargar las propiedades. Por favor intenta nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  const filterAndSortProperties = () => {
    const filtered = [...properties];

    // Apply sorting (since filtering is now done on the backend)
    switch (sortBy) {
      case 'price-asc':
        filtered.sort((a, b) => a.price - b.price);
        break;
      case 'price-desc':
        filtered.sort((a, b) => b.price - a.price);
        break;
      case 'newest':
        filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        break;
      default:
        // relevance - keep original order from backend
        break;
    }

    setFilteredProperties(filtered);
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
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

  const handleViewDetails = (propertyId: string) => {
    // Navigate to property details page
    window.location.href = `/properties/${propertyId}`;
  };

  const handleSaveProperty = async (propertyId: string) => {
    try {
      // Check if user is logged in
      const userResponse = await fetch('/api/auth/me');
      if (!userResponse.ok) {
        // Redirect to login if not authenticated
        window.location.href = '/auth/login';
        return;
      }

      const user = await userResponse.json();
      
      // Save property to user's favorites via API
      const response = await fetch('/api/users/favorites', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ propertyId }),
      });

      if (response.ok) {
        alert('Propiedad guardada en favoritos');
      } else {
        const error = await response.json();
        alert(error.error || 'Error al guardar la propiedad');
      }
    } catch (error) {
      logger.error('Error saving property:', { error: error instanceof Error ? error.message : String(error) });
      alert('Error al guardar la propiedad');
    }
  };

  const handleShareProperty = (propertyId: string) => {
    // Share property
    if (navigator.share) {
      navigator.share({
        title: 'Propiedad en Rent360',
        text: 'Mira esta propiedad que encontré en Rent360',
        url: window.location.origin + `/properties/${propertyId}`,
      });
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(window.location.origin + `/properties/${propertyId}`);
      alert('Enlace copiado al portapapeles');
    }
  };

  const PropertyCard = ({ property }: { property: Property }) => (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow duration-300">
      <div className="relative">
        <div className="aspect-video bg-gray-200 relative overflow-hidden">
          {property.images && property.images.length > 0 ? (
            <img 
              src={property.images[0]} 
              alt={property.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center">
              <Home className="w-16 h-16 text-blue-400" />
            </div>
          )}
          <div className="absolute top-2 right-2">
            {getStatusBadge(property.status)}
          </div>
          <div className="absolute top-2 left-2">
            <Button 
              size="sm" 
              variant="secondary" 
              className="bg-white/80 hover:bg-white"
              onClick={() => handleSaveProperty(property.id)}
            >
              <Heart className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
      
      <CardHeader className="pb-3">
        <CardTitle className="text-lg line-clamp-1">{property.title}</CardTitle>
        <div className="flex items-center text-sm text-gray-600">
          <MapPin className="w-4 h-4 mr-1" />
          <span className="line-clamp-1">{property.commune}, {property.city}</span>
        </div>
      </CardHeader>
      
      <CardContent className="pt-0">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="text-2xl font-bold text-blue-600">
              {formatPrice(property.price)}
            </div>
            <div className="text-sm text-gray-500">
              {formatPrice(property.deposit)} depósito
            </div>
          </div>
          
          <div className="flex items-center gap-4 text-sm text-gray-600">
            <div className="flex items-center">
              <Bed className="w-4 h-4 mr-1" />
              <span>{property.bedrooms} dorm</span>
            </div>
            <div className="flex items-center">
              <Bath className="w-4 h-4 mr-1" />
              <span>{property.bathrooms} baños</span>
            </div>
            <div className="flex items-center">
              <Square className="w-4 h-4 mr-1" />
              <span>{property.area} m²</span>
            </div>
          </div>
          
          {property.features && Array.isArray(property.features) && property.features.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {property.features?.split(',').slice(0, 3).map((feature, index) => (
                <Badge key={index} variant="outline" className="text-xs">
                  {feature}
                </Badge>
              ))}
              {property.features.length > 3 && (
                <Badge variant="outline" className="text-xs">
                  +{property.features.length - 3}
                </Badge>
              )}
            </div>
          )}
          
          <div className="flex gap-2 pt-2">
            <Button 
              size="sm" 
              className="flex-1"
              onClick={() => handleViewDetails(property.id)}
            >
              <Eye className="w-4 h-4 mr-1" />
              Ver detalles
            </Button>
            <Button 
              size="sm" 
              variant="outline"
              onClick={() => handleShareProperty(property.id)}
            >
              <Share2 className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const PropertyListItem = ({ property }: { property: Property }) => (
    <Card>
      <CardContent className="p-4">
        <div className="flex gap-4">
          <div className="w-32 h-24 bg-gray-200 rounded-lg flex-shrink-0 relative overflow-hidden">
            {property.images && property.images.length > 0 ? (
              <img 
                src={property.images[0]} 
                alt={property.title}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center">
                <Home className="w-8 h-8 text-blue-400" />
              </div>
            )}
            <div className="absolute top-1 right-1">
              {getStatusBadge(property.status)}
            </div>
          </div>
          
          <div className="flex-1">
            <div className="flex justify-between items-start mb-2">
              <h3 className="text-lg font-semibold">{property.title}</h3>
              <div className="text-right">
                <div className="text-xl font-bold text-blue-600">
                  {formatPrice(property.price)}
                </div>
                <div className="text-sm text-gray-500">
                  {formatPrice(property.deposit)} depósito
                </div>
              </div>
            </div>
            
            <div className="flex items-center text-sm text-gray-600 mb-2">
              <MapPin className="w-4 h-4 mr-1" />
              <span>{property.address}</span>
            </div>
            
            <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
              <div className="flex items-center">
                <Bed className="w-4 h-4 mr-1" />
                <span>{property.bedrooms} dorm</span>
              </div>
              <div className="flex items-center">
                <Bath className="w-4 h-4 mr-1" />
                <span>{property.bathrooms} baños</span>
              </div>
              <div className="flex items-center">
                <Square className="w-4 h-4 mr-1" />
                <span>{property.area} m²</span>
              </div>
            </div>
            
            <p className="text-sm text-gray-600 line-clamp-2 mb-3">
              {property.description}
            </p>
            
            <div className="flex gap-2">
              <Button 
                size="sm"
                onClick={() => handleViewDetails(property.id)}
              >
                <Eye className="w-4 h-4 mr-1" />
                Ver detalles
              </Button>
              <Button 
                size="sm" 
                variant="outline"
                onClick={() => handleSaveProperty(property.id)}
              >
                <Heart className="w-4 h-4 mr-1" />
                Guardar
              </Button>
              <Button 
                size="sm" 
                variant="outline"
                onClick={() => handleShareProperty(property.id)}
              >
                <Share2 className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Cargando propiedades...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="text-red-600 mb-4">
            <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold mb-2">Error al cargar propiedades</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <Button onClick={fetchProperties}>Intentar nuevamente</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex flex-col md:flex-row gap-4 items-center">
            <div className="relative flex-1 max-w-2xl">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <Input
                placeholder="Buscar por dirección, comuna o características..."
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            
            <div className="flex items-center gap-2">
              <Button
                variant={showFilters ? 'default' : 'outline'}
                onClick={() => setShowFilters(!showFilters)}
              >
                <Filter className="w-4 h-4 mr-2" />
                Filtros
              </Button>
              
              <div className="flex border rounded-md">
                <Button
                  variant={viewMode === 'grid' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('grid')}
                  className="rounded-r-none"
                >
                  <Grid className="w-4 h-4" />
                </Button>
                <Button
                  variant={viewMode === 'list' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('list')}
                  className="rounded-l-none"
                >
                  <List className="w-4 h-4" />
                </Button>
              </div>
              
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="relevance">Relevancia</SelectItem>
                  <SelectItem value="price-asc">Precio: Menor a Mayor</SelectItem>
                  <SelectItem value="price-desc">Precio: Mayor a Menor</SelectItem>
                  <SelectItem value="newest">Más Reciente</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Filters Sidebar */}
          {showFilters && (
            <div className="lg:w-80 flex-shrink-0">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Filtros</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Ciudad
                    </label>
                    <Select 
                      value={filters.city || 'all'} 
                      onValueChange={(value) => setFilters(prev => ({ 
                        ...prev, 
                        city: value === 'all' ? undefined : value, 
                      }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar ciudad" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Cualquier ciudad</SelectItem>
                        <SelectItem value="Santiago">Santiago</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Comuna
                    </label>
                    <Select 
                      value={filters.commune || 'all'} 
                      onValueChange={(value) => setFilters(prev => ({ 
                        ...prev, 
                        commune: value === 'all' ? undefined : value, 
                      }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar comuna" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Cualquier comuna</SelectItem>
                        {communes.map(commune => (
                          <SelectItem key={commune} value={commune}>
                            {commune}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Rango de Precio
                    </label>
                    <div className="flex gap-2">
                      <Input
                        type="number"
                        placeholder="Mínimo"
                        value={filters.minPrice || ''}
                        onChange={(e) => setFilters(prev => ({ 
                          ...prev, 
                          minPrice: e.target.value ? parseInt(e.target.value) : undefined, 
                        }))}
                      />
                      <Input
                        type="number"
                        placeholder="Máximo"
                        value={filters.maxPrice || ''}
                        onChange={(e) => setFilters(prev => ({ 
                          ...prev, 
                          maxPrice: e.target.value ? parseInt(e.target.value) : undefined, 
                        }))}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Dormitorios
                    </label>
                    <Select 
                      value={filters.bedrooms?.toString() || 'all'} 
                      onValueChange={(value) => setFilters(prev => ({ 
                        ...prev, 
                        bedrooms: value === 'all' ? undefined : parseInt(value), 
                      }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Cualquiera" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Cualquiera</SelectItem>
                        <SelectItem value="1">1+ dormitorios</SelectItem>
                        <SelectItem value="2">2+ dormitorios</SelectItem>
                        <SelectItem value="3">3+ dormitorios</SelectItem>
                        <SelectItem value="4">4+ dormitorios</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Baños
                    </label>
                    <Select 
                      value={filters.bathrooms?.toString() || 'all'} 
                      onValueChange={(value) => setFilters(prev => ({ 
                        ...prev, 
                        bathrooms: value === 'all' ? undefined : parseInt(value), 
                      }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Cualquiera" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Cualquiera</SelectItem>
                        <SelectItem value="1">1+ baños</SelectItem>
                        <SelectItem value="2">2+ baños</SelectItem>
                        <SelectItem value="3">3+ baños</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Rango de Área (m²)
                    </label>
                    <div className="flex gap-2">
                      <Input
                        type="number"
                        placeholder="Mínimo"
                        value={filters.minArea || ''}
                        onChange={(e) => setFilters(prev => ({ 
                          ...prev, 
                          minArea: e.target.value ? parseInt(e.target.value) : undefined, 
                        }))}
                      />
                      <Input
                        type="number"
                        placeholder="Máximo"
                        value={filters.maxArea || ''}
                        onChange={(e) => setFilters(prev => ({ 
                          ...prev, 
                          maxArea: e.target.value ? parseInt(e.target.value) : undefined, 
                        }))}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Tipo de Propiedad
                    </label>
                    <Select 
                      value={filters.type || 'all'} 
                      onValueChange={(value) => setFilters(prev => ({ ...prev, type: value === 'all' ? undefined : value as any }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Cualquier tipo" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Cualquier tipo</SelectItem>
                        <SelectItem value="APARTMENT">Departamento</SelectItem>
                        <SelectItem value="HOUSE">Casa</SelectItem>
                        <SelectItem value="STUDIO">Estudio</SelectItem>
                        <SelectItem value="ROOM">Pieza</SelectItem>
                        <SelectItem value="COMMERCIAL">Comercial</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Estado
                    </label>
                    <Select 
                      value={filters.status || 'all'} 
                      onValueChange={(value) => setFilters(prev => ({ 
                        ...prev, 
                        status: value === 'all' ? undefined : value as any, 
                      }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Cualquier estado" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Cualquier estado</SelectItem>
                        <SelectItem value="AVAILABLE">Disponible</SelectItem>
                        <SelectItem value="RENTED">Arrendado</SelectItem>
                        <SelectItem value="PENDING">Pendiente</SelectItem>
                        <SelectItem value="MAINTENANCE">Mantenimiento</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      className="flex-1"
                      onClick={() => setFilters({})}
                    >
                      Limpiar filtros
                    </Button>
                    <Button 
                      className="flex-1"
                      onClick={fetchProperties}
                      disabled={loading}
                    >
                      {loading ? (
                        <Loader2 className="w-4 h-4 animate-spin mr-2" />
                      ) : null}
                      Aplicar filtros
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Properties Grid */}
          <div className="flex-1">
            <div className="mb-4 flex justify-between items-center">
              <h2 className="text-xl font-semibold">
                {loading ? 'Buscando...' : `${filteredProperties.length} propiedades encontradas`}
              </h2>
              {loading && (
                <div className="flex items-center text-sm text-gray-500">
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  Aplicando filtros...
                </div>
              )}
            </div>

            {filteredProperties.length === 0 && !loading ? (
              <Card>
                <CardContent className="text-center py-12">
                  <Home className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No se encontraron propiedades</h3>
                  <p className="text-gray-600 mb-4">
                    Intenta ajustar tus filtros o términos de búsqueda
                  </p>
                  <Button onClick={() => {
 setFilters({}); setSearchQuery(''); 
}}>
                    Limpiar búsqueda
                  </Button>
                </CardContent>
              </Card>
            ) : loading ? (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[...Array(6)].map((_, index) => (
                  <Card key={index} className="overflow-hidden">
                    <div className="aspect-video bg-gray-200 animate-pulse"></div>
                    <CardContent className="p-4">
                      <div className="h-4 bg-gray-200 rounded mb-2 animate-pulse"></div>
                      <div className="h-3 bg-gray-200 rounded mb-4 animate-pulse w-3/4"></div>
                      <div className="flex justify-between items-center mb-4">
                        <div className="h-6 bg-gray-200 rounded animate-pulse w-1/3"></div>
                        <div className="h-4 bg-gray-200 rounded animate-pulse w-1/4"></div>
                      </div>
                      <div className="flex gap-4">
                        <div className="h-3 bg-gray-200 rounded animate-pulse w-8"></div>
                        <div className="h-3 bg-gray-200 rounded animate-pulse w-8"></div>
                        <div className="h-3 bg-gray-200 rounded animate-pulse w-8"></div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className={
                viewMode === 'grid' 
                  ? 'grid md:grid-cols-2 lg:grid-cols-3 gap-6' 
                  : 'space-y-4'
              }>
                {filteredProperties.map((property) => (
                  viewMode === 'grid' 
                    ? <PropertyCard key={property.id} property={property} />
                    : <PropertyListItem key={property.id} property={property} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

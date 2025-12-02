'use client';

import { logger } from '@/lib/logger-minimal';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
  Search,
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
  Eye,
  Camera,
  X,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  ChevronDown,
  Maximize2,
  Minimize2,
  Play,
  Pause,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Info,
  Move,
  Minus,
  Plus,
} from 'lucide-react';
import { Property } from '@/types';
import VirtualTour360 from '@/components/virtual-tour/VirtualTour360';

interface PropertyFilters {
  city?: string;
  commune?: string;
  minPrice?: number;
  maxPrice?: number;
  bedrooms?: number;
  bathrooms?: number;
  minArea?: number;
  maxArea?: number;
  status?: string;
  type?: string;
}

const communes = [
  'Las Condes',
  'Vitacura',
  'Lo Barnechea',
  'Providencia',
  'Ñuñoa',
  'Santiago Centro',
  'La Reina',
  'Macul',
  'San Miguel',
  'Estación Central',
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
  const [selectedPropertyForTour, setSelectedPropertyForTour] = useState<string | null>(null);
  const [virtualTourScenes, setVirtualTourScenes] = useState<any[]>([]);
  const [loadingTour, setLoadingTour] = useState(false);
  const [currentSceneIndex, setCurrentSceneIndex] = useState(0);
  const [tourProperty, setTourProperty] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  // Estados para navegación inmersiva del tour
  const [tourZoom, setTourZoom] = useState(1);
  const [tourPan, setTourPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [showTourControls, setShowTourControls] = useState(true);

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

  // Cargar escenas del tour virtual cuando se selecciona una propiedad
  useEffect(() => {
    const loadTourScenes = async () => {
      if (selectedPropertyForTour) {
        setLoadingTour(true);
        setVirtualTourScenes([]);
        setCurrentSceneIndex(0);
        setTourZoom(1);
        setTourPan({ x: 0, y: 0 });
        setShowTourControls(true);
        try {
          // Cargar tour virtual
          const response = await fetch(`/api/properties/${selectedPropertyForTour}/virtual-tour`);
          if (response.ok) {
            const data = await response.json();
            const tour = data.tour || data;
            if (tour?.scenes) {
              setVirtualTourScenes(tour.scenes);
            }
          }
          // Cargar info de la propiedad
          const propFound = properties.find(p => p.id === selectedPropertyForTour);
          setTourProperty(propFound || null);
        } catch (err) {
          logger.error('Error loading virtual tour for search', { error: err });
        } finally {
          setLoadingTour(false);
        }
      }
    };
    loadTourScenes();
  }, [selectedPropertyForTour, properties]);

  // Resetear zoom y pan al cambiar de escena
  useEffect(() => {
    setTourZoom(1);
    setTourPan({ x: 0, y: 0 });
  }, [currentSceneIndex]);

  // Handlers para navegación de imagen en el tour
  const handleTourWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.15 : 0.15;
    setTourZoom(prev => Math.max(1, Math.min(4, prev + delta)));
  }, []);

  const handleTourMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (tourZoom > 1) {
        setIsDragging(true);
        setDragStart({ x: e.clientX - tourPan.x, y: e.clientY - tourPan.y });
      }
    },
    [tourZoom, tourPan]
  );

  const handleTourMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (isDragging && tourZoom > 1) {
        setTourPan({
          x: e.clientX - dragStart.x,
          y: e.clientY - dragStart.y,
        });
      }
    },
    [isDragging, dragStart, tourZoom]
  );

  const handleTourMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  const resetTourView = useCallback(() => {
    setTourZoom(1);
    setTourPan({ x: 0, y: 0 });
  }, []);

  const fetchProperties = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        limit: '50',
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
        params.append('status', filters.status as any);
      }
      if (filters.type && (filters.type as any) !== 'all') {
        params.append('type', filters.type as any);
      }

      const response = await fetch(`/api/properties?${params}`);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al cargar propiedades');
      }

      const data = await response.json();
      console.log('Properties data received:', data);
      console.log('First property images:', data.properties?.[0]?.images);
      setProperties(data.properties || []);
      setError(null);
    } catch (err) {
      logger.error('Error fetching properties:', {
        error: err instanceof Error ? err.message : String(err),
      });
      setError(
        err instanceof Error
          ? err.message
          : 'Error al cargar las propiedades. Por favor intenta nuevamente.'
      );
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

  const handleViewVirtualTour = (propertyId: string) => {
    setSelectedPropertyForTour(propertyId);
    logger.info('Ver tour virtual', { propertyId });
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
      logger.error('Error saving property:', {
        error: error instanceof Error ? error.message : String(error),
      });
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
              src={property.images?.[0] || '/placeholder-property.jpg'}
              alt={property.title}
              className="w-full h-full object-cover"
              onError={e => {
                console.error('Error loading image:', property.images?.[0], e);
                e.currentTarget.style.display = 'none';
                const fallback = e.currentTarget.nextElementSibling as HTMLElement;
                if (fallback) {
                  fallback.style.display = 'flex';
                }
              }}
              onLoad={() => {
                console.log('Image loaded successfully:', property.images?.[0]);
              }}
            />
          ) : null}
          {(!property.images || property.images.length === 0) && (
            <div className="w-full h-full bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center">
              <Home className="w-16 h-16 text-blue-400" />
            </div>
          )}
          <div className="absolute top-2 right-2">{getStatusBadge(property.status)}</div>
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
          <span className="line-clamp-1">
            {property.commune}, {property.city}
          </span>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="text-2xl font-bold text-blue-600">{formatPrice(property.price)}</div>
            <div className="text-sm text-gray-500">{formatPrice(property.deposit)} depósito</div>
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

          {property.features &&
            Array.isArray(property.features) &&
            property.features.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {(property.features as string[]).slice(0, 3).map((feature, index) => (
                  <Badge key={index} variant="outline" className="text-xs">
                    {feature}
                  </Badge>
                ))}
                {(property.features as string[]).length > 3 && (
                  <Badge variant="outline" className="text-xs">
                    +{(property.features as string[]).length - 3}
                  </Badge>
                )}
              </div>
            )}

          <div className="flex gap-2 pt-2">
            <Button size="sm" className="flex-1" onClick={() => handleViewDetails(property.id)}>
              <Eye className="w-4 h-4 mr-1" />
              Ver detalles
            </Button>
            {property.virtualTourEnabled && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleViewVirtualTour(property.id)}
                title="Tour Virtual 360°"
              >
                <Camera className="w-4 h-4" />
              </Button>
            )}
            <Button size="sm" variant="outline" onClick={() => handleShareProperty(property.id)}>
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
                src={property.images?.[0] || '/placeholder-property.jpg'}
                alt={property.title}
                className="w-full h-full object-cover"
                onError={e => {
                  console.error('Error loading image in list:', property.images?.[0], e);
                  e.currentTarget.style.display = 'none';
                  const fallback = e.currentTarget.nextElementSibling as HTMLElement;
                  if (fallback) {
                    fallback.style.display = 'flex';
                  }
                }}
                onLoad={() => {
                  console.log('Image loaded successfully in list:', property.images?.[0]);
                }}
              />
            ) : null}
            {(!property.images || property.images.length === 0) && (
              <div className="w-full h-full bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center">
                <Home className="w-8 h-8 text-blue-400" />
              </div>
            )}
            <div className="absolute top-1 right-1">{getStatusBadge(property.status)}</div>
          </div>

          <div className="flex-1">
            <div className="flex justify-between items-start mb-2">
              <h3 className="text-lg font-semibold">{property.title}</h3>
              <div className="text-right">
                <div className="text-xl font-bold text-blue-600">{formatPrice(property.price)}</div>
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

            <p className="text-sm text-gray-600 line-clamp-2 mb-3">{property.description}</p>

            <div className="flex gap-2">
              <Button size="sm" onClick={() => handleViewDetails(property.id)}>
                <Eye className="w-4 h-4 mr-1" />
                Ver detalles
              </Button>
              <Button size="sm" variant="outline" onClick={() => handleSaveProperty(property.id)}>
                <Heart className="w-4 h-4 mr-1" />
                Guardar
              </Button>
              <Button size="sm" variant="outline" onClick={() => handleShareProperty(property.id)}>
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
            <svg
              className="w-16 h-16 mx-auto"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
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
                onChange={e => setSearchQuery(e.target.value)}
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
                    <label className="block text-sm font-medium text-gray-700 mb-2">Ciudad</label>
                    <Select
                      value={filters.city || 'all'}
                      onValueChange={value =>
                        setFilters(prev => {
                          const newFilters = { ...prev };
                          if (value === 'all') {
                            delete newFilters.city;
                          } else {
                            newFilters.city = value;
                          }
                          return newFilters;
                        })
                      }
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
                    <label className="block text-sm font-medium text-gray-700 mb-2">Comuna</label>
                    <Select
                      value={filters.commune || 'all'}
                      onValueChange={value =>
                        setFilters(prev => {
                          const newFilters = { ...prev };
                          if (value === 'all') {
                            delete newFilters.commune;
                          } else {
                            newFilters.commune = value;
                          }
                          return newFilters;
                        })
                      }
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
                        onChange={e =>
                          setFilters(prev => {
                            const newFilters = { ...prev };
                            if (e.target.value) {
                              newFilters.minPrice = parseInt(e.target.value);
                            } else {
                              delete newFilters.minPrice;
                            }
                            return newFilters;
                          })
                        }
                      />
                      <Input
                        type="number"
                        placeholder="Máximo"
                        value={filters.maxPrice || ''}
                        onChange={e =>
                          setFilters(prev => {
                            const newFilters = { ...prev };
                            if (e.target.value) {
                              newFilters.maxPrice = parseInt(e.target.value);
                            } else {
                              delete newFilters.maxPrice;
                            }
                            return newFilters;
                          })
                        }
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Dormitorios
                    </label>
                    <Select
                      value={filters.bedrooms?.toString() || 'all'}
                      onValueChange={value =>
                        setFilters(prev => {
                          const newFilters = { ...prev };
                          if (value === 'all') {
                            delete newFilters.bedrooms;
                          } else {
                            newFilters.bedrooms = parseInt(value);
                          }
                          return newFilters;
                        })
                      }
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
                    <label className="block text-sm font-medium text-gray-700 mb-2">Baños</label>
                    <Select
                      value={filters.bathrooms?.toString() || 'all'}
                      onValueChange={value =>
                        setFilters(prev => {
                          const newFilters = { ...prev };
                          if (value === 'all') {
                            delete newFilters.bathrooms;
                          } else {
                            newFilters.bathrooms = parseInt(value);
                          }
                          return newFilters;
                        })
                      }
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
                        onChange={e =>
                          setFilters(prev => {
                            const newFilters = { ...prev };
                            if (e.target.value) {
                              newFilters.minArea = parseInt(e.target.value);
                            } else {
                              delete newFilters.minArea;
                            }
                            return newFilters;
                          })
                        }
                      />
                      <Input
                        type="number"
                        placeholder="Máximo"
                        value={filters.maxArea || ''}
                        onChange={e =>
                          setFilters(prev => {
                            const newFilters = { ...prev };
                            if (e.target.value) {
                              newFilters.maxArea = parseInt(e.target.value);
                            } else {
                              delete newFilters.maxArea;
                            }
                            return newFilters;
                          })
                        }
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Tipo de Propiedad
                    </label>
                    <Select
                      value={filters.type || 'all'}
                      onValueChange={value =>
                        setFilters(prev => {
                          const newFilters = { ...prev };
                          if (value === 'all') {
                            delete newFilters.type;
                          } else {
                            newFilters.type = value;
                          }
                          return newFilters;
                        })
                      }
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
                    <label className="block text-sm font-medium text-gray-700 mb-2">Estado</label>
                    <Select
                      value={filters.status || 'all'}
                      onValueChange={value =>
                        setFilters(prev => {
                          const newFilters = { ...prev };
                          if (value === 'all') {
                            delete newFilters.status;
                          } else {
                            newFilters.status = value;
                          }
                          return newFilters;
                        })
                      }
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
                    <Button variant="outline" className="flex-1" onClick={() => setFilters({})}>
                      Limpiar filtros
                    </Button>
                    <Button className="flex-1" onClick={fetchProperties} disabled={loading}>
                      {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
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
                  <Button
                    onClick={() => {
                      setFilters({});
                      setSearchQuery('');
                    }}
                  >
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
              <div
                className={
                  viewMode === 'grid' ? 'grid md:grid-cols-2 lg:grid-cols-3 gap-6' : 'space-y-4'
                }
              >
                {filteredProperties.map(property =>
                  viewMode === 'grid' ? (
                    <PropertyCard key={property.id} property={property} />
                  ) : (
                    <PropertyListItem key={property.id} property={property} />
                  )
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal Inmersivo del Tour Virtual 360° */}
      {selectedPropertyForTour && (
        <div className="fixed inset-0 z-50 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
          {/* Fondo animado con patrón */}
          <div className="absolute inset-0 opacity-10">
            <div
              className="absolute inset-0"
              style={{
                backgroundImage: `radial-gradient(circle at 25% 25%, rgba(16, 185, 129, 0.3) 0%, transparent 50%),
                               radial-gradient(circle at 75% 75%, rgba(59, 130, 246, 0.3) 0%, transparent 50%)`,
              }}
            />
          </div>

          {loadingTour ? (
            /* Estado de carga elegante */
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <div className="relative w-24 h-24 mx-auto mb-6">
                  <div className="absolute inset-0 rounded-full border-4 border-emerald-500/30 animate-ping" />
                  <div className="absolute inset-2 rounded-full border-4 border-t-emerald-500 border-r-transparent border-b-transparent border-l-transparent animate-spin" />
                  <Camera className="absolute inset-0 m-auto w-10 h-10 text-emerald-400" />
                </div>
                <h3 className="text-2xl font-bold text-white mb-2">Preparando Tour Virtual</h3>
                <p className="text-slate-400">Cargando experiencia 360°...</p>
              </div>
            </div>
          ) : virtualTourScenes.length > 0 ? (
            /* Tour Virtual Inmersivo */
            <div className="relative h-full flex flex-col">
              {/* Header con gradiente */}
              <div className="absolute top-0 left-0 right-0 z-20 bg-gradient-to-b from-black/80 via-black/50 to-transparent">
                <div className="flex items-center justify-between p-4 md:p-6">
                  <div className="flex items-center gap-4">
                    <button
                      onClick={() => {
                        setSelectedPropertyForTour(null);
                        setCurrentSceneIndex(0);
                      }}
                      className="p-2 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-sm transition-all duration-300 group"
                    >
                      <X className="w-6 h-6 text-white group-hover:rotate-90 transition-transform duration-300" />
                    </button>
                    <div className="text-white">
                      <h2 className="text-xl md:text-2xl font-bold flex items-center gap-2">
                        <Camera className="w-6 h-6 text-emerald-400" />
                        Tour Virtual 360°
                      </h2>
                      {tourProperty && (
                        <p className="text-sm text-slate-300 mt-1 flex items-center gap-2">
                          <MapPin className="w-4 h-4" />
                          {tourProperty.title || tourProperty.address}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Info de escena actual */}
                  <div className="flex items-center gap-3">
                    <div className="hidden md:flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-2">
                      <span className="text-emerald-400 font-bold">{currentSceneIndex + 1}</span>
                      <span className="text-slate-400">/</span>
                      <span className="text-white">{virtualTourScenes.length}</span>
                      <span className="text-slate-400 ml-1">escenas</span>
                    </div>
                    {tourProperty && (
                      <div className="hidden lg:flex items-center gap-4 text-white/80 text-sm">
                        <span className="flex items-center gap-1">
                          <Bed className="w-4 h-4" /> {tourProperty.bedrooms}
                        </span>
                        <span className="flex items-center gap-1">
                          <Bath className="w-4 h-4" /> {tourProperty.bathrooms}
                        </span>
                        <span className="flex items-center gap-1">
                          <Square className="w-4 h-4" /> {tourProperty.area}m²
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Visor principal de la escena con zoom y pan */}
              <div
                className={`flex-1 relative overflow-hidden ${tourZoom > 1 ? 'cursor-grab' : 'cursor-default'} ${isDragging ? 'cursor-grabbing' : ''}`}
                onWheel={handleTourWheel}
                onMouseDown={handleTourMouseDown}
                onMouseMove={handleTourMouseMove}
                onMouseUp={handleTourMouseUp}
                onMouseLeave={handleTourMouseUp}
              >
                <div className="absolute inset-0 flex items-center justify-center select-none">
                  {virtualTourScenes[currentSceneIndex] && (
                    <img
                      src={virtualTourScenes[currentSceneIndex].imageUrl}
                      alt={
                        virtualTourScenes[currentSceneIndex].name ||
                        `Escena ${currentSceneIndex + 1}`
                      }
                      className="w-full h-full object-contain md:object-cover transition-transform duration-200"
                      style={{
                        maxHeight: '100vh',
                        transform: `scale(${tourZoom}) translate(${tourPan.x / tourZoom}px, ${tourPan.y / tourZoom}px)`,
                        transformOrigin: 'center center',
                      }}
                      draggable={false}
                    />
                  )}
                </div>

                {/* Controles de zoom flotantes */}
                <div
                  className={`absolute top-24 right-4 z-20 flex flex-col gap-2 transition-opacity duration-300 ${showTourControls ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
                >
                  <button
                    onClick={() => setTourZoom(prev => Math.min(4, prev + 0.5))}
                    className="p-2 bg-black/50 hover:bg-emerald-500/80 backdrop-blur-sm rounded-lg transition-all duration-300 group"
                    title="Acercar"
                  >
                    <Plus className="w-5 h-5 text-white" />
                  </button>
                  <div className="px-2 py-1 bg-black/50 backdrop-blur-sm rounded-lg text-center">
                    <span className="text-white text-xs font-medium">
                      {Math.round(tourZoom * 100)}%
                    </span>
                  </div>
                  <button
                    onClick={() => setTourZoom(prev => Math.max(1, prev - 0.5))}
                    disabled={tourZoom <= 1}
                    className={`p-2 backdrop-blur-sm rounded-lg transition-all duration-300 ${tourZoom <= 1 ? 'bg-black/20 cursor-not-allowed' : 'bg-black/50 hover:bg-emerald-500/80'}`}
                    title="Alejar"
                  >
                    <Minus
                      className={`w-5 h-5 ${tourZoom <= 1 ? 'text-slate-600' : 'text-white'}`}
                    />
                  </button>
                  {tourZoom > 1 && (
                    <button
                      onClick={resetTourView}
                      className="p-2 bg-black/50 hover:bg-orange-500/80 backdrop-blur-sm rounded-lg transition-all duration-300"
                      title="Restablecer vista"
                    >
                      <RotateCcw className="w-5 h-5 text-white" />
                    </button>
                  )}
                </div>

                {/* Indicador de zoom activo */}
                {tourZoom > 1 && (
                  <div className="absolute top-24 left-4 z-20 bg-black/50 backdrop-blur-sm rounded-lg px-3 py-2 flex items-center gap-2">
                    <Move className="w-4 h-4 text-emerald-400" />
                    <span className="text-white text-xs">Arrastra para mover</span>
                  </div>
                )}

                {/* Overlay con nombre de escena - se oculta si no están visibles los controles */}
                {virtualTourScenes[currentSceneIndex]?.name && showTourControls && (
                  <div
                    className={`absolute left-1/2 transform -translate-x-1/2 z-10 transition-all duration-300 ${showTourControls ? 'bottom-32 md:bottom-40' : 'bottom-8'}`}
                  >
                    <div className="bg-black/60 backdrop-blur-md rounded-2xl px-6 py-3 border border-white/10">
                      <p className="text-white font-medium text-center">
                        {virtualTourScenes[currentSceneIndex].name}
                      </p>
                      {virtualTourScenes[currentSceneIndex].description && (
                        <p className="text-slate-400 text-sm text-center mt-1">
                          {virtualTourScenes[currentSceneIndex].description}
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {/* Botones de navegación lateral */}
                <button
                  onClick={() => setCurrentSceneIndex(prev => Math.max(0, prev - 1))}
                  disabled={currentSceneIndex === 0}
                  className={`absolute left-4 top-1/2 -translate-y-1/2 z-10 p-3 md:p-4 rounded-full 
                    transition-all duration-300 ${
                      currentSceneIndex === 0
                        ? 'bg-white/5 cursor-not-allowed'
                        : 'bg-white/10 hover:bg-emerald-500/80 hover:scale-110 backdrop-blur-sm'
                    }`}
                >
                  <ChevronLeft
                    className={`w-6 h-6 md:w-8 md:h-8 ${currentSceneIndex === 0 ? 'text-slate-600' : 'text-white'}`}
                  />
                </button>

                <button
                  onClick={() =>
                    setCurrentSceneIndex(prev => Math.min(virtualTourScenes.length - 1, prev + 1))
                  }
                  disabled={currentSceneIndex === virtualTourScenes.length - 1}
                  className={`absolute right-4 top-1/2 -translate-y-1/2 z-10 p-3 md:p-4 rounded-full 
                    transition-all duration-300 ${
                      currentSceneIndex === virtualTourScenes.length - 1
                        ? 'bg-white/5 cursor-not-allowed'
                        : 'bg-white/10 hover:bg-emerald-500/80 hover:scale-110 backdrop-blur-sm'
                    }`}
                >
                  <ChevronRight
                    className={`w-6 h-6 md:w-8 md:h-8 ${currentSceneIndex === virtualTourScenes.length - 1 ? 'text-slate-600' : 'text-white'}`}
                  />
                </button>
              </div>

              {/* Footer con thumbnails y controles - Colapsable */}
              <div
                className={`absolute bottom-0 left-0 right-0 z-20 transition-all duration-500 ease-in-out ${showTourControls ? 'translate-y-0' : 'translate-y-[calc(100%-48px)]'}`}
              >
                {/* Botón para mostrar/ocultar controles */}
                <div className="flex justify-center -mb-1">
                  <button
                    onClick={() => setShowTourControls(!showTourControls)}
                    className="bg-black/70 hover:bg-black/90 backdrop-blur-sm px-4 py-1 rounded-t-xl transition-all duration-300 group"
                    title={showTourControls ? 'Ocultar controles' : 'Mostrar controles'}
                  >
                    <div className="flex items-center gap-2">
                      {showTourControls ? (
                        <>
                          <ChevronDown className="w-4 h-4 text-white group-hover:text-emerald-400 transition-colors" />
                          <span className="text-white text-xs hidden md:inline group-hover:text-emerald-400 transition-colors">
                            Ocultar
                          </span>
                        </>
                      ) : (
                        <>
                          <ChevronUp className="w-4 h-4 text-white group-hover:text-emerald-400 transition-colors" />
                          <span className="text-white text-xs hidden md:inline group-hover:text-emerald-400 transition-colors">
                            Mostrar escenas
                          </span>
                        </>
                      )}
                    </div>
                  </button>
                </div>

                <div className="bg-gradient-to-t from-black/95 via-black/85 to-black/70 backdrop-blur-sm">
                  <div className="p-4 md:p-6">
                    {/* Barra de progreso - siempre visible */}
                    <div className="w-full h-1 bg-white/20 rounded-full mb-4 overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-emerald-400 to-emerald-600 rounded-full transition-all duration-500"
                        style={{
                          width: `${((currentSceneIndex + 1) / virtualTourScenes.length) * 100}%`,
                        }}
                      />
                    </div>

                    {/* Thumbnails de escenas */}
                    <div
                      className={`transition-all duration-300 overflow-hidden ${showTourControls ? 'max-h-32 opacity-100' : 'max-h-0 opacity-0'}`}
                    >
                      <div className="flex gap-2 md:gap-3 overflow-x-auto pb-2 scrollbar-hide">
                        {virtualTourScenes.map((scene, index) => (
                          <button
                            key={scene.id || index}
                            onClick={() => setCurrentSceneIndex(index)}
                            className={`relative flex-shrink-0 group transition-all duration-300 ${
                              index === currentSceneIndex
                                ? 'ring-2 ring-emerald-400 ring-offset-2 ring-offset-black scale-105'
                                : 'opacity-60 hover:opacity-100'
                            }`}
                          >
                            <img
                              src={scene.thumbnailUrl || scene.imageUrl}
                              alt={scene.name || `Escena ${index + 1}`}
                              className="w-20 h-14 md:w-28 md:h-20 object-cover rounded-lg"
                            />
                            {/* Overlay con número */}
                            <div
                              className={`absolute inset-0 rounded-lg flex items-center justify-center 
                              transition-all duration-300 ${
                                index === currentSceneIndex
                                  ? 'bg-emerald-500/30'
                                  : 'bg-black/40 group-hover:bg-black/20'
                              }`}
                            >
                              <span
                                className={`text-sm font-bold ${index === currentSceneIndex ? 'text-white' : 'text-white/80'}`}
                              >
                                {index + 1}
                              </span>
                            </div>
                            {/* Nombre de escena en hover */}
                            {scene.name && (
                              <div
                                className="absolute -top-8 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 
                                transition-opacity duration-200 pointer-events-none"
                              >
                                <div className="bg-black/80 text-white text-xs px-2 py-1 rounded whitespace-nowrap">
                                  {scene.name}
                                </div>
                              </div>
                            )}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Controles adicionales */}
                    <div
                      className={`flex items-center justify-between transition-all duration-300 ${showTourControls ? 'mt-4' : 'mt-0'}`}
                    >
                      <div className="flex items-center gap-2 text-slate-400 text-sm">
                        <Info className="w-4 h-4" />
                        <span className="hidden md:inline">
                          {showTourControls
                            ? 'Usa scroll para zoom • Arrastra para mover'
                            : 'Escena ' +
                              (currentSceneIndex + 1) +
                              ' de ' +
                              virtualTourScenes.length}
                        </span>
                        <span className="md:hidden">
                          {showTourControls
                            ? 'Pellizca para zoom'
                            : currentSceneIndex + 1 + '/' + virtualTourScenes.length}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() =>
                            window.open(`/properties/${selectedPropertyForTour}`, '_blank')
                          }
                          className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-lg 
                            transition-all duration-300 hover:scale-105"
                        >
                          <Eye className="w-4 h-4" />
                          <span className="hidden md:inline">Ver Propiedad</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* Sin escenas disponibles */
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center max-w-md mx-auto px-4">
                <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-slate-800/50 flex items-center justify-center">
                  <Camera className="w-12 h-12 text-slate-500" />
                </div>
                <h3 className="text-2xl font-bold text-white mb-3">Tour Virtual No Disponible</h3>
                <p className="text-slate-400 mb-6">
                  Esta propiedad aún no tiene un tour virtual 360° configurado.
                </p>
                <div className="flex gap-3 justify-center">
                  <Button
                    variant="outline"
                    onClick={() => setSelectedPropertyForTour(null)}
                    className="border-slate-600 text-slate-300 hover:bg-slate-800"
                  >
                    Cerrar
                  </Button>
                  <Button
                    onClick={() => window.open(`/properties/${selectedPropertyForTour}`, '_blank')}
                    className="bg-emerald-500 hover:bg-emerald-600"
                  >
                    Ver Propiedad
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

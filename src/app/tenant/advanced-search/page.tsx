'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { logger } from '@/lib/logger';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Slider } from '@/components/ui/slider';
import { QuickActionButton } from '@/components/dashboard/QuickActionButton';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Building,
  AlertTriangle,
  AlertCircle,
  RefreshCw,
  CheckCircle,
  Clock,
  DollarSign,
  Info,
  Plus,
  Filter,
  Download,
  BarChart3,
  Settings,
  Search,
  MapPin,
  Bed,
  Bath,
  Car,
  Wifi,
  PawPrint,
  Heart,
  Star,
  Save,
  X,
  Calendar,
  Home,
  Eye,
  Share2,
  BookmarkPlus,
  SlidersHorizontal,
} from 'lucide-react';
import UnifiedDashboardLayout from '@/components/layout/UnifiedDashboardLayout';

interface Property {
  id: string;
  title: string;
  address: string;
  price: number;
  bedrooms: number;
  bathrooms: number;
  area: number;
  propertyType: string;
  images: string[];
  features: string[];
  description: string;
  availableDate: string;
  latitude?: number;
  longitude?: number;
}

interface SavedSearch {
  id: string;
  name: string;
  filters: SearchFilters;
  createdAt: string;
}

interface SearchFilters {
  location: string;
  priceRange: [number, number];
  propertyType: string;
  bedrooms: number;
  bathrooms: number;
  areaRange: [number, number];
  features: string[];
  furnished: boolean;
  petsAllowed: boolean;
  parking: boolean;
  elevator: boolean;
  balcony: boolean;
  garden: boolean;
  pool: boolean;
  gym: boolean;
  concierge: boolean;
}

export default function BúsquedaAvanzadaPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [properties, setProperties] = useState<Property[]>([]);
  const [filteredProperties, setFilteredProperties] = useState<Property[]>([]);
  const [savedSearches, setSavedSearches] = useState<SavedSearch[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('search');

  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [favoriteProperties, setFavoriteProperties] = useState<string[]>([]);
  const [compareProperties, setCompareProperties] = useState<string[]>([]);

  // Filters state
  const [filters, setFilters] = useState<SearchFilters>({
    location: '',
    priceRange: [0, 2000000],
    propertyType: '',
    bedrooms: 0,
    bathrooms: 0,
    areaRange: [0, 500],
    features: [],
    furnished: false,
    petsAllowed: false,
    parking: false,
    elevator: false,
    balcony: false,
    garden: false,
    pool: false,
    gym: false,
    concierge: false,
  });

  // Mock data
  const mockProperties: Property[] = [
    {
      id: '1',
      title: 'Moderno departamento en Las Condes',
      address: 'Las Condes, Santiago',
      price: 450000,
      bedrooms: 2,
      bathrooms: 1,
      area: 65,
      propertyType: 'DEPARTMENT',
      images: ['/placeholder-property.jpg'],
      features: ['parking', 'elevator', 'balcony'],
      description: 'Hermoso departamento moderno con vista a la ciudad.',
      availableDate: '2024-02-01',
    },
    {
      id: '2',
      title: 'Casa amplia en Vitacura',
      address: 'Vitacura, Santiago',
      price: 850000,
      bedrooms: 4,
      bathrooms: 3,
      area: 180,
      propertyType: 'HOUSE',
      images: ['/placeholder-property.jpg'],
      features: ['parking', 'garden', 'pool', 'pets_allowed'],
      description: 'Casa familiar espaciosa con jardín y piscina.',
      availableDate: '2024-02-15',
    },
    {
      id: '3',
      title: 'Estudio céntrico en Providencia',
      address: 'Providencia, Santiago',
      price: 280000,
      bedrooms: 1,
      bathrooms: 1,
      area: 35,
      propertyType: 'STUDIO',
      images: ['/placeholder-property.jpg'],
      features: ['furnished', 'concierge', 'gym'],
      description: 'Estudio moderno en el corazón de Providencia.',
      availableDate: '2024-01-20',
    },
  ];

  useEffect(() => {
    loadPageData();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [properties, filters, searchTerm]);

  const loadPageData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Load properties
      setProperties(mockProperties);

      // Load saved searches from localStorage
      const saved = localStorage.getItem('savedSearches');
      if (saved) {
        setSavedSearches(JSON.parse(saved));
      }

      logger.debug('Datos de búsqueda avanzada cargados');
    } catch (error) {
      logger.error('Error cargando datos de búsqueda avanzada:', {
        error: error instanceof Error ? error.message : String(error),
      });
      setError('Error al cargar los datos');
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = useCallback(() => {
    let filtered = [...properties];

    // Text search
    if (searchTerm) {
      filtered = filtered.filter(
        property =>
          property.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          property.address.toLowerCase().includes(searchTerm.toLowerCase()) ||
          property.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Location filter
    if (filters.location) {
      filtered = filtered.filter(property =>
        property.address.toLowerCase().includes(filters.location.toLowerCase())
      );
    }

    // Price range
    filtered = filtered.filter(
      property => property.price >= filters.priceRange[0] && property.price <= filters.priceRange[1]
    );

    // Property type
    if (filters.propertyType) {
      filtered = filtered.filter(property => property.propertyType === filters.propertyType);
    }

    // Bedrooms
    if (filters.bedrooms > 0) {
      filtered = filtered.filter(property => property.bedrooms >= filters.bedrooms);
    }

    // Bathrooms
    if (filters.bathrooms > 0) {
      filtered = filtered.filter(property => property.bathrooms >= filters.bathrooms);
    }

    // Area range
    filtered = filtered.filter(
      property => property.area >= filters.areaRange[0] && property.area <= filters.areaRange[1]
    );

    // Features
    if (filters.features.length > 0) {
      filtered = filtered.filter(property =>
        filters.features.every(feature => property.features.includes(feature))
      );
    }

    // Boolean features
    if (filters.furnished) {
      filtered = filtered.filter(property => property.features.includes('furnished'));
    }
    if (filters.petsAllowed) {
      filtered = filtered.filter(property => property.features.includes('pets_allowed'));
    }
    if (filters.parking) {
      filtered = filtered.filter(property => property.features.includes('parking'));
    }
    if (filters.elevator) {
      filtered = filtered.filter(property => property.features.includes('elevator'));
    }
    if (filters.balcony) {
      filtered = filtered.filter(property => property.features.includes('balcony'));
    }
    if (filters.garden) {
      filtered = filtered.filter(property => property.features.includes('garden'));
    }
    if (filters.pool) {
      filtered = filtered.filter(property => property.features.includes('pool'));
    }
    if (filters.gym) {
      filtered = filtered.filter(property => property.features.includes('gym'));
    }
    if (filters.concierge) {
      filtered = filtered.filter(property => property.features.includes('concierge'));
    }

    setFilteredProperties(filtered);
  }, [properties, filters, searchTerm]);

  const handleSaveSearch = useCallback(() => {
    const newSearch: SavedSearch = {
      id: Date.now().toString(),
      name: `Búsqueda ${new Date().toLocaleDateString('es-CL')}`,
      filters: { ...filters },
      createdAt: new Date().toISOString(),
    };

    const updatedSearches = [...savedSearches, newSearch];
    setSavedSearches(updatedSearches);
    localStorage.setItem('savedSearches', JSON.stringify(updatedSearches));

    setSuccessMessage('Búsqueda guardada exitosamente');
    setTimeout(() => setSuccessMessage(''), 3000);
  }, [filters, savedSearches]);

  const handleLoadSavedSearch = useCallback((search: SavedSearch) => {
    setFilters(search.filters);
    setActiveTab('search');
  }, []);

  const handleDeleteSavedSearch = useCallback(
    (searchId: string) => {
      const updatedSearches = savedSearches.filter(search => search.id !== searchId);
      setSavedSearches(updatedSearches);
      localStorage.setItem('savedSearches', JSON.stringify(updatedSearches));
    },
    [savedSearches]
  );

  const handleResetFilters = useCallback(() => {
    setFilters({
      location: '',
      priceRange: [0, 2000000],
      propertyType: '',
      bedrooms: 0,
      bathrooms: 0,
      areaRange: [0, 500],
      features: [],
      furnished: false,
      petsAllowed: false,
      parking: false,
      elevator: false,
      balcony: false,
      garden: false,
      pool: false,
      gym: false,
      concierge: false,
    });
    setSearchTerm('');
  }, []);

  const handleViewProperty = useCallback(
    (propertyId: string) => {
      router.push(`/properties/${propertyId}`);
    },
    [router]
  );

  const handleContactOwner = useCallback(
    (property: Property) => {
      // Crear conversación con el propietario usando el sistema de mensajería
      const recipientData = {
        id: `owner_${property.id}`,
        name: 'Propietario',
        email: 'owner@example.com',
        type: 'owner' as const,
        propertyId: property.id,
        propertyTitle: property.title,
        propertyAddress: property.address,
      };

      sessionStorage.setItem('newMessageRecipient', JSON.stringify(recipientData));
      router.push('/tenant/messages?new=true');
    },
    [router]
  );

  const handleExportResults = useCallback(() => {
    const csvContent = [
      ['Título', 'Dirección', 'Precio', 'Dormitorios', 'Baños', 'Área', 'Tipo'],
      ...filteredProperties.map(property => [
        property.title,
        property.address,
        property.price.toString(),
        property.bedrooms.toString(),
        property.bathrooms.toString(),
        property.area.toString(),
        property.propertyType,
      ]),
    ];

    const csvString = csvContent.map(row => row.join(',')).join('\n');
    const blob = new Blob([csvString], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'resultados-busqueda.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  }, [filteredProperties]);

  const handleToggleFavorite = useCallback((propertyId: string) => {
    setFavoriteProperties(prev =>
      prev.includes(propertyId) ? prev.filter(id => id !== propertyId) : [...prev, propertyId]
    );
    setSuccessMessage(prev.includes(propertyId) ? 'Removido de favoritos' : 'Agregado a favoritos');
    setTimeout(() => setSuccessMessage(''), 2000);
  }, []);

  const handleToggleCompare = useCallback((propertyId: string) => {
    setCompareProperties(prev => {
      if (prev.includes(propertyId)) {
        return prev.filter(id => id !== propertyId);
      } else if (prev.length < 3) {
        return [...prev, propertyId];
      } else {
        setErrorMessage('Solo puedes comparar hasta 3 propiedades a la vez');
        setTimeout(() => setErrorMessage(''), 3000);
        return prev;
      }
    });
  }, []);

  const handleCompareSelected = useCallback(() => {
    if (compareProperties.length < 2) {
      setErrorMessage('Selecciona al menos 2 propiedades para comparar');
      setTimeout(() => setErrorMessage(''), 3000);
      return;
    }

    const compareData = {
      properties: compareProperties,
      timestamp: new Date().toISOString(),
    };

    sessionStorage.setItem('propertyComparison', JSON.stringify(compareData));
    router.push('/tenant/property-comparison');
  }, [compareProperties, router]);

  if (loading) {
    return (
      <UnifiedDashboardLayout title="Búsqueda Avanzada" subtitle="Cargando información...">
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
      <UnifiedDashboardLayout title="Búsqueda Avanzada" subtitle="Error al cargar la página">
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
      title="Búsqueda Avanzada"
      subtitle="Encuentra la propiedad perfecta con filtros detallados"
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

        {/* Statistics Header */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Propiedades</CardTitle>
              <Building className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{properties.length}</div>
              <p className="text-xs text-muted-foreground">Disponibles para búsqueda</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Resultados</CardTitle>
              <Search className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{filteredProperties.length}</div>
              <p className="text-xs text-muted-foreground">Coinciden con filtros</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Búsquedas Guardadas</CardTitle>
              <BookmarkPlus className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{savedSearches.length}</div>
              <p className="text-xs text-muted-foreground">Consultas favoritas</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Precio Promedio</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                $
                {filteredProperties.length > 0
                  ? Math.round(
                      filteredProperties.reduce((sum, p) => sum + p.price, 0) /
                        filteredProperties.length
                    ).toLocaleString()
                  : 0}
              </div>
              <p className="text-xs text-muted-foreground">Por mes</p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content with Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="search">Buscar Propiedades</TabsTrigger>
            <TabsTrigger value="saved">Búsquedas Guardadas</TabsTrigger>
            <TabsTrigger value="filters">Configurar Filtros</TabsTrigger>
          </TabsList>

          {/* Search Tab */}
          <TabsContent value="search" className="space-y-6">
            {/* Search Bar */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex gap-4">
                  <div className="flex-1">
                    <Input
                      placeholder="Buscar por título, dirección o descripción..."
                      value={searchTerm}
                      onChange={e => setSearchTerm(e.target.value)}
                      className="w-full"
                    />
                  </div>
                  <Button variant="outline" onClick={() => setShowFilters(!showFilters)}>
                    <SlidersHorizontal className="w-4 h-4 mr-2" />
                    {showFilters ? 'Ocultar Filtros' : 'Mostrar Filtros'}
                  </Button>
                  <Button onClick={handleSaveSearch}>
                    <Save className="w-4 h-4 mr-2" />
                    Guardar Búsqueda
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Filters Panel */}
            {showFilters && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    Filtros Avanzados
                    <Button variant="ghost" size="sm" onClick={handleResetFilters}>
                      <X className="w-4 h-4" />
                      Limpiar
                    </Button>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <div className="space-y-2">
                      <Label>Ubicación</Label>
                      <Input
                        placeholder="Ej: Las Condes, Santiago"
                        value={filters.location}
                        onChange={e => setFilters({ ...filters, location: e.target.value })}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Tipo de Propiedad</Label>
                      <Select
                        value={filters.propertyType}
                        onValueChange={value => setFilters({ ...filters, propertyType: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccionar tipo" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="">Todos</SelectItem>
                          <SelectItem value="DEPARTMENT">Departamento</SelectItem>
                          <SelectItem value="HOUSE">Casa</SelectItem>
                          <SelectItem value="STUDIO">Estudio</SelectItem>
                          <SelectItem value="APARTMENT">Apartamento</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Dormitorios (mínimo)</Label>
                      <Select
                        value={filters.bedrooms.toString()}
                        onValueChange={value =>
                          setFilters({ ...filters, bedrooms: parseInt(value) || 0 })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="0">Cualquiera</SelectItem>
                          <SelectItem value="1">1+</SelectItem>
                          <SelectItem value="2">2+</SelectItem>
                          <SelectItem value="3">3+</SelectItem>
                          <SelectItem value="4">4+</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Baños (mínimo)</Label>
                      <Select
                        value={filters.bathrooms.toString()}
                        onValueChange={value =>
                          setFilters({ ...filters, bathrooms: parseInt(value) || 0 })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="0">Cualquiera</SelectItem>
                          <SelectItem value="1">1+</SelectItem>
                          <SelectItem value="2">2+</SelectItem>
                          <SelectItem value="3">3+</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Rango de Precio</Label>
                      <div className="space-y-2">
                        <Slider
                          value={filters.priceRange}
                          onValueChange={value =>
                            setFilters({ ...filters, priceRange: value as [number, number] })
                          }
                          max={2000000}
                          min={0}
                          step={50000}
                          className="w-full"
                        />
                        <div className="flex justify-between text-sm text-gray-600">
                          <span>${filters.priceRange[0].toLocaleString()}</span>
                          <span>${filters.priceRange[1].toLocaleString()}</span>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Rango de Área (m²)</Label>
                      <div className="space-y-2">
                        <Slider
                          value={filters.areaRange}
                          onValueChange={value =>
                            setFilters({ ...filters, areaRange: value as [number, number] })
                          }
                          max={500}
                          min={0}
                          step={10}
                          className="w-full"
                        />
                        <div className="flex justify-between text-sm text-gray-600">
                          <span>{filters.areaRange[0]} m²</span>
                          <span>{filters.areaRange[1]} m²</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-6">
                    <Label className="text-base font-medium mb-3 block">Características</Label>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="furnished"
                          checked={filters.furnished}
                          onCheckedChange={checked =>
                            setFilters({ ...filters, furnished: checked as boolean })
                          }
                        />
                        <Label htmlFor="furnished" className="text-sm">
                          Amoblado
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="petsAllowed"
                          checked={filters.petsAllowed}
                          onCheckedChange={checked =>
                            setFilters({ ...filters, petsAllowed: checked as boolean })
                          }
                        />
                        <Label htmlFor="petsAllowed" className="text-sm">
                          Mascotas
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="parking"
                          checked={filters.parking}
                          onCheckedChange={checked =>
                            setFilters({ ...filters, parking: checked as boolean })
                          }
                        />
                        <Label htmlFor="parking" className="text-sm">
                          Estacionamiento
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="elevator"
                          checked={filters.elevator}
                          onCheckedChange={checked =>
                            setFilters({ ...filters, elevator: checked as boolean })
                          }
                        />
                        <Label htmlFor="elevator" className="text-sm">
                          Ascensor
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="balcony"
                          checked={filters.balcony}
                          onCheckedChange={checked =>
                            setFilters({ ...filters, balcony: checked as boolean })
                          }
                        />
                        <Label htmlFor="balcony" className="text-sm">
                          Balcón
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="garden"
                          checked={filters.garden}
                          onCheckedChange={checked =>
                            setFilters({ ...filters, garden: checked as boolean })
                          }
                        />
                        <Label htmlFor="garden" className="text-sm">
                          Jardín
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="pool"
                          checked={filters.pool}
                          onCheckedChange={checked =>
                            setFilters({ ...filters, pool: checked as boolean })
                          }
                        />
                        <Label htmlFor="pool" className="text-sm">
                          Piscina
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="gym"
                          checked={filters.gym}
                          onCheckedChange={checked =>
                            setFilters({ ...filters, gym: checked as boolean })
                          }
                        />
                        <Label htmlFor="gym" className="text-sm">
                          Gimnasio
                        </Label>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Results */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  Resultados de Búsqueda ({filteredProperties.length})
                  {filteredProperties.length > 0 && (
                    <Button variant="outline" size="sm" onClick={handleExportResults}>
                      <Download className="w-4 h-4 mr-2" />
                      Exportar
                    </Button>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {filteredProperties.length === 0 ? (
                  <div className="text-center py-12">
                    <Search className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      No se encontraron propiedades
                    </h3>
                    <p className="text-gray-600 mb-4">
                      Intenta ajustar tus filtros o búsqueda para encontrar más resultados.
                    </p>
                    <Button onClick={handleResetFilters}>Limpiar Filtros</Button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredProperties.map(property => (
                      <Card key={property.id} className="hover:shadow-lg transition-shadow">
                        <CardContent className="p-0">
                          <div className="relative">
                            <img
                              src={property.images[0] || '/placeholder-property.jpg'}
                              alt={property.title}
                              className="w-full h-48 object-cover rounded-t-lg"
                            />
                            <div className="absolute top-2 right-2 flex gap-2">
                              <Button
                                variant="secondary"
                                size="sm"
                                onClick={() => handleToggleFavorite(property.id)}
                                className={
                                  favoriteProperties.includes(property.id)
                                    ? 'bg-red-500 text-white'
                                    : ''
                                }
                              >
                                <Heart
                                  className={`w-4 h-4 ${favoriteProperties.includes(property.id) ? 'fill-current' : ''}`}
                                />
                              </Button>
                              <Button
                                variant="secondary"
                                size="sm"
                                onClick={() => handleToggleCompare(property.id)}
                                className={
                                  compareProperties.includes(property.id)
                                    ? 'bg-blue-500 text-white'
                                    : ''
                                }
                              >
                                <BarChart3 className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                          <div className="p-4">
                            <h3 className="font-semibold text-lg mb-2">{property.title}</h3>
                            <div className="flex items-center text-gray-600 mb-2">
                              <MapPin className="w-4 h-4 mr-1" />
                              {property.address}
                            </div>
                            <div className="flex items-center justify-between mb-3">
                              <span className="text-2xl font-bold text-blue-600">
                                ${property.price.toLocaleString()}
                              </span>
                              <span className="text-sm text-gray-600">/mes</span>
                            </div>
                            <div className="flex items-center gap-4 text-sm text-gray-600 mb-4">
                              <div className="flex items-center">
                                <Bed className="w-4 h-4 mr-1" />
                                {property.bedrooms}
                              </div>
                              <div className="flex items-center">
                                <Bath className="w-4 h-4 mr-1" />
                                {property.bathrooms}
                              </div>
                              <div className="flex items-center">
                                <Home className="w-4 h-4 mr-1" />
                                {property.area}m²
                              </div>
                            </div>
                            <div className="flex flex-wrap gap-1 mb-4">
                              {property.features.slice(0, 3).map(feature => (
                                <Badge key={feature} variant="secondary" className="text-xs">
                                  {feature.replace('_', ' ')}
                                </Badge>
                              ))}
                              {property.features.length > 3 && (
                                <Badge variant="outline" className="text-xs">
                                  +{property.features.length - 3}
                                </Badge>
                              )}
                            </div>
                            <div className="flex gap-2">
                              <Button
                                className="flex-1"
                                onClick={() => handleViewProperty(property.id)}
                              >
                                <Eye className="w-4 h-4 mr-2" />
                                Ver Detalles
                              </Button>
                              <Button
                                variant="outline"
                                onClick={() => handleContactOwner(property)}
                              >
                                <Share2 className="w-4 h-4 mr-2" />
                                Contactar
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Comparison Banner */}
            {compareProperties.length > 0 && (
              <div className="fixed bottom-4 right-4 bg-blue-600 text-white p-4 rounded-lg shadow-lg z-50">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-2">
                    <BarChart3 className="w-5 h-5" />
                    <span>{compareProperties.length} propiedad(es) seleccionada(s)</span>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="secondary" size="sm" onClick={() => setCompareProperties([])}>
                      Limpiar
                    </Button>
                    <Button size="sm" onClick={handleCompareSelected}>
                      Comparar
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </TabsContent>

          {/* Saved Searches Tab */}
          <TabsContent value="saved">
            <Card>
              <CardHeader>
                <CardTitle>Búsquedas Guardadas</CardTitle>
                <CardDescription>Accede rápidamente a tus búsquedas favoritas</CardDescription>
              </CardHeader>
              <CardContent>
                {savedSearches.length === 0 ? (
                  <div className="text-center py-12">
                    <BookmarkPlus className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      No hay búsquedas guardadas
                    </h3>
                    <p className="text-gray-600 mb-4">
                      Guarda tus búsquedas favoritas para acceder rápidamente a ellas.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {savedSearches.map(search => (
                      <Card key={search.id} className="hover:bg-gray-50 transition-colors">
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <h4 className="font-medium">{search.name}</h4>
                              <p className="text-sm text-gray-600 mt-1">
                                {search.filters.location && `${search.filters.location} • `}
                                {search.filters.propertyType && `${search.filters.propertyType} • `}
                                {search.filters.bedrooms > 0 &&
                                  `${search.filters.bedrooms}+ dorm • `}
                                ${search.filters.priceRange[0].toLocaleString()} - $
                                {search.filters.priceRange[1].toLocaleString()}
                              </p>
                              <p className="text-xs text-gray-500 mt-1">
                                Guardada el {new Date(search.createdAt).toLocaleDateString('es-CL')}
                              </p>
                            </div>
                            <div className="flex gap-2">
                              <Button size="sm" onClick={() => handleLoadSavedSearch(search)}>
                                Cargar
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleDeleteSavedSearch(search.id)}
                              >
                                <X className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Filters Configuration Tab */}
          <TabsContent value="filters">
            <Card>
              <CardHeader>
                <CardTitle>Configuración de Filtros</CardTitle>
                <CardDescription>
                  Personaliza tus preferencias de búsqueda predeterminadas
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div>
                    <h4 className="font-medium mb-4">Filtros Rápidos</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Button
                        variant="outline"
                        onClick={() => {
                          setFilters({
                            ...filters,
                            priceRange: [0, 500000],
                            propertyType: 'DEPARTMENT',
                          });
                          setActiveTab('search');
                        }}
                      >
                        Presupuesto Bajo
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => {
                          setFilters({
                            ...filters,
                            bedrooms: 2,
                            bathrooms: 1,
                            parking: true,
                          });
                          setActiveTab('search');
                        }}
                      >
                        Familia Pequeña
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => {
                          setFilters({
                            ...filters,
                            furnished: true,
                            propertyType: 'STUDIO',
                          });
                          setActiveTab('search');
                        }}
                      >
                        Estudiantes
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => {
                          setFilters({
                            ...filters,
                            petsAllowed: true,
                            garden: true,
                          });
                          setActiveTab('search');
                        }}
                      >
                        Con Mascotas
                      </Button>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium mb-4">Ubicaciones Favoritas</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {['Las Condes', 'Vitacura', 'Providencia', 'Ñuñoa'].map(location => (
                        <Button
                          key={location}
                          variant="outline"
                          onClick={() => {
                            setFilters({ ...filters, location });
                            setActiveTab('search');
                          }}
                        >
                          <MapPin className="w-4 h-4 mr-2" />
                          {location}
                        </Button>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Acciones Rápidas</CardTitle>
            <CardDescription>Funciones adicionales para gestionar tus búsquedas</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <QuickActionButton
                icon={Search}
                label="Nueva Búsqueda"
                description="Iniciar búsqueda limpia"
                onClick={() => {
                  handleResetFilters();
                  setSearchTerm('');
                  setActiveTab('search');
                }}
              />

              <QuickActionButton
                icon={Download}
                label="Exportar Resultados"
                description="Descargar como CSV"
                onClick={handleExportResults}
              />

              <QuickActionButton
                icon={BarChart3}
                label="Ver Estadísticas"
                description="Análisis de mercado"
                onClick={() => router.push('/properties/search')}
              />

              <QuickActionButton
                icon={BookmarkPlus}
                label="Búsquedas Guardadas"
                description="Ver búsquedas favoritas"
                onClick={() => setActiveTab('saved')}
              />

              <QuickActionButton
                icon={Settings}
                label="Preferencias"
                description="Configurar búsqueda"
                onClick={() => setActiveTab('filters')}
              />

              <QuickActionButton
                icon={RefreshCw}
                label="Actualizar Datos"
                description="Recargar propiedades"
                onClick={loadPageData}
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </UnifiedDashboardLayout>
  );
}

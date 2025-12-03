'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { logger } from '@/lib/logger-minimal';
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

interface AdvancedSearchProperty {
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
  ownerId?: string;
  ownerName?: string;
  ownerEmail?: string;
  status?: string;
  brokerId?: string;
  brokerName?: string;
  brokerEmail?: string;
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
  const [properties, setProperties] = useState<AdvancedSearchProperty[]>([]);
  const [filteredProperties, setFilteredProperties] = useState<AdvancedSearchProperty[]>([]);
  const [savedSearches, setSavedSearches] = useState<SavedSearch[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('search');

  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [favoriteProperties, setFavoriteProperties] = useState<string[]>([]);
  const [favoritePropertiesFull, setFavoritePropertiesFull] = useState<AdvancedSearchProperty[]>(
    []
  );
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

  useEffect(() => {
    loadPageData();

    // Restaurar estado de búsqueda si existe
    const savedState = sessionStorage.getItem('advancedSearchState');
    if (savedState) {
      try {
        const state = JSON.parse(savedState);
        setFilters(state.filters || filters);
        setSearchTerm(state.searchTerm || '');
        setActiveTab(state.activeTab || 'search');
        setFavoriteProperties(state.favoriteProperties || []);
        setCompareProperties(state.compareProperties || []);
        // Limpiar el estado guardado después de restaurarlo
        sessionStorage.removeItem('advancedSearchState');
      } catch (e) {
        logger.warn('Error restaurando estado de búsqueda:', e);
      }
    }
  }, []);

  useEffect(() => {
    applyFilters();
  }, [properties, filters, searchTerm]);

  const loadFavoriteProperties = async () => {
    try {
      const response = await fetch('/api/users/favorites', {
        method: 'GET',
        credentials: 'include',
        headers: {
          Accept: 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data) {
          const favoriteIds = data.data.map(
            (fav: any) => fav.id || fav.propertyId || fav.property?.id
          );
          setFavoriteProperties(favoriteIds);

          // Transformar las propiedades favoritas al formato esperado
          const transformedFavorites: AdvancedSearchProperty[] = data.data.map((fav: any) => ({
            id: fav.id || fav.propertyId || fav.property?.id,
            title: fav.title || fav.property?.title || 'Sin título',
            address: fav.address || fav.property?.address || '',
            price: fav.price || fav.property?.price || 0,
            bedrooms: fav.bedrooms || fav.property?.bedrooms || 0,
            bathrooms: fav.bathrooms || fav.property?.bathrooms || 0,
            area: fav.area || fav.property?.area || 0,
            propertyType: fav.type || fav.property?.type || '',
            images: Array.isArray(fav.images)
              ? fav.images
              : fav.images
                ? JSON.parse(fav.images)
                : ['/placeholder-property.jpg'],
            features: [],
            description: '',
            availableDate: new Date().toISOString().split('T')[0],
            latitude: undefined,
            longitude: undefined,
            ownerId: undefined,
            ownerName: undefined,
            ownerEmail: undefined,
            status: fav.status || fav.property?.status || 'AVAILABLE',
            brokerId: undefined,
            brokerName: undefined,
            brokerEmail: undefined,
          }));

          setFavoritePropertiesFull(transformedFavorites);
        }
      }
    } catch (error) {
      logger.error('Error cargando propiedades favoritas:', error);
    }
  };

  const loadPageData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Cargar propiedades favoritas
      await loadFavoriteProperties();

      logger.info('Iniciando carga de propiedades', {
        endpoint: '/api/properties?limit=50&status=AVAILABLE&includeManaged=true',
      });

      // Cargar propiedades reales desde la API
      const response = await fetch(
        '/api/properties?limit=50&status=AVAILABLE&includeManaged=true',
        {
          method: 'GET',
          credentials: 'include',
          headers: {
            Accept: 'application/json',
            'Cache-Control': 'no-cache',
          },
        }
      );

      logger.info('Respuesta de API de propiedades recibida', {
        status: response.status,
        ok: response.ok,
        statusText: response.statusText,
      });

      if (!response.ok) {
        const errorText = await response.text();
        logger.error('Error en respuesta de API de propiedades', {
          status: response.status,
          statusText: response.statusText,
          errorText,
        });
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      logger.info('Datos de propiedades recibidos', {
        hasProperties: !!data.properties,
        propertiesCount: data.properties?.length || 0,
        dataKeys: Object.keys(data),
      });

      // Transformar datos de la API al formato esperado
      const transformedProperties: AdvancedSearchProperty[] =
        data.properties?.map((prop: any) => ({
          id: prop.id,
          title: prop.title,
          address: prop.address,
          price: prop.price,
          bedrooms: prop.bedrooms,
          bathrooms: prop.bathrooms,
          area: prop.area,
          propertyType: prop.type,
          images: prop.images || ['/placeholder-property.jpg'],
          features: prop.features || [],
          description: prop.description,
          availableDate: prop.availableFrom || new Date().toISOString().split('T')[0],
          latitude: prop.latitude,
          longitude: prop.longitude,
          ownerId: prop.ownerId,
          ownerName:
            prop.owner?.name || prop.owner?.firstName + ' ' + prop.owner?.lastName || 'Propietario',
          ownerEmail: prop.owner?.email || '',
          status: prop.status,
          brokerId: prop.brokerId,
          brokerName:
            prop.broker?.name || prop.broker?.firstName + ' ' + prop.broker?.lastName || 'Broker',
          brokerEmail: prop.broker?.email || '',
        })) || [];

      logger.info('Propiedades transformadas', {
        totalProperties: transformedProperties.length,
        propertiesWithOwner: transformedProperties.filter(p => p.ownerId).length,
        propertiesWithOwnerEmail: transformedProperties.filter(p => p.ownerEmail).length,
        propertiesWithBroker: transformedProperties.filter(p => p.brokerId).length,
        propertiesWithBrokerEmail: transformedProperties.filter(p => p.brokerEmail).length,
        managedProperties: transformedProperties.filter(p => p.status === 'MANAGED').length,
        managedPropertiesWithBroker: transformedProperties.filter(
          p => p.status === 'MANAGED' && p.brokerId
        ).length,
      });

      setProperties(transformedProperties);

      // Load saved searches from localStorage
      const saved = localStorage.getItem('savedSearches');
      if (saved) {
        setSavedSearches(JSON.parse(saved));
      }

      logger.debug('Datos de búsqueda avanzada cargados', {
        propertiesCount: transformedProperties.length,
      });
    } catch (error) {
      logger.error('Error cargando datos de búsqueda avanzada:', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      });
      setError('Error al cargar los datos');

      // En caso de error, mostrar datos vacíos
      setProperties([]);
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
      // Guardar el estado de búsqueda actual antes de navegar
      const searchState = {
        filters,
        searchTerm,
        activeTab,
        favoriteProperties,
        compareProperties,
      };
      sessionStorage.setItem('advancedSearchState', JSON.stringify(searchState));
      router.push(`/properties/${propertyId}`);
    },
    [router, filters, searchTerm, activeTab, favoriteProperties, compareProperties]
  );

  const handleContactOwner = useCallback(
    async (property: AdvancedSearchProperty) => {
      try {
        logger.info('Iniciando contacto con propietario', {
          propertyId: property.id,
          hasOwnerId: !!property.ownerId,
          hasOwnerEmail: !!property.ownerEmail,
        });

        // Determinar si contactar al propietario o al broker
        const isManagedProperty = property.status === 'MANAGED' && property.brokerId;
        logger.info('🔍 [CONTACT] Evaluando tipo de contacto para propiedad', {
          propertyId: property.id,
          propertyTitle: property.title,
          fullProperty: property, // Ver todos los campos disponibles
          status: property.status,
          brokerId: property.brokerId,
          brokerName: property.brokerName,
          brokerEmail: property.brokerEmail,
          ownerId: property.ownerId,
          ownerName: property.ownerName,
          ownerEmail: property.ownerEmail,
          isManagedProperty,
          hasOwnerInfo: !!(property.ownerId || property.ownerName),
          hasBrokerInfo: !!(property.brokerId || property.brokerName),
        });

        // Si es una propiedad managed y tenemos info del broker, contactar directamente al broker
        if (isManagedProperty && property.brokerId && property.brokerName) {
          logger.info('Contactando al broker directamente (info disponible)', {
            propertyId: property.id,
            brokerId: property.brokerId,
            brokerName: property.brokerName,
          });

          const recipientData = {
            id: property.brokerId,
            name: property.brokerName,
            email: property.brokerEmail || '',
            type: 'broker' as const,
            propertyId: property.id,
            propertyTitle: property.title,
            propertyAddress: property.address,
          };

          sessionStorage.setItem('newMessageRecipient', JSON.stringify(recipientData));
          router.push('/tenant/messages?new=true');
          return;
        }

        // Si no tenemos la información necesaria, obtenerla de la API
        if ((!property.ownerId || !property.ownerEmail) && !isManagedProperty) {
          logger.info('Obteniendo información del propietario desde API', {
            propertyId: property.id,
          });

          const response = await fetch(`/api/properties/${property.id}`, {
            method: 'GET',
            credentials: 'include',
            headers: {
              Accept: 'application/json',
            },
          });

          logger.info('Respuesta de API recibida', {
            propertyId: property.id,
            status: response.status,
            ok: response.ok,
          });

          if (response.ok) {
            const propertyData = await response.json();
            logger.info('Datos de propiedad recibidos', {
              propertyId: property.id,
              hasOwner: !!propertyData.owner,
              hasPropertyOwner: !!propertyData.property?.owner,
              hasBroker: !!propertyData.broker,
              propertyDataKeys: Object.keys(propertyData),
            });

            // Para propiedades managed, contactar al broker
            if (isManagedProperty && propertyData.broker) {
              logger.info('Contactando al broker para propiedad managed', {
                propertyId: property.id,
                brokerId: propertyData.broker.id,
                brokerName: propertyData.broker.name,
              });

              const recipientData = {
                id: propertyData.broker.id,
                name: propertyData.broker.name || 'Broker',
                email: propertyData.broker.email || '',
                type: 'broker' as const,
                propertyId: property.id,
                propertyTitle: property.title,
                propertyAddress: property.address,
              };

              sessionStorage.setItem('newMessageRecipient', JSON.stringify(recipientData));
              router.push('/tenant/messages?new=true');
              return;
            }

            const ownerInfo = propertyData.owner || propertyData.property?.owner;

            if (ownerInfo) {
              logger.info('Información del propietario encontrada', {
                propertyId: property.id,
                ownerId: ownerInfo.id,
                ownerName: ownerInfo.name,
                ownerEmail: ownerInfo.email,
              });

              const recipientData = {
                id: ownerInfo.id,
                name:
                  ownerInfo.name ||
                  `${ownerInfo.firstName || ''} ${ownerInfo.lastName || ''}`.trim() ||
                  'Propietario',
                email: ownerInfo.email || '',
                type: 'owner' as const,
                propertyId: property.id,
                propertyTitle: property.title,
                propertyAddress: property.address,
              };

              sessionStorage.setItem('newMessageRecipient', JSON.stringify(recipientData));
              router.push('/tenant/messages?new=true');
              return;
            } else {
              logger.warn('No se encontró información del propietario en la respuesta', {
                propertyId: property.id,
                propertyData,
              });
            }
          } else {
            const errorText = await response.text();
            logger.error('Error en respuesta de API', {
              propertyId: property.id,
              status: response.status,
              statusText: response.statusText,
              errorText,
            });
          }
        }

        // Usar la información del propietario que ya tenemos
        logger.info('Usando información del propietario existente', {
          propertyId: property.id,
          ownerId: property.ownerId,
          ownerName: property.ownerName,
          ownerEmail: property.ownerEmail,
        });

        const recipientData = {
          id: property.ownerId || `owner_${property.id}`,
          name: property.ownerName || 'Propietario',
          email: property.ownerEmail || '',
          type: 'owner' as const,
          propertyId: property.id,
          propertyTitle: property.title,
          propertyAddress: property.address,
        };

        sessionStorage.setItem('newMessageRecipient', JSON.stringify(recipientData));
        router.push('/tenant/messages?new=true');
      } catch (error) {
        logger.error('Error al obtener información del propietario:', {
          error: error instanceof Error ? error.message : String(error),
          propertyId: property.id,
          stack: error instanceof Error ? error.stack : undefined,
        });

        // Fallback con datos básicos
        const recipientData = {
          id: `owner_${property.id}`,
          name: 'Propietario',
          email: '',
          type: 'owner' as const,
          propertyId: property.id,
          propertyTitle: property.title,
          propertyAddress: property.address,
        };

        sessionStorage.setItem('newMessageRecipient', JSON.stringify(recipientData));
        router.push('/tenant/messages?new=true');
      }
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

  const handleToggleFavorite = useCallback(
    async (propertyId: string) => {
      const isCurrentlyFavorite = favoriteProperties.includes(propertyId);

      try {
        if (isCurrentlyFavorite) {
          // Eliminar de favoritos
          const response = await fetch(`/api/users/favorites?propertyId=${propertyId}`, {
            method: 'DELETE',
            credentials: 'include',
          });

          if (response.ok) {
            setFavoriteProperties(prev => prev.filter(id => id !== propertyId));
            // Actualizar propiedades favoritas completas
            setFavoritePropertiesFull(prev => prev.filter(p => p.id !== propertyId));
            setSuccessMessage('Removido de favoritos');
            setTimeout(() => setSuccessMessage(''), 2000);
          } else {
            const error = await response.json();
            logger.error('Error removing favorite:', error);
            setErrorMessage('Error al remover de favoritos');
            setTimeout(() => setErrorMessage(''), 3000);
          }
        } else {
          // Agregar a favoritos
          const response = await fetch('/api/users/favorites', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            credentials: 'include',
            body: JSON.stringify({ propertyId }),
          });

          if (response.ok) {
            setFavoriteProperties(prev => [...prev, propertyId]);
            // Recargar propiedades favoritas completas
            await loadFavoriteProperties();
            setSuccessMessage('Agregado a favoritos');
            setTimeout(() => setSuccessMessage(''), 2000);
          } else {
            const error = await response.json();
            logger.error('Error adding favorite:', error);
            setErrorMessage('Error al agregar a favoritos');
            setTimeout(() => setErrorMessage(''), 3000);
          }
        }
      } catch (error) {
        logger.error('Error toggling favorite:', error);
        setErrorMessage('Error al actualizar favoritos');
        setTimeout(() => setErrorMessage(''), 3000);
      }
    },
    [favoriteProperties]
  );

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
          <TabsContent value="saved" className="space-y-6">
            {/* Propiedades Favoritas */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Heart className="w-5 h-5 text-red-500" />
                  Propiedades Favoritas
                </CardTitle>
                <CardDescription>Propiedades que has guardado como favoritas</CardDescription>
              </CardHeader>
              <CardContent>
                {favoritePropertiesFull.length === 0 ? (
                  <div className="text-center py-12">
                    <Heart className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      No hay propiedades favoritas
                    </h3>
                    <p className="text-gray-600 mb-4">
                      Marca propiedades como favoritas usando el botón del corazón para verlas aquí.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {favoritePropertiesFull.map(property => (
                      <Card key={property.id} className="hover:shadow-lg transition-shadow">
                        <CardContent className="p-0">
                          <div className="relative">
                            <img
                              src={property.images[0] || '/placeholder-property.jpg'}
                              alt={property.title}
                              className="w-full h-48 object-cover rounded-t-lg"
                            />
                            <div className="absolute top-2 right-2">
                              <Button
                                variant="secondary"
                                size="sm"
                                onClick={() => handleToggleFavorite(property.id)}
                                className="bg-red-500 text-white hover:bg-red-600"
                              >
                                <Heart className="w-4 h-4 fill-current" />
                              </Button>
                            </div>
                          </div>
                          <div className="p-4">
                            <h3 className="font-semibold text-lg mb-1 line-clamp-1">
                              {property.title}
                            </h3>
                            <p className="text-sm text-gray-600 mb-2 flex items-center gap-1">
                              <MapPin className="w-4 h-4" />
                              {property.address}
                            </p>
                            <div className="flex items-center gap-4 mb-3 text-sm text-gray-600">
                              <span className="flex items-center gap-1">
                                <Bed className="w-4 h-4" />
                                {property.bedrooms}
                              </span>
                              <span className="flex items-center gap-1">
                                <Bath className="w-4 h-4" />
                                {property.bathrooms}
                              </span>
                              <span className="flex items-center gap-1">
                                <Home className="w-4 h-4" />
                                {property.area} m²
                              </span>
                            </div>
                            <div className="flex items-center justify-between mb-3">
                              <span className="text-xl font-bold text-blue-600">
                                ${property.price.toLocaleString('es-CL')}
                              </span>
                              <Badge variant="secondary">{property.propertyType}</Badge>
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

            {/* Búsquedas Guardadas */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BookmarkPlus className="w-5 h-5" />
                  Búsquedas Guardadas
                </CardTitle>
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

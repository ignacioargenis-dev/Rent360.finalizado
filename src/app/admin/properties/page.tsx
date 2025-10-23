'use client';

// Forzar renderizado dinámico para evitar prerendering de páginas protegidas
export const dynamic = 'force-dynamic';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
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
  List,
  CheckCircle,
  AlertCircle,
  Trash2,
  AlertTriangle,
  RefreshCw,
  Download,
} from 'lucide-react';
import { User, Property } from '@/types';

import RecordModal from '@/components/forms/RecordModal';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';

// Extensión de Property para incluir información del owner en admin
interface AdminProperty extends Property {
  owner?: {
    id: string;
    name: string;
    email: string;
    avatar?: string;
  };
}

export default function AdminPropertiesPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);

  const [properties, setProperties] = useState<AdminProperty[]>([]);

  const [filteredProperties, setFilteredProperties] = useState<AdminProperty[]>([]);

  const [searchQuery, setSearchQuery] = useState('');

  const [statusFilter, setStatusFilter] = useState('all');

  const [cityFilter, setCityFilter] = useState('all');

  const [showExportDialog, setShowExportDialog] = useState(false);
  const [exportOptions, setExportOptions] = useState({
    format: 'csv', // 'csv', 'json'
    status: 'all', // filtro por estado
  });

  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const [loading, setLoading] = useState(true);

  const [successMessage, setSuccessMessage] = useState('');

  const [errorMessage, setErrorMessage] = useState('');

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<{
    show: boolean;
    property: AdminProperty | null;
  }>({
    show: false,
    property: null,
  });

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
        logger.error('Error loading user data:', {
          error: error instanceof Error ? error.message : String(error),
        });
      }
    };

    // Load properties data
    const loadProperties = async () => {
      try {
        // ✅ CORREGIDO: Cargar datos reales desde la API
        const baseUrl = typeof window !== 'undefined' ? '' : process.env.NEXT_PUBLIC_API_URL || '';
        const response = await fetch(`${baseUrl}/api/properties/list?limit=100`, {
          method: 'GET',
          credentials: 'include',
          headers: {
            Accept: 'application/json',
            'Cache-Control': 'no-cache',
          },
        });

        if (response.ok) {
          const data = await response.json();
          const propertiesData = data.properties || [];

          // Transformar datos de la API al formato esperado
          const transformedProperties: AdminProperty[] = propertiesData.map((property: any) => ({
            id: property.id,
            title: property.title,
            description: property.description || '',
            address: property.address,
            city: property.city,
            commune: property.commune,
            region: property.region,
            price: property.price,
            deposit: property.deposit || 0,
            bedrooms: property.bedrooms,
            bathrooms: property.bathrooms,
            area: property.area,
            status: property.status,
            images: property.images ? JSON.stringify(property.images) : JSON.stringify([]),
            features: property.features || [],
            views: property.views || 0,
            inquiries: property.inquiries || 0,
            ownerId: property.owner?.id || property.ownerId,
            owner: property.owner, // Incluir información completa del propietario
            createdAt: new Date(property.createdAt),
            updatedAt: new Date(property.updatedAt),
            // Características adicionales con valores por defecto
            furnished: property.furnished || false,
            petFriendly: property.petFriendly || false,
            parkingSpaces: property.parkingSpaces || 0,
            availableFrom: property.availableFrom ? new Date(property.availableFrom) : null,
            floor: property.floor || null,
            buildingName: property.buildingName || null,
            yearBuilt: property.yearBuilt || null,
            // Características del edificio/servicios
            heating: property.heating || false,
            cooling: property.cooling || false,
            internet: property.internet || false,
            elevator: property.elevator || false,
            balcony: property.balcony || false,
            terrace: property.terrace || false,
            garden: property.garden || false,
            pool: property.pool || false,
            gym: property.gym || false,
            security: property.security || false,
            concierge: property.concierge || false,
            // Campos opcionales
            type: property.type,
            brokerId: property.brokerId || null,
            currentTenant: property.currentTenant || null,
            averageRating: property.averageRating || 0,
            totalReviews: property.totalReviews || 0,
          }));

          setProperties(transformedProperties);
          setFilteredProperties(transformedProperties);
        } else {
          logger.error('Error loading properties from API:', {
            status: response.status,
            statusText: response.statusText,
          });
          // Fallback a datos vacíos si falla la API
          setProperties([]);
          setFilteredProperties([]);
        }
        setLoading(false);
      } catch (error) {
        logger.error('Error loading properties:', {
          error: error instanceof Error ? error.message : String(error),
        });
        // Fallback a datos vacíos en caso de error
        setProperties([]);
        setFilteredProperties([]);
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
      filtered = filtered.filter(
        property =>
          property.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          property.address.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (property.ownerId &&
            property.ownerId.toLowerCase().includes(searchQuery.toLowerCase())) ||
          property.commune.toLowerCase().includes(searchQuery.toLowerCase())
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
      // Create FormData for API submission
      const formDataToSend = new FormData();

      // Add property data
      formDataToSend.append('title', propertyData.title || 'Nueva Propiedad');
      formDataToSend.append('description', propertyData.description || 'Descripción pendiente');
      formDataToSend.append('address', propertyData.address || 'Dirección pendiente');
      formDataToSend.append('city', propertyData.city || 'Santiago');
      formDataToSend.append('commune', propertyData.commune || 'Centro');
      formDataToSend.append('region', propertyData.region || 'Metropolitana');
      formDataToSend.append('price', String(propertyData.price || 0));
      formDataToSend.append('deposit', String(propertyData.deposit || 0));
      formDataToSend.append('bedrooms', String(propertyData.bedrooms || 1));
      formDataToSend.append('bathrooms', String(propertyData.bathrooms || 1));
      formDataToSend.append('area', String(propertyData.area || 50));
      formDataToSend.append('type', 'APARTMENT');

      // Call the API endpoint
      const response = await fetch('/api/properties', {
        method: 'POST',
        body: formDataToSend,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al crear propiedad');
      }

      const result = await response.json();

      // Create property object for local state (mock data for UI)
      const emptyImages: string[] = [];
      const emptyFeatures: string[] = [];

      const newProperty = {
        id: result.property?.id || Date.now().toString(),
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
        status: 'PENDING' as const, // Properties start as pending for review
        images: emptyImages,
        features: emptyFeatures,
        ownerId: user?.id || 'user-admin',
        owner: user
          ? {
              id: user.id,
              name: user.name,
              email: user.email,
              avatar: user.avatar,
            }
          : undefined,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as unknown as AdminProperty;

      // Add to properties list
      setProperties([newProperty, ...properties]);

      // Show success message
      setSuccessMessage(
        'Propiedad creada exitosamente. Será revisada por nuestro equipo antes de ser publicada.'
      );
      setTimeout(() => setSuccessMessage(''), 5000);
    } catch (error) {
      logger.error('Error creating property:', {
        error: error instanceof Error ? error.message : String(error),
      });
      setErrorMessage(
        error instanceof Error
          ? error.message
          : 'Error al crear propiedad. Por favor, inténtalo nuevamente.'
      );
      setTimeout(() => setErrorMessage(''), 5000);
    }
  };

  const handleDeleteProperty = async (property: AdminProperty) => {
    setIsDeleting(true);
    try {
      const response = await fetch(`/api/properties/${property.id}`, {
        method: 'DELETE',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const result = await response.json();
        logger.info('Property deleted successfully', { propertyId: property.id, result });

        // Remover la propiedad de la lista local
        setProperties(prev => prev.filter(p => p.id !== property.id));
        setFilteredProperties(prev => prev.filter(p => p.id !== property.id));

        setSuccessMessage(`✅ Propiedad "${property.title}" eliminada exitosamente.`);
        setTimeout(() => setSuccessMessage(''), 5000);
      } else {
        const errorData = await response.json();
        logger.error('Error deleting property', {
          propertyId: property.id,
          error: errorData.error || 'Error desconocido',
        });
        setErrorMessage(
          `❌ Error al eliminar la propiedad: ${errorData.error || 'Error desconocido'}`
        );
        setTimeout(() => setErrorMessage(''), 5000);
      }
    } catch (error) {
      logger.error('Error deleting property', { error, propertyId: property.id });
      setErrorMessage('❌ Error de conexión al eliminar la propiedad');
      setTimeout(() => setErrorMessage(''), 5000);
    } finally {
      setIsDeleting(false);
      setDeleteConfirm({ show: false, property: null });
    }
  };

  const handleExportProperties = () => {
    logger.info('Abriendo opciones de exportación de propiedades');
    setShowExportDialog(true);
  };

  const handleConfirmExport = async () => {
    try {
      logger.info('Exportando propiedades del administrador', exportOptions);

      // Construir URL con parámetros
      const params = new URLSearchParams();
      params.append('format', exportOptions.format);
      if (exportOptions.status !== 'all') {
        params.append('status', exportOptions.status);
      }

      // Crear URL de descarga
      const exportUrl = `/api/admin/properties/export?${params.toString()}`;

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

  const PropertyCard = ({ property }: { property: AdminProperty }) => (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow">
      <div className="aspect-video bg-gray-200 relative overflow-hidden">
        {(() => {
          try {
            const images = Array.isArray(property.images)
              ? property.images
              : property.images
                ? JSON.parse(property.images)
                : [];
            if (images && images.length > 0) {
              return (
                <img
                  src={images[0]}
                  alt={property.title}
                  className="w-full h-full object-cover"
                  onLoad={() => {
                    console.log('✅ Imagen cargada exitosamente (admin list):', images[0]);
                  }}
                  onError={e => {
                    console.error('❌ Error cargando imagen (admin list):', images[0]);
                    // Fallback a placeholder si la imagen falla
                    e.currentTarget.style.display = 'none';
                    const nextElement = e.currentTarget.nextElementSibling as HTMLElement;
                    if (nextElement) {
                      nextElement.style.display = 'flex';
                    }
                  }}
                />
              );
            }
          } catch (error) {
            console.error('❌ Error parseando imágenes (admin list):', error);
            // Si hay error parseando, usar placeholder
          }
          return (
            <div className="w-full h-full bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center">
              <Building className="w-16 h-16 text-blue-400" />
            </div>
          );
        })()}
        <div className="absolute top-2 right-2">{getStatusBadge(property.status)}</div>
      </div>

      <CardContent className="p-4">
        <h3 className="font-semibold text-lg mb-2 line-clamp-1">{property.title}</h3>

        <div className="flex items-center text-sm text-gray-600 mb-2">
          <MapPin className="w-4 h-4 mr-1" />
          <span className="line-clamp-1">{property.commune}</span>
        </div>

        <div className="text-xl font-bold text-blue-600 mb-2">{formatPrice(property.price)}</div>

        <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
          <div className="flex items-center">
            <span className="font-medium">{property.bedrooms}</span>
            <span className="ml-1">dorm</span>
          </div>
          <div className="flex items-center">
            <span className="font-medium">{property.bathrooms}</span>
            <span className="ml-1">ba�os</span>
          </div>
          <div className="flex items-center">
            <span className="font-medium">{property.area}</span>
            <span className="ml-1">m�</span>
          </div>
        </div>

        <div className="text-xs text-gray-500 mb-3">
          <div>Propietario: {property.owner?.name || 'No disponible'}</div>
          <div>Email: {property.owner?.email || 'No disponible'}</div>
          <div>Estado: {property.status}</div>
        </div>

        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-center gap-2 text-xs">
            <Button
              variant="ghost"
              size="sm"
              className="h-auto p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 flex-1"
              onClick={() => router.push(`/admin/properties/${property.id}`)}
            >
              <Eye className="w-3 h-3 mr-1" />
              <span>Ver detalles</span>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-auto p-2 text-gray-500 hover:text-purple-600 hover:bg-purple-50 flex-1"
              onClick={() => property.owner?.id && router.push(`/admin/users/${property.owner.id}`)}
              disabled={!property.owner?.id}
            >
              <Users className="w-3 h-3 mr-1" />
              <span>Propietario</span>
            </Button>
          </div>

          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => router.push(`/admin/properties/${property.id}`)}
              className="flex-1"
            >
              <Eye className="w-4 h-4 mr-1" />
              Ver
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => router.push(`/admin/properties/${property.id}/edit`)}
              className="flex-1"
            >
              <Edit className="w-4 h-4 mr-1" />
              Editar
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setDeleteConfirm({ show: true, property })}
              className="flex-1 bg-red-50 border-red-200 text-red-700 hover:bg-red-100"
            >
              <Trash2 className="w-4 h-4 mr-1" />
              Eliminar
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const PropertyListItem = ({ property }: { property: AdminProperty }) => (
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
                <span>Propietario: {property.owner?.name || 'No disponible'}</span>
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
                  <span className="ml-1">ba�os</span>
                </div>
                <div className="flex items-center">
                  <span className="font-medium">{property.area}</span>
                  <span className="ml-1">m�</span>
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
            <Button
              variant="ghost"
              size="sm"
              className="h-auto p-1 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
              onClick={() => router.push(`/admin/properties/${property.id}`)}
            >
              <Eye className="w-4 h-4 mr-1" />
              <span>Ver detalles</span>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-auto p-1 text-purple-600 hover:text-purple-700 hover:bg-purple-50"
              onClick={() => property.owner?.id && router.push(`/admin/users/${property.owner.id}`)}
              disabled={!property.owner?.id}
            >
              <Users className="w-4 h-4 mr-1" />
              <span>Propietario</span>
            </Button>
          </div>
        </div>

        <div className="flex items-center gap-2 ml-4">
          <Button
            size="sm"
            variant="outline"
            onClick={() => router.push(`/admin/properties/${property.id}`)}
          >
            <Eye className="w-4 h-4 mr-2" />
            Ver
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => router.push(`/admin/properties/${property.id}/edit`)}
          >
            <Edit className="w-4 h-4 mr-2" />
            Editar
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setDeleteConfirm({ show: true, property })}
            className="bg-red-50 border-red-200 text-red-700 hover:bg-red-100"
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Eliminar
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
    <UnifiedDashboardLayout
      title="Gesti�n de Propiedades"
      subtitle="Administra todas las propiedades del sistema"
    >
      <div className="container mx-auto px-4 py-6">
        {/* Success Message */}
        {successMessage && (
          <Card className="mb-6 border-green-200 bg-green-50">
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
          <Card className="mb-6 border-red-200 bg-red-50">
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
                onChange={e => setSearchQuery(e.target.value)}
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
                <SelectItem value="Valpara�so">Valpara�so</SelectItem>
                <SelectItem value="Concepci�n">Concepci�n</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex gap-2">
            <Button variant="outline" size="sm">
              <Filter className="w-4 h-4 mr-2" />
              Filtros
            </Button>
            <Button onClick={handleExportProperties} variant="outline" size="sm">
              <Download className="w-4 h-4 mr-2" />
              Exportar Datos
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
            {filteredProperties.map(property => (
              <PropertyCard key={property.id} property={property} />
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            {filteredProperties.map(property => (
              <PropertyListItem key={property.id} property={property} />
            ))}
          </div>
        )}

        {filteredProperties.length === 0 && (
          <Card>
            <CardContent className="pt-6 text-center">
              <Building className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No se encontraron propiedades</p>
              <Button variant="outline" className="mt-4" onClick={() => setShowCreateModal(true)}>
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

        {/* Modal de confirmación de eliminación */}
        {deleteConfirm.show && deleteConfirm.property && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                  <AlertTriangle className="w-5 h-5 text-red-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Eliminar Propiedad</h3>
                  <p className="text-sm text-gray-600">Esta acción no se puede deshacer</p>
                </div>
              </div>

              <div className="mb-6">
                <p className="text-gray-700 mb-2">
                  ¿Estás seguro de que quieres eliminar la propiedad:
                </p>
                <p className="font-semibold text-gray-900">
                  &ldquo;{deleteConfirm.property.title}&rdquo;
                </p>
                <p className="text-sm text-gray-600 mt-2">
                  Se eliminarán todos los archivos, imágenes, documentos y datos asociados.
                </p>
              </div>

              <div className="flex gap-3 justify-end">
                <Button
                  variant="outline"
                  onClick={() => setDeleteConfirm({ show: false, property: null })}
                  disabled={isDeleting}
                >
                  Cancelar
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => handleDeleteProperty(deleteConfirm.property!)}
                  disabled={isDeleting}
                  className="bg-red-600 hover:bg-red-700"
                >
                  {isDeleting ? (
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
            </div>
          </div>
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
                    <SelectItem value="AVAILABLE">Disponibles</SelectItem>
                    <SelectItem value="RENTED">Arrendadas</SelectItem>
                    <SelectItem value="PENDING">Pendientes</SelectItem>
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
      </div>
    </UnifiedDashboardLayout>
  );
}

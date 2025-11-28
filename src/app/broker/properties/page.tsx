'use client';

import React, { useState, useEffect } from 'react';

// ✅ CORREGIDO: 'use client' no puede usar export const dynamic o revalidate
// Las páginas del cliente se renderizan dinámicamente por defecto en el navegador
// Los datos se cargan mediante fetch en useEffect, no durante el build
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
  Users,
  DollarSign,
  Calendar,
  MapPin,
  Eye,
  Edit,
  Plus,
  Search,
  Filter,
  TrendingUp,
  Home,
  CheckCircle,
  AlertTriangle,
  Key,
} from 'lucide-react';
import Link from 'next/link';
import { User as UserType } from '@/types';

interface BrokerProperty {
  id: string;
  title: string;
  address: string;
  type: 'departamento' | 'casa' | 'oficina' | 'local' | 'bodega';
  status: 'available' | 'rented' | 'pending' | 'maintenance' | 'off_market';
  price: number;
  ownerName: string;
  tenantName?: string;
  commissionEarned: number;
  views: number;
  inquiries: number;
  occupancyRate: number;
  lastPayment?: string;
  nextPayment?: string;
  createdAt: string;
  updatedAt: string;
}

interface PropertyStats {
  totalProperties: number;
  availableProperties: number;
  rentedProperties: number;
  totalPortfolioValue: number;
  averageRent: number;
  occupancyRate: number;
  totalViews: number;
  totalInquiries: number;
}

export default function BrokerPropertiesPage() {
  const router = useRouter();
  const [user, setUser] = useState<UserType | null>(null);
  const [properties, setProperties] = useState<BrokerProperty[]>([]);
  const [stats, setStats] = useState<PropertyStats>({
    totalProperties: 0,
    availableProperties: 0,
    rentedProperties: 0,
    totalPortfolioValue: 0,
    averageRent: 0,
    occupancyRate: 0,
    totalViews: 0,
    totalInquiries: 0,
  });
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterType, setFilterType] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  const loadPropertiesData = async (statusFilter = filterStatus) => {
    try {
      console.log('🔍 [PROPERTIES] Iniciando carga de propiedades...', { statusFilter });

      // ✅ CORREGIDO: Usar la API específica de broker que incluye propiedades gestionadas
      const baseUrl = typeof window !== 'undefined' ? '' : process.env.NEXT_PUBLIC_API_URL || '';
      const url = `${baseUrl}/api/broker/properties?status=${statusFilter}&limit=50`;
      const response = await fetch(url, {
        method: 'GET',
        credentials: 'include',
        headers: {
          Accept: 'application/json',
          'Cache-Control': 'no-cache',
        },
      });

      console.log('📡 [PROPERTIES] Respuesta recibida:', {
        ok: response.ok,
        status: response.status,
        statusText: response.statusText,
      });

      if (response.ok) {
        const data = await response.json();
        const propertiesData = data.data || [];

        console.log('📊 [PROPERTIES] Propiedades recibidas:', {
          count: propertiesData.length,
          propiedades: propertiesData.map((p: any) => ({
            id: p.id,
            title: p.title,
            ownerName: p.ownerName,
            managementType: p.managementType,
          })),
        });

        // Transformar datos de la API al formato esperado por el componente
        const transformedProperties: BrokerProperty[] = propertiesData.map((property: any) => ({
          id: property.id,
          title: property.title,
          address: `${property.address}${property.commune ? `, ${property.commune}` : ''}${property.city ? `, ${property.city}` : ''}`,
          type: property.type,
          status: property.status,
          price: property.price,
          ownerName: property.ownerName || property.owner?.name || 'No asignado', // ✅ Usar ownerName de la API primero
          tenantName: property.currentTenant?.name || undefined,
          commissionEarned: property.commissionEarned || 0,
          views: property.views || 0,
          inquiries: property.inquiries || 0,
          occupancyRate: property.status === 'rented' ? 100 : 0,
          images:
            property.images && property.images.length > 0
              ? property.images
              : ['/api/placeholder/400/300'],
          createdAt: property.createdAt,
          updatedAt: property.updatedAt,
        }));

        setProperties(transformedProperties);

        // Calcular estadísticas reales
        // El backend ya convierte status a minúsculas, así que buscamos 'available'
        const availableProperties = transformedProperties.filter(
          p => p.status?.toLowerCase() === 'available'
        ).length;
        const rentedProperties = transformedProperties.filter(
          p => p.status?.toLowerCase() === 'rented'
        ).length;
        const totalPortfolioValue = transformedProperties.reduce(
          (sum, p) => sum + (p.price || 0),
          0
        );
        const totalViews = transformedProperties.reduce((sum, p) => sum + p.views, 0);
        const totalInquiries = transformedProperties.reduce((sum, p) => sum + p.inquiries, 0);
        const averageRent = rentedProperties > 0 ? totalPortfolioValue / rentedProperties : 0;
        const occupancyRate =
          transformedProperties.length > 0
            ? (rentedProperties / transformedProperties.length) * 100
            : 0;

        const propertyStats: PropertyStats = {
          totalProperties: transformedProperties.length,
          availableProperties,
          rentedProperties,
          totalPortfolioValue,
          averageRent,
          occupancyRate,
          totalViews,
          totalInquiries,
        };

        console.log('✅ [PROPERTIES] Estadísticas calculadas:', propertyStats);
        setStats(propertyStats);
      } else {
        const errorText = await response.text();
        console.error('❌ [PROPERTIES] Error al cargar propiedades:', {
          status: response.status,
          statusText: response.statusText,
          error: errorText,
        });
        logger.error('Error loading properties from API:', {
          status: response.status,
          statusText: response.statusText,
        });
        // Fallback a datos vacíos si falla la API
        setProperties([]);
        setStats({
          totalProperties: 0,
          availableProperties: 0,
          rentedProperties: 0,
          totalPortfolioValue: 0,
          averageRent: 0,
          occupancyRate: 0,
          totalViews: 0,
          totalInquiries: 0,
        });
      }
      setLoading(false);
    } catch (error) {
      console.error('❌ [PROPERTIES] Error crítico:', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      });
      logger.error('Error loading properties data:', {
        error: error instanceof Error ? error.message : String(error),
      });
      // Fallback a datos vacíos en caso de error
      setProperties([]);
      setStats({
        totalProperties: 0,
        availableProperties: 0,
        rentedProperties: 0,
        totalPortfolioValue: 0,
        averageRent: 0,
        occupancyRate: 0,
        totalViews: 0,
        totalInquiries: 0,
      });
      setLoading(false);
    }
  };

  useEffect(() => {
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

    loadUserData();
    loadPropertiesData();
  }, []);

  // ✅ CORREGIDO: Recargar datos cuando cambia el filtro de status
  useEffect(() => {
    if (user) {
      // Solo recargar si el usuario ya está cargado
      loadPropertiesData();
    }
  }, [filterStatus]);

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      available: { label: 'Disponible', color: 'bg-green-100 text-green-800' },
      rented: { label: 'Arrendado', color: 'bg-blue-100 text-blue-800' },
      pending: { label: 'Pendiente', color: 'bg-yellow-100 text-yellow-800' },
      maintenance: { label: 'Mantenimiento', color: 'bg-orange-100 text-orange-800' },
      off_market: { label: 'Fuera de Mercado', color: 'bg-gray-100 text-gray-800' },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.available;

    return <Badge className={config.color}>{config.label}</Badge>;
  };

  const getTypeBadge = (type: string) => {
    const typeConfig = {
      departamento: { label: 'Departamento', icon: '🏢' },
      casa: { label: 'Casa', icon: '🏠' },
      oficina: { label: 'Oficina', icon: '🏢' },
      local: { label: 'Local', icon: '🏪' },
      bodega: { label: 'Bodega', icon: '📦' },
    };

    // Normalizar el tipo para manejar variaciones
    const normalizedType = type?.toLowerCase()?.trim();
    const config = typeConfig[normalizedType as keyof typeof typeConfig] || {
      label: type || 'Propiedad',
      icon: '🏠',
    };

    return (
      <Badge variant="outline" className="bg-gray-100 text-gray-800">
        {config.icon} {config.label}
      </Badge>
    );
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('es-CL', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const handleViewProperty = (propertyId: string) => {
    // Navigate to property detail view
    router.push(`/broker/properties/${propertyId}`);
  };

  const handleEditProperty = (propertyId: string, property: BrokerProperty) => {
    // Redirigir a la página de edición de la propiedad
    router.push(`/broker/properties/${propertyId}/edit`);
  };

  const handleAddProperty = () => {
    // Navigate to new property creation page
    router.push('/broker/properties/new');
  };

  const filteredProperties = properties.filter(property => {
    const matchesSearch =
      property.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      property.address.toLowerCase().includes(searchTerm.toLowerCase()) ||
      property.ownerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (property.tenantName && property.tenantName.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesStatus = filterStatus === 'all' || property.status === filterStatus;
    const matchesType = filterType === 'all' || property.type === filterType;

    return matchesSearch && matchesStatus && matchesType;
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
    <UnifiedDashboardLayout
      title="Mis Propiedades"
      subtitle="Gestiona todas las propiedades que administras"
    >
      <div className="container mx-auto px-4 py-6">
        {/* Header with actions */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-6 gap-4">
          <div></div>
          <div className="flex gap-2">
            <Button onClick={handleAddProperty}>
              <Plus className="w-4 h-4 mr-2" />
              Nueva Propiedad
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
                  <p className="text-2xl font-bold text-gray-900">{stats.availableProperties}</p>
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
                  <p className="text-sm font-medium text-gray-600">Valor Portafolio</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {formatCurrency(stats.totalPortfolioValue)}
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
                  <p className="text-sm font-medium text-gray-600">Tasa Ocupación</p>
                  <p className="text-2xl font-bold text-gray-900">
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

        {/* Search and Filters */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Buscar propiedades por título, dirección o propietario..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="available">Disponibles</SelectItem>
                <SelectItem value="rented">Arrendadas</SelectItem>
                <SelectItem value="pending">Pendientes</SelectItem>
                <SelectItem value="maintenance">Mantenimiento</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="departamento">Departamentos</SelectItem>
                <SelectItem value="casa">Casas</SelectItem>
                <SelectItem value="oficina">Oficinas</SelectItem>
                <SelectItem value="local">Locales</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Properties List */}
        <div className="space-y-4">
          {filteredProperties.map(property => (
            <Card
              key={property.id}
              className={`border-l-4 ${property.status === 'available' ? 'border-l-green-500' : property.status === 'rented' ? 'border-l-blue-500' : 'border-l-yellow-500'}`}
            >
              <CardContent className="pt-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4 flex-1">
                    <div
                      className={`p-3 rounded-lg ${property.status === 'available' ? 'bg-green-50' : property.status === 'rented' ? 'bg-blue-50' : 'bg-yellow-50'}`}
                    >
                      <Building className="w-6 h-6 text-current" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-semibold text-gray-900">{property.title}</h3>
                        {getStatusBadge(property.status)}
                        {getTypeBadge(property.type)}
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                        <div>
                          <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
                            <MapPin className="w-4 h-4" />
                            <span className="font-medium">{property.address}</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
                            <Users className="w-4 h-4" />
                            <span>Propietario: {property.ownerName}</span>
                          </div>
                          {property.tenantName && (
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                              <Key className="w-4 h-4" />
                              <span>Inquilino: {property.tenantName}</span>
                            </div>
                          )}
                        </div>

                        <div>
                          <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
                            <DollarSign className="w-4 h-4" />
                            <span>Renta: {formatCurrency(property.price)}/mes</span>
                          </div>
                          {property.commissionEarned > 0 && (
                            <div className="flex items-center gap-2 text-sm text-green-600 mb-1">
                              <TrendingUp className="w-4 h-4" />
                              <span>Comisión: {formatCurrency(property.commissionEarned)}</span>
                            </div>
                          )}
                          <div className="flex items-center gap-4 text-sm text-gray-600">
                            <span className="flex items-center gap-1">
                              <Eye className="w-3 h-3" />
                              {property.views}
                            </span>
                            <span className="flex items-center gap-1">
                              <Users className="w-3 h-3" />
                              {property.inquiries}
                            </span>
                          </div>
                          {property.nextPayment && (
                            <div className="flex items-center gap-2 text-sm text-blue-600">
                              <Calendar className="w-4 h-4" />
                              <span>Pago: {formatDateTime(property.nextPayment)}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 ml-4">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleViewProperty(property.id)}
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleEditProperty(property.id, property)}
                      title={
                        property.ownerName === 'Propia'
                          ? 'Editar propiedad'
                          : 'Ver detalles (propiedad gestionada)'
                      }
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredProperties.length === 0 && (
          <div className="text-center py-12">
            <Building className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No hay propiedades registradas
            </h3>
            <p className="text-gray-600 mb-4">
              Comienza agregando tu primera propiedad al portafolio
            </p>
            <Button onClick={handleAddProperty}>
              <Plus className="w-4 h-4 mr-2" />
              Agregar Primera Propiedad
            </Button>
          </div>
        )}
      </div>
    </UnifiedDashboardLayout>
  );
}

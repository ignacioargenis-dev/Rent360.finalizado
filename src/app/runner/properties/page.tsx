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
  MapPin,
  Eye,
  Camera,
  Star,
  Calendar,
  Clock,
  CheckCircle,
  DollarSign,
  Users,
  Image as ImageIcon,
  Home,
  MapPinned,
  Phone } from 'lucide-react';
import { User } from '@/types';
import EnhancedDashboardLayout from '@/components/dashboard/EnhancedDashboardLayout';

interface PropertySummary {
  id: string;
  title: string;
  address: string;
  price: number;
  status: 'available' | 'rented' | 'maintenance' | 'pending';
  type: string;
  bedrooms: number;
  bathrooms: number;
  area: number;
  owner: string;
  ownerPhone: string;
  visitsScheduled: number;
  visitsCompleted: number;
  lastVisit: string;
  nextVisit: string;
  photosTaken: number;
  rating: number;
  assignedAt: string;
}

interface PropertyStats {
  totalProperties: number;
  availableProperties: number;
  totalVisits: number;
  completedVisits: number;
  pendingVisits: number;
  averageRating: number;
  totalPhotos: number;
  thisMonthVisits: number;
}

export default function RunnerProperties() {

  const [user, setUser] = useState<User | null>(null);

  const [properties, setProperties] = useState<PropertySummary[]>([]);

  const [stats, setStats] = useState<PropertyStats>({
    totalProperties: 0,
    availableProperties: 0,
    totalVisits: 0,
    completedVisits: 0,
    pendingVisits: 0,
    averageRating: 0,
    totalPhotos: 0,
    thisMonthVisits: 0,
  });

  const [loading, setLoading] = useState(true);

  const [searchTerm, setSearchTerm] = useState('');

  const [statusFilter, setStatusFilter] = useState('all');

  const [sortBy, setSortBy] = useState('assignedAt');

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

    loadUserData();
  }, []);

  useEffect(() => {
    const loadPropertiesData = async () => {
      try {
        // Simulate API call - in real implementation, this would fetch from /api/runner/properties
        const mockProperties: PropertySummary[] = [
          {
            id: '1',
            title: 'Departamento Amoblado Centro',
            address: 'Ahumada 123, Santiago Centro',
            price: 850000,
            status: 'available',
            type: 'departamento',
            bedrooms: 2,
            bathrooms: 1,
            area: 65,
            owner: 'Juan Pérez',
            ownerPhone: '+56 9 1234 5678',
            visitsScheduled: 3,
            visitsCompleted: 2,
            lastVisit: '2024-03-15',
            nextVisit: '2024-03-20',
            photosTaken: 25,
            rating: 4.7,
            assignedAt: '2024-03-01',
          },
          {
            id: '2',
            title: 'Casa con Jardín Las Condes',
            address: 'Manquehue 456, Las Condes',
            price: 2500000,
            status: 'available',
            type: 'casa',
            bedrooms: 4,
            bathrooms: 3,
            area: 180,
            owner: 'María García',
            ownerPhone: '+56 9 2345 6789',
            visitsScheduled: 2,
            visitsCompleted: 1,
            lastVisit: '2024-03-14',
            nextVisit: '2024-03-18',
            photosTaken: 40,
            rating: 4.9,
            assignedAt: '2024-03-05',
          },
          {
            id: '3',
            title: 'Oficina Corporativa Providencia',
            address: 'Providencia 789, Providencia',
            price: 1200000,
            status: 'rented',
            type: 'oficina',
            bedrooms: 0,
            bathrooms: 2,
            area: 120,
            owner: 'Carlos López',
            ownerPhone: '+56 9 3456 7890',
            visitsScheduled: 1,
            visitsCompleted: 1,
            lastVisit: '2024-03-10',
            nextVisit: '',
            photosTaken: 30,
            rating: 4.5,
            assignedAt: '2024-02-28',
          },
        ];

        setProperties(mockProperties);

        // Calculate stats
        const totalVisits = mockProperties.reduce((sum, p) => sum + p.visitsScheduled, 0);
        const completedVisits = mockProperties.reduce((sum, p) => sum + p.visitsCompleted, 0);
        const pendingVisits = totalVisits - completedVisits;
        const availableProperties = mockProperties.filter(p => p.status === 'available').length;
        
        const totalRating = mockProperties.reduce((sum, p) => sum + p.rating, 0);
        const averageRating = mockProperties.length > 0 ? totalRating / mockProperties.length : 0;
        
        const totalPhotos = mockProperties.reduce((sum, p) => sum + p.photosTaken, 0);

        setStats({
          totalProperties: mockProperties.length,
          availableProperties,
          totalVisits,
          completedVisits,
          pendingVisits,
          averageRating,
          totalPhotos,
          thisMonthVisits: 8,
        });
      } catch (error) {
        logger.error('Error loading properties data:', { error: error instanceof Error ? error.message : String(error) });
      } finally {
        setLoading(false);
      }
    };

    loadPropertiesData();
  }, []);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'available':
        return <Badge className="bg-green-100 text-green-800">Disponible</Badge>;
      case 'rented':
        return <Badge className="bg-blue-100 text-blue-800">Arrendado</Badge>;
      case 'maintenance':
        return <Badge className="bg-yellow-100 text-yellow-800">Mantenimiento</Badge>;
      case 'pending':
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

  const formatDate = (dateString: string) => {
    if (!dateString) {
return 'No programada';
}
    return new Date(dateString).toLocaleDateString('es-CL', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const filteredProperties = properties.filter(property => {
    const matchesSearch = property.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         property.address.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         property.owner.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || property.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const sortedProperties = [...filteredProperties].sort((a, b) => {
    switch (sortBy) {
      case 'assignedAt':
        return new Date(b.assignedAt).getTime() - new Date(a.assignedAt).getTime();
      case 'title':
        return a.title.localeCompare(b.title);
      case 'visits':
        return b.visitsCompleted - a.visitsCompleted;
      case 'rating':
        return b.rating - a.rating;
      default:
        return 0;
    }
  });

  if (loading) {
    return (
      <EnhancedDashboardLayout
        user={user}
        title="Propiedades Asignadas"
        subtitle="Gestión de propiedades asignadas para visitas"
      >
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Cargando propiedades asignadas...</p>
          </div>
        </div>
      </EnhancedDashboardLayout>
    );
  }

  return (
    <EnhancedDashboardLayout
      user={user}
      title="Propiedades Asignadas"
      subtitle="Gestión de propiedades asignadas para visitas"
    >
      <div className="container mx-auto px-4 py-6 space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Propiedades Asignadas</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.totalProperties}</p>
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
                  <p className="text-sm font-medium text-gray-600">Visitas Completadas</p>
                  <p className="text-2xl font-bold text-green-600">{stats.completedVisits}</p>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <CheckCircle className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Visitas Pendientes</p>
                  <p className="text-2xl font-bold text-orange-600">{stats.pendingVisits}</p>
                </div>
                <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                  <Clock className="w-6 h-6 text-orange-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Fotos Tomadas</p>
                  <p className="text-2xl font-bold text-purple-600">{stats.totalPhotos}</p>
                </div>
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                  <Camera className="w-6 h-6 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Additional Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Disponibles</p>
                  <p className="text-2xl font-bold text-green-600">{stats.availableProperties}</p>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <Home className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Calificación Promedio</p>
                  <p className="text-2xl font-bold text-yellow-600">{stats.averageRating.toFixed(1)}</p>
                </div>
                <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                  <Star className="w-6 h-6 text-yellow-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Visitas este Mes</p>
                  <p className="text-2xl font-bold text-blue-600">{stats.thisMonthVisits}</p>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Calendar className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle>Lista de Propiedades Asignadas</CardTitle>
            <CardDescription>
              Propiedades asignadas para realizar visitas y tomar fotografías
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row gap-4 mb-6">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Buscar por título, dirección o propietario..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full md:w-48">
                  <SelectValue placeholder="Filtrar por estado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los estados</SelectItem>
                  <SelectItem value="available">Disponible</SelectItem>
                  <SelectItem value="rented">Arrendado</SelectItem>
                  <SelectItem value="maintenance">Mantenimiento</SelectItem>
                  <SelectItem value="pending">Pendiente</SelectItem>
                </SelectContent>
              </Select>
              
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-full md:w-48">
                  <SelectValue placeholder="Ordenar por" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="assignedAt">Fecha de Asignación</SelectItem>
                  <SelectItem value="title">Título</SelectItem>
                  <SelectItem value="visits">Visitas Completadas</SelectItem>
                  <SelectItem value="rating">Calificación</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Properties Table */}
            <div className="overflow-x-auto max-h-96 overflow-y-auto">
              <table className="w-full border-collapse border border-gray-300">
                <thead className="sticky top-0 bg-gray-50">
                  <tr>
                    <th className="border border-gray-300 px-4 py-2 text-left">Propiedad</th>
                    <th className="border border-gray-300 px-4 py-2 text-left">Estado</th>
                    <th className="border border-gray-300 px-4 py-2 text-left">Precio</th>
                    <th className="border border-gray-300 px-4 py-2 text-left">Visitas</th>
                    <th className="border border-gray-300 px-4 py-2 text-left">Propietario</th>
                    <th className="border border-gray-300 px-4 py-2 text-left">Próxima Visita</th>
                    <th className="border border-gray-300 px-4 py-2 text-left">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedProperties.map((property) => (
                    <tr key={property.id} className="hover:bg-gray-50">
                      <td className="border border-gray-300 px-4 py-2">
                        <div>
                          <div className="font-medium">{property.title}</div>
                          <div className="text-sm text-gray-600 flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            {property.address}
                          </div>
                          <div className="text-xs text-gray-500">
                            {property.bedrooms} dorm • {property.bathrooms} baños • {property.area} m²
                          </div>
                          <div className="flex items-center gap-2 mt-1">
                            <div className="flex items-center gap-1">
                              <Camera className="w-3 h-3 text-purple-500" />
                              <span className="text-xs">{property.photosTaken} fotos</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Star className="w-3 h-3 text-yellow-500 fill-current" />
                              <span className="text-xs">{property.rating.toFixed(1)}</span>
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="border border-gray-300 px-4 py-2">
                        {getStatusBadge(property.status)}
                      </td>
                      <td className="border border-gray-300 px-4 py-2">
                        {formatPrice(property.price)}
                      </td>
                      <td className="border border-gray-300 px-4 py-2">
                        <div className="text-sm">
                          <div className="flex items-center gap-1">
                            <CheckCircle className="w-3 h-3 text-green-500" />
                            <span>{property.visitsCompleted} completadas</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock className="w-3 h-3 text-orange-500" />
                            <span>{property.visitsScheduled - property.visitsCompleted} pendientes</span>
                          </div>
                        </div>
                      </td>
                      <td className="border border-gray-300 px-4 py-2">
                        <div>
                          <div className="font-medium">{property.owner}</div>
                          <div className="text-sm text-gray-600 flex items-center gap-1">
                            <Phone className="w-3 h-3" />
                            {property.ownerPhone}
                          </div>
                        </div>
                      </td>
                      <td className="border border-gray-300 px-4 py-2">
                        <div className="text-sm">
                          {formatDate(property.nextVisit)}
                        </div>
                      </td>
                      <td className="border border-gray-300 px-4 py-2">
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline">
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button size="sm">
                            <Camera className="w-4 h-4" />
                          </Button>
                          <Button size="sm" variant="outline">
                            <MapPinned className="w-4 h-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {sortedProperties.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                No se encontraron propiedades con los filtros seleccionados
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </EnhancedDashboardLayout>
  );
}

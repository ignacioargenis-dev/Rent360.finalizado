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
  Download,
  Eye,
  Edit,
  Trash2,
  MapPin,
  Star,
  TrendingUp,
  DollarSign,
  Users,
  Calendar,
  Image,
  Home,
  CheckCircle,
  XCircle,
  Clock
} from 'lucide-react';
import { User } from '@/types';


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
  ownerEmail: string;
  createdAt: string;
  lastUpdated: string;
  views: number;
  inquiries: number;
  rating: number;
  imagesCount: number;
}

interface PropertyStats {
  totalProperties: number;
  availableProperties: number;
  rentedProperties: number;
  maintenanceProperties: number;
  pendingProperties: number;
  averagePrice: number;
  totalViews: number;
  totalInquiries: number;
  averageRating: number;
  topPropertyType: string;
}

export default function AdminPropertiesReports() {

  const [user, setUser] = useState<User | null>(null);

  const [properties, setProperties] = useState<PropertySummary[]>([]);

  const [stats, setStats] = useState<PropertyStats>({
    totalProperties: 0,
    availableProperties: 0,
    rentedProperties: 0,
    maintenanceProperties: 0,
    pendingProperties: 0,
    averagePrice: 0,
    totalViews: 0,
    totalInquiries: 0,
    averageRating: 0,
    topPropertyType: 'departamento',
  });

  const [loading, setLoading] = useState(true);

  const [searchTerm, setSearchTerm] = useState('');

  const [statusFilter, setStatusFilter] = useState('all');

  const [typeFilter, setTypeFilter] = useState('all');

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
        const response = await fetch('/api/properties?limit=1000');
        if (response.ok) {
          const data = await response.json();
          const propertiesData = data.properties;
          
          // Transform property data
          const transformedProperties: PropertySummary[] = propertiesData.map((property: any) => ({
            id: property.id,
            title: property.title,
            address: property.address,
            price: property.price || 0,
            status: property.status || 'available',
            type: property.type || 'departamento',
            bedrooms: property.bedrooms || 0,
            bathrooms: property.bathrooms || 0,
            area: property.area || 0,
            owner: property.ownerName || 'Sin asignar',
            ownerEmail: property.ownerEmail || '',
            createdAt: property.createdAt,
            lastUpdated: property.updatedAt || property.createdAt,
            views: property.views || 0,
            inquiries: property.inquiries || 0,
            rating: property.rating || 0,
            imagesCount: property.imagesCount || 0,
          }));

          setProperties(transformedProperties);

          // Calculate stats
          const availableProperties = propertiesData.filter((p: any) => (p.status || 'available') === 'available').length;
          const rentedProperties = propertiesData.filter((p: any) => p.status === 'rented').length;
          const maintenanceProperties = propertiesData.filter((p: any) => p.status === 'maintenance').length;
          const pendingProperties = propertiesData.filter((p: any) => p.status === 'pending').length;
          
          const totalPrice = propertiesData.reduce((sum: number, p: any) => sum + (p.price || 0), 0);
          const averagePrice = propertiesData.length > 0 ? totalPrice / propertiesData.length : 0;
          
          const totalViews = propertiesData.reduce((sum: number, p: any) => sum + (p.views || 0), 0);
          const totalInquiries = propertiesData.reduce((sum: number, p: any) => sum + (p.inquiries || 0), 0);
          
          const totalRating = propertiesData.reduce((sum: number, p: any) => sum + (p.rating || 0), 0);
          const averageRating = propertiesData.length > 0 ? totalRating / propertiesData.length : 0;
          
          // Calculate top property type
          const typeCounts: { [key: string]: number } = {};
          propertiesData.forEach((p: any) => {
            typeCounts[p.type || 'departamento'] = (typeCounts[p.type || 'departamento'] || 0) + 1;
          });
          const topPropertyType = Object.entries(typeCounts).reduce((a, b) => a[1] > b[1] ? a : b)?.[0] || 'Sin tipo';

          setStats({
            totalProperties: propertiesData.length,
            availableProperties,
            rentedProperties,
            maintenanceProperties,
            pendingProperties,
            averagePrice,
            totalViews,
            totalInquiries,
            averageRating,
            topPropertyType,
          });
        }
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
    const matchesType = typeFilter === 'all' || property.type === typeFilter;
    
    return matchesSearch && matchesStatus && matchesType;
  });

  const exportToCSV = () => {
    const headers = ['Título', 'Dirección', 'Precio', 'Estado', 'Tipo', 'Dormitorios', 'Baños', 'Área', 'Propietario', 'Email Propietario', 'Fecha Creación', 'Vistas', 'Consultas', 'Calificación', 'Imágenes'];
    const csvContent = [
      headers.join(','),
      ...filteredProperties.map(property => [
        property.title,
        property.address,
        formatPrice(property.price),
        property.status,
        property.type,
        property.bedrooms,
        property.bathrooms,
        property.area,
        property.owner,
        property.ownerEmail,
        formatDate(property.createdAt),
        property.views,
        property.inquiries,
        property.rating.toFixed(1),
        property.imagesCount,
      ].join(',')),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', 'reporte_propiedades.csv');
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  if (loading) {
    return (
          <div className="min-h-screen bg-gray-50">
      <div className="flex">
        <div className="w-64 bg-white shadow-lg">
          <div className="p-4">
            <h2 className="text-lg font-semibold">Rent360 Admin</h2>
          </div>
        </div>
        <div className="flex-1">
          <div className="p-6">
        
        title="Reporte de Propiedades"
        subtitle="Análisis detallado de propiedades del sistema"
      >
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Cargando reporte de propiedades...</p>
          </div>
        </div>
      </DashboardLayout
    );
  }

  return (
        <div className="min-h-screen bg-gray-50">
      <div className="flex">
        <div className="w-64 bg-white shadow-lg">
          <div className="p-4">
            <h2 className="text-lg font-semibold">Rent360 Admin</h2>
          </div>
        </div>
        <div className="flex-1">
          <div className="p-6">
      
      title="Reporte de Propiedades"
      subtitle="Análisis detallado de propiedades del sistema"
    >
      <div className="container mx-auto px-4 py-6 space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardContent className="pt-6">
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
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Disponibles</p>
                  <p className="text-2xl font-bold text-green-600">{stats.availableProperties}</p>
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
                  <p className="text-sm font-medium text-gray-600">Arrendadas</p>
                  <p className="text-2xl font-bold text-blue-600">{stats.rentedProperties}</p>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Home className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Precio Promedio</p>
                  <p className="text-2xl font-bold text-purple-600">{formatPrice(stats.averagePrice)}</p>
                </div>
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                  <DollarSign className="w-6 h-6 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Additional Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Vistas</p>
                  <p className="text-2xl font-bold text-indigo-600">{stats.totalViews.toLocaleString()}</p>
                </div>
                <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center">
                  <Eye className="w-6 h-6 text-indigo-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Consultas</p>
                  <p className="text-2xl font-bold text-orange-600">{stats.totalInquiries}</p>
                </div>
                <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                  <Users className="w-6 h-6 text-orange-600" />
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
                  <p className="text-sm font-medium text-gray-600">Tipo Más Popular</p>
                  <p className="text-lg font-bold text-gray-900 capitalize">{stats.topPropertyType}</p>
                </div>
                <div className="w-12 h-12 bg-teal-100 rounded-lg flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-teal-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters and Export */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Lista de Propiedades</span>
              <Button onClick={exportToCSV} variant="outline">
                <Download className="w-4 h-4 mr-2" />
                Exportar CSV
              </Button>
            </CardTitle>
            <CardDescription>
              Propiedades registradas en el sistema con filtros y búsqueda
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
              
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-full md:w-48">
                  <SelectValue placeholder="Filtrar por tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los tipos</SelectItem>
                  <SelectItem value="departamento">Departamento</SelectItem>
                  <SelectItem value="casa">Casa</SelectItem>
                  <SelectItem value="oficina">Oficina</SelectItem>
                  <SelectItem value="local">Local Comercial</SelectItem>
                  <SelectItem value="bodega">Bodega</SelectItem>
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
                    <th className="border border-gray-300 px-4 py-2 text-left">Características</th>
                    <th className="border border-gray-300 px-4 py-2 text-left">Propietario</th>
                    <th className="border border-gray-300 px-4 py-2 text-left">Estadísticas</th>
                    <th className="border border-gray-300 px-4 py-2 text-left">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredProperties.map((property) => (
                    <tr key={property.id} className="hover:bg-gray-50">
                      <td className="border border-gray-300 px-4 py-2">
                        <div>
                          <div className="font-medium">{property.title}</div>
                          <div className="text-sm text-gray-600 flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            {property.address}
                          </div>
                          <div className="text-xs text-gray-500">
                            Creado: {formatDate(property.createdAt)}
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
                          <div>{property.bedrooms} dorm • {property.bathrooms} baños</div>
                          <div>{property.area} m²</div>
                          <div className="text-xs text-gray-500 capitalize">{property.type}</div>
                        </div>
                      </td>
                      <td className="border border-gray-300 px-4 py-2">
                        <div>
                          <div className="font-medium">{property.owner}</div>
                          <div className="text-sm text-gray-600">{property.ownerEmail}</div>
                        </div>
                      </td>
                      <td className="border border-gray-300 px-4 py-2">
                        <div className="text-sm">
                          <div className="flex items-center gap-1">
                            <Eye className="w-3 h-3" />
                            {property.views} vistas
                          </div>
                          <div className="flex items-center gap-1">
                            <Users className="w-3 h-3" />
                            {property.inquiries} consultas
                          </div>
                          <div className="flex items-center gap-1">
                            <Star className="w-3 h-3 text-yellow-500 fill-current" />
                            {property.rating.toFixed(1)}
                          </div>
                        </div>
                      </td>
                      <td className="border border-gray-300 px-4 py-2">
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline">
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button size="sm" variant="outline">
                            <Edit className="w-4 h-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {filteredProperties.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                No se encontraron propiedades con los filtros seleccionados
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout
  );
}



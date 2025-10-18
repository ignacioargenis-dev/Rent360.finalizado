'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Search,
  Filter,
  Eye,
  Settings,
  Play,
  Pause,
  Trash2,
  Edit,
  Plus,
  Camera,
  Building,
  User,
  Calendar,
  AlertCircle,
  CheckCircle,
  Info,
  RefreshCw,
} from 'lucide-react';
import UnifiedDashboardLayout from '@/components/layout/UnifiedDashboardLayout';
import { useAuth } from '@/components/auth/AuthProviderSimple';
import { logger } from '@/lib/logger-minimal';

interface VirtualTourProperty {
  id: string;
  title: string;
  address: string;
  city: string;
  commune: string;
  owner: {
    name: string;
    email: string;
  };
  virtualTourEnabled: boolean;
  virtualTourData: string | null;
  scenesCount: number;
  lastUpdated: string;
  status: 'active' | 'inactive' | 'pending';
}

interface VirtualTourStats {
  totalTours: number;
  activeTours: number;
  inactiveTours: number;
  pendingTours: number;
  totalScenes: number;
  averageScenesPerTour: number;
}

export default function AdminVirtualToursPage() {
  const { user } = useAuth();
  const [properties, setProperties] = useState<VirtualTourProperty[]>([]);
  const [filteredProperties, setFilteredProperties] = useState<VirtualTourProperty[]>([]);
  const [stats, setStats] = useState<VirtualTourStats>({
    totalTours: 0,
    activeTours: 0,
    inactiveTours: 0,
    pendingTours: 0,
    totalScenes: 0,
    averageScenesPerTour: 0,
  });
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchVirtualTours();
  }, []);

  useEffect(() => {
    filterProperties();
  }, [properties, searchQuery, statusFilter]);

  const fetchVirtualTours = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/admin/virtual-tours');
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setProperties(data.properties || []);
          setStats(data.stats || stats);
        } else {
          setError(data.error || 'Error al cargar los tours virtuales');
        }
      } else {
        setError('Error al cargar los tours virtuales');
      }
    } catch (error) {
      logger.error('Error cargando tours virtuales:', { error });
      setError('Error al cargar los tours virtuales');
    } finally {
      setLoading(false);
    }
  };

  const filterProperties = () => {
    let filtered = properties;

    // Filtrar por búsqueda
    if (searchQuery) {
      filtered = filtered.filter(
        property =>
          property.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          property.address.toLowerCase().includes(searchQuery.toLowerCase()) ||
          property.owner.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Filtrar por estado
    if (statusFilter !== 'all') {
      filtered = filtered.filter(property => property.status === statusFilter);
    }

    setFilteredProperties(filtered);
  };

  const handleToggleTour = async (propertyId: string, enabled: boolean) => {
    try {
      const response = await fetch(`/api/properties/${propertyId}/virtual-tour`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          isEnabled: enabled,
        }),
      });

      if (response.ok) {
        setProperties(prev =>
          prev.map(property =>
            property.id === propertyId ? { ...property, virtualTourEnabled: enabled } : property
          )
        );
        logger.info('Tour virtual actualizado', { propertyId, enabled });
      } else {
        setError('Error al actualizar el tour virtual');
      }
    } catch (error) {
      logger.error('Error actualizando tour virtual:', { error, propertyId });
      setError('Error al actualizar el tour virtual');
    }
  };

  const handleDeleteTour = async (propertyId: string) => {
    if (!confirm('¿Estás seguro de que quieres eliminar este tour virtual?')) {
      return;
    }

    try {
      const response = await fetch(`/api/properties/${propertyId}/virtual-tour`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setProperties(prev => prev.filter(property => property.id !== propertyId));
        logger.info('Tour virtual eliminado', { propertyId });
      } else {
        setError('Error al eliminar el tour virtual');
      }
    } catch (error) {
      logger.error('Error eliminando tour virtual:', { error, propertyId });
      setError('Error al eliminar el tour virtual');
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge variant="default">Activo</Badge>;
      case 'inactive':
        return <Badge variant="secondary">Inactivo</Badge>;
      case 'pending':
        return <Badge variant="outline">Pendiente</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  if (loading) {
    return (
      <UnifiedDashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Cargando tours virtuales...</p>
          </div>
        </div>
      </UnifiedDashboardLayout>
    );
  }

  return (
    <UnifiedDashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Gestión de Tours Virtuales</h1>
            <p className="text-gray-600">
              Administra los tours virtuales 360° de todas las propiedades
            </p>
          </div>
          <Button onClick={fetchVirtualTours} variant="outline" className="flex items-center gap-2">
            <RefreshCw className="w-4 h-4" />
            Actualizar
          </Button>
        </div>

        {/* Alerts */}
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Estadísticas */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Tours</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.totalTours}</p>
                </div>
                <Camera className="w-8 h-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Tours Activos</p>
                  <p className="text-2xl font-bold text-green-600">{stats.activeTours}</p>
                </div>
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Tours Inactivos</p>
                  <p className="text-2xl font-bold text-gray-600">{stats.inactiveTours}</p>
                </div>
                <Pause className="w-8 h-8 text-gray-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Escenas</p>
                  <p className="text-2xl font-bold text-purple-600">{stats.totalScenes}</p>
                </div>
                <Building className="w-8 h-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filtros y Búsqueda */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Buscar por título, dirección o propietario..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <div className="w-full md:w-48">
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Filtrar por estado" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos los estados</SelectItem>
                    <SelectItem value="active">Activos</SelectItem>
                    <SelectItem value="inactive">Inactivos</SelectItem>
                    <SelectItem value="pending">Pendientes</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tabla de Tours Virtuales */}
        <Card>
          <CardHeader>
            <CardTitle>Tours Virtuales ({filteredProperties.length})</CardTitle>
            <CardDescription>
              Lista de todos los tours virtuales configurados en el sistema
            </CardDescription>
          </CardHeader>
          <CardContent>
            {filteredProperties.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Propiedad</TableHead>
                    <TableHead>Propietario</TableHead>
                    <TableHead>Escenas</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Última Actualización</TableHead>
                    <TableHead>Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredProperties.map(property => (
                    <TableRow key={property.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{property.title}</p>
                          <p className="text-sm text-gray-600">{property.address}</p>
                          <p className="text-sm text-gray-500">
                            {property.city}, {property.commune}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{property.owner.name}</p>
                          <p className="text-sm text-gray-600">{property.owner.email}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{property.scenesCount} escenas</Badge>
                      </TableCell>
                      <TableCell>{getStatusBadge(property.status)}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-gray-400" />
                          <span className="text-sm text-gray-600">
                            {new Date(property.lastUpdated).toLocaleDateString()}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              handleToggleTour(property.id, !property.virtualTourEnabled)
                            }
                            className="flex items-center gap-1"
                          >
                            {property.virtualTourEnabled ? (
                              <>
                                <Pause className="w-3 h-3" />
                                Desactivar
                              </>
                            ) : (
                              <>
                                <Play className="w-3 h-3" />
                                Activar
                              </>
                            )}
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              window.open(`/owner/properties/${property.id}/virtual-tour`, '_blank')
                            }
                            className="flex items-center gap-1"
                          >
                            <Settings className="w-3 h-3" />
                            Configurar
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeleteTour(property.id)}
                            className="flex items-center gap-1 text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="w-3 h-3" />
                            Eliminar
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Camera className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p className="text-lg font-medium mb-2">No hay tours virtuales</p>
                <p className="text-sm">
                  {searchQuery || statusFilter !== 'all'
                    ? 'No se encontraron tours virtuales con los filtros aplicados'
                    : 'No hay tours virtuales configurados en el sistema'}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </UnifiedDashboardLayout>
  );
}

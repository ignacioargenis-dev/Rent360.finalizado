'use client';

// Build fix - force update

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { logger } from '@/lib/logger-minimal';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import UnifiedDashboardLayout from '@/components/layout/UnifiedDashboardLayout';
import {
  MapPin,
  Calendar,
  Clock,
  Phone,
  Mail,
  Wrench,
  CheckCircle,
  AlertTriangle,
  Eye,
  Navigation,
  User,
  Home,
} from 'lucide-react';
import Link from 'next/link';
import { User as UserType } from '@/types';

interface AssignedProperty {
  id: string;
  propertyTitle: string;
  propertyAddress: string;
  propertyType: 'apartment' | 'house' | 'office' | 'commercial';
  clientName: string;
  clientPhone: string;
  clientEmail: string;
  serviceType: 'maintenance' | 'repair' | 'installation' | 'inspection' | 'cleaning';
  scheduledDate: string;
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  description: string;
  estimatedDuration: number; // in hours
  lastVisit: string | undefined;
  totalVisits: number;
}

interface PropertyStats {
  totalProperties: number;
  pendingVisits: number;
  completedThisMonth: number;
  upcomingVisits: number;
}

interface VisitFilter {
  status: string;
  serviceType: string;
  priority: string;
}

export default function RunnerPropertiesPage() {
  const router = useRouter();
  const [user, setUser] = useState<UserType | null>(null);
  const [properties, setProperties] = useState<AssignedProperty[]>([]);
  const [stats, setStats] = useState<PropertyStats>({
    totalProperties: 0,
    pendingVisits: 0,
    completedThisMonth: 0,
    upcomingVisits: 0,
  });
  const [filters, setFilters] = useState<VisitFilter>({
    status: 'all',
    serviceType: 'all',
    priority: 'all',
  });
  const [loading, setLoading] = useState(true);

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

    const loadPropertiesData = async () => {
      try {
        // Mock assigned properties data
        const mockProperties: AssignedProperty[] = [
          {
            id: '1',
            propertyTitle: 'Apartamento Centro',
            propertyAddress: 'Av. Providencia 123, Santiago Centro',
            propertyType: 'apartment',
            clientName: 'María González',
            clientPhone: '+56912345678',
            clientEmail: 'maria@example.com',
            serviceType: 'maintenance',
            scheduledDate: new Date(Date.now() + 1000 * 60 * 60 * 2).toISOString(), // 2 hours from now
            status: 'pending',
            priority: 'high',
            description: 'Revisión de sistema eléctrico y plomería',
            estimatedDuration: 3,
            lastVisit: new Date(Date.now() - 1000 * 60 * 60 * 24 * 30).toISOString(),
            totalVisits: 5,
          },
          {
            id: '2',
            propertyTitle: 'Casa Los Dominicos',
            propertyAddress: 'Camino Los Dominicos 456, Las Condes',
            propertyType: 'house',
            clientName: 'Carlos Rodríguez',
            clientPhone: '+56987654321',
            clientEmail: 'carlos@example.com',
            serviceType: 'repair',
            scheduledDate: new Date(Date.now() + 1000 * 60 * 60 * 24).toISOString(), // tomorrow
            status: 'in_progress',
            priority: 'urgent',
            description: 'Reparación de fuga de agua en cocina',
            estimatedDuration: 2,
            lastVisit: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7).toISOString(),
            totalVisits: 2,
          },
          {
            id: '3',
            propertyTitle: 'Oficina Las Condes',
            propertyAddress: 'Av. Apoquindo 789, Las Condes',
            propertyType: 'office',
            clientName: 'Ana López',
            clientPhone: '+56955556666',
            clientEmail: 'ana@example.com',
            serviceType: 'installation',
            scheduledDate: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(), // 2 days ago
            status: 'completed',
            priority: 'medium',
            description: 'Instalación de sistema de climatización',
            estimatedDuration: 6,
            lastVisit: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(),
            totalVisits: 1,
          },
          {
            id: '4',
            propertyTitle: 'Local Comercial',
            propertyAddress: 'Av. Libertador 321, Providencia',
            propertyType: 'commercial',
            clientName: 'Pedro Martínez',
            clientPhone: '+56944445555',
            clientEmail: 'pedro@example.com',
            serviceType: 'inspection',
            scheduledDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 3).toISOString(), // 3 days from now
            status: 'pending',
            priority: 'low',
            description: 'Inspección anual de seguridad eléctrica',
            estimatedDuration: 4,
            lastVisit: new Date(Date.now() - 1000 * 60 * 60 * 24 * 365).toISOString(),
            totalVisits: 3,
          },
          {
            id: '5',
            propertyTitle: 'Casa Vitacura',
            propertyAddress: 'Av. Vitacura 987, Vitacura',
            propertyType: 'house',
            clientName: 'Sofia Herrera',
            clientPhone: '+56933334444',
            clientEmail: 'sofia@example.com',
            serviceType: 'cleaning',
            scheduledDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7).toISOString(), // 1 week from now
            status: 'pending',
            priority: 'medium',
            description: 'Limpieza profunda post-mudanza',
            estimatedDuration: 8,
            lastVisit: undefined,
            totalVisits: 0,
          },
        ];

        setProperties(mockProperties);

        // Calculate stats
        const propertyStats: PropertyStats = {
          totalProperties: mockProperties.length,
          pendingVisits: mockProperties.filter(p => p.status === 'pending').length,
          completedThisMonth: mockProperties.filter(p => p.status === 'completed').length,
          upcomingVisits: mockProperties.filter(p => new Date(p.scheduledDate) > new Date()).length,
        };

        setStats(propertyStats);
        setLoading(false);
      } catch (error) {
        logger.error('Error loading properties data:', {
          error: error instanceof Error ? error.message : String(error),
        });
        setLoading(false);
      }
    };

    loadUserData();
    loadPropertiesData();
  }, []);

  const getFilteredProperties = () => {
    let filtered = properties;

    if (filters.status !== 'all') {
      filtered = filtered.filter(property => property.status === filters.status);
    }

    if (filters.serviceType !== 'all') {
      filtered = filtered.filter(property => property.serviceType === filters.serviceType);
    }

    if (filters.priority !== 'all') {
      filtered = filtered.filter(property => property.priority === filters.priority);
    }

    return filtered;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'in_progress':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'completed':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'cancelled':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800">Pendiente</Badge>;
      case 'in_progress':
        return <Badge className="bg-blue-100 text-blue-800">En Progreso</Badge>;
      case 'completed':
        return <Badge className="bg-green-100 text-green-800">Completado</Badge>;
      case 'cancelled':
        return <Badge className="bg-red-100 text-red-800">Cancelado</Badge>;
      default:
        return <Badge>Desconocido</Badge>;
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return <Badge className="bg-red-100 text-red-800">Urgente</Badge>;
      case 'high':
        return <Badge className="bg-orange-100 text-orange-800">Alta</Badge>;
      case 'medium':
        return <Badge className="bg-yellow-100 text-yellow-800">Media</Badge>;
      case 'low':
        return <Badge className="bg-green-100 text-green-800">Baja</Badge>;
      default:
        return <Badge>Normal</Badge>;
    }
  };

  const getServiceTypeIcon = (serviceType: string) => {
    switch (serviceType) {
      case 'maintenance':
        return <Wrench className="w-4 h-4" />;
      case 'repair':
        return <AlertTriangle className="w-4 h-4" />;
      case 'installation':
        return <CheckCircle className="w-4 h-4" />;
      case 'inspection':
        return <Eye className="w-4 h-4" />;
      case 'cleaning':
        return <Home className="w-4 h-4" />;
      default:
        return <Wrench className="w-4 h-4" />;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-CL', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getTimeUntilVisit = (scheduledDate: string) => {
    const now = new Date();
    const scheduled = new Date(scheduledDate);
    const diffMs = scheduled.getTime() - now.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffMs < 0) {
      return 'Vencida';
    }

    if (diffDays > 0) {
      return `En ${diffDays} día${diffDays > 1 ? 's' : ''}`;
    }

    if (diffHours > 0) {
      return `En ${diffHours} hora${diffHours > 1 ? 's' : ''}`;
    }

    return 'Ahora';
  };

  const handleStartVisit = async (propertyId: string) => {
    const property = properties.find(p => p.id === propertyId);
    if (property) {
      // Update property status to 'in_progress'
      setProperties(prevProperties =>
        prevProperties.map(p =>
          p.id === propertyId
            ? { ...p, status: 'in_progress' as const, lastVisit: new Date().toISOString() }
            : p
        )
      );
      // Navigate to visit detail
      router.push(`/runner/visits/${propertyId}`);
    }
  };

  const handleCompleteVisit = async (propertyId: string) => {
    const property = properties.find(p => p.id === propertyId);
    if (property) {
      // Update property status to 'completed'
      setProperties(prevProperties =>
        prevProperties.map(p =>
          p.id === propertyId
            ? { ...p, status: 'completed' as const, lastVisit: new Date().toISOString() }
            : p
        )
      );
      // Navigate to photos upload
      router.push(`/runner/photos?visitId=${propertyId}&action=complete`);
    }
  };

  const handleContactClient = async (phone: string) => {
    window.open(`tel:${phone}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando propiedades asignadas...</p>
        </div>
      </div>
    );
  }

  return (
    <UnifiedDashboardLayout
      title="Propiedades Asignadas"
      subtitle="Gestión de propiedades asignadas para visitas"
    >
      <div className="container mx-auto px-4 py-6">
        {/* Header with filters */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-8 gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Propiedades Asignadas</h1>
            <p className="text-gray-600">Gestiona tus visitas y servicios programados</p>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Propiedades</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.totalProperties}</p>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Home className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Visitas Pendientes</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.pendingVisits}</p>
                </div>
                <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                  <Clock className="w-6 h-6 text-yellow-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Completadas este mes</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.completedThisMonth}</p>
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
                  <p className="text-sm font-medium text-gray-600">Próximas Visitas</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.upcomingVisits}</p>
                </div>
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                  <Calendar className="w-6 h-6 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-4 mb-6">
          <Select
            value={filters.status}
            onValueChange={value => setFilters(prev => ({ ...prev, status: value }))}
          >
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Todos los estados" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los estados</SelectItem>
              <SelectItem value="pending">Pendientes</SelectItem>
              <SelectItem value="in_progress">En Progreso</SelectItem>
              <SelectItem value="completed">Completadas</SelectItem>
              <SelectItem value="cancelled">Canceladas</SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={filters.serviceType}
            onValueChange={value => setFilters(prev => ({ ...prev, serviceType: value }))}
          >
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Tipo de servicio" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los servicios</SelectItem>
              <SelectItem value="maintenance">Mantenimiento</SelectItem>
              <SelectItem value="repair">Reparación</SelectItem>
              <SelectItem value="installation">Instalación</SelectItem>
              <SelectItem value="inspection">Inspección</SelectItem>
              <SelectItem value="cleaning">Limpieza</SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={filters.priority}
            onValueChange={value => setFilters(prev => ({ ...prev, priority: value }))}
          >
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Prioridad" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas</SelectItem>
              <SelectItem value="urgent">Urgente</SelectItem>
              <SelectItem value="high">Alta</SelectItem>
              <SelectItem value="medium">Media</SelectItem>
              <SelectItem value="low">Baja</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Properties List */}
        <div className="space-y-4">
          {getFilteredProperties().length === 0 ? (
            <Card>
              <CardContent className="pt-8 pb-8 text-center">
                <Home className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No hay propiedades asignadas
                </h3>
                <p className="text-gray-600">
                  Actualmente no tienes propiedades asignadas para visitar
                </p>
              </CardContent>
            </Card>
          ) : (
            getFilteredProperties().map(property => (
              <Card key={property.id} className="hover:shadow-md transition-shadow">
                <CardContent className="pt-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4 flex-1">
                      <div
                        className={`p-2 rounded-lg ${
                          property.status === 'pending'
                            ? 'bg-yellow-100 text-yellow-600'
                            : property.status === 'in_progress'
                              ? 'bg-blue-100 text-blue-600'
                              : property.status === 'completed'
                                ? 'bg-green-100 text-green-600'
                                : 'bg-red-100 text-red-600'
                        }`}
                      >
                        {getServiceTypeIcon(property.serviceType)}
                      </div>

                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-semibold text-gray-900">{property.propertyTitle}</h3>
                          {getStatusBadge(property.status)}
                          {getPriorityBadge(property.priority)}
                        </div>

                        <div className="flex items-center gap-1 text-sm text-gray-600 mb-2">
                          <MapPin className="w-4 h-4" />
                          <span>{property.propertyAddress}</span>
                        </div>

                        <p className="text-sm text-gray-600 mb-3">{property.description}</p>

                        <div className="flex items-center gap-4 mb-3">
                          <div className="flex items-center gap-1 text-sm text-gray-600">
                            <User className="w-4 h-4" />
                            <span>{property.clientName}</span>
                          </div>
                          <div className="flex items-center gap-1 text-sm text-gray-600">
                            <Calendar className="w-4 h-4" />
                            <span>{formatDate(property.scheduledDate)}</span>
                          </div>
                          <div className="flex items-center gap-1 text-sm text-gray-600">
                            <Clock className="w-4 h-4" />
                            <span>{property.estimatedDuration}h estimadas</span>
                          </div>
                        </div>

                        <div className="flex items-center justify-between text-xs text-gray-500">
                          <div className="flex items-center gap-4">
                            <span>{getTimeUntilVisit(property.scheduledDate)}</span>
                            {property.lastVisit && (
                              <span>Última visita: {formatDate(property.lastVisit)}</span>
                            )}
                            <span>{property.totalVisits} visitas totales</span>
                          </div>

                          <div className="flex items-center gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleContactClient(property.clientPhone)}
                            >
                              <Phone className="w-4 h-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => window.open(`mailto:${property.clientEmail}`)}
                            >
                              <Mail className="w-4 h-4" />
                            </Button>
                            <Button size="sm" variant="outline">
                              <Navigation className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 ml-4">
                      {property.status === 'pending' && (
                        <Button size="sm" onClick={() => handleStartVisit(property.id)}>
                          Iniciar Visita
                        </Button>
                      )}
                      {property.status === 'in_progress' && (
                        <Button size="sm" onClick={() => handleCompleteVisit(property.id)}>
                          Completar
                        </Button>
                      )}
                      <Button size="sm" variant="outline">
                        <Eye className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </UnifiedDashboardLayout>
  );
}

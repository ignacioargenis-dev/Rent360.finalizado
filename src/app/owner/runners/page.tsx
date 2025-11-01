'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { logger } from '@/lib/logger-minimal';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import UnifiedDashboardLayout from '@/components/layout/UnifiedDashboardLayout';
import {
  Search,
  Filter,
  MapPin,
  Star,
  Phone,
  User,
  Calendar,
  Clock,
  CheckCircle,
  AlertTriangle,
  MessageSquare,
  UserPlus,
  Home,
  DollarSign,
  Award,
  Eye,
} from 'lucide-react';

interface Runner {
  id: string;
  name: string;
  email: string;
  phone: string;
  avatar?: string;
  rating: number;
  totalJobs: number;
  verified: boolean;
  location: string;
  services: string[];
  experience: string;
  hourlyRate: number;
  availability: 'available' | 'busy' | 'offline';
  specialties: string[];
  languages: string[];
  lastActive: string;
  completedJobs: number;
  responseTime: string;
}

interface RunnerFilters {
  location: string;
  rating: string;
  availability: string;
  maxRate: string;
  locationSearch: string;
}

interface AssignedRunner {
  runner: {
    id: string;
    name: string;
    email: string;
    phone: string;
    avatar?: string;
    city?: string;
    commune?: string;
  };
  stats: {
    totalVisits: number;
    completedVisits: number;
    pendingVisits: number;
    totalEarnings: number;
    averageRating: number;
    lastVisitDate: string | null;
    firstAssignedDate: string;
    propertiesCount: number;
  };
  recentVisits: Array<{
    id: string;
    propertyTitle: string;
    propertyAddress: string;
    scheduledAt: string;
    status: string;
    earnings: number;
    photosTaken: number;
  }>;
}

export default function OwnerRunnersPage() {
  const router = useRouter();
  const [runners, setRunners] = useState<Runner[]>([]);
  const [assignedRunners, setAssignedRunners] = useState<AssignedRunner[]>([]);
  const [filteredRunners, setFilteredRunners] = useState<Runner[]>([]);
  const [activeTab, setActiveTab] = useState<'available' | 'assigned'>('available');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedRunner, setSelectedRunner] = useState<Runner | null>(null);
  const [showHireModal, setShowHireModal] = useState(false);
  const [filters, setFilters] = useState<RunnerFilters>({
    location: 'all',
    rating: 'all',
    availability: 'all',
    maxRate: 'all',
    locationSearch: '',
  });

  // Estados para contratación
  const [hireData, setHireData] = useState({
    estimatedHours: 2,
    preferredDate: '',
    preferredTime: '',
    specialInstructions: '',
    urgency: 'normal',
    propertyId: '', // Agregado para selección de propiedad
  });
  const [ownerProperties, setOwnerProperties] = useState<Array<{ id: string; title: string; address: string }>>([]);
  const [loadingProperties, setLoadingProperties] = useState(false);

  const applyFilters = useCallback(() => {
    let filtered = runners;

    // Location filter
    if (filters.location !== 'all') {
      filtered = filtered.filter(runner =>
        runner.location.toLowerCase().includes(filters.location.toLowerCase())
      );
    }

    // Rating filter
    if (filters.rating !== 'all') {
      const minRating = parseFloat(filters.rating);
      filtered = filtered.filter(runner => runner.rating >= minRating);
    }

    // Availability filter
    if (filters.availability !== 'all') {
      filtered = filtered.filter(runner => runner.availability === filters.availability);
    }

    // Max rate filter
    if (filters.maxRate !== 'all') {
      const maxRate = parseInt(filters.maxRate);
      filtered = filtered.filter(runner => runner.hourlyRate <= maxRate);
    }

    setFilteredRunners(filtered);
  }, [runners, filters]);

  const loadOwnerProperties = async () => {
    try {
      setLoadingProperties(true);
      const response = await fetch('/api/owner/properties', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

      if (data.success) {
        setOwnerProperties(
          data.properties.map((prop: any) => ({
            id: prop.id,
            title: prop.title,
            address: prop.address || `${prop.city || ''}, ${prop.commune || ''}`,
          }))
        );
      }
    } catch (error) {
      logger.error('Error loading owner properties:', { error });
    } finally {
      setLoadingProperties(false);
    }
  };

  const loadAssignedRunners = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/owner/runners/assigned', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

      if (data.success) {
        setAssignedRunners(data.runners || []);
      } else {
        throw new Error(data.error || 'Error al cargar runners asignados');
      }

      setLoading(false);
    } catch (error) {
      logger.error('Error loading assigned runners:', { error });
      setError('Error al cargar runners asignados');
      setLoading(false);
    }
  };

  const loadRunners = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/owner/runners', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

      if (data.success) {
        // Transformar datos de la API al formato esperado por la UI
        const transformedRunners: Runner[] = data.runners.map((runner: any) => {
          // Parsear configuraciones del runner desde bio (JSON)
          let runnerSettings: any = {};
          if (runner.bio) {
            try {
              runnerSettings = JSON.parse(runner.bio);
            } catch (e) {
              logger.warn('Error parsing runner bio', { runnerId: runner.id, error: e });
            }
          }

          // Obtener datos reales del runner
          const hourlyRate = runnerSettings.hourlyRate || 15000;
          const specialties = runnerSettings.specialties || ['Inspecciones profesionales', 'Fotografía especializada'];
          const languages = runnerSettings.languages || ['Español'];
          const services = runnerSettings.services || ['Visitas de inspección', 'Reportes fotográficos', 'Evaluaciones'];
          const availability = runnerSettings.availability || 'available';
          const responseTime = runnerSettings.responseTime || '< 2 horas';
          const experience = runnerSettings.experience || 'Verificado';

          return {
            id: runner.id,
            name: runner.name,
            email: runner.email,
            phone: runner.phone || '',
            avatar: runner.avatar,
            rating: runner.stats.averageRating || 0,
            totalJobs: runner.stats.totalVisits,
            verified: true, // Asumimos que todos los corredores en la API están verificados
            location: `${runner.city || 'Santiago'}, ${runner.commune || 'Centro'}`,
            services,
            experience,
            hourlyRate,
            availability: availability as 'available' | 'busy' | 'offline',
            specialties,
            languages,
            lastActive: runner.memberSince ? new Date(runner.memberSince).toISOString() : new Date().toISOString(),
            completedJobs: runner.stats.totalVisits,
            responseTime,
          };
        });

        setRunners(transformedRunners);
      } else {
        throw new Error(data.error || 'Error al cargar corredores');
      }

      setLoading(false);
    } catch (error) {
      logger.error('Error loading runners:', { error });
      setError('Error al cargar corredores');
      setLoading(false);
    }
  };

  // Hooks - deben estar después de las funciones que usan
  useEffect(() => {
    if (activeTab === 'available') {
      loadRunners();
    } else {
      loadAssignedRunners();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  // Cargar propiedades del propietario cuando se monta el componente
  useEffect(() => {
    loadOwnerProperties();
  }, []);

  useEffect(() => {
    if (activeTab === 'available') {
      applyFilters();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [applyFilters, activeTab]);

  const handleSubmitHire = async () => {
    if (!selectedRunner || !hireData.propertyId) {
      return;
    }

    try {
      logger.info('Procesando contratación:', {
        runnerId: selectedRunner.id,
        hireData,
      });

      // Validar fecha y hora
      if (!hireData.preferredDate || !hireData.preferredTime) {
        alert('Por favor selecciona fecha y hora preferidas');
        return;
      }

      // Formatear fecha y hora en formato ISO 8601 para el backend
      const scheduledAt = new Date(`${hireData.preferredDate}T${hireData.preferredTime}:00Z`).toISOString();

      // Llamar a la API de asignación de corredor
      const response = await fetch(`/api/owner/runners/${selectedRunner.id}/assign`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          propertyId: hireData.propertyId,
          scheduledAt: scheduledAt,
          duration: hireData.estimatedHours * 60, // Convertir horas a minutos
          notes: hireData.specialInstructions || undefined,
          estimatedEarnings: selectedRunner.hourlyRate * hireData.estimatedHours,
        }),
      });

      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

      if (data.success) {
        const successMessage = `¡Contratación exitosa!\n\nRunner: ${selectedRunner.name}\nFecha preferida: ${hireData.preferredDate || 'Por coordinar'}\nHoras estimadas: ${hireData.estimatedHours}\nCosto estimado: $${(selectedRunner.hourlyRate * hireData.estimatedHours).toLocaleString()}\n\nSe ha enviado la solicitud al runner. Recibirás una confirmación pronto.`;
        alert(successMessage);

        setShowHireModal(false);
        setSelectedRunner(null);
        setHireData({
          estimatedHours: 2,
          preferredDate: '',
          preferredTime: '',
          specialInstructions: '',
          urgency: 'normal',
          propertyId: '',
        });
      } else {
        throw new Error(data.error || 'Error al procesar la contratación');
      }
    } catch (error) {
      logger.error('Error en contratación:', { error });
      alert('Error al procesar la contratación. Intente nuevamente.');
    }
  };

  const handleRetry = () => {
    if (activeTab === 'available') {
      loadRunners();
    } else {
      loadAssignedRunners();
    }
  };

  if (loading) {
    return (
      <UnifiedDashboardLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Cargando corredores...</p>
          </div>
        </div>
      </UnifiedDashboardLayout>
    );
  }

  if (error) {
    return (
      <UnifiedDashboardLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <AlertTriangle className="h-12 w-12 text-red-600 mx-auto" />
            <p className="mt-4 text-gray-600">{error}</p>
            <Button onClick={handleRetry} className="mt-4">
              Reintentar
            </Button>
          </div>
        </div>
      </UnifiedDashboardLayout>
    );
  }

  return (
    <UnifiedDashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Gestión de Runners</h1>
            <p className="text-gray-600">
              {activeTab === 'available'
                ? 'Encuentra y contrata corredores para tus propiedades'
                : 'Visualiza la actividad y estadísticas de tus runners asignados'}
            </p>
          </div>
          <Button
            onClick={() => (activeTab === 'available' ? loadRunners() : loadAssignedRunners())}
            variant="outline"
            size="sm"
          >
            <Filter className="w-4 h-4 mr-2" />
            Actualizar
          </Button>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('assigned')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'assigned'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Mis Runners ({assignedRunners.length})
            </button>
            <button
              onClick={() => setActiveTab('available')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'available'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Disponibles ({filteredRunners.length})
            </button>
          </nav>
        </div>

        {/* Assigned Runners Tab */}
        {activeTab === 'assigned' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {assignedRunners.map((assignedRunner) => (
              <Card key={assignedRunner.runner.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                        <User className="w-6 h-6 text-blue-600" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">{assignedRunner.runner.name}</CardTitle>
                        <div className="flex items-center space-x-1">
                          <Star className="w-4 h-4 text-yellow-400 fill-current" />
                          <span className="text-sm text-gray-600">
                            {assignedRunner.stats.averageRating.toFixed(1)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <span className="text-gray-600">Visitas:</span>
                        <span className="font-medium ml-1">{assignedRunner.stats.totalVisits}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Completadas:</span>
                        <span className="font-medium ml-1">
                          {assignedRunner.stats.completedVisits}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-600">Propiedades:</span>
                        <span className="font-medium ml-1">
                          {assignedRunner.stats.propertiesCount}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-600">Ganancias:</span>
                        <span className="font-medium ml-1">
                          ${assignedRunner.stats.totalEarnings.toLocaleString()}
                        </span>
                      </div>
                    </div>
                    {assignedRunner.recentVisits.length > 0 && (
                      <div className="mt-3 pt-3 border-t">
                        <p className="text-xs font-medium text-gray-600 mb-2">Últimas visitas:</p>
                        <div className="space-y-1">
                          {assignedRunner.recentVisits.slice(0, 3).map((visit) => (
                            <div key={visit.id} className="text-xs text-gray-600">
                              {visit.propertyTitle} - {new Date(visit.scheduledAt).toLocaleDateString()}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    <Button
                      size="sm"
                      className="w-full mt-4"
                      onClick={() => router.push(`/owner/runners/${assignedRunner.runner.id}`)}
                    >
                      <Eye className="w-4 h-4 mr-2" />
                      Ver Detalles
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
            {assignedRunners.length === 0 && !loading && (
              <div className="col-span-full text-center py-12">
                <User className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No tienes runners asignados
                </h3>
                <p className="text-gray-600">
                  Contrata runners desde la pestaña "Disponibles"
                </p>
              </div>
            )}
          </div>
        )}

        {/* Filters - Solo para runners disponibles */}
        {activeTab === 'available' && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Filtros</CardTitle>
            </CardHeader>
            <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              <div>
                <Label htmlFor="location">Ubicación</Label>
                <Select
                  value={filters.location}
                  onValueChange={value => setFilters({ ...filters, location: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Todas las ubicaciones" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas las ubicaciones</SelectItem>
                    <SelectItem value="santiago">Santiago</SelectItem>
                    <SelectItem value="providencia">Providencia</SelectItem>
                    <SelectItem value="las condes">Las Condes</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="rating">Calificación mínima</Label>
                <Select
                  value={filters.rating}
                  onValueChange={value => setFilters({ ...filters, rating: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Todas las calificaciones" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas las calificaciones</SelectItem>
                    <SelectItem value="4.5">4.5+ estrellas</SelectItem>
                    <SelectItem value="4.0">4.0+ estrellas</SelectItem>
                    <SelectItem value="3.5">3.5+ estrellas</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="availability">Disponibilidad</Label>
                <Select
                  value={filters.availability}
                  onValueChange={value => setFilters({ ...filters, availability: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Todos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="available">Disponible</SelectItem>
                    <SelectItem value="busy">Ocupado</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="maxRate">Precio máximo por hora</Label>
                <Select
                  value={filters.maxRate}
                  onValueChange={value => setFilters({ ...filters, maxRate: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sin límite" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Sin límite</SelectItem>
                    <SelectItem value="15000">$15.000</SelectItem>
                    <SelectItem value="20000">$20.000</SelectItem>
                    <SelectItem value="25000">$25.000</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="search">Buscar por ubicación</Label>
                <Input
                  id="search"
                  placeholder="Ej: Santiago Centro"
                  value={filters.locationSearch}
                  onChange={e => setFilters({ ...filters, locationSearch: e.target.value })}
                />
              </div>
            </div>
          </CardContent>
        </Card>
        )}

        {/* Results - Solo para runners disponibles */}
        {activeTab === 'available' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredRunners.map(runner => (
            <Card key={runner.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                      <User className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{runner.name}</CardTitle>
                      <div className="flex items-center space-x-1">
                        <Star className="w-4 h-4 text-yellow-400 fill-current" />
                        <span className="text-sm text-gray-600">{runner.rating}</span>
                        <span className="text-sm text-gray-500">
                          ({runner.completedJobs} trabajos)
                        </span>
                      </div>
                    </div>
                  </div>
                  {runner.verified && (
                    <Badge className="bg-green-100 text-green-800">
                      <CheckCircle className="w-3 h-3 mr-1" />
                      Verificado
                    </Badge>
                  )}
                </div>
              </CardHeader>

              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center text-sm text-gray-600">
                    <MapPin className="w-4 h-4 mr-2" />
                    {runner.location}
                  </div>

                  <div className="flex items-center text-sm text-gray-600">
                    <DollarSign className="w-4 h-4 mr-2" />${runner.hourlyRate.toLocaleString()} por
                    hora
                  </div>

                  <div className="flex items-center text-sm text-gray-600">
                    <Clock className="w-4 h-4 mr-2" />
                    {runner.responseTime}
                  </div>

                  <div className="flex flex-wrap gap-1 mt-3">
                    {runner.specialties.slice(0, 2).map((specialty, index) => (
                      <Badge key={index} variant="secondary" className="text-xs">
                        {specialty}
                      </Badge>
                    ))}
                  </div>

                  <div className="flex space-x-2 mt-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        // Guardar datos del runner para iniciar conversación
                        const recipientData = {
                          id: runner.id,
                          name: runner.name,
                          email: runner.email,
                          phone: runner.phone,
                          type: 'runner' as const,
                        };
                        sessionStorage.setItem('newMessageRecipient', JSON.stringify(recipientData));
                        router.push('/owner/messages?new=true');
                      }}
                      className="flex-1"
                    >
                      <MessageSquare className="w-4 h-4 mr-2" />
                      Contactar
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => {
                        setSelectedRunner(runner);
                        setShowHireModal(true);
                      }}
                      className="flex-1"
                    >
                      <UserPlus className="w-4 h-4 mr-2" />
                      Contratar
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
          {filteredRunners.length === 0 && !loading && (
            <div className="col-span-full text-center py-12">
              <User className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No se encontraron corredores</h3>
              <p className="text-gray-600">Intenta ajustar los filtros de búsqueda</p>
            </div>
          )}
        </div>
        )}

        {/* Hire Modal */}
        {showHireModal && selectedRunner && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg p-6 max-w-md w-full max-h-[90vh] overflow-y-auto shadow-xl">
              <h3 className="text-lg font-semibold mb-4">Contratar a {selectedRunner.name}</h3>

              <div className="space-y-4">
                <div>
                  <Label htmlFor="property">Seleccionar Propiedad</Label>
                  {loadingProperties ? (
                    <div className="text-sm text-gray-500 py-2">Cargando propiedades...</div>
                  ) : (
                    <Select
                      value={hireData.propertyId}
                      onValueChange={value => setHireData({ ...hireData, propertyId: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona una propiedad" />
                      </SelectTrigger>
                      <SelectContent>
                        {ownerProperties.length > 0 ? (
                          ownerProperties.map(prop => (
                            <SelectItem key={prop.id} value={prop.id}>
                              {prop.title} - {prop.address}
                            </SelectItem>
                          ))
                        ) : (
                          <SelectItem value="" disabled>
                            No hay propiedades disponibles
                          </SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                  )}
                </div>

                <div>
                  <Label htmlFor="hours">Horas estimadas</Label>
                  <Input
                    id="hours"
                    type="number"
                    min="1"
                    max="8"
                    value={hireData.estimatedHours}
                    onChange={e =>
                      setHireData({ ...hireData, estimatedHours: parseInt(e.target.value) || 2 })
                    }
                  />
                </div>

                <div>
                  <Label htmlFor="date">Fecha preferida</Label>
                  <Input
                    id="date"
                    type="date"
                    value={hireData.preferredDate}
                    onChange={e => setHireData({ ...hireData, preferredDate: e.target.value })}
                  />
                </div>

                <div>
                  <Label htmlFor="time">Hora preferida</Label>
                  <Input
                    id="time"
                    type="time"
                    value={hireData.preferredTime}
                    onChange={e => setHireData({ ...hireData, preferredTime: e.target.value })}
                  />
                </div>

                <div>
                  <Label htmlFor="instructions">Instrucciones especiales</Label>
                  <textarea
                    id="instructions"
                    className="w-full p-3 border border-gray-300 rounded-md bg-white text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    rows={3}
                    value={hireData.specialInstructions}
                    onChange={e =>
                      setHireData({ ...hireData, specialInstructions: e.target.value })
                    }
                    placeholder="Describe los requerimientos específicos..."
                  />
                </div>

                <div className="bg-gray-50 p-3 rounded-md">
                  <div className="flex justify-between text-sm">
                    <span>Subtotal:</span>
                    <span>
                      ${(selectedRunner.hourlyRate * hireData.estimatedHours).toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm font-medium mt-1">
                    <span>Total estimado:</span>
                    <span>
                      ${(selectedRunner.hourlyRate * hireData.estimatedHours).toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex space-x-3 mt-6">
                <Button
                  variant="outline"
                  onClick={() => setShowHireModal(false)}
                  className="flex-1"
                >
                  Cancelar
                </Button>
                <Button
                  onClick={handleSubmitHire}
                  className="flex-1 bg-blue-600 hover:bg-blue-700"
                  disabled={
                    !hireData.propertyId || !hireData.preferredDate || !hireData.estimatedHours
                  }
                >
                  <UserPlus className="w-4 h-4 mr-2" />
                  Confirmar Contratación
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </UnifiedDashboardLayout>
  );
}

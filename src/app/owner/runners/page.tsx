'use client';

import { useState, useEffect } from 'react';
import { logger } from '@/lib/logger';
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
  Mail,
  User,
  Calendar,
  Clock,
  CheckCircle,
  AlertTriangle,
  MessageSquare,
  Wrench,
  Home,
  DollarSign,
  Award,
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
  service: string;
  location: string;
  rating: string;
  availability: string;
  maxRate: string;
}

export default function OwnerRunnersPage() {
  const [runners, setRunners] = useState<Runner[]>([]);
  const [filteredRunners, setFilteredRunners] = useState<Runner[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRunner, setSelectedRunner] = useState<Runner | null>(null);
  const [showContactModal, setShowContactModal] = useState(false);
  const [filters, setFilters] = useState<RunnerFilters>({
    service: 'all',
    location: 'all',
    rating: 'all',
    availability: 'all',
    maxRate: 'all',
  });

  useEffect(() => {
    loadRunners();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [runners, filters]);

  const loadRunners = async () => {
    try {
      setLoading(true);

      // Mock data for runners
      const mockRunners: Runner[] = [
        {
          id: '1',
          name: 'Carlos Rodríguez',
          email: 'carlos.runner@email.com',
          phone: '+56987654321',
          rating: 4.8,
          totalJobs: 127,
          verified: true,
          location: 'Santiago Centro',
          services: ['Mantenimiento General', 'Plomería', 'Electricidad'],
          experience: '5 años',
          hourlyRate: 15000,
          availability: 'available',
          specialties: ['Reparaciones urgentes', 'Instalaciones', 'Mantenimiento preventivo'],
          languages: ['Español', 'Inglés'],
          lastActive: '2024-01-20T10:30:00Z',
          completedJobs: 124,
          responseTime: '< 1 hora',
        },
        {
          id: '2',
          name: 'María González',
          email: 'maria.runner@email.com',
          phone: '+56912345678',
          rating: 4.9,
          totalJobs: 89,
          verified: true,
          location: 'Providencia',
          services: ['Limpieza', 'Jardinería', 'Lavandería'],
          experience: '3 años',
          hourlyRate: 12000,
          availability: 'available',
          specialties: ['Limpieza profunda', 'Organización', 'Jardinería'],
          languages: ['Español'],
          lastActive: '2024-01-20T09:15:00Z',
          completedJobs: 87,
          responseTime: '< 30 min',
        },
        {
          id: '3',
          name: 'Pedro Sánchez',
          email: 'pedro.runner@email.com',
          phone: '+56955556666',
          rating: 4.6,
          totalJobs: 156,
          verified: true,
          location: 'Las Condes',
          services: ['Mantenimiento General', 'Pintura', 'Carpintería'],
          experience: '7 años',
          hourlyRate: 18000,
          availability: 'busy',
          specialties: ['Reformas', 'Pintura profesional', 'Trabajos en altura'],
          languages: ['Español', 'Portugués'],
          lastActive: '2024-01-19T16:45:00Z',
          completedJobs: 149,
          responseTime: '< 2 horas',
        },
        {
          id: '4',
          name: 'Ana López',
          email: 'ana.runner@email.com',
          phone: '+56944443333',
          rating: 4.7,
          totalJobs: 73,
          verified: false,
          location: 'Vitacura',
          services: ['Jardinería', 'Piscinas', 'Mantenimiento General'],
          experience: '4 años',
          hourlyRate: 14000,
          availability: 'available',
          specialties: ['Jardinería especializada', 'Mantenimiento de piscinas'],
          languages: ['Español', 'Francés'],
          lastActive: '2024-01-20T11:00:00Z',
          completedJobs: 71,
          responseTime: '< 45 min',
        },
        {
          id: '5',
          name: 'Roberto Silva',
          email: 'roberto.runner@email.com',
          phone: '+56977778888',
          rating: 4.5,
          totalJobs: 98,
          verified: true,
          location: 'Ñuñoa',
          services: ['Electricidad', 'Plomería', 'Gasfitería'],
          experience: '6 años',
          hourlyRate: 16000,
          availability: 'offline',
          specialties: ['Instalaciones eléctricas', 'Reparaciones de urgencia'],
          languages: ['Español'],
          lastActive: '2024-01-18T14:20:00Z',
          completedJobs: 95,
          responseTime: '< 3 horas',
        },
      ];

      setRunners(mockRunners);
    } catch (error) {
      logger.error('Error loading runners:', { error });
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = runners;

    // Service filter
    if (filters.service !== 'all') {
      filtered = filtered.filter(runner =>
        runner.services.some(service =>
          service.toLowerCase().includes(filters.service.toLowerCase())
        )
      );
    }

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
  };

  const getAvailabilityBadge = (availability: string) => {
    switch (availability) {
      case 'available':
        return <Badge className="bg-green-100 text-green-800">Disponible</Badge>;
      case 'busy':
        return <Badge className="bg-yellow-100 text-yellow-800">Ocupado</Badge>;
      case 'offline':
        return <Badge className="bg-gray-100 text-gray-800">Fuera de línea</Badge>;
      default:
        return <Badge>{availability}</Badge>;
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const handleContactRunner = (runner: Runner) => {
    setSelectedRunner(runner);
    setShowContactModal(true);
  };

  const handleSendMessage = (runner: Runner) => {
    logger.info('Enviando mensaje a runner:', { runnerId: runner.id });
    // Implementar navegación a chat o envío de mensaje
    alert(
      `Función próximamente disponible: Enviar mensaje a ${runner.name}. Por ahora puedes contactarlo directamente.`
    );
  };

  const handleHireRunner = (runner: Runner) => {
    logger.info('Contratando runner:', { runnerId: runner.id });
    // Implementar navegación a creación de trabajo
    alert(
      `Función próximamente disponible: Contratar a ${runner.name}. Por ahora puedes contactarlo para coordinar el trabajo.`
    );
  };

  if (loading) {
    return (
      <UnifiedDashboardLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Cargando runners...</p>
          </div>
        </div>
      </UnifiedDashboardLayout>
    );
  }

  return (
    <UnifiedDashboardLayout
      title="Buscar Runners"
      subtitle="Encuentra profesionales verificados para tus propiedades"
    >
      <div className="container mx-auto px-4 py-6 max-w-7xl">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Buscar Runners</h1>
          <p className="text-gray-600">
            Encuentra profesionales verificados para mantenimiento, limpieza y otros servicios
          </p>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              <div>
                <Label htmlFor="service-filter">Servicio</Label>
                <Select
                  value={filters.service}
                  onValueChange={value => setFilters(prev => ({ ...prev, service: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Todos los servicios" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos los servicios</SelectItem>
                    <SelectItem value="Mantenimiento">Mantenimiento</SelectItem>
                    <SelectItem value="Limpieza">Limpieza</SelectItem>
                    <SelectItem value="Plomería">Plomería</SelectItem>
                    <SelectItem value="Electricidad">Electricidad</SelectItem>
                    <SelectItem value="Jardinería">Jardinería</SelectItem>
                    <SelectItem value="Pintura">Pintura</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="location-filter">Ubicación</Label>
                <Select
                  value={filters.location}
                  onValueChange={value => setFilters(prev => ({ ...prev, location: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Todas las ubicaciones" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas las ubicaciones</SelectItem>
                    <SelectItem value="Santiago Centro">Santiago Centro</SelectItem>
                    <SelectItem value="Providencia">Providencia</SelectItem>
                    <SelectItem value="Las Condes">Las Condes</SelectItem>
                    <SelectItem value="Vitacura">Vitacura</SelectItem>
                    <SelectItem value="Ñuñoa">Ñuñoa</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="rating-filter">Calificación Mínima</Label>
                <Select
                  value={filters.rating}
                  onValueChange={value => setFilters(prev => ({ ...prev, rating: value }))}
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
                <Label htmlFor="availability-filter">Disponibilidad</Label>
                <Select
                  value={filters.availability}
                  onValueChange={value => setFilters(prev => ({ ...prev, availability: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Todos los estados" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos los estados</SelectItem>
                    <SelectItem value="available">Disponible</SelectItem>
                    <SelectItem value="busy">Ocupado</SelectItem>
                    <SelectItem value="offline">Fuera de línea</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="rate-filter">Tarifa Máxima</Label>
                <Select
                  value={filters.maxRate}
                  onValueChange={value => setFilters(prev => ({ ...prev, maxRate: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sin límite" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Sin límite</SelectItem>
                    <SelectItem value="12000">$12.000/hora</SelectItem>
                    <SelectItem value="15000">$15.000/hora</SelectItem>
                    <SelectItem value="18000">$18.000/hora</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Results Count */}
        <div className="mb-4">
          <p className="text-gray-600">{filteredRunners.length} runners encontrados</p>
        </div>

        {/* Runners Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredRunners.map(runner => (
            <Card key={runner.id} className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                {/* Runner Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                      <User className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-lg">{runner.name}</h3>
                        {runner.verified && <CheckCircle className="w-4 h-4 text-green-600" />}
                      </div>
                      <div className="flex items-center gap-1 text-sm text-gray-600">
                        <MapPin className="w-3 h-3" />
                        {runner.location}
                      </div>
                    </div>
                  </div>
                  {getAvailabilityBadge(runner.availability)}
                </div>

                {/* Rating and Stats */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-1">
                    <Star className="w-4 h-4 text-yellow-400 fill-current" />
                    <span className="font-semibold">{runner.rating}</span>
                    <span className="text-gray-600">({runner.totalJobs} trabajos)</span>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold text-green-600">
                      {formatCurrency(runner.hourlyRate)}
                    </div>
                    <div className="text-xs text-gray-600">por hora</div>
                  </div>
                </div>

                {/* Services */}
                <div className="mb-4">
                  <h4 className="font-medium text-gray-900 mb-2">Servicios</h4>
                  <div className="flex flex-wrap gap-1">
                    {runner.services.slice(0, 3).map(service => (
                      <Badge key={service} variant="outline" className="text-xs">
                        {service}
                      </Badge>
                    ))}
                    {runner.services.length > 3 && (
                      <Badge variant="outline" className="text-xs">
                        +{runner.services.length - 3}
                      </Badge>
                    )}
                  </div>
                </div>

                {/* Experience and Response Time */}
                <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
                  <div>
                    <span className="text-gray-600">Experiencia:</span>
                    <div className="font-medium">{runner.experience}</div>
                  </div>
                  <div>
                    <span className="text-gray-600">Respuesta:</span>
                    <div className="font-medium">{runner.responseTime}</div>
                  </div>
                </div>

                {/* Languages */}
                <div className="mb-4">
                  <span className="text-sm text-gray-600">Idiomas: </span>
                  <span className="text-sm font-medium">{runner.languages.join(', ')}</span>
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => handleContactRunner(runner)}
                  >
                    <Phone className="w-4 h-4 mr-1" />
                    Contactar
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => handleSendMessage(runner)}
                  >
                    <MessageSquare className="w-4 h-4 mr-1" />
                    Mensaje
                  </Button>
                  <Button
                    size="sm"
                    className="flex-1 bg-blue-600 hover:bg-blue-700"
                    onClick={() => handleHireRunner(runner)}
                  >
                    <Wrench className="w-4 h-4 mr-1" />
                    Contratar
                  </Button>
                </div>

                {/* Last Active */}
                <div className="mt-3 text-xs text-gray-500 text-center">
                  Última actividad: {new Date(runner.lastActive).toLocaleDateString('es-CL')}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredRunners.length === 0 && (
          <Card>
            <CardContent className="text-center py-12">
              <User className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                No se encontraron runners
              </h3>
              <p className="text-gray-600 mb-4">
                Intenta ajustar los filtros de búsqueda para encontrar más profesionales.
              </p>
            </CardContent>
          </Card>
        )}

        {/* Contact Modal */}
        {showContactModal && selectedRunner && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Contactar Runner</h3>
                <button
                  onClick={() => setShowContactModal(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ×
                </button>
              </div>

              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                    <User className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold">{selectedRunner.name}</h4>
                    <div className="flex items-center gap-1 text-sm text-gray-600">
                      <Star className="w-3 h-3 text-yellow-400 fill-current" />
                      {selectedRunner.rating} • {selectedRunner.completedJobs} trabajos completados
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <Button
                    className="w-full"
                    onClick={() => window.open(`tel:${selectedRunner.phone}`, '_blank')}
                  >
                    <Phone className="w-4 h-4 mr-2" />
                    Llamar: {selectedRunner.phone}
                  </Button>

                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() =>
                      window.open(
                        `mailto:${selectedRunner.email}?subject=Solicitud de servicio`,
                        '_blank'
                      )
                    }
                  >
                    <Mail className="w-4 h-4 mr-2" />
                    Email: {selectedRunner.email}
                  </Button>

                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => handleSendMessage(selectedRunner)}
                  >
                    <MessageSquare className="w-4 h-4 mr-2" />
                    Enviar Mensaje
                  </Button>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 text-blue-600 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-blue-900">Recomendaciones</p>
                      <ul className="text-xs text-blue-800 mt-1 space-y-0.5">
                        <li>• Describe detalladamente el trabajo requerido</li>
                        <li>• Pregunta por disponibilidad y costos</li>
                        <li>• Solicita referencias de trabajos anteriores</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </UnifiedDashboardLayout>
  );
}

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
  Mail,
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

export default function OwnerRunnersPage() {
  const router = useRouter();
  const [runners, setRunners] = useState<Runner[]>([]);
  const [filteredRunners, setFilteredRunners] = useState<Runner[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRunner, setSelectedRunner] = useState<Runner | null>(null);
  const [showContactModal, setShowContactModal] = useState(false);
  const [filters, setFilters] = useState<RunnerFilters>({
    location: 'all',
    rating: 'all',
    availability: 'all',
    maxRate: 'all',
    locationSearch: '',
  });

  // Lista completa de comunas chilenas
  const allCommunes = [
    // Región Metropolitana de Santiago
    'Cerrillos',
    'Cerro Navia',
    'Conchalí',
    'El Bosque',
    'Estación Central',
    'Huechuraba',
    'Independencia',
    'La Cisterna',
    'La Florida',
    'La Granja',
    'La Pintana',
    'La Reina',
    'Las Condes',
    'Lo Barnechea',
    'Lo Espejo',
    'Lo Prado',
    'Macul',
    'Maipú',
    'Ñuñoa',
    'Pedro Aguirre Cerda',
    'Peñaflor',
    'Peñalolén',
    'Providencia',
    'Pudahuel',
    'Quilicura',
    'Quinta Normal',
    'Recoleta',
    'Renca',
    'San Bernardo',
    'San Joaquín',
    'San Miguel',
    'San Ramón',
    'Santiago Centro',
    'Vitacura',
    // Región de Valparaíso
    'Valparaíso',
    'Viña del Mar',
    'Quillota',
    'San Antonio',
    'San Felipe',
    'Los Andes',
    'Villa Alemana',
    'Quilpué',
    'Concón',
    'Limache',
    'Olmué',
    'Llaillay',
    'Putaendo',
    'Santa María',
    'Catemu',
    'Panquehue',
    'Llay-Llay',
    'Nogales',
    'La Ligua',
    'Petorca',
    'Cabildo',
    'Papudo',
    'Zapallar',
    'Puchuncaví',
    'Calera',
    'Hijuelas',
    'La Cruz',
    'Casablanca',
    'Juan Fernández',
    'Isla de Pascua',
    // Región del Biobío
    'Concepción',
    'Talcahuano',
    'San Pedro de la Paz',
    'Chiguayante',
    'Coronel',
    'Hualpén',
    'Penco',
    'Tomé',
    'Lota',
    'Hualqui',
    'Florida',
    'Cabrero',
    'Yumbel',
    'Mulchén',
    'Nacimiento',
    'Laja',
    'San Rosendo',
    'Quilleco',
    'Antuco',
    'Santa Bárbara',
    'Quirihue',
    'Cobquecura',
    'Treguaco',
    'Coihueco',
    'Ñiquén',
    'San Carlos',
    'San Nicolás',
    'San Fabián',
    'Alto Biobío',
    'Arauco',
    'Cañete',
    'Contulmo',
    'Curanilahue',
    'Lebu',
    'Los Álamos',
    'Tirúa',
    'Los Ángeles',
    'Chillán',
    'Chillán Viejo',
    // Región de la Araucanía
    'Temuco',
    'Padre Las Casas',
    'Villarrica',
    'Pucón',
    'Valdivia',
    'Osorno',
    'Puerto Montt',
    'Puerto Varas',
    'Frutillar',
    'Punta Arenas',
    'Coyhaique',
    'Iquique',
    'Antofagasta',
    'Calama',
    'Copiapó',
    'La Serena',
    'Coquimbo',
    'Ovalle',
    'Illapel',
    'Rancagua',
    'Talca',
    'Curicó',
    'Linares',
    'Parral',
    'Cauquenes',
  ];

  // Filtrar comunas basado en la búsqueda
  const filteredCommunes = allCommunes.filter(commune =>
    commune.toLowerCase().includes(filters.locationSearch.toLowerCase())
  );

  // Estados para contratación
  const [showHireModal, setShowHireModal] = useState(false);
  const [hireData, setHireData] = useState({
    estimatedHours: 2,
    preferredDate: '',
    preferredTime: '',
    specialInstructions: '',
    urgency: 'normal',
  });

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

  useEffect(() => {
    loadRunners();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [applyFilters]);

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
          services: [
            'Visitas de inspección',
            'Seguimiento de propiedades',
            'Reportes fotográficos',
          ],
          experience: '5 años',
          hourlyRate: 15000,
          availability: 'available',
          specialties: ['Inspecciones rápidas', 'Fotografía profesional', 'Reportes detallados'],
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
          services: ['Entregas de llaves', 'Visitas de verificación', 'Coordinación de visitas'],
          experience: '3 años',
          hourlyRate: 12000,
          availability: 'available',
          specialties: ['Entregas seguras', 'Verificación de daños', 'Coordinación logística'],
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
          services: [
            'Visitas de mantenimiento',
            'Verificación de inquilinos',
            'Gestión de emergencias',
          ],
          experience: '7 años',
          hourlyRate: 18000,
          availability: 'busy',
          specialties: [
            'Manejo de emergencias',
            'Coordinación con proveedores',
            'Supervisión de obras',
          ],
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
          services: [
            'Visitas de valoración',
            'Inspecciones de salida',
            'Documentación fotográfica',
          ],
          experience: '4 años',
          hourlyRate: 14000,
          availability: 'available',
          specialties: ['Valoraciones precisas', 'Documentación legal', 'Inspecciones detalladas'],
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
          services: [
            'Visitas de verificación',
            'Gestión de contratos',
            'Coordinación de servicios',
          ],
          experience: '6 años',
          hourlyRate: 16000,
          availability: 'offline',
          specialties: [
            'Gestión administrativa',
            'Coordinación interdepartamental',
            'Seguimiento de procesos',
          ],
          languages: ['Español'],
          lastActive: '2024-01-18T14:20:00Z',
          completedJobs: 95,
          responseTime: '< 3 horas',
        },
        {
          id: '6',
          name: 'Carmen Torres',
          email: 'carmen.runner@email.com',
          phone: '+56933332222',
          rating: 4.8,
          totalJobs: 203,
          verified: true,
          location: 'La Reina',
          services: ['Visitas express', 'Entregas urgentes', 'Coordinación 24/7'],
          experience: '8 años',
          hourlyRate: 20000,
          availability: 'available',
          specialties: ['Disponibilidad 24/7', 'Respuesta inmediata', 'Gestión de crisis'],
          languages: ['Español', 'Inglés', 'Italiano'],
          lastActive: '2024-01-20T08:00:00Z',
          completedJobs: 198,
          responseTime: '< 15 min',
        },
      ];

      setRunners(mockRunners);
    } catch (error) {
      logger.error('Error loading runners:', { error });
    } finally {
      setLoading(false);
    }
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

    // Crear mensaje prellenado con información contextual
    const propertyContext = 'Propiedad en [Dirección de tu propiedad]'; // TODO: Obtener de propiedades del usuario
    const serviceContext = runner.services[0] || 'servicio solicitado'; // Usar el primer servicio como ejemplo

    const prefilledMessage = `Hola ${runner.name},

Me interesa contratar tus servicios de ${serviceContext} para ${propertyContext}.

¿Podrías por favor proporcionarme:
• Disponibilidad para esta semana
• Cotización detallada del servicio
• Referencias de trabajos similares realizados

Estoy disponible para coordinar los detalles.

Saludos,
[Tu Nombre]
Propietario - Rent360`;

    // Navegar a la página de mensajes con mensaje prellenado
    const messageParam = encodeURIComponent(prefilledMessage);
    router.push(
      `/owner/messages?recipientId=${runner.id}&recipientType=runner&recipientName=${encodeURIComponent(runner.name)}&prefillMessage=${messageParam}`
    );
  };

  const handleHireRunner = (runner: Runner) => {
    logger.info('Iniciando contratación de runner:', { runnerId: runner.id });

    // Abrir modal de contratación con información prellenada
    setSelectedRunner(runner);
    setShowHireModal(true);

    // Prellenar información de contratación
    setHireData({
      estimatedHours: 2,
      preferredDate: '',
      preferredTime: '',
      specialInstructions: '',
      urgency: 'normal',
    });
  };

  const handleSubmitHire = async () => {
    if (!selectedRunner) {
      return;
    }

    try {
      logger.info('Procesando contratación:', {
        runnerId: selectedRunner.id,
        hireData,
      });

      // Calcular costo estimado
      const estimatedCost = selectedRunner.hourlyRate * hireData.estimatedHours;

      // Crear trabajo en la plataforma
      const jobData = {
        runnerId: selectedRunner.id,
        ownerId: 'current-user-id', // TODO: Obtener del contexto de autenticación
        estimatedHours: hireData.estimatedHours,
        preferredDate: hireData.preferredDate,
        preferredTime: hireData.preferredTime,
        specialInstructions: hireData.specialInstructions,
        urgency: hireData.urgency,
        estimatedCost,
        status: 'PENDING',
      };

      // TODO: Implementar API call para crear trabajo
      // const response = await fetch('/api/jobs', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(jobData),
      // });

      alert(`¡Contratación exitosa!

Runner: ${selectedRunner.name}
Fecha preferida: ${hireData.preferredDate || 'Por coordinar'}
Horas estimadas: ${hireData.estimatedHours}
Costo estimado: $${estimatedCost.toLocaleString()}

Se ha enviado la solicitud al runner. Recibirás una confirmación pronto.`);

      setShowHireModal(false);
      setSelectedRunner(null);
    } catch (error) {
      logger.error('Error en contratación:', { error });
      alert('Error al procesar la contratación. Intente nuevamente.');
    }
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <Label htmlFor="location-search">Buscar Ubicación</Label>
                <Input
                  id="location-search"
                  placeholder="Escribe para buscar comuna..."
                  value={filters.locationSearch}
                  onChange={e => setFilters(prev => ({ ...prev, locationSearch: e.target.value }))}
                  className="mt-1"
                />
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
                    {filteredCommunes.slice(0, 50).map(commune => (
                      <SelectItem key={commune} value={commune}>
                        {commune}
                      </SelectItem>
                    ))}
                    {filteredCommunes.length > 50 && (
                      <div className="px-2 py-1 text-sm text-gray-500 border-t">
                        Y {filteredCommunes.length - 50} comunas más...
                      </div>
                    )}
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
                <div className="mt-4 space-y-3">
                  <div className="grid grid-cols-2 gap-2">
                    <Button variant="outline" size="sm" onClick={() => handleContactRunner(runner)}>
                      <Phone className="w-4 h-4 mr-1" />
                      Contactar
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => handleSendMessage(runner)}>
                      <MessageSquare className="w-4 h-4 mr-1" />
                      Mensaje
                    </Button>
                  </div>
                  <Button
                    size="sm"
                    className="w-full bg-blue-600 hover:bg-blue-700"
                    onClick={() => handleHireRunner(runner)}
                  >
                    <UserPlus className="w-4 h-4 mr-1" />
                    Contratar Servicio
                  </Button>
                </div>

                {/* Last Active */}
                <div className="mt-3 text-xs text-gray-500 text-center border-t pt-3">
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

        {/* Hire Modal */}
        {showHireModal && selectedRunner && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto shadow-2xl">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold">Contratar Servicio</h3>
                <button
                  onClick={() => setShowHireModal(false)}
                  className="text-gray-500 hover:text-gray-700 text-2xl"
                >
                  ×
                </button>
              </div>

              {/* Runner Info */}
              <div className="bg-gray-50 rounded-lg p-4 mb-6">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                    <User className="w-8 h-8 text-blue-600" />
                  </div>
                  <div>
                    <h4 className="text-lg font-semibold">{selectedRunner.name}</h4>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Star className="w-4 h-4 text-yellow-400 fill-current" />
                      <span>
                        {selectedRunner.rating} ({selectedRunner.totalJobs} trabajos)
                      </span>
                    </div>
                    <p className="text-sm text-gray-600">
                      {formatCurrency(selectedRunner.hourlyRate)} por hora
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                {/* Time Estimation */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="estimatedHours" className="text-sm font-medium">
                      Horas Estimadas
                    </Label>
                    <Input
                      id="estimatedHours"
                      type="number"
                      min="1"
                      max="12"
                      value={hireData.estimatedHours}
                      onChange={e =>
                        setHireData(prev => ({
                          ...prev,
                          estimatedHours: parseInt(e.target.value) || 2,
                        }))
                      }
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Costo Estimado</Label>
                    <div className="mt-1 p-2 bg-gray-100 rounded-md text-center font-semibold">
                      {formatCurrency(selectedRunner.hourlyRate * hireData.estimatedHours)}
                    </div>
                  </div>
                </div>

                {/* Scheduling */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="preferredDate" className="text-sm font-medium">
                      Fecha Preferida
                    </Label>
                    <Input
                      id="preferredDate"
                      type="date"
                      value={hireData.preferredDate}
                      onChange={e =>
                        setHireData(prev => ({ ...prev, preferredDate: e.target.value }))
                      }
                      className="mt-1"
                      min={new Date().toISOString().split('T')[0]}
                    />
                  </div>
                  <div>
                    <Label htmlFor="preferredTime" className="text-sm font-medium">
                      Hora Preferida
                    </Label>
                    <Select
                      value={hireData.preferredTime}
                      onValueChange={value =>
                        setHireData(prev => ({ ...prev, preferredTime: value }))
                      }
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="Selecciona hora" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="09:00">9:00 AM</SelectItem>
                        <SelectItem value="10:00">10:00 AM</SelectItem>
                        <SelectItem value="11:00">11:00 AM</SelectItem>
                        <SelectItem value="12:00">12:00 PM</SelectItem>
                        <SelectItem value="13:00">1:00 PM</SelectItem>
                        <SelectItem value="14:00">2:00 PM</SelectItem>
                        <SelectItem value="15:00">3:00 PM</SelectItem>
                        <SelectItem value="16:00">4:00 PM</SelectItem>
                        <SelectItem value="17:00">5:00 PM</SelectItem>
                        <SelectItem value="18:00">6:00 PM</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Urgency */}
                <div>
                  <Label className="text-sm font-medium">Urgencia</Label>
                  <Select
                    value={hireData.urgency}
                    onValueChange={value => setHireData(prev => ({ ...prev, urgency: value }))}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Baja - Programar con anticipación</SelectItem>
                      <SelectItem value="normal">Normal - Esta semana</SelectItem>
                      <SelectItem value="high">Alta - Esta semana o antes</SelectItem>
                      <SelectItem value="urgent">Urgente - Hoy o mañana</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Special Instructions */}
                <div>
                  <Label htmlFor="specialInstructions" className="text-sm font-medium">
                    Instrucciones Especiales
                  </Label>
                  <textarea
                    id="specialInstructions"
                    placeholder="Describe detalles específicos del trabajo, requisitos especiales, o cualquier información adicional..."
                    value={hireData.specialInstructions}
                    onChange={e =>
                      setHireData(prev => ({ ...prev, specialInstructions: e.target.value }))
                    }
                    className="mt-1 w-full p-3 border border-gray-300 rounded-md resize-none text-gray-900 bg-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows={4}
                  />
                </div>

                {/* Summary */}
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h4 className="font-medium text-blue-900 mb-2">Resumen de Contratación</h4>
                  <div className="text-sm text-blue-800 space-y-1">
                    <p>
                      <strong>Runner:</strong> {selectedRunner.name}
                    </p>
                    <p>
                      <strong>Fecha:</strong> {hireData.preferredDate || 'Por coordinar'}
                    </p>
                    <p>
                      <strong>Hora:</strong> {hireData.preferredTime || 'Por coordinar'}
                    </p>
                    <p>
                      <strong>Horas:</strong> {hireData.estimatedHours}
                    </p>
                    <p>
                      <strong>Total estimado:</strong>{' '}
                      {formatCurrency(selectedRunner.hourlyRate * hireData.estimatedHours)}
                    </p>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 pt-4 border-t">
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
                    disabled={!hireData.preferredDate || !hireData.estimatedHours}
                  >
                    <UserPlus className="w-4 h-4 mr-2" />
                    Confirmar Contratación
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </UnifiedDashboardLayout>
  );
}

'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { logger } from '@/lib/logger';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { QuickActionButton } from '@/components/dashboard/QuickActionButton';
import {
  RefreshCw,
  AlertTriangle,
  AlertCircle,
  Building,
  CheckCircle,
  Clock,
  DollarSign,
  Info,
  Plus,
  Filter,
  Download,
  BarChart3,
  Settings,
  Star,
  ThumbsUp,
  MessageSquare,
  User,
  Wrench,
  Home,
  Calendar,
  Search,
  TrendingUp,
  Award,
  Heart,
} from 'lucide-react';
import UnifiedDashboardLayout from '@/components/layout/UnifiedDashboardLayout';

interface Rating {
  id: string;
  type: 'property' | 'maintenance' | 'broker' | 'building';
  targetId: string;
  targetName: string;
  rating: number;
  comment: string;
  date: string;
  category?: string;
  images?: string[];
  helpful?: number;
  verified?: boolean;
}

interface RatingStats {
  totalRatings: number;
  averageRating: number;
  ratingDistribution: { [key: number]: number };
  recentActivity: number;
}

export default function CalificacionesPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ratings, setRatings] = useState<Rating[]>([]);
  const [filteredRatings, setFilteredRatings] = useState<Rating[]>([]);
  const [stats, setStats] = useState<RatingStats | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedRating, setSelectedRating] = useState<string>('all');

  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [sortBy, setSortBy] = useState<string>('date');
  const [activeTab, setActiveTab] = useState('all');

  // Mock data
  const mockRatings: Rating[] = [
    {
      id: '1',
      type: 'property',
      targetId: 'prop1',
      targetName: 'Moderno departamento en Las Condes',
      rating: 5,
      comment:
        'Excelente propiedad, muy cómoda y bien ubicada. El edificio tiene todas las comodidades necesarias y el barrio es muy tranquilo.',
      date: '2024-01-15T10:30:00',
      category: 'Departamento',
      verified: true,
      helpful: 12,
    },
    {
      id: '2',
      type: 'maintenance',
      targetId: 'maint1',
      targetName: 'Servicio de plomería - Juan Pérez',
      rating: 4,
      comment:
        'Trabajo bien realizado, llegó a tiempo y solucionó el problema. Solo tardó un poco más de lo esperado.',
      date: '2024-01-12T14:20:00',
      category: 'Plomería',
      verified: true,
      helpful: 8,
    },
    {
      id: '3',
      type: 'broker',
      targetId: 'broker1',
      targetName: 'María González - Propiedades Plus',
      rating: 5,
      comment:
        'Excelente atención y asesoramiento. Me ayudó a encontrar la propiedad perfecta para mis necesidades.',
      date: '2024-01-10T16:45:00',
      category: 'Asesoría',
      verified: true,
      helpful: 15,
    },
    {
      id: '4',
      type: 'building',
      targetId: 'building1',
      targetName: 'Edificio Los Álamos',
      rating: 3,
      comment:
        'El edificio es bonito pero el ascensor a veces no funciona bien y el conserje no siempre está disponible.',
      date: '2024-01-08T09:15:00',
      category: 'Condominio',
      verified: true,
      helpful: 5,
    },
    {
      id: '5',
      type: 'property',
      targetId: 'prop2',
      targetName: 'Casa amplia en Vitacura',
      rating: 4,
      comment:
        'Buena propiedad con jardín amplio. Ideal para familias. El único detalle es que necesita algunas mejoras menores.',
      date: '2024-01-05T11:00:00',
      category: 'Casa',
      verified: true,
      helpful: 9,
    },
  ];

  useEffect(() => {
    loadPageData();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [ratings, searchTerm, selectedType, selectedRating, sortBy, activeTab]);

  const loadPageData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Load ratings data
      setRatings(mockRatings);

      // Calculate stats
      const totalRatings = mockRatings.length;
      const averageRating =
        mockRatings.reduce((sum, rating) => sum + rating.rating, 0) / totalRatings;
      const ratingDistribution = mockRatings.reduce(
        (dist, rating) => {
          dist[rating.rating] = (dist[rating.rating] || 0) + 1;
          return dist;
        },
        {} as { [key: number]: number }
      );

      const recentActivity = mockRatings.filter(rating => {
        const ratingDate = new Date(rating.date);
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        return ratingDate > weekAgo;
      }).length;

      setStats({
        totalRatings,
        averageRating,
        ratingDistribution,
        recentActivity,
      });

      logger.debug('Datos de calificaciones cargados');
    } catch (error) {
      logger.error('Error cargando datos de calificaciones:', {
        error: error instanceof Error ? error.message : String(error),
      });
      setError('Error al cargar los datos');
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = useCallback(() => {
    let filtered = [...ratings];

    // Text search
    if (searchTerm) {
      filtered = filtered.filter(
        rating =>
          rating.targetName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          rating.comment.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Type filter
    if (selectedType !== 'all') {
      filtered = filtered.filter(rating => rating.type === selectedType);
    }

    // Rating filter
    if (selectedRating !== 'all') {
      filtered = filtered.filter(rating => rating.rating.toString() === selectedRating);
    }

    // Tab filter
    if (activeTab !== 'all') {
      filtered = filtered.filter(rating => rating.type === activeTab);
    }

    // Sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'date':
          return new Date(b.date).getTime() - new Date(a.date).getTime();
        case 'rating':
          return b.rating - a.rating;
        case 'helpful':
          return (b.helpful || 0) - (a.helpful || 0);
        default:
          return 0;
      }
    });

    setFilteredRatings(filtered);
  }, [ratings, searchTerm, selectedType, selectedRating, sortBy, activeTab]);

  const handleNewRating = useCallback(() => {
    router.push('/properties/search');
  }, [router]);

  const handleExportRatings = useCallback(() => {
    if (filteredRatings.length === 0) {
      setErrorMessage('No hay calificaciones para exportar');
      setTimeout(() => setErrorMessage(''), 5000);
      return;
    }

    const csvHeaders = [
      'Fecha',
      'Tipo',
      'Nombre',
      'Categoría',
      'Calificación',
      'Comentario',
      'Verificada',
      'Útil',
    ];
    const csvRows = filteredRatings.map(rating => [
      new Date(rating.date).toLocaleDateString('es-CL'),
      rating.type,
      rating.targetName,
      rating.category || '',
      rating.rating.toString(),
      rating.comment,
      rating.verified ? 'Sí' : 'No',
      (rating.helpful || 0).toString(),
    ]);

    const csvContent = [csvHeaders, ...csvRows]
      .map(row => row.map(field => `"${field}"`).join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute(
      'download',
      `calificaciones_tenant_${new Date().toISOString().split('T')[0]}.csv`
    );
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, [filteredRatings]);

  const handleMarkHelpful = useCallback((ratingId: string) => {
    setRatings(prev =>
      prev.map(rating =>
        rating.id === ratingId ? { ...rating, helpful: (rating.helpful || 0) + 1 } : rating
      )
    );
  }, []);

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`w-4 h-4 ${i < rating ? 'text-yellow-400 fill-current' : 'text-gray-300'}`}
      />
    ));
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'property':
        return <Home className="w-5 h-5 text-blue-500" />;
      case 'maintenance':
        return <Wrench className="w-5 h-5 text-green-500" />;
      case 'broker':
        return <User className="w-5 h-5 text-purple-500" />;
      case 'building':
        return <Building className="w-5 h-5 text-orange-500" />;
      default:
        return <Star className="w-5 h-5 text-gray-500" />;
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'property':
        return 'Propiedad';
      case 'maintenance':
        return 'Mantenimiento';
      case 'broker':
        return 'Corredor';
      case 'building':
        return 'Edificio';
      default:
        return type;
    }
  };

  if (loading) {
    return (
      <UnifiedDashboardLayout title="Calificaciones" subtitle="Cargando información...">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Cargando calificaciones...</p>
          </div>
        </div>
      </UnifiedDashboardLayout>
    );
  }

  if (error) {
    return (
      <UnifiedDashboardLayout title="Calificaciones" subtitle="Error al cargar la página">
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
    <UnifiedDashboardLayout title="Calificaciones" subtitle="Gestiona tus reseñas y calificaciones">
      <div className="space-y-6">
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
              <CardTitle className="text-sm font-medium">Total Calificaciones</CardTitle>
              <Star className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.totalRatings || 0}</div>
              <p className="text-xs text-muted-foreground">Reseñas realizadas</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Calificación Promedio</CardTitle>
              <Award className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.averageRating?.toFixed(1) || 0}</div>
              <div className="flex items-center mt-1">
                {renderStars(Math.round(stats?.averageRating || 0))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Actividad Reciente</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.recentActivity || 0}</div>
              <p className="text-xs text-muted-foreground">Últimos 7 días</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Calificaciones Útiles</CardTitle>
              <Heart className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {ratings.reduce((sum, rating) => sum + (rating.helpful || 0), 0)}
              </div>
              <p className="text-xs text-muted-foreground">Votos positivos</p>
            </CardContent>
          </Card>
        </div>

        {/* Rating Distribution */}
        {stats && (
          <Card>
            <CardHeader>
              <CardTitle>Distribución de Calificaciones</CardTitle>
              <CardDescription>Resumen de tus calificaciones por estrellas</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {[5, 4, 3, 2, 1].map(stars => {
                  const count = stats.ratingDistribution[stars] || 0;
                  const percentage =
                    stats.totalRatings > 0 ? (count / stats.totalRatings) * 100 : 0;
                  return (
                    <div key={stars} className="flex items-center gap-3">
                      <div className="flex items-center gap-1 w-16">
                        <span className="text-sm font-medium">{stars}</span>
                        <Star className="w-4 h-4 text-yellow-400 fill-current" />
                      </div>
                      <div className="flex-1 bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-yellow-400 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                      <span className="text-sm text-gray-600 w-12">{count}</span>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Main Content with Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="all">Todas</TabsTrigger>
            <TabsTrigger value="property">Propiedades</TabsTrigger>
            <TabsTrigger value="maintenance">Mantenimiento</TabsTrigger>
            <TabsTrigger value="broker">Corredores</TabsTrigger>
            <TabsTrigger value="building">Edificios</TabsTrigger>
          </TabsList>

          {/* Filters Bar */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col lg:flex-row gap-4">
                <div className="flex-1">
                  <Input
                    placeholder="Buscar por nombre o comentario..."
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    className="w-full"
                  />
                </div>
                <Select value={selectedType} onValueChange={setSelectedType}>
                  <SelectTrigger className="w-full lg:w-48">
                    <SelectValue placeholder="Tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos los tipos</SelectItem>
                    <SelectItem value="property">Propiedades</SelectItem>
                    <SelectItem value="maintenance">Mantenimiento</SelectItem>
                    <SelectItem value="broker">Corredores</SelectItem>
                    <SelectItem value="building">Edificios</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={selectedRating} onValueChange={setSelectedRating}>
                  <SelectTrigger className="w-full lg:w-48">
                    <SelectValue placeholder="Calificación" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas</SelectItem>
                    <SelectItem value="5">⭐⭐⭐⭐⭐</SelectItem>
                    <SelectItem value="4">⭐⭐⭐⭐</SelectItem>
                    <SelectItem value="3">⭐⭐⭐</SelectItem>
                    <SelectItem value="2">⭐⭐</SelectItem>
                    <SelectItem value="1">⭐</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="w-full lg:w-48">
                    <SelectValue placeholder="Ordenar por" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="date">Más recientes</SelectItem>
                    <SelectItem value="rating">Mejor calificación</SelectItem>
                    <SelectItem value="helpful">Más útiles</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Ratings List */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                Mis Calificaciones ({filteredRatings.length})
                {filteredRatings.length > 0 && (
                  <Button variant="outline" size="sm" onClick={handleExportRatings}>
                    <Download className="w-4 h-4 mr-2" />
                    Exportar
                  </Button>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {filteredRatings.length === 0 ? (
                <div className="text-center py-12">
                  <Star className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No hay calificaciones</h3>
                  <p className="text-gray-600 mb-4">
                    Aún no has realizado calificaciones. ¡Comparte tu experiencia!
                  </p>
                  <Button onClick={handleNewRating}>
                    <Plus className="w-4 h-4 mr-2" />
                    Realizar Primera Calificación
                  </Button>
                </div>
              ) : (
                <div className="space-y-6">
                  {filteredRatings.map(rating => (
                    <Card key={rating.id} className="hover:shadow-md transition-shadow">
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-center gap-3">
                            {getTypeIcon(rating.type)}
                            <div>
                              <h4 className="font-semibold text-lg">{rating.targetName}</h4>
                              <div className="flex items-center gap-2 mt-1">
                                <Badge variant="secondary">{getTypeLabel(rating.type)}</Badge>
                                {rating.category && (
                                  <Badge variant="outline">{rating.category}</Badge>
                                )}
                                {rating.verified && (
                                  <Badge className="bg-green-100 text-green-800">
                                    <CheckCircle className="w-3 h-3 mr-1" />
                                    Verificada
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="flex items-center gap-1 mb-1">
                              {renderStars(rating.rating)}
                            </div>
                            <p className="text-sm text-gray-500">
                              {new Date(rating.date).toLocaleDateString('es-CL')}
                            </p>
                          </div>
                        </div>

                        <p className="text-gray-700 mb-4 leading-relaxed">{rating.comment}</p>

                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleMarkHelpful(rating.id)}
                              className="text-gray-600 hover:text-blue-600"
                            >
                              <ThumbsUp className="w-4 h-4 mr-2" />
                              Útil ({rating.helpful || 0})
                            </Button>
                            <Button variant="ghost" size="sm" className="text-gray-600">
                              <MessageSquare className="w-4 h-4 mr-2" />
                              Responder
                            </Button>
                          </div>
                          <div className="flex gap-2">
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button variant="outline" size="sm">
                                  Ver Detalles
                                </Button>
                              </DialogTrigger>
                              <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                                <DialogHeader>
                                  <DialogTitle className="flex items-center gap-2">
                                    {getTypeIcon(rating.type)}
                                    {rating.targetName}
                                  </DialogTitle>
                                  <DialogDescription>
                                    Detalles completos de la calificación
                                  </DialogDescription>
                                </DialogHeader>
                                <div className="space-y-4">
                                  <div className="flex items-center gap-2">
                                    <span className="font-medium">Calificación:</span>
                                    <div className="flex">{renderStars(rating.rating)}</div>
                                  </div>
                                  <div>
                                    <span className="font-medium">Comentario:</span>
                                    <p className="mt-1 text-gray-700">{rating.comment}</p>
                                  </div>
                                  <div className="flex items-center gap-4 text-sm text-gray-600">
                                    <span>
                                      Fecha: {new Date(rating.date).toLocaleDateString('es-CL')}
                                    </span>
                                    <span>Útil: {rating.helpful || 0}</span>
                                    {rating.verified && (
                                      <span className="text-green-600">✓ Verificada</span>
                                    )}
                                  </div>
                                </div>
                              </DialogContent>
                            </Dialog>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </Tabs>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Acciones Rápidas</CardTitle>
            <CardDescription>Herramientas para gestionar tus calificaciones</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <QuickActionButton
                icon={Plus}
                label="Nueva Calificación"
                description="Calificar propiedad o servicio"
                onClick={handleNewRating}
              />

              <QuickActionButton
                icon={Download}
                label="Exportar Calificaciones"
                description="Descargar en CSV"
                onClick={handleExportRatings}
              />

              <QuickActionButton
                icon={BarChart3}
                label="Ver Estadísticas"
                description="Análisis de calificaciones"
                onClick={() => router.push('/tenant/reports')}
              />

              <QuickActionButton
                icon={Search}
                label="Buscar Más"
                description="Explorar propiedades"
                onClick={() => router.push('/properties/search')}
              />

              <QuickActionButton
                icon={Settings}
                label="Configuración"
                description="Preferencias de reseñas"
                onClick={() => router.push('/tenant/settings')}
              />

              <QuickActionButton
                icon={RefreshCw}
                label="Actualizar"
                description="Recargar calificaciones"
                onClick={loadPageData}
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </UnifiedDashboardLayout>
  );
}

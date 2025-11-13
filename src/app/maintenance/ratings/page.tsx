'use client';

import { useState, useEffect } from 'react';
import { logger } from '@/lib/logger-minimal';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Star,
  RefreshCw,
  AlertTriangle,
  ThumbsUp,
  MessageSquare,
  Info,
  Eye,
  Search,
  Filter,
  Download,
  TrendingUp,
  Award,
  Target,
  Users,
  Calendar,
  CheckCircle,
} from 'lucide-react';
import UnifiedDashboardLayout from '@/components/layout/UnifiedDashboardLayout';

interface Rating {
  id: string;
  clientName: string;
  propertyAddress: string;
  rating: number;
  comment: string;
  date: string;
  jobType: string;
  response?: string;
  responseDate?: string;
}

interface RatingStats {
  averageRating: number;
  totalRatings: number;
  fiveStarRatings: number;
  fourStarRatings: number;
  threeStarRatings: number;
  twoStarRatings: number;
  oneStarRatings: number;
}

export default function MaintenanceRatingsPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [ratings, setRatings] = useState<Rating[]>([]);
  const [stats, setStats] = useState<RatingStats>({
    averageRating: 0,
    totalRatings: 0,
    fiveStarRatings: 0,
    fourStarRatings: 0,
    threeStarRatings: 0,
    twoStarRatings: 0,
    oneStarRatings: 0,
  });
  const [filterRating, setFilterRating] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadPageData();
  }, []);

  const loadPageData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch real ratings data from API
      const response = await fetch('/api/ratings?limit=100', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

      // La API devuelve { success: true, data: { ratings: [...], total: ... }, pagination: {...} }
      const ratingsList = data.data?.ratings || data.ratings || [];

      // Transform API data to match our interface
      const transformedRatings: Rating[] = ratingsList.map((rating: any) => ({
        id: rating.id,
        clientName: rating.fromUser?.name || rating.clientName || 'Cliente no identificado',
        propertyAddress:
          rating.property?.address ||
          rating.property?.title ||
          rating.propertyAddress ||
          'Dirección no disponible',
        rating: rating.overallRating || rating.rating || 0,
        comment: rating.comment || 'Sin comentario',
        date: rating.createdAt?.split('T')[0] || new Date().toISOString().split('T')[0],
        jobType:
          rating.contextType === 'MAINTENANCE'
            ? 'Servicio de Mantenimiento'
            : rating.contextType === 'SERVICE'
              ? 'Servicio'
              : rating.contextType === 'CONTRACT'
                ? 'Contrato'
                : 'Servicio de Mantenimiento',
        response: rating.response,
        responseDate: rating.responseDate?.split('T')[0],
      }));

      setRatings(transformedRatings);

      // Calculate statistics from real data
      const totalRatings = transformedRatings.length;
      const averageRating =
        totalRatings > 0
          ? transformedRatings.reduce((sum, r) => sum + r.rating, 0) / totalRatings
          : 0;

      const ratingCounts = transformedRatings.reduce(
        (acc, rating) => {
          switch (rating.rating) {
            case 5:
              acc.fiveStarRatings++;
              break;
            case 4:
              acc.fourStarRatings++;
              break;
            case 3:
              acc.threeStarRatings++;
              break;
            case 2:
              acc.twoStarRatings++;
              break;
            case 1:
              acc.oneStarRatings++;
              break;
          }
          return acc;
        },
        {
          fiveStarRatings: 0,
          fourStarRatings: 0,
          threeStarRatings: 0,
          twoStarRatings: 0,
          oneStarRatings: 0,
        }
      );

      setStats({
        averageRating,
        totalRatings,
        ...ratingCounts,
      });
    } catch (error) {
      logger.error('Error loading page data:', {
        error: error instanceof Error ? error.message : String(error),
      });
      setError('Error al cargar los datos');
    } finally {
      setLoading(false);
    }
  };

  const filteredRatings = ratings.filter(rating => {
    const matchesSearch =
      rating.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      rating.comment.toLowerCase().includes(searchTerm.toLowerCase()) ||
      rating.jobType.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesRating = filterRating === 'all' || rating.rating.toString() === filterRating;

    return matchesSearch && matchesRating;
  });

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`w-4 h-4 ${i < rating ? 'text-yellow-400 fill-current' : 'text-gray-300'}`}
      />
    ));
  };

  if (loading) {
    return (
      <UnifiedDashboardLayout
        title="Calificaciones"
        subtitle="Reseñas y comentarios de tus servicios de mantenimiento"
      >
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Cargando calificaciones...</p>
          </div>
        </div>
      </UnifiedDashboardLayout>
    );
  }

  if (error) {
    return (
      <UnifiedDashboardLayout
        title="Calificaciones"
        subtitle="Reseñas y comentarios de tus servicios de mantenimiento"
      >
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto mb-4"></div>
            <p className="text-red-600 mb-4">{error}</p>
            <Button onClick={loadPageData} variant="outline">
              <RefreshCw className="w-4 h-4 mr-2" />
              Reintentar
            </Button>
          </div>
        </div>
      </UnifiedDashboardLayout>
    );
  }

  return (
    <UnifiedDashboardLayout
      title="Calificaciones"
      subtitle="Reseñas y comentarios de tus servicios de mantenimiento"
    >
      <div className="space-y-6">
        {/* Estadísticas de calificaciones */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Calificación Promedio</CardTitle>
              <Star className="h-4 w-4 text-yellow-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.averageRating.toFixed(1)}</div>
              <div className="flex items-center mt-1">
                {renderStars(Math.round(stats.averageRating))}
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Basado en {stats.totalRatings} reseñas
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total de Reseñas</CardTitle>
              <MessageSquare className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalRatings}</div>
              <p className="text-xs text-muted-foreground">+2 esta semana</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">5 Estrellas</CardTitle>
              <Award className="h-4 w-4 text-yellow-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.fiveStarRatings}</div>
              <p className="text-xs text-muted-foreground">
                {((stats.fiveStarRatings / stats.totalRatings) * 100).toFixed(0)}% del total
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Tasa de Respuesta</CardTitle>
              <ThumbsUp className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">95%</div>
              <p className="text-xs text-muted-foreground">Respondes rápido</p>
            </CardContent>
          </Card>
        </div>

        {/* Filtros y búsqueda */}
        <Card>
          <CardHeader>
            <CardTitle>Todas las Calificaciones</CardTitle>
            <CardDescription>Gestiona y responde a las reseñas de tus clientes</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    placeholder="Buscar por cliente, comentario o tipo de trabajo..."
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <select
                  value={filterRating}
                  onChange={e => setFilterRating(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">Todas las calificaciones</option>
                  <option value="5">⭐⭐⭐⭐⭐ 5 estrellas</option>
                  <option value="4">⭐⭐⭐⭐ 4 estrellas</option>
                  <option value="3">⭐⭐⭐ 3 estrellas</option>
                  <option value="2">⭐⭐ 2 estrellas</option>
                  <option value="1">⭐ 1 estrella</option>
                </select>
                <Button variant="outline">
                  <Download className="w-4 h-4 mr-2" />
                  Exportar
                </Button>
              </div>
            </div>

            {/* Lista de calificaciones */}
            <div className="space-y-4">
              {filteredRatings.length === 0 ? (
                <div className="text-center py-12">
                  <MessageSquare className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Aún no tienes calificaciones
                  </h3>
                  <p className="text-gray-600 mb-3">
                    Las calificaciones de tus trabajos aparecerán aquí cuando completes servicios.
                  </p>
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 max-w-md mx-auto">
                    <p className="text-sm text-blue-800 font-medium mb-1">
                      💡 Importante: Mantén un buen servicio
                    </p>
                    <p className="text-xs text-blue-700">
                      Las buenas calificaciones son clave para conseguir más trabajos de
                      mantenimiento.
                    </p>
                  </div>
                </div>
              ) : (
                filteredRatings.map(rating => (
                  <div key={rating.id} className="border border-gray-200 rounded-lg p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-start space-x-4">
                        <div className="flex-shrink-0">
                          <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center">
                            <Users className="w-5 h-5 text-gray-600" />
                          </div>
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-1">
                            <h4 className="font-medium text-gray-900">{rating.clientName}</h4>
                            <div className="flex items-center">{renderStars(rating.rating)}</div>
                          </div>
                          <p className="text-sm text-gray-600 mb-2">{rating.propertyAddress}</p>
                          <p className="text-sm text-gray-600 mb-2">
                            <span className="font-medium">Trabajo:</span> {rating.jobType}
                          </p>
                          <p className="text-sm text-gray-700 mb-3">{rating.comment}</p>
                          <p className="text-xs text-gray-500">
                            {new Date(rating.date).toLocaleDateString('es-CL', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric',
                            })}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Respuesta del proveedor */}
                    {rating.response ? (
                      <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                        <div className="flex items-start space-x-3">
                          <CheckCircle className="w-5 h-5 text-blue-500 mt-0.5" />
                          <div className="flex-1">
                            <p className="text-sm font-medium text-blue-900">Tu respuesta:</p>
                            <p className="text-sm text-blue-800 mt-1">{rating.response}</p>
                            <p className="text-xs text-blue-600 mt-2">
                              Respondido el{' '}
                              {new Date(rating.responseDate!).toLocaleDateString('es-CL')}
                            </p>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="mt-4 flex space-x-2">
                        <Button size="sm" variant="outline">
                          <MessageSquare className="w-4 h-4 mr-2" />
                          Responder
                        </Button>
                        <Button size="sm" variant="outline">
                          <ThumbsUp className="w-4 h-4 mr-2" />
                          Marcar como útil
                        </Button>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </UnifiedDashboardLayout>
  );
}

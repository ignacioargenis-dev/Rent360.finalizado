'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Star,
  RefreshCw,
  AlertTriangle,
  ThumbsUp,
  MessageSquare,
  TrendingUp,
  User,
  Download,
  Building,
} from 'lucide-react';
import UnifiedDashboardLayout from '@/components/layout/UnifiedDashboardLayout';
import { logger } from '@/lib/logger-minimal';

interface Rating {
  id: string;
  reviewerName: string;
  reviewerType: string;
  propertyTitle?: string;
  overallRating: number;
  punctuality?: number;
  professionalism?: number;
  communication?: number;
  quality?: number;
  reliability?: number;
  comment?: string;
  positiveFeedback?: string[];
  improvementAreas?: string[];
  verified: boolean;
  anonymous: boolean;
  date: string;
  contextType?: string;
}

export default function BrokerRatingsPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [ratings, setRatings] = useState<Rating[]>([]);
  const [stats, setStats] = useState({
    averageRating: 0,
    totalRatings: 0,
    fiveStarRatings: 0,
    withComments: 0,
  });

  useEffect(() => {
    loadPageData();
  }, []);

  const loadPageData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Cargar calificaciones recibidas desde la API de calificaciones
      // Brokers pueden recibir calificaciones de múltiples contextos
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
      const ratingsList = data.data?.ratings || data.ratings || [];

      // Transformar calificaciones al formato esperado
      const transformedRatings: Rating[] = ratingsList.map((rating: any) => ({
        id: rating.id,
        reviewerName: rating.fromUser?.name || 'Usuario',
        reviewerType: rating.fromUser?.role || 'user',
        propertyTitle: rating.property?.title || 'Propiedad',
        overallRating: rating.overallRating || rating.rating || 0,
        punctuality: rating.punctualityRating || undefined,
        professionalism: rating.professionalismRating || undefined,
        communication: rating.communicationRating || undefined,
        quality: rating.qualityRating || undefined,
        reliability: rating.reliabilityRating || undefined,
        comment: rating.comment || '',
        positiveFeedback: rating.positiveFeedback || [],
        improvementAreas: rating.improvementAreas || [],
        verified: rating.isVerified || rating.verified || false,
        anonymous: rating.isAnonymous || rating.anonymous || false,
        date: rating.createdAt || rating.date,
        contextType: rating.contextType,
      }));

      setRatings(transformedRatings);

      // Calcular estadísticas
      const totalRatings = transformedRatings.length;
      const averageRating =
        totalRatings > 0
          ? transformedRatings.reduce((sum, r) => sum + r.overallRating, 0) / totalRatings
          : 0;

      setStats({
        averageRating,
        totalRatings,
        fiveStarRatings: transformedRatings.filter(r => r.overallRating === 5).length,
        withComments: transformedRatings.filter(r => r.comment && r.comment.trim() !== '').length,
      });
    } catch (error) {
      logger.error('Error loading ratings:', {
        error: error instanceof Error ? error.message : String(error),
      });
      setError('Error al cargar las calificaciones');
    } finally {
      setLoading(false);
    }
  };

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
      <UnifiedDashboardLayout title="Calificaciones" subtitle="Cargando información...">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Cargando...</p>
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
    <UnifiedDashboardLayout
      title="Mis Calificaciones"
      subtitle="Revisa las calificaciones que has recibido por tus servicios de corretaje"
    >
      <div className="space-y-6">
        {/* Estadísticas */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Calificación Promedio</CardTitle>
              <Star className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.averageRating.toFixed(1)}</div>
              <p className="text-xs text-muted-foreground">
                Basado en {stats.totalRatings} reseñas
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Calificaciones</CardTitle>
              <ThumbsUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalRatings}</div>
              <p className="text-xs text-muted-foreground">Calificaciones recibidas</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">5 Estrellas</CardTitle>
              <Star className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.fiveStarRatings}</div>
              <p className="text-xs text-muted-foreground">
                {stats.totalRatings > 0
                  ? ((stats.fiveStarRatings / stats.totalRatings) * 100).toFixed(0)
                  : 0}
                % del total
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Con Comentarios</CardTitle>
              <MessageSquare className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.withComments}</div>
              <p className="text-xs text-muted-foreground">Calificaciones con feedback</p>
            </CardContent>
          </Card>
        </div>

        {/* Lista de calificaciones */}
        <Card>
          <CardHeader>
            <CardTitle>Todas las Calificaciones</CardTitle>
            <CardDescription>Reseñas y comentarios de tus servicios de corretaje</CardDescription>
          </CardHeader>
          <CardContent>
            {ratings.length === 0 ? (
              <div className="text-center py-12">
                <Star className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Aún no tienes calificaciones
                </h3>
                <p className="text-gray-600">
                  Las calificaciones aparecerán aquí cuando completes contratos y servicios para
                  clientes.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {ratings.map(rating => (
                  <div key={rating.id} className="border rounded-lg p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-start space-x-3 flex-1">
                        <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                          <User className="w-6 h-6 text-gray-600" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-semibold">{rating.reviewerName}</h4>
                            {rating.verified && (
                              <Badge className="bg-green-100 text-green-800 text-xs">
                                Verificada
                              </Badge>
                            )}
                            {rating.anonymous && (
                              <Badge variant="outline" className="text-xs">
                                Anónima
                              </Badge>
                            )}
                          </div>
                          {rating.propertyTitle && (
                            <p className="text-sm text-gray-600 mb-2">{rating.propertyTitle}</p>
                          )}
                          <div className="flex items-center gap-1 mb-2">
                            {renderStars(rating.overallRating)}
                            <span className="text-sm text-gray-600 ml-2">
                              {new Date(rating.date).toLocaleDateString('es-CL')}
                            </span>
                          </div>
                          {rating.comment && <p className="text-gray-700 mb-2">{rating.comment}</p>}

                          {/* Mostrar contexto de la calificación */}
                          {rating.contextType && (
                            <Badge variant="outline" className="text-xs mb-2">
                              {rating.contextType === 'SERVICE'
                                ? 'Servicio'
                                : rating.contextType === 'CONTRACT'
                                  ? 'Contrato'
                                  : rating.contextType === 'PROPERTY_VISIT'
                                    ? 'Visita'
                                    : rating.contextType === 'MAINTENANCE'
                                      ? 'Mantenimiento'
                                      : rating.contextType}
                            </Badge>
                          )}

                          {/* Calificaciones por categoría */}
                          {(rating.punctuality ||
                            rating.professionalism ||
                            rating.communication ||
                            rating.quality ||
                            rating.reliability) && (
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-3 text-xs">
                              {rating.punctuality && (
                                <div>
                                  <span className="text-gray-600">Puntualidad:</span>{' '}
                                  {renderStars(rating.punctuality)}
                                </div>
                              )}
                              {rating.professionalism && (
                                <div>
                                  <span className="text-gray-600">Profesionalismo:</span>{' '}
                                  {renderStars(rating.professionalism)}
                                </div>
                              )}
                              {rating.communication && (
                                <div>
                                  <span className="text-gray-600">Comunicación:</span>{' '}
                                  {renderStars(rating.communication)}
                                </div>
                              )}
                              {rating.quality && (
                                <div>
                                  <span className="text-gray-600">Calidad:</span>{' '}
                                  {renderStars(rating.quality)}
                                </div>
                              )}
                              {rating.reliability && (
                                <div>
                                  <span className="text-gray-600">Confiabilidad:</span>{' '}
                                  {renderStars(rating.reliability)}
                                </div>
                              )}
                            </div>
                          )}

                          {/* Feedback positivo y áreas de mejora */}
                          {rating.positiveFeedback && rating.positiveFeedback.length > 0 && (
                            <div className="mt-3 p-2 bg-green-50 rounded">
                              <p className="text-xs font-medium text-green-800 mb-1">
                                Aspectos Positivos:
                              </p>
                              <ul className="text-xs text-green-700 list-disc list-inside">
                                {rating.positiveFeedback.map((item: string, idx: number) => (
                                  <li key={idx}>{item}</li>
                                ))}
                              </ul>
                            </div>
                          )}

                          {rating.improvementAreas && rating.improvementAreas.length > 0 && (
                            <div className="mt-2 p-2 bg-yellow-50 rounded">
                              <p className="text-xs font-medium text-yellow-800 mb-1">
                                Áreas de Mejora:
                              </p>
                              <ul className="text-xs text-yellow-700 list-disc list-inside">
                                {rating.improvementAreas.map((item: string, idx: number) => (
                                  <li key={idx}>{item}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </UnifiedDashboardLayout>
  );
}

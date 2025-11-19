'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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
  Filter,
  Calendar,
  Bell,
  BarChart3,
  Reply,
} from 'lucide-react';
import UnifiedDashboardLayout from '@/components/layout/UnifiedDashboardLayout';
import { logger } from '@/lib/logger-minimal';
import { toast } from 'sonner';

interface Rating {
  id: string;
  reviewerName: string;
  reviewerType: string;
  propertyTitle?: string;
  overallRating: number;
  punctuality?: number;
  professionalism?: number;
  communication?: number;
  quality?: number; // Mapea a qualityRating (propertyKnowledge para runners)
  reliability?: number;
  comment?: string;
  positiveFeedback?: string[];
  improvementAreas?: string[];
  response?: string;
  responseDate?: string;
  verified: boolean;
  anonymous: boolean;
  date: string;
  contextType?: string;
}

export default function RunnerRatingsPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [ratings, setRatings] = useState<Rating[]>([]);
  const [stats, setStats] = useState({
    averageRating: 0,
    totalRatings: 0,
    fiveStarRatings: 0,
    withComments: 0,
  });

  // Filtros avanzados
  const [filters, setFilters] = useState({
    minRating: '',
    maxRating: '',
    startDate: '',
    endDate: '',
    hasResponse: '',
    hasComment: '',
  });

  // Respuestas
  const [selectedRatingForResponse, setSelectedRatingForResponse] = useState<string | null>(null);
  const [responseText, setResponseText] = useState('');
  const [showResponseDialog, setShowResponseDialog] = useState(false);

  // Tendencias
  const [trendsData, setTrendsData] = useState<any>(null);
  const [showTrends, setShowTrends] = useState(false);

  // Recordatorios
  const [pendingRatings, setPendingRatings] = useState<any[]>([]);

  useEffect(() => {
    loadPageData();
    loadPendingRatings();
  }, []);

  const loadPageData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Construir URL con filtros avanzados
      const params = new URLSearchParams({
        contextType: 'PROPERTY_VISIT',
        limit: '100',
      });

      if (filters.minRating) {
        params.append('minRating', filters.minRating);
      }
      if (filters.maxRating) {
        params.append('maxRating', filters.maxRating);
      }
      if (filters.startDate) {
        params.append('startDate', filters.startDate);
      }
      if (filters.endDate) {
        params.append('endDate', filters.endDate);
      }
      if (filters.hasResponse !== '') {
        params.append('hasResponse', filters.hasResponse);
      }
      if (filters.hasComment !== '') {
        params.append('hasComment', filters.hasComment);
      }

      // Cargar calificaciones recibidas desde la API de calificaciones
      // Filtrar solo calificaciones de visitas a propiedades (PROPERTY_VISIT)
      const response = await fetch(`/api/ratings?${params.toString()}`, {
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
        quality: rating.qualityRating || undefined, // Para runners, qualityRating mapea a propertyKnowledge
        reliability: rating.reliabilityRating || undefined,
        comment: rating.comment || '',
        positiveFeedback: rating.positiveFeedback || [],
        improvementAreas: rating.improvementAreas || [],
        response: rating.response || undefined,
        responseDate: rating.responseDate || undefined,
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

  const loadPendingRatings = async () => {
    try {
      const response = await fetch('/api/ratings/reminders', {
        method: 'GET',
        credentials: 'include',
      });
      if (response.ok) {
        const data = await response.json();
        setPendingRatings(data.data?.pendingRatings || []);
      }
    } catch (error) {
      logger.error('Error cargando recordatorios:', error);
    }
  };

  const loadTrends = async () => {
    try {
      const response = await fetch('/api/ratings/trends?period=30', {
        method: 'GET',
        credentials: 'include',
      });
      if (response.ok) {
        const data = await response.json();
        setTrendsData(data.data);
        setShowTrends(true);
      }
    } catch (error) {
      logger.error('Error cargando tendencias:', error);
      toast.error('Error al cargar tendencias');
    }
  };

  const handleSendReminders = async () => {
    try {
      const response = await fetch('/api/ratings/reminders', {
        method: 'POST',
        credentials: 'include',
      });
      if (response.ok) {
        const data = await response.json();
        toast.success(data.message || 'Recordatorios enviados');
        loadPendingRatings();
      }
    } catch (error) {
      logger.error('Error enviando recordatorios:', error);
      toast.error('Error al enviar recordatorios');
    }
  };

  const handleResponse = async (ratingId: string) => {
    setSelectedRatingForResponse(ratingId);
    setResponseText('');
    setShowResponseDialog(true);
  };

  const handleSubmitResponse = async () => {
    if (!selectedRatingForResponse || !responseText.trim()) {
      return;
    }

    try {
      const response = await fetch(`/api/ratings/${selectedRatingForResponse}/response`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ response: responseText }),
      });

      if (response.ok) {
        toast.success('Respuesta enviada exitosamente');
        setShowResponseDialog(false);
        setSelectedRatingForResponse(null);
        setResponseText('');
        loadPageData();
      } else {
        const error = await response.json();
        toast.error(error.error || 'Error al enviar respuesta');
      }
    } catch (error) {
      logger.error('Error enviando respuesta:', error);
      toast.error('Error al enviar respuesta');
    }
  };

  const handleExport = async (format: 'csv' | 'pdf') => {
    try {
      const params = new URLSearchParams({
        format,
        contextType: 'PROPERTY_VISIT',
      });
      if (filters.startDate) {
        params.append('startDate', filters.startDate);
      }
      if (filters.endDate) {
        params.append('endDate', filters.endDate);
      }

      const response = await fetch(`/api/ratings/export?${params.toString()}`, {
        method: 'GET',
        credentials: 'include',
      });

      if (format === 'csv' && response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `calificaciones_${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
        toast.success('Calificaciones exportadas exitosamente');
      } else if (format === 'pdf') {
        const data = await response.json();
        toast.info('Exportación PDF disponible próximamente');
      }
    } catch (error) {
      logger.error('Error exportando calificaciones:', error);
      toast.error('Error al exportar calificaciones');
    }
  };

  const applyFilters = () => {
    loadPageData();
  };

  const clearFilters = () => {
    setFilters({
      minRating: '',
      maxRating: '',
      startDate: '',
      endDate: '',
      hasResponse: '',
      hasComment: '',
    });
    setTimeout(() => loadPageData(), 100);
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
      subtitle="Revisa las calificaciones que has recibido por tus servicios"
    >
      <div className="space-y-6">
        {/* Recordatorios pendientes */}
        {pendingRatings.length > 0 && (
          <Card className="border-blue-200 bg-blue-50">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-sm font-medium text-blue-900">
                  Tienes {pendingRatings.length} elementos pendientes de calificar
                </CardTitle>
                <CardDescription className="text-blue-700">
                  Califica tus experiencias para ayudar a otros usuarios
                </CardDescription>
              </div>
              <Button onClick={handleSendReminders} size="sm" variant="outline">
                <Bell className="w-4 h-4 mr-2" />
                Enviar Recordatorios
              </Button>
            </CardHeader>
          </Card>
        )}

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

        {/* Filtros Avanzados y Acciones */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Filtros y Acciones</CardTitle>
                <CardDescription>Filtra, exporta y visualiza tus calificaciones</CardDescription>
              </div>
              <div className="flex gap-2">
                <Button onClick={loadTrends} variant="outline" size="sm">
                  <BarChart3 className="w-4 h-4 mr-2" />
                  Tendencias
                </Button>
                <Button onClick={() => handleExport('csv')} variant="outline" size="sm">
                  <Download className="w-4 h-4 mr-2" />
                  Exportar CSV
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
              <div>
                <Label htmlFor="minRating">Calificación Mínima</Label>
                <Select
                  value={filters.minRating}
                  onValueChange={value => setFilters({ ...filters, minRating: value })}
                >
                  <SelectTrigger id="minRating">
                    <SelectValue placeholder="Todas" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Todas</SelectItem>
                    <SelectItem value="5">5 estrellas</SelectItem>
                    <SelectItem value="4">4+ estrellas</SelectItem>
                    <SelectItem value="3">3+ estrellas</SelectItem>
                    <SelectItem value="2">2+ estrellas</SelectItem>
                    <SelectItem value="1">1+ estrellas</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="maxRating">Calificación Máxima</Label>
                <Select
                  value={filters.maxRating}
                  onValueChange={value => setFilters({ ...filters, maxRating: value })}
                >
                  <SelectTrigger id="maxRating">
                    <SelectValue placeholder="Todas" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Todas</SelectItem>
                    <SelectItem value="1">1 estrella</SelectItem>
                    <SelectItem value="2">2 estrellas</SelectItem>
                    <SelectItem value="3">3 estrellas</SelectItem>
                    <SelectItem value="4">4 estrellas</SelectItem>
                    <SelectItem value="5">5 estrellas</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="startDate">Fecha Inicio</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={filters.startDate}
                  onChange={e => setFilters({ ...filters, startDate: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="endDate">Fecha Fin</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={filters.endDate}
                  onChange={e => setFilters({ ...filters, endDate: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="hasResponse">Con Respuesta</Label>
                <Select
                  value={filters.hasResponse}
                  onValueChange={value => setFilters({ ...filters, hasResponse: value })}
                >
                  <SelectTrigger id="hasResponse">
                    <SelectValue placeholder="Todas" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Todas</SelectItem>
                    <SelectItem value="true">Con respuesta</SelectItem>
                    <SelectItem value="false">Sin respuesta</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="hasComment">Con Comentario</Label>
                <Select
                  value={filters.hasComment}
                  onValueChange={value => setFilters({ ...filters, hasComment: value })}
                >
                  <SelectTrigger id="hasComment">
                    <SelectValue placeholder="Todas" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Todas</SelectItem>
                    <SelectItem value="true">Con comentario</SelectItem>
                    <SelectItem value="false">Sin comentario</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex gap-2 mt-4">
              <Button onClick={applyFilters} size="sm">
                <Filter className="w-4 h-4 mr-2" />
                Aplicar Filtros
              </Button>
              <Button onClick={clearFilters} variant="outline" size="sm">
                Limpiar
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Gráfico de Tendencias */}
        {showTrends && trendsData && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Tendencias de Calificaciones</CardTitle>
                  <CardDescription>
                    Evolución de tus calificaciones en los últimos {trendsData.period} días
                  </CardDescription>
                </div>
                <Button onClick={() => setShowTrends(false)} variant="ghost" size="sm">
                  Cerrar
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Promedio General</p>
                    <p className="text-2xl font-bold">{trendsData.averageRating.toFixed(1)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Total Calificaciones</p>
                    <p className="text-2xl font-bold">{trendsData.totalRatings}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Tendencia</p>
                    <Badge
                      className={
                        trendsData.trendDirection === 'improving'
                          ? 'bg-green-100 text-green-800'
                          : trendsData.trendDirection === 'declining'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-gray-100 text-gray-800'
                      }
                    >
                      {trendsData.trendDirection === 'improving'
                        ? 'Mejorando'
                        : trendsData.trendDirection === 'declining'
                          ? 'Empeorando'
                          : 'Estable'}
                    </Badge>
                  </div>
                </div>
                <div className="h-64 flex items-end justify-between gap-2">
                  {trendsData.trends.map((trend: any, idx: number) => (
                    <div key={idx} className="flex-1 flex flex-col items-center">
                      <div
                        className="w-full bg-blue-500 rounded-t transition-all hover:bg-blue-600"
                        style={{ height: `${(trend.average / 5) * 100}%` }}
                        title={`${trend.date}: ${trend.average.toFixed(1)} (${trend.count} calificaciones)`}
                      />
                      <p className="text-xs text-gray-600 mt-2 text-center">
                        {new Date(trend.date).toLocaleDateString('es-CL', {
                          month: 'short',
                          day: 'numeric',
                        })}
                      </p>
                      <p className="text-xs font-medium">{trend.average.toFixed(1)}</p>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Lista de calificaciones */}
        <Card>
          <CardHeader>
            <CardTitle>Todas las Calificaciones</CardTitle>
            <CardDescription>Reseñas y comentarios de tus servicios</CardDescription>
          </CardHeader>
          <CardContent>
            {ratings.length === 0 ? (
              <div className="text-center py-12">
                <Star className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Aún no tienes calificaciones
                </h3>
                <p className="text-gray-600">
                  Las calificaciones aparecerán aquí cuando completes visitas y servicios para
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
                              {rating.contextType === 'PROPERTY_VISIT'
                                ? 'Visita a Propiedad'
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
                                  <span className="text-gray-600">Conocimiento:</span>{' '}
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

                          {/* Respuesta del runner */}
                          {rating.response ? (
                            <div className="mt-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                              <div className="flex items-start justify-between mb-2">
                                <p className="text-xs font-medium text-blue-900">Tu respuesta:</p>
                                {rating.responseDate && (
                                  <p className="text-xs text-blue-700">
                                    {new Date(rating.responseDate).toLocaleDateString('es-CL')}
                                  </p>
                                )}
                              </div>
                              <p className="text-sm text-blue-800">{rating.response}</p>
                            </div>
                          ) : (
                            <div className="mt-3">
                              <Button
                                onClick={() => handleResponse(rating.id)}
                                variant="outline"
                                size="sm"
                              >
                                <Reply className="w-4 h-4 mr-2" />
                                Responder
                              </Button>
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

        {/* Dialog para responder */}
        <Dialog open={showResponseDialog} onOpenChange={setShowResponseDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Responder a Calificación</DialogTitle>
              <DialogDescription>
                Agradece el feedback y comparte tu perspectiva sobre el servicio.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="response">Tu Respuesta</Label>
                <Textarea
                  id="response"
                  placeholder="Escribe tu respuesta aquí..."
                  value={responseText}
                  onChange={e => setResponseText(e.target.value)}
                  rows={4}
                  maxLength={1000}
                />
                <p className="text-xs text-gray-500 mt-1">{responseText.length}/1000 caracteres</p>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowResponseDialog(false)}>
                Cancelar
              </Button>
              <Button onClick={handleSubmitResponse} disabled={!responseText.trim()}>
                Enviar Respuesta
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </UnifiedDashboardLayout>
  );
}

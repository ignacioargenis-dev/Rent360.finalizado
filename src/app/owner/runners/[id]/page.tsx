'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import UnifiedDashboardLayout from '@/components/layout/UnifiedDashboardLayout';
import { useAuth } from '@/components/auth/AuthProviderSimple';
import { logger } from '@/lib/logger-minimal';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  ArrowLeft,
  User,
  Star,
  MapPin,
  DollarSign,
  Calendar,
  CheckCircle,
  Clock,
  Award,
  Activity,
  Camera,
  FileText,
  Image as ImageIcon,
  ZoomIn,
  Eye,
  Download,
  X,
} from 'lucide-react';

interface RunnerPhoto {
  id: string;
  url: string;
  filename: string;
  uploadedAt: string;
  category: string;
  description?: string;
  isMain: boolean;
}

interface RunnerActivity {
  id: string;
  type: string;
  propertyTitle: string;
  propertyAddress: string;
  propertyId: string;
  scheduledAt: string;
  status: string;
  earnings?: number;
  photosTaken?: number;
  duration?: number;
  notes?: string;
  rating?: number;
  hasRated?: boolean;
  feedback?: string;
  photos?: RunnerPhoto[];
  tenant?: {
    id: string;
    name: string;
    email: string;
    phone: string;
  } | null;
  createdAt: string;
  updatedAt: string;
}

interface RunnerIncentive {
  id: string;
  name: string;
  description: string;
  type: string;
  category: string;
  amount: number;
  earnedAt: string;
}

export default function RunnerDetailPage() {
  const router = useRouter();
  const params = useParams();
  const runnerId = params?.id as string;
  const { user } = useAuth();

  const [runner, setRunner] = useState<{ id: string; name: string } | null>(null);
  const [stats, setStats] = useState<any>(null);
  const [recentActivity, setRecentActivity] = useState<RunnerActivity[]>([]);
  const [incentives, setIncentives] = useState<RunnerIncentive[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedVisit, setSelectedVisit] = useState<RunnerActivity | null>(null);
  const [showVisitModal, setShowVisitModal] = useState(false);
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [selectedVisitForRating, setSelectedVisitForRating] = useState<RunnerActivity | null>(null);

  useEffect(() => {
    if (runnerId) {
      loadRunnerActivity();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [runnerId]);

  const loadRunnerActivity = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/owner/runners/${runnerId}/activity`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });

      if (!response.ok) {
        if (response.status === 404) {
          setError('Runner no encontrado');
        } else {
          throw new Error(`Error ${response.status}: ${response.statusText}`);
        }
        return;
      }

      const data = await response.json();

      if (data.success) {
        setRunner(data.runner);
        setStats(data.stats);
        setRecentActivity(data.recentActivity || []);
        setIncentives(data.incentives || []);
      } else {
        throw new Error(data.error || 'Error al cargar datos del runner');
      }
    } catch (error) {
      logger.error('Error loading runner activity:', { error });
      setError('Error al cargar la información del runner');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { label: string; color: string }> = {
      COMPLETED: { label: 'Completada', color: 'bg-green-100 text-green-800' },
      SCHEDULED: { label: 'Programada', color: 'bg-blue-100 text-blue-800' },
      PENDING: { label: 'Pendiente', color: 'bg-yellow-100 text-yellow-800' },
      CANCELLED: { label: 'Cancelada', color: 'bg-red-100 text-red-800' },
      IN_PROGRESS: { label: 'En Progreso', color: 'bg-purple-100 text-purple-800' },
    };
    const defaultConfig: { label: string; color: string } = {
      label: 'Pendiente',
      color: 'bg-yellow-100 text-yellow-800',
    };
    const config = statusConfig[status] || defaultConfig;
    return <Badge className={config.color}>{config.label}</Badge>;
  };

  const handleRateRunner = (activity: RunnerActivity) => {
    setSelectedVisitForRating(activity);
    setShowRatingModal(true);
  };

  const handleSubmitRating = async (ratingData: any) => {
    if (!selectedVisitForRating || !user) {
      return;
    }

    try {
      const response = await fetch('/api/visit/rate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          visitId: selectedVisitForRating.id,
          overallRating: ratingData.overallRating,
          punctualityRating: ratingData.punctualityRating || ratingData.overallRating,
          professionalismRating: ratingData.professionalismRating || ratingData.overallRating,
          communicationRating: ratingData.communicationRating || ratingData.overallRating,
          propertyKnowledgeRating: ratingData.propertyKnowledgeRating || ratingData.overallRating,
          comment: ratingData.comment || '',
          positiveFeedback: ratingData.positiveFeedback || [],
          improvementAreas: ratingData.improvementAreas || [],
          isAnonymous: ratingData.isAnonymous || false,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al enviar la calificación');
      }

      logger.info('Calificación enviada exitosamente');
      setShowRatingModal(false);
      setSelectedVisitForRating(null);
      // Recargar datos después de un breve delay para asegurar que la BD se actualizó
      setTimeout(() => {
        loadRunnerActivity();
      }, 500);
    } catch (error) {
      logger.error('Error enviando calificación:', { error });
      alert('Error al enviar la calificación. Por favor intenta nuevamente.');
    }
  };

  if (loading) {
    return (
      <UnifiedDashboardLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Cargando información del runner...</p>
          </div>
        </div>
      </UnifiedDashboardLayout>
    );
  }

  if (error || !runner) {
    return (
      <UnifiedDashboardLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <User className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              {error || 'Runner no encontrado'}
            </h2>
            <p className="text-gray-600 mb-4">
              {error || 'El runner solicitado no existe o no tienes acceso a él.'}
            </p>
            <Button onClick={() => router.push('/owner/runners')}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Volver a Runners
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
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={() => router.push('/owner/runners')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Volver
          </Button>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-gray-900">{runner.name}</h1>
            <p className="text-gray-600">Detalles y actividad del runner</p>
          </div>
        </div>

        {/* Stats Cards - Expandidas */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">Total Visitas</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalVisits || 0}</div>
                <p className="text-xs text-gray-500 mt-1">{stats.pendingVisits || 0} pendientes</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">Completadas</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {stats.completedVisits || 0}
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  {stats.totalVisits > 0
                    ? Math.round(((stats.completedVisits || 0) / stats.totalVisits) * 100)
                    : 0}
                  % de tasa de completación
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">
                  Ganancias Totales
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-emerald-600">
                  ${(stats.totalEarnings || 0).toLocaleString()}
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Promedio: $
                  {stats.totalVisits > 0
                    ? Math.round((stats.totalEarnings || 0) / stats.totalVisits).toLocaleString()
                    : 0}{' '}
                  por visita
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">
                  Calificación Promedio
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-1">
                  <Star className="w-5 h-5 text-yellow-400 fill-current" />
                  <span className="text-2xl font-bold">
                    {(stats.averageRating || 0).toFixed(1)}
                  </span>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Basado en {stats.completedVisits || 0} visitas
                </p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Stats adicionales */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                  <Camera className="w-4 h-4" />
                  Fotos Totales
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalPhotos || 0}</div>
                <p className="text-xs text-gray-500 mt-1">
                  {stats.completedVisits > 0
                    ? Math.round((stats.totalPhotos || 0) / stats.completedVisits).toFixed(1)
                    : 0}{' '}
                  fotos por visita en promedio
                </p>
              </CardContent>
            </Card>
            {stats.totalIncentives > 0 && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                    <Award className="w-4 h-4" />
                    Incentivos Ganados
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.totalIncentives || 0}</div>
                  <p className="text-xs text-gray-500 mt-1">
                    Valor total: ${(stats.totalIncentiveValue || 0).toLocaleString()}
                  </p>
                </CardContent>
              </Card>
            )}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                  <Activity className="w-4 h-4" />
                  Canceladas
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">{stats.cancelledVisits || 0}</div>
                <p className="text-xs text-gray-500 mt-1">Visitas canceladas o no realizadas</p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Recent Activity - Expandida */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="w-5 h-5" />
              Registros y Actividades Completas
            </CardTitle>
            <CardDescription>
              Historial completo de visitas, fotos y acciones realizadas por el runner en tus
              propiedades
            </CardDescription>
          </CardHeader>
          <CardContent>
            {recentActivity.length > 0 ? (
              <div className="space-y-6">
                {recentActivity.map(activity => (
                  <div
                    key={activity.id}
                    className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
                  >
                    {/* Header de la actividad */}
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-semibold text-gray-900 text-lg">
                            {activity.propertyTitle}
                          </h3>
                          {getStatusBadge(activity.status)}
                        </div>
                        <p className="text-sm text-gray-600 flex items-center gap-1">
                          <MapPin className="w-4 h-4" />
                          {activity.propertyAddress}
                        </p>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          // Mostrar modal o expandir detalles de la visita
                          setSelectedVisit(activity);
                          setShowVisitModal(true);
                        }}
                      >
                        <Eye className="w-4 h-4 mr-2" />
                        Ver Detalles de Visita
                      </Button>
                    </div>

                    {/* Información de la visita */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4 text-sm">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-gray-500" />
                        <div>
                          <p className="text-gray-600">Fecha</p>
                          <p className="font-medium">
                            {new Date(activity.scheduledAt).toLocaleDateString('es-CL')}
                          </p>
                          <p className="text-xs text-gray-500">
                            {new Date(activity.scheduledAt).toLocaleTimeString('es-CL', {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </p>
                        </div>
                      </div>
                      {activity.duration && (
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-gray-500" />
                          <div>
                            <p className="text-gray-600">Duración</p>
                            <p className="font-medium">{activity.duration} min</p>
                          </div>
                        </div>
                      )}
                      {activity.earnings && activity.earnings > 0 && (
                        <div className="flex items-center gap-2">
                          <DollarSign className="w-4 h-4 text-gray-500" />
                          <div>
                            <p className="text-gray-600">Ganancias</p>
                            <p className="font-medium text-green-600">
                              ${activity.earnings.toLocaleString()}
                            </p>
                          </div>
                        </div>
                      )}
                      {activity.rating && activity.rating > 0 && (
                        <div className="flex items-center gap-2">
                          <Star className="w-4 h-4 text-yellow-400 fill-current" />
                          <div>
                            <p className="text-gray-600">Calificación</p>
                            <p className="font-medium">{activity.rating.toFixed(1)}/5.0</p>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Información del tenant */}
                    {activity.tenant && (
                      <div className="bg-blue-50 p-3 rounded-lg mb-4">
                        <p className="text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
                          <User className="w-4 h-4" />
                          Inquilino Asignado
                        </p>
                        <p className="text-sm text-gray-600">{activity.tenant.name}</p>
                        {activity.tenant.email && (
                          <p className="text-xs text-gray-500">{activity.tenant.email}</p>
                        )}
                        {activity.tenant.phone && (
                          <p className="text-xs text-gray-500">{activity.tenant.phone}</p>
                        )}
                      </div>
                    )}

                    {/* Notas de la visita */}
                    {activity.notes && (
                      <div className="bg-yellow-50 p-3 rounded-lg mb-4">
                        <p className="text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
                          <FileText className="w-4 h-4" />
                          Notas de la Visita
                        </p>
                        <p className="text-sm text-gray-700 whitespace-pre-wrap">
                          {activity.notes}
                        </p>
                      </div>
                    )}

                    {/* Feedback del cliente */}
                    {activity.feedback && (
                      <div className="bg-green-50 p-3 rounded-lg mb-4">
                        <p className="text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
                          <Star className="w-4 h-4" />
                          Feedback del Cliente
                        </p>
                        <p className="text-sm text-gray-700 italic">
                          &quot;{activity.feedback}&quot;
                        </p>
                      </div>
                    )}

                    {/* Botón para calificar si está completada y no calificada */}
                    {activity.status === 'COMPLETED' && !activity.hasRated && (
                      <div className="mt-4 flex justify-end">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleRateRunner(activity)}
                        >
                          <Star className="w-4 h-4 mr-2" />
                          Calificar Servicio
                        </Button>
                      </div>
                    )}

                    {/* Fotos subidas por el runner */}
                    {activity.photos && activity.photos.length > 0 && (
                      <div className="mb-4">
                        <div className="flex items-center justify-between mb-3">
                          <p className="text-sm font-medium text-gray-700 flex items-center gap-2">
                            <Camera className="w-4 h-4" />
                            Fotos Subidas ({activity.photos.length})
                          </p>
                          <Badge className="bg-blue-100 text-blue-800">
                            {activity.photosTaken || activity.photos.length} fotos
                          </Badge>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                          {activity.photos.map(photo => (
                            <div
                              key={photo.id}
                              className="relative group cursor-pointer"
                              onClick={() => window.open(photo.url, '_blank')}
                            >
                              <img
                                src={photo.url}
                                alt={photo.description || photo.filename}
                                className="w-full h-32 object-cover rounded-lg border-2 border-gray-200 hover:border-blue-500 transition-colors bg-gray-100"
                                crossOrigin="anonymous"
                                onError={e => {
                                  const img = e.currentTarget;
                                  // Evitar bucle infinito: si ya es el placeholder o tiene el atributo data-error, no hacer nada
                                  if (
                                    img.src.includes('placeholder') ||
                                    img.getAttribute('data-error') === 'true'
                                  ) {
                                    return;
                                  }
                                  // Marcar como error para evitar reintentos
                                  img.setAttribute('data-error', 'true');
                                  // Ocultar la imagen y mostrar un fondo gris en su lugar
                                  img.style.display = 'none';
                                  // Log solo una vez
                                  if (!img.getAttribute('data-logged')) {
                                    img.setAttribute('data-logged', 'true');
                                    logger.warn('Photo preview failed to load:', {
                                      photoId: photo.id,
                                      url: photo.url,
                                    });
                                  }
                                }}
                                onLoad={e => {
                                  const img = e.currentTarget;
                                  // Si se carga exitosamente, mostrar la imagen
                                  img.style.display = '';
                                  logger.info('Photo preview loaded successfully:', {
                                    photoId: photo.id,
                                    url: photo.url,
                                  });
                                }}
                              />
                              <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all rounded-lg flex items-center justify-center">
                                <ZoomIn className="w-6 h-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                              </div>
                              {photo.isMain && (
                                <Badge className="absolute top-1 left-1 bg-blue-500 text-white text-xs">
                                  Principal
                                </Badge>
                              )}
                              {photo.category && (
                                <Badge
                                  variant="outline"
                                  className="absolute bottom-1 right-1 text-xs"
                                >
                                  {photo.category}
                                </Badge>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Separador */}
                    <div className="border-t mt-4"></div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Activity className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 text-lg font-medium mb-2">
                  No hay actividad registrada
                </p>
                <p className="text-gray-400 text-sm">
                  Este runner aún no ha realizado visitas en tus propiedades
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Incentives */}
        {incentives.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="w-5 h-5" />
                Incentivos Ganados
              </CardTitle>
              <CardDescription>Recompensas e incentivos obtenidos por el runner</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {incentives.map(incentive => (
                  <div
                    key={incentive.id}
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <div>
                      <h3 className="font-semibold">{incentive.name}</h3>
                      <p className="text-sm text-gray-600">{incentive.description}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        {new Date(incentive.earnedAt).toLocaleDateString('es-CL')}
                      </p>
                    </div>
                    {incentive.amount > 0 && (
                      <div className="text-right">
                        <div className="font-bold text-emerald-600">
                          ${incentive.amount.toLocaleString()}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Modal de Detalles de Visita */}
        <Dialog open={showVisitModal} onOpenChange={setShowVisitModal}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Detalles de la Visita</DialogTitle>
              <DialogDescription>
                Información completa de la visita realizada por el runner
              </DialogDescription>
            </DialogHeader>
            {selectedVisit && (
              <div className="space-y-6 mt-4">
                {/* Información básica */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Propiedad</Label>
                    <p className="text-lg font-semibold">{selectedVisit.propertyTitle}</p>
                    <p className="text-sm text-gray-600">{selectedVisit.propertyAddress}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Estado</Label>
                    <div className="mt-1">{getStatusBadge(selectedVisit.status)}</div>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Fecha y Hora</Label>
                    <p className="text-sm">
                      {new Date(selectedVisit.scheduledAt).toLocaleDateString('es-CL')} a las{' '}
                      {new Date(selectedVisit.scheduledAt).toLocaleTimeString('es-CL', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>
                  {selectedVisit.duration && (
                    <div>
                      <Label className="text-sm font-medium text-gray-600">Duración</Label>
                      <p className="text-sm">{selectedVisit.duration} minutos</p>
                    </div>
                  )}
                </div>

                {/* Notas */}
                {selectedVisit.notes && (
                  <div>
                    <Label className="text-sm font-medium text-gray-600 mb-2 flex items-center gap-2">
                      <FileText className="w-4 h-4" />
                      Notas del Runner
                    </Label>
                    <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                      <p className="text-sm text-gray-700 whitespace-pre-wrap">
                        {selectedVisit.notes}
                      </p>
                    </div>
                  </div>
                )}

                {/* Fotos */}
                {selectedVisit.photos && selectedVisit.photos.length > 0 && (
                  <div>
                    <Label className="text-sm font-medium text-gray-600 mb-3 flex items-center gap-2">
                      <Camera className="w-4 h-4" />
                      Fotos Subidas ({selectedVisit.photos.length})
                    </Label>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      {selectedVisit.photos.map(photo => (
                        <div
                          key={photo.id}
                          className="relative group cursor-pointer"
                          onClick={() => window.open(photo.url, '_blank')}
                        >
                          <img
                            src={photo.url}
                            alt={photo.description || photo.filename}
                            className="w-full h-48 object-cover rounded-lg border-2 border-gray-200 hover:border-blue-500 transition-colors bg-gray-100"
                            crossOrigin="anonymous"
                            onError={e => {
                              const img = e.currentTarget;
                              // Evitar bucle infinito
                              if (
                                img.src.includes('placeholder') ||
                                img.getAttribute('data-error') === 'true'
                              ) {
                                return;
                              }
                              img.setAttribute('data-error', 'true');
                              img.style.display = 'none';
                              if (!img.getAttribute('data-logged')) {
                                img.setAttribute('data-logged', 'true');
                                logger.warn('Photo failed to load in modal:', {
                                  photoId: photo.id,
                                  url: photo.url,
                                });
                              }
                            }}
                            onLoad={e => {
                              const img = e.currentTarget;
                              img.style.display = '';
                            }}
                          />
                          <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all rounded-lg flex items-center justify-center">
                            <ZoomIn className="w-8 h-8 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                          </div>
                          {photo.isMain && (
                            <Badge className="absolute top-2 left-2 bg-blue-500 text-white text-xs">
                              Principal
                            </Badge>
                          )}
                          {photo.category && (
                            <Badge
                              variant="outline"
                              className="absolute bottom-2 right-2 text-xs bg-white"
                            >
                              {photo.category}
                            </Badge>
                          )}
                          {photo.description && (
                            <p className="mt-2 text-xs text-gray-600 truncate">
                              {photo.description}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Botón para calificar */}
                {selectedVisit.status === 'COMPLETED' && !selectedVisit.hasRated && (
                  <div className="border-t pt-4">
                    <Button
                      onClick={() => {
                        setShowVisitModal(false);
                        handleRateRunner(selectedVisit);
                      }}
                      className="w-full"
                    >
                      <Star className="w-4 h-4 mr-2" />
                      Calificar Servicio del Runner
                    </Button>
                  </div>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Modal de Calificación */}
        <Dialog open={showRatingModal} onOpenChange={setShowRatingModal}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Calificar Servicio del Runner</DialogTitle>
              <DialogDescription>
                Comparte tu experiencia con el servicio del runner360
              </DialogDescription>
            </DialogHeader>
            {selectedVisitForRating && (
              <RatingForm
                onSubmit={handleSubmitRating}
                onCancel={() => {
                  setShowRatingModal(false);
                  setSelectedVisitForRating(null);
                }}
              />
            )}
          </DialogContent>
        </Dialog>
      </div>
    </UnifiedDashboardLayout>
  );
}

// Componente de formulario de calificación
interface RatingFormProps {
  onSubmit: (data: any) => void;
  onCancel: () => void;
}

function RatingForm({ onSubmit, onCancel }: RatingFormProps) {
  const [rating, setRating] = useState({
    overallRating: 0,
    punctualityRating: 0,
    professionalismRating: 0,
    communicationRating: 0,
    propertyKnowledgeRating: 0,
    comment: '',
    isAnonymous: false,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (rating.overallRating === 0) {
      alert('Por favor selecciona una calificación general');
      return;
    }
    onSubmit(rating);
  };

  const StarRatingInput = ({
    label,
    value,
    onChange,
  }: {
    label: string;
    value: number;
    onChange: (value: number) => void;
  }) => (
    <div className="space-y-2">
      <Label className="text-sm font-medium">{label}</Label>
      <div className="flex items-center gap-2">
        {[1, 2, 3, 4, 5].map(star => (
          <button
            key={star}
            type="button"
            onClick={() => onChange(star)}
            className="focus:outline-none"
          >
            <Star
              className={`w-6 h-6 ${
                star <= value
                  ? 'fill-yellow-400 text-yellow-400'
                  : 'text-gray-300 hover:text-yellow-400'
              } transition-colors`}
            />
          </button>
        ))}
        <span className="text-sm text-gray-600 ml-2">{value > 0 ? `${value}/5` : ''}</span>
      </div>
    </div>
  );

  return (
    <form onSubmit={handleSubmit} className="space-y-6 mt-4">
      <StarRatingInput
        label="Calificación General *"
        value={rating.overallRating}
        onChange={value => setRating(prev => ({ ...prev, overallRating: value }))}
      />
      <StarRatingInput
        label="Puntualidad"
        value={rating.punctualityRating}
        onChange={value => setRating(prev => ({ ...prev, punctualityRating: value }))}
      />
      <StarRatingInput
        label="Profesionalismo"
        value={rating.professionalismRating}
        onChange={value => setRating(prev => ({ ...prev, professionalismRating: value }))}
      />
      <StarRatingInput
        label="Comunicación"
        value={rating.communicationRating}
        onChange={value => setRating(prev => ({ ...prev, communicationRating: value }))}
      />
      <StarRatingInput
        label="Conocimiento de la Propiedad"
        value={rating.propertyKnowledgeRating}
        onChange={value => setRating(prev => ({ ...prev, propertyKnowledgeRating: value }))}
      />

      <div className="space-y-2">
        <Label htmlFor="comment">Comentario</Label>
        <Textarea
          id="comment"
          placeholder="Describe tu experiencia con el servicio del runner..."
          value={rating.comment}
          onChange={e => setRating(prev => ({ ...prev, comment: e.target.value }))}
          rows={4}
        />
      </div>

      <div className="flex items-center space-x-2">
        <input
          type="checkbox"
          id="isAnonymous"
          checked={rating.isAnonymous}
          onChange={e => setRating(prev => ({ ...prev, isAnonymous: e.target.checked }))}
          className="rounded"
        />
        <Label htmlFor="isAnonymous" className="text-sm font-normal cursor-pointer">
          Enviar calificación de forma anónima
        </Label>
      </div>

      <div className="flex justify-end gap-3 pt-4 border-t">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit" disabled={rating.overallRating === 0}>
          Enviar Calificación
        </Button>
      </div>
    </form>
  );
}

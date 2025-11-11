'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { logger } from '@/lib/logger-minimal';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  RefreshCw,
  AlertTriangle,
  Star,
  MessageSquare,
  User,
  Calendar,
  ThumbsUp,
} from 'lucide-react';
import UnifiedDashboardLayout from '@/components/layout/UnifiedDashboardLayout';

interface UserRating {
  id: string;
  fromUserId: string;
  toUserId: string;
  contextType: string;
  contextId: string;
  overallRating: number;
  communicationRating?: number;
  reliabilityRating?: number;
  professionalismRating?: number;
  qualityRating?: number;
  punctualityRating?: number;
  comment?: string;
  createdAt: string;
  fromUser?: {
    id: string;
    name: string;
    avatar?: string;
  };
  toUser?: {
    id: string;
    name: string;
    avatar?: string;
  };
}

interface RatingSummary {
  userId: string;
  userName: string;
  totalRatings: number;
  averageRating: number;
  ratingDistribution: { [key: number]: number };
  averageCommunication?: number;
  averageReliability?: number;
  averageProfessionalism?: number;
  averageQuality?: number;
  averagePunctuality?: number;
}

export default function TenantRatingsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [ratings, setRatings] = useState<UserRating[]>([]);
  const [summary, setSummary] = useState<RatingSummary | null>(null);
  const [activeTab, setActiveTab] = useState('received');

  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  // Estado para calificaciones que el tenant ha dado
  const [givenRatings, setGivenRatings] = useState<UserRating[]>([]);

  useEffect(() => {
    loadRatings();
  }, []);

  const loadRatings = async () => {
    try {
      setLoading(true);
      setError(null);

      // Cargar calificaciones que ha recibido el usuario
      const receivedResponse = await fetch('/api/ratings', {
        credentials: 'include',
      });

      if (receivedResponse.ok) {
        const receivedData = await receivedResponse.json();
        console.log('📊 [TENANT RATINGS] Calificaciones recibidas:', receivedData);
        if (receivedData.success && receivedData.data) {
          setRatings(receivedData.data.ratings || []);
        }
      }

      // Cargar calificaciones que ha dado el usuario
      const givenResponse = await fetch('/api/ratings?given=true', {
        credentials: 'include',
      });

      if (givenResponse.ok) {
        const givenData = await givenResponse.json();
        console.log('📊 [TENANT RATINGS] Calificaciones dadas:', givenData);
        if (givenData.success && givenData.data) {
          setGivenRatings(givenData.data.ratings || []);
        }
      }

      // Cargar resumen de calificaciones
      const summaryResponse = await fetch('/api/ratings?summary=true', {
        credentials: 'include',
      });

      if (summaryResponse.ok) {
        const summaryData = await summaryResponse.json();
        if (summaryData.success && summaryData.data) {
          setSummary(summaryData.data);
        }
      }
    } catch (error) {
      logger.error('Error cargando calificaciones:', { error });
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-CL', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  if (loading) {
    return (
      <UnifiedDashboardLayout user={null} title="Mis Calificaciones">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </UnifiedDashboardLayout>
    );
  }

  if (error) {
    return (
      <UnifiedDashboardLayout user={null} title="Mis Calificaciones">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <AlertTriangle className="mx-auto h-12 w-12 text-red-500" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">Error</h3>
              <p className="mt-1 text-sm text-gray-500">{error}</p>
              <div className="mt-6">
                <Button onClick={loadRatings}>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Reintentar
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </UnifiedDashboardLayout>
    );
  }

  return (
    <UnifiedDashboardLayout user={null} title="Mis Calificaciones">
      <div className="space-y-6">
        {/* Resumen de calificaciones */}
        {summary && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Star className="w-5 h-5 text-yellow-400" />
                Resumen de Calificaciones
              </CardTitle>
              <CardDescription>Calificaciones que has recibido de otros usuarios</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-3xl font-bold text-yellow-500">
                    {summary.averageRating.toFixed(1)}
                  </div>
                  <div className="text-sm text-gray-600">Promedio General</div>
                  <div className="flex justify-center mt-1">
                    {renderStars(Math.round(summary.averageRating))}
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-blue-600">{summary.totalRatings}</div>
                  <div className="text-sm text-gray-600">Total de Calificaciones</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-green-600">
                    {summary.ratingDistribution[5] || 0}
                  </div>
                  <div className="text-sm text-gray-600">5 Estrellas</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-purple-600">
                    {summary.averageCommunication?.toFixed(1) || 'N/A'}
                  </div>
                  <div className="text-sm text-gray-600">Comunicación</div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Lista de calificaciones con tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="received" className="flex items-center gap-2">
              <Star className="w-4 h-4" />
              Calificaciones Recibidas ({ratings.length})
            </TabsTrigger>
            <TabsTrigger value="given" className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4" />
              Calificaciones Dadas ({givenRatings.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="received" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="w-5 h-5" />
                  Calificaciones Recibidas
                </CardTitle>
                <CardDescription>
                  Feedback que has recibido de otros usuarios de la plataforma
                </CardDescription>
              </CardHeader>
              <CardContent>
                {ratings.length === 0 ? (
                  <div className="text-center py-8">
                    <Star className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-2 text-sm font-medium text-gray-900">
                      No tienes calificaciones aún
                    </h3>
                    <p className="mt-1 text-sm text-gray-500">
                      Cuando completes transacciones con otros usuarios, recibirás calificaciones
                      aquí.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {ratings.map(rating => (
                      <Card key={rating.id} className="border-l-4 border-l-yellow-400">
                        <CardContent className="pt-4">
                          <div className="flex items-start justify-between">
                            <div className="flex items-start space-x-3">
                              <Avatar className="w-10 h-10">
                                <AvatarImage
                                  src={rating.fromUser?.avatar}
                                  alt={rating.fromUser?.name || 'Usuario'}
                                />
                                <AvatarFallback>
                                  <User className="w-5 h-5" />
                                </AvatarFallback>
                              </Avatar>
                              <div className="flex-1">
                                <div className="flex items-center gap-2">
                                  <h4 className="text-sm font-medium text-gray-900">
                                    {rating.fromUser?.name || 'Usuario Anónimo'}
                                  </h4>
                                  <div className="flex items-center">
                                    {renderStars(rating.overallRating)}
                                  </div>
                                </div>
                                <p className="text-sm text-gray-600 mt-1">
                                  {rating.comment || 'Sin comentario'}
                                </p>
                                <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                                  <span className="flex items-center gap-1">
                                    <Calendar className="w-3 h-3" />
                                    {formatDate(rating.createdAt)}
                                  </span>
                                  <Badge variant="outline" className="text-xs">
                                    {rating.contextType === 'MAINTENANCE'
                                      ? 'Servicio'
                                      : rating.contextType === 'SERVICE'
                                        ? 'Servicio'
                                        : rating.contextType}
                                  </Badge>
                                </div>
                                {/* Mostrar ratings detallados si existen */}
                                {(rating.communicationRating ||
                                  rating.reliabilityRating ||
                                  rating.professionalismRating ||
                                  rating.qualityRating ||
                                  rating.punctualityRating) && (
                                  <div className="mt-3 grid grid-cols-2 md:grid-cols-5 gap-2 text-xs">
                                    {rating.communicationRating && (
                                      <div className="flex items-center gap-1">
                                        <span className="text-gray-600">Com.:</span>
                                        <div className="flex">
                                          {Array.from({ length: 5 }, (_, i) => (
                                            <Star
                                              key={i}
                                              className={`w-3 h-3 ${
                                                i < rating.communicationRating!
                                                  ? 'text-yellow-400 fill-current'
                                                  : 'text-gray-300'
                                              }`}
                                            />
                                          ))}
                                        </div>
                                      </div>
                                    )}
                                    {rating.reliabilityRating && (
                                      <div className="flex items-center gap-1">
                                        <span className="text-gray-600">Conf.:</span>
                                        <div className="flex">
                                          {Array.from({ length: 5 }, (_, i) => (
                                            <Star
                                              key={i}
                                              className={`w-3 h-3 ${
                                                i < rating.reliabilityRating!
                                                  ? 'text-yellow-400 fill-current'
                                                  : 'text-gray-300'
                                              }`}
                                            />
                                          ))}
                                        </div>
                                      </div>
                                    )}
                                    {rating.professionalismRating && (
                                      <div className="flex items-center gap-1">
                                        <span className="text-gray-600">Prof.:</span>
                                        <div className="flex">
                                          {Array.from({ length: 5 }, (_, i) => (
                                            <Star
                                              key={i}
                                              className={`w-3 h-3 ${
                                                i < rating.professionalismRating!
                                                  ? 'text-yellow-400 fill-current'
                                                  : 'text-gray-300'
                                              }`}
                                            />
                                          ))}
                                        </div>
                                      </div>
                                    )}
                                    {rating.qualityRating && (
                                      <div className="flex items-center gap-1">
                                        <span className="text-gray-600">Cal.:</span>
                                        <div className="flex">
                                          {Array.from({ length: 5 }, (_, i) => (
                                            <Star
                                              key={i}
                                              className={`w-3 h-3 ${
                                                i < rating.qualityRating!
                                                  ? 'text-yellow-400 fill-current'
                                                  : 'text-gray-300'
                                              }`}
                                            />
                                          ))}
                                        </div>
                                      </div>
                                    )}
                                    {rating.punctualityRating && (
                                      <div className="flex items-center gap-1">
                                        <span className="text-gray-600">Punt.:</span>
                                        <div className="flex">
                                          {Array.from({ length: 5 }, (_, i) => (
                                            <Star
                                              key={i}
                                              className={`w-3 h-3 ${
                                                i < rating.punctualityRating!
                                                  ? 'text-yellow-400 fill-current'
                                                  : 'text-gray-300'
                                              }`}
                                            />
                                          ))}
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-gray-400 hover:text-gray-600"
                              >
                                <ThumbsUp className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="given" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="w-5 h-5" />
                  Calificaciones Dadas
                </CardTitle>
                <CardDescription>
                  Feedback que has dado a otros usuarios de la plataforma
                </CardDescription>
              </CardHeader>
              <CardContent>
                {givenRatings.length === 0 ? (
                  <div className="text-center py-8">
                    <Star className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-2 text-sm font-medium text-gray-900">
                      No has dado calificaciones aún
                    </h3>
                    <p className="mt-1 text-sm text-gray-500">
                      Cuando completes transacciones con otros usuarios, podrás calificarlos aquí.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {givenRatings.map(rating => (
                      <Card key={rating.id} className="border-l-4 border-l-blue-400">
                        <CardContent className="pt-4">
                          <div className="flex items-start justify-between">
                            <div className="flex items-start space-x-3">
                              <Avatar className="w-10 h-10">
                                <AvatarImage
                                  src={rating.toUser?.avatar}
                                  alt={rating.toUser?.name || 'Usuario'}
                                />
                                <AvatarFallback>
                                  <User className="w-5 h-5" />
                                </AvatarFallback>
                              </Avatar>
                              <div className="flex-1">
                                <div className="flex items-center gap-2">
                                  <h4 className="text-sm font-medium text-gray-900">
                                    {rating.toUser?.name || 'Usuario Anónimo'}
                                  </h4>
                                  <div className="flex items-center">
                                    {renderStars(rating.overallRating)}
                                  </div>
                                </div>
                                <p className="text-sm text-gray-600 mt-1">
                                  {rating.comment || 'Sin comentario'}
                                </p>
                                <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                                  <span className="flex items-center gap-1">
                                    <Calendar className="w-3 h-3" />
                                    {formatDate(rating.createdAt)}
                                  </span>
                                  <Badge variant="outline" className="text-xs">
                                    {rating.contextType === 'MAINTENANCE'
                                      ? 'Servicio'
                                      : rating.contextType === 'SERVICE'
                                        ? 'Servicio'
                                        : rating.contextType}
                                  </Badge>
                                </div>
                                {/* Mostrar ratings detallados si existen */}
                                {(rating.communicationRating ||
                                  rating.reliabilityRating ||
                                  rating.professionalismRating ||
                                  rating.qualityRating ||
                                  rating.punctualityRating) && (
                                  <div className="mt-3 grid grid-cols-2 md:grid-cols-5 gap-2 text-xs">
                                    {rating.communicationRating && (
                                      <div className="flex items-center gap-1">
                                        <span className="text-gray-600">Com.:</span>
                                        <div className="flex">
                                          {Array.from({ length: 5 }, (_, i) => (
                                            <Star
                                              key={i}
                                              className={`w-3 h-3 ${
                                                i < rating.communicationRating!
                                                  ? 'text-yellow-400 fill-current'
                                                  : 'text-gray-300'
                                              }`}
                                            />
                                          ))}
                                        </div>
                                      </div>
                                    )}
                                    {rating.reliabilityRating && (
                                      <div className="flex items-center gap-1">
                                        <span className="text-gray-600">Conf.:</span>
                                        <div className="flex">
                                          {Array.from({ length: 5 }, (_, i) => (
                                            <Star
                                              key={i}
                                              className={`w-3 h-3 ${
                                                i < rating.reliabilityRating!
                                                  ? 'text-yellow-400 fill-current'
                                                  : 'text-gray-300'
                                              }`}
                                            />
                                          ))}
                                        </div>
                                      </div>
                                    )}
                                    {rating.professionalismRating && (
                                      <div className="flex items-center gap-1">
                                        <span className="text-gray-600">Prof.:</span>
                                        <div className="flex">
                                          {Array.from({ length: 5 }, (_, i) => (
                                            <Star
                                              key={i}
                                              className={`w-3 h-3 ${
                                                i < rating.professionalismRating!
                                                  ? 'text-yellow-400 fill-current'
                                                  : 'text-gray-300'
                                              }`}
                                            />
                                          ))}
                                        </div>
                                      </div>
                                    )}
                                    {rating.qualityRating && (
                                      <div className="flex items-center gap-1">
                                        <span className="text-gray-600">Cal.:</span>
                                        <div className="flex">
                                          {Array.from({ length: 5 }, (_, i) => (
                                            <Star
                                              key={i}
                                              className={`w-3 h-3 ${
                                                i < rating.qualityRating!
                                                  ? 'text-yellow-400 fill-current'
                                                  : 'text-gray-300'
                                              }`}
                                            />
                                          ))}
                                        </div>
                                      </div>
                                    )}
                                    {rating.punctualityRating && (
                                      <div className="flex items-center gap-1">
                                        <span className="text-gray-600">Punt.:</span>
                                        <div className="flex">
                                          {Array.from({ length: 5 }, (_, i) => (
                                            <Star
                                              key={i}
                                              className={`w-3 h-3 ${
                                                i < rating.punctualityRating!
                                                  ? 'text-yellow-400 fill-current'
                                                  : 'text-gray-300'
                                              }`}
                                            />
                                          ))}
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-gray-400 hover:text-gray-600"
                              >
                                <ThumbsUp className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </UnifiedDashboardLayout>
  );
}

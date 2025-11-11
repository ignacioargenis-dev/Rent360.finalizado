'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  RefreshCw,
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
  User,
  Users,
  Wrench,
  MessageSquare,
  ThumbsUp,
  Home,
} from 'lucide-react';
import UnifiedDashboardLayout from '@/components/layout/UnifiedDashboardLayout';
import { useAuth } from '@/components/auth/AuthProviderSimple';
import { toast } from 'sonner';
import { logger } from '@/lib/logger-minimal';

interface Rating {
  id: string;
  reviewerName: string;
  reviewerType: 'owner' | 'broker' | 'maintenance' | 'provider';
  propertyTitle?: string;
  overallRating: number;
  punctuality?: number;
  professionalism?: number;
  communication?: number;
  quality?: number;
  reliability?: number;
  comment?: string;
  verified: boolean;
  anonymous: boolean;
  date: string;
  contextType?: string;
  contextId?: string;
}

interface RatingToGive {
  id: string;
  recipientType: 'owner' | 'broker' | 'maintenance' | 'provider';
  recipientName: string;
  recipientId: string;
  propertyTitle?: string;
  contractId?: string;
  maintenanceId?: string;
  serviceRequestId?: string;
  canRate: boolean;
  reason?: string;
}

export default function TenantRatingsPage() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('received');
  const [ratings, setRatings] = useState<Rating[]>([]);
  const [ratingsToGive, setRatingsToGive] = useState<RatingToGive[]>([]);
  const [selectedRatingToGive, setSelectedRatingToGive] = useState<RatingToGive | null>(null);
  const [showRatingDialog, setShowRatingDialog] = useState(false);
  const [ratingForm, setRatingForm] = useState({
    overallRating: 0,
    punctuality: 0,
    professionalism: 0,
    communication: 0,
    quality: 0,
    reliability: 0,
    comment: '',
    anonymous: false,
  });

  useEffect(() => {
    loadPageData();
  }, []);

  const loadPageData = async () => {
    try {
      setLoading(true);

      // Fetch real ratings data from API
      const response = await fetch('/api/ratings', {
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

      // Transform API data to match our interface
      const ratingsData = data.data?.ratings || data.ratings || [];

      const transformedRatings: Rating[] = ratingsData.map((rating: any) => ({
        id: rating.id,
        reviewerName: rating.fromUser?.name || rating.reviewerName || 'Usuario',
        reviewerType: getReviewerType(rating.fromUser?.role || rating.reviewerType || 'user'),
        propertyTitle: rating.property?.title || rating.propertyTitle || 'Propiedad',
        overallRating: rating.overallRating || rating.rating || 0,
        punctuality: rating.punctualityRating || rating.punctuality || 0,
        professionalism: rating.professionalismRating || rating.professionalism || 0,
        communication: rating.communicationRating || rating.communication || 0,
        quality: rating.qualityRating || rating.quality || 0,
        reliability: rating.reliabilityRating || rating.reliability || 0,
        comment: rating.comment || 'Sin comentario',
        verified: rating.verified || rating.isVerified || false,
        anonymous: rating.anonymous || false,
        date: rating.createdAt || rating.date,
        contextType: rating.contextType,
        contextId: rating.contextId,
      }));

      // Use only real data from database
      setRatings(transformedRatings);

      // Fetch ratings that can be given (from contracts, maintenance, services)
      const ratingsToGive: RatingToGive[] = [];

      // Add from contracts
      try {
        const contractsResponse = await fetch('/api/tenant/contracts?status=COMPLETED&limit=20', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
          },
          credentials: 'include',
        });

        if (contractsResponse.ok) {
          const contractsData = await contractsResponse.json();
          const contractRatings =
            contractsData.contracts?.map((contract: any) => ({
              id: `contract-${contract.id}`,
              recipientType: 'owner' as const,
              recipientName: contract.owner?.name || 'Propietario',
              recipientId: contract.ownerId,
              propertyTitle: contract.property?.title || 'Propiedad',
              contractId: contract.id,
              canRate: contract.status === 'COMPLETED',
              reason: contract.status !== 'COMPLETED' ? 'Contrato aún activo' : undefined,
            })) || [];
          ratingsToGive.push(...contractRatings);
        }
      } catch (error) {
        logger.error('Error fetching contracts for ratings:', error);
      }

      // Add from service jobs (trabajos completados del tenant)
      try {
        const serviceJobsResponse = await fetch(
          '/api/tenant/service-jobs?status=COMPLETED&limit=20',
          {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
              Accept: 'application/json',
            },
            credentials: 'include',
          }
        );

        if (serviceJobsResponse.ok) {
          const serviceJobsData = await serviceJobsResponse.json();
          const serviceRatings =
            serviceJobsData.jobs?.map((job: any) => ({
              id: `job-${job.id}`,
              recipientType: 'provider' as const,
              recipientName:
                job.serviceProvider?.businessName || job.serviceProvider?.name || 'Proveedor',
              recipientId: job.serviceProviderId,
              propertyTitle: job.property?.title || 'Propiedad',
              serviceRequestId: job.id,
              canRate: job.status === 'COMPLETED',
              reason: job.status !== 'COMPLETED' ? 'Servicio aún pendiente' : undefined,
            })) || [];
          ratingsToGive.push(...serviceRatings);
        }
      } catch (error) {
        logger.error('Error fetching service jobs for ratings:', error);
      }

      // Use only real data from database
      setRatingsToGive(ratingsToGive);
    } catch (error) {
      logger.error('Error loading ratings data:', {
        error: error instanceof Error ? error.message : String(error),
      });

      // En caso de error, mostrar arrays vacíos
      setRatings([]);
      setRatingsToGive([]);
    } finally {
      setLoading(false);
    }
  };

  // Functions for rating management
  const handleGiveRating = (ratingToGive: RatingToGive) => {
    if (!ratingToGive.canRate) {
      return;
    }

    setSelectedRatingToGive(ratingToGive);
    setRatingForm({
      overallRating: 0,
      punctuality: 0,
      professionalism: 0,
      communication: 0,
      quality: 0,
      reliability: 0,
      comment: '',
      anonymous: false,
    });
    setShowRatingDialog(true);
  };

  const handleSubmitRating = async () => {
    if (!selectedRatingToGive) {
      return;
    }

    try {
      const response = await fetch('/api/ratings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          toUserId: selectedRatingToGive.recipientId,
          contextType:
            selectedRatingToGive.recipientType === 'provider'
              ? 'SERVICE'
              : selectedRatingToGive.recipientType === 'maintenance'
                ? 'MAINTENANCE'
                : selectedRatingToGive.recipientType === 'owner'
                  ? 'CONTRACT'
                  : selectedRatingToGive.recipientType === 'broker'
                    ? 'BROKER'
                    : 'SERVICE',
          contextId:
            selectedRatingToGive.serviceRequestId ||
            selectedRatingToGive.contractId ||
            selectedRatingToGive.maintenanceId ||
            'unknown',
          overallRating: ratingForm.overallRating,
          punctuality: ratingForm.punctuality,
          professionalism: ratingForm.professionalism,
          communication: ratingForm.communication,
          quality: ratingForm.quality,
          reliability: ratingForm.reliability,
          comment: ratingForm.comment,
          isAnonymous: ratingForm.anonymous,
          contractId: selectedRatingToGive.contractId,
          propertyId: selectedRatingToGive.propertyTitle ? 'unknown' : undefined,
        }),
      });

      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }

      // Remove from ratings to give list
      setRatingsToGive(prev => prev.filter(r => r.id !== selectedRatingToGive.id));

      setShowRatingDialog(false);
      setSelectedRatingToGive(null);

      // Reload data to show the new rating
      await loadPageData();

      // Show success message
      toast.success('Calificación enviada exitosamente');
    } catch (error) {
      logger.error('Error submitting rating:', error);
      toast.error('Error al enviar la calificación');
    }
  };

  const handleCancelRating = () => {
    setShowRatingDialog(false);
    setSelectedRatingToGive(null);
    setRatingForm({
      overallRating: 0,
      punctuality: 0,
      professionalism: 0,
      communication: 0,
      quality: 0,
      reliability: 0,
      comment: '',
      anonymous: false,
    });
  };

  // Star rating component
  const StarRating = ({
    rating,
    onRatingChange,
    maxRating = 5,
  }: {
    rating: number;
    onRatingChange: (rating: number) => void;
    maxRating?: number;
  }) => {
    return (
      <div className="flex gap-1">
        {Array.from({ length: maxRating }, (_, i) => (
          <button
            key={i}
            type="button"
            onClick={() => onRatingChange(i + 1)}
            className="focus:outline-none"
          >
            <Star
              className={`w-5 h-5 ${i < rating ? 'text-yellow-400 fill-current' : 'text-gray-300'}`}
            />
          </button>
        ))}
      </div>
    );
  };

  // Get reviewer type from role
  const getReviewerType = (role: string): 'owner' | 'broker' | 'maintenance' | 'provider' => {
    switch (role) {
      case 'OWNER':
        return 'owner';
      case 'BROKER':
        return 'broker';
      case 'MAINTENANCE':
        return 'maintenance';
      case 'PROVIDER':
        return 'provider';
      default:
        return 'owner';
    }
  };

  // Get reviewer type icon and label
  const getReviewerTypeInfo = (type: string) => {
    switch (type) {
      case 'owner':
        return { icon: Home, label: 'Propietario', color: 'bg-blue-100 text-blue-800' };
      case 'broker':
        return { icon: Users, label: 'Corredor', color: 'bg-green-100 text-green-800' };
      case 'maintenance':
        return { icon: Wrench, label: 'Mantenimiento', color: 'bg-orange-100 text-orange-800' };
      case 'provider':
        return { icon: Building, label: 'Proveedor', color: 'bg-purple-100 text-purple-800' };
      default:
        return { icon: User, label: 'Usuario', color: 'bg-gray-100 text-gray-800' };
    }
  };

  // Format date helper
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-CL', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
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

  const averageRating =
    ratings.length > 0 ? ratings.reduce((sum, r) => sum + r.overallRating, 0) / ratings.length : 0;

  const verifiedRatings = ratings.filter(r => r.verified).length;

  return (
    <UnifiedDashboardLayout
      title="Calificaciones"
      subtitle="Gestiona las calificaciones que has recibido y las que puedes dar"
    >
      <div className="container mx-auto px-4 py-6 max-w-7xl">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="received">Calificaciones Recibidas</TabsTrigger>
            <TabsTrigger value="to-give">Calificaciones por Dar</TabsTrigger>
          </TabsList>

          <TabsContent value="received" className="space-y-6">
            {/* Header con estadísticas */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Calificaciones</CardTitle>
                  <Star className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{ratings.length}</div>
                  <p className="text-xs text-muted-foreground">Reseñas recibidas</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Calificación Promedio</CardTitle>
                  <CheckCircle className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{averageRating.toFixed(1)}</div>
                  <div className="flex items-center gap-1 mt-1">
                    {[1, 2, 3, 4, 5].map(star => (
                      <Star
                        key={star}
                        className={`w-3 h-3 ${
                          star <= Math.round(averageRating)
                            ? 'fill-yellow-400 text-yellow-400'
                            : 'text-gray-300'
                        }`}
                      />
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Calificaciones Verificadas</CardTitle>
                  <CheckCircle className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">{verifiedRatings}</div>
                  <p className="text-xs text-muted-foreground">De {ratings.length} total</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Calificaciones 5★</CardTitle>
                  <Star className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-yellow-600">
                    {ratings.filter(r => r.overallRating === 5).length}
                  </div>
                  <p className="text-xs text-muted-foreground">Reseñas perfectas</p>
                </CardContent>
              </Card>
            </div>

            {/* Lista de calificaciones */}
            <Card>
              <CardHeader>
                <CardTitle>Calificaciones</CardTitle>
                <CardDescription>
                  Aquí puedes gestionar y visualizar toda la información relacionada con
                  calificaciones.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {ratings.map(rating => (
                    <Card key={rating.id} className="border-l-4 border-l-blue-500">
                      <CardContent className="pt-6">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                              <span className="text-sm font-medium text-gray-600">
                                {rating.reviewerName.substring(0, 2).toUpperCase()}
                              </span>
                            </div>
                            <div>
                              <div className="flex items-center gap-2 mb-1">
                                <h4 className="font-semibold text-gray-900">
                                  {rating.reviewerName}
                                </h4>
                                {(() => {
                                  const typeInfo = getReviewerTypeInfo(rating.reviewerType);
                                  const Icon = typeInfo.icon;
                                  return (
                                    <Badge className={typeInfo.color}>
                                      <Icon className="w-3 h-3 mr-1" />
                                      {typeInfo.label}
                                    </Badge>
                                  );
                                })()}
                              </div>
                              {rating.propertyTitle && (
                                <p className="text-sm text-gray-600">{rating.propertyTitle}</p>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="flex items-center gap-1">
                              {[1, 2, 3, 4, 5].map(star => (
                                <Star
                                  key={star}
                                  className={`w-4 h-4 ${
                                    star <= rating.overallRating
                                      ? 'fill-yellow-400 text-yellow-400'
                                      : 'text-gray-300'
                                  }`}
                                />
                              ))}
                              <span className="ml-2 text-sm font-medium">
                                {rating.overallRating}.0
                              </span>
                            </div>
                            <Badge variant="outline" className="text-xs">
                              {new Date(rating.date).toLocaleDateString('es-CL')}
                            </Badge>
                          </div>
                        </div>

                        {rating.comment && (
                          <p className="text-gray-700 mb-3 italic">{rating.comment}</p>
                        )}

                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                          {rating.punctuality && rating.punctuality > 0 && (
                            <div className="flex items-center gap-2">
                              <span className="text-gray-600">Puntualidad:</span>
                              <div className="flex">
                                {[1, 2, 3, 4, 5].map(star => (
                                  <Star
                                    key={star}
                                    className={`w-3 h-3 ${
                                      star <= (rating.punctuality || 0)
                                        ? 'fill-yellow-400 text-yellow-400'
                                        : 'text-gray-300'
                                    }`}
                                  />
                                ))}
                              </div>
                            </div>
                          )}
                          {rating.professionalism && rating.professionalism > 0 && (
                            <div className="flex items-center gap-2">
                              <span className="text-gray-600">Profesionalismo:</span>
                              <div className="flex">
                                {[1, 2, 3, 4, 5].map(star => (
                                  <Star
                                    key={star}
                                    className={`w-3 h-3 ${
                                      star <= (rating.professionalism || 0)
                                        ? 'fill-yellow-400 text-yellow-400'
                                        : 'text-gray-300'
                                    }`}
                                  />
                                ))}
                              </div>
                            </div>
                          )}
                          {rating.communication && rating.communication > 0 && (
                            <div className="flex items-center gap-2">
                              <span className="text-gray-600">Comunicación:</span>
                              <div className="flex">
                                {[1, 2, 3, 4, 5].map(star => (
                                  <Star
                                    key={star}
                                    className={`w-3 h-3 ${
                                      star <= (rating.communication || 0)
                                        ? 'fill-yellow-400 text-yellow-400'
                                        : 'text-gray-300'
                                    }`}
                                  />
                                ))}
                              </div>
                            </div>
                          )}
                          {rating.quality && rating.quality > 0 && (
                            <div className="flex items-center gap-2">
                              <span className="text-gray-600">Calidad:</span>
                              <div className="flex">
                                {[1, 2, 3, 4, 5].map(star => (
                                  <Star
                                    key={star}
                                    className={`w-3 h-3 ${
                                      star <= (rating.quality || 0)
                                        ? 'fill-yellow-400 text-yellow-400'
                                        : 'text-gray-300'
                                    }`}
                                  />
                                ))}
                              </div>
                            </div>
                          )}
                          {rating.reliability && rating.reliability > 0 && (
                            <div className="flex items-center gap-2">
                              <span className="text-gray-600">Confiabilidad:</span>
                              <div className="flex">
                                {[1, 2, 3, 4, 5].map(star => (
                                  <Star
                                    key={star}
                                    className={`w-3 h-3 ${
                                      star <= (rating.reliability || 0)
                                        ? 'fill-yellow-400 text-yellow-400'
                                        : 'text-gray-300'
                                    }`}
                                  />
                                ))}
                              </div>
                            </div>
                          )}
                        </div>

                        <div className="flex items-center gap-2 mt-3 pt-3 border-t">
                          {rating.verified && (
                            <Badge className="bg-green-100 text-green-800">
                              <CheckCircle className="w-3 h-3 mr-1" />
                              Verificada
                            </Badge>
                          )}
                          {rating.anonymous && <Badge variant="secondary">Anónima</Badge>}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                {ratings.length === 0 && (
                  <div className="text-center py-12">
                    <Star className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      Aún no tienes calificaciones
                    </h3>
                    <p className="text-gray-600 mb-3">
                      Las calificaciones aparecerán aquí cuando completes contratos con
                      propietarios, corredores, mantenimiento y proveedores.
                    </p>
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 max-w-md mx-auto">
                      <p className="text-sm text-blue-800 font-medium mb-1">
                        💡 Importante: Mantén calificaciones altas
                      </p>
                      <p className="text-xs text-blue-700">
                        Las buenas calificaciones aumentan la confianza y te ayudan a conseguir más
                        contratos.
                      </p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="to-give" className="space-y-6">
            {/* Header for ratings to give */}
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Calificaciones Pendientes</h2>
                <p className="text-gray-600">
                  Califica a propietarios, corredores, mantenimiento y proveedores
                </p>
              </div>
              <div className="text-sm text-gray-500">
                {ratingsToGive.filter(r => r.canRate).length} calificaciones disponibles
              </div>
            </div>

            {/* Ratings to give list */}
            <div className="space-y-4">
              {ratingsToGive.map(ratingToGive => {
                const typeInfo = getReviewerTypeInfo(ratingToGive.recipientType);

                return (
                  <Card key={ratingToGive.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="pt-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
                            <typeInfo.icon className="w-6 h-6 text-gray-600" />
                          </div>

                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="font-semibold text-gray-900">
                                {ratingToGive.recipientName}
                              </h3>
                              <Badge className={typeInfo.color}>
                                <typeInfo.icon className="w-3 h-3 mr-1" />
                                {typeInfo.label}
                              </Badge>
                            </div>

                            {ratingToGive.propertyTitle && (
                              <p className="text-sm text-gray-600 mb-1">
                                Propiedad: {ratingToGive.propertyTitle}
                              </p>
                            )}

                            {!ratingToGive.canRate && ratingToGive.reason && (
                              <p className="text-xs text-orange-600">{ratingToGive.reason}</p>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          {ratingToGive.canRate ? (
                            <Button
                              onClick={() => handleGiveRating(ratingToGive)}
                              className="bg-blue-600 hover:bg-blue-700"
                            >
                              <Star className="w-4 h-4 mr-2" />
                              Calificar
                            </Button>
                          ) : (
                            <Badge variant="secondary">
                              <Clock className="w-3 h-3 mr-1" />
                              Pendiente
                            </Badge>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {ratingsToGive.length === 0 && (
              <div className="text-center py-12">
                <ThumbsUp className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  No hay calificaciones pendientes
                </h3>
                <p className="text-gray-600">
                  Las calificaciones disponibles aparecerán aquí cuando completes contratos o
                  servicios.
                </p>
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* Rating Dialog */}
        <Dialog open={showRatingDialog} onOpenChange={setShowRatingDialog}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Calificar a {selectedRatingToGive?.recipientName}</DialogTitle>
              <DialogDescription>
                Tu calificación ayudará a otros usuarios a tomar mejores decisiones
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div>
                <Label className="text-sm font-medium">Calificación General</Label>
                <div className="mt-1">
                  <StarRating
                    rating={ratingForm.overallRating}
                    onRatingChange={rating =>
                      setRatingForm(prev => ({ ...prev, overallRating: rating }))
                    }
                  />
                </div>
              </div>

              <div>
                <Label className="text-sm font-medium">Puntualidad</Label>
                <div className="mt-1">
                  <StarRating
                    rating={ratingForm.punctuality}
                    onRatingChange={rating =>
                      setRatingForm(prev => ({ ...prev, punctuality: rating }))
                    }
                  />
                </div>
              </div>

              <div>
                <Label className="text-sm font-medium">Profesionalismo</Label>
                <div className="mt-1">
                  <StarRating
                    rating={ratingForm.professionalism}
                    onRatingChange={rating =>
                      setRatingForm(prev => ({ ...prev, professionalism: rating }))
                    }
                  />
                </div>
              </div>

              <div>
                <Label className="text-sm font-medium">Comunicación</Label>
                <div className="mt-1">
                  <StarRating
                    rating={ratingForm.communication}
                    onRatingChange={rating =>
                      setRatingForm(prev => ({ ...prev, communication: rating }))
                    }
                  />
                </div>
              </div>

              {(selectedRatingToGive?.recipientType === 'maintenance' ||
                selectedRatingToGive?.recipientType === 'provider') && (
                <div>
                  <Label className="text-sm font-medium">Calidad del Servicio</Label>
                  <div className="mt-1">
                    <StarRating
                      rating={ratingForm.quality}
                      onRatingChange={rating =>
                        setRatingForm(prev => ({ ...prev, quality: rating }))
                      }
                    />
                  </div>
                </div>
              )}

              {selectedRatingToGive?.recipientType === 'owner' && (
                <div>
                  <Label className="text-sm font-medium">Confiabilidad</Label>
                  <div className="mt-1">
                    <StarRating
                      rating={ratingForm.reliability}
                      onRatingChange={rating =>
                        setRatingForm(prev => ({ ...prev, reliability: rating }))
                      }
                    />
                  </div>
                </div>
              )}

              <div>
                <Label className="text-sm font-medium">Comentario (opcional)</Label>
                <Textarea
                  placeholder="Comparte tu experiencia..."
                  value={ratingForm.comment}
                  onChange={e => setRatingForm(prev => ({ ...prev, comment: e.target.value }))}
                  className="mt-1"
                  rows={3}
                />
              </div>
            </div>

            <DialogFooter className="gap-2">
              <Button variant="outline" onClick={handleCancelRating}>
                Cancelar
              </Button>
              <Button
                onClick={handleSubmitRating}
                disabled={ratingForm.overallRating === 0}
                className="bg-blue-600 hover:bg-blue-700"
              >
                Enviar Calificación
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </UnifiedDashboardLayout>
  );
}

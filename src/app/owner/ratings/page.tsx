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
  ThumbsDown,
} from 'lucide-react';
import UnifiedDashboardLayout from '@/components/layout/UnifiedDashboardLayout';
import { useAuth } from '@/components/auth/AuthProviderSimple';
import { toast } from 'sonner';
import { logger } from '@/lib/logger-minimal';

interface Rating {
  id: string;
  tenantName: string;
  propertyTitle: string;
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

interface RatingToGive {
  id: string;
  recipientType: 'tenant' | 'broker' | 'maintenance_provider';
  recipientName: string;
  recipientId: string;
  propertyTitle?: string;
  contractId?: string;
  maintenanceId?: string;
  canRate: boolean;
  reason?: string;
}

export default function CalificacionesPage() {
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
    comment: '',
    anonymous: false,
  });

  // Mock ratings data
  const mockRatings: Rating[] = [
    {
      id: '1',
      tenantName: 'María González',
      propertyTitle: 'Departamento en Providencia',
      overallRating: 5,
      punctuality: 5,
      professionalism: 5,
      communication: 5,
      comment: 'Excelente servicio, muy puntuales y profesionales. La propiedad está impecable.',
      verified: true,
      anonymous: false,
      date: '2024-01-15T10:00:00Z',
    },
    {
      id: '2',
      tenantName: 'Carlos Rodríguez',
      propertyTitle: 'Casa Familiar en Las Condes',
      overallRating: 4,
      punctuality: 4,
      professionalism: 4,
      communication: 3,
      comment: 'Buen servicio en general, aunque la comunicación podría mejorar un poco.',
      verified: true,
      anonymous: false,
      date: '2024-01-10T14:30:00Z',
    },
    {
      id: '3',
      tenantName: 'Ana López',
      propertyTitle: 'Estudio Moderno Centro',
      overallRating: 5,
      punctuality: 5,
      professionalism: 5,
      communication: 5,
      verified: false,
      anonymous: true,
      date: '2024-01-20T09:15:00Z',
    },
  ];

  // Mock data for ratings that can be given
  const mockRatingsToGive: RatingToGive[] = [
    {
      id: 'rtg1',
      recipientType: 'tenant',
      recipientName: 'María González',
      recipientId: 'tenant1',
      propertyTitle: 'Apartamento Centro',
      contractId: 'contract1',
      canRate: true,
    },
    {
      id: 'rtg2',
      recipientType: 'broker',
      recipientName: 'Ana Martínez',
      recipientId: 'broker1',
      propertyTitle: 'Oficina Las Condes',
      contractId: 'contract2',
      canRate: true,
    },
    {
      id: 'rtg3',
      recipientType: 'maintenance_provider',
      recipientName: 'Servicios Técnicos Ltda.',
      recipientId: 'provider1',
      propertyTitle: 'Casa Los Dominicos',
      maintenanceId: 'maintenance1',
      canRate: true,
    },
    {
      id: 'rtg4',
      recipientType: 'tenant',
      recipientName: 'Carlos Rodríguez',
      recipientId: 'tenant2',
      propertyTitle: 'Casa Vitacura',
      contractId: 'contract3',
      canRate: false,
      reason: 'Contrato aún activo - calificación disponible al finalizar',
    },
  ];

  useEffect(() => {
    loadPageData();
  }, []);

  const loadPageData = async () => {
    try {
      setLoading(true);

      // Fetch real ratings data from API - NO filtrar por isPublic para mostrar todas las calificaciones recibidas
      const response = await fetch('/api/ratings?limit=100', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        credentials: 'include',
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('🔍 [Owner Ratings Page] API Error Response:', {
          status: response.status,
          statusText: response.statusText,
          errorData,
        });
        throw new Error(
          `Error ${response.status}: ${errorData.error || errorData.message || response.statusText}`
        );
      }

      const data = await response.json().catch(parseError => {
        console.error('🔍 [Owner Ratings Page] Error parsing JSON:', parseError);
        return { success: false, error: 'Error parsing response' };
      });

      // Validar que data existe
      if (!data) {
        console.error('🔍 [Owner Ratings Page] Data is null or undefined');
        setRatings([]);
        setRatingsToGive([]);
        return;
      }

      // Log para depuración - ANTES de procesar
      console.log('🔍 [Owner Ratings Page] API Response:', {
        success: data?.success,
        hasData: !!data?.data,
        hasRatings: !!(data?.data?.ratings || data?.ratings),
        dataStructure: data ? Object.keys(data) : [],
        dataType: typeof data,
        isArray: Array.isArray(data),
        fullResponse: data,
      });

      // La API devuelve { success: true, data: { ratings: [...], total: ... }, pagination: {...} }
      // Asegurarse de que ratingsList siempre sea un array
      let ratingsList: any[] = [];

      if (data && typeof data === 'object') {
        if (data.success && data.data && Array.isArray(data.data.ratings)) {
          ratingsList = data.data.ratings;
        } else if (Array.isArray(data.ratings)) {
          ratingsList = data.ratings;
        } else if (Array.isArray(data.data)) {
          ratingsList = data.data;
        } else if (Array.isArray(data)) {
          ratingsList = data;
        }
      }

      // Asegurarse de que ratingsList es un array válido
      if (!Array.isArray(ratingsList)) {
        console.warn(
          '🔍 [Owner Ratings Page] ratingsList is not an array, defaulting to empty array:',
          ratingsList
        );
        ratingsList = [];
      }

      // Log para depuración - DESPUÉS de procesar
      console.log('🔍 [Owner Ratings Page] Processed Ratings:', {
        ratingsListLength: ratingsList.length,
        isArray: Array.isArray(ratingsList),
        firstRating: ratingsList[0],
      });

      logger.info('Calificaciones recibidas del API:', {
        total: data.data?.total || data.total || 0,
        ratingsCount: ratingsList.length,
        ratings: Array.isArray(ratingsList)
          ? ratingsList.map((r: any) => ({
              id: r.id,
              fromUserId: r.fromUserId,
              fromUser: r.fromUser?.name,
              toUserId: r.toUserId,
              toUser: r.toUser?.name,
              contextType: r.contextType,
              overallRating: r.overallRating,
              isPublic: r.isPublic,
            }))
          : [],
      });

      // Transform API data to match our interface
      // Asegurarse de que ratingsList es un array antes de hacer map
      const transformedRatings: Rating[] = Array.isArray(ratingsList)
        ? ratingsList.map((rating: any) => ({
            id: rating.id,
            tenantName:
              rating.fromUser?.name ||
              rating.tenantName ||
              rating.tenant?.name ||
              'Usuario no identificado',
            propertyTitle:
              rating.property?.title || rating.propertyTitle || 'Propiedad no identificada',
            overallRating: rating.overallRating || rating.rating || 0,
            punctuality: rating.punctualityRating || undefined,
            professionalism: rating.professionalismRating || undefined,
            communication: rating.communicationRating || undefined,
            quality: rating.qualityRating || undefined,
            reliability: rating.reliabilityRating || undefined,
            comment: rating.comment || 'Sin comentario',
            positiveFeedback: rating.positiveFeedback || [],
            improvementAreas: rating.improvementAreas || [],
            verified: rating.isVerified || rating.verified || false,
            anonymous: rating.isAnonymous || rating.anonymous || false,
            date: rating.createdAt || rating.date,
            contextType: rating.contextType,
          }))
        : [];

      // Usar datos reales o array vacío si no hay calificaciones
      setRatings(transformedRatings);

      // Fetch ratings that can be given (from contracts, maintenance, etc.)
      const contractsResponse = await fetch('/api/contracts?status=COMPLETED&limit=50', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        credentials: 'include',
      });

      if (contractsResponse.ok) {
        const contractsData = await contractsResponse.json().catch(() => ({ contracts: [] }));
        const contracts = Array.isArray(contractsData.contracts) ? contractsData.contracts : [];
        const ratingsToGive: RatingToGive[] = contracts.map((contract: any) => ({
          id: `contract-${contract.id}`,
          recipientType: 'tenant',
          recipientName: contract.tenant?.name || 'Inquilino',
          recipientId: contract.tenantId,
          propertyTitle: contract.property?.title || 'Propiedad',
          contractId: contract.id,
          canRate: true,
        }));

        setRatingsToGive(ratingsToGive);
      }
    } catch (error) {
      console.error('🔍 [Owner Ratings Page] Error loading ratings data:', {
        error: error instanceof Error ? error.message : String(error),
        errorStack: error instanceof Error ? error.stack : undefined,
      });

      logger.error('Error loading ratings data:', {
        error: error instanceof Error ? error.message : String(error),
        errorStack: error instanceof Error ? error.stack : undefined,
      });

      // En caso de error, mostrar arrays vacíos
      setRatings([]);
      setRatingsToGive([]);

      // Mostrar mensaje de error al usuario
      toast.error('Error al cargar las calificaciones. Por favor, intenta de nuevo.');
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
          recipientType: selectedRatingToGive.recipientType,
          recipientId: selectedRatingToGive.recipientId,
          overallRating: ratingForm.overallRating,
          punctuality: ratingForm.punctuality,
          professionalism: ratingForm.professionalism,
          communication: ratingForm.communication,
          quality: ratingForm.quality,
          comment: ratingForm.comment,
          anonymous: ratingForm.anonymous,
          contractId: selectedRatingToGive.contractId,
          maintenanceId: selectedRatingToGive.maintenanceId,
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
      alert('Calificación enviada exitosamente');
    } catch (error) {
      logger.error('Error submitting rating:', error);
      alert('Error al enviar la calificación');
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

  // Get recipient type icon and label
  const getRecipientTypeInfo = (type: string) => {
    switch (type) {
      case 'tenant':
        return { icon: User, label: 'Inquilino', color: 'bg-blue-100 text-blue-800' };
      case 'broker':
        return { icon: Users, label: 'Corredor', color: 'bg-green-100 text-green-800' };
      case 'maintenance_provider':
        return { icon: Wrench, label: 'Prestador', color: 'bg-orange-100 text-orange-800' };
      default:
        return { icon: User, label: 'Usuario', color: 'bg-gray-100 text-gray-800' };
    }
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
                  {Array.isArray(ratings) && ratings.length > 0
                    ? ratings.map(rating => (
                        <Card key={rating.id} className="border-l-4 border-l-blue-500">
                          <CardContent className="pt-6">
                            <div className="flex items-start justify-between mb-4">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                                  <span className="text-sm font-medium text-gray-600">
                                    {rating.tenantName.substring(0, 2).toUpperCase()}
                                  </span>
                                </div>
                                <div>
                                  <h4 className="font-semibold text-gray-900">
                                    {rating.tenantName}
                                  </h4>
                                  <p className="text-sm text-gray-600">{rating.propertyTitle}</p>
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
                      ))
                    : null}
                </div>

                {ratings.length === 0 && (
                  <div className="text-center py-12">
                    <Star className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      Aún no tienes calificaciones
                    </h3>
                    <p className="text-gray-600 mb-3">
                      Las calificaciones aparecerán aquí cuando completes contratos con inquilinos.
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
                  Califica a inquilinos, corredores y prestadores de servicios
                </p>
              </div>
              <div className="text-sm text-gray-500">
                {ratingsToGive.filter(r => r.canRate).length} calificaciones disponibles
              </div>
            </div>

            {/* Ratings to give list */}
            <div className="space-y-4">
              {Array.isArray(ratingsToGive) && ratingsToGive.length > 0
                ? ratingsToGive.map(ratingToGive => {
                    const typeInfo = getRecipientTypeInfo(ratingToGive.recipientType);
                    const Icon = typeInfo.icon;

                    return (
                      <Card key={ratingToGive.id} className="hover:shadow-md transition-shadow">
                        <CardContent className="pt-6">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                              <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
                                <Icon className="w-6 h-6 text-gray-600" />
                              </div>

                              <div>
                                <div className="flex items-center gap-2 mb-1">
                                  <h3 className="font-semibold text-gray-900">
                                    {ratingToGive.recipientName}
                                  </h3>
                                  <Badge className={typeInfo.color}>
                                    <Icon className="w-3 h-3 mr-1" />
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
                  })
                : null}
            </div>

            {(!Array.isArray(ratingsToGive) || ratingsToGive.length === 0) && (
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

              {selectedRatingToGive?.recipientType === 'maintenance_provider' && (
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

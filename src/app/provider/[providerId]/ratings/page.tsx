'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Star,
  TrendingUp,
  Users,
  Calendar,
  MessageSquare,
  ThumbsUp,
  Flag,
  ArrowLeft,
  Shield,
  Award,
  CheckCircle,
  AlertCircle,
  MapPin,
  Phone,
  Mail,
} from 'lucide-react';
import UnifiedDashboardLayout from '@/components/layout/UnifiedDashboardLayout';
import DashboardHeader from '@/components/dashboard/DashboardHeader';
import {
  ratingService,
  RatingType,
  type ProviderRatingSummary,
  type ProviderRating,
} from '@/lib/ratings/rating-service';
import { logger } from '@/lib/logger';

interface ProviderProfile {
  id: string;
  businessName: string;
  specialty: string;
  location: string;
  rating: number;
  totalJobs: number;
  memberSince: Date;
  description: string;
  avatar?: string;
  contactInfo: {
    phone: string;
    email: string;
  };
  services: string[];
  certifications: string[];
}

export default function ProviderRatingsPage() {
  const params = useParams();
  const router = useRouter();
  const providerId = params.providerId as string;

  const [user, setUser] = useState<any>(null);
  const [provider, setProvider] = useState<ProviderProfile | null>(null);
  const [summary, setSummary] = useState<ProviderRatingSummary | null>(null);
  const [ratings, setRatings] = useState<ProviderRating[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    loadData();
  }, [providerId]);

  const loadData = async () => {
    try {
      setLoading(true);

      // Obtener información del usuario actual
      const userResponse = await fetch('/api/auth/me');
      if (userResponse.ok) {
        const userData = await userResponse.json();
        setUser(userData.user);
      }

      // Obtener perfil del proveedor
      const providerResponse = await fetch(`/api/providers/${providerId}`);
      if (providerResponse.ok) {
        const providerData = await providerResponse.json();
        setProvider(providerData);
      }

      // Obtener resumen de ratings
      const summaryResult = await ratingService.getProviderSummary(providerId);
      setSummary(summaryResult);

      // Obtener ratings recientes
      const recentRatings = await ratingService.getProviderRatings(providerId, 20);
      setRatings(recentRatings);
    } catch (error) {
      logger.error('Error cargando datos del proveedor:', {
        error: error instanceof Error ? error.message : String(error),
      });
    } finally {
      setLoading(false);
    }
  };

  const handleReportRating = async (ratingId: string, reason: string) => {
    try {
      await ratingService.reportRating(ratingId, reason, user?.id || 'anonymous');
      setSuccessMessage('Gracias por reportar. Revisaremos la calificación.');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      logger.error('Error reportando rating:', {
        error: error instanceof Error ? error.message : String(error),
      });
      setErrorMessage('Error al reportar la calificación. Por favor, inténtalo nuevamente.');
      setTimeout(() => setErrorMessage(''), 5000);
    }
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('es-CL', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const getTrustScoreColor = (score: number) => {
    if (score >= 80) {
      return 'text-green-600 bg-green-100';
    }
    if (score >= 60) {
      return 'text-yellow-600 bg-yellow-100';
    }
    return 'text-red-600 bg-red-100';
  };

  const getRatingDistribution = (type: RatingType) => {
    if (!summary || !summary.ratingDistribution) {
      return { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    }
    return summary.ratingDistribution[type];
  };

  const renderStars = (rating: number, size: 'sm' | 'md' | 'lg' = 'md') => {
    const sizeClasses = {
      sm: 'w-4 h-4',
      md: 'w-5 h-5',
      lg: 'w-6 h-6',
    };

    return (
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map(star => (
          <Star
            key={star}
            className={`${sizeClasses[size]} ${
              star <= rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'
            }`}
          />
        ))}
        <span className="ml-2 text-sm font-medium">{rating.toFixed(1)}</span>
      </div>
    );
  };

  const renderRatingBar = (stars: number, count: number, total: number) => {
    const percentage = total > 0 ? (count / total) * 100 : 0;

    return (
      <div className="flex items-center gap-3 mb-2">
        <div className="flex items-center gap-1 w-12">
          <span className="text-sm font-medium">{stars}</span>
          <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
        </div>
        <Progress value={percentage} className="flex-1 h-2" />
        <span className="text-sm text-gray-600 w-8">{count}</span>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando perfil del proveedor...</p>
        </div>
      </div>
    );
  }

  if (!provider || !summary) {
    return (
      <UnifiedDashboardLayout
        user={user}
        title="Proveedor no encontrado"
        subtitle="El proveedor solicitado no existe"
      >
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <Card className="max-w-md w-full">
            <CardContent className="pt-6">
              <div className="text-center">
                <h2 className="text-xl font-semibold text-gray-900 mb-2">
                  Proveedor no encontrado
                </h2>
                <p className="text-gray-600 mb-6">
                  No se pudo encontrar la información del proveedor solicitado.
                </p>
                <Button onClick={() => router.back()}>
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Volver
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </UnifiedDashboardLayout>
    );
  }

  return (
    <UnifiedDashboardLayout
      user={user}
      title={`Perfil de ${provider.businessName}`}
      subtitle="Perfil y calificaciones del proveedor"
    >
      <DashboardHeader
        user={user}
        title={provider.businessName}
        subtitle="Perfil y calificaciones del proveedor"
      />

      <div className="container mx-auto px-4 py-6 max-w-6xl">
        {/* Success Message */}
        {successMessage && (
          <Card className="border-green-200 bg-green-50 mb-6">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <span className="text-green-800">{successMessage}</span>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Error Message */}
        {errorMessage && (
          <Card className="border-red-200 bg-red-50 mb-6">
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

        {/* Header del Proveedor */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row gap-6">
              {/* Avatar y Info Básica */}
              <div className="flex items-center gap-4">
                <Avatar className="w-20 h-20">
                  <AvatarImage src={provider.avatar} alt={provider.businessName} />
                  <AvatarFallback className="text-xl">
                    {provider.businessName.substring(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">{provider.businessName}</h1>
                  <p className="text-gray-600">{provider.specialty}</p>
                  <div className="flex items-center gap-4 mt-2">
                    <div className="flex items-center gap-1">
                      <MapPin className="w-4 h-4 text-gray-400" />
                      <span className="text-sm text-gray-600">{provider.location}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Calendar className="w-4 h-4 text-gray-400" />
                      <span className="text-sm text-gray-600">
                        Miembro desde{' '}
                        {provider.memberSince
                          ? provider.memberSince.getFullYear()
                          : new Date().getFullYear()}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Estadísticas Principales */}
              <div className="flex-1 grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900">
                    {summary.overallAverage?.toFixed(1) || '0.0'}
                  </div>
                  <div className="flex items-center justify-center gap-1 mb-1">
                    {renderStars(summary.overallAverage || 0)}
                  </div>
                  <div className="text-sm text-gray-600">Calificación general</div>
                </div>

                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900">
                    {summary.totalRatings || 0}
                  </div>
                  <div className="text-sm text-gray-600">Reseñas totales</div>
                </div>

                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900">{provider.totalJobs}</div>
                  <div className="text-sm text-gray-600">Trabajos completados</div>
                </div>

                <div className="text-center">
                  <div
                    className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${getTrustScoreColor(summary.trustScore || 0)}`}
                  >
                    <Shield className="w-4 h-4" />
                    {summary.trustScore || 0}
                  </div>
                  <div className="text-sm text-gray-600">Trust Score</div>
                </div>
              </div>
            </div>

            {/* Descripción y Servicios */}
            <div className="mt-6 pt-6 border-t">
              <p className="text-gray-700 mb-4">{provider.description}</p>

              <div className="flex flex-wrap gap-2 mb-4">
                {provider.services.map((service, index) => (
                  <Badge key={index} variant="secondary">
                    {service}
                  </Badge>
                ))}
              </div>

              {provider.certifications && provider.certifications.length > 0 && (
                <div className="flex items-center gap-2">
                  <Award className="w-4 h-4 text-green-600" />
                  <span className="text-sm text-gray-600">Certificaciones:</span>
                  <div className="flex gap-2">
                    {provider.certifications.map((cert, index) => (
                      <Badge
                        key={index}
                        variant="outline"
                        className="text-green-600 border-green-600"
                      >
                        {cert}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Contenido Principal con Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview">Resumen</TabsTrigger>
            <TabsTrigger value="ratings">Reseñas ({summary.totalRatings})</TabsTrigger>
            <TabsTrigger value="contact">Contacto</TabsTrigger>
          </TabsList>

          {/* Tab de Resumen */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid lg:grid-cols-2 gap-6">
              {/* Distribución de Ratings */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5" />
                    Distribución de Calificaciones
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {[5, 4, 3, 2, 1].map(stars => {
                      const distribution = getRatingDistribution(RatingType.OVERALL);
                      const count = distribution[stars as keyof typeof distribution];
                      return renderRatingBar(stars, count, summary.totalRatings);
                    })}
                  </div>
                </CardContent>
              </Card>

              {/* Ratings por Categoría */}
              <Card>
                <CardHeader>
                  <CardTitle>Calificaciones Detalladas</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {Object.values(RatingType).map(type => (
                      <div key={type} className="flex items-center justify-between">
                        <span className="text-sm font-medium capitalize">
                          {type.replace('_', ' ').toLowerCase()}
                        </span>
                        <div className="flex items-center gap-2">
                          {renderStars(
                            summary.averageRatings ? summary.averageRatings[type] || 0 : 0,
                            'sm'
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Estadísticas de Rendimiento */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  Estadísticas de Rendimiento
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-green-600">
                      {summary.trustScore || 0}%
                    </div>
                    <div className="text-sm text-gray-600">Tasa de satisfacción</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-blue-600">
                      {summary.recentRatings
                        ? summary.recentRatings.filter(r => (r.ratings?.overall ?? 0) >= 4).length
                        : 0}
                    </div>
                    <div className="text-sm text-gray-600">Reseñas positivas recientes</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-purple-600">
                      {(summary.totalRatings || 0) > 0
                        ? Math.round((summary.totalRatings || 0) / 30)
                        : 0}
                    </div>
                    <div className="text-sm text-gray-600">Reseñas por mes</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab de Reseñas */}
          <TabsContent value="ratings" className="space-y-6">
            {ratings.length === 0 ? (
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center py-12">
                    <MessageSquare className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">No hay reseñas aún</h3>
                    <p className="text-gray-600">
                      Este proveedor aún no tiene reseñas de clientes.
                    </p>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {ratings.map(rating => (
                  <Card key={rating.id}>
                    <CardContent className="pt-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <Avatar className="w-10 h-10">
                            <AvatarFallback>
                              {rating.clientId
                                ? rating.clientId.substring(0, 2).toUpperCase()
                                : '??'}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-medium">
                              Cliente {rating.clientId.substring(0, 8)}
                            </div>
                            <div className="text-sm text-gray-600">
                              {rating.createdAt
                                ? formatDate(rating.createdAt)
                                : 'Fecha desconocida'}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {renderStars(rating.ratings?.overall || 0)}
                          {!rating.isVerified && (
                            <Badge variant="outline" className="text-yellow-600">
                              Pendiente verificación
                            </Badge>
                          )}
                        </div>
                      </div>

                      {rating.comments && <p className="text-gray-700 mb-4">{rating.comments}</p>}

                      {/* Ratings detallados */}
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4">
                        {rating.ratings &&
                          Object.entries(rating.ratings).map(([type, value]) => {
                            if (type === 'overall') {
                              return null;
                            }
                            return (
                              <div key={type} className="text-sm">
                                <span className="text-gray-600 capitalize">
                                  {type.replace('_', ' ').toLowerCase()}:
                                </span>
                                <div className="flex items-center gap-1 mt-1">
                                  {renderStars(value, 'sm')}
                                </div>
                              </div>
                            );
                          })}
                      </div>

                      {/* Acciones */}
                      <div className="flex items-center justify-between pt-4 border-t">
                        <div className="flex items-center gap-2">
                          {rating.isAnonymous && <Badge variant="secondary">Anónima</Badge>}
                          {rating.isVerified && (
                            <Badge className="bg-green-100 text-green-800">
                              <Shield className="w-3 h-3 mr-1" />
                              Verificada
                            </Badge>
                          )}
                        </div>

                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleReportRating(rating.id, 'Contenido inapropiado')}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Flag className="w-4 h-4 mr-1" />
                          Reportar
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Tab de Contacto */}
          <TabsContent value="contact" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Phone className="w-5 h-5" />
                  Información de Contacto
                </CardTitle>
                <CardDescription>Contacta directamente con {provider.businessName}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <Phone className="w-5 h-5 text-gray-400" />
                    <div>
                      <div className="font-medium">Teléfono</div>
                      <div className="text-gray-600">{provider.contactInfo.phone}</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <Mail className="w-5 h-5 text-gray-400" />
                    <div>
                      <div className="font-medium">Email</div>
                      <div className="text-gray-600">{provider.contactInfo.email}</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <MapPin className="w-5 h-5 text-gray-400" />
                    <div>
                      <div className="font-medium">Ubicación</div>
                      <div className="text-gray-600">{provider.location}</div>
                    </div>
                  </div>
                </div>

                <div className="flex gap-3 mt-6">
                  <Button className="flex-1">
                    <Phone className="w-4 h-4 mr-2" />
                    Llamar
                  </Button>
                  <Button variant="outline" className="flex-1">
                    <Mail className="w-4 h-4 mr-2" />
                    Email
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Solicitar Servicio</CardTitle>
                <CardDescription>
                  ¿Necesitas los servicios de {provider.businessName}?
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button className="w-full" size="lg">
                  <MessageSquare className="w-5 h-5 mr-2" />
                  Solicitar Cotización
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </UnifiedDashboardLayout>
  );
}

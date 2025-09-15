'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Trophy,
  Star,
  TrendingUp,
  Users,
  Award,
  Medal,
  Crown,
  Shield,
  MapPin,
  ExternalLink
} from 'lucide-react';
import EnhancedDashboardLayout from '@/components/dashboard/EnhancedDashboardLayout';
import DashboardHeader from '@/components/dashboard/DashboardHeader';
import { ratingService, type ProviderRatingSummary } from '@/lib/ratings/rating-service';
import { logger } from '@/lib/logger-edge';

interface TopProvider {
  providerId: string;
  businessName: string;
  specialty: string;
  location: string;
  avatar?: string;
  summary: ProviderRatingSummary;
  rank: number;
}

interface LeaderboardStats {
  totalProviders: number;
  averageRating: number;
  topCategory: string;
  totalReviews: number;
}

export default function TopRatedProvidersPage() {
  const [user, setUser] = useState<any>(null);
  const [providers, setProviders] = useState<TopProvider[]>([]);
  const [stats, setStats] = useState<LeaderboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [timeframe, setTimeframe] = useState('all');

  const categories = [
    { value: 'all', label: 'Todas las categorías' },
    { value: 'MAINTENANCE', label: 'Mantenimiento' },
    { value: 'CLEANING', label: 'Limpieza' },
    { value: 'GARDENING', label: 'Jardinería' },
    { value: 'SECURITY', label: 'Seguridad' },
    { value: 'SPECIALIZED_SERVICES', label: 'Servicios Especializados' }
  ];

  const timeframes = [
    { value: 'all', label: 'Todo el tiempo' },
    { value: 'month', label: 'Último mes' },
    { value: 'quarter', label: 'Último trimestre' },
    { value: 'year', label: 'Último año' }
  ];

  useEffect(() => {
    loadData();
  }, [selectedCategory, timeframe]);

  const loadData = async () => {
    try {
      setLoading(true);

      // Obtener información del usuario
      const userResponse = await fetch('/api/auth/me');
      if (userResponse.ok) {
        const userData = await userResponse.json();
        setUser(userData.user);
      }

      // Obtener proveedores mejor calificados
      const topProviders = await ratingService.getTopRatedProviders(50);

      // Transformar datos para el frontend
      const formattedProviders: TopProvider[] = topProviders.map((item, index) => ({
        providerId: item.providerId,
        businessName: `Proveedor ${item.providerId.slice(-4)}`, // Mock name
        specialty: 'Servicio General', // Mock specialty
        location: 'Santiago, Chile', // Mock location
        summary: item.summary,
        rank: index + 1
      }));

      setProviders(formattedProviders);

      // Calcular estadísticas
      const leaderboardStats: LeaderboardStats = {
        totalProviders: formattedProviders.length,
        averageRating: formattedProviders.length > 0
          ? formattedProviders.reduce((sum, p) => sum + p.summary.overallAverage, 0) / formattedProviders.length
          : 0,
        topCategory: 'MAINTENANCE', // Mock
        totalReviews: formattedProviders.reduce((sum, p) => sum + p.summary.totalRatings, 0)
      };

      setStats(leaderboardStats);

    } catch (error) {
      logger.error('Error cargando leaderboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Crown className="w-6 h-6 text-yellow-500" />;
      case 2:
        return <Medal className="w-6 h-6 text-gray-400" />;
      case 3:
        return <Award className="w-6 h-6 text-amber-600" />;
      default:
        return <span className="w-6 h-6 flex items-center justify-center text-lg font-bold text-gray-600">#{rank}</span>;
    }
  };

  const getRankBadgeColor = (rank: number) => {
    switch (rank) {
      case 1:
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 2:
        return 'bg-gray-100 text-gray-800 border-gray-300';
      case 3:
        return 'bg-amber-100 text-amber-800 border-amber-300';
      default:
        return 'bg-blue-100 text-blue-800 border-blue-300';
    }
  };

  const getTrustScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600 bg-green-100';
    if (score >= 80) return 'text-blue-600 bg-blue-100';
    if (score >= 70) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  const renderStars = (rating: number) => {
    return (
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`w-4 h-4 ${
              star <= rating
                ? 'fill-yellow-400 text-yellow-400'
                : 'text-gray-300'
            }`}
          />
        ))}
        <span className="ml-1 text-sm font-medium">{rating.toFixed(1)}</span>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando proveedores mejor calificados...</p>
        </div>
      </div>
    );
  }

  return (
    <EnhancedDashboardLayout title="Proveedores Mejor Calificados">
      <DashboardHeader
        user={user}
        title="🏆 Proveedores Mejor Calificados"
        subtitle="Descubre los proveedores más confiables y mejor evaluados"
      />

      <div className="container mx-auto px-4 py-6 max-w-6xl">
        {/* Estadísticas Generales */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <Card className="bg-gradient-to-br from-yellow-50 to-yellow-100 border-yellow-200">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-yellow-700">Proveedores Top</p>
                    <p className="text-2xl font-bold text-yellow-900">{stats.totalProviders}</p>
                    <p className="text-xs text-yellow-600 mt-1">
                      En el leaderboard
                    </p>
                  </div>
                  <Trophy className="w-12 h-12 text-yellow-600" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-blue-700">Rating Promedio</p>
                    <p className="text-2xl font-bold text-blue-900">{stats.averageRating.toFixed(1)}</p>
                    <p className="text-xs text-blue-600 mt-1">
                      De 5 estrellas
                    </p>
                  </div>
                  <Star className="w-12 h-12 text-blue-600" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-green-700">Total Reseñas</p>
                    <p className="text-2xl font-bold text-green-900">{stats.totalReviews}</p>
                    <p className="text-xs text-green-600 mt-1">
                      Reseñas verificadas
                    </p>
                  </div>
                  <Users className="w-12 h-12 text-green-600" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-purple-700">Categoría Top</p>
                    <p className="text-lg font-bold text-purple-900">{stats.topCategory}</p>
                    <p className="text-xs text-purple-600 mt-1">
                      Más demandada
                    </p>
                  </div>
                  <TrendingUp className="w-12 h-12 text-purple-600" />
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Filtros */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="w-5 h-5" />
              Filtros de Búsqueda
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Categoría
                </label>
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category.value} value={category.value}>
                        {category.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Período
                </label>
                <Select value={timeframe} onValueChange={setTimeframe}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {timeframes.map((tf) => (
                      <SelectItem key={tf.value} value={tf.value}>
                        {tf.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Leaderboard */}
        <div className="space-y-4">
          {providers.length === 0 ? (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center py-12">
                  <Trophy className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    No hay proveedores calificados
                  </h3>
                  <p className="text-gray-600">
                    Aún no hay proveedores con suficientes reseñas para aparecer en el leaderboard.
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : (
            providers.map((provider) => (
              <Card key={provider.providerId} className="hover:shadow-lg transition-shadow">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-6">
                    {/* Ranking */}
                    <div className="flex items-center justify-center w-16">
                      {getRankIcon(provider.rank)}
                    </div>

                    {/* Avatar y Info Principal */}
                    <div className="flex items-center gap-4 flex-1">
                      <Avatar className="w-16 h-16">
                        <AvatarImage src={provider.avatar} alt={provider.businessName} />
                        <AvatarFallback className="text-xl">
                          {provider.businessName.substring(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>

                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-1">
                          <h3 className="text-xl font-bold text-gray-900">
                            {provider.businessName}
                          </h3>
                          <Badge className={getRankBadgeColor(provider.rank)}>
                            #{provider.rank}
                          </Badge>
                        </div>

                        <div className="flex items-center gap-4 text-sm text-gray-600 mb-2">
                          <span>{provider.specialty}</span>
                          <div className="flex items-center gap-1">
                            <MapPin className="w-4 h-4" />
                            <span>{provider.location}</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium">Rating:</span>
                            {renderStars(provider.summary.overallAverage)}
                          </div>

                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium">Reseñas:</span>
                            <span className="text-sm text-gray-600">
                              {provider.summary.totalRatings}
                            </span>
                          </div>

                          <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getTrustScoreColor(provider.summary.trustScore)}`}>
                            <Shield className="w-3 h-3" />
                            Trust Score: {provider.summary.trustScore}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Estadísticas Detalladas */}
                    <div className="hidden md:grid grid-cols-3 gap-6 text-center">
                      <div>
                        <div className="text-lg font-bold text-gray-900">
                          {provider.summary.totalRatings}
                        </div>
                        <div className="text-xs text-gray-600">Reseñas</div>
                      </div>

                      <div>
                        <div className="text-lg font-bold text-gray-900">
                          {provider.summary.overallAverage.toFixed(1)}
                        </div>
                        <div className="text-xs text-gray-600">Rating</div>
                      </div>

                      <div>
                        <div className="text-lg font-bold text-gray-900">
                          {provider.summary.trustScore}
                        </div>
                        <div className="text-xs text-gray-600">Trust Score</div>
                      </div>
                    </div>

                    {/* Acciones */}
                    <div className="flex flex-col gap-2">
                      <Button variant="outline" size="sm">
                        <ExternalLink className="w-4 h-4 mr-1" />
                        Ver Perfil
                      </Button>
                      <Button size="sm">
                        Contactar
                      </Button>
                    </div>
                  </div>

                  {/* Ratings Recientes */}
                  <div className="mt-6 pt-6 border-t">
                    <h4 className="text-sm font-medium text-gray-900 mb-3">Reseñas Recientes</h4>
                    <div className="flex gap-4 overflow-x-auto">
                      {provider.summary.recentRatings.slice(0, 3).map((rating, index) => (
                        <div key={index} className="flex-shrink-0 p-3 bg-gray-50 rounded-lg min-w-[200px]">
                          <div className="flex items-center gap-2 mb-2">
                            {renderStars(rating.ratings.overall)}
                            <span className="text-xs text-gray-600">
                              {new Date(rating.createdAt).toLocaleDateString('es-CL')}
                            </span>
                          </div>
                          {rating.comments && (
                            <p className="text-xs text-gray-700 line-clamp-2">
                              "{rating.comments}"
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* Información Adicional */}
        <Card className="mt-8 bg-blue-50 border-blue-200">
          <CardContent className="pt-6">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Shield className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-blue-900 mb-2">
                  ¿Cómo funciona el ranking?
                </h3>
                <div className="text-blue-800 space-y-2">
                  <p>
                    <strong>Trust Score:</strong> Combina rating promedio, consistencia,
                    número de reseñas y reseñas recientes positivas.
                  </p>
                  <p>
                    <strong>Criterios de calidad:</strong> Solo proveedores con al menos
                    5 reseñas aparecen en el leaderboard.
                  </p>
                  <p>
                    <strong>Actualización:</strong> Los rankings se actualizan en tiempo real
                    conforme llegan nuevas reseñas.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </EnhancedDashboardLayout>
  );
}

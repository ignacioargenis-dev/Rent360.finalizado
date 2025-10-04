'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
} from 'lucide-react';
import UnifiedDashboardLayout from '@/components/layout/UnifiedDashboardLayout';

interface Rating {
  id: string;
  tenantName: string;
  propertyTitle: string;
  overallRating: number;
  punctuality: number;
  professionalism: number;
  communication: number;
  comment?: string;
  verified: boolean;
  anonymous: boolean;
  date: string;
}

export default function CalificacionesPage() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

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

  useEffect(() => {
    // Simular carga
    setTimeout(() => {
      setLoading(false);
    }, 1000);
  }, []);

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

  const averageRating = mockRatings.length > 0
    ? mockRatings.reduce((sum, r) => sum + r.overallRating, 0) / mockRatings.length
    : 0;

  const verifiedRatings = mockRatings.filter(r => r.verified).length;

  return (
    <UnifiedDashboardLayout title="Calificaciones" subtitle="Gestiona las calificaciones y reseñas de tus propiedades">
      <div className="container mx-auto px-4 py-6 max-w-7xl">
        {/* Header con estadísticas */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Calificaciones</CardTitle>
              <Star className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{mockRatings.length}</div>
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
                {[1, 2, 3, 4, 5].map((star) => (
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
              <p className="text-xs text-muted-foreground">De {mockRatings.length} total</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Calificaciones 5★</CardTitle>
              <Star className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">
                {mockRatings.filter(r => r.overallRating === 5).length}
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
              Aquí puedes gestionar y visualizar toda la información relacionada con calificaciones.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {mockRatings.map((rating) => (
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
                          <h4 className="font-semibold text-gray-900">{rating.tenantName}</h4>
                          <p className="text-sm text-gray-600">{rating.propertyTitle}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star
                              key={star}
                              className={`w-4 h-4 ${
                                star <= rating.overallRating
                                  ? 'fill-yellow-400 text-yellow-400'
                                  : 'text-gray-300'
                              }`}
                            />
                          ))}
                          <span className="ml-2 text-sm font-medium">{rating.overallRating}.0</span>
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
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star
                              key={star}
                              className={`w-3 h-3 ${
                                star <= rating.punctuality
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
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star
                              key={star}
                              className={`w-3 h-3 ${
                                star <= rating.professionalism
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
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star
                              key={star}
                              className={`w-3 h-3 ${
                                star <= rating.communication
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
                      {rating.anonymous && (
                        <Badge variant="secondary">Anónima</Badge>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {mockRatings.length === 0 && (
              <div className="text-center py-12">
                <Star className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  No hay calificaciones aún
                </h3>
                <p className="text-gray-600">
                  Las calificaciones de tus inquilinos aparecerán aquí una vez que completen sus evaluaciones.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </UnifiedDashboardLayout>
  );
}

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { logger } from '@/lib/logger-minimal';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
  Reply,
  TrendingUp,
  User,
  Calendar,
  MapPin,
  Settings,
  Wrench,
  CheckCircle,
  AlertCircle,
} from 'lucide-react';
import UnifiedDashboardLayout from '@/components/layout/UnifiedDashboardLayout';

export default function ProviderRatingsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<any>(null);
  const [ratings, setRatings] = useState<any[]>([
    {
      id: '1',
      clientName: 'María González',
      clientAvatar: '/avatars/maria.jpg',
      serviceType: 'Plomería',
      rating: 5,
      comment:
        'Excelente trabajo. El técnico llegó puntual, fue muy profesional y solucionó el problema rápidamente. Muy recomendable.',
      createdAt: '2024-01-15T14:30:00',
      propertyAddress: 'Las Condes 1234, Santiago',
      jobId: 'JOB-2024-001',
      hasResponse: true,
      response:
        '¡Gracias María! Me alegra que haya quedado satisfecha con el servicio. Fue un placer ayudarla.',
      responseDate: '2024-01-15T16:45:00',
      verified: true,
    },
    {
      id: '2',
      clientName: 'Carlos Rodríguez',
      clientAvatar: '/avatars/carlos.jpg',
      serviceType: 'Electricidad',
      rating: 5,
      comment:
        'Trabajo impecable. Instalaron todo el sistema eléctrico de mi departamento nuevo. Profesionales y puntuales.',
      createdAt: '2024-01-14T11:20:00',
      propertyAddress: 'Providencia 567, Santiago',
      jobId: 'JOB-2024-002',
      hasResponse: false,
      verified: true,
    },
    {
      id: '3',
      clientName: 'Ana Silva',
      clientAvatar: '/avatars/ana.jpg',
      serviceType: 'Pintura',
      rating: 4,
      comment:
        'Buen trabajo general. La pintura quedó bien, pero tardaron un poco más de lo esperado.',
      createdAt: '2024-01-13T09:15:00',
      propertyAddress: 'Ñuñoa 789, Santiago',
      jobId: 'JOB-2024-003',
      hasResponse: true,
      response:
        'Disculpe la demora Ana. Agradecemos su comprensión. Esperamos poder servirle nuevamente pronto.',
      responseDate: '2024-01-13T15:30:00',
      verified: true,
    },
    {
      id: '4',
      clientName: 'Pedro Morales',
      clientAvatar: '/avatars/pedro.jpg',
      serviceType: 'Jardinería',
      rating: 5,
      comment:
        'Fantástico servicio. Mi jardín se ve increíble. Los profesionales fueron muy cuidadosos y detallistas.',
      createdAt: '2024-01-12T16:45:00',
      propertyAddress: 'Vitacura 345, Santiago',
      jobId: 'JOB-2024-004',
      hasResponse: false,
      verified: true,
    },
    {
      id: '5',
      clientName: 'Sofía Vargas',
      clientAvatar: '/avatars/sofia.jpg',
      serviceType: 'Mantenimiento General',
      rating: 3,
      comment:
        'El trabajo estuvo bien, pero el presupuesto inicial fue mucho más bajo que el final.',
      createdAt: '2024-01-11T13:10:00',
      propertyAddress: 'La Reina 456, Santiago',
      jobId: 'JOB-2024-005',
      hasResponse: true,
      response:
        'Lamentamos la diferencia en el presupuesto Sofía. Durante el trabajo se encontraron problemas adicionales que no estaban previstos inicialmente. Agradecemos su comprensión.',
      responseDate: '2024-01-11T17:20:00',
      verified: true,
    },
    {
      id: '6',
      clientName: 'Diego López',
      clientAvatar: '/avatars/diego.jpg',
      serviceType: 'Electricidad',
      rating: 5,
      comment:
        'Servicio de primera. Solucionaron un problema complejo de manera rápida y eficiente.',
      createdAt: '2024-01-10T10:30:00',
      propertyAddress: 'Las Condes 890, Santiago',
      jobId: 'JOB-2024-006',
      hasResponse: false,
      verified: false,
    },
  ]);
  const [replyText, setReplyText] = useState('');
  const [selectedRatingId, setSelectedRatingId] = useState<string | null>(null);

  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    loadPageData();
  }, []);

  const loadPageData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Mock ratings overview data
      const overviewData = {
        averageRating: ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length,
        totalRatings: ratings.length,
        fiveStarRatings: ratings.filter(r => r.rating === 5).length,
        withComments: ratings.filter(r => r.comment).length,
        verifiedRatings: ratings.filter(r => r.verified).length,
        respondedRatings: ratings.filter(r => r.hasResponse).length,
      };

      setData(overviewData);
    } catch (error) {
      logger.error('Error loading page data:', {
        error: error instanceof Error ? error.message : String(error),
      });
      setError('Error al cargar los datos');
    } finally {
      setLoading(false);
    }
  };

  const handleReplyToRating = (ratingId: string, reply: string) => {
    setRatings(prev =>
      prev.map(rating =>
        rating.id === ratingId
          ? {
              ...rating,
              hasResponse: true,
              response: reply,
              responseDate: new Date().toISOString(),
            }
          : rating
      )
    );
    setReplyText('');
    setSelectedRatingId(null);
    setSuccessMessage('Respuesta enviada exitosamente');
    setTimeout(() => setSuccessMessage(''), 3000);
  };

  const handleExportRatings = () => {
    const csvContent = [
      ['Cliente', 'Servicio', 'Calificación', 'Comentario', 'Fecha', 'Verificada', 'Respondida'],
    ];

    ratings.forEach(rating => {
      csvContent.push([
        rating.clientName,
        rating.serviceType,
        rating.rating.toString(),
        `"${rating.comment}"`,
        new Date(rating.createdAt).toLocaleDateString('es-CL'),
        rating.verified ? 'Sí' : 'No',
        rating.hasResponse ? 'Sí' : 'No',
      ]);
    });

    const csvString = csvContent.map(row => row.map(field => field).join(',')).join('\n');
    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute(
      'download',
      `calificaciones_proveedor_${new Date().toISOString().split('T')[0]}.csv`
    );
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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
      <UnifiedDashboardLayout title="Mis Calificaciones" subtitle="Cargando información...">
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
      <UnifiedDashboardLayout title="Mis Calificaciones" subtitle="Error al cargar la página">
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
      subtitle="Revisa y gestiona las calificaciones que has recibido"
    >
      <div className="space-y-6">
        {/* Success Message */}
        {successMessage && (
          <Card className="border-green-200 bg-green-50">
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
          <Card className="border-red-200 bg-red-50">
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

        {/* Header con estadísticas */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Calificación Promedio</CardTitle>
              <Star className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{data?.averageRating?.toFixed(1) || '0.0'}</div>
              <p className="text-xs text-muted-foreground">+0.2 desde el mes pasado</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Calificaciones</CardTitle>
              <ThumbsUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{data?.totalRatings || 0}</div>
              <p className="text-xs text-muted-foreground">+23 desde el mes pasado</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">5 Estrellas</CardTitle>
              <Star className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{data?.fiveStarRatings || 0}</div>
              <p className="text-xs text-muted-foreground">+18 desde el mes pasado</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Comentarios</CardTitle>
              <MessageSquare className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{data?.withComments || 0}</div>
              <p className="text-xs text-muted-foreground">+12 desde el mes pasado</p>
            </CardContent>
          </Card>
        </div>

        {/* Gestión de calificaciones */}
        <Tabs defaultValue="all" className="space-y-4">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="all">Todas</TabsTrigger>
            <TabsTrigger value="responded">Respondidas</TabsTrigger>
            <TabsTrigger value="pending">Sin Respuesta</TabsTrigger>
            <TabsTrigger value="low">Bajas (≤3⭐)</TabsTrigger>
          </TabsList>

          {['all', 'responded', 'pending', 'low'].map(tabValue => (
            <TabsContent key={tabValue} value={tabValue}>
              <div className="space-y-4">
                {ratings
                  .filter(rating => {
                    if (tabValue === 'all') {
                      return true;
                    }
                    if (tabValue === 'responded') {
                      return rating.hasResponse;
                    }
                    if (tabValue === 'pending') {
                      return !rating.hasResponse;
                    }
                    if (tabValue === 'low') {
                      return rating.rating <= 3;
                    }
                    return true;
                  })
                  .map(rating => (
                    <Card key={rating.id} className="hover:shadow-md transition-shadow">
                      <CardContent className="pt-6">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-start space-x-3 flex-1">
                            <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                              <User className="w-6 h-6 text-gray-600" />
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <h4 className="font-semibold">{rating.clientName}</h4>
                                {rating.verified && (
                                  <Badge className="bg-green-100 text-green-800 text-xs">
                                    Verificada
                                  </Badge>
                                )}
                              </div>
                              <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                                <MapPin className="w-4 h-4" />
                                <span>{rating.propertyAddress}</span>
                                <span>•</span>
                                <span>{rating.serviceType}</span>
                                <span>•</span>
                                <span>{rating.jobId}</span>
                              </div>
                              <div className="flex items-center gap-1 mb-2">
                                {renderStars(rating.rating)}
                                <span className="text-sm text-gray-600 ml-2">
                                  {new Date(rating.createdAt).toLocaleDateString('es-CL')}
                                </span>
                              </div>
                              <p className="text-gray-700 mb-3">{rating.comment}</p>

                              {rating.hasResponse && (
                                <div className="bg-blue-50 border-l-4 border-blue-500 p-3 rounded">
                                  <div className="flex items-center gap-2 mb-1">
                                    <Reply className="w-4 h-4 text-blue-600" />
                                    <span className="text-sm font-medium text-blue-800">
                                      Tu respuesta
                                    </span>
                                    <span className="text-xs text-gray-500">
                                      {new Date(rating.responseDate).toLocaleDateString('es-CL')}
                                    </span>
                                  </div>
                                  <p className="text-sm text-blue-700">{rating.response}</p>
                                </div>
                              )}
                            </div>
                          </div>

                          <div className="flex flex-col gap-2 ml-4">
                            {!rating.hasResponse && (
                              <Dialog>
                                <DialogTrigger asChild>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => setSelectedRatingId(rating.id)}
                                  >
                                    <Reply className="w-4 h-4 mr-2" />
                                    Responder
                                  </Button>
                                </DialogTrigger>
                                <DialogContent>
                                  <DialogHeader>
                                    <DialogTitle>Responder a {rating.clientName}</DialogTitle>
                                  </DialogHeader>
                                  <div className="space-y-4">
                                    <div className="p-3 bg-gray-50 rounded">
                                      <div className="flex items-center gap-1 mb-2">
                                        {renderStars(rating.rating)}
                                      </div>
                                      <p className="text-sm">{rating.comment}</p>
                                    </div>
                                    <Textarea
                                      placeholder="Escribe tu respuesta..."
                                      value={replyText}
                                      onChange={e => setReplyText(e.target.value)}
                                      rows={4}
                                    />
                                    <div className="flex gap-2 justify-end">
                                      <Button
                                        variant="outline"
                                        onClick={() => setSelectedRatingId(null)}
                                      >
                                        Cancelar
                                      </Button>
                                      <Button
                                        onClick={() => handleReplyToRating(rating.id, replyText)}
                                        disabled={!replyText.trim()}
                                      >
                                        Enviar Respuesta
                                      </Button>
                                    </div>
                                  </div>
                                </DialogContent>
                              </Dialog>
                            )}

                            <Badge variant="outline" className="text-xs">
                              {rating.serviceType}
                            </Badge>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
              </div>
            </TabsContent>
          ))}
        </Tabs>

        {/* Estadísticas adicionales */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Tasa de Respuesta</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {data ? Math.round((data.respondedRatings / data.totalRatings) * 100) : 0}%
              </div>
              <p className="text-xs text-muted-foreground">De calificaciones con comentarios</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Calificaciones Verificadas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{data?.verifiedRatings || 0}</div>
              <p className="text-xs text-muted-foreground">
                Calificaciones verificadas por la plataforma
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Promedio Mensual</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">4.7</div>
              <p className="text-xs text-muted-foreground">
                <TrendingUp className="w-3 h-3 inline mr-1" />
                +0.1 este mes
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Acciones rápidas */}
        <Card>
          <CardHeader>
            <CardTitle>Acciones Rápidas</CardTitle>
            <CardDescription>Accede rápidamente a las funciones más utilizadas</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <Button
                variant="outline"
                className="h-20 flex flex-col items-center justify-center"
                onClick={handleExportRatings}
              >
                <Download className="w-6 h-6 mb-2" />
                <span>Exportar Calificaciones</span>
              </Button>

              <Button
                variant="outline"
                className="h-20 flex flex-col items-center justify-center"
                onClick={() => router.push('/provider/dashboard')}
              >
                <TrendingUp className="w-6 h-6 mb-2" />
                <span>Ver Estadísticas</span>
              </Button>

              <Button
                variant="outline"
                className="h-20 flex flex-col items-center justify-center"
                onClick={() => router.push('/provider/requests')}
              >
                <MessageSquare className="w-6 h-6 mb-2" />
                <span>Gestionar Solicitudes</span>
              </Button>

              <Button
                variant="outline"
                className="h-20 flex flex-col items-center justify-center"
                onClick={() => router.push('/provider/settings')}
              >
                <Settings className="w-6 h-6 mb-2" />
                <span>Configurar Notificaciones</span>
              </Button>

              <Button
                variant="outline"
                className="h-20 flex flex-col items-center justify-center"
                onClick={() => router.push('/provider/services')}
              >
                <Wrench className="w-6 h-6 mb-2" />
                <span>Gestionar Servicios</span>
              </Button>

              <Button
                variant="outline"
                className="h-20 flex flex-col items-center justify-center"
                onClick={loadPageData}
              >
                <RefreshCw className="w-6 h-6 mb-2" />
                <span>Actualizar Datos</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </UnifiedDashboardLayout>
  );
}

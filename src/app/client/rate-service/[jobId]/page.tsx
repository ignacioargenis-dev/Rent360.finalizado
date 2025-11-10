'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import {
  Star,
  Send,
  User,
  CheckCircle,
  AlertCircle,
  Clock,
  Shield,
  Eye,
  EyeOff,
  MessageSquare,
  ThumbsUp,
  MapPin,
  Calendar,
  DollarSign,
} from 'lucide-react';
import UnifiedDashboardLayout from '@/components/layout/UnifiedDashboardLayout';
import DashboardHeader from '@/components/dashboard/DashboardHeader';
import { ratingService, RatingType } from '@/lib/ratings/rating-service';
import { logger } from '@/lib/logger-minimal';

interface JobDetails {
  id: string;
  providerId: string;
  providerName: string;
  providerType: 'MAINTENANCE' | 'PROVIDER';
  serviceType: string;
  serviceDescription: string;
  location: string;
  completedAt: Date;
  amount: number;
  status: 'COMPLETED' | 'PENDING_REVIEW';
  jobDate: Date;
}

interface RatingForm {
  overall: number;
  punctuality: number;
  professionalism: number;
  communication: number;
  quality: number;
  value: number;
  comments: string;
  isAnonymous: boolean;
  isVerified: boolean;
}

export default function RateServicePage() {
  const params = useParams();
  const router = useRouter();
  const jobId = params?.jobId as string;

  const [user, setUser] = useState<any>(null);
  const [job, setJob] = useState<JobDetails | null>(null);
  const [rating, setRating] = useState<RatingForm>({
    overall: 0,
    punctuality: 0,
    professionalism: 0,
    communication: 0,
    quality: 0,
    value: 0,
    comments: '',
    isAnonymous: false,
    isVerified: true,
  });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [existingRating, setExistingRating] = useState<any>(null);

  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    loadData();
  }, [jobId]);

  const loadData = async () => {
    try {
      setLoading(true);

      // Obtener información del usuario
      const userResponse = await fetch('/api/auth/me');
      if (userResponse.ok) {
        const userData = await userResponse.json();
        setUser(userData.user);
      }

      // Obtener detalles del trabajo
      const jobResponse = await fetch(`/api/jobs/${jobId}`);
      if (jobResponse.ok) {
        const jobData = await jobResponse.json();
        setJob(jobData);
      }

      // Verificar si ya existe una reseña
      const canRate = await ratingService.canRateProvider(user?.id || '', jobId);
      if (!canRate) {
        // Obtener reseña existente
        const ratings = await ratingService.getProviderRatings(job?.providerId || '', 1);
        const existing = ratings.find(r => r.jobId === jobId);
        if (existing) {
          setExistingRating(existing);
        }
      }
    } catch (error) {
      logger.error('Error cargando datos del servicio:', {
        error: error instanceof Error ? error.message : String(error),
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRatingChange = (type: keyof RatingForm, value: number) => {
    setRating(prev => ({
      ...prev,
      [type]: value,
    }));

    // Si cambia el rating general, actualizar otros ratings automáticamente
    if (type === 'overall') {
      setRating(prev => ({
        ...prev,
        punctuality: value,
        professionalism: value,
        communication: value,
        quality: value,
        value: value,
      }));
    }
  };

  const validateForm = (): boolean => {
    if (rating.overall === 0) {
      setErrorMessage('Por favor selecciona una calificación general');
      setTimeout(() => setErrorMessage(''), 5000);
      return false;
    }

    if (rating.comments.trim().length < 10) {
      setErrorMessage('Por favor escribe al menos 10 caracteres en tu comentario');
      setTimeout(() => setErrorMessage(''), 5000);
      return false;
    }

    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm() || !job || !user) {
      return;
    }

    try {
      setSubmitting(true);

      const ratingData = {
        providerId: job.providerId,
        providerType: (job.providerType === 'MAINTENANCE'
          ? 'MAINTENANCE'
          : job.providerType === 'PROVIDER'
            ? 'PROVIDER'
            : 'PROVIDER') as 'MAINTENANCE' | 'PROVIDER',
        clientId: user.id,
        jobId: job.id,
        ratings: {
          overall: rating.overall,
          punctuality: rating.punctuality,
          professionalism: rating.professionalism,
          communication: rating.communication,
          property_knowledge: rating.quality, // Adaptar al enum
          cleanliness: rating.quality,
          quality_of_work: rating.quality,
          value: rating.value,
        },
        comments: rating.comments.trim(),
        isAnonymous: rating.isAnonymous,
        isVerified: rating.isVerified,
      };

      await ratingService.createRating(ratingData);
      setSubmitted(true);

      // Redirigir después de 3 segundos
      setTimeout(() => {
        router.push('/client/services');
      }, 3000);
    } catch (error) {
      logger.error('Error enviando reseña:', {
        error: error instanceof Error ? error.message : String(error),
      });
      setErrorMessage('Error al enviar la reseña. Por favor intenta nuevamente.');
      setTimeout(() => setErrorMessage(''), 5000);
    } finally {
      setSubmitting(false);
    }
  };

  const renderStarSelector = (type: keyof RatingForm, label: string, description: string) => {
    if (typeof rating[type] !== 'number') {
      return null;
    }

    const value = rating[type] as number;

    return (
      <div className="space-y-3">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
          <p className="text-xs text-gray-500">{description}</p>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map(star => (
              <button
                key={star}
                onClick={() => handleRatingChange(type, star)}
                className="transition-colors"
                disabled={submitting}
              >
                <Star
                  className={`w-8 h-8 ${
                    star <= value
                      ? 'fill-yellow-400 text-yellow-400'
                      : 'text-gray-300 hover:text-yellow-300'
                  }`}
                />
              </button>
            ))}
          </div>
          <span className="text-sm font-medium text-gray-600 ml-2">
            {value > 0 ? `${value} estrella${value > 1 ? 's' : ''}` : 'Sin calificar'}
          </span>
        </div>
      </div>
    );
  };

  const getRatingProgress = () => {
    const totalFields = 6; // overall, punctuality, professionalism, communication, quality, value
    const completedFields = [
      rating.overall,
      rating.punctuality,
      rating.professionalism,
      rating.communication,
      rating.quality,
      rating.value,
    ].filter(value => value > 0).length;

    return (completedFields / totalFields) * 100;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando detalles del servicio...</p>
        </div>
      </div>
    );
  }

  if (!job || !user) {
    return (
      <UnifiedDashboardLayout
        user={user}
        title="Servicio no encontrado"
        subtitle="No se pudo encontrar la información del servicio solicitado"
      >
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <Card className="max-w-md w-full">
            <CardContent className="pt-6">
              <div className="text-center">
                <h2 className="text-xl font-semibold text-gray-900 mb-2">Servicio no encontrado</h2>
                <p className="text-gray-600 mb-6">
                  No se pudo encontrar la información del servicio solicitado.
                </p>
                <Button onClick={() => router.back()}>Volver</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </UnifiedDashboardLayout>
    );
  }

  if (existingRating) {
    return (
      <UnifiedDashboardLayout
        user={user}
        title="Reseña ya enviada"
        subtitle="Ya has calificado este servicio anteriormente"
      >
        <DashboardHeader
          user={user}
          title="Reseña ya enviada"
          subtitle="Ya has calificado este servicio"
        />

        <div className="container mx-auto px-4 py-6 max-w-2xl">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                <h2 className="text-xl font-semibold text-gray-900 mb-2">
                  ¡Ya has enviado tu reseña!
                </h2>
                <p className="text-gray-600 mb-6">
                  Gracias por calificar el servicio de {job.providerName}. Tu opinión es muy valiosa
                  para otros clientes.
                </p>
                <div className="flex gap-3 justify-center">
                  <Button onClick={() => router.push('/client/services')}>Ver mis servicios</Button>
                  <Button variant="outline" onClick={() => router.push('/providers/top-rated')}>
                    Ver proveedores top
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </UnifiedDashboardLayout>
    );
  }

  if (submitted) {
    return (
      <UnifiedDashboardLayout
        user={user}
        title="Reseña enviada"
        subtitle="Gracias por tu evaluación del servicio"
      >
        <DashboardHeader user={user} title="¡Reseña enviada!" subtitle="Gracias por tu opinión" />

        <div className="container mx-auto px-4 py-6 max-w-2xl">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                <h2 className="text-xl font-semibold text-gray-900 mb-2">
                  ¡Gracias por tu reseña!
                </h2>
                <p className="text-gray-600 mb-6">
                  Tu calificación ayudará a otros clientes a elegir el mejor proveedor. Te
                  redirigiremos automáticamente en unos segundos...
                </p>
                <Button onClick={() => router.push('/client/services')}>Ir a mis servicios</Button>
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
      title="Calificar Servicio"
      subtitle={`Deja tu opinión sobre el servicio de ${job.providerName}`}
    >
      <DashboardHeader
        user={user}
        title="Calificar Servicio"
        subtitle={`Deja tu opinión sobre el servicio de ${job.providerName}`}
      />

      <div className="container mx-auto px-4 py-6 max-w-4xl">
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

        {/* Información del Servicio */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              Detalles del Servicio
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-6">
              {/* Información del Proveedor */}
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <Avatar className="w-12 h-12">
                    <AvatarFallback>
                      {job.providerName.substring(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="font-semibold text-gray-900">{job.providerName}</h3>
                    <p className="text-sm text-gray-600">
                      {job.providerType === 'MAINTENANCE'
                        ? 'Proveedor de Mantenimiento'
                        : 'Proveedor de Servicios'}
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <MessageSquare className="w-4 h-4 text-gray-400" />
                    <span>{job.serviceType}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <MapPin className="w-4 h-4 text-gray-400" />
                    <span>{job.location}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="w-4 h-4 text-gray-400" />
                    <span>{new Date(job.jobDate).toLocaleDateString('es-CL')}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <DollarSign className="w-4 h-4 text-gray-400" />
                    <span>${job.amount.toLocaleString('es-CL')}</span>
                  </div>
                </div>
              </div>

              {/* Descripción del Servicio */}
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Descripción del Servicio</h4>
                <p className="text-sm text-gray-600">{job.serviceDescription}</p>

                <div className="mt-4">
                  <Badge className="bg-green-100 text-green-800">
                    <CheckCircle className="w-3 h-3 mr-1" />
                    Servicio Completado
                  </Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Progreso de la Reseña */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">Progreso de la reseña</span>
              <span className="text-sm text-gray-600">{Math.round(getRatingProgress())}%</span>
            </div>
            <Progress value={getRatingProgress()} className="h-2" />
          </CardContent>
        </Card>

        {/* Formulario de Calificación */}
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Calificaciones */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Star className="w-5 h-5" />
                Calificaciones
              </CardTitle>
              <CardDescription>Califica cada aspecto del servicio recibido</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {renderStarSelector(
                'overall',
                'Calificación General',
                '¿Qué tan satisfecho estás con el servicio en general?'
              )}

              <div className="border-t pt-6 space-y-6">
                {renderStarSelector('punctuality', 'Puntualidad', '¿El proveedor llegó a tiempo?')}
                {renderStarSelector(
                  'professionalism',
                  'Profesionalismo',
                  '¿El servicio fue realizado de manera profesional?'
                )}
                {renderStarSelector(
                  'communication',
                  'Comunicación',
                  '¿La comunicación fue clara y efectiva?'
                )}
                {renderStarSelector(
                  'quality',
                  'Calidad del Trabajo',
                  '¿El resultado del trabajo cumple con tus expectativas?'
                )}
                {renderStarSelector(
                  'value',
                  'Relación Calidad-Precio',
                  '¿Consideras que el precio es justo por la calidad recibida?'
                )}
              </div>
            </CardContent>
          </Card>

          {/* Comentarios y Opciones */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="w-5 h-5" />
                Tu Opinión
              </CardTitle>
              <CardDescription>Comparte tu experiencia detalladamente</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Comentarios */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Comentarios <span className="text-red-500">*</span>
                </label>
                <Textarea
                  value={rating.comments}
                  onChange={e => setRating(prev => ({ ...prev, comments: e.target.value }))}
                  placeholder="Describe tu experiencia con el servicio. ¿Qué te gustó? ¿Qué podría mejorar? Tu opinión ayuda a otros clientes y al proveedor."
                  rows={6}
                  disabled={submitting}
                  className="resize-none"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Mínimo 10 caracteres. Máximo 500 caracteres.
                </p>
              </div>

              {/* Opciones */}
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="anonymous"
                    checked={rating.isAnonymous}
                    onCheckedChange={checked =>
                      setRating(prev => ({ ...prev, isAnonymous: checked as boolean }))
                    }
                    disabled={submitting}
                  />
                  <label
                    htmlFor="anonymous"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 flex items-center gap-2"
                  >
                    <EyeOff className="w-4 h-4" />
                    Publicar de forma anónima
                  </label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="verified"
                    checked={rating.isVerified}
                    onCheckedChange={checked =>
                      setRating(prev => ({ ...prev, isVerified: checked as boolean }))
                    }
                    disabled={submitting}
                  />
                  <label
                    htmlFor="verified"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 flex items-center gap-2"
                  >
                    <Shield className="w-4 h-4" />
                    Marcar como reseña verificada (recomendado)
                  </label>
                </div>
              </div>

              {/* Información sobre privacidad */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <Shield className="w-5 h-5 text-blue-600 mt-0.5" />
                  <div>
                    <h4 className="text-sm font-medium text-blue-900 mb-1">
                      Tu privacidad está protegida
                    </h4>
                    <p className="text-xs text-blue-800">
                      Las reseñas anónimas no muestran tu nombre. Todas las reseñas son moderadas
                      para mantener la calidad de nuestro servicio.
                    </p>
                  </div>
                </div>
              </div>

              {/* Botón de envío */}
              <Button
                onClick={handleSubmit}
                disabled={submitting || getRatingProgress() < 100}
                className="w-full"
                size="lg"
              >
                {submitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Enviando reseña...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-2" />
                    Enviar Reseña
                  </>
                )}
              </Button>

              {getRatingProgress() < 100 && (
                <p className="text-xs text-gray-500 text-center">
                  Completa todas las calificaciones para poder enviar tu reseña
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Información adicional */}
        <Card className="mt-6 bg-gray-50 border-gray-200">
          <CardContent className="pt-6">
            <div className="flex items-start gap-4">
              <ThumbsUp className="w-6 h-6 text-gray-600 mt-0.5" />
              <div>
                <h4 className="font-medium text-gray-900 mb-2">
                  ¿Por qué calificar este servicio?
                </h4>
                <div className="text-sm text-gray-700 space-y-1">
                  <p>• Ayudas a otros clientes a elegir proveedores confiables</p>
                  <p>• Contribuyes a mejorar la calidad de los servicios</p>
                  <p>• Tu opinión es valiosa para el crecimiento de Rent360</p>
                  <p>• Puedes ganar puntos de fidelidad por reseñas verificadas</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </UnifiedDashboardLayout>
  );
}

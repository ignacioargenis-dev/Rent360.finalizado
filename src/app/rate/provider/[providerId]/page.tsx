'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Star, CheckCircle, AlertCircle, ThumbsUp, MessageSquare } from 'lucide-react';
import UnifiedDashboardLayout from '@/components/layout/UnifiedDashboardLayout';
import DashboardHeader from '@/components/dashboard/DashboardHeader';
import { ratingService, RatingType, type ProviderRating } from '@/lib/ratings/rating-service';
import { logger } from '@/lib/logger-minimal';

interface JobDetails {
  id: string;
  type: string;
  description: string;
  date: Date;
  status: string;
  providerName: string;
  providerType: 'MAINTENANCE' | 'SERVICE';
}

export default function RateProviderPage() {
  const params = useParams();
  const router = useRouter();
  const providerId = params?.providerId as string;

  const [user, setUser] = useState<any>(null);
  const [job, setJob] = useState<JobDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const [ratings, setRatings] = useState<Record<RatingType, number>>({
    [RatingType.OVERALL]: 0,
    [RatingType.PUNCTUALITY]: 0,
    [RatingType.PROFESSIONALISM]: 0,
    [RatingType.COMMUNICATION]: 0,
    [RatingType.PROPERTY_KNOWLEDGE]: 0,
    [RatingType.CLEANLINESS]: 0,
    [RatingType.QUALITY_OF_WORK]: 0,
  });

  const [comments, setComments] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);

  useEffect(() => {
    loadData();
  }, [providerId]);

  const loadData = async () => {
    try {
      setLoading(true);

      // Obtener información del usuario
      const userResponse = await fetch('/api/auth/me');
      if (userResponse.ok) {
        const userData = await userResponse.json();
        setUser(userData.user);
      }

      // Obtener detalles del trabajo (simulado por ahora)
      // En una implementación real, esto vendría de la API
      const mockJob: JobDetails = {
        id: `job_${Date.now()}`,
        type: 'Mantenimiento General',
        description: 'Reparación de grifería y revisión de sistema eléctrico',
        date: new Date(),
        status: 'COMPLETED',
        providerName: 'Proveedor Demo',
        providerType: 'MAINTENANCE',
      };

      setJob(mockJob);
    } catch (error) {
      logger.error('Error cargando datos para rating:', {
        error: error instanceof Error ? error.message : String(error),
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRatingChange = (type: RatingType, value: number) => {
    setRatings(prev => ({
      ...prev,
      [type]: value,
    }));

    // Actualizar rating general automáticamente
    if (type !== RatingType.OVERALL) {
      const otherRatings = Object.entries(ratings)
        .filter(([key]) => key !== RatingType.OVERALL && key !== type)
        .map(([, value]) => value);

      const newOtherRatings = [...otherRatings, value];
      const validRatings = newOtherRatings.filter(r => r > 0);

      if (validRatings.length > 0) {
        const average = validRatings.reduce((sum, r) => sum + r, 0) / validRatings.length;
        setRatings(prev => ({
          ...prev,
          [RatingType.OVERALL]: Math.round(average),
        }));
      }
    }
  };

  const validateForm = (): boolean => {
    const newErrors: string[] = [];

    if (ratings[RatingType.OVERALL] === 0) {
      newErrors.push('Debes calificar el servicio general');
    }

    if (comments.trim().length < 10) {
      newErrors.push('Los comentarios deben tener al menos 10 caracteres');
    }

    setErrors(newErrors);
    return newErrors.length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm() || !user || !job) {
      return;
    }

    try {
      setSubmitting(true);

      const ratingData: Omit<ProviderRating, 'id' | 'createdAt'> = {
        providerId,
        providerType: job.providerType,
        clientId: user.id,
        jobId: job.id,
        ratings,
        comments: comments.trim(),
        isAnonymous,
        isVerified: true,
      };

      const result = await ratingService.createRating(ratingData);

      logger.info('Rating enviado exitosamente:', {
        ratingId: result.id,
        providerId,
        overallRating: ratings[RatingType.OVERALL],
      });

      setSubmitted(true);

      // Redirigir después de 3 segundos
      setTimeout(() => {
        router.push('/dashboard');
      }, 3000);
    } catch (error) {
      logger.error('Error enviando rating:', {
        error: error instanceof Error ? error.message : String(error),
      });
      setErrors(['Error al enviar la calificación. Por favor intenta nuevamente.']);
    } finally {
      setSubmitting(false);
    }
  };

  const renderStars = (type: RatingType, currentValue: number) => {
    return (
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map(star => (
          <button
            key={star}
            type="button"
            onClick={() => handleRatingChange(type, star)}
            className="focus:outline-none"
            disabled={submitting || submitted}
          >
            <Star
              className={`w-6 h-6 ${
                star <= currentValue
                  ? 'fill-yellow-400 text-yellow-400'
                  : 'text-gray-300 hover:text-yellow-400'
              } transition-colors`}
            />
          </button>
        ))}
        <span className="ml-2 text-sm text-gray-600">
          {currentValue > 0 && `${currentValue} estrella${currentValue !== 1 ? 's' : ''}`}
        </span>
      </div>
    );
  };

  const getRatingLabel = (type: RatingType): string => {
    const labels: Record<RatingType, string> = {
      [RatingType.OVERALL]: 'Calificación General',
      [RatingType.PUNCTUALITY]: 'Puntualidad',
      [RatingType.PROFESSIONALISM]: 'Profesionalismo',
      [RatingType.COMMUNICATION]: 'Comunicación',
      [RatingType.PROPERTY_KNOWLEDGE]: 'Conocimiento de Propiedad',
      [RatingType.CLEANLINESS]: 'Limpieza',
      [RatingType.QUALITY_OF_WORK]: 'Calidad del Trabajo',
    };
    return labels[type];
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando...</p>
        </div>
      </div>
    );
  }

  if (submitted) {
    return (
      <UnifiedDashboardLayout title="Calificación Enviada" subtitle="Gracias por tu evaluación">
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <Card className="max-w-md w-full">
            <CardContent className="pt-6">
              <div className="text-center">
                <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  ¡Gracias por tu evaluación!
                </h2>
                <p className="text-gray-600 mb-6">
                  Tu calificación ayudará a otros usuarios a elegir los mejores proveedores.
                </p>
                <div className="bg-blue-50 p-4 rounded-lg mb-6">
                  <p className="text-sm text-blue-800">
                    Serás redirigido automáticamente en unos segundos...
                  </p>
                </div>
                <Button onClick={() => router.push('/dashboard')}>Volver al Dashboard</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </UnifiedDashboardLayout>
    );
  }

  return (
    <UnifiedDashboardLayout
      title="Calificar Proveedor"
      subtitle="Ayuda a otros usuarios evaluando la calidad del servicio"
    >
      <DashboardHeader
        user={user}
        title="Calificar Proveedor"
        subtitle="Tu opinión es importante para mejorar la calidad del servicio"
      />

      <div className="container mx-auto px-4 py-6 max-w-2xl">
        {/* Información del Trabajo */}
        {job && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-500" />
                Trabajo Completado
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-700">Servicio</p>
                  <p className="text-sm text-gray-600">{job.type}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-700">Fecha</p>
                  <p className="text-sm text-gray-600">{job.date.toLocaleDateString('es-CL')}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-700">Proveedor</p>
                  <p className="text-sm text-gray-600">{job.providerName}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-700">Estado</p>
                  <Badge className="bg-green-100 text-green-800">Completado</Badge>
                </div>
              </div>
              <div className="mt-4">
                <p className="text-sm font-medium text-gray-700">Descripción</p>
                <p className="text-sm text-gray-600">{job.description}</p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Formulario de Calificación */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ThumbsUp className="w-5 h-5" />
              Calificar Servicio
            </CardTitle>
            <CardDescription>
              Tu evaluación nos ayuda a mantener altos estándares de calidad
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Ratings por categoría */}
            {Object.values(RatingType).map(type => (
              <div key={type} className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  {getRatingLabel(type)}
                  {type === RatingType.OVERALL && <span className="text-red-500 ml-1">*</span>}
                </label>
                {renderStars(type, ratings[type])}
              </div>
            ))}

            {/* Comentarios */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700 flex items-center gap-2">
                <MessageSquare className="w-4 h-4" />
                Comentarios
                <span className="text-red-500">*</span>
              </label>
              <Textarea
                placeholder="Describe tu experiencia con el proveedor. ¿Qué te pareció el servicio? ¿Hubo algo destacable?"
                value={comments}
                onChange={e => setComments(e.target.value)}
                rows={4}
                disabled={submitting}
                className="resize-none"
              />
              <p className="text-xs text-gray-500">
                Mínimo 10 caracteres. Tu comentario será público.
              </p>
            </div>

            {/* Opción de anonimato */}
            <div className="flex items-center space-x-2">
              <Checkbox
                id="anonymous"
                checked={isAnonymous}
                onCheckedChange={checked => setIsAnonymous(checked as boolean)}
                disabled={submitting}
              />
              <label htmlFor="anonymous" className="text-sm text-gray-700 cursor-pointer">
                Enviar calificación de forma anónima
              </label>
            </div>

            {/* Errores */}
            {errors.length > 0 && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <AlertCircle className="w-4 h-4 text-red-500" />
                  <span className="text-sm font-medium text-red-800">
                    Por favor corrige los siguientes errores:
                  </span>
                </div>
                <ul className="list-disc list-inside text-sm text-red-700 space-y-1">
                  {errors.map((error, index) => (
                    <li key={index}>{error}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Botón de envío */}
            <div className="flex justify-end pt-4 border-t">
              <Button onClick={handleSubmit} disabled={submitting} className="min-w-[150px]">
                {submitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Enviando...
                  </>
                ) : (
                  <>
                    <ThumbsUp className="w-4 h-4 mr-2" />
                    Enviar Calificación
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Información adicional */}
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="font-medium text-blue-900 mb-2">¿Por qué calificar?</h4>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• Ayudas a otros usuarios a elegir proveedores confiables</li>
            <li>• Contribuyes a mejorar la calidad del servicio</li>
            <li>• Los proveedores con mejores calificaciones tienen más oportunidades</li>
            <li>• Tu opinión es completamente confidencial si lo deseas</li>
          </ul>
        </div>
      </div>
    </UnifiedDashboardLayout>
  );
}

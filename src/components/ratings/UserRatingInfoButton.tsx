'use client';

import { useCallback, useMemo, useState } from 'react';
import { Info, Loader2, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';

type RatingSummary = {
  userId: string;
  userName?: string;
  totalRatings: number;
  averageRating: number;
  ratingDistribution?: Record<string | number, number>;
  averageCommunication?: number;
  averageReliability?: number;
  averageProfessionalism?: number;
  averageQuality?: number;
  averagePunctuality?: number;
  commonPositiveFeedback?: string[];
  commonImprovementAreas?: string[];
  responseRate?: number;
  verifiedRatingsPercentage?: number;
};

type RatingButtonProps = React.ComponentProps<typeof Button>;

interface UserRatingInfoButtonProps {
  userId?: string | null;
  userName?: string;
  className?: string;
  label?: string;
  variant?: RatingButtonProps['variant'];
  size?: RatingButtonProps['size'];
}

export default function UserRatingInfoButton({
  userId,
  userName,
  className,
  label,
  variant = 'ghost',
  size = 'icon',
}: UserRatingInfoButtonProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState<RatingSummary | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchSummary = useCallback(async () => {
    if (!userId) {
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/ratings/summary/${userId}`, {
        method: 'GET',
        credentials: 'include',
        headers: {
          Accept: 'application/json',
        },
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || `Error ${response.status}`);
      }

      const data = await response.json();
      if (data?.success && data?.data) {
        setSummary(data.data as RatingSummary);
      } else {
        setError('No se encontraron calificaciones para este usuario.');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudieron cargar las calificaciones.');
    } finally {
      setLoading(false);
    }
  }, [userId]);

  const handleOpenChange = (value: boolean) => {
    setOpen(value);
    if (value && userId && !summary && !loading) {
      fetchSummary();
    }
  };

  const distribution = useMemo(() => {
    if (!summary?.ratingDistribution) {
      return [];
    }
    const entries = Object.entries(summary.ratingDistribution).map(([key, value]) => ({
      label: typeof key === 'string' ? parseInt(key, 10) : key,
      value,
    }));
    return entries.filter(entry => !Number.isNaN(entry.label)).sort((a, b) => b.label - a.label);
  }, [summary]);

  return (
    <>
      <Button
        type="button"
        variant={variant}
        size={size}
        className={cn('rounded-full', className)}
        onClick={() => handleOpenChange(true)}
        disabled={!userId}
        title={
          userId ? 'Ver resumen de calificaciones del usuario' : 'Calificaciones no disponibles'
        }
      >
        <Info className="w-4 h-4" />
        {label && <span className="ml-2 text-sm">{label}</span>}
      </Button>

      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Calificaciones de {userName || 'Usuario'}</DialogTitle>
            <DialogDescription>
              Información resumida de la reputación pública disponible para este usuario.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {loading && (
              <div className="flex items-center justify-center py-6">
                <Loader2 className="w-5 h-5 animate-spin text-gray-500" />
              </div>
            )}

            {!loading && error && (
              <div className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-md p-3">
                {error}
              </div>
            )}

            {!loading && !error && summary && (
              <>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Calificación promedio</p>
                    <div className="flex items-baseline gap-2">
                      <div className="text-3xl font-bold text-gray-900">
                        {summary.averageRating.toFixed(1)}
                      </div>
                      <div className="text-sm text-gray-500">/ 5</div>
                    </div>
                    <p className="text-xs text-gray-500">
                      {summary.totalRatings} calificación
                      {summary.totalRatings === 1 ? '' : 'es'}
                    </p>
                  </div>
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map(star => (
                      <Star
                        key={star}
                        className={cn(
                          'w-5 h-5',
                          star <= Math.round(summary.averageRating)
                            ? 'text-yellow-400 fill-yellow-400'
                            : 'text-gray-300'
                        )}
                      />
                    ))}
                  </div>
                </div>

                <Separator />

                {distribution.length > 0 && (
                  <div>
                    <p className="text-sm font-medium text-gray-700 mb-2">
                      Distribución de calificaciones
                    </p>
                    <div className="space-y-1">
                      {distribution.map(entry => (
                        <div
                          key={entry.label}
                          className="flex items-center justify-between text-sm text-gray-600"
                        >
                          <span>{entry.label}★</span>
                          <span>{entry.value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {(summary.averageCommunication ||
                  summary.averageProfessionalism ||
                  summary.averageQuality ||
                  summary.averagePunctuality ||
                  summary.averageReliability) && (
                  <>
                    <Separator />
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      {summary.averageCommunication !== undefined && (
                        <div>
                          <p className="text-gray-500">Comunicación</p>
                          <p className="font-semibold text-gray-800">
                            {summary.averageCommunication?.toFixed(1)}
                          </p>
                        </div>
                      )}
                      {summary.averageProfessionalism !== undefined && (
                        <div>
                          <p className="text-gray-500">Profesionalismo</p>
                          <p className="font-semibold text-gray-800">
                            {summary.averageProfessionalism?.toFixed(1)}
                          </p>
                        </div>
                      )}
                      {summary.averageQuality !== undefined && (
                        <div>
                          <p className="text-gray-500">Calidad</p>
                          <p className="font-semibold text-gray-800">
                            {summary.averageQuality?.toFixed(1)}
                          </p>
                        </div>
                      )}
                      {summary.averagePunctuality !== undefined && (
                        <div>
                          <p className="text-gray-500">Puntualidad</p>
                          <p className="font-semibold text-gray-800">
                            {summary.averagePunctuality?.toFixed(1)}
                          </p>
                        </div>
                      )}
                      {summary.averageReliability !== undefined && (
                        <div>
                          <p className="text-gray-500">Confiabilidad</p>
                          <p className="font-semibold text-gray-800">
                            {summary.averageReliability?.toFixed(1)}
                          </p>
                        </div>
                      )}
                    </div>
                  </>
                )}

                {(summary.commonPositiveFeedback?.length ||
                  summary.commonImprovementAreas?.length) && (
                  <>
                    <Separator />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      {summary.commonPositiveFeedback?.length ? (
                        <div>
                          <p className="text-gray-700 font-medium mb-1 text-sm">
                            Aspectos valorados
                          </p>
                          <ul className="space-y-1">
                            {summary.commonPositiveFeedback.slice(0, 3).map((item, idx) => (
                              <li key={idx}>
                                <Badge variant="outline" className="text-xs">
                                  {item}
                                </Badge>
                              </li>
                            ))}
                          </ul>
                        </div>
                      ) : null}
                      {summary.commonImprovementAreas?.length ? (
                        <div>
                          <p className="text-gray-700 font-medium mb-1 text-sm">Áreas de mejora</p>
                          <ul className="space-y-1">
                            {summary.commonImprovementAreas.slice(0, 3).map((item, idx) => (
                              <li key={idx}>
                                <Badge variant="outline" className="text-xs bg-yellow-50">
                                  {item}
                                </Badge>
                              </li>
                            ))}
                          </ul>
                        </div>
                      ) : null}
                    </div>
                  </>
                )}

                {(summary.responseRate !== undefined ||
                  summary.verifiedRatingsPercentage !== undefined) && (
                  <>
                    <Separator />
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      {summary.responseRate !== undefined && (
                        <div>
                          <p className="text-gray-500">Tasa de respuesta</p>
                          <p className="font-semibold text-gray-800">
                            {Math.round(summary.responseRate)}%
                          </p>
                        </div>
                      )}
                      {summary.verifiedRatingsPercentage !== undefined && (
                        <div>
                          <p className="text-gray-500">Calificaciones verificadas</p>
                          <p className="font-semibold text-gray-800">
                            {Math.round(summary.verifiedRatingsPercentage)}%
                          </p>
                        </div>
                      )}
                    </div>
                  </>
                )}
              </>
            )}

            {!loading && !error && !summary && (
              <div className="text-sm text-gray-600">
                No hay calificaciones disponibles para este usuario todavía.
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

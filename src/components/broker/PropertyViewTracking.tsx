'use client';

import React, { useState, useEffect } from 'react';
import { Eye, Clock, MapPin, Calendar } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';

interface PropertyView {
  id: string;
  viewedAt: string;
  durationSeconds: number;
  property: {
    title: string;
    address: string;
  };
  userAgent?: string;
  ipAddress?: string;
}

interface PropertyViewTrackingProps {
  prospectId: string;
  compactMode?: boolean;
}

export function PropertyViewTracking({
  prospectId,
  compactMode = false,
}: PropertyViewTrackingProps) {
  const [views, setViews] = useState<PropertyView[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState({
    totalViews: 0,
    uniqueProperties: 0,
    avgDuration: 0,
    lastViewedAt: null as string | null,
  });

  useEffect(() => {
    loadViews();
  }, [prospectId]);

  const loadViews = async () => {
    try {
      const response = await fetch(`/api/broker/prospects/${prospectId}/track-view`);
      const data = await response.json();

      if (data.success) {
        const viewsData = data.data || [];
        setViews(viewsData);

        // Calculate stats
        const uniqueProps = new Set(viewsData.map((v: PropertyView) => v.property.title)).size;
        const avgDur =
          viewsData.length > 0
            ? viewsData.reduce((sum: number, v: PropertyView) => sum + v.durationSeconds, 0) /
              viewsData.length
            : 0;

        setStats({
          totalViews: viewsData.length,
          uniqueProperties: uniqueProps,
          avgDuration: avgDur,
          lastViewedAt: viewsData.length > 0 ? viewsData[0].viewedAt : null,
        });
      }
    } catch (error) {
      console.error('Error loading property views:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatDuration = (seconds: number) => {
    if (seconds < 60) {
      return `${seconds}s`;
    }
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  };

  const formatRelativeTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) {
      return `Hace ${diffMins} min`;
    }
    if (diffHours < 24) {
      return `Hace ${diffHours} horas`;
    }
    return `Hace ${diffDays} días`;
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-gray-500">Cargando visualizaciones...</div>
        </CardContent>
      </Card>
    );
  }

  if (compactMode) {
    return (
      <div className="space-y-2">
        <div className="grid grid-cols-3 gap-3">
          <div className="text-center p-3 bg-blue-50 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">{stats.totalViews}</div>
            <div className="text-xs text-gray-600">Vistas</div>
          </div>
          <div className="text-center p-3 bg-purple-50 rounded-lg">
            <div className="text-2xl font-bold text-purple-600">{stats.uniqueProperties}</div>
            <div className="text-xs text-gray-600">Propiedades</div>
          </div>
          <div className="text-center p-3 bg-green-50 rounded-lg">
            <div className="text-2xl font-bold text-green-600">
              {Math.round(stats.avgDuration)}s
            </div>
            <div className="text-xs text-gray-600">Promedio</div>
          </div>
        </div>
        {stats.lastViewedAt && (
          <div className="text-xs text-gray-500 text-center">
            Última vista: {formatRelativeTime(stats.lastViewedAt)}
          </div>
        )}
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Eye className="h-5 w-5" />
          Tracking de Visualizaciones
        </CardTitle>
        <CardDescription>Historial de propiedades vistas por el prospect</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Stats Summary */}
        <div className="grid grid-cols-4 gap-3">
          <div className="text-center p-3 bg-blue-50 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">{stats.totalViews}</div>
            <div className="text-xs text-gray-600">Total Vistas</div>
          </div>
          <div className="text-center p-3 bg-purple-50 rounded-lg">
            <div className="text-2xl font-bold text-purple-600">{stats.uniqueProperties}</div>
            <div className="text-xs text-gray-600">Propiedades</div>
          </div>
          <div className="text-center p-3 bg-green-50 rounded-lg">
            <div className="text-2xl font-bold text-green-600">
              {formatDuration(Math.round(stats.avgDuration))}
            </div>
            <div className="text-xs text-gray-600">Tiempo Promedio</div>
          </div>
          <div className="text-center p-3 bg-orange-50 rounded-lg">
            <div className="text-xl font-bold text-orange-600">
              {stats.lastViewedAt ? formatRelativeTime(stats.lastViewedAt) : '-'}
            </div>
            <div className="text-xs text-gray-600">Última Vista</div>
          </div>
        </div>

        {/* Views List */}
        {views.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            Este prospect aún no ha visto ninguna propiedad
          </div>
        ) : (
          <ScrollArea className="h-[300px]">
            <div className="space-y-3">
              {views.map(view => (
                <div
                  key={view.id}
                  className="p-3 border rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900">{view.property.title}</h4>
                      <div className="flex items-center gap-2 mt-1 text-sm text-gray-500">
                        <MapPin className="h-3 w-3" />
                        <span>{view.property.address}</span>
                      </div>
                      <div className="flex items-center gap-4 mt-2">
                        <div className="flex items-center gap-1 text-xs text-gray-500">
                          <Clock className="h-3 w-3" />
                          <span>{formatDuration(view.durationSeconds)} de visualización</span>
                        </div>
                        <div className="flex items-center gap-1 text-xs text-gray-500">
                          <Calendar className="h-3 w-3" />
                          <span>{formatRelativeTime(view.viewedAt)}</span>
                        </div>
                      </div>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      <Eye className="h-3 w-3 mr-1" />
                      Vista
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}

        {/* Insights */}
        {stats.totalViews > 0 && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-800">
            <strong>💡 Insight:</strong>{' '}
            {stats.totalViews > 5
              ? 'Alta actividad de visualización. Este prospect está muy interesado.'
              : 'Comparte más propiedades para aumentar el engagement.'}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

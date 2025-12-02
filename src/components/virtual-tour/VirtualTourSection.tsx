'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Maximize2, Eye, Navigation } from 'lucide-react';
import VirtualTour360 from './VirtualTour360';
import { useRouter } from 'next/navigation';

interface VirtualTourSectionProps {
  propertyId: string;
  className?: string;
}

export default function VirtualTourSection({
  propertyId,
  className = '',
}: VirtualTourSectionProps) {
  const router = useRouter();
  const [virtualTour, setVirtualTour] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showTour, setShowTour] = useState(false);

  useEffect(() => {
    loadVirtualTour();
  }, [propertyId]);

  const loadVirtualTour = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/properties/${propertyId}/virtual-tour`);

      if (response.ok) {
        const data = await response.json();

        // Solo mostrar si está habilitado y tiene escenas
        if (data.enabled && data.scenes && data.scenes.length > 0) {
          setVirtualTour(data);
        }
      }
    } catch (error) {
      console.error('Error loading virtual tour:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // No mostrar nada si no hay tour o está cargando
  if (isLoading || !virtualTour) {
    return null;
  }

  // Modo compacto: Solo muestra el botón para expandir
  if (!showTour) {
    return (
      <Card className={className}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center">
                <span className="text-white text-xs font-bold">360°</span>
              </div>
              <CardTitle>Tour Virtual 360°</CardTitle>
              <Badge variant="secondary" className="ml-2 bg-emerald-100 text-emerald-700">
                {virtualTour.scenes.length} escenas
              </Badge>
            </div>
            <Button
              onClick={() => setShowTour(true)}
              className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold"
            >
              <Eye className="h-4 w-4 mr-2" />
              Ver Tour 360°
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div
            className="relative aspect-video bg-gradient-to-br from-emerald-100 to-teal-100 rounded-lg overflow-hidden cursor-pointer group"
            onClick={() => setShowTour(true)}
          >
            {/* Thumbnail de la primera escena */}
            {virtualTour.scenes[0]?.thumbnailUrl || virtualTour.scenes[0]?.imageUrl ? (
              <img
                src={virtualTour.scenes[0]?.thumbnailUrl || virtualTour.scenes[0]?.imageUrl}
                alt="Tour Virtual Preview"
                className="w-full h-full object-cover"
              />
            ) : null}

            {/* Overlay con botón de play */}
            <div className="absolute inset-0 bg-black bg-opacity-30 flex items-center justify-center group-hover:bg-opacity-40 transition-all">
              <div className="text-center text-white">
                <div className="w-20 h-20 rounded-full bg-emerald-500 bg-opacity-90 backdrop-blur-sm flex items-center justify-center mb-3 mx-auto group-hover:scale-110 transition-transform shadow-xl">
                  <span className="text-2xl font-bold">360°</span>
                </div>
                <p className="text-base font-semibold">Haz click para explorar</p>
                <p className="text-sm opacity-90">Recorrido virtual interactivo</p>
              </div>
            </div>
          </div>

          {virtualTour.title && (
            <p className="mt-3 text-sm text-gray-600">{virtualTour.description}</p>
          )}
        </CardContent>
      </Card>
    );
  }

  // Modo expandido: Muestra el tour completo
  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center">
              <span className="text-white text-xs font-bold">360°</span>
            </div>
            <CardTitle>Tour Virtual 360°</CardTitle>
            <Badge variant="secondary" className="ml-2 bg-emerald-100 text-emerald-700">
              Interactivo
            </Badge>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={() => router.push(`/properties/${propertyId}/tour`)}
              className="bg-emerald-500 hover:bg-emerald-600 text-white"
              size="sm"
            >
              <Maximize2 className="h-4 w-4 mr-2" />
              Pantalla Completa
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <VirtualTour360
          propertyId={propertyId}
          scenes={virtualTour.scenes}
          onShare={() => {
            if (navigator.share) {
              navigator
                .share({
                  title: virtualTour.title || 'Tour Virtual 360°',
                  text: virtualTour.description || 'Explora esta propiedad en 360°',
                  url: window.location.href,
                })
                .catch(console.error);
            }
          }}
          className="rounded-lg overflow-hidden"
        />
      </CardContent>
    </Card>
  );
}

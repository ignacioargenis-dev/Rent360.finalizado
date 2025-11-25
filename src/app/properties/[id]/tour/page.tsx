'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ArrowLeft, X, Share2 } from 'lucide-react';
import VirtualTour360 from '@/components/virtual-tour/VirtualTour360';
import { logger } from '@/lib/logger-minimal';

export default function FullscreenVirtualTourPage() {
  const params = useParams();
  const router = useRouter();
  const propertyId = params?.id as string;

  const [virtualTour, setVirtualTour] = useState<any>(null);
  const [property, setProperty] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, [propertyId]);

  const loadData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Cargar información de la propiedad
      const propertyResponse = await fetch(`/api/properties/${propertyId}`);
      if (propertyResponse.ok) {
        const propertyData = await propertyResponse.json();
        if (propertyData.success && propertyData.property) {
          setProperty(propertyData.property);
        }
      }

      // Cargar configuración del tour virtual
      const tourResponse = await fetch(`/api/properties/${propertyId}/virtual-tour`);

      if (tourResponse.ok) {
        const tourData = await tourResponse.json();

        if (tourData.enabled && tourData.scenes && tourData.scenes.length > 0) {
          setVirtualTour(tourData);
          logger.info('Tour virtual cargado exitosamente', {
            propertyId,
            scenes: tourData.scenes.length,
          });
        } else {
          setError('Esta propiedad no tiene un tour virtual disponible');
          // Redirigir después de 2 segundos
          setTimeout(() => {
            router.push(`/properties/${propertyId}`);
          }, 2000);
        }
      } else {
        setError('No se pudo cargar el tour virtual');
        setTimeout(() => {
          router.push(`/properties/${propertyId}`);
        }, 2000);
      }
    } catch (error) {
      logger.error('Error loading virtual tour:', {
        error: error instanceof Error ? error.message : String(error),
        propertyId,
      });
      setError('Error al cargar el tour virtual');
      setTimeout(() => {
        router.push(`/properties/${propertyId}`);
      }, 2000);
    } finally {
      setIsLoading(false);
    }
  };

  const handleShare = async () => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: virtualTour?.title || 'Tour Virtual 360°',
          text: virtualTour?.description || property?.title || 'Explora esta propiedad en 360°',
          url: window.location.href,
        });
      } else {
        // Fallback: copiar al portapapeles
        await navigator.clipboard.writeText(window.location.href);
        alert('Link copiado al portapapeles');
      }
    } catch (error) {
      logger.error('Error sharing tour:', { error });
    }
  };

  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-900">
        <div className="text-white text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-white mx-auto mb-4"></div>
          <p className="text-lg font-medium">Cargando Tour Virtual 360°...</p>
          <p className="text-sm text-gray-400 mt-2">Preparando la experiencia inmersiva</p>
        </div>
      </div>
    );
  }

  if (error || !virtualTour) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-900">
        <div className="text-white text-center max-w-md px-4">
          <div className="bg-red-500/20 rounded-full p-4 w-20 h-20 mx-auto mb-4 flex items-center justify-center">
            <X className="h-10 w-10 text-red-400" />
          </div>
          <h1 className="text-2xl font-bold mb-2">Tour Virtual No Disponible</h1>
          <p className="text-gray-300 mb-6">
            {error || 'Esta propiedad no tiene un tour virtual configurado'}
          </p>
          <Button
            onClick={() => router.push(`/properties/${propertyId}`)}
            variant="outline"
            className="bg-white text-gray-900 hover:bg-gray-100"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver a la Propiedad
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen w-screen bg-black relative overflow-hidden">
      {/* Header con información y controles */}
      <div className="absolute top-0 left-0 right-0 z-50 bg-gradient-to-b from-black/80 via-black/50 to-transparent p-4 md:p-6">
        <div className="container mx-auto flex items-center justify-between">
          <div className="text-white flex-1 min-w-0 mr-4">
            <h1 className="text-xl md:text-2xl font-bold truncate">
              {virtualTour.title || property?.title || 'Tour Virtual 360°'}
            </h1>
            {(virtualTour.description || property?.address) && (
              <p className="text-sm md:text-base text-gray-300 mt-1 truncate">
                {virtualTour.description || property?.address}
              </p>
            )}
            {property && (
              <div className="flex items-center gap-4 mt-2 text-xs md:text-sm text-gray-400">
                <span>{property.bedrooms} dorm</span>
                <span>•</span>
                <span>{property.bathrooms} baños</span>
                <span>•</span>
                <span>{property.area} m²</span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            {/* Botón Compartir */}
            <Button
              variant="ghost"
              size="icon"
              className="text-white hover:bg-white/20 hidden md:flex"
              onClick={handleShare}
              title="Compartir tour"
            >
              <Share2 className="h-5 w-5" />
            </Button>

            {/* Botón Cerrar */}
            <Button
              variant="ghost"
              size="icon"
              className="text-white hover:bg-white/20"
              onClick={() => router.push(`/properties/${propertyId}`)}
              title="Cerrar tour"
            >
              <X className="h-6 w-6" />
            </Button>
          </div>
        </div>
      </div>

      {/* Tour Virtual en Pantalla Completa */}
      <VirtualTour360
        propertyId={propertyId}
        scenes={virtualTour.scenes}
        isFullscreen={true}
        onFullscreenChange={isFullscreen => {
          if (!isFullscreen) {
            router.push(`/properties/${propertyId}`);
          }
        }}
        onShare={handleShare}
        className="h-full w-full"
      />

      {/* Footer con ayuda (opcional, solo en desktop) */}
      <div className="absolute bottom-0 left-0 right-0 z-50 bg-gradient-to-t from-black/80 via-black/50 to-transparent p-4 md:p-6 hidden md:block">
        <div className="container mx-auto">
          <div className="flex items-center justify-center gap-8 text-white text-sm">
            <div className="flex items-center gap-2">
              <div className="bg-white/20 rounded px-2 py-1 font-mono">Click</div>
              <span className="text-gray-300">Explorar hotspots</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="bg-white/20 rounded px-2 py-1 font-mono">Arrastrar</div>
              <span className="text-gray-300">Navegar 360°</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="bg-white/20 rounded px-2 py-1 font-mono">Scroll</div>
              <span className="text-gray-300">Zoom</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

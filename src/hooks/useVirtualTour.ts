import { useState, useEffect, useCallback } from 'react';
import { logger } from '@/lib/logger-minimal';

interface VirtualTourScene {
  id: string;
  name: string;
  imageUrl: string;
  thumbnailUrl: string;
  description?: string;
  hotspots: Hotspot[];
  audioUrl?: string;
  duration?: number;
}

interface Hotspot {
  id: string;
  x: number;
  y: number;
  type: 'scene' | 'info' | 'link' | 'media';
  targetSceneId?: string;
  title: string;
  description?: string;
  icon?: string;
  mediaUrl?: string;
}

interface VirtualTourConfig {
  propertyId: string;
  scenes: VirtualTourScene[];
  isEnabled: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export function useVirtualTour(propertyId: string) {
  const [tourConfig, setTourConfig] = useState<VirtualTourConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadVirtualTour = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/properties/${propertyId}/virtual-tour`, {
        credentials: 'include',
        headers: {
          Accept: 'application/json',
        },
      });

      if (!response.ok) {
        if (response.status === 404) {
          // No hay tour virtual para esta propiedad
          setTourConfig(null);
          return;
        }
        throw new Error('Error al cargar el tour virtual');
      }

      const data = await response.json();
      setTourConfig(data.tour);
    } catch (error) {
      logger.error('Error cargando tour virtual:', { error, propertyId });
      setError(error instanceof Error ? error.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }
  }, [propertyId]);

  const createVirtualTour = useCallback(
    async (scenes: VirtualTourScene[]) => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch(`/api/properties/${propertyId}/virtual-tour`, {
          method: 'POST',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
          },
          body: JSON.stringify({ scenes }),
        });

        if (!response.ok) {
          throw new Error('Error al crear el tour virtual');
        }

        const data = await response.json();
        setTourConfig(data.tour);
        return data.tour;
      } catch (error) {
        logger.error('Error creando tour virtual:', { error, propertyId });
        setError(error instanceof Error ? error.message : 'Error desconocido');
        throw error;
      } finally {
        setLoading(false);
      }
    },
    [propertyId]
  );

  const updateVirtualTour = useCallback(
    async (scenes: VirtualTourScene[]) => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch(`/api/properties/${propertyId}/virtual-tour`, {
          method: 'PUT',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
          },
          body: JSON.stringify({ scenes }),
        });

        if (!response.ok) {
          throw new Error('Error al actualizar el tour virtual');
        }

        const data = await response.json();
        setTourConfig(data.tour);
        return data.tour;
      } catch (error) {
        logger.error('Error actualizando tour virtual:', { error, propertyId });
        setError(error instanceof Error ? error.message : 'Error desconocido');
        throw error;
      } finally {
        setLoading(false);
      }
    },
    [propertyId]
  );

  const deleteVirtualTour = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/properties/${propertyId}/virtual-tour`, {
        method: 'DELETE',
        credentials: 'include',
        headers: {
          Accept: 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Error al eliminar el tour virtual');
      }

      setTourConfig(null);
    } catch (error) {
      logger.error('Error eliminando tour virtual:', { error, propertyId });
      setError(error instanceof Error ? error.message : 'Error desconocido');
      throw error;
    } finally {
      setLoading(false);
    }
  }, [propertyId]);

  const uploadSceneImages = useCallback(
    async (files: File[]) => {
      try {
        setLoading(true);
        setError(null);

        const formData = new FormData();
        files.forEach((file, index) => {
          formData.append(`scene_${index}`, file);
        });

        const response = await fetch(`/api/properties/${propertyId}/virtual-tour/upload`, {
          method: 'POST',
          credentials: 'include',
          body: formData,
        });

        if (!response.ok) {
          throw new Error('Error al subir las imágenes del tour');
        }

        const data = await response.json();
        return data.uploadedScenes;
      } catch (error) {
        logger.error('Error subiendo imágenes del tour:', { error, propertyId });
        setError(error instanceof Error ? error.message : 'Error desconocido');
        throw error;
      } finally {
        setLoading(false);
      }
    },
    [propertyId]
  );

  useEffect(() => {
    if (propertyId) {
      loadVirtualTour();
    }
  }, [propertyId, loadVirtualTour]);

  return {
    tourConfig,
    loading,
    error,
    loadVirtualTour,
    createVirtualTour,
    updateVirtualTour,
    deleteVirtualTour,
    uploadSceneImages,
    hasTour: !!tourConfig,
    isEnabled: tourConfig?.isEnabled || false,
  };
}

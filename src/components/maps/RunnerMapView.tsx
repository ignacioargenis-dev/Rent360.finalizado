'use client';

/// <reference types="@types/google.maps" />

import React, { useEffect, useRef, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MapPin, Navigation, Route, Clock, AlertCircle, Loader2 } from 'lucide-react';
import { logger } from '@/lib/logger-minimal';

export interface MapLocation {
  id: string;
  name: string;
  address: string;
  coordinates: {
    latitude: number;
    longitude: number;
  };
  type: 'visit' | 'start' | 'end';
  status?: 'pending' | 'completed' | 'in_progress';
  scheduledTime?: string;
}

export interface RouteInfo {
  distance: string;
  duration: string;
  polyline?: string;
}

interface RunnerMapViewProps {
  locations: MapLocation[];
  currentLocation?: {
    latitude: number;
    longitude: number;
  };
  showRoute?: boolean;
  height?: string;
  onLocationSelect?: (location: MapLocation) => void;
}

export default function RunnerMapView({
  locations,
  currentLocation,
  showRoute = true,
  height = '500px',
  onLocationSelect,
}: RunnerMapViewProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<google.maps.Map | null>(null);
  const markersRef = useRef<google.maps.Marker[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [mapError, setMapError] = useState<string | null>(null);
  const [routeInfo, setRouteInfo] = useState<RouteInfo | null>(null);

  // Cargar script de Google Maps
  useEffect(() => {
    const loadGoogleMapsScript = () => {
      if (typeof window === 'undefined') {
        return;
      }

      // Verificar si ya está cargado
      if (window.google && window.google.maps) {
        initializeMap();
        return;
      }

      // Verificar si el script ya existe
      const existingScript = document.getElementById('google-maps-script');
      if (existingScript) {
        existingScript.addEventListener('load', initializeMap);
        return;
      }

      // Obtener API key desde la configuración del sistema
      fetch('/api/admin/integrations')
        .then(res => res.json())
        .then(data => {
          const googleMapsIntegration = data.integrations?.find((i: any) => i.id === 'google-maps');

          if (!googleMapsIntegration || !googleMapsIntegration.config?.apiKey) {
            throw new Error('Google Maps no está configurado. Contacte al administrador.');
          }

          const script = document.createElement('script');
          script.id = 'google-maps-script';
          script.src = `https://maps.googleapis.com/maps/api/js?key=${googleMapsIntegration.config.apiKey}&libraries=places,geometry`;
          script.async = true;
          script.defer = true;
          script.onload = initializeMap;
          script.onerror = () => {
            setMapError('Error al cargar Google Maps');
            setIsLoading(false);
          };
          document.head.appendChild(script);
        })
        .catch(error => {
          logger.error('Error obteniendo configuración de mapas:', error);
          setMapError('No se pudo cargar el mapa. Verifica la configuración.');
          setIsLoading(false);
        });
    };

    loadGoogleMapsScript();

    return () => {
      // Cleanup markers
      markersRef.current.forEach(marker => marker.setMap(null));
      markersRef.current = [];
    };
  }, []);

  // Inicializar mapa
  const initializeMap = () => {
    if (!mapRef.current || !window.google) {
      return;
    }

    try {
      const center = currentLocation ||
        locations[0]?.coordinates || {
          latitude: -33.4489,
          longitude: -70.6693,
        };

      const map = new google.maps.Map(mapRef.current, {
        center: { lat: center.latitude, lng: center.longitude },
        zoom: 13,
        mapTypeControl: true,
        streetViewControl: true,
        fullscreenControl: true,
        zoomControl: true,
      });

      mapInstanceRef.current = map;
      setIsLoading(false);
      addMarkers(map);

      if (showRoute && locations.length > 1) {
        calculateAndDisplayRoute(map);
      }
    } catch (error) {
      logger.error('Error inicializando mapa:', error);
      setMapError('Error al inicializar el mapa');
      setIsLoading(false);
    }
  };

  // Actualizar marcadores cuando cambian las ubicaciones
  useEffect(() => {
    if (mapInstanceRef.current && !isLoading) {
      addMarkers(mapInstanceRef.current);
      if (showRoute && locations.length > 1) {
        calculateAndDisplayRoute(mapInstanceRef.current);
      }
    }
  }, [locations, currentLocation, showRoute]);

  // Agregar marcadores al mapa
  const addMarkers = (map: google.maps.Map) => {
    // Limpiar marcadores existentes
    markersRef.current.forEach(marker => marker.setMap(null));
    markersRef.current = [];

    // Agregar marcador de ubicación actual
    if (currentLocation) {
      const currentMarker = new google.maps.Marker({
        position: { lat: currentLocation.latitude, lng: currentLocation.longitude },
        map,
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          scale: 10,
          fillColor: '#3B82F6',
          fillOpacity: 1,
          strokeColor: '#FFFFFF',
          strokeWeight: 2,
        },
        title: 'Tu ubicación actual',
        zIndex: 1000,
      });

      markersRef.current.push(currentMarker);
    }

    // Agregar marcadores de ubicaciones
    locations.forEach((location, index) => {
      const marker = new google.maps.Marker({
        position: {
          lat: location.coordinates.latitude,
          lng: location.coordinates.longitude,
        },
        map,
        label: {
          text: (index + 1).toString(),
          color: 'white',
          fontSize: '12px',
          fontWeight: 'bold',
        },
        icon: getMarkerIcon(location.type, location.status),
        title: location.name,
      });

      // Info window
      const infoWindow = new google.maps.InfoWindow({
        content: `
          <div style="padding: 8px; max-width: 200px;">
            <h3 style="margin: 0 0 8px 0; font-size: 14px; font-weight: 600;">${location.name}</h3>
            <p style="margin: 0 0 4px 0; font-size: 12px; color: #666;">${location.address}</p>
            ${
              location.scheduledTime
                ? `<p style="margin: 0; font-size: 12px; color: #666;">🕒 ${new Date(location.scheduledTime).toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' })}</p>`
                : ''
            }
            ${
              location.status
                ? `<span style="display: inline-block; margin-top: 4px; padding: 2px 8px; font-size: 11px; border-radius: 4px; background: ${getStatusColor(location.status)}; color: white;">${getStatusText(location.status)}</span>`
                : ''
            }
          </div>
        `,
      });

      marker.addListener('click', () => {
        infoWindow.open(map, marker);
        if (onLocationSelect) {
          onLocationSelect(location);
        }
      });

      markersRef.current.push(marker);
    });

    // Ajustar límites del mapa para mostrar todos los marcadores
    if (locations.length > 0) {
      const bounds = new google.maps.LatLngBounds();
      if (currentLocation) {
        bounds.extend({ lat: currentLocation.latitude, lng: currentLocation.longitude });
      }
      locations.forEach(location => {
        bounds.extend({
          lat: location.coordinates.latitude,
          lng: location.coordinates.longitude,
        });
      });
      map.fitBounds(bounds);
    }
  };

  // Calcular y mostrar ruta
  const calculateAndDisplayRoute = async (map: google.maps.Map) => {
    if (!window.google || locations.length < 2) {
      return;
    }

    const directionsService = new google.maps.DirectionsService();
    const directionsRenderer = new google.maps.DirectionsRenderer({
      map,
      suppressMarkers: true, // No mostrar marcadores por defecto
      polylineOptions: {
        strokeColor: '#059669',
        strokeWeight: 4,
        strokeOpacity: 0.8,
      },
    });

    const waypoints = locations.slice(1, -1).map(location => ({
      location: {
        lat: location.coordinates.latitude,
        lng: location.coordinates.longitude,
      },
      stopover: true,
    }));

    const firstLocation = locations[0];
    const lastLocation = locations[locations.length - 1];

    if (!firstLocation || !lastLocation) {
      logger.warn('No hay ubicaciones suficientes para calcular ruta');
      return;
    }

    const origin = currentLocation || firstLocation.coordinates;
    const destination = lastLocation.coordinates;

    try {
      const result = await directionsService.route({
        origin: { lat: origin.latitude, lng: origin.longitude },
        destination: {
          lat: destination.latitude,
          lng: destination.longitude,
        },
        waypoints,
        travelMode: google.maps.TravelMode.DRIVING,
        optimizeWaypoints: true,
      });

      directionsRenderer.setDirections(result);

      // Extraer información de la ruta
      if (result.routes[0]) {
        const route = result.routes[0];
        let totalDistance = 0;
        let totalDuration = 0;

        route.legs.forEach(leg => {
          totalDistance += leg.distance?.value || 0;
          totalDuration += leg.duration?.value || 0;
        });

        setRouteInfo({
          distance: `${(totalDistance / 1000).toFixed(1)} km`,
          duration: `${Math.round(totalDuration / 60)} min`,
        });
      }
    } catch (error) {
      logger.error('Error calculando ruta:', error);
    }
  };

  // Obtener icono de marcador según tipo y estado
  const getMarkerIcon = (type: string, status?: string): google.maps.Symbol => {
    const defaultColor =
      status === 'completed' ? '#6B7280' : status === 'in_progress' ? '#F59E0B' : '#059669';
    const colors: Record<string, string> = {
      start: '#10B981',
      end: '#EF4444',
      visit: defaultColor,
    };

    return {
      path: google.maps.SymbolPath.CIRCLE,
      scale: 12,
      fillColor: colors[type] ?? defaultColor,
      fillOpacity: 0.9,
      strokeColor: '#FFFFFF',
      strokeWeight: 2,
    };
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pending: '#6B7280',
      in_progress: '#F59E0B',
      completed: '#10B981',
    };
    return colors[status] || colors.pending;
  };

  const getStatusText = (status: string) => {
    const texts: Record<string, string> = {
      pending: 'Pendiente',
      in_progress: 'En Progreso',
      completed: 'Completada',
    };
    return texts[status] || status;
  };

  if (mapError) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
          <p className="text-red-600 text-center font-medium">{mapError}</p>
          <p className="text-sm text-gray-500 text-center mt-2">
            Asegúrate de que Google Maps esté configurado en el panel de administración.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Información de ruta */}
      {routeInfo && (
        <Card>
          <CardContent className="flex items-center justify-between py-4">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Route className="h-5 w-5 text-green-600" />
                <div>
                  <p className="text-sm text-gray-500">Distancia Total</p>
                  <p className="text-lg font-semibold">{routeInfo.distance}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-blue-600" />
                <div>
                  <p className="text-sm text-gray-500">Tiempo Estimado</p>
                  <p className="text-lg font-semibold">{routeInfo.duration}</p>
                </div>
              </div>
            </div>
            <Button variant="outline" size="sm">
              <Navigation className="h-4 w-4 mr-2" />
              Iniciar Navegación
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Mapa */}
      <Card>
        <CardContent className="p-0 relative">
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-50 z-10 rounded-lg">
              <div className="text-center">
                <Loader2 className="h-8 w-8 animate-spin text-green-600 mx-auto mb-2" />
                <p className="text-sm text-gray-500">Cargando mapa...</p>
              </div>
            </div>
          )}
          <div ref={mapRef} style={{ height, width: '100%', borderRadius: '0.5rem' }} />
        </CardContent>
      </Card>

      {/* Leyenda */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Leyenda</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {currentLocation && (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full bg-blue-500 border-2 border-white" />
                <span className="text-sm">Tu ubicación</span>
              </div>
            )}
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-green-600" />
              <span className="text-sm">Inicio</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-green-600" />
              <span className="text-sm">Pendiente</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-orange-500" />
              <span className="text-sm">En progreso</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-gray-500" />
              <span className="text-sm">Completada</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

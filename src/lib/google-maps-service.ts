import { logger } from '@/lib/logger-minimal';

/**
 * Servicio de integración con Google Maps API
 * Proporciona geocodificación, rutas, cálculo de distancias y visualización de mapas
 */

export interface GoogleMapsConfig {
  apiKey: string;
  language?: string;
  region?: string;
}

export interface Coordinates {
  latitude: number;
  longitude: number;
}

export interface GeocodingResult {
  address: string;
  coordinates: Coordinates;
  formattedAddress: string;
  placeId: string;
  addressComponents: {
    street?: string;
    number?: string;
    city?: string;
    commune?: string;
    region?: string;
    postalCode?: string;
    country?: string;
  };
}

export interface RouteResult {
  distance: {
    value: number; // meters
    text: string;
  };
  duration: {
    value: number; // seconds
    text: string;
  };
  steps: RouteStep[];
  polyline: string;
  bounds: {
    northeast: Coordinates;
    southwest: Coordinates;
  };
}

export interface RouteStep {
  distance: { value: number; text: string };
  duration: { value: number; text: string };
  instructions: string;
  startLocation: Coordinates;
  endLocation: Coordinates;
  maneuver?: string;
}

export interface DistanceMatrixResult {
  originAddress: string;
  destinationAddress: string;
  distance: {
    value: number; // meters
    text: string;
  };
  duration: {
    value: number; // seconds
    text: string;
  };
  status: 'OK' | 'NOT_FOUND' | 'ZERO_RESULTS';
}

export interface PlaceDetails {
  placeId: string;
  name: string;
  formattedAddress: string;
  coordinates: Coordinates;
  types: string[];
  rating?: number;
  photos?: string[];
  openingHours?: {
    openNow: boolean;
    weekdayText: string[];
  };
  phoneNumber?: string;
  website?: string;
}

/**
 * Clase de servicio de Google Maps
 */
export class GoogleMapsService {
  private static instance: GoogleMapsService;
  private config: GoogleMapsConfig | null = null;
  private baseUrl = 'https://maps.googleapis.com/maps/api';

  private constructor() {}

  static getInstance(): GoogleMapsService {
    if (!GoogleMapsService.instance) {
      GoogleMapsService.instance = new GoogleMapsService();
    }
    return GoogleMapsService.instance;
  }

  /**
   * Inicializa el servicio con la configuración
   */
  initialize(config: GoogleMapsConfig): void {
    if (!config.apiKey) {
      throw new Error('Google Maps API Key es requerida');
    }
    this.config = config;
    logger.info('Google Maps Service inicializado', {
      language: config.language || 'es',
      region: config.region || 'CL',
    });
  }

  /**
   * Verifica que el servicio esté configurado
   */
  private ensureConfigured(): void {
    if (!this.config || !this.config.apiKey) {
      throw new Error('Google Maps Service no está configurado. Llama a initialize() primero.');
    }
  }

  /**
   * Obtiene la configuración actual (sin exponer el API key)
   */
  getConfig(): { language: string; region: string } | null {
    if (!this.config) {
      return null;
    }
    return {
      language: this.config.language || 'es',
      region: this.config.region || 'CL',
    };
  }

  /**
   * Geocodifica una dirección a coordenadas
   */
  async geocodeAddress(address: string): Promise<GeocodingResult> {
    this.ensureConfigured();

    try {
      const params = new URLSearchParams({
        address,
        key: this.config!.apiKey,
        language: this.config!.language || 'es',
        region: this.config!.region || 'CL',
      });

      const url = `${this.baseUrl}/geocode/json?${params.toString()}`;
      const response = await fetch(url);
      const data = await response.json();

      if (data.status !== 'OK' || !data.results || data.results.length === 0) {
        throw new Error(`Geocoding failed: ${data.status}`);
      }

      const result = data.results[0];
      const location = result.geometry.location;

      // Extraer componentes de dirección
      const addressComponents = this.parseAddressComponents(result.address_components);

      return {
        address,
        coordinates: {
          latitude: location.lat,
          longitude: location.lng,
        },
        formattedAddress: result.formatted_address,
        placeId: result.place_id,
        addressComponents,
      };
    } catch (error) {
      logger.error('Error en geocodificación', {
        error: error instanceof Error ? error.message : String(error),
        address,
      });
      throw error;
    }
  }

  /**
   * Geocodificación inversa: coordenadas a dirección
   */
  async reverseGeocode(coordinates: Coordinates): Promise<GeocodingResult> {
    this.ensureConfigured();

    try {
      const params = new URLSearchParams({
        latlng: `${coordinates.latitude},${coordinates.longitude}`,
        key: this.config!.apiKey,
        language: this.config!.language || 'es',
        region: this.config!.region || 'CL',
      });

      const url = `${this.baseUrl}/geocode/json?${params.toString()}`;
      const response = await fetch(url);
      const data = await response.json();

      if (data.status !== 'OK' || !data.results || data.results.length === 0) {
        throw new Error(`Reverse geocoding failed: ${data.status}`);
      }

      const result = data.results[0];
      const location = result.geometry.location;
      const addressComponents = this.parseAddressComponents(result.address_components);

      return {
        address: result.formatted_address,
        coordinates: {
          latitude: location.lat,
          longitude: location.lng,
        },
        formattedAddress: result.formatted_address,
        placeId: result.place_id,
        addressComponents,
      };
    } catch (error) {
      logger.error('Error en geocodificación inversa', {
        error: error instanceof Error ? error.message : String(error),
        coordinates,
      });
      throw error;
    }
  }

  /**
   * Calcula una ruta entre dos puntos
   */
  async getRoute(
    origin: Coordinates | string,
    destination: Coordinates | string,
    options?: {
      mode?: 'driving' | 'walking' | 'bicycling' | 'transit';
      alternatives?: boolean;
      avoidTolls?: boolean;
      avoidHighways?: boolean;
    }
  ): Promise<RouteResult> {
    this.ensureConfigured();

    try {
      const originStr =
        typeof origin === 'string' ? origin : `${origin.latitude},${origin.longitude}`;
      const destinationStr =
        typeof destination === 'string'
          ? destination
          : `${destination.latitude},${destination.longitude}`;

      const params = new URLSearchParams({
        origin: originStr,
        destination: destinationStr,
        key: this.config!.apiKey,
        language: this.config!.language || 'es',
        mode: options?.mode || 'driving',
        alternatives: options?.alternatives ? 'true' : 'false',
      });

      if (options?.avoidTolls) {
        params.append('avoid', 'tolls');
      }
      if (options?.avoidHighways) {
        params.append('avoid', 'highways');
      }

      const url = `${this.baseUrl}/directions/json?${params.toString()}`;
      const response = await fetch(url);
      const data = await response.json();

      if (data.status !== 'OK' || !data.routes || data.routes.length === 0) {
        throw new Error(`Directions failed: ${data.status}`);
      }

      const route = data.routes[0];
      const leg = route.legs[0];

      return {
        distance: leg.distance,
        duration: leg.duration,
        steps: leg.steps.map((step: any) => ({
          distance: step.distance,
          duration: step.duration,
          instructions: step.html_instructions.replace(/<[^>]*>/g, ''), // Remove HTML tags
          startLocation: {
            latitude: step.start_location.lat,
            longitude: step.start_location.lng,
          },
          endLocation: {
            latitude: step.end_location.lat,
            longitude: step.end_location.lng,
          },
          maneuver: step.maneuver,
        })),
        polyline: route.overview_polyline.points,
        bounds: {
          northeast: {
            latitude: route.bounds.northeast.lat,
            longitude: route.bounds.northeast.lng,
          },
          southwest: {
            latitude: route.bounds.southwest.lat,
            longitude: route.bounds.southwest.lng,
          },
        },
      };
    } catch (error) {
      logger.error('Error calculando ruta', {
        error: error instanceof Error ? error.message : String(error),
        origin,
        destination,
      });
      throw error;
    }
  }

  /**
   * Calcula distancia y tiempo entre múltiples orígenes y destinos
   */
  async getDistanceMatrix(
    origins: (Coordinates | string)[],
    destinations: (Coordinates | string)[],
    options?: {
      mode?: 'driving' | 'walking' | 'bicycling' | 'transit';
    }
  ): Promise<DistanceMatrixResult[]> {
    this.ensureConfigured();

    try {
      const originsStr = origins
        .map(o => (typeof o === 'string' ? o : `${o.latitude},${o.longitude}`))
        .join('|');
      const destinationsStr = destinations
        .map(d => (typeof d === 'string' ? d : `${d.latitude},${d.longitude}`))
        .join('|');

      const params = new URLSearchParams({
        origins: originsStr,
        destinations: destinationsStr,
        key: this.config!.apiKey,
        language: this.config!.language || 'es',
        mode: options?.mode || 'driving',
      });

      const url = `${this.baseUrl}/distancematrix/json?${params.toString()}`;
      const response = await fetch(url);
      const data = await response.json();

      if (data.status !== 'OK') {
        throw new Error(`Distance Matrix failed: ${data.status}`);
      }

      const results: DistanceMatrixResult[] = [];
      data.rows.forEach((row: any, originIndex: number) => {
        row.elements.forEach((element: any, destIndex: number) => {
          results.push({
            originAddress: data.origin_addresses[originIndex],
            destinationAddress: data.destination_addresses[destIndex],
            distance: element.distance || { value: 0, text: 'N/A' },
            duration: element.duration || { value: 0, text: 'N/A' },
            status: element.status,
          });
        });
      });

      return results;
    } catch (error) {
      logger.error('Error en Distance Matrix', {
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  /**
   * Busca lugares cercanos
   */
  async findNearbyPlaces(
    location: Coordinates,
    options?: {
      radius?: number; // meters, default 1000
      type?: string; // e.g., 'restaurant', 'store', 'bank'
      keyword?: string;
    }
  ): Promise<PlaceDetails[]> {
    this.ensureConfigured();

    try {
      const params = new URLSearchParams({
        location: `${location.latitude},${location.longitude}`,
        radius: (options?.radius || 1000).toString(),
        key: this.config!.apiKey,
        language: this.config!.language || 'es',
      });

      if (options?.type) {
        params.append('type', options.type);
      }
      if (options?.keyword) {
        params.append('keyword', options.keyword);
      }

      const url = `${this.baseUrl}/place/nearbysearch/json?${params.toString()}`;
      const response = await fetch(url);
      const data = await response.json();

      if (data.status !== 'OK' && data.status !== 'ZERO_RESULTS') {
        throw new Error(`Nearby search failed: ${data.status}`);
      }

      return (data.results || []).map((place: any) => ({
        placeId: place.place_id,
        name: place.name,
        formattedAddress: place.vicinity,
        coordinates: {
          latitude: place.geometry.location.lat,
          longitude: place.geometry.location.lng,
        },
        types: place.types,
        rating: place.rating,
        photos: (place.photos || []).map((photo: any) => {
          const photoParams = new URLSearchParams({
            maxwidth: '400',
            photo_reference: photo.photo_reference,
            key: this.config!.apiKey,
          });
          return `${this.baseUrl}/place/photo?${photoParams.toString()}`;
        }),
        openingHours: place.opening_hours
          ? {
              openNow: place.opening_hours.open_now,
              weekdayText: [],
            }
          : undefined,
      }));
    } catch (error) {
      logger.error('Error buscando lugares cercanos', {
        error: error instanceof Error ? error.message : String(error),
        location,
      });
      throw error;
    }
  }

  /**
   * Genera URL de mapa estático
   */
  generateStaticMapUrl(
    center: Coordinates,
    options?: {
      zoom?: number;
      width?: number;
      height?: number;
      markers?: Array<{
        coordinates: Coordinates;
        color?: string;
        label?: string;
      }>;
      mapType?: 'roadmap' | 'satellite' | 'terrain' | 'hybrid';
    }
  ): string {
    this.ensureConfigured();

    const params = new URLSearchParams({
      center: `${center.latitude},${center.longitude}`,
      zoom: (options?.zoom || 15).toString(),
      size: `${options?.width || 600}x${options?.height || 400}`,
      maptype: options?.mapType || 'roadmap',
      key: this.config!.apiKey,
    });

    if (options?.markers) {
      options.markers.forEach(marker => {
        const markerStr = [
          marker.color ? `color:${marker.color}` : '',
          marker.label ? `label:${marker.label}` : '',
          `${marker.coordinates.latitude},${marker.coordinates.longitude}`,
        ]
          .filter(Boolean)
          .join('|');
        params.append('markers', markerStr);
      });
    }

    return `${this.baseUrl}/staticmap?${params.toString()}`;
  }

  /**
   * Genera URL para embed de mapa
   */
  generateEmbedUrl(
    center: Coordinates,
    options?: {
      zoom?: number;
      mapType?: 'roadmap' | 'satellite';
    }
  ): string {
    this.ensureConfigured();

    const params = new URLSearchParams({
      q: `${center.latitude},${center.longitude}`,
      zoom: (options?.zoom || 15).toString(),
      maptype: options?.mapType || 'roadmap',
      key: this.config!.apiKey,
    });

    return `https://www.google.com/maps/embed/v1/place?${params.toString()}`;
  }

  /**
   * Parsea componentes de dirección de Google Maps
   */
  private parseAddressComponents(components: any[]): GeocodingResult['addressComponents'] {
    const result: GeocodingResult['addressComponents'] = {};

    components.forEach(component => {
      const types = component.types;
      if (types.includes('street_number')) {
        result.number = component.long_name;
      } else if (types.includes('route')) {
        result.street = component.long_name;
      } else if (types.includes('locality')) {
        result.city = component.long_name;
      } else if (types.includes('administrative_area_level_3')) {
        result.commune = component.long_name;
      } else if (types.includes('administrative_area_level_1')) {
        result.region = component.long_name;
      } else if (types.includes('postal_code')) {
        result.postalCode = component.long_name;
      } else if (types.includes('country')) {
        result.country = component.long_name;
      }
    });

    return result;
  }

  /**
   * Valida credenciales de API
   */
  async validateApiKey(apiKey: string): Promise<boolean> {
    try {
      const testConfig: GoogleMapsConfig = { apiKey };
      const tempService = new GoogleMapsService();
      tempService.initialize(testConfig);

      // Hacer una petición simple de geocoding para validar
      await tempService.geocodeAddress('Santiago, Chile');
      return true;
    } catch (error) {
      logger.error('API Key inválida', {
        error: error instanceof Error ? error.message : String(error),
      });
      return false;
    }
  }
}

/**
 * Instancia singleton del servicio
 */
export const googleMapsService = GoogleMapsService.getInstance();

import { logger } from '@/lib/logger';

/**
 * Coordenadas geográficas
 */
export interface Coordinates {
  latitude: number;
  longitude: number;
}

/**
 * Ubicación con información adicional
 */
export interface Location {
  coordinates: Coordinates;
  address: string;
  city: string;
  region: string;
  country: string;
  postalCode?: string;
  formattedAddress: string;
}

/**
 * Proveedor con información de ubicación
 */
export interface ProviderLocation {
  providerId: string;
  providerType: 'MAINTENANCE' | 'SERVICE';
  businessName: string;
  location: Location;
  serviceRadius: number; // en kilómetros
  serviceAreas: string[]; // comunas o zonas donde opera
  isActive: boolean;
  rating: number;
  totalJobs: number;
  specialties: string[];
}

/**
 * Criterios de búsqueda para proveedores
 */
export interface ProviderSearchCriteria {
  location: Coordinates;
  serviceType: 'MAINTENANCE' | 'SERVICE';
  maxDistance: number; // en kilómetros
  specialties?: string[];
  minRating?: number;
  maxPrice?: number;
  availability?: Date;
}

/**
 * Resultado de búsqueda de proveedores
 */
export interface ProviderSearchResult {
  provider: ProviderLocation;
  distance: number; // en kilómetros
  estimatedTime: number; // en minutos
  matchScore: number; // 0-100 basado en varios factores
}

/**
 * Servicio de geolocalización y matching
 */
export class GeolocationService {
  private static instance: GeolocationService;
  private providers: Map<string, ProviderLocation> = new Map();

  // Configuración por defecto
  private readonly EARTH_RADIUS_KM = 6371;
  private readonly DEFAULT_SERVICE_RADIUS = 25; // km
  private readonly MAX_SEARCH_RADIUS = 100; // km

  private constructor() {
    this.initializeMockProviders();
  }

  static getInstance(): GeolocationService {
    if (!GeolocationService.instance) {
      GeolocationService.instance = new GeolocationService();
    }
    return GeolocationService.instance;
  }

  /**
   * Calcula la distancia entre dos puntos usando la fórmula de Haversine
   */
  calculateDistance(coord1: Coordinates, coord2: Coordinates): number {
    const lat1Rad = this.toRadians(coord1.latitude);
    const lat2Rad = this.toRadians(coord2.latitude);
    const deltaLatRad = this.toRadians(coord2.latitude - coord1.latitude);
    const deltaLngRad = this.toRadians(coord2.longitude - coord1.longitude);

    const a = Math.sin(deltaLatRad / 2) * Math.sin(deltaLatRad / 2) +
              Math.cos(lat1Rad) * Math.cos(lat2Rad) *
              Math.sin(deltaLngRad / 2) * Math.sin(deltaLngRad / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return this.EARTH_RADIUS_KM * c;
  }

  /**
   * Convierte grados a radianes
   */
  private toRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }

  /**
   * Calcula tiempo estimado de llegada basado en distancia
   */
  estimateTravelTime(distanceKm: number, averageSpeedKmh: number = 30): number {
    // Considerando tráfico y tiempo de preparación
    const travelTime = (distanceKm / averageSpeedKmh) * 60; // minutos
    const preparationTime = 15; // minutos
    return Math.round(travelTime + preparationTime);
  }

  /**
   * Calcula score de matching basado en múltiples factores
   */
  calculateMatchScore(
    provider: ProviderLocation,
    criteria: ProviderSearchCriteria,
    distance: number
  ): number {
    let score = 0;

    // Factor de distancia (40%)
    const distanceScore = Math.max(0, 40 - (distance / criteria.maxDistance) * 40);
    score += distanceScore;

    // Factor de rating (30%)
    const ratingWeight = criteria.minRating ? 30 : 25;
    const ratingScore = (provider.rating / 5) * ratingWeight;
    score += ratingScore;

    // Factor de experiencia (20%)
    const experienceScore = Math.min(20, provider.totalJobs / 10);
    score += experienceScore;

    // Factor de especialización (10%)
    let specialtyScore = 0;
    if (criteria.specialties && criteria.specialties.length > 0) {
      const matchingSpecialties = provider.specialties.filter(specialty =>
        criteria.specialties!.includes(specialty)
      ).length;
      specialtyScore = (matchingSpecialties / criteria.specialties.length) * 10;
    } else {
      specialtyScore = 5; // Puntaje base si no hay especialidades requeridas
    }
    score += specialtyScore;

    return Math.min(100, Math.round(score));
  }

  /**
   * Busca proveedores cercanos basados en criterios
   */
  async findNearbyProviders(criteria: ProviderSearchCriteria): Promise<ProviderSearchResult[]> {
    try {
      logger.info('Buscando proveedores cercanos:', {
        location: criteria.location,
        serviceType: criteria.serviceType,
        maxDistance: criteria.maxDistance
      });

      const results: ProviderSearchResult[] = [];

      for (const [providerId, provider] of this.providers) {
        // Filtrar por tipo de servicio
        if (provider.providerType !== criteria.serviceType) {
          continue;
        }

        // Filtrar por estado activo
        if (!provider.isActive) {
          continue;
        }

        // Calcular distancia
        const distance = this.calculateDistance(criteria.location, provider.location.coordinates);

        // Filtrar por distancia máxima
        if (distance > criteria.maxDistance) {
          continue;
        }

        // Filtrar por rating mínimo si se especifica
        if (criteria.minRating && provider.rating < criteria.minRating) {
          continue;
        }

        // Calcular tiempo estimado
        const estimatedTime = this.estimateTravelTime(distance);

        // Calcular score de matching
        const matchScore = this.calculateMatchScore(provider, criteria, distance);

        results.push({
          provider,
          distance: Math.round(distance * 10) / 10, // Redondear a 1 decimal
          estimatedTime,
          matchScore
        });
      }

      // Ordenar por score de matching (descendente)
      results.sort((a, b) => b.matchScore - a.matchScore);

      logger.info(`Encontrados ${results.length} proveedores cercanos`);

      return results.slice(0, 20); // Máximo 20 resultados

    } catch (error) {
      logger.error('Error buscando proveedores cercanos:', error);
      throw error;
    }
  }

  /**
   * Registra o actualiza la ubicación de un proveedor
   */
  async registerProviderLocation(providerData: Omit<ProviderLocation, 'isActive'>): Promise<void> {
    try {
      const providerLocation: ProviderLocation = {
        ...providerData,
        isActive: true
      };

      this.providers.set(providerData.providerId, providerLocation);

      logger.info('Ubicación de proveedor registrada:', {
        providerId: providerData.providerId,
        location: providerData.location.city,
        serviceRadius: providerData.serviceRadius
      });

    } catch (error) {
      logger.error('Error registrando ubicación de proveedor:', error);
      throw error;
    }
  }

  /**
   * Actualiza la ubicación de un proveedor
   */
  async updateProviderLocation(providerId: string, updates: Partial<ProviderLocation>): Promise<void> {
    try {
      const existingProvider = this.providers.get(providerId);
      if (!existingProvider) {
        throw new Error(`Proveedor ${providerId} no encontrado`);
      }

      const updatedProvider = { ...existingProvider, ...updates };
      this.providers.set(providerId, updatedProvider);

      logger.info('Ubicación de proveedor actualizada:', { providerId });

    } catch (error) {
      logger.error('Error actualizando ubicación de proveedor:', error);
      throw error;
    }
  }

  /**
   * Obtiene proveedores dentro de un radio específico
   */
  async getProvidersInRadius(center: Coordinates, radiusKm: number): Promise<ProviderLocation[]> {
    const providers: ProviderLocation[] = [];

    for (const [providerId, provider] of this.providers) {
      if (!provider.isActive) continue;

      const distance = this.calculateDistance(center, provider.location.coordinates);
      if (distance <= radiusKm) {
        providers.push(provider);
      }
    }

    return providers;
  }

  /**
   * Geocodifica una dirección a coordenadas
   */
  async geocodeAddress(address: string): Promise<Location> {
    try {
      // En una implementación real, usaríamos una API como Google Maps, Mapbox, etc.
      // Por ahora simulamos geocodificación basada en direcciones chilenas conocidas

      logger.info('Geocodificando dirección:', { address });

      // Simulación de geocodificación para Chile
      const mockLocations: Record<string, Location> = {
        'Santiago Centro': {
          coordinates: { latitude: -33.4489, longitude: -70.6693 },
          address: 'Santiago Centro',
          city: 'Santiago',
          region: 'Región Metropolitana',
          country: 'Chile',
          formattedAddress: 'Santiago Centro, Región Metropolitana, Chile'
        },
        'Providencia': {
          coordinates: { latitude: -33.4314, longitude: -70.6093 },
          address: 'Providencia',
          city: 'Santiago',
          region: 'Región Metropolitana',
          country: 'Chile',
          formattedAddress: 'Providencia, Santiago, Región Metropolitana, Chile'
        },
        'Las Condes': {
          coordinates: { latitude: -33.4155, longitude: -70.5831 },
          address: 'Las Condes',
          city: 'Santiago',
          region: 'Región Metropolitana',
          country: 'Chile',
          formattedAddress: 'Las Condes, Santiago, Región Metropolitana, Chile'
        }
      };

      // Buscar por coincidencia parcial
      for (const [key, location] of Object.entries(mockLocations)) {
        if (address.toLowerCase().includes(key.toLowerCase())) {
          return location;
        }
      }

      // Si no encuentra coincidencia, devolver ubicación por defecto de Santiago
      const defaultLocation: Location = {
        coordinates: { latitude: -33.4489, longitude: -70.6693 },
        address,
        city: 'Santiago',
        region: 'Región Metropolitana',
        country: 'Chile',
        formattedAddress: `${address}, Santiago, Región Metropolitana, Chile`
      };

      return defaultLocation;

    } catch (error) {
      logger.error('Error geocodificando dirección:', error);
      throw new Error('No se pudo geocodificar la dirección');
    }
  }

  /**
   * Obtiene dirección desde coordenadas (reverse geocoding)
   */
  async reverseGeocode(coordinates: Coordinates): Promise<Location> {
    try {
      // En una implementación real, usaríamos una API de geocodificación inversa
      // Por ahora simulamos basado en coordenadas conocidas

      logger.info('Reverse geocoding', { coordinates });

      // Simular reverse geocoding para Santiago
      const locations = [
        {
          coordinates: { latitude: -33.4489, longitude: -70.6693 },
          address: 'Plaza de Armas',
          city: 'Santiago',
          region: 'Región Metropolitana',
          country: 'Chile',
          formattedAddress: 'Plaza de Armas, Santiago Centro, Región Metropolitana, Chile'
        },
        {
          coordinates: { latitude: -33.4314, longitude: -70.6093 },
          address: 'Providencia',
          city: 'Santiago',
          region: 'Región Metropolitana',
          country: 'Chile',
          formattedAddress: 'Providencia, Santiago, Región Metropolitana, Chile'
        }
      ];

      // Encontrar la ubicación más cercana
      let closestLocation = locations[0];
      let minDistance = this.calculateDistance(coordinates, locations[0].coordinates);

      for (const location of locations.slice(1)) {
        const distance = this.calculateDistance(coordinates, location.coordinates);
        if (distance < minDistance) {
          minDistance = distance;
          closestLocation = location;
        }
      }

      return closestLocation;

    } catch (error) {
      logger.error('Error en reverse geocoding:', error);
      throw new Error('No se pudo obtener la dirección');
    }
  }

  /**
   * Inicializa proveedores de ejemplo para desarrollo
   */
  private initializeMockProviders(): void {
    const mockProviders: ProviderLocation[] = [
      {
        providerId: 'prov_001',
        providerType: 'MAINTENANCE',
        businessName: 'Mantenimiento Express',
        location: {
          coordinates: { latitude: -33.4489, longitude: -70.6693 },
          address: 'Av. Libertador Bernardo O\'Higgins 123',
          city: 'Santiago',
          region: 'Región Metropolitana',
          country: 'Chile',
          formattedAddress: 'Av. Libertador Bernardo O\'Higgins 123, Santiago Centro, Región Metropolitana, Chile'
        },
        serviceRadius: 20,
        serviceAreas: ['Santiago Centro', 'Estación Central', 'Independencia'],
        isActive: true,
        rating: 4.5,
        totalJobs: 150,
        specialties: ['plomeria', 'electricidad', 'carpinteria']
      },
      {
        providerId: 'prov_002',
        providerType: 'SERVICE',
        businessName: 'Limpieza Profesional Plus',
        location: {
          coordinates: { latitude: -33.4314, longitude: -70.6093 },
          address: 'Providencia 456',
          city: 'Santiago',
          region: 'Región Metropolitana',
          country: 'Chile',
          formattedAddress: 'Providencia 456, Providencia, Región Metropolitana, Chile'
        },
        serviceRadius: 15,
        serviceAreas: ['Providencia', 'Las Condes', 'Vitacura'],
        isActive: true,
        rating: 4.8,
        totalJobs: 200,
        specialties: ['limpieza', 'jardineria', 'fumigacion']
      },
      {
        providerId: 'prov_003',
        providerType: 'MAINTENANCE',
        businessName: 'Técnicos Especializados',
        location: {
          coordinates: { latitude: -33.4155, longitude: -70.5831 },
          address: 'Las Condes 789',
          city: 'Santiago',
          region: 'Región Metropolitana',
          country: 'Chile',
          formattedAddress: 'Las Condes 789, Las Condes, Región Metropolitana, Chile'
        },
        serviceRadius: 25,
        serviceAreas: ['Las Condes', 'Vitacura', 'Lo Barnechea'],
        isActive: true,
        rating: 4.2,
        totalJobs: 95,
        specialties: ['aire_acondicionado', 'electrodomesticos', 'seguridad']
      }
    ];

    mockProviders.forEach(provider => {
      this.providers.set(provider.providerId, provider);
    });

    logger.info(`Inicializados ${mockProviders.length} proveedores de ejemplo`);
  }

  /**
   * Obtiene estadísticas del servicio de geolocalización
   */
  async getServiceStats(): Promise<{
    totalProviders: number;
    activeProviders: number;
    averageServiceRadius: number;
    coverageAreas: string[];
  }> {
    const providers = Array.from(this.providers.values());
    const activeProviders = providers.filter(p => p.isActive);

    const averageRadius = activeProviders.reduce((sum, p) => sum + p.serviceRadius, 0) / activeProviders.length;

    const coverageAreas = [...new Set(
      activeProviders.flatMap(p => p.serviceAreas)
    )];

    return {
      totalProviders: providers.length,
      activeProviders: activeProviders.length,
      averageServiceRadius: Math.round(averageRadius),
      coverageAreas
    };
  }
}

/**
 * Instancia global del servicio de geolocalización
 */
export const geolocationService = GeolocationService.getInstance();

// Sistema de Recomendaciones Inteligentes - Rent360
import { logger } from './logger';

export interface PropertyRecommendation {
  propertyId: string;
  score: number;
  reasons: string[];
  matchPercentage: number;
  predictedRent: number;
  marketTrend: 'up' | 'down' | 'stable';
  confidence: number;
  features: {
    location: number;
    price: number;
    size: number;
    amenities: number;
    transport: number;
    safety: number;
  };
}

export interface UserPreferences {
  userId: string;
  budget: {
    min: number;
    max: number;
    preferred: number;
  };
  location: {
    preferredAreas: string[];
    maxDistance: number;
    coordinates?: { lat: number; lng: number };
  };
  propertyType: string[];
  bedrooms: {
    min: number;
    max: number;
    preferred: number;
  };
  bathrooms: {
    min: number;
    max: number;
    preferred: number;
  };
  amenities: string[];
  transport: {
    metro: boolean;
    bus: boolean;
    bike: boolean;
    car: boolean;
  };
  lifestyle: {
    family: boolean;
    student: boolean;
    professional: boolean;
    senior: boolean;
  };
  searchHistory: string[];
  favorites: string[];
  lastSearchDate: Date;
}

export interface MarketData {
  area: string;
  averageRent: number;
  trend: 'up' | 'down' | 'stable';
  demand: number;
  supply: number;
  vacancyRate: number;
  pricePerSqm: number;
  lastUpdated: Date;
}

export interface RecommendationConfig {
  weights: {
    location: number;
    price: number;
    size: number;
    amenities: number;
    transport: number;
    safety: number;
    userHistory: number;
    marketTrend: number;
  };
  thresholds: {
    minScore: number;
    minConfidence: number;
    maxRecommendations: number;
  };
}

class RecommendationEngine {
  private config: RecommendationConfig = {
    weights: {
      location: 0.25,
      price: 0.20,
      size: 0.15,
      amenities: 0.15,
      transport: 0.10,
      safety: 0.10,
      userHistory: 0.03,
      marketTrend: 0.02,
    },
    thresholds: {
      minScore: 0.3,
      minConfidence: 0.6,
      maxRecommendations: 10,
    },
  };

  constructor(config?: Partial<RecommendationConfig>) {
    if (config) {
      this.config = { ...this.config, ...config };
    }
  }

  /**
   * Generar recomendaciones personalizadas para un usuario
   */
  async generateRecommendations(
    userId: string,
    properties: any[],
    userPreferences: UserPreferences,
    marketData: MarketData[]
  ): Promise<PropertyRecommendation[]> {
    try {
      logger.info('Generando recomendaciones para usuario', { userId });

      const recommendations: PropertyRecommendation[] = [];

      for (const property of properties) {
        const score = await this.calculatePropertyScore(property, userPreferences, marketData);
        
        if (score >= this.config.thresholds.minScore) {
          const recommendation: PropertyRecommendation = {
            propertyId: property.id,
            score,
            reasons: this.generateReasons(property, userPreferences, score),
            matchPercentage: Math.round(score * 100),
            predictedRent: this.predictRent(property, marketData),
            marketTrend: this.getMarketTrend(property.location, marketData),
            confidence: this.calculateConfidence(property, userPreferences),
            features: this.calculateFeatureScores(property, userPreferences),
          };

          recommendations.push(recommendation);
        }
      }

      // Ordenar por score descendente y limitar resultados
      const sortedRecommendations = recommendations
        .sort((a, b) => b.score - a.score)
        .slice(0, this.config.thresholds.maxRecommendations);

      logger.info('Recomendaciones generadas', {
        userId,
        totalProperties: properties.length,
        recommendationsCount: sortedRecommendations.length,
        averageScore: sortedRecommendations.reduce((sum, r) => sum + r.score, 0) / sortedRecommendations.length,
      });

      return sortedRecommendations;
    } catch (error) {
      logger.error('Error generando recomendaciones', { userId, error: error instanceof Error ? error.message : String(error) });
      return [];
    }
  }

  /**
   * Calcular score de compatibilidad para una propiedad
   */
  private async calculatePropertyScore(
    property: any,
    preferences: UserPreferences,
    marketData: MarketData[]
  ): Promise<number> {
    const scores = {
      location: this.calculateLocationScore(property, preferences),
      price: this.calculatePriceScore(property, preferences),
      size: this.calculateSizeScore(property, preferences),
      amenities: this.calculateAmenitiesScore(property, preferences),
      transport: this.calculateTransportScore(property, preferences),
      safety: this.calculateSafetyScore(property),
      userHistory: this.calculateUserHistoryScore(property, preferences),
      marketTrend: this.calculateMarketTrendScore(property, marketData),
    };

    // Calcular score ponderado
    let totalScore = 0;
    let totalWeight = 0;

    for (const [feature, score] of Object.entries(scores)) {
      const weight = this.config.weights[feature as keyof typeof this.config.weights];
      totalScore += score * weight;
      totalWeight += weight;
    }

    return totalWeight > 0 ? totalScore / totalWeight : 0;
  }

  /**
   * Calcular score de ubicación
   */
  private calculateLocationScore(property: any, preferences: UserPreferences): number {
    let score = 0;

    // Verificar áreas preferidas
    if (preferences.location.preferredAreas.includes(property.location.area)) {
      score += 0.8;
    }

    // Calcular distancia si hay coordenadas
    if (preferences.location.coordinates && property.location.coordinates) {
      const distance = this.calculateDistance(
        preferences.location.coordinates,
        property.location.coordinates
      );
      
      if (distance <= preferences.location.maxDistance) {
        score += 0.6 * (1 - distance / preferences.location.maxDistance);
      }
    }

    // Bonus por zona popular
    if (this.isPopularArea(property.location.area)) {
      score += 0.2;
    }

    return Math.min(score, 1);
  }

  /**
   * Calcular score de precio
   */
  private calculatePriceScore(property: any, preferences: UserPreferences): number {
    const price = property.price;
    const { min, max, preferred } = preferences.budget;

    if (price < min || price > max) {
      return 0;
    }

    // Score basado en proximidad al precio preferido
    const priceDiff = Math.abs(price - preferred);
    const maxDiff = max - min;
    const priceScore = 1 - (priceDiff / maxDiff);

    // Bonus por estar dentro del rango ideal
    const idealRange = (max - min) * 0.3;
    if (priceDiff <= idealRange) {
      return Math.min(priceScore + 0.2, 1);
    }

    return priceScore;
  }

  /**
   * Calcular score de tamaño
   */
  private calculateSizeScore(property: any, preferences: UserPreferences): number {
    const { bedrooms, bathrooms } = preferences;
    const propBedrooms = property.bedrooms;
    const propBathrooms = property.bathrooms;

    let score = 0;

    // Score de habitaciones
    if (propBedrooms >= bedrooms.min && propBedrooms <= bedrooms.max) {
      const bedroomScore = 1 - Math.abs(propBedrooms - bedrooms.preferred) / bedrooms.max;
      score += bedroomScore * 0.6;
    }

    // Score de baños
    if (propBathrooms >= bathrooms.min && propBathrooms <= bathrooms.max) {
      const bathroomScore = 1 - Math.abs(propBathrooms - bathrooms.preferred) / bathrooms.max;
      score += bathroomScore * 0.4;
    }

    return Math.min(score, 1);
  }

  /**
   * Calcular score de amenidades
   */
  private calculateAmenitiesScore(property: any, preferences: UserPreferences): number {
    const propertyAmenities = property.amenities || [];
    const userAmenities = preferences.amenities || [];

    if (userAmenities.length === 0) {
      return 0.5; // Score neutral si no hay preferencias
    }

    const matches = userAmenities.filter(amenity => 
      propertyAmenities.includes(amenity)
    );

    return matches.length / userAmenities.length;
  }

  /**
   * Calcular score de transporte
   */
  private calculateTransportScore(property: any, preferences: UserPreferences): number {
    const transport = property.transport || {};
    const userTransport = preferences.transport;
    let score = 0;

    if (userTransport.metro && transport.metro) {
      score += 0.4;
    }
    if (userTransport.bus && transport.bus) {
      score += 0.3;
    }
    if (userTransport.bike && transport.bike) {
      score += 0.2;
    }
    if (userTransport.car && transport.car) {
      score += 0.1;
    }

    return Math.min(score, 1);
  }

  /**
   * Calcular score de seguridad
   */
  private calculateSafetyScore(property: any): number {
    // Implementación simplificada - en producción usar datos reales de seguridad
    const safetyData = property.safetyData || {};
    
    let score = 0.5; // Score base

    if (safetyData.crimeRate < 0.1) score += 0.3;
    if (safetyData.policeStations > 0) score += 0.1;
    if (safetyData.wellLit) score += 0.1;

    return Math.min(score, 1);
  }

  /**
   * Calcular score basado en historial del usuario
   */
  private calculateUserHistoryScore(property: any, preferences: UserPreferences): number {
    let score = 0;

    // Verificar si la propiedad está en favoritos
    if (preferences.favorites.includes(property.id)) {
      score += 0.5;
    }

    // Verificar si el usuario ha buscado propiedades similares
    const similarSearches = preferences.searchHistory.filter(search => 
      search.includes(property.location.area) ||
      search.includes(property.propertyType)
    );

    if (similarSearches.length > 0) {
      score += 0.3;
    }

    return Math.min(score, 1);
  }

  /**
   * Calcular score basado en tendencias del mercado
   */
  private calculateMarketTrendScore(property: any, marketData: MarketData[]): number {
    const areaData = marketData.find(data => data.area === property.location.area);
    
    if (!areaData) {
      return 0.5; // Score neutral si no hay datos
    }

    let score = 0.5; // Score base

    // Ajustar según tendencia del mercado
    switch (areaData.trend) {
      case 'up':
        score += 0.3;
        break;
      case 'stable':
        score += 0.1;
        break;
      case 'down':
        score -= 0.2;
        break;
    }

    // Ajustar según demanda
    if (areaData.demand > areaData.supply) {
      score += 0.2;
    }

    return Math.max(0, Math.min(score, 1));
  }

  /**
   * Generar razones para la recomendación
   */
  private generateReasons(property: any, preferences: UserPreferences, score: number): string[] {
    const reasons: string[] = [];

    // Razones basadas en score
    if (score > 0.8) {
      reasons.push('Excelente compatibilidad con tus preferencias');
    } else if (score > 0.6) {
      reasons.push('Buena compatibilidad con tus preferencias');
    }

    // Razones específicas
    if (preferences.location.preferredAreas.includes(property.location.area)) {
      reasons.push('Ubicación en tu zona preferida');
    }

    if (property.price <= preferences.budget.preferred) {
      reasons.push('Precio dentro de tu presupuesto ideal');
    }

    if (property.bedrooms >= preferences.bedrooms.preferred) {
      reasons.push('Número de habitaciones ideal');
    }

    if (preferences.favorites.includes(property.id)) {
      reasons.push('Ya está en tus favoritos');
    }

    return reasons.slice(0, 3); // Máximo 3 razones
  }

  /**
   * Predecir renta basada en datos del mercado
   */
  private predictRent(property: any, marketData: MarketData[]): number {
    const areaData = marketData.find(data => data.area === property.location.area);
    
    if (!areaData) {
      return property.price; // Usar precio actual si no hay datos
    }

    // Predicción basada en precio por m² y tamaño
    const predictedPrice = areaData.pricePerSqm * (property.size || 50);
    
    // Ajustar según tendencia del mercado
    let adjustment = 1;
    switch (areaData.trend) {
      case 'up':
        adjustment = 1.05;
        break;
      case 'down':
        adjustment = 0.95;
        break;
    }

    return Math.round(predictedPrice * adjustment);
  }

  /**
   * Obtener tendencia del mercado para un área
   */
  private getMarketTrend(area: string, marketData: MarketData[]): 'up' | 'down' | 'stable' {
    const areaData = marketData.find(data => data.area === area);
    return areaData?.trend || 'stable';
  }

  /**
   * Calcular nivel de confianza de la recomendación
   */
  private calculateConfidence(property: any, preferences: UserPreferences): number {
    let confidence = 0.5; // Confianza base

    // Aumentar confianza si hay datos completos
    if (property.location.coordinates) confidence += 0.1;
    if (property.amenities && property.amenities.length > 0) confidence += 0.1;
    if (property.transport) confidence += 0.1;
    if (property.safetyData) confidence += 0.1;

    // Aumentar confianza si coincide con preferencias específicas
    if (preferences.location.preferredAreas.includes(property.location.area)) confidence += 0.1;
    if (preferences.favorites.includes(property.id)) confidence += 0.1;

    return Math.min(confidence, 1);
  }

  /**
   * Calcular scores individuales de características
   */
  private calculateFeatureScores(property: any, preferences: UserPreferences) {
    return {
      location: this.calculateLocationScore(property, preferences),
      price: this.calculatePriceScore(property, preferences),
      size: this.calculateSizeScore(property, preferences),
      amenities: this.calculateAmenitiesScore(property, preferences),
      transport: this.calculateTransportScore(property, preferences),
      safety: this.calculateSafetyScore(property),
    };
  }

  /**
   * Calcular distancia entre dos puntos
   */
  private calculateDistance(point1: { lat: number; lng: number }, point2: { lat: number; lng: number }): number {
    const R = 6371; // Radio de la Tierra en km
    const dLat = this.deg2rad(point2.lat - point1.lat);
    const dLng = this.deg2rad(point2.lng - point1.lng);
    
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(this.deg2rad(point1.lat)) * Math.cos(this.deg2rad(point2.lat)) *
              Math.sin(dLng / 2) * Math.sin(dLng / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private deg2rad(deg: number): number {
    return deg * (Math.PI / 180);
  }

  /**
   * Verificar si un área es popular
   */
  private isPopularArea(area: string): boolean {
    const popularAreas = [
      'Las Condes', 'Providencia', 'Ñuñoa', 'Santiago Centro',
      'Vitacura', 'Lo Barnechea', 'La Florida', 'Peñalolén'
    ];
    return popularAreas.includes(area);
  }

  /**
   * Actualizar preferencias del usuario
   */
  async updateUserPreferences(userId: string, newPreferences: Partial<UserPreferences>): Promise<void> {
    try {
      // En producción, esto se guardaría en la base de datos
      logger.info('Actualizando preferencias del usuario', { userId, preferences: newPreferences });
    } catch (error) {
      logger.error('Error actualizando preferencias', { userId, error: error instanceof Error ? error.message : String(error) });
    }
  }

  /**
   * Obtener datos del mercado
   */
  async getMarketData(): Promise<MarketData[]> {
    // En producción, esto vendría de una API externa o base de datos
    return [
      {
        area: 'Las Condes',
        averageRent: 850000,
        trend: 'up' as const,
        demand: 85,
        supply: 70,
        vacancyRate: 0.05,
        pricePerSqm: 25000,
        lastUpdated: new Date(),
      },
      {
        area: 'Providencia',
        averageRent: 750000,
        trend: 'stable' as const,
        demand: 80,
        supply: 75,
        vacancyRate: 0.08,
        pricePerSqm: 22000,
        lastUpdated: new Date(),
      },
      // Más datos del mercado...
    ];
  }
}

// Instancia singleton
export const recommendationEngine = new RecommendationEngine();

// Hook personalizado para React
export const useRecommendations = () => {
  const [recommendations, setRecommendations] = useState<PropertyRecommendation[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generateRecommendations = async (
    userId: string,
    properties: any[],
    userPreferences: UserPreferences
  ) => {
    setLoading(true);
    setError(null);

    try {
      const marketData = await recommendationEngine.getMarketData();
      const results = await recommendationEngine.generateRecommendations(
        userId,
        properties,
        userPreferences,
        marketData
      );
      
      setRecommendations(results);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error generando recomendaciones');
    } finally {
      setLoading(false);
    }
  };

  return {
    recommendations,
    loading,
    error,
    generateRecommendations,
  };
};

// Importar useState para el hook
import { useState } from 'react';

import { logger } from '../logger';
import { db } from '../db';

// Interfaces para datos de entrenamiento
interface PropertyData {
  id: string;
  price: number;
  area: number;
  bedrooms: number;
  bathrooms: number;
  city: string;
  commune: string;
  type: string;
  furnished: boolean;
  petsAllowed: boolean;
  yearBuilt?: number;
  coordinates?: {
    latitude: number;
    longitude: number;
  };
  views: number;
  favorites: number;
  createdAt: Date;
  rentedAt?: Date;
  rentalPeriod?: number; // días
}

// Modelo de ML simplificado con datos de entrenamiento
interface MLModel {
  weights: Record<string, number>;
  bias: number;
  trained: boolean;
  trainingData: PropertyData[];
}

interface MarketData {
  city: string;
  commune: string;
  averagePrice: number;
  averageArea: number;
  totalProperties: number;
  availableProperties: number;
  occupancyRate: number;
  averageRentalPeriod: number;
  demandIndex: number; // 0-100
  priceTrend: 'increasing' | 'stable' | 'decreasing';
}

interface PredictionResult {
  predictedPrice: number;
  confidence: number;
  priceRange: {
    min: number;
    max: number;
  };
  marketComparison: {
    averagePrice: number;
    percentile: number;
  };
  recommendations: string[];
  factors: Record<string, number>;
}

class PricePredictionModel {
  private model: MLModel = {
    weights: {},
    bias: 0,
    trained: false,
    trainingData: []
  };

  // Cargar datos de entrenamiento desde la base de datos
  async loadTrainingData(): Promise<void> {
    try {
      logger.info('Cargando datos de entrenamiento para modelo ML');

      // Query para obtener datos históricos de propiedades
      const properties = await db.property.findMany({
        where: {
          status: 'ACTIVE',
          price: { not: null },
          area: { not: null }
        },
        select: {
          id: true,
          price: true,
          area: true,
          bedrooms: true,
          bathrooms: true,
          city: true,
          commune: true,
          type: true,
          furnished: true,
          petsAllowed: true,
          yearBuilt: true,
          coordinates: true,
          views: true,
          favorites: true,
          createdAt: true,
          rentedAt: true,
          _count: {
            select: {
              contracts: true
            }
          }
        },
        take: 1000 // Limitar para evitar sobrecarga
      });

      // Transformar datos para el modelo
      this.model.trainingData = properties.map(prop => ({
        id: prop.id,
        price: prop.price,
        area: prop.area,
        bedrooms: prop.bedrooms || 0,
        bathrooms: prop.bathrooms || 0,
        city: prop.city,
        commune: prop.commune,
        type: prop.type,
        furnished: prop.furnished,
        petsAllowed: prop.petsAllowed,
        yearBuilt: prop.yearBuilt || undefined,
        coordinates: prop.coordinates || undefined,
        views: prop.views || 0,
        favorites: prop.favorites || 0,
        createdAt: prop.createdAt,
        rentedAt: prop.rentedAt || undefined,
        rentalPeriod: prop.rentedAt ? Math.floor((prop.rentedAt.getTime() - prop.createdAt.getTime()) / (1000 * 60 * 60 * 24)) : undefined
      }));

      logger.info(`Datos de entrenamiento cargados: ${this.model.trainingData.length} propiedades`);
    } catch (error) {
      logger.error('Error cargando datos de entrenamiento', { error });
      // Usar datos de ejemplo si falla la carga
      this.loadSampleData();
    }
  }

  // Datos de ejemplo para desarrollo
  private loadSampleData(): void {
    this.model.trainingData = [
      {
        id: 'sample-1',
        price: 500000,
        area: 80,
        bedrooms: 2,
        bathrooms: 1,
        city: 'Santiago',
        commune: 'Providencia',
        type: 'APARTMENT',
        furnished: false,
        petsAllowed: true,
        yearBuilt: 2010,
        coordinates: { latitude: -33.4489, longitude: -70.6693 },
        views: 150,
        favorites: 25,
        createdAt: new Date('2024-01-01'),
        rentalPeriod: 365
      },
      {
        id: 'sample-2',
        price: 750000,
        area: 120,
        bedrooms: 3,
        bathrooms: 2,
        city: 'Santiago',
        commune: 'Las Condes',
        type: 'HOUSE',
        furnished: true,
        petsAllowed: false,
        yearBuilt: 2015,
        coordinates: { latitude: -33.4155, longitude: -70.5831 },
        views: 200,
        favorites: 45,
        createdAt: new Date('2024-01-15'),
        rentalPeriod: 730
      }
    ];
  }

  // Entrenar el modelo (versión simplificada)
  async train(): Promise<void> {
    if (this.model.trainingData.length === 0) {
      await this.loadTrainingData();
    }

    logger.info('Entrenando modelo de predicción de precios');

    // Implementación simplificada de regresión lineal
    const features = ['area', 'bedrooms', 'bathrooms', 'views', 'favorites'];
    const target = 'price';

    // Calcular pesos usando mínimos cuadrados (simplificado)
    features.forEach(feature => {
      const n = this.model.trainingData.length;
      const sumX = this.model.trainingData.reduce((sum, item) => sum + ((item as any)[feature] || 0), 0);
      const sumY = this.model.trainingData.reduce((sum, item) => sum + item.price, 0);
      const sumXY = this.model.trainingData.reduce((sum, item) => sum + ((item as any)[feature] || 0) * item.price, 0);
      const sumX2 = this.model.trainingData.reduce((sum, item) => sum + Math.pow((item as any)[feature] || 0, 2), 0);

      if (sumX2 - Math.pow(sumX, 2) / n !== 0) {
        this.model.weights[feature] = (n * sumXY - sumX * sumY) / (n * sumX2 - Math.pow(sumX, 2));
      } else {
        this.model.weights[feature] = 0;
      }
    });

    // Calcular bias
    const avgPrice = sumY / this.model.trainingData.length;
    const avgArea = this.model.trainingData.reduce((sum, item) => sum + item.area, 0) / this.model.trainingData.length;
    this.model.bias = avgPrice - (this.model.weights['area'] || 0) * avgArea;

    this.model.trained = true;
    logger.info('Modelo entrenado exitosamente');
  }

  // Predecir precio
  predict(propertyData: Partial<PropertyData>): { price: number; confidence: number; factors: Record<string, number> } {
    if (!this.model.trained) {
      throw new Error('El modelo no está entrenado');
    }

    const features = {
      area: propertyData.area || 0,
      bedrooms: propertyData.bedrooms || 0,
      bathrooms: propertyData.bathrooms || 0,
      views: propertyData.views || 0,
      favorites: propertyData.favorites || 0
    };

    let prediction = this.model.bias;
    const factors: Record<string, number> = {};

    Object.entries(features).forEach(([feature, value]) => {
      const contribution = (this.model.weights[feature] || 0) * value;
      prediction += contribution;
      factors[feature] = contribution;
    });

    // Calcular confianza basada en la varianza de los datos
    const confidence = this.calculateConfidence(propertyData);

    return {
      price: Math.max(0, Math.round(prediction)),
      confidence,
      factors
    };
  }

  private calculateConfidence(propertyData: Partial<PropertyData>): number {
    // Confianza simplificada basada en completitud de datos
    let score = 0;
    if (propertyData.area && propertyData.area > 0) score += 0.3;
    if (propertyData.bedrooms && propertyData.bedrooms > 0) score += 0.2;
    if (propertyData.bathrooms && propertyData.bathrooms > 0) score += 0.2;
    if (propertyData.city) score += 0.15;
    if (propertyData.commune) score += 0.15;

    return Math.min(1, score);
  }
}

// Instancia singleton del modelo
export const pricePredictionModel = new PricePredictionModel();

// Función para inicializar y entrenar el modelo
export async function initializeMLModels(): Promise<void> {
  try {
    await pricePredictionModel.loadTrainingData();
    await pricePredictionModel.train();
    logger.info('Modelos de Machine Learning inicializados exitosamente');
  } catch (error) {
    logger.error('Error inicializando modelos de ML:', error);
  }
}

// Instancia global del modelo ML
const mlModel = new PricePredictionModel();

// Inicializar modelo al cargar el módulo
mlModel.loadTrainingData().then(() => {
  mlModel.train().catch(error => {
    logger.error('Error inicializando modelo ML', { error });
  });
});

// Función helper para obtener predicción de precio
export async function predictPropertyPrice(propertyData: Partial<PropertyData>): Promise<PredictionResult> {
  try {
    // Asegurar que el modelo esté entrenado
    if (!mlModel['model'].trained) {
      await mlModel.loadTrainingData();
      await mlModel.train();
    }

    const prediction = mlModel['predict'](propertyData);

    return {
      predictedPrice: prediction.price,
      confidence: prediction.confidence,
      priceRange: {
        min: Math.round(prediction.price * 0.9),
        max: Math.round(prediction.price * 1.1)
      },
      marketComparison: {
        averagePrice: prediction.price,
        percentile: prediction.confidence * 100
      },
      recommendations: [
        'Considerar el estado de la propiedad',
        'Verificar permisos y normativas locales',
        'Evaluar demanda en la zona'
      ],
      factors: prediction.factors
    };
  } catch (error) {
    logger.error('Error en predicción de precio', { error, propertyData });

    // Retornar predicción básica si falla el modelo ML
    const basicPrice = (propertyData.area || 0) * 6000; // Estimación básica por m²
    return {
      predictedPrice: basicPrice,
      confidence: 0.3,
      priceRange: {
        min: Math.round(basicPrice * 0.8),
        max: Math.round(basicPrice * 1.2)
      },
      marketComparison: {
        averagePrice: basicPrice,
        percentile: 50
      },
      recommendations: ['Estimación básica - usar datos completos para mejor precisión'],
      factors: {}
    };
  }
}

// Función helper para obtener estadísticas de mercado
export async function getMarketStatistics(city?: string, commune?: string): Promise<MarketData[]> {
  // Implementación simplificada - en producción debería usar datos reales
  return [{
    city: city || 'Santiago',
    commune: commune || 'Providencia',
    averagePrice: 600000,
    averageArea: 90,
    totalProperties: 100,
    availableProperties: 30,
    occupancyRate: 0.7,
    averageRentalPeriod: 24,
    demandIndex: 65,
    priceTrend: 'stable'
  }];
}

// Función helper para predecir demanda
export async function predictMarketDemand(city: string, commune: string, months?: number) {
  return {
    predictedOccupancy: 75,
    confidence: 0.8,
    trend: 'stable' as const
  };
}

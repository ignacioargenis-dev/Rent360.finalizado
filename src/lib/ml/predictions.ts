import { logger } from '../logger';
import { db } from '../db';
import { cacheManager, CacheKeys, MARKET_STATS_TTL, withCache } from '../cache';

// Interfaces para datos de entrenamiento
interface PropertyData {
  id: string;
  price: number;
  deposit: number;
  area: number;
  bedrooms: number;
  bathrooms: number;
  city: string;
  commune: string;
  region: string;
  type: string;
  views: number;
  inquiries: number;
  age: number; // Edad en días
  pricePerSqm: number; // Precio por metro cuadrado
  depositRatio: number; // Relación depósito/precio
  hasParking: boolean;
  hasGarden: boolean;
  hasPool: boolean;
  isFurnished: boolean; // Extraído de features JSON
  petsAllowed: boolean; // Extraído de features JSON
  yearBuilt: number; // Estimado basado en edad
  contractCount: number;
  reviewCount: number;
  favoriteCount: number;
  visitCount: number;
  maintenanceCount: number;
  createdAt: Date;
}

// Modelo de ML avanzado con múltiples características
interface MLModel {
  weights: Record<string, number>;
  bias: number;
  trained: boolean;
  trainingData: PropertyData[];
  featureImportance: Record<string, number>;
  modelMetrics: {
    r2: number;
    mse: number;
    mae: number;
    accuracy: number;
  };
  lastTrained: Date;
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
    trainingData: [],
    featureImportance: {},
    modelMetrics: {
      r2: 0,
      mse: 0,
      mae: 0,
      accuracy: 0
    },
    lastTrained: new Date()
  };

  // Cargar datos de entrenamiento desde la base de datos
  async loadTrainingData(): Promise<void> {
    try {
      logger.info('Cargando datos de entrenamiento para modelo ML');

      // Query para obtener datos históricos de propiedades
      const properties = await db.property.findMany({
        where: {
          status: 'ACTIVE'
        },
        select: {
          id: true,
          price: true,
          deposit: true,
          area: true,
          bedrooms: true,
          bathrooms: true,
          city: true,
          commune: true,
          region: true,
          type: true,
          images: true,
          features: true,
          views: true,
          inquiries: true,
          createdAt: true,
          updatedAt: true,
          _count: {
            select: {
              contracts: true,
              reviews: true,
              propertyFavorites: true,
              visits: true,
              maintenance: true
            }
          }
        },
        take: 1000 // Limitar para evitar sobrecarga
      });

      // Transformar datos para el modelo
      this.model.trainingData = properties.map(prop => {
        const age = Math.floor((Date.now() - prop.createdAt.getTime()) / (1000 * 60 * 60 * 24)); // Edad en días
        const pricePerSqm = prop.area > 0 ? prop.price / prop.area : 0;
        const depositRatio = prop.deposit > 0 ? prop.deposit / prop.price : 0;

        // Extraer características del campo features (JSON)
        let hasParking = false;
        let hasGarden = false;
        let hasPool = false;
        let isFurnished = false;
        let petsAllowed = false;

        try {
          if (prop.features) {
            const features = JSON.parse(prop.features);
            hasParking = features.includes('parking') || features.includes('estacionamiento');
            hasGarden = features.includes('garden') || features.includes('jardín');
            hasPool = features.includes('pool') || features.includes('piscina');
            isFurnished = features.includes('furnished') || features.includes('amoblado');
            petsAllowed = features.includes('pets') || features.includes('mascotas');
          }
        } catch (e) {
          // Ignorar errores de parsing
        }

        // Calcular antigüedad aproximada basada en createdAt (simplificación)
        const yearBuilt = 2020 - Math.floor(age / 365); // Estimación simple

        return {
          id: prop.id,
          price: prop.price,
          deposit: prop.deposit,
          area: prop.area,
          bedrooms: prop.bedrooms || 0,
          bathrooms: prop.bathrooms || 0,
          city: prop.city,
          commune: prop.commune,
          region: prop.region,
          type: prop.type,
          views: prop.views || 0,
          inquiries: prop.inquiries || 0,
          age: age,
          pricePerSqm: pricePerSqm,
          depositRatio: depositRatio,
          hasParking: hasParking,
          hasGarden: hasGarden,
          hasPool: hasPool,
          isFurnished: isFurnished,
          petsAllowed: petsAllowed,
          yearBuilt: yearBuilt,
          contractCount: prop._count.contracts || 0,
          reviewCount: prop._count.reviews || 0,
          favoriteCount: prop._count.propertyFavorites || 0,
          visitCount: prop._count.visits || 0,
          maintenanceCount: prop._count.maintenance || 0,
          createdAt: prop.createdAt
        };
      });

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
        deposit: 500000,
        area: 80,
        bedrooms: 2,
        bathrooms: 1,
        city: 'Santiago',
        commune: 'Providencia',
        region: 'Metropolitana',
        type: 'APARTMENT',
        views: 150,
        inquiries: 12,
        age: 90,
        pricePerSqm: 6250,
        depositRatio: 1.0,
        hasParking: true,
        hasGarden: false,
        hasPool: false,
        isFurnished: false,
        petsAllowed: true,
        yearBuilt: 2023,
        contractCount: 2,
        reviewCount: 8,
        favoriteCount: 25,
        visitCount: 35,
        maintenanceCount: 1,
        createdAt: new Date('2024-01-01')
      },
      {
        id: 'sample-2',
        price: 750000,
        deposit: 750000,
        area: 120,
        bedrooms: 3,
        bathrooms: 2,
        city: 'Santiago',
        commune: 'Las Condes',
        region: 'Metropolitana',
        type: 'HOUSE',
        views: 200,
        inquiries: 18,
        age: 75,
        pricePerSqm: 6250,
        depositRatio: 1.0,
        hasParking: true,
        hasGarden: true,
        hasPool: true,
        isFurnished: true,
        petsAllowed: false,
        yearBuilt: 2023,
        contractCount: 1,
        reviewCount: 12,
        favoriteCount: 45,
        visitCount: 50,
        maintenanceCount: 0,
        createdAt: new Date('2024-01-15')
      },
      {
        id: 'sample-3',
        price: 350000,
        deposit: 350000,
        area: 60,
        bedrooms: 1,
        bathrooms: 1,
        city: 'Santiago',
        commune: 'Ñuñoa',
        region: 'Metropolitana',
        type: 'APARTMENT',
        views: 80,
        inquiries: 6,
        age: 120,
        pricePerSqm: 5833,
        depositRatio: 1.0,
        hasParking: false,
        hasGarden: false,
        hasPool: false,
        isFurnished: true,
        petsAllowed: true,
        yearBuilt: 2023,
        contractCount: 3,
        reviewCount: 5,
        favoriteCount: 15,
        visitCount: 20,
        maintenanceCount: 2,
        createdAt: new Date('2023-12-15')
      }
    ];
  }

  // Entrenar el modelo con algoritmo mejorado
  async train(): Promise<void> {
    if (this.model.trainingData.length === 0) {
      await this.loadTrainingData();
    }

    if (this.model.trainingData.length < 10) {
      logger.warn('Datos de entrenamiento insuficientes para modelo ML');
      return;
    }

    logger.info('Entrenando modelo avanzado de predicción de precios');

    // Características ampliadas para mejor precisión
    const features = [
      'area', 'bedrooms', 'bathrooms', 'views', 'inquiries',
      'age', 'pricePerSqm', 'depositRatio', 'hasParking', 'hasGarden',
      'hasPool', 'isFurnished', 'petsAllowed', 'yearBuilt',
      'contractCount', 'reviewCount', 'visitCount'
    ];

    const n = this.model.trainingData.length;
    const target = 'price';

    // Implementación de regresión lineal múltiple
    const sumY = this.model.trainingData.reduce((sum, item) => sum + item.price, 0);

    features.forEach(feature => {
      const sumX = this.model.trainingData.reduce((sum, item) => {
        let value = (item as any)[feature];
        // Las propiedades booleanas ya están correctamente tipadas como 0/1
        return sum + (value || 0);
      }, 0);
      const sumXY = this.model.trainingData.reduce((sum, item) => {
        let value = (item as any)[feature];
        // Las propiedades booleanas ya están correctamente tipadas como 0/1
        return sum + (value || 0) * item.price;
      }, 0);

      const sumX2 = this.model.trainingData.reduce((sum, item) => {
        let value = (item as any)[feature];
        // Las propiedades booleanas ya están correctamente tipadas como 0/1
        return sum + Math.pow(value || 0, 2);
      }, 0);

      if (sumX2 - Math.pow(sumX, 2) / n !== 0) {
        this.model.weights[feature] = (n * sumXY - sumX * sumY) / (n * sumX2 - Math.pow(sumX, 2));
      } else {
        this.model.weights[feature] = 0;
      }

      // Calcular importancia de la característica
      this.model.featureImportance[feature] = Math.abs(this.model.weights[feature]);
    });

    // Calcular bias usando promedio ponderado
    const avgPrice = sumY / n;
    const avgArea = this.model.trainingData.reduce((sum, item) => sum + item.area, 0) / n;
    this.model.bias = avgPrice - (this.model.weights['area'] || 0) * avgArea;

    // Calcular métricas del modelo
    this.calculateModelMetrics();

    this.model.trained = true;
    this.model.lastTrained = new Date();

    logger.info('Modelo entrenado exitosamente', {
      features: features.length,
      trainingData: n,
      r2: this.model.modelMetrics.r2.toFixed(3)
    });
  }

  // Calcular métricas del modelo (R², MSE, MAE)
  private calculateModelMetrics(): void {
    const n = this.model.trainingData.length;
    const actualPrices = this.model.trainingData.map(item => item.price);
    const predictedPrices = this.model.trainingData.map(item => this.predictPrice(item));

    // Calcular MSE (Mean Squared Error)
    const mse = actualPrices.reduce((sum, actual, i) =>
      sum + Math.pow(actual - (predictedPrices[i]!), 2), 0) / n;

    // Calcular MAE (Mean Absolute Error)
    const mae = actualPrices.reduce((sum, actual, i) =>
      sum + Math.abs(actual - (predictedPrices[i]!)), 0) / n;

    // Calcular R² (Coeficiente de determinación)
    const avgPrice = actualPrices.reduce((sum, price) => sum + price, 0) / n;
    const ssRes = actualPrices.reduce((sum, actual, i) =>
      sum + Math.pow(actual - (predictedPrices[i]!), 2), 0);
    const ssTot = actualPrices.reduce((sum, actual) =>
      sum + Math.pow(actual - avgPrice, 2), 0);
    const r2 = ssTot !== 0 ? 1 - (ssRes / ssTot) : 0;

    // Calcular precisión (porcentaje de predicciones dentro del 20% del precio real)
    const accuracy = actualPrices.reduce((count, actual, i) => {
      const diff = Math.abs(actual - (predictedPrices[i]!)) / actual;
      return count + (diff <= 0.2 ? 1 : 0);
    }, 0) / n;

    this.model.modelMetrics = { r2, mse, mae, accuracy };
  }

  // Método auxiliar para predecir precio (sin validaciones)
  private predictPrice(propertyData: Partial<PropertyData>): number {
    const features = {
      area: propertyData.area || 0,
      bedrooms: propertyData.bedrooms || 0,
      bathrooms: propertyData.bathrooms || 0,
      views: propertyData.views || 0,
      inquiries: propertyData.inquiries || 0,
      age: propertyData.age || 0,
      pricePerSqm: propertyData.pricePerSqm || 0,
      depositRatio: propertyData.depositRatio || 0,
      hasParking: propertyData.hasParking ? 1 : 0,
      hasGarden: propertyData.hasGarden ? 1 : 0,
      hasPool: propertyData.hasPool ? 1 : 0,
      isFurnished: propertyData.isFurnished ? 1 : 0,
      petsAllowed: propertyData.petsAllowed ? 1 : 0,
      yearBuilt: propertyData.yearBuilt || 2020,
      contractCount: propertyData.contractCount || 0,
      reviewCount: propertyData.reviewCount || 0,
      visitCount: propertyData.visitCount || 0
    };

    let prediction = this.model.bias;
    Object.entries(features).forEach(([feature, value]) => {
      prediction += (this.model.weights[feature] || 0) * value;
    });

    return Math.max(0, prediction);
  }

  // Predecir precio con modelo mejorado
  predict(propertyData: Partial<PropertyData>): { price: number; confidence: number; factors: Record<string, number>; modelInfo: any } {
    if (!this.model.trained) {
      throw new Error('El modelo no está entrenado');
    }

    // Características ampliadas
    const features = {
      area: propertyData.area || 0,
      bedrooms: propertyData.bedrooms || 0,
      bathrooms: propertyData.bathrooms || 0,
      views: propertyData.views || 0,
      inquiries: propertyData.inquiries || 0,
      age: propertyData.age || 0,
      pricePerSqm: propertyData.pricePerSqm || 0,
      depositRatio: propertyData.depositRatio || 0,
      hasParking: propertyData.hasParking ? 1 : 0,
      hasGarden: propertyData.hasGarden ? 1 : 0,
      hasPool: propertyData.hasPool ? 1 : 0,
      isFurnished: propertyData.isFurnished ? 1 : 0,
      petsAllowed: propertyData.petsAllowed ? 1 : 0,
      yearBuilt: propertyData.yearBuilt || 2020,
      contractCount: propertyData.contractCount || 0,
      reviewCount: propertyData.reviewCount || 0,
      visitCount: propertyData.visitCount || 0
    };

    let prediction = this.model.bias;
    const factors: Record<string, number> = {};

    // Calcular contribución de cada característica
    Object.entries(features).forEach(([feature, value]) => {
      const contribution = (this.model.weights[feature] || 0) * value;
      prediction += contribution;
      factors[feature] = contribution;
    });

    // Calcular confianza avanzada
    const confidence = this.calculateAdvancedConfidence(propertyData, prediction);

    // Normalizar factores para mostrar importancia relativa
    const maxFactor = Math.max(...Object.values(factors).map(Math.abs));
    const normalizedFactors: Record<string, number> = {};
    if (maxFactor > 0) {
      Object.entries(factors).forEach(([feature, value]) => {
        normalizedFactors[feature] = value / maxFactor;
      });
    }

    return {
      price: Math.max(0, Math.round(prediction)),
      confidence,
      factors: normalizedFactors,
      modelInfo: {
        trainedAt: this.model.lastTrained,
        trainingDataSize: this.model.trainingData.length,
        modelAccuracy: this.model.modelMetrics.accuracy,
        r2: this.model.modelMetrics.r2
      }
    };
  }

  private calculateAdvancedConfidence(propertyData: Partial<PropertyData>, prediction: number): number {
    let confidence = 0.5; // Confianza base

    // Evaluar completitud de datos críticos
    if (propertyData.area && propertyData.area > 0) confidence += 0.15;
    if (propertyData.bedrooms && propertyData.bedrooms >= 0) confidence += 0.1;
    if (propertyData.bathrooms && propertyData.bathrooms >= 0) confidence += 0.1;
    if (propertyData.city) confidence += 0.1;
    if (propertyData.commune) confidence += 0.1;

    // Evaluar características adicionales
    if (propertyData.inquiries !== undefined) confidence += 0.03;
    if (propertyData.age !== undefined) confidence += 0.03;
    if (propertyData.pricePerSqm !== undefined) confidence += 0.03;
    if (propertyData.contractCount !== undefined) confidence += 0.03;
    if (propertyData.hasParking !== undefined) confidence += 0.02;
    if (propertyData.hasGarden !== undefined) confidence += 0.02;
    if (propertyData.isFurnished !== undefined) confidence += 0.02;
    if (propertyData.petsAllowed !== undefined) confidence += 0.02;

    // Evaluar métricas del modelo
    if (this.model.modelMetrics.r2 > 0.7) confidence += 0.1;
    if (this.model.modelMetrics.accuracy > 0.8) confidence += 0.1;

    // Evaluar tamaño del conjunto de entrenamiento
    if (this.model.trainingData.length > 100) confidence += 0.1;
    else if (this.model.trainingData.length < 20) confidence -= 0.2;

    // Ajustar basado en la variabilidad de precios similares
    const similarProperties = this.findSimilarProperties(propertyData);
    if (similarProperties.length > 5) {
      const priceVariance = this.calculatePriceVariance(similarProperties);
      if (priceVariance < 0.3) confidence += 0.1; // Precios consistentes
    }

    return Math.min(1, Math.max(0, confidence));
  }

  private findSimilarProperties(propertyData: Partial<PropertyData>): PropertyData[] {
    if (!propertyData.area) return [];

    return this.model.trainingData.filter(item => {
      const areaDiff = Math.abs((item.area - (propertyData.area || 0)) / (propertyData.area || 1));
      return areaDiff < 0.2; // Dentro del 20% del área
    });
  }

  private calculatePriceVariance(properties: PropertyData[]): number {
    if (properties.length < 2) return 1;

    const prices = properties.map(p => p.price);
    const mean = prices.reduce((sum, price) => sum + price, 0) / prices.length;
    const variance = prices.reduce((sum, price) => sum + Math.pow(price - mean, 2), 0) / prices.length;

    return Math.sqrt(variance) / mean; // Coeficiente de variación
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
    logger.error('Error inicializando modelos de ML', { error: error instanceof Error ? error.message : String(error) });
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

// Función helper para obtener predicción de precio con modelo mejorado
export async function predictPropertyPrice(propertyData: Partial<PropertyData>): Promise<PredictionResult> {
  try {
    // Asegurar que el modelo esté entrenado
    if (!mlModel['model'].trained) {
      await mlModel.loadTrainingData();
      await mlModel.train();
    }

    const prediction = mlModel['predict'](propertyData);

    // Obtener estadísticas de mercado reales
    const marketStats = await getMarketStatistics(propertyData.city, propertyData.commune);
    const marketData = marketStats[0] || {
      averagePrice: prediction.price,
      totalProperties: 100,
      occupancyRate: 0.7
    };

    // Generar recomendaciones inteligentes
    const recommendations = generateSmartRecommendations(propertyData, prediction, marketData);

    return {
      predictedPrice: prediction.price,
      confidence: prediction.confidence,
      priceRange: {
        min: Math.round(prediction.price * (0.9 - (1 - prediction.confidence) * 0.2)),
        max: Math.round(prediction.price * (1.1 + (1 - prediction.confidence) * 0.2))
      },
      marketComparison: {
        averagePrice: marketData.averagePrice,
        percentile: Math.round(prediction.price > marketData.averagePrice ?
          75 + (prediction.confidence * 25) : 25 + (prediction.confidence * 25))
      },
      recommendations,
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

// Función para generar recomendaciones inteligentes
function generateSmartRecommendations(
  propertyData: Partial<PropertyData>,
  prediction: any,
  marketData: MarketData
): string[] {
  const recommendations: string[] = [];

  // Recomendaciones basadas en factores del modelo
  if (prediction.factors) {
    const topFactors = Object.entries(prediction.factors)
      .sort(([,a], [,b]) => Math.abs(b) - Math.abs(a))
      .slice(0, 3);

    if (topFactors.some(([factor]) => factor === 'area')) {
      recommendations.push('El área es un factor determinante del precio');
    }
    if (topFactors.some(([factor]) => factor === 'isFurnished' && prediction.factors.isFurnished > 0)) {
      recommendations.push('Las propiedades amobladas tienen mayor valor de mercado');
    }
  }

  // Recomendaciones basadas en comparación con mercado
  const priceDiff = ((prediction.price - marketData.averagePrice) / marketData.averagePrice) * 100;
  if (Math.abs(priceDiff) > 20) {
    if (priceDiff > 0) {
      recommendations.push(`Precio estimado ${Math.round(Math.abs(priceDiff))}% por encima del promedio del mercado`);
    } else {
      recommendations.push(`Precio estimado ${Math.round(Math.abs(priceDiff))}% por debajo del promedio del mercado`);
    }
  }

  // Recomendaciones basadas en datos faltantes
  if (!propertyData.isFurnished) {
    recommendations.push('Especificar si la propiedad está amoblada mejoraría la precisión');
  }
  if (!propertyData.yearBuilt) {
    recommendations.push('Incluir el año de construcción optimizaría la estimación');
  }

  // Recomendaciones generales
  recommendations.push('Verificar permisos y normativas locales antes de fijar precio');
  recommendations.push('Considerar el estado actual de la propiedad y posibles renovaciones');

  return recommendations.slice(0, 5); // Máximo 5 recomendaciones
}

// Función helper para obtener estadísticas de mercado reales con cache
export async function getMarketStatistics(city?: string, commune?: string): Promise<MarketData[]> {
  const cacheKey = CacheKeys.MARKET_STATS(city || 'all', commune);

  return withCache(
    cacheKey,
    async () => {
      try {
        logger.info('Calculando estadísticas de mercado', { city, commune });

        // Construir filtros para consulta
        const whereClause: any = {};
        if (city) whereClause.city = city;
        if (commune) whereClause.commune = commune;

        // Obtener propiedades del área especificada
        const properties = await db.property.findMany({
          where: {
            ...whereClause,
            price: { not: { equals: null } },
            area: { not: { equals: null } }
          },
          select: {
            price: true,
            area: true,
            status: true,
            createdAt: true,
            rentedAt: true,
            _count: {
              select: { contracts: true }
            }
          }
        });

        if (properties.length === 0) {
          // Si no hay datos específicos, calcular estadísticas generales
          const allProperties = await db.property.findMany({
            where: {
              price: { not: { equals: null } },
              area: { not: { equals: null } }
            },
            select: {
              price: true,
              area: true,
              status: true,
              city: true,
              commune: true,
              createdAt: true,
              rentedAt: true,
              _count: {
                select: { contracts: true }
              }
            }
          });

          return calculateMarketStats(allProperties, city, commune);
        }

        return calculateMarketStats(properties, city, commune);
      } catch (error) {
        logger.error('Error calculando estadísticas de mercado', { error, city, commune });
        throw error; // Re-throw para que el cache no guarde datos erróneos
      }
    },
    MARKET_STATS_TTL
  ).catch(error => {
    logger.error('Error obteniendo estadísticas de mercado', { error, city, commune });

    // Retornar datos por defecto en caso de error
    return [{
      city: city || 'Santiago',
      commune: commune || 'Providencia',
      averagePrice: 600000,
      averageArea: 90,
      totalProperties: 50,
      availableProperties: 15,
      occupancyRate: 0.7,
      averageRentalPeriod: 24,
      demandIndex: 65,
      priceTrend: 'stable' as const
    }];
  });
}

// Función auxiliar para calcular estadísticas de mercado
async function calculateMarketStats(properties: any[], city?: string, commune?: string): Promise<MarketData[]> {
  if (properties.length === 0) return [];

  // Calcular estadísticas básicas
  const totalProperties = properties.length;
  const availableProperties = properties.filter(p => p.status === 'AVAILABLE').length;
  const rentedProperties = properties.filter(p => p.status === 'RENTED').length;
  const occupancyRate = totalProperties > 0 ? rentedProperties / totalProperties : 0;

  // Calcular precios promedio
  const prices = properties.map(p => p.price).filter(p => p > 0);
  const averagePrice = prices.length > 0
    ? prices.reduce((sum, price) => sum + price, 0) / prices.length
    : 600000;

  // Calcular áreas promedio
  const areas = properties.map(p => p.area).filter(a => a > 0);
  const averageArea = areas.length > 0
    ? areas.reduce((sum, area) => sum + area, 0) / areas.length
    : 90;

  // Calcular período de alquiler promedio
  const rentalPeriods = properties
    .filter(p => p.rentedAt && p.createdAt)
    .map(p => Math.floor((p.rentedAt.getTime() - p.createdAt.getTime()) / (1000 * 60 * 60 * 24)));
  const averageRentalPeriod = rentalPeriods.length > 0
    ? rentalPeriods.reduce((sum, period) => sum + period, 0) / rentalPeriods.length
    : 30;

  // Calcular índice de demanda basado en contratos recientes
  const recentContracts = properties.filter(p => {
    if (!p.createdAt) return false;
    const daysSinceCreation = (Date.now() - p.createdAt.getTime()) / (1000 * 60 * 60 * 24);
    return daysSinceCreation <= 90; // Últimos 90 días
  }).reduce((sum, p) => sum + p._count.contracts, 0);

  const demandIndex = Math.min(100, Math.max(0, (recentContracts / totalProperties) * 100));

  // Determinar tendencia de precios (simplificada)
  const priceTrend: 'increasing' | 'stable' | 'decreasing' = 'stable';

  return [{
    city: city || properties[0]?.city || 'Santiago',
    commune: commune || properties[0]?.commune || 'Providencia',
    averagePrice: Math.round(averagePrice),
    averageArea: Math.round(averageArea),
    totalProperties,
    availableProperties,
    occupancyRate,
    averageRentalPeriod: Math.round(averageRentalPeriod),
    demandIndex: Math.round(demandIndex),
    priceTrend
  }];
}

// Función helper para predecir demanda usando datos reales
export async function predictMarketDemand(city: string, commune: string, months: number = 3) {
  try {
    logger.info('Prediciendo demanda de mercado', { city, commune, months });

    // Obtener datos históricos de contratos
    const contracts = await db.contract.findMany({
      where: {
        property: {
          city: city,
          commune: commune
        },
        createdAt: {
          gte: new Date(Date.now() - (months * 30 * 24 * 60 * 60 * 1000)) // Últimos N meses
        }
      },
      select: {
        createdAt: true,
        status: true
      }
    });

    if (contracts.length < 5) {
      // Si hay pocos datos, usar estimación por defecto
      return {
        predictedOccupancy: 70,
        confidence: 0.5,
        trend: 'stable' as const
      };
    }

    // Calcular tasa de contratos por mes
    const contractsPerMonth = contracts.length / months;
    const activeContracts = contracts.filter(c => ['ACTIVE', 'PENDING'].includes(c.status)).length;
    const occupancyRate = (activeContracts / contracts.length) * 100;

    // Calcular tendencia basada en contratos recientes vs antiguos
    const midPoint = Math.floor(contracts.length / 2);
    const recentContracts = contracts.slice(0, midPoint).length / (months / 2);
    const olderContracts = contracts.slice(midPoint).length / (months / 2);

    let trend: 'increasing' | 'stable' | 'decreasing' = 'stable';
    const changeRate = (recentContracts - olderContracts) / olderContracts;

    if (changeRate > 0.1) trend = 'increasing';
    else if (changeRate < -0.1) trend = 'decreasing';

    // Calcular confianza basada en cantidad de datos
    const confidence = Math.min(0.9, contracts.length / 50);

    return {
      predictedOccupancy: Math.round(occupancyRate),
      confidence,
      trend
    };
  } catch (error) {
    logger.error('Error prediciendo demanda de mercado', { error, city, commune });

    // Retornar estimación por defecto en caso de error
    return {
      predictedOccupancy: 70,
      confidence: 0.3,
      trend: 'stable' as const
    };
  }
}

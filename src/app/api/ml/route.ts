import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { logger } from '@/lib/logger-edge';
import { handleError } from '@/lib/errors';
import {
  predictPropertyPrice,
  getMarketStatistics,
  predictMarketDemand,
  initializeMLModels
} from '@/lib/ml/predictions';

// Inicializar modelos al cargar
let modelsInitialized = false;
const initializeModels = async () => {
  if (!modelsInitialized) {
    try {
      await initializeMLModels();
      modelsInitialized = true;
      logger.info('Modelos ML inicializados para API');
    } catch (error) {
      logger.error('Error inicializando modelos ML:', { error: error instanceof Error ? error.message : String(error) });
    }
  }
};

// GET /api/ml/predict-price - Predecir precio de propiedad
export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request);
    await initializeModels();

    const { searchParams } = new URL(request.url);

    // Extraer parámetros de la propiedad
    const propertyData = {
      area: parseFloat(searchParams.get('area') || '0'),
      bedrooms: parseInt(searchParams.get('bedrooms') || '0'),
      bathrooms: parseInt(searchParams.get('bathrooms') || '0'),
      city: searchParams.get('city') || '',
      commune: searchParams.get('commune') || '',
      type: searchParams.get('type') || '',
      furnished: searchParams.get('furnished') === 'true',
      petsAllowed: searchParams.get('petsAllowed') === 'true',
      yearBuilt: searchParams.get('yearBuilt') ? parseInt(searchParams.get('yearBuilt')!) : undefined
    };

    // Validar datos requeridos
    if (!propertyData.area || !propertyData.bedrooms || !propertyData.city || !propertyData.type) {
      return NextResponse.json({
        success: false,
        error: 'Datos insuficientes para la predicción. Se requieren: area, bedrooms, city, type'
      }, { status: 400 });
    }

    // Generar predicción
    const prediction = await predictPropertyPrice(propertyData);

    logger.info('Price prediction generated', {
      userId: user.id,
      city: propertyData.city,
      commune: propertyData.commune,
      predictedPrice: prediction.predictedPrice
    });

    return NextResponse.json({
      success: true,
      data: {
        prediction,
        input: propertyData
      }
    });

  } catch (error) {
    logger.error('Error in price prediction API:', { error: error instanceof Error ? error.message : String(error) });
    const errorResponse = handleError(error);
    return errorResponse;
  }
}

// POST /api/ml/market-stats - Obtener estadísticas de mercado
export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(request);
    await initializeModels();

    const body = await request.json();
    const { city, commune } = body;

    const marketStats = await getMarketStatistics(city, commune);

    logger.info('Market statistics requested', {
      userId: user.id,
      city,
      commune,
      statsCount: marketStats.length
    });

    return NextResponse.json({
      success: true,
      data: marketStats
    });

  } catch (error) {
    logger.error('Error in market stats API:', { error: error instanceof Error ? error.message : String(error) });
    const errorResponse = handleError(error);
    return errorResponse;
  }
}

// PUT /api/ml/demand-prediction - Predecir demanda de mercado
export async function PUT(request: NextRequest) {
  try {
    const user = await requireAuth(request);
    await initializeModels();

    const body = await request.json();
    const { city, commune, months = 6 } = body;

    if (!city || !commune) {
      return NextResponse.json({
        success: false,
        error: 'Se requieren city y commune para la predicción de demanda'
      }, { status: 400 });
    }

    const demandPrediction = await predictMarketDemand(city, commune, months);

    logger.info('Demand prediction generated', {
      userId: user.id,
      city,
      commune,
      months,
      predictedOccupancy: demandPrediction.predictedOccupancy
    });

    return NextResponse.json({
      success: true,
      data: {
        ...demandPrediction,
        city,
        commune,
        predictionPeriod: months
      }
    });

  } catch (error) {
    logger.error('Error in demand prediction API:', { error: error instanceof Error ? error.message : String(error) });
    const errorResponse = handleError(error);
    return errorResponse;
  }
}

// PATCH /api/ml/retrain - Reentrenar modelos
export async function PATCH(request: NextRequest) {
  try {
    const user = await requireAuth(request);

    // Solo administradores pueden reentrenar modelos
    if (user.role !== 'ADMIN') {
      return NextResponse.json({
        success: false,
        error: 'Solo administradores pueden reentrenar los modelos'
      }, { status: 403 });
    }

    logger.info('Model retraining initiated', { userId: user.id });

    // Reentrenar modelos
    await initializeMLModels();
    modelsInitialized = true;

    logger.info('Models retrained successfully', { userId: user.id });

    return NextResponse.json({
      success: true,
      message: 'Modelos reentrenados exitosamente',
      data: {
        retrainedAt: new Date().toISOString()
      }
    });

  } catch (error) {
    logger.error('Error retraining models:', error);
    const errorResponse = handleError(error);
    return errorResponse;
  }
}

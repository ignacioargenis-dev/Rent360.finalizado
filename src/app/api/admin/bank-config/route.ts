import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { PaymentConfigService, CHILEAN_BANKS } from '@/lib/payment-config';
import { BankIntegrationFactory } from '@/lib/bank-integrations/bank-integration-factory';
import { logger } from '@/lib/logger';
import { handleError } from '@/lib/errors';

/**
 * GET /api/admin/bank-config
 * Obtiene la configuración de todos los servicios bancarios
 */
export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request);

    if (user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Acceso denegado. Se requieren permisos de administrador.' },
        { status: 403 }
      );
    }

    // Obtener estadísticas generales
    const serviceStats = await PaymentConfigService.getServiceStats();
    const availableBanks = await BankIntegrationFactory.getAvailableBanks();
    const integrationStats = await BankIntegrationFactory.getIntegrationStats();

    return NextResponse.json({
      success: true,
      data: {
        serviceStats,
        availableBanks,
        integrationStats,
        summary: {
          totalServices: serviceStats.total,
          enabledServices: serviceStats.enabled,
          disabledServices: serviceStats.disabled,
          availableBanks: availableBanks.filter(b => b.available).length,
          totalBanks: availableBanks.length
        }
      }
    });

  } catch (error) {
    logger.error('Error obteniendo configuración bancaria:', { error: error instanceof Error ? error.message : String(error) });
    const errorResponse = handleError(error);
    return errorResponse;
  }
}

/**
 * POST /api/admin/bank-config
 * Actualiza la configuración de un servicio bancario
 */
export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(request);

    if (user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Acceso denegado. Se requieren permisos de administrador.' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { serviceId, config, action } = body;

    if (!serviceId) {
      return NextResponse.json(
        { error: 'serviceId es requerido' },
        { status: 400 }
      );
    }

    switch (action) {
      case 'update':
        if (!config) {
          return NextResponse.json(
            { error: 'config es requerido para actualizar' },
            { status: 400 }
          );
        }

        await PaymentConfigService.updateServiceConfig(serviceId, config);
        logger.info('Configuración bancaria actualizada', {
          serviceId,
          adminId: user.id
        });

        return NextResponse.json({
          success: true,
          message: `Configuración de ${serviceId} actualizada exitosamente`
        });

      case 'enable':
        await PaymentConfigService.toggleService(serviceId, true);
        logger.info('Servicio bancario habilitado', {
          serviceId,
          adminId: user.id
        });

        return NextResponse.json({
          success: true,
          message: `Servicio ${serviceId} habilitado`
        });

      case 'disable':
        await PaymentConfigService.toggleService(serviceId, false);
        logger.info('Servicio bancario deshabilitado', {
          serviceId,
          adminId: user.id
        });

        return NextResponse.json({
          success: true,
          message: `Servicio ${serviceId} deshabilitado`
        });

      case 'test':
        const testResult = await PaymentConfigService.testServiceConnection(serviceId);
        logger.info('Prueba de conexión bancaria realizada', {
          serviceId,
          success: testResult.success,
          adminId: user.id
        });

        return NextResponse.json({
          success: true,
          data: testResult
        });

      case 'initialize_defaults':
        await PaymentConfigService.initializeDefaultConfigs();
        logger.info('Configuraciones por defecto inicializadas', {
          adminId: user.id
        });

        return NextResponse.json({
          success: true,
          message: 'Configuraciones por defecto inicializadas'
        });

      default:
        return NextResponse.json(
          { error: 'Acción no válida. Use: update, enable, disable, test, initialize_defaults' },
          { status: 400 }
        );
    }

  } catch (error) {
    logger.error('Error en operación de configuración bancaria:', { error: error instanceof Error ? error.message : String(error) });
    const errorResponse = handleError(error);
    return errorResponse;
  }
}

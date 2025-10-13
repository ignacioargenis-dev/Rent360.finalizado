import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { db } from '@/lib/db';
import { logger } from '@/lib/logger-minimal';
import { handleApiError } from '@/lib/api-error-handler';

/**
 * GET /api/user/payment-methods
 * Obtiene métodos de pago del usuario
 */
export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request);

    // En producción, consultar tabla payment_methods
    // Por ahora, retornar métodos simulados
    const paymentMethods = [
      {
        id: 'pm_1',
        type: 'bank_account',
        isDefault: true,
        isVerified: true,
        details: {
          bankName: 'Banco Estado',
          accountNumber: '****5678',
          accountHolder: user.name
        },
        createdAt: '2024-01-01T00:00:00Z'
      },
      {
        id: 'pm_2',
        type: 'paypal',
        isDefault: false,
        isVerified: true,
        details: {
          paypalEmail: user.email
        },
        createdAt: '2024-01-15T00:00:00Z'
      }
    ];

    return NextResponse.json({
      success: true,
      data: paymentMethods
    });

  } catch (error) {
    logger.error('Error obteniendo métodos de pago:', { error });
    const errorResponse = handleApiError(error);
    return errorResponse;
  }
}

/**
 * POST /api/user/payment-methods
 * Agrega un nuevo método de pago
 */
export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(request);
    const body = await request.json();

    const {
      type,
      details,
      setAsDefault = false
    } = body;

    // Validar datos requeridos
    if (!type || !details) {
      return NextResponse.json(
        { error: 'Tipo y detalles del método de pago son requeridos' },
        { status: 400 }
      );
    }

    // Aquí iría la validación y guardado real en BD
    logger.info('Nuevo método de pago agregado', {
      userId: user.id,
      type,
      setAsDefault
    });

    const newPaymentMethod = {
      id: `pm_${Date.now()}`,
      userId: user.id,
      type,
      isDefault: setAsDefault,
      isVerified: false, // Requiere verificación
      details,
      createdAt: new Date().toISOString()
    };

    return NextResponse.json({
      success: true,
      data: newPaymentMethod,
      message: 'Método de pago agregado exitosamente. Requiere verificación antes de usar.'
    });

  } catch (error) {
    logger.error('Error agregando método de pago:', { error });
    const errorResponse = handleApiError(error);
    return errorResponse;
  }
}

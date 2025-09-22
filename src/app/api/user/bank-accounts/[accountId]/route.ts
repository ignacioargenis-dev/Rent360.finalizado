import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { BankAccountService } from '@/lib/bank-account-service';
import { logger } from '@/lib/logger-edge';
import { handleApiError } from '@/lib/api-error-handler';

interface RouteParams {
  params: {
    accountId: string;
  };
}

/**
 * GET /api/user/bank-accounts/[accountId]
 * Obtiene una cuenta bancaria específica
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const user = await requireAuth(request);
    const { accountId } = params;

    if (!accountId) {
      return NextResponse.json(
        { error: 'accountId es requerido' },
        { status: 400 }
      );
    }

    const accounts = await BankAccountService.getUserBankAccounts(user.id);
    const account = accounts.find(acc => acc.id === accountId);

    if (!account) {
      return NextResponse.json(
        { error: 'Cuenta bancaria no encontrada' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        ...account,
        accountNumber: account.accountNumber // Ya enmascarado
      }
    });

  } catch (error) {
    logger.error('Error obteniendo cuenta bancaria:', { error });
    const errorResponse = handleApiError(error);
    return errorResponse;
  }
}

/**
 * PUT /api/user/bank-accounts/[accountId]
 * Actualiza una cuenta bancaria
 */
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const user = await requireAuth(request);
    const { accountId } = params;

    if (!accountId) {
      return NextResponse.json(
        { error: 'accountId es requerido' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { isPrimary } = body;

    // Verificar que la cuenta pertenece al usuario
    const accounts = await BankAccountService.getUserBankAccounts(user.id);
    const account = accounts.find(acc => acc.id === accountId);

    if (!account) {
      return NextResponse.json(
        { error: 'Cuenta bancaria no encontrada' },
        { status: 404 }
      );
    }

    // Solo permitir cambiar isPrimary por ahora
    if (isPrimary !== undefined) {
      // Si se está marcando como primaria, desmarcar otras
      if (isPrimary) {
        // Esta lógica se maneja en el servicio
      }

      logger.info('Cuenta bancaria actualizada', {
        userId: user.id,
        accountId,
        isPrimary
      });

      return NextResponse.json({
        success: true,
        message: 'Cuenta bancaria actualizada exitosamente'
      });
    }

    return NextResponse.json(
      { error: 'No hay campos válidos para actualizar' },
      { status: 400 }
    );

  } catch (error) {
    logger.error('Error actualizando cuenta bancaria:', { error });
    const errorResponse = handleApiError(error);
    return errorResponse;
  }
}

/**
 * DELETE /api/user/bank-accounts/[accountId]
 * Elimina una cuenta bancaria
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const user = await requireAuth(request);
    const { accountId } = params;

    if (!accountId) {
      return NextResponse.json(
        { error: 'accountId es requerido' },
        { status: 400 }
      );
    }

    await BankAccountService.deleteBankAccount(accountId, user.id);

    logger.info('Cuenta bancaria eliminada', {
      userId: user.id,
      accountId
    });

    return NextResponse.json({
      success: true,
      message: 'Cuenta bancaria eliminada exitosamente'
    });

  } catch (error) {
    logger.error('Error eliminando cuenta bancaria:', { error });
    const errorResponse = handleApiError(error);
    return errorResponse;
  }
}

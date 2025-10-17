import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { BankAccountService } from '@/lib/bank-account-service';
import { logger } from '@/lib/logger-minimal';
import { handleApiError } from '@/lib/api-error-handler';

/**
 * DELETE /api/user/bank-accounts/[id]
 * Elimina una cuenta bancaria del usuario
 */
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await requireAuth(request);
    const accountId = params.id;

    if (!accountId) {
      return NextResponse.json({ error: 'ID de cuenta bancaria requerido' }, { status: 400 });
    }

    // Verificar que la cuenta pertenece al usuario
    const accounts = await BankAccountService.getUserBankAccounts(user.id);
    const account = accounts.find(acc => acc.id === accountId);

    if (!account) {
      return NextResponse.json({ error: 'Cuenta bancaria no encontrada' }, { status: 404 });
    }

    // Eliminar la cuenta bancaria
    await BankAccountService.deleteBankAccount(accountId, user.id);

    logger.info('Cuenta bancaria eliminada', {
      userId: user.id,
      accountId,
      bankCode: account.bankCode,
    });

    return NextResponse.json({
      success: true,
      message: 'Cuenta bancaria eliminada exitosamente',
    });
  } catch (error) {
    logger.error('Error eliminando cuenta bancaria:', { error });
    const errorResponse = handleApiError(error);
    return errorResponse;
  }
}

/**
 * PUT /api/user/bank-accounts/[id]
 * Actualiza una cuenta bancaria del usuario
 */
export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await requireAuth(request);
    const accountId = params.id;
    const body = await request.json();

    if (!accountId) {
      return NextResponse.json({ error: 'ID de cuenta bancaria requerido' }, { status: 400 });
    }

    // Verificar que la cuenta pertenece al usuario
    const accounts = await BankAccountService.getUserBankAccounts(user.id);
    const account = accounts.find(acc => acc.id === accountId);

    if (!account) {
      return NextResponse.json({ error: 'Cuenta bancaria no encontrada' }, { status: 404 });
    }

    const {
      bankCode,
      accountType,
      accountNumber,
      accountHolder,
      rut,
      branchCode,
      isPrimary = false,
    } = body;

    // Validar campos requeridos
    if (!bankCode || !accountType || !accountNumber || !accountHolder) {
      return NextResponse.json(
        { error: 'Campos requeridos: bankCode, accountType, accountNumber, accountHolder' },
        { status: 400 }
      );
    }

    // Actualizar la cuenta bancaria
    const updatedAccount = await BankAccountService.updateBankAccount(accountId, {
      bankCode,
      accountType,
      accountNumber,
      accountHolder,
      rut,
      branchCode,
      isPrimary,
    });

    logger.info('Cuenta bancaria actualizada', {
      userId: user.id,
      accountId,
      bankCode,
      accountType,
      isPrimary,
    });

    return NextResponse.json({
      success: true,
      data: {
        ...updatedAccount,
        accountNumber: updatedAccount.accountNumber, // Ya enmascarado
      },
      message: 'Cuenta bancaria actualizada exitosamente',
    });
  } catch (error) {
    logger.error('Error actualizando cuenta bancaria:', { error });
    const errorResponse = handleApiError(error);
    return errorResponse;
  }
}

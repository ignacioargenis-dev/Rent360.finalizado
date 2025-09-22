import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { BankAccountService } from '@/lib/bank-account-service';
import { logger } from '@/lib/logger';
import { handleError } from '@/lib/errors';

/**
 * GET /api/user/bank-accounts
 * Obtiene las cuentas bancarias del usuario
 */
export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request);

    const accounts = await BankAccountService.getUserBankAccounts(user.id);

    return NextResponse.json({
      success: true,
      data: accounts.map(account => ({
        ...account,
        // Enmascarar datos sensibles en la respuesta
        accountNumber: account.accountNumber // Ya viene enmascarado del servicio
      }))
    });

  } catch (error) {
    logger.error('Error obteniendo cuentas bancarias:', error);
    const errorResponse = handleError(error);
    return errorResponse;
  }
}

/**
 * POST /api/user/bank-accounts
 * Registra una nueva cuenta bancaria
 */
export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(request);
    const body = await request.json();

    const {
      bankCode,
      accountType,
      accountNumber,
      accountHolder,
      rut,
      branchCode,
      isPrimary = false
    } = body;

    // Validar campos requeridos
    if (!bankCode || !accountType || !accountNumber || !accountHolder) {
      return NextResponse.json(
        { error: 'Campos requeridos: bankCode, accountType, accountNumber, accountHolder' },
        { status: 400 }
      );
    }

    const bankAccount = await BankAccountService.registerBankAccount(user.id, {
      bankCode,
      accountType,
      accountNumber,
      accountHolder,
      rut,
      branchCode,
      isPrimary
    });

    logger.info('Cuenta bancaria registrada', {
      userId: user.id,
      bankCode,
      accountType,
      isPrimary
    });

    return NextResponse.json({
      success: true,
      data: {
        ...bankAccount,
        accountNumber: bankAccount.accountNumber // Ya enmascarado
      },
      message: 'Cuenta bancaria registrada exitosamente. Se iniciará el proceso de verificación.'
    });

  } catch (error) {
    logger.error('Error registrando cuenta bancaria:', error);
    const errorResponse = handleError(error);
    return errorResponse;
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { BankAccountService } from '@/lib/bank-account-service';
import { logger } from '@/lib/logger-edge';
import { handleError } from '@/lib/errors';

/**
 * GET /api/runner/bank-account
 * Obtiene la cuenta bancaria del runner actual
 */
export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request);

    if (user.role !== 'runner') {
      return NextResponse.json(
        { error: 'Acceso denegado. Solo para runners.' },
        { status: 403 }
      );
    }

    const accounts = await BankAccountService.getUserBankAccounts(user.id);
    const primaryAccount = accounts.find(account => account.isPrimary) || accounts[0];

    return NextResponse.json({
      success: true,
      data: primaryAccount ? {
        ...primaryAccount,
        accountNumber: primaryAccount.accountNumber // Ya viene enmascarado
      } : null
    });

  } catch (error) {
    logger.error('Error obteniendo cuenta bancaria del runner:', error);
    const errorResponse = handleError(error);
    return errorResponse;
  }
}

/**
 * POST /api/runner/bank-account
 * Registra o actualiza la cuenta bancaria del runner
 */
export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(request);

    if (user.role !== 'runner') {
      return NextResponse.json(
        { error: 'Acceso denegado. Solo para runners.' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const {
      bankCode,
      accountType,
      accountNumber,
      accountHolder,
      rut,
      branchCode,
      isPrimary = true
    } = body;

    // Validar campos requeridos
    if (!bankCode || !accountType || !accountNumber || !accountHolder || !rut) {
      return NextResponse.json(
        {
          error: 'Campos requeridos: bankCode, accountType, accountNumber, accountHolder, rut',
          missingFields: []
        },
        { status: 400 }
      );
    }

    // Verificar formato de RUT chileno
    if (!BankAccountService.validateRut(rut)) {
      return NextResponse.json(
        { error: 'Formato de RUT inválido' },
        { status: 400 }
      );
    }

    // Obtener nombre del banco
    const bankName = BankAccountService.getBankNameByCode(bankCode);
    if (!bankName) {
      return NextResponse.json(
        { error: 'Código de banco inválido' },
        { status: 400 }
      );
    }

    // Registrar cuenta bancaria
    const bankAccount = await BankAccountService.registerBankAccount(user.id, {
      bankCode,
      accountType,
      accountNumber,
      accountHolder,
      rut,
      branchCode,
      isPrimary
    });

    logger.info('Cuenta bancaria del runner actualizada', {
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
    logger.error('Error registrando cuenta bancaria del runner:', error);
    const errorResponse = handleError(error);
    return errorResponse;
  }
}

/**
 * PUT /api/runner/bank-account
 * Actualiza la información de la cuenta bancaria
 */
export async function PUT(request: NextRequest) {
  try {
    const user = await requireAuth(request);

    if (user.role !== 'runner') {
      return NextResponse.json(
        { error: 'Acceso denegado. Solo para runners.' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const updates = body;

    // Obtener cuenta bancaria actual
    const accounts = await BankAccountService.getUserBankAccounts(user.id);
    const primaryAccount = accounts.find(account => account.isPrimary) || accounts[0];

    if (!primaryAccount) {
      return NextResponse.json(
        { error: 'No se encontró cuenta bancaria para actualizar' },
        { status: 404 }
      );
    }

    // Actualizar cuenta bancaria
    const updatedAccount = await BankAccountService.updateBankAccount(
      primaryAccount.id,
      updates
    );

    logger.info('Cuenta bancaria del runner actualizada', {
      userId: user.id,
      accountId: primaryAccount.id,
      updates: Object.keys(updates)
    });

    return NextResponse.json({
      success: true,
      data: {
        ...updatedAccount,
        accountNumber: updatedAccount.accountNumber // Ya enmascarado
      },
      message: 'Cuenta bancaria actualizada exitosamente'
    });

  } catch (error) {
    logger.error('Error actualizando cuenta bancaria del runner:', error);
    const errorResponse = handleError(error);
    return errorResponse;
  }
}

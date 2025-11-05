import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { db } from '@/lib/db';
import { BankAccountService } from '@/lib/bank-account-service';
import { logger } from '@/lib/logger-minimal';
import { handleApiError } from '@/lib/api-error-handler';

/**
 * GET /api/runner/bank-account
 * Obtiene la cuenta bancaria del runner actual
 */
export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request);

    if (user.role !== 'RUNNER') {
      return NextResponse.json({ error: 'Acceso denegado. Solo para runners.' }, { status: 403 });
    }

    // Buscar cuenta bancaria directamente desde la BD
    const bankAccount = await db.bankAccount.findFirst({
      where: {
        userId: user.id,
        isPrimary: true,
      },
    });

    if (!bankAccount) {
      // Si no hay cuenta primaria, buscar cualquier cuenta
      const anyAccount = await db.bankAccount.findFirst({
        where: {
          userId: user.id,
        },
      });

      if (!anyAccount) {
        return NextResponse.json({
          success: true,
          data: null,
        });
      }

      return NextResponse.json({
        success: true,
        data: {
          id: anyAccount.id,
          bankName: anyAccount.bank,
          bank: anyAccount.bank,
          accountType: anyAccount.accountType === 'CHECKING' ? 'checking' : 'savings',
          accountNumber: anyAccount.accountNumber,
          holderName: anyAccount.holderName || '',
          rut: anyAccount.rut || '',
        },
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        id: bankAccount.id,
        bankName: bankAccount.bank,
        bank: bankAccount.bank,
        accountType: bankAccount.accountType === 'CHECKING' ? 'checking' : 'savings',
        accountNumber: bankAccount.accountNumber,
        holderName: bankAccount.holderName || '',
        rut: bankAccount.rut || '',
      },
    });
  } catch (error) {
    logger.error('Error obteniendo cuenta bancaria del runner:', { error });
    const errorResponse = handleApiError(error);
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

    if (user.role !== 'RUNNER') {
      return NextResponse.json({ error: 'Acceso denegado. Solo para runners.' }, { status: 403 });
    }

    const body = await request.json();
    const {
      bankCode,
      accountType,
      accountNumber,
      accountHolder,
      rut,
      branchCode,
      isPrimary = true,
    } = body;

    // Validar campos requeridos
    if (!bankCode || !accountType || !accountNumber || !accountHolder || !rut) {
      return NextResponse.json(
        {
          error: 'Campos requeridos: bankCode, accountType, accountNumber, accountHolder, rut',
          missingFields: [],
        },
        { status: 400 }
      );
    }

    // Verificar formato de RUT chileno
    if (!BankAccountService.validateRut(rut)) {
      return NextResponse.json({ error: 'Formato de RUT inválido' }, { status: 400 });
    }

    // Obtener nombre del banco
    const bankName = BankAccountService.getBankNameByCode(bankCode);
    if (!bankName) {
      return NextResponse.json({ error: 'Código de banco inválido' }, { status: 400 });
    }

    // Registrar cuenta bancaria
    const bankAccount = await BankAccountService.registerBankAccount(user.id, {
      bankCode,
      accountType,
      accountNumber,
      accountHolder,
      rut,
      branchCode,
      isPrimary,
    });

    logger.info('Cuenta bancaria del runner actualizada', {
      userId: user.id,
      bankCode,
      accountType,
      isPrimary,
    });

    return NextResponse.json({
      success: true,
      data: {
        ...bankAccount,
        accountNumber: bankAccount.accountNumber, // Ya enmascarado
      },
      message: 'Cuenta bancaria registrada exitosamente. Se iniciará el proceso de verificación.',
    });
  } catch (error) {
    logger.error('Error registrando cuenta bancaria del runner:', { error });
    const errorResponse = handleApiError(error);
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

    if (user.role !== 'RUNNER') {
      return NextResponse.json({ error: 'Acceso denegado. Solo para runners.' }, { status: 403 });
    }

    const body = await request.json();
    const { bank, accountType, accountNumber, holderName, rut } = body;

    // Validación básica
    if (!bank || !accountNumber) {
      return NextResponse.json(
        { error: 'Faltan campos requeridos: banco y número de cuenta' },
        { status: 400 }
      );
    }

    // Mapear accountType a formato del schema
    let mappedAccountType = 'CHECKING';
    if (accountType === 'savings' || accountType === 'SAVINGS' || accountType === 'Cuenta Ahorro') {
      mappedAccountType = 'SAVINGS';
    }

    // Buscar cuenta bancaria existente
    const existingAccount = await db.bankAccount.findFirst({
      where: {
        userId: user.id,
      },
    });

    if (existingAccount) {
      // Verificar si hay otras cuentas primarias
      const otherPrimaryAccounts = await db.bankAccount.count({
        where: {
          userId: user.id,
          isPrimary: true,
          id: { not: existingAccount.id },
        },
      });

      // Actualizar cuenta existente
      const updatedAccount = await db.bankAccount.update({
        where: { id: existingAccount.id },
        data: {
          bank: bank,
          accountType: mappedAccountType,
          accountNumber: accountNumber,
          ...(holderName && { holderName }),
          ...(rut && { rut }),
          // Si no hay otras cuentas primarias, marcar esta como primaria
          isPrimary: otherPrimaryAccounts === 0 ? true : existingAccount.isPrimary,
          // Mantener isVerified (no se cambia automáticamente, requiere verificación manual)
        },
      });

      logger.info('Cuenta bancaria del runner actualizada', {
        userId: user.id,
        accountId: updatedAccount.id,
      });

      return NextResponse.json({
        success: true,
        data: {
          id: updatedAccount.id,
          bankName: updatedAccount.bank,
          accountType: updatedAccount.accountType === 'CHECKING' ? 'checking' : 'savings',
          accountNumber: updatedAccount.accountNumber,
          holderName: updatedAccount.holderName || '',
          rut: updatedAccount.rut || '',
        },
        message: 'Cuenta bancaria actualizada exitosamente',
      });
    } else {
      // Verificar si el usuario ya tiene otras cuentas bancarias
      const existingAccountsCount = await db.bankAccount.count({
        where: { userId: user.id },
      });

      // Crear nueva cuenta bancaria
      const newAccount = await db.bankAccount.create({
        data: {
          userId: user.id,
          bank: bank,
          accountType: mappedAccountType,
          accountNumber: accountNumber,
          holderName: holderName || user.name || 'Sin titular',
          rut: rut || '',
          isPrimary: existingAccountsCount === 0, // Primera cuenta = primaria
          isVerified: false, // Requiere verificación manual por admin
        },
      });

      logger.info('Cuenta bancaria del runner creada', {
        userId: user.id,
        accountId: newAccount.id,
      });

      return NextResponse.json({
        success: true,
        data: {
          id: newAccount.id,
          bankName: newAccount.bank,
          accountType: newAccount.accountType === 'CHECKING' ? 'checking' : 'savings',
          accountNumber: newAccount.accountNumber,
          holderName: newAccount.holderName || '',
          rut: newAccount.rut || '',
        },
        message: 'Cuenta bancaria creada exitosamente',
      });
    }
  } catch (error) {
    logger.error('Error actualizando cuenta bancaria del runner:', { error });
    const errorResponse = handleApiError(error);
    return errorResponse;
  }
}

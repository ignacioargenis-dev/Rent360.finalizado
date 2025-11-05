import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { db } from '@/lib/db';
import { logger } from '@/lib/logger-minimal';

export const dynamic = 'force-dynamic';

/**
 * GET /api/broker/bank-account
 * Obtiene la configuración bancaria del corredor autenticado
 */
export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request);

    if (user.role !== 'BROKER') {
      return NextResponse.json(
        { error: 'Acceso denegado. Se requieren permisos de corredor.' },
        { status: 403 }
      );
    }

    // Buscar cuenta bancaria asociada al usuario
    const bankAccount = await db.bankAccount.findFirst({
      where: {
        userId: user.id,
      },
    });

    if (!bankAccount) {
      return NextResponse.json({
        success: true,
        bankAccount: null,
      });
    }

    // Retornar datos bancarios (sin información sensible completa)
    return NextResponse.json({
      success: true,
      bankAccount: {
        id: bankAccount.id,
        bankName: bankAccount.bank,
        accountType: bankAccount.accountType === 'CHECKING' ? 'checking' : 'savings',
        accountNumber: bankAccount.accountNumber,
        accountHolderName: bankAccount.holderName || '',
        rut: bankAccount.rut || '',
      },
    });
  } catch (error) {
    logger.error('Error obteniendo cuenta bancaria del corredor', { error });
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Error interno del servidor',
      },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/broker/bank-account
 * Actualiza o crea la configuración bancaria del corredor autenticado
 */
export async function PUT(request: NextRequest) {
  try {
    const user = await requireAuth(request);

    if (user.role !== 'BROKER') {
      return NextResponse.json(
        { error: 'Acceso denegado. Se requieren permisos de corredor.' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { bankName, accountType, accountNumber, accountHolderName, rut } = body;

    // Validación básica
    if (!bankName || !accountNumber || !accountHolderName || !rut) {
      return NextResponse.json(
        { error: 'Faltan campos requeridos: banco, número de cuenta, titular y RUT' },
        { status: 400 }
      );
    }

    // Validar formato de RUT chileno básico
    const rutRegex = /^\d{1,2}\.\d{3}\.\d{3}-[\dkK]$/;
    if (!rutRegex.test(rut)) {
      return NextResponse.json(
        { error: 'Formato de RUT inválido. Debe ser: 12.345.678-9' },
        { status: 400 }
      );
    }

    // Mapear accountType a formato del schema
    let mappedAccountType = 'CHECKING';
    if (accountType === 'Cuenta Ahorro' || accountType === 'savings') {
      mappedAccountType = 'SAVINGS';
    } else if (accountType === 'Cuenta Vista') {
      mappedAccountType = 'CHECKING';
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
          bank: bankName,
          accountType: mappedAccountType,
          accountNumber: accountNumber,
          holderName: accountHolderName,
          rut: rut,
          // Si no hay otras cuentas primarias, marcar esta como primaria
          isPrimary: otherPrimaryAccounts === 0 ? true : existingAccount.isPrimary,
          // Mantener isVerified (no se cambia automáticamente, requiere verificación manual)
        },
      });

      logger.info('Cuenta bancaria del corredor actualizada', {
        userId: user.id,
        bankAccountId: updatedAccount.id,
      });

      return NextResponse.json({
        success: true,
        message: 'Configuración bancaria actualizada exitosamente',
        bankAccount: {
          id: updatedAccount.id,
          bankName: updatedAccount.bank,
          accountType: updatedAccount.accountType === 'CHECKING' ? 'checking' : 'savings',
          accountNumber: updatedAccount.accountNumber,
          accountHolderName: updatedAccount.holderName || '',
          rut: updatedAccount.rut || '',
        },
      });
    } else {
      // Verificar si el usuario ya tiene otras cuentas bancarias
      const existingAccountsCount = await db.bankAccount.count({
        where: { userId: user.id },
      });

      // Crear nueva cuenta bancaria
      // Si es la primera cuenta, marcarla como primaria
      const newAccount = await db.bankAccount.create({
        data: {
          userId: user.id,
          bank: bankName,
          accountType: mappedAccountType,
          accountNumber: accountNumber,
          holderName: accountHolderName,
          rut: rut,
          isPrimary: existingAccountsCount === 0, // Primera cuenta = primaria
          isVerified: false, // Requiere verificación manual por admin
        },
      });

      logger.info('Cuenta bancaria del corredor creada', {
        userId: user.id,
        bankAccountId: newAccount.id,
      });

      return NextResponse.json({
        success: true,
        message: 'Configuración bancaria guardada exitosamente',
        bankAccount: {
          id: newAccount.id,
          bankName: newAccount.bank,
          accountType: newAccount.accountType === 'CHECKING' ? 'checking' : 'savings',
          accountNumber: newAccount.accountNumber,
          accountHolderName: newAccount.holderName || '',
          rut: newAccount.rut || '',
        },
      });
    }
  } catch (error) {
    logger.error('Error guardando cuenta bancaria del corredor', { error });
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Error interno del servidor',
      },
      { status: 500 }
    );
  }
}
